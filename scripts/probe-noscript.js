// Probe saved pages in the real annotator iframe. Pages whose own JS blanks
// the snapshot (visible text leaves < threshold) get "noscript": true in
// pages.json so the annotator serves them with scripts neutralized.
// Re-probes flagged pages in noscript mode to verify the fallback renders.
//
// Usage: node scripts/probe-noscript.js [--group Saved] [--threshold 10]

const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const ROOT = path.resolve(__dirname, '..');
const PAGES_PATH = path.join(ROOT, 'assets', 'pages.json');
const SERVER = 'http://127.0.0.1:3001';

function arg(name, dflt) {
  const i = process.argv.indexOf('--' + name);
  return i > 0 && i + 1 < process.argv.length ? process.argv[i + 1] : dflt;
}
const GROUP = arg('group', 'Saved');
const THRESHOLD = parseInt(arg('threshold', '10'), 10);
const WAIT = parseInt(arg('wait', '8000'), 10);

function chromePath() {
  const guesses = [
    process.env.PUPPETEER_EXECUTABLE_PATH,
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
  ].filter(Boolean);
  for (const g of guesses) if (fs.existsSync(g)) return g;
  return undefined;
}

function countVisibleLeaves() {
  let n = 0;
  for (const e of document.querySelectorAll('body *')) {
    const c = getComputedStyle(e);
    if (c.display === 'none' || c.visibility === 'hidden' || parseFloat(c.opacity) === 0) continue;
    if (e.children.length === 0 && (e.textContent || '').trim()) n++;
  }
  return n;
}

async function probeOne(browser, rel, noscript) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  try {
    await page.goto(SERVER + '/', { waitUntil: 'load', timeout: 30000 });
    await page.waitForFunction(() => document.getElementById('assetSelect').options.length > 1, { timeout: 15000 });
    // Optionally force noscript by adding the rel to the page's set first
    await page.evaluate((v, ns) => {
      if (ns) pageNoScript.add(v);
      const sel = document.getElementById('assetSelect');
      sel.value = v;
      sel.dispatchEvent(new Event('change'));
    }, rel, noscript);
    await new Promise(r => setTimeout(r, WAIT));
    // Lookup by frame hierarchy, not URL — page scripts can rewrite their
    // URL via history.replaceState without navigating.
    const frame = page.mainFrame().childFrames()[0];
    if (!frame) return { error: 'iframe never loaded' };
    const visible = await frame.evaluate(countVisibleLeaves);
    return { visible };
  } catch (e) {
    return { error: e.message.slice(0, 80) };
  } finally {
    try { await page.close(); } catch {}
  }
}

async function main() {
  const pages = JSON.parse(fs.readFileSync(PAGES_PATH, 'utf8'));
  const targets = pages.filter(p => !p.hidden && p.file && (!GROUP || p.group === GROUP));
  console.log(`Probing ${targets.length} page(s), blank threshold < ${THRESHOLD} visible text leaves`);

  const browser = await puppeteer.launch({
    headless: true, executablePath: chromePath(),
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    protocolTimeout: 120000,
  });

  const flagged = [], fine = [], broken = [];
  for (const p of targets) {
    const rel = p.subdir ? p.subdir + '/' + p.file : p.file;
    const withJs = await probeOne(browser, rel, false);
    if (withJs.error) { broken.push([rel, withJs.error]); console.log(`✗ ${p.name} — ${withJs.error}`); continue; }
    if (withJs.visible >= THRESHOLD) {
      fine.push(rel);
      console.log(`✓ ${p.name} — ${withJs.visible} visible (scripts ok)`);
      continue;
    }
    const noJs = await probeOne(browser, rel, true);
    console.log(`⚠ ${p.name} — ${withJs.visible} visible with JS, ${noJs.visible ?? 'ERR'} with noscript ${noJs.visible > withJs.visible ? '→ FLAG' : '(no better)'}`);
    if (!noJs.error && noJs.visible > withJs.visible && noJs.visible >= THRESHOLD) {
      p.noscript = true;
      flagged.push(rel);
    } else {
      broken.push([rel, `blank both ways (js=${withJs.visible}, nojs=${noJs.visible ?? noJs.error})`]);
    }
  }
  await browser.close();

  fs.writeFileSync(PAGES_PATH, JSON.stringify(pages, null, 2) + '\n');
  console.log(`\nFlagged noscript (${flagged.length}):`); flagged.forEach(r => console.log('  ' + r));
  console.log(`Fine with scripts (${fine.length})`);
  console.log(`Still broken (${broken.length}):`); broken.forEach(([r, e]) => console.log('  ' + r + ' — ' + e));
  console.log('\nWrote ' + PAGES_PATH);
}
main().catch(e => { console.error(e); process.exit(1); });
