'use strict';
// 1.4.3 Contrast (Minimum) — text has at least 4.5:1 contrast with its background (3:1 for large text).
const S = require('../screen/select.js');
const { toolsOf } = require('../judge/rubric.js');

// the element or an ancestor (shadow host included) is disabled or aria-disabled, or labels a control that is (its
// <label>, or an aria-labelledby target): its text is part of an inactive user interface component, which 1.4.3
// exempts (aria-disabled applies to the element's descendants)
const parentOf = (x) => x.replace(/(>>)?\/[^/]*$/, '');
function inactive(e, model) {
  for (let x = e.xpath, d = 0; x && d < 40; x = parentOf(x), d++) { const a = model.get(x); if (a && (a.disabled || a.labelsInactiveControl)) return true; }
  return false;
}

module.exports = {
  sc: '1.4.3', title: 'Contrast (Minimum)',
  probes: ['content'],
  tools: toolsOf('1.4.3'),
  // screening sweep: the element kinds it reads (its test rules are the criterion's rules)
  screen: { select: S.text },

  // text a user can see (rendered, occupying space, not visually hidden or clipped out) that is not part of an
  // inactive user interface component
  applies: (e, model) => e.rendered && e.boxed && !e.visuallyHidden && !e.clippedOut && !inactive(e, model),
  applicability: 'The element is not visible text (not rendered, visually hidden or clipped out) or is part of an inactive (disabled) user interface component, so 1.4.3 does not apply.',

  identify(model, { content }) {
    return (content.texts || []).filter((t) => t.ratio !== undefined).map((t) => ({ xpath: t.xpath, kind: 'text', t }));
  },

  assess(c, obs, model) {
    const t = c.t;
    const e = model.get(t.xpath);
    // text the browser cannot give a single flat background to is judged from pixels — unless the rendered pixels
    // confirm the computed background (the dominant colour behind the text is that background)
    const onlyBackgroundImage = t.complex.every((x) => /^background-image/.test(x));
    const flat = !t.complex.length || (onlyBackgroundImage && t.renderedBackgroundAgrees && t.pixels.dominance >= 0.5);
    if (!flat || !t.renderedBackgroundAgrees) return { status: 'OPEN', rule: 'background-not-flat' };
    if (e && (e.ariaHiddenSelf || e.ariaHiddenAncestor) && !e.boxed) return { status: 'NOT_APPLICABLE', rule: 'invisible' };
    if (e && inactive(e, model)) return { status: 'NOT_APPLICABLE', rule: 'inactive-component', reason: 'The text is part of a disabled (inactive) user interface component, which 1.4.3 exempts.' };
    if (t.ratio >= t.threshold) return { status: 'PASS', rule: 'contrast-meets', reason: `Text rgb(${t.fg}) on rgb(${t.bg}) is ${t.ratio}:1 (≥ ${t.threshold}:1 for ${t.large ? 'large' : 'normal'} text, ${t.size}px weight ${t.weight}); the rendered background confirms the colour.` };
    return { status: 'OPEN', rule: 'contrast-below', reason: '' };
  },

  evidence(c) {
    const t = c.t;
    return {
      facts: {
        text: t.text, textColour: `rgb(${t.fg})`, computedBackground: `rgb(${t.bg})`, computedRatio: t.ratio, requiredRatio: t.threshold,
        fontSizePx: t.size, fontWeight: t.weight, largeText: t.large,
        backgroundCannotBeReducedToOneColourBecause: t.complex.length ? t.complex : undefined,
        renderedDominantBackground: t.pixels ? `rgb(${t.pixels.mode})` : undefined, renderedBackgroundAgreesWithComputed: t.renderedBackgroundAgrees,
        shareOfBoxInDominantColour: t.pixels ? t.pixels.dominance : undefined,
      },
      images: t.image ? [{ label: 'the text as rendered', data: t.image }] : [],
    };
  },
};
