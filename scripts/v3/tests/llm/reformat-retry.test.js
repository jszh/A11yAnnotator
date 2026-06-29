// Envelope-repair (JSON-parse) retry in makeRunAgent. When the model answers but the strict-JSON verdict
// envelope is unparseable (prose-only, a non-canonical token, a fenced/truncated object), runAgent re-asks
// ONCE for ONLY the JSON, handing the model its own prior text. This recovers the noVerdict drops the FN run
// surfaced (cc0f0a, d0f69e) WITHOUT re-running the agentic tool loop (the retry sets request.disableTools).
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const { makeRunAgent } = require('../../lib/llm-agent-adapter.js');

const GOOD = JSON.stringify({ verdict: 'REPRODUCED', confidence: 'high', summary: 's', reasoning: 'r', evidenceRefs: [] });

// a scripted transport: returns text[i] on the i-th call; records every request it saw.
function scriptedTransport(replies) {
  const seen = [];
  const t = async (request) => {
    seen.push(request);
    const r = replies[seen.length - 1];
    if (r == null) return null; // transport failure / empty
    return { content: [{ type: 'text', text: r }] };
  };
  t.seen = seen;
  return t;
}

test('reformat retry: prose-only first reply ⇒ re-asks, parses the reformatted JSON', async () => {
  const transport = scriptedTransport(['I think this is a barrier because the frames differ.', GOOD]);
  const runAgent = makeRunAgent({ transport });
  const out = await runAgent([{ type: 'text', text: 'judge' }], { xpath: '/x' });
  assert.equal(transport.seen.length, 2, 'should make exactly one retry');
  assert.equal(out.verdict, 'REPRODUCED');
  assert.equal(out.reformatRetried, true);
});

test('reformat retry: non-canonical token (LIKELY_BARRIER) ⇒ repaired to a canonical verdict', async () => {
  const bad = JSON.stringify({ verdict: 'LIKELY_BARRIER', confidence: 'high', summary: 's' });
  const transport = scriptedTransport([bad, JSON.stringify({ verdict: 'PARTIAL', confidence: 'low', summary: 's', reasoning: '', evidenceRefs: [] })]);
  const out = await makeRunAgent({ transport })([{ type: 'text', text: 'judge' }], {});
  assert.equal(out.verdict, 'PARTIAL');
  assert.equal(out.reformatRetried, true);
});

test('reformat retry: the retry request carries disableTools:true (no agentic re-entry / page re-clone)', async () => {
  const transport = scriptedTransport(['prose only, no json', GOOD]);
  await makeRunAgent({ transport })([{ type: 'text', text: 'judge' }], {});
  assert.equal(transport.seen[0].disableTools, undefined, 'first call must NOT disable tools');
  assert.equal(transport.seen[1].disableTools, true, 'reformat call MUST disable tools');
  // and the reformat prompt must echo the model's own prior text back to it
  const retryText = transport.seen[1].messages[0].content[0].text;
  assert.match(retryText, /prose only, no json/);
  assert.match(retryText, /"REPRODUCED"/); // lists the canonical tokens
});

test('reformat retry: a well-formed first reply does NOT trigger a retry', async () => {
  const transport = scriptedTransport([GOOD, GOOD]);
  const out = await makeRunAgent({ transport })([{ type: 'text', text: 'judge' }], {});
  assert.equal(transport.seen.length, 1, 'no retry when the first reply already parses');
  assert.equal(out.verdict, 'REPRODUCED');
  assert.ok(!out.reformatRetried);
});

test('reformat retry: a transport FAILURE (null/empty) does NOT retry (nothing to reformat) ⇒ degrade to null', async () => {
  const transport = scriptedTransport([null, GOOD]);
  const out = await makeRunAgent({ transport })([{ type: 'text', text: 'judge' }], {});
  assert.equal(transport.seen.length, 1, 'no text to repair ⇒ no retry');
  assert.equal(out, null);
});

test('reformat retry: still-unparseable AFTER the retry ⇒ fail closed (null), one retry only', async () => {
  const transport = scriptedTransport(['prose', 'still prose, still no json']);
  const out = await makeRunAgent({ transport })([{ type: 'text', text: 'judge' }], {});
  assert.equal(transport.seen.length, 2, 'exactly one retry, then give up');
  assert.equal(out, null);
});

test('reformat retry: V3_LLM_REFORMAT_RETRY=0 disables the retry (ablation opt-out)', async () => {
  const prev = process.env.V3_LLM_REFORMAT_RETRY;
  process.env.V3_LLM_REFORMAT_RETRY = '0';
  try {
    const transport = scriptedTransport(['prose only', GOOD]);
    const out = await makeRunAgent({ transport })([{ type: 'text', text: 'judge' }], {});
    assert.equal(transport.seen.length, 1, 'opt-out ⇒ no retry');
    assert.equal(out, null);
  } finally {
    if (prev === undefined) delete process.env.V3_LLM_REFORMAT_RETRY; else process.env.V3_LLM_REFORMAT_RETRY = prev;
  }
});
