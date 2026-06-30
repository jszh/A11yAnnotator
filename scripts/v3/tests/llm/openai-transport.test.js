'use strict';
// GPT-5.4 via the OpenAI RESPONSES API (/v1/responses) — a HAND-ROLLED function-calling loop WE drive (like the Gemini
// lane), so tool use is guaranteed (the Codex *agent* refused to call tools). The Responses API is required: gpt-5.4
// rejects tools+reasoning on chat/completions. Covers single-shot, vision (input_image), the tool loop over
// buildCdpToolDispatch with previous_response_id chaining, per-turn token telemetry to BOTH sinks, and degrade-to-null.
// fetchImpl injected — no network or OPENAI_API_KEY needed.
const test = require('node:test');
const assert = require('node:assert');
const { makeOpenAITransport, makeRunAgent } = require('../../lib/llm-agent-adapter.js');

const verdict = (v = 'REPRODUCED') => JSON.stringify({ verdict: v, confidence: 'high', summary: 's', reasoning: 'r', evidenceRefs: [] });
// a Responses-API completion with a final message:
const respText = (over = {}) => ({ status: 200, json: { id: over.id || 'resp_1', output: [{ type: 'message', content: [{ type: 'output_text', text: over.content !== undefined ? over.content : verdict() }] }], usage: over.usage || { input_tokens: 100, output_tokens: 50 } } });
// a Responses-API completion with function_call items:
const respCall = (calls, over = {}) => ({ status: 200, json: { id: over.id || 'resp_1', output: calls.map((c, i) => ({ type: 'function_call', call_id: c.call_id || ('c' + i), name: c.name, arguments: c.arguments })), usage: over.usage || { input_tokens: 100, output_tokens: 40 } } });
function fakeFetch(responses, capture = {}) {
  capture.requests = []; let i = 0;
  return async (url, init) => {
    capture.requests.push({ url, body: JSON.parse(init.body), auth: (init.headers || {}).authorization });
    const r = responses[Math.min(i, responses.length - 1)]; i++;
    return { ok: (r.status || 200) < 400, status: r.status || 200, json: async () => r.json, text: async () => JSON.stringify(r.json || {}) };
  };
}
const reqOf = (content) => ({ messages: [{ content }] });

test('openai single-shot: hits /responses; returns the verdict; sends model + reasoning.effort + Bearer; NO tools', async () => {
  const cap = {};
  const t = makeOpenAITransport({ apiKey: 'k', model: 'gpt-5.4', effort: 'high', fetchImpl: fakeFetch([respText()], cap) });
  const out = await t(reqOf([{ type: 'text', text: 'judge' }]), {});
  assert.match(out.content[0].text, /REPRODUCED/);
  assert.match(cap.requests[0].url, /\/responses$/);
  assert.equal(cap.requests[0].body.model, 'gpt-5.4');
  assert.equal(cap.requests[0].body.reasoning.effort, 'high');
  assert.ok(!cap.requests[0].body.tools, 'no tools advertised without a dispatch');
  assert.match(cap.requests[0].auth, /^Bearer k$/);
});

test('openai vision: image blocks → input_image data URLs', async () => {
  const cap = {};
  const t = makeOpenAITransport({ apiKey: 'k', fetchImpl: fakeFetch([respText()], cap) });
  await t(reqOf([{ type: 'text', text: 'see' }, { type: 'image', source: { media_type: 'image/png', data: 'AAAA' } }]), {});
  const c = cap.requests[0].body.input[0].content;
  assert.equal(c.find((x) => x.type === 'input_image').image_url, 'data:image/png;base64,AAAA', 'crop sent as input_image data URL');
  assert.equal(c.find((x) => x.type === 'input_text').text, 'see');
});

test('openai TOOL LOOP: function_call → dispatched to cdp → output fed back (prevId chained) → final verdict', async () => {
  const cap = {}; const calls = [];
  const dispatch = { declarations: [{ name: 'resolve_destination', description: 'd', parameters: { type: 'object', properties: { linkXpath: { type: 'string' } } } }], call: async (n, a) => { calls.push({ n, a }); return { finalUrl: '/chat' }; } };
  const responses = [
    respCall([{ call_id: 'fc1', name: 'resolve_destination', arguments: '{"linkXpath":"/a"}' }], { id: 'resp_A' }),
    respText({ content: verdict('NOT REPRODUCED') }),
  ];
  const t = makeOpenAITransport({ apiKey: 'k', dispatch, fetchImpl: fakeFetch(responses, cap) });
  const parsed = await makeRunAgent({ transport: t })([{ type: 'text', text: 'judge' }], { sc: '2.4.4' });
  assert.equal(parsed.verdict, 'NOT REPRODUCED');
  assert.deepEqual(calls, [{ n: 'resolve_destination', a: { linkXpath: '/a' } }], 'dispatched the tool with parsed args');
  assert.equal(cap.requests[0].body.tools[0].name, 'resolve_destination', 'tools advertised FLAT (name at top level)');
  assert.equal(cap.requests[0].body.tools[0].type, 'function');
  const t2 = cap.requests[1].body;
  assert.equal(t2.previous_response_id, 'resp_A', 'second turn chains previous_response_id');
  const out = t2.input.find((x) => x.type === 'function_call_output');
  assert.ok(out && out.call_id === 'fc1' && /"\/chat"/.test(out.output), 'function_call_output fed back with the call_id');
});

test('openai TOKEN USAGE: one result event PER TURN to BOTH onTrace and onTraceSink (recordTrace sums the loop)', async () => {
  const sink = []; const tr = [];
  const dispatch = { declarations: [{ name: 't', description: 'd', parameters: { type: 'object' } }], call: async () => ({ ok: 1 }) };
  const responses = [
    respCall([{ call_id: 'c1', name: 't', arguments: '{}' }], { usage: { input_tokens: 100, output_tokens: 40 } }),
    respText({ usage: { input_tokens: 150, output_tokens: 30 } }),
  ];
  const t = makeOpenAITransport({ apiKey: 'k', dispatch, onTraceSink: (e) => sink.push(e), fetchImpl: fakeFetch(responses) });
  await t(reqOf([{ type: 'text', text: 'j' }]), { onTrace: (e) => tr.push(e) });
  const usage = sink.filter((e) => e.type === 'result').map((e) => e.usage);
  assert.deepEqual(usage, [{ input_tokens: 100, output_tokens: 40 }, { input_tokens: 150, output_tokens: 30 }], 'persistent sink gets every turn');
  assert.ok(tr.some((e) => e.type === 'result'), 'verdict trace also gets usage');
  assert.ok(tr.some((e) => e.type === 'tool_use' && e.name === 't'), 'tool_use recorded on the verdict trace');
});

test('openai single-shot reads output_text convenience field', async () => {
  const t = makeOpenAITransport({ apiKey: 'k', fetchImpl: fakeFetch([{ status: 200, json: { id: 'r', output: [], output_text: verdict('NOT REPRODUCED'), usage: { input_tokens: 1, output_tokens: 1 } } }]) });
  const out = await t(reqOf([{ type: 'text', text: 'j' }]), {});
  assert.match(out.content[0].text, /NOT REPRODUCED/);
});

test('openai degrades to null: no key, HTTP 4xx, exhausted 5xx (never throws)', async () => {
  assert.equal(await makeOpenAITransport({ apiKey: null, fetchImpl: fakeFetch([respText()]) })(reqOf([{ type: 'text', text: 'j' }]), {}), null, 'no key ⇒ inert');
  assert.equal(await makeOpenAITransport({ apiKey: 'k', fetchImpl: fakeFetch([{ status: 400, json: { error: { message: 'bad' } } }]) })(reqOf([{ type: 'text', text: 'j' }]), {}), null, '4xx ⇒ null');
  assert.equal(await makeOpenAITransport({ apiKey: 'k', maxRetries: 1, fetchImpl: fakeFetch([{ status: 500, json: {} }, { status: 500, json: {} }]) })(reqOf([{ type: 'text', text: 'j' }]), {}), null, 'exhausted 5xx ⇒ null');
});

test('openai disableTools (envelope-repair pass): sends no tools even with a dispatch', async () => {
  const cap = {};
  const dispatch = { declarations: [{ name: 't', description: 'd', parameters: { type: 'object' } }], call: async () => ({}) };
  const t = makeOpenAITransport({ apiKey: 'k', dispatch, fetchImpl: fakeFetch([respText()], cap) });
  await t({ messages: [{ content: [{ type: 'text', text: 'j' }] }], disableTools: true }, {});
  assert.ok(!cap.requests[0].body.tools, 'no tools advertised on the repair pass');
});
