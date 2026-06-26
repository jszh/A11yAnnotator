'use strict';
// C2 reveal. The deterministic runner already has ZERO false-barriers, so there is nothing for an FB-reducing
// fail-review to clear — the integrated path is pure pass-through. C2's only micro-check value is the ABSTAIN-
// ESCALATION ("instruction appears on focus — is it adequate?", 3.3.2), which ADDS false-barriers, so it is DEFERRED
// behind `escalateAbstains` (default false; docs/DEFERRED-TODO.md: micro-check abstain-escalation).
const { runReveal } = require('./reveal-state-runner.js');
const { resolveEscalation } = require('./micro-checks.js');

async function runRevealChecklist(page, { aspect, triggerSelector, interaction, revealedSelector, expectFocusReturn, escalateAbstains = false, escalate = resolveEscalation } = {}) {
  const d = await runReveal(page, { aspect, triggerSelector, interaction, revealedSelector, expectFocusReturn });
  if (!escalateAbstains) return { ...d, checklist: [] }; // integrated path: deterministic only (C2 has 0 false-barriers)
  if (aspect === 'focus-revealed-instruction' && d.decided === false && d.abstain && d.facts && d.facts.focusShows) {
    const instruction = await page.evaluate((sel) => { const el = sel ? document.querySelector(sel) : null; return el ? (el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 160) : ''; }, revealedSelector).catch(() => '');
    const fieldName = await page.evaluate((sel) => { const el = sel ? document.querySelector(sel) : null; return el ? (el.getAttribute('aria-label') || (el.labels && el.labels[0] && el.labels[0].textContent) || el.name || '') : ''; }, triggerSelector).catch(() => '');
    const esc = await escalate('instruction-adequate', { instruction, fieldName });
    if (esc.escalate) return { ...d, decided: true, abstain: false, verdict: 'fail', via: 'instruction-adequate', reason: 'instruction-adequate → barrier (skeptic-confirmed): ' + ((esc.raw && esc.raw.reason) || ''), checklist: [{ check: 'instruction-adequate', result: esc.result, raw: esc.raw, skeptic: esc.skeptic }] };
  }
  return { ...d, checklist: [] };
}
module.exports = { runRevealChecklist };
