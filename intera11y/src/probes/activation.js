'use strict';
// ACTIVATION probe — operate each control the way a keyboard user would, and record what changes.
//
// Controls (from the PageModel): elements with a widget role, a disclosure/popup relationship (aria-expanded,
// aria-haspopup, aria-controls, aria-pressed), in-page links, <summary>, native buttons that are not form
// submits (the forms probe submits forms), and non-native elements with pointer handlers. Ordered so that the
// controls most likely to change state come first; the step time limit decides how many are tested.
//
// Per control, on its own fresh page (navigation and window.open blocked):
//   focus it → snapshot → Enter (Space for checkbox/switch/radio/option roles; the other key if the first did
//   nothing) → wait for the DOM to go quiet → snapshot. The delta: what was revealed/hidden, new or changed text
//   and whether it landed in a live region that existed before (and was empty), where focus went, whether a modal
//   opened, the trigger's ARIA attributes and computed AX states before/after.
//   If the keyboard did nothing and the control is not native, a mouse click on another fresh page (parity).
//   If something with focusable content was revealed: Tab / Shift+Tab through it and Escape, recording whether
//   focus stays inside, where it goes on Escape, and whether the revealed content closes.
// Also: the page left alone for 45 s after load (what changes with no user action).
const { LIVE_SEL, snapBefore, snapAfter, triggerAttrsNow, axOf, guardNavigation, settleMutations, hasEffect } = require('./delta.js');
const { isPerceivableVisually } = require('../model/page-model.js');

const PARALLEL = 4;
const WIDGET_ROLES = new Set(['button', 'tab', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'switch', 'checkbox', 'radio', 'option', 'treeitem', 'combobox', 'slider', 'spinbutton', 'link']);
const SPACE_ROLES = new Set(['checkbox', 'switch', 'radio', 'option', 'menuitemcheckbox', 'menuitemradio']);

function controlKind(e) {
  const t = e.openTag || '';
  const native = /^(button|summary|select|input|a)$/.test(e.tag) && !e.role;
  const disclosure = /aria-(expanded|haspopup|controls|pressed)=/.test(t);
  const pointer = !!(e.listeners && /click|mousedown|pointerdown|mouseup|pointerup/.test(e.listeners)) || e.inlineHandlers.some((h) => /click|mousedown/.test(h));
  let kind = null, priority = 9;
  if (disclosure) { kind = 'disclosure'; priority = 0; }
  else if (e.role && WIDGET_ROLES.has(e.role) && e.role !== 'link') { kind = 'widget-role'; priority = 1; }
  else if (!native && pointer) { kind = 'pointer-handler'; priority = 2; }
  else if (e.tag === 'summary') { kind = 'summary'; priority = 1; }
  else if (e.tag === 'button' || (e.tag === 'input' && /^(button|image)$/.test(e.type || ''))) { kind = 'button'; priority = 3; }
  else if (e.tag === 'a' && /href="(#|javascript:)/i.test(t)) { kind = 'in-page-link'; priority = 4; }
  else if (e.role === 'link' && !native) { kind = 'widget-role'; priority = 2; }
  return kind ? { kind, priority, native } : null;
}

function selectControls(model) {
  const out = [];
  for (const e of model.elements) {
    if (!isPerceivableVisually(e) || e.disabled) continue;
    // a submit button belongs to the forms probe
    if ((e.tag === 'button' && (e.type === null || e.type === 'submit') && /\/form\[\d+\]/.test(e.xpath)) || (e.tag === 'input' && e.type === 'submit')) continue;
    const k = controlKind(e);
    if (!k) continue;
    // an element whose pointer handler is only delegation for a native control inside it is represented by that control
    out.push({ xpath: e.xpath, tag: e.tag, role: e.role || (e.ax && e.ax.role) || null, ...k });
  }
  out.sort((a, b) => a.priority - b.priority);
  return out;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function activateOnce(session, control, mode) {
  return session.withFreshPage(async (page) => {
    const blocked = await guardNavigation(page);
    let focused = null;
    if (mode === 'keyboard') {
      focused = await page.evaluate((xp) => { const el = window.__ia.resolve(xp); if (!el) return false; el.focus({ preventScroll: false }); return window.__ia.deepActive() === el; }, control.xpath);
      if (!focused) return { mode, focusable: false };
    }
    // instantly: a page with scroll-behavior: smooth would still be scrolling when the control is clicked
    if (mode === 'pointer') await page.evaluate((xp) => { const el = window.__ia.resolve(xp); if (el) el.scrollIntoView({ block: 'center', behavior: 'instant' }); }, control.xpath);
    const attrsBefore = (await page.evaluate(triggerAttrsNow, control.xpath)).attrs;
    const axBefore = await axOf(page, control.xpath);
    const before = await page.evaluate(snapBefore, LIVE_SEL);
    let keyUsed = null, heldOnly = false;
    if (mode === 'keyboard') {
      const keys = SPACE_ROLES.has(control.role) ? ['Space', 'Enter'] : ['Enter', 'Space'];
      for (const k of keys) {
        await page.keyboard.press(k);
        keyUsed = k;
        await settleMutations(page);
        const probe = await page.evaluate(snapAfter, LIVE_SEL, control.xpath);
        const axNow = await axOf(page, control.xpath);
        if (hasEffect(before, probe, attrsBefore, axBefore, axNow, blocked())) break;
        if (k === keys[1]) {
          // neither key tapped did anything: hold one (a control that only responds to a held key depends on
          // keystroke timing — 2.1.1)
          for (const hk of keys) {
            await page.evaluate((xp) => { const el = window.__ia.resolve(xp); if (el) el.focus(); }, control.xpath);
            await page.keyboard.down(hk); await sleep(2000); await page.keyboard.up(hk);
            await settleMutations(page);
            const held = await page.evaluate(snapAfter, LIVE_SEL, control.xpath);
            const axHeld = await axOf(page, control.xpath);
            if (hasEffect(before, held, attrsBefore, axBefore, axHeld, blocked())) { keyUsed = `${hk} held 2 s`; heldOnly = true; break; }
          }
          break;
        }
        // no effect from the first key: re-focus and try the other one
        await page.evaluate((xp) => { const el = window.__ia.resolve(xp); if (el) el.focus(); }, control.xpath);
      }
    } else {
      const box = await page.evaluate((xp) => { const el = window.__ia.resolve(xp); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, control.xpath);
      if (!box) return { mode, clickable: false };
      await page.mouse.click(box.x, box.y);
      await settleMutations(page);
    }
    const after = await page.evaluate(snapAfter, LIVE_SEL, control.xpath);
    const axAfter = await axOf(page, control.xpath);
    const nav = blocked();
    const result = {
      mode, key: keyUsed, heldOnly, focusable: focused,
      effect: hasEffect(before, after, attrsBefore, axBefore, axAfter, nav),
      trigger: { attrsBefore, attrsAfter: after.triggerAttrs, axBefore, axAfter, textAfter: after.triggerText },
      revealed: after.revealed, hidden: after.hidden, newText: after.newText, modal: after.modal,
      liveRegionChanges: after.liveRegionChanges, visualChanges: after.visualChanges, timeline: after.timeline,
      focus: { before: before.active, after: after.active, inRevealed: after.focusInRevealed },
      liveRegionsBefore: before.liveRegions,
      navigationBlocked: nav, nativeDialogs: (page.__dialogs || []).slice(),
    };
    if (mode === 'keyboard' && after.revealed.some((r) => r.focusables > 0 || r.modal)) result.revealedKeyboard = await keyboardInRevealed(page, control, after);
    return result;
  });
}

// Tab / Shift+Tab / Escape inside content the activation revealed.
async function keyboardInRevealed(page, control, after) {
  const regions = after.revealed.filter((r) => r.focusables > 0 || r.modal).map((r) => r.xpath);
  const n = Math.min(40, after.revealed.reduce((s, r) => s + r.focusables, 0) + 3);
  const where = () => page.evaluate((rs) => {
    const a = window.__ia.deepActive();
    if (!a || a === document.body) return { at: null, inside: false };
    const inside = rs.some((x) => { const r = window.__ia.resolve(x); return r && r.contains(a); });
    return { at: window.__ia.xpathOf(a), inside };
  }, regions);
  const start = await where();
  const forward = [];
  for (let i = 0; i < n; i++) { await page.keyboard.press('Tab'); await sleep(40); forward.push(await where()); }
  const backward = [];
  for (let i = 0; i < n; i++) { await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift'); await sleep(40); backward.push(await where()); }
  // Escape from inside the revealed content
  await page.evaluate((rs) => {
    const FOC = 'a[href],button,input,select,textarea,summary,[tabindex]';
    for (const x of rs) { const r = window.__ia.resolve(x); const f = r && (r.matches(FOC) ? r : r.querySelector(FOC)); if (f) { f.focus(); return; } }
  }, regions);
  await page.keyboard.press('Escape');
  await settleMutations(page, 300, 1500);
  const esc = await page.evaluate((rs, trig) => {
    const vis = (el) => { try { return el.checkVisibility({ visibilityProperty: true, opacityProperty: true }); } catch (e) { return false; } };
    const stillOpen = rs.some((x) => { const r = window.__ia.resolve(x); return r && vis(r); });
    const a = window.__ia.deepActive();
    return { stillOpen, focusAt: a && a !== document.body ? window.__ia.xpathOf(a) : null, focusOnTrigger: !!(a && window.__ia.xpathOf(a) === trig) };
  }, regions, control.xpath);
  return {
    regions, focusAfterActivation: start,
    tabForward: forward, tabForwardLeftRegion: forward.some((w) => !w.inside),
    tabBackward: backward, tabBackwardLeftRegion: backward.some((w) => !w.inside),
    escape: esc,
  };
}

// Content that changes with no user action (a timer, a session-expiry warning, a feed update): the page left
// alone for IDLE_MS after load, then compared with how it loaded.
const IDLE_MS = 45000;
async function idleWatch(session) {
  return session.withFreshPage(async (page) => {
    const blocked = await guardNavigation(page);
    const before = await page.evaluate(snapBefore, LIVE_SEL);
    await sleep(IDLE_MS);
    const after = await page.evaluate(snapAfter, LIVE_SEL, null);
    return { mode: 'idle', waitedMs: IDLE_MS, effect: !!(after.newText.length || after.revealed.length || after.hidden.length || after.liveRegionChanges.length), revealed: after.revealed, hidden: after.hidden, newText: after.newText, liveRegionChanges: after.liveRegionChanges, visualChanges: after.visualChanges, modal: after.modal, focus: { before: before.active, after: after.active }, liveRegionsBefore: before.liveRegions, navigationBlocked: blocked(), nativeDialogs: (page.__dialogs || []).slice() };
  });
}

// Typing into a field can update the page without any submit (a character counter, a strength meter, a result
// count, inline validation on blur): type into it, then Tab away, and record what changed.
const TYPABLE = /^(input|textarea|select)$/;
async function typeInto(session, xpath) {
  return session.withFreshPage(async (page) => {
    const blocked = await guardNavigation(page);
    const kind = await page.evaluate((xp) => { const el = window.__ia.resolve(xp); if (!el) return null; el.focus(); if (window.__ia.deepActive() !== el) return null; return el.tagName === 'SELECT' ? 'select' : /^(checkbox|radio)$/.test(el.type) ? 'toggle' : 'text'; }, xpath);
    if (!kind) return null;
    const before = await page.evaluate(snapBefore, LIVE_SEL);
    if (kind === 'text') await page.keyboard.type('abc 123', { delay: 30 });
    else if (kind === 'toggle') await page.keyboard.press('Space');
    else await page.evaluate((xp) => { const el = window.__ia.resolve(xp); const i = [...el.options].findIndex((o, j) => j !== el.selectedIndex && !o.disabled); if (i >= 0) { el.selectedIndex = i; el.dispatchEvent(new Event('input', { bubbles: true })); el.dispatchEvent(new Event('change', { bubbles: true })); } }, xpath);
    await settleMutations(page);
    await page.keyboard.press('Tab');
    await settleMutations(page);
    const after = await page.evaluate(snapAfter, LIVE_SEL, xpath);
    return { mode: 'typing', xpath, typed: kind === 'text' ? 'abc 123 then Tab' : kind === 'toggle' ? 'Space (toggle) then Tab' : 'choose another option then Tab', effect: !!(after.newText.length || after.liveRegionChanges.length || after.visualChanges.length),
      newText: after.newText, liveRegionChanges: after.liveRegionChanges, visualChanges: after.visualChanges, timeline: after.timeline, revealed: after.revealed, hidden: after.hidden, modal: after.modal,
      focus: { before: before.active, after: after.active }, liveRegionsBefore: before.liveRegions, navigationBlocked: blocked(), nativeDialogs: (page.__dialogs || []).slice() };
  });
}

const empty = () => ({ controls: [], typed: [], idle: null, tested: 0, total: 0 });

async function run({ session, model, deadline, partial }) {
  const idle = idleWatch(session).catch((e) => ({ mode: 'idle', error: String(e && e.message || e).slice(0, 200) }));
  idle.then((r) => { partial.idle = r; });
  const controls = selectControls(model);
  const results = partial.controls;
  partial.total = controls.length;
  let i = 0, truncated = false;
  const worker = async () => {
    while (i < controls.length) {
      if (deadline.remaining() < 30000) { truncated = true; return; }
      const c = controls[i++];
      const rec = { ...c };
      try {
        rec.keyboard = await activateOnce(session, c, 'keyboard');
        if ((!rec.keyboard.focusable || !rec.keyboard.effect) && !c.native) rec.pointer = await activateOnce(session, c, 'pointer');
      } catch (e) { rec.error = String(e && e.message || e).slice(0, 200); }
      results.push(rec);
    }
  };
  await Promise.all(Array.from({ length: PARALLEL }, worker));
  // text fields typed into (after the controls; the same time limit)
  const fields = model.elements.filter((e) => TYPABLE.test(e.tag) && isPerceivableVisually(e) && !e.disabled && !/type="(hidden|submit|button|reset|image|file|range|color)"/.test(e.openTag));
  const typed = partial.typed;
  for (const f of fields) {
    if (deadline.remaining() < 30000) { truncated = true; break; }
    const r = await typeInto(session, f.xpath).catch(() => null);
    if (r && r.effect) typed.push(r);
  }
  return {
    typed,
    completeness: truncated ? 'truncated' : 'complete',
    controls: results,
    idle: await idle,
    tested: results.length, total: controls.length,
  };
}

module.exports = { run, empty, selectControls };
