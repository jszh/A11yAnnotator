'use strict';
// Tier-0 #5: the name-role-state precompute must surface the decorative-marking conflict (a rendered-meaningful
// image removed from the a11y tree) so the 1.1.1 adequacy rubric judges the PIXELS, not the AT-unspoken name.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { precomputeSignals } = require('../../lib/llm-adjudicator.js');

test('aria-hidden image with a non-empty author name surfaces decorativeMarking (e88epe)', () => {
  const el = { xpath: '/html/body/img[1]', axName: 'W3C logo', removedFromA11yTree: true, hiddenMechanism: 'aria-hidden', ariaHiddenWithName: true, renderedVisible: true };
  const s = precomputeSignals(el, 'name-role-state');
  assert.equal(s.decorativeMarking.removedFromA11yTree, true);
  assert.equal(s.decorativeMarking.hiddenMechanism, 'aria-hidden');
  assert.equal(s.decorativeMarking.ariaHiddenWithName, true);
  assert.match(s.decorativeMarking.uncertainReason, /REPRODUCED/);
  assert.match(s.decorativeMarking.uncertainReason, /redundant|nearbyText/i); // S3: the redundancy framing must be present
  assert.equal('nearbyText' in s.decorativeMarking, true);
  // the misleading accessibleName is still surfaced (present), but now alongside the conflict
  assert.equal(s.accessibleName.present, true);
});

test('empty-alt decorative image surfaces decorativeMarking via empty-alt mechanism', () => {
  const el = { xpath: '/html/body/img[2]', axName: '', removedFromA11yTree: true, hiddenMechanism: 'empty-alt', renderedVisible: true };
  const s = precomputeSignals(el, 'name-role-state');
  assert.equal(s.decorativeMarking.hiddenMechanism, 'empty-alt');
});

test('a normally-named visible image gets NO decorativeMarking (no false conflict)', () => {
  const el = { xpath: '/html/body/img[3]', axName: 'Quarterly revenue chart', removedFromA11yTree: false, renderedVisible: true };
  const s = precomputeSignals(el, 'name-role-state');
  assert.equal(s.decorativeMarking, undefined);
  assert.equal(s.accessibleName.present, true);
});
