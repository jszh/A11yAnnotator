'use strict';
// Deterministic (LLM-OFF) diagnostic for the 4 shared `noObligation` recall misses (the routing gap both Gemini and
// Claude hit). For each fixture: collect → orchestrate (instruments on, LLM off) → dump the in-scope obligation ledger
// with dispositions + the instrument findings + the oracle's raw obligations. Shows WHY the target-SC obligation never
// reached the LLM: Type A (no obligation enumerated — applicability/oracle gap) vs Type B (enumerated then CLEARED).
const path = require('path');
const puppeteer = require('puppeteer');
const { orchestrate } = require('../../lib/orchestrator.js');
const { createTabAllocator } = require('../../lib/tab-allocator.js');
const { collectActPage, normalizeCollectRoles } = require('../../lib/act-page-collect.js');
const oracle = require('../../lib/applicability-oracle.js');

const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT = path.join(__dirname, '..', '..', '..', '..');
const PAGES = path.join(ROOT, 'eval/checker-comparison/act-subset/pages');
const AXE = path.join(ROOT, 'axe.min.js');

const CASES = [
  { rule: '0va7u6', sc: '1.4.5', id: 'e1d4ed7556dabfcfde47aaf4cd0861e0fdf585d9' },
  { rule: 'e88epe', sc: '1.1.1', id: 'e5b8fa7ab66409e7b52b335a8b6aebe11fd78635' },
  { rule: '80af7b', sc: '2.1.2', id: '7dcc4ae00712889d448ecbcba200e032dca59bf0' },
  { rule: '80af7b', sc: '2.1.2', id: '8fba3918b361f251dab4c19bec8eddc5624218ee' },
];

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const alloc = createTabAllocator({ browser, maxTabs: 6 });
  // SCs the oracle can EVER enumerate (a family maps to them).
  const ORACLE_SCS = new Set(Object.values(oracle.FAMILIES).map((f) => f.sc));
  for (const c of CASES) {
    const url = 'file://' + path.join(PAGES, c.rule, c.id + '.html');
    const runId = `rg-${c.id}`;
    const lease = await alloc.acquire();
    let collect;
    try { collect = normalizeCollectRoles(await collectActPage(lease.page, { url, elementCap: 80, file: `act:${c.id}`, runId, sourceUrl: url, runAxe: true, axePath: AXE })); }
    finally { await lease.release(); }

    const rawObls = oracle.deriveObligations(collect);
    const drive = { file: collect.file, runId, pageDigest: collect.pageDigest, drivenAt: collect.collectedAt + 1, elements: [] };
    const out = await orchestrate(collect, drive, {
      resolveUrl: () => url, executablePath: CHROME, browser, tabAllocator: alloc, maxTabs: 6,
      runInstruments: true, instrumentsTimeoutMs: 90000, now: collect.collectedAt + 2,
      restrictScs: new Set([c.sc]), maxAutomatic: Infinity, budgetOpts: { maxRunWallClockMs: 120000 },
      experimentConcurrency: 1, runLlm: false, captureVision: false,
    });
    const built = (out && out.built && out.built.results) || {};
    const ledger = (built.obligationLedger || []).filter((r) => r.sc === c.sc);
    const instr = ((built.instrumentFindings || built.instruments || (out.bundle && out.bundle.instruments) || []) || []);
    const shadow = (built.shadowObservations || []).filter((o) => o.sc === c.sc);

    console.log(`\n================ ${c.rule}  ${c.sc}  ${c.id.slice(0, 12)} ================`);
    console.log(`oracle has family for ${c.sc}? ${ORACLE_SCS.has(c.sc)}   | elements collected: ${(collect.elements || []).length}`);
    console.log(`raw oracle obligations on ${c.sc}: ${rawObls.filter((o) => o.sc === c.sc).length}  (total ${rawObls.length})`);
    // relevant collected elements (images / focusables)
    for (const el of (collect.elements || [])) {
      if (['img', 'button', 'a', 'input'].includes(el.tag)) {
        console.log(`  <${el.tag}> alt=${JSON.stringify(el.alt)} role=${el.role || el.roleAttr || ''} name=${JSON.stringify((el.axName || el.name || '').slice(0, 24))} focusable=${!!el.focusable} decorative=${el.markedDecorative} removedFromA11yTree=${el.removedFromA11yTree} xpath=${el.xpath}`);
      }
    }
    console.log(`in-scope obligation ledger (${ledger.length}):`);
    for (const r of ledger) console.log(`  sc=${r.sc} disposition=${r.disposition} autoPartial=${r.autoPartial} cleared=${r.cleared} source=${r.source || r.via || '?'} xpath=${(r.xpath || '').slice(0, 50)}`);
    const kbd = instr.filter((f) => /trap|confine|keyboard|focus/i.test(JSON.stringify(f)));
    console.log(`instrument findings (kbd/confinement) ${kbd.length}:`);
    for (const f of kbd.slice(0, 6)) console.log(`  ${JSON.stringify(f).slice(0, 220)}`);
    console.log(`shadow observations on ${c.sc}: ${shadow.length}  ${shadow.map((o) => o.source + ':' + (o.wouldBe && o.wouldBe.observationOutcome)).join(', ')}`);
  }
  await browser.close();
  process.exit(0);
})().catch((e) => { console.error(e); process.exit(1); });
