// SC 1.4.1 Use of Color — REQUIREMENT-SOURCED "colour reference" detector, built to the same contract as
// sensory-lexicon.js (1.3.3) and for the gap that file deliberately leaves: it excludes colour words with the
// note "colour alone is SC 1.4.1's domain (use-of-color-v0)" — and 1.4.1 then had no colour-word detector at
// all, so instructions that identify content BY COLOUR reached no obligation from either side.
//
// Sources (requirement documents, never fixtures — a fixture-mined list passes the corpus and misses the
// real thing):
//   · Understanding SC 1.4.1 — "instructions ... that refer to color, such as 'required fields are shown in red'"
//   · F81 — failure due to identifying required or error fields using colour differences only
//   · F13 — a text alternative that omits information conveyed by colour differences in an image
//   · G14 / G182 — the sufficient techniques: make colour-conveyed information available in text, or add a
//     second visual cue where colour differences carry meaning
//
// NOT A BAG OF WORDS — and that distinction is the whole design. Measured over the 926-page corpus, matching
// bare colour words fired on 18.1% of ALL pages, overwhelmingly on ordinary attributive adjectives: "Olive
// focaccia", "Black lentils simmered overnight", "Volunteers in teal jackets", "Notes of jasmine, peach, and
// black tea". None of those identifies web content by colour. What the Understanding's own example has and
// those lack is a CONSTRUCTION: a colour word predicated of how content is PRESENTED ("...are shown in red"),
// or attached to a UI noun ("green buttons", "the red field"). So this matches constructions.
//
// SCOPE: APPLICABILITY ONLY — it decides which text owes a 1.4.1 obligation, never a verdict. The rubric
// decides whether the reference actually identifies content and whether a non-colour alternative is given.
'use strict';

// Colour NAMES — the everyday spoken set. An author writing an instruction says "in red", not "#c8332b".
const COLOR_WORDS = Object.freeze([
  'red', 'green', 'blue', 'yellow', 'orange', 'purple', 'pink', 'brown', 'black', 'white',
  'grey', 'gray', 'cyan', 'magenta', 'violet', 'amber', 'teal', 'gold', 'silver',
  'turquoise', 'maroon', 'navy', 'olive', 'lime', 'indigo', 'crimson', 'scarlet',
]);

// Nouns that make the referent WEB CONTENT rather than a thing in the world. "Green button" is a colour
// reference to a control; "green chilli" is a chilli.
const UI_NOUNS = Object.freeze([
  'button', 'buttons', 'link', 'links', 'field', 'fields', 'row', 'rows', 'cell', 'cells',
  'item', 'items', 'entry', 'entries', 'text', 'label', 'labels', 'icon', 'icons', 'box', 'boxes',
  'tab', 'tabs', 'column', 'columns', 'section', 'sections', 'marker', 'markers', 'dot', 'dots',
  'bar', 'bars', 'line', 'lines', 'area', 'areas', 'region', 'regions', 'square', 'squares',
  'circle', 'circles', 'highlight', 'highlights', 'border', 'borders', 'background', 'header',
  'heading', 'headings', 'message', 'messages', 'value', 'values', 'option', 'options',
  'segment', 'segments', 'slice', 'slices', 'wedge', 'band', 'block', 'blocks', 'card', 'cards',
]);

// Verbs of PRESENTATION. The Understanding's example is built from one of these.
const PRESENT_VERBS = Object.freeze([
  'shown', 'show', 'shows', 'marked', 'mark', 'marks', 'indicated', 'indicate', 'indicates',
  'highlighted', 'highlight', 'highlights', 'displayed', 'display', 'displays', 'flagged', 'flag',
  'flags', 'denoted', 'denote', 'denotes', 'identified', 'identify', 'identifies', 'appear',
  'appears', 'coloured', 'colored', 'printed', 'listed', 'rendered', 'set',
]);

const COLOR_ALT = COLOR_WORDS.join('|');
const NOUN_ALT = UI_NOUNS.join('|');
const VERB_ALT = PRESENT_VERBS.join('|');

// The three requirement-sourced constructions.
const PATTERNS = Object.freeze([
  // 1. PRESENTATION PREDICATE — "required fields are shown in red", "errors are marked in orange".
  //    Up to three filler words between verb and colour ("shown in bright red").
  Object.freeze({ id: 'presented-in-colour', re: new RegExp(`\\b(?:${VERB_ALT})\\b(?:\\W+\\w+){0,3}\\W+\\b(?:${COLOR_ALT})\\b`, 'i') }),
  // 2. COLOUR + UI NOUN — "green buttons advance the application", "the red field is required".
  //    Allows one intervening modifier ("green outlined button").
  Object.freeze({ id: 'colour-ui-noun', re: new RegExp(`\\b(?:${COLOR_ALT})\\b(?:\\W+\\w+){0,1}\\W+\\b(?:${NOUN_ALT})\\b`, 'i') }),
  // 3. EXPLICIT COLOUR CODING — "colour-coded by team", "indicated by colour", "the same colour".
  Object.freeze({ id: 'colour-coding', re: /\b(?:colou?r-?coded|by\s+colou?r|colou?r\s+(?:key|legend|coding)|same\s+colou?r|different\s+colou?rs?)\b/i }),
]);

// Returns the matching CONSTRUCTION ids (not the words) — so a caller can see WHY it fired.
function colorReferencesIn(text) {
  const s = String(text == null ? '' : text);
  if (!s) return [];
  const hits = [];
  for (const p of PATTERNS) { const m = s.match(p.re); if (m) hits.push({ pattern: p.id, match: m[0].slice(0, 60) }); }
  return hits;
}

const hasColorReference = (text) => colorReferencesIn(text).length > 0;

module.exports = { COLOR_WORDS, UI_NOUNS, PRESENT_VERBS, PATTERNS, colorReferencesIn, hasColorReference };
