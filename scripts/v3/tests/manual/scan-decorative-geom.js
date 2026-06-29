'use strict';
// Corpus geometry scan for the "don't blindly exclude decorative" question. Over the 1.1.1+1.4.5 image cases, collect
// each page and record EVERY removed-from-a11y-tree image (alt=""/aria-hidden/role=presentation) with its rendered
// box, the case's GT (expected), and decorativeConflict. Aggregate the size distribution split by GT so we can see
// whether a size/narrowness gate separates genuinely-decorative (correctly excluded) from wrongly-decorated-informative
// (the FN images we miss). Output: per-image rows + a summary by expected × size bucket. No LLM; collect-only.
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { collectActPage, normalizeCollectRoles } = require('../../lib/act-page-collect.js');
const { createTabAllocator } = require('../../lib/tab-allocator.js');

const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT = path.join(__dirname, '..', '..', '..', '..');
const PAGES = path.join(ROOT, 'eval/checker-comparison/act-subset/pages');
const AXE = path.join(ROOT, 'axe.min.js');
const CASES = JSON.parse(fs.readFileSync(process.env.IMG_CASES, 'utf8'));
const OUT = process.env.SCAN_OUT;

const area = (b) => (b && b.width != null ? b.width * b.height : 0);
const minDim = (b) => (b && b.width != null ? Math.min(b.width, b.height) : 0);

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const alloc = createTabAllocator({ browser, maxTabs: 8 });
  const rows = [];
  let done = 0;
  await Promise.all(CASES.map((c) => (async () => {
    const url = 'file://' + path.join(PAGES, c.rule, c.id + '.html');
    const lease = await alloc.acquire();
    let collect;
    try { collect = normalizeCollectRoles(await collectActPage(lease.page, { url, elementCap: 150, file: `act:${c.id}`, runId: `sg-${c.id}`, sourceUrl: url, runAxe: false })); }
    catch (e) { collect = null; }
    finally { await lease.release(); }
    done++;
    if (!collect) return;
    for (const el of (collect.elements || [])) {
      const isImg = el.tag === 'img' || el.isImage === true;
      if (!isImg || el.removedFromA11yTree !== true) continue;
      const b = el.box || {};
      rows.push({ rule: c.rule, id: c.id.slice(0, 8), sc: c.sc, expected: c.expected,
        w: b.width, h: b.height, area: area(b), minDim: minDim(b),
        mech: el.hiddenMechanism, conflict: !!el.decorativeConflict, alt: el.alt });
    }
  })()));
  await browser.close();
  fs.writeFileSync(OUT, JSON.stringify(rows, null, 1));

  // ---- summary ----
  const buckets = [['<=8 (tiny)', (r) => r.minDim <= 8], ['9-23 (icon)', (r) => r.minDim > 8 && r.minDim < 24],
    ['24-47', (r) => r.minDim >= 24 && r.minDim < 48], ['>=48 (substantial)', (r) => r.minDim >= 48]];
  console.log(`\nremoved-from-tree images: ${rows.length}  (over ${CASES.length} image-SC pages)`);
  console.log('\n  minDim bucket × GT  (count):');
  const exps = ['failed', 'passed', 'inapplicable'];
  console.log('    ' + 'bucket'.padEnd(20) + exps.map((e) => e.padStart(13)).join(''));
  for (const [label, pred] of buckets) {
    const r = exps.map((e) => rows.filter((x) => x.expected === e && pred(x)).length);
    console.log('    ' + label.padEnd(20) + r.map((n) => String(n).padStart(13)).join(''));
  }
  // the wrongly-decorated-informative (GT failed) images — what sizes are they?
  console.log('\n  GT=failed removed-from-tree images (the FNs a size-gate would need to ROUTE):');
  for (const r of rows.filter((x) => x.expected === 'failed').sort((a, b) => b.area - a.area)) {
    console.log(`    ${r.rule}/${r.id} ${r.sc.padEnd(12)} ${(String(r.w) + 'x' + r.h).padEnd(11)} minDim=${String(r.minDim).padStart(4)} mech=${r.mech} conflict=${r.conflict}`);
  }
  // legit-decorative (GT passed/inapplicable) that are LARGE — these are what a size gate would (wrongly?) re-admit
  const bigDecorative = rows.filter((x) => x.expected !== 'failed' && x.minDim >= 48).sort((a, b) => b.area - a.area);
  console.log(`\n  GT=pass/inapplicable removed-from-tree images with minDim>=48 (size-gate FALSE admits): ${bigDecorative.length}`);
  for (const r of bigDecorative.slice(0, 25)) console.log(`    ${r.rule}/${r.id} ${r.expected.padEnd(12)} ${(String(r.w) + 'x' + r.h).padEnd(11)} minDim=${String(r.minDim).padStart(4)} mech=${r.mech} alt=${JSON.stringify((r.alt || '').slice(0, 16))}`);
  console.log('\nwrote ' + OUT);
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
