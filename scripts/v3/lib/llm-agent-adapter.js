'use strict';
// Harness 3.2 — the injectable multimodal `runAgent` adapter. `runAdjudication`/`runRubricJudgments`
// take an injected `runAgent(messages, subject)` (default REFUSES so no run accidentally hits a paid
// API). This module builds a REAL one: it maps our `buildMessages` blocks (text + base64 image) to a
// chat-completion request, calls an injectable `transport`, and parses the model's STRICT-JSON reply
// into `{ verdict, confidence, summary, reasoning, evidenceRefs }`. The `transport` is injected so the
// adapter is unit-testable with a mock (no network); the production transport is a thin `fetch` to the
// Anthropic Messages API, keyed from the environment (the key lives in .env — never committed).
const { V2_9_VERDICTS } = require('./llm-adjudicator.js');
const LIMITS = require('./limits.js'); // LLM-lane budget DEFAULTS (tier C)

// Extract the FIRST BALANCED top-level {...} JSON object (respecting string literals + escapes). A greedy
// /\{[\s\S]*\}/ over-captures to the LAST '}', so any trailing brace (a markdown fence, a CSS snippet, a
// set-builder note in the model's prose) would drop a perfectly valid verdict (adversarial MED).
function firstJsonObject(text) {
  const start = text.indexOf('{');
  if (start < 0) return null;
  let depth = 0, inStr = false, esc = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inStr = false; continue; }
    if (ch === '"') inStr = true;
    else if (ch === '{') depth++;
    else if (ch === '}') { if (--depth === 0) return text.slice(start, i + 1); }
  }
  return null;
}

// Parse the model's reply text → the structured verdict. Tolerates prose around the JSON; fails closed
// (null) on anything that isn't a well-formed verdict, so the producer drops it rather than guessing.
function parseAgentReply(text) {
  if (typeof text !== 'string') return null;
  const span = firstJsonObject(text);
  if (span == null) return null;
  let obj;
  try { obj = JSON.parse(span); } catch (e) { return null; }
  if (!obj || typeof obj !== 'object' || !V2_9_VERDICTS.includes(obj.verdict)) return null;
  return {
    verdict: obj.verdict,
    confidence: typeof obj.confidence === 'string' ? obj.confidence : 'low',
    summary: typeof obj.summary === 'string' ? obj.summary : '',
    reasoning: typeof obj.reasoning === 'string' ? obj.reasoning : '',
    evidenceRefs: Array.isArray(obj.evidenceRefs) ? obj.evidenceRefs.map(String) : [],
  };
}

// Map our buildMessages blocks → Anthropic content blocks (text + image/base64).
function toAnthropicContent(messages) {
  return (messages || []).map((b) => (b && b.type === 'image')
    ? { type: 'image', source: { type: 'base64', media_type: b.mediaType || 'image/png', data: b.data } }
    : { type: 'text', text: (b && b.text) || '' });
}

// Keep the trace TEXTUAL. Several CDP tools return full base64 PNGs INSIDE their result JSON (set_state_and_capture,
// request_hi_res_crop, render_with_overrides, …); those pixels already live in llm-vision.json by opaque id, so they
// must NOT bloat (megabytes/turn) or leak into the reasoning trace. Elide any long base64 run + cap each block.
const TRACE_BLOCK_CAP = 20000;
function elideBase64(s) {
  return typeof s === 'string'
    ? s.replace(/[A-Za-z0-9+/]{512,}={0,2}/g, (m) => `<base64 ${m.length} chars elided>`).slice(0, TRACE_BLOCK_CAP)
    : s;
}
function scrubTraceContent(content) {
  if (typeof content === 'string') return elideBase64(content);
  if (Array.isArray(content)) return content.map((b) => (b && b.type === 'text' && typeof b.text === 'string') ? { ...b, text: elideBase64(b.text) } : (b && typeof b === 'object' ? { type: b.type } : b));
  return content;
}

// Compact, JSON-serializable view of ONE SDK stream message for the full-trace log (offline analysis). Captures
// exactly what the transport otherwise DROPS: model thinking, tool_use (name+input), tool_result (the objective
// JSON a CDP tool returned, pixels elided), and the final result's usage/cost — alongside the assistant text.
function summarizeSdkMessage(msg) {
  if (!msg || typeof msg !== 'object') return { type: 'unknown' };
  const t = msg.type;
  if (t === 'assistant' || t === 'user') {
    const content = (msg.message && Array.isArray(msg.message.content)) ? msg.message.content : [];
    const blocks = content.map((b) => {
      if (!b || typeof b !== 'object') return { kind: 'other' };
      if (b.type === 'text') return { kind: 'text', text: elideBase64(String(b.text || '')) };
      if (b.type === 'thinking') return { kind: 'thinking', text: elideBase64(String(b.thinking || '')) };
      if (b.type === 'redacted_thinking') return { kind: 'thinking', redacted: true };
      if (b.type === 'tool_use') return { kind: 'tool_use', id: b.id, name: b.name, input: b.input };
      if (b.type === 'tool_result') return { kind: 'tool_result', toolUseId: b.tool_use_id, isError: !!b.is_error, content: scrubTraceContent(b.content) };
      return { kind: b.type || 'other' };
    });
    return { type: t, role: (msg.message && msg.message.role) || t, blocks };
  }
  if (t === 'result') return { type: 'result', subtype: msg.subtype, isError: !!msg.is_error, numTurns: msg.num_turns, usage: msg.usage, totalCostUsd: msg.total_cost_usd };
  return { type: t || 'unknown' };
}

// Build a runAgent from a transport. transport(request, { onTrace }) -> { content: [{type:'text', text}] } (or throws).
// model defaults to a vision-capable Claude. A transport error/timeout returns null (producer drops it). When the
// transport reports a turn-by-turn trace via onTrace, it is attached as `out.trace` (the adjudicator lifts it).
function makeRunAgent({ transport, model = 'claude-opus-4-8', maxTokens = LIMITS.llm.maxTokens } = {}) {
  if (typeof transport !== 'function') throw new Error('makeRunAgent: a transport function is required');
  return async function runAgent(messages, _subject) {
    const request = { model, max_tokens: maxTokens, messages: [{ role: 'user', content: toAnthropicContent(messages) }] };
    const trace = [];
    let res;
    try { res = await transport(request, { onTrace: (e) => { if (e) trace.push(e); } }); } catch (e) { return null; }
    const text = res && Array.isArray(res.content) ? res.content.filter((c) => c && c.type === 'text').map((c) => c.text).join('\n') : (typeof res === 'string' ? res : null);
    const parsed = parseAgentReply(text);
    if (parsed && trace.length) parsed.trace = trace; // full reasoning/tool trace → surfaced into llm-trace.json
    return parsed;
  };
}

// Production transport: POST to the Anthropic Messages API. `fetchImpl` is injectable (defaults to the
// global fetch). Returns null on a non-OK response so the producer degrades rather than throwing.
function makeAnthropicTransport({ apiKey, fetchImpl, baseUrl = 'https://api.anthropic.com/v1/messages', version = '2023-06-01', timeoutMs = LIMITS.llm.httpTimeoutMs } = {}) {
  const f = fetchImpl || (typeof fetch === 'function' ? fetch : null);
  if (!apiKey) throw new Error('makeAnthropicTransport: apiKey required (set V3_LLM_KEY / ANTHROPIC_API_KEY in .env)');
  if (!f) throw new Error('makeAnthropicTransport: no fetch available');
  return async function transport(request) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const r = await f(baseUrl, { method: 'POST', signal: ctrl.signal, headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': version }, body: JSON.stringify(request) });
      if (!r || !r.ok) return null;
      return await r.json();
    } catch (e) { return null; } // timeout/abort, fetch rejection, or r.json() error ⇒ degrade to null (per the docstring), never throw
    finally { clearTimeout(t); }
  };
}

// CROSS-FAMILY transport: Google Gemini (generateContent REST), keyed from GEMINI_API_KEY. Maps our Anthropic-format
// `request` (text + base64-image content blocks) → Gemini `contents[].parts[]` ({text} / {inlineData}) and returns the
// `{ content:[{type:'text',text}] }` shape makeRunAgent expects (or null to degrade). Used for the "entire LLM lane on
// Gemini" comparison experiment (single-shot judge; no tools). NOTE: gemini-3.5-flash is a THINKING model that spends
// ~600-900 output tokens on internal reasoning BEFORE the verdict — a small maxOutputTokens truncates to MAX_TOKENS
// (empty output), so the default budget is generous. fetchImpl injectable for tests.
function makeGeminiTransport({ apiKey, model = 'gemini-3.5-flash', fetchImpl, maxOutputTokens = 4096, temperature = 0,
  baseUrl = 'https://generativelanguage.googleapis.com/v1beta', timeoutMs = LIMITS.llm.httpTimeoutMs,
  maxRetries = LIMITS.llm.maxRetries, baseBackoffMs = LIMITS.llm.baseBackoffMs } = {}) {
  const f = fetchImpl || (typeof fetch === 'function' ? fetch : null);
  if (!apiKey) throw new Error('makeGeminiTransport: apiKey required (set GEMINI_API_KEY in .env)');
  if (!f) throw new Error('makeGeminiTransport: no fetch available');
  const toParts = (content) => (content || []).map((b) => (b && b.type === 'image' && b.source)
    ? { inlineData: { mimeType: b.source.media_type || 'image/png', data: b.source.data } }
    : { text: (b && b.text) || '' });
  return async function transport(request, callOpts = {}) {
    const msg = (request.messages && request.messages[0]) || { content: [] };
    const body = { contents: [{ role: 'user', parts: toParts(msg.content) }], generationConfig: { temperature, maxOutputTokens } };
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        const r = await f(`${baseUrl}/models/${model}:generateContent?key=${apiKey}`, { method: 'POST', signal: ctrl.signal, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
        if (r.status === 429 || r.status >= 500) { clearTimeout(t); await new Promise((res) => setTimeout(res, baseBackoffMs * (attempt + 1))); continue; }
        if (!r.ok) { clearTimeout(t); return null; }
        const j = await r.json();
        const cand = j && j.candidates && j.candidates[0];
        const text = cand && cand.content && Array.isArray(cand.content.parts) ? cand.content.parts.map((p) => p.text || '').join('') : null;
        if (typeof callOpts.onTrace === 'function' && j.usageMetadata) callOpts.onTrace({ type: 'result', usage: { input_tokens: j.usageMetadata.promptTokenCount, output_tokens: j.usageMetadata.candidatesTokenCount } });
        return text ? { content: [{ type: 'text', text }] } : null;
      } catch (e) { await new Promise((res) => setTimeout(res, baseBackoffMs * (attempt + 1))); }
      finally { clearTimeout(t); }
    }
    return null;
  };
}

// Production transport via the Claude Agent SDK + the Claude Code SUBSCRIPTION (OAuth, NO metered key).
// Maps our Anthropic-format `request` → an SDK streaming-input `query()` and returns the same
// `{ content:[{type:'text',text}] }` shape `makeRunAgent` expects (or null to degrade). Verified empirically:
// the SDK authenticates from `CLAUDE_CODE_OAUTH_TOKEN` with no `ANTHROPIC_API_KEY`, accepts image content
// blocks via streaming input, and `settingSources:[]` isolation coexists with the OAuth token (unlike
// `--bare`, which disables it). The ESM-only SDK is LAZY-imported so the (CommonJS) harness loads + tests
// without it when the lane is OFF; `queryImpl` is injectable so unit tests need no SDK and no network.
// Safeguards: maxTurns cap, per-turn stall timeout (env) + whole-run AbortController timeout, and
// exponential backoff + retry on 429/overloaded (the real subscription governor — no hard concurrent cap).
function makeClaudeSdkTransport(opts = {}) {
  const {
    queryImpl = null, oauthToken, model,
    perTurnTimeoutMs = LIMITS.llm.perTurnTimeoutMs, runTimeoutMs = LIMITS.llm.runTimeoutMs,
    settingSources = [], maxTurns = LIMITS.llm.maxTurns, allowedTools = [], mcpServers = null,
    maxRetries = LIMITS.llm.maxRetries, baseBackoffMs = LIMITS.llm.baseBackoffMs, maxBackoffMs = LIMITS.llm.maxBackoffMs,
    effort = 'medium', // reasoning/thinking depth: SDK EffortLevel ('low'|'medium'|'high'|'xhigh'|'max'). Sonnet → medium.
    getExtraDeadlineMs = null, // tool path: () => accumulated tab-queue wait, SUBTRACTED from the deadline (timer-pause)
    onTraceSink = null, // PERSISTENT trace sink (token/usage telemetry) — fires for EVERY message, independent of the
    // per-call callOpts.onTrace (which builds the verdict's trace). Lives on the config so it rides `...llmTransportConfig`
    // into the tool transport orchestrate builds internally — keeping a tools-on run's token telemetry honest too.
  } = opts;
  let _query = queryImpl;
  const getQuery = async () => {
    if (_query) return _query;
    try { const mod = await import('@anthropic-ai/claude-agent-sdk'); _query = mod.query; return _query; }
    catch (e) { return null; } // SDK absent ⇒ no transport (the lane should be OFF then)
  };
  // 429 / overloaded / SDK terminal rate-limit reasons ⇒ retriable.
  const isOverloaded = (x) => /\b429\b|overloaded|rate.?limit|too many requests|blocking_limit|rapid_refill_breaker/i.test(String(x == null ? '' : (x.message || x)));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const backoffMs = (attempt) => Math.min(maxBackoffMs, baseBackoffMs * (2 ** attempt)) + Math.floor(Math.random() * 500);

  return async function transport(request, callOpts) {
    const onTrace = callOpts && typeof callOpts.onTrace === 'function' ? callOpts.onTrace : null;
    const q = await getQuery();
    if (typeof q !== 'function') return null;
    const content = (request && request.messages && request.messages[0] && request.messages[0].content) || [];
    const useModel = (request && request.model) || model || 'claude-sonnet-4-6';
    async function* input() { yield { type: 'user', parent_tool_use_id: null, message: { role: 'user', content } }; }

    // ONE deadline for the WHOLE sequence (hoisted before the retry loop): each attempt gets the REMAINING
    // budget, so total wall-clock can't reach (maxRetries+1)×runTimeoutMs by re-arming the timer per retry.
    // getExtraDeadlineMs (a live tool session's ACCUMULATED tab-queue wait) is SUBTRACTED from the deadline so time
    // a tool spent PARKED waiting for a shared tab is never charged to the model's budget — timer-pause-while-queued
    // extended to the tool lane. The single-shot path (no tool session) keeps the exact prior setTimeout behavior.
    const deadline = Date.now() + runTimeoutMs;
    // RATE-LIMIT / BACKOFF CREDIT: time parked on a 429/overloaded backoff sleep (this lane's retry) or inside an SDK
    // rate_limit_event is THROTTLE WAIT, not model work — credit it back to the deadline so a throttled call is never
    // aborted for time it spent parked, exactly like the tab-queue credit (getExtraDeadlineMs). A slow-but-progressing
    // turn is real work and is NOT credited.
    let backoffCreditMs = 0;
    const dueAt = () => deadline + (getExtraDeadlineMs ? (Number(getExtraDeadlineMs()) || 0) : 0) + backoffCreditMs;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (dueAt() - Date.now() <= 0) return null; // whole-run budget (excluding queue-wait) exhausted before this attempt
      const ctrl = new AbortController();
      // tool path POLLS so mid-call clone-waits keep extending the effective deadline; single-shot keeps one timer.
      let timer = null, guard = null;
      if (getExtraDeadlineMs) { guard = setInterval(() => { if (Date.now() >= dueAt()) ctrl.abort(); }, Math.max(5, Math.min(250, Math.floor(runTimeoutMs / 8)))); if (guard.unref) guard.unref(); }
      else { timer = setTimeout(() => ctrl.abort(), deadline - Date.now()); }
      const clearGuards = () => { if (timer) clearTimeout(timer); if (guard) clearInterval(guard); };
      let text = '', overloaded = false, rlStart = 0;
      try {
        const env = { ...process.env, CLAUDE_CODE_OAUTH_TOKEN: oauthToken || process.env.CLAUDE_CODE_OAUTH_TOKEN || '', CLAUDE_ASYNC_AGENT_STALL_TIMEOUT_MS: String(perTurnTimeoutMs) };
        delete env.ANTHROPIC_API_KEY; delete env.ANTHROPIC_AUTH_TOKEN; // never let a metered key into the child
        // tools:[] DISABLES every built-in Claude Code tool (Bash, ToolSearch/deferred-loader, Read/Edit/…). The
        // judge's ONLY tools are the cdp MCP server (when present, gated by allowedTools 'mcp__cdp__*'). Without
        // this the smoke run showed the judge burning turns on ToolSearch (thinking the cdp tools were deferred —
        // "No matching deferred tools found") and even running Bash; allowedTools alone is NOT exclusive of built-ins.
        const options = { maxTurns, allowedTools, settingSources, model: useModel, abortController: ctrl, env, tools: [] };
        if (mcpServers) options.mcpServers = mcpServers;
        if (effort) options.effort = effort; // SDK guides thinking depth by effort (works with adaptive thinking)
        for await (const msg of q({ prompt: input(), options })) {
          if (msg && msg.type === 'rate_limit_event') { if (!rlStart) rlStart = Date.now(); }   // SDK throttle began → start crediting the wait
          else if (rlStart) { backoffCreditMs += Date.now() - rlStart; rlStart = 0; }            // throttle ended → credit the parked wall-clock back
          if (onTrace || onTraceSink) { const ev = summarizeSdkMessage(msg); // FULL trace: text/thinking/tool_use/tool_result/result
            if (onTrace) { try { onTrace(ev); } catch (e) {} }            // per-call sink → the verdict's attached trace
            if (onTraceSink) { try { onTraceSink(ev); } catch (e) {} } }  // persistent sink → live token/usage telemetry
          if (msg && msg.type === 'assistant') {
            const tt = (msg.message && Array.isArray(msg.message.content) ? msg.message.content : []).filter((b) => b && b.type === 'text').map((b) => b.text).join('\n');
            if (tt) text += (text ? '\n' : '') + tt;
          } else if (msg && msg.type === 'result' && (msg.is_error || (msg.subtype && msg.subtype !== 'success'))) {
            if (isOverloaded(msg.subtype) || isOverloaded(msg.result)) overloaded = true;
          }
        }
      } catch (e) {
        if (ctrl.signal.aborted) { clearGuards(); return null; } // whole-run timeout ⇒ degrade
        if (isOverloaded(e)) overloaded = true; // else: fall through to degrade below
      } finally { clearGuards(); }

      if (text && !overloaded) return { content: [{ type: 'text', text }] };
      if (overloaded && attempt < maxRetries) { const b = backoffMs(attempt); backoffCreditMs += b; await sleep(b); continue; } // credit the backoff sleep to the deadline (throttle wait, not model work)
      return text ? { content: [{ type: 'text', text }] } : null; // exhausted / fatal / empty ⇒ degrade
    }
    return null;
  };
}

module.exports = { makeRunAgent, makeAnthropicTransport, makeClaudeSdkTransport, makeGeminiTransport, parseAgentReply, toAnthropicContent };
