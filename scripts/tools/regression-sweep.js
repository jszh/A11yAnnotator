#!/usr/bin/env node
// Regression sweep — assert harness invariants across a directory of generated
// drive.json / collect.json / results.json (e.g. a fresh eval-results/<slug>/ set).
// READ-ONLY. Does not modify any input.
//
//   node scripts/tools/regression-sweep.js <dir-of-slug-folders>
//
// Checks the cross-page invariants the unit/integration tests can't cover per-page
// (each maps to an issue in eval-results/HARNESS-ISSUES.md / the audit). Exits
// non-zero if any invariant is violated.
'use strict';
const fs = require('fs');
const path = require('path');
const A = require('../lib/a11y-eval.js');
// W2 builder is optional — the sweep still runs the cheap invariants without it.
let builder = null;
try { builder = require('../lib/result-builder.js'); } catch (e) { /* W2 not present yet */ }

const dir = process.argv[2];
if (!dir) { console.error('usage: regression-sweep.js <dir>'); process.exit(2); }
const slugs = fs.readdirSync(dir).filter(d => fs.existsSync(path.join(dir, d, 'drive.json')));
const load = (s, f) => { try { return JSON.parse(fs.readFileSync(path.join(dir, s, f), 'utf8')); } catch (e) { return null; } };

const fails = [];
let checked = 0;
for (const s of slugs) {
  const D = load(s, 'drive.json'), C = load(s, 'collect.json'), R = load(s, 'results.json');
  checked++;
  const cByXp = {}; for (const e of (C && C.elements) || []) cByXp[e.xpath] = e;

  // T9 / H3: no element reports a noise/root phrase as an announcement (activation OR walk)
  for (const e of (D && D.elements) || []) {
    if (e.activate && e.activate.vsrAnnouncement && A.isVsrNoisePhrase(e.activate.vsrAnnouncement))
      fails.push(`[T9] ${s} el${e.idx}: noise phrase as activation announcement: ${JSON.stringify(e.activate.vsrAnnouncement)}`);
    if (e.srWalk && e.srWalk.targetSpeech && A.isVsrNoisePhrase(e.srWalk.targetSpeech))
      fails.push(`[H3] ${s} el${e.idx}: srWalk.targetSpeech is a noise/root phrase: ${JSON.stringify(e.srWalk.targetSpeech)}`);
  }

  // T15: no SUBMITTED form had 0 visible fields (skipped ones are fine)
  for (const f of (D && D.forms) || []) {
    if (!f.skipped && f.fields === 0) fails.push(`[T15] ${s}: a 0-field form was submitted (should be skipped)`);
  }

  // T1/T8: focus `present` must be a strict tri-state (value-domain, not mere existence)
  for (const e of (D && D.elements) || []) {
    if (e.focusIndicator && !([true, false, null].includes(e.focusIndicator.present)))
      fails.push(`[T1/T8] ${s} el${e.idx}: focusIndicator.present not tri-state: ${JSON.stringify(e.focusIndicator.present)}`);
  }

  // T4: no element with 14<=fontPx<18.66 AND bold keeps the lenient 3.0 threshold
  for (const e of (C && C.elements) || []) {
    const fp = e.fontPx, fw = parseInt(e.fontWeight, 10) || 0;
    if (fp >= 14 && fp < A.LARGE_BOLD_PX && fw >= 700 && e.contrastThreshold === 3.0)
      fails.push(`[T4] ${s} ${(e.axName || '').slice(0, 16)}: ${fp}px bold still threshold 3.0`);
  }

  // T3: a target the helper PASSED must not also be a 2.5.8 REPRODUCED finding
  if (R) for (const el of R.elements || []) {
    const cv = cByXp[el.xpath]; const rp = el.skills && el.skills['reflow-and-pointer-affordances'];
    if (cv && cv.targetSize && cv.targetSize.passes === true && rp && rp.verdict === 'REPRODUCED' && /2\.5\.8/.test(rp.sc || ''))
      fails.push(`[T3] ${s} ${(el.xpath || '').slice(-24)}: targetSize.passes=true but 2.5.8 REPRODUCED`);
  }

  // C5: aggregates must agree with element records.
  if (R) {
    // schema/aggregate validator (W2) when available — bind behavioral verdicts to the
    // driver evidence too (R2.4-B) when a fresh drive.json is present.
    if (builder) {
      const opts = (D && builder.driverEvidenceFrom) ? { driverEvidence: builder.driverEvidenceFrom(D) } : {};
      // R2.7-B/R2.8-C: the axe skip-floor + reconciliation must run in the read-only re-gate too.
      if (C) {
        const axe = Array.isArray(C.axe) ? C.axe : [];
        const t2sc = t => { const m = /^wcag(\d)(\d)(\d+)$/.exec(t); return m ? `${m[1]}.${m[2]}.${m[3]}` : null; };
        const scs = [...new Set(axe.flatMap(v => (v && Array.isArray(v.wcag) ? v.wcag : []).map(t2sc).filter(Boolean)))];
        opts.collectorAxe = { ran: C.axeRan === true, wcagViolations: axe.filter(v => v && Array.isArray(v.wcag) && v.wcag.length > 0).length, scs };
      }
      const v = builder.validateResults(R, opts);
      if (!v.ok) for (const m of v.errors) fails.push(`[C5] ${s}: ${m}`);
    }
    // explicit anyIssue cross-check (no builder needed)
    let withIssue = 0;
    for (const el of R.elements || []) {
      const verds = Object.values(el.skills || {}).map(x => x.verdict);
      const should = verds.some(x => x === 'REPRODUCED' || x === 'PARTIAL');
      if (should) withIssue++;
      if (!!el.anyIssue !== should) fails.push(`[C5] ${s} ${(el.xpath || '').slice(-20)}: anyIssue=${el.anyIssue} but should be ${should}`);
    }
    if (R.summary && typeof R.summary.elementsWithIssue === 'number' && R.summary.elementsWithIssue !== withIssue)
      fails.push(`[C5] ${s}: summary.elementsWithIssue=${R.summary.elementsWithIssue} != counted ${withIssue}`);
  }

  // T6: never a definite DYNAMIC verdict on a driver-notFound element
  if (R && D) {
    const nf = new Set((D.elements || []).filter(e => e.notFound).map(e => e.xpath));
    for (const el of R.elements || []) {
      if (!nf.has(el.xpath)) continue;
      for (const k of ['keyboard-operability', 'focus-management', 'focus-visibility', 'dynamic-announcement']) {
        const v = el.skills && el.skills[k] && el.skills[k].verdict;
        if (v === 'REPRODUCED' || v === 'NOT REPRODUCED')
          fails.push(`[T6] ${s} ${(el.xpath || '').slice(-20)}: definite ${k}=${v} on notFound element`);
      }
    }
  }
}

if (fails.length) {
  console.error(`REGRESSION SWEEP FAILED (${fails.length} violations over ${checked} pages):`);
  for (const f of fails.slice(0, 80)) console.error('  ' + f);
  if (fails.length > 80) console.error(`  … and ${fails.length - 80} more`);
  process.exit(1);
}
console.log(`regression sweep OK — ${checked} pages, all invariants hold (T1/T8 value-domain, T3 geometry, T4, T6, T9/H3, T15, C5 aggregates).`);
