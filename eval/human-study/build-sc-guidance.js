#!/usr/bin/env node
/**
 * build-sc-guidance.js - one sentence per success criterion, in WCAG's words.
 *
 * The evaluation view opens with a plain statement of what the criterion asks
 * for. It has to be WCAG's own language rather than a paraphrase of mine: the
 * participant's judgement is the study's measurement, and a sentence I wrote
 * would be a variable nobody had accounted for.
 *
 * Most of it comes from `categories.json`, whose per-SC text is already the
 * "In Brief" wording from the WCAG 2.2 Understanding documents, under the W3C
 * Document License. Five of the sampled criteria are not in that file - they
 * arrived with the ACT-REST expansion and the categories.json merge is still an
 * open decision - so their "In Brief" entries are recorded here verbatim from
 * the same source, with the URL each came from. categories.json itself is left
 * alone.
 *
 * Fails if any criterion in the sample has no sentence: the alternative is a
 * participant opening the dialog to a blank first line.
 *
 * Usage: node eval/human-study/build-sc-guidance.js [--check]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const CATEGORIES = path.join(ROOT, 'categories.json');
const SAMPLE = path.join(ROOT, 'eval/human-study/sample/study-sample-200.json');
const OUT = path.join(ROOT, 'eval/human-study/sc-guidance.json');
const CHECK = process.argv.includes('--check');

// Retrieved from the WCAG 2.2 Understanding documents, "In Brief" sections.
// Copyright (c) 2024 W3C, reproduced under the W3C Document License. Note that
// 1.4.12's block is headed "Author task" rather than "What to do"; the wording
// below is the one that block carries.
const EXTRA = {
  '1.4.4': { title: 'Resize Text', level: 'AA',
    goal: 'Text can be enlarged.',
    what_to_do: 'Ensure text can be doubled in size.',
    understanding_url: 'https://www.w3.org/WAI/WCAG22/Understanding/resize-text' },
  '1.4.12': { title: 'Text Spacing', level: 'AA',
    goal: 'Users can adjust text spacing to make it easier to read.',
    what_to_do: 'Ensure content adapts to user-defined text settings.',
    understanding_url: 'https://www.w3.org/WAI/WCAG22/Understanding/text-spacing' },
  '2.2.1': { title: 'Timing Adjustable', level: 'A',
    goal: 'Users have enough time to read and use content.',
    what_to_do: 'Let users turn off, adjust, or extend time limits.',
    understanding_url: 'https://www.w3.org/WAI/WCAG22/Understanding/timing-adjustable' },
  '2.2.2': { title: 'Pause, Stop, Hide', level: 'A',
    goal: 'Fewer users are distracted by content that updates or moves.',
    what_to_do: 'Let users control content changes that occur in parallel with other content.',
    understanding_url: 'https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide' },
  '2.5.3': { title: 'Label in Name', level: 'A',
    goal: 'Speech-input users can operate controls by their visible labels.',
    what_to_do: 'Where practical, make the control’s text label and name match.',
    understanding_url: 'https://www.w3.org/WAI/WCAG22/Understanding/label-in-name' },
};

const cats = JSON.parse(fs.readFileSync(CATEGORIES, 'utf8'));
const sample = JSON.parse(fs.readFileSync(SAMPLE, 'utf8'));

const guidance = {};
for (const [key, cat] of Object.entries(cats)) {
  if (key === '_meta') continue;
  for (const sc of cat.wcag_sc || []) {
    if (!sc.what_to_do) continue;
    guidance[sc.id] = {
      title: sc.title, level: sc.level,
      sentence: sc.what_to_do,
      goal: sc.goal || '',
      url: sc.understanding_url || '',
      from: 'categories.json',
    };
  }
}
for (const [id, sc] of Object.entries(EXTRA)) {
  if (guidance[id]) continue; // categories.json wins if it ever gains one
  guidance[id] = { title: sc.title, level: sc.level, sentence: sc.what_to_do, goal: sc.goal, url: sc.understanding_url, from: 'w3.org' };
}

const need = [...new Set(sample.cases.map((c) => c.sc))].sort();
const missing = need.filter((sc) => !guidance[sc]);
if (missing.length) {
  console.error(`FAIL - no sentence for ${missing.length} sampled criterion/criteria: ${missing.join(', ')}`);
  process.exit(1);
}

const out = {
  schema: 'human-study-sc-guidance/1',
  source: 'WCAG 2.2 Understanding documents, "In Brief" sections',
  license: 'W3C Document License (https://www.w3.org/copyright/document-license/)',
  attribution: 'Copyright © 2024 World Wide Web Consortium (W3C).',
  guidance,
};
if (CHECK) {
  const have = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : '';
  const want = `${JSON.stringify(out, null, 2)}\n`;
  if (have !== want) { console.error(`FAIL - ${path.relative(ROOT, OUT)} is out of date; re-run without --check`); process.exit(1); }
  console.log(`ok - ${need.length} sampled criteria all have a sentence`);
} else {
  fs.writeFileSync(OUT, `${JSON.stringify(out, null, 2)}\n`);
  console.log(`sc guidance -> ${path.relative(ROOT, OUT)}`);
  console.log(`  criteria in file   ${Object.keys(guidance).length}`);
  console.log(`  sampled criteria   ${need.length}, all covered`);
  console.log(`  from categories    ${Object.values(guidance).filter((g) => g.from === 'categories.json').length}`);
  console.log(`  from w3.org        ${Object.values(guidance).filter((g) => g.from === 'w3.org').length}`);
}
