'use strict';
// Item 12 (composite-role name-role-value + states surfacing) + Item 13 (roleOverridesNative / placeholder scrutiny).
const { test } = require('node:test');
const assert = require('node:assert/strict');
const oracle = require('../../lib/applicability-oracle.js');
const cov = require('../../lib/coverage-registry.js');
const { precomputeSignals } = require('../../lib/llm-adjudicator.js');

test('12: a composite container role (tablist) enumerates name-role-value; the coverage registry agrees (Rule 16)', () => {
  const el = { xpath: '/tabs', roleAttr: 'tablist', sampledRole: 'tablist', axRole: 'tablist' };
  assert.ok(oracle.familiesFor(el).includes('name-role-value'), 'tablist owes name-role-value');
  assert.ok(cov.expectedFamilies(el).has('name-role-value'), 'the independent registry requires it too');
});

test('12: bare group/region do NOT enumerate name-role-value (flood-excluded)', () => {
  assert.ok(!oracle.familiesFor({ xpath: '/g', roleAttr: 'group', sampledRole: 'group', axRole: 'group' }).includes('name-role-value'));
  assert.ok(!oracle.familiesFor({ xpath: '/r', roleAttr: 'region', sampledRole: 'region', axRole: 'region' }).includes('name-role-value'));
});

test('12: name-role-state precompute surfaces the states/axStates bundle', () => {
  const s = precomputeSignals({ xpath: '/tab', axRole: 'tab', axStates: { selected: true, expanded: false, level: undefined } }, 'name-role-state');
  assert.equal(s.states.selected, true);
  assert.equal(s.states.expanded, false);
  assert.equal('level' in s.states, false, 'undefined states are dropped');
});

test('13: roleOverridesNative surfaces a scrutiny hint in name-role-state', () => {
  const s = precomputeSignals({ xpath: '/b', tag: 'button', roleAttr: 'link', roleOverridesNative: true }, 'name-role-state');
  assert.equal(s.roleScrutiny.overridesNativeRole, true);
  assert.match(s.roleScrutiny.uncertainReason, /SCRUTINY, not a presumed barrier/);
});

test('13: placeholder-as-sole-label is flagged in forms-instructions-errors; not when a real name exists', () => {
  const sole = precomputeSignals({ xpath: '/f1', placeholder: 'Email', axName: '' }, 'forms-instructions-errors');
  assert.equal(sole.placeholder.isOnlyLabelSource, true);
  assert.match(sole.placeholder.uncertainReason, /disappears on input/);
  const withLabel = precomputeSignals({ xpath: '/f2', placeholder: 'e.g. you@example.com', axName: 'Email address' }, 'forms-instructions-errors');
  assert.equal(withLabel.placeholder.isOnlyLabelSource, false);
  assert.equal(withLabel.placeholder.uncertainReason, undefined, 'a placeholder alongside a real label is not flagged');
});
