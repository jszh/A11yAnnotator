'use strict';
// Shared scaffolding for the C1 "interaction-driven capture & diff" adversarial corpus.
// Each case is a SELF-CONTAINED HTML file: one control + a tiny inline-JS handler that
// flips the VISIBLE state on activation. POSITIVE cases let the visible state change while
// the accessible NAME / aria-state / aria-valuenow goes STALE (or updates wrongly).
// NEGATIVE cases update name + aria-state correctly on the same interaction.
//
// The harness reads only the RESTING accessible name/state, so the defect is only observable
// AFTER activation -> this is exactly what the interaction-driven capture & diff must catch.
const fs = require('fs');
const path = require('path');

const STYLE = `
  body{font:16px/1.5 system-ui,sans-serif;margin:40px;max-width:620px;color:#1a1a1a}
  h1{font-size:20px}
  button,[role=button]{font:inherit;padding:9px 16px;cursor:pointer;border:1px solid #555;background:#f4f4f4;border-radius:6px}
  [role=switch],[role=checkbox]{display:inline-block}
  .panel{border:1px solid #bbb;padding:10px;margin-top:8px;background:#fafafa}
  .icon{display:inline-block;width:1em;height:1em;vertical-align:-2px}
  .slider{position:relative;width:240px;height:28px;border:1px solid #555;border-radius:14px;background:#eee;outline-offset:3px}
  .thumb{position:absolute;top:2px;width:22px;height:22px;border-radius:50%;background:#356;left:2px}
  .row{display:flex;align-items:center;gap:10px;margin:8px 0}
  output,.val{font-variant-numeric:tabular-nums;font-weight:600}
  .stepper button{min-width:40px}
  [aria-pressed=true]{background:#356;color:#fff}
  .on{background:#356;color:#fff}
`;

function htmlDoc(title, bodyInner, scriptInner) {
  return `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"><title>${title}</title>
<style>${STYLE}</style></head>
<body>
${bodyInner}
<script>
${scriptInner}
</script>
</body></html>
`;
}

function writeCases(aspectDir, comment, cases) {
  const dir = path.resolve(__dirname, '..', aspectDir);
  fs.mkdirSync(dir, { recursive: true });
  const labels = [];
  cases.forEach((c, i) => {
    const n = String(i + 1).padStart(2, '0');
    const file = `case-${n}.html`;
    const header = `<!-- 4.1.2 ${c.polarity.toUpperCase()} | ${aspectDir} | ${c.dimension} -->`;
    const doc = htmlDoc(
      `4.1.2 ${aspectDir} case ${i + 1}`,
      `${header}\n  <h1>${c.h1 || comment}</h1>\n${c.body}`,
      c.script
    );
    fs.writeFileSync(path.join(dir, file), doc);
    labels.push({
      file,
      expected: c.expected,
      polarity: c.polarity,
      aspect: aspectDir,
      sc: '4.1.2',
      dimension: c.dimension,
      targetSelector: c.targetSelector,
      activation: c.activation,
      runnerShould: c.runnerShould || 'decide',
      rationale: c.rationale,
      citation: c.citation
    });
  });
  fs.writeFileSync(path.join(dir, 'labels.json'), JSON.stringify(labels, null, 2) + '\n');
  return { dir, n: cases.length, pos: cases.filter(c => c.polarity === 'positive').length, neg: cases.filter(c => c.polarity === 'negative').length };
}

module.exports = { htmlDoc, writeCases };
