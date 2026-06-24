#!/usr/bin/env node
// Builds a per-SC resource manifest for the ACT-augmentation goal.
// For each in-scope SC, resolve every reference document + every existing ACT
// rule and test case so the construction workflow can hand exact paths to agents.
//
// Output: eval/act-augmented/_resources/<sc>.json  (+ index.json)
const fs = require('fs');
const path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..'); // repo root
const OUT = path.join(__dirname, '..', '_resources');
fs.mkdirSync(OUT, { recursive: true });

const rd = (p) => fs.readFileSync(path.join(ROOT, p), 'utf8');
const rj = (p) => JSON.parse(rd(p));
const exists = (p) => fs.existsSync(path.join(ROOT, p));

// SC -> understanding-doc slug
const UNDERSTANDING = {
  '1.1.1': 'non-text-content', '1.3.1': 'info-and-relationships',
  '1.3.2': 'meaningful-sequence', '1.4.1': 'use-of-color',
  '1.4.3': 'contrast-minimum', '1.4.5': 'images-of-text',
  '1.4.10': 'reflow', '1.4.11': 'non-text-contrast',
  '1.4.13': 'content-on-hover-or-focus', '2.1.1': 'keyboard',
  '2.1.2': 'no-keyboard-trap', '2.4.2': 'page-titled',
  '2.4.3': 'focus-order', '2.4.4': 'link-purpose-in-context',
  '2.4.6': 'headings-and-labels', '2.4.7': 'focus-visible',
  '2.4.10': 'section-headings', '3.3.1': 'error-identification',
  '3.3.2': 'labels-or-instructions', '3.3.3': 'error-suggestion',
  '4.1.2': 'name-role-value', '4.1.3': 'status-messages',
};
const SC_TITLE = {
  '1.1.1': 'Non-text Content', '1.3.1': 'Info and Relationships',
  '1.3.2': 'Meaningful Sequence', '1.4.1': 'Use of Color',
  '1.4.3': 'Contrast (Minimum)', '1.4.5': 'Images of Text',
  '1.4.10': 'Reflow', '1.4.11': 'Non-text Contrast',
  '1.4.13': 'Content on Hover or Focus', '2.1.1': 'Keyboard',
  '2.1.2': 'No Keyboard Trap', '2.4.2': 'Page Titled',
  '2.4.3': 'Focus Order', '2.4.4': 'Link Purpose (In Context)',
  '2.4.6': 'Headings and Labels', '2.4.7': 'Focus Visible',
  '2.4.10': 'Section Headings', '3.3.1': 'Error Identification',
  '3.3.2': 'Labels or Instructions', '3.3.3': 'Error Suggestion',
  '4.1.2': 'Name, Role, Value', '4.1.3': 'Status Messages',
};
const LEVEL = {
  '1.1.1':'A','1.3.1':'A','1.3.2':'A','1.4.1':'A','1.4.3':'AA','1.4.5':'AA',
  '1.4.10':'AA','1.4.11':'AA','1.4.13':'AA','2.1.1':'A','2.1.2':'A','2.4.2':'A',
  '2.4.3':'A','2.4.4':'A','2.4.6':'AA','2.4.7':'AA','2.4.10':'AAA','3.3.1':'A',
  '3.3.2':'A','3.3.3':'AA','4.1.2':'A','4.1.3':'AA',
};

const subset = rj('eval/checker-comparison/act-subset/subset.json');
const actManifest = rj('act-rules/act-rules-manifest.json');
const techManifest = rj('wcag-techniques/techniques-manifest.json');
const selectedScs = rj('eval/checker-comparison/act-subset/manifest.json').selectedScs;

// SC -> trusted-tester file
const ttFiles = fs.readdirSync(path.join(ROOT, 'refs/trusted-tester'))
  .filter(f => /^sc-[\d.]+-.*\.md$/.test(f));
const ttForSc = (sc) => {
  const f = ttFiles.find(f => f.startsWith(`sc-${sc}-`));
  return f ? `refs/trusted-tester/${f}` : null;
};

const index = {};
for (const sc of selectedScs) {
  const slug = UNDERSTANDING[sc];
  const understanding = slug ? `wcag-understanding/${slug}.html` : null;

  // ACT rules touching this SC
  const rules = actManifest.rules
    .filter(r => (r.in_scope_requirements || []).includes(sc))
    .map(r => ({
      id: r.id, name: r.name, status: r.status,
      implement: r.implement,
      notFullyAutomatable: (actManifest.not_fully_automatable || []).includes(r.id),
      extracted: exists(`act-rules/extracted/${r.id}.md`) ? `act-rules/extracted/${r.id}.md` : null,
      page: exists(`act-rules/pages/${r.id}.html`) ? `act-rules/pages/${r.id}.html` : null,
      url: r.url,
    }));

  // Test cases touching this SC (from the local approved+proposed subset)
  const cases = subset
    .filter(tc => (tc.sc || []).includes(sc))
    .map(tc => ({
      ruleId: tc.ruleId, ruleName: tc.ruleName,
      testcaseId: tc.testcaseId, expected: tc.expected,
      approved: tc.approved, localPath: tc.localPath,
      direct: (tc.scDirect || []).includes(sc),
    }))
    .filter(tc => tc.localPath && exists(`eval/checker-comparison/act-subset/${tc.localPath}`));
  const caseCounts = cases.reduce((a, c) => { a[c.expected] = (a[c.expected] || 0) + 1; return a; }, {});

  // Techniques for this SC
  const techniques = techManifest.techniques
    .filter(t => t.scs && Object.prototype.hasOwnProperty.call(t.scs, sc))
    .map(t => ({
      id: t.id, technology: t.technology, title: t.title,
      relation: t.scs[sc], // e.g. ["sufficient"], ["failure"], ["advisory"]
      file: exists(`wcag-techniques/${t.technology}/${t.id}.html`) ? `wcag-techniques/${t.technology}/${t.id}.html` : null,
    }));

  const manifest = {
    sc, title: SC_TITLE[sc], level: LEVEL[sc],
    understanding,
    trustedTester: ttForSc(sc),
    enClauses: 'docs/analysis/en301549/EN301549-ANNEX-C-RELEVANT-CLAUSES.md',
    enClauseAnchor: `C.9.${sc.replace(/\./g, '.')} — SC ${sc}`,
    categoriesSource: 'categories.json',
    actRules: rules,
    actRuleCount: rules.length,
    testCases: cases,
    testCaseCount: cases.length,
    testCaseCountsByExpected: caseCounts,
    techniques,
    techniqueCount: techniques.length,
  };
  fs.writeFileSync(path.join(OUT, `${sc}.json`), JSON.stringify(manifest, null, 2));

  // Compact variant the workflow can inline as `args.resource` (full lists live in <sc>.json,
  // which agents read directly). Test cases reduced to "ruleId|expected|localPath" strings.
  const compact = {
    sc, title: manifest.title, level: manifest.level,
    understanding: manifest.understanding, trustedTester: manifest.trustedTester,
    enClauses: manifest.enClauses, enClauseAnchor: manifest.enClauseAnchor,
    categoriesSource: manifest.categoriesSource,
    actRuleCount: manifest.actRuleCount, testCaseCount: manifest.testCaseCount,
    testCaseCountsByExpected: manifest.testCaseCountsByExpected,
    techniqueCount: manifest.techniqueCount,
    actRules: rules.map(r => ({ id: r.id, name: r.name, status: r.status, notFullyAutomatable: r.notFullyAutomatable, extracted: r.extracted })),
    testCases: cases.map(c => ({ ruleId: c.ruleId, expected: c.expected, localPath: c.localPath })),
  };
  fs.writeFileSync(path.join(OUT, `${sc}.compact.json`), JSON.stringify(compact));
  index[sc] = {
    title: SC_TITLE[sc], level: LEVEL[sc],
    actRuleCount: rules.length, testCaseCount: cases.length,
    testCaseCountsByExpected: caseCounts, techniqueCount: techniques.length,
    hasTrustedTester: !!manifest.trustedTester,
  };
}
fs.writeFileSync(path.join(OUT, 'index.json'), JSON.stringify({ generated: 'static', scs: index }, null, 2));
console.log(`Wrote ${selectedScs.length} SC resource manifests to ${path.relative(ROOT, OUT)}`);
for (const sc of selectedScs) {
  const i = index[sc];
  console.log(`  ${sc.padEnd(7)} ${i.title.padEnd(28)} rules=${String(i.actRuleCount).padStart(2)} cases=${String(i.testCaseCount).padStart(3)} tech=${String(i.techniqueCount).padStart(2)} TT=${i.hasTrustedTester ? 'Y' : '-'}`);
}
