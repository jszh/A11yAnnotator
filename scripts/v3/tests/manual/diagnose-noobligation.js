'use strict';
// Deterministic (no-API) diagnostic over the FN cases that scored noObligation: for each, collect the page,
// derive obligations, and record WHY the in-scope SC never enumerated — the oracle's family registry, the
// collected elements + their resolved roles, and which families each element DID fire. Categorizes the pattern.
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { orchestrate } = require('../../lib/orchestrator.js');
const { createTabAllocator } = require('../../lib/tab-allocator.js');
const { collectActPage, normalizeCollectRoles } = require('../../lib/act-page-collect.js');
const oracle = require('../../lib/applicability-oracle.js');

const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT = path.join(__dirname, '..', '..', '..', '..');
const SUBSET = path.join(ROOT, 'eval/checker-comparison/act-subset');
const results = require(path.join(ROOT, 'results/fn-llm/results.json'));
const noOblig = results.filter((r) => r.outcome === 'noObligation');

// SCs the oracle can EVER enumerate (a family maps to them). inScopeSc not here ⇒ no family at all.
const ORACLE_SCS = new Set(Object.values(oracle.FAMILIES).map((f) => f.sc));
// resolved role the oracle reads (role/roleAttr/sampledRole/axRole, first non-empty).
const factRole = (el) => { for (const f of ['role', 'roleAttr', 'sampledRole', 'axRole']) { const v = el && el[f]; if (typeof v === 'string' && v.trim()) return v.trim(); } return ''; };

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const alloc = createTabAllocator({ browser, maxTabs: 8 });
  const rows = [];
  for (const c of noOblig) {
    const tc = c; const inScope = (tc.sc || [])[0];
    const url = 'file://' + path.join(SUBSET, c.testcaseId ? findLocal(c) : '');
    const lease = await alloc.acquire();
    let collect;
    try { collect = normalizeCollectRoles(await collectActPage(lease.page, { url, elementCap: 80, file: 'act:' + c.testcaseId, runId: 'dx', sourceUrl: c.url })); }
    finally { await lease.release(); }
    const obls = oracle.deriveObligations(collect);
    const oblScs = [...new Set(obls.map((o) => o.sc))].sort();
    const els = (collect.elements || []).map((el) => ({ tag: el.tag, roleAttr: el.roleAttr || '', role: factRole(el), focusable: !!el.focusable, inModal: !!el.inModal, text: (el.text || '').slice(0, 30) }));
    // categorize
    let category, why;
    if (!ORACLE_SCS.has(inScope)) { category = 'A: no family for SC'; why = `oracle has no obligation family mapping to ${inScope}`; }
    else if ((collect.elements || []).length === 0) { category = 'B: zero elements collected'; why = 'collector found no visible/evaluable elements (iframe-only or hidden)'; }
    else {
      // family exists + elements exist: the gate condition wasn't met by any collected element
      const fam = Object.entries(oracle.FAMILIES).find(([, f]) => f.sc === inScope);
      const famName = fam ? fam[0] : '?';
      if (inScope === '2.1.2') { category = 'C1: risk-gate (no modal)'; why = 'no-keyboard-trap fires only for focusable && inModal; no element is inModal'; }
      else if (['1.1.1', '1.4.5'].includes(inScope)) { const imgs = els.filter((e) => /^(img|image|figure)$/.test(e.role)); category = imgs.length ? 'C2: role present but...' : 'C2: no img-role element'; why = `${famName} needs role img/image/figure; collected img-role elements: ${imgs.length} (roles seen: ${[...new Set(els.map((e) => e.role || '∅'))].join(',')})`; }
      else if (inScope === '2.4.6') { const h = els.filter((e) => e.role === 'heading'); category = h.length ? 'C2: heading present but...' : 'C2: no heading-role element'; why = `heading-descriptive needs role heading; heading-role elements: ${h.length} (roles: ${[...new Set(els.map((e) => e.role || '∅'))].join(',')})`; }
      else if (inScope === '4.1.2') { category = 'C2: non-widget/invalid role'; why = `name-role-value needs a WIDGET role; roles collected: ${[...new Set(els.map((e) => e.role || '∅'))].join(',')}`; }
      else if (inScope === '2.1.1') { category = 'C3: no focusable element'; why = `keyboard-operable needs focusable; focusable elements: ${els.filter((e) => e.focusable).length}`; }
      else { category = 'C?: gate unmet'; why = `family ${famName} exists but no element matched`; }
    }
    rows.push({ ruleId: c.ruleId, ruleName: c.ruleName, sc: inScope, category, why, nEls: (collect.elements || []).length, oblScs, els });
  }
  alloc.close(); await browser.close();
  fs.writeFileSync(path.join(ROOT, 'results/fn-llm/noobligation-diagnosis.json'), JSON.stringify(rows, null, 2));
  // print grouped
  console.log(`\n=== ${rows.length} noObligation cases ===\n`);
  const byCat = {};
  for (const r of rows) (byCat[r.category] = byCat[r.category] || []).push(r);
  for (const [cat, rs] of Object.entries(byCat).sort()) {
    console.log(`\n### ${cat}  (${rs.length})`);
    for (const r of rs) console.log(`  • ${r.ruleId} [${r.sc}] ${r.ruleName}\n      els=${r.nEls} roles=[${[...new Set(r.els.map((e) => e.role || '∅'))].join(',')}]  obls=[${r.oblScs.join(',')}]\n      ${r.why}`);
  }
})().catch((e) => { console.error(e.stack || e); process.exit(1); });

// the runner stored url but not localPath; recover localPath from the worklists by testcaseId.
function findLocal(c) {
  for (const wl of ['worklist.json', 'worklist-proposed.json']) {
    const data = JSON.parse(fs.readFileSync(path.join(SUBSET, wl), 'utf8'));
    const hit = (data.bothFail || []).find((x) => x.testcaseId === c.testcaseId);
    if (hit) return hit.localPath;
  }
  return '';
}
