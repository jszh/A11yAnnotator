'use strict';
// 2.4.3 Focus Order — the order focus moves in preserves meaning and operability, including when content opens.
const { PAGE, labelOf } = require('./common.js');
const { visualOrderDivergence } = require('../lib/v3.js');
const S = require('../screen/select.js');
const { toolsOf } = require('../judge/rubric.js');

// true when every step of the Tab sequence moves forward in row-major reading order (a new row starts below the
// previous row's band; within a row, left to right) — page direction taken from the document (RTL: right to left)
function rowMajorAgreement(stops, rtl) {
  for (let i = 1; i < stops.length; i++) {
    const a = stops[i - 1].pageRect, b = stops[i].pageRect;
    const sameRow = Math.abs((a.y + a.h / 2) - (b.y + b.h / 2)) < Math.max(8, Math.min(a.h, b.h) / 2);
    if (sameRow ? (rtl ? b.x > a.x : b.x < a.x) : b.y + b.h / 2 < a.y + a.h / 2) return false;
  }
  return true;
}

// stops that are not controls a user would expect to land on: a focusable element nested in another stop, or
// static content made focusable
function oddStops(stops, model) {
  const xs = stops.map((s) => s.xpath);
  const out = [];
  for (const s of stops) {
    const e = model.get(s.xpath);
    const nestedIn = xs.find((x) => x !== s.xpath && s.xpath.startsWith(x + '/'));
    if (nestedIn) out.push({ stop: s.index, path: s.xpath, issue: `nested inside another stop ${nestedIn}` });
    else if (e && !e.nativeFocusable && e.tabindex >= 0 && !e.listeners && !e.inlineHandlers.length && (!e.ax || /^(generic|none|paragraph|StaticText|heading|image|img|listitem|list|group|Section)$/.test(e.ax.role || 'generic'))) out.push({ stop: s.index, path: s.xpath, issue: `static content made focusable (role ${e.ax ? e.ax.role : 'none'}, tabindex=${e.tabindex})` });
  }
  return out;
}

module.exports = {
  sc: '2.4.3', title: 'Focus Order',
  probes: ['keyboard', 'activation'],
  tools: toolsOf('2.4.3'),
  // screening sweep: the element kinds it reads (its test rules are the criterion's rules)
  screen: { select: S.any(S.interactive, S.dialogs), scope: 'page' },

  identify(model, { keyboard, activation }) {
    const out = [];
    if ((keyboard.stops || []).length >= 2) out.push({ xpath: PAGE, kind: 'tab-sequence' });
    for (const c of (activation && activation.controls) || []) {
      const k = c.keyboard;
      if (!k || !k.effect || !k.revealed || !k.revealed.some((r) => r.focusables > 0 || r.modal)) continue;
      out.push({ xpath: c.xpath, kind: 'opens-content', control: c });
    }
    return out;
  },

  assess(c, { keyboard }, model) {
    if (c.kind === 'tab-sequence') {
      const positive = keyboard.stops.filter((s) => { const e = model.get(s.xpath); return e && e.tabindex > 0; });
      const items = keyboard.stops.map((s) => ({ xpath: s.xpath, rect: s.pageRect, label: s.tag }));
      const div = visualOrderDivergence(items, { sc: '2.4.3', kind: 'tab-order' });
      c.divergence = div;
      const occluded = keyboard.stops.filter((s) => s.occludedBy).length;
      const outsideModal = keyboard.stops.filter((s) => s.modalOpen && !s.insideModal).length;
      const odd = oddStops(keyboard.stops, model);
      // the column-aware detector accepts reading down columns (sound for multi-column pages) — which is exactly
      // how a grid or calendar tabbed in column-major order looks; decide PASS only when the order also matches
      // plain row-major reading order, otherwise let the judge read the sequence map
      const rowMajor = rowMajorAgreement(keyboard.stops, model.doc.dir === 'rtl');
      if (div.comparable && !div.findings.length && rowMajor && !occluded && !outsideModal && !positive.length && !odd.length && keyboard.wrapKind === 'boundary') {
        return { status: 'PASS', rule: 'sequence-follows-layout', reason: `The ${keyboard.stops.length} Tab stops follow the visual reading order within each column, use no positive tabindex, include no nested or static-content stops, no stop is covered by other content, and no stop lies outside an open modal.` };
      }
      return { status: 'OPEN', rule: 'sequence-needs-judgment' };
    }
    const rk = c.control.keyboard.revealedKeyboard;
    if (!rk) return { status: 'OPEN', rule: 'opened-content-unprobed' };
    const firstTabInside = rk.tabForward.length && rk.tabForward[0].inside;
    const modal = c.control.keyboard.modal;
    if ((rk.focusAfterActivation.inside || firstTabInside) && !(modal && rk.tabForwardLeftRegion)) {
      return { status: 'PASS', rule: 'opened-content-next-in-order', reason: rk.focusAfterActivation.inside ? 'Opening it moves focus into the opened content.' : 'The next Tab after opening it lands in the opened content.' };
    }
    return { status: 'OPEN', rule: modal && rk.tabForwardLeftRegion ? 'modal-lets-focus-out' : 'opened-content-not-next' };
  },

  evidence(c, { keyboard }, model) {
    if (c.kind === 'tab-sequence') {
      const div = c.divergence || visualOrderDivergence(keyboard.stops.map((s) => ({ xpath: s.xpath, rect: s.pageRect })), { sc: '2.4.3' });
      const images = keyboard.sequenceMap ? [{ label: `the page (top ${keyboard.sequenceMap.coversHeight}px of ${keyboard.sequenceMap.documentHeight}px) with each Tab stop outlined and numbered in the order Tab reaches it`, data: keyboard.sequenceMap.image }] : [];
      return {
        facts: {
          sequence: keyboard.stops.slice(0, 150).map((s) => `${s.index}: ${s.tag} "${labelOf(model, s.xpath)}" at (${s.pageRect.x},${s.pageRect.y})${s.occludedBy ? ` covered-by ${s.occludedBy}` : ''}${s.modalOpen && !s.insideModal ? ' OUTSIDE-OPEN-MODAL' : ''} ${s.xpath}`),
          sequenceLength: keyboard.stops.length,
          outOfVisualOrderWithinColumn: div.findings,
          matchesRowMajorReadingOrder: rowMajorAgreement(keyboard.stops, model.doc.dir === 'rtl'), pageDirection: model.doc.dir,
          closedBy: keyboard.wrapKind,
          nestedOrStaticStops: oddStops(keyboard.stops, model),
          positiveTabindex: keyboard.stops.filter((s) => { const e = model.get(s.xpath); return e && e.tabindex > 0; }).map((s) => `${s.index}: tabindex=${model.get(s.xpath).tabindex} ${s.xpath}`),
        },
        images,
      };
    }
    const k = c.control.keyboard;
    const rk = k.revealedKeyboard || {};
    return {
      facts: {
        opener: `${c.control.xpath} "${labelOf(model, c.control.xpath)}"`,
        opened: k.revealed.map((r) => ({ path: r.xpath, text: r.text.slice(0, 120), focusables: r.focusables, modal: r.modal })),
        focusAfterOpening: rk.focusAfterActivation,
        tabForwardFromThere: rk.tabForward, tabBackwardFromThere: rk.tabBackward,
        escape: rk.escape,
      },
    };
  },
};
