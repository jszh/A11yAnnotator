'use strict';
// Deterministic (no-LLM) check: run orchestrate on the 80af7b keyboard-trap pages and report the 2.1.2
// obligation's disposition — confirms the focusRisk gate enumerates it AND the settle-fixed escape experiment
// now DECIDES (barrier) rather than false-clearing / leaving auto-PARTIAL.
const path = require('path');
const puppeteer = require('puppeteer');
const { orchestrate } = require('../../lib/orchestrator.js');
const { createTabAllocator } = require('../../lib/tab-allocator.js');
const { collectActPage, normalizeCollectRoles } = require('../../lib/act-page-collect.js');
const fs = require('fs');

const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT = path.join(__dirname, '..', '..', '..', '..');
const SUBSET = path.join(ROOT, 'eval/checker-comparison/act-subset');
const traps = JSON.parse(fs.readFileSync(path.join(SUBSET, 'worklist-proposed.json'), 'utf8')).bothFail.filter((c) => c.ruleId === '80af7b');

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const alloc = createTabAllocator({ browser, maxTabs: 6 });
  for (const tc of traps) {
    const url = 'file://' + path.join(SUBSET, tc.localPath);
    const lease = await alloc.acquire();
    const collect = normalizeCollectRoles(await collectActPage(lease.page, { url, elementCap: 80, file: 'act:' + tc.testcaseId, runId: 't', sourceUrl: tc.url }));
    await lease.release();
    const nRisk = (collect.elements || []).filter((e) => e.focusRisk).length;
    const drive = { file: collect.file, runId: 't', pageDigest: collect.pageDigest, drivenAt: collect.collectedAt + 1, elements: [] };
    const out = await orchestrate(collect, drive, { resolveUrl: () => url, browser, tabAllocator: alloc, now: collect.collectedAt + 2, maxAutomatic: 16, experimentConcurrency: 2, runInstruments: true });
    const ledger = (out.built.results && out.built.results.obligationLedger) || [];
    const rows = ledger.filter((r) => r.sc === '2.1.2');
    const trapFindings = ((out.bundle.instruments && out.bundle.instruments.findings) || []).filter((f) => f.sc === '2.1.2');
    console.log(`${tc.testcaseId.slice(0, 8)} focusRisk-els=${nRisk}  trapFindings=${trapFindings.length}[${trapFindings.map((f) => f.kind + (f.review ? '/rev' : '')).join(',')}]  2.1.2-rows [${rows.map((r) => r.disposition + (r.autoPartial ? '/auto' : '') + (r.cleared ? '/clear' : '') + (r.disposition === 'PROVISIONAL' ? '(' + (r.provisional && r.provisional.outcome) + ')' : '')).join(',')}]`);
  }
  alloc.close(); await browser.close();
})().catch((e) => { console.error(e.stack || e); process.exit(1); });
