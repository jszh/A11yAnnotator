'use strict';
// Verify DEFERRED-TODO item A (checker-uncertainty → LLM obligation): kb1m8s is `<div aria-label=…>` — axe
// fires aria-prohibited-attr as INCOMPLETE/4.1.2. Confirm: it surfaces as a checkerFinding, and build-v3
// enumerates a 4.1.2 obligation on that div (auto-PARTIAL → reachable by the LLM) that the oracle did NOT
// statically derive. Deterministic (no LLM).
const path = require('path');
const puppeteer = require('puppeteer');
const { orchestrate } = require('../../lib/orchestrator.js');
const { createTabAllocator } = require('../../lib/tab-allocator.js');
const { collectActPage, normalizeCollectRoles } = require('../../lib/act-page-collect.js');
const oracle = require('../../lib/applicability-oracle.js');

const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT = path.join(__dirname, '..', '..', '..', '..');
const SUB = path.join(ROOT, 'eval/checker-comparison/act-subset');
const AXE = path.join(ROOT, 'axe.min.js');
const tcs = require(path.join(SUB, 'worklist-proposed.json')).bothFail.filter((c) => c.ruleId === 'kb1m8s');

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const alloc = createTabAllocator({ browser, maxTabs: 6 });
  for (const tc of tcs) {
    const url = 'file://' + path.join(SUB, tc.localPath);
    const lease = await alloc.acquire();
    const collect = normalizeCollectRoles(await collectActPage(lease.page, { url, elementCap: 80, file: 'k', runId: 'k', sourceUrl: tc.url, runAxe: true, axePath: AXE }));
    await lease.release();
    const inc = (collect.axeIncomplete || []).filter((v) => (v.wcag || []).some((t) => /wcag412/.test(t)));
    const oracleObls = oracle.deriveObligations(collect).filter((o) => o.sc === '4.1.2');
    const out = await orchestrate(collect, { file: 'k', runId: 'k', pageDigest: collect.pageDigest, drivenAt: collect.collectedAt + 1, elements: [] }, { resolveUrl: () => url, browser, tabAllocator: alloc, now: collect.collectedAt + 2, maxAutomatic: 16, experimentConcurrency: 2 });
    const ledger412 = ((out.built.results && out.built.results.obligationLedger) || []).filter((r) => r.sc === '4.1.2');
    const chkFindings = ((out.bundle.checkerFindings && out.bundle.checkerFindings.findings) || []).filter((f) => f.sc === '4.1.2');
    console.log(`${tc.testcaseId.slice(0, 8)}  axe-incomplete-412=${inc.length}[${inc.map((v) => v.id).join(',')}]  oracle-412-obls=${oracleObls.length}  checker-412-findings=${chkFindings.map((f) => f.kind + ':' + f.ruleId).join(',') || '-'}`);
    console.log(`   ledger 4.1.2: ${ledger412.map((r) => r.xpath + '→' + r.disposition + (r.autoPartial ? '/auto' : '')).join(' | ') || '(none — still noObligation)'}`);
  }
  alloc.close(); await browser.close();
})().catch((e) => { console.error(e.stack || e); process.exit(1); });
