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

// ENVELOPE-REPAIR re-prompt: the model answered but the verdict envelope was unparseable (prose only, a
// fenced/truncated object, or a non-canonical token like "LIKELY_BARRIER"/"FAIL"). This is the dominant
// noVerdict cause in the FN run (cc0f0a, d0f69e: the model DID the analysis but botched the JSON). Hand the
// model its OWN prior reply and ask for ONLY the JSON object — so it reformats its existing conclusion
// rather than re-deciding. Tool-free + image-free (see disableTools below): cheap, no re-navigation.
function reformatPrompt(badText) {
  return [
    'Your previous reply could not be parsed as the required strict-JSON verdict. This is exactly what you wrote:',
    '--- YOUR PREVIOUS REPLY ---',
    String(badText == null ? '' : badText).slice(0, 8000),
    '--- END ---',
    'Re-express that SAME conclusion as ONE JSON object and NOTHING else — no prose, no markdown fence, no code block:',
    '{"verdict": <verdict>, "confidence": "high|medium|low", "summary": "<one line>", "reasoning": "<brief>", "evidenceRefs": []}',
    'The "verdict" value MUST be EXACTLY one of these four strings: ' + V2_9_VERDICTS.map((v) => JSON.stringify(v)).join(', ') + '.',
    'Do NOT invent other tokens (no "LIKELY_*", "FAIL", "PASS"). If your analysis was inconclusive or you could not verify, use "PARTIAL".',
  ].join('\n');
}

// Durable noVerdict diagnostic. Every null runAgent return IS a noVerdict, but is otherwise SILENT — the trace is
// discarded (only attached when a verdict survives) so the case shows empty agentVerdicts with no recorded reason
// (exactly why the FN run's 18 gemini noVerdicts were un-diagnosable post-hoc). Emit ONE structured stderr line
// classifying WHY: `transport-null` (the transport degraded — HTTP / timeout / MAX_TOKENS-empty / turn-exhaustion;
// the transport pushed a `transportFail` trace event carrying the mechanism) vs `unparseable-envelope` (the model
// replied but the JSON could not be extracted even after the reformat retry — a preview is logged). The harness's
// stderr redirect captures it into the run log; grep `[v3:noVerdict]`. Opt out with V3_NOVERDICT_LOG=0.
function emitNoVerdict(subject, text, trace, retries) {
  if (process.env.V3_NOVERDICT_LOG === '0') return;
  const r = retries || {};
  const fail = [...(trace || [])].reverse().find((e) => e && e.type === 'transportFail') || null;
  const hadText = typeof text === 'string' && text.trim().length > 0;
  const degenerate = looksDegenerate(text);
  const rec = {
    reason: degenerate ? 'degenerate-loop' : (hadText ? 'unparseable-envelope' : 'transport-null'),
    provider: fail ? fail.provider : null,
    mode: fail ? fail.mode : null,
    finishReason: fail ? (fail.finishReason || null) : null,
    sc: (subject && subject.sc) || null,
    skill: (subject && subject.skill) || null,
    xpath: subject && subject.xpath ? String(subject.xpath).slice(0, 70) : null,
    textLen: typeof text === 'string' ? text.length : 0,
    reformatRetried: !!r.reformatRetried,
    degenRetried: !!r.degenRetried,
  };
  if (hadText) rec.preview = String(text).replace(/\s+/g, ' ').slice(0, 160);
  try { process.stderr.write(`[v3:noVerdict] ${JSON.stringify(rec)}\n`); } catch (e) { /* logging must never throw */ }
}

// Build a runAgent from a transport. transport(request, { onTrace }) -> { content: [{type:'text', text}] } (or throws).
// model defaults to a vision-capable Claude. A transport error/timeout returns null (producer drops it). When the
// transport reports a turn-by-turn trace via onTrace, it is attached as `out.trace` (the adjudicator lifts it).
function makeRunAgent({ transport, model = 'claude-opus-4-8', maxTokens = LIMITS.llm.maxTokens } = {}) {
  if (typeof transport !== 'function') throw new Error('makeRunAgent: a transport function is required');
  const reformatRetry = process.env.V3_LLM_REFORMAT_RETRY !== '0'; // default ON; opt-out for ablation/determinism studies
  return async function runAgent(messages, _subject) {
    const request = { model, max_tokens: maxTokens, messages: [{ role: 'user', content: toAnthropicContent(messages) }] };
    const trace = [];
    const runOnce = async (req) => {
      let res;
      try { res = await transport(req, { onTrace: (e) => { if (e) trace.push(e); } }); } catch (e) { return null; }
      return res && Array.isArray(res.content) ? res.content.filter((c) => c && c.type === 'text').map((c) => c.text).join('\n') : (typeof res === 'string' ? res : null);
    };
    const text = await runOnce(request);
    let parsed = parseAgentReply(text);
    let reformatRetried = false, degenRetried = false;
    let textForReformat = text; // the text the reformat path will try (swapped/cleared by the degeneration retry)
    // DEGENERATION RETRY (runs FIRST): the reply is a low-entropy repetition loop ("0000…") — not reformattable, since
    // re-asking for ONLY the JSON re-degenerates. Re-issue the ORIGINAL request with a PERTURBED temperature
    // (`temperatureOverride`, honored by the Gemini transports) to break the greedy loop. Opt out V3_DEGEN_RETRY=0.
    if (!parsed && process.env.V3_DEGEN_RETRY !== '0' && looksDegenerate(text)) {
      degenRetried = true;
      const temp = Number(process.env.V3_DEGEN_TEMP) || 0.5;
      const text2 = await runOnce({ ...request, temperatureOverride: temp });
      parsed = parseAgentReply(text2);
      if (parsed) parsed.degenRetried = true;
      else textForReformat = looksDegenerate(text2) ? null : text2; // a STILL-degenerate retry isn't worth reformatting
    }
    // REFORMAT RETRY: the model replied but the envelope was unparseable. Re-ask for ONLY the JSON, handing
    // back its own text. disableTools (honored by the tool transports) keeps this a single plain completion —
    // it must not re-run the agentic tool loop (which on the Claude SDK path would re-clone/re-navigate pages).
    // Skipped when there is no (non-degenerate) text to repair (degrade to null as before).
    if (!parsed && reformatRetry && typeof textForReformat === 'string' && textForReformat.trim().length && !looksDegenerate(textForReformat)) {
      reformatRetried = true;
      const retryReq = { model, max_tokens: maxTokens, disableTools: true, messages: [{ role: 'user', content: [{ type: 'text', text: reformatPrompt(textForReformat) }] }] };
      const text2 = await runOnce(retryReq);
      parsed = parseAgentReply(text2);
      if (parsed) parsed.reformatRetried = true;
    }
    if (parsed && trace.length) parsed.trace = trace; // full reasoning/tool trace → surfaced into llm-trace.json
    if (!parsed) emitNoVerdict(_subject, text, trace, { reformatRetried, degenRetried }); // durable diagnostic for the silent noVerdict
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

// Gemini recovery knobs (both transports). On `finishReason: MAX_TOKENS` with no usable output, gemini-flash spent its
// whole output budget on internal thinking and emitted nothing — DOUBLE the budget once (capped) and re-issue rather
// than degrade to null. GEMINI_MAXTOK_CEIL bounds the doubling so a runaway can't balloon cost. CONCLUDE_INSTRUCTION
// drives the tool-loop forced-conclusion fallback: when the loop ends with empty text, one tools-off call demands ONLY
// the verdict JSON from the evidence already gathered (the dominant Gemini noVerdict cause was the loop returning null).
const GEMINI_MAXTOK_CEIL = 16384;
const CONCLUDE_INSTRUCTION = 'You have gathered sufficient evidence from the tools above. Do NOT request any more tools. Respond NOW with ONLY the final JSON verdict object exactly as specified in the task instructions (keys: verdict, confidence, summary, reasoning, evidenceRefs) — no preamble, no explanation, no markdown code fence, just the JSON object.';

// TOOL-RESULT IMAGE EXTRACTION (the capture_full_page noVerdict fix). Several cdp tools return a base64 PNG
// (capture_full_page/_element → `screenshot`, render_under_transform → `screenshot`, observe_state_after_activation →
// `screenshots.{before,after}`). Gemini's functionResponse is a JSON Struct: a multi-MB base64 string boxed there is
// rejected by the API (the next turn comes back null → noVerdict) AND, even if accepted, is an opaque string the model
// cannot SEE as an image. Pull every image-keyed base64 field OUT of the Struct (replace with a short placeholder note)
// and return them as Gemini `inlineData` image parts to ride alongside the functionResponse — so the model actually
// sees the pixels, mirroring the Claude MCP tool-result image-block path. Walks nested objects/arrays (the before/after
// pair). Opt out with V3_GEMINI_TOOL_IMAGES=0 (degrades to the old string-boxed behavior).
const GEMINI_IMG_KEY = /screenshot|image|before|after|render|crop/i;
const looksBase64Png = (s) => typeof s === 'string' && s.length > 256 && /^[A-Za-z0-9+/=\s]*$/.test(s.slice(0, 4096));
function extractToolImages(obj, images, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 5) return obj;
  if (Array.isArray(obj)) return obj.map((v) => extractToolImages(v, images, depth + 1));
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (GEMINI_IMG_KEY.test(k) && looksBase64Png(v)) {
      images.push({ inlineData: { mimeType: 'image/png', data: String(v).replace(/^data:image\/\w+;base64,/, '') } });
      out[k] = `[image #${images.length} attached as an image part below — judge from those pixels]`;
    } else if (v && typeof v === 'object') out[k] = extractToolImages(v, images, depth + 1);
    else out[k] = v;
  }
  return out;
}

// DEGENERATION DETECTOR. A judge (gemini-flash, observed) can collapse into a low-entropy REPETITION — e.g. emitting
// "0000…" up to the token cap. That output is long, unparseable, and the reformat-retry (which re-asks for ONLY the
// JSON) just re-degenerates the same way, so it lands as a noVerdict the transport/MAX_TOKENS fixes cannot touch (the
// model IS producing tokens, just garbage). looksDegenerate flags it so makeRunAgent can re-issue the ORIGINAL request
// with a PERTURBED (higher) temperature, which breaks the greedy loop. Heuristic on the whitespace-stripped text: a
// long run of a single repeated char OR one char dominating — neither occurs in a normal JSON verdict + prose reasoning.
const DEGEN_MIN_LEN = 200;     // below this, a short reply can't be a runaway loop
const DEGEN_RUN = 64;          // a single char repeated this many times in a row ⇒ collapse
const DEGEN_TOP_FRAC = 0.5;    // one char accounting for ≥ half of a long reply ⇒ collapse
function looksDegenerate(text) {
  if (typeof text !== 'string') return false;
  const s = text.replace(/\s+/g, '');
  if (s.length < DEGEN_MIN_LEN) return false;
  let run = 1, maxRun = 1;
  for (let i = 1; i < s.length; i++) { if (s[i] === s[i - 1]) { run++; if (run > maxRun) maxRun = run; } else run = 1; }
  if (maxRun >= DEGEN_RUN) return true;
  const freq = Object.create(null); let top = 0;
  for (const c of s) { freq[c] = (freq[c] || 0) + 1; if (freq[c] > top) top = freq[c]; }
  return top / s.length >= DEGEN_TOP_FRAC;
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
    const temp = request.temperatureOverride != null ? request.temperatureOverride : temperature; // degeneration-retry perturbation
    const body = { contents: [{ role: 'user', parts: toParts(msg.content) }], generationConfig: { temperature: temp, maxOutputTokens } };
    // failTrace records WHY this transport degraded to null (lifted by emitNoVerdict into the durable noVerdict log).
    const failTrace = (mode, finishReason) => { if (typeof callOpts.onTrace === 'function') callOpts.onTrace({ type: 'transportFail', provider: 'gemini', mode, finishReason: finishReason || null }); };
    let doubled = false;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        const r = await f(`${baseUrl}/models/${model}:generateContent?key=${apiKey}`, { method: 'POST', signal: ctrl.signal, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
        if (r.status === 429 || r.status >= 500) { clearTimeout(t); await new Promise((res) => setTimeout(res, baseBackoffMs * (attempt + 1))); continue; }
        if (!r.ok) { clearTimeout(t); failTrace(`http-${r.status}`); return null; }
        const j = await r.json();
        const cand = j && j.candidates && j.candidates[0];
        const text = cand && cand.content && Array.isArray(cand.content.parts) ? cand.content.parts.map((p) => p.text || '').join('') : null;
        if (typeof callOpts.onTrace === 'function' && j.usageMetadata) callOpts.onTrace({ type: 'result', usage: { input_tokens: j.usageMetadata.promptTokenCount, output_tokens: j.usageMetadata.candidatesTokenCount } });
        // MAX_TOKENS with empty output ⇒ thinking starved the verdict ⇒ DOUBLE the budget once and re-issue.
        if (!text && cand && cand.finishReason === 'MAX_TOKENS' && !doubled && process.env.V3_GEMINI_MAXTOK_DOUBLE !== '0') {
          doubled = true; body.generationConfig.maxOutputTokens = Math.min(maxOutputTokens * 2, GEMINI_MAXTOK_CEIL); continue;
        }
        if (text) return { content: [{ type: 'text', text }] };
        failTrace(cand && cand.finishReason === 'MAX_TOKENS' ? 'maxtokens-empty' : 'empty', cand && cand.finishReason);
        return null;
      } catch (e) { await new Promise((res) => setTimeout(res, baseBackoffMs * (attempt + 1))); }
      finally { clearTimeout(t); }
    }
    failTrace('retry-exhausted');
    return null;
  };
}

// CROSS-FAMILY MULTI-TURN transport: Google Gemini WITH FUNCTION CALLING — the tool-path analog of makeGeminiTransport,
// so the cross-family comparison can run the FULL config (tools on), not just single-shot. Drives a hand-rolled
// function-calling loop (generateContent + `tools.functionDeclarations`): send → if the model emits functionCall
// part(s), execute them via `dispatch.call(name,args)`, echo the model turn + append a user Content carrying the
// `functionResponse`(s), loop until the model returns text or maxTurns. `dispatch` is cdp-tools.buildCdpToolDispatch
// (session) → {declarations, call}. Tool results ride back as the native functionResponse object (same INFORMATION the
// Claude MCP path JSON-stringifies into text content). generativelanguage v1beta Content.role is ONLY 'user'/'model',
// so a functionResponse rides a role:'user' Content. On the FINAL allowed turn tools are disabled (forces a text
// verdict from the gathered evidence, mirroring the Claude path's maxTurns cap). Deadline mirrors the Claude SDK path:
// runTimeoutMs minus queue-wait (getExtraDeadlineMs) plus backoff credit. Degrades to null on timeout/exhaustion.
function makeGeminiToolTransport({ apiKey, model = 'gemini-3.5-flash', dispatch, fetchImpl, maxOutputTokens = 8192,
  temperature = 0, baseUrl = 'https://generativelanguage.googleapis.com/v1beta',
  runTimeoutMs = LIMITS.llm.toolRunTimeoutMs, maxTurns = LIMITS.llm.toolMaxTurns,
  maxRetries = LIMITS.llm.maxRetries, baseBackoffMs = LIMITS.llm.baseBackoffMs, maxBackoffMs = LIMITS.llm.maxBackoffMs,
  getExtraDeadlineMs = null } = {}) {
  const f = fetchImpl || (typeof fetch === 'function' ? fetch : null);
  if (!apiKey) throw new Error('makeGeminiToolTransport: apiKey required (set GEMINI_API_KEY in .env)');
  if (!f) throw new Error('makeGeminiToolTransport: no fetch available');
  if (!dispatch || !Array.isArray(dispatch.declarations) || typeof dispatch.call !== 'function') throw new Error('makeGeminiToolTransport: dispatch {declarations, call} required');
  const toParts = (content) => (content || []).map((b) => (b && b.type === 'image' && b.source)
    ? { inlineData: { mimeType: b.source.media_type || 'image/png', data: b.source.data } }
    : { text: (b && b.text) || '' });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  return async function transport(request, callOpts = {}) {
    const msg = (request.messages && request.messages[0]) || { content: [] };
    const contents = [{ role: 'user', parts: toParts(msg.content) }];
    const tools = [{ functionDeclarations: dispatch.declarations }];
    const deadline = Date.now() + runTimeoutMs;
    let backoffCreditMs = 0;
    const dueAt = () => deadline + (getExtraDeadlineMs ? (Number(getExtraDeadlineMs()) || 0) : 0) + backoffCreditMs;
    const trace = (j) => { if (typeof callOpts.onTrace === 'function' && j && j.usageMetadata) callOpts.onTrace({ type: 'result', usage: { input_tokens: j.usageMetadata.promptTokenCount, output_tokens: j.usageMetadata.candidatesTokenCount } }); };
    // failTrace records WHY this transport degraded to null (lifted by emitNoVerdict into the durable noVerdict log).
    // lastFinish carries the most recent turn's finishReason so a terminal degrade reports MAX_TOKENS vs STOP etc.
    const failTrace = (mode, finishReason) => { if (typeof callOpts.onTrace === 'function') callOpts.onTrace({ type: 'transportFail', provider: 'gemini', mode, finishReason: finishReason || null }); };
    let lastFinish = null;
    const temp = request.temperatureOverride != null ? request.temperatureOverride : temperature; // degeneration-retry perturbation
    // ONE generateContent round with 429/5xx backoff (parked wall-clock credited back to the deadline). null ⇒ degrade.
    const postOnce = async (useTools, outTokens = maxOutputTokens, doubled = false) => {
      const body = { contents, generationConfig: { temperature: temp, maxOutputTokens: outTokens } };
      if (useTools) body.tools = tools;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        if (dueAt() - Date.now() <= 0) return null;
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), Math.max(1, dueAt() - Date.now()));
        try {
          const r = await f(`${baseUrl}/models/${model}:generateContent?key=${apiKey}`, { method: 'POST', signal: ctrl.signal, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
          if (r.status === 429 || r.status >= 500) { clearTimeout(t); const b = Math.min(maxBackoffMs, baseBackoffMs * (attempt + 1)); backoffCreditMs += b; await sleep(b); continue; }
          if (!r.ok) { clearTimeout(t); return null; }
          const j = await r.json(); clearTimeout(t); trace(j);
          // MAX_TOKENS with NO usable output (no text, no tool call) ⇒ thinking starved the turn ⇒ DOUBLE the budget
          // once and re-issue the SAME request before handing back. A turn that DID emit text or a functionCall is fine.
          const cand0 = j && j.candidates && j.candidates[0];
          const cps = (cand0 && cand0.content && Array.isArray(cand0.content.parts)) ? cand0.content.parts : [];
          const usable = cps.some((p) => p && (p.text || (p.functionCall && p.functionCall.name)));
          if (!doubled && !usable && cand0 && cand0.finishReason === 'MAX_TOKENS' && process.env.V3_GEMINI_MAXTOK_DOUBLE !== '0') {
            return postOnce(useTools, Math.min(outTokens * 2, GEMINI_MAXTOK_CEIL), true);
          }
          return j;
        } catch (e) { clearTimeout(t); if (ctrl.signal.aborted) return null; const b = Math.min(maxBackoffMs, baseBackoffMs * (attempt + 1)); backoffCreditMs += b; await sleep(b); }
      }
      return null;
    };
    for (let turn = 0; turn < maxTurns; turn++) {
      if (dueAt() - Date.now() <= 0) { failTrace('deadline', lastFinish); return null; }
      const lastTurn = turn === maxTurns - 1; // final turn: disable tools so the model MUST conclude with a text verdict
      const j = await postOnce(!lastTurn && !request.disableTools); // disableTools (envelope-repair retry) ⇒ plain text completion
      const cand = j && j.candidates && j.candidates[0];
      if (cand && cand.finishReason) lastFinish = cand.finishReason;
      const parts = (cand && cand.content && Array.isArray(cand.content.parts)) ? cand.content.parts : [];
      const calls = parts.filter((p) => p && p.functionCall && p.functionCall.name);
      if (process.env.V3_GEMINI_TURN_DEBUG === '1') { // per-turn observability for the empty-loop diagnosis (default off)
        const tl = parts.map((p) => (p && p.text) || '').join('').length;
        try { process.stderr.write(`[v3:geminiTurn] ${JSON.stringify({ turn, lastTurn, candNull: !cand, finishReason: (cand && cand.finishReason) || null, calls: calls.map((c) => c.functionCall.name), parts: parts.length, textLen: tl, thinking: parts.some((p) => p && p.thought) })}\n`); } catch (e) { /* never throw */ }
      }
      if (calls.length && !lastTurn) {
        contents.push({ role: 'model', parts }); // echo the model's turn (functionCall(s) + any thinking) into history
        const responses = [];
        const images = []; // base64 screenshots pulled out of the function results → ride as inlineData parts
        const extractImages = process.env.V3_GEMINI_TOOL_IMAGES !== '0';
        for (const p of calls) {
          const fc = p.functionCall;
          let resultObj;
          try { resultObj = await dispatch.call(fc.name, fc.args || {}); }
          catch (e) { resultObj = { error: String((e && e.message) || e) }; }
          // functionResponse.response must be a JSON object (Struct); a non-object handler return is boxed under `result`.
          let response = (resultObj && typeof resultObj === 'object' && !Array.isArray(resultObj)) ? resultObj : { result: resultObj };
          if (extractImages) response = extractToolImages(response, images); // lift base64 screenshots out of the Struct
          responses.push({ functionResponse: { name: fc.name, response } });
        }
        // v1beta: a functionResponse rides a 'user' Content. Any lifted screenshots ride the SAME user turn as
        // inlineData image parts (after the functionResponse), so the model SEES the pixels instead of an opaque string.
        const userParts = responses.slice();
        if (images.length) { userParts.push({ text: `${images.length} tool screenshot(s) attached as image part(s) below — judge from those pixels.` }, ...images); }
        contents.push({ role: 'user', parts: userParts });
        continue;
      }
      const text = parts.map((p) => (p && p.text) || '').join('');
      if (text) return { content: [{ type: 'text', text }] }; // got the verdict text
      // EMPTY answer (no tool call, no text — even after any MAX_TOKENS doubling). Rather than degrade to null (a
      // noVerdict — the dominant Gemini tool-loop failure: the model never committed to a final answer, or emitted a
      // stray functionCall on the tools-off final turn), make ONE forced tools-off conclusion: echo the empty turn so
      // roles still alternate, then demand ONLY the JSON verdict from the evidence already gathered. Opt out with
      // V3_GEMINI_FORCE_CONCLUDE=0. Past-deadline still degrades (no time for another round).
      if (process.env.V3_GEMINI_FORCE_CONCLUDE === '0' || dueAt() - Date.now() <= 0) {
        failTrace(process.env.V3_GEMINI_FORCE_CONCLUDE === '0' ? 'force-conclude-optout' : 'deadline-preconclude', lastFinish); return null;
      }
      contents.push({ role: 'model', parts: parts.length ? parts : [{ text: '(no answer emitted)' }] });
      contents.push({ role: 'user', parts: [{ text: CONCLUDE_INSTRUCTION }] });
      const cj = await postOnce(false);
      const cFinish = cj && cj.candidates && cj.candidates[0] && cj.candidates[0].finishReason;
      const cparts = (cj && cj.candidates && cj.candidates[0] && cj.candidates[0].content && Array.isArray(cj.candidates[0].content.parts)) ? cj.candidates[0].content.parts : [];
      const ctext = cparts.map((p) => (p && p.text) || '').join('');
      if (ctext) return { content: [{ type: 'text', text: ctext }] };
      failTrace('force-conclude-empty', cFinish || lastFinish);
      return null;
    }
    failTrace('maxturns-exhausted', lastFinish);
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
    // failTrace records WHY this transport degraded to null (lifted by emitNoVerdict into the durable noVerdict log).
    const failTrace = (mode) => { if (onTrace) try { onTrace({ type: 'transportFail', provider: 'claude', mode, finishReason: null }); } catch (e) { /* never throw */ } };
    const q = await getQuery();
    if (typeof q !== 'function') { failTrace('sdk-absent'); return null; }
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
      if (dueAt() - Date.now() <= 0) { failTrace('deadline'); return null; } // whole-run budget (excluding queue-wait) exhausted before this attempt
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
        // disableTools (envelope-repair retry): drop the cdp MCP server + allowedTools so the reformat call is a
        // single plain completion and can NEVER re-enter the agentic tool loop (no page re-clone / re-navigation).
        const noTools = request && request.disableTools === true;
        const options = { maxTurns: noTools ? 1 : maxTurns, allowedTools: noTools ? [] : allowedTools, settingSources, model: useModel, abortController: ctrl, env, tools: [] };
        if (mcpServers && !noTools) options.mcpServers = mcpServers;
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
        if (ctrl.signal.aborted) { clearGuards(); failTrace('timeout-abort'); return null; } // whole-run timeout ⇒ degrade
        if (isOverloaded(e)) overloaded = true; // else: fall through to degrade below
      } finally { clearGuards(); }

      if (text && !overloaded) return { content: [{ type: 'text', text }] };
      if (overloaded && attempt < maxRetries) { const b = backoffMs(attempt); backoffCreditMs += b; await sleep(b); continue; } // credit the backoff sleep to the deadline (throttle wait, not model work)
      if (text) return { content: [{ type: 'text', text }] };
      failTrace(overloaded ? 'overloaded-exhausted' : 'empty'); // exhausted / fatal / empty ⇒ degrade
      return null;
    }
    failTrace('retry-exhausted');
    return null;
  };
}

module.exports = { makeRunAgent, makeAnthropicTransport, makeClaudeSdkTransport, makeGeminiTransport, makeGeminiToolTransport, parseAgentReply, toAnthropicContent, looksDegenerate };
