// Benchmark: how long does the per-element scan take on a heavy page?
// Loads a failing page once, then runs the scan with progressively larger
// caps to find what fits within a given time budget.

const puppeteer = require('puppeteer');

const SERVER = 'http://127.0.0.1:3001';
const TARGET = process.argv[2] || 'saved/Reebok® Official Site.htm';
const BUDGET_MS = parseInt(process.argv[3] || '180000', 10);

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    protocolTimeout: 600000,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });
  if (process.env.DISABLE_JS === '1') {
    await page.setJavaScriptEnabled(false);
    console.log('[JavaScript DISABLED]');
  }
  await page.setRequestInterception(true);
  page.on('request', req => {
    const u = req.url();
    if (u.startsWith('http://127.0.0.1') || u.startsWith('data:') || u.startsWith('about:') || u.startsWith('blob:')) req.continue();
    else req.abort();
  });

  const url = SERVER + '/assets/' + TARGET.split('/').map(encodeURIComponent).join('/');
  console.log('Loading:', TARGET);
  const t0 = Date.now();
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  } catch (e) {
    console.log('Nav timeout (continuing):', e.message);
  }
  await new Promise(r => setTimeout(r, 5000));
  console.log('Loaded in', (Date.now()-t0)+'ms');

  // 1) total elements present
  const total = await page.evaluate(() => document.querySelectorAll('*').length);
  console.log('Total DOM elements:', total);

  // 2) per-N benchmark — replicates the real scan's per-element work
  for (const N of [1000, 5000, 10000, 15000, 20000, 25000, 35000, 50000, total]) {
    if (N > total) continue;
    const result = await page.evaluate((cap) => {
      const t0 = performance.now();
      const INTERACTIVE_ROLES = new Set(['button','link','checkbox','radio','switch','tab','menuitem','menuitemcheckbox','menuitemradio','option','combobox','textbox','searchbox','spinbutton','slider','listbox','treeitem','gridcell']);
      const LANDMARK_ROLES = new Set(['banner','navigation','main','contentinfo','complementary','form','search','region']);
      const TAG_TO_LANDMARK = {header:'banner',nav:'navigation',main:'main',footer:'contentinfo',aside:'complementary',form:'form',section:'region'};

      function getXPath(el) {
        if (!el || !el.tagName) return '';
        if (el === document.documentElement) return '/html';
        if (el === document.body) return '/html/body';
        let idx = 1, sib = el.previousElementSibling;
        while (sib) { if (sib.tagName === el.tagName) idx++; sib = sib.previousElementSibling; }
        return getXPath(el.parentElement) + '/' + el.tagName.toLowerCase() + '[' + idx + ']';
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
      function findLandmark(el) {
        let cur = el.parentElement;
        while (cur && cur !== document.body) {
          const explicit = cur.getAttribute && cur.getAttribute('role');
          if (explicit && LANDMARK_ROLES.has(explicit)) return explicit;
          const tag = cur.tagName ? cur.tagName.toLowerCase() : null;
          const mapped = tag && TAG_TO_LANDMARK[tag];
          if (mapped) return mapped;
          cur = cur.parentElement;
        }
        return 'default';
      }

      const all = document.querySelectorAll('*');
      const limit = Math.min(all.length, cap);
      let candidates = 0;
      for (let i = 0; i < limit; i++) {
        const el = all[i];
        if (isHidden(el)) continue;
        const tag = el.tagName.toLowerCase();
        getXPath(el);
        findLandmark(el);
        candidates++;
      }
      return { ms: Math.round(performance.now() - t0), candidates };
    }, N);
    console.log(`  N=${N.toString().padStart(6)}  time=${result.ms.toString().padStart(7)}ms  visible_candidates=${result.candidates}`);
    if (result.ms > BUDGET_MS) {
      console.log(`  >> exceeds ${BUDGET_MS}ms budget; stopping`);
      break;
    }
  }

  await browser.close();
}
main().catch(e => { console.error(e); process.exit(1); });
