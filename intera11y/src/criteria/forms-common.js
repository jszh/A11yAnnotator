'use strict';
// Shared reading of the forms probe for 3.3.1 and 1.4.1: which fields the page put into an error state, and every
// piece of text that could be describing the error.

// Candidates: a field the page flagged (after a submission, or already at rest), or a form whose submission was
// refused without any field being flagged.
function errorCandidates(forms) {
  const out = [];
  for (const f of forms || []) {
    const flagged = new Map();
    const rest = f.atRest || {};
    (rest.fieldStates || []).forEach((s) => { if (s.ariaInvalid === 'true') flagged.set(s.xpath, { atRest: true, scenarios: [] }); });
    // a field drawn differently from its peers as the page loads (e.g. a red border) may be flagged in error
    (rest.styleOutliers || []).forEach((o) => { if (!flagged.has(o.xpath)) flagged.set(o.xpath, { atRest: true, byStyleOnly: o, scenarios: [] }); });
    for (const s of f.scenarios || []) {
      for (const x of s.fieldsFlagged || []) { if (!flagged.has(x)) flagged.set(x, { atRest: false, scenarios: [] }); flagged.get(x).scenarios.push(s.mode); }
    }
    for (const [xpath, why] of flagged) out.push({ xpath, kind: 'flagged-field', form: f, why });
    const refusedSilently = (f.scenarios || []).some((s) => !s.error && !s.skipped && !s.submissionWentThrough && !(s.fieldsFlagged || []).length);
    const restingMessages = (rest.messages || []).length > 0;
    if (!flagged.size && (refusedSilently || restingMessages)) out.push({ xpath: f.xpath, kind: restingMessages ? 'form-with-resting-messages' : 'form-refused-submission', form: f });
    if (!flagged.size && !refusedSilently && !restingMessages) out.push({ xpath: f.xpath, kind: 'form-at-rest', form: f });
  }
  return out;
}

// Every text that might describe the error for this field, from every scenario.
function errorTexts(c) {
  const f = c.form;
  const texts = [];
  const rest = f.atRest || {};
  const rs = (rest.fieldStates || []).find((s) => s.xpath === c.xpath);
  if (rs) {
    if (rs.describedByText && rs.describedByText.length) texts.push({ when: 'at rest', via: 'aria-describedby', text: rs.describedByText });
    if (rs.errorMessageText && rs.errorMessageText.length) texts.push({ when: 'at rest', via: 'aria-errormessage', text: rs.errorMessageText });
  }
  for (const m of rest.messages || []) texts.push({ when: 'at rest', via: 'visible message in/near the form', path: m.xpath, text: m.text, role: m.role || m.live || undefined });
  for (const s of f.scenarios || []) {
    if (s.error || s.skipped) continue;
    const st = (s.fieldStates || []).find((x) => x.xpath === c.xpath);
    if (st) {
      if (st.validationMessage) texts.push({ when: `after ${s.mode} submit`, via: 'browser validation message (shown by the browser when it blocks the submit)', text: st.validationMessage });
      if (st.describedByText && st.describedByText.length) texts.push({ when: `after ${s.mode} submit`, via: 'aria-describedby', text: st.describedByText });
      if (st.errorMessageText && st.errorMessageText.length) texts.push({ when: `after ${s.mode} submit`, via: 'aria-errormessage', text: st.errorMessageText });
      const before = (s.fieldStatesBefore || []).find((x) => x.xpath === c.xpath);
      if (before && st.label !== before.label) texts.push({ when: `after ${s.mode} submit`, via: 'label changed', text: st.label });
    }
    for (const t of s.newText || []) texts.push({ when: `after ${s.mode} submit`, via: t.liveRegion ? `new text in ${t.liveRegion.preExisted ? 'a pre-existing' : 'a newly added'} live region (${t.liveRegion.politeness})` : 'new visible text', path: t.xpath, text: t.text });
    for (const d of s.nativeDialogs || []) texts.push({ when: `after ${s.mode} submit`, via: 'native alert dialog', text: d.message });
  }
  return texts;
}

function scenarioFacts(c) {
  const f = c.form;
  return (f.scenarios || []).map((s) => {
    if (s.error || s.skipped) return { mode: s.mode, notRun: s.error || s.skipped };
    const st = (s.fieldStates || []).find((x) => x.xpath === c.xpath);
    const be = (s.fieldStatesBefore || []).find((x) => x.xpath === c.xpath);
    return {
      mode: s.mode, submittedBy: s.submittedBy, filled: s.filled, submissionWentThrough: s.submissionWentThrough,
      fieldsFlagged: s.fieldsFlagged, focusAfter: s.focusAfter,
      thisField: st ? { constraintValid: st.constraintValid, ariaInvalid: st.ariaInvalid, borderBefore: be && be.borderColor, borderAfter: st.borderColor, outlineAfter: st.outline, backgroundBefore: be && be.background, backgroundAfter: st.background, value: st.value } : null,
    };
  });
}

function formImages(c) {
  const f = c.form, imgs = [];
  if (f.atRest && f.atRest.image) imgs.push({ label: 'the form as the page loads (before any input)', data: f.atRest.image });
  for (const s of f.scenarios || []) if (s.images && s.images.after) imgs.push({ label: `the form after the ${s.mode} submission`, data: s.images.after });
  return imgs;
}

function fieldFacts(c) {
  return (c.form.fields || []).find((x) => x.xpath === c.xpath) || null;
}

module.exports = { errorCandidates, errorTexts, scenarioFacts, formImages, fieldFacts };
