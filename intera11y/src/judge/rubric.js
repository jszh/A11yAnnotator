'use strict';
// A criterion's test rules, from one source (`rubrics/<sc>.js`), rendered in GenA11y's prompt format:
//   'rules' — the rule list alone (the screening sweep)
//   'v1'    — each rule followed by the tools that settle it
//   'v2'    — v1, plus InterA11y's rubric for each rule that names a tool
const path = require('path');

const RUBRIC_DIR = path.join(__dirname, '..', '..', 'rubrics');
const load = (sc) => require(path.join(RUBRIC_DIR, `${sc}.js`));

// opts.tools = false: the judge has no tools, so none are named (the rubric paragraphs stay, for v2)
function render(sc, variant, { tools = true } = {}) {
  const r = load(sc);
  const lines = [`Analyze compliance with WCAG SC ${r.sc} (${r.title}).`, 'Test rules:'];
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
