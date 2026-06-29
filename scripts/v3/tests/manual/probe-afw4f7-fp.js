'use strict';
// PROBE (#3 FP side): the 3 afw4f7 fixtures the LLM FALSE-POSITIVED (GT=passed, judge said LIKELY_BARRIER).
// Dump the collected 1.4.3 contrast facts + the contrast experiment outcome + the final ledger disposition,
// to see WHY each reaches the LLM (auto-PARTIAL) and whether a deterministic pixel runner can SOUNDLY clear
// it WITHOUT barrier-ing the two flat-color large-text cases (eb4bfbbe #666/#000, 2845a840 #000/#666 ~3.66:1).
const path = require('path');
const puppeteer = require('puppeteer');
const { orchestrate } = require('../../lib/orchestrator.js');
const { createTabAllocator } = require('../../lib/tab-allocator.js');
const { collectActPage, normalizeCollectRoles } = require('../../lib/act-page-collect.js');
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SUB = path.join(__dirname, '..', '..', '..', '..', 'eval/checker-comparison/act-subset/pages/afw4f7');
const FIX = { dc170fd0: 'dc170fd015758b62d8e0141e086893a116ee724e', '2845a840': '2845a8409b1c07caa856d1bfbf42ed244b0de9c2', eb4bfbbe: 'eb4bfbbeba4e803fef10ebad17427f32e306ae82' };
(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage', '--allow-file-access-from-files'] });
  const alloc = createTabAllocator({ browser, maxTabs: 3 });
  for (const [short, tc] of Object.entries(FIX)) {
    const url = 'file://' + path.join(SUB, tc + '.html');
    console.log(`\n========== afw4f7 / ${short} (GT=passed, was FP) ==========`);
    const lease = await alloc.acquire();
    let collect;
    try { collect = normalizeCollectRoles(await collectActPage(lease.page, { url, elementCap: 80, file: 'p', runId: 'p', sourceUrl: url })); } finally { await lease.release(); }
    for (const el of collect.elements) {
      if (el.text && el.text.trim() && (el.needsPixelContrast || el.contrastReliable != null || el.contrastThreshold != null)) {
        console.log(`  TEXT ${el.xpath} "${String(el.text).slice(0, 22)}"  fontPx=${el.fontSizePx} bold=${el.bold} largeText=${el.isLargeText}`);
        console.log(`       color=${el.color} effBg=${el.effBg} effBgImage=${el.effBgImage} needsPixelContrast=${el.needsPixelContrast} contrastReliable=${el.contrastReliable} contrastSolid=${el.contrastSolid} ratio=${el.contrastRatio} threshold=${el.contrastThreshold}`);
      }
    }
    const out = await orchestrate(collect, { file: 'p', runId: 'p', pageDigest: collect.pageDigest, drivenAt: collect.collectedAt + 1, elements: [] }, { resolveUrl: () => url, browser, tabAllocator: alloc, now: collect.collectedAt + 2, maxAutomatic: 16, experimentConcurrency: 2 });
    const exps = ((out.experiments && out.experiments.results) || []).filter((e) => /contrast/i.test(e.catalogId || '') || e.sc === '1.4.3');
    for (const e of exps) { const o = e.outcome || {}; console.log(`  EXP ${e.catalogId} sc=${e.sc} outcome=${e.observationOutcome} valid=${e.valid}\n       computable=${o.contrastComputable} solidUniform=${o.backdropIsSolidUniform} thresholdMet=${o.thresholdMet} thresholdFailed=${o.thresholdFailed} notExemptText=${o.notExemptText} measurement=${JSON.stringify(e.measurement)}`); }
    const ledger = ((out.built && out.built.results && out.built.results.obligationLedger) || []).filter((r) => r.sc === '1.4.3');
    for (const r of ledger) console.log(`  LEDGER 1.4.3 ${r.xpath} -> disposition=${r.disposition} autoPartial=${r.autoPartial} (autoPartial ⇒ reaches LLM)`);
    if (!ledger.length) console.log('  LEDGER 1.4.3: (no row)');
  }
  alloc.close(); await browser.close();
})().catch((e) => { console.error(e.stack || e); process.exit(1); });
