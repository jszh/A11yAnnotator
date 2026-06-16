'use strict';
// Harness 3.0 — VSR transcript ANALYSIS. Consumes the up-front vsr-collect transcript (a static
// artifact) and produces instrument findings — the harness USING the VSR to assess the page. Two checks:
//
//   (1) reading-order sanity — WCAG 1.3.2 Meaningful Sequence. The VSR reading order is DOM-driven; the
//       risk is a divergence from the VISUAL order (CSS reorders via flex/grid/float/absolute), so a
//       keyboard/SR user hears content in an order that doesn't match what's seen. Method (BAGEL-style):
//       compute the visual order (row-banded top-to-bottom, then left-to-right) and flag a reading step
//       whose visual position jumps grossly BACKWARD relative to its predecessor.
//
//   (2) announcement vs MEANING — WCAG 4.1.2 + semantic. A natively/ARIA interactive element announced
//       with NO accessible name is a SOUND barrier (the SR user cannot tell what it is). An announced
//       name that shares NO word with the visible text is a semantic-review CANDIDATE (could be a valid
//       icon-button with aria-label), never asserted here — fail-honest.

const { visualOrderDivergence } = require('./order-check.js');
const { isVsrNoisePhrase } = require('../../lib/a11y-eval.js');

const WIDGET_ROLES = /^(link|button|checkbox|radio|switch|tab|menuitem|menuitemcheckbox|menuitemradio|combobox|textbox|searchbox|listbox|slider|spinbutton|option|treeitem)$/;

// content steps only — drop the structural boundary (enter/exit) announcements AND the VSR root/landmark
// NOISE phrases (§5.2.1: inherit a11y-eval.isVsrNoisePhrase so a bare "document"/"navigation"/"main"
// announcement cannot pollute the reading-order or meaning check). An interactive control never carries
// one of those as its whole announced phrase, so this only sheds structural noise.
// NB: isVsrNoisePhrase('') is true (an empty announcement is "nothing"), but an empty-phrase step is
// NOT landmark noise — drop only steps whose phrase is a RECOGNIZED non-empty noise phrase, so a
// nameless widget (which the meaning check needs) survives while a bare "main"/"navigation" is shed.
const contentSteps = (t) => ((t && t.steps) ? t.steps : []).filter((s) => !s.boundary && s.xpath && !(s.phrase && isVsrNoisePhrase(s.phrase)));

// (1) reading order vs visual order — delegates to the shared detector (same logic as the keyboard
// 2.4.3 tab-order check), then restores the reading-order field shape (`phrase`).
function readingOrderFindings(t, opts = {}) {
  const items = contentSteps(t).map((s) => ({ xpath: s.xpath, rect: s.rect, label: s.phrase }));
  const r = visualOrderDivergence(items, { sc: '1.3.2', kind: 'reading-order', rowBand: opts.rowBand });
  return { findings: r.findings.map((f) => ({ kind: 'reading-order', sc: '1.3.2', xpath: f.xpath, phrase: f.label, detail: f.detail })), comparable: r.comparable };
}

const words = (s) => (s || '').toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(Boolean);

const SELECTISH = /^(combobox|listbox)$/;

// (2) announcement vs meaning.
function meaningFindings(t) {
  const findings = [];
  for (const s of contentSteps(t)) {
    const role = (s.role || '').toLowerCase();
    const name = (s.name || '').trim();
    const isWidget = WIDGET_ROLES.test(role) || (s.interactive === true && !role);
    if (!isWidget) continue;
    const selectish = s.tag === 'select' || SELECTISH.test(role);
    // A <select>/combobox with no <label> makes the VSR voice its FIRST OPTION as the "name". A real
    // label is never one of the options, so a name that is a substring of the option text (visibleText)
    // is an option leaking through ⇒ the control has NO accessible name (audit: unlabeled-select FN).
    // NOTE (3.1 §5.2.0/§6-item-8): with the CDP axName correction now applied in vsr-collect, an
    // unlabeled <select> already surfaces with name='' (probe-confirmed), so the `!name` branch below
    // catches it directly and this heuristic is REDUNDANT on the corrected path. It is retained as a
    // sound fallback for the raw path (collectVsrTranscript({cdpCorrect:false})); the plan defers its
    // removal until verified against the hand-labeled gold (currently on hold).
    const optionLeak = selectish && name && s.visibleText && s.visibleText.toLowerCase().includes(name.toLowerCase());
    if (!name || optionLeak) {
      findings.push({ kind: 'no-accessible-name', sc: '4.1.2', xpath: s.xpath, role: role || s.tag,
        detail: `interactive element announced with no accessible name (phrase: ${JSON.stringify(s.phrase)})` });
      continue;
    }
    // semantic-review candidate: announced name shares NO word with the visible text. Skip for
    // select/combobox/listbox (visibleText is the OPTION set, not a visible label) and when the name
    // normalizes to no words (pure emoji/symbol — overlap is undefined, not a mismatch).
    if (!selectish && s.visibleText && s.visibleText.length >= 3) {
      const nameWords = words(name);
      if (!nameWords.length) continue;
      const b = new Set(words(s.visibleText));
      const overlap = nameWords.some((w) => b.has(w));
      if (!overlap) findings.push({ kind: 'name-text-mismatch', sc: '4.1.2', review: true, xpath: s.xpath,
        announced: name, visibleText: s.visibleText, detail: 'announced name shares no word with the visible text — semantic review' });
    }
  }
  return { findings };
}

// Combine. Barriers = sound findings; review = candidates for semantic adjudication (never authoritative).
function analyzeTranscript(t, opts = {}) {
  const order = readingOrderFindings(t, opts);
  const meaning = meaningFindings(t);
  return {
    readingOrder: order.findings,
    meaning: meaning.findings.filter((f) => !f.review),
    meaningReview: meaning.findings.filter((f) => f.review),
    stats: {
      comparable: order.comparable,
      contentSteps: contentSteps(t).length,
      reachedEnd: !!t.reachedEnd,
      vsrTrap: !!(t.stoppedEarly || t.wrapped),  // forward VSR trap seen during collection (full detection: #9)
    },
  };
}

module.exports = { analyzeTranscript, readingOrderFindings, meaningFindings, contentSteps, WIDGET_ROLES };
