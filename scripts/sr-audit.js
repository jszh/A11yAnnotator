// Audit the screen-reader tool (/ax-node + /sr-order) against the annotator's
// own iframe environment. Read-only: never modifies pages.
//
// Usage: node scripts/sr-audit.js [--count 120] [--seed 42] [--out /tmp/sr-audit.json]
//
// For each sampled element:
//   1. annotator-side ground truth: does the xpath resolve in the iframe
//      (offline/noscript env), is it visible, aria-hidden, its text/aria-label
//   2. /ax-node: inTree, role, name, speech
//   3. /sr-order: prevSpeech/nextSpeech + prev/next xpaths
//   4. cross-checks: do the prev/next xpaths exist & make sense in the
//      annotator iframe; does speech match the element's name/text; timing

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const ROOT = path.join(__dirname, '..');
const args = process.argv.slice(2);
const flag = (name, dflt) => {
  const i = args.indexOf('--' + name);
  return i >= 0 ? args[i + 1] : dflt;
};
const COUNT = parseInt(flag('count', '120'), 10);
const SEED = parseInt(flag('seed', '42'), 10);
const OUT = flag('out', '/tmp/sr-audit.json');
const BASE = 'http://127.0.0.1:3001';

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function chromePath() {
  const guesses = [process.env.PUPPETEER_EXECUTABLE_PATH, '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', '/usr/bin/google-chrome'].filter(Boolean);
  for (const g of guesses) if (fs.existsSync(g)) return g;
}

async function fetchJson(url, timeoutMs) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), timeoutMs);
  const t0 = Date.now();
  try {
    const r = await fetch(url, { signal: ctl.signal });
    const j = await r.json();
    return { ok: true, ms: Date.now() - t0, data: j };
  } catch (e) {
    return { ok: false, ms: Date.now() - t0, err: e.name === 'AbortError' ? 'timeout' : String(e.message).slice(0, 80) };
  } finally { clearTimeout(t); }
}

async function main() {
  // ── 1. seeded sample of 120 elements ──────────────────────────────────────
  const samples = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/samples-saved.json'), 'utf8'));
  const pagesJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets/pages.json'), 'utf8'));
  const pageList = Array.isArray(pagesJson) ? pagesJson : pagesJson.pages;
  const meta = {}; // rel -> {value (select option value), noscript}
  for (const p of pageList) {
    if (p.group !== 'Saved') continue;
    const rel = (p.subdir ? p.subdir + '/' : '') + p.file;
    meta[rel] = { value: rel, noscript: !!p.noscript, name: p.name };
  }
  const all = [];
  for (const [rel, page] of Object.entries(samples)) {
    for (const [region, els] of Object.entries(page.sampled || {})) {
      for (const el of els) all.push({ rel, region, ...el });
    }
  }
  // --exclude <file>: drop elements already audited in a previous run
  const excludeFile = flag('exclude', null);
  let excluded = 0;
  if (excludeFile && fs.existsSync(excludeFile)) {
    const prev = new Set(JSON.parse(fs.readFileSync(excludeFile, 'utf8')).map(r => r.rel + '|' + r.xpath));
    const before = all.length;
    for (let i = all.length - 1; i >= 0; i--) if (prev.has(all[i].rel + '|' + all[i].xpath)) all.splice(i, 1);
    excluded = before - all.length;
  }
  // deterministic order before shuffling (object order is stable but be explicit)
  all.sort((a, b) => (a.rel + a.xpath).localeCompare(b.rel + b.xpath));
  const rand = mulberry32(SEED);
  // partial Fisher-Yates: pick COUNT
  for (let i = 0; i < Math.min(COUNT, all.length); i++) {
    const j = i + Math.floor(rand() * (all.length - i));
    [all[i], all[j]] = [all[j], all[i]];
  }
  const picked = all.slice(0, Math.min(COUNT, all.length));
  // group by page to amortize page loads
  const byPage = new Map();
  for (const el of picked) {
    if (!byPage.has(el.rel)) byPage.set(el.rel, []);
    byPage.get(el.rel).push(el);
  }
  console.log(`sampled ${picked.length} elements across ${byPage.size} pages (seed ${SEED}, ${excluded} excluded from prior run)`);

  // ── 2. annotator-side browser ─────────────────────────────────────────────
  // Recycled every RECYCLE_EVERY page-groups: one long-lived page navigating an
  // iframe through dozens of heavy sites accumulates detached-frame state in
  // both the renderer and puppeteer's node process (observed: 1.8 GB node RSS).
  const RECYCLE_EVERY = 6;
  let browser = null, page = null;
  async function freshBrowser() {
    if (browser) { try { await browser.close(); } catch (e) {} }
    if (global.gc) global.gc();
    browser = await puppeteer.launch({ headless: true, executablePath: chromePath(), args: ['--no-sandbox'], protocolTimeout: 180000 });
    page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.goto(BASE + '/', { waitUntil: 'load', timeout: 30000 });
    await page.waitForFunction(() => document.getElementById('assetSelect') && document.getElementById('assetSelect').options.length > 1, { timeout: 30000 });
  }
  await freshBrowser();

  const results = [];
  let pi = 0;
  for (const [rel, els] of byPage) {
    pi++;
    if (pi > 1 && (pi - 1) % RECYCLE_EVERY === 0) { process.stdout.write('(recycle browser) '); await freshBrowser(); }
    const m = meta[rel] || { value: rel, noscript: false };
    process.stdout.write(`[${pi}/${byPage.size}] ${rel.slice(6, 60)} (${els.length} els${m.noscript ? ', noscript' : ''}) `);
    // select page in annotator
    const found = await page.evaluate(v => {
      const sel = document.getElementById('assetSelect');
      for (const o of sel.options) if (o.value === v) { sel.value = v; sel.dispatchEvent(new Event('change')); return true; }
      return false;
    }, m.value);
    if (!found) { console.log('— OPTION NOT FOUND'); for (const el of els) results.push({ ...el, fatal: 'page not in dropdown' }); continue; }
    await new Promise(r => setTimeout(r, 7000));
    const frame = page.mainFrame().childFrames()[0];
    if (!frame) { console.log('— NO IFRAME'); for (const el of els) results.push({ ...el, fatal: 'iframe missing' }); continue; }

    for (const el of els) {
      // ground truth in annotator iframe
      const truth = await frame.evaluate(xp => {
        const r = document.evaluate(xp, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
        const e = r.singleNodeValue;
        if (!e) return { exists: false };
        const cs = getComputedStyle(e);
        const rect = e.getBoundingClientRect();
        let hiddenAnc = null;
        for (let a = e; a && a.tagName !== 'HTML'; a = a.parentElement) {
          const acs = a === e ? cs : getComputedStyle(a);
          if (acs.display === 'none' || acs.visibility === 'hidden' || a.getAttribute('aria-hidden') === 'true') { hiddenAnc = a.tagName + (a.getAttribute('aria-hidden') === 'true' ? '[aria-hidden]' : '[' + acs.display + '/' + acs.visibility + ']'); break; }
        }
        return {
          exists: true,
          visible: rect.width > 0 && rect.height > 0 && !hiddenAnc,
          hiddenBy: hiddenAnc,
          ariaLabel: (e.getAttribute('aria-label') || '').slice(0, 120),
          text: (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 120),
          tag: e.tagName.toLowerCase(),
        };
      }, el.xpath).catch(e => ({ evalErr: String(e.message).slice(0, 80) }));

      // server endpoints (same params as the front end)
      const q = 'file=' + encodeURIComponent(m.value) + '&xpath=' + encodeURIComponent(el.xpath);
      const ax = await fetchJson(`${BASE}/ax-node?${q}`, 60000);
      const sr = await fetchJson(`${BASE}/sr-order?${q}`, 60000);

      // cross-check prev/next xpaths against the annotator iframe
      let prevCheck = null, nextCheck = null;
      if (sr.ok && sr.data) {
        for (const dir of ['prev', 'next']) {
          const node = sr.data[dir];
          if (!node || !node.xpath) continue;
          const chk = await frame.evaluate(xp => {
            const r = document.evaluate(xp, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
            const e = r.singleNodeValue;
            if (!e) return { exists: false };
            const rect = e.getBoundingClientRect();
            let hidden = null;
            for (let a = e; a && a.tagName !== 'HTML'; a = a.parentElement) {
              const acs = getComputedStyle(a);
              if (acs.display === 'none' || acs.visibility === 'hidden' || a.getAttribute('aria-hidden') === 'true') { hidden = true; break; }
            }
            return { exists: true, visible: rect.width > 0 && rect.height > 0 && !hidden, tag: e.tagName.toLowerCase(), text: (e.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 60) };
          }, node.xpath).catch(() => ({ evalErr: true }));
          if (dir === 'prev') prevCheck = chk; else nextCheck = chk;
        }
      }

      results.push({
        rel, name: el.name, tag: el.tag, role: el.role, xpath: el.xpath,
        atFocusable: el.atFocusable, noscript: m.noscript,
        truth,
        ax: ax.ok ? { ms: ax.ms, data: ax.data } : { ms: ax.ms, err: ax.err },
        sr: sr.ok ? { ms: sr.ms, data: sr.data && { prevSpeech: sr.data.prevSpeech, nextSpeech: sr.data.nextSpeech, prev: sr.data.prev, next: sr.data.next } } : { ms: sr.ms, err: sr.err },
        prevCheck, nextCheck,
      });
      process.stdout.write('.');
    }
    console.log('');
    fs.writeFileSync(OUT, JSON.stringify(results, null, 1));
  }

  await browser.close();
  fs.writeFileSync(OUT, JSON.stringify(results, null, 1));
  console.log(`\nwrote ${results.length} results to ${OUT}`);
}

main().catch(e => { console.error(e); process.exit(1); });
