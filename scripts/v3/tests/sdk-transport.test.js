// Harness 3.4 — makeClaudeSdkTransport unit tests. The transport routes our Anthropic-format request through
// the Claude Agent SDK's streaming-input query() and returns the same {content:[{text}]} shape the rest of
// the lane expects. `queryImpl` is injected so these tests need NO SDK and NO network (mirrors the existing
// fetchImpl pattern). Covers: request→SDK adaptation, end-to-end parse via makeRunAgent, degrade-to-null,
// 429/overloaded backoff+retry, whole-run timeout, and fatal-error degrade.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { makeClaudeSdkTransport, makeRunAgent } = require('../lib/llm-agent-adapter.js');

const VERDICT = JSON.stringify({ verdict: 'NOT REPRODUCED', confidence: 'high', summary: 'ok', reasoning: 'because', evidenceRefs: [] });

// a mock SDK query: yields the configured messages; optionally captures the streaming-input it received.
function mockQuery(messages, capture) {
  return async function* q(args) {
    if (capture) { for await (const m of args.prompt) { capture.push(m); break; } }
    for (const msg of messages) yield msg;
  };
}

test('sdk transport: adapts the Anthropic request → SDK streaming input (text+image), returns assistant text', async () => {
  const captured = [];
  const queryImpl = mockQuery([
    { type: 'assistant', message: { content: [{ type: 'text', text: VERDICT }] } },
    { type: 'result', subtype: 'success', is_error: false },
  ], captured);
  const transport = makeClaudeSdkTransport({ queryImpl, oauthToken: 'tok' });
  const res = await transport({ model: 'claude-sonnet-4-6', messages: [{ role: 'user', content: [
    { type: 'text', text: 'judge' },
    { type: 'image', source: { type: 'base64', media_type: 'image/png', data: 'AAAA' } },
  ] }] });
  assert.deepEqual(res, { content: [{ type: 'text', text: VERDICT }] });
  // the streaming input carried our content blocks verbatim (text + image)
  assert.equal(captured.length, 1);
  assert.equal(captured[0].type, 'user');
  assert.equal(captured[0].message.role, 'user');
  assert.equal(captured[0].message.content.length, 2);
  assert.equal(captured[0].message.content[1].type, 'image');
});

test('sdk transport: parses end-to-end through makeRunAgent → structured verdict', async () => {
  const queryImpl = mockQuery([
    { type: 'assistant', message: { content: [{ type: 'text', text: VERDICT }] } },
    { type: 'result', subtype: 'success' },
  ]);
  const runAgent = makeRunAgent({ transport: makeClaudeSdkTransport({ queryImpl, oauthToken: 'tok' }), model: 'claude-sonnet-4-6' });
  const out = await runAgent([{ type: 'text', text: 'judge' }], { xpath: '/x' });
  assert.equal(out.verdict, 'NOT REPRODUCED');
  assert.equal(out.confidence, 'high');
});

test('sdk transport: empty assistant text ⇒ null (degrade, never a fabricated verdict)', async () => {
  const queryImpl = mockQuery([{ type: 'result', subtype: 'success' }]); // no assistant text
  const res = await makeClaudeSdkTransport({ queryImpl, oauthToken: 'tok' })({ messages: [{ role: 'user', content: [] }] });
  assert.equal(res, null);
});

test('sdk transport: retries on a 429/overloaded result, then succeeds', async () => {
  let calls = 0;
  const queryImpl = async function* (args) {
    void args; calls++;
    if (calls === 1) { yield { type: 'result', subtype: 'error_overloaded', is_error: true }; return; }
    yield { type: 'assistant', message: { content: [{ type: 'text', text: VERDICT }] } };
    yield { type: 'result', subtype: 'success' };
  };
  const transport = makeClaudeSdkTransport({ queryImpl, oauthToken: 'tok', baseBackoffMs: 1, maxBackoffMs: 1 });
  const res = await transport({ messages: [{ role: 'user', content: [] }] });
  assert.equal(calls, 2, 'retried once after the overloaded result');
  assert.deepEqual(res, { content: [{ type: 'text', text: VERDICT }] });
});

test('sdk transport: gives up after maxRetries on persistent overload ⇒ null', async () => {
  let calls = 0;
  const queryImpl = async function* () { calls++; yield { type: 'result', subtype: 'rapid_refill_breaker', is_error: true }; };
  const res = await makeClaudeSdkTransport({ queryImpl, oauthToken: 'tok', maxRetries: 2, baseBackoffMs: 1, maxBackoffMs: 1 })({ messages: [{ role: 'user', content: [] }] });
  assert.equal(calls, 3, 'initial + 2 retries');
  assert.equal(res, null);
});

test('sdk transport: whole-run timeout aborts and degrades to null (no throw)', async () => {
  const queryImpl = async function* (args) {
    await new Promise((r) => { args.options.abortController.signal.addEventListener('abort', r); });
    throw Object.assign(new Error('aborted'), { name: 'AbortError' });
  };
  const res = await makeClaudeSdkTransport({ queryImpl, oauthToken: 'tok', runTimeoutMs: 30 })({ messages: [{ role: 'user', content: [] }] });
  assert.equal(res, null);
});

test('sdk transport: a fatal (non-overload) error with no text ⇒ null', async () => {
  const queryImpl = async function* () { throw new Error('boom'); };
  const res = await makeClaudeSdkTransport({ queryImpl, oauthToken: 'tok' })({ messages: [{ role: 'user', content: [] }] });
  assert.equal(res, null);
});

test('sdk transport: never leaks a metered key into the child env (passes OAuth only)', async () => {
  let seenEnv = null;
  const queryImpl = async function* (args) { seenEnv = args.options.env; yield { type: 'assistant', message: { content: [{ type: 'text', text: VERDICT }] } }; yield { type: 'result', subtype: 'success' }; };
  const prevKey = process.env.ANTHROPIC_API_KEY;
  process.env.ANTHROPIC_API_KEY = 'sk-should-not-pass';
  try {
    await makeClaudeSdkTransport({ queryImpl, oauthToken: 'oauth-tok' })({ messages: [{ role: 'user', content: [] }] });
  } finally { if (prevKey == null) delete process.env.ANTHROPIC_API_KEY; else process.env.ANTHROPIC_API_KEY = prevKey; }
  assert.ok(seenEnv && !('ANTHROPIC_API_KEY' in seenEnv), 'the metered key is stripped from the child env');
  assert.equal(seenEnv.CLAUDE_CODE_OAUTH_TOKEN, 'oauth-tok');
});

// a multi-turn stream: thinking + a tool_use, then the tool_result (as a 'user' msg), then the final verdict + result.
function multiTurnQuery() {
  return async function* () {
    yield { type: 'assistant', message: { role: 'assistant', content: [
      { type: 'thinking', thinking: 'check the contrast first' },
      { type: 'tool_use', id: 'tu_1', name: 'mcp__cdp__compute_contrast', input: { xpath: '/html/body/a' } },
    ] } };
    yield { type: 'user', message: { role: 'user', content: [
      { type: 'tool_result', tool_use_id: 'tu_1', is_error: false, content: [{ type: 'text', text: '{"ratio":3.1}' }] },
    ] } };
    yield { type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: '{"verdict":"REPRODUCED","confidence":"high"}' }] } };
    yield { type: 'result', subtype: 'success', is_error: false, num_turns: 2, usage: { input_tokens: 100, output_tokens: 50 }, total_cost_usd: 0.01 };
  };
}

test('sdk transport: onTrace captures the FULL turn-by-turn trace (thinking, tool_use, tool_result, result usage)', async () => {
  const events = [];
  const transport = makeClaudeSdkTransport({ queryImpl: multiTurnQuery(), oauthToken: 'tok' });
  const res = await transport({ messages: [{ role: 'user', content: [] }] }, { onTrace: (e) => events.push(e) });
  assert.match(res.content[0].text, /REPRODUCED/, 'still returns the assistant verdict text');
  const kinds = events.flatMap((e) => (e.blocks ? e.blocks.map((b) => b.kind) : [e.type]));
  assert.ok(kinds.includes('thinking'), 'thinking captured (was dropped)');
  assert.ok(kinds.includes('tool_use'), 'tool CALL captured (was dropped)');
  assert.ok(kinds.includes('tool_result'), 'tool RESPONSE captured (was dropped)');
  const result = events.find((e) => e.type === 'result');
  assert.ok(result && result.usage && result.usage.output_tokens === 50, 'result usage captured');
});

test('sdk transport: makeRunAgent attaches the full trace to the parsed verdict (out.trace)', async () => {
  const runAgent = makeRunAgent({ transport: makeClaudeSdkTransport({ queryImpl: multiTurnQuery(), oauthToken: 'tok' }), model: 'm' });
  const out = await runAgent([{ text: 'judge this' }], { xpath: '/html/body/a' });
  assert.equal(out.verdict, 'REPRODUCED');
  assert.ok(Array.isArray(out.trace) && out.trace.length >= 4, 'the full trace rides the verdict object');
  const blocks = out.trace.flatMap((e) => e.blocks || []);
  assert.equal(blocks.find((b) => b.kind === 'tool_use').name, 'mcp__cdp__compute_contrast', 'the tool name + args are recorded');
  assert.ok(blocks.find((b) => b.kind === 'tool_result'), 'the tool response is recorded for analysis');
});

test('sdk transport: trace ELIDES base64 screenshots from tool_result content (pixels stay in llm-vision, never the trace)', async () => {
  const bigB64 = 'iVBORw0KGgoAAAANSUhEUg' + 'A'.repeat(2000); // a long base64-looking run, like a CDP screenshot
  const queryImpl = async function* () {
    yield { type: 'assistant', message: { role: 'assistant', content: [{ type: 'tool_use', id: 'tu', name: 'mcp__cdp__set_state_and_capture', input: { xpath: '/x' } }] } };
    yield { type: 'user', message: { role: 'user', content: [{ type: 'tool_result', tool_use_id: 'tu', is_error: false, content: [{ type: 'text', text: JSON.stringify({ stateReached: 'focus', screenshots: { before: bigB64, after: bigB64 } }) }] }] } };
    yield { type: 'assistant', message: { role: 'assistant', content: [{ type: 'text', text: '{"verdict":"NOT REPRODUCED"}' }] } };
    yield { type: 'result', subtype: 'success' };
  };
  const events = [];
  await makeClaudeSdkTransport({ queryImpl, oauthToken: 'tok' })({ messages: [{ role: 'user', content: [] }] }, { onTrace: (e) => events.push(e) });
  const trJson = JSON.stringify(events);
  assert.ok(!trJson.includes(bigB64), 'the raw base64 PNG is NOT in the trace');
  assert.match(trJson, /base64 \d+ chars elided/, 'long base64 is replaced with a placeholder');
  assert.match(trJson, /stateReached/, 'the objective non-pixel fields are preserved for analysis');
});

test('sdk transport: passes reasoning effort to query() options (default medium; overridable; omitted when null)', async () => {
  let seen = null;
  const queryImpl = async function* (args) { seen = args.options; yield { type: 'assistant', message: { content: [{ type: 'text', text: VERDICT }] } }; yield { type: 'result', subtype: 'success' }; };
  await makeClaudeSdkTransport({ queryImpl, oauthToken: 'tok' })({ messages: [{ role: 'user', content: [] }] });
  assert.equal(seen.effort, 'medium', 'sonnet judge defaults to medium reasoning effort');
  await makeClaudeSdkTransport({ queryImpl, oauthToken: 'tok', effort: 'high' })({ messages: [{ role: 'user', content: [] }] });
  assert.equal(seen.effort, 'high', 'effort is overridable');
  await makeClaudeSdkTransport({ queryImpl, oauthToken: 'tok', effort: null })({ messages: [{ role: 'user', content: [] }] });
  assert.ok(!('effort' in seen), 'a null effort sends NO effort key (never undefined) to the SDK');
});
