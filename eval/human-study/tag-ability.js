#!/usr/bin/env node
/**
 * tag-ability.js - record, per case, which ability a participant needs in order
 * to reach a verdict on it.
 *
 * Three buckets, decided by one question: WHAT MUST THE PARTICIPANT PERCEIVE?
 *
 *   vision        the verdict depends on rendered pixels - contrast, a visible
 *                 focus indicator, whether something is a picture of text,
 *                 what an image depicts, where a label sits on screen.
 *   screenreader  the verdict depends on what assistive technology reports.
 *                 A SIGHTED participant with VoiceOver or NVDA can do these;
 *                 the requirement is the AT output, not blindness.
 *   other         neither is required. Keyboard operation, reading the DOM,
 *                 judging a title or a heading - a participant with or without
 *                 sight can reach the same verdict.
 *
 * Two of these were decided by looking at the cases rather than at WCAG:
 *
 *   2.4.4 link-purpose reads like a text task, but 18 of the 21 links in this
 *   sample have NO visible text at all - they are image links and poster tiles,
 *   so the purpose has to come from the picture.
 *
 *   1.1.1 has no `alt` attribute at all on 20 of its 26 cases, which makes
 *   "is there a text alternative" a code check - but deciding whether a missing
 *   alt is a FAILURE means deciding whether the image is decorative, and that
 *   needs seeing it.
 *
 * 1.3.1 and 2.5.3 need the visible presentation AND the accessible name. They
 * are vision, not a fourth bucket: a sighted expert can read an accessible name
 * out of devtools, but a blind expert cannot obtain the visible label at all.
 *
 * The table is keyed by SC because that is the unit the operator staffs on. It
 * is not a perfect fit for every case - C050 (2.4.3) is defined against the
 * visual reading order, and C007 (3.3.1) needs to see an error state - and
 * those exceptions are recorded on the case as `abilityNote` rather than being
 * silently averaged away.
 *
 * Refuses to run if the sample contains an SC this table does not cover, so a
 * re-drawn sample cannot come out quietly mis-tagged.
 *
 * Additive and idempotent. Usage:
 *   node eval/human-study/tag-ability.js [--sample=<file>] [--dry]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const m = /^--([^=]+)(?:=(.*))?$/.exec(a);
  return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true];
}));
const SAMPLE = path.resolve(ROOT, args.sample || 'eval/human-study/sample/study-sample-200.json');

const ABILITY_BY_SC = {
  '1.1.1': 'vision',        // what the image depicts, and whether it is decorative
  '1.3.1': 'vision',        // visual structure vs markup; visible label vs the attached one
  '1.4.1': 'vision',        // colour is the whole question
  '1.4.3': 'vision',        // rendered pixels
  '1.4.4': 'vision',        // clipping and overlap at 200%
  '1.4.5': 'vision',        // text, or a picture of text
  '1.4.12': 'vision',       // clipping under the spacing overrides
  '1.4.13': 'vision',       // content appearing and disappearing
  '2.2.2': 'vision',        // motion
  '2.4.4': 'vision',        // 18 of 21 links carry no visible text
  '2.4.7': 'vision',        // "visible" is the criterion
  '2.5.3': 'vision',        // the VISIBLE label, against the accessible name
  '4.1.2': 'screenreader',  // what AT reports about name, role and state
  '4.1.3': 'screenreader',  // announced without focus - unverifiable any other way
  '2.1.1': 'other',         // keyboard
  '2.1.2': 'other',         // keyboard
  '2.2.1': 'other',         // a timed refresh, from the code
  '2.4.2': 'other',         // reading the title
  '2.4.3': 'other',         // keyboard; see the note on C050
  '2.4.6': 'other',         // reading a heading or a label
  '3.3.1': 'other',         // submit, then look for the error text
};

/**
 * Cases whose SC-level bucket is not the whole truth. Recorded, not applied:
 * moving individual cases would break the property that the arms are describable
 * as "these criteria", which is how the study gets reported.
 */
const CASE_NOTES = {
  C050: 'tab order is judged against the VISUAL reading order, so this one case needs sight',
  C007: 'the field is flagged in an error state at rest by styling alone, so seeing it is required',
};

const sample = JSON.parse(fs.readFileSync(SAMPLE, 'utf8'));
const uncovered = [...new Set(sample.cases.map((c) => c.sc))].filter((sc) => !ABILITY_BY_SC[sc]);
if (uncovered.length) {
  console.error(`FAIL - no ability recorded for ${uncovered.length} criterion/criteria: ${uncovered.join(', ')}`);
  console.error('Add them to ABILITY_BY_SC rather than letting the sample tag itself as "other".');
  process.exit(1);
}

const counts = {};
for (const c of sample.cases) {
  c.ability = ABILITY_BY_SC[c.sc];
  if (CASE_NOTES[c.caseId]) c.abilityNote = CASE_NOTES[c.caseId];
  else delete c.abilityNote;
  counts[c.ability] = (counts[c.ability] || 0) + 1;
}
sample.abilityTaggedAt = new Date().toISOString();
sample.abilityBySc = ABILITY_BY_SC;

if (!args.dry) fs.writeFileSync(SAMPLE, `${JSON.stringify(sample, null, 2)}\n`);
console.log(`${args.dry ? 'DRY - ' : ''}ability -> ${path.relative(ROOT, SAMPLE)}`);
for (const k of ['vision', 'screenreader', 'other']) console.log(`  ${k.padEnd(13)} ${counts[k] || 0}`);
const noted = sample.cases.filter((c) => c.abilityNote);
console.log(`  ${'noted'.padEnd(13)} ${noted.length} case(s) whose SC bucket is not the whole truth: ${noted.map((c) => c.caseId).join(', ')}`);
