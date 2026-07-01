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
const HOMOGLYPH = {
  // Cyrillic → Latin
  'А': 'A', 'В': 'B', 'Е': 'E', 'К': 'K', 'М': 'M', 'Н': 'H', 'О': 'O',
  'Р': 'P', 'С': 'C', 'Т': 'T', 'Х': 'X', 'а': 'a', 'е': 'e', 'о': 'o',
  'р': 'p', 'с': 'c', 'х': 'x', 'у': 'y', 'і': 'i', 'Ѕ': 'S', 'ѕ': 's',
  'һ': 'h', 'ј': 'j',
  // Greek → Latin
  'Α': 'A', 'Β': 'B', 'Ε': 'E', 'Ζ': 'Z', 'Η': 'H', 'Ι': 'I', 'Κ': 'K',
  'Μ': 'M', 'Ν': 'N', 'Ο': 'O', 'Ρ': 'P', 'Τ': 'T', 'Υ': 'Y', 'Χ': 'X',
  'ο': 'o', 'α': 'a', 'ι': 'i', 'ν': 'v', 'ρ': 'p', 'υ': 'u',
};
const isAsciiLetter = (ch) => /[A-Za-z]/.test(ch);
const isCyrGreekLetter = (cp) => (cp >= 0x0370 && cp <= 0x03ff) || (cp >= 0x0400 && cp <= 0x04ff);

// Returns { hasConfusables, count, kinds[], samples[{char,codepoint,kind}], asciiFold } for a string.
function detectConfusableText(text) {
  const s = typeof text === 'string' ? text : '';
  const out = { hasConfusables: false, count: 0, kinds: [], samples: [], asciiFold: '' };
  if (!s.trim()) return out;
  const kinds = new Set();
  // First pass: tokenize into whitespace-separated words; a Cyrillic/Greek letter is only a HOMOGLYPH attack when it
  // sits in a word that ALSO has ASCII letters (a real Cyrillic word is legitimate text in its own language).
  const words = s.split(/(\s+)/);
  let fold = '';
  for (const w of words) {
    if (/^\s+$/.test(w) || !w) { fold += w; continue; }
    const cps = [...w].map((c) => c.codePointAt(0));
    const hasAsciiLetter = [...w].some(isAsciiLetter);
    let wordFold = '';
    for (const ch of w) {
      const cp = ch.codePointAt(0);
      let folded = foldMathAlnum(cp);
      let kind = folded ? 'math-styled' : null;
      if (!folded) { folded = foldFullwidth(cp); kind = folded ? 'fullwidth' : null; }
      if (!folded) { folded = foldEnclosed(cp); kind = folded ? 'enclosed' : null; }
      if (!folded && HOMOGLYPH[ch] && hasAsciiLetter && isCyrGreekLetter(cp)) { folded = HOMOGLYPH[ch]; kind = 'homoglyph-mix'; }
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
  return out;
}

module.exports = { detectConfusableText };
