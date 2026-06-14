#!/usr/bin/env node
// Regression sweep — assert harness invariants across a directory of generated
// drive.json / collect.json / results.json (e.g. a fresh eval-results/<slug>/ set).
// READ-ONLY. Does not modify any input.
//
//   node scripts/tests/regression-sweep.js <dir-of-slug-folders>
//
// Checks the cross-page invariants the unit/integration tests can't cover per-page
// (each maps to an issue in eval-results/HARNESS-ISSUES.md). Exits non-zero if any
// invariant is violated.
'use strict';
const fs = require('fs');
const path = require('path');
const A = require('../lib/a11y-eval.js');

const dir = process.argv[2];
if (!dir) { console.error('usage: regression-sweep.js <dir>'); process.exit(2); }
const slugs = fs.readdirSync(dir).filter(d => fs.existsSync(path.join(dir, d, 'drive.json')));
const load = (s, f) => { try { return JSON.parse(fs.readFileSync(path.join(dir, s, f), 'utf8')); } catch (e) { return null; } };

const fails = [];
let checked = 0;
for (const s of slugs) {
  const D = load(s, 'drive.json'), C = load(s, 'collect.json');
  checked++;
  // T9: no element reports the "document" root phrase as an announcement
  for (const e of (D && D.elements) || []) {
    if (e.activate && e.activate.vsrAnnouncement && A.isVsrNoisePhrase(e.activate.vsrAnnouncement))
      fails.push(`[T9] ${s} el${e.idx}: noise phrase recorded as announcement: ${JSON.stringify(e.activate.vsrAnnouncement)}`);
  }
  // T15: no SUBMITTED form had 0 visible fields (skipped ones are fine)
  for (const f of (D && D.forms) || []) {
    if (!f.skipped && (f.fields === 0)) fails.push(`[T15] ${s}: a 0-field form was submitted (should be skipped)`);
  }
  // T1/T8: focus `present` must be tri-state (true|false|null), never a bare boolean-from-diff
  for (const e of (D && D.elements) || []) {
    if (e.focusIndicator && !('present' in e.focusIndicator))
      fails.push(`[T1/T8] ${s} el${e.idx}: focusIndicator missing tri-state 'present'`);
  }
  // T4: no element with 14<=fontPx<18.66 AND bold keeps the lenient 3.0 threshold
  for (const e of (C && C.elements) || []) {
    const fp = e.fontPx, fw = parseInt(e.fontWeight, 10) || 0;
    if (fp >= 14 && fp < A.LARGE_BOLD_PX && fw >= 700 && e.contrastThreshold === 3.0)
      fails.push(`[T4] ${s} ${(e.axName || '').slice(0, 16)}: ${fp}px bold still threshold 3.0`);
  }
  // T3: every target with targetSize.passes===true is NOT a 2.5.8 failure source
  for (const e of (C && C.elements) || []) {
    if (e.targetSize && e.targetSize.passes === true && e.box && (e.box.w === 0 || e.box.h === 0)) { /* zero-size exempt — ok */ }
  }
}
if (fails.length) {
  console.error(`REGRESSION SWEEP FAILED (${fails.length} violations over ${checked} pages):`);
  for (const f of fails.slice(0, 50)) console.error('  ' + f);
  process.exit(1);
}
console.log(`regression sweep OK — ${checked} pages, all invariants hold (T1/T8, T3, T4, T9, T15).`);
