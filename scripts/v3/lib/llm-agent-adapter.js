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
const crypto = require('crypto');

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
    // `subject` is transport-local routing metadata; provider request serializers never send it. The Gemini hybrid
    // uses the declarative rubric toolMode without parsing prose or maintaining a second SC routing table.
    const toolMode = (_subject && (_subject.toolMode || (_subject.rubric && _subject.rubric.toolMode))) || 'auto';
    const request = { model, max_tokens: maxTokens,
      subject: _subject ? { sc: _subject.sc || null, skill: _subject.skill || null, rubricId: _subject.rubricId || null, toolMode } : null,
      messages: [{ role: 'user', content: toAnthropicContent(messages) }] };
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
// `screenshots.{before,after}`). A multi-MB base64 string boxed in function-result JSON is opaque text the model cannot
// SEE. Pull every image-keyed base64 field out (replace with a short placeholder note) and return it as an Interactions
// `image` content block beside the result text, mirroring the Claude MCP image-block path. Walks nested objects/arrays
// (the before/after pair). Opt out with V3_GEMINI_TOOL_IMAGES=0 (degrades to string-boxed behavior).
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
const GEMINI_THINKING_LEVEL = Object.freeze({ minimal: 'MINIMAL', low: 'LOW', medium: 'MEDIUM', high: 'HIGH', xhigh: 'HIGH', max: 'HIGH' });
const geminiGenerationConfig = ({ temperature, maxOutputTokens, effort }) => {
  const config = { maxOutputTokens };
  if (Number.isFinite(temperature)) config.temperature = temperature;
  const thinkingLevel = GEMINI_THINKING_LEVEL[String(effort || '').toLowerCase()];
  if (thinkingLevel) config.thinkingConfig = { thinkingLevel };
  return config;
};

// Gemini USD per 1M tokens (ai.google.dev/gemini-api/docs/pricing, read 2026-09-06). Gemini emits token counts
// but — unlike the Claude SDK, which returns total_cost_usd — no cost, so every Gemini run in this repo has
// recorded $0 spend. That is missing accounting, not free inference. Prices are dated because 3.7 Flash carries
// promotional rates that DOUBLE on 2027-01-01; geminiCostUsd picks by run date so old artifacts stay correct.
// Flex and Batch are both a flat 50% of standard.
const GEMINI_PRICES = { // [input, output, cachedInput] per 1M tokens
  'gemini-3.7-flash': { until: '2027-01-01', before: [0.75, 3.75, 0.075], after: [1.50, 7.50, 0.15] },
  'gemini-3.5-flash': { before: [1.50, 9.00, 0.15] },
  'gemini-3.5-flash-lite': { before: [0.30, 2.50, 0] }, // context caching not offered on flash-lite
};
const GEMINI_TIER_MULTIPLIER = { flex: 0.5, batch: 0.5 }; // standard = 1

// NOTE ON CACHED TOKENS: Gemini's promptTokenCount INCLUDES cachedContentTokenCount, so callers pass
// the full prompt count as inputTokens and the cached subset as cachedTokens. This function therefore
// subtracts the cached portion before charging the uncached rate — passing both through at full price
// double-charges the cache (once at input rate, once at cache rate) and overstated one 585 run by 49%
// ($22.32 recorded against $15.00 actual).
function geminiCostUsd({ model, inputTokens = 0, outputTokens = 0, cachedTokens = 0, serviceTier = null, at = null }) {
  // Longest-prefix match so dated/suffixed ids ('gemini-3.7-flash-preview-xx') price as their family rather
  // than silently falling through to $0 — the failure mode this function exists to end.
  const key = Object.keys(GEMINI_PRICES).filter((k) => (model || '').startsWith(k)).sort((a, b) => b.length - a.length)[0];
  if (!key) return null; // unknown model ⇒ null, NOT 0: an absent price must never read as free
  const p = GEMINI_PRICES[key];
  const rates = (p.until && p.after && new Date(at || Date.now()) >= new Date(p.until)) ? p.after : p.before;
  const mult = GEMINI_TIER_MULTIPLIER[serviceTier] || 1;
  const uncachedIn = Math.max(0, inputTokens - cachedTokens);
  return ((uncachedIn * rates[0]) + (outputTokens * rates[1]) + (cachedTokens * rates[2])) / 1e6 * mult;
}

// serviceTier: 'flex' halves token cost in exchange for variable latency (1-15 min target) and best-effort
// availability — requests are sheddable and fail 429/503 with NO server-side fallback to standard. Both Gemini
// transports already retry 429/5xx with backoff, which is exactly the client-side retry flex requires; the part
// that is NOT safe by default is the timeout, so a flex caller must also raise timeoutMs past the 60s standard
// default or every slow-but-healthy flex response aborts and degrades to a fabricated no-verdict.
// The field is validated server-side (an invalid value 400s naming the ServiceTier enum), so a typo cannot
// silently bill at standard rates.
// ---------------------------------------------------------------------------
// OPENROUTER (chat/completions, OpenAI-compatible). Used for models not offered by the direct
// vendor transports (qwen3.8-flash and friends).
//
// Deliberately NOT a repoint of makeOpenAITransport: that one targets /v1/responses, which
// OpenRouter does not serve. This is chat/completions with a standard tool loop.
//
// Two OpenRouter-specific behaviours the other transports do not have:
//   * COST IS REPORTED. `usage: {include:true}` returns usage.cost — credits actually charged,
//     including routing and upstream margin. Better than any local price table, so it is passed
//     through as totalCostUsd and the caller must not re-derive it.
//   * UPSTREAM FAILURES ARRIVE AS HTTP 200 with an `error` body ("Provider returned error"), which
//     are transient and common at high concurrency. Untreated they become no-verdicts — fabricated
//     "no violations found" rows. They are retried like a 5xx.
//
// Reasoning: only effort low|medium|high are accepted by qwen3.8-flash; 'minimal',
// reasoning.max_tokens and enabled:false are all rejected upstream.
// Jittered exponential backoff. Jitter matters here: without it, N concurrent workers that all hit the
// same 429 retry in lockstep and re-trigger it together.
function orBackoff(attempt, base, cap) { return Math.min(cap, base * (2 ** attempt)) * (1 + Math.random() * 0.3); }

const OPENROUTER_REASONING = { minimal: 'low', low: 'low', medium: 'medium', high: 'high', xhigh: 'high', max: 'high' };

function orMessages(content) {
  const parts = (content || []).map((b) => (b && b.type === 'image' && b.source)
    ? { type: 'image_url', image_url: { url: `data:${b.source.media_type || 'image/png'};base64,${b.source.data}` } }
    : { type: 'text', text: (b && b.text) || '' });
  return parts;
}

function makeOpenRouterTransport({ apiKey, model, fetchImpl, maxOutputTokens = 16384, effort = null,
  baseUrl = 'https://openrouter.ai/api/v1', timeoutMs = 900000,
  // 429 is the dominant OpenRouter failure at concurrency and it is SUSTAINED, not a blip: linear
  // 2/4/6/8s backoff (20s total) exhausted retries on 12-17% of calls in the 585 baseline runs, and
  // every exhausted call became a fabricated negative. 8 attempts of jittered exponential capped at
  // 60s gives ~4 minutes of patience instead of 20 seconds.
  maxRetries = 8, baseBackoffMs = LIMITS.llm.baseBackoffMs, maxBackoffMs = 60000, onTraceSink = null } = {}) {
  const f = fetchImpl || (typeof fetch === 'function' ? fetch : null);
  if (!apiKey) throw new Error('makeOpenRouterTransport: apiKey required (set OPENROUTER_API_KEY in .env)');
  if (!f) throw new Error('makeOpenRouterTransport: no fetch available');
  const reasoning = OPENROUTER_REASONING[String(effort || '').toLowerCase()];
  return async function transport(request, callOpts = {}) {
    const msg = (request.messages && request.messages[0]) || { content: [] };
    const failTrace = (mode) => {
      const ev = { type: 'transportFail', provider: 'openrouter', mode, finishReason: null };
      if (typeof callOpts.onTrace === 'function') callOpts.onTrace(ev);
      if (typeof onTraceSink === 'function') try { onTraceSink(ev); } catch (e) {}
    };
    let budget = maxOutputTokens; let doubled = false; let lastErr = 'none';
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeoutMs);
      try {
        const body = { model, messages: [{ role: 'user', content: orMessages(msg.content) }],
          max_tokens: budget, temperature: 0, usage: { include: true } };
        if (reasoning) body.reasoning = { effort: reasoning };
        const r = await f(`${baseUrl}/chat/completions`, { method: 'POST', signal: ctrl.signal,
          headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' }, body: JSON.stringify(body) });
        clearTimeout(t);
        if (r.status === 429 || r.status >= 500) { lastErr = `http-${r.status}`; await new Promise((res) => setTimeout(res, orBackoff(attempt, baseBackoffMs, maxBackoffMs))); continue; }
        if (!r.ok) { failTrace(`http-${r.status}`); return null; }
        const j = await r.json();
        if (j && j.error) { // HTTP 200 + error body: transient upstream failure, retry
          lastErr = String((j.error && j.error.message) || j.error).slice(0, 120);
          if (attempt < maxRetries) { await new Promise((res) => setTimeout(res, orBackoff(attempt, baseBackoffMs, maxBackoffMs))); continue; }
          failTrace('provider-error'); return null;
        }
        const ch = (j.choices || [])[0] || {};
        const u = j.usage || {};
        if (u.prompt_tokens || u.completion_tokens) {
          const ev = { type: 'result', usage: {
            input_tokens: u.prompt_tokens || 0,
            output_tokens: u.completion_tokens || 0,
            cache_read_input_tokens: (u.prompt_tokens_details || {}).cached_tokens || 0,
          }, ...(typeof u.cost === 'number' ? { totalCostUsd: u.cost } : {}) };
          if (typeof callOpts.onTrace === 'function') callOpts.onTrace(ev);
          if (typeof onTraceSink === 'function') try { onTraceSink(ev); } catch (e) {}
        }
        const text = (ch.message && ch.message.content) || '';
        // Reasoning models can burn the whole budget thinking and emit nothing; retry once at
        // double rather than let an empty answer read as "no violations".
        if (ch.finish_reason === 'length' && !text.trim() && !doubled) { doubled = true; budget *= 2; continue; }
        if (!text.trim()) { failTrace('empty'); return null; }
        return text;
      } catch (e) {
        clearTimeout(t);
        if (attempt >= maxRetries) { failTrace(ctrl.signal.aborted ? 'timeout' : 'network'); return null; }
        await new Promise((res) => setTimeout(res, baseBackoffMs * (attempt + 1)));
      }
    }
    failTrace(`retry-exhausted:${lastErr}`);   // carry the CAUSE, not just that retries ran out
    return null;
  };
}

// Multi-turn tool loop over chat/completions. Same {declarations, call} dispatch contract as the
// Gemini/OpenAI tool transports, so the orchestrator needs no special-casing beyond provider routing.
function makeOpenRouterToolTransport({ apiKey, model, dispatch, fetchImpl, maxOutputTokens = 16384, effort = null,
  baseUrl = 'https://openrouter.ai/api/v1', runTimeoutMs = LIMITS.llm.toolRunTimeoutMs,
  maxTurns = LIMITS.llm.toolMaxTurns, maxRetries = 8,
  baseBackoffMs = LIMITS.llm.baseBackoffMs, maxBackoffMs = 60000,
  // A model can emit a tool_call whose `arguments` are not valid JSON (truncated, or prose wrapped
  // around the object). Calling the tool with {} silently executes the WRONG call and the model then
  // reasons over a bogus result, which is worse than failing. Re-ask instead, a bounded number of
  // times, before falling back.
  maxArgParseRetries = 3,
  getExtraDeadlineMs = null, onTraceSink = null } = {}) {
  const f = fetchImpl || (typeof fetch === 'function' ? fetch : null);
  if (!apiKey) throw new Error('makeOpenRouterToolTransport: apiKey required');
  if (!f) throw new Error('makeOpenRouterToolTransport: no fetch available');
  if (!dispatch || !Array.isArray(dispatch.declarations) || typeof dispatch.call !== 'function') {
    throw new Error('makeOpenRouterToolTransport: dispatch {declarations, call} required');
  }
  const reasoning = OPENROUTER_REASONING[String(effort || '').toLowerCase()];
  // chat/completions nests the schema under `function`, unlike the Interactions/Responses shape.
  const tools = dispatch.declarations.map((d) => ({ type: 'function', function: { name: d.name, description: d.description, parameters: d.parameters } }));
  return async function transport(request, callOpts = {}) {
    const deadline = Date.now() + runTimeoutMs;
    let backoffCreditMs = 0;
    const dueAt = () => deadline + (getExtraDeadlineMs ? (Number(getExtraDeadlineMs()) || 0) : 0) + backoffCreditMs;
    const msg = (request.messages && request.messages[0]) || { content: [] };
    const messages = [{ role: 'user', content: orMessages(msg.content) }];
    let turnNo = 0; let argRetries = 0;
    const failTrace = (mode) => {
      const ev = { type: 'transportFail', provider: 'openrouter', mode, finishReason: null };
      if (typeof callOpts.onTrace === 'function') callOpts.onTrace(ev);
      if (typeof onTraceSink === 'function') try { onTraceSink(ev); } catch (e) {}
    };
    const emitUsage = (u) => {
      if (!u || (!u.prompt_tokens && !u.completion_tokens)) return;
      const ev = { type: 'result', numTurns: ++turnNo, usage: {
        input_tokens: u.prompt_tokens || 0,
        output_tokens: u.completion_tokens || 0,
        cache_read_input_tokens: (u.prompt_tokens_details || {}).cached_tokens || 0,
      }, ...(typeof u.cost === 'number' ? { totalCostUsd: u.cost } : {}) };
      if (typeof callOpts.onTrace === 'function') callOpts.onTrace(ev);
      if (typeof onTraceSink === 'function') try { onTraceSink(ev); } catch (e) {}
    };
    for (let turn = 0; turn < maxTurns; turn++) {
      const offerTools = turn < maxTurns - 1;      // final turn offers none, so it must answer
      let j = null;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        if (Date.now() > dueAt()) { failTrace('deadline'); return null; }
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), Math.max(1000, dueAt() - Date.now()));
        try {
          const body = { model, messages, max_tokens: maxOutputTokens, temperature: 0, usage: { include: true } };
          if (reasoning) body.reasoning = { effort: reasoning };
          if (offerTools && tools.length) { body.tools = tools; body.tool_choice = 'auto'; }
          const r = await f(`${baseUrl}/chat/completions`, { method: 'POST', signal: ctrl.signal,
            headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' }, body: JSON.stringify(body) });
          clearTimeout(t);
          if (r.status === 429 || r.status >= 500) {
            if (attempt < maxRetries) { const b = orBackoff(attempt, baseBackoffMs, maxBackoffMs); backoffCreditMs += b; await new Promise((res) => setTimeout(res, b)); continue; }
            failTrace(`http-${r.status}`); return null;
          }
          if (!r.ok) { failTrace(`http-${r.status}`); return null; }
          const cand = await r.json();
          if (cand && cand.error) {   // HTTP 200 + error body — transient upstream failure
            if (attempt < maxRetries) { const b = orBackoff(attempt, baseBackoffMs, maxBackoffMs); backoffCreditMs += b; await new Promise((res) => setTimeout(res, b)); continue; }
            failTrace('provider-error'); return null;
          }
          j = cand; break;
        } catch (e) {
          clearTimeout(t);
          if (attempt >= maxRetries) { failTrace('network'); return null; }
          const b = orBackoff(attempt, baseBackoffMs, maxBackoffMs); backoffCreditMs += b;
          await new Promise((res) => setTimeout(res, b));
        }
      }
      if (!j) { failTrace('no-response'); return null; }
      emitUsage(j.usage);
      const ch = (j.choices || [])[0] || {};
      const m = ch.message || {};
      const calls = m.tool_calls || [];
      if (calls.length && offerTools) {
        // Parse EVERY call's arguments up front. Executing a partially-parsed batch would run some
        // tools and then abandon the turn, leaving the page mutated with no verdict to show for it.
        const parsed = [];
        let badArgs = null;
        for (const c of calls) {
          try { parsed.push({ c, args: JSON.parse((c.function && c.function.arguments) || '{}') }); }
          catch (e) { badArgs = (c.function && c.function.name) || '?'; break; }
        }
        if (badArgs) {
          if (argRetries < maxArgParseRetries) {
            argRetries++;
            if (process.env.V3_OR_TOOL_DEBUG) console.error(`[or:badargs] ${badArgs} (re-ask ${argRetries}/${maxArgParseRetries})`);
            // Re-ask the SAME turn: do not consume a turn, and do not push the malformed assistant
            // message, so the model is not conditioned on its own broken output.
            turn--;
            continue;
          }
          failTrace('tool-args-unparseable'); return null;   // never execute a guessed {} call
        }
        if (process.env.V3_OR_TOOL_DEBUG) console.error('[or:toolcall] ' + calls.map((c) => c.function && c.function.name).join(','));
        messages.push({ role: 'assistant', content: m.content || null, tool_calls: calls });
        for (const { c, args } of parsed) {
          let out; try { out = await dispatch.call(c.function.name, args); }
          catch (e) { out = { error: String((e && e.message) || e) }; }
          // Tool images cannot ride a `tool` message; strip them so the payload stays valid JSON.
          const imgs = [];
          const cleaned = extractToolImages(out && typeof out === 'object' ? out : { result: out }, imgs);
          messages.push({ role: 'tool', tool_call_id: c.id, content: JSON.stringify(cleaned == null ? {} : cleaned) });
          if (imgs.length) {
            messages.push({ role: 'user', content: imgs.map((img) => ({ type: 'image_url', image_url: { url: `data:${img.inlineData.mimeType};base64,${img.inlineData.data}` } })) });
          }
        }
        if (turn === maxTurns - 2) messages.push({ role: 'user', content: [{ type: 'text', text: CONCLUDE_INSTRUCTION }] });
        continue;
      }
      const text = m.content || '';
      if (text.trim()) return text;
      if (!offerTools) { failTrace('conclusion-empty'); return null; }
      // Answered with neither text nor a tool call: push it to conclude rather than loop empty.
      messages.push({ role: 'user', content: [{ type: 'text', text: CONCLUDE_INSTRUCTION }] });
    }
    failTrace('max-turns');
    return null;
  };
}

function makeGeminiTransport({ apiKey, model = 'gemini-3.5-flash', fetchImpl, maxOutputTokens = 4096, temperature = null, effort = null,
  baseUrl = 'https://generativelanguage.googleapis.com/v1beta', timeoutMs = LIMITS.llm.httpTimeoutMs,
  serviceTier = null,
  maxRetries = LIMITS.llm.maxRetries, baseBackoffMs = LIMITS.llm.baseBackoffMs, onTraceSink = null } = {}) {
  const f = fetchImpl || (typeof fetch === 'function' ? fetch : null);
  if (!apiKey) throw new Error('makeGeminiTransport: apiKey required (set GEMINI_API_KEY in .env)');
  if (!f) throw new Error('makeGeminiTransport: no fetch available');
  const toParts = (content) => (content || []).map((b) => (b && b.type === 'image' && b.source)
    ? { inlineData: { mimeType: b.source.media_type || 'image/png', data: b.source.data } }
    : { text: (b && b.text) || '' });
  return async function transport(request, callOpts = {}) {
    const msg = (request.messages && request.messages[0]) || { content: [] };
    const temp = request.temperatureOverride != null ? request.temperatureOverride : temperature; // degeneration-retry perturbation
    const body = { contents: [{ role: 'user', parts: toParts(msg.content) }], generationConfig: geminiGenerationConfig({ temperature: temp, maxOutputTokens, effort }) };
    if (serviceTier) body.service_tier = serviceTier;
    // failTrace records WHY this transport degraded to null (lifted by emitNoVerdict into the durable noVerdict log).
    const failTrace = (mode, finishReason) => {
      const ev = { type: 'transportFail', provider: 'gemini', mode, finishReason: finishReason || null };
      if (typeof callOpts.onTrace === 'function') callOpts.onTrace(ev);
      if (typeof onTraceSink === 'function') try { onTraceSink(ev); } catch (e) { /* telemetry must never throw */ }
    };
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
        if (j.usageMetadata) { // token telemetry → BOTH the verdict trace (onTrace) AND the persistent token sink (onTraceSink); output INCLUDES thinking tokens
          const um = j.usageMetadata; const usage = {
            input_tokens: um.promptTokenCount || 0,
            output_tokens: (um.candidatesTokenCount || 0) + (um.thoughtsTokenCount || 0),
            cache_read_input_tokens: um.cachedContentTokenCount || 0
          };
          // Gemini returns no cost field, so derive it — otherwise the run reports $0 spend.
          const cost = geminiCostUsd({ model, inputTokens: usage.input_tokens, outputTokens: usage.output_tokens,
            cachedTokens: usage.cache_read_input_tokens, serviceTier });
          const ev = { type: 'result', usage, ...(cost == null ? {} : { totalCostUsd: cost }) };
          if (typeof callOpts.onTrace === 'function') callOpts.onTrace(ev); if (typeof onTraceSink === 'function') try { onTraceSink(ev); } catch (e) {}
        }
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

// EXPLICIT-CACHE MANAGER for the cached-first Gemini hybrid. Interactions cannot reference explicit cache objects,
// so only the GenerateContent first pass uses these resources. Cache creation is single-flight by the immutable
// (model + exact prefix + tool schema) hash: 100 parallel judgments sharing a rubric create ONE cache and all await
// it. A rejected/undersized prefix is negatively memoized for the run and falls back to uncached GenerateContent.
// `close()` deletes resources eagerly; TTL is the crash-safe cleanup backstop.
const GEMINI_CACHE_MARKER = '--- case-specific evidence (not part of the reusable prefix) ---';
const sha256Hex = (value) => crypto.createHash('sha256').update(String(value), 'utf8').digest('hex');

function makeGeminiCacheManager({ apiKey, model = 'gemini-3.5-flash', fetchImpl,
  baseUrl = 'https://generativelanguage.googleapis.com/v1beta', ttlSeconds = Number(process.env.V3_GEMINI_CACHE_TTL_SECONDS || 3600) } = {}) {
  const f = fetchImpl || (typeof fetch === 'function' ? fetch : null);
  if (!apiKey) throw new Error('makeGeminiCacheManager: apiKey required');
  if (!f) throw new Error('makeGeminiCacheManager: no fetch available');
  const ready = new Map();
  const pending = new Map();
  const stats = { createAttempts: 0, created: 0, reused: 0, rejected: 0, createTokens: 0, deleted: 0, deleteFailures: 0,
    routes: { final: 0, escalated: 0, verdictEscalated: 0, requiredBypass: 0, markerMissing: 0, failed: 0 }, byReason: {} };
  const modelName = String(model).startsWith('models/') ? String(model) : `models/${model}`;
  const ttl = `${Math.max(60, Math.floor(Number(ttlSeconds) || 3600))}s`;

  const create = async (key, prefix, tools) => {
    stats.createAttempts++;
    const body = {
      model: modelName,
      contents: [{ role: 'user', parts: [{ text: prefix }] }],
      ttl,
      displayName: `a11y-${key.slice(0, 20)}`,
    };
    if (Array.isArray(tools) && tools.length) {
      body.tools = tools;
      body.toolConfig = { functionCallingConfig: { mode: 'AUTO' } };
    }
    try {
      const r = await f(`${baseUrl}/cachedContents`, { method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey }, body: JSON.stringify(body) });
      if (!r.ok) {
        const reason = `http-${r.status}`;
        stats.rejected++; stats.byReason[reason] = (stats.byReason[reason] || 0) + 1;
        return { key, name: null, reason, creationTokens: 0 };
      }
      const j = await r.json();
      if (!j || !j.name) {
        const reason = 'missing-name';
        stats.rejected++; stats.byReason[reason] = (stats.byReason[reason] || 0) + 1;
        return { key, name: null, reason, creationTokens: 0 };
      }
      const creationTokens = Number((j.usageMetadata && (j.usageMetadata.totalTokenCount || j.usageMetadata.total_token_count)) || 0) || 0;
      stats.created++; stats.createTokens += creationTokens;
      return { key, name: j.name, reason: null, creationTokens };
    } catch (e) {
      const reason = 'network-error';
      stats.rejected++; stats.byReason[reason] = (stats.byReason[reason] || 0) + 1;
      return { key, name: null, reason, creationTokens: 0 };
    }
  };

  const getOrCreate = async ({ prefix, tools }) => {
    const key = sha256Hex(JSON.stringify({ model: modelName, prefix, tools }));
    if (ready.has(key)) { stats.reused++; return { ...ready.get(key), creationTokens: 0, reused: true }; }
    if (pending.has(key)) { stats.reused++; const x = await pending.get(key); return { ...x, creationTokens: 0, reused: true }; }
    const p = create(key, prefix, tools);
    pending.set(key, p);
    try {
      const x = await p;
      ready.set(key, x);
      return { ...x, reused: false };
    } finally { pending.delete(key); }
  };

  const close = async () => {
    await Promise.all([...ready.values()].filter((x) => x && x.name).map(async (x) => {
      try {
        const r = await f(`${baseUrl}/${x.name}`, { method: 'DELETE', headers: { 'x-goog-api-key': apiKey } });
        if (r.ok) stats.deleted++; else stats.deleteFailures++;
      } catch (e) { stats.deleteFailures++; }
    }));
    ready.clear();
  };
  const snapshot = () => ({ ...stats, active: [...ready.values()].filter((x) => x && x.name).length, pending: pending.size, ttlSeconds: Number(ttl.slice(0, -1)) });
  const recordRoute = (outcome) => { if (Object.prototype.hasOwnProperty.call(stats.routes, outcome)) stats.routes[outcome]++; };
  return { getOrCreate, close, snapshot, recordRoute };
}

// CROSS-FAMILY MULTI-TURN transport: Google Gemini Interactions API WITH FUNCTION CALLING. Each harness judgment is
// one isolated, server-stored interaction chain. `previous_interaction_id` continues that chain without resending the
// complete prompt/tool history, so the service preserves thought state and can cache the stable prefix across turns.
//
// The chain is deliberately two-phase: LOW-thinking selection turns MUST either call an evidence tool or the local
// `finish_evidence_collection` sentinel; the final, tools-off turn uses the run's requested effort (MEDIUM by default)
// to produce the verdict. This keeps expensive reasoning out of tool selection while retaining it for adjudication.
// `toolCallBudget` bounds actual evidence calls independently of maxTurns; reaching either bound forces conclusion.
// Every FunctionResult includes the exact call_id/name pair returned by Gemini, including parallel calls.
function makeGeminiToolTransport({ apiKey, model = 'gemini-3.5-flash', dispatch, fetchImpl, maxOutputTokens = 8192,
  temperature = null, effort = null, toolEffort = 'low', toolCallBudget = Number(process.env.V3_GEMINI_TOOL_CALL_BUDGET || 6),
  cacheManager = null,
  baseUrl = 'https://generativelanguage.googleapis.com/v1beta',
  runTimeoutMs = LIMITS.llm.toolRunTimeoutMs, maxTurns = LIMITS.llm.toolMaxTurns,
  serviceTier = null,
  maxRetries = LIMITS.llm.maxRetries, baseBackoffMs = LIMITS.llm.baseBackoffMs, maxBackoffMs = LIMITS.llm.maxBackoffMs,
  getExtraDeadlineMs = null, onTraceSink = null } = {}) {
  const f = fetchImpl || (typeof fetch === 'function' ? fetch : null);
  if (!apiKey) throw new Error('makeGeminiToolTransport: apiKey required (set GEMINI_API_KEY in .env)');
  if (!f) throw new Error('makeGeminiToolTransport: no fetch available');
  if (!dispatch || !Array.isArray(dispatch.declarations) || typeof dispatch.call !== 'function') throw new Error('makeGeminiToolTransport: dispatch {declarations, call} required');
  const toInteractionContent = (content) => (content || []).map((b) => (b && b.type === 'image' && b.source)
    ? { type: 'image', mime_type: b.source.media_type || 'image/png', data: b.source.data }
    : { type: 'text', text: (b && b.text) || '' });
  const toGenerateParts = (content) => (content || []).map((b) => (b && b.type === 'image' && b.source)
    ? { inlineData: { mimeType: b.source.media_type || 'image/png', data: b.source.data } }
    : { text: (b && b.text) || '' });
  const tools = dispatch.declarations.map((d) => ({ type: 'function', ...d }));
  const generateTools = [{ functionDeclarations: dispatch.declarations }];
  const FINISH_TOOL = 'finish_evidence_collection';
  const normalizedToolBudget = Number.isFinite(Number(toolCallBudget)) ? Math.max(0, Number(toolCallBudget)) : 6;
  const interactionThinkingLevel = (value, fallback) => {
    const level = String(value || fallback).toLowerCase();
    return level === 'xhigh' || level === 'max' ? 'high' : (['minimal', 'low', 'medium', 'high'].includes(level) ? level : fallback);
  };
  tools.push({
    type: 'function', name: FINISH_TOOL,
    description: 'Call this when the supplied evidence is already sufficient and no additional browser evidence tool is needed. The harness will then request the final accessibility verdict at the configured judgment thinking level.',
    parameters: { type: 'object', properties: {} }
  });
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  return async function transport(request, callOpts = {}) {
    const msg = (request.messages && request.messages[0]) || { content: [] };
    const deadline = Date.now() + runTimeoutMs;
    let backoffCreditMs = 0;
    const dueAt = () => deadline + (getExtraDeadlineMs ? (Number(getExtraDeadlineMs()) || 0) : 0) + backoffCreditMs;
    // Token telemetry is per Interaction/API call. Interactions reports generated output and thought tokens
    // separately, so combine them to retain the harness's existing billed-output convention.
    // `turnNo` (1-based) rides the SAME event rather than a separate one: the consumer counts an llmCall per
    // `result`, and each loop turn IS one API call, so emitting an extra terminal event to carry the turn count
    // would inflate that metric by one per subject.
    let turnNo = 0;
    const trace = (j) => { if (j && j.usage) { const u = j.usage; const usage = {
      input_tokens: u.total_input_tokens || 0,
      output_tokens: (u.total_output_tokens || 0) + (u.total_thought_tokens || 0),
      cache_read_input_tokens: u.total_cached_tokens || 0
    };
    // Interactions API carries the bulk of tool-run spend; without this the tools-ON runs report $0.
    const cost = geminiCostUsd({ model, inputTokens: usage.input_tokens, outputTokens: usage.output_tokens,
      cachedTokens: usage.cache_read_input_tokens, serviceTier });
    const ev = { type: 'result', numTurns: turnNo, usage, ...(cost == null ? {} : { totalCostUsd: cost }) };
    if (typeof callOpts.onTrace === 'function') callOpts.onTrace(ev); if (typeof onTraceSink === 'function') try { onTraceSink(ev); } catch (e) {} } };
    // failTrace records WHY this transport degraded to null (lifted by emitNoVerdict into the durable noVerdict log).
    // Keep the existing finishReason trace key for consumer compatibility; on Interactions it carries status.
    const failTrace = (mode, interactionStatus) => {
      const ev = { type: 'transportFail', provider: 'gemini', mode, finishReason: interactionStatus || null };
      if (typeof callOpts.onTrace === 'function') callOpts.onTrace(ev);
      if (typeof onTraceSink === 'function') try { onTraceSink(ev); } catch (e) { /* telemetry must never throw */ }
    };
    let lastStatus = null;
    const temp = request.temperatureOverride != null ? request.temperatureOverride : temperature;
    const finalEffort = effort || 'medium';
    const emitGenerateUsage = (j, creationTokens = 0) => {
      if (!j || !j.usageMetadata) return;
      const u = j.usageMetadata;
      const usage = {
        input_tokens: u.promptTokenCount || 0,
        output_tokens: (u.candidatesTokenCount || 0) + (u.thoughtsTokenCount || 0),
        cache_read_input_tokens: u.cachedContentTokenCount || 0,
        cache_creation_input_tokens: creationTokens || 0,
      };
      // Same derivation as the single-shot transport: Gemini reports no cost of its own.
      const cost = geminiCostUsd({ model, inputTokens: usage.input_tokens, outputTokens: usage.output_tokens,
        cachedTokens: usage.cache_read_input_tokens, serviceTier });
      const ev = { type: 'result', numTurns: ++turnNo, phase: 'cached-first-pass', usage,
        ...(cost == null ? {} : { totalCostUsd: cost }) };
      if (typeof callOpts.onTrace === 'function') callOpts.onTrace(ev);
      if (typeof onTraceSink === 'function') try { onTraceSink(ev); } catch (e) { /* telemetry must never throw */ }
    };
    // AUTO hybrid: cache the immutable prefix + native tool declarations. Gemini may answer immediately or request
    // evidence. A function call is only a ROUTING decision: execute nothing here and begin a fresh Interactions chain
    // with the complete prompt. That avoids carrying incompatible GenerateContent call ids/thought state across APIs.
    // `toolMode: required` skips this phase declaratively; repair retries (`disableTools`) also stay single-shot.
    const toolMode = request && request.subject && request.subject.toolMode || 'auto';
    const hybridEnabled = cacheManager && process.env.V3_GEMINI_HYBRID !== '0' && !request.disableTools;
    if (hybridEnabled && toolMode === 'required') {
      if (typeof cacheManager.recordRoute === 'function') cacheManager.recordRoute('requiredBypass');
    } else if (hybridEnabled) {
      const content = Array.isArray(msg.content) ? msg.content : [];
      const textIndex = content.findIndex((b) => b && b.type === 'text' && typeof b.text === 'string' && b.text.includes(GEMINI_CACHE_MARKER));
      if (textIndex < 0) {
        if (typeof cacheManager.recordRoute === 'function') cacheManager.recordRoute('markerMissing');
      } else {
        const markerEnd = content[textIndex].text.indexOf(GEMINI_CACHE_MARKER) + GEMINI_CACHE_MARKER.length;
        const prefix = content[textIndex].text.slice(0, markerEnd);
        const dynamic = content.map((b, i) => i === textIndex ? { ...b, text: b.text.slice(markerEnd) } : b)
          .filter((b) => b && (b.type === 'image' || (typeof b.text === 'string' && b.text.length)));
        const routeTools = toolMode === 'none' ? [] : generateTools;
        const cache = await cacheManager.getOrCreate({ prefix, tools: routeTools });
        const body = {
          contents: [{ role: 'user', parts: toGenerateParts(cache.name ? dynamic : content) }],
          generationConfig: geminiGenerationConfig({ temperature: temp, maxOutputTokens, effort: finalEffort }),
        };
        if (serviceTier) body.service_tier = serviceTier;
        if (cache.name) body.cachedContent = cache.name;
        else if (routeTools.length) { body.tools = routeTools; body.toolConfig = { functionCallingConfig: { mode: 'AUTO' } }; }
        let routed = null;
        for (let attempt = 0; attempt <= maxRetries; attempt++) {
          if (dueAt() - Date.now() <= 0) break;
          const ctrl = new AbortController();
          const timer = setTimeout(() => ctrl.abort(), Math.max(1, dueAt() - Date.now()));
          try {
            const r = await f(`${baseUrl}/models/${model}:generateContent`, { method: 'POST', signal: ctrl.signal,
              headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey }, body: JSON.stringify(body) });
            clearTimeout(timer);
            if (r.status === 429 || r.status >= 500) {
              if (attempt < maxRetries) { const b = Math.min(maxBackoffMs, baseBackoffMs * (2 ** attempt)); backoffCreditMs += b; await sleep(b); continue; }
              break;
            }
            if (!r.ok) break;
            routed = await r.json();
            emitGenerateUsage(routed, cache.creationTokens || 0);
            break;
          } catch (e) {
            clearTimeout(timer);
            if (ctrl.signal.aborted) break;
            if (attempt < maxRetries) { const b = Math.min(maxBackoffMs, baseBackoffMs * (2 ** attempt)); backoffCreditMs += b; await sleep(b); continue; }
          }
        }
        const parts = routed && routed.candidates && routed.candidates[0] && routed.candidates[0].content && routed.candidates[0].content.parts;
        const calls = Array.isArray(parts) ? parts.filter((p) => p && p.functionCall) : [];
        const routeText = Array.isArray(parts) ? parts.map((p) => p && p.text || '').join('') : '';
        const routeVerdict = routeText.trim() ? parseAgentReply(routeText) : null;
        // Precision-safe early exit: AUTO may cheaply clear only a HIGH-confidence non-barrier. A claimed barrier,
        // abstention, weak confidence, or malformed envelope gets the full Interactions deliberation even when the
        // model did not explicitly call a tool. `none` is the declarative exception: that rubric forbids tools.
        const clearWithoutInteraction = routeVerdict && routeVerdict.verdict === 'NOT REPRODUCED' && routeVerdict.confidence === 'high';
        if (!calls.length && routeText.trim() && (toolMode === 'none' || clearWithoutInteraction)) {
          if (typeof cacheManager.recordRoute === 'function') cacheManager.recordRoute('final');
          return { content: [{ type: 'text', text: routeText }] };
        }
        if (typeof cacheManager.recordRoute === 'function') cacheManager.recordRoute(calls.length ? 'escalated' : (routeText.trim() ? 'verdictEscalated' : 'failed'));
      }
    }
    // ONE Interactions round with 429/5xx backoff. An incomplete, output-less interaction gets one doubled-budget
    // re-issue of the same request, matching the single-shot MAX_TOKENS recovery without linking the failed resource.
    const postOnce = async (input, previousInteractionId, useTools, outTokens = maxOutputTokens, doubled = false) => {
      const chosenEffort = useTools ? interactionThinkingLevel(toolEffort, 'low') : interactionThinkingLevel(finalEffort, 'medium');
      const generationConfig = { max_output_tokens: outTokens, thinking_level: chosenEffort };
      if (Number.isFinite(temp)) generationConfig.temperature = temp;
      if (useTools) generationConfig.tool_choice = 'any';
      const body = { model, input, store: true, generation_config: generationConfig };
      if (previousInteractionId) body.previous_interaction_id = previousInteractionId;
      if (useTools) body.tools = tools;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        if (dueAt() - Date.now() <= 0) return null;
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), Math.max(1, dueAt() - Date.now()));
        try {
          const r = await f(`${baseUrl}/interactions`, { method: 'POST', signal: ctrl.signal,
            headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey }, body: JSON.stringify(body) });
          if (r.status === 429 || r.status >= 500) { clearTimeout(t); const b = Math.min(maxBackoffMs, baseBackoffMs * (attempt + 1)); backoffCreditMs += b; await sleep(b); continue; }
          if (!r.ok) { clearTimeout(t); return null; }
          const j = await r.json(); clearTimeout(t); trace(j);
          const steps = Array.isArray(j && j.steps) ? j.steps : [];
          const usable = steps.some((s) => s && (s.type === 'function_call' || (s.type === 'model_output' && Array.isArray(s.content) && s.content.some((c) => c && c.text))));
          if (!doubled && !usable && j && j.status === 'incomplete' && process.env.V3_GEMINI_MAXTOK_DOUBLE !== '0') {
            return postOnce(input, previousInteractionId, useTools, Math.min(outTokens * 2, GEMINI_MAXTOK_CEIL), true);
          }
          return j;
        } catch (e) { clearTimeout(t); if (ctrl.signal.aborted) return null; const b = Math.min(maxBackoffMs, baseBackoffMs * (attempt + 1)); backoffCreditMs += b; await sleep(b); }
      }
      return null;
    };
    let previousInteractionId = null;
    let input = toInteractionContent(msg.content);
    let evidenceCalls = 0;
    let readyToConclude = !!request.disableTools || toolMode === 'none';
    let pendingFunctionResults = false;
    for (let turn = 0; turn < maxTurns; turn++) {
      turnNo++;
      if (dueAt() - Date.now() <= 0) { failTrace('deadline', lastStatus); return null; }
      const useTools = !readyToConclude && evidenceCalls < normalizedToolBudget && turn < maxTurns - 1;
      if (!useTools && previousInteractionId && !pendingFunctionResults) input = [{ type: 'text', text: CONCLUDE_INSTRUCTION }];
      const j = await postOnce(input, previousInteractionId, useTools);
      pendingFunctionResults = false;
      if (!j) { failTrace('interaction-null', lastStatus); return null; }
      if (j.status) lastStatus = j.status;
      if (j.id) previousInteractionId = j.id;
      const steps = Array.isArray(j.steps) ? j.steps : [];
      const calls = steps.filter((s) => s && s.type === 'function_call' && s.name);
      if (process.env.V3_GEMINI_TURN_DEBUG === '1') { // per-turn observability for the empty-loop diagnosis (default off)
        const tl = steps.filter((s) => s && s.type === 'model_output').flatMap((s) => s.content || []).map((c) => (c && c.text) || '').join('').length;
        try { process.stderr.write(`[v3:geminiTurn] ${JSON.stringify({ turn, useTools, status: j.status || null, calls: calls.map((c) => c.name), steps: steps.length, textLen: tl })}\n`); } catch (e) { /* never throw */ }
      }
      // TOOL-CALL TELEMETRY (2026-08-19). The run-level counter reads ONE shape — a trace event carrying
      // `blocks` with `kind: 'tool_use'` entries — and that shape was produced only by the Claude Agent-SDK
      // message normaliser. This hand-rolled loop emitted token usage and nothing else, so every Gemini
      // tools-ON run reported `0 calls` and tripped the runner's "ENABLED but ZERO tool calls … mislabelled
      // as tools-ON" warning REGARDLESS of what the model actually did. That is a blind counter, not a
      // finding, and it made a real regression (a genuinely tool-less run) indistinguishable from normal
      // operation on this provider. Emit the same shape the counter already understands, so one contract
      // serves every provider.
      const tracedCalls = calls.filter((c) => c.name !== FINISH_TOOL);
      if (tracedCalls.length) {
        const ev = { type: 'assistant', role: 'assistant',
          blocks: tracedCalls.map((c) => ({ kind: 'tool_use', id: c.id, name: c.name, input: c.arguments || {} })) };
        if (typeof callOpts.onTrace === 'function') callOpts.onTrace(ev);
        if (typeof onTraceSink === 'function') try { onTraceSink(ev); } catch (e) { /* telemetry must never throw */ }
      }
      if (useTools && calls.length) {
        if (!j.id) { failTrace('missing-interaction-id', lastStatus); return null; }
        const results = [];
        const extractImages = process.env.V3_GEMINI_TOOL_IMAGES !== '0';
        let finishRequested = false;
        for (const fc of calls) {
          if (!fc.id) { failTrace('missing-call-id', lastStatus); return null; }
          if (fc.name === FINISH_TOOL) {
            finishRequested = true;
            results.push({ type: 'function_result', call_id: fc.id, name: fc.name,
              result: [{ type: 'text', text: 'Evidence collection is complete. Produce the final verdict next.' }] });
            continue;
          }
          let resultObj;
          try { resultObj = await dispatch.call(fc.name, fc.arguments || {}); }
          catch (e) { resultObj = { error: String((e && e.message) || e) }; }
          let response = (resultObj && typeof resultObj === 'object' && !Array.isArray(resultObj)) ? resultObj : { result: resultObj };
          const images = [];
          if (extractImages) response = extractToolImages(response, images);
          const result = [{ type: 'text', text: JSON.stringify(response) }];
          for (const img of images) result.push({ type: 'image', mime_type: img.inlineData.mimeType, data: img.inlineData.data });
          results.push({ type: 'function_result', call_id: fc.id, name: fc.name, result });
          evidenceCalls++;
        }
        input = results;
        pendingFunctionResults = true;
        readyToConclude = finishRequested || evidenceCalls >= normalizedToolBudget;
        continue;
      }
      const text = steps.filter((s) => s && s.type === 'model_output').flatMap((s) => s.content || []).map((c) => (c && c.text) || '').join('');
      if (!useTools && text) return { content: [{ type: 'text', text }] };
      // A provider that ignores tool_choice=any or emits no function call still advances to the explicit final phase.
      if (useTools && process.env.V3_GEMINI_FORCE_CONCLUDE !== '0' && turn < maxTurns - 1) {
        readyToConclude = true;
        input = [{ type: 'text', text: CONCLUDE_INSTRUCTION }];
        continue;
      }
      failTrace(useTools ? 'selection-empty' : 'conclusion-empty', lastStatus);
      return null;
    }
    failTrace('maxturns-exhausted', lastStatus);
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

// CROSS-FAMILY transport: OpenAI Codex SDK (@openai/codex-sdk), keyed from the LOCAL Codex auth (CODEX_API_KEY env or
// `codex login`) — the GPT-5.4 analog of makeClaudeSdkTransport (a subscription/agent-SDK judge, no metered key). It
// is SINGLE-SHOT: flatten our prompt to text, run ONE Codex turn, and return the agent's final text in the
// `{content:[{type:'text',text}]}` shape makeRunAgent expects (or null to degrade). The SDK is LAZY-imported so the
// (CommonJS) harness loads + tests WITHOUT it (lane OFF when absent); `codexImpl` is injectable so unit tests need
// neither the SDK nor a network/login. AUTH: set CODEX_API_KEY (.env) or run `codex login` — until then the lane is
// INERT (returns null). VISION: image crops are written to temp PNGs and sent as Codex `local_image` input items
// (opt out V3_CODEX_VISION=0). TOOLS: `mcpServers` ({name:{url}}) is passed to Codex's config.mcp_servers so the agent
// uses the cdp tools over an in-process Streamable-HTTP MCP server (orchestrate builds it via buildCdpHttpMcpServer).
// The Codex agent runs its own multi-turn tool loop, so this transport stays a single run() call. NOTE: the
// Codex↔MCP handshake + the SDK's exact run()/result/startThread fields are pinned to the docs (2026-06) — verify on
// the first authenticated run; any mismatch surfaces in the [v3:noVerdict] provider:codex log (mode tells you which).
function makeCodexTransport(opts = {}) {
  const {
    codexImpl = null,                            // injectable Codex constructor for tests (no SDK/login needed)
    model = 'gpt-5.4',                           // the requested GPT-5.4 (override per-request via request.model or --model)
    apiKey = (typeof process !== 'undefined' && process.env && process.env.CODEX_API_KEY) || null,
    baseUrl = null, workingDirectory = null,     // a throwaway cwd so the judge agent has no repo side-effects (defaults to os.tmpdir())
    effort = 'medium',                           // reasoning depth → modelReasoningEffort; UNSET ran the SDK default (likely low → no tool-use planning)
    timeoutMs = LIMITS.llm.runTimeoutMs, maxRetries = LIMITS.llm.maxRetries,
    baseBackoffMs = LIMITS.llm.baseBackoffMs, maxBackoffMs = LIMITS.llm.maxBackoffMs,
    getExtraDeadlineMs = null, onTraceSink = null,
  } = opts;
  // map our EffortLevel ('low'|'medium'|'high'|'xhigh'|'max') → the SDK's ModelReasoningEffort (no 'max'; 'minimal' is Codex-only).
  // V3_CODEX_EFFORT overrides for quick experiments. A coding agent at low effort answers directly; higher effort makes it PLAN (→ use tools).
  const EFFORT_MAP = { minimal: 'minimal', low: 'low', medium: 'medium', high: 'high', xhigh: 'xhigh', max: 'xhigh' };
  const reasoningEffort = EFFORT_MAP[(typeof process !== 'undefined' && process.env.V3_CODEX_EFFORT) || effort] || 'medium';
  let _Codex = codexImpl;
  const getCodex = async () => {
    if (_Codex) return _Codex;
    try { const mod = await import('@openai/codex-sdk'); _Codex = mod.Codex || (mod.default && mod.default.Codex) || mod.default; return _Codex; }
    catch (e) { return null; } // SDK not installed ⇒ lane OFF (run `npm i @openai/codex-sdk` to enable)
  };
  const mcpServers = opts.mcpServers || null; // { name: { url } } — Streamable-HTTP MCP servers Codex connects to (cdp tools)
  const toolCatalog = opts.toolCatalog || null; // [{name, description}] — named IN THE PROMPT (stronger channel than MCP instructions)
  // Build the in-prompt tool directive: the agent connects to the MCP server but won't call its tools off the MCP
  // `instructions` alone, so we list the tools + a hard "CALL them first" rule in the USER MESSAGE it weighs most.
  const toolDirective = (decls) => {
    if (!Array.isArray(decls) || !decls.length) return null;
    const lines = decls.map((d) => `- ${d.name}: ${String(d.description || '').replace(/\s+/g, ' ').slice(0, 140)}`).join('\n');
    return 'LIVE TOOLS — you have an MCP server named "cdp" with read-only accessibility-inspection tools that operate on the ACTUAL rendered page for this judgment. You MUST CALL the relevant tool(s) to verify BEFORE you flag or clear a barrier; do NOT decide from the static signals alone when a tool can settle it. Tools:\n'
      + lines + '\nCall the tool(s) first, then return ONLY the JSON verdict, grounded in what they returned.';
  };
  const isOverloaded = (x) => /\b429\b|rate.?limit|overloaded|too many requests|quota/i.test(String(x == null ? '' : (x.message || x)));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  // VISION: map our content blocks → the Codex structured input. Text rides inline; each base64 image crop is written to
  // a temp PNG and passed as { type:'local_image', path } (Codex run() takes image PATHS, not inline base64). Returns the
  // input array + a cleanup() that removes the temp dir. Opt out (text-only fallback) with V3_CODEX_VISION=0.
  const buildInput = (content) => {
    const blocks = content || [];
    const textOnly = process.env.V3_CODEX_VISION === '0' || !blocks.some((b) => b && b.type === 'image' && b.source && b.source.data);
    if (textOnly) {
      const txt = blocks.filter((b) => b && b.type === 'text').map((b) => b.text).join('\n');
      const nImg = blocks.filter((b) => b && b.type === 'image').length;
      return { input: (nImg ? `${txt}\n\n[Note: ${nImg} visual crop(s) captured but omitted from this text-only run.]` : txt), cleanup: () => {} };
    }
    const fs = require('fs'); const path = require('path'); const os = require('os');
    let dir = null; const items = [];
    try {
      for (const b of blocks) {
        if (b && b.type === 'text') items.push({ type: 'text', text: b.text || '' });
        else if (b && b.type === 'image' && b.source && b.source.data) {
          if (!dir) dir = fs.mkdtempSync(path.join(os.tmpdir(), 'codex-vis-'));
          const fp = path.join(dir, `crop-${items.length}.png`);
          fs.writeFileSync(fp, Buffer.from(b.source.data, 'base64'));
          items.push({ type: 'local_image', path: fp });
        }
      }
    } catch (e) { /* fall through with whatever items we have */ }
    const d = dir;
    return { input: items, cleanup: () => { try { if (d) require('fs').rmSync(d, { recursive: true, force: true }); } catch (e) {} } };
  };
  // robust to the SDK's result shape across versions: finalResponse (string|{text}), output, or the last text item.
  const extractText = (r) => {
    if (!r) return null;
    if (typeof r.finalResponse === 'string') return r.finalResponse;
    if (r.finalResponse && typeof r.finalResponse.text === 'string') return r.finalResponse.text;
    if (typeof r.output === 'string') return r.output;
    if (typeof r.text === 'string') return r.text;
    if (Array.isArray(r.items)) {
      for (let i = r.items.length - 1; i >= 0; i--) { const it = r.items[i]; const t = it && (it.text || (it.content && it.content.text) || (it.message && it.message.text)); if (typeof t === 'string' && t.trim()) return t; }
    }
    return null;
  };
  return async function transport(request, callOpts) {
    const onTrace = callOpts && typeof callOpts.onTrace === 'function' ? callOpts.onTrace : null;
    const failTrace = (mode) => { if (onTrace) try { onTrace({ type: 'transportFail', provider: 'codex', mode, finishReason: null }); } catch (e) { /* never throw */ } };
    const Codex = await getCodex();
    if (typeof Codex !== 'function') { failTrace('sdk-absent'); return null; } // SDK absent / lane OFF
    const content0 = (request && request.messages && request.messages[0] && request.messages[0].content) || [];
    // expose the cdp tools IN THE PROMPT (prepended text block) — the stronger channel than the MCP `instructions` field
    // the agent ignored. EMPIRICALLY this STILL produced 0 tool calls AND hurt (uncertain↑, ~10× input tokens from the
    // catalog), so it is OPT-IN (V3_CODEX_TOOL_PROMPT=1), OFF by default. Skipped on the tools-off repair pass.
    const directive = (toolCatalog && mcpServers && !(request && request.disableTools) && (typeof process !== 'undefined' && process.env.V3_CODEX_TOOL_PROMPT === '1')) ? toolDirective(toolCatalog) : null;
    const content = directive ? [{ type: 'text', text: directive }, ...content0] : content0;
    const useModel = (request && request.model) || model;
    const env = { ...(typeof process !== 'undefined' ? process.env : {}) }; if (apiKey) env.CODEX_API_KEY = apiKey;
    const cwd = workingDirectory || (() => { try { return require('os').tmpdir(); } catch (e) { return undefined; } })();
    // TOOLS: Codex connects to Streamable-HTTP MCP servers via config.mcp_servers (the cdp tools, when provided). The
    // envelope-repair retry (request.disableTools) runs WITHOUT them so it is a single plain completion.
    const cfg = (mcpServers && !(request && request.disableTools)) ? { config: { mcp_servers: mcpServers } } : {};
    const deadline = Date.now() + timeoutMs;
    let backoffCreditMs = 0;
    const dueAt = () => deadline + (getExtraDeadlineMs ? (Number(getExtraDeadlineMs()) || 0) : 0) + backoffCreditMs;
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (dueAt() - Date.now() <= 0) { failTrace('deadline'); return null; }
      const { input, cleanup } = buildInput(content); // writes temp crop files for vision; removed in finally
      try {
        const codex = new Codex({ env, skipGitRepoCheck: true, ...cfg, ...(cwd ? { workingDirectory: cwd } : {}), ...(baseUrl ? { baseUrl } : {}) });
        // modelReasoningEffort drives whether the agent PLANS (and thus uses tools); networkAccessEnabled lets it reach the
        // localhost MCP for tool CALLS (the connection worked without it, but a tool call may be gated by the sandbox).
        const thread = codex.startThread({ model: useModel, modelReasoningEffort: reasoningEffort, ...(mcpServers ? { networkAccessEnabled: true } : {}) });
        // race the single run against the remaining deadline (run() exposes no abort signal we can rely on).
        let timer; const timeout = new Promise((_, rej) => { timer = setTimeout(() => rej(new Error('codex-timeout')), Math.max(1, dueAt() - Date.now())); });
        let result; try { result = await Promise.race([thread.run(input), timeout]); } finally { clearTimeout(timer); }
        if (result && result.usage && (onTrace || onTraceSink)) {
          const u = result.usage; const ev = { type: 'result', usage: { input_tokens: u.input_tokens || u.inputTokens || 0, output_tokens: u.output_tokens || u.outputTokens || 0 } };
          if (onTrace) try { onTrace(ev); } catch (e) {} if (onTraceSink) try { onTraceSink(ev); } catch (e) {}
        }
        const text = extractText(result);
        if (text) return { content: [{ type: 'text', text }] };
        failTrace('empty'); return null;
      } catch (e) {
        if (String(e && e.message) === 'codex-timeout') { failTrace('timeout'); return null; }
        if (isOverloaded(e) && attempt < maxRetries) { const b = Math.min(maxBackoffMs, baseBackoffMs * (2 ** attempt)); backoffCreditMs += b; await sleep(b); continue; }
        failTrace('error'); return null; // SDK/auth error ⇒ degrade (lane inert until `codex login` / CODEX_API_KEY)
      } finally { cleanup(); }
    }
    failTrace('retry-exhausted'); return null;
  };
}

// CROSS-FAMILY transport: OpenAI GPT (RESPONSES API, /v1/responses) keyed from OPENAI_API_KEY. Unlike the Codex SDK
// (an agent that would not call our tools), THIS is a HAND-ROLLED function-calling loop WE drive — like the Gemini
// lane — so tool use is guaranteed: we present the cdp tools, the model emits function_call items, we dispatch to the
// SAME buildCdpToolDispatch handlers, feed function_call_output back (chained via previous_response_id so the model's
// reasoning carries across turns), and loop to a final JSON verdict. The RESPONSES API (NOT chat/completions) is
// REQUIRED: gpt-5.4 rejects `tools + reasoning_effort` on chat/completions ("use /v1/responses instead"). `dispatch`
// ({declarations,call}) OPTIONAL: omitted ⇒ a single vision response (no-tools lane); present ⇒ the multi-turn tool
// loop. Vision rides as input_image data-URLs. Token usage (input+output, EVERY turn — output INCLUDES reasoning
// tokens) → BOTH onTrace and onTraceSink so the loop's tokens are fully accounted. fetchImpl injectable; degrades to
// null (never throws) on missing key / HTTP / timeout — lane stays inert without OPENAI_API_KEY.
function makeOpenAITransport(opts = {}) {
  const {
    apiKey = (typeof process !== 'undefined' && process.env && process.env.OPENAI_API_KEY) || null,
    model = 'gpt-5.4', effort = 'medium', dispatch = null,
    maxTurns = LIMITS.llm.toolMaxTurns, maxOutputTokens = Number(process.env.V3_OPENAI_MAX_TOKENS) || 16000,
    baseUrl = 'https://api.openai.com/v1', fetchImpl = null,
    runTimeoutMs = LIMITS.llm.runTimeoutMs, maxRetries = LIMITS.llm.maxRetries,
    baseBackoffMs = LIMITS.llm.baseBackoffMs, maxBackoffMs = LIMITS.llm.maxBackoffMs,
    getExtraDeadlineMs = null, onTraceSink = null,
  } = opts;
  const f = fetchImpl || (typeof fetch === 'function' ? fetch : null);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const EFFORT_MAP = { minimal: 'minimal', low: 'low', medium: 'medium', high: 'high', xhigh: 'high', max: 'high' }; // Responses reasoning.effort: minimal|low|medium|high
  const reasoningEffort = EFFORT_MAP[(typeof process !== 'undefined' && process.env.V3_OPENAI_EFFORT) || effort] || 'medium';
  const toInputContent = (blocks) => (blocks || []).map((b) => {
    if (b && b.type === 'text') return { type: 'input_text', text: b.text || '' };
    if (b && b.type === 'image' && b.source && b.source.data) return { type: 'input_image', image_url: `data:${b.source.media_type || 'image/png'};base64,${b.source.data}` };
    return null;
  }).filter(Boolean);
  const toolDefs = (dispatch && Array.isArray(dispatch.declarations)) // Responses tools are FLAT (name/description/parameters at the top level)
    ? dispatch.declarations.map((d) => ({ type: 'function', name: d.name, description: d.description, parameters: d.parameters || { type: 'object', properties: {} } }))
    : null;
  const extractText = (j) => {
    if (j && typeof j.output_text === 'string' && j.output_text.trim()) return j.output_text; // SDK convenience field, when present
    let text = '';
    for (const item of (j && Array.isArray(j.output) ? j.output : [])) {
      if (item && item.type === 'message' && Array.isArray(item.content)) for (const c of item.content) if (c && (c.type === 'output_text' || c.type === 'text') && typeof c.text === 'string') text += c.text;
    }
    return text;
  };
  return async function transport(request, callOpts = {}) {
    const onTrace = callOpts && typeof callOpts.onTrace === 'function' ? callOpts.onTrace : null;
    const failTrace = (mode) => { if (onTrace) try { onTrace({ type: 'transportFail', provider: 'openai', mode, finishReason: null }); } catch (e) {} };
    const emitUsage = (u) => { if (!u) return; const ev = { type: 'result', usage: { input_tokens: u.input_tokens || 0, output_tokens: u.output_tokens || 0 } }; if (onTrace) try { onTrace(ev); } catch (e) {} if (onTraceSink) try { onTraceSink(ev); } catch (e) {} };
    if (!apiKey) { failTrace('no-key'); return null; } // OPENAI_API_KEY absent ⇒ lane OFF
    if (!f) { failTrace('no-fetch'); return null; }
    const content = (request && request.messages && request.messages[0] && request.messages[0].content) || [];
    const useModel = (request && request.model) || model;
    const useTools = toolDefs && !(request && request.disableTools);
    const maxT = useTools ? Math.max(1, maxTurns) : 1;
    const deadline = Date.now() + runTimeoutMs;
    let backoffCreditMs = 0;
    const dueAt = () => deadline + (getExtraDeadlineMs ? (Number(getExtraDeadlineMs()) || 0) : 0) + backoffCreditMs;
    let input = [{ role: 'user', content: toInputContent(content) }];
    let prevId = null;
    for (let turn = 0; turn < maxT; turn++) {
      if (dueAt() - Date.now() <= 0) { failTrace('deadline'); return null; }
      const offerTools = useTools && turn < maxT - 1; // last turn: no tools ⇒ FORCE the final verdict
      const body = { model: useModel, input, max_output_tokens: maxOutputTokens, reasoning: { effort: reasoningEffort } };
      if (prevId) body.previous_response_id = prevId; // chain so the model's reasoning carries across tool turns
      if (offerTools) { body.tools = toolDefs; body.tool_choice = 'auto'; }
      let j = null;
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        if (dueAt() - Date.now() <= 0) { failTrace('deadline'); return null; }
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), Math.max(1, dueAt() - Date.now()));
        try {
          const r = await f(`${baseUrl}/responses`, { method: 'POST', signal: ctrl.signal, headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' }, body: JSON.stringify(body) });
          clearTimeout(timer);
          if (r.status === 429 || r.status >= 500) { if (attempt < maxRetries) { const b = Math.min(maxBackoffMs, baseBackoffMs * (2 ** attempt)); backoffCreditMs += b; await sleep(b); continue; } failTrace(`http-${r.status}`); return null; }
          if (!r.ok) { failTrace(`http-${r.status}`); return null; } // 4xx (bad model/params/auth) ⇒ degrade
          j = await r.json(); break;
        } catch (e) { clearTimeout(timer); if (attempt < maxRetries) { const b = Math.min(maxBackoffMs, baseBackoffMs * (2 ** attempt)); backoffCreditMs += b; await sleep(b); continue; } failTrace('network'); return null; }
      }
      if (!j) { failTrace('empty'); return null; }
      emitUsage(j.usage);
      prevId = j.id || prevId;
      const fcs = (Array.isArray(j.output) ? j.output : []).filter((o) => o && o.type === 'function_call');
      if (useTools && fcs.length) { // dispatch each function_call to the cdp handlers; next turn sends ONLY the outputs (prevId carries the rest)
        input = [];
        for (const fc of fcs) {
          let args = {}; try { args = JSON.parse(fc.arguments || '{}'); } catch (e) {}
          if (onTrace) try { onTrace({ type: 'tool_use', name: fc.name, input: args }); } catch (e) {}
          let result; try { result = await dispatch.call(fc.name, args); } catch (e) { result = { error: String((e && e.message) || e) }; }
          input.push({ type: 'function_call_output', call_id: fc.call_id, output: JSON.stringify(result == null ? {} : result) });
        }
        if (turn === maxT - 2) input.push({ role: 'user', content: [{ type: 'input_text', text: CONCLUDE_INSTRUCTION }] }); // next turn offers no tools → it must answer
        continue;
      }
      const text = extractText(j);
      if (text && text.trim()) return { content: [{ type: 'text', text }] };
      failTrace('empty-final'); return null;
    }
    failTrace('max-turns'); return null;
  };
}

module.exports = { makeRunAgent, makeAnthropicTransport, makeClaudeSdkTransport, makeGeminiTransport, makeGeminiToolTransport, makeGeminiCacheManager, makeCodexTransport, makeOpenAITransport, makeOpenRouterTransport, makeOpenRouterToolTransport, parseAgentReply, toAnthropicContent, looksDegenerate, geminiCostUsd };
