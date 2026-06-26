'use strict';
// C5 — WCAG 3.3.1 / 3.3.2 / 3.3.3 form constraint + message-binding runner.
// The existing form-error-probe never BINDS the error to THE failing field nor passes the violated CONSTRAINT.
// This runner: (1) collects each field's constraint (required/type/pattern/min/max/len/step) + its instruction +
// group label; (2) drives a submit with an invalid value; (3) finds the error/suggestion that appears and BINDS it
// to the field (aria-describedby/errormessage IDREF, adjacency, or a page summary); (4) decides the STRUCTURAL
// checks (error present + identifies + bound; instruction present + proximate; suggestion present + reachable) and
// routes the SEMANTIC checks (error/suggestion CORRECTNESS vs the constraint; security-PURPOSE exception) to the
// rubric WITH the constraint + message text it needs.

// ---- in-page: field constraint + instruction + group label + a message snapshot ----
function collectFormFacts(fieldSel) {
  const field = document.querySelector(fieldSel);
  if (!field) return null;
  const cs = (a) => field.getAttribute(a);
  const type = (field.getAttribute('type') || field.tagName.toLowerCase());
  const constraint = {
    required: field.required === true || cs('aria-required') === 'true',
    type, pattern: cs('pattern') || null, min: cs('min'), max: cs('max'),
    maxlength: cs('maxlength'), minlength: cs('minlength'), step: cs('step'),
    inputmode: cs('inputmode') || null,
    nonObviousFormat: !!(cs('pattern') || /^(email|tel|url|date|time|datetime-local|month|week|number)$/.test(type) || /\b(format|MM|DD|YYYY|dd\/mm|mm\/dd)\b/i.test((field.getAttribute('placeholder') || '') + (field.getAttribute('title') || ''))),
  };
  // instruction: label text + aria-describedby/labelledby text + adjacent text
  const txt = (el) => el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : '';
  const ids = (a) => (cs(a) || '').split(/\s+/).filter(Boolean);
  let labelText = '';
  if (field.id) { const l = document.querySelector('label[for="' + (window.CSS && CSS.escape ? CSS.escape(field.id) : field.id) + '"]'); if (l) labelText = txt(l); }
  if (!labelText) { const lp = field.closest('label'); if (lp) labelText = txt(lp); }
  const describedby = ids('aria-describedby').map((i) => txt(document.getElementById(i))).filter(Boolean).join(' ');
  const labelledby = ids('aria-labelledby').map((i) => txt(document.getElementById(i))).filter(Boolean).join(' ');
  const placeholder = field.getAttribute('placeholder') || '';
  const title = field.getAttribute('title') || '';
  // group label: enclosing fieldset>legend OR [role=group/radiogroup] with aria-label/labelledby
  const fset = field.closest('fieldset'); const legend = fset ? txt(fset.querySelector('legend')) : '';
  const grp = field.closest('[role=group],[role=radiogroup]');
  const grpLabel = grp ? (grp.getAttribute('aria-label') || ids.call ? '' : '') : '';
  const groupLabel = legend || (grp && (grp.getAttribute('aria-label') || (grp.getAttribute('aria-labelledby') ? (grp.getAttribute('aria-labelledby').split(/\s+/).map((i) => txt(document.getElementById(i))).join(' ')) : ''))) || '';
  // SPLIT input (phone/date/SSN/OTP as N adjacent text/number inputs forming ONE logical field) also needs a group
  // label/name — detect ≥2 sibling inputs in the field's container with small maxlength / no individual real labels.
  const sibInputs = field.parentElement ? [...field.parentElement.querySelectorAll('input:not([type=hidden]):not([type=submit]):not([type=button]), select')] : [];
  const splitInput = sibInputs.length >= 2 && sibInputs.every((i) => { const ml = parseInt(i.getAttribute('maxlength'), 10); return !i.required || true; }) && sibInputs.filter((i) => { const ml = parseInt(i.getAttribute('maxlength'), 10); return Number.isFinite(ml) && ml <= 6; }).length >= 2;
  const inAGroup = !!(fset || grp || type === 'radio' || type === 'checkbox' || splitInput);
  // snapshot current message-ish text (to diff after submit)
  const msgNow = [...document.querySelectorAll('[role=alert],[aria-live],.error,.hint,.help,[class*=error],[class*=msg],small,output')].map((e) => txt(e)).filter(Boolean);
  return {
    constraint,
    instruction: { labelText, describedby, labelledby, placeholder, title, hasAny: !!(labelText || describedby || labelledby || placeholder || title) },
    group: { inAGroup, groupLabel, hasGroupLabel: !!groupLabel },
    fieldId: field.id || null, describedbyIds: ids('aria-describedby'), errormessageId: cs('aria-errormessage') || null,
    msgBefore: msgNow,
  };
}

// ---- in-page: after submit — find the error/suggestion + BIND it to the field ----
function observeMessages(fieldSel, beforeJson) {
  const field = document.querySelector(fieldSel); if (!field) return null;
  const before = new Set(JSON.parse(beforeJson || '[]'));
  const txt = (el) => el ? (el.textContent || '').replace(/\s+/g, ' ').trim() : '';
  const fr = field.getBoundingClientRect();
  const candidates = [...document.querySelectorAll('[role=alert],[aria-live],.error,.hint,.help,[class*=error],[class*=msg],small,output,p,span,div,li')];
  const msgs = [];
  for (const el of candidates) {
    const t = txt(el); if (!t || t.length > 300 || before.has(t)) continue;
    const r = el.getBoundingClientRect(); if (r.width < 1 || r.height < 1) continue;
    // binding signals
    const byDescribedby = field.getAttribute('aria-describedby') && field.getAttribute('aria-describedby').split(/\s+/).includes(el.id);
    const byErrormessage = field.getAttribute('aria-errormessage') === el.id && field.getAttribute('aria-invalid') === 'true';
    const isLive = el.matches('[role=alert],[aria-live],output');
    // Count a NEWLY-APPEARED candidate if it is BOUND or a LIVE region (an associated/announced field message — error
    // OR suggestion — regardless of wording: a SUGGESTION like "Use DD/MM/YYYY" carries no error keywords), else fall
    // back to the keyword/format heuristic for unbound text.
    if (!byDescribedby && !byErrormessage && !isLive && !/(invalid|error|required|must|please|enter|valid|incorrect|cannot|should|format|missing|wrong|try|use|example|e\.?g\.?|such as|MM|DD|YYYY|\d{2}[\/.\-]\d{2})/i.test(t)) continue;
    const adjacent = Math.abs(r.top - fr.bottom) < 60 && Math.abs(r.left - fr.left) < 200; // just below the field
    const inSummary = !!el.closest('[role=alert],[aria-live],[class*=summary],[class*=errors]') && !adjacent;
    msgs.push({ text: t, id: el.id || null, byDescribedby: !!byDescribedby, byErrormessage: !!byErrormessage, adjacent, inSummary });
  }
  const boundToField = msgs.filter((m) => m.byDescribedby || m.byErrormessage || m.adjacent);
  return {
    anyMessage: msgs.length > 0,
    boundCount: boundToField.length,
    boundProgrammatically: msgs.some((m) => m.byDescribedby || m.byErrormessage),
    boundAdjacent: msgs.some((m) => m.adjacent),
    onlyInSummary: msgs.length > 0 && msgs.every((m) => m.inSummary),
    messages: msgs.slice(0, 6),
  };
}

function disposeFormBinding(facts, obs, aspect) {
  if (!facts) return { decided: false, reason: 'field-not-found' };
  const c = facts.constraint;
  // ---- 3.3.2 instruction aspects (no submit needed) ----
  if (aspect === 'instruction-field-proximity') {
    if (!c.nonObviousFormat) return { decided: true, verdict: 'pass', reason: 'no non-obvious constraint requiring an instruction' };
    // a NAME (label) is not an INSTRUCTION — the format guidance must be FIELD-ATTACHED (describedby/placeholder/
    // title) or carried IN the label as format content. Otherwise the instruction is missing or stranded (= barrier).
    const fieldAttached = !!(facts.instruction.describedby || facts.instruction.placeholder || facts.instruction.title);
    const labelHasFormat = /\b(MM|DD|YYYY|hh|mm|format|e\.?g\.?|example|\d{2,4}[\/\-.]\d{2}|digits?|characters?|symbols?|uppercase|lowercase|@|\bphone\b.*\d|\bcode\b)\b/i.test(facts.instruction.labelText || '');
    if (fieldAttached || labelHasFormat) return { decided: true, verdict: 'pass', reason: 'format instruction is associated with the field (describedby/placeholder/title or in-label format)' };
    return { decided: true, verdict: 'fail', reason: 'a non-obvious format has NO field-attached instruction (a bare name label is not an instruction; a stranded instruction is not associated)' };
  }
  if (aspect === 'field-group-label-detection') {
    if (!facts.group.inAGroup) return { decided: true, verdict: 'pass', reason: 'field is not part of a group needing a group label' };
    return { decided: true, verdict: facts.group.hasGroupLabel ? 'pass' : 'fail', reason: facts.group.hasGroupLabel ? 'group has a legend/aria-label' : 'grouped fields have NO group label (legend/aria-label)' };
  }
  if (aspect === 'instruction-vs-constraint-consistency') {
    // SEMANTIC: does the instruction text contradict the actual constraint? Route to the rubric with both.
    return { decided: false, abstain: true, uncertainReason: 'instruction-vs-constraint consistency is a semantic match', facts: { instruction: facts.instruction, constraint: c } };
  }
  // ---- submit-driven aspects ----
  if (!obs) return { decided: false, abstain: true, uncertainReason: 'no submit observation available' };
  if (aspect === 'error-field-binding') {
    if (!obs.anyMessage) return { decided: true, verdict: 'fail', reason: 'submit produced NO error message at all (silent rejection)' };
    if (obs.boundProgrammatically || obs.boundAdjacent) return { decided: true, verdict: 'pass', reason: 'an error is bound to the failing field (' + (obs.boundProgrammatically ? 'aria-describedby/errormessage' : 'adjacent') + ')' };
    return { decided: true, verdict: 'fail', reason: 'an error appeared but is NOT bound to the failing field (stranded / summary-only / misbound)' };
  }
  if (aspect === 'error-indicator-name-correctness') {
    if (!obs.anyMessage) return { decided: true, verdict: 'fail', reason: 'no error identifying the field in error' };
    // a binding proves an error EXISTS for the field, but whether the error correctly + HUMANLY NAMES the right
    // field (vs the wrong field / a non-existent field / an internal token) is a text/semantic judgment ⇒ rubric.
    return { decided: false, abstain: true, uncertainReason: 'an error is present; whether it correctly NAMES the field in error is a semantic check', facts: { bound: obs.boundProgrammatically || obs.boundAdjacent, onlyInSummary: obs.onlyInSummary, messages: obs.messages } };
  }
  if (aspect === 'error-summary-coherence') {
    return { decided: false, abstain: true, uncertainReason: 'error-summary coherence (lists the actual failing fields) is a semantic check', facts: { messages: obs.messages } };
  }
  if (aspect === 'suggestion-reachability-proximity') {
    if (!obs.anyMessage) return { decided: true, verdict: 'fail', reason: 'submit produced no suggestion' };
    return { decided: true, verdict: (obs.boundProgrammatically || obs.boundAdjacent) ? 'pass' : 'fail', reason: (obs.boundProgrammatically || obs.boundAdjacent) ? 'suggestion is reachable/proximate to the field' : 'suggestion present but stranded/unreachable' };
  }
  if (aspect === 'suggestion-correctness-vs-constraint') {
    return { decided: false, abstain: true, uncertainReason: 'suggestion correctness vs the constraint is a semantic match', facts: { constraint: c, messages: obs.messages } };
  }
  if (aspect === 'security-exception-classification') {
    // The 3.3.3 security/purpose exception withholds suggesting the CORRECT VALUE, but COMPOSITION rules (length,
    // required chars) on a NEW credential ARE owed — and a field's real purpose (OTP/CVV/secret on a type=text) is
    // not encoded in markup. Both are semantic ⇒ route to the rubric with the constraint + messages. (type=password
    // is a security SIGNAL but does not settle composition-owed vs value-withheld.)
    return { decided: false, abstain: true, uncertainReason: 'security/purpose exception + composition-owed nuance is semantic — route to rubric with the field type + constraint + any suggestion text', facts: { constraint: c, messages: obs.messages } };
  }
  return { decided: false, abstain: true, uncertainReason: 'unhandled aspect' };
}

async function runFormBinding(page, { fieldSelector, submitSelector, invalidValue, aspect } = {}) {
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(r))).catch(() => {});
  const facts = await page.evaluate(collectFormFacts, fieldSelector).catch(() => null);
  let obs = null;
  if (submitSelector && facts) {
    try {
      await page.evaluate((sel, val) => { const f = document.querySelector(sel); if (f) { f.focus(); if ('value' in f) f.value = val == null ? '' : val; f.dispatchEvent(new Event('input', { bubbles: true })); f.dispatchEvent(new Event('change', { bubbles: true })); } }, fieldSelector, invalidValue);
      await page.evaluate((sel) => { const b = document.querySelector(sel); if (b) b.click(); }, submitSelector);
      await page.evaluate(() => new Promise((r) => setTimeout(r, 120)));
      obs = await page.evaluate(observeMessages, fieldSelector, JSON.stringify(facts.msgBefore || [])).catch(() => null);
    } catch (e) { /* ignore */ }
  }
  const d = disposeFormBinding(facts, obs, aspect);
  return { sc: aspect && /suggestion|security/.test(aspect) ? '3.3.3' : (aspect && /instruction|group/.test(aspect) ? '3.3.2' : '3.3.1'), aspect, facts, obs, ...d };
}

module.exports = { runFormBinding, disposeFormBinding, collectFormFacts, observeMessages };
