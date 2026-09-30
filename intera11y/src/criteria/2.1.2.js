'use strict';
// 2.1.2 No Keyboard Trap — focus that can enter a part of the page can leave it with the keyboard.
const { PAGE, expectedTabbable, labelOf } = require('./common.js');
const { key, within } = require('../lib/xpath.js');
const S = require('../screen/select.js');
const { toolsOf } = require('../judge/rubric.js');

module.exports = {
  sc: '2.1.2', title: 'No Keyboard Trap',
  probes: ['keyboard', 'activation'],
  tools: toolsOf('2.1.2'),
  // screening sweep: the element kinds it reads (its test rules are the criterion's rules)
  screen: { select: S.any(S.interactive, S.dialogs) },

  // an element the Tab walk reached and then left, in a ring that closed at the document boundary, does not trap focus
  assessScreened(c, { keyboard: kb }) {
    if (!kb || kb.wrapKind !== 'boundary' || kb.completeness !== 'complete') return null;
    const k = key(c.xpath);
    const at = (kb.stops || []).findIndex((s) => within(key(s.xpath), k));
    if (at < 0 || at >= kb.stops.length - 1) return null;
    // Tab left focus on this element (the walk went on by script): it did not move past by keyboard
    if ((kb.stalls || []).some((x) => within(key(x.xpath), k)) || kb.stops[at + 1].reachedBy === 'script-after-stall') return null;
    return { status: 'PASS', rule: 'walk-moved-past', reason: `The Tab walk reached this element (stop ${at}) and moved on to ${kb.stops.length - 1 - at} later stop(s), and the Tab ring closed at the document boundary, so focus is not trapped here.` };
  },

  identify(model, { keyboard: kb, activation }) {
    const out = [];
    for (const t of kb.traps.confirmed) out.push({ xpath: t.regionXpath, kind: 'region-trap', trap: t });
    for (const t of kb.traps.directional) out.push({ xpath: t.regionXpath, kind: 'region-one-way', trap: t });
    for (const t of kb.retentionTraps) out.push({ xpath: t.xpath, kind: 'focus-retention', trap: t });
    for (const t of kb.confinement) out.push({ xpath: t.xpath, kind: 'confined-set', trap: t });
    if (kb.wrapKind === 'revisit-without-boundary') out.push({ xpath: kb.revisit.from, kind: 'ring-closes-without-boundary', ring: kb });
    if (kb.backward && kb.backward.wrapKind === 'revisit-without-boundary') out.push({ xpath: kb.backward.revisit.from, kind: 'reverse-ring-closes-without-boundary', ring: kb });
    // an element on which Tab (or Shift+Tab) leaves focus in place: whether the other direction or another key gets out
    for (const st of kb.stalls || []) out.push({ xpath: st.xpath, kind: 'tab-does-not-advance', stall: { direction: 'Tab', ...st } });
    for (const st of (kb.backward && kb.backward.stalls) || []) out.push({ xpath: st.xpath, kind: 'tab-does-not-advance', stall: { direction: 'Shift+Tab', ...st } });
    // content opened by a control, which holds focus in both directions and does not close on Escape
    for (const c of (activation && activation.controls) || []) {
      const rk = c.keyboard && c.keyboard.revealedKeyboard;
      if (rk && !rk.tabForwardLeftRegion && !rk.tabBackwardLeftRegion && rk.escape.stillOpen) out.push({ xpath: rk.regions[0], kind: 'revealed-holds-focus', opener: c });
    }
    // the whole Tab ring is always a candidate: it is where a trap no detector recognised would show
    if (!out.length) out.push({ xpath: PAGE, kind: 'tab-ring', ring: kb });
    const seen = new Set();
    return out.filter((c) => { const k = c.kind + key(c.xpath); if (seen.has(k)) return false; seen.add(k); return true; });
  },

  assess(c, { keyboard: kb }) {
    const t = c.trap || {};
    if (c.kind === 'region-trap') return { status: 'FAIL', rule: 'region-trap', reason: `Focus inside ${c.xpath} cannot leave it: Tab and Shift+Tab both cycle inside the region (${t.focusableCount} focusable elements), and neither Escape nor a close control inside it releases focus.` };
    if (c.kind === 'focus-retention') return { status: 'FAIL', rule: 'focus-retention', reason: 'The element pulls focus back to itself when focus leaves it, in both Tab directions.' };
    if (c.kind === 'confined-set' && t.lyingAdvisory) return { status: 'FAIL', rule: 'advised-exit-fails', reason: 'Focus is confined to a fixed set of elements, and the exit key the page advises does not release it.' };
    if (c.kind === 'tab-ring' && kb.wrapKind === 'boundary' && kb.completeness === 'complete' && kb.backward && kb.backward.wrapKind === 'boundary' && !(kb.stalls || []).length && !(kb.backward.stalls || []).length) {
      return { status: 'PASS', rule: 'ring-wraps', reason: `The Tab sequence (${kb.stops.length} stops) and the Shift+Tab sequence both run through to the end of the page and back to the browser, and no region, element, fixed set of elements or opened content holds focus.` };
    }
    return { status: 'OPEN', rule: c.kind };
  },

  evidence(c, { keyboard: kb }, model) {
    const expected = expectedTabbable(model);
    const reached = new Set(kb.stops.map((s) => key(s.xpath)));
    const unreached = expected.filter((e) => !reached.has(key(e.xpath))).slice(0, 25).map((e) => ({ path: e.xpath, tag: e.tag, name: labelOf(model, e.xpath) }));
    const seq = kb.stops.slice(0, 80).map((s) => `${s.index}: ${s.tag} "${labelOf(model, s.xpath)}" ${s.xpath}`);
    return {
      facts: {
        candidateKind: c.kind,
        detector: c.trap || undefined,
        stall: c.stall ? { ...c.stall, note: 'pressing this key with focus on the element left focus where it was; the walk continued from the next element in sequential order by script' } : undefined,
        tabStalls: (kb.stalls || []).length ? kb.stalls : undefined,
        shiftTabStalls: kb.backward && (kb.backward.stalls || []).length ? kb.backward.stalls : undefined,
        openedBy: c.opener ? { control: c.opener.xpath, name: labelOf(model, c.opener.xpath), revealed: c.opener.keyboard.revealed, focusAfterOpening: c.opener.keyboard.revealedKeyboard.focusAfterActivation, tabForward: c.opener.keyboard.revealedKeyboard.tabForward, tabBackward: c.opener.keyboard.revealedKeyboard.tabBackward, escape: c.opener.keyboard.revealedKeyboard.escape } : undefined,
        reverseRing: kb.backward ? { stops: kb.backward.stops, closedBy: kb.backward.wrapKind, revisit: kb.backward.revisit } : undefined,
        tabRing: { stops: kb.stops.length, closedBy: kb.wrapKind, revisit: kb.revisit, sequence: seq },
        tabbableElementsNeverReachedByTab: unreached,
        tabbableElementsTotal: expected.length,
      },
    };
  },
};
