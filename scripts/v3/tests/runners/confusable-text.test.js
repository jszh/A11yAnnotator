'use strict';
const { test } = require('node:test');
const assert = require('node:assert');
const { detectConfusableText } = require('../../lib/confusable-text.js');

// 1.1.1 text-lookalike-glyph-substitution: text that RENDERS as words but is built from non-letter / wrong-script
// codepoints an SR cannot read. Adversarial: each positive must fold to the intended ASCII; the legitimate
// non-Latin word and plain ASCII must NOT be flagged (the false-positive guard that makes the signal usable).
test('detectConfusableText: flags math-styled / fullwidth / enclosed / homoglyph-mix and folds to the seen ASCII', () => {
  const math = detectConfusableText('\u{1D407}\u{1D41E}\u{1D425}\u{1D425}\u{1D428}'); // 𝐇𝐞𝐥𝐥𝐨
  assert.equal(math.hasConfusables, true);
  assert.deepEqual(math.kinds, ['math-styled']);
  assert.equal(math.asciiFold, 'Hello', 'fake-bold folds back to the word a sighted user reads');

  const full = detectConfusableText('Ｌｏｇｉｎ');
  assert.equal(full.hasConfusables, true);
  assert.equal(full.asciiFold, 'Login');
  assert.deepEqual(full.kinds, ['fullwidth']);

  const enc = detectConfusableText('ⒶⒷⒸ');
  assert.equal(enc.hasConfusables, true);
  assert.equal(enc.asciiFold, 'ABC');

  const homo = detectConfusableText('Аpple'); // leading Cyrillic А in an otherwise-Latin word
  assert.equal(homo.hasConfusables, true);
  assert.deepEqual(homo.kinds, ['homoglyph-mix']);
  assert.equal(homo.asciiFold, 'Apple');
  assert.equal(homo.count, 1, 'only the one homoglyph char is counted');

  const mixed = detectConfusableText('Click \u{1D421}\u{1D41E}\u{1D42B}\u{1D41E} now'); // Click 𝐡𝐞𝐫𝐞 now
  assert.equal(mixed.hasConfusables, true);
  assert.equal(mixed.asciiFold, 'Click here now');
});

test('detectConfusableText: does NOT flag plain ASCII or a legitimate non-Latin word (FP guard)', () => {
  const ascii = detectConfusableText('Hello world, click here');
  assert.equal(ascii.hasConfusables, false);
  assert.equal(ascii.count, 0);

  // a real Russian word (all-Cyrillic, no ASCII mix) is legitimate text, not a homoglyph attack.
  const ru = detectConfusableText('Привет мир');
  assert.equal(ru.hasConfusables, false, 'an all-Cyrillic word is its own language, not a Latin homoglyph');

  // empty / whitespace
  assert.equal(detectConfusableText('').hasConfusables, false);
  assert.equal(detectConfusableText('   ').hasConfusables, false);
  assert.equal(detectConfusableText(null).hasConfusables, false);
});
