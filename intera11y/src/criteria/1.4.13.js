'use strict';
// 1.4.13 Content on Hover or Focus — author-controlled content that appears on hover or focus is dismissible,
// hoverable and persistent.
const S = require('../screen/select.js');
const { toolsOf } = require('../judge/rubric.js');

const allTrue = (a) => Array.isArray(a) && a.length && a.every(Boolean);
const anyFalse = (a) => Array.isArray(a) && a.some((v) => v === false);
const anyTrue = (a) => Array.isArray(a) && a.some(Boolean);

module.exports = {
  sc: '1.4.13', title: 'Content on Hover or Focus',
  probes: ['pointer'],
  tools: toolsOf('1.4.13'),
  // screening sweep: the element kinds it reads (its test rules are the criterion's rules)
  screen: { select: S.hoverish },

  identify(model, { pointer }) {
    return (pointer.triggers || []).filter((t) => (t.revealedOnHover && t.revealedOnHover.length) || anyTrue(t.visibleOnFocus))
      .map((t) => ({ xpath: t.xpath, kind: 'reveal-trigger', t }));
  },

  assess(c) {
    const t = c.t;
    const covers = (t.covers || []).length > 0;
    if (t.targetStillVisibleWithPointerOnIt === false) {
      return { status: 'FAIL', rule: 'not-hoverable', reason: `The content revealed by hovering this element disappears when the pointer moves from the trigger onto it by the shortest path (F95), so a user who needs to move the pointer over it (e.g. with magnification) cannot.` };
    }
    // content that disappears on its own may do so because its information is no longer valid — judged
    if (anyFalse(t.persistsAfterDwell)) return { status: 'OPEN', rule: 'disappears-while-hovered' };
    if (covers && anyTrue(t.visibleAfterEscape)) {
      return { status: 'OPEN', rule: 'escape-does-not-dismiss-covering-content' };
    }
    if (covers && anyTrue(t.visibleOnFocusAfterEscape)) {
      return { status: 'OPEN', rule: 'escape-does-not-dismiss-focus-content' };
    }
    if (t.targetStillVisibleWithPointerOnIt === true && allTrue(t.persistsAfterDwell) && (!covers || (!anyTrue(t.visibleAfterEscape) && !anyTrue(t.visibleOnFocusAfterEscape)))) {
      return { status: 'PASS', rule: 'dismissible-hoverable-persistent', reason: `The revealed content stays while the pointer is on the trigger (6 s) and while it moves onto the content${covers ? ', and Escape dismisses it' : ', and it does not cover other content'}.` };
    }
    return { status: 'OPEN', rule: 'incomplete-behaviour-facts' };
  },

  evidence(c) {
    const t = c.t;
    return {
      facts: {
        foundBy: t.why,
        revealedOnHover: t.revealedOnHover,
        coversOtherVisibleContent: t.covers,
        stillVisibleAfter6sPointerStill: t.persistsAfterDwell,
        stillVisibleAfterPointerTravelsOntoIt: t.stillVisibleWithPointerOnContent, pointerTravel: t.pointerTravel, travelledOntoContentStillVisible: t.targetStillVisibleWithPointerOnIt,
        stillVisibleAfterEscapeWithPointerUnmoved: t.visibleAfterEscape,
        triggerFocusable: t.triggerFocusable,
        visibleOnKeyboardFocus: t.visibleOnFocus,
        stillVisibleAfterEscapeWithFocusUnmoved: t.visibleOnFocusAfterEscape,
      },
    };
  },
};
