// Drive the annotator UI in headless Chrome and screenshot what the user sees.
// Usage: node scripts/ui-test.js <pageValue> <outPng> [--next N]
//   pageValue: the assetSelect option value, e.g. "Description_1/Level_0/Claude_Code/ecommerce/index.html"
//   --next N : press the Next button N times before the screenshot

const puppeteer = require('puppeteer');
const fs = require('fs');

const PAGE_VALUE = process.argv[2];
const OUT = process.argv[3] || '/tmp/ui-test.png';
const nextIdx = process.argv.indexOf('--next');
const NEXT_N = nextIdx > 0 ? parseInt(process.argv[nextIdx + 1], 10) : 0;

function chromePath() {
  const guesses = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
  ].filter(Boolean);
  for (const g of guesses) if (fs.existsSync(g)) return g;
  return undefined;
}

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: chromePath(),
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1920,1080'],
    protocolTimeout: 120000,
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });

  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text().slice(0, 200)); });
  // Pages can throw non-Error values (strings) — never crash on e.message
  page.on('pageerror', e => errors.push('pageerror: ' + String(e && e.message || e).slice(0, 200)));

  await page.goto('http://127.0.0.1:3001/', { waitUntil: 'load', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1000));

  if (PAGE_VALUE) {
    // Select the page in the dropdown and fire change
    const found = await page.evaluate(v => {
      const sel = document.getElementById('assetSelect');
      for (const o of sel.options) {
        if (o.value === v) { sel.value = v; sel.dispatchEvent(new Event('change')); return true; }
      }
      return false;
    }, PAGE_VALUE);
    if (!found) { console.log('OPTION NOT FOUND:', PAGE_VALUE); await browser.close(); process.exit(1); }
    // Wait for iframe to load + sample highlights to be applied
    await new Promise(r => setTimeout(r, 6000));

    for (let i = 0; i < NEXT_N; i++) {
      await page.click('#nextSampleBtn').catch(e => errors.push('next-click: ' + e.message));
      await new Promise(r => setTimeout(r, 800));
    }
    // expand progress list
    await page.click('#progToggleBtn').catch(() => {});
    await new Promise(r => setTimeout(r, 500));
  }

  // Diagnostics from the app + iframe
  const diag = await page.evaluate(() => {
    const out = { progress: document.getElementById('progressCount')?.textContent || null };
    const iframe = document.getElementById('pageFrame');
    out.iframeDisplayed = iframe && iframe.style.display !== 'none';
    try {
      const idoc = iframe.contentDocument;
      out.iframeBodyChildren = idoc ? idoc.body.children.length : null;
      out.iframeTitle = idoc ? idoc.title : null;
      out.highlights = idoc ? {
        current: idoc.querySelectorAll('.a11y-sample-current').length,
        pending: idoc.querySelectorAll('.a11y-sample-pending').length,
        done: idoc.querySelectorAll('.a11y-sample-done').length,
      } : null;
      // Check whether the current element is actually visible in the viewport
      const cur = idoc && idoc.querySelector('.a11y-sample-current');
      if (cur) {
        const r = cur.getBoundingClientRect();
        out.currentRect = { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) };
        out.currentInViewport = r.bottom > 0 && r.top < iframe.clientHeight && r.width > 0 && r.height > 0;
      }
    } catch (e) { out.iframeErr = e.message; }
    return out;
  });

  await page.screenshot({ path: OUT, fullPage: false });
  console.log(JSON.stringify(diag, null, 2));
  if (errors.length) console.log('ERRORS:\n' + errors.slice(0, 10).join('\n'));
  await browser.close();
}
main().catch(e => { console.error(e); process.exit(1); });
