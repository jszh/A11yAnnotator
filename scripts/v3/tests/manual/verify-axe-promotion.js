'use strict';
// Adversarial check for the axe-promotion: a constructed page with CLEAR axe violations (empty button →
// button-name/4.1.2, empty link → link-name/2.4.4, img no alt → image-alt/1.1.1). Confirms (a) the collector
// resolves axe node targets to the SAME v3 xpath scheme as the element inventory, and (b) build-v3 promotes the
// decided violation to a PROVISIONAL barrier on the MATCHING obligation (xpath-aligned), with the tie-break.
const fs = require('fs');
const path = require('path');
const os = require('os');
const puppeteer = require('puppeteer');
const { orchestrate } = require('../../lib/orchestrator.js');
const { createTabAllocator } = require('../../lib/tab-allocator.js');
const { collectActPage, normalizeCollectRoles } = require('../../lib/act-page-collect.js');

const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT = path.join(__dirname, '..', '..', '..', '..');
const AXE_PATH = path.join(ROOT, 'axe.min.js');
const HTML = `<!DOCTYPE html><html lang="en"><head><title>x</title></head><body>
<button></button>
<a href="#"></a>
<img src="data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA=">
</body></html>`;

(async () => {
  const tmp = path.join(os.tmpdir(), 'axe-promo-fixture.html');
  fs.writeFileSync(tmp, HTML);
  const url = 'file://' + tmp;
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const alloc = createTabAllocator({ browser, maxTabs: 6 });
  const lease = await alloc.acquire();
  const collect = normalizeCollectRoles(await collectActPage(lease.page, { url, elementCap: 80, file: 'axe-promo', runId: 'ap', sourceUrl: url, runAxe: true, axePath: AXE_PATH }));
  await lease.release();

  console.log('axeRan=', collect.axeRan, ' violations=', (collect.axe || []).length);
  console.log('element xpaths:', (collect.elements || []).map((e) => e.xpath).join(' | '));
  for (const v of (collect.axe || [])) {
    const xps = (v.nodes || []).map((n) => n.xpath).join(',');
    console.log('  axe', v.id, 'wcag', (v.wcag || []).join(','), 'node-xpaths=[' + xps + ']');
  }

  const drive = { file: collect.file, runId: 'ap', pageDigest: collect.pageDigest, drivenAt: collect.collectedAt + 1, elements: [] };
  const out = await orchestrate(collect, drive, { resolveUrl: () => url, browser, tabAllocator: alloc, now: collect.collectedAt + 2, maxAutomatic: 16, experimentConcurrency: 2 });
  const ledger = (out.built.results && out.built.results.obligationLedger) || [];
  for (const sc of ['4.1.2', '2.4.4', '1.1.1']) {
    const rows = ledger.filter((r) => r.sc === sc);
    console.log(`  SC ${sc}: ` + rows.map((r) => r.xpath + '→' + r.disposition + (r.provisional ? '(' + r.provisional.outcome + ' via ' + r.provisional.mechanism + ')' : '')).join(' | '));
  }
  alloc.close(); await browser.close();
})().catch((e) => { console.error(e.stack || e); process.exit(1); });
