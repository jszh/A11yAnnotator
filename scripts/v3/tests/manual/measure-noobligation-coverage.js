'use strict';
// FINAL obligation coverage over the original 29 FN noObligation cases, after ALL the work (enumeration
// broadenings, 2.1.2 gate, iframe traversal, checker-uncertainty obligations). For each case: collect WITH axe,
// run the full deterministic build (no LLM), and check the FINAL obligation ledger for an in-scope obligation —
// crediting static (oracle) AND checker-uncertainty (axe-incomplete) sources.
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { orchestrate } = require('../../lib/orchestrator.js');
const { createTabAllocator } = require('../../lib/tab-allocator.js');
const { collectActPage, normalizeCollectRoles } = require('../../lib/act-page-collect.js');

const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT = path.join(__dirname, '..', '..', '..', '..');
const SUB = path.join(ROOT, 'eval/checker-comparison/act-subset');
const AXE = path.join(ROOT, 'axe.min.js');
const noOblig = require(path.join(ROOT, 'results/fn-llm/results.json')).filter((r) => r.outcome === 'noObligation');
const localOf = (id) => { for (const wl of ['worklist.json', 'worklist-proposed.json']) { const d = JSON.parse(fs.readFileSync(path.join(SUB, wl), 'utf8')); const h = (d.bothFail || []).find((x) => x.testcaseId === id); if (h) return h.localPath; } return ''; };

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const alloc = createTabAllocator({ browser, maxTabs: 6 });
  const bySc = {};
  let covered = 0;
  for (const c of noOblig) {
    const inScope = new Set(c.sc || []);
    const url = 'file://' + path.join(SUB, localOf(c.testcaseId));
    const lease = await alloc.acquire();
    let collect;
    try { collect = normalizeCollectRoles(await collectActPage(lease.page, { url, elementCap: 80, file: 'm', runId: 'm', sourceUrl: c.url, runAxe: true, axePath: AXE })); }
    finally { await lease.release(); }
    const out = await orchestrate(collect, { file: 'm', runId: 'm', pageDigest: collect.pageDigest, drivenAt: collect.collectedAt + 1, elements: [] }, { resolveUrl: () => url, browser, tabAllocator: alloc, now: collect.collectedAt + 2, maxAutomatic: 16, experimentConcurrency: 2 });
    const ledger = (out.built.results && out.built.results.obligationLedger) || [];
    const inScopeRows = ledger.filter((r) => inScope.has(r.sc));
    const sc = (c.sc || [])[0];
    bySc[sc] = bySc[sc] || { total: 0, covered: 0 };
    bySc[sc].total++;
    const hit = inScopeRows.length > 0;
    if (hit) { covered++; bySc[sc].covered++; }
  }
  alloc.close(); await browser.close();
  console.log(`\n=== FINAL obligation coverage of the original 29 FN noObligation cases ===`);
  console.log(`COVERED (now enumerate an in-scope obligation): ${covered}/${noOblig.length}  (${(100 * covered / noOblig.length).toFixed(0)}%)\n`);
  console.log('  by SC      covered/total');
  for (const [sc, b] of Object.entries(bySc).sort()) console.log(`  ${sc.padEnd(8)} ${b.covered}/${b.total}${b.covered < b.total ? '   ← still uncovered' : ''}`);
})().catch((e) => { console.error(e.stack || e); process.exit(1); });
