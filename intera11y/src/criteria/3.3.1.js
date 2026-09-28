'use strict';
// 3.3.1 Error Identification — when an input error is detected, the item in error is identified and the error is
// described to the user in text.
const { errorCandidates, errorTexts, scenarioFacts, formImages, fieldFacts } = require('./forms-common.js');
const S = require('../screen/select.js');
const { toolsOf } = require('../judge/rubric.js');

module.exports = {
  sc: '3.3.1', title: 'Error Identification',
  probes: ['forms'],
  tools: toolsOf('3.3.1'),
  // screening sweep: the element kinds it reads (its test rules are the criterion's rules)
  screen: { select: S.formish },

  identify(model, { forms }) { return errorCandidates(forms.forms); },

  assess(c) {
    // the probe could not produce an error: whether the page is already showing one (re-displayed after a failed
    // submission) is read from the form as rendered
    if (c.kind !== 'flagged-field') return { status: 'OPEN', rule: c.kind };
    const texts = errorTexts(c);
    const nativeBlock = texts.some((t) => /browser validation/.test(t.via)) && !c.form.novalidate;
    if (nativeBlock) return { status: 'PASS', rule: 'browser-identifies-error', reason: 'The browser blocks the submission, focuses the field and shows its validation message in text.' };
    const ariaFlagged = (c.form.scenarios || []).some((s) => ((s.fieldStates || []).find((x) => x.xpath === c.xpath) || {}).ariaInvalid === 'true')
      || ((c.form.atRest && c.form.atRest.fieldStates) || []).some((s) => s.xpath === c.xpath && s.ariaInvalid === 'true');
    if (ariaFlagged && !texts.length) {
      return { status: 'FAIL', rule: 'error-without-text', reason: 'The page marks the field as invalid (aria-invalid="true"), but no text anywhere — associated, visible or announced — describes the error.' };
    }
    return { status: 'OPEN', rule: 'error-text-to-judge' };
  },

  evidence(c) {
    return {
      facts: {
        candidateKind: c.kind,
        field: fieldFacts(c),
        flaggedAtRest: c.why ? c.why.atRest : undefined,
        drawnDifferentlyFromPeerFieldsAtRest: c.why && c.why.byStyleOnly ? c.why.byStyleOnly : undefined,
        flaggedAfter: c.why ? c.why.scenarios : undefined,
        errorTexts: errorTexts(c),
        submissions: scenarioFacts(c),
        formNoValidate: c.form.novalidate,
      },
      images: formImages(c),
    };
  },
};
