'use strict';
// Re-derive obligations (deterministic, no API) for the 29 noObligation FN cases AFTER the coverage-audit
// broadenings, and report how many now enumerate their in-scope SC (i.e. would reach the LLM).
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { collectActPage, normalizeCollectRoles } = require('../../lib/act-page-collect.js');
const { createTabAllocator } = require('../../lib/tab-allocator.js');
const oracle = require('../../lib/applicability-oracle.js');

const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT = path.join(__dirname, '..', '..', '..', '..');
const SUBSET = path.join(ROOT, 'eval/checker-comparison/act-subset');
const noOblig = require(path.join(ROOT, 'results/fn-llm/results.json')).filter((r) => r.outcome === 'noObligation');
const localOf = (id) => { for (const wl of ['worklist.json', 'worklist-proposed.json']) { const d = JSON.parse(fs.readFileSync(path.join(SUBSET, wl), 'utf8')); const h = (d.bothFail || []).find((x) => x.testcaseId === id); if (h) return h.localPath; } return ''; };

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const alloc = createTabAllocator({ browser, maxTabs: 8 });
  let converted = 0; const bySc = {};
  for (const c of noOblig) {
    const inScope = (c.sc || [])[0];
    bySc[inScope] = bySc[inScope] || { total: 0, nowEnumerated: 0 };
    bySc[inScope].total++;
    const url = 'file://' + path.join(SUBSET, localOf(c.testcaseId));
    const lease = await alloc.acquire();
    let collect;
    try { collect = normalizeCollectRoles(await collectActPage(lease.page, { url, elementCap: 80, file: 'act:' + c.testcaseId, runId: 'cv', sourceUrl: c.url, structure: { title: '' } })); }
    finally { await lease.release(); }
    if (!collect.structure) collect.structure = { title: '' }; // ensure page-level slot for 2.4.10/2.4.3 (real collector emits structure)
    const obls = oracle.deriveObligations(collect);
    const hit = obls.some((o) => (c.sc || []).includes(o.sc));
    if (hit) { converted++; bySc[inScope].nowEnumerated++; }
    console.log(`${hit ? '✓ ENUM' : '· still'} ${c.ruleId} [${c.sc.join(',')}]  obls-now=[${[...new Set(obls.map((o) => o.sc))].sort().join(',')}]`);
  }
  alloc.close(); await browser.close();
  console.log(`\n=== ${converted}/${noOblig.length} noObligation cases now ENUMERATE their in-scope SC ===`);
  for (const [sc, b] of Object.entries(bySc).sort()) console.log(`  ${sc.padEnd(7)} ${b.nowEnumerated}/${b.total}`);
})().catch((e) => { console.error(e.stack || e); process.exit(1); });
