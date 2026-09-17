'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { makeOpenRouterToolTransport } = require('../../lib/llm-agent-adapter');
const { newToolAccumulator, recordToolTrace } = require('../../lib/tool-telemetry');
const call = (id, name, args = '{}') => ({ id, type: 'function', function: { name, arguments: args } });
const req = { messages: [{ content: [{ type: 'text', text: 'inspect the page' }] }] };
function setup(messages, handler = async () => ({ ok: true }), extra = {}) {
  const events = [], requests = [], executed = [], acc = newToolAccumulator();
  const dispatch = { declarations: [{ name: 'inspect', description: 'inspect', parameters: { type: 'object' } }],
    call: async (name, args) => { executed.push({ name, args }); return handler(name, args); } };
  let i = 0;
  const transport = makeOpenRouterToolTransport({ apiKey: 'fake', model: 'test-model', dispatch,
    maxTurns: 4, maxRetries: 0,
    fetchImpl: async (url, options) => {
      requests.push(JSON.parse(options.body));
      assert.ok(i < messages.length, 'unexpected extra model request');
      return { ok: true, status: 200, json: async () => ({ choices: [{ message: messages[i++] }], usage: { prompt_tokens: 10, completion_tokens: 5 } }) };
    },
    onTraceSink: e => { events.push(e); recordToolTrace(acc, e); }, ...extra });
  return { transport, events, requests, executed, acc };
}
test('OpenRouter counts every request in a multi-call turn and records results, without counting results twice', async () => {
  const x = setup([{ tool_calls: [call('a', 'inspect', '{"target":"one"}'), call('b', 'refused')] }, { content: 'done' }],
    async name => { if (name === 'refused') throw new Error('refused'); return { png: 'A'.repeat(1000), role: 'button' }; });
  const trace = [];
  assert.equal(await x.transport(req, { onTrace: e => trace.push(e) }), 'done');
  assert.equal(x.acc.calls, 2);
  assert.deepEqual(x.acc.byName, { inspect: 1, refused: 1 });
  assert.deepEqual(x.executed, [{ name: 'inspect', args: { target: 'one' } }, { name: 'refused', args: {} }]);
  assert.equal(x.acc.llmCalls, 2);
  assert.equal(x.acc.maxTurns, 2);
  const results = x.events.flatMap(e => e.blocks || []).filter(b => b.kind === 'tool_result');
  assert.equal(results.length, 2);
  assert.equal(results[1].isError, true);
  assert.ok(!results[0].content.includes('A'.repeat(1000)), 'base64 is elided from persisted traces');
  assert.deepEqual(trace, x.events, 'both sinks receive the same events');
  assert.equal(x.requests[1].messages.filter(m => m.role === 'tool').length, 2);
});
test('Malformed tool requests are counted but never executed; a repaired request is separately counted', async () => {
  const x = setup([{ tool_calls: [call('bad', 'inspect', '{')] }, { tool_calls: [call('good', 'inspect')] }, { content: 'done' }]);
  await x.transport(req);
  assert.equal(x.acc.calls, 2);
  assert.equal(x.executed.length, 1);
  const blocks = x.events.flatMap(e => e.blocks || []);
  assert.equal(blocks.find(b => b.id === 'bad').argumentsValid, false);
  assert.equal(blocks.filter(b => b.kind === 'tool_result').length, 1);
});
test('An empty-answer retry is multi-turn but is not tool use', async () => {
  const x = setup([{ content: '' }, { content: 'done' }]);
  await x.transport(req);
  assert.equal(x.acc.calls, 0);
  assert.equal(x.acc.multiTurnResults, 1);
});
test('Throwing tool-event sinks do not affect dispatch or the final answer', async () => {
  const x = setup([{ tool_calls: [call('a', 'inspect')] }, { content: 'done' }], undefined,
    { onTraceSink: e => { if (e.blocks) throw new Error('disk failure'); } });
  assert.equal(await x.transport(req, { onTrace: e => { if (e.blocks) throw new Error('trace failure'); } }), 'done');
  assert.equal(x.executed.length, 1);
});
test('Concurrent cases retain separate counters while the run aggregate adds their requests', async () => {
  const aggregate = newToolAccumulator();
  const runs = [1, 2].map(n => {
    const acc = newToolAccumulator();
    const x = setup([{ tool_calls: Array.from({ length: n }, (_, i) => call(String(i), 'inspect')) }, { content: 'done' }], undefined,
      { onTraceSink: e => { recordToolTrace(aggregate, e); recordToolTrace(acc, e); } });
    return { ...x, acc };
  });
  await Promise.all(runs.map(x => x.transport(req)));
  assert.deepEqual(runs.map(x => x.acc.calls), [1, 2]);
  assert.equal(aggregate.calls, 3);
});
