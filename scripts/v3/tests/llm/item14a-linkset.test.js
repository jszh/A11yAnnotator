'use strict';
// Item 14a (2.4.4 in-context): a link-purpose subject carries the OTHER same-named links + their destinations.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { selectRubricSubjects, precomputeSignals } = require('../../lib/llm-adjudicator.js');

const RUBRICS = { 'link-purpose-v0': { id: 'link-purpose-v0', sc: '2.4.4', skill: 'name-role-state', visionEvidence: ['element-crop'] } };

test('same-named links are handed to the link-purpose subject with their distinct destinations', () => {
  const collect = { elements: [
    { xpath: '/a1', sampledRole: 'link', axRole: 'link', axName: 'Contact Us', href: '/contact' },
    { xpath: '/a2', sampledRole: 'link', axRole: 'link', axName: 'Contact Us', href: '/support' },
    { xpath: '/a3', sampledRole: 'link', axRole: 'link', axName: 'Home', href: '/' },
  ] };
  const ledger = [{ xpath: '/a1', sc: '2.4.4', claimFamily: 'link-purpose', autoPartial: true }];
  const sub = selectRubricSubjects(collect, ledger, RUBRICS).find((s) => s.xpath === '/a1');
  const sig = precomputeSignals(sub.element, 'name-role-state');
  assert.equal(sig.sameNameLinks.count, 1, 'a2 shares the "Contact Us" name');
  assert.equal(sig.sameNameLinks.peers[0].href, '/support');
  // distinctRawHrefs spans the WHOLE same-named set incl. self: /contact + /support ⇒ 2 (they diverge → a 2.4.4 smell).
  assert.equal(sig.sameNameLinks.distinctRawHrefs, 2);
  assert.equal(sig.sameNameLinks.distinctDestinations, undefined, 'the misleading raw-href "destinations" field is gone');
});

test('a uniquely-named link gets NO sameNameLinks signal', () => {
  const collect = { elements: [{ xpath: '/only', sampledRole: 'link', axRole: 'link', axName: 'Pricing', href: '/pricing' }] };
  const ledger = [{ xpath: '/only', sc: '2.4.4', claimFamily: 'link-purpose', autoPartial: true }];
  const sub = selectRubricSubjects(collect, ledger, RUBRICS).find((s) => s.xpath === '/only');
  const sig = precomputeSignals(sub.element, 'name-role-state');
  assert.equal(sig.sameNameLinks, undefined);
});
