'use strict';
// #4.1.2 iframe-equivalence verification (LLM-OFF + tool). For the FP fixture (page-one vs page-one, allSameSrc)
// the duplicate-name-equivalence rubric must be GATED OFF (no subject ⇒ no LLM ⇒ no FP). For the FAIL fixture
// (page-one vs page-two) the rubric must fire (distinctSrcs=2). And compare_iframe_content must read the two
// iframes' RENDERED content as DIFFERENT (the signal the FN needed).
const path = require('path');
const puppeteer = require('puppeteer');
const { orchestrate } = require('../../lib/orchestrator.js');
const { createTabAllocator } = require('../../lib/tab-allocator.js');
const { collectActPage, normalizeCollectRoles } = require('../../lib/act-page-collect.js');
const { selectRubricSubjects } = require('../../lib/llm-adjudicator.js');
const { loadRubrics } = require('../../lib/rubric-loader.js');
const { compareIframeContent } = require('../../lib/cdp-tools.js');
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SUB = path.join(__dirname, '..', '..', '..', '..', 'eval/checker-comparison/act-subset/pages/4b1c6c');
const FIX = { 'FP_passSameSrc': '08c5575023e8bf16caabcf01a1c8d40fe6ecaf94', 'FAIL_distinctSrc': '4d33680e81b31e47fc46d3b6543cc050e369525b' };
(async () => {
  const rubrics = loadRubrics().rubrics;
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage', '--allow-file-access-from-files'] });
  const alloc = createTabAllocator({ browser, maxTabs: 2 });
  for (const [short, tc] of Object.entries(FIX)) {
    const url = 'file://' + path.join(SUB, tc + '.html');
    const lease = await alloc.acquire();
    let collect, toolOut;
    try {
      collect = normalizeCollectRoles(await collectActPage(lease.page, { url, elementCap: 80, file: 'p', runId: 'p', sourceUrl: url }));
      // run the tool directly on the page's iframes
      const iframes = collect.elements.filter((e) => e.tag === 'iframe').map((e) => e.xpath);
      toolOut = iframes.length >= 2 ? await compareIframeContent(lease.page, { iframeXpaths: iframes }) : { note: 'fewer than 2 iframes' };
    } finally { await lease.release(); }
    const out = await orchestrate(collect, { file: 'p', runId: 'p', pageDigest: collect.pageDigest, drivenAt: collect.collectedAt + 1, elements: [] }, { resolveUrl: () => url, browser, tabAllocator: alloc, now: collect.collectedAt + 2, maxAutomatic: 16, experimentConcurrency: 2 });
    const ledger = (out.built && out.built.results && out.built.results.obligationLedger) || [];
    const subs = selectRubricSubjects(collect, ledger, rubrics, { onlyAutoPartial: true }).filter((s) => s.rubricId === 'duplicate-name-equivalence-v0');
    console.log(`\n===== 4b1c6c / ${short} =====`);
    console.log(`  duplicate-name-equivalence-v0 subjects: ${subs.length}  ${short.startsWith('FP') ? '(want 0 — allSameSrc gated off)' : '(want >=1 — distinctSrcs, routes to tool)'}`);
    console.log(`  compare_iframe_content: comparedCount=${toolOut.comparedCount} equality=${JSON.stringify(toolOut.equality)}`);
    if (toolOut.iframes) for (const f of toolOut.iframes) console.log(`     iframe ${f.iframeXpath}: title="${f.title}" h1="${f.h1}" textLen=${f.textLen} crossOrigin=${f.crossOrigin}`);
  }
  alloc.close(); await browser.close();
})().catch((e) => { console.error(e.stack || e); process.exit(1); });
