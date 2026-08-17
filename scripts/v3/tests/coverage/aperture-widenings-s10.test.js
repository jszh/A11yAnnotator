// Regression suite for the s10-residual APERTURE WIDENINGS (RCA `aug-annot-s10-tools`, Tier 1 #7/#8,
// Tier 2 #15/#17): five small, bounded enumeration widenings plus their guards. Every widening here
// is asserted POSITIVELY (the residual's shape now mints) and NEGATIVELY (the neighbouring shape that
// must NOT mint still doesn't) — the negative is the point: these are aperture changes, and the
// held-out rule says they must not flood.
//
// Targets (fixture SHAPES invented here, never fixture strings):
//   · 1.1.1/2.4.4  <area href> enumeration        (context-and-function-dependent-equivalence/case-03)
//   · 1.4.1        state-bearing widget roles      (ui-status-action-color-only-no-text-cue/case-05)
//   · 1.4.1        colour-reference lexicon: shading verbs, noun-in-colour, new UI nouns
//                                                 (image-chart-alt-omits-color-encoded-fact/case-03+05)
//   · 1.4.1        F13 mint on a colour-naming alt (same two cases)
//   · 4.1.3        muted-live-region mint          (wrong-live-region-politeness-for-urgency/case-01)
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const oracle = require('../../lib/applicability-oracle.js');
const { colorReferencesIn, hasColorReference } = require('../../lib/color-reference-lexicon.js');
const { buildV3 } = require('../../lib/build-v3.js');
const { withPipeline, promoted } = require('../helpers.js');

const PROMOTED = promoted([]);
const ID = { file: 'p', runId: 'R', pageDigest: 'sha256:d' };
const bundleWith = (elements) => withPipeline({
  collect: { ...ID, collectedAt: 1000, elements },
  experiments: { ...ID, catalogVersion: '3.0.0-phase0', startedAt: 2000, results: [] },
  claimProposals: { ...ID, proposals: [] },
});

// ===================================================================================
// 1 — <area href>: an image-map area IS a link and ALWAYS carries the region's alt, but the
// collectors give <area> no sampled role, so the role-based link/image branches both missed it and
// the map's failing areas carried NO obligation at all.
// ===================================================================================
test('<area href> enumerates 1.1.1 (non-text-content) + 2.4.4 (link-purpose)', () => {
  const area = { xpath: '/html/body/map[1]/area[1]', tag: 'area', href: '#ward-3', text: '', hasText: false };
  const fams = oracle.familiesFor(area);
  assert.ok(fams.includes('non-text-content'), 'an <area href> owes a text alternative (1.1.1)');
  assert.ok(fams.includes('link-purpose'), 'an <area href> owes link purpose (2.4.4)');
  assert.deepEqual(oracle.applicableScsFor(area), ['1.1.1', '2.4.4']);
});

test('GUARD: an <area> with NO href is not a link and mints nothing', () => {
  assert.deepEqual(oracle.familiesFor({ xpath: '/html/body/map[1]/area[2]', tag: 'area' }), []);
  assert.deepEqual(oracle.familiesFor({ xpath: '/html/body/map[1]/area[3]', tag: 'area', href: '' }), []);
});

test('end-to-end: an <area href> element yields ledger rows for both SCs (auto-PARTIAL, never absent)', () => {
  const r = buildV3(bundleWith([{ xpath: '/html/body/map[1]/area[1]', tag: 'area', href: '#north-wing' }]), { authority: PROMOTED });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  const scs = r.results.obligationLedger.map((o) => o.sc).sort();
  assert.deepEqual(scs, ['1.1.1', '2.4.4']);
  assert.ok(r.results.obligationLedger.every((o) => o.autoPartial), 'un-proposed area obligations surface as auto-PARTIAL');
});

// ===================================================================================
// 2 — 1.4.1 state-bearing widget roles: a role whose ARIA contract renders a checked/selected state
// is exactly the surface where that state can be colour-only. Roles precisely; a plain button is not.
// ===================================================================================
test('1.4.1: every state-bearing widget role enumerates use-of-color', () => {
  for (const role of ['switch', 'checkbox', 'radio', 'tab', 'option', 'menuitemcheckbox', 'menuitemradio']) {
    const el = { xpath: '/w', tag: role === 'switch' ? 'button' : 'div', role };
    assert.ok(oracle.familiesFor(el).includes('use-of-color'), `role=${role} should owe 1.4.1`);
  }
});

test('GUARD: a plain button / link-less widget does NOT ride the state-bearing widening', () => {
  // button and menuitem carry no rendered binary state — they were excluded on purpose.
  assert.ok(!oracle.familiesFor({ xpath: '/b', tag: 'button', role: 'button' }).includes('use-of-color'));
  assert.ok(!oracle.familiesFor({ xpath: '/m', tag: 'div', role: 'menuitem' }).includes('use-of-color'));
  // …and a bare div with no role at all obviously not.
  assert.ok(!oracle.familiesFor({ xpath: '/d', tag: 'div', text: 'hello', hasText: true }).includes('use-of-color'));
});

// ===================================================================================
// 3 — colour-reference lexicon widenings. Constructions only, word-boundary anchored: the shading/
// fill verbs, the noun-in-colour mirror of the colour-noun pattern, and the chart/status UI nouns.
// ===================================================================================
test('lexicon: shading/fill verbs fire the presentation-predicate construction', () => {
  assert.ok(hasColorReference('Branches with outages are shaded red; restored branches are shaded grey.'));
  assert.ok(hasColorReference('Completed steps are tinted green.'));
  assert.ok(hasColorReference('Overdue rows are filled in red.'));
});

test('lexicon: the <noun> in <colour> construction fires (NOUN-first, mirror of colour-noun)', () => {
  const hits = colorReferencesIn('Switches in blue are locked until review.');
  assert.ok(hits.some((h) => h.pattern === 'ui-noun-in-colour'), JSON.stringify(hits));
  assert.ok(hasColorReference('Badges in amber are provisional.'));
  assert.ok(hasColorReference('Any tile in red needs attention.'));
});

test('lexicon: the new UI nouns fire through the colour-noun construction too', () => {
  for (const s of ['a green tile marks a vacant desk', 'a red badge counts unread alerts', 'grey pills are inactive here', 'an amber chip flags a delay']) {
    assert.ok(hasColorReference(s), s);
  }
});

test('lexicon NEGATIVE: bare colour words in ordinary prose still match nothing', () => {
  for (const s of [
    'Notes of bergamot, dried fig, and white pepper.',
    'Rye sourdough with black garlic folded through.',
    'Ushers in crimson blazers welcomed the delegates.',  // person-noun, not a UI noun
    'The green tomato is pickled first.',
  ]) assert.deepEqual(colorReferencesIn(s), [], s);
});

test('lexicon NEGATIVE: word boundaries hold — no substring can fire the new entries', () => {
  for (const s of [
    'The window tinting service was quick.',   // "tint" inside "tinting"
    'Please refill the printer tray.',         // "fill" inside "refill"
    'Lampshades and switchboards were sold.',  // "shade"/"switch" inside longer words
    'The mapping tiles loaded slowly.',        // "map" inside "mapping" ("tiles" alone has no colour)
  ]) assert.deepEqual(colorReferencesIn(s), [], s);
});

test('lexicon NEGATIVE: a colour word used as a proper noun does not fire (Capitalized pair guard)', () => {
  for (const s of [
    'Analysts toured the Orange Region data centre.',               // "Orange Region" + the pre-existing noun "region"
    'Shipping through the Red Sea region slowed.',                  // "Red Sea" + the pre-existing noun "region"
    'Tourists gathered in Red Square yesterday.',                   // "Red Square" + the pre-existing noun "square"
  ]) assert.deepEqual(colorReferencesIn(s), [], s);
  // …while a sentence-initial colour reference (lowercase successor) still fires, and so does ALL-CAPS UI text.
  assert.ok(hasColorReference('Green buttons advance the application.'));
  assert.ok(hasColorReference('GREEN BUTTONS ADVANCE THE APPLICATION.'));
});

// ===================================================================================
// 4 — F13 mint: an image whose OWN text alternative names a colour construction owes 1.4.1 on the
// image itself (F13 fails both 1.1.1 and 1.4.1). Bounded by the construction lexicon — a plain photo
// alt can never fire it, so the plain-<img> exclusion the aperture comment defends stays intact.
// ===================================================================================
test('F13: an <img> whose alt names its own colour coding enumerates use-of-color', () => {
  const img = { xpath: '/i', tag: 'img', role: 'img', alt: 'Depots with delays are shaded red; on-time depots are shaded grey.' };
  const fams = oracle.familiesFor(img);
  assert.ok(fams.includes('use-of-color'), 'a colour-naming alt mints 1.4.1 on the image');
  assert.ok(fams.includes('non-text-content') && fams.includes('images-of-text'), 'the 1.1.1/1.4.5 families are untouched');
  assert.deepEqual(oracle.applicableScsFor(img), ['1.1.1', '1.4.1', '1.4.5']);
});

test('F13: the axName channel fires too (act-page-collect folds alt/aria-label into axName)', () => {
  const img = { xpath: '/i', tag: 'img', sampledRole: 'img', axName: 'Overview grid: tiles in amber are degraded this hour.' };
  assert.ok(oracle.familiesFor(img).includes('use-of-color'));
});

test('F13 GUARD: a plain img with no colour word gets NO 1.4.1 obligation', () => {
  const img = { xpath: '/i', tag: 'img', role: 'img', alt: 'Team photo' };
  assert.ok(!oracle.familiesFor(img).includes('use-of-color'));
  assert.deepEqual(oracle.applicableScsFor(img), ['1.1.1', '1.4.5'], 'the fifth-pass Rule-16 img contract is unchanged');
  // a bare colour word in a photo alt is prose, not a construction — still no mint.
  assert.ok(!oracle.familiesFor({ xpath: '/i2', tag: 'img', role: 'img', alt: 'A red barn at sunset' }).includes('use-of-color'));
});

test('F13 GUARD: a removed-from-tree image does not mint 1.4.1 (AT receives no alternative at all)', () => {
  const img = { xpath: '/i', tag: 'img', role: 'img', removedFromA11yTree: true, axName: 'bars shaded red are provisional' };
  assert.ok(!oracle.familiesFor(img).includes('use-of-color'));
});

// ===================================================================================
// 5 — muted-live-region mint (4.1.3): live-region-SHAPED but silenced to AT. The liveRegion gate
// anchors 4.1.3 to elements that are already correct; this is its exact inverse.
// ===================================================================================
test('4.1.3 muted: aria-live present but not live (aria-live="off") mints status-message', () => {
  // act-page-collect sets liveRegion=true ONLY for polite/assertive or a live role, so aria-live in
  // ariaAttrs with liveRegion false ⇔ aria-live="off"/invalid.
  const el = { xpath: '/d', tag: 'div', ariaAttrs: ['aria-live'], liveRegion: false, text: 'Queue: 7 waiting', hasText: true };
  assert.ok(oracle.familiesFor(el).includes('status-message'));
  assert.ok(oracle.mutedLiveRegionShape(el));
});

test('4.1.3 muted: aria-atomic/aria-relevant with no live role and no live aria-live mints', () => {
  assert.ok(oracle.familiesFor({ xpath: '/d', tag: 'div', ariaAttrs: ['aria-atomic'] }).includes('status-message'));
  assert.ok(oracle.familiesFor({ xpath: '/d', tag: 'div', ariaAttrs: ['aria-relevant'] }).includes('status-message'));
});

test('4.1.3 muted: an <output> whose native status role is overridden away mints', () => {
  assert.ok(oracle.familiesFor({ xpath: '/o', tag: 'output', role: 'none' }).includes('status-message'));
});

test('4.1.3 GUARD: a real live region is NOT double-minted by the muted lane', () => {
  // aria-live="polite" ⇒ collector sets liveRegion:true ⇒ the muted predicate must refuse, and the
  // family list carries status-message exactly once (via the liveRegion gate).
  const polite = { xpath: '/d', tag: 'div', ariaAttrs: ['aria-live', 'aria-atomic'], liveRegion: true };
  assert.equal(oracle.mutedLiveRegionShape(polite), false, 'the muted lane refuses a live element');
  assert.deepEqual(oracle.familiesFor(polite).filter((f) => f === 'status-message'), ['status-message'], 'exactly one status-message family');
  // an explicit live ROLE with no aria-live at all is the same case.
  assert.equal(oracle.mutedLiveRegionShape({ xpath: '/s', tag: 'div', role: 'status', ariaAttrs: ['aria-atomic'] }), false);
});

test('4.1.3 GUARD: ordinary elements with no live-region plumbing mint nothing here', () => {
  for (const el of [
    { xpath: '/d', tag: 'div', text: 'hello', hasText: true },
    { xpath: '/d2', tag: 'div', ariaAttrs: ['aria-label'] },      // aria-* presence alone is not plumbing
    { xpath: '/o', tag: 'output' },                                // a PLAIN <output> is a real live region — the
                                                                   // liveRegion fact's job, not the muted lane's
  ]) assert.ok(!oracle.familiesFor(el).includes('status-message'), JSON.stringify(el));
});

test('F13 GUARD: ordinary photo alts with polysemous colour+noun phrases do NOT mint (strong constructions only)', () => {
  // Adversarial soundness finding #5: "box" and "field" are UI nouns, so the weak colour+noun pattern
  // fired on plain photography. The F13 mint requires a STRONG construction (presentation verb,
  // noun-in-colour legend sentence, or explicit colour-coding vocabulary).
  for (const alt of [
    'A blue box truck parked outside the depot.',
    'A woman walking through a green field at sunset.',
    'Red row houses along the canal in morning light.',
  ]) {
    const img = { xpath: '/i', tag: 'img', sampledRole: 'img', alt };
    assert.ok(!oracle.familiesFor(img).includes('use-of-color'), `photo alt must not mint: ${alt}`);
  }
  // …while a strong construction still does (the legend-sentence and presentation-verb shapes).
  for (const alt of [
    'Chart of eight depots as tiles: tiles shown in green are stocked.',
    'Rows with failed checks are shaded red on the grid.',
  ]) {
    const img = { xpath: '/i', tag: 'img', sampledRole: 'img', alt };
    assert.ok(oracle.familiesFor(img).includes('use-of-color'), `strong construction must mint: ${alt}`);
  }
});
