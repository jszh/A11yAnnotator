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

// NUMERIC-HOMOGLYPH lane (RCA s10, Tier 2 #21): a short Cyrillic-lettered price renders as an ordinary
// amount but hits NEITHER letter lane — too few letters for the homoglyph-full >=4 floor, and З has
// no Latin-LETTER twin at all (its UTS#39 confusable is DIGIT THREE). The numeric lane maps digit-lookalike
// letters and fires only when the token folds ENTIRELY to digits AND sits in currency/unit/quantity context.
// Fixture is INVENTED (leak rule): three distinct map entries (З→3, І→1, б→6) in one currency token.
test('numeric lane: "€ЗІб" folds to "€316" — homoglyph-numeric, all three substitutions counted', () => {
  const r = detectConfusableText('€ЗІб', 'en');
  assert.equal(r.hasConfusables, true, 'the 3-letter price spoof is caught');
  assert.deepEqual(r.kinds, ['homoglyph-numeric']);
  assert.equal(r.asciiFold, '€316', 'the judge sees the number a sighted user reads');
  assert.equal(r.count, 3);
  assert.equal(r.langMatchesScript, false, 'en does not write Cyrillic — the spoof steer is surfaced');

  const bare = detectConfusableText('€ЗІб');
  assert.equal(bare.hasConfusables, true, 'no declared lang needed: the context conjunct is this lane\'s gate');
  assert.equal(bare.asciiFold, '€316');
});

test('numeric lane: digit-mix and adjacency variants fire, each folding to the seen number', () => {
  const mix = detectConfusableText('£1Ѕ0'); // real digits mixed INTO the token — reads £150
  assert.equal(mix.hasConfusables, true);
  assert.deepEqual(mix.kinds, ['homoglyph-numeric']);
  assert.equal(mix.asciiFold, '£150');
  assert.equal(mix.count, 1, 'only the substituted Ѕ counts; the real digits pass through unflagged');

  const unit = detectConfusableText('Зб kg'); // unit word as the NEXT token
  assert.equal(unit.hasConfusables, true);
  assert.equal(unit.asciiFold, '36 kg');

  const digitsPrev = detectConfusableText('90 ЗОЅ'); // digits-adjacent position (previous token)
  assert.equal(digitsPrev.hasConfusables, true);
  assert.equal(digitsPrev.asciiFold, '90 305');

  const symPrev = detectConfusableText('€ ЗОО'); // standalone currency symbol as the previous token
  assert.equal(symPrev.hasConfusables, true);
  assert.equal(symPrev.asciiFold, '€ 300');

  const pct = detectConfusableText('ЗО%'); // percent glyph attached to the token
  assert.equal(pct.hasConfusables, true);
  assert.equal(pct.asciiFold, '30%');

  const greek = detectConfusableText('$ΙΟ'); // Greek capitals Ι/Ο via the same twin-class route
  assert.equal(greek.hasConfusables, true);
  assert.equal(greek.asciiFold, '$10');
});

test('numeric lane FP guards: 2-char floor, digits-only, missing context — and the letter lanes untouched', () => {
  assert.equal(detectConfusableText('$З').hasConfusables, false, 'floor: one digit-shaped char never fires');
  assert.equal(detectConfusableText('$100').hasConfusables, false, 'digits-only: no substituted letter, nothing to flag');
  assert.equal(detectConfusableText('ЗОО').hasConfusables, false, 'folds to 300 but sits in NO currency/unit/digit context');
  assert.equal(detectConfusableText('ЗОО отдел', 'ru').hasConfusables, false, 'a Cyrillic neighbour is not quantity context');
  assert.equal(detectConfusableText('100 рублей').hasConfusables, false, 'a real Cyrillic unit word next to digits does not fold entirely to digits (р,у,л,е,й unmapped)');
  // the letter lanes are byte-identical: the audit #7 pair behaves exactly as before
  assert.equal(detectConfusableText('СОВА', 'ru').hasConfusables, false, 'lang=ru exemption on the letter lane untouched');
  assert.equal(detectConfusableText('СОВА', 'en').hasConfusables, true, 'lang=en flag on the letter lane untouched');
});

// Batch-2 soundness review: the context conjunct accepted ANY digit-bearing neighbour token, so ordinary
// native-script prose next to digits fired — a legal-form prefix beside a digit-bearing brand name, a
// numbered list marker, phone digits, Roman-numeral-style capitals, and a doubled real letter near a
// number. When the candidate word's script IS the declared lang's native writing system, digit adjacency
// is everyday prose, so the lane now requires the STRONG conjunct there: a currency/percent glyph ON the
// token itself, or a unit-word neighbour. All strings invented/generic — verified against zero corpus hits.
test('numeric lane script-vs-lang: ordinary native-script prose near digits stays quiet (reviewer FP shapes)', () => {
  assert.equal(detectConfusableText('ООО 1С', 'ru').hasConfusables, false, 'legal prefix beside a digit-bearing brand name');
  assert.equal(detectConfusableText('1. ООО Ромашка', 'ru').hasConfusables, false, 'a numbered-list marker token before the prefix');
  assert.equal(detectConfusableText('тел. 555-11-22, ООО', 'ru').hasConfusables, false, 'phone digits immediately before the prefix');
  assert.equal(detectConfusableText('ІІ 20', 'uk').hasConfusables, false, 'Roman-numeral-style capitals beside a number');
  assert.equal(detectConfusableText('ЅЅЅ 10', 'mk').hasConfusables, false, 'a real letter of the declared alphabet doubled near a digit');
});

test('numeric lane script-vs-lang: the strong conjunct still fires under the matching lang; the mismatch path is untouched', () => {
  // strong conjunct 1: currency ON the token — fires whatever the page language, with the lang steer surfaced
  const cur = detectConfusableText('$ЗОО', 'ru');
  assert.equal(cur.hasConfusables, true, 'a currency glyph on the token is the strong conjunct');
  assert.equal(cur.asciiFold, '$300');
  assert.equal(cur.langMatchesScript, true, 'the judge still sees that the declared lang writes this script');
  // strong conjunct 2: a unit-word neighbour
  const unit = detectConfusableText('Зб kg', 'ru');
  assert.equal(unit.hasConfusables, true, 'a unit-word neighbour is the strong conjunct');
  assert.equal(unit.asciiFold, '36 kg');
  // script MISMATCHES the declared lang: the wider conjunct (bare digit adjacency) stands — the spoof steer
  const mism = detectConfusableText('ІІ 20', 'en');
  assert.equal(mism.hasConfusables, true, 'Cyrillic capitals on a declared-Latin page keep the wider gate');
  assert.equal(mism.asciiFold, '11 20');
  assert.equal(mism.langMatchesScript, false);
  // no declared lang: no match is possible, so behaviour is the pre-fix gate unchanged
  assert.equal(detectConfusableText('90 ЗОЅ').hasConfusables, true, 'lang-less digit adjacency unchanged');
});

test('numeric lane: precomputeSignals surfaces homoglyph-numeric through the EXISTING confusable block, no consumer change', () => {
  const { precomputeSignals } = require('../../lib/llm-adjudicator.js');
  const s = precomputeSignals({ text: '$ЗОО', nearestLang: 'en' }, 'name-role-state');
  assert.ok(s.confusableText, 'the price spoof reaches the judge');
  assert.deepEqual(s.confusableText.kinds, ['homoglyph-numeric']);
  assert.equal(s.confusableText.asciiFold, '$300');
  assert.equal(s.confusableText.langMatchesScript, false);
  assert.match(s.confusableText.uncertainReason, /homoglyph-numeric/, 'the kind is named in the reason');
  assert.match(s.confusableText.uncertainReason, /"\$300"/, 'the folded number is quoted for the judge');
});
