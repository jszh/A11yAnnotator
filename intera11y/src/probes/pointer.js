'use strict';
// POINTER probe — content that appears on hover or focus, and how it behaves (1.4.13), and whether content that
// appears on hover can also be reached by keyboard (2.1.1).
//
// Triggers: elements with mouseover/mouseenter/pointerenter handlers, elements matched by the part of a `:hover`
// stylesheet selector before `:hover` (same-origin sheets), and elements with aria-describedby / aria-haspopup.
// Per trigger, each on a fresh page:
//   A. pointer onto the trigger → what was revealed (outermost new containers, with boxes). If something was:
//      dwell 6 s with the pointer still (persistent); then travel the pointer onto the revealed content by the
//      shortest path — to the point of it nearest the trigger (hoverable, F95).
//   B. pointer onto the trigger → Escape without moving the pointer (dismissible).
//   C. keyboard focus on the trigger → what was revealed (focus parity), then Escape.
// For revealed content: whether it overlaps other visible content (then dismissibility is required), and the
// focusable elements inside it.
const { LIVE_SEL, snapBefore, snapAfter, guardNavigation, settleMutations } = require('./delta.js');
const { isReachableVisually } = require('../model/page-model.js');

const PARALLEL = 4;
const DWELL_MS = 6000;

// in-page: elements a `:hover` rule targets (the compound selector before :hover), same-origin sheets only
function hoverTriggers() {
  const out = new Set();
  const visit = (rules) => {
    for (const r of rules) {
      if (r.cssRules && !r.selectorText) { try { visit(r.cssRules); } catch (e) { /* ignore */ } continue; }
      const sel = r.selectorText;
      if (!sel || sel.indexOf(':hover') < 0) continue;
      for (const part of sel.split(',')) {
        const i = part.indexOf(':hover');
        if (i < 0) continue;
        const head = part.slice(0, i).trim();
        const rest = part.slice(i + 6).trim();
        // only rules that act on something other than the trigger's own look (a descendant/sibling is shown)
        if (!rest || !/^[\s>+~]/.test(part.slice(i + 6))) continue;
        const style = r.style;
        if (!style || !/(display|visibility|opacity|transform|max-height|height|clip|left|top)/.test(style.cssText)) continue;
        try { for (const el of document.querySelectorAll(head || '*')) out.add(el); } catch (e) { /* invalid after stripping */ }
      }
    }
  };
  for (const sh of document.styleSheets) { try { visit(sh.cssRules); } catch (e) { /* cross-origin */ } }
  return [...out].slice(0, 400).map((el) => window.__ia.xpathOf(el));
}

function selectTriggers(model, cssTriggers) {
  const byX = new Map();
  // a trigger in view, or brought into view by scrolling its region (testTrigger scrolls it into view first)
  const add = (xpath, why) => { const e = model.get(xpath); if (!e || !isReachableVisually(e)) return; if (!byX.has(xpath)) byX.set(xpath, { xpath, why: [] }); byX.get(xpath).why.push(why); };
  for (const x of cssTriggers) add(x, 'css-hover-rule');
  for (const e of model.elements) {
    if (e.listeners && /mouseover|mouseenter|pointerenter/.test(e.listeners)) add(e.xpath, 'hover-handler');
    if (/aria-describedby=|aria-haspopup=/.test(e.openTag)) add(e.xpath, 'popup-relationship');
    if (e.inlineHandlers.includes('onmouseover')) add(e.xpath, 'hover-handler');
  }
  // most specific first: a trigger whose descendant is also a trigger is tested after it
  return [...byX.values()].sort((a, b) => b.why.length - a.why.length);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// the trigger's centre in the viewport, after scrolling it into view — instantly (a page with scroll-behavior: smooth
// would still be animating when the box is read) and, if that left it outside the viewport, by scrolling the window
// to it. { outOfView } when it still cannot be brought into view: the pointer is never moved to a point off screen.
async function centre(page, xpath) {
  return page.evaluate((xp) => {
    const el = window.__ia.resolve(xp);
    if (!el) return null;
    const inView = (r) => r.top >= 0 && r.left >= 0 && r.top + r.height / 2 < innerHeight && r.left + r.width / 2 < innerWidth;
    el.scrollIntoView({ block: 'center', inline: 'center', behavior: 'instant' });
    let r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return null;
    if (!inView(r)) {
      window.scrollTo({ top: scrollY + r.top - innerHeight / 2 + r.height / 2, left: scrollX, behavior: 'instant' });
      r = el.getBoundingClientRect();
    }
    if (!inView(r)) return { outOfView: true, box: { x: r.left, y: r.top, w: r.width, h: r.height } };
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, box: { x: r.left, y: r.top, w: r.width, h: r.height } };
  }, xpath);
}

// in-page: which of the revealed containers are still visible, and where they are
function revealedState(xps) {
  return xps.map((xp) => {
    const el = window.__ia.resolve(xp);
    if (!el) return { xpath: xp, visible: false };
    let vis = false;
    try { vis = el.checkVisibility({ visibilityProperty: true, opacityProperty: true }); } catch (e) { vis = false; }
    const r = el.getBoundingClientRect();
    return { xpath: xp, visible: vis && r.width > 0 && r.height > 0, box: { x: r.left, y: r.top, w: r.width, h: r.height } };
  });
}

// in-page: what meaningful content the revealed box actually covers — text where its glyphs render (not the
// empty part of a wide block box), informative graphics, and controls. aria-hidden/decorative graphics and empty
// space are not content.
function overlapsOtherContent(xp) {
  const el = window.__ia.resolve(xp);
  if (!el) return null;
  const R = el.getBoundingClientRect();
  const hit = (q) => Math.min(R.right, q.right) - Math.max(R.left, q.left) > 2 && Math.min(R.bottom, q.bottom) - Math.max(R.top, q.top) > 2;
  const covered = [];
  const push = (node, what) => { if (covered.length < 6 && !covered.some((c) => c.xpath === window.__ia.xpathOf(node))) covered.push({ xpath: window.__ia.xpathOf(node), what }); };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let t = walker.nextNode(); t && covered.length < 6; t = walker.nextNode()) {
    const host = t.parentElement;
    if (!host || el.contains(host) || host.contains(el) || !t.textContent.trim() || host.closest('[aria-hidden="true"]')) continue;
    const range = document.createRange(); range.selectNodeContents(t);
    for (const q of range.getClientRects()) if (hit(q)) { push(host, 'text: ' + t.textContent.trim().slice(0, 50)); break; }
  }
  for (const g of document.querySelectorAll('img,svg,canvas,video,input,select,textarea,button,a[href],[role="img"]')) {
    if (el.contains(g) || g.contains(el) || g.closest('[aria-hidden="true"]') || (g.tagName === 'IMG' && g.getAttribute('alt') === '')) continue;
    if (g.parentElement && g.parentElement.closest('svg')) continue;
    if (hit(g.getBoundingClientRect())) push(g, g.tagName.toLowerCase());
  }
  return covered;
}

async function hoverReveal(page, trig) {
  await page.mouse.move(2, 2);
  const c = await centre(page, trig.xpath);
  if (!c) return null;
  if (c.outOfView) return { c, outOfView: true, after: null, revealed: [] };
  await page.evaluate(snapBefore, LIVE_SEL);
  await page.mouse.move(c.x, c.y, { steps: 4 });
  await settleMutations(page, 250, 1500);
  const after = await page.evaluate(snapAfter, LIVE_SEL, trig.xpath);
  return { c, after, revealed: after.revealed };
}

async function testTrigger(session, trig) {
  const rec = { xpath: trig.xpath, why: trig.why };
  // A: reveal, persistent, hoverable
  await session.withFreshPage(async (page) => {
    await guardNavigation(page);
    const h = await hoverReveal(page, trig);
    if (!h) { rec.hoverable = null; rec.error = 'trigger has no box'; return; }
    if (h.outOfView) { rec.error = 'the trigger could not be scrolled into the viewport, so it was not hovered'; return; }
    rec.revealedOnHover = h.revealed.map((r) => ({ xpath: r.xpath, text: r.text.slice(0, 160), focusables: r.focusables }));
    rec.newTextOnHover = h.after.newText.slice(0, 10).map((t) => ({ xpath: t.xpath, text: t.text.slice(0, 120) }));
    if (!h.revealed.length) return;
    const xps = h.revealed.map((r) => r.xpath);
    rec.covers = await page.evaluate(overlapsOtherContent, xps[0]);
    await sleep(DWELL_MS);
    rec.persistsAfterDwell = (await page.evaluate(revealedState, xps)).map((s) => s.visible);
    // travel onto the revealed content by the shortest path: to the point of its box nearest the trigger's
    // centre, 6px inside the edge (a path through the content's middle could cross neighbouring triggers)
    const st = (await page.evaluate(revealedState, xps)).find((s) => s.visible);
    if (st) {
      const inset = (lo, len, v) => Math.min(Math.max(v, lo + Math.min(6, len / 2)), lo + len - Math.min(6, len / 2));
      const tx = Math.min(Math.max(inset(st.box.x, st.box.w, h.c.x), 1), 1279), ty = Math.min(Math.max(inset(st.box.y, st.box.h, h.c.y), 1), 899);
      await page.mouse.move(tx, ty, { steps: 20 });
      await settleMutations(page, 250, 1200);
      rec.stillVisibleWithPointerOnContent = (await page.evaluate(revealedState, xps)).map((s) => s.visible);
      rec.pointerTravel = { from: { x: Math.round(h.c.x), y: Math.round(h.c.y) }, to: { x: Math.round(tx), y: Math.round(ty) }, target: st.xpath };
      // hoverable is a property of the content the pointer travelled onto
      rec.targetStillVisibleWithPointerOnIt = rec.stillVisibleWithPointerOnContent[xps.indexOf(st.xpath)];
    }
  });
  if (!rec.revealedOnHover || !rec.revealedOnHover.length) return rec;
  const xps = rec.revealedOnHover.map((r) => r.xpath);
  // B: dismiss with Escape, pointer unmoved
  await session.withFreshPage(async (page) => {
    await guardNavigation(page);
    const h = await hoverReveal(page, trig);
    if (!h || !h.revealed.length) { rec.dismissible = null; return; }
    await page.keyboard.press('Escape');
    await settleMutations(page, 250, 1200);
    rec.visibleAfterEscape = (await page.evaluate(revealedState, xps)).map((s) => s.visible);
  });
  // C: the same content on keyboard focus
  await session.withFreshPage(async (page) => {
    await guardNavigation(page);
    const ok = await page.evaluate((xp) => { const el = window.__ia.resolve(xp); if (!el || typeof el.focus !== 'function') return false; el.focus(); return window.__ia.deepActive() === el; }, trig.xpath);
    rec.triggerFocusable = ok;
    if (!ok) return;
    await settleMutations(page, 250, 1200);
    rec.visibleOnFocus = (await page.evaluate(revealedState, xps)).map((s) => s.visible);
    await page.keyboard.press('Escape');
    await settleMutations(page, 250, 1200);
    rec.visibleOnFocusAfterEscape = (await page.evaluate(revealedState, xps)).map((s) => s.visible);
  });
  return rec;
}

const empty = () => ({ triggers: [], tested: 0, total: 0 });

async function run({ session, model, deadline, partial }) {
  const css = await session.page.evaluate(hoverTriggers).catch(() => []);
  const triggers = selectTriggers(model, css);
  const results = partial.triggers;
  partial.total = triggers.length;
  let i = 0, truncated = false;
  const worker = async () => {
    while (i < triggers.length) {
      if (deadline.remaining() < 30000) { truncated = true; return; }
      const t = triggers[i++];
      try { results.push(await testTrigger(session, t)); } catch (e) { results.push({ xpath: t.xpath, why: t.why, error: String(e && e.message || e).slice(0, 200) }); }
    }
  };
  await Promise.all(Array.from({ length: PARALLEL }, worker));
  return { completeness: truncated ? 'truncated' : 'complete', triggers: results, tested: results.length, total: triggers.length };
}

module.exports = { run, empty };
