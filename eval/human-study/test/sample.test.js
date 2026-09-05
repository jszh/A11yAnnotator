/**
 * sample.test.js - the drawn sample and the assignment maths.
 *
 * These are the properties the study's validity rests on: the strata are the
 * sizes that were asked for, every SC is represented, the draw reproduces from
 * its seed, and splitting across participants neither loses nor duplicates a
 * case.
 */
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { selectCases, split } = require('../lib/assign');

const ROOT = path.resolve(__dirname, '../../..');
const SAMPLE_FILE = path.join(ROOT, 'eval/human-study/sample/study-sample-200.json');
const sample = JSON.parse(fs.readFileSync(SAMPLE_FILE, 'utf8'));

test('sample has the requested strata', () => {
  assert.equal(sample.cases.length, 200);
  assert.equal(sample.totals.byStratum.ALL_ISSUE, 40);
  assert.equal(sample.totals.byStratum.ALL_CLEAN, 40);
  assert.equal(sample.totals.byStratum.DIFFER, 120);
});

test('every stratum label matches the tool verdicts it claims', () => {
  for (const c of sample.cases) {
    const flags = [c.tools.harness.flagged, c.tools.gena11y.flagged, c.tools.axe.flagged];
    const expected = flags.every(Boolean) ? 'ALL_ISSUE' : flags.every((f) => !f) ? 'ALL_CLEAN' : 'DIFFER';
    assert.equal(c.stratum, expected, `${c.caseId} labelled ${c.stratum} but verdicts are ${JSON.stringify(flags)}`);
    const pattern = (c.tools.harness.flagged ? 'H' : '-') + (c.tools.gena11y.flagged ? 'G' : '-') + (c.tools.axe.flagged ? 'A' : '-');
    assert.equal(c.pattern, pattern, `${c.caseId} pattern mismatch`);
  }
});

test('the harness column is its combined verdict for the element, not one obligation', () => {
  // One element can carry several harness obligations under the same SC - an
  // <img> gets both `non-text-content` and `long-description` - and the 774-row
  // draw picks one of them. C045 and C064 are the same missing-alt finding on
  // two ESPN thumbnails; before this was combined, C064 (drawn on the
  // element-keyed row) read "problem" and C045 (drawn on the long-description
  // row, which the harness left PARTIAL) read "clear". Nothing about the
  // harness differed - only which row the sample drew.
  for (const c of sample.cases) {
    const k = c.tools.harness.combined;
    assert.ok(k, `${c.caseId} has no combined harness verdict - run recombine-harness-verdict.js`);
    const union = k.families.some((f) => f.barrier) || k.shadowBarrierFamilies.length > 0;
    assert.equal(k.flagged, union, `${c.caseId} combined verdict disagrees with its own obligations`);
    assert.equal(c.tools.harness.flagged, k.flagged, `${c.caseId} shows a verdict other than the combined one`);
    // No verdict is not a finding: PARTIAL alone never flags.
    for (const f of k.families) {
      if (f.disposition === 'PARTIAL') assert.equal(f.barrier, false, `${c.caseId} counts a PARTIAL obligation as a barrier`);
    }
  }
  const twins = ['C045', 'C064'].map((id) => sample.cases.find((c) => c.caseId === id));
  for (const t of twins) {
    assert.ok(t, 'the missing-alt twin cases are no longer in the sample');
    assert.equal(t.tools.harness.flagged, true, `${t.caseId} should report the missing alt the harness found`);
  }
});

test('every column that reports a problem carries the sentence its tool gave', () => {
  // The tool view shows a sentence per flagged column. A case that reaches a
  // participant without one shows a bare verdict, which is the thing the
  // sentences were added to stop; and a sentence on a column that reported
  // nothing would be the study inventing a finding.
  const missing = [];
  for (const c of sample.cases) {
    for (const t of ['harness', 'gena11y', 'axe']) {
      const reason = c.tools[t].reason;
      if (c.tools[t].flagged) {
        if (typeof reason !== 'string' || !reason.trim()) missing.push(`${c.caseId}/${t}`);
        else assert.ok(/[.!?\u2026]$/.test(reason), `${c.caseId}/${t} is not a finished sentence: ${reason}`);
      } else {
        assert.equal(reason, undefined, `${c.caseId}/${t} reported nothing but carries a sentence`);
      }
    }
  }
  assert.deepEqual(missing, [], `flagged columns with no sentence: ${missing.join(', ')}`);
});

test('every case says which ability is needed to judge it', () => {
  // The study is staffed on this: a participant should never be handed a case
  // they cannot reach a verdict on. An untagged case would be silently
  // unassignable by the ability panel, which looks like a smaller sample rather
  // than a bug.
  const ABILITIES = ['vision', 'screenreader', 'other'];
  const counts = {};
  for (const c of sample.cases) {
    assert.ok(ABILITIES.includes(c.ability), `${c.caseId} (${c.sc}) has ability ${JSON.stringify(c.ability)}`);
    counts[c.ability] = (counts[c.ability] || 0) + 1;
  }
  assert.equal(Object.values(counts).reduce((a, b) => a + b, 0), sample.cases.length);

  // One ability per criterion. The arms are reported as "these criteria", and
  // an SC split across two of them would make that untrue.
  const bySc = new Map();
  for (const c of sample.cases) {
    if (bySc.has(c.sc)) assert.equal(bySc.get(c.sc), c.ability, `SC ${c.sc} is tagged two different ways`);
    else bySc.set(c.sc, c.ability);
  }
  for (const [sc, a] of bySc) assert.equal(sample.abilityBySc[sc], a, `the recorded table disagrees with case ${sc}`);
});

test('all 21 sampled success criteria are covered', () => {
  const scs = new Set(sample.cases.map((c) => c.sc));
  assert.equal(scs.size, sample.source.sampledScs.length);
  for (const sc of sample.source.sampledScs) assert.ok(scs.has(sc), `SC ${sc} missing from the sample`);
});

test('every SC that can disagree contributes disagreement cases', () => {
  // The instruction was to cover as much tool disagreement as possible inside
  // each SC, so no SC may be represented only by agreement cases when the pool
  // had disagreement to offer.
  for (const [sc, s] of Object.entries(sample.perSc)) {
    assert.ok(s.DIFFER > 0, `SC ${sc} contributed no DIFFER cases`);
  }
});

test('disagreement cases spread over the patterns each SC actually has', () => {
  // A single SC monopolised by one pattern would be a draw that ignored the
  // census; check the multi-pattern SCs really carry several.
  const multi = Object.entries(sample.perSc).filter(([, s]) => Object.keys(s.patterns).length > 1);
  assert.ok(multi.length >= 10, `only ${multi.length} SCs carry more than one pattern`);
});

test('case ids are unique and the sample has no duplicate (page, sc, xpath)', () => {
  const ids = new Set(), keys = new Set();
  for (const c of sample.cases) {
    assert.ok(!ids.has(c.caseId), `duplicate caseId ${c.caseId}`);
    ids.add(c.caseId);
    const k = `${c.page.file}|${c.sc}|${c.xpath}`;
    assert.ok(!keys.has(k), `duplicate case ${k}`);
    keys.add(k);
  }
});

test('page-scope cases are exactly the page-level pseudo-paths', () => {
  for (const c of sample.cases) {
    const isPseudo = c.xpath.startsWith('/page-level::');
    assert.equal(c.scope, isPseudo ? 'page' : 'element', `${c.caseId} scope mismatch`);
  }
});

test('every element-scope case resolved against the live page', () => {
  if (!sample.enrichment) return assert.fail('sample has not been enriched - run enrich-sample.js');
  assert.equal(sample.enrichment.unresolved, 0, `${sample.enrichment.unresolved} case(s) do not resolve`);
  for (const c of sample.cases) {
    assert.equal(c.resolved, true, `${c.caseId} unresolved`);
    if (c.scope === 'element') assert.ok(c.element, `${c.caseId} has no element descriptor`);
  }
});

test('no case sits on a target the pool check marked unusable', () => {
  const poolFile = path.join(ROOT, 'eval/human-study/sample/pool-resolvability.json');
  if (!fs.existsSync(poolFile)) return; // pool check is optional at build time
  const pool = JSON.parse(fs.readFileSync(poolFile, 'utf8'));
  const bad = new Set(pool.rows.filter((r) => !r.usable).map((r) => `${r.page} ${r.xpath}`));
  for (const c of sample.cases) {
    assert.ok(!bad.has(`${c.page.file} ${c.xpath}`), `${c.caseId} uses an unusable target`);
  }
});

test('the draw reproduces from its seed', () => {
  const tmp = path.join(ROOT, 'eval/human-study/sample/.reproduce-check.json');
  try {
    execFileSync(process.execPath, [
      path.join(ROOT, 'eval/human-study/build-sample.js'),
      `--seed=${sample.seed}`,
      '--out=eval/human-study/sample/.reproduce-check.json',
    ], { cwd: ROOT, stdio: 'pipe' });
    const again = JSON.parse(fs.readFileSync(tmp, 'utf8'));
    assert.deepEqual(again.cases.map((c) => c.caseId + ':' + c.sourceKey), sample.cases.map((c) => c.caseId + ':' + c.sourceKey));
  } finally {
    fs.rmSync(tmp, { force: true });
  }
});

// --- assignment -----------------------------------------------------------
test('split partitions the pool with no loss and no duplication', () => {
  for (const mode of ['interleave', 'block']) {
    const lists = split(sample.cases, { n: 3, mode, seed: 7 });
    const all = lists.flat();
    assert.equal(all.length, sample.cases.length, `${mode}: wrong total`);
    assert.equal(new Set(all).size, sample.cases.length, `${mode}: duplicates across participants`);
    for (const l of lists) assert.ok(l.length > 0, `${mode}: empty participant`);
  }
});

test('interleave keeps each participant close to the whole sample mix', () => {
  const byId = new Map(sample.cases.map((c) => [c.caseId, c]));
  const lists = split(sample.cases, { n: 4, mode: 'interleave', seed: 11 });
  for (const l of lists) {
    const differ = l.filter((id) => byId.get(id).stratum === 'DIFFER').length / l.length;
    assert.ok(Math.abs(differ - 0.6) < 0.15, `participant DIFFER share ${differ.toFixed(2)} drifted from 0.60`);
  }
});

test('anchor cases go to everyone and are drawn across strata', () => {
  const byId = new Map(sample.cases.map((c) => [c.caseId, c]));
  const lists = split(sample.cases, { n: 3, anchor: 12, seed: 3 });
  const shared = lists.reduce((acc, l) => acc.filter((id) => l.includes(id)), lists[0].slice());
  assert.equal(shared.length, 12, `expected 12 shared anchor cases, got ${shared.length}`);
  assert.equal(new Set(shared.map((id) => byId.get(id).stratum)).size, 3, 'anchor block is not spread across all three strata');
  const total = lists.flat().length;
  assert.equal(total, sample.cases.length + 12 * 2, 'anchor cases should be the only ones assigned more than once');
});

test('selection by filter ANDs its fields', () => {
  const { caseIds } = selectCases(sample.cases, { scs: ['1.1.1'], strata: ['ALL_ISSUE'] });
  assert.ok(caseIds.length > 0);
  for (const id of caseIds) {
    const c = sample.cases.find((x) => x.caseId === id);
    assert.equal(c.sc, '1.1.1');
    assert.equal(c.stratum, 'ALL_ISSUE');
  }
});

test('selection by explicit list keeps order and reports unknown ids', () => {
  const ids = [sample.cases[5].caseId, 'C999', sample.cases[1].caseId];
  const { caseIds, missing } = selectCases(sample.cases, { cases: ids });
  assert.deepEqual(caseIds, [ids[0], ids[2]]);
  assert.deepEqual(missing, ['C999']);
});

test('selection limit and shuffle are seeded', () => {
  const a = selectCases(sample.cases, { scs: ['2.4.4'], shuffle: true, seed: 42, limit: 5 }).caseIds;
  const b = selectCases(sample.cases, { scs: ['2.4.4'], shuffle: true, seed: 42, limit: 5 }).caseIds;
  const c = selectCases(sample.cases, { scs: ['2.4.4'], shuffle: true, seed: 43, limit: 5 }).caseIds;
  assert.deepEqual(a, b);
  assert.equal(a.length, 5);
  assert.notDeepEqual(a, c);
});
