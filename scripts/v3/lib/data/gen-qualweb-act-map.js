'use strict';
// Regenerate scripts/v3/lib/data/qualweb-act-map.json from @qualweb/act-rules OWN metadata (tool metadata
// ONLY — never corpus ground truth). Each QW-ACT rule carries its ACT-rule id (`.mapping`) and the WCAG
// success-criteria it evidences (`.metadata.success-criteria[].name`). We do NOT read any testcase
// ruleId/expected — the map is the tool's self-declared coverage, exactly like eval/checker-comparison's
// act-rule-maps.json builds it. Run: node scripts/v3/lib/data/gen-qualweb-act-map.js
const fs = require('fs');
const path = require('path');

// @qualweb/core is a dev/eval dependency; the rules JSON lives under the eval install. Try both roots so
// this regenerator works whether the package is hoisted to the repo root or only under eval/.
function loadRulesJson() {
  const candidates = [
    path.join(__dirname, '..', '..', '..', '..', 'node_modules', '@qualweb', 'act-rules', 'dist', 'lib', 'rules.json'),
    path.join(__dirname, '..', '..', '..', '..', 'eval', 'checker-comparison', 'node_modules', '@qualweb', 'act-rules', 'dist', 'lib', 'rules.json'),
  ];
  for (const p of candidates) if (fs.existsSync(p)) return { path: p, json: JSON.parse(fs.readFileSync(p, 'utf8')) };
  throw new Error('could not locate @qualweb/act-rules rules.json (install @qualweb/core under repo root or eval/checker-comparison)');
}

function build() {
  const { path: src, json: qw } = loadRulesJson();
  const out = {
    _provenance: {
      generatedAt: new Date().toISOString(),
      source: '@qualweb/act-rules dist/lib/rules.json (.code + .mapping + metadata.success-criteria)',
      srcPath: src.replace(/^.*\/node_modules\//, 'node_modules/'),
      note: 'tool metadata ONLY — never corpus ground truth. Regenerate: node scripts/v3/lib/data/gen-qualweb-act-map.js',
    },
    rules: {},
  };
  for (const k of Object.keys(qw)) {
    const r = qw[k];
    if (!r.code || !r.mapping) continue;
    const sc = [...new Set(((r.metadata && r.metadata['success-criteria']) || []).map((s) => s && s.name).filter(Boolean))];
    out.rules[r.code] = { actId: r.mapping, sc, name: r.name };
  }
  return out;
}

if (require.main === module) {
  const out = build();
  const dst = path.join(__dirname, 'qualweb-act-map.json');
  fs.writeFileSync(dst, JSON.stringify(out, null, 2));
  console.log(`wrote ${dst} (${Object.keys(out.rules).length} QW-ACT codes)`);
}

module.exports = { build };
