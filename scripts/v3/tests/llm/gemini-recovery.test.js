'use strict';
// Gemini-lane recovery paths (the fix for the FN×LLM finding that gemini produced ~10× more `noVerdict` than claude).
// Two failure modes, both of which used to degrade to null (→ noVerdict) and now recover:
//   (1) MAX_TOKENS — gemini-flash spends its whole output budget on internal thinking and emits NO usable output.
//       Both transports DOUBLE the budget once (capped at GEMINI_MAXTOK_CEIL) and re-issue the same request.
//   (2) tool-loop empty conclusion — the function-calling loop ends with empty text (no tool call, no answer). The
//       tool transport makes ONE forced tools-off call demanding ONLY the JSON verdict from the gathered evidence.
const test = require('node:test');
const assert = require('node:assert');
const { makeGeminiTransport, makeGeminiToolTransport, makeRunAgent } = require('../../lib/llm-agent-adapter.js');

// a fake fetch driven by a queue of Gemini response objects (`j`). Records the PARSED request body of every call so
// tests can assert maxOutputTokens doubling and tools-on/off. status 200 unless the queued item carries {__status}.
function fakeFetch(queue) {
  const requests = [];
  const f = async (_url, opts) => {
    requests.push(JSON.parse(opts.body));
    const item = queue[requests.length - 1];
    if (item && item.__status) return { status: item.__status, ok: false, json: async () => ({}) };
    return { status: 200, ok: true, json: async () => item };
  };
  f.requests = requests;
  return f;
}
const cand = (parts, finishReason = 'STOP') => ({ candidates: [{ content: { parts }, finishReason }], usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1 } });
const textJson = (v = 'REPRODUCED') => JSON.stringify({ verdict: v, confidence: 'high', summary: 's', reasoning: 'r', evidenceRefs: [] });
const REQ = { messages: [{ content: [{ type: 'text', text: 'judge this' }] }] };
const DISPATCH = { declarations: [{ name: 'noop', description: 'x', parameters: { type: 'object', properties: {} } }], call: async () => ({ ok: true }) };
const run = (t) => t(REQ, {});

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
  const f = fakeFetch([cand([], 'MAX_TOKENS'), cand([{ text: textJson('NOT REPRODUCED') }])]);
  const t = makeGeminiToolTransport({ apiKey: 'k', fetchImpl: f, dispatch: DISPATCH, maxOutputTokens: 8192 });
  const out = await run(t);
  assert.equal(f.requests[0].generationConfig.maxOutputTokens, 8192);
  assert.equal(f.requests[1].generationConfig.maxOutputTokens, 16384, 'doubled');
  assert.match(out.content[0].text, /NOT REPRODUCED/);
});

test('tool transport: empty final answer triggers a forced TOOLS-OFF conclusion (not a null/noVerdict)', async () => {
  // turn 0 returns empty text with a normal finishReason (no tool call) ⇒ forced-conclude fires.
  const f = fakeFetch([cand([], 'STOP'), cand([{ text: textJson('PARTIAL') }])]);
  const t = makeGeminiToolTransport({ apiKey: 'k', fetchImpl: f, dispatch: DISPATCH });
  const out = await run(t);
  assert.equal(f.requests.length, 2, 'one tool turn + one forced conclusion');
  assert.ok(!f.requests[1].tools, 'the conclusion call disables tools');
  const concludeText = JSON.stringify(f.requests[1].contents);
  assert.match(concludeText, /ONLY the final JSON verdict/, 'the conclusion prompt demands ONLY the JSON');
  assert.match(out.content[0].text, /PARTIAL/, 'returns the concluded verdict');
});

test('tool transport: a base64 screenshot in a tool result is lifted to an inlineData image part (not boxed in the Struct)', async () => {
  // a long base64 string simulates capture_full_page's `screenshot`. The fix must (a) NOT send it inside the
  // functionResponse Struct, (b) attach it as an inlineData image part on the same user turn so the model sees it.
  const bigB64 = 'iVBORw0KGgo' + 'A'.repeat(2000);
  const fc = [{ functionCall: { name: 'capture_full_page', args: {} } }];
  const f = fakeFetch([cand(fc, 'STOP'), cand([{ text: textJson() }])]);
  const dispatch = { declarations: DISPATCH.declarations, call: async () => ({ screenshot: bigB64, scaleUsed: 2, note: 'ok' }) };
  const t = makeGeminiToolTransport({ apiKey: 'k', fetchImpl: f, dispatch });
  const out = await run(t);
  assert.match(out.content[0].text, /REPRODUCED/, 'concludes normally after seeing the image');
  const toolTurn = f.requests[1].contents.find((c) => c.role === 'user' && Array.isArray(c.parts) && c.parts.some((p) => p.functionResponse));
  assert.ok(toolTurn, 'the second request echoes a user turn carrying the functionResponse');
  const fr = toolTurn.parts.find((p) => p.functionResponse);
  assert.ok(!/iVBORw0KGgo/.test(JSON.stringify(fr.functionResponse)), 'the base64 is NOT boxed in the functionResponse Struct');
  assert.match(JSON.stringify(fr.functionResponse.response.screenshot), /attached as an image part/, 'replaced with a placeholder note');
  const img = toolTurn.parts.find((p) => p.inlineData);
  assert.ok(img && img.inlineData.data === bigB64, 'the screenshot rides as an inlineData image part');
  assert.equal(img.inlineData.mimeType, 'image/png');
});

test('tool transport: V3_GEMINI_TOOL_IMAGES=0 opts out (legacy string-boxed behavior)', async () => {
  const prev = process.env.V3_GEMINI_TOOL_IMAGES; process.env.V3_GEMINI_TOOL_IMAGES = '0';
  try {
    const bigB64 = 'iVBORw0KGgo' + 'B'.repeat(2000);
    const fc = [{ functionCall: { name: 'capture_full_page', args: {} } }];
    const f = fakeFetch([cand(fc, 'STOP'), cand([{ text: textJson() }])]);
    const dispatch = { declarations: DISPATCH.declarations, call: async () => ({ screenshot: bigB64 }) };
    await run(makeGeminiToolTransport({ apiKey: 'k', fetchImpl: f, dispatch }));
    const toolTurn = f.requests[1].contents.find((c) => c.role === 'user' && Array.isArray(c.parts) && c.parts.some((p) => p.functionResponse));
    assert.ok(/iVBORw0KGgo/.test(JSON.stringify(toolTurn)), 'opted out ⇒ base64 stays boxed in the Struct');
    assert.ok(!toolTurn.parts.some((p) => p.inlineData), 'no inlineData part when opted out');
  } finally { if (prev === undefined) delete process.env.V3_GEMINI_TOOL_IMAGES; else process.env.V3_GEMINI_TOOL_IMAGES = prev; }
});

test('tool transport: a normal tool call still flows (recovery does not disturb the happy path)', async () => {
  const fc = [{ functionCall: { name: 'noop', args: {} } }];
  const f = fakeFetch([cand(fc, 'STOP'), cand([{ text: textJson() }])]);
  const t = makeGeminiToolTransport({ apiKey: 'k', fetchImpl: f, dispatch: DISPATCH });
  const out = await run(t);
  assert.equal(f.requests.length, 2, 'tool call executed, then the model answered');
  assert.ok(f.requests[0].tools, 'tools offered on the first turn');
  assert.match(out.content[0].text, /REPRODUCED/);
});

test('tool transport: V3_GEMINI_FORCE_CONCLUDE=0 opts out (empty ⇒ null)', async () => {
  const prev = process.env.V3_GEMINI_FORCE_CONCLUDE; process.env.V3_GEMINI_FORCE_CONCLUDE = '0';
  try {
    const f = fakeFetch([cand([], 'STOP')]);
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
