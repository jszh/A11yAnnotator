'use strict';
// C2 — reveal-state producer + arrow-key driver. The harness never activates a control that REVEALS content, so it
// cannot check focus-into/return for a dialog (2.4.3 F85), whether a composite widget traps Tab (2.1.2 F10), or
// whether content/instructions appear on keyboard FOCUS (1.4.13 / 3.3.2). This drives the interaction + observes.

const KEY = (i) => i && i.startsWith('key:') ? i.slice(4) : null;

async function activate(page, sel, interaction) {
  try {
    await page.focus(sel);
    const k = KEY(interaction);
    if (interaction === 'click') await page.click(sel);
    else if (k) await page.keyboard.press(k === 'Space' ? ' ' : k);
    else if (interaction === 'hover') await page.hover(sel);
    // 'focus' = already focused
    await page.evaluate(() => new Promise((r) => setTimeout(r, 60)));
  } catch (e) { /* ignore */ }
}

// in-page snapshot of the active element + a region's visibility/role
function snapshot(revSel, trigSel) {
  const vis = (el) => { if (!el) return false; const c = getComputedStyle(el); if (c.display === 'none' || c.visibility === 'hidden' || parseFloat(c.opacity) === 0) return false; const r = el.getBoundingClientRect(); return r.width >= 1 && r.height >= 1; };
  const a = document.activeElement;
  const rev = revSel ? document.querySelector(revSel) : null;
  const trig = trigSel ? document.querySelector(trigSel) : null;
  const widget = trig ? (trig.closest('[role=menu],[role=menubar],[role=tablist],[role=listbox],[role=grid],[role=toolbar],[role=radiogroup],[role=tree]') || trig.parentElement) : null;
  let revIsModal = false;
  if (rev) { const rr = rev.getBoundingClientRect(); revIsModal = rev.getAttribute('aria-modal') === 'true' || /dialog|modal|popup|lightbox|overlay/i.test(typeof rev.className === 'string' ? rev.className : '') || (rr.width > window.innerWidth * 0.5 && rr.height > window.innerHeight * 0.3); }
  return {
    revVisible: vis(rev), revRole: rev ? (rev.getAttribute('role') || rev.tagName.toLowerCase()) : null, revIsModal,
    focusInRev: !!(rev && a && rev.contains(a)),
    focusOnTrig: !!(trig && a === trig),
    focusInWidget: !!(widget && a && widget.contains(a)),
    activeId: a ? (a.id || a.tagName) : null,
  };
}

async function runReveal(page, { aspect, triggerSelector, interaction, revealedSelector, expectFocusReturn } = {}) {
  const trig = triggerSelector || '#trigger';
  // ---- 1.4.13 focus-triggered reveal / 3.3.2 focus-revealed instruction: does it appear on keyboard FOCUS? ----
  if (aspect === 'focus-triggered-reveal-hover-parity' || aspect === 'focus-revealed-instruction') {
    // FOCUS first on the FRESH page (nothing hovered yet) — then hover. Testing hover first would let a JS-shown
    // hover reveal linger into the focus test and read as a (nonexistent) focus reveal.
    try { await page.mouse.move(5000, 5000); } catch (e) {}
    let focus = null;
    try { await page.focus(trig); await page.evaluate(() => new Promise((r) => setTimeout(r, 50))); focus = await page.evaluate(snapshot, revealedSelector, trig); } catch (e) {}
    try { await page.evaluate(() => { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); }); await page.evaluate(() => new Promise((r) => setTimeout(r, 30))); } catch (e) {}
    let hover = null;
    try { await page.hover(trig); await page.evaluate(() => new Promise((r) => setTimeout(r, 50))); hover = await page.evaluate(snapshot, revealedSelector, trig); } catch (e) {}
    const hoverShows = hover && hover.revVisible, focusShows = focus && focus.revVisible;
    // C2 decides the clear NO-KEYBOARD-PATH barrier (mouse reveals it, keyboard does not). If it DOES appear on
    // focus, whether it then meets hoverable/dismissible/persistent (1.4.13) — or is an adequate instruction (3.3.2)
    // — is the existing 1.4.13 hover-content lane's / the field-label rubric's job; defer.
    if (hoverShows && !focusShows) return { decided: true, verdict: 'fail', reason: 'content/instruction appears on HOVER but NOT on keyboard FOCUS — no keyboard path (1.4.13 hoverable / 3.3.2)' };
    if (focusShows) return { decided: false, abstain: true, uncertainReason: 'content/instruction DOES appear on keyboard focus — its hoverable/dismissible/persistent adequacy (1.4.13) or instruction adequacy (3.3.2) is judged by that lane', facts: { focusShows, hoverShows } };
    if (!hoverShows && !focusShows) return { decided: false, abstain: true, uncertainReason: 'the revealed content was not observed on hover or focus (selector/timing) — defer' };
    return { decided: false, abstain: true, uncertainReason: 'reveal parity ambiguous — defer' };
  }
  // ---- 2.1.2 composite-widget Tab trap: ARROW within, but can Tab ESCAPE? ----
  if (aspect === 'arrow-key-composite-widget-trap') {
    const wait = () => page.evaluate(() => new Promise((r) => setTimeout(r, 40)));
    const enter = async () => { await activate(page, trig, interaction || 'focus'); if (!((await page.evaluate(snapshot, revealedSelector, trig).catch(() => ({}))).focusInWidget)) { try { await page.focus(trig); } catch (e) {} } };
    // FORWARD (Tab) — a trap in EITHER direction is a barrier (TT/F10), so test both independently.
    await enter(); try { await page.keyboard.press('Tab'); await wait(); } catch (e) {}
    const tabTrapped = ((await page.evaluate(snapshot, revealedSelector, trig).catch(() => ({}))).focusInWidget);
    // BACKWARD (Shift+Tab) — re-enter the widget first.
    await enter(); try { await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift'); await wait(); } catch (e) {}
    const shiftTrapped = ((await page.evaluate(snapshot, revealedSelector, trig).catch(() => ({}))).focusInWidget);
    if (tabTrapped || shiftTrapped) return { decided: true, verdict: 'fail', reason: 'focus cannot leave the composite widget via ' + (tabTrapped && shiftTrapped ? 'Tab or Shift+Tab' : (tabTrapped ? 'Tab' : 'Shift+Tab')) + ' (keyboard trap, F10/2.1.2)' };
    return { decided: true, verdict: 'pass', reason: 'focus can leave the composite widget via Tab and Shift+Tab' };
  }
  // ---- 2.4.3 F85 reveal-then-check focus order: focus moves INTO a dialog/menu + RETURNS on close ----
  if (aspect === 'reveal-then-check-focus-order') {
    await page.focus(trig).catch(() => {});
    await activate(page, trig, interaction || 'click');
    const open = await page.evaluate(snapshot, revealedSelector, trig).catch(() => null);
    if (!open || !open.revVisible) return { decided: false, abstain: true, uncertainReason: 'no revealed region observed after activation — defer' };
    const managesFocus = /dialog|menu|listbox/.test(open.revRole || '') || open.revIsModal;
    if (managesFocus && !open.focusInRev) return { decided: true, verdict: 'fail', reason: 'a ' + (open.revRole || 'modal') + ' opened but focus was NOT moved into it (F85): focus stayed on ' + (open.focusOnTrig ? 'the trigger' : open.activeId) };
    if (managesFocus || expectFocusReturn) {
      try { await page.keyboard.press('Escape'); await page.evaluate(() => new Promise((r) => setTimeout(r, 50))); } catch (e) {}
      const closed = await page.evaluate(snapshot, revealedSelector, trig).catch(() => null);
      if (closed && !closed.revVisible && !closed.focusOnTrig) return { decided: true, verdict: 'fail', reason: 'focus did NOT return to the trigger after the revealed region closed (F85)' };
    }
    // focus-into / return are OK. The INTERNAL focus ORDER of the revealed region (DOM vs visual, sequence) is the
    // focus-order-meaning rubric's judgment — C2's job is to make the revealed region REACHABLE for it; defer.
    return { decided: false, abstain: true, uncertainReason: 'focus correctly enters/returns the revealed region; its internal DOM-vs-visual focus ORDER is judged by the 2.4.3 focus-order rubric (now that the region is revealed)' };
  }
  return { decided: false, abstain: true, uncertainReason: 'unhandled reveal aspect' };
}

module.exports = { runReveal };
