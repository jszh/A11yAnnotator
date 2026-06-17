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
