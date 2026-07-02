// #15 fix — the required-evidence gate's NON-VISUAL EXCEPTION (avail.__nonVisual === '1') was designed for
// NAME/ROLE-type judgments (a genuinely off-screen element with a real accessible name is still text-judgeable),
// but it applied UNCONDITIONALLY to every rubric, including alt-text-adequacy-v0 whose core judgment mode is a
// PIXEL comparison ("does the name match what the image DEPICTS"). Confirmed live on a real DHS Trusted-Tester
// carousel page (a crossfade slide correctly flagged __nonVisual by the #10e ancestor-opacity fix): with ZERO
// element-crop/surrounding-region evidence, a model still fabricated a specific "the image actually depicts X"
// claim instead of abstaining — the rubric's own prose caveat ("you cannot know that") did not stop it. A new
// `requiresVision: true` frontmatter field lets a rubric opt OUT of the non-visual exception, so the gate
// abstains (auto-PARTIAL) instead of inviting a hallucinated pixel comparison.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const llmAdj = require('../../lib/llm-adjudicator.js');
const { loadRubrics } = require('../../lib/rubric-loader.js');

const ID = { file: 'p', runId: 'R', pageDigest: 'sha256:d' };

test('rubric-loader #15 FIX: requiresVision:true in frontmatter is parsed onto the rubric object', () => {
  const { rubrics } = loadRubrics();
  assert.equal(rubrics['alt-text-adequacy-v0'].requiresVision, true, 'alt-text-adequacy-v0 declares requiresVision: true');
});

test('runRubricJudgments #15 FIX: a requiresVision rubric ABSTAINS (no verdict) when the element is __nonVisual, rather than judging text-only', async () => {
  const { rubrics } = loadRubrics();
  let called = false;
  const stub = async () => { called = true; return { verdict: 'REPRODUCED', confidence: 'high', summary: 'fabricated', reasoning: 'r', evidenceRefs: [] }; };
  const subs = [{
    xpath: '/img', sc: '1.1.1', claimFamily: 'non-text-content', rubricId: 'alt-text-adequacy-v0',
    rubric: rubrics['alt-text-adequacy-v0'], skill: 'name-role-state', element: { xpath: '/img' },
  }];
  const visionByXpath = { '/img': { __nonVisual: '1' } }; // NO element-crop/surrounding-region — only the nonVisual marker
  const { judgments } = await llmAdj.runRubricJudgments(subs, { runAgent: stub, visionByXpath, ...ID });
  assert.equal(called, false, 'the model is never called — the gate abstains before dispatch');
  assert.equal(judgments.judgments.length, 0, 'no judgment is emitted (stays auto-PARTIAL upstream)');
});

test('runRubricJudgments #15 REGRESSION GUARD: a NON-requiresVision rubric still gets the non-visual exception (text-only judgment, unaffected)', async () => {
  const { rubrics } = loadRubrics();
  let sawFlag = false;
  const stub = async (messages) => { sawFlag = messages[0].text.includes('elementNotPerceivable'); return { verdict: 'NOT REPRODUCED', confidence: 'high', summary: 's', reasoning: 'r', evidenceRefs: [] }; };
  // field-programmatic-association-v0 has no requiresVision flag — a name/role-ish judgment, unaffected by #15.
  const subs = [{
    xpath: '/input', sc: '1.3.1', claimFamily: 'field-programmatic-association', rubricId: 'field-programmatic-association-v0',
    rubric: rubrics['field-programmatic-association-v0'], skill: 'grouping-and-reading-order', element: { xpath: '/input' },
  }];
  assert.equal(rubrics['field-programmatic-association-v0'].requiresVision, false, 'this rubric does not opt into #15 (sanity check on the default)');
  const visionByXpath = { '/input': { __nonVisual: '1' } };
  const { judgments } = await llmAdj.runRubricJudgments(subs, { runAgent: stub, visionByXpath, ...ID });
  assert.equal(judgments.judgments.length, 1, 'the model IS called and a verdict IS emitted — the non-visual exception still applies here');
  assert.ok(sawFlag, 'elementNotPerceivable is still surfaced to the prompt for a rubric that did not opt out');
});
