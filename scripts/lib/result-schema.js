// Canonical result schema constants — encodes eval-results/RESULT-CONTRACT.md.
// Pure data + tiny helpers; consumed by result-builder.js and the tests.
'use strict';

const VERDICTS = ['REPRODUCED', 'PARTIAL', 'NOT REPRODUCED', 'N/A'];
const BUCKETS = ['normative', 'at-compat', 'best-practice'];

const SKILLS = [
  'name-role-state', 'color-and-visual-text', 'keyboard-operability', 'focus-management',
  'focus-visibility', 'dynamic-announcement', 'reflow-and-pointer-affordances',
  'forms-instructions-errors', 'page-structure', 'grouping-and-reading-order',
];

// Dynamic (driver-exercised) skills — a definite verdict here on a notFound element is illegal.
const DYNAMIC_SKILLS = ['keyboard-operability', 'focus-management', 'focus-visibility', 'dynamic-announcement'];

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
  'page-structure': ['2.4.2', '2.4.6', '1.3.1'],
  'grouping-and-reading-order': ['1.3.1', '1.3.2', '2.4.3'],
};

const SC_LEVEL = {
  '1.1.1': 'A', '4.1.2': 'A', '2.4.4': 'A', '2.5.3': 'A',
  '1.4.3': 'AA', '1.4.11': 'AA', '1.4.1': 'A', '1.4.5': 'AA',
  '2.1.1': 'A', '2.1.2': 'A', '2.4.3': 'A', '2.4.11': 'AA', '2.4.7': 'AA', '2.4.13': 'AAA',
  '4.1.3': 'AA', '1.4.10': 'AA', '2.5.8': 'AA', '1.4.13': 'AA', '2.5.5': 'AAA',
  '3.3.1': 'A', '3.3.2': 'A', '3.3.3': 'AA', '2.4.2': 'A', '2.4.6': 'AA', '1.3.1': 'A', '1.3.2': 'A',
};

// Pull the first WCAG SC code out of an `sc` field that may read "1.4.3 Contrast".
function scCode(sc) { const m = String(sc || '').match(/\b\d\.\d{1,2}\.\d{1,2}\b/); return m ? m[0] : null; }

module.exports = { VERDICTS, BUCKETS, SKILLS, DYNAMIC_SKILLS, SKILL_SCS, SC_LEVEL, scCode };
