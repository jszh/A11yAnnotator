'use strict';
// #1 ROUTING (LLM-OFF): on real fd3a94 fixtures, confirm selectRubricSubjects now creates a
// link-name-equivalence-v0 subject (the relational rubric) on same-named links, carrying the peer set —
// while link-purpose-v0 still fires WITHOUT the relational signal (the clean split). Dumps the sameNameLinks
// signal so we can see the divergent-href smell the new rubric will resolve with resolve_destination.
const path = require('path');
const puppeteer = require('puppeteer');
const { orchestrate } = require('../../lib/orchestrator.js');
const { createTabAllocator } = require('../../lib/tab-allocator.js');
const { collectActPage, normalizeCollectRoles } = require('../../lib/act-page-collect.js');
const { selectRubricSubjects, precomputeSignals } = require('../../lib/llm-adjudicator.js');
const { loadRubrics } = require('../../lib/rubric-loader.js');
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SUB = path.join(__dirname, '..', '..', '..', '..', 'eval/checker-comparison/act-subset/pages/fd3a94');
const FIX = { 'ef75d424_FAIL': 'ef75d42424140b163d7939aacc6a80c8dbc8816a', 'e0d32d95_PASS': 'e0d32d9583b2b545ca76295cff78e016a44854b6' };
(async () => {
  const rubrics = loadRubrics().rubrics;
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage', '--allow-file-access-from-files'] });
  const alloc = createTabAllocator({ browser, maxTabs: 2 });
  for (const [short, tc] of Object.entries(FIX)) {
    const url = 'file://' + path.join(SUB, tc + '.html');
    const lease = await alloc.acquire();
    let collect;
    try { collect = normalizeCollectRoles(await collectActPage(lease.page, { url, elementCap: 80, file: 'p', runId: 'p', sourceUrl: url })); } finally { await lease.release(); }
    const out = await orchestrate(collect, { file: 'p', runId: 'p', pageDigest: collect.pageDigest, drivenAt: collect.collectedAt + 1, elements: [] }, { resolveUrl: () => url, browser, tabAllocator: alloc, now: collect.collectedAt + 2, maxAutomatic: 16, experimentConcurrency: 2 });
    const ledger = (out.built && out.built.results && out.built.results.obligationLedger) || [];
    const subs = selectRubricSubjects(collect, ledger, rubrics, { onlyAutoPartial: true }).filter((s) => s.sc === '2.4.4');
    const eq = subs.filter((s) => s.rubricId === 'link-name-equivalence-v0');
    const lp = subs.filter((s) => s.rubricId === 'link-purpose-v0');
    console.log(`\n===== fd3a94 / ${short} =====`);
    console.log(`  link-name-equivalence-v0 subjects=${eq.length} | link-purpose-v0 subjects=${lp.length}`);
    if (eq[0]) { const sig = precomputeSignals(eq[0].element, eq[0].skill); console.log(`  eq[0] sameNameLinks: count=${sig.sameNameLinks && sig.sameNameLinks.count} distinctRawHrefs=${sig.sameNameLinks && sig.sameNameLinks.distinctRawHrefs} peers=${JSON.stringify((sig.sameNameLinks&&sig.sameNameLinks.peers||[]).map(p=>p.href))}`); }
    if (lp[0]) { const sigl = precomputeSignals(lp[0].element, lp[0].skill); console.log(`  lp[0] sameNameLinks present on single-link rubric? ${sigl.sameNameLinks !== undefined} (expect false)`); }
  }
  alloc.close(); await browser.close();
})().catch((e) => { console.error(e.stack || e); process.exit(1); });
