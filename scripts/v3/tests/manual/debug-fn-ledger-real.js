'use strict';
// Definitive: ONE 2.4.4 FN case through orchestrate with the REAL SDK agent + vision, then dump the exact
// post-LLM ledger scoreCase reads. Resolves the mock(=1)/real(=0) inScopeObligations discrepancy. ~1 API call set.
const path = require('path');
const puppeteer = require('puppeteer');
const REPO_ROOT = path.join(__dirname, '..', '..', '..', '..');
require('../../lib/load-env.js').loadEnv(REPO_ROOT);
const { orchestrate } = require('../../lib/orchestrator.js');
const { createTabAllocator } = require('../../lib/tab-allocator.js');
const { collectActPage, normalizeCollectRoles } = require('../../lib/act-page-collect.js');
const { makeRunAgent, makeClaudeSdkTransport } = require('../../lib/llm-agent-adapter.js');
const LIMITS = require('../../lib/limits.js');

const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const SUBSET = path.join(REPO_ROOT, 'eval/checker-comparison/act-subset');
const tc = require(path.join(SUBSET, 'worklist-proposed.json')).bothFail.find((c) => c.sc.includes('2.4.4'));
const MODEL = process.env.V3_LLM_MODEL || 'claude-sonnet-4-6';
const runAgent = makeRunAgent({ transport: makeClaudeSdkTransport({ oauthToken: process.env.CLAUDE_CODE_OAUTH_TOKEN, model: MODEL, effort: 'medium', perTurnTimeoutMs: LIMITS.llm.perTurnTimeoutMs, runTimeoutMs: LIMITS.llm.runTimeoutMs }), model: MODEL });

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const alloc = createTabAllocator({ browser, maxTabs: 8 });
  const url = 'file://' + path.join(SUBSET, tc.localPath);
  const lease = await alloc.acquire();
  const collect = normalizeCollectRoles(await collectActPage(lease.page, { url, elementCap: 80, file: 'act:' + tc.testcaseId, runId: 'dbgr', sourceUrl: tc.url }));
  await lease.release();
  const drive = { file: collect.file, runId: 'dbgr', pageDigest: collect.pageDigest, drivenAt: collect.collectedAt + 1, elements: [] };
  const out = await orchestrate(collect, drive, {
    resolveUrl: () => url, browser, tabAllocator: alloc, now: collect.collectedAt + 2, maxAutomatic: 16, experimentConcurrency: 3,
    runLlm: true, runAgent, captureVision: true, llmConcurrency: 6,
  });
  const ledger = (out.built && out.built.results && out.built.results.obligationLedger) || [];
  console.log('built.ok=', out.built.ok, 'ledger rows=', ledger.length);
  if (!out.built.ok) console.log('BUILD ERRORS:', JSON.stringify(out.built.errors, null, 2));
  // dump the judgments' free-text + refs so we can see which field tripped the scanner
  const js = (out.bundle.judgments && out.bundle.judgments.judgments) || [];
  console.log('JUDGMENTS detail:', JSON.stringify(js.map((j) => ({ sc: j.sc, rubric: j.rubricRef, verdict: j.verdict, refs: j.evidenceRefs, summary: j.summary })), null, 2));
  console.log('all sc:', [...new Set(ledger.map((r) => r.sc))].sort().join(','));
  console.log('2.4.4 rows:', JSON.stringify(ledger.filter((r) => r.sc === '2.4.4').map((r) => ({ sc: r.sc, disp: r.disposition, ap: r.autoPartial })), null, 2));
  console.log('judgments:', (out.bundle.judgments && out.bundle.judgments.judgments || []).map((j) => j.sc + ':' + j.verdict).join(', '));
  alloc.close(); await browser.close();
})().catch((e) => { console.error(e.stack || e); process.exit(1); });
