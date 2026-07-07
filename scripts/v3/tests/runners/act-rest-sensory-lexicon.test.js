// ACT-REST Round 3 (1.3.3, ACT 9bd38c) — the REQUIREMENT-SOURCED sensory-word lexicon. Tests the APPLICABILITY
// gate ONLY (the lexicon never produces a verdict — the LLM rubric does). Spec-cited: the vocabulary is drawn from
// WCAG 1.3.3 Understanding (shape/size/location/orientation/sound), NOT the fixtures.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const L = require('../../lib/sensory-lexicon.js');
const oracle = require('../../lib/applicability-oracle.js');

test('1.3.3 lexicon flags requirement-sourced visual-reference words across all 5 categories', () => {
  assert.deepEqual(L.sensoryWordsIn('Find the menu on the right, to navigate'), ['right']);       // location
  assert.deepEqual(L.sensoryWordsIn('the triangle menu'), ['triangle']);                          // shape
  assert.equal(L.hasSensoryWord('Click the round button'), true);                                 // shape
  assert.equal(L.hasSensoryWord('The wide image is awesome'), true);                              // size
  assert.equal(L.hasSensoryWord('Search this pieCe of tiLted text'), true);                       // orientation
  assert.equal(L.hasSensoryWord('press when you hear a beep'), true);                             // sound
  assert.equal(L.hasSensoryWord('the button below this paragraph'), true);                        // location
});

test('1.3.3 lexicon EXCLUDES colour (that is 1.4.1 use-of-color, not 1.3.3)', () => {
  for (const c of ['green', 'red', 'blue', 'yellow', 'orange', 'purple', 'pink', 'colour', 'color']) {
    assert.equal(L.SENSORY_WORDS.has(c), false, `${c} must not be in the 1.3.3 lexicon`);
  }
  assert.deepEqual(L.sensoryWordsIn('Click the green button labelled howdy for a surprise'), []);
});

test('1.3.3 lexicon is REQUIREMENT-sourced, not fixture-mined: words absent from every 9bd38c fixture are present', () => {
  // none of these appear in the ACT 9bd38c fixtures, but all are WCAG 1.3.3 Understanding sensory characteristics.
  for (const w of ['diagonal', 'huge', 'rectangular', 'sideways', 'chime', 'oval', 'vertical', 'thin']) {
    assert.equal(L.SENSORY_WORDS.has(w), true, `requirement word "${w}" must be in the lexicon`);
  }
});

test('1.3.3 lexicon covers ORDINAL/SUPERLATIVE location words (silent-FN coverage — present in NO fixture)', () => {
  // WCAG 1.3.3 "location" includes extreme/sequence positions ("the topmost link", "the button at the end").
  // These are pure requirement-sourced coverage: they appear in NO 9bd38c fixture, so adding them cannot overfit
  // the corpus — that is exactly why they belong here (guarding against a silent FN on a real ordinal reference).
  for (const w of ['topmost', 'bottommost', 'leftmost', 'rightmost', 'end', 'beginning', 'first', 'last', 'final']) {
    assert.equal(L.SENSORY_WORDS.has(w), true, `ordinal location word "${w}" must be in the lexicon`);
  }
  // multi-word ordinal/extreme-position phrases are matched as phrases (single-token match would over-fire on "far").
  assert.deepEqual(L.sensoryWordsIn('the button on the far side'), ['far side']);
  assert.equal(L.hasSensoryWord('activate the first control at the end of the row'), true);
});

test('1.3.3 lexicon does NOT fire on non-instruction / non-sensory text (over-inclusion is corrected by the LLM, not here)', () => {
  // These CONTAIN a lexicon word but are descriptive — the lexicon still flags them (applicability), and the LLM
  // decides they are not a barrier. The point of THIS test: a plain sentence with no lexicon word is NOT flagged.
  assert.deepEqual(L.sensoryWordsIn('Click the button, for a surprise'), []);        // Passed 14 — no visual word
  assert.deepEqual(L.sensoryWordsIn('The W3C Web Accessibility Initiative develops standards.'), []);
});

test('1.3.3 module exposes NO verdict function (applicability only)', () => {
  const keys = Object.keys(L);
  for (const k of keys) assert.ok(!/verdict|judge|decide|barrier|pass|fail/i.test(k), `sensory-lexicon must not export a verdict-shaped API (${k})`);
});

test('1.3.3 oracle family fires on sensoryWordHint and only then', () => {
  assert.equal(oracle.familiesFor({ xpath: '/p', text: 'x', sensoryWordHint: true }).includes('sensory-characteristics'), true);
  assert.equal(oracle.familiesFor({ xpath: '/p', text: 'x' }).includes('sensory-characteristics'), false);
  assert.equal(oracle.FAMILIES['sensory-characteristics'].sc, '1.3.3');
});
