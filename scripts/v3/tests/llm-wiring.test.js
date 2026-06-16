// Harness 3.2 repair (audit D12-1/D11-1/D4-2) — the LLM lane WIRED end-to-end. The authored atomic
// rubrics now reach a prompt via runRubricJudgments (emitting `llm-rubric:<id>` through the judgments
// lane); the injectable multimodal adapter formats messages + parses replies; and the meaning families
// (1.1.1/2.4.4/2.4.6/3.3.3/1.3.1) are enumerated so the rubrics actually SELECT subjects.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const llmAdj = require('../lib/llm-adjudicator.js');
const { loadRubrics } = require('../lib/rubric-loader.js');
const adapter = require('../lib/llm-agent-adapter.js');
const oracle = require('../lib/applicability-oracle.js');
const { buildV3 } = require('../lib/build-v3.js');
const { withPipeline, reseal, promoted } = require('./helpers.js');

const ID = { file: 'p', runId: 'R', pageDigest: 'sha256:d' };
const scope = (xpath) => ({ actionTargetRef: xpath, state: 'fresh-load', action: 'inspect', environment: 'headless-chromium' });

// ============================ meaning families are enumerated (so rubrics can select) ============================
test('the meaning-call families enumerate obligations for the authored rubric SCs', () => {
  const obls = oracle.deriveObligations({ structure: { title: 't' }, elements: [
    { xpath: '/img', role: 'img' }, { xpath: '/a', role: 'link' }, { xpath: '/h2', role: 'heading' }, { xpath: '/in', isFormField: true },
  ] });
  const has = (sc, fam) => obls.some((o) => o.sc === sc && o.claimFamily === fam);
  assert.ok(has('1.1.1', 'non-text-content'), 'img → 1.1.1');
  assert.ok(has('2.4.4', 'link-purpose'), 'link → 2.4.4');
  assert.ok(has('2.4.6', 'heading-descriptive'), 'heading → 2.4.6');
  assert.ok(has('3.3.3', 'error-suggestion'), 'form field → 3.3.3');
  assert.ok(has('1.3.1', 'info-relationships'), 'structure → page-level 1.3.1');
});

// ============================ D12-1: the atomic rubric producer ============================
test('selectRubricSubjects matches an atomic rubric to its SC obligation (auto-PARTIAL only)', () => {
  const { rubrics } = loadRubrics();
  const ledger = [
    { xpath: '/img', sc: '1.1.1', claimFamily: 'non-text-content', disposition: 'PARTIAL', autoPartial: true },
    { xpath: '/done', sc: '1.1.1', claimFamily: 'non-text-content', disposition: 'CLAIM', autoPartial: false },
  ];
  const subs = llmAdj.selectRubricSubjects({ elements: [{ xpath: '/img' }] }, ledger, rubrics);
  assert.ok(subs.some((s) => s.xpath === '/img' && s.rubricId === 'alt-text-adequacy-v0'), 'the 1.1.1 rubric reaches a subject');
  assert.ok(!subs.some((s) => s.xpath === '/done'), 'a CLAIMed obligation is not re-judged');
});

test('runRubricJudgments: the rubric REACHES a prompt and emits an llm-rubric judgment (D12-1)', async () => {
  const { rubrics } = loadRubrics();
  let sawRubric = false;
  const stub = async (messages) => { sawRubric = messages[0].text.includes('alt-text adequacy') || messages[0].text.includes('1.1.1'); return { verdict: 'REPRODUCED', confidence: 'high', summary: 'no alt.', reasoning: 'informative image with empty alt.', evidenceRefs: [] }; };
  const subs = [{ xpath: '/img', sc: '1.1.1', claimFamily: 'non-text-content', rubricId: 'alt-text-adequacy-v0', rubric: rubrics['alt-text-adequacy-v0'], skill: 'name-role-state', element: { xpath: '/img' } }];
  const { judgments } = await llmAdj.runRubricJudgments(subs, { runAgent: stub, ...ID });
  assert.ok(sawRubric, 'the authored rubric text was actually in the prompt');
  assert.equal(judgments.judgments.length, 1);
  const j = judgments.judgments[0];
  assert.equal(j.rubricRef, 'alt-text-adequacy-v0', 'rubricRef → mechanism llm-rubric:<id>');
  assert.equal(j.verdict, 'LIKELY_BARRIER', 'REPRODUCED → LIKELY_BARRIER');
  assert.equal(j.sc, '1.1.1');
});

test('mapToRubricVerdict: v2.9 → rubric vocabulary', () => {
  assert.equal(llmAdj.mapToRubricVerdict('REPRODUCED'), 'LIKELY_BARRIER');
  assert.equal(llmAdj.mapToRubricVerdict('NOT REPRODUCED'), 'LIKELY_OK');
  assert.equal(llmAdj.mapToRubricVerdict('PARTIAL'), 'UNCERTAIN');
  assert.equal(llmAdj.mapToRubricVerdict('N/A'), 'UNCERTAIN');
});

test('end-to-end: a rubric judgment fills its obligation as a PROVISIONAL via llm-rubric:<id> (ungated)', () => {
  const collect = { ...ID, collectedAt: 1, elements: [{ xpath: '/img', role: 'img' }] }; // → 1.1.1 obligation
  const b = withPipeline({ collect, experiments: { ...ID, catalogVersion: '3.0.0-phase0', startedAt: 2, results: [] }, claimProposals: { ...ID, proposals: [] } });
  b.judgments = { ...ID, judgments: [{ judgmentId: 'jud:alt:0', sc: '1.1.1', claimFamily: 'non-text-content', targetXpath: '/img', observationScope: scope('/img'), rubricRef: 'alt-text-adequacy-v0', verdict: 'LIKELY_BARRIER', confidence: 'high' }] };
  const r = buildV3(reseal(b), { authority: promoted([]) });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  const row = r.results.obligationLedger.find((o) => o.sc === '1.1.1' && o.claimFamily === 'non-text-content');
  assert.equal(row.disposition, 'PROVISIONAL');
  assert.equal(row.cleared, false, 'LIKELY_BARRIER → provisional barrier');
  assert.equal(row.provisional.mechanism, 'llm-rubric:alt-text-adequacy-v0', 'the authored rubric IS the mechanism');
});

// ============================ the injectable multimodal adapter ============================
test('parseAgentReply: extracts the strict-JSON verdict from prose; fails closed on a bad verdict', () => {
  assert.equal(adapter.parseAgentReply('Here is my answer:\n```json\n{"verdict":"NOT REPRODUCED","confidence":"high","summary":"ok","reasoning":"because","evidenceRefs":[]}\n```').verdict, 'NOT REPRODUCED');
  assert.equal(adapter.parseAgentReply('{"verdict":"NONSENSE"}'), null);
  assert.equal(adapter.parseAgentReply('no json here'), null);
});

test('makeRunAgent: maps messages → API content + parses the reply (mock transport, no network)', async () => {
  const seen = {};
  const transport = async (req) => { seen.req = req; return { content: [{ type: 'text', text: '{"verdict":"REPRODUCED","confidence":"medium","summary":"s","reasoning":"r","evidenceRefs":["e1"]}' }] }; };
  const runAgent = adapter.makeRunAgent({ transport, model: 'claude-test' });
  const out = await runAgent([{ type: 'text', text: 'judge this' }, { type: 'image', data: 'BASE64', mediaType: 'image/png' }], {});
  assert.equal(out.verdict, 'REPRODUCED');
  assert.equal(seen.req.model, 'claude-test');
  const content = seen.req.messages[0].content;
  assert.equal(content[0].type, 'text');
  assert.equal(content[1].type, 'image');
  assert.equal(content[1].source.data, 'BASE64', 'the crop is forwarded to the multimodal API');
});

test('makeAnthropicTransport: posts to the API with the key (mock fetch); a non-OK response → null', async () => {
  const calls = [];
  const fetchImpl = async (url, opts) => { calls.push({ url, opts }); return { ok: true, json: async () => ({ content: [{ type: 'text', text: '{"verdict":"PARTIAL"}' }] }) }; };
  const transport = adapter.makeAnthropicTransport({ apiKey: 'sk-test', fetchImpl });
  const res = await transport({ model: 'm', messages: [] });
  assert.equal(res.content[0].text, '{"verdict":"PARTIAL"}');
  assert.equal(calls[0].opts.headers['x-api-key'], 'sk-test');
  // a non-OK HTTP response degrades to null (producer drops it), never throws.
  const t2 = adapter.makeAnthropicTransport({ apiKey: 'sk-test', fetchImpl: async () => ({ ok: false, status: 429 }) });
  assert.equal(await t2({ messages: [] }), null);
  // no key → constructing the transport throws (so a misconfig is loud, not a silent no-op).
  assert.throws(() => adapter.makeAnthropicTransport({ fetchImpl }), /apiKey required/);
});

test('the default runAgent is absent — runRubricJudgments without one REFUSES (no accidental API call)', async () => {
  const { rubrics } = loadRubrics();
  const subs = [{ xpath: '/img', sc: '1.1.1', claimFamily: 'non-text-content', rubricId: 'alt-text-adequacy-v0', rubric: rubrics['alt-text-adequacy-v0'], skill: 'name-role-state', element: { xpath: '/img' } }];
  const { judgments } = await llmAdj.runRubricJudgments(subs, { ...ID }); // no runAgent
  assert.equal(judgments.judgments.length, 0);
});

// ============================ orchestrator e2e: the FULL wired lane (Chrome) ============================
const fs = require('node:fs');
const path = require('node:path');
const { orchestrate } = require('../lib/orchestrator.js');
const { CHROME } = require('../lib/run-experiments.js');
const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — llm-wiring orchestrator e2e SKIPPED');
const FXV = 'file://' + path.join(__dirname, '..', '..', '..', 'assets', 'saved', 'fx-v3-vision.html');

test('orchestrate(runLlm): captures vision + runs BOTH producers; a rubric judgment fills a PROVISIONAL (D11-1/D12-1)', { skip: !chromeOK, concurrency: false }, async () => {
  // the img (#hero, empty alt) yields a 1.1.1 obligation the alt-text rubric judges; xpath matches the fixture.
  const collect = { ...ID, collectedAt: 1000, structure: { title: 'vision fixture' }, elements: [{ xpath: '//*[@id="hero"]', role: 'img' }] };
  const stub = async () => ({ verdict: 'REPRODUCED', confidence: 'high', summary: 'the image has no text alternative.', reasoning: 'informative image, empty alt.', evidenceRefs: [] });
  const { bundle, built } = await orchestrate(collect, { elements: [] }, {
    resolveUrl: () => FXV, now: 2000, runLlm: true, runAgent: stub, captureVision: true, provisionalMode: 'ungated',
  });
  assert.equal(built.ok, true, JSON.stringify(built.errors));
  assert.ok(bundle.judgments && bundle.judgments.judgments.some((j) => j.rubricRef === 'alt-text-adequacy-v0'), 'the atomic rubric ran via the orchestrator');
  // BOTH producers (llm-agent whole-obligation + llm-rubric atomic) opined; the 1.1.1 obligation is
  // filled PROVISIONAL barrier, and the atomic rubric mechanism contributed (it is in supportRefs).
  const row = built.results.obligationLedger.find((o) => o.sc === '1.1.1' && o.claimFamily === 'non-text-content');
  assert.equal(row.disposition, 'PROVISIONAL');
  assert.equal(row.cleared, false);
  assert.ok(row.provisional.supportRefs.includes('llm-rubric:alt-text-adequacy-v0'), `the atomic rubric contributed — supportRefs=${JSON.stringify(row.provisional.supportRefs)}`);
  // vision was captured for the img and rode the side llmVision artifact (never in results).
  assert.ok(bundle.llmVision && bundle.llmVision.images.some((im) => im.xpath === '//*[@id="hero"]'), 'a real element-crop was captured');
  assert.ok(!JSON.stringify(built.results).includes(bundle.llmVision.images[0].data), 'crops never reach results');
});

// ============================ adversarial repair regressions ============================
test('adversarial MED: judgments parity — observationScope.actionTargetRef must equal targetXpath', () => {
  const judgments = require('../lib/judgments.js');
  const j = { judgmentId: 'j1', sc: '1.1.1', targetXpath: '/a', observationScope: { actionTargetRef: '/b', state: 'fresh-load', action: 'inspect', environment: 'headless-chromium' }, rubricRef: 'r', verdict: 'LIKELY_OK' };
  assert.ok(judgments.processJudgments({ judgments: [j] }).errors.some((m) => /must equal targetXpath/.test(m)), 'a forged judgment binding the wrong element is rejected (sole gate on the un-hashed artifact)');
});

test('adversarial MED: parseAgentReply takes the FIRST balanced object — a trailing brace does not drop the verdict', () => {
  const text = 'Here is my answer:\n```json\n{"verdict":"NOT REPRODUCED","confidence":"high","summary":"s","reasoning":"r","evidenceRefs":[]}\n```\nNote: consider the set {a, b}.';
  assert.equal(adapter.parseAgentReply(text).verdict, 'NOT REPRODUCED', 'the greedy match would have over-captured to the final brace and dropped this');
  assert.equal(adapter.parseAgentReply('{"verdict":"REPRODUCED","summary":"contains a brace } in a string"}').verdict, 'REPRODUCED', 'string-literal braces handled');
});

test('adversarial LOW: makeAnthropicTransport degrades to null on a thrown fetch / json error (honors its docstring)', async () => {
  assert.equal(await adapter.makeAnthropicTransport({ apiKey: 'k', fetchImpl: async () => { throw new Error('aborted'); } })({ messages: [] }), null);
  assert.equal(await adapter.makeAnthropicTransport({ apiKey: 'k', fetchImpl: async () => ({ ok: true, json: async () => { throw new Error('bad json'); } }) })({ messages: [] }), null);
});

test('adversarial LOW: a legacy-token rubric id is DROPPED, not made to abort the whole build', async () => {
  const subs = [{ xpath: '/img', sc: '1.1.1', claimFamily: 'non-text-content', rubricId: 'N/A', rubric: { sc: '1.1.1', text: 'x', visionEvidence: [] }, skill: 'name-role-state', element: { xpath: '/img' } }];
  const stub = async () => ({ verdict: 'REPRODUCED', confidence: 'high', summary: 's', reasoning: 'r', evidenceRefs: [] });
  const { judgments } = await llmAdj.runRubricJudgments(subs, { runAgent: stub, ...ID });
  assert.equal(judgments.judgments.length, 0, 'the degenerate rubric is skipped — no N/A rubricRef to reject the artifact');
});

// ============================ partition by construction (no duplicate eval) ============================
test('partition: selectSubjects skips SCs an atomic rubric OWNS, keeps rubric-less SCs as the agent fallback', () => {
  const { rubrics } = loadRubrics();
  const ownedScs = new Set(Object.values(rubrics).filter((r) => r && r.sc).map((r) => r.sc));
  const collect = { elements: [{ xpath: '/img' }, { xpath: '/btn' }] };
  const ledger = [
    { xpath: '/img', sc: '1.1.1', claimFamily: 'non-text-content', autoPartial: true }, // OWNED by alt-text-adequacy-v0
    { xpath: '/btn', sc: '4.1.2', claimFamily: 'name-role-value', autoPartial: true },   // rubric-less → agent is the filler
  ];
  const subs = llmAdj.selectSubjects(collect, ledger, { ownedScs });
  assert.ok(!subs.some((s) => s.sc === '1.1.1'), 'the whole-obligation agent does NOT fire on a cell the rubric owns');
  assert.ok(subs.some((s) => s.sc === '4.1.2'), 'the agent IS the fallback on a rubric-less SC (one of 2.1.1/1.4.3/4.1.2/2.1.2)');
});

test('partition: agent + rubric select DISJOINT (xpath,sc) cells over one ledger — the tie-break can never fire on agreement', () => {
  const { rubrics } = loadRubrics();
  const ownedScs = new Set(Object.values(rubrics).filter((r) => r && r.sc).map((r) => r.sc));
  const collect = { elements: [{ xpath: '/img' }] };
  const ledger = [{ xpath: '/img', sc: '1.1.1', claimFamily: 'non-text-content', autoPartial: true }];
  const agentCells = new Set(llmAdj.selectSubjects(collect, ledger, { ownedScs }).map((s) => `${s.xpath}::${s.sc}`));
  const rubricCells = new Set(llmAdj.selectRubricSubjects(collect, ledger, rubrics, {}).map((s) => `${s.xpath}::${s.sc}`));
  assert.equal([...agentCells].filter((c) => rubricCells.has(c)).length, 0, 'no (xpath,sc) cell is judged by BOTH producers');
  assert.ok(rubricCells.has('/img::1.1.1'), 'the rubric owns the overlap cell');
  assert.equal(agentCells.size, 0, 'the agent emits nothing on a ledger of only rubric-owned SCs');
});

test('partition: WITHOUT ownedScs (legacy/direct callers) selectSubjects is unchanged — agent still fires on every auto-PARTIAL SC', () => {
  const collect = { elements: [{ xpath: '/img' }] };
  const ledger = [{ xpath: '/img', sc: '1.1.1', claimFamily: 'non-text-content', autoPartial: true }];
  assert.ok(llmAdj.selectSubjects(collect, ledger).some((s) => s.sc === '1.1.1'), 'backward compatible: no ownedScs ⇒ no exclusion');
});
