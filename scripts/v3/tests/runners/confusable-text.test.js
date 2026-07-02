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

// Audit #5: the HOMOGLYPH map omitted Greek lunate sigma U+03F2 'ϲ' — the FIRST glyph of WCAG F71's own
// normative example 'ϲоοk' — so the fold handed to the judge was corrupted ('ϲook', count 2 not 3).
test('audit #5 RECALL: F71\'s verbatim look-alike "ϲоοk" folds to "cook" with ALL THREE substitutions counted', () => {
  const r = detectConfusableText('ϲоοk'); // ϲ U+03F2, о U+043E, ο U+03BF, Latin k
  assert.equal(r.hasConfusables, true);
  assert.equal(r.asciiFold, 'cook', 'U+03F2 now folds — the judge sees the AT-unreadable string fully repaired');
  assert.equal(r.count, 3, 'all three non-Latin glyphs are counted (was 2 with U+03F2 missing)');
  assert.deepEqual(r.kinds, ['homoglyph-mix'], 'the Latin k makes it the classic mixed-script word');
});

test('audit #5 RECALL: a single U+03F2 swap in otherwise-Latin text flags ("ϲall us today")', () => {
  const r = detectConfusableText('ϲall us today');
  assert.equal(r.hasConfusables, true);
  assert.equal(r.asciiFold, 'call us today');
  assert.equal(r.count, 1);
});

// Audit #7: the old gate required a SURVIVING ASCII letter in the word — every build fixture happened to
// leave one Latin letter, so FULLY-substituted words ('РауРа', 'СОВА') were missed. The fix is a fold-quality
// discriminator: an entirely-Cyrillic/Greek word flags when EVERY letter folds to Latin via HOMOGLYPH,
// unless the nearest declared lang natively writes that script.
test('audit #7 RECALL: fully-substituted words flag via fold-quality — no surviving ASCII letter required', () => {
  const bare = detectConfusableText('РауРа'); // Р а у Р а — all five fold (P a y P a)
  assert.equal(bare.hasConfusables, true, 'the fully-substituted word is caught with no lang declared');
  assert.equal(bare.asciiFold, 'PayPa');
  assert.deepEqual(bare.kinds, ['homoglyph-full']);

  const en = detectConfusableText('РауРаl', 'en'); // trailing Latin l ⇒ the kept mixed-script gate
  assert.equal(en.hasConfusables, true);
  assert.equal(en.asciiFold, 'PayPal');
});

test('audit #7 fold-quality + lang: "СОВА" flags under lang=en (reads COBA), NOT under lang=ru (real Russian word)', () => {
  const en = detectConfusableText('СОВА', 'en');
  assert.equal(en.hasConfusables, true, 'under a Latin-script lang the full fold to COBA is a likely spoof');
  assert.equal(en.asciiFold, 'COBA');
  assert.equal(en.langMatchesScript, false, 'en is not written in Cyrillic — surfaced for the judge\'s steer');

  const ru = detectConfusableText('СОВА', 'ru');
  assert.equal(ru.hasConfusables, false, 'a declared Cyrillic-native lang exempts the fully-foldable word');
  const ruRU = detectConfusableText('СОВА', 'ru-RU');
  assert.equal(ruRU.hasConfusables, false, 'region subtags normalise to the primary subtag');
});

test('audit #7 length floor (review defect 3): short fully-foldable Cyrillic words do not spam lang-less pages', () => {
  // On a page with NO declared lang, the single-letter Cyrillic prepositions/conjunctions and very short
  // common words fold fully ('с'→c, 'оса'→oca) — flagging them would flood the judge with steer-less
  // homoglyph-full signals on every un-langed Russian page. The >=4-letter floor keeps wordmark-length
  // spoofs ('СОВА' 4, 'РауРа' 5) while dropping the short-word noise; mixed-script stays floor-less.
  for (const short of ['а', 'с', 'о', 'у', 'оса']) {
    assert.equal(detectConfusableText(short).hasConfusables, false, `"${short}" (fully-foldable, <4 letters, no lang) must not flag`);
  }
  assert.equal(detectConfusableText('СОВА').hasConfusables, true, 'the 4-letter wordmark shape still flags with no lang declared');
  assert.equal(detectConfusableText('сat').hasConfusables, true, 'mixed-script keeps NO floor: one Cyrillic с in a Latin word still flags');
});

test('audit #7 OVER-FIRE guard: non-foldable native words NEVER flag, under any lang (fold-quality, not a language gate)', () => {
  for (const lang of [undefined, 'en', 'ru']) {
    assert.equal(detectConfusableText('Привет мир', lang).hasConfusables, false, `Привет мир must not flag (lang=${lang}) — П,и,в,т have no Latin twin`);
  }
  for (const lang of [undefined, 'en', 'el']) {
    assert.equal(detectConfusableText('τζατζίκι', lang).hasConfusables, false, `τζατζίκι must not flag (lang=${lang}) — τ,ζ,ί,κ have no Latin twin`);
  }
  // case-07 (eval/act-augmented 1.1.1, lang=el fixture) behavior unchanged: legitimate language-tagged Greek.
  assert.equal(detectConfusableText('(τζατζίκι)', 'el').hasConfusables, false, 'case-07 dish name (with punctuation) stays silent');
  assert.equal(detectConfusableText('Καλή όρεξη', 'el').hasConfusables, false, 'case-07 quote stays silent');
});

// Audit #7: the lang travels into the judge-facing uncertainReason (llm-adjudicator precompute) so the judge
// can weigh 'folds to PayPal; lang=en — likely spoof' against 'lang=ru — may be legitimate'. Shape is additive.
test('audit #7: nearestLang threads through precomputeSignals into confusableText.uncertainReason', () => {
  const { precomputeSignals } = require('../../lib/llm-adjudicator.js');
  const en = precomputeSignals({ text: 'СОВА', nearestLang: 'en' }, 'name-role-state');
  assert.ok(en.confusableText, 'the fully-substituted word reaches the judge under lang=en');
  assert.equal(en.confusableText.lang, 'en');
  assert.equal(en.confusableText.langMatchesScript, false);
  assert.match(en.confusableText.uncertainReason, /lang is "en"/, 'the declared lang is stated in the reason');
  assert.match(en.confusableText.uncertainReason, /likely the intended reading|spoof/i, 'a non-native lang steers toward spoof');

  const ru = precomputeSignals({ text: 'СОВА', nearestLang: 'ru' }, 'name-role-state');
  assert.equal(ru.confusableText, undefined, 'suppressed entirely under the native-script lang');

  // adversarial-review defect 4: the 'may be legitimate' softening must NOT leak onto mixed-script words —
  // no language mixes Latin+Cyrillic inside one word, so 'Аpple' under lang=ru is the classic spoof shape
  // and keeps a firm steer despite the matching declared lang.
  const mix = precomputeSignals({ text: 'Аpple', nearestLang: 'ru' }, 'name-role-state'); // mixed-script flags regardless of lang
  assert.ok(mix.confusableText, 'the kept mixed-script gate still fires under lang=ru');
  assert.doesNotMatch(mix.confusableText.uncertainReason, /may be legitimate/i, 'the softened steer is scoped to homoglyph-full only');
  assert.match(mix.confusableText.uncertainReason, /MIXED-script word .* not natural text|treat the substitution as suspect/i, 'a mixed-script word keeps a firm steer');

  const noLang = precomputeSignals({ text: 'РауРа' }, 'name-role-state');
  assert.ok(noLang.confusableText, 'older element records without nearestLang keep working (additive shape)');
  assert.ok(!('lang' in noLang.confusableText), 'no lang fields invented when none was declared');
});
