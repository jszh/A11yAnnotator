'use strict';
// PROBE (Tier-0 #4): the d0f69e 1.3.1 fixtures — confirm structure.tables is now collected (caption/th/td/
// headers= wiring + broken-association flags) and surfaced into the info-relationships subject's signals.
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
const TCS = ['664972feaac1097f9365d73aac844c81fa927fa2', '6bb6ca5dcdbd1fef063561f61de88740db24bd5d', '1a0ee1b5549d2f1eebd337e85cae8487331ab723'];

(async () => {
  const { rubrics } = loadRubrics();
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const alloc = createTabAllocator({ browser, maxTabs: 4 });
  for (const tc of TCS) {
    const url = 'file://' + path.join(P, 'd0f69e', tc + '.html');
    console.log(`\n===== d0f69e / ${tc.slice(0, 8)} =====`);
    const lease = await alloc.acquire();
    let collect;
    try { collect = normalizeCollectRoles(await collectActPage(lease.page, { url, elementCap: 80, file: 'p', runId: 'p', sourceUrl: url })); }
    finally { await lease.release(); }
    const tbls = collect.structure.tables || [];
    console.log(`  structure.tables = ${tbls.length}`);
    for (const t of tbls) console.log(`    table: rows=${t.rowCount} th=${t.thCount} td=${t.tdCount} caption=${t.hasCaption} dataTable=${t.looksLikeDataTable} tdWithHeaders=${t.tdWithHeaders} danglingIdref=${t.danglingIdref} headerNoData=${t.headerWithNoDataCell}\n      headers=${JSON.stringify(t.headers)}\n      tdHeaderSamples=${JSON.stringify(t.tdHeaderSamples)}`);
    const out = await orchestrate(collect, { file: 'p', runId: 'p', pageDigest: collect.pageDigest, drivenAt: collect.collectedAt + 1, elements: [] }, { resolveUrl: () => url, browser, tabAllocator: alloc, now: collect.collectedAt + 2, maxAutomatic: 16, experimentConcurrency: 2 });
    const ledger = (out.built && out.built.results && out.built.results.obligationLedger) || [];
    const subjects = llmAdj.selectRubricSubjects(collect, ledger, rubrics).filter((s) => s.sc === '1.3.1');
    for (const subj of subjects) {
      const sig = llmAdj.precomputeSignals(subj.element, subj.skill);
      console.log(`  SUBJECT ${subj.rubricId} skill=${subj.skill} xpath=${subj.xpath}`);
      console.log(`    signals.structure.tables = ${sig.structure && sig.structure.tables ? sig.structure.tables.length + ' table(s) surfaced' : 'undefined'}`);
    }
    if (!subjects.length) console.log('  (no 1.3.1 rubric subject enumerated)');
  }
  alloc.close(); await browser.close();
})().catch((e) => { console.error(e.stack || e); process.exit(1); });
