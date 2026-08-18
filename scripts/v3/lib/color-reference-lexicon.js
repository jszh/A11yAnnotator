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
// Round-3 residual RCA widenings (image-chart / ui-status shapes): state-bearing control nouns
// (toggle/switch/pill/chip/badge/swatch) and the chart-surface nouns (tile/map) — all generic UI/chart
// vocabulary, none tied to any one page's subject matter (subject nouns like a map's place-name category
// belong to `region/area`, already present). Still construction-gated — a bare colour word next to none of
// these matches nothing.
const UI_NOUNS = Object.freeze([
  'button', 'buttons', 'link', 'links', 'field', 'fields', 'row', 'rows', 'cell', 'cells',
  'item', 'items', 'entry', 'entries', 'text', 'label', 'labels', 'icon', 'icons', 'box', 'boxes',
  'tab', 'tabs', 'column', 'columns', 'section', 'sections', 'marker', 'markers', 'dot', 'dots',
  'bar', 'bars', 'line', 'lines', 'area', 'areas', 'region', 'regions', 'square', 'squares',
  'circle', 'circles', 'highlight', 'highlights', 'border', 'borders', 'background', 'header',
  'heading', 'headings', 'message', 'messages', 'value', 'values', 'option', 'options',
  'segment', 'segments', 'slice', 'slices', 'wedge', 'band', 'block', 'blocks', 'card', 'cards',
  'toggle', 'toggles', 'switch', 'switches', 'pill', 'pills', 'tile', 'tiles',
  'swatch', 'swatches', 'chip', 'chips', 'badge', 'badges',
  'map', 'maps',
]);

// Verbs of PRESENTATION. The Understanding's example is built from one of these.
// Round-3 residual RCA: the SHADING/FILL verbs — the vocabulary a choropleth/chart alt actually uses
// ("…are shaded red", "…is filled in grey") — were missing, so an alt that names its own colour coding
// matched nothing. Word-boundary anchored like every other entry ("tint" cannot fire in "tinting" — the
// \b in the pattern requires the token to end).
const PRESENT_VERBS = Object.freeze([
  'shown', 'show', 'shows', 'marked', 'mark', 'marks', 'indicated', 'indicate', 'indicates',
  'highlighted', 'highlight', 'highlights', 'displayed', 'display', 'displays', 'flagged', 'flag',
  'flags', 'denoted', 'denote', 'denotes', 'identified', 'identify', 'identifies', 'appear',
  'appears', 'coloured', 'colored', 'printed', 'listed', 'rendered', 'set',
  'shaded', 'shade', 'shades', 'tinted', 'tint', 'filled', 'fill',
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
  // 4. UI NOUN "in" COLOUR — "rows highlighted in red", "the fields in green". The mirror of pattern 2
  //    (which is COLOUR-then-NOUN only): a noun-FIRST legend sentence matched no construction at all.
  //    One optional word between noun and "in" ("tiles rendered in amber") and one between "in" and the
  //    colour ("the switch in the green position"); everything word-boundary anchored, so no substring
  //    can fire it.
  Object.freeze({ id: 'ui-noun-in-colour', re: new RegExp(`\\b(?:${NOUN_ALT})\\b(?:\\W+\\w+){0,1}\\W+in\\W+(?:\\w+\\W+){0,1}(?:${COLOR_ALT})\\b`, 'i') }),
]);

// PROPER-NOUN GUARD (case-SENSITIVE, applied per-match): a Capitalized colour word immediately followed
// by another Capitalized word is a NAME, not a presentation reference — "Orange County", "Red Sea
// region", "Red Square". Sentence-initial colour references survive ("Green buttons advance…" — the
// following word is lowercase), and ALL-CAPS UI text survives too ("GREEN BUTTONS" matches no
// Capitalized-word form). Without this, adding county/map/region-style nouns would turn every American
// place name into an obligation.
const CAP_COLOR_ALT = COLOR_WORDS.map((w) => w[0].toUpperCase() + w.slice(1)).join('|');
const PROPER_NOUN_PAIR = new RegExp(`\\b(?:${CAP_COLOR_ALT})\\b\\s+[A-Z]`);

// Returns the matching CONSTRUCTION ids (not the words) — so a caller can see WHY it fired.
function colorReferencesIn(text) {
  const s = String(text == null ? '' : text);
  if (!s) return [];
  const hits = [];
  for (const p of PATTERNS) {
    // fresh global twin per call — the frozen PATTERNS keep their non-global identity (and no shared
    // lastIndex state), while the guard needs to be able to SKIP a proper-noun match and keep looking.
    const g = new RegExp(p.re.source, 'gi');
    let m;
    while ((m = g.exec(s)) !== null) {
      // the guard must see the word FOLLOWING the match too: pattern 1 stops AT the colour word, so in
      // "marked in Red Square" the capitalized successor sits just past m[0].
      const tail = (s.slice(m.index + m[0].length).match(/^\W+\w+/) || [''])[0];
      if (PROPER_NOUN_PAIR.test(m[0] + tail)) continue; // a name, not a presentation reference — try the next occurrence
      hits.push({ pattern: p.id, match: m[0].slice(0, 60) });
      break;
    }
  }
  return hits;
}

const hasColorReference = (text) => colorReferencesIn(text).length > 0;

// PROPER_NOUN_PAIR exported (batch-3 item 29) so a serialized in-page matcher can carry the SAME guard the
// Node-side detector applies — the vocabulary stays single-sourced here either way.
module.exports = { COLOR_WORDS, UI_NOUNS, PRESENT_VERBS, PATTERNS, PROPER_NOUN_PAIR, colorReferencesIn, hasColorReference };
