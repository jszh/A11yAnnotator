'use strict';
// Judges a criterion's OPEN candidates on one page: batches them by an evidence-size estimate, runs one
// conversation per batch (with the criterion's tools), and maps the answer back to candidates. A candidate the
// answer does not mention, or a batch whose call failed, gets NO_VERDICT — recorded, never read as PASS.
const { SYSTEM, buildBatchMessage } = require('./prompt.js');
const { bindTools } = require('./tools.js');
const { CONFIG } = require('../core/config.js');
const { Deadline } = require('../core/deadline.js');

const VERDICTS = new Set(['FAIL', 'PASS', 'NOT_APPLICABLE', 'UNDETERMINED']);

function estimateTokens(c) {
  const t = JSON.stringify(c.facts || {}).length + ((c.element && c.element.openTag) || '').length + 200;
  return Math.ceil(t / 4) + (c.images || []).filter((x) => x && x.data).length * 700;
}

function batches(cands) {
  const out = [];
  let cur = [], tok = 0, imgs = 0;
  for (const c of cands) {
    const t = estimateTokens(c);
    const n = (c.images || []).filter((x) => x && x.data).length;
    if (cur.length && (tok + t > CONFIG.judge.batchTokenBudget || imgs + n > CONFIG.judge.maxImagesPerBatch || cur.length >= CONFIG.judge.maxCandidatesPerBatch)) { out.push(cur); cur = []; tok = 0; imgs = 0; }
    cur.push(c); tok += t; imgs += n;
  }
  if (cur.length) out.push(cur);
  return out;
}

// The answer object; or, when the answer was cut off, every per-candidate verdict object that did complete (each
// is whole JSON on its own, so it is kept; candidates after the cut get NO_VERDICT).
function parseAnswer(text) {
  const s = text.replace(/^```[a-z]*\s*/i, '').replace(/```\s*$/, '');
  const start = s.indexOf('{');
  if (start < 0) return null;
  let depth = 0, inStr = false, esc = false;
  const opens = [], complete = [];
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (inStr) { if (esc) esc = false; else if (ch === '\\') esc = true; else if (ch === '"') inStr = false; continue; }
    if (ch === '"') inStr = true;
    else if (ch === '{') { depth++; opens.push(i); }
    else if (ch === '}') {
      const o = opens.pop();
      if (--depth === 0) { try { return JSON.parse(s.slice(start, i + 1)); } catch (e) { return null; } }
      try { const v = JSON.parse(s.slice(o, i + 1)); if (v && typeof v.path === 'string' && typeof v.verdict === 'string') complete.push(v); } catch (e) { /* not a verdict object */ }
    }
  }
  return complete.length ? { candidates: complete, truncated: true } : null;
}

const norm = (p) => String(p || '').trim();

// the tool budget scales with the batch: a fixed budget per candidate, within a floor and a ceiling
const budgetFor = (n) => Math.max(CONFIG.judge.toolCalls.min, Math.min(CONFIG.judge.toolCalls.max, CONFIG.judge.toolCalls.perCandidate * n));

// Each batch gets the unit time limit once per element it holds (10 minutes per element, as if each were judged
// alone), from the moment it is dispatched (it may first wait for a slot in the shared LLM pool; waiting is not the
// batch's work and does not count against it).
async function judgeCandidates({ criterion, page, session, candidates, client, llmPool, trace }) {
  const results = new Map();
  const pageFindings = [];
  const usage = { calls: 0, inputTokens: 0, outputTokens: 0, costUsd: 0, toolCalls: 0, batches: 0 };
  const tools = CONFIG.judge.tools ? bindTools(session, criterion.tools || []) : null;
  const runs = batches(candidates).map((batch, bi) => llmPool(async () => {
    const deadline = new Deadline(CONFIG.unitDeadlineMs * batch.length);
    const blocks = buildBatchMessage(criterion, page, batch);
    const toolTrace = [];
    const log = trace && ((ev) => trace({ kind: 'turn', sc: criterion.sc, stage: 'judge', batch: bi, ...(ev.turn === 'prompt' ? { candidates: batch.map((c) => c.path) } : {}), ...ev }));
    const res = await client.converse({ system: SYSTEM, blocks, tools, toolBudget: tools ? budgetFor(batch.length) : 0, deadline, trace: (t) => toolTrace.push(t), log });
    const parsed = res.text ? parseAnswer(res.text) : null;
    usage.batches++; usage.toolCalls += res.toolCalls || 0;
    if (res.usage) for (const k of ['calls', 'inputTokens', 'outputTokens', 'costUsd']) usage[k] += res.usage[k] || 0;
    if (trace) trace({ sc: criterion.sc, batch: bi, size: batch.length, toolCalls: res.toolCalls, tools: toolTrace, error: res.error || (parsed ? (parsed.truncated ? 'truncated-answer' : null) : 'unparseable'), answer: res.text ? res.text.slice(0, 20000) : null });
    if (!parsed || !Array.isArray(parsed.candidates)) {
      for (const c of batch) results.set(c.path, { verdict: 'NO_VERDICT', reason: res.error || 'unparseable answer' });
      return;
    }
    const byPath = new Map(parsed.candidates.filter((v) => v && VERDICTS.has(v.verdict)).map((v) => [norm(v.path), v]));
    for (const c of batch) {
      const v = byPath.get(norm(c.path));
      results.set(c.path, v ? { verdict: v.verdict, evidence: v.evidence || '', reason: v.reason || '', toolCalls: res.toolCalls } : { verdict: 'NO_VERDICT', reason: 'candidate missing from answer' });
    }
    for (const f of parsed.pageFindings || []) if (f && (f.reason || f.evidence)) pageFindings.push({ xpath: f.path || null, reason: f.reason || '', evidence: f.evidence || '' });
  }));
  await Promise.all(runs);
  return { results, pageFindings, usage };
}

module.exports = { judgeCandidates, parseAnswer };
