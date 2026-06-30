'use strict';
// GPT-5.4 via the OpenAI Codex SDK (@openai/codex-sdk) — a single-shot cross-family judge lane (the GPT analog of the
// Claude Agent SDK lane). The SDK is lazy-imported + injectable, so these tests need neither the SDK nor `codex login`:
// a fake Codex constructor stands in. Covers model selection, auth env, prompt flattening (vision crops noted not
// sent), result-shape robustness, and degrade-to-null on error/empty (lane inert until authenticated).
const test = require('node:test');
const assert = require('node:assert');
const { makeCodexTransport, makeRunAgent } = require('../../lib/llm-agent-adapter.js');

// a fake Codex: records the constructor opts, startThread opts, and the prompt; run() returns the queued result.
function fakeCodex(runImpl, capture = {}) {
  return class Codex {
    constructor(opts) { capture.ctor = opts; }
    startThread(o) {
      capture.thread = o;
      return { run: async (input) => {
        capture.input = input;
        if (Array.isArray(input)) capture.imagesExist = input.filter((i) => i && i.type === 'local_image').map((i) => require('fs').existsSync(i.path));
        return runImpl(input);
      } };
    }
  };
}
const textJson = (v = 'REPRODUCED') => JSON.stringify({ verdict: v, confidence: 'high', summary: 's', reasoning: 'r', evidenceRefs: [] });
const reqOf = (content) => ({ messages: [{ content }] });

test('codex: single-shot run → returns the agent final text; model gpt-5.4 + skipGitRepoCheck + CODEX_API_KEY env', async () => {
  const cap = {};
  const t = makeCodexTransport({ codexImpl: fakeCodex(() => ({ finalResponse: textJson() }), cap), apiKey: 'tok-123', model: 'gpt-5.4', effort: 'high' });
  const out = await t(reqOf([{ type: 'text', text: 'judge this' }]), {});
  assert.match(out.content[0].text, /REPRODUCED/, 'returns the agent text in the content shape');
  assert.equal(cap.thread.model, 'gpt-5.4', 'startThread selects the GPT-5.4 model');
  assert.equal(cap.thread.modelReasoningEffort, 'high', 'startThread sets the reasoning effort (was UNSET → SDK default)');
  assert.equal(cap.ctor.skipGitRepoCheck, true, 'skips the git-repo check (judge has no repo)');
  assert.equal(cap.ctor.env.CODEX_API_KEY, 'tok-123', 'passes the codex auth token via env');
  assert.ok(cap.ctor.workingDirectory, 'runs in a throwaway working directory (no repo side-effects)');
});

test('codex: integrates with makeRunAgent → parses the verdict', async () => {
  const t = makeCodexTransport({ codexImpl: fakeCodex(() => ({ finalResponse: textJson('NOT REPRODUCED') })), apiKey: 'k' });
  const parsed = await makeRunAgent({ transport: t })([{ type: 'text', text: 'judge' }], { sc: '1.1.1' });
  assert.equal(parsed.verdict, 'NOT REPRODUCED');
});

test('codex VISION: image crops are written to temp PNGs and sent as local_image input items', async () => {
  const cap = {};
  const b64 = Buffer.from('PNG-BYTES').toString('base64');
  const t = makeCodexTransport({ codexImpl: fakeCodex(() => ({ finalResponse: textJson() }), cap), apiKey: 'k' });
  await t(reqOf([
    { type: 'text', text: 'the signals say X' },
    { type: 'image', source: { media_type: 'image/png', data: b64 } },
  ]), {});
  assert.ok(Array.isArray(cap.input), 'with a crop ⇒ a structured input array');
  assert.match(cap.input.find((i) => i.type === 'text').text, /the signals say X/, 'text rides inline');
  const img = cap.input.find((i) => i.type === 'local_image');
  assert.ok(img && img.path.endsWith('.png'), 'the crop is sent as a local_image PATH (not inline base64)');
  assert.deepEqual(cap.imagesExist, [true], 'the temp crop file existed at run() time');
  assert.ok(!JSON.stringify(cap.input).includes(b64), 'the base64 is written to disk, never inlined into the input');
});

test('codex VISION: V3_CODEX_VISION=0 → text-only fallback (note, no image files)', async () => {
  const prev = process.env.V3_CODEX_VISION; process.env.V3_CODEX_VISION = '0';
  try {
    const cap = {};
    await makeCodexTransport({ codexImpl: fakeCodex(() => ({ finalResponse: textJson() }), cap), apiKey: 'k' })(
      reqOf([{ type: 'text', text: 'T' }, { type: 'image', source: { data: 'AAAA' } }]), {});
    assert.equal(typeof cap.input, 'string', 'opted out ⇒ a plain text prompt');
    assert.match(cap.input, /1 visual crop\(s\) captured but omitted/, 'notes the omitted crop');
  } finally { if (prev === undefined) delete process.env.V3_CODEX_VISION; else process.env.V3_CODEX_VISION = prev; }
});

test('codex TOOLS: mcpServers is wired into Codex config.mcp_servers (cdp tools over HTTP MCP)', async () => {
  const cap = {};
  const mcp = { cdp: { url: 'http://127.0.0.1:1234/mcp' } };
  await makeCodexTransport({ codexImpl: fakeCodex(() => ({ finalResponse: textJson() }), cap), apiKey: 'k', mcpServers: mcp })(reqOf([{ type: 'text', text: 'j' }]), {});
  assert.deepEqual(cap.ctor.config.mcp_servers, mcp, 'the cdp MCP server URL is passed to Codex via config.mcp_servers');
});

test('codex TOOLS: disableTools (envelope-repair pass) drops the MCP servers', async () => {
  const cap = {};
  await makeCodexTransport({ codexImpl: fakeCodex(() => ({ finalResponse: textJson() }), cap), apiKey: 'k', mcpServers: { cdp: { url: 'x' } } })(
    { messages: [{ content: [{ type: 'text', text: 'j' }] }], disableTools: true }, {});
  assert.ok(!cap.ctor.config, 'the repair pass is a single plain completion — no tools/MCP');
});

test('codex: result-shape robustness — finalResponse.text / output / items', async () => {
  const mk = (r) => makeCodexTransport({ codexImpl: fakeCodex(() => r), apiKey: 'k' });
  assert.match((await mk({ finalResponse: { text: textJson() } })(reqOf([{ type: 'text', text: 'j' }]), {})).content[0].text, /REPRODUCED/);
  assert.match((await mk({ output: textJson() })(reqOf([{ type: 'text', text: 'j' }]), {})).content[0].text, /REPRODUCED/);
  assert.match((await mk({ items: [{ text: 'noise' }, { message: { text: textJson() } }] })(reqOf([{ type: 'text', text: 'j' }]), {})).content[0].text, /REPRODUCED/);
});

test('codex: degrades to null on run error and on empty result (lane inert, never throws)', async () => {
  const err = makeCodexTransport({ codexImpl: fakeCodex(() => { throw new Error('not logged in'); }), apiKey: 'k', maxRetries: 0 });
  assert.equal(await err(reqOf([{ type: 'text', text: 'j' }]), {}), null, 'auth/SDK error ⇒ null (inert until codex login)');
  const empty = makeCodexTransport({ codexImpl: fakeCodex(() => ({})), apiKey: 'k' });
  assert.equal(await empty(reqOf([{ type: 'text', text: 'j' }]), {}), null, 'no extractable text ⇒ null');
});

test('codex: a transportFail trace is emitted on degrade (lifted into the noVerdict log)', async () => {
  const events = [];
  const t = makeCodexTransport({ codexImpl: fakeCodex(() => ({})), apiKey: 'k' });
  await t(reqOf([{ type: 'text', text: 'j' }]), { onTrace: (e) => events.push(e) });
  const fail = events.find((e) => e.type === 'transportFail');
  assert.ok(fail && fail.provider === 'codex', 'emits a codex transportFail');
  assert.equal(fail.mode, 'empty');
});

// --- the in-process HTTP MCP bridge (buildCdpHttpMcpServer) the Codex agent connects to ---
test('cdp HTTP MCP bridge: a client lists + calls the cdp tools over HTTP → routes to dispatch', async () => {
  const cdp = require('../../lib/cdp-tools.js');
  const { Client } = await import('@modelcontextprotocol/sdk/client/index.js');
  const { StreamableHTTPClientTransport } = await import('@modelcontextprotocol/sdk/client/streamableHttp.js');
  // a fake dispatch (no live browser) — proves the MCP server <-> dispatch wiring, not the cdp handlers themselves.
  const calls = [];
  const dispatch = {
    declarations: [{ name: 'query_ax_node', description: 'resolve a node', parameters: { type: 'object', properties: { targetXpath: { type: 'string' } } } }],
    call: async (name, args) => { calls.push({ name, args }); return { role: 'link', name: 'OK' }; },
  };
  const srv = await cdp.buildCdpHttpMcpServer(dispatch);
  assert.match(srv.url, /^http:\/\/127\.0\.0\.1:\d+\/mcp$/, 'serves a localhost MCP URL');
  const client = new Client({ name: 'test', version: '1.0.0' });
  try {
    await client.connect(new StreamableHTTPClientTransport(new URL(srv.url)));
    // lever 1: the server advertises the verify-before-judging `instructions` Codex reads at init to decide tool use.
    const instr = client.getInstructions();
    assert.match(instr || '', /before you flag OR clear a barrier, CALL the relevant tool/, 'server advertises tool-use instructions');
    const list = await client.listTools();
    assert.ok(list.tools.find((t) => t.name === 'query_ax_node'), 'tools/list exposes the cdp tool with its inputSchema');
    const res = await client.callTool({ name: 'query_ax_node', arguments: { targetXpath: '/html/body' } });
    assert.match(res.content[0].text, /"role":"link"/, 'tools/call returns the dispatch result as JSON text');
    assert.deepEqual(calls, [{ name: 'query_ax_node', args: { targetXpath: '/html/body' } }], 'routed name+args to dispatch.call');
  } finally { try { await client.close(); } catch (e) {} await srv.close(); }
});

// Tool exposure IN THE PROMPT (the agent ignored the MCP `instructions` channel) — the directive + tool catalog are
// prepended to the USER message; skipped on the disableTools repair pass.
test('codex TOOLS: the tool catalog is exposed IN THE PROMPT (opt-in V3_CODEX_TOOL_PROMPT=1)', async () => {
  const prev = process.env.V3_CODEX_TOOL_PROMPT; process.env.V3_CODEX_TOOL_PROMPT = '1';
  try {
    const cap = {};
    const catalog = [{ name: 'resolve_destination', description: 'follow a link and return where it goes (2.4.4)' }, { name: 'capture_full_page', description: 'screenshot the whole scrollable page' }];
    await makeCodexTransport({ codexImpl: fakeCodex(() => ({ finalResponse: textJson() }), cap), apiKey: 'k', mcpServers: { cdp: { url: 'http://x/mcp' } }, toolCatalog: catalog })(reqOf([{ type: 'text', text: 'judge this' }]), {});
    assert.match(cap.input, /LIVE TOOLS/, 'the prompt leads with the tool directive');
    assert.match(cap.input, /resolve_destination/, 'names the cdp tools in the prompt');
    assert.match(cap.input, /CALL the relevant tool/, 'a hard call-the-tools-first rule');
    assert.match(cap.input, /judge this/, 'the original prompt is preserved after the directive');
  } finally { if (prev === undefined) delete process.env.V3_CODEX_TOOL_PROMPT; else process.env.V3_CODEX_TOOL_PROMPT = prev; }
});

test('codex TOOLS: directive is OFF by default and skipped on the disableTools repair pass', async () => {
  const cap1 = {}; // default (flag unset) ⇒ no directive even with a catalog
  await makeCodexTransport({ codexImpl: fakeCodex(() => ({ finalResponse: textJson() }), cap1), apiKey: 'k', mcpServers: { cdp: { url: 'x' } }, toolCatalog: [{ name: 't', description: 'd' }] })(reqOf([{ type: 'text', text: 'j' }]), {});
  assert.ok(!/LIVE TOOLS/.test(cap1.input), 'OFF by default (empirically it did not help + cost tokens)');
  const prev = process.env.V3_CODEX_TOOL_PROMPT; process.env.V3_CODEX_TOOL_PROMPT = '1';
  try {
    const cap2 = {};
    await makeCodexTransport({ codexImpl: fakeCodex(() => ({ finalResponse: textJson() }), cap2), apiKey: 'k', mcpServers: { cdp: { url: 'x' } }, toolCatalog: [{ name: 't', description: 'd' }] })(
      { messages: [{ content: [{ type: 'text', text: 'j' }] }], disableTools: true }, {});
    assert.ok(!/LIVE TOOLS/.test(cap2.input), 'even ON, the repair pass carries no tool directive');
  } finally { if (prev === undefined) delete process.env.V3_CODEX_TOOL_PROMPT; else process.env.V3_CODEX_TOOL_PROMPT = prev; }
});
