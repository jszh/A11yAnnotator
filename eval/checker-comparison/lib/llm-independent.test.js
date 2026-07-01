'use strict';
// Unit tests for the LLM-independent splice module (lib/llm-independent.js). Pure — no browser.
//   node --test eval/checker-comparison/lib/llm-independent.test.js

const { test } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const I = require('./llm-independent.js');

test('pipeline hash is deterministic and covers every lib .js file', () => {
  const a = I.computePipelineHash();
  const b = I.computePipelineHash();
  assert.equal(a.hash, b.hash, 'hash must be stable across calls');
  assert.match(a.hash, /^[0-9a-f]{64}$/, 'sha256 hex');
  assert.ok(a.fileCount > 20, 'should hash the whole lib');
  assert.equal(a.fileCount, I.pipelineFiles().length);
});

test('isIndependent: only clean noObligation negatives qualify', () => {
  const neg = { outcome: 'noObligation', expected: 'passed' };
  assert.equal(I.isIndependent(neg), true, 'noObligation + passed ⇒ independent');
  assert.equal(I.isIndependent({ outcome: 'noObligation', expected: 'inapplicable' }), true);
  // NOT independent:
  assert.equal(I.isIndependent({ outcome: 'noObligation', expected: 'failed' }), false, 'never splice a recall case');
  assert.equal(I.isIndependent({ outcome: 'noObligation', expected: 'passed', effectiveExpected: 'failed' }), false, 'GT-override to failed ⇒ live');
  assert.equal(I.isIndependent({ outcome: 'noVerdict', expected: 'passed' }), false, 'has an obligation ⇒ LLM-dependent');
  assert.equal(I.isIndependent({ outcome: 'caught', expected: 'failed' }), false);
  assert.equal(I.isIndependent({ outcome: 'noObligation', expected: 'passed', excluded: true }), false, 'cross-rule-excluded ⇒ live');
  assert.equal(I.isIndependent({ outcome: 'noObligation', expected: 'passed', gtOverride: true }), false, 'GT-override ⇒ live');
  assert.equal(I.isIndependent({ outcome: 'noObligation', expected: 'passed', falsePositive: true }), false);
  assert.equal(I.isIndependent(null), false);
});

test('deriveCasesFromResults extracts only independent negatives, projecting the durable fields', () => {
  const results = [
    { testcaseId: 't1', ruleId: 'r1', sc: ['4.1.2'], expected: 'passed', outcome: 'noObligation' },
    { testcaseId: 't2', ruleId: 'r2', sc: ['1.1.1'], expected: 'failed', outcome: 'noObligation' }, // recall — excluded
    { testcaseId: 't3', ruleId: 'r3', sc: ['2.4.4'], expected: 'passed', outcome: 'noVerdict' },     // dependent — excluded
    { testcaseId: 't4', ruleId: 'r4', sc: ['1.4.3'], expected: 'inapplicable', outcome: 'noObligation' },
  ];
  const got = I.deriveCasesFromResults(results);
  assert.deepEqual(got.map((c) => c.testcaseId).sort(), ['t1', 't4']);
  assert.deepEqual(got[0], { testcaseId: 't1', ruleId: 'r1', sc: ['4.1.2'], expected: 'passed' });
});

test('spliceRecord scores as a deterministic true-negative', () => {
  const r = I.spliceRecord({ testcaseId: 'x', ruleId: 'r', sc: ['4.1.2'], expected: 'passed' });
  assert.equal(r.outcome, 'noObligation');
  assert.equal(r.polarity, 'specificity', 'negative polarity');
  assert.equal(r.falsePositive, false, 'a TN, never an FP');
  assert.equal(r.correct, true);
  assert.equal(r.effectiveExpected, 'passed');
  assert.equal(r.spliced, true);
  assert.equal(r.llmIndependent, true);
});

test('buildManifest embeds the current pipeline hash + counts', () => {
  const cases = [{ testcaseId: 'a', ruleId: 'r', sc: ['4.1.2'], expected: 'passed' }];
  const m = I.buildManifest({ cases, derivedFromCommit: 'deadbeef', reachesLlmTotal: 458 });
  assert.equal(m.schema, 'llm-independent-set/v1');
  assert.equal(m.independentCount, 1);
  assert.equal(m.reachesLlmTotal, 458);
  assert.equal(m.derivedFromCommit, 'deadbeef');
  assert.equal(m.pipelineHash, I.computePipelineHash().hash, 'manifest pins the live hash');
});

test('writeManifest/loadManifest round-trip (temp path, no clobber of the real manifest)', () => {
  const tmp = path.join(os.tmpdir(), `llm-indep-test-${process.pid}.json`);
  try {
    const m = I.buildManifest({ cases: [{ testcaseId: 'a', ruleId: 'r', sc: ['4.1.2'], expected: 'passed' }], derivedFromCommit: 'c0ffee', reachesLlmTotal: 100 });
    I.writeManifest(m, tmp);
    const back = I.loadManifest(tmp);
    assert.deepEqual(back, m);
  } finally { try { fs.unlinkSync(tmp); } catch (e) {} }
  assert.equal(I.loadManifest(path.join(os.tmpdir(), 'does-not-exist-xyz.json')), null);
});

test('partitionForSplice: skips only-once ids, keeps duplicated-independent ids LIVE (exact reconstruction)', () => {
  // 5 entries, 4 unique testcaseIds: "dup" appears twice, and is in the manifest.
  const reaches = [
    { testcaseId: 'solo1' }, { testcaseId: 'solo2' },
    { testcaseId: 'dup' }, { testcaseId: 'dup' },   // same page under two rules
    { testcaseId: 'live-dependent' },
  ];
  const manifest = { cases: [
    { testcaseId: 'solo1', ruleId: 'r', sc: ['4.1.2'], expected: 'passed' },
    { testcaseId: 'dup', ruleId: 'r', sc: ['1.1.1'], expected: 'inapplicable' }, // duplicated ⇒ must NOT be skipped
    { testcaseId: 'ghost', ruleId: 'r', sc: [], expected: 'passed' },            // absent ⇒ missing
  ] };
  const p = I.partitionForSplice(manifest, reaches);
  assert.deepEqual([...p.skipIds].sort(), ['solo1'], 'only the once-appearing id is skipped');
  assert.equal(p.spliceRecords.length, 1, 'one splice record (solo1)');
  assert.deepEqual(p.liveDuplicated.map((d) => d.testcaseId), ['dup'], 'dup kept live');
  assert.deepEqual(p.missing, ['ghost']);
  // EXACT arithmetic: entries removed (by skipIds) === spliceRecords, and live + spliced === total entries
  const removed = reaches.filter((c) => p.skipIds.has(c.testcaseId)).length;
  assert.equal(removed, p.spliceRecords.length, 'removed entries == spliced records');
  const live = reaches.filter((c) => !p.skipIds.has(c.testcaseId)).length;
  assert.equal(live + p.spliceRecords.length, reaches.length, 'live + spliced == 458-analog total');
});

test('checkGuard: rejects no-manifest / hash-drift / corpus-drift / failed-leak; accepts a matching set', () => {
  const reaches = new Set(['a', 'b', 'c']);
  const goodCases = [{ testcaseId: 'a', ruleId: 'r', sc: ['4.1.2'], expected: 'passed' }];
  const liveHash = I.computePipelineHash().hash;

  assert.equal(I.checkGuard(null, reaches).ok, false, 'no manifest');
  assert.equal(I.checkGuard({ cases: [] }, reaches).ok, false, 'empty manifest');

  // hash matches, all ids present ⇒ ok
  const ok = I.checkGuard({ cases: goodCases, pipelineHash: liveHash }, reaches);
  assert.equal(ok.ok, true);
  assert.equal(ok.pipelineChanged, false);

  // hash drift ⇒ reject + flag
  const drift = I.checkGuard({ cases: goodCases, pipelineHash: 'stale00000' }, reaches);
  assert.equal(drift.ok, false);
  assert.equal(drift.pipelineChanged, true);

  // id absent from the reaches set ⇒ corpus drift
  const missing = I.checkGuard({ cases: [{ testcaseId: 'zzz', ruleId: 'r', sc: [], expected: 'passed' }], pipelineHash: liveHash }, reaches);
  assert.equal(missing.ok, false);
  assert.deepEqual(missing.missing, ['zzz']);

  // a failed case in the manifest ⇒ hard refuse (recall must stay live)
  const leak = I.checkGuard({ cases: [{ testcaseId: 'a', ruleId: 'r', sc: [], expected: 'failed' }], pipelineHash: liveHash }, reaches);
  assert.equal(leak.ok, false);
  assert.deepEqual(leak.failedLeak, ['a']);
});
