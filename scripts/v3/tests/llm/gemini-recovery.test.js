'use strict';
// Gemini-lane recovery paths (the fix for the FN×LLM finding that gemini produced ~10× more `noVerdict` than claude).
// Two failure modes, both of which used to degrade to null (→ noVerdict) and now recover:
//   (1) MAX_TOKENS — gemini-flash spends its whole output budget on internal thinking and emits NO usable output.
//       Both transports DOUBLE the budget once (capped at GEMINI_MAXTOK_CEIL) and re-issue the same request.
//   (2) tool-loop empty conclusion — the function-calling loop ends with empty text (no tool call, no answer). The
//       tool transport makes ONE forced tools-off call demanding ONLY the JSON verdict from the gathered evidence.
const test = require('node:test');
const assert = require('node:assert');
const { makeGeminiTransport, makeGeminiToolTransport, makeGeminiCacheManager, makeRunAgent, looksDegenerate } = require('../../lib/llm-agent-adapter.js');

// a fake fetch driven by a queue of Gemini response objects (`j`). Records the PARSED request body of every call so
// tests can assert maxOutputTokens doubling and tools-on/off. status 200 unless the queued item carries {__status}.
function fakeFetch(queue) {
  const requests = [];
  const calls = [];
  const f = async (url, opts) => {
    calls.push({ url, headers: opts.headers });
    requests.push(opts.body ? JSON.parse(opts.body) : null);
    const item = queue[requests.length - 1];
    if (item && item.__status) return { status: item.__status, ok: false, json: async () => ({}) };
    return { status: 200, ok: true, json: async () => item };
  };
  f.requests = requests;
  f.calls = calls;
  return f;
}
const cand = (parts, finishReason = 'STOP') => ({ candidates: [{ content: { parts }, finishReason }], usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1 } });
const ixUsage = (input = 1, output = 1, thought = 0, cached = 0) => ({
  total_input_tokens: input, total_output_tokens: output, total_thought_tokens: thought, total_cached_tokens: cached
});
const interaction = (id, steps, status = 'completed', usage = ixUsage()) => ({ id, status, steps, usage });
const functionCall = (name, args = {}, id = `call-${name}`) => ({ type: 'function_call', name, arguments: args, id });
const modelOutput = (text) => ({ type: 'model_output', content: text ? [{ type: 'text', text }] : [] });
const finishCall = (id = 'call-finish') => functionCall('finish_evidence_collection', {}, id);
const textJson = (v = 'REPRODUCED') => JSON.stringify({ verdict: v, confidence: 'high', summary: 's', reasoning: 'r', evidenceRefs: [] });
const REQ = { messages: [{ content: [{ type: 'text', text: 'judge this' }] }] };
const HYBRID_REQ = { subject: { sc: '2.4.4', rubricId: 'link-purpose-v0', toolMode: 'auto' }, messages: [{ content: [
  { type: 'text', text: 'stable rubric prefix\n--- case-specific evidence (not part of the reusable prefix) ---\ndynamic xpath and signals' }
] }] };
const DISPATCH = { declarations: [{ name: 'noop', description: 'x', parameters: { type: 'object', properties: {} } }], call: async () => ({ ok: true }) };
const run = (t) => t(REQ, {});

test('Gemini effort uses provider-native thinking fields; Interactions splits low selection from medium final', async () => {
  const singleFetch = fakeFetch([cand([{ text: textJson() }])]);
  await run(makeGeminiTransport({ apiKey: 'k', fetchImpl: singleFetch, effort: 'medium' }));
  assert.deepEqual(singleFetch.requests[0].generationConfig.thinkingConfig, { thinkingLevel: 'MEDIUM' });

  const toolFetch = fakeFetch([
    interaction('select-1', [finishCall()]),
    interaction('final-1', [modelOutput(textJson())])
  ]);
  await run(makeGeminiToolTransport({ apiKey: 'k', fetchImpl: toolFetch, dispatch: DISPATCH, effort: 'medium' }));
  assert.equal(toolFetch.requests[0].generation_config.thinking_level, 'low', 'tool selection is intentionally low-thinking');
  assert.equal(toolFetch.requests[1].generation_config.thinking_level, 'medium', 'the tools-off verdict uses configured effort');
  assert.equal(toolFetch.requests[0].generation_config.tool_choice, 'any');
  assert.ok(!toolFetch.requests[1].tools, 'the verdict phase cannot call tools');
  assert.match(toolFetch.calls[0].url, /\/v1beta\/interactions$/, 'tool loop uses the stateful Interactions endpoint');
  assert.equal(toolFetch.calls[0].headers['x-goog-api-key'], 'k');
  assert.equal(toolFetch.requests[0].store, true);
  assert.equal(toolFetch.requests[1].previous_interaction_id, 'select-1');
});

test('Gemini uses provider sampling defaults unless a retry explicitly perturbs temperature', async () => {
  const singleFetch = fakeFetch([cand([{ text: textJson() }])]);
  await run(makeGeminiTransport({ apiKey: 'k', fetchImpl: singleFetch }));
  assert.equal(Object.hasOwn(singleFetch.requests[0].generationConfig, 'temperature'), false);

  const toolFetch = fakeFetch([interaction('selection', [finishCall()]), interaction('final', [modelOutput(textJson())])]);
  await run(makeGeminiToolTransport({ apiKey: 'k', fetchImpl: toolFetch, dispatch: DISPATCH }));
  assert.equal(Object.hasOwn(toolFetch.requests[0].generation_config, 'temperature'), false);
  assert.equal(Object.hasOwn(toolFetch.requests[1].generation_config, 'temperature'), false);
});

test('single-shot: MAX_TOKENS with empty output DOUBLES the budget once and re-issues', async () => {
  const f = fakeFetch([cand([], 'MAX_TOKENS'), cand([{ text: textJson() }], 'STOP')]);
  const t = makeGeminiTransport({ apiKey: 'k', fetchImpl: f, maxOutputTokens: 4096 });
  const out = await run(t);
  assert.equal(f.requests.length, 2, 'should re-issue once after MAX_TOKENS');
  assert.equal(f.requests[0].generationConfig.maxOutputTokens, 4096, 'first call uses the base budget');
  assert.equal(f.requests[1].generationConfig.maxOutputTokens, 8192, 'retry DOUBLES the budget');
  assert.match(out.content[0].text, /REPRODUCED/, 'returns the recovered verdict text');
});

test('single-shot: doubling is capped at GEMINI_MAXTOK_CEIL and happens only ONCE', async () => {
  // base 16384 → doubled would be 32768 but is capped to 16384; and only one re-issue even if still MAX_TOKENS.
  const f = fakeFetch([cand([], 'MAX_TOKENS'), cand([], 'MAX_TOKENS'), cand([{ text: textJson() }])]);
  const t = makeGeminiTransport({ apiKey: 'k', fetchImpl: f, maxOutputTokens: 16384 });
  const out = await run(t);
  assert.equal(f.requests.length, 2, 'only ONE doubling re-issue (no infinite loop)');
  assert.equal(f.requests[1].generationConfig.maxOutputTokens, 16384, 'doubling is capped at the ceiling');
  assert.equal(out, null, 'still-empty after the one retry ⇒ degrade to null');
});

test('single-shot: V3_GEMINI_MAXTOK_DOUBLE=0 opts out of doubling', async () => {
  const prev = process.env.V3_GEMINI_MAXTOK_DOUBLE; process.env.V3_GEMINI_MAXTOK_DOUBLE = '0';
  try {
    const f = fakeFetch([cand([], 'MAX_TOKENS'), cand([{ text: textJson() }])]);
    const t = makeGeminiTransport({ apiKey: 'k', fetchImpl: f, maxOutputTokens: 4096 });
    const out = await run(t);
    assert.equal(f.requests.length, 1, 'no re-issue when opted out');
    assert.equal(out, null);
  } finally { if (prev === undefined) delete process.env.V3_GEMINI_MAXTOK_DOUBLE; else process.env.V3_GEMINI_MAXTOK_DOUBLE = prev; }
});

test('tool transport: MAX_TOKENS on a tool turn DOUBLES the budget and re-issues', async () => {
  const f = fakeFetch([
    interaction('incomplete-1', [], 'incomplete'),
    interaction('select-2', [finishCall()]),
    interaction('final-2', [modelOutput(textJson('NOT REPRODUCED'))])
  ]);
  const t = makeGeminiToolTransport({ apiKey: 'k', fetchImpl: f, dispatch: DISPATCH, maxOutputTokens: 8192 });
  const out = await run(t);
  assert.equal(f.requests[0].generation_config.max_output_tokens, 8192);
  assert.equal(f.requests[1].generation_config.max_output_tokens, 16384, 'doubled');
  assert.match(out.content[0].text, /NOT REPRODUCED/);
});

test('tool transport: empty final answer triggers a forced TOOLS-OFF conclusion (not a null/noVerdict)', async () => {
  const f = fakeFetch([
    interaction('select-empty', []),
    interaction('final-partial', [modelOutput(textJson('PARTIAL'))])
  ]);
  const t = makeGeminiToolTransport({ apiKey: 'k', fetchImpl: f, dispatch: DISPATCH });
  const out = await run(t);
  assert.equal(f.requests.length, 2, 'one tool-selection turn + one forced conclusion');
  assert.ok(!f.requests[1].tools, 'the conclusion call disables tools');
  assert.equal(f.requests[1].previous_interaction_id, 'select-empty');
  const concludeText = JSON.stringify(f.requests[1].input);
  assert.match(concludeText, /ONLY the final JSON verdict/, 'the conclusion prompt demands ONLY the JSON');
  assert.match(out.content[0].text, /PARTIAL/, 'returns the concluded verdict');
});

test('tool transport: a base64 screenshot in a tool result is lifted to an inlineData image part (not boxed in the Struct)', async () => {
  // A long base64 string simulates capture_full_page's `screenshot`. It must leave the JSON result text and ride as
  // a native Interactions image block in the matching function_result so the model sees pixels rather than base64.
  const bigB64 = 'iVBORw0KGgo' + 'A'.repeat(2000);
  const f = fakeFetch([
    interaction('capture-turn', [functionCall('capture_full_page', {}, 'capture-1')]),
    interaction('finish-turn', [finishCall('finish-1')]),
    interaction('final-turn', [modelOutput(textJson())])
  ]);
  const dispatch = { declarations: DISPATCH.declarations, call: async () => ({ screenshot: bigB64, scaleUsed: 2, note: 'ok' }) };
  const t = makeGeminiToolTransport({ apiKey: 'k', fetchImpl: f, dispatch });
  const out = await run(t);
  assert.match(out.content[0].text, /REPRODUCED/, 'concludes normally after seeing the image');
  const fr = f.requests[1].input.find((s) => s.type === 'function_result');
  assert.equal(fr.call_id, 'capture-1', 'the exact function call ID is returned');
  assert.equal(fr.name, 'capture_full_page');
  assert.ok(!/iVBORw0KGgo/.test(JSON.stringify(fr.result.find((c) => c.type === 'text'))), 'base64 is not boxed in result text');
  assert.match(fr.result.find((c) => c.type === 'text').text, /attached as an image part/, 'replaced with a placeholder note');
  const img = fr.result.find((c) => c.type === 'image');
  assert.ok(img && img.data === bigB64, 'the screenshot rides as a native image result block');
  assert.equal(img.mime_type, 'image/png');
});

test('tool transport: V3_GEMINI_TOOL_IMAGES=0 opts out (string-boxed behavior)', async () => {
  const prev = process.env.V3_GEMINI_TOOL_IMAGES; process.env.V3_GEMINI_TOOL_IMAGES = '0';
  try {
    const bigB64 = 'iVBORw0KGgo' + 'B'.repeat(2000);
    const f = fakeFetch([
      interaction('capture-turn', [functionCall('capture_full_page', {}, 'capture-1')]),
      interaction('finish-turn', [finishCall()]),
      interaction('final-turn', [modelOutput(textJson())])
    ]);
    const dispatch = { declarations: DISPATCH.declarations, call: async () => ({ screenshot: bigB64 }) };
    await run(makeGeminiToolTransport({ apiKey: 'k', fetchImpl: f, dispatch }));
    const result = f.requests[1].input[0].result;
    assert.ok(/iVBORw0KGgo/.test(JSON.stringify(result)), 'opted out ⇒ base64 stays boxed in result text');
    assert.ok(!result.some((p) => p.type === 'image'), 'no image result block when opted out');
  } finally { if (prev === undefined) delete process.env.V3_GEMINI_TOOL_IMAGES; else process.env.V3_GEMINI_TOOL_IMAGES = prev; }
});

test('tool transport: a normal tool call still flows (recovery does not disturb the happy path)', async () => {
  const f = fakeFetch([
    interaction('tool-turn', [functionCall('noop', {}, 'noop-1')]),
    interaction('finish-turn', [finishCall()]),
    interaction('final-turn', [modelOutput(textJson())])
  ]);
  const t = makeGeminiToolTransport({ apiKey: 'k', fetchImpl: f, dispatch: DISPATCH });
  const out = await run(t);
  assert.equal(f.requests.length, 3, 'tool call, finish selection, then medium final verdict');
  assert.ok(f.requests[0].tools, 'tools offered on the first turn');
  assert.equal(f.requests[1].previous_interaction_id, 'tool-turn');
  assert.equal(f.requests[2].previous_interaction_id, 'finish-turn');
  assert.match(out.content[0].text, /REPRODUCED/);
});

test('tool transport: parallel function results preserve count, order, IDs, and names exactly', async () => {
  const f = fakeFetch([
    interaction('parallel-turn', [
      functionCall('noop', { n: 1 }, 'parallel-1'),
      functionCall('noop', { n: 2 }, 'parallel-2'),
      finishCall('parallel-finish')
    ]),
    interaction('parallel-final', [modelOutput(textJson())])
  ]);
  await run(makeGeminiToolTransport({ apiKey: 'k', fetchImpl: f, dispatch: DISPATCH }));
  assert.deepEqual(f.requests[1].input.map((r) => [r.call_id, r.name]), [
    ['parallel-1', 'noop'], ['parallel-2', 'noop'], ['parallel-finish', 'finish_evidence_collection']
  ]);
  assert.equal(f.requests[1].input.length, 3, 'one result is returned for every parallel call');
});

test('tool transport: the evidence-call budget forces a medium conclusion without another exploratory turn', async () => {
  let dispatched = 0;
  const f = fakeFetch([
    interaction('tool-turn', [functionCall('noop', {}, 'noop-budget')]),
    interaction('final-turn', [modelOutput(textJson())])
  ]);
  const dispatch = { declarations: DISPATCH.declarations, call: async () => { dispatched++; return { ok: true }; } };
  const out = await run(makeGeminiToolTransport({ apiKey: 'k', fetchImpl: f, dispatch, toolCallBudget: 1 }));
  assert.equal(dispatched, 1);
  assert.equal(f.requests.length, 2);
  assert.ok(!f.requests[1].tools, 'budget exhaustion forces tools off');
  assert.equal(f.requests[1].generation_config.thinking_level, 'medium');
  assert.match(out.content[0].text, /REPRODUCED/);
});

test('tool transport: V3_GEMINI_FORCE_CONCLUDE=0 opts out (empty ⇒ null)', async () => {
  const prev = process.env.V3_GEMINI_FORCE_CONCLUDE; process.env.V3_GEMINI_FORCE_CONCLUDE = '0';
  try {
    const f = fakeFetch([interaction('empty-selection', [])]);
    const t = makeGeminiToolTransport({ apiKey: 'k', fetchImpl: f, dispatch: DISPATCH });
    const out = await run(t);
    assert.equal(out, null, 'no forced conclusion when opted out');
  } finally { if (prev === undefined) delete process.env.V3_GEMINI_FORCE_CONCLUDE; else process.env.V3_GEMINI_FORCE_CONCLUDE = prev; }
});

// --- durable noVerdict logging (the diagnostic that was missing when the FN run produced 18 un-diagnosable noVerdicts) ---
// Capture process.stderr.write, run a runAgent over a transport that degrades, and assert ONE [v3:noVerdict] line is
// emitted carrying the classified reason + the transport's mechanism (mode/finishReason from the transportFail event).
function captureStderr(fn) {
  const lines = []; const orig = process.stderr.write;
  process.stderr.write = (s) => { lines.push(String(s)); return true; };
  return Promise.resolve().then(fn).finally(() => { process.stderr.write = orig; }).then(() => lines.join(''));
}
const noVerdictLine = (buf) => { const m = buf.split('\n').find((l) => l.startsWith('[v3:noVerdict] ')); return m ? JSON.parse(m.slice('[v3:noVerdict] '.length)) : null; };

test('noVerdict log: gemini MAX_TOKENS-empty degrade ⇒ transport-null with the finishReason mechanism', async () => {
  // single-shot returns empty twice (MAX_TOKENS) → degrades to null after the one doubling. runAgent must log it.
  const buf = await captureStderr(async () => {
    const f = fakeFetch([cand([], 'MAX_TOKENS'), cand([], 'MAX_TOKENS')]);
    const t = makeGeminiTransport({ apiKey: 'k', fetchImpl: f, maxOutputTokens: 16384 }); // base=ceil so only one re-issue
    const agent = makeRunAgent({ transport: t });
    const out = await agent([{ type: 'text', text: 'judge' }], { sc: '1.3.1', skill: 'grouping-and-reading-order', xpath: '/html/body/table[1]' });
    assert.equal(out, null, 'degrades to noVerdict');
  });
  const rec = noVerdictLine(buf);
  assert.ok(rec, 'emitted exactly one [v3:noVerdict] line');
  assert.equal(rec.reason, 'transport-null');
  assert.equal(rec.provider, 'gemini');
  assert.equal(rec.mode, 'maxtokens-empty');
  assert.equal(rec.finishReason, 'MAX_TOKENS');
  assert.equal(rec.sc, '1.3.1');
});

test('noVerdict log: a non-JSON reply that survives the reformat retry ⇒ unparseable-envelope with a preview', async () => {
  const buf = await captureStderr(async () => {
    // both the first call and the reformat retry return prose (no JSON) ⇒ parse fails twice ⇒ noVerdict.
    const f = fakeFetch([cand([{ text: 'I think this looks fine, no issues here.' }]), cand([{ text: 'still no json' }])]);
    const t = makeGeminiTransport({ apiKey: 'k', fetchImpl: f });
    const agent = makeRunAgent({ transport: t });
    const out = await agent([{ type: 'text', text: 'judge' }], { sc: '2.4.4' });
    assert.equal(out, null);
  });
  const rec = noVerdictLine(buf);
  assert.ok(rec, 'emitted a [v3:noVerdict] line');
  assert.equal(rec.reason, 'unparseable-envelope');
  assert.equal(rec.reformatRetried, true, 'the reformat retry was attempted');
  assert.match(rec.preview, /looks fine/, 'the original reply preview is captured');
});

test('noVerdict log: V3_NOVERDICT_LOG=0 opts out', async () => {
  const prev = process.env.V3_NOVERDICT_LOG; process.env.V3_NOVERDICT_LOG = '0';
  try {
    const buf = await captureStderr(async () => {
      const f = fakeFetch([cand([], 'MAX_TOKENS'), cand([], 'MAX_TOKENS')]);
      const t = makeGeminiTransport({ apiKey: 'k', fetchImpl: f, maxOutputTokens: 16384 });
      await makeRunAgent({ transport: t })([{ type: 'text', text: 'j' }], { sc: '1.3.1' });
    });
    assert.equal(noVerdictLine(buf), null, 'no log line when opted out');
  } finally { if (prev === undefined) delete process.env.V3_NOVERDICT_LOG; else process.env.V3_NOVERDICT_LOG = prev; }
});

// --- degeneration-loop detector + perturbed retry (the "0000…" repetition-collapse fix) ---
const longZeros = '0'.repeat(8192);

test('looksDegenerate: ADVERSARIAL — flags repetition collapse, NOT valid output', () => {
  // positives (collapse): a long single-char run, a dominant char, a short repeated unit
  assert.equal(looksDegenerate(longZeros), true, 'a long run of one char');
  assert.equal(looksDegenerate('ababab'.repeat(200)), true, 'a short repeated unit (a/b dominate)');
  assert.equal(looksDegenerate('x '.repeat(300)), true, 'one char dominating after whitespace strip');
  // negatives (legitimate): a real verdict, normal prose reasoning, short replies
  assert.equal(looksDegenerate(textJson()), false, 'a normal JSON verdict is not degenerate');
  assert.equal(looksDegenerate('The image renders the W3C logo but its alt text incorrectly identifies it as the ERCIM logo, which misinforms assistive-technology users about the brand depicted.'.repeat(2)), false, 'normal prose is not degenerate');
  assert.equal(looksDegenerate('0000'), false, 'short string never degenerate');
  assert.equal(looksDegenerate(null), false);
});

test('degeneration retry: a "0000…" reply triggers a PERTURBED (higher-temperature) re-issue that parses', async () => {
  const f = fakeFetch([cand([{ text: longZeros }]), cand([{ text: textJson() }])]);
  const t = makeGeminiTransport({ apiKey: 'k', fetchImpl: f, temperature: 0 });
  const out = await makeRunAgent({ transport: t })([{ type: 'text', text: 'judge' }], { sc: '2.4.4' });
  assert.equal(f.requests.length, 2, 're-issues the ORIGINAL request once');
  assert.equal(f.requests[0].generationConfig.temperature, 0, 'first call at base temperature');
  assert.ok(f.requests[1].generationConfig.temperature > 0, 'the retry PERTURBS the temperature to break the loop');
  assert.equal(out.verdict, 'REPRODUCED', 'the perturbed retry recovers a parseable verdict');
  assert.equal(out.degenRetried, true, 'flagged as recovered via the degeneration retry');
});

test('degeneration retry: V3_DEGEN_RETRY=0 opts out (no perturbed re-issue)', async () => {
  const prev = process.env.V3_DEGEN_RETRY; process.env.V3_DEGEN_RETRY = '0';
  try {
    const f = fakeFetch([cand([{ text: longZeros }]), cand([{ text: textJson() }])]);
    const out = await makeRunAgent({ transport: makeGeminiTransport({ apiKey: 'k', fetchImpl: f }) })([{ type: 'text', text: 'j' }], { sc: '2.4.4' });
    assert.equal(out, null, 'opted out ⇒ degrades (no perturbed retry, reformat skipped on degenerate text)');
    assert.equal(f.requests.length, 1, 'no re-issue when opted out');
  } finally { if (prev === undefined) delete process.env.V3_DEGEN_RETRY; else process.env.V3_DEGEN_RETRY = prev; }
});

test('degeneration retry: a STILL-degenerate retry ⇒ null logged as degenerate-loop (no reformat on garbage)', async () => {
  const buf = await captureStderr(async () => {
    const f = fakeFetch([cand([{ text: longZeros }]), cand([{ text: '1'.repeat(8192) }])]); // both collapse
    const out = await makeRunAgent({ transport: makeGeminiTransport({ apiKey: 'k', fetchImpl: f }) })([{ type: 'text', text: 'j' }], { sc: '2.4.4', skill: 'name-role-state' });
    assert.equal(out, null, 'still-degenerate after the perturbed retry ⇒ null (reformat is skipped on garbage)');
    assert.equal(f.requests.length, 2, 'one perturbed retry, then give up — NOT a reformat round on the garbage');
  });
  const rec = noVerdictLine(buf);
  assert.ok(rec, 'logged');
  assert.equal(rec.reason, 'degenerate-loop', 'classified as a degeneration collapse, not unparseable-envelope');
  assert.equal(rec.degenRetried, true);
});

// Token telemetry: Gemini usage now reaches the PERSISTENT sink (onTraceSink), not just the per-verdict trace. Output
// INCLUDES thinking tokens, and cachedContentTokenCount is mapped to the cache-read field consumed by run telemetry.
test('gemini token usage → onTraceSink; output includes thinking and cached input is tallied', async () => {
  const j = { candidates: [{ content: { parts: [{ text: textJson() }] }, finishReason: 'STOP' }], usageMetadata: { promptTokenCount: 200, candidatesTokenCount: 50, thoughtsTokenCount: 80, cachedContentTokenCount: 120 } };
  const f = fakeFetch([j]);
  const sink = []; const tr = [];
  const t = makeGeminiTransport({ apiKey: 'k', fetchImpl: f, onTraceSink: (e) => sink.push(e) });
  await t(REQ, { onTrace: (e) => tr.push(e) });
  const s = sink.find((e) => e.type === 'result');
  assert.ok(s, 'persistent token sink received a usage event (was previously dropped)');
  assert.deepEqual(s.usage, { input_tokens: 200, output_tokens: 130, cache_read_input_tokens: 120 }, 'output = candidates(50) + thoughts(80); cached input is preserved');
  assert.ok(tr.some((e) => e.type === 'result'), 'the per-verdict trace still gets usage too');
});

test('gemini tool transport tallies cached input independently on every API turn', async () => {
  const toolTurn = interaction('selection', [finishCall()], 'completed', ixUsage(100, 10, 5, 60));
  const finalTurn = interaction('final', [modelOutput(textJson())], 'completed', ixUsage(150, 20, 10, 110));
  const sink = [];
  await run(makeGeminiToolTransport({ apiKey: 'k', fetchImpl: fakeFetch([toolTurn, finalTurn]), dispatch: DISPATCH, onTraceSink: (e) => sink.push(e) }));
  const usage = sink.filter((e) => e.type === 'result').map((e) => e.usage);
  assert.deepEqual(usage, [
    { input_tokens: 100, output_tokens: 15, cache_read_input_tokens: 60 },
    { input_tokens: 150, output_tokens: 30, cache_read_input_tokens: 110 }
  ], 'persistent telemetry can sum cache reads across all multi-turn calls');
});

test('Gemini explicit cache creation is single-flight and resources are deleted eagerly', async () => {
  const calls = [];
  const f = async (url, opts) => {
    calls.push({ url, method: opts.method, body: opts.body ? JSON.parse(opts.body) : null });
    if (opts.method === 'DELETE') return { ok: true, status: 200, json: async () => ({}) };
    await new Promise((resolve) => setTimeout(resolve, 5));
    return { ok: true, status: 200, json: async () => ({ name: 'cachedContents/shared-1', usageMetadata: { totalTokenCount: 4321 } }) };
  };
  const manager = makeGeminiCacheManager({ apiKey: 'k', model: 'gemini-test', fetchImpl: f });
  const args = { prefix: 'same stable prefix', tools: [{ functionDeclarations: DISPATCH.declarations }] };
  const [a, b] = await Promise.all([manager.getOrCreate(args), manager.getOrCreate(args)]);
  assert.equal(calls.filter((c) => c.method === 'POST').length, 1, 'parallel callers create exactly one cache');
  assert.equal(a.name, 'cachedContents/shared-1');
  assert.equal(b.name, a.name);
  assert.equal(a.creationTokens + b.creationTokens, 4321, 'creation tokens are charged once');
  assert.equal(manager.snapshot().reused, 1);
  await manager.close();
  assert.equal(calls.filter((c) => c.method === 'DELETE').length, 1);
  assert.equal(manager.snapshot().deleted, 1);
});

test('hybrid auto route accepts a cached GenerateContent final without starting Interactions', async () => {
  const f = fakeFetch([{ candidates: [{ content: { parts: [{ text: textJson('NOT REPRODUCED') }] } }],
    usageMetadata: { promptTokenCount: 5100, candidatesTokenCount: 40, thoughtsTokenCount: 10, cachedContentTokenCount: 4800 } }]);
  const routes = [];
  const cacheManager = { getOrCreate: async () => ({ name: 'cachedContents/rubric-1', creationTokens: 4096 }), recordRoute: (x) => routes.push(x) };
  const sink = [];
  const out = await makeGeminiToolTransport({ apiKey: 'k', fetchImpl: f, dispatch: DISPATCH, cacheManager, onTraceSink: (e) => sink.push(e) })(HYBRID_REQ, {});
  assert.match(f.calls[0].url, /:generateContent$/);
  assert.equal(f.requests.length, 1, 'no Interactions request was needed');
  assert.equal(f.requests[0].cachedContent, 'cachedContents/rubric-1');
  assert.doesNotMatch(JSON.stringify(f.requests[0].contents), /stable rubric prefix/, 'cached prefix is not resent');
  assert.match(JSON.stringify(f.requests[0].contents), /dynamic xpath and signals/);
  assert.deepEqual(routes, ['final']);
  assert.match(out.content[0].text, /NOT REPRODUCED/);
  assert.deepEqual(sink[0].usage, { input_tokens: 5100, output_tokens: 50, cache_read_input_tokens: 4800, cache_creation_input_tokens: 4096 });
});

test('hybrid auto route treats a GenerateContent function call as escalation and starts a fresh Interactions chain', async () => {
  const f = fakeFetch([
    cand([{ functionCall: { name: 'noop', args: { routeOnly: true } } }]),
    interaction('ix-tool', [functionCall('noop', { live: true }, 'ix-call-1')]),
    interaction('ix-finish', [finishCall('ix-finish-1')]),
    interaction('ix-final', [modelOutput(textJson())])
  ]);
  const dispatched = [];
  const dispatch = { declarations: DISPATCH.declarations, call: async (name, args) => { dispatched.push([name, args]); return { ok: true }; } };
  const routes = [];
  const cacheManager = { getOrCreate: async () => ({ name: 'cachedContents/rubric-2', creationTokens: 0 }), recordRoute: (x) => routes.push(x) };
  const out = await makeGeminiToolTransport({ apiKey: 'k', fetchImpl: f, dispatch, cacheManager })(HYBRID_REQ, {});
  assert.match(f.calls[0].url, /:generateContent$/);
  assert.match(f.calls[1].url, /\/interactions$/);
  assert.equal(f.requests[1].previous_interaction_id, undefined, 'the first Interaction is fresh, not linked across APIs');
  assert.match(JSON.stringify(f.requests[1].input), /stable rubric prefix/, 'fresh chain receives the complete original prompt');
  assert.deepEqual(dispatched, [['noop', { live: true }]], 'the routing function call is never executed');
  assert.equal(f.requests[2].input[0].call_id, 'ix-call-1', 'only the Interaction call id is returned');
  assert.deepEqual(routes, ['escalated']);
  assert.match(out.content[0].text, /REPRODUCED/);
});

test('hybrid auto route escalates positive/partial/low-confidence text instead of trusting a cheap final', async () => {
  const f = fakeFetch([
    cand([{ text: textJson('REPRODUCED') }]),
    interaction('ix-finish', [finishCall()]),
    interaction('ix-final', [modelOutput(textJson('NOT REPRODUCED'))])
  ]);
  const routes = [];
  const cacheManager = { getOrCreate: async () => ({ name: 'cachedContents/rubric-guard', creationTokens: 0 }), recordRoute: (x) => routes.push(x) };
  const out = await makeGeminiToolTransport({ apiKey: 'k', fetchImpl: f, dispatch: DISPATCH, cacheManager })(HYBRID_REQ, {});
  assert.match(f.calls[1].url, /\/interactions$/, 'a claimed barrier receives full Interactions adjudication');
  assert.deepEqual(routes, ['verdictEscalated']);
  assert.match(out.content[0].text, /NOT REPRODUCED/, 'the Interactions verdict, not the cheap positive, is returned');
});

test('declarative toolMode required bypasses the cached first pass', async () => {
  const f = fakeFetch([interaction('required-select', [finishCall()]), interaction('required-final', [modelOutput(textJson())])]);
  const routes = [];
  const cacheManager = { getOrCreate: async () => { throw new Error('must not create a cache'); }, recordRoute: (x) => routes.push(x) };
  const req = { ...HYBRID_REQ, subject: { ...HYBRID_REQ.subject, toolMode: 'required' } };
  await makeGeminiToolTransport({ apiKey: 'k', fetchImpl: f, dispatch: DISPATCH, cacheManager })(req, {});
  assert.match(f.calls[0].url, /\/interactions$/);
  assert.deepEqual(routes, ['requiredBypass']);
});

test('a rejected explicit cache fails open to uncached GenerateContent with the full prompt and tools', async () => {
  const f = fakeFetch([cand([{ text: textJson('NOT REPRODUCED') }])]);
  const routes = [];
  const cacheManager = { getOrCreate: async () => ({ name: null, reason: 'http-400', creationTokens: 0 }), recordRoute: (x) => routes.push(x) };
  await makeGeminiToolTransport({ apiKey: 'k', fetchImpl: f, dispatch: DISPATCH, cacheManager })(HYBRID_REQ, {});
  assert.equal(f.requests[0].cachedContent, undefined);
  assert.match(JSON.stringify(f.requests[0].contents), /stable rubric prefix/);
  assert.ok(f.requests[0].tools && f.requests[0].toolConfig, 'native AUTO function calling remains available');
  assert.deepEqual(routes, ['final']);
});
