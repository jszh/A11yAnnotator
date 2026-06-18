'use strict';
// ADVERSARIAL over-enumeration probe for DEFERRED-TODO A: collect content-rich REAL pages with axe and count
// how many NEW checker-uncertainty obligations build-v3 creates (after dedup vs static). Hypothesis: low —
// the common axe-incomplete SC (1.4.3 color-contrast, flagged ~everywhere) is ALREADY statically enumerated
// for every text element → deduped → 0 new; only genuinely-missed cases add obligations.
const path = require('path');
const puppeteer = require('puppeteer');
const { orchestrate } = require('../../lib/orchestrator.js');
const { createTabAllocator } = require('../../lib/tab-allocator.js');
const { collectActPage, normalizeCollectRoles } = require('../../lib/act-page-collect.js');
const oracle = require('../../lib/applicability-oracle.js');

const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT = path.join(__dirname, '..', '..', '..', '..');
const AXE = path.join(ROOT, 'axe.min.js');
const PAGES = ['assets/saved/Amazon Sign-In.htm', 'assets/saved/(11) Feed _ LinkedIn.htm'];
const CHK = { '4.1.2': 'name-role-value', '1.1.1': 'non-text-content', '1.4.5': 'images-of-text', '2.4.4': 'link-purpose', '2.4.6': 'heading-descriptive', '1.4.1': 'use-of-color', '1.4.11': 'non-text-contrast', '1.4.3': 'text-contrast', '2.5.3': 'label-in-name' };

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const alloc = createTabAllocator({ browser, maxTabs: 6 });
  for (const p of PAGES) {
    const url = 'file://' + path.join(ROOT, p);
    const lease = await alloc.acquire();
    let collect;
    try { collect = normalizeCollectRoles(await collectActPage(lease.page, { url, elementCap: 400, file: p, runId: 'oe', sourceUrl: url, runAxe: true, axePath: AXE })); }
    catch (e) { console.log(p, 'collect failed:', e.message); await lease.release(); continue; }
    await lease.release();
    const incompletes = (collect.axeIncomplete || []);
    const staticObls = new Set(oracle.deriveObligations(collect).map((o) => o.obligationId));
    // replicate build-v3's checker-uncertainty enumeration to count NEW obligations
    const surfaced = require('../../lib/axe-surface.js').surfaceAxeFindings(collect).findings.filter((f) => f.kind === 'incomplete');
    const newObl = new Set();
    for (const f of surfaced) { const fam = CHK[f.sc]; if (!fam || !f.xpath) continue; const id = oracle.oblId(f.xpath, f.sc, fam); if (!staticObls.has(id)) newObl.add(id); }
    const out = await orchestrate(collect, { file: p, runId: 'oe', pageDigest: collect.pageDigest, drivenAt: collect.collectedAt + 1, elements: [] }, { resolveUrl: () => url, browser, tabAllocator: alloc, now: collect.collectedAt + 2, maxAutomatic: 24, experimentConcurrency: 3 });
    const ledger = (out.built.results && out.built.results.obligationLedger) || [];
    console.log(`\n${path.basename(p)}: elements=${collect.elements.length}  axe-incomplete=${incompletes.length}  surfaced-incomplete=${surfaced.length}`);
    console.log(`  static obligations=${staticObls.size}  total ledger=${ledger.length}  => NEW checker obligations=${newObl.size}  (flood if >> a handful)`);
    const bySc = {}; for (const f of surfaced) bySc[f.sc] = (bySc[f.sc] || 0) + 1;
    console.log(`  surfaced incomplete by SC: ${JSON.stringify(bySc)}`);
  }
  alloc.close(); await browser.close();
})().catch((e) => { console.error(e.stack || e); process.exit(1); });
