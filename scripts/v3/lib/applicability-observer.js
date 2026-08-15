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
  // 1.4.13 TRIGGER — re-derived INDEPENDENTLY (Rule 15), but no longer with the PRE-generalization
  // definition. This used to be `title || aria-describedby` only, which the round-3 collector work made
  // obsolete: a modern hover/focus reveal is wired with a listener or pure CSS and carries neither
  // attribute. The runner reports hasTrigger unconditionally (the collector already established there IS
  // hover content), so the two flags could only AGREE when one of those two attributes happened to be
  // present — and on every other page a fully PROVEN barrier (anyPropertyFails + !hoverable +
  // !dismissible) failed Rule-15 binding, degraded to a deterministic PARTIAL, and was dropped before the
  // LLM fill. The runner SUCCEEDING is what caused the miss.
  //
  // Widened along two independent axes, neither copied from the runner:
  //  (a) declarative popup/description attributes, and
  //  (b) a CSS rule keyed on :hover/:focus that MATCHES this element (`li:hover > .submenu`), read from
  //      the live stylesheets — the shape the collector generalization was built for.
  const hasTriggerAttr = el.hasAttribute('title') || el.hasAttribute('aria-describedby')
    || el.hasAttribute('aria-controls') || el.hasAttribute('aria-haspopup')
    || el.hasAttribute('aria-expanded') || el.hasAttribute('data-tooltip');
  let cssTrigger = false;
  try {
    for (const sheet of document.styleSheets) {
      let rules = null;
      try { rules = sheet.cssRules; } catch (e) { continue; }   // cross-origin sheet — not readable
      if (!rules) continue;
      for (const rule of rules) {
        const sel = rule && rule.selectorText;
        if (!sel || !/:(hover|focus|focus-within|focus-visible)\b/.test(sel)) continue;
        for (const part of sel.split(',')) {
          // take the portion LEFT of the pseudo-class and test whether this element is the trigger
          const m = part.trim().match(/^(.*?):(?:hover|focus|focus-within|focus-visible)\b/);
          if (!m || !m[1] || !m[1].trim()) continue;
          try { if (el.matches(m[1].trim())) { cssTrigger = true; break; } } catch (e) { /* invalid selector */ }
        }
        if (cssTrigger) break;
      }
      if (cssTrigger) break;
    }
  } catch (e) { /* stylesheet enumeration blocked — fall back to the attribute signal */ }
  const hasTrigger = hasTriggerAttr || cssTrigger;
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
