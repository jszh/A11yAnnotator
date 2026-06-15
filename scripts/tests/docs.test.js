// W6 — documentation/normative consistency (pure, no browser). Guards W1 + H6:
// the skills, AGENT-PLAN, and the contract must not contradict the helper or WCAG.
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const L = require('../lib/a11y-eval.js');

const ROOT = path.join(__dirname, '..', '..');
const read = p => fs.readFileSync(path.join(ROOT, p), 'utf8');

test('H6: color skill large-text threshold matches the lib (24px / 18.66px-bold)', () => {
  const md = read('skills/color-and-visual-text.md');
  assert.ok(/≥\s*24px/.test(md) && /≥\s*18\.66px/.test(md), 'skill must state the correct 24px / 18.66px-bold thresholds');
  // any mention of the old "14px bold" form must be in a negation/bug context, not as the rule
  const m = md.match(/[^.\n]*≥\s*14px\s*bold[^.\n]*/);
  if (m) assert.ok(/NOT|bug|wrong/i.test(m[0]), `"14px bold" may only appear marked as wrong; got: ${m[0]}`);
  // and the lib itself enforces it (the Domino's regression)
  assert.equal(L.isLargeText(16, 700), false);
  assert.equal(L.contrastThresholdFor(16, 700), 4.5);
});

test('C1: 4.1.3 is scoped to status messages — state changes route to 4.1.2', () => {
  const ann = read('skills/dynamic-announcement.md');
  assert.ok(/4\.1\.2/.test(ann) && /status message/i.test(ann), 'announcement skill must route state→4.1.2 and scope to status messages');
  const plan = read('eval-results/AGENT-PLAN.md');
  // the plan must NOT instruct: expanded/pressed/dialog with no announcement => 4.1.3 candidate
  assert.ok(!/(expandedChanged|pressedChanged)[^\n]*⇒\s*4\.1\.3 candidate/.test(plan), 'plan must not map a bare state change to a 4.1.3 candidate');
  assert.ok(/4\.1\.2/.test(plan), 'plan Step 6 must mention 4.1.2 routing');
});

test('C2: forms guidance requires demonstrated error / native validation can meet 3.3.1', () => {
  const forms = read('skills/forms-instructions-errors.md');
  assert.ok(/validationMessage/.test(forms), 'forms skill must capture validationMessage');
  assert.ok(/meet[s]? 3\.3\.1|generally meet/i.test(forms), 'forms skill must say native validation can meet 3.3.1');
});

test('H5: page-structure separates best-practice from 1.3.1 (missing landmark != failure)', () => {
  const ps = read('skills/page-structure.md');
  assert.ok(/best.practice/i.test(ps), 'page-structure must call out best-practice bucket');
  assert.ok(/NOT a 1\.3\.1|not a hard 1\.3\.1|NOT a 1\.3\.1 failure/i.test(ps), 'missing landmark / heading skip must be flagged as non-1.3.1');
});

test('R21-H4: AGENT-PLAN requires PARTIAL when a behavioral verdict rests on synthetic/non-isolated input', () => {
  const plan = read('eval-results/AGENT-PLAN.md');
  assert.ok(/synthetic/i.test(plan) && /PARTIAL/.test(plan), 'plan must calibrate behavioral confidence to probe trust');
  assert.ok(/activate\.synthetic|submitMethod|trusted-keys/.test(plan), 'plan must reference the concrete trust flags');
});
test('R21-H3: AGENT-PLAN target-size uses the tri-state (needs-judgment => PARTIAL; fail checks Equivalent/Essential)', () => {
  const plan = read('eval-results/AGENT-PLAN.md');
  assert.ok(/needs-judgment/.test(plan) && /equivalent/i.test(plan), 'plan must consume the target-size tri-state');
});

test('M4: skill Classify sections no longer contradict the corrected scope', () => {
  const ann = read('skills/dynamic-announcement.md');
  // the Classify REPRODUCED line must scope to status messages, not bare state changes
  assert.ok(/STATUS MESSAGES only|genuine \*\*status message\*\*/i.test(ann), 'announcement Classify must scope 4.1.3 to status messages');
  const grp = read('skills/grouping-and-reading-order.md');
  assert.ok(/REQUIRED to be programmatically determinable|conveys a relationship/i.test(grp), 'grouping must require the relationship be determinable before failing 1.3.1');
  const nrs = read('skills/name-role-state.md');
  assert.ok(/axStates|Validate STATE exposure/i.test(nrs), 'name-role-state must have a concrete state-validation procedure (M3)');
});

test('contract SC lists are self-consistent with the schema and SC_LEVEL', () => {
  const S = require('../lib/result-schema.js');
  for (const skill of S.SKILLS) {
    assert.ok(Array.isArray(S.SKILL_SCS[skill]) && S.SKILL_SCS[skill].length, `${skill} has allowed SCs`);
    for (const sc of S.SKILL_SCS[skill]) assert.ok(S.SC_LEVEL[sc], `SC ${sc} has a level`);
  }
  // C1 invariant pinned: dynamic-announcement is 4.1.3-only; 4.1.2 lives on name-role-state
  assert.deepEqual(S.SKILL_SCS['dynamic-announcement'], ['4.1.3']);
  assert.ok(S.SKILL_SCS['name-role-state'].includes('4.1.2'));
});

test('R2.8-H (R27-M2): RESULT-CONTRACT documents the R2.6/R2.7/R2.8 gate exactly', () => {
  const c = read('eval-results/RESULT-CONTRACT.md');
  // support-based binding + 2.1.2↔tabWalk
  assert.ok(/SUPPORT-based|positively demonstrated/i.test(c), 'contract must state support-based binding');
  assert.ok(/2\.1\.2.{0,40}tabWalk/i.test(c), 'contract must bind 2.1.2 to the tab-walk');
  // axe sentinel + reconciliation
  assert.ok(/axeRan\s*===\s*true/.test(c), 'contract must require axeRan === true (fail-closed)');
  assert.ok(/reconciliation|axeAdjudications/i.test(c), 'contract must document axe reconciliation');
  // freshness: runId + drivenAt >= collectedAt completion, required finite
  assert.ok(/runId/.test(c) && /drivenAt/.test(c) && /collectedAt/.test(c), 'contract must document run-id + freshness timestamps');
  assert.ok(/completion/i.test(c) && /finite/i.test(c), 'freshness must be completion-based and required finite');
  // strict 25% skip cap, no min-2
  assert.ok(/strict\s*floor\(25%\)|strict.{0,12}25%/i.test(c) && /no min-2|permits none/i.test(c), 'contract must state the strict 25% cap with no min-2');
  // sweep requires all artifacts
  assert.ok(/regression-sweep/.test(c) && /all three parseable artifacts/i.test(c), 'contract must document the sweep completeness requirement');
});
