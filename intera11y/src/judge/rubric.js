'use strict';
// A criterion's test rules, from one source (`rubrics/<sc>.js`), rendered in GenA11y's prompt format:
//   'rules' — the rule list alone (the screening sweep)
//   'v1'    — each rule followed by the tools that settle it
//   'v2'    — v1, plus InterA11y's rubric for each rule that names a tool
const path = require('path');

const RUBRIC_DIR = path.join(__dirname, '..', '..', 'rubrics');
const load = (sc) => require(path.join(RUBRIC_DIR, `${sc}.js`));

//   'gena11y' — GenA11y's own rule text, unedited (rubrics/gena11y-original.js; the ablation ladder's steps 1–2)
// opts.tools = false: the judge has no tools, so none are named (the rubric paragraphs stay, for v2)
function render(sc, variant, { tools = true } = {}) {
  if (variant === 'gena11y') {
    const g = require(path.join(RUBRIC_DIR, 'gena11y-original.js'))[sc];
    if (!g) throw new Error(`no GenA11y rules for SC ${sc} (GenA11y covers 1.1.1, 1.4.1, 1.4.3, 2.4.4, 3.3.1, 4.1.2)`);
    return [g.heading, ...(g.preamble ? [g.preamble] : []), 'Test rules:', ...g.rules.map((t, i) => `${i + 1}. ${t}`)].join('\n');
  }
  const r = load(sc);
  // GenA11y's text between the heading and the test rules (its pass condition, where it states one) is kept
  const lines = [`Analyze compliance with WCAG SC ${r.sc} (${r.title}).`, ...(r.preamble ? [r.preamble] : []), 'Test rules:'];
  r.rules.forEach((rule, i) => {
    lines.push(`${i + 1}. ${rule.text}`);
    if (variant === 'rules' || !rule.tools || !rule.tools.length) return;
    if (tools) lines.push(`   Tools: ${rule.tools.join(', ')}`);
    if (variant === 'v2' && rule.rubric) lines.push(`   Rubric: ${rule.rubric}`);
  });
  return lines.join('\n');
}

// the tools a criterion's judge is given: every tool its rules name
const toolsOf = (sc) => [...new Set(load(sc).rules.flatMap((r) => r.tools || []))];

module.exports = { render, toolsOf, load };
