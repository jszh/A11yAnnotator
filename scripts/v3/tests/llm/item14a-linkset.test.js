'use strict';
// Item 14a + 2.4.4 SPLIT (fd3a94): the RELATIONAL same-named-link question is owned by link-name-equivalence-v0,
// NOT the single-link link-purpose-v0. This rubric fires ONLY on a link with a same-named peer (the iframe-rubric
// gate pattern) and carries the OTHER same-named links + their raw hrefs; link-purpose-v0 no longer sees the set.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { selectRubricSubjects, precomputeSignals } = require('../../lib/llm-adjudicator.js');

const RUBRICS = {
  'link-purpose-v0': { id: 'link-purpose-v0', sc: '2.4.4', skill: 'name-role-state', visionEvidence: ['element-crop'] },
  'link-name-equivalence-v0': { id: 'link-name-equivalence-v0', sc: '2.4.4', skill: 'name-role-state', visionEvidence: ['element-crop', 'surrounding-region'] },
};
const COLLECT = { elements: [
  { xpath: '/a1', sampledRole: 'link', axRole: 'link', axName: 'Contact Us', href: '/contact' },
  { xpath: '/a2', sampledRole: 'link', axRole: 'link', axName: 'Contact Us', href: '/support' },
  { xpath: '/a3', sampledRole: 'link', axRole: 'link', axName: 'Home', href: '/' },
] };

test('same-named links are handed to the link-name-equivalence subject with their distinct raw hrefs', () => {
  const ledger = [{ xpath: '/a1', sc: '2.4.4', claimFamily: 'link-purpose', autoPartial: true }];
  const subs = selectRubricSubjects(COLLECT, ledger, RUBRICS).filter((s) => s.xpath === '/a1');
  const eq = subs.find((s) => s.rubricId === 'link-name-equivalence-v0');
  assert.ok(eq, 'the relational rubric fires on a same-named link');
  const sig = precomputeSignals(eq.element, 'name-role-state');
  assert.equal(sig.sameNameLinks.count, 1, 'a2 shares the "Contact Us" name');
  assert.equal(sig.sameNameLinks.peers[0].href, '/support');
  // distinctRawHrefs spans the WHOLE same-named set incl. self: /contact + /support ⇒ 2 (they diverge → a 2.4.4 smell).
  assert.equal(sig.sameNameLinks.distinctRawHrefs, 2);
});

test('the SPLIT: link-purpose-v0 no longer carries the relational sameNameLinks signal', () => {
  const ledger = [{ xpath: '/a1', sc: '2.4.4', claimFamily: 'link-purpose', autoPartial: true }];
  const lp = selectRubricSubjects(COLLECT, ledger, RUBRICS).find((s) => s.xpath === '/a1' && s.rubricId === 'link-purpose-v0');
  assert.ok(lp, 'link-purpose-v0 still judges the single-link purpose');
  const sig = precomputeSignals(lp.element, 'name-role-state');
  assert.equal(sig.sameNameLinks, undefined, 'the relational set is NOT on the single-link rubric (clean split)');
});

test('a uniquely-named link gets NO link-name-equivalence subject (gated out), but still gets link-purpose', () => {
  const collect = { elements: [{ xpath: '/only', sampledRole: 'link', axRole: 'link', axName: 'Pricing', href: '/pricing' }] };
  const ledger = [{ xpath: '/only', sc: '2.4.4', claimFamily: 'link-purpose', autoPartial: true }];
  const subs = selectRubricSubjects(collect, ledger, RUBRICS).filter((s) => s.xpath === '/only');
  assert.ok(subs.find((s) => s.rubricId === 'link-purpose-v0'), 'single-link purpose still fires');
  assert.equal(subs.find((s) => s.rubricId === 'link-name-equivalence-v0'), undefined, 'relational rubric skipped (no peer)');
});
