'use strict';
// SCREENING SWEEP — a page-wide LLM pass that selects, for one criterion, the elements worth testing.
//
// Adapted from GenA11y's per-criterion detectors: the page's elements relevant to the criterion, each labelled
// `[path: …]` with its XPath, go to the model with the criterion's test rules, in chunks. What changes is the
// question. GenA11y asks for violations and tells the model to "only flag clear violations"; the sweep asks which
// elements should be TESTED — those the criterion applies to whose conformance the evidence here does not already
// settle — and says that selecting is not a verdict. Every selected element then goes through the same sound rules
// and the same neutral judge as the rule-based inventory, so the sweep only widens what is tested; it never decides.
const { key } = require('../lib/xpath.js');
const { load } = require('../judge/rubric.js');
const { isRendered } = require('../model/page-model.js');
const { Deadline } = require('../core/deadline.js');
const { CONFIG } = require('../core/config.js');

const SYSTEM = `You are an accessibility tester planning a WCAG 2.2 evaluation of one web page.

You receive one success criterion with its test rules, a screenshot of the page's first viewport (1280×900 CSS px), and elements of the page. Each element is prefixed with a [path: …] label giving its XPath, followed by its opening tag, its own text, its computed accessibility role and name, and its box on the page (width×height at x,y in CSS px).

Select the elements that should be tested against this criterion: elements the criterion applies to whose conformance the information here does not already settle — both those that look like failures and those you cannot decide. Leave out elements the criterion does not apply to and elements the information here already shows to conform. Selecting an element is not a verdict: every selected element is tested afterwards on the running page, where it can pass or fail.

Respond with ONLY a JSON object (no markdown, no prose):
{"elements":[{"path":"<XPath copied verbatim from a [path: …] label>","aspect":"<what about this element needs testing, one sentence>"}]}
Return {"elements":[]} if no element needs testing.`;

const CHUNK_TOKENS = 18000;

const clip = (s, n) => { s = String(s || '').replace(/\s+/g, ' ').trim(); return s.length > n ? s.slice(0, n) + '…' : s; };

function line(e) {
  const ax = e.ax || {};
  const flags = [];
  if (e.tabindex !== null && e.tabindex !== undefined) flags.push(`tabindex=${e.tabindex}`);
  else if (e.nativeFocusable) flags.push('focusable');
  if (e.listeners) flags.push(`listeners=${e.listeners}`);
  if (e.inlineHandlers && e.inlineHandlers.length) flags.push(`handlers=${e.inlineHandlers.join(',')}`);
  if (e.cursorPointer) flags.push('pointer-cursor');
  if (e.disabled) flags.push('disabled');
  if (e.ariaHiddenSelf || e.ariaHiddenAncestor) flags.push('aria-hidden');
  if (e.visuallyHidden) flags.push('visually-hidden');
  if (e.inShadow) flags.push('in-shadow-root');
  const r = e.rect || {};
  return `[path: ${e.xpath}] ${clip(e.openTag, 220)}${e.text ? ` text="${clip(e.text, 120)}"` : ''} | role=${ax.role || '—'} name="${clip(ax.name, 100)}"${ax.ignored ? ' (ignored by AT)' : ''} | box=${r.w}×${r.h}@${r.x},${r.y}${flags.length ? ' | ' + flags.join(' ') : ''}`;
}

function chunks(lines) {
  const out = [];
  let cur = [], tok = 0;
  for (const l of lines) {
    const t = Math.ceil(l.length / 4);
    if (cur.length && tok + t > CHUNK_TOKENS) { out.push(cur); cur = []; tok = 0; }
    cur.push(l); tok += t;
  }
  if (cur.length) out.push(cur);
  return out;
}

function parse(text) {
  const s = String(text || '').replace(/^```[a-z]*\s*/i, '').replace(/```\s*$/, '');
  const a = s.indexOf('{'), b = s.lastIndexOf('}');
  if (a < 0 || b < a) return null;
  try { return JSON.parse(s.slice(a, b + 1)); } catch (e) { return null; }
}

// → { proposals: Map<xpath, aspect>, selected, unknownPaths, calls, failedCalls, usage }
// each call gets the unit time limit from when it is dispatched, like a judge batch
async function sweep({ criterion, model, client, llmPool, trace }) {
  const usage = { calls: 0, inputTokens: 0, outputTokens: 0, costUsd: 0 };
  const proposals = new Map();
  const spec = criterion.screen;
  if (!spec) return { proposals, selected: 0, unknownPaths: 0, calls: 0, failedCalls: 0, usage };
  // elements a user can meet at all (rendered), of the kinds the criterion concerns
  const pool = model.elements.filter((e) => isRendered(e) && spec.select(e, model));
  const byKey = new Map(model.elements.map((e) => [key(e.xpath), e]));
  const head = `Success criterion: SC ${criterion.sc} ${criterion.title}\nTest rules:\n${load(criterion.sc).rules.map((r, i) => `${i + 1}. ${r.text}`).join('\n')}\n\nPage: ${model.doc.url} — title ${JSON.stringify(model.doc.title || '')}\n------------------\nElements (${pool.length} on the page of the kinds this criterion concerns${'{N}'}):\n`;
  const parts = chunks(pool.map(line));
  let unknownPaths = 0, failedCalls = 0;
  await Promise.all(parts.map((part, i) => llmPool(async () => {
    const deadline = new Deadline(CONFIG.unitDeadlineMs);
    const blocks = [{ type: 'text', text: head.replace('{N}', parts.length > 1 ? `; part ${i + 1} of ${parts.length}` : '') + part.join('\n') }];
    if (model.screenshot) blocks.push({ type: 'image', data: model.screenshot, mime: 'image/png' });
    const res = await client.converse({ system: SYSTEM, blocks, deadline, log: trace && ((ev) => trace({ kind: 'turn', sc: criterion.sc, stage: 'screen', chunk: i, ...ev })) });
    if (res.usage) for (const k of Object.keys(usage)) usage[k] += res.usage[k] || 0;
    const parsed = res.text ? parse(res.text) : null;
    if (!parsed || !Array.isArray(parsed.elements)) failedCalls++;
    const got = [];
    for (const x of (parsed && parsed.elements) || []) {
      // the path as written, or unwrapped if the model copied the whole `[path: …]` label
      let p = String((x && x.path) || '').trim();
      const label = /^\[path:\s*(.*)\]$/.exec(p);
      if (label) p = label[1].trim();
      const e = byKey.get(key(p));
      if (!e) { unknownPaths++; continue; }
      if (!proposals.has(e.xpath)) proposals.set(e.xpath, clip(x.aspect, 300));
      got.push(e.xpath);
    }
    if (trace) trace({ sc: criterion.sc, stage: 'screen', chunk: i, of: parts.length, elements: part.length, selected: got.length, error: res.error || (parsed ? null : 'unparseable'), answer: res.text ? res.text.slice(0, 8000) : null });
  })));
  return { proposals, pool: pool.length, selected: proposals.size, unknownPaths, calls: parts.length, failedCalls, usage };
}

module.exports = { sweep, SYSTEM };
