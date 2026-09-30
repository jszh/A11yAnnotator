'use strict';
// 2.1.1 Keyboard — everything a pointer user can operate, a keyboard user can operate.
const { stopByKey, labelOf } = require('./common.js');
const { key } = require('../lib/xpath.js');
const { isPerceivableVisually, isReachableVisually } = require('../model/page-model.js');
const S = require('../screen/select.js');
const { toolsOf } = require('../judge/rubric.js');

const NATIVE = /^(a|button|input|select|textarea|summary|iframe|audio|video)$/;
const POINTER = /click|mousedown|pointerdown|mouseup|pointerup|dblclick|touchstart/;

function pointerHandled(e) { return !!(e.listeners && POINTER.test(e.listeners)) || e.inlineHandlers.some((h) => /click|mousedown/.test(h)); }

function effectOf(k) {
  if (!k || !k.effect) return null;
  const parts = [];
  if (k.revealed && k.revealed.length) parts.push(`revealed ${k.revealed.length} region(s)`);
  if (k.hidden && k.hidden.length) parts.push(`hid ${k.hidden.length} region(s)`);
  if (k.newText && k.newText.length) parts.push(`${k.newText.length} new/changed text(s)`);
  if (k.modal) parts.push('opened a dialog');
  if (k.navigationBlocked && k.navigationBlocked.length) parts.push(`navigation to ${k.navigationBlocked[0]}`);
  const t = k.trigger || {};
  if (JSON.stringify(t.attrsBefore) !== JSON.stringify(t.attrsAfter) || JSON.stringify(t.axBefore) !== JSON.stringify(t.axAfter)) parts.push('changed its own state');
  return parts.join(', ') || 'focus or scroll moved';
}
// an effect a user would notice as "the control did something" (not just focus/scroll movement)
const substantive = (k) => !!(k && k.effect && ((k.revealed && k.revealed.length) || (k.hidden && k.hidden.length) || (k.newText && k.newText.length) || k.modal || (k.navigationBlocked && k.navigationBlocked.length)
  || JSON.stringify((k.trigger || {}).attrsBefore) !== JSON.stringify((k.trigger || {}).attrsAfter)));

module.exports = {
  sc: '2.1.1', title: 'Keyboard',
  probes: ['keyboard', 'activation', 'pointer'],
  tools: toolsOf('2.1.1'),
  // screening sweep: the element kinds it reads (its test rules are the criterion's rules)
  screen: { select: S.interactive },

  // 2.1.1 asks that what a pointer can operate, a keyboard can too. It does not reach content no input can operate
  // now: inert behind an open modal dialog, pointer and keyboard are both blocked until the dialog closes
  applies: (e) => !e.modalBlocked,
  applicability: 'Nothing can operate this element now (it is inert behind an open modal dialog), so keyboard operability does not apply to it.',

  identify(model, { keyboard, activation, pointer }) {
    const stops = stopByKey(keyboard);
    const acts = new Map(((activation && activation.controls) || []).map((c) => [key(c.xpath), c]));
    const out = [];
    const vw = 1280 * 900;
    for (const e of model.elements) {
      // a control in view, or brought into view by scrolling its region (a carousel slide): a keyboard user must be
      // able to operate it once it is shown
      if (!isReachableVisually(e) || e.tag === 'html' || e.tag === 'body' || e.disabled) continue;
      const widgetRole = e.role && /^(button|link|tab|menuitem|menuitemcheckbox|menuitemradio|switch|checkbox|radio|option|treeitem|slider|spinbutton|combobox|gridcell)$/.test(e.role);
      const native = NATIVE.test(e.tag) && !(e.tag === 'a' && !/\shref=/.test(e.openTag));
      const handled = pointerHandled(e) && !native;
      if (!widgetRole && !handled && !native) continue;
      if (native && !widgetRole) {
        // a native control: operable by keyboard when it is in the Tab sequence
        out.push({ xpath: e.xpath, kind: 'native', el: e, stop: stops.get(key(e.xpath)) || null, act: acts.get(key(e.xpath)) || null });
        continue;
      }
      // a large container with a handler is event delegation, not a control
      if (handled && !widgetRole && e.rect.w * e.rect.h > vw * 0.4) continue;
      const inner = model.elements.filter((x) => x.xpath.startsWith(e.xpath + '/') && stops.has(key(x.xpath)));
      out.push({ xpath: e.xpath, kind: 'custom', el: e, stop: stops.get(key(e.xpath)) || null, innerStops: inner.map((x) => x.xpath), act: acts.get(key(e.xpath)) || null });
    }
    // a control that throws focus away when it receives it (F55) — only where a user can see and reach it: content
    // hidden visually or from assistive technology (an off-screen carousel slide) is kept out of focus on purpose
    for (const w of keyboard.composites || []) out.push({ xpath: w.owner || w.xpath, kind: 'composite-navigation', w });
    // pointer-only operations the walk cannot see: drag and drop
    for (const e of model.elements) {
      if (!isPerceivableVisually(e)) continue;
      if (/\sdraggable="true"/.test(e.openTag) || (e.listeners && /dragstart|drop|dragover/.test(e.listeners))) out.push({ xpath: e.xpath, kind: 'drag-drop', el: e, stop: stops.get(key(e.xpath)) || null });
    }
    for (const r of keyboard.rejections || []) {
      const e = model.get(r.xpath);
      if (e && isPerceivableVisually(e) && !e.ariaHiddenSelf && !e.ariaHiddenAncestor) out.push({ xpath: r.xpath, kind: 'focus-rejected', rejection: r });
    }
    for (const t of (pointer && pointer.triggers) || []) {
      if (!t.revealedOnHover || !t.revealedOnHover.length) continue;
      if (t.triggerFocusable && t.visibleOnFocus && t.visibleOnFocus.every(Boolean)) continue; // focus reveals the same content
      out.push({ xpath: t.xpath, kind: 'hover-only-content', t, stop: stops.get(key(t.xpath)) || null });
    }
    const seen = new Set();
    return out.filter((c) => { const k = c.kind + key(c.xpath); if (seen.has(k)) return false; seen.add(k); const e = model.get(c.xpath); return !e || module.exports.applies(e); });
  },

  assess(c) {
    if (c.kind === 'focus-rejected') return { status: 'FAIL', rule: 'focus-rejected', reason: 'The control removes focus from itself when it receives it (F55), so it cannot be operated from the keyboard.' };
    if (c.kind === 'native') {
      // the page's own key handlers on the element can intercept the keys the browser would use — then what
      // operating it actually did decides
      const keyHandled = !!(c.el.listeners && /key(down|up|press)/.test(c.el.listeners)) || c.el.inlineHandlers.some((h) => /onkey/.test(h));
      if (c.stop && keyHandled) {
        const k = c.act && c.act.keyboard;
        if (k && substantive(k) && !k.heldOnly) return { status: 'PASS', rule: 'keyboard-operates', reason: `In the Tab sequence (stop ${c.stop.index}); it has its own key handlers, and ${k.key} ${effectOf(k)}.` };
        return { status: 'OPEN', rule: k && k.heldOnly ? 'responds-only-to-held-key' : 'native-with-key-handlers' };
      }
      if (c.stop) return { status: 'PASS', rule: 'native-in-tab-sequence', reason: `A native <${c.el.tag}> in the Tab sequence (stop ${c.stop.index}); the browser operates it from the keyboard.` };
      if (c.el.tabindex !== null && c.el.tabindex < 0) return { status: 'OPEN', rule: 'native-removed-from-tab-sequence' };
      return { status: 'OPEN', rule: 'native-not-reached' };
    }
    if (c.kind === 'composite-navigation') {
      const left = c.w.steps.some((st) => !st.insideWidget && !st.activeDescendant);
      const moved = c.w.steps.some((st, i) => { const p = i ? c.w.steps[i - 1] : null; return !p ? true : st.focus !== p.focus || st.activeDescendant !== p.activeDescendant; });
      if (!left && moved && c.w.steps.every((st) => st.insideWidget || st.activeDescendant)) return { status: 'PASS', rule: 'arrows-operate-widget', reason: `Arrow keys move through the ${c.w.role} and focus stays in it.` };
      return { status: 'OPEN', rule: left ? 'focus-leaves-widget-on-arrows' : 'arrows-do-not-move' };
    }
    if (c.kind === 'hover-only-content' || c.kind === 'drag-drop') return { status: 'OPEN', rule: c.kind };
    const a = c.act;
    if (c.stop && a && a.keyboard && a.keyboard.effect && a.keyboard.heldOnly) {
      return { status: 'OPEN', rule: 'responds-only-to-held-key' };
    }
    if (c.stop && a && a.keyboard && substantive(a.keyboard)) return { status: 'PASS', rule: 'keyboard-operates', reason: `In the Tab sequence (stop ${c.stop.index}), and ${a.keyboard.key} ${effectOf(a.keyboard)}.` };
    if (c.stop && a && a.keyboard && !a.keyboard.effect && substantive(a.pointer)) {
      return { status: 'FAIL', rule: 'keyboard-does-not-operate', reason: `The element receives keyboard focus, but Enter and Space do nothing, while a mouse click ${effectOf(a.pointer)}.` };
    }
    return { status: 'OPEN', rule: c.stop ? 'custom-control-effect-unclear' : 'custom-control-not-in-tab-sequence' };
  },

  evidence(c, obs, model) {
    if (c.kind === 'focus-rejected') return { facts: c.rejection };
    if (c.kind === 'composite-navigation') return { facts: { widget: c.w.role, usesActiveDescendant: c.w.usesActiveDescendant, arrowKeySteps: c.w.steps } };
    if (c.kind === 'drag-drop') return { facts: { operatedByDragging: true, handlers: c.el.listeners, draggableAttr: /draggable="true"/.test(c.el.openTag), inTabSequence: c.stop ? `stop ${c.stop.index}` : false, note: 'look on the page (visible text, other controls) for a keyboard way to do what dragging does' } };
    if (c.kind === 'hover-only-content') {
      return { facts: { revealedOnHover: c.t.revealedOnHover, triggerFocusable: c.t.triggerFocusable, triggerInTabSequence: !!c.stop, revealedOnKeyboardFocus: c.t.visibleOnFocus } };
    }
    const facts = {
      inTabSequence: c.stop ? `stop ${c.stop.index}` : false,
      tabindex: c.el.tabindex,
      pointerHandlers: c.el.listeners || c.el.inlineHandlers.join(',') || null,
      tabStopsInside: c.innerStops && c.innerStops.length ? c.innerStops.slice(0, 5).map((x) => `${x} "${labelOf(model, x)}"`) : undefined,
      // not in view at rest: scrolling this region (a carousel, a scrolled list) brings it into view
      shownByScrollingRegion: c.el.revealedByScrolling || undefined,
    };
    if (c.act) {
      facts.keyboard = c.act.keyboard ? { focusable: c.act.keyboard.focusable, key: c.act.keyboard.key, effect: effectOf(c.act.keyboard) } : 'not tested';
      facts.mouseClick = c.act.pointer ? { effect: effectOf(c.act.pointer) } : 'not tested (keyboard already had an effect, or native)';
    } else facts.operated = 'not tested (time limit)';
    return { facts };
  },
};
