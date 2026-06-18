// Canonical result schema constants — encodes docs/contracts/RESULT-CONTRACT.md.
// Pure data + tiny helpers; consumed by result-builder.js and the tests.
'use strict';

const VERDICTS = ['REPRODUCED', 'PARTIAL', 'NOT REPRODUCED', 'N/A'];
const BUCKETS = ['normative', 'at-compat', 'best-practice'];

const SKILLS = [
  'name-role-state', 'color-and-visual-text', 'keyboard-operability', 'focus-management',
  'focus-visibility', 'dynamic-announcement', 'reflow-and-pointer-affordances',
  'forms-instructions-errors', 'page-structure', 'grouping-and-reading-order',
  'media-alternatives', // Item 10 (1.2.x time-based-media alternatives)
  'timing-and-motion', // Item 14d (2.2.2 pause/stop/hide moving content)
];

// Dynamic (driver-exercised) skills — a definite verdict here on a notFound element is illegal.
const DYNAMIC_SKILLS = ['keyboard-operability', 'focus-management', 'focus-visibility', 'dynamic-announcement'];
// BEHAVIORAL skills — a DEFINITE verdict must be bound to (trusted + isolated) driver
// evidence (R2.4-B). Superset of DYNAMIC_SKILLS: forms error-identification is also
// behavioral (it rests on a trusted form submission), but is page/form-scoped.
const BEHAVIORAL_SKILLS = ['keyboard-operability', 'focus-management', 'focus-visibility', 'dynamic-announcement', 'forms-instructions-errors'];

// Allowed SCs per skill (RESULT-CONTRACT.md). REPRODUCED/PARTIAL must cite one of these.
const SKILL_SCS = {
  'name-role-state': ['1.1.1', '4.1.2', '2.4.4', '2.5.3'],
  'color-and-visual-text': ['1.4.3', '1.4.11', '1.4.1', '1.4.5'],
  'keyboard-operability': ['2.1.1', '2.1.2', '2.4.3'],
  'focus-management': ['2.4.3', '2.4.11', '2.4.7'],
  'focus-visibility': ['2.4.7', '2.4.13'],
  'dynamic-announcement': ['4.1.3'],
  'reflow-and-pointer-affordances': ['1.4.10', '2.5.8', '1.4.13', '2.5.5'],
  'forms-instructions-errors': ['3.3.1', '3.3.2', '3.3.3', '1.3.1'],
  'page-structure': ['2.4.2', '2.4.6', '1.3.1', '2.4.10'],
  'grouping-and-reading-order': ['1.3.1', '1.3.2', '2.4.3'],
  'media-alternatives': ['1.2.2', '1.2.1'], // Item 10: captions (1.2.2) + audio/video-only alternative (1.2.1)
  'timing-and-motion': ['2.2.2'], // Item 14d: pause/stop/hide auto-moving content
};

// Page-level skills live in results.pageSkills (not per element). They MUST be
// aggregated into the summary too (the audit: 128 reproduced page-skill verdicts).
const PAGE_SKILLS = ['page-structure', 'grouping-and-reading-order', 'reflow'];
const PAGE_SKILL_SCS = {
  'page-structure': ['2.4.2', '2.4.6', '1.3.1', '2.4.10'],
  'grouping-and-reading-order': ['1.3.1', '1.3.2', '2.4.3'],
  'reflow': ['1.4.10'],
};

const SC_LEVEL = {
  '1.1.1': 'A', '4.1.2': 'A', '2.4.4': 'A', '2.5.3': 'A',
  '1.4.3': 'AA', '1.4.11': 'AA', '1.4.1': 'A', '1.4.5': 'AA',
  '2.1.1': 'A', '2.1.2': 'A', '2.4.3': 'A', '2.4.11': 'AA', '2.4.7': 'AA', '2.4.13': 'AAA',
  '4.1.3': 'AA', '1.4.10': 'AA', '2.5.8': 'AA', '1.4.13': 'AA', '2.5.5': 'AAA',
  '3.3.1': 'A', '3.3.2': 'A', '3.3.3': 'AA', '2.4.2': 'A', '2.4.6': 'AA', '1.3.1': 'A', '1.3.2': 'A', '2.4.10': 'AAA',
  '1.2.2': 'A', '1.2.1': 'A', '2.2.2': 'A', // Item 10 media captions/alternative + Item 14d pause-stop-hide
};

// Pull the first WCAG SC code out of an `sc` field that may read "1.4.3 Contrast".
function scCode(sc) { const m = String(sc || '').match(/\b\d\.\d{1,2}\.\d{1,2}\b/); return m ? m[0] : null; }
// ALL SC codes in a field (a verdict may legitimately cite more than one).
function scCodes(sc) { return [...String(sc || '').matchAll(/\b\d\.\d{1,2}\.\d{1,2}\b/g)].map(m => m[0]); }

module.exports = { VERDICTS, BUCKETS, SKILLS, DYNAMIC_SKILLS, BEHAVIORAL_SKILLS, SKILL_SCS, PAGE_SKILLS, PAGE_SKILL_SCS, SC_LEVEL, scCode, scCodes };
