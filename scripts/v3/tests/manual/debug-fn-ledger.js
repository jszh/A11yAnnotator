'use strict';
// Debug: run ONE 2.4.4 FN case through orchestrate with a MOCK agent (no API) and dump the obligation ledger
// the runner's scoreCase reads, to understand why inScopeObligations read 0 despite a 2.4.4 verdict.
const path = require('path');
const puppeteer = require('puppeteer');
const { orchestrate } = require('../../lib/orchestrator.js');
const { createTabAllocator } = require('../../lib/tab-allocator.js');
const { collectActPage, normalizeCollectRoles } = require('../../lib/act-page-collect.js');

const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT = path.join(__dirname, '..', '..', '..', '..');
const SUBSET = path.join(ROOT, 'eval/checker-comparison/act-subset');
const tc = require(path.join(SUBSET, 'worklist-proposed.json')).bothFail.find((c) => c.sc.includes('2.4.4'));

// mock agent mimicking the REAL model's MIXED verdict distribution (which triggered built.ok=false), keyed by sc.
const BY_SC = { '1.4.3': 'NOT REPRODUCED', '4.1.2': 'REPRODUCED', '2.5.8': 'PARTIAL', '2.5.5': 'PARTIAL', '2.4.4': 'REPRODUCED', '2.4.2': 'REPRODUCED', '1.3.1': 'NOT REPRODUCED' };
const mockAgent = async (_messages, subject) => ({ verdict: BY_SC[subject && subject.sc] || 'PARTIAL', confidence: 'high', summary: 'mock', reasoning: 'mock', evidenceRefs: [] });

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const alloc = createTabAllocator({ browser, maxTabs: 8 });
  const url = 'file://' + path.join(SUBSET, tc.localPath);
  const lease = await alloc.acquire();
  const collect = normalizeCollectRoles(await collectActPage(lease.page, { url, elementCap: 80, file: 'act:' + tc.testcaseId, runId: 'dbg', sourceUrl: tc.url }));
  await lease.release();
  const drive = { file: collect.file, runId: 'dbg', pageDigest: collect.pageDigest, drivenAt: collect.collectedAt + 1, elements: [] };
  const out = await orchestrate(collect, drive, {
    resolveUrl: () => url, browser, tabAllocator: alloc, now: collect.collectedAt + 2, maxAutomatic: 16, experimentConcurrency: 3,
    runLlm: true, runAgent: mockAgent, captureVision: true, llmConcurrency: 4,
  });
  console.log('testcase', tc.testcaseId, 'sc', tc.sc.join(','));
  console.log('built.ok=', out.built.ok);
  if (!out.built.ok) console.log('BUILD ERRORS:', JSON.stringify(out.built.errors, null, 2));
  const ledger = (out.built.results && out.built.results.obligationLedger) || [];
  console.log('POST-LLM ledger rows:', ledger.length);
  console.log('all sc in ledger:', [...new Set(ledger.map((r) => r.sc))].sort().join(','));
  console.log('2.4.4 rows:', JSON.stringify(ledger.filter((r) => r.sc === '2.4.4'), null, 2));
  console.log('judgments produced:', (out.bundle.judgments && out.bundle.judgments.judgments || []).map((j) => j.sc + ':' + j.verdict).join(', '));
  console.log('llm verdicts produced:', (out.bundle.llm && out.bundle.llm.verdicts || []).map((v) => v.sc + ':' + v.agentVerdict).join(', '));
  alloc.close(); await browser.close();
})().catch((e) => { console.error(e.stack || e); process.exit(1); });
