'use strict';
// C5 as a CHECKLIST ORCHESTRATOR. The deterministic runner decides the STRUCTURAL items (error present? bound to the
// field? instruction attached? group labelled?); the SEMANTIC items it abstains on — each carrying the constraint +
// message text — are dispatched to TEXT-ONLY focused micro-checks (no crop; the cheapest + soundest case), then the
// verdict is recomposed. A check's 'barrier' turns an abstain into fail; 'clear' into pass; 'uncertain' keeps abstain.
const { runFormBinding } = require('./form-binding-runner.js');
const { resolveEscalation } = require('./micro-checks.js');

function describeConstraint(c) {
  if (!c) return 'unknown';
  const p = [];
  if (c.required) p.push('required');
  if (c.type && !['text', 'input'].includes(c.type)) p.push('type=' + c.type);
  if (c.pattern) p.push('pattern=' + c.pattern);
  if (c.min != null && c.min !== '') p.push('min=' + c.min);
  if (c.max != null && c.max !== '') p.push('max=' + c.max);
  if (c.minlength) p.push('minlength=' + c.minlength);
  if (c.maxlength) p.push('maxlength=' + c.maxlength);
  if (c.step) p.push('step=' + c.step);
  return p.join(', ') || 'no explicit machine constraint';
}

// aspect → { check, evidence(facts, obs, constraintStr, msgText, fieldName) }
const MAP = {
  'instruction-vs-constraint-consistency': { check: 'instruction-matches-constraint', ev: (f, o, c) => ({ constraint: c, instruction: (f && f.instruction && (f.instruction.describedby || f.instruction.labelText || f.instruction.placeholder || f.instruction.title)) || '' }) },
  'error-vs-actual-constraint-match': { check: 'error-describes-constraint', ev: (f, o, c, m) => ({ constraint: c, errorText: m }) },
  'error-indicator-name-correctness': { check: 'error-names-right-field', ev: (f, o, c, m, name) => ({ errorField: name, namedField: m || '(none)' }) },
  'error-summary-coherence': { check: 'error-summary-coherent', ev: (f, o, c, m, name) => ({ actualErrors: name + ' is invalid (' + c + ')', summary: m }) },
  'suggestion-correctness-vs-constraint': { check: 'suggestion-correct', ev: (f, o, c, m) => ({ constraint: c, suggestion: m }) },
  'security-exception-classification': { check: 'security-field-exempt', ev: (f, o, c, m, name) => ({ fieldName: name, fieldType: (f && f.constraint && f.constraint.type) || '', constraint: c }) },
};

// C5's deterministic FALSE-BARRIERS are few (the structural checks are reliable); its micro-check value is the
// ABSTAIN-ESCALATION (turning a semantic abstain into a caught barrier). Because escalation ADDS false-barriers, it is
// DEFERRED — gated behind `escalateAbstains` (default false) so the integrated path is purely deterministic. The
// escalation code is retained, off, as the documented TODO (docs/DEFERRED-TODO.md: micro-check abstain-escalation).
async function runFormBindingChecklist(page, { fieldSelector, submitSelector, invalidValue, aspect, escalateAbstains = false, escalate = resolveEscalation } = {}) {
  const d = await runFormBinding(page, { fieldSelector, submitSelector, invalidValue, aspect });
  if (!escalateAbstains) return { ...d, checklist: [] }; // integrated path: deterministic only (no FB added)
  if (!(d.decided === false && d.abstain)) return { ...d, checklist: [] };
  const m = MAP[aspect]; if (!m) return { ...d, checklist: [] };

  const facts = d.facts || (d.facts2) || null;
  const constraintStr = describeConstraint(facts && facts.constraint);
  const msgs = (d.obs && d.obs.messages) || (d.facts && d.facts.messages) || [];
  const msgText = msgs.map((x) => x.text || x).filter(Boolean).join(' | ') || '(no message text)';
  const fieldName = (facts && facts.instruction && facts.instruction.labelText) || (facts && facts.fieldId) || fieldSelector;

  const evidence = m.ev(facts, d.obs, constraintStr, msgText, fieldName);
  // ESCALATE-ONLY + skeptic-confirmed: a barrier escalates the abstain to a fail only when BOTH the focused check
  // (high confidence) and the skeptical second pass agree. A 'clear' never clears an abstain (false-clear-proof).
  const esc = await escalate(m.check, evidence);
  const item = { check: m.check, result: esc.result, raw: esc.raw, skeptic: esc.skeptic, escalate: esc.escalate, error: esc.error, evidence };
  if (esc.escalate) return { ...d, decided: true, abstain: false, verdict: 'fail', via: m.check, reason: m.check + ' → barrier (skeptic-confirmed): ' + ((esc.raw && esc.raw.reason) || ''), checklist: [item] };
  return { ...d, checklist: [item] }; // not confirmed ⇒ keep abstain
}

module.exports = { runFormBindingChecklist, describeConstraint };
