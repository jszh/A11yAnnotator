'use strict';
// PROBE (Tier-0 #2): orchestrate the two afw4f7 1.4.3 FN fixtures (no LLM) and dump what the EXISTING
// text-contrast-pixel runner does — does it run, what backdrop range does it measure, does it abstain on the
// non-uniform split bg? — plus the 1.4.3 collected contrast facts and the final ledger disposition. Grounds
// the worst-case-barrier fix before touching the runner.
const path = require('path');
const puppeteer = require('puppeteer');
const { orchestrate } = require('../../lib/orchestrator.js');
const { createTabAllocator } = require('../../lib/tab-allocator.js');
const { collectActPage, normalizeCollectRoles } = require('../../lib/act-page-collect.js');

const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT = path.join(__dirname, '..', '..', '..', '..');
const SUB = path.join(ROOT, 'eval/checker-comparison/act-subset/pages/afw4f7');
const FIX = ['bf47c65f2854b6ac100a6f700d354b243b069231', '41afaa9b33287aba9c608c3466e2b164f57a02ed'];

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const alloc = createTabAllocator({ browser, maxTabs: 4 });
  for (const tc of FIX) {
    const url = 'file://' + path.join(SUB, tc + '.html');
    console.log(`\n========== afw4f7 / ${tc.slice(0, 8)} ==========`);
    const lease = await alloc.acquire();
    let collect;
    try { collect = normalizeCollectRoles(await collectActPage(lease.page, { url, elementCap: 80, file: 'p', runId: 'p', sourceUrl: url })); }
    finally { await lease.release(); }
    // collected contrast facts on text elements
    for (const el of collect.elements) {
      if (el.text && el.text.trim() && (el.needsPixelContrast || el.contrastReliable != null)) {
        console.log(`  TEXT ${el.xpath}  "${String(el.text).slice(0, 30)}"`);
        console.log(`       color=${el.color} effBg=${el.effBg} effBgImage=${el.effBgImage}`);
        console.log(`       needsPixelContrast=${el.needsPixelContrast} contrastReliable=${el.contrastReliable} contrastSolid=${el.contrastSolid} threshold=${el.contrastThreshold} box=${JSON.stringify(el.box)}`);
      }
    }
    const out = await orchestrate(collect, { file: 'p', runId: 'p', pageDigest: collect.pageDigest, drivenAt: collect.collectedAt + 1, elements: [] }, { resolveUrl: () => url, browser, tabAllocator: alloc, now: collect.collectedAt + 2, maxAutomatic: 16, experimentConcurrency: 2 });
    const exps = (out.experiments && out.experiments.results) || [];
    const cExps = exps.filter((e) => /contrast/i.test(e.catalogId || '') || e.sc === '1.4.3' || e.sc === '1.4.11');
    console.log(`  --- ${cExps.length} contrast experiment(s) ---`);
    for (const e of cExps) {
      console.log(`  EXP ${e.catalogId} sc=${e.sc} target=${e.targetXpath}`);
      console.log(`      outcome=${e.observationOutcome} applicable=${e.wcagApplicability} valid=${e.valid}`);
      console.log(`      measurement=${JSON.stringify(e.measurement)}`);
      const o = e.outcome || {};
      console.log(`      OUTCOME foregroundResolved=${o.foregroundResolved} backgroundResolved=${o.backgroundResolved} measurementStable=${o.measurementStable} contrastComputable=${o.contrastComputable} backdropIsSolidUniform=${o.backdropIsSolidUniform} thresholdMet=${o.thresholdMet} thresholdFailed=${o.thresholdFailed} notExemptText=${o.notExemptText}`);
    }
    const ledger = (out.built && out.built.results && out.built.results.obligationLedger) || [];
    const cRows = ledger.filter((r) => r.sc === '1.4.3' || r.sc === '1.4.11');
    console.log(`  --- ${cRows.length} contrast ledger row(s) ---`);
    for (const r of cRows) console.log(`  LEDGER ${r.sc} ${r.xpath} -> disposition=${r.disposition} autoPartial=${r.autoPartial}`);
  }
  alloc.close(); await browser.close();
})().catch((e) => { console.error(e.stack || e); process.exit(1); });
