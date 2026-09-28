'use strict';
// 4.1.2 Name, Role, Value — every user interface component exposes a name, a role, and its states/values to
// assistive technology, and keeps them current as the user operates it.
const { stopByKey, labelOf } = require('./common.js');
const { key } = require('../lib/xpath.js');
const { isRendered } = require('../model/page-model.js');
const S = require('../screen/select.js');
const { toolsOf } = require('../judge/rubric.js');

// roles whose accessible name is required — the controls ACT's name rules cover (97a4e1 button, c487ae link,
// e086e5 form fields, m6b1q3 menuitem, 59796f image button, 2t702h summary, cae760 iframe); containers such as
// menu or tablist are named optionally
const NAME_REQUIRED = new Set(['button', 'link', 'checkbox', 'radio', 'textbox', 'searchbox', 'combobox', 'listbox', 'menuitem',
  'menuitemcheckbox', 'menuitemradio', 'slider', 'spinbutton', 'switch', 'tab', 'treeitem', 'Iframe', 'iframe', 'DisclosureTriangle']);
const WIDGET_EXTRA = ['menu', 'menubar', 'tree', 'grid', 'radiogroup', 'tablist', 'meter', 'progressbar', 'scrollbar'];
const WIDGET = new Set([...NAME_REQUIRED, ...WIDGET_EXTRA, 'option', 'gridcell', 'row', 'columnheader', 'rowheader', 'tabpanel', 'dialog', 'alertdialog', 'toolbar']);
const INERT_ROLES = new Set(['generic', 'none', 'presentation', 'paragraph', 'StaticText', 'group', 'LineBreak', 'InlineTextBox', 'Section', 'div', 'span', 'image', 'img', 'listitem', 'list', 'text']);
const REQUIRED_STATES = { checkbox: ['aria-checked'], switch: ['aria-checked'], menuitemcheckbox: ['aria-checked'], menuitemradio: ['aria-checked'], radio: ['aria-checked'], slider: ['aria-valuenow'], scrollbar: ['aria-valuenow', 'aria-controls'], combobox: ['aria-expanded'], heading: ['aria-level'], option: [], meter: ['aria-valuenow'] };

function isPointerControl(e) {
  return !!(e.listeners && /click|mousedown|pointerdown|mouseup|pointerup|keydown/.test(e.listeners)) || e.inlineHandlers.length > 0;
}

module.exports = {
  sc: '4.1.2', title: 'Name, Role, Value',
  probes: ['keyboard', 'activation'],
  tools: toolsOf('4.1.2'),
  // screening sweep: the element kinds it reads (its test rules are the criterion's rules)
  screen: { select: S.any(S.interactive, S.formish) },

  identify(model, { keyboard, activation }) {
    const stops = stopByKey(keyboard);
    const acts = new Map(((activation && activation.controls) || []).map((c) => [key(c.xpath), c]));
    const out = [];
    for (const e of model.elements) {
      if (!isRendered(e)) continue;
      const k = key(e.xpath);
      const stop = stops.get(k) || null;
      const role = e.ax && e.ax.role;
      const component = stop || (role && WIDGET.has(role)) || e.nativeFocusable || (e.role && WIDGET.has(e.role)) || isPointerControl(e) || e.tag === 'iframe';
      if (!component) continue;
      out.push({ xpath: e.xpath, kind: stop ? 'tab-stop' : 'component', el: e, stop, act: acts.get(k) || null, axe: model.axe.of(e.xpath).filter((r) => r.scs.includes('4.1.2')) });
    }
    return out;
  },

  assess(c, obs, model) {
    const e = c.el, ax = e.ax || {};
    const hiddenFromAT = e.ariaHiddenSelf || e.ariaHiddenAncestor;
    // ACT 6cfa84: focus rests on an element assistive technology cannot perceive (the walk recorded focus resting here)
    if (c.stop && hiddenFromAT) {
      return { status: 'FAIL', rule: 'focus-rests-on-hidden', reason: `Keyboard focus lands and stays on this element (Tab stop ${c.stop.index}), but it is ${e.ariaHiddenSelf ? 'marked aria-hidden="true"' : 'inside an aria-hidden="true" container'}, so assistive technology gets no name, role or state for the focused control.` };
    }
    if (hiddenFromAT || ax.ignored) {
      return c.stop ? { status: 'OPEN', rule: 'focusable-but-ignored' } : { status: 'NOT_APPLICABLE', rule: 'not-exposed', reason: 'Not exposed to assistive technology and not reachable by keyboard.' };
    }
    const role = ax.role;
    // ACT 97a4e1 / c487ae / e086e5 / cae760: a component whose role requires a name has none
    const unreachableFrame = e.tag === 'iframe' && e.tabindex !== null && e.tabindex < 0;
    if (role && NAME_REQUIRED.has(role) && !unreachableFrame && !String(ax.name || '').trim() && !(e.tag === 'input' && e.type === 'hidden')) {
      return { status: 'FAIL', rule: 'no-accessible-name', reason: `The browser computes role "${role}" with an empty accessible name, so assistive technology announces the ${role} without saying what it is.` };
    }
    // a scripted control whose computed role is not a widget role (F59) — decided only when operating it demonstrably did something
    const inertRole = !role || INERT_ROLES.has(role);
    const clicked = c.act && ((c.act.pointer && c.act.pointer.effect) || (c.act.keyboard && c.act.keyboard.effect));
    if (inertRole && isPointerControl(e) && !e.nativeFocusable) {
      const wrapsNative = model.elements.some((x) => x !== e && x.xpath.startsWith(e.xpath + '/') && x.nativeFocusable && x.rendered);
      if (clicked && !wrapsNative) return { status: 'FAIL', rule: 'scripted-control-without-role', reason: `Operating this element changes the page (${describeEffect(c.act)}), but its computed role is "${role || 'none'}", so assistive technology does not present it as a control (F59).` };
      return { status: 'OPEN', rule: 'possible-scripted-control' };
    }
    const explicitRole = e.role && e.role.split(/\s+/)[0];
    const missing = explicitRole && REQUIRED_STATES[explicitRole] ? REQUIRED_STATES[explicitRole].filter((a) => !new RegExp(`\\s${a}=`).test(e.openTag)) : [];
    const stateNotExposed = c.act && stateChangeWithoutExposure(c.act);
    if (missing.length || stateNotExposed || c.axe.length) return { status: 'OPEN', rule: missing.length ? 'required-state-absent' : stateNotExposed ? 'state-change-not-exposed' : 'checker-finding', missing, stateNotExposed };
    if (e.tag === 'iframe') return { status: 'OPEN', rule: 'iframe' };
    // an author-assigned role must match how the component behaves — that is judged
    if (explicitRole) return { status: 'OPEN', rule: 'explicit-role' };
    // a native control whose name is the text a sighted user sees on it, whose operation changed nothing it did not
    // expose, is identified to assistive technology as it is to everyone else
    const visible = String(e.text || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const name = String(ax.name || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const nameIsVisibleText = visible.length >= 2 && name === visible && ax.nameFrom === 'contents';
    const operatedNameChange = c.act && c.act.keyboard && c.act.keyboard.trigger && c.act.keyboard.trigger.textAfter !== null
      && JSON.stringify((c.act.keyboard.trigger.axBefore || {}).name) !== JSON.stringify((c.act.keyboard.trigger.axAfter || {}).name);
    if (role && (NAME_REQUIRED.has(role) || WIDGET.has(role)) && nameIsVisibleText && !operatedNameChange && !(c.act && c.act.keyboard && c.act.keyboard.effect)) {
      return { status: 'PASS', rule: 'native-named-by-visible-text', reason: `Native element with computed role "${role}" whose name is its visible text ("${String(ax.name).slice(0, 60)}").` };
    }
    // otherwise whether its role, states and value are exposed (and kept current) is judged
    return { status: 'OPEN', rule: 'role-state-value-to-judge' };
  },

  evidence(c, obs, model) {
    const e = c.el;
    const facts = {
      tabStop: c.stop ? { index: c.stop.index, visibleWhenFocused: c.stop.visibleWhenFocused } : 'not in the Tab sequence',
      hiddenFromAT: e.ariaHiddenSelf ? 'aria-hidden on the element' : e.ariaHiddenAncestor ? 'inside an aria-hidden container' : null,
      pointerHandlers: e.listeners || (e.inlineHandlers.length ? e.inlineHandlers.join(',') : null),
      cursorPointer: e.cursorPointer || null,
      checkerFindings: c.axe.map((r) => `${r.kind} ${r.rule}: ${r.message}`),
      requiredStatesAbsent: c.assessment && c.assessment.missing && c.assessment.missing.length ? c.assessment.missing : undefined,
    };
    if (c.act) facts.operated = summariseActivation(c.act);
    if (e.tag === 'iframe') {
      const peers = model.elements.filter((x) => x.tag === 'iframe' && x !== e && x.ax && e.ax && x.ax.name && x.ax.name === e.ax.name);
      if (peers.length) facts.iframesWithSameName = peers.map((p) => p.xpath);
    }
    return { facts };
  },
};

function describeEffect(act) {
  const k = (act.pointer && act.pointer.effect ? act.pointer : act.keyboard) || {};
  const parts = [];
  if (k.revealed && k.revealed.length) parts.push(`reveals ${k.revealed.map((r) => JSON.stringify(r.text.slice(0, 40))).join(', ')}`);
  if (k.newText && k.newText.length) parts.push(`new text ${JSON.stringify(k.newText[0].text.slice(0, 40))}`);
  if (k.navigationBlocked && k.navigationBlocked.length) parts.push(`navigates to ${k.navigationBlocked[0]}`);
  if (k.modal) parts.push('opens a dialog');
  return parts.join('; ') || 'its state changes';
}

// The trigger's visible state changed (class/text/revealed content) but none of its exposed states did.
function stateChangeWithoutExposure(act) {
  const k = act.keyboard && act.keyboard.effect ? act.keyboard : act.pointer;
  if (!k || !k.effect || !k.trigger) return false;
  const t = k.trigger;
  const aria = ['aria-expanded', 'aria-pressed', 'aria-checked', 'aria-selected', 'aria-current'];
  const ariaChanged = aria.some((a) => (t.attrsBefore || {})[a] !== (t.attrsAfter || {})[a]);
  const axChanged = JSON.stringify(t.axBefore) !== JSON.stringify(t.axAfter);
  const visualChanged = (t.attrsBefore || {}).class !== (t.attrsAfter || {}).class || (k.revealed && k.revealed.length) || (k.hidden && k.hidden.length);
  return !!(visualChanged && !ariaChanged && !axChanged && !(k.navigationBlocked && k.navigationBlocked.length) && !k.modal);
}

function summariseActivation(act) {
  const s = (k) => k && {
    how: k.mode === 'keyboard' ? `focus + ${k.key}` : 'mouse click', effect: k.effect,
    triggerAttrsBefore: k.trigger && k.trigger.attrsBefore, triggerAttrsAfter: k.trigger && k.trigger.attrsAfter,
    computedBefore: k.trigger && k.trigger.axBefore, computedAfter: k.trigger && k.trigger.axAfter,
    revealed: (k.revealed || []).map((r) => ({ path: r.xpath, text: r.text.slice(0, 100), focusables: r.focusables })),
    hidden: (k.hidden || []).map((r) => r.xpath), modal: k.modal, focusMovedTo: k.focus && k.focus.after !== k.focus.before ? k.focus.after : null,
    navigationBlocked: k.navigationBlocked,
  };
  return { keyboard: s(act.keyboard), pointer: s(act.pointer) };
}
