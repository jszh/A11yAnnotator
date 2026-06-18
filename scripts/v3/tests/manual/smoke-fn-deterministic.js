'use strict';
// Manual deterministic (no-LLM) smoke: collectActPage + orchestrate over a few FN pages. Validates the
// shared-allocator wiring and that in-scope auto-PARTIAL obligations exist (so the LLM lane will be asked).
const path = require('path');
const puppeteer = require('puppeteer');
const { orchestrate } = require('../../lib/orchestrator.js');
const { createTabAllocator } = require('../../lib/tab-allocator.js');
const { collectActPage, normalizeCollectRoles } = require('../../lib/act-page-collect.js');

const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT = path.join(__dirname, '..', '..', '..', '..');
const SUBSET = path.join(ROOT, 'eval/checker-comparison/act-subset');
const a = require(path.join(SUBSET, 'worklist.json')).bothFail;
const b = require(path.join(SUBSET, 'worklist-proposed.json')).bothFail;
const cases = [a[0], b[0], b.find((c) => c.sc.includes('2.4.4')), b.find((c) => c.sc.includes('4.1.2'))].filter(Boolean);

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const alloc = createTabAllocator({ browser, maxTabs: 8 });
  for (const tc of cases) {
    const url = 'file://' + path.join(SUBSET, tc.localPath);
    const lease = await alloc.acquire();
    let collect;
    try { collect = normalizeCollectRoles(await collectActPage(lease.page, { url, elementCap: 80, file: 'act:' + tc.testcaseId, runId: 'smoke', sourceUrl: tc.url })); }
    finally { await lease.release(); }
    const drive = { file: collect.file, runId: 'smoke', pageDigest: collect.pageDigest, drivenAt: collect.collectedAt + 1, elements: [] };
    const out = await orchestrate(collect, drive, { resolveUrl: () => url, browser, tabAllocator: alloc, now: collect.collectedAt + 2, maxAutomatic: 16, experimentConcurrency: 3 });
    const built = out.built;
    const ledger = (built.results && built.results.obligationLedger) || [];
    const inScope = ledger.filter((r) => tc.sc.includes(r.sc));
    console.log(`\n[${tc.ruleId} sc=${tc.sc.join(',')}] elements=${collect.elementCount} built.ok=${built.ok}`);
    console.log('  obligations total=' + ledger.length + '  autoPartial=' + ledger.filter((r) => r.autoPartial).length);
    console.log('  in-scope obligations=' + inScope.length + '  in-scope autoPartial=' + inScope.filter((r) => r.autoPartial).length);
    if (inScope.length) console.log('  in-scope sample:', JSON.stringify(inScope.slice(0, 3).map((r) => ({ sc: r.sc, fam: r.claimFamily, ap: r.autoPartial, disp: r.disposition }))));
    console.log('  all obligation SCs:', [...new Set(ledger.map((r) => r.sc))].sort().join(','));
  }
  alloc.close(); await browser.close();
  console.log('\nSMOKE OK');
})().catch((e) => { console.error(e.stack || e); process.exit(1); });
