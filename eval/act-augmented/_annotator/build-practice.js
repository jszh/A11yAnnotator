#!/usr/bin/env node
/*
 * build-practice.js — emit practice/practice-cases.json for the annotator.
 *
 * Practice cases are drawn from the curated W3C ACT test set
 * (eval/checker-comparison/act-subset/) — cases with authoritative ground-truth
 * outcomes (expected: passed / failed). For each WCAG SC the annotator can cover,
 * we pick TWO cases: one that FAILS (an issue exists) and one that PASSES (no
 * issue), if available. Selection is deterministic (same for every annotator):
 * approved cases first, then by testcaseId, preferring a page that loads cleanly
 * offline (no absolute-root / external references).
 *
 * The relevant Trusted Tester test is chosen via practice-tt-map.json for
 * multi-test SCs; single-test SCs auto-use their sole test; SCs with no TT file
 * fall back to the WCAG Understanding document (handled by the annotator).
 *
 * Run: node eval/act-augmented/_annotator/build-practice.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../..');                 // repo root
const SUBSET_DIR = path.join(ROOT, 'eval/checker-comparison/act-subset');
const subset = require(path.join(SUBSET_DIR, 'subset.json'));
const testcases = require(path.join(ROOT, 'testcases.json')).testcases;
const manifest = require(path.join(__dirname, 'manifest.json'));
const ttMap = require(path.join(__dirname, 'practice-tt-map.json'));

// SC -> manifest record (title, level, methodology)
const scByCode = {};
for (const sc of manifest.scs) scByCode[sc.sc] = sc;

// ruleId -> rule metadata (name, page) from the full ACT testcases manifest
const ruleInfo = {};
for (const t of testcases) if (!ruleInfo[t.ruleId]) ruleInfo[t.ruleId] = { ruleName: t.ruleName, rulePage: t.rulePage };

// Does a local ACT page load cleanly offline? (relative ../_assets refs are fine;
// absolute-root or external refs would break inside the same-origin iframe.)
function pageRefsBad(localPath) {
  try {
    const h = fs.readFileSync(path.join(SUBSET_DIR, localPath), 'utf8');
    if (/(src|href)="\/(?!eval)/.test(h)) return 'abs-root';
    if (/(src|href)="https?:/.test(h)) return 'external';
    return '';
  } catch (e) { return 'missing'; }
}

// group subset cases by SC (combined direct + via-technique mapping)
const bySc = {};
for (const c of subset) for (const sc of (c.sc || [])) (bySc[sc] = bySc[sc] || []).push(c);

function pick(list, expected) {
  const cand = (list || [])
    .filter(c => c.expected === expected)
    .sort((a, b) => (b.approved - a.approved) || a.testcaseId.localeCompare(b.testcaseId));
  const good = cand.find(c => !pageRefsBad(c.localPath));
  return good || cand[0] || null;
}

// resolve the Trusted Tester test(s) for an ACT rule under a given SC
function resolveTests(ruleId, scRec) {
  const ov = ttMap[ruleId];
  if (ov && Array.isArray(ov.tests) && ov.tests.length) return ov.tests;
  const all = (scRec.methodology && scRec.methodology.ttAllTests) || [];
  if (all.length === 1) return [all[0]];     // single-test SC: auto
  return [];                                  // multi-test, unmapped: full SC process
}

function makeCase(c, role) {
  const scRec = scByCode[c.sc[0]] || scByCode[(c.sc || [])[0]];
  // a case can map to several SCs; build one record per SC it covers AND we annotate
  return scRec ? buildFor(c, scRec, role) : null;
}

function buildFor(c, scRec, role) {
  const ov = ttMap[c.ruleId] || {};
  const tests = resolveTests(c.ruleId, scRec);
  const single = ((scRec.methodology && scRec.methodology.ttAllTests) || []).length === 1;
  return {
    key: 'practice::' + scRec.sc + '::' + c.expected,
    practice: true,
    sc: scRec.sc,
    scTitle: scRec.title,
    level: scRec.level,
    methodology: scRec.methodology || {},
    ttTests: tests,
    ttWhy: ov.why || (single && tests.length ? 'Sole Trusted Tester test for this SC.' : ''),
    aspectSlug: c.ruleId,
    aspectTitle: (ruleInfo[c.ruleId] && ruleInfo[c.ruleId].ruleName) || c.ruleName,
    ruleId: c.ruleId,
    ruleName: (ruleInfo[c.ruleId] && ruleInfo[c.ruleId].ruleName) || c.ruleName,
    rulePage: (ruleInfo[c.ruleId] && ruleInfo[c.ruleId].rulePage) || null,
    plain: ov.desc || (ruleInfo[c.ruleId] && ruleInfo[c.ruleId].ruleName) || c.ruleName,
    caseId: c.expected,                    // 'failed' (issue) | 'passed' (no issue)
    expected: c.expected,                  // ground truth
    role,                                  // 'issue' | 'no-issue'
    testcaseId: c.testcaseId,
    url: '/eval/checker-comparison/act-subset/' + c.localPath,
    loadable: !pageRefsBad(c.localPath),
  };
}

const out = {};   // sc -> [issueCase?, noIssueCase?]
const skipped = [];
// only SCs the annotator actually covers (present in the manifest)
const scs = Object.keys(bySc).filter(sc => scByCode[sc]).sort();
for (const sc of scs) {
  const scRec = scByCode[sc];
  const f = pick(bySc[sc], 'failed');
  const p = pick(bySc[sc], 'passed');
  const arr = [];
  if (f) arr.push(buildFor(f, scRec, 'issue'));
  else skipped.push(sc + ':no-failed');
  if (p) arr.push(buildFor(p, scRec, 'no-issue'));
  else skipped.push(sc + ':no-passed');
  if (arr.length) out[sc] = arr;
}

const payload = {
  schema: 'act-practice-cases/1',
  generatedAt: new Date().toISOString(),
  source: 'eval/checker-comparison/act-subset/subset.json',
  note: '2 practice cases per SC (1 failing / 1 passing) from the W3C ACT test set; deterministic, same for every annotator.',
  bySc: out,
};

const outDir = path.join(__dirname, 'practice');
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, 'practice-cases.json');
fs.writeFileSync(outPath, JSON.stringify(payload, null, 2));

const total = Object.values(out).reduce((n, a) => n + a.length, 0);
console.log('Wrote ' + outPath);
console.log('  SCs with practice: ' + Object.keys(out).length + '  (' + total + ' cases)');
for (const sc of Object.keys(out)) {
  const a = out[sc];
  console.log('   ' + sc.padEnd(7) + a.map(c => c.role + '=' + c.ruleId + (c.ttTests.length ? ' [' + c.ttTests.join(',') + ']' : ' [full-process]') + (c.loadable ? '' : ' !refs')).join('   '));
}
if (skipped.length) console.log('  Incomplete (only one side available): ' + skipped.join(', '));
