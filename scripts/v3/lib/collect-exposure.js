'use strict';
// V2 (expert-FP population check, 2026-09-26) — EXPOSURE facts per collected element. `familiesFor` minted
// obligations from focusable / has-text / role alone, and sampled elements bypass the collector's inclusion
// filter, so an element no keyboard or screen-reader user meets the way the check assumes was checked like any
// other. Measured on the campaign's published barriers: 51 keyboard checks on roving-widget members (43 on
// Zillow's tabindex=-1 carousel dots), 39 visual checks on sr-only / 1px / far-off-screen elements (18 of them
// revealed on focus and judged at rest), 36 visual checks on elements scrolled out of a carousel, 39 keyboard
// checks on tabindex=-1 non-controls.
//
// This pass records HOW each element is exposed; the oracle (applicability-oracle `exposureDrops`) and the
// coverage registry (re-declared, Rule 16) decide which families that removes, and the adjudicator tells the
// judge when a crop cannot show the element. Facts, not verdicts:
//   rendered            — display/visibility/content-visibility allow a box (checkVisibility), and it has one
//   srOnly              — rendered but visually hidden: clip ≤1px (abs/fixed), clip-path inset(50%|100%), a ≤1px
//                         overflow-clipped box (self or a near ancestor), opacity 0, or placed wholly off the page
//   revealedOnFocus     — (focusable srOnly elements only) focusing it makes it visible — the skip-link pattern
//   labelProxy          — (srOnly form controls) the rendered <label> a sighted user sees in its place
//   clippedOut          — rendered, not srOnly, but wholly outside the clip box of an overflow ancestor (an
//                         off-screen carousel slide); scrollReachable says whether scrolling that ancestor reveals it
//   tabindexNegative    — explicit tabindex < 0 (not in the Tab sequence)
//   rovingMember        — tabindexNegative inside a composite widget (tablist/listbox/menu/radiogroup/grid/tree/
//                         toolbar); widgetEntryReachable — some member (or the widget) IS a Tab stop
//
// Self-contained for page.evaluate. ASYNC: the focus probe waits out a reveal transition. It moves focus, so
// collectActPage runs it LAST and restores focus + scroll after each probe.
async function collectExposure(xpaths) {
  const out = {};
  const res = (xp) => { try { return document.evaluate(xp, document, null, 9, null).singleNodeValue; } catch (e) { return null; } };
  const xpathOf = (e) => {
    if (!e || !e.tagName) return '';
    if (e === document.body) return '/html/body';
    const t = e.tagName.toLowerCase();
    let i = 1; for (let s = e.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === e.tagName) i++;
    return xpathOf(e.parentElement) + '/' + t + '[' + i + ']';
  };
  const COMPOSITE = '[role="tablist"],[role="listbox"],[role="menu"],[role="menubar"],[role="radiogroup"],[role="grid"],[role="treegrid"],[role="tree"],[role="toolbar"]';
  const TAB_CANDIDATE = 'a[href],button,input:not([type="hidden"]),select,textarea,summary,[tabindex],[contenteditable="true"]';
  const rendered = (e) => {
    if (!e || !e.isConnected) return false;
    if (typeof e.checkVisibility === 'function' && !e.checkVisibility({ visibilityProperty: true, contentVisibilityAuto: true })) return false;
    const r = e.getBoundingClientRect();
    return r.width > 0 || r.height > 0;
  };
  const docW = Math.max(document.documentElement.scrollWidth, window.innerWidth);
  const docH = Math.max(document.documentElement.scrollHeight, window.innerHeight);
  const clippedOutOf = (e) => {
    const r = e.getBoundingClientRect();
    if (!(r.width > 0 && r.height > 0)) return null;
    for (let a = e.parentElement; a && a !== document.body && a !== document.documentElement; a = a.parentElement) {
      const s = getComputedStyle(a);
      if (!/(hidden|clip|auto|scroll)/.test(s.overflowX + ' ' + s.overflowY)) continue;
      const c = a.getBoundingClientRect();
      const ix = Math.min(r.right, c.right) - Math.max(r.left, c.left);
      const iy = Math.min(r.bottom, c.bottom) - Math.max(r.top, c.top);
      if (ix > 0 && iy > 0) continue;
      const relL = r.left - c.left + a.scrollLeft, relT = r.top - c.top + a.scrollTop;
      const scrollReachable = relL + r.width > 0 && relL < a.scrollWidth && relT + r.height > 0 && relT < a.scrollHeight
        && !/clip/.test(s.overflowX + ' ' + s.overflowY);
      return { container: xpathOf(a), scrollReachable };
    }
    return null;
  };
  const srOnly = (e) => {
    for (let a = e, d = 0; a && a !== document.body && d < 6; a = a.parentElement, d++) {
      const s = getComputedStyle(a);
      const m = /rect\(\s*([-\d.]+)px[,\s]+([-\d.]+)px[,\s]+([-\d.]+)px[,\s]+([-\d.]+)px/.exec(s.clip || '');
      if (/absolute|fixed/.test(s.position) && m && (Math.abs(+m[2] - +m[4]) <= 1 || Math.abs(+m[3] - +m[1]) <= 1)) return true;
      if (/inset\(\s*(50|100)%/.test(s.clipPath || '')) return true;
      if ((a.offsetWidth <= 1 || a.offsetHeight <= 1) && /(hidden|clip)/.test(s.overflow || '')) return true;
    }
    if (typeof e.checkVisibility === 'function' && !e.checkVisibility({ opacityProperty: true })) return true;
    if (clippedOutOf(e)) return false; // off-page because a carousel/scroller clips it ⇒ clippedOut, not sr-only
    const r = e.getBoundingClientRect();
    const L = r.left + window.scrollX, T = r.top + window.scrollY;
    return (L + r.width <= 0) || (T + r.height <= 0) || (L >= docW) || (T >= docH);
  };
  const tabIndexAttr = (e) => { const t = e.getAttribute('tabindex'); return t === null ? null : parseInt(t, 10); };
  const isTabStop = (e) => {
    if (!rendered(e) || e.disabled === true || e.closest('[inert]')) return false;
    const t = tabIndexAttr(e);
    if (t !== null && !Number.isNaN(t)) return t >= 0;
    return e.matches('a[href],button,input:not([type="hidden"]),select,textarea,summary,[contenteditable="true"]');
  };
  const focusables = [];
  for (const xp of xpaths || []) {
    if (typeof xp !== 'string' || !xp || xp.indexOf('>>') !== -1 || xp.indexOf('/page-level') === 0) continue;
    const e = res(xp);
    if (!e || e.nodeType !== 1) continue;
    const x = {};
    x.rendered = rendered(e);
    const t = tabIndexAttr(e);
    x.tabindexNegative = t !== null && !Number.isNaN(t) && t < 0;
    if (x.rendered) {
      x.srOnly = srOnly(e);
      if (!x.srOnly) { const co = clippedOutOf(e); if (co) x.clippedOut = co; }
      if (x.srOnly && /^(INPUT|SELECT|TEXTAREA)$/.test(e.tagName)) {
        const lab = (e.labels && e.labels[0]) || e.closest('label');
        if (lab && rendered(lab) && !srOnly(lab)) x.labelProxy = xpathOf(lab);
      }
      if (x.srOnly && (t === null ? e.matches(TAB_CANDIDATE) : !Number.isNaN(t)) && focusables.length < 20) focusables.push([e, x]);
    }
    if (x.tabindexNegative) {
      const comp = e.parentElement && e.parentElement.closest(COMPOSITE);
      if (comp) {
        x.rovingMember = true;
        x.widgetEntryReachable = isTabStop(comp) || [...comp.querySelectorAll(TAB_CANDIDATE)].slice(0, 200).some(isTabStop);
      }
    }
    out[xp] = x;
  }
  // REVEALED-ON-FOCUS probe (bounded to 20 sr-only focusables): focus without scrolling, let a reveal transition
  // run, re-measure, then give focus and scroll back. Nothing else on the page is touched.
  if (focusables.length) {
    const sx = window.scrollX, sy = window.scrollY;
    const prev = document.activeElement;
    for (const [e, x] of focusables) {
      try {
        e.focus({ preventScroll: true });
        if (document.activeElement !== e) { x.revealedOnFocus = null; continue; } // could not take focus
        // POLL (not a fixed wait): a script-driven reveal lands late under load (measured: Amazon's skip link read
        // "not revealed" at a fixed 350 ms in a 4-way concurrent run, revealed standalone). Stop at the first reveal.
        let shown = false;
        for (let t = 0; t < 10 && !shown; t++) { await new Promise((r) => setTimeout(r, 100)); shown = !srOnly(e); }
        x.revealedOnFocus = shown;
      } catch (err) { x.revealedOnFocus = null; }
      finally { try { e.blur(); } catch (err) {} }
    }
    try { if (prev && prev !== document.body && prev.focus) prev.focus({ preventScroll: true }); } catch (err) {}
    window.scrollTo(sx, sy);
  }
  return out;
}

module.exports = { collectExposure };
