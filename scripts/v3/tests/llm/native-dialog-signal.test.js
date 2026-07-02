// #13 fix — vision-capture.js's submit-pair driver (#12) captures a native window.alert()/confirm()'s message
// text as `nativeDialogText` on the state-pair object, but nothing surfaced it into the LLM prompt: the rubric
// was still judging the state-before/after SCREENSHOTS alone, which can NEVER show a native dialog (browser
// chrome, not page content). Confirmed live on a real DHS Trusted-Tester page: error-identification-v0 was
// judged REPRODUCED ("only a red validation outline...no visible text explaining the error") — a false
// positive, because the model genuinely could not see the alert's text; it was captured but discarded. This
// pins the fix: when visionByXpath[xpath].nativeDialogText is present, it must reach precomputeSignals'
// output (and therefore the JSON.stringify(signals) block already in the prompt).
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

const llmAdj = require('../../lib/llm-adjudicator.js');
const { loadRubrics } = require('../../lib/rubric-loader.js');

const ID = { file: 'p', runId: 'R', pageDigest: 'sha256:d' };
const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const DIALOG_TEXT = 'First Name is required and Zip must be in ##### format'; // single-line: JSON.stringify would escape an embedded \n, breaking a raw-string .includes() check below

test('runRubricJudgments #13 FIX: nativeDialogText reaches the prompt via signals', async () => {
  const { rubrics } = loadRubrics();
  let sawDialogText = false;
  const stub = async (messages) => {
    sawDialogText = messages[0].text.includes(DIALOG_TEXT);
    return { verdict: 'NOT REPRODUCED', confidence: 'high', summary: 'identified in the dialog text.', reasoning: 'r', evidenceRefs: [] };
  };
  const subs = [{
    xpath: '/form/input', sc: '3.3.1', claimFamily: 'error-identification', rubricId: 'error-identification-v0',
    rubric: rubrics['error-identification-v0'], skill: 'forms-instructions-errors', element: { xpath: '/form/input' },
  }];
  const visionByXpath = { '/form/input': { 'state-before': PNG, 'state-after': PNG, nativeDialogText: DIALOG_TEXT } };
  await llmAdj.runRubricJudgments(subs, { runAgent: stub, visionByXpath, ...ID });
  assert.ok(sawDialogText, 'the verbatim nativeDialogText string appeared in the prompt sent to the model');
});

test('runRubricJudgments #13 REGRESSION GUARD: no nativeDialogText present ⇒ no key fabricated, prompt unaffected', async () => {
  const { rubrics } = loadRubrics();
  let promptText = '';
  const stub = async (messages) => { promptText = messages[0].text; return { verdict: 'NOT REPRODUCED', confidence: 'high', summary: 's', reasoning: 'r', evidenceRefs: [] }; };
  const subs = [{
    xpath: '/form/input', sc: '3.3.1', claimFamily: 'error-identification', rubricId: 'error-identification-v0',
    rubric: rubrics['error-identification-v0'], skill: 'forms-instructions-errors', element: { xpath: '/form/input' },
  }];
  const visionByXpath = { '/form/input': { 'state-before': PNG, 'state-after': PNG } }; // no nativeDialogText key at all
  await llmAdj.runRubricJudgments(subs, { runAgent: stub, visionByXpath, ...ID });
  // the rubric's OWN instructional prose mentions "nativeDialogText" by name (that's expected — it explains
  // the field when present); what must NOT appear is the actual JSON key in the pre-computed signals block.
  assert.ok(!promptText.includes('"nativeDialogText":'), 'the signals JSON does not fabricate the key when absent (matches the field-omission pattern used elsewhere, e.g. focusPersisted)');
});
