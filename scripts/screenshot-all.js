// Screenshot every page of a group as displayed in the annotator iframe.
// Output: <outdir>/<idx>-<slug>.png + manifest.json
// Usage: node scripts/screenshot-all.js --group Saved --outdir /tmp/page-verify [--concurrency 3]

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const ROOT = path.resolve(__dirname, '..');
const SERVER = 'http://127.0.0.1:3001';

function arg(name, dflt) {
  const i = process.argv.indexOf('--' + name);
  return i > 0 && i + 1 < process.argv.length ? process.argv[i + 1] : dflt;
}
const GROUP = arg('group', 'Saved');
const OUTDIR = arg('outdir', '/tmp/page-verify');
const CONCURRENCY = parseInt(arg('concurrency', '3'), 10);
const WAIT = parseInt(arg('wait', '9000'), 10);

function chromePath() {
  const guesses = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  ].filter(Boolean);
  for (const g of guesses) if (fs.existsSync(g)) return g;
  return undefined;
}

process.on('unhandledRejection', e => console.log('unhandled:', (e && e.message || e).toString().slice(0, 100)));

async function shotOne(browser, p, idx, total) {
  const rel = p.subdir ? p.subdir + '/' + p.file : p.file;
  const slug = p.name.replace(/[^A-Za-z0-9_-]+/g, '_').slice(0, 60);
  const out = path.join(OUTDIR, String(idx + 1).padStart(2, '0') + '-' + slug + '.png');
  if (fs.existsSync(out)) {
    console.log(`[${idx + 1}/${total}] ${p.name} (cached)`);
    return { name: p.name, rel, png: out, noscript: !!p.noscript };
  }
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  try {
    await page.goto(SERVER + '/', { waitUntil: 'load', timeout: 30000 });
    await page.waitForFunction(() => document.getElementById('assetSelect').options.length > 1, { timeout: 15000 });
    await page.evaluate(v => {
      const sel = document.getElementById('assetSelect');
      sel.value = v; sel.dispatchEvent(new Event('change'));
    }, rel);
    await new Promise(r => setTimeout(r, WAIT));
    // Clip to the iframe area only (left panel; sidebar starts ~1435px)
    await page.screenshot({ path: out, clip: { x: 0, y: 24, width: 1435, height: 1056 } });
    console.log(`[${idx + 1}/${total}] ${p.name} → ${path.basename(out)}`);
    return { name: p.name, rel, png: out, noscript: !!p.noscript };
  } catch (e) {
    console.log(`[${idx + 1}/${total}] ${p.name} FAIL: ${e.message.slice(0, 80)}`);
    return { name: p.name, rel, error: e.message.slice(0, 120), noscript: !!p.noscript };
  } finally {
    try { await page.close(); } catch {}
  }
}

async function main() {
  fs.mkdirSync(OUTDIR, { recursive: true });
  const pages = JSON.parse(fs.readFileSync(path.join(ROOT, 'assets', 'pages.json'), 'utf8'))
    .filter(p => !p.hidden && p.file && p.group === GROUP);
  console.log(`Screenshotting ${pages.length} page(s) → ${OUTDIR}`);
  const browser = await puppeteer.launch({
    headless: true, executablePath: chromePath(),
    args: ['--no-sandbox', '--disable-setuid-sandbox'], protocolTimeout: 120000,
  });
  const results = new Array(pages.length);
  let next = 0;
  async function worker() {
    while (true) {
      const i = next++;
      if (i >= pages.length) break;
      try {
        results[i] = await shotOne(browser, pages[i], i, pages.length);
      } catch (e) {
        const rel = pages[i].subdir ? pages[i].subdir + '/' + pages[i].file : pages[i].file;
        results[i] = { name: pages[i].name, rel, error: e.message.slice(0, 120), noscript: !!pages[i].noscript };
        console.log(`[${i + 1}/${pages.length}] ${pages[i].name} WORKER FAIL: ${e.message.slice(0, 80)}`);
      }
    }
  }
  await Promise.all(Array.from({ length: CONCURRENCY }, worker));
  await browser.close();
  fs.writeFileSync(path.join(OUTDIR, 'manifest.json'), JSON.stringify(results, null, 2));
  console.log('Wrote manifest.json');
}
main().catch(e => { console.error(e); process.exit(1); });
