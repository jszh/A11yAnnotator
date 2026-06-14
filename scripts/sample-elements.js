#!/usr/bin/env node
//
// Stratified random sample of accessibility-focusable UI elements per page.
//
// Candidate rule: not hidden, not a whole-page container, AT-focusable
// (tab-order focusable OR has an interactive ARIA role even if tabindex=-1).
// Stratified by landmark (banner/navigation/main/contentinfo/complementary/
// form/search/region/default). Seeded RNG → reproducible samples.
//
// Usage:
//   node server.js                                   # in another terminal
//   node scripts/sample-elements.js                  # all pages, default opts
//   node scripts/sample-elements.js --per-region 5 --seed 7 --out samples.json
//   node scripts/sample-elements.js --group "Description 1"
//   node scripts/sample-elements.js --name D1_L0_Cl_EC_index

const fs   = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const ROOT       = path.resolve(__dirname, '..');
const PAGES_PATH = path.join(ROOT, 'assets', 'pages.json');
const DEFAULT_OUT = path.join(ROOT, 'assets', 'samples.json');
const SERVER_URL = 'http://127.0.0.1:3001';

function arg(name, dflt) {
  const i = process.argv.indexOf('--' + name);
  return i > 0 && i + 1 < process.argv.length ? process.argv[i + 1] : dflt;
}
const N_PER_REGION = parseInt(arg('per-region', '3'), 10);
const N_PER_PAGE   = arg('per-page', null) !== null ? parseInt(arg('per-page'), 10) : null;
const SEED         = parseInt(arg('seed', '42'), 10);
const OUT          = arg('out', DEFAULT_OUT);
const ONLY_GROUP   = arg('group', null);
const ONLY_NAME    = arg('name', null);
const ONLY_FILE    = arg('file', null);
const NAV_TIMEOUT  = parseInt(arg('timeout', '30000'), 10);
const RENDER_WAIT  = parseInt(arg('render-wait', '500'), 10);
const CONCURRENCY  = parseInt(arg('concurrency', '1'), 10);
const AT_RATIO     = parseFloat(arg('at-ratio', '0.7'));
const RETRY_FROM   = arg('retry-from', null);
const FALLBACK_HANG = process.argv.includes('--fallback-hang');
const ALLOW_OFFSITE = process.argv.includes('--allow-offsite');
const DIRECT        = process.argv.includes('--direct'); // bypass annotator UI (legacy)

// mulberry32 — seeded so identical inputs yield identical samples
function makeRng(seed) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6D2B79F5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
function sampleFrom(arr, n, rand) {
  const pool = arr.slice();
  const out  = [];
  while (pool.length && out.length < n) {
    const i = Math.floor(rand() * pool.length);
    out.push(pool.splice(i, 1)[0]);
  }
  return out;
}

// Stratified pick with a TOTAL budget across regions: each round, every
// non-empty region gets one pick (region order randomized per round) until
// budget exhausted. Keeps regions balanced when small; degrades to "pick
// everything" when budget exceeds candidate count.
function pickStratifiedTotal(groups, totalBudget, rand) {
  const out = {};
  for (const r of Object.keys(groups)) out[r] = [];
  let remaining = totalBudget;
  while (remaining > 0) {
    const order = Object.keys(groups)
      .filter(r => groups[r].length > 0)
      .sort(() => rand() - 0.5);
    if (!order.length) break;
    for (const r of order) {
      if (remaining === 0) break;
      const pool = groups[r];
      const i = Math.floor(rand() * pool.length);
      out[r].push(pool.splice(i, 1)[0]);
      remaining--;
    }
  }
  // Drop empty regions from result for clean output
  for (const r of Object.keys(out)) if (!out[r].length) delete out[r];
  return out;
}

// Runs in the page context — collects candidates with landmark tags.
function collectCandidatesInPage() {
  const INTERACTIVE_ROLES = new Set([
    'button','link','checkbox','radio','switch','tab','menuitem',
    'menuitemcheckbox','menuitemradio','option','combobox','textbox',
    'searchbox','spinbutton','slider','listbox','treeitem','gridcell',
  ]);
  const LANDMARK_ROLES = new Set([
    'banner','navigation','main','contentinfo','complementary',
    'form','search','region',
  ]);
  const TAG_TO_LANDMARK = {
    header: 'banner', nav: 'navigation', main: 'main',
    footer: 'contentinfo', aside: 'complementary',
    form: 'form', section: 'region',
  };

  function getXPath(el) {
    if (!el || !el.tagName) return '';
    if (el === document.documentElement) return '/html';
    if (el === document.body) return '/html/body';
    let idx = 1, sib = el.previousElementSibling;
    while (sib) { if (sib.tagName === el.tagName) idx++; sib = sib.previousElementSibling; }
    // Non-HTML-namespace elements (SVG etc.): an unprefixed XPath name test can
    // never match them — use local-name(), same dialect as the annotator's
    // injected getXPath, so the xpaths resolve in document.evaluate everywhere.
    // local-name() comparison is case-sensitive and SVG preserves case
    // (linearGradient, clipPath), so keep the canonical tagName there.
    const ns = el.namespaceURI;
    const isHtml = !ns || ns === 'http://www.w3.org/1999/xhtml';
    const t = isHtml ? el.tagName.toLowerCase() : el.tagName;
    const step = isHtml
      ? '/' + t + '[' + idx + ']'
      : "/*[local-name()='" + t + "'][" + idx + ']';
    return getXPath(el.parentElement) + step;
  }

  function isHidden(el) {
    if (!el || el.nodeType !== 1) return true;
    if (el.hasAttribute('hidden')) return true;
    let cur = el;
    while (cur && cur.nodeType === 1) {
      if (cur.hasAttribute('inert')) return true;
      if (cur.getAttribute('aria-hidden') === 'true') return true;
      const cs = getComputedStyle(cur);
      if (cs.display === 'none' || cs.visibility === 'hidden') return true;
      if (parseFloat(cs.opacity) === 0) return true;
      cur = cur.parentElement;
    }
    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) return true;
    return false;
  }

  function isWholePageContainer(el) {
    if (el === document.documentElement || el === document.body) return true;
    const r  = el.getBoundingClientRect();
    const vw = window.innerWidth  || document.documentElement.clientWidth;
    const vh = window.innerHeight || document.documentElement.clientHeight;
    // Spans ~entire viewport AND wraps a lot of children → wrapper
    if (r.width >= 0.9 * vw && r.height >= 0.85 * vh && el.children.length > 5) return true;
    return false;
  }

  function getRole(el) {
    const explicit = el.getAttribute('role');
    if (explicit) return explicit;
    const t = el.tagName.toLowerCase();
    if (t === 'a' || t === 'area') return el.hasAttribute('href') ? 'link' : null;
    if (t === 'input') {
      const tp = (el.getAttribute('type') || 'text').toLowerCase();
      return ({
        checkbox: 'checkbox', radio: 'radio',
        button: 'button', submit: 'button', reset: 'button', image: 'button',
        range: 'slider', search: 'searchbox', number: 'spinbutton',
        email: 'textbox', password: 'textbox', text: 'textbox',
        tel: 'textbox', url: 'textbox',
      })[tp] || 'textbox';
    }
    return ({
      button: 'button', select: 'combobox', textarea: 'textbox',
      summary: 'button', details: 'group',
    })[t] || null;
  }

  function isTabFocusable(el) {
    const ti = el.getAttribute('tabindex');
    if (ti !== null) return parseInt(ti, 10) >= 0;
    if (el.disabled) return false;
    const t = el.tagName.toLowerCase();
    if ((t === 'a' || t === 'area') && el.hasAttribute('href')) return true;
    if (t === 'button' || t === 'input' || t === 'select' || t === 'textarea') return true;
    if (el.isContentEditable) return true;
    return false;
  }

  function accessibleName(el) {
    const al = el.getAttribute('aria-label');
    if (al) return al.trim();
    const lby = el.getAttribute('aria-labelledby');
    if (lby) {
      const parts = lby.split(/\s+/)
        .map(id => { const r = document.getElementById(id); return r ? r.textContent.trim() : ''; })
        .filter(Boolean);
      if (parts.length) return parts.join(' ');
    }
    const t = el.tagName;
    if (t === 'IMG' || t === 'AREA') return el.getAttribute('alt') || '';
    if (t === 'INPUT' || t === 'SELECT' || t === 'TEXTAREA') {
      if (el.id) {
        const l = document.querySelector('label[for="' + CSS.escape(el.id) + '"]');
        if (l) return l.textContent.trim();
      }
      const pl = el.closest('label');
      if (pl) return pl.textContent.trim();
      return el.getAttribute('placeholder') || '';
    }
    const ti = el.getAttribute('title');
    if (ti) return ti;
    return (el.textContent || '').trim().slice(0, 80);
  }

  function findLandmark(el) {
    let cur = el.parentElement;
    while (cur && cur !== document.body) {
      const explicit = cur.getAttribute && cur.getAttribute('role');
      if (explicit && LANDMARK_ROLES.has(explicit)) return explicit;
      const tag = cur.tagName ? cur.tagName.toLowerCase() : null;
      const mapped = tag && TAG_TO_LANDMARK[tag];
      if (mapped) {
        // <section> is only a landmark when it has an accessible name
        if (tag === 'section') {
          if (cur.getAttribute('aria-label') || cur.getAttribute('aria-labelledby')) return 'region';
        } else {
          return mapped;
        }
      }
      cur = cur.parentElement;
    }
    return 'default';
  }

  // A non-AT-focusable element is included as a candidate only if it has its
  // own direct text node, or is an <img>/<svg> (likely meaningful content),
  // or is a heading/list/section tag with text. Pure layout wrappers are
  // skipped to keep the pool manageable.
  function hasOwnText(el) {
    for (const n of el.childNodes) {
      if (n.nodeType === 3 && n.textContent.trim()) return true;
    }
    return false;
  }
  const CONTENT_TAGS = new Set([
    'h1','h2','h3','h4','h5','h6',
    'p','li','dt','dd','figcaption','blockquote','cite',
    'span','strong','em','b','i','u','code','time','small','mark','label',
    'th','td','caption','summary','legend',
  ]);
  function isMeaningfulNonInteractive(el) {
    const tag = el.tagName.toLowerCase();
    if (tag === 'img' || tag === 'svg') return true;
    if (CONTENT_TAGS.has(tag)) return hasOwnText(el);
    return hasOwnText(el);
  }

  const MAX_SCAN = 25000;
  const out = [];
  const elements = document.querySelectorAll('*');
  const limit = Math.min(elements.length, MAX_SCAN);
  for (let i = 0; i < limit; i++) {
    const el = elements[i];
    if (isHidden(el)) continue;
    if (isWholePageContainer(el)) continue;
    const explicitRole = el.getAttribute('role');
    if (explicitRole === 'none' || explicitRole === 'presentation') continue;
    const role = getRole(el);
    const tabFocusable = isTabFocusable(el);
    const interactive  = role && INTERACTIVE_ROLES.has(role);
    const atFocusable  = tabFocusable || !!interactive;
    if (!atFocusable && !isMeaningfulNonInteractive(el)) continue;
    out.push({
      xpath:       getXPath(el),
      tag:         el.tagName.toLowerCase(),
      role:        role || null,
      name:        (accessibleName(el) || '').slice(0, 120),
      focusable:   tabFocusable,
      atFocusable,
      landmark:    findLandmark(el),
    });
  }
  return out;
}

// Use the system-installed Chrome so puppeteer doesn't need to download its
// own bundled copy. Order: --chrome flag, PUPPETEER_EXECUTABLE_PATH, common
// macOS/Linux/Windows paths, finally puppeteer's `channel: 'chrome'`.
async function launchBrowser() {
  const args = ['--no-sandbox', '--disable-setuid-sandbox'];
  const cliPath  = arg('chrome', null);
  const envPath  = process.env.PUPPETEER_EXECUTABLE_PATH;
  const guesses = [
    cliPath, envPath,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
    '/Applications/Chromium.app/Contents/MacOS/Chromium',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  ].filter(Boolean);
  const opts = { headless: true, args, protocolTimeout: 180000 };
  for (const executablePath of guesses) {
    if (fs.existsSync(executablePath)) {
      return puppeteer.launch({ ...opts, executablePath });
    }
  }
  return puppeteer.launch({ ...opts, channel: 'chrome' });
}

// Merge two {region:[...]} stratified results into one.
function mergeStratified(a, b) {
  const out = {};
  for (const r of new Set([...Object.keys(a), ...Object.keys(b)])) {
    out[r] = [...(a[r] || []), ...(b[r] || [])];
  }
  return out;
}

function groupByLandmark(list) {
  const g = {};
  for (const c of list) (g[c.landmark] = g[c.landmark] || []).push(c);
  return g;
}

// Stratify the candidate list by landmark + AT-focusable, then sample within
// the configured budgets. Pure function — no Puppeteer.
function stratifyAndSample(candidates, rand) {
  const atPool    = candidates.filter(c => c.atFocusable);
  const nonAtPool = candidates.filter(c => !c.atFocusable);

  let sampled, atBudget = null, nonAtBudget = null;
  if (N_PER_PAGE !== null) {
    let wantAt    = Math.round(N_PER_PAGE * AT_RATIO);
    let wantNonAt = N_PER_PAGE - wantAt;
    const shortfallAt    = Math.max(0, wantAt    - atPool.length);
    const shortfallNonAt = Math.max(0, wantNonAt - nonAtPool.length);
    wantAt    = Math.min(atPool.length,    wantAt    + shortfallNonAt);
    wantNonAt = Math.min(nonAtPool.length, wantNonAt + shortfallAt);
    atBudget = wantAt; nonAtBudget = wantNonAt;
    const atSample    = pickStratifiedTotal(groupByLandmark(atPool),    wantAt,    rand);
    const nonAtSample = pickStratifiedTotal(groupByLandmark(nonAtPool), wantNonAt, rand);
    sampled = mergeStratified(atSample, nonAtSample);
  } else {
    const at    = Object.fromEntries(Object.entries(groupByLandmark(atPool))
      .map(([r, list]) => [r, sampleFrom(list, N_PER_REGION, rand)]));
    const nonAt = Object.fromEntries(Object.entries(groupByLandmark(nonAtPool))
      .map(([r, list]) => [r, sampleFrom(list, N_PER_REGION, rand)]));
    sampled = mergeStratified(at, nonAt);
  }

  return {
    totalCandidates: candidates.length,
    atCandidates:    atPool.length,
    nonAtCandidates: nonAtPool.length,
    atBudget, nonAtBudget,
    sampled,
  };
}

async function sampleOnePage(page, url, rand) {
  let navTimedOut = false;
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: NAV_TIMEOUT });
  } catch (e) {
    if (!/timeout/i.test(e.message)) throw e;
    navTimedOut = true;
  }
  if (RENDER_WAIT > 0) await new Promise(r => setTimeout(r, RENDER_WAIT));
  const candidates = await page.evaluate(collectCandidatesInPage);
  return { ...stratifyAndSample(candidates, rand), navTimedOut };
}

// Tier 2: page navigation may hang, but if the DOM has populated we can
// interrupt the JS thread via Debugger.pause and sample with CDP
// Runtime.evaluate (which runs while paused).
async function sampleHungPage(page, url, rand) {
  const cdp = await page.createCDPSession();
  // Kick off goto without awaiting — it's expected to hang.
  page.goto(url, { waitUntil: 'domcontentloaded', timeout: 15000 }).catch(() => {});
  // Give the page time to start populating the DOM before we pause.
  await new Promise(r => setTimeout(r, Math.max(RENDER_WAIT, 5000)));
  await cdp.send('Debugger.enable');
  await cdp.send('Debugger.pause');
  await new Promise(r => setTimeout(r, 500));
  let candidates;
  try {
    const res = await cdp.send('Runtime.evaluate', {
      expression: `(${collectCandidatesInPage.toString()})()`,
      returnByValue: true,
      timeout: 60000,
    });
    if (res.exceptionDetails) throw new Error(res.exceptionDetails.text);
    candidates = res.result.value;
  } finally {
    try { await cdp.send('Debugger.resume'); } catch {}
    try { await cdp.detach(); } catch {}
  }
  return { ...stratifyAndSample(candidates, rand), navTimedOut: true };
}

// 3-tier fallback. tier in {1,2,3}.
async function sampleOnePageWithFallback(makePageFn, url, rand) {
  // Tier 1: normal page.evaluate with JS enabled
  let page = await makePageFn(false);
  try {
    const r = await sampleOnePage(page, url, rand);
    return { tier: 1, ...r };
  } catch (e) {
    var tier1Err = e.message;
  } finally {
    try { await page.close(); } catch {}
  }
  // Tier 2: load + Debugger.pause + CDP Runtime.evaluate
  page = await makePageFn(false);
  try {
    const r = await sampleHungPage(page, url, rand);
    return { tier: 2, ...r, tier1Err };
  } catch (e) {
    var tier2Err = e.message;
  } finally {
    try { await page.close(); } catch {}
  }
  // Tier 3: fresh load with JS disabled
  page = await makePageFn(true);
  try {
    const r = await sampleOnePage(page, url, rand);
    return { tier: 3, ...r, tier1Err, tier2Err };
  } catch (e) {
    return { tier: 0, error: e.message, tier1Err, tier2Err };
  } finally {
    try { await page.close(); } catch {}
  }
}

async function main() {
  const pages = JSON.parse(fs.readFileSync(PAGES_PATH, 'utf8'));

  // --retry-from: only retry entries that errored or got zero candidates.
  // Output is merged back into the input file by default.
  let priorOutput = {};
  let retryKeys   = null;
  if (RETRY_FROM) {
    priorOutput = JSON.parse(fs.readFileSync(RETRY_FROM, 'utf8'));
    retryKeys = new Set();
    for (const [k, v] of Object.entries(priorOutput)) {
      if (v.error || !v.totalCandidates || v.totalCandidates === 0) retryKeys.add(k);
    }
    if (!retryKeys.size) {
      console.log('Nothing to retry — all entries in', RETRY_FROM, 'have non-zero candidates.');
      return;
    }
  }

  const targets = pages.filter(p => {
    if (p.hidden) return false;
    if (!p.file)  return false;
    if (ONLY_GROUP && p.group !== ONLY_GROUP) return false;
    if (ONLY_NAME  && p.name  !== ONLY_NAME)  return false;
    if (ONLY_FILE  && p.file  !== ONLY_FILE)  return false;
    if (retryKeys) {
      const rel = p.subdir ? p.subdir + '/' + p.file : p.file;
      if (!retryKeys.has(rel)) return false;
    }
    return true;
  });
  if (!targets.length) {
    console.error('No matching pages.'); process.exit(1);
  }

  // Require server.js to be running so relative asset paths resolve.
  try {
    const res = await fetch(SERVER_URL + '/engine/status');
    if (!res.ok) throw new Error('non-ok status');
  } catch (e) {
    console.error(`Annotator server not reachable at ${SERVER_URL}. Run \`node server.js\` first.`);
    process.exit(1);
  }

  const budgetDesc = N_PER_PAGE !== null
    ? `per-page=${N_PER_PAGE}`
    : `per-region=${N_PER_REGION}`;
  console.log(`Sampling ${targets.length} page(s)  ·  ${budgetDesc}  ·  seed=${SEED}  ·  concurrency=${CONCURRENCY}  ·  render-wait=${RENDER_WAIT}ms`);
  let browser = await launchBrowser();

  // Heavy pages can OOM-crash the whole browser, killing every other worker
  // with "Connection closed". Relaunch on demand and retry the page once.
  let relaunching = null;
  async function ensureBrowser() {
    if (browser && browser.connected) return browser;
    if (!relaunching) {
      relaunching = launchBrowser().then(b => { browser = b; relaunching = null; return b; });
    }
    return relaunching;
  }
  const isCrash = e => /Connection closed|Target closed|Session closed|browser has disconnected|Target\.createTarget/i.test(e.message || '');

  // Per-worker seeded RNG so output is deterministic regardless of which
  // worker grabs which page (each page's sample depends only on its index).
  function rngForIdx(i) { return makeRng((SEED * 0x9E3779B1) ^ (i + 1)); }

  const out = {};
  let nextIdx = 0;
  const total = targets.length;

  // Pages are loaded via ?offline=1 (see url construction), which makes the
  // server apply the SAME CSP + vendored-CDN rewrites the annotator iframe
  // uses. Sampling in the identical environment is what keeps the captured
  // xpaths valid when the annotator displays the page later. No request
  // interception here — the CSP does the blocking, exactly as in the app.
  async function makePage(disableJs) {
    await ensureBrowser();
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });
    if (disableJs) await page.setJavaScriptEnabled(false);
    return page;
  }

  // Default sampling path: drive the actual annotator UI and collect
  // candidates from inside its iframe. The iframe's sandbox attributes,
  // injected scripts, CSP and vendor rewrites all change how pages render —
  // sampling any other way produces xpaths for a DOM the annotator never
  // shows (observed: Gymshark hydrates in a plain tab but crashes in the
  // sandboxed iframe, invalidating every xpath).
  async function sampleViaAnnotator(rel, rand) {
    const page = await makePage(false);
    try {
      await page.goto(SERVER_URL + '/', { waitUntil: 'load', timeout: 30000 });
      // populateAssets() fetches /pages asynchronously — wait for options.
      await page.waitForFunction(
        () => document.getElementById('assetSelect').options.length > 1,
        { timeout: 15000 }
      );
      const selected = await page.evaluate(v => {
        const sel = document.getElementById('assetSelect');
        for (const o of sel.options) {
          if (o.value === v) { sel.value = v; sel.dispatchEvent(new Event('change')); return true; }
        }
        return false;
      }, rel);
      if (!selected) throw new Error('page not in assetSelect: ' + rel);
      // Wait for the iframe to navigate + settle. Lookup by frame hierarchy,
      // not URL — page scripts can rewrite their URL via history.replaceState
      // without navigating, which breaks URL matching.
      const deadline = Date.now() + NAV_TIMEOUT;
      let frame = null;
      const relEnc = rel.split('/').map(encodeURIComponent).join('/');
      while (Date.now() < deadline) {
        frame = page.mainFrame().childFrames()[0] || null;
        if (frame && (frame.url().includes(relEnc) || frame.url().includes('?offline='))) {
          const ready = await frame.evaluate(() => document.readyState).catch(() => null);
          if (ready === 'interactive' || ready === 'complete') break;
        }
        await new Promise(r => setTimeout(r, 250));
      }
      if (!frame) throw new Error('iframe never loaded');
      if (RENDER_WAIT > 0) await new Promise(r => setTimeout(r, RENDER_WAIT));
      const candidates = await frame.evaluate(collectCandidatesInPage);
      return stratifyAndSample(candidates, rand);
    } finally {
      try { await page.close(); } catch {}
    }
  }

  async function processTarget(rel, url, rand) {
    if (DIRECT) {
      if (FALLBACK_HANG) return sampleOnePageWithFallback(makePage, url, rand);
      const page = await makePage(false);
      try { return await sampleOnePage(page, url, rand); }
      finally { try { await page.close(); } catch {} }
    }
    return sampleViaAnnotator(rel, rand);
  }

  async function worker(workerId) {
    while (true) {
      const i = nextIdx++;
      if (i >= total) break;
      const p   = targets[i];
      const rel = p.subdir ? p.subdir + '/' + p.file : p.file;
      const url = SERVER_URL + '/assets/' + rel.split('/').map(encodeURIComponent).join('/')
        + (ALLOW_OFFSITE ? '' : '?offline=1');
      const rand = rngForIdx(i);
      try {
        let r;
        try {
          r = await processTarget(rel, url, rand);
        } catch (e) {
          if (!isCrash(e)) throw e;
          console.log(`[w${workerId} ${i + 1}/${total}] ${p.name} browser crashed — relaunching and retrying`);
          await ensureBrowser();
          r = await processTarget(rel, url, rand);
        }
        if (r.error) {
          out[rel] = { name: p.name, group: p.group, ...r };
          console.log(`[w${workerId} ${i + 1}/${total}] ${p.name} FAIL: ${r.error}`);
        } else {
          const pickedAll = Object.values(r.sampled).reduce((s, a) => s + a.length, 0);
          const pickedAt  = Object.values(r.sampled).reduce((s, a) => s + a.filter(x => x.atFocusable).length, 0);
          out[rel] = { name: p.name, group: p.group, ...r };
          const tierTag = r.tier ? `[T${r.tier}] ` : '';
          console.log(`[w${workerId} ${i + 1}/${total}] ${tierTag}${p.name} … cand=${r.totalCandidates}(AT=${r.atCandidates}/nonAT=${r.nonAtCandidates}) → ${pickedAll}(${pickedAt}AT+${pickedAll - pickedAt}nonAT) across ${Object.keys(r.sampled).length} region(s)`);
        }
      } catch (e) {
        out[rel] = { name: p.name, group: p.group, error: e.message };
        console.log(`[w${workerId} ${i + 1}/${total}] ${p.name} FAIL: ${e.message}`);
      }
    }
  }

  const workers = Array.from({ length: Math.max(1, CONCURRENCY) }, (_, k) => worker(k + 1));
  await Promise.all(workers);

  await browser.close();

  // Merge new results into the prior file, then write out.
  const merged = RETRY_FROM ? { ...priorOutput, ...out } : out;
  const finalOut = OUT === DEFAULT_OUT && RETRY_FROM ? RETRY_FROM : OUT;
  fs.writeFileSync(finalOut, JSON.stringify(merged, null, 2) + '\n');
  console.log(`\nWrote ${finalOut}`);

  // Per-tier summary
  if (FALLBACK_HANG) {
    const buckets = { 1: [], 2: [], 3: [], 0: [] };
    for (const [k, v] of Object.entries(out)) {
      if (v.error) buckets[0].push(k);
      else if (v.tier) buckets[v.tier].push(k);
    }
    console.log('\nTier breakdown:');
    console.log(`  Tier 1 (normal page.evaluate)              : ${buckets[1].length} page(s)`);
    for (const k of buckets[1]) console.log('    ' + k);
    console.log(`  Tier 2 (Debugger.pause + Runtime.evaluate) : ${buckets[2].length} page(s)`);
    for (const k of buckets[2]) console.log('    ' + k);
    console.log(`  Tier 3 (no-JS reload)                      : ${buckets[3].length} page(s)`);
    for (const k of buckets[3]) console.log('    ' + k);
    console.log(`  Still failed                               : ${buckets[0].length} page(s)`);
    for (const k of buckets[0]) console.log('    ' + k + ' — ' + (out[k].error || '?').slice(0, 100));
  }
}

main().catch(e => { console.error(e); process.exit(1); });
