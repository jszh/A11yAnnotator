// Harness 3.0 — INDEPENDENT applicability observer (plan Rule 15; audit V3R4-H6 faithful endpoint).
//
// The experiment runner emits both the OUTCOME and its own applicability flags. Rule 15 wants
// applicability established by a SEPARATE validator. This module is that validator: a minimal,
// structural observation pass — DIFFERENT code from the experiment runners — that re-derives the
// precondition facts (isTextNode / focusable / field / widget-role / hover-trigger / visible) for
// each target in a fresh page. The orchestrator runs it and ships an `applicability` artifact; the
// builder requires the runner's applicabilityEvidence to AGREE with this independent observation for
// every shared flag, else the claim is INCONCLUSIVE (PARTIAL) — channel-agreement discipline.
//
// Bounded honesty: this independently re-observes the STRUCTURAL flags. A few runtime flags
// (keyboardReachableInState, axNodeResolved, hydrationReady, viewportSet320) are not re-derived here
// and are not cross-checked; making the observation a MANDATORY bundle stage is the next increment.
'use strict';

const { nsXPath } = require('./xpath-ns.js'); // namespace-agnostic resolve (Tier-0 #1) — SVG/MathML subjects

// in-page: resolve an element by xpath and compute its structural applicability facts independently.
function observeFacts(xpath) {
  const r = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
  const el = r.singleNodeValue; if (!el) return null;
  const cs = getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  const visible = cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0 && rect.width > 0 && rect.height > 0;
  let ownsText = false;
  for (const n of el.childNodes) if (n.nodeType === 3 && n.textContent.trim()) ownsText = true;
  const role = el.getAttribute('role') || '';
  const tag = el.tagName;
  const type = (el.getAttribute('type') || '').toLowerCase();
  el.focus(); const focusable = document.activeElement === el; el.blur();
  const isUserInputField = (tag === 'INPUT' && !/^(hidden|button|submit|reset|image)$/i.test(type || 'text')) || tag === 'SELECT' || tag === 'TEXTAREA' || /^(textbox|combobox|listbox|spinbutton|searchbox)$/.test(role);
  const widget = /^(button|link|checkbox|switch|tab|menuitem|combobox|radio|slider)$/.test(role) || /^(BUTTON|A|INPUT|SELECT)$/.test(tag);
  const hasTrigger = el.hasAttribute('title') || el.hasAttribute('aria-describedby');
  return {
    isTextNode: ownsText,
    textRendersVisible: visible && ownsText,
    sizeClassResolved: (parseFloat(cs.fontSize) || 0) > 0,
    targetIsFocusable: focusable,
    targetIsInteractive: widget || isUserInputField,
    isUserInputField,
    fieldRendered: visible,
    targetHasWidgetRole: widget,
    hasHoverFocusTrigger: hasTrigger,
    triggerReachable: visible && rect.top >= 0 && rect.left >= 0,
  };
}

// the flags this observer independently re-derives (and the builder cross-checks against). Runtime
// flags outside this set are NOT cross-checked (documented bound).
const OBSERVED_FLAGS = Object.freeze(['isTextNode', 'textRendersVisible', 'sizeClassResolved', 'targetIsFocusable', 'targetIsInteractive', 'isUserInputField', 'fieldRendered', 'targetHasWidgetRole', 'hasHoverFocusTrigger', 'triggerReachable']);

// Run the observer over a fresh page for the given target xpaths. Returns [{ xpath, facts }].
async function observeApplicability(page, xpaths) {
  const observations = [];
  const seen = new Set();
  for (const xpath of xpaths) {
    if (!xpath || seen.has(xpath)) continue;
    seen.add(xpath);
    const facts = await page.evaluate(observeFacts, nsXPath(xpath)).catch(() => null); // SVG/MathML-aware; key stays raw
    if (facts) observations.push({ xpath, facts });
  }
  return observations;
}

// Does the runner's applicabilityEvidence AGREE with the independent observation for `xpath`? Checks
// only the observed flags present in BOTH. Returns { ok, disagreements[] }. An ABSENT observation for
// the xpath is a disagreement (we cannot corroborate) ⇒ fail closed.
function agreesWith(applicabilityArtifact, xpath, runnerAppEv) {
  const obs = (applicabilityArtifact && applicabilityArtifact.observations) || [];
  const o = obs.find((x) => x && x.xpath === xpath);
  if (!o || !o.facts) return { ok: false, disagreements: ['no independent observation for this target'] };
  const ev = runnerAppEv || {};
  const disagreements = [];
  for (const f of OBSERVED_FLAGS) {
    if (Object.prototype.hasOwnProperty.call(ev, f) && (ev[f] === true) !== (o.facts[f] === true)) {
      disagreements.push(`${f}: runner=${ev[f] === true} observer=${o.facts[f] === true}`);
    }
  }
  return { ok: disagreements.length === 0, disagreements };
}

module.exports = { OBSERVED_FLAGS, observeFacts, observeApplicability, agreesWith };
