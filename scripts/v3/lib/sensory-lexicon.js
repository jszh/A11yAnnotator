// ACT-REST expansion Round 3 — SC 1.3.3 Sensory Characteristics (ACT 9bd38c). REQUIREMENT-SOURCED "visual
// reference word" lexicon. Every entry is drawn from the WCAG 1.3.3 requirement documents (Understanding SC
// 1.3.3, F14, F26, G96) — NOT from the ACT fixtures (the plan's #2 overfit risk: a fixture-mined list silently
// passes the corpus while missing real references). Each category cites its source.
//
// SCOPE: this lexicon gates APPLICABILITY ONLY — it decides WHICH text nodes owe a 1.3.3 obligation (which reach
// the LLM rubric). It NEVER produces a verdict. Over-inclusion is SAFE: a text node that merely contains one of
// these words (e.g. "this circle is nice", "right after") is minted as an obligation and the LLM rubric decides
// whether the word (a) identifies specific web content and (b) lacks a non-visual alternative. A false-applicable
// is corrected by the LLM (N/A / not-reproduced); a false-INAPPLICABLE would silently pass, so we err inclusive.
//
// COLOR IS EXCLUDED. WCAG 1.3.3 covers shape, size, visual location/position, orientation, and sound — colour
// alone is SC 1.4.1's domain (use-of-color-v0), so colour words are deliberately omitted (team-lead scope call).
'use strict';

// Category -> words. Sources per WCAG 2.x "Understanding SC 1.3.3: Sensory Characteristics" (the SC text lists
// "shape, size, visual location, orientation, or sound") + F14 (shape/location) + G96 examples.
const SENSORY_LEXICON = Object.freeze({
  // SHAPE — Understanding 1.3.3 ("shape ... such as 'the round button'"); F14 ("identifying content by its shape").
  shape: ['round', 'circular', 'circle', 'square', 'rectangular', 'rectangle', 'triangle', 'triangular',
    'star', 'diamond', 'oval', 'curved', 'cross', 'arrow', 'heart', 'l-shaped'],
  // SIZE — Understanding 1.3.3 ("size ... such as 'the large button'").
  size: ['large', 'larger', 'largest', 'small', 'smaller', 'smallest', 'big', 'bigger', 'little', 'wide',
    'wider', 'narrow', 'narrower', 'tall', 'taller', 'short', 'shorter', 'huge', 'tiny', 'thick', 'thin'],
  // VISUAL LOCATION / POSITION — Understanding 1.3.3 ("location ... such as 'the links on the right'"); F14 ("location").
  // Includes ORDINAL/SUPERLATIVE location words: the same "location" characteristic expressed as an extreme or
  // sequence position ("the topmost link", "the first button", "the link at the end") — Understanding 1.3.3
  // "location" covers a reference to a position in the visual/reading layout, not only the four compass edges.
  // Over-inclusion is safe (applicability-only, LLM adjudicates), and these appear in NO 9bd38c fixture — they
  // are pure requirement-sourced coverage against silent FN, asserted by the anti-overfit unit test.
  position: ['right', 'left', 'above', 'below', 'top', 'bottom', 'upper', 'lower', 'up', 'down', 'here',
    'there', 'beside', 'adjacent', 'corner', 'over', 'under', 'underneath', 'opposite', 'center', 'centre',
    'middle', 'aside', 'nearby',
    'topmost', 'bottommost', 'leftmost', 'rightmost', 'uppermost', 'lowermost', 'innermost', 'outermost',
    'foremost', 'first', 'last', 'final', 'end', 'beginning', 'front', 'back', 'rear'],
  // ORIENTATION — Understanding 1.3.3 ("orientation").
  orientation: ['tilted', 'rotated', 'upright', 'sideways', 'vertical', 'horizontal', 'portrait', 'landscape',
    'upside-down', 'diagonal', 'slanted', 'inverted', 'angled'],
  // SOUND — Understanding 1.3.3 ("sound ... such as 'a beep'"); G96 (auditory cues).
  sound: ['beep', 'beeps', 'chime', 'ring', 'rings', 'tone', 'buzz', 'ding', 'alarm', 'sound'],
});

// The flat, lowercased set (all categories) for fast membership.
const SENSORY_WORDS = new Set(Object.values(SENSORY_LEXICON).flat());

// Multi-word position phrases whose FIRST token is generic on its own but which are sensory as a phrase (Understanding
// 1.3.3 phrasing "next to", "to the right of"). Kept as phrases so "next" alone doesn't over-fire.
const SENSORY_PHRASES = ['next to', 'to the right', 'to the left', 'at the top', 'at the bottom', 'in the corner',
  'far side', 'far right', 'far left', 'at the end', 'at the beginning'];

// Which requirement-sourced visual-reference words does `text` contain? Tokenizes on non-letters (hyphen kept for
// "upside-down"/"l-shaped"), lowercases, and matches whole words + the known phrases. Returns the matched words
// (deduped, with the phrases). APPLICABILITY ONLY — never a verdict.
function sensoryWordsIn(text) {
  const s = String(text == null ? '' : text).toLowerCase();
  if (!s.trim()) return [];
  const found = new Set();
  for (const tok of s.split(/[^a-z-]+/)) { if (tok && SENSORY_WORDS.has(tok)) found.add(tok); }
  for (const ph of SENSORY_PHRASES) if (s.includes(ph)) found.add(ph);
  return [...found];
}

const hasSensoryWord = (text) => sensoryWordsIn(text).length > 0;

module.exports = { SENSORY_LEXICON, SENSORY_WORDS, SENSORY_PHRASES, sensoryWordsIn, hasSensoryWord };
