'use strict';
// Deterministic (LLM-OFF) routing probe for the decorative-verification lane. For each fixture: collect → oracle
// deriveObligations → build a minimal auto-PARTIAL ledger from those obligations → selectRubricSubjects → print which
// rubric(s) each image's 1.1.1/1.4.5 row routes to. Asserts the lane is wired: a SUBSTANTIAL bare-alt="" image now
// mints 1.1.1/1.4.5 and routes ONLY decorative-image-verification-v0 (alt-text-adequacy-v0 is gated OFF); a named
// removed-from-tree image (decorativeConflict) still routes alt-text-adequacy-v0; in-tree images are unchanged.
const path = require('path');
const puppeteer = require('puppeteer');
const { collectActPage, normalizeCollectRoles } = require('../../lib/act-page-collect.js');
const oracle = require('../../lib/applicability-oracle.js');
const adj = require('../../lib/llm-adjudicator.js');
const { loadRubrics } = require('../../lib/rubric-loader.js');

const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const PAGES = path.join(__dirname, '..', '..', '..', '..', 'eval/checker-comparison/act-subset/pages');
const CASES = [
  { rule: 'e88epe', id: 'e5b8fa7ab66409e7b52b335a8b6aebe11fd78635', note: 'bare alt="" 72x48 (FN — should ROUTE)' },
  { rule: '0va7u6', id: 'e1d4ed7556dabfcfde47aaf4cd0861e0fdf585d9', note: 'bare alt="" 451x126 (FN — should ROUTE)' },
  { rule: 'e88epe', id: '5d0c52f3b06b60f712efaa08eb6947f18494c241', note: 'aria-hidden+alt (conflict — alt-adequacy)' },
];

(async () => {
  const { rubrics } = loadRubrics();
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  for (const c of CASES) {
    const pg = await browser.newPage();
    const url = 'file://' + path.join(PAGES, c.rule, c.id + '.html');
    const collect = normalizeCollectRoles(await collectActPage(pg, { url, elementCap: 120, file: `act:${c.id}`, runId: `dl-${c.id}`, sourceUrl: url, runAxe: false }));
    await pg.close();
    const obls = oracle.deriveObligations(collect);
    // minimal auto-PARTIAL ledger from the derived obligations (what build-v3 would emit before disposition)
    const ledger = obls.map((o) => ({ sc: o.sc, xpath: o.xpath, autoPartial: true, disposition: 'PARTIAL', claimFamily: o.family }));
    const subjects = adj.selectRubricSubjects(collect, ledger, rubrics, {});
    const img = (collect.elements || []).find((e) => e.tag === 'img' || e.isImage === true) || {};
    console.log(`\n=== ${c.rule}/${c.id.slice(0, 8)} — ${c.note} ===`);
    console.log(`  decorativeSuspect(img)=${oracle.decorativeSuspect(img)}  box=${img.box ? img.box.width + 'x' + img.box.height : '?'}  removed=${img.removedFromA11yTree}  conflict=${img.decorativeConflict}`);
    console.log(`  obligations: ${obls.map((o) => o.sc).join(', ')}`);
    const imgSubs = subjects.filter((s) => s.xpath === img.xpath);
    console.log(`  routed rubrics for the image: ${imgSubs.map((s) => `${s.sc}:${s.rubricId}`).join('  |  ') || '(none)'}`);
  }
  await browser.close();
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
