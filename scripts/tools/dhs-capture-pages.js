// CDP capture for the DHS Trusted Tester practice-exam pages
// (refs/DHS-Trusted-Tester-examples/, gitignored — third-party reference material).
//
// The claude-in-chrome browser extension's download mechanism (click-to-download,
// `.download` attribute, blob URLs, Cmd+S) turned out unreliable for binary assets on
// these pages: some succeeded, some silently no-op'd, none reproduced consistently. This
// script instead drives a real Chrome via Puppeteer/CDP and saves every observed network
// response's bytes directly, which isn't subject to that limitation.
//
// Usage:
//   1. `node scripts/tools/dhs-capture-pages.js` — opens a visible, isolated Chrome
//      profile and navigates to the login page. Log in manually in that window.
//   2. Once logged in, create the signal file it's waiting on (path printed to stdout),
//      e.g. `touch refs/DHS-Trusted-Tester-examples/_capture-work/login-ready.signal`.
//   3. It then reads refs/DHS-Trusted-Tester-examples/_captured-pages/INDEX.json,
//      dedupes to unique exam-page URLs, and for each one saves the live HTML (every
//      same-origin frame) plus every same-origin stylesheet/script/image/media/font
//      response into _captured-pages/<id>/, mirroring each asset's path relative to the
//      Moodle `mod_resource/content/<n>/` root so in-page relative links keep working.
//      Cross-origin assets (CDN fonts/libs) are left as live absolute URLs.
//
// Idempotent/additive: re-running only overwrites files it re-fetches; it never deletes.

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const REPO_ROOT = path.join(__dirname, '..', '..');
const DHS_ROOT = path.join(REPO_ROOT, 'refs', 'DHS-Trusted-Tester-examples');
const CAPTURED_ROOT = path.join(DHS_ROOT, '_captured-pages');
const INDEX_FILE = path.join(CAPTURED_ROOT, 'INDEX.json');

// scratch/working files for a capture run -- under refs/, which is gitignored wholesale,
// so none of this needs its own ignore entry.
const WORK_DIR = path.join(DHS_ROOT, '_capture-work');
const PROFILE_DIR = path.join(WORK_DIR, 'chrome-profile');
const READY_SIGNAL = path.join(WORK_DIR, 'login-ready.signal');
const SUMMARY_FILE = path.join(WORK_DIR, 'capture_summary.json');
const LOGIN_URL = 'https://training.section508testing.net/login/index.php';

// capture every same-origin subresource type; cross-origin CDN assets
// (jquery/bootstrap/fonts.cdnfonts.com/etc) are left as live absolute URLs,
// matching how browsers' own "save page complete" treats third-party CDNs.
const ASSET_TYPES = new Set(['stylesheet', 'script', 'image', 'media', 'font', 'other']);

// resolve paths relative to the Moodle resource's content root
// (.../mod_resource/content/<n>/), not the specific page's own directory --
// that root is the true self-contained boundary for a given resource id,
// so sibling directories like pages/, images/, js/ all resolve correctly
// regardless of which file within the resource is the "entry point".
function contentRoot(u) {
  const m = decodeURIComponent(u.pathname).match(/^(.*\/mod_resource\/content\/\d+\/)/);
  return m ? m[1] : path.posix.dirname(decodeURIComponent(u.pathname)) + '/';
}

function relDestPath(pageUrl, assetUrl) {
  const pu = new URL(pageUrl);
  const au = new URL(assetUrl);
  if (pu.origin !== au.origin) return null; // cross-origin, don't mirror
  const root = contentRoot(pu);
  const assetPath = decodeURIComponent(au.pathname);
  if (!assetPath.startsWith(root)) return null; // belongs to a different resource id, skip
  return assetPath.slice(root.length) || 'index.html';
}

function log(...args) {
  console.log(new Date().toISOString(), ...args);
}

function loadUniqueUrls() {
  const index = JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
  const seen = new Map(); // url -> id
  for (const rec of index) {
    if (!rec.exam_page_url || seen.has(rec.exam_page_url)) continue;
    const id = path.posix.dirname(rec.captured_page.replace(/^_captured-pages\//, ''));
    seen.set(rec.exam_page_url, id);
  }
  return Array.from(seen, ([url, id]) => ({ url, id }));
}

async function waitForSignal() {
  log('Waiting for login-ready signal at', READY_SIGNAL, ' -- create this file once logged in.');
  while (!fs.existsSync(READY_SIGNAL)) {
    await new Promise((r) => setTimeout(r, 2000));
  }
  log('Signal found, proceeding to capture phase.');
}

async function main() {
  fs.mkdirSync(PROFILE_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: PROFILE_DIR,
    defaultViewport: { width: 1400, height: 1000 },
    args: ['--window-size=1440,1040'],
  });

  const [page] = await browser.pages();
  page.setDefaultNavigationTimeout(30000);

  await page.goto(LOGIN_URL, { waitUntil: 'networkidle2' }).catch((e) => log('login nav warn', e.message));
  log('Browser window open. Please log in manually in the visible window, then create the signal file.');

  await waitForSignal();

  const urls = loadUniqueUrls();
  const summary = [];

  for (const { url, id } of urls) {
    log('capturing', id, url);
    const destDir = path.join(CAPTURED_ROOT, id);
    fs.mkdirSync(destDir, { recursive: true });
    const entry = { id, url, status: 'ok', assetsSaved: [], notes: '' };

    const onResponse = async (response) => {
      try {
        const req = response.request();
        const rurl = req.url();
        if (!rurl.startsWith('http')) return;
        const status = response.status();
        if (status < 200 || status >= 300) return;
        const rtype = req.resourceType();
        if (!ASSET_TYPES.has(rtype)) return;
        const rel = relDestPath(url, rurl);
        if (!rel) return; // cross-origin or outside this resource's content root
        const dest = path.join(destDir, rel);
        const buf = await response.buffer().catch(() => null);
        if (!buf) return;
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, buf);
        entry.assetsSaved.push(rel);
      } catch (e) {
        entry.notes += `asset save error: ${e.message}; `;
      }
    };

    page.on('response', onResponse);
    try {
      await page.goto(url, { waitUntil: 'networkidle2' });
      await new Promise((r) => setTimeout(r, 800)); // let any deferred loads settle

      // authoritative HTML capture straight off CDP, for every same-origin frame, using
      // the same content-root-relative naming as everything else so in-page relative
      // links between frame documents keep working.
      const frames = page.frames();
      entry.frameCount = frames.length;
      let frameIdx = 0;
      for (const frame of frames) {
        const furl = frame.url();
        if (!furl.startsWith('http')) continue;
        try {
          const html = await frame.content();
          const isTop = frame === page.mainFrame();
          const rel = isTop ? 'index.html' : (relDestPath(url, furl) || `frame_child_${++frameIdx}.html`);
          const dest = path.join(destDir, rel);
          fs.mkdirSync(path.dirname(dest), { recursive: true });
          fs.writeFileSync(dest, html);
          entry.assetsSaved.push(rel + ' (html)');
        } catch (e) {
          entry.notes += `frame ${furl} content() failed: ${e.message}; `;
        }
      }
    } catch (e) {
      entry.status = 'error';
      entry.notes += e.message;
      log('ERROR on', id, e.message);
    }
    page.off('response', onResponse);

    summary.push(entry);
    fs.writeFileSync(SUMMARY_FILE, JSON.stringify(summary, null, 2));
    log(' ->', entry.assetsSaved.length, 'assets saved:', entry.assetsSaved.join(', '));
  }

  log('Done. Summary written to', SUMMARY_FILE);
  await browser.close();
}

main().catch((e) => {
  console.error('FATAL', e);
  process.exit(1);
});
