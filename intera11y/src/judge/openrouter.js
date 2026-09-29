'use strict';
// OpenRouter chat/completions client with the same interface and behaviour as the Gemini client (gemini.js):
// one call = one conversation; the model may call tools (up to `toolBudget` executions), then must answer; once
// the budget is spent tools are no longer offered, so the conversation ends in text. `log` receives the whole
// conversation turn by turn in the same record shapes. Used for models Google does not serve (e.g. GLM 5.3).
//
// OpenRouter specifics, as in v3's OpenRouter transports (scripts/v3/lib/llm-agent-adapter.js): cost is the
// `usage.cost` the API reports (credits charged); an upstream failure arrives as HTTP 200 with an `error` body and
// is retried like a 5xx; tool results cannot carry images, so a tool's images follow as a user message; a tool
// call whose arguments are not valid JSON is re-asked, never executed with guessed arguments.
const { bounded } = require('../core/deadline.js');

const BASE = 'https://openrouter.ai/api/v1';
const REASONING = { minimal: 'low', low: 'low', medium: 'medium', high: 'high' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const backoff = (attempt) => Math.min(60000, 2000 * 2 ** attempt) * (1 + Math.random() * 0.3);
const TOOL_CALL_MS = 3 * 60 * 1000;
const MAX_ARG_RETRIES = 3;

function toContent(blocks) {
  return blocks.map((b) => (b.type === 'image'
    ? { type: 'image_url', image_url: { url: `data:${b.mime || 'image/png'};base64,${b.data}` } }
    : { type: 'text', text: b.text }));
}

// a tool result's base64 images, lifted out (the JSON keeps a reference), as in gemini.js
function splitImages(obj, images, depth = 0) {
  if (!obj || typeof obj !== 'object' || depth > 6) return obj;
  if (Array.isArray(obj)) return obj.map((v) => splitImages(v, images, depth + 1));
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string' && v.length > 1000 && /^(iVBORw0KGgo|\/9j\/)/.test(v)) {
      images.push({ mime: v.startsWith('/9j/') ? 'image/jpeg' : 'image/png', data: v });
      out[k] = `[image #${images.length} attached]`;
    } else if (typeof v === 'string' && v.startsWith('data:image/') && v.length > 1000) {
      const m = /^data:(image\/[a-z]+);base64,(.*)$/.exec(v);
      if (m) { images.push({ mime: m[1], data: m[2] }); out[k] = `[image #${images.length} attached]`; } else out[k] = v;
    } else out[k] = splitImages(v, images, depth + 1);
  }
  return out;
}

function makeOpenRouterClient({ apiKey = process.env.OPENROUTER_API_KEY, model, effort = 'high', maxOutputTokens = 32768, onUsage } = {}) {
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set');
  const usage = { calls: 0, inputTokens: 0, outputTokens: 0, cachedTokens: 0, costUsd: 0, toolCalls: 0 };
  const reasoning = REASONING[effort] || 'high';

  async function post(body, deadline, local) {
    for (let attempt = 0; attempt < 8; attempt++) {
      const left = deadline ? deadline.remaining() : 300000;
      if (left <= 0) return { error: 'deadline' };
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), Math.min(left, 600000));
      try {
        const r = await fetch(`${BASE}/chat/completions`, {
          method: 'POST', signal: ctrl.signal,
          headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' }, body: JSON.stringify(body),
        });
        if (r.status === 429 || r.status >= 500) { await sleep(backoff(attempt)); continue; }
        if (!r.ok) return { error: `http-${r.status}: ${(await r.text()).slice(0, 300)}` };
        const j = await r.json();
        if (j && j.error) { await sleep(backoff(attempt)); continue; }   // HTTP 200 + error body: transient upstream failure
        const u = j.usage || {};
        const inTok = u.prompt_tokens || 0;
        const outTok = u.completion_tokens || 0;
        const thought = (u.completion_tokens_details || {}).reasoning_tokens || 0;
        const cached = (u.prompt_tokens_details || {}).cached_tokens || 0;
        const cost = typeof u.cost === 'number' ? u.cost : 0;
        for (const x of [usage, local]) { if (!x) continue; x.calls++; x.inputTokens += inTok; x.outputTokens += outTok; x.cachedTokens += cached; x.costUsd += cost; }
        if (onUsage) onUsage({ inputTokens: inTok, outputTokens: outTok, costUsd: cost });
        return { json: j, usage: { inputTokens: inTok, outputTokens: outTok, thoughtTokens: thought, cachedTokens: cached, costUsd: cost } };
      } catch (e) {
        if (deadline && deadline.expired()) return { error: 'deadline' };
        await sleep(backoff(attempt));
      } finally { clearTimeout(timer); }
    }
    return { error: 'retries-exhausted' };
  }

  async function converse({ system, blocks, tools, toolBudget = 0, deadline, trace, log }) {
    const local = { calls: 0, inputTokens: 0, outputTokens: 0, cachedTokens: 0, costUsd: 0 };
    const say = (ev) => { if (log) { try { log(ev); } catch (e) { /* logging never throws */ } } };
    const done = (r) => { say({ turn: 'end', error: r.error || null, toolCalls: r.toolCalls, finishReason: r.finishReason || null, usage: local }); return { ...r, usage: local }; };
    const messages = [{ role: 'system', content: system }, { role: 'user', content: toContent(blocks) }];
    const decls = tools && tools.declarations && tools.declarations.length
      ? tools.declarations.map((d) => ({ type: 'function', function: { name: d.name, description: d.description, parameters: d.parameters } })) : null;
    say({ turn: 'prompt', model, effort, toolBudget, tools: decls ? decls.map((d) => d.function.name) : [], system, blocks });
    let used = 0, lastFinish = null, argRetries = 0;
    for (let turn = 0; turn < toolBudget + 3; turn++) {
      const allowTools = decls && used < toolBudget;
      const body = { model, messages, max_tokens: maxOutputTokens, temperature: 0, usage: { include: true }, reasoning: { effort: reasoning } };
      if (allowTools) { body.tools = decls; body.tool_choice = 'auto'; }
      const t0 = Date.now();
      const res = await post(body, deadline, local);
      if (res.error) { say({ turn, error: res.error, ms: Date.now() - t0 }); return done({ error: res.error, toolCalls: used }); }
      const ch = (res.json.choices || [])[0] || {};
      const m = ch.message || {};
      const calls = m.tool_calls || [];
      const parts = [
        ...(m.reasoning ? [{ thought: m.reasoning }] : []),
        ...(m.content ? [{ text: m.content }] : []),
        ...calls.map((c) => { let args; try { args = JSON.parse((c.function && c.function.arguments) || '{}'); } catch (e) { args = { unparseable: String((c.function && c.function.arguments) || '').slice(0, 2000) }; } return { toolCall: { name: c.function && c.function.name, args } }; }),
      ];
      say({ turn, role: 'model', toolsOffered: !!allowTools, parts, finishReason: ch.finish_reason || 'no-choice', usage: res.usage, ms: Date.now() - t0 });
      if (calls.length && allowTools) {
        const parsed = [];
        let bad = null;
        for (const c of calls) { try { parsed.push({ c, args: JSON.parse((c.function && c.function.arguments) || '{}') }); } catch (e) { bad = (c.function && c.function.name) || '?'; break; } }
        if (bad) {
          if (argRetries++ < MAX_ARG_RETRIES) { say({ turn, role: 'harness', text: `re-asked: the arguments of ${bad} were not valid JSON` }); turn--; continue; }
          return done({ error: 'tool-args-unparseable', toolCalls: used });
        }
        messages.push({ role: 'assistant', content: m.content || null, tool_calls: calls });
        const images = [];
        for (const { c, args } of parsed) {
          const name = c.function.name;
          const tt = Date.now();
          let result;
          if (used >= toolBudget) result = { error: 'tool budget exhausted — answer from the evidence you have' };
          else {
            used++; usage.toolCalls++;
            const ms = Math.min(TOOL_CALL_MS, deadline ? deadline.remaining() : TOOL_CALL_MS);
            try { result = await bounded(tools.call(name, args || {}), ms, { error: 'the tool did not finish within its time limit' }); } catch (e) { result = { error: String((e && e.message) || e) }; }
          }
          const own = [];
          const clean = splitImages(result && typeof result === 'object' ? result : { result }, own);
          if (trace) trace({ tool: name, args, result: JSON.stringify(clean).slice(0, 4000), images: own.length });
          say({ turn, role: 'tool', name, args: args || {}, result: clean, images: own.map((i) => i.data), ms: Date.now() - tt });
          messages.push({ role: 'tool', tool_call_id: c.id, content: JSON.stringify(clean) });
          images.push(...own);
        }
        const extra = [];
        if (images.length) extra.push({ type: 'text', text: 'Images returned by the tool calls above, in order:' }, ...images.map((i) => ({ type: 'image_url', image_url: { url: `data:${i.mime};base64,${i.data}` } })));
        if (used >= toolBudget) {
          const t = 'The tool budget is used up. Give your final answer now, in the required JSON format, from the evidence you have.';
          extra.push({ type: 'text', text: t });
          say({ turn, role: 'harness', text: t });
        }
        if (extra.length) messages.push({ role: 'user', content: extra });
        continue;
      }
      const text = m.content || '';
      if (text.trim()) return done({ text, toolCalls: used, finishReason: ch.finish_reason });
      if (ch.finish_reason === 'length') return done({ error: 'max-tokens', toolCalls: used });
      lastFinish = ch.finish_reason || 'no-choice';
      if (m.content || calls.length) messages.push({ role: 'assistant', content: m.content || '' });
      const t = 'Give your final answer now, in the required JSON format.';
      messages.push({ role: 'user', content: t });
      say({ turn, role: 'harness', text: t, because: lastFinish });
      used = toolBudget;
    }
    return done({ error: `no-answer (${lastFinish})`, toolCalls: used });
  }

  return { converse, usage };
}

module.exports = { makeOpenRouterClient };
