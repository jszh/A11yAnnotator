'use strict';
// #3 VERIFICATION: does the non-language-exemption gate stop the 2 flat-color afw4f7 FPs from reaching the
// LLM, WITHOUT over-gating real-language text? For each fixture: run collect→orchestrate, build the
// contrastExempt set from the experiments (exactly as orchestrator.js now does), and compare the 1.4.3 LLM
// subjects BEFORE vs AFTER the gate. EXPECT: 2845a840/eb4bfbbe drop 1→0 (FP killed); GT-fail + real-language
// cases unchanged (still handled deterministically / still judged — no over-gating).
const path = require('path');
const puppeteer = require('puppeteer');
const { orchestrate } = require('../../lib/orchestrator.js');
const { createTabAllocator } = require('../../lib/tab-allocator.js');
const { collectActPage, normalizeCollectRoles } = require('../../lib/act-page-collect.js');
const { selectRubricSubjects } = require('../../lib/llm-adjudicator.js');
const { loadRubrics } = require('../../lib/rubric-loader.js');
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SUB = path.join(__dirname, '..', '..', '..', '..', 'eval/checker-comparison/act-subset/pages/afw4f7');
const FIX = { '2845a840_FP': '2845a8409b1c07caa856d1bfbf42ed244b0de9c2', eb4bfbbe_FP: 'eb4bfbbeba4e803fef10ebad17427f32e306ae82',
  dc170fd0: 'dc170fd015758b62d8e0141e086893a116ee724e', bf47c65f_FAIL: 'bf47c65f2854b6ac100a6f700d354b243b069231',
  e8f3acb1_FAIL: 'e8f3acb1dc814b8b815c69b7150cdea67d5bd98e', ab4691ef_passLang: 'ab4691ef474d6263e9ceec824f07faa51a30112e' };
(async () => {
  const rubrics = loadRubrics().rubrics;
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage', '--allow-file-access-from-files'] });
  const alloc = createTabAllocator({ browser, maxTabs: 3 });
  let problems = [];
  for (const [short, tc] of Object.entries(FIX)) {
    const url = 'file://' + path.join(SUB, tc + '.html');
    const lease = await alloc.acquire();
    let collect;
    try { collect = normalizeCollectRoles(await collectActPage(lease.page, { url, elementCap: 80, file: 'p', runId: 'p', sourceUrl: url })); } finally { await lease.release(); }
    const out = await orchestrate(collect, { file: 'p', runId: 'p', pageDigest: collect.pageDigest, drivenAt: collect.collectedAt + 1, elements: [] }, { resolveUrl: () => url, browser, tabAllocator: alloc, now: collect.collectedAt + 2, maxAutomatic: 16, experimentConcurrency: 2 });
    const ledger = (out.built && out.built.results && out.built.results.obligationLedger) || [];
    const exps = (out.experiments && out.experiments.results) || [];
    const contrastExempt = new Set(exps.filter((e) => e && e.sc === '1.4.3' && e.outcome && e.outcome.nonLanguageExempt === true && e.targetXpath).map((e) => e.targetXpath));
    const before = selectRubricSubjects(collect, ledger, rubrics, { onlyAutoPartial: true }).filter((s) => s.sc === '1.4.3').length;
    const after = selectRubricSubjects(collect, ledger, rubrics, { onlyAutoPartial: true, contrastExempt: contrastExempt.size ? contrastExempt : null }).filter((s) => s.sc === '1.4.3').length;
    const exemptFlag = exps.some((e) => e.sc === '1.4.3' && e.outcome && e.outcome.nonLanguageExempt);
    // soundness: an FP case must drop to 0 after the gate; a FAIL/real-language case must be UNCHANGED.
    if (short.endsWith('_FP') && !(before > 0 && after === 0)) problems.push(`${short}: expected 1→0, got ${before}→${after}`);
    if ((short.includes('FAIL') || short.includes('Lang')) && before !== after) problems.push(`${short}: OVER-GATED ${before}→${after}`);
    console.log(`${short.padEnd(16)} nonLanguageExempt=${String(exemptFlag).padEnd(5)} | 1.4.3 LLM subjects: before=${before} after=${after}`);
  }
  alloc.close(); await browser.close();
  console.log(problems.length ? `\n*** PROBLEMS:\n  ${problems.join('\n  ')}` : '\nGATE SOUND: FPs subtracted, no over-gating ✓');
  process.exit(problems.length ? 1 : 0);
})().catch((e) => { console.error(e.stack || e); process.exit(2); });
