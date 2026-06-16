'use strict';
// Harness 3.2 — the injectable multimodal `runAgent` adapter. `runAdjudication`/`runRubricJudgments`
// take an injected `runAgent(messages, subject)` (default REFUSES so no run accidentally hits a paid
// API). This module builds a REAL one: it maps our `buildMessages` blocks (text + base64 image) to a
// chat-completion request, calls an injectable `transport`, and parses the model's STRICT-JSON reply
// into `{ verdict, confidence, summary, reasoning, evidenceRefs }`. The `transport` is injected so the
// adapter is unit-testable with a mock (no network); the production transport is a thin `fetch` to the
// Anthropic Messages API, keyed from the environment (the key lives in .env — never committed).
const { V2_9_VERDICTS } = require('./llm-adjudicator.js');

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

// Build a runAgent from a transport. transport(request) -> { content: [{type:'text', text}] } (or throws).
// model defaults to a vision-capable Claude. A transport error/timeout returns null (producer drops it).
function makeRunAgent({ transport, model = 'claude-opus-4-8', maxTokens = 1024 } = {}) {
  if (typeof transport !== 'function') throw new Error('makeRunAgent: a transport function is required');
  return async function runAgent(messages, _subject) {
    const request = { model, max_tokens: maxTokens, messages: [{ role: 'user', content: toAnthropicContent(messages) }] };
    let res;
    try { res = await transport(request); } catch (e) { return null; }
    const text = res && Array.isArray(res.content) ? res.content.filter((c) => c && c.type === 'text').map((c) => c.text).join('\n') : (typeof res === 'string' ? res : null);
    return parseAgentReply(text);
  };
}

// Production transport: POST to the Anthropic Messages API. `fetchImpl` is injectable (defaults to the
// global fetch). Returns null on a non-OK response so the producer degrades rather than throwing.
function makeAnthropicTransport({ apiKey, fetchImpl, baseUrl = 'https://api.anthropic.com/v1/messages', version = '2023-06-01', timeoutMs = 60000 } = {}) {
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

module.exports = { makeRunAgent, makeAnthropicTransport, parseAgentReply, toAnthropicContent };
