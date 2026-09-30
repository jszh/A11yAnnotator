'use strict';
// The judge's prompt. The system prompt states the task and the evidence standard; it contains no instruction
// to favour either outcome. The criterion's test rules (rubrics/<sc>.js, rendered as variant v1 or v2 — see
// judge/rubric.js) supply the test conditions.
const { render } = require('./rubric.js');
const { CONFIG } = require('../core/config.js');


const SYSTEM = `You are an accessibility auditor testing one web page against one WCAG 2.2 success criterion.

You receive the criterion's test rules and a batch of candidate elements from the page. For each candidate, decide whether it meets the criterion's test condition.

Evidence. Each candidate comes with (a) its markup, (b) the browser's computed accessibility facts, and (c) observations made by driving the live page — keyboard, pointer, activation, form submission, viewport changes — sometimes with screenshots. Observations are measurements, not conclusions. You may call the tools you are given to gather more evidence from the live page; every tool call runs on a fresh copy of the page. Gather evidence whenever the supplied evidence does not settle a candidate.

Verdicts, one per candidate:
- FAIL — the evidence shows the test condition is not met.
- PASS — the evidence shows the test condition is met.
- NOT_APPLICABLE — the evidence shows the criterion does not apply to this candidate (say which applicability condition it lacks).
- UNDETERMINED — after gathering the evidence you can, it supports none of the above.

Evidence standard. Every verdict must name the observation it rests on. FAIL and PASS carry the same burden: an absent observation is evidence of nothing, so it cannot support either. Judge each candidate on its own evidence, not on how many others fail or pass.

If the page has a failure of this criterion that is not one of the listed candidates, report it under pageFindings with the XPath of the element it concerns (from the evidence), or null if it concerns the page as a whole.

Answer with one JSON object and nothing else:
{"candidates":[{"path":"<the candidate's path, verbatim>","verdict":"FAIL|PASS|NOT_APPLICABLE|UNDETERMINED","evidence":"<the observation(s) the verdict rests on>","reason":"<the test condition, and how the evidence meets or fails it>"}],
 "pageFindings":[{"path":"<xpath or null>","evidence":"…","reason":"…"}]}`;

function compact(v) {
  return JSON.stringify(v, (k, x) => (x === null || x === undefined || x === false || (Array.isArray(x) && !x.length) ? undefined : x));
}

function axLine(ax) {
  if (!ax) return 'not in the accessibility tree';
  const states = Object.entries(ax).filter(([k, v]) => !['role', 'name', 'nameFrom', 'description', 'ignored'].includes(k) && v !== undefined && v !== false && v !== '')
    .map(([k, v]) => (v === true ? k : `${k}=${v}`));
  return `role=${ax.role || '—'} name=${JSON.stringify(ax.name || '')}${ax.nameFrom ? ` (from ${ax.nameFrom})` : ''}${ax.description ? ` description=${JSON.stringify(ax.description)}` : ''}${ax.ignored ? ' IGNORED' : ''}${states.length ? ' ' + states.join(' ') : ''}`;
}

// candidates: [{ path, element (model record or null), facts, images:[{label,data,mime}] }]
function buildBatchMessage(criterion, page, candidates) {
  const blocks = [];
  let imageNo = 0;
  const text = [];
  text.push(`# Success criterion ${criterion.sc} ${criterion.title}\n`);
  text.push(render(criterion.sc, CONFIG.judge.rubric, { tools: CONFIG.judge.tools }));
  text.push(`\n# Page\nURL: ${page.doc.url}\nTitle: ${JSON.stringify(page.doc.title || '')}\nViewport: 1280×900 CSS px. Document: ${page.doc.width}×${page.doc.height}.`);
  const markupOnly = candidates.some((c) => c.markupOnly);
  if (page.doc.text && !markupOnly) text.push(`Visible text of the page${page.doc.textLength > page.doc.text.length ? ` (first ${page.doc.text.length} of ${page.doc.textLength} characters)` : ''}:\n"""\n${page.doc.text}\n"""`);
  if (criterion.pageContext && !markupOnly) text.push(criterion.pageContext);
  text.push(`\n# Candidates (${candidates.length})`);
  blocks.push({ type: 'text', text: text.join('\n') });
  candidates.forEach((c, i) => {
    const lines = [`\n## Candidate ${i + 1} [path: ${c.path}]`];
    if (c.element) {
      lines.push(`Markup: ${c.element.openTag}${c.element.text ? ` text=${JSON.stringify(c.element.text)}` : ''}`);
      // the ablation's markup-only evidence: no computed facts, observations or images
      if (!c.markupOnly) lines.push(`Accessibility: ${axLine(c.element.ax)}`);
    }
    if (c.facts) lines.push(`Observed: ${compact(c.facts)}`);
    const imgs = (c.images || []).filter((x) => x && x.data);
    if (imgs.length) lines.push(`Images: ${imgs.map((x) => `#${++imageNo} ${x.label}`).join('; ')}`);
    blocks.push({ type: 'text', text: lines.join('\n') });
    for (const x of imgs) blocks.push({ type: 'image', data: x.data, mime: x.mime || 'image/png' });
  });
  return blocks;
}

// The answer's JSON schema, given to the API as structured output (the SYSTEM prompt states the same format)
const ANSWER_SCHEMA = {
  type: 'object',
  properties: {
    candidates: { type: 'array', items: { type: 'object', properties: {
      path: { type: 'string' }, verdict: { type: 'string', enum: ['FAIL', 'PASS', 'NOT_APPLICABLE', 'UNDETERMINED'] },
      evidence: { type: 'string' }, reason: { type: 'string' },
    }, required: ['path', 'verdict', 'evidence', 'reason'], additionalProperties: false } },
    pageFindings: { type: 'array', items: { type: 'object', properties: {
      path: { type: ['string', 'null'] }, evidence: { type: 'string' }, reason: { type: 'string' },
    }, required: ['path', 'evidence', 'reason'], additionalProperties: false } },
  },
  required: ['candidates', 'pageFindings'],
  additionalProperties: false,
};

module.exports = { SYSTEM, ANSWER_SCHEMA, buildBatchMessage };
