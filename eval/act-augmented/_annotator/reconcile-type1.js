#!/usr/bin/env node
/**
 * reconcile-type1.js — after the type-1 "fix descriptions" pass, flip each fixed
 * case from not-aligned -> stale-desc in its drift-report (a case counts as fixed
 * iff a description-override now exists for it). Cases with no override were judged
 * to actually belong to a different aspect (type-3) and stay not-aligned.
 */
const fs = require('fs');
const path = require('path');
const DIR = __dirname;

// The 10 type-1 candidates we asked agents to fix or flag.
const CANDIDATES = [
  ['1.4.3', 'decorative-vs-meaningful-text-exemption/case-05'],
  ['1.4.3', 'effective-background-across-cascade-and-overlays/case-04'],
  ['1.4.3', 'faux-disabled-vs-genuinely-inactive-ui/case-05'],
  ['1.4.3', 'logotype-brand-exemption-and-erosion/case-03'],
  ['1.4.3', 'logotype-brand-exemption-and-erosion/case-05'],
  ['2.4.3', 'nested-and-static-focusable-illogical-stops/case-03'],
  ['2.4.6', 'descriptiveness-depends-on-layout-or-state/case-04'],
  ['3.3.1', 'inline-error-adjacent-to-wrong-field/case-03'],
  ['3.3.1', 'non-text-only-error-indicator/case-03'],
  ['3.3.1', 'silent-redisplay-after-real-error/case-01'],
];

const readJSON = (p) => { try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return {}; } };

const fixed = [], stillType3 = [];
const repCache = {};
for (const [sc, key] of CANDIDATES) {
  const desc = readJSON(path.join(DIR, 'description-overrides', `${sc}.json`));
  const repPath = path.join(DIR, 'drift-report', `${sc}.json`);
  const rep = repCache[sc] || (repCache[sc] = readJSON(repPath));
  if (desc[key]) {
    // fixed: rewritten to match the page -> reclassify as stale-desc
    if (rep[key]) {
      rep[key].status = 'stale-desc';
      rep[key].reason = '(reclassified type-1) page demonstrates the aspect via a different instance; description rewritten to match the page. ' + (rep[key].reason || '');
    }
    fixed.push(`${sc}/${key}`);
  } else {
    stillType3.push(`${sc}/${key}`);
  }
}
for (const sc of Object.keys(repCache)) {
  fs.writeFileSync(path.join(DIR, 'drift-report', `${sc}.json`), JSON.stringify(repCache[sc], null, 2));
}

console.log(`Reconciled type-1 fixes:`);
console.log(`  fixed (now stale-desc): ${fixed.length}`);
fixed.forEach(k => console.log(`    + ${k}`));
console.log(`  still type-3 (left not-aligned): ${stillType3.length}`);
stillType3.forEach(k => console.log(`    - ${k}`));
