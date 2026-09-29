'use strict';
// 2.4.7 Focus Visible — every stop in the Tab sequence shows where focus is.
const { stopFacts, stopImages } = require('./common.js');
const { isPerceivableVisually } = require('../model/page-model.js');
const S = require('../screen/select.js');
const { toolsOf } = require('../judge/rubric.js');

module.exports = {
  sc: '2.4.7', title: 'Focus Visible',
  probes: ['keyboard'],
  tools: toolsOf('2.4.7'),
  // screening sweep: the element kinds it reads (its test rules are the criterion's rules)
  screen: { select: S.interactive },

  // an element that can receive keyboard focus by Tab
  applies: (e) => e.rendered && !e.inert && !e.disabled && (e.tabindex !== null ? e.tabindex >= 0 : e.nativeFocusable),
  applicability: 'The element cannot receive keyboard focus by Tab, so there is no keyboard focus to show.',

  identify(model, { keyboard }) {
    const out = (keyboard.stops || []).map((s) => ({ xpath: s.xpath, kind: 'tab-stop', stop: s }));
    // a control that throws focus away when it receives it (F55) — only where a user can see and reach it: content
    // hidden visually or from assistive technology (an off-screen carousel slide) is kept out of focus on purpose
    // inside a composite widget the arrow keys move the current item; the user must see where it is
    for (const w of keyboard.composites || []) out.push({ xpath: w.owner || w.xpath, kind: 'composite-navigation', w });
    for (const r of keyboard.rejections || []) {
      const e = model.get(r.xpath);
      if (e && isPerceivableVisually(e) && !e.ariaHiddenSelf && !e.ariaHiddenAncestor) out.push({ xpath: r.xpath, kind: 'focus-rejected', rejection: r });
    }
    return out;
  },

  assess(c) {
    if (c.kind === 'focus-rejected') return { status: 'FAIL', rule: 'focus-rejected', reason: 'The control removes focus from itself as soon as it receives it (F55), so focus is never visible on it.' };
    if (c.kind === 'composite-navigation') {
      const moved = c.w.steps.filter((st, i) => { const p = i ? c.w.steps[i - 1] : null; return !p || st.focus !== p.focus || st.activeDescendant !== p.activeDescendant; });
      const movedVisibly = moved.filter((st) => st.changedPixelsInWidget > 0);
      if (moved.length && !movedVisibly.length) return { status: 'FAIL', rule: 'arrow-navigation-invisible', reason: `Arrow keys move the current item of this ${c.w.role} (focus or aria-activedescendant changes) but nothing on screen changes, so a keyboard user cannot see where they are.` };
      return { status: 'OPEN', rule: 'composite-navigation' };
    }
    const s = c.stop;
    if (s.inFrame) return { status: 'NOT_APPLICABLE', rule: 'frame', reason: 'Focus is on a frame; a missing frame focus indicator is not a content failure (Trusted Tester 4.D).' };
    const i = s.indicator || {};
    if (i.error || !i.comparable) return { status: 'OPEN', rule: 'indicator-unmeasured' };
    if (s.visibleWhenFocused && i.changedPixelsViewport === 0 && !Object.keys(i.styleDelta || {}).length) {
      return { status: 'FAIL', rule: 'no-change-on-focus', reason: 'Nothing on screen changes when this element receives keyboard focus: the focused and unfocused renderings are pixel-identical and no computed style changes.' };
    }
    const drawnBy = Object.keys(i.styleDelta || {}).filter((k) => /^(outline-style|outline-width|outline-color|box-shadow|border-|background-color|color|text-decoration-line)/.test(k));
    if (drawnBy.length && s.visibleWhenFocused && !s.occludedBy && i.changedPixelsNear >= 0.5 * i.perimeter && i.meanColourDelta >= 80 && i.camouflagedFraction !== null && i.camouflagedFraction < 0.5) {
      return { status: 'PASS', rule: 'indicator-drawn', reason: `Focus draws a distinct change at the element: ${i.changedPixelsNear} pixels change (≥ half its ${i.perimeter}px perimeter) by a mean colour distance of ${i.meanColourDelta}, and most of the change (${Math.round((1 - i.camouflagedFraction) * 100)}%) is a colour not already present next to it; it is drawn by ${drawnBy.join(', ')}.` };
    }
    return { status: 'OPEN', rule: 'indicator-weak-or-remote' };
  },

  evidence(c) {
    if (c.kind === 'focus-rejected') return { facts: c.rejection };
    if (c.kind === 'composite-navigation') return { facts: { widget: c.w.role, usesActiveDescendant: c.w.usesActiveDescendant, arrowKeySteps: c.w.steps }, images: c.w.image ? [{ label: 'the widget after the arrow-key steps', data: c.w.image }] : [] };
    return { facts: stopFacts(c.stop), images: stopImages(c.stop) };
  },
};
