'use strict';
// confusable-text — DETERMINISTIC detector for "text-lookalike-glyph-substitution" (1.1.1). Author-supplied text
// that RENDERS as ordinary words but is built from non-letter / wrong-script codepoints a screen reader cannot read
// correctly: Mathematical Alphanumeric Symbols (fake bold/italic — "𝐇𝐞𝐥𝐥𝐨"), Fullwidth forms ("Ｈｅｌｌｏ"), Enclosed/
// circled letters, or Cyrillic/Greek HOMOGLYPHS mixed into a Latin word ("Аpple" with a Cyrillic А). These read as
// non-text content masquerading as text. This is a pure codepoint analysis — no DOM, no verdict; it FLAGS suspicious
// runs and offers an ASCII fold so a judge can compare what is SEEN vs what AT receives.

// Mathematical Alphanumeric Symbols block (U+1D400–U+1D7FF) folded back to ASCII by structural offset.
function foldMathAlnum(cp) {
  // Letters: 26 uppercase then 26 lowercase, in styled runs of 52, starting at 1D400. Digits live at the tail.
  if (cp >= 0x1d400 && cp <= 0x1d7ff) {
    // digits (several styled runs of 10 from 1D7CE)
    if (cp >= 0x1d7ce) { const d = (cp - 0x1d7ce) % 10; return String.fromCharCode(0x30 + d); }
    let off = (cp - 0x1d400) % 52;
    // a handful of reserved holes in the block map to letterlike symbols; treat any 0..51 as A-Za-z by offset.
    if (off < 26) return String.fromCharCode(0x41 + off);
    return String.fromCharCode(0x61 + (off - 26));
  }
  return null;
}
// Fullwidth ASCII variants (U+FF01–U+FF5E) fold by a fixed −0xFEE0 offset.
function foldFullwidth(cp) { return (cp >= 0xff01 && cp <= 0xff5e) ? String.fromCharCode(cp - 0xfee0) : null; }
// Enclosed alphanumerics — circled latin letters (U+24B6–U+24E9) and circled digits.
function foldEnclosed(cp) {
  if (cp >= 0x24b6 && cp <= 0x24cf) return String.fromCharCode(0x41 + (cp - 0x24b6)); // Ⓐ..Ⓩ
  if (cp >= 0x24d0 && cp <= 0x24e9) return String.fromCharCode(0x61 + (cp - 0x24d0)); // ⓐ..ⓩ
  return null;
}
// Cyrillic/Greek single-letter homoglyphs of ASCII letters (the ones that actually look identical).
// SCOPE (audit #5): individually-vetted, visually-IDENTICAL Latin twins only — NEVER a blanket UTS#39 import
// (ambiguous pairs like Greek ν/ι/α appear in legitimate technical/scientific text; the per-word gates in
// detectConfusableText are the FP control, this map only says "renders indistinguishable from Latin").
const HOMOGLYPH = {
  // Cyrillic → Latin
  'А': 'A', 'В': 'B', 'Е': 'E', 'К': 'K', 'М': 'M', 'Н': 'H', 'О': 'O',
  'Р': 'P', 'С': 'C', 'Т': 'T', 'Х': 'X', 'У': 'Y', 'а': 'a', 'е': 'e', 'о': 'o',
  'р': 'p', 'с': 'c', 'х': 'x', 'у': 'y', 'і': 'i', 'Ѕ': 'S', 'ѕ': 's',
  'һ': 'h', 'ј': 'j',
  // Greek → Latin
  'Α': 'A', 'Β': 'B', 'Ε': 'E', 'Ζ': 'Z', 'Η': 'H', 'Ι': 'I', 'Κ': 'K',
  'Μ': 'M', 'Ν': 'N', 'Ο': 'O', 'Ρ': 'P', 'Τ': 'T', 'Υ': 'Y', 'Χ': 'X',
  'ο': 'o', 'α': 'a', 'ι': 'i', 'ν': 'v', 'ρ': 'p', 'υ': 'u',
  // Greek lunate sigma (audit #5): U+03F2 is the FIRST glyph of WCAG F71's own normative example 'ϲоοk' —
  // omitting it corrupted the fold the judge received ('ϲook', count 2 not 3). Capital U+03F9 is the same
  // letterform; Cyrillic capital У (above) completes the already-mapped lowercase у→y pair.
  'ϲ': 'c', 'Ϲ': 'C',
};
const isAsciiLetter = (ch) => /[A-Za-z]/.test(ch);
const isCyrGreekLetter = (cp) => (cp >= 0x0370 && cp <= 0x03ff) || (cp >= 0x0400 && cp <= 0x04ff);
const isLetter = (ch) => /\p{L}/u.test(ch);
const scriptOf = (cp) => (cp >= 0x0370 && cp <= 0x03ff ? 'greek' : (cp >= 0x0400 && cp <= 0x04ff ? 'cyrillic' : null));
// Languages NATIVELY WRITTEN in each script (BCP-47 primary subtag) — used to EXEMPT a fully-foldable word when
// the nearest declared lang says this script IS the content's writing system ('СОВА' under lang=ru is the Russian
// word for owl; under lang=en it reads as COBA → likely a spoof of a Latin word). Deliberately NOT exhaustive:
// an unknown lang still flags, WITH the lang surfaced to the judge, so the judge owns the borderline call.
const SCRIPT_LANGS = {
  cyrillic: new Set(['ru', 'uk', 'be', 'bg', 'sr', 'mk', 'kk', 'ky', 'tg', 'mn', 'tt', 'ba', 'cv', 'ce', 'os', 'ab', 'uz']),
  greek: new Set(['el', 'grc']),
};

// Returns { hasConfusables, count, kinds[], samples[{char,codepoint,kind}], asciiFold, lang, langMatchesScript }
// for a string. `lang` is the NEAREST declared lang/xml:lang of the element (optional; BCP-47, any case/region) —
// threaded through so the judge sees 'folds to PayPal; lang=en — likely spoof' vs 'lang=ru — may be legitimate'.
function detectConfusableText(text, lang) {
  const s = typeof text === 'string' ? text : '';
  const normLang = (typeof lang === 'string' && lang.trim()) ? lang.trim().toLowerCase().split(/[-_]/)[0] : null;
  const out = { hasConfusables: false, count: 0, kinds: [], samples: [], asciiFold: '', lang: normLang, langMatchesScript: null };
  if (!s.trim()) return out;
  const kinds = new Set();
  const flaggedScripts = new Set(); // scripts of the homoglyph chars we actually FLAGGED (for langMatchesScript)
  // First pass: tokenize into whitespace-separated words. A Cyrillic/Greek letter is a HOMOGLYPH attack when EITHER
  //  (a) it sits in a MIXED-script word that also has ASCII letters ('Аpple' — kept from the original gate), OR
  //  (b) the word is ENTIRELY Cyrillic/Greek but EVERY letter folds to Latin via HOMOGLYPH — the fold-quality
  //      discriminator (audit #7): 'РауРа'→'PayPa' folds fully; 'Привет' does not (П,и,в,т unmapped). The old
  //      gate required a SURVIVING ASCII letter in the word, which merely fit the build fixtures (each happened
  //      to leave one Latin letter) and missed fully-substituted words like 'РауРа'/'СОВА'. A fully-foldable
  //      word is EXEMPT when the nearest declared lang natively writes its script (SCRIPT_LANGS above) — that is
  //      a fold-quality + declared-language check, NOT a bare language gate: non-foldable native words never
  //      flag regardless of lang, and mixed-script words (a) flag regardless of lang.
  //      LENGTH FLOOR (adversarial-review defect 3): the homoglyph-full lane requires >= 4 letters. On pages
  //      with NO declared lang (a common 3.1.1 defect that must not cascade into 1.1.1 noise), single-letter
  //      Cyrillic words — the prepositions/conjunctions а/о/у/с/и/в/к — and very short common words ('оса',
  //      'хор') fold fully and would spam the judge with steer-less homoglyph-full signals. Wordmark spoofs
  //      target brand-length tokens ('РауРа' 5, 'СОВА' 4), which the floor keeps. Mixed-script words are
  //      unaffected (any length still flags — 'Аpple' is never natural text).
  const words = s.split(/(\s+)/);
  let fold = '';
  for (const w of words) {
    if (/^\s+$/.test(w) || !w) { fold += w; continue; }
    const chars = [...w];
    const letters = chars.filter(isLetter);
    const hasAsciiLetter = chars.some(isAsciiLetter);
    const foldsFully = !hasAsciiLetter && letters.length >= 4
      && letters.every((ch) => isCyrGreekLetter(ch.codePointAt(0)) && HOMOGLYPH[ch]);
    const wordScripts = new Set(letters.map((ch) => scriptOf(ch.codePointAt(0))).filter(Boolean));
    const langExempts = normLang != null && wordScripts.size > 0
      && [...wordScripts].every((sc) => SCRIPT_LANGS[sc] && SCRIPT_LANGS[sc].has(normLang));
    const homoglyphActive = hasAsciiLetter || (foldsFully && !langExempts);
    const homoglyphKind = hasAsciiLetter ? 'homoglyph-mix' : 'homoglyph-full';
    let wordFold = '';
    for (const ch of chars) {
      const cp = ch.codePointAt(0);
      let folded = foldMathAlnum(cp);
      let kind = folded ? 'math-styled' : null;
      if (!folded) { folded = foldFullwidth(cp); kind = folded ? 'fullwidth' : null; }
      if (!folded) { folded = foldEnclosed(cp); kind = folded ? 'enclosed' : null; }
      if (!folded && HOMOGLYPH[ch] && homoglyphActive && isCyrGreekLetter(cp)) {
        folded = HOMOGLYPH[ch]; kind = homoglyphKind;
        flaggedScripts.add(scriptOf(cp));
      }
      if (folded) {
        out.count++; kinds.add(kind);
        if (out.samples.length < 8) out.samples.push({ char: ch, codepoint: 'U+' + cp.toString(16).toUpperCase().padStart(4, '0'), kind });
        wordFold += folded;
      } else wordFold += ch;
    }
    fold += wordFold;
  }
  out.hasConfusables = out.count > 0;
  out.kinds = [...kinds];
  out.asciiFold = fold.slice(0, 200);
  // langMatchesScript: for the homoglyphs we FLAGGED, does the declared lang natively write their script?
  // true → 'may be legitimate' steer; false → 'likely spoof' steer; null → no lang or no homoglyph flagged.
  if (normLang != null && flaggedScripts.size > 0) {
    out.langMatchesScript = [...flaggedScripts].every((sc) => SCRIPT_LANGS[sc] && SCRIPT_LANGS[sc].has(normLang));
  }
  return out;
}

module.exports = { detectConfusableText };
