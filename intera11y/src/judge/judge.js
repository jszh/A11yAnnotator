'use strict';
// Judges a criterion's OPEN candidates on one page: batches them by an evidence-size estimate, runs one
// conversation per batch (with the criterion's tools), and maps the answer back to candidates. A candidate left
// without a verdict — the answer did not parse, left it out, or was cut off — is judged again in a fresh, smaller
// batch (up to REJUDGE_ROUNDS times); one still without a verdict gets NO_VERDICT, recorded, never read as PASS.
const { SYSTEM, ANSWER_SCHEMA, buildBatchMessage } = require('./prompt.js');
const { bindTools } = require('./tools.js');
const { CONFIG } = require('../core/config.js');
const { Deadline } = require('../core/deadline.js');

const VERDICTS = new Set(['FAIL', 'PASS', 'NOT_APPLICABLE', 'UNDETERMINED']);

function estimateTokens(c) {
  const t = JSON.stringify(c.facts || {}).length + ((c.element && c.element.openTag) || '').length + 200;
  return Math.ceil(t / 4) + (c.images || []).filter((x) => x && x.data).length * 700;
}

function batches(cands, maxPerBatch = CONFIG.judge.maxCandidatesPerBatch) {
  const out = [];
  let cur = [], tok = 0, imgs = 0;
  for (const c of cands) {
    const t = estimateTokens(c);
    const n = (c.images || []).filter((x) => x && x.data).length;
    if (cur.length && (tok + t > CONFIG.judge.batchTokenBudget || imgs + n > CONFIG.judge.maxImagesPerBatch || cur.length >= maxPerBatch)) { out.push(cur); cur = []; tok = 0; imgs = 0; }
    cur.push(c); tok += t; imgs += n;
  }
  if (cur.length) out.push(cur);
  return out;
}

// The answer object. A model may wrap it in prose or a code fence, or write it after reasoning that itself contains
// braces, so every fenced block (last first) and every balanced top-level object is tried for one with a
// `candidates` array. When none parses whole (cut off, or one malformed entry), every per-candidate verdict object
// that is whole JSON on its own is kept ({ candidates, partial: true }); candidates without one are judged again.
function parseAnswer(text) {
  const sources = [...String(text).matchAll(/```(?:json)?\s*([\s\S]*?)```/gi)].map((m) => m[1]).reverse();
  sources.push(String(text));
  const salvaged = new Map();
  for (const s of sources) {
    for (let start = s.indexOf('{'); start >= 0; start = s.indexOf('{', start + 1)) {
      let depth = 0, inStr = false, esc = false;
      const opens = [];
      let end = -1;
      for (let i = start; i < s.length; i++) {
        const ch = s[i];
        if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inStr = false; continue; }
        if (ch === '"') inStr = true;
        else if (ch === '{') { depth++; opens.push(i); }
        else if (ch === '}') {
          const o = opens.pop();
          try { const v = JSON.parse(s.slice(o, i + 1)); if (v && typeof v.path === 'string' && typeof v.verdict === 'string' && !salvaged.has(v.path)) salvaged.set(v.path, v); } catch (e) { /* not a verdict object */ }
          if (--depth === 0) { end = i; break; }
        }
      }
      if (end < 0) break;   // this start never closes; later starts are inside it
      try { const v = JSON.parse(s.slice(start, end + 1)); if (v && Array.isArray(v.candidates)) return v; } catch (e) { /* try the next object */ }
      start = end;
    }
  }
  return salvaged.size ? { candidates: [...salvaged.values()], partial: true } : null;
}

const norm = (p) => String(p || '').trim();

// the tool budget scales with the batch: a fixed budget per candidate, within a floor and a ceiling
const budgetFor = (n) => Math.max(CONFIG.judge.toolCalls.min, Math.min(CONFIG.judge.toolCalls.max, CONFIG.judge.toolCalls.perCandidate * n));

// Each batch gets the unit time limit once per element it holds (10 minutes per element, as if each were judged
// alone), from the moment it is dispatched (it may first wait for a slot in the shared LLM pool; waiting is not the
// batch's work and does not count against it).
// candidates left without a verdict are judged again, in batches half the size each round
const REJUDGE_ROUNDS = 2;

async function judgeCandidates({ criterion, page, session, candidates, client, llmPool, trace }) {
  const results = new Map();
  const pageFindings = [];
  const usage = { calls: 0, inputTokens: 0, outputTokens: 0, costUsd: 0, toolCalls: 0, batches: 0, rejudged: 0 };
  const tools = CONFIG.judge.tools ? bindTools(session, criterion.tools || []) : null;
  let bi = 0;
  const judgeBatch = async (batch, round) => {
    const b = bi++;
    const deadline = new Deadline(CONFIG.unitDeadlineMs * batch.length);
    const blocks = buildBatchMessage(criterion, page, batch);
    const toolTrace = [];
    const log = trace && ((ev) => trace({ kind: 'turn', sc: criterion.sc, stage: 'judge', batch: b, round, ...(ev.turn === 'prompt' ? { candidates: batch.map((c) => c.path) } : {}), ...ev }));
    const res = await client.converse({ system: SYSTEM, blocks, tools, toolBudget: tools ? budgetFor(batch.length) : 0, deadline, trace: (t) => toolTrace.push(t), log, responseSchema: ANSWER_SCHEMA });
    const parsed = res.text ? parseAnswer(res.text) : null;
    usage.batches++; usage.toolCalls += res.toolCalls || 0;
    if (round) usage.rejudged += batch.length;
    if (res.usage) for (const k of ['calls', 'inputTokens', 'outputTokens', 'costUsd']) usage[k] += res.usage[k] || 0;
    if (trace) trace({ sc: criterion.sc, batch: b, round, size: batch.length, toolCalls: res.toolCalls, tools: toolTrace, error: res.error || (parsed ? (parsed.partial ? 'partial-answer' : null) : 'unparseable'), answer: res.text ? res.text.slice(0, 20000) : null });
    const why = res.error || (parsed ? 'candidate missing from answer' : 'unparseable answer');
    const byPath = new Map(((parsed && parsed.candidates) || []).filter((v) => v && VERDICTS.has(v.verdict)).map((v) => [norm(v.path), v]));
    for (const c of batch) {
      const v = byPath.get(norm(c.path));
      results.set(c.path, v ? { verdict: v.verdict, evidence: v.evidence || '', reason: v.reason || '', toolCalls: res.toolCalls, ...(round ? { round } : {}) } : { verdict: 'NO_VERDICT', reason: why });
    }
    for (const f of (parsed && parsed.pageFindings) || []) if (f && (f.reason || f.evidence)) pageFindings.push({ xpath: f.path || null, reason: f.reason || '', evidence: f.evidence || '' });
  };
  let pending = candidates;
  let max = CONFIG.judge.maxCandidatesPerBatch;
  for (let round = 0; round <= REJUDGE_ROUNDS && pending.length; round++) {
    await Promise.all(batches(pending, max).map((batch) => llmPool(() => judgeBatch(batch, round))));
    pending = candidates.filter((c) => results.get(c.path) && results.get(c.path).verdict === 'NO_VERDICT');
    max = Math.max(1, Math.ceil(max / 2));
  }
  return { results, pageFindings, usage };
}

module.exports = { judgeCandidates, parseAnswer };
