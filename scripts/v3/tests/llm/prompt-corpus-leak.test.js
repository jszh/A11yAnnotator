// PROMPT HYGIENE GATE — no eval-set information may reach a judge's prompt.
//
// Rubrics are prompts. Every worked example in one is read by the model that is about to be SCORED on the
// eval corpus, so an example lifted from a corpus page — or worse, one that states a page's ground-truth
// LABEL — teaches to the test and silently inflates every number the harness reports. This is easy to do by
// accident while root-causing: you are staring at the failing page when you write the clause.
//
// This test caught real instances of both kinds, including one that had been shipped for months
// ("confirmed against this project's own held-out corpus ground truth: an alt=… is a Pass, not a Fail").
//
// What is ALLOWED, and why:
//   · quotes from the normative sources — WCAG SC text, Understanding docs, F/G techniques, ACT rules, the
//     DHS Trusted Tester procedure and its published worked examples. These are the requirement, and citing
//     them is the whole basis on which a rubric argues. They are public and independent of our eval set.
//   · ARIA/HTML tokens and signal field names ("presentation", "aria-live", "region pre-existed").
//   · short generic archetypes that no corpus page is the source of.
// What is FORBIDDEN:
//   · any statement of a case's expected/ground-truth outcome, or reference to the eval corpus as evidence;
//   · a corpus case/family identifier;
//   · a distinctive multi-word prose example that appears verbatim in a corpus page.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const RUBRIC_DIR = path.join(__dirname, '..', '..', 'llm-rubrics');
const CORPUS_ROOT = path.join(__dirname, '..', '..', '..', '..', 'eval', 'act-augmented');

const rubrics = fs.readdirSync(RUBRIC_DIR).filter((f) => f.endsWith('.md'))
  .map((f) => ({ file: f, text: fs.readFileSync(path.join(RUBRIC_DIR, f), 'utf8') }));

test('no rubric cites the eval corpus or a case ground-truth label', () => {
  // Phrases that can only be about our own scored dataset. Normative citations never need these words.
  const BANNED = [
    /held-out corpus/i,
    /ground[- ]truth/i,
    /\bGT[- ](pass|fail)/i,
    /\bscored (a )?(Pass|Fail)\b/,
    /is a Pass, not a Fail/i,
    /\bthe (eval|evaluation) (set|corpus)\b/i,
    /\bcase-\d{2}\b/,
    /\btestcase(Id)?\b/i,
    /act-augmented/i,
  ];
  const bad = [];
  for (const { file, text } of rubrics) {
    for (const re of BANNED) {
      const m = text.match(re);
      if (m) bad.push(`${file}: /${re.source}/ matched ${JSON.stringify(m[0])}`);
    }
  }
  assert.deepEqual(bad, [], `a rubric refers to the eval set:\n${bad.join('\n')}`);
});

test('no rubric names a corpus case family', () => {
  if (!fs.existsSync(CORPUS_ROOT)) return; // corpus not checked out — nothing to compare against
  const families = [];
  for (const sc of fs.readdirSync(CORPUS_ROOT)) {
    const pages = path.join(CORPUS_ROOT, sc, 'pages');
    if (!/^\d/.test(sc) || !fs.existsSync(pages)) continue;
    for (const d of fs.readdirSync(pages)) if (fs.statSync(path.join(pages, d)).isDirectory()) families.push(d);
  }
  const bad = [];
  for (const { file, text } of rubrics) {
    for (const fam of families) if (text.includes(fam)) bad.push(`${file} names the case family "${fam}"`);
  }
  assert.deepEqual(bad, [], bad.join('\n'));
});

test('no distinctive rubric example appears verbatim in a corpus page', () => {
  if (!fs.existsSync(CORPUS_ROOT)) return;
  let corpus = '';
  for (const sc of fs.readdirSync(CORPUS_ROOT)) {
    const pages = path.join(CORPUS_ROOT, sc, 'pages');
    if (!/^\d/.test(sc) || !fs.existsSync(pages)) continue;
    for (const d of fs.readdirSync(pages)) {
      const dir = path.join(pages, d);
      if (!fs.statSync(dir).isDirectory()) continue;
      for (const f of fs.readdirSync(dir)) if (f.endsWith('.html')) corpus += fs.readFileSync(path.join(dir, f), 'utf8').replace(/\s+/g, ' ') + '\n';
    }
  }
  // Quoted prose of 12+ chars. Anything shorter is a token, not an example.
  // ALLOWED-list: quotes whose source is a requirement document (checked by hand, each with its citation).
  const ALLOWED = new Set([
    'presentation', 'misrepresentation',                 // ARIA role value / an ordinary English word
    'region pre-existed',                                // a signal field name, not page content
    'Untitled Document',                                 // a literal editor default the rubric must name
    'on the right',                                      // Understanding 1.3.3's own example phrase
    'Online Banking',                                    // DHS Trusted Tester 5.C's published worked example
    'Enter a valid email', 'Get in touch', 'this article', // stock archetypes, older than this corpus
  ]);
  const bad = [];
  for (const { file, text } of rubrics) {
    for (const m of text.matchAll(/["“]([^"“”\n]{12,90})["”]/g)) {
      const q = m[1].trim();
      if (!/^[a-zA-Z][a-zA-Z0-9 ,.'’&%—-]{11,}$/.test(q)) continue;   // prose-like only
      if (ALLOWED.has(q)) continue;
      if (corpus.includes(q)) bad.push(`${file} quotes ${JSON.stringify(q)}, which appears verbatim in a corpus page`);
    }
  }
  assert.deepEqual(bad, [], `${bad.length} rubric example(s) taken from the eval set:\n${bad.join('\n')}`);
});

// ===================================================================================
// EVERY PROMPT SURFACE, not just the rubric files.
//
// A rubric is the biggest prompt surface but far from the only one. These also reach a judge verbatim:
//   · cdp-tool-catalog.js  `when:`   — the per-tool when-to-use line injected into the tool block
//   · llm-adjudicator.js   `note:`   — the explanatory note attached to each precomputed signal
//   · micro-checks.js      `text:`   — the per-cue boolean micro-rubrics
//   · broad-scope-llm-review.js      — the broad-scope packet prompts
//   · run-instruments.js / status-detector.js  `detail:` — finding text that rides into the ledger
//     and, from there, into the evidence a judge reads.
// A corpus-derived example in ANY of them teaches to the test exactly as a rubric one does, so the gate
// covers the lot. Only string LITERALS are checked: comments never reach a prompt, and the code is dense
// with them precisely because the reasoning is recorded next to the decision.
// ===================================================================================
const PROMPT_SOURCES = [
  'cdp-tool-catalog.js', 'llm-adjudicator.js', 'micro-checks.js',
  'broad-scope-llm-review.js', 'run-instruments.js', 'status-detector.js',
  'collect-error-summary.js', 'collect-colour-peers.js', 'collect-faux-columns.js',
  'collect-styling-outliers.js', 'color-reference-lexicon.js', 'collect-tables.js',
  // act-page-collect.js hosts page-side collectors of its own whose `uncertainReason` strings ride into a
  // prompt exactly as a rubric clause does; it belongs in the gate for the same reason every file above does.
  'act-page-collect.js',
  // leak-audit coverage gap (2026-08-17): collect-link-facts.js ships link/heading text into prompts (all
  // page-derived and clipped today, but an authored string added later must be visible to this gate), and
  // kbd-graph.js's sweep output composes into prompt-bound findings (labels are page text; same rationale).
  'collect-link-facts.js', 'kbd-graph.js',
  // leak-audit coverage gap (2026-08-17, batch-2 review): broad-scope-probes.js became a per-case prompt
  // contributor (visualHeadings entries + authored reason/note strings ride into the adjudicator note), and
  // confusable-text.js kind tokens reach uncertainReason strings.
  'broad-scope-probes.js', 'confusable-text.js',
  // leak-audit coverage gap (2026-08-18, batch-3 review): exp-runners.js now emits prose-adjacent
  // measurement fields (redundantWithVisibleText.localTextSample/.matchedBy, reshowIntegrity,
  // hoverTravel) — not prompt-bound today, but one wiring change away; same defensive rationale
  // as every entry above.
  'exp-runners.js',
];

// Strip comments so a `// measured on case-03` note never trips the gate — only shipped strings count.
function stringLiteralsOf(src) {
  const noBlock = src.replace(/\/\*[\s\S]*?\*\//g, ' ');
  const noLine = noBlock.split('\n').map((l) => {
    // crude but adequate: drop from an unquoted // to end of line
    let inS = null, out = '';
    for (let i = 0; i < l.length; i++) {
      const c = l[i], p = l[i - 1];
      if (inS) { out += c; if (c === inS && p !== '\\') inS = null; continue; }
      if (c === '"' || c === "'" || c === '`') { inS = c; out += c; continue; }
      if (c === '/' && l[i + 1] === '/') break;
      out += c;
    }
    return out;
  }).join('\n');
  return [...noLine.matchAll(/'((?:[^'\\]|\\.)*)'|"((?:[^"\\]|\\.)*)"|`((?:[^`\\]|\\.)*)`/g)]
    .map((m) => m[1] || m[2] || m[3] || '').filter((x) => x.length >= 12);
}

test('no PROMPT-BOUND string literal names a corpus case family', () => {
  if (!fs.existsSync(CORPUS_ROOT)) return;
  const families = [];
  for (const sc of fs.readdirSync(CORPUS_ROOT)) {
    const pages = path.join(CORPUS_ROOT, sc, 'pages');
    if (!/^\d/.test(sc) || !fs.existsSync(pages)) continue;
    for (const d of fs.readdirSync(pages)) if (fs.statSync(path.join(pages, d)).isDirectory()) families.push(d);
  }
  const bad = [];
  for (const f of PROMPT_SOURCES) {
    const fp = path.join(__dirname, '..', '..', 'lib', f);
    if (!fs.existsSync(fp)) continue;
    for (const lit of stringLiteralsOf(fs.readFileSync(fp, 'utf8'))) {
      for (const fam of families) if (lit.includes(fam)) bad.push(`${f}: string literal names case family "${fam}"`);
    }
  }
  assert.deepEqual(bad, [], bad.join('\n'));
});

test('no PROMPT-BOUND string literal states a ground-truth outcome or cites the eval set', () => {
  const BANNED = [/held-out corpus/i, /ground[- ]truth/i, /\bGT[- ](pass|fail)/i, /is a Pass, not a Fail/i, /act-augmented/i, /\bcase-\d{2}\b/];
  const bad = [];
  for (const f of PROMPT_SOURCES) {
    const fp = path.join(__dirname, '..', '..', 'lib', f);
    if (!fs.existsSync(fp)) continue;
    for (const lit of stringLiteralsOf(fs.readFileSync(fp, 'utf8'))) {
      for (const re of BANNED) { const m = lit.match(re); if (m) bad.push(`${f}: ${JSON.stringify(m[0])} in a shipped string`); }
    }
  }
  assert.deepEqual(bad, [], bad.join('\n'));
});
