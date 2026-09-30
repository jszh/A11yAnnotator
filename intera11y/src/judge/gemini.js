'use strict';
// Gemini generateContent client with a function-calling loop. One call = one conversation: the model may call
// tools (up to `toolBudget` executions), then must answer; the last turn is sent with function calling disabled
// so it always ends in text. Model turns are appended verbatim (they carry thought signatures the API needs).
// `log` (optional) receives the whole conversation, turn by turn: the opening prompt, each model turn (thought
// summaries, text, tool calls with their arguments, finish reason, tokens, time), each tool result in full, and
// every message the harness adds. Images are passed as base64; the run's logger stores them as files.
const { bounded } = require('../core/deadline.js');
const { geminiCostUsd } = require('../lib/v3.js');

const BASE = 'https://generativelanguage.googleapis.com/v1beta';
const LEVEL = { minimal: 'MINIMAL', low: 'LOW', medium: 'MEDIUM', high: 'HIGH' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function toParts(blocks) {
  return blocks.map((b) => (b.type === 'image'
    ? { inlineData: { mimeType: b.mime || 'image/png', data: b.data } }
    : { text: b.text }));
}

// Split a tool result into JSON text + inline images (any `{ base64 | png | screenshot }` string fields that are
// base64 PNGs are lifted out as images so the model sees pixels, and the JSON carries a reference instead).
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

// a single tool call is abandoned after this long (or when the unit's deadline passes, if sooner)
const TOOL_CALL_MS = 3 * 60 * 1000;

// a model turn's parts as a log record: thought summaries, text, and tool calls (thought signatures omitted)
const logParts = (parts) => parts.map((p) => (p.functionCall ? { toolCall: { name: p.functionCall.name, args: p.functionCall.args || {} } }
  : p.text !== undefined ? { [p.thought ? 'thought' : 'text']: p.text } : { other: Object.keys(p) }));

function makeGeminiClient({ apiKey = process.env.GEMINI_API_KEY, model, effort = 'high', maxOutputTokens = 32768, onUsage, includeThoughts = true } = {}) {
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');
  const usage = { calls: 0, inputTokens: 0, outputTokens: 0, cachedTokens: 0, costUsd: 0, toolCalls: 0 };

  async function post(body, deadline, local) {
    for (let attempt = 0; attempt < 7; attempt++) {
      const left = deadline ? deadline.remaining() : 300000;
      if (left <= 0) return { error: 'deadline' };
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), Math.min(left, 300000));
      try {
        const r = await fetch(`${BASE}/models/${model}:generateContent`, {
          method: 'POST', signal: ctrl.signal,
          headers: { 'content-type': 'application/json', 'x-goog-api-key': apiKey }, body: JSON.stringify(body),
        });
        if (r.status === 429 || r.status >= 500) { await sleep(Math.min(60000, 2000 * 2 ** attempt) * (1 + Math.random() * 0.3)); continue; }
        if (!r.ok) return { error: `http-${r.status}: ${(await r.text()).slice(0, 300)}` };
        const j = await r.json();
        const um = j.usageMetadata || {};
        const inTok = um.promptTokenCount || 0;
        const outTok = (um.candidatesTokenCount || 0) + (um.thoughtsTokenCount || 0);
        const cached = um.cachedContentTokenCount || 0;
        const cost = geminiCostUsd({ model, inputTokens: inTok, outputTokens: outTok, cachedTokens: cached }) || 0;
        for (const u of [usage, local]) { if (!u) continue; u.calls++; u.inputTokens += inTok; u.outputTokens += outTok; u.cachedTokens += cached; u.costUsd += cost; }
        if (onUsage) onUsage({ inputTokens: inTok, outputTokens: outTok, costUsd: cost });
        return { json: j, usage: { inputTokens: inTok, outputTokens: outTok, thoughtTokens: um.thoughtsTokenCount || 0, cachedTokens: cached, costUsd: cost } };
      } catch (e) {
        if (deadline && deadline.expired()) return { error: 'deadline' };
        await sleep(2000 * (attempt + 1));
      } finally { clearTimeout(timer); }
    }
    return { error: 'retries-exhausted' };
  }

  // system: string; blocks: [{type:'text',text}|{type:'image',data,mime}]; tools: {declarations:[], call(name,args)}
  async function converse({ system, blocks, tools, toolBudget = 0, deadline, trace, log, responseSchema }) {
    const local = { calls: 0, inputTokens: 0, outputTokens: 0, cachedTokens: 0, costUsd: 0 };
    const say = (ev) => { if (log) { try { log(ev); } catch (e) { /* logging never throws */ } } };
    const done = (r) => { say({ turn: 'end', error: r.error || null, toolCalls: r.toolCalls, finishReason: r.finishReason || null, usage: local }); return { ...r, usage: local }; };
    const contents = [{ role: 'user', parts: toParts(blocks) }];
    const decls = tools && tools.declarations && tools.declarations.length ? tools.declarations : null;
    say({ turn: 'prompt', model, effort, toolBudget, tools: decls ? decls.map((d) => d.name) : [], system, blocks });
    let used = 0, lastFinish = null;
    for (let turn = 0; turn < toolBudget + 3; turn++) {
      const allowTools = decls && used < toolBudget;
      const body = {
        systemInstruction: { parts: [{ text: system }] },
        contents,
        generationConfig: { maxOutputTokens, temperature: 0, thinkingConfig: { thinkingLevel: LEVEL[effort] || 'HIGH', ...(includeThoughts ? { includeThoughts: true } : {}) },
          // structured output: the answer text is constrained to the schema (tool calls are unaffected)
          ...(responseSchema ? { responseMimeType: 'application/json', responseJsonSchema: responseSchema } : {}) },
      };
      // once the budget is spent the tools are not declared at all: with tools declared but disabled the model
      // can still attempt a call and end the turn without an answer
      if (allowTools) body.tools = [{ functionDeclarations: decls }];
      const t0 = Date.now();
      const res = await post(body, deadline, local);
      if (res.error) { say({ turn, error: res.error, ms: Date.now() - t0 }); return done({ error: res.error, toolCalls: used }); }
      const cand = (res.json.candidates || [])[0];
      const parts = (cand && cand.content && cand.content.parts) || [];
      const calls = parts.filter((p) => p.functionCall);
      say({ turn, role: 'model', toolsOffered: !!allowTools, parts: logParts(parts), finishReason: cand ? cand.finishReason : 'no-candidate', usage: res.usage, ms: Date.now() - t0 });
      if (calls.length && allowTools) {
        contents.push(cand.content);
        const responseParts = [];
        const imageParts = [];
        for (const p of calls) {
          const { name, args } = p.functionCall;
          const tt = Date.now();
          let result;
          if (used >= toolBudget) result = { error: 'tool budget exhausted — answer from the evidence you have' };
          else {
            used++; usage.toolCalls++;
            const ms = Math.min(TOOL_CALL_MS, deadline ? deadline.remaining() : TOOL_CALL_MS);
            try { result = await bounded(tools.call(name, args || {}), ms, { error: 'the tool did not finish within its time limit' }); } catch (e) { result = { error: String((e && e.message) || e) }; }
          }
          const images = [];
          const clean = splitImages(result && typeof result === 'object' ? result : { result }, images);
          if (trace) trace({ tool: name, args, result: JSON.stringify(clean).slice(0, 4000), images: images.length });
          say({ turn, role: 'tool', name, args: args || {}, result: clean, images: images.map((i) => i.data), ms: Date.now() - tt });
          responseParts.push({ functionResponse: { name, response: clean } });
          for (const img of images) imageParts.push({ inlineData: { mimeType: img.mime, data: img.data } });
        }
        const last = used >= toolBudget ? [{ text: 'The tool budget is used up. Give your final answer now, in the required JSON format, from the evidence you have.' }] : [];
        if (last.length) say({ turn, role: 'harness', text: last[0].text });
        contents.push({ role: 'user', parts: [...responseParts, ...(imageParts.length ? [{ text: 'Images returned by the tool calls above, in order:' }, ...imageParts] : []), ...last] });
        continue;
      }
      const text = parts.filter((p) => p.text && !p.thought).map((p) => p.text).join('');
      if (text.trim()) return done({ text, toolCalls: used, finishReason: cand && cand.finishReason });
      if (cand && cand.finishReason === 'MAX_TOKENS') return done({ error: 'max-tokens', toolCalls: used });
      // no text and no usable call: ask once more without tools
      lastFinish = cand ? cand.finishReason : 'no-candidate';
      if (cand && cand.content && cand.content.parts && cand.content.parts.length && !calls.length) contents.push(cand.content);
      contents.push({ role: 'user', parts: [{ text: 'Give your final answer now, in the required JSON format.' }] });
      say({ turn, role: 'harness', text: 'Give your final answer now, in the required JSON format.', because: lastFinish });
      used = toolBudget;
    }
    return done({ error: `no-answer (${lastFinish})`, toolCalls: used });
  }

  return { converse, usage };
}

module.exports = { makeGeminiClient };
