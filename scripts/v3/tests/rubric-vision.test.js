// Harness 3.2 §9 + §12 — the v3.2 rubric set + loader, and the multimodal (text + vision) prompt
// plumbing. The LLM judges over EVIDENCE it is handed: a scoped, versioned rubric (with a pinned content
// hash) plus the declared vision crops. Crops live in a side `llmVision` artifact (base64 — NEVER in the
// strict-scanned results); the structured verdict references them by opaque id.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const fs = require('node:fs');
const path = require('node:path');
const { loadRubrics, parseFrontmatter, sha256, SKILL_VISION } = require('../lib/rubric-loader.js');
const { captureVision, mergeVision } = require('../lib/vision-capture.js');
const llmAdj = require('../lib/llm-adjudicator.js');
const { buildV3 } = require('../lib/build-v3.js');
const { CHROME } = require('../lib/run-experiments.js');
const { withPipeline, reseal, promoted } = require('./helpers.js');

const ID = { file: 'p', runId: 'R', pageDigest: 'sha256:d' };
const scope = (xpath) => ({ actionTargetRef: xpath, state: 'fresh-load', action: 'inspect', environment: 'headless-chromium' });
const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg=='; // 1x1 base64

// ============================ item 9: loader + rubric set ============================
test('loadRubrics: skill rubrics + the atomic v3.2 set, each with a pinned content hash + vision needs', () => {
  const r = loadRubrics();
  assert.ok(Object.keys(r.skills).length >= 10, 'the broad llm-agent skill rubrics load');
  assert.ok(r.skills['focus-visibility'].promptHash.startsWith('sha256:'));
  assert.deepEqual(r.skills['focus-visibility'].visionEvidence, ['state-before', 'state-after']);
  // the atomic, versioned, gap-scoped set
  assert.ok(r.rubrics['alt-text-adequacy-v0'], 'the atomic alt-text rubric (id used by the tests) is present');
  assert.equal(r.rubrics['target-size-minimum-v0'].sc, '2.5.8', 'a ○-tier rubric is registered');
  assert.equal(r.rubrics['label-in-name-v0'].sc, '2.5.3');
  assert.ok(r.rubrics['alt-text-adequacy-v0'].text.length > 200 && r.rubrics['alt-text-adequacy-v0'].promptHash.startsWith('sha256:'));
  assert.ok(r.promptHash.startsWith('sha256:'), 'a combined fingerprint pins the whole rubric set');
});

test('loadRubrics: a reworded rubric is a DIFFERENT mechanism (the content hash changes)', () => {
  const a = parseFrontmatter('---\nid: x\nsc: 1.1.1\nvisionEvidence: [element-crop]\n---\nbody one');
  assert.equal(a.meta.id, 'x'); assert.equal(a.meta.sc, '1.1.1');
  assert.deepEqual(a.meta.visionEvidence, ['element-crop']);
  assert.notEqual(sha256('body one'), sha256('body two'), 'a v0→v1 reword cannot inherit v0 gold calibration');
});

// ============================ item 12: multimodal plumbing ============================
test('buildMessages: text block + one image block per supplied vision frame', () => {
  const subj = { xpath: 'node:img', skill: 'name-role-state', sc: '1.1.1', claimFamily: 'name-role-value' };
  const noVision = llmAdj.buildMessages(subj, {}, null, []);
  assert.equal(noVision.length, 1);
  assert.equal(noVision[0].type, 'text');
  const withVision = llmAdj.buildMessages(subj, {}, null, [{ id: 'vis:0', state: 'element-crop', data: PNG }]);
  assert.ok(withVision.some((b) => b.type === 'image' && b.id === 'vis:0' && b.data === PNG), 'the crop rides the prompt to the agent');
});

test('runAdjudication: vision frames are supplied per the rubric, ride the side llmVision artifact + evidenceRefs', async () => {
  const subjects = [{ xpath: 'node:img', skill: 'name-role-state', sc: '1.1.1', claimFamily: 'name-role-value', element: { xpath: 'node:img' } }];
  const llmRubrics = loadRubrics(); // name-role-state declares element-crop
  const visionByXpath = { 'node:img': { 'element-crop': PNG, 'state-before': PNG } }; // state-before NOT declared → not supplied
  const stub = async (messages) => { assert.ok(Array.isArray(messages) && messages[0].type === 'text'); return { verdict: 'REPRODUCED', confidence: 'high', summary: 'no name.', reasoning: 'the icon has no accessible name.', evidenceRefs: ['e1'] }; };
  const { llm, llmVision } = await llmAdj.runAdjudication(subjects, { runAgent: stub, llmRubrics, visionByXpath, ...ID });
  assert.equal(llm.verdicts.length, 1);
  assert.equal(llmVision.images.length, 1, 'only the DECLARED element-crop is captured, not the undeclared state-before');
  assert.equal(llmVision.images[0].state, 'element-crop');
  assert.equal(llmVision.images[0].data, PNG, 'the crop bytes live in the side artifact');
  assert.ok(llm.verdicts[0].evidenceRefs.includes(llmVision.images[0].id), 'the verdict references the crop by opaque id');
  assert.ok(!JSON.stringify(llm.verdicts).includes(PNG), 'no base64 in the structured llm artifact');
  assert.equal(llm.promptHash, llmRubrics.promptHash, 'the run pins the rubric-set content hash');
});

// ============================ build integration: llmVision side artifact ============================
test('build: bundle.llmVision is identity-bound (M5) and its crops NEVER reach the strict-scanned results', () => {
  const b = withPipeline({
    collect: { ...ID, collectedAt: 1, elements: [{ xpath: 'node:b1', focusable: true }] },
    experiments: { ...ID, catalogVersion: '3.0.0-phase0', startedAt: 2, results: [] },
    claimProposals: { ...ID, proposals: [] },
  });
  b.llm = { ...ID, model: 'm', promptHash: 'sha256:pr', verdicts: [{ verdictId: 'lv1', sc: '2.4.7', claimFamily: 'focus-indicator-visible', targetXpath: 'node:b1', observationScope: scope('node:b1'), agentVerdict: 'NOT REPRODUCED', confidence: 'high', evidenceRefs: ['vis:name-role-state:0:element-crop'], rationaleRef: 'lv1#b' }] };
  b.llmVision = { ...ID, images: [{ id: 'vis:name-role-state:0:element-crop', xpath: 'node:b1', state: 'element-crop', mediaType: 'image/png', data: PNG }] };
  const r = buildV3(reseal(b), { authority: promoted([]) });
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.ok(!JSON.stringify(r.results).includes(PNG), 'the base64 crop is never in results');
  // M5: a stale vision artifact (wrong page) is refused.
  b.llmVision.pageDigest = 'sha256:WRONG';
  const stale = buildV3(reseal(b), { authority: promoted([]) });
  assert.equal(stale.ok, false);
  assert.ok(stale.errors.some((m) => /llmVision|pageDigest/i.test(m)));
});

// ============================ item 11: vision capture ============================
test('mergeVision: driver state pairs merge into the static crop map by (xpath, state)', () => {
  const stat = { '/x': { 'element-crop': 'A', viewport: 'V' } };
  const pairs = { '/x': { 'state-before': 'B', 'state-after': 'C' }, '/y': { 'state-after': 'D' } };
  const m = mergeVision(stat, pairs);
  assert.deepEqual(Object.keys(m['/x']).sort(), ['element-crop', 'state-after', 'state-before', 'viewport']);
  assert.equal(m['/x']['state-before'], 'B');
  assert.equal(m['/y']['state-after'], 'D');
});

const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — vision-capture e2e SKIPPED');
const FX = 'file://' + path.join(__dirname, '..', '..', '..', 'assets', 'saved', 'fx-v3-vsr-semantic.html');

test('captureVision e2e: real PNG crops; viewport-320 differs from viewport (reflow)', { skip: !chromeOK, concurrency: false }, async () => {
  const puppeteer = require('puppeteer');
  const b = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const p = await b.newPage(); await p.setViewport({ width: 1024, height: 768 }); await p.goto(FX, { waitUntil: 'load' });
    const vis = await captureVision(p, ['/html/body/button[1]'], {});
    const f = vis['/html/body/button[1]'];
    const isPng = (d) => Buffer.from(d, 'base64').slice(0, 8).toString('hex') === '89504e470d0a1a0a';
    assert.ok(f['element-crop'] && isPng(f['element-crop']), 'element-crop is a real PNG');
    assert.ok(f['surrounding-region'] && isPng(f['surrounding-region']));
    assert.ok(f['viewport'] && f['viewport-320'] && f['viewport'] !== f['viewport-320'], 'the 320px reflow render differs');
  } finally { await b.close(); }
});

// ============================ adversarial regressions (skeptic round) ============================
test('adversarial HIGH: a DROPPED verdict never makes the next subject reuse a vision id (wrong-crop binding)', async () => {
  const subjects = [
    { xpath: 'node:a', skill: 'name-role-state', sc: '1.1.1', claimFamily: 'name-role-value', element: { xpath: 'node:a' } },
    { xpath: 'node:b', skill: 'name-role-state', sc: '1.1.1', claimFamily: 'name-role-value', element: { xpath: 'node:b' } },
  ];
  const llmRubrics = loadRubrics();
  const visionByXpath = { 'node:a': { 'element-crop': PNG }, 'node:b': { 'element-crop': PNG } };
  let call = 0;
  const stub = async () => (call++ === 0 ? { verdict: 'BOGUS' } : { verdict: 'REPRODUCED', confidence: 'high', summary: 's.', reasoning: 'r.', evidenceRefs: [] });
  const { llm, llmVision } = await llmAdj.runAdjudication(subjects, { runAgent: stub, llmRubrics, visionByXpath, ...ID });
  assert.equal(llm.verdicts.length, 1, 'only node:b survives');
  const ids = llmVision.images.map((i) => i.id);
  assert.equal(new Set(ids).size, ids.length, 'no duplicate vision ids');
  assert.ok(!llmVision.images.some((i) => i.xpath === 'node:a'), 'no orphan crop for the dropped verdict');
  const ref = llm.verdicts[0].evidenceRefs.find((r) => r.startsWith('vis:'));
  assert.equal(llmVision.images.find((i) => i.id === ref).xpath, 'node:b', 'the surviving verdict references ITS OWN crop');
});

test('adversarial HIGH: gold-loader does not crash on a null/primitive gold doc', () => {
  const gl = require('../lib/gold-loader.js');
  const dir = path.join(__dirname, '..', '..', '..', 'eval', 'gold', 'v3');
  const f = path.join(dir, 'fx-tmp-null.gold.json');
  fs.writeFileSync(f, 'null');
  try { let r; assert.doesNotThrow(() => { r = gl.loadGold({ dir }); }); assert.ok(r.errors.some((e) => /not a gold object/.test(e))); }
  finally { fs.unlinkSync(f); }
});

test('adversarial MED: duplicate rubric id recorded (first wins); promptHash binds visionEvidence', () => {
  const os = require('node:os');
  const d = fs.mkdtempSync(path.join(os.tmpdir(), 'rub-'));
  try {
    fs.writeFileSync(path.join(d, 'a.md'), '---\nid: dup\nsc: 1.1.1\nvisionEvidence: [element-crop]\n---\nBODY');
    fs.writeFileSync(path.join(d, 'b.md'), '---\nid: dup\nsc: 9.9.9\n---\nIMPOSTER');
    const r1 = loadRubrics({ rubricsDir: d });
    assert.equal(r1.rubrics['dup'].sc, '1.1.1', 'first (sorted) wins — a stray file cannot clobber a calibrated rubric');
    assert.ok(r1.conflicts.some((c) => /duplicate rubric id/.test(c)));
    fs.writeFileSync(path.join(d, 'a.md'), '---\nid: dup\nsc: 1.1.1\nvisionEvidence: [viewport]\n---\nBODY');
    fs.rmSync(path.join(d, 'b.md'));
    const r2 = loadRubrics({ rubricsDir: d });
    assert.notEqual(r1.rubrics['dup'].promptHash, r2.rubrics['dup'].promptHash, 'changing vision needs ⇒ a different mechanism (no gold inheritance)');
  } finally { fs.rmSync(d, { recursive: true, force: true }); }
});

test('adversarial LOW: mergeVision ignores array inputs', () => {
  assert.deepEqual(mergeVision([1, 2, 3]), {});
  assert.deepEqual(mergeVision({ '/x': { v: 'A' } }, [1, 2]), { '/x': { v: 'A' } });
});
