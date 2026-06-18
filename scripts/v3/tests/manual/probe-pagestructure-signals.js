'use strict';
// PROBE (Tier-0 #3): for the 2.4.2 (c4a8a4) + 2.4.6 off-screen-heading (b49b2e) FN fixtures, collect +
// orchestrate (no LLM), then build the rubric subjects and dump the precomputed SIGNALS — confirm the 2.4.2
// subject now carries s.pageTitle and the 2.4.6 subject carries s.heading {role,text,isOffscreen} (previously
// an empty stub → "no title supplied" / "a plain span").
const path = require('path');
const puppeteer = require('puppeteer');
const { orchestrate } = require('../../lib/orchestrator.js');
const { createTabAllocator } = require('../../lib/tab-allocator.js');
const { collectActPage, normalizeCollectRoles } = require('../../lib/act-page-collect.js');
const llmAdj = require('../../lib/llm-adjudicator.js');
const { loadRubrics } = require('../../lib/rubric-loader.js');

const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT = path.join(__dirname, '..', '..', '..', '..');
const P = path.join(ROOT, 'eval/checker-comparison/act-subset/pages');
const FIX = [
  { rule: 'c4a8a4', tc: '1844d7bce889d85a80b620468baa804eab3ff2c8', sc: '2.4.2' },
  { rule: 'b49b2e', tc: '6000a70ba2da9a828fa9c817ae6a0d2c092522fb', sc: '2.4.6' },
];

(async () => {
  const { rubrics } = loadRubrics();
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const alloc = createTabAllocator({ browser, maxTabs: 4 });
  for (const f of FIX) {
    const url = 'file://' + path.join(P, f.rule, f.tc + '.html');
    console.log(`\n===== ${f.rule} (${f.sc}) =====`);
    const lease = await alloc.acquire();
    let collect;
    try { collect = normalizeCollectRoles(await collectActPage(lease.page, { url, elementCap: 80, file: 'p', runId: 'p', sourceUrl: url })); }
    finally { await lease.release(); }
    console.log(`  structure.title=${JSON.stringify(collect.structure.title)} headings=${(collect.structure.headings || []).length}`);
    for (const h of (collect.structure.headings || [])) console.log(`    heading: role=${h.role} level=${h.level} offscreen=${h.offscreen} text=${JSON.stringify(h.text)}`);
    const out = await orchestrate(collect, { file: 'p', runId: 'p', pageDigest: collect.pageDigest, drivenAt: collect.collectedAt + 1, elements: [] }, { resolveUrl: () => url, browser, tabAllocator: alloc, now: collect.collectedAt + 2, maxAutomatic: 16, experimentConcurrency: 2 });
    const ledger = (out.built && out.built.results && out.built.results.obligationLedger) || [];
    const subjects = llmAdj.selectRubricSubjects(collect, ledger, rubrics);
    const relevant = subjects.filter((s) => s.sc === f.sc);
    for (const subj of relevant) {
      const sig = llmAdj.precomputeSignals(subj.element, subj.skill);
      console.log(`  SUBJECT ${subj.rubricId} xpath=${subj.xpath} skill=${subj.skill}`);
      console.log(`    signals.pageTitle = ${JSON.stringify(sig.pageTitle)}`);
      console.log(`    signals.heading   = ${JSON.stringify(sig.heading)}`);
      console.log(`    signals.structure = ${sig.structure ? `{title:${JSON.stringify(sig.structure.title)}, headings:${sig.structure.headings.length}}` : 'undefined'}`);
    }
    if (!relevant.length) console.log(`  (no ${f.sc} rubric subject — ledger had no in-scope auto-PARTIAL obligation)`);
  }
  alloc.close(); await browser.close();
})().catch((e) => { console.error(e.stack || e); process.exit(1); });
