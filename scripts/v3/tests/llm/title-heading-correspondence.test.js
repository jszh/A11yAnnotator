'use strict';
// 2.4.2 — the TITLE ↔ PRIMARY-HEADING correspondence handed to page-title-v0.
//
// The F25/TT-12.B clause in page-title-v0 asks whether the <title> carries what the page's OWN heading says.
// Until this signal existed the judge had to do two things by eye off a screenshot: decide WHICH text on the
// page is the page naming itself, and then perform the word-level comparison. Both of the SC's residual errors
// on the two most recent corpus runs are failures of those two steps rather than of the judgment — one page
// whose <title> contains its <h1> verbatim was failed for omitting a subtitle line, and one page whose <title>
// is a strict PREFIX of its <h1> was cleared because prefix overlap was read as a match. So the lever is to
// answer both steps deterministically, exactly as resolveSummaryField does for 3.3.1; adding rubric prose
// telling the judge to look harder is the move that has repeatedly measured as inert.
//
// What these tests pin, in priority order:
//   1. the comparison is WORD-LEVEL, not substring — a prefix/partial overlap must NOT read as carrying;
//   2. extra title text (site name, section, separators, order) must NOT read as dropping;
//   3. the anchor is the page's own PRIMARY VISIBLE heading — hidden and off-screen headings are not identity;
//   4. it is fail-SAFE — no heading, no title, or nothing comparable ⇒ the signal is ABSENT, never a guess,
//      because an absent signal leaves the rubric's old viewport behaviour intact while a wrong one would be
//      acted on;
//   5. it stays a FACT: the emitted block never contains a verdict word.
const { test } = require('node:test');
const assert = require('node:assert/strict');

const { precomputeSignals } = require('../../lib/llm-adjudicator.js');

const h = (text, level = 1, extra = {}) => ({ tag: `h${level}`, role: 'heading', level, text, ariaHidden: false, offscreen: false, ...extra });
const corr = (title, headings) => {
  const s = precomputeSignals({ __pageStructure: { title, headings } }, 'page-structure', '2.4.2');
  return s.pageTitle.headingCorrespondence || null;
};

test('a title that contains every content word of the heading CARRIES it, whatever else it also says', () => {
  // the site/section wrapper, the separator, and the word order are all irrelevant to the clause
  for (const t of [
    'Quarterly Metrics — Acme Portal',
    'Acme Portal | Quarterly Metrics',
    'Acme :: quarterly  METRICS :: home',
  ]) {
    const c = corr(t, [h('Quarterly Metrics')]);
    assert.equal(c.titleCarriesHeadingWords, true, `expected "${t}" to carry the heading`);
    assert.deepEqual(c.headingWordsMissingFromTitle, []);
  }
});

test('a PREFIX of the heading does NOT carry it — the dropped words are reported verbatim', () => {
  // the failure mode this signal exists to remove: substring overlap read as a match
  const c = corr('Plate 12', [h('Plate 12: scarlet dahlia')]);
  assert.equal(c.titleCarriesHeadingWords, false);
  assert.deepEqual(c.headingWordsMissingFromTitle, ['scarlet', 'dahlia']);
  assert.equal(c.headingText, 'Plate 12: scarlet dahlia');
});

test('a heading the title omits entirely reports ALL of its content words', () => {
  const c = corr('Online Store', [h('Insulated Water Bottle — 750 ml')]);
  assert.equal(c.titleCarriesHeadingWords, false);
  assert.deepEqual(c.headingWordsMissingFromTitle, ['insulated', 'water', 'bottle', '750', 'ml']);
});

test('articles/prepositions and accents are folded, so they never read as a dropped discriminator', () => {
  assert.equal(corr('Report on the Cedar Basin', [h('Report of Cedar Basin')]).titleCarriesHeadingWords, true);
  assert.equal(corr('LAMINA 12', [h('Lámina 12')]).titleCarriesHeadingWords, true);
});

test('the fold is deliberately CONSERVATIVE — a pronoun is reported, and step 3 decides what it identifies', () => {
  // Widening the stop list until every "harmless" word disappears is how this becomes a substring test again.
  // A word that identifies nothing is meant to be VISIBLE to the judge and dismissed by it, not silently
  // deleted here — the signal reports the difference, the rubric decides whether the difference identifies.
  const c = corr('Contact — Riverside Branch', [h('Contact us — Riverside Branch')]);
  assert.equal(c.titleCarriesHeadingWords, false);
  assert.deepEqual(c.headingWordsMissingFromTitle, ['us']);
});

test('non-Latin headings compare by word, not by byte class', () => {
  const jp = corr('桜井市交通局', [h('32系統 みなと循環線 — 時刻表')]);
  assert.equal(jp.titleCarriesHeadingWords, false);
  assert.ok(jp.headingWordsMissingFromTitle.length > 0, 'a CJK heading must not silently compare as empty');
  const ar = corr('تاريخ الميلاد — البوابة', [h('تاريخ الميلاد')]);
  assert.equal(ar.titleCarriesHeadingWords, true);
});

test('the anchor is the SHALLOWEST heading, and hidden / off-screen headings are not the page identity', () => {
  // an h2 must not out-rank the h1 just by appearing first in the list
  assert.equal(corr('x', [h('Section two', 2), h('Real page name', 1)]).headingText, 'Real page name');
  // an aria-hidden or off-screen h1 presents the page's identity to nobody — skip to the next real heading
  assert.equal(corr('x', [h('Skip to content', 1, { offscreen: true }), h('Real page name', 2)]).headingText, 'Real page name');
  assert.equal(corr('x', [h('Decorative', 1, { ariaHidden: true }), h('Real page name', 2)]).headingText, 'Real page name');
});

test('FAIL-SAFE: nothing comparable ⇒ NO signal, so the rubric keeps reading the viewport', () => {
  assert.equal(corr('Some title', []), null, 'no headings at all');
  assert.equal(corr('Some title', [h('   ')]), null, 'a blank heading');
  assert.equal(corr('Some title', [h('•••')]), null, 'a heading with no content words');
  assert.equal(corr('Some title', [h('Real name', 1, { offscreen: true })]), null, 'every heading hidden');
  assert.equal(corr('', [h('Real name')]), null, 'no title');
  assert.equal(corr('   ', [h('Real name')]), null, 'a whitespace-only title');
  assert.equal(corr('Some title', undefined), null, 'no headings key at all');
});

test('the block stays a FACT — it carries no verdict, and the older pageTitle fields are untouched', () => {
  const s = precomputeSignals({ __pageStructure: { title: 'Quarterly Metrics — Acme', headings: [h('Quarterly Metrics')], frameTitles: [] } }, 'page-structure', '2.4.2');
  assert.equal(s.pageTitle.value, 'Quarterly Metrics — Acme');
  assert.equal(s.pageTitle.present, true);
  const block = s.pageTitle.headingCorrespondence;
  assert.ok(!('verdict' in block) && !('barrier' in block), 'the correspondence must not carry a decision field');
  const json = JSON.stringify(block);
  for (const w of ['REPRODUCED', 'PARTIAL', 'LIKELY_BARRIER', 'LIKELY_OK']) {
    assert.ok(!json.includes(w), `the correspondence must not hand the judge a verdict token (found "${w}")`);
  }
});

test('a page with no <h1>/heading keeps a byte-identical pageTitle block (no shape churn)', () => {
  const s = precomputeSignals({ __pageStructure: { title: 'T', headings: [] } }, 'page-structure', '2.4.2');
  assert.deepEqual(Object.keys(s.pageTitle), ['value', 'present']);
});
