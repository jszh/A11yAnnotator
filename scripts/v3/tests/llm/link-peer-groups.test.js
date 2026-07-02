// #8 fix — computeLinkPeerGroups(collect): the page-level xpath -> [peer xpaths] map threaded onto the tool
// session so resolve_destination can self-coalesce (see cdp-tools.js's resolveDestination and orchestrator.js's
// toolSession.linkPeerGroups wiring). Extracted from selectRubricSubjects's pre-existing linksByName logic so both
// consumers share one source of truth — this pins that extraction didn't change behavior.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const { computeLinkPeerGroups } = require('../../lib/llm-adjudicator.js');

const link = (over) => ({ axRole: 'link', inTree: true, removedFromA11yTree: false, ...over });

test('computeLinkPeerGroups: two links sharing an accessible name form a 2-member group, each mapped to BOTH xpaths', () => {
  const collect = { elements: [
    link({ xpath: '/a1', axName: 'Learn more' }),
    link({ xpath: '/a2', axName: 'Learn more' }),
  ] };
  const groups = computeLinkPeerGroups(collect);
  assert.deepEqual(groups.get('/a1'), ['/a1', '/a2']);
  assert.deepEqual(groups.get('/a2'), ['/a1', '/a2']);
});

test('computeLinkPeerGroups: a LONE link (unique name) has no entry — nothing to coalesce', () => {
  const collect = { elements: [link({ xpath: '/a1', axName: 'Unique Link' })] };
  const groups = computeLinkPeerGroups(collect);
  assert.equal(groups.has('/a1'), false);
  assert.equal(groups.size, 0);
});

test('computeLinkPeerGroups: name match is CASE-INSENSITIVE and falls back to text when axName is absent', () => {
  const collect = { elements: [
    link({ xpath: '/a1', axName: 'View Details' }),
    link({ xpath: '/a2', text: 'view details' }), // no axName — falls back to text; matches case-insensitively
  ] };
  const groups = computeLinkPeerGroups(collect);
  assert.deepEqual(groups.get('/a1').sort(), ['/a1', '/a2']);
});

test('computeLinkPeerGroups: a THREE-way group maps every member to all three', () => {
  const collect = { elements: [
    link({ xpath: '/a1', axName: 'View' }), link({ xpath: '/a2', axName: 'View' }), link({ xpath: '/a3', axName: 'View' }),
  ] };
  const groups = computeLinkPeerGroups(collect);
  assert.deepEqual(groups.get('/a2').sort(), ['/a1', '/a2', '/a3']);
});

test('computeLinkPeerGroups: a non-link element (button, div role=link WITHOUT the link role) is excluded even with a matching name', () => {
  const collect = { elements: [
    link({ xpath: '/a1', axName: 'Save' }),
    { xpath: '/btn1', axRole: 'button', axName: 'Save', inTree: true }, // same name, but NOT a link
  ] };
  const groups = computeLinkPeerGroups(collect);
  assert.equal(groups.has('/a1'), false, 'no real link peer exists, so /a1 forms no group');
});

test('computeLinkPeerGroups: an aria-hidden / a11y-tree-removed link is NOT a real peer (matches selectRubricSubjects\' existing exclusion)', () => {
  const collect = { elements: [
    link({ xpath: '/a1', axName: 'Read more' }),
    link({ xpath: '/a2', axName: 'Read more', removedFromA11yTree: true }),
  ] };
  const groups = computeLinkPeerGroups(collect);
  assert.equal(groups.has('/a1'), false, 'the removed link is excluded from the index, so /a1 has no real peer');
});

test('computeLinkPeerGroups: an empty/missing element list returns an empty map, never throws', () => {
  assert.equal(computeLinkPeerGroups({ elements: [] }).size, 0);
  assert.equal(computeLinkPeerGroups({}).size, 0);
  assert.equal(computeLinkPeerGroups(null).size, 0);
});
