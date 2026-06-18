'use strict';
// Harness 3.0 — Keyboard Focus Flow Graph (BAGEL, CHI'23) + tab-order check (WCAG 2.4.3 Focus Order).
// Drives REAL Tab keypresses from the top of the document, recording each focused element's xpath +
// visual rect, until the focus ring WRAPS (cycle detection — the same principle as realKeyboardReach's
// ring-walk; no fixed tab cap). The recorded sequence is the page's actual keyboard focus order; the
// tab-order check flags focus that diverges grossly from the VISUAL order (BAGEL's Unintuitive
// Navigation Order, reduced to a sound gross-jump flag). Forward AND backward (Shift+Tab) sequences are
// collected so a later trap/consistency check can compare directions.
const { visualOrderDivergence } = require('./order-check.js');
const LIMITS = require('./limits.js'); // instrument caps (tier F)

const REACH_SAFETY_CAP = LIMITS.instruments.reachSafetyCap; // anti-pathology only; the normal stop is a wrap (matches realKeyboardReach)

// In-page: identify the active element with a stable per-call WeakSet (cycle detection), and read its
// xpath + document-relative rect + a short label. Returns a sentinel for body/null (ring boundary).
function probeActive() {
  const a = document.activeElement;
  if (!a || a === document.body || a === document.documentElement) return { sentinel: true };
  const map = window.__kbdSeen || (window.__kbdSeen = new WeakSet());
  const seen = map.has(a); if (!seen) map.add(a);
  const getXPath = (e) => {
    if (!e || !e.tagName) return '';
    if (e === document.body) return '/html/body';
    const ns = e.namespaceURI; const isHtml = !ns || ns === 'http://www.w3.org/1999/xhtml';
    const t = isHtml ? e.tagName.toLowerCase() : e.tagName;
    let idx = 1, sib = e.previousElementSibling;
    while (sib) { if (sib.tagName === e.tagName) idx++; sib = sib.previousElementSibling; }
    return getXPath(e.parentElement) + (isHtml ? '/' + t + '[' + idx + ']' : "/*[local-name()='" + t + "'][" + idx + "]");
  };
  const r = a.getBoundingClientRect();
  // pinned = the element OR any ancestor is position:fixed/sticky (e.g. a link inside a pinned nav) —
  // don't add scrollY for these, they're visually persistent (audit: scrolled fixed-nav FP).
  let pinned = false;
  for (let e = a; e && e !== document.body; e = e.parentElement) {
    const pos = getComputedStyle(e).position;
    if (pos === 'fixed' || pos === 'sticky') { pinned = true; break; }
  }
  return { sentinel: false, seen, xpath: getXPath(a), tag: a.tagName.toLowerCase(),
    rect: { x: Math.round(pinned ? r.left : r.left + window.scrollX), y: Math.round(pinned ? r.top : r.top + window.scrollY), w: Math.round(r.width), h: Math.round(r.height) },
    label: (a.innerText || a.textContent || a.value || '').trim().replace(/\s+/g, ' ').slice(0, 60) };
}

async function collectTabOrder(page, opts = {}) {
  const cap = Number.isFinite(opts.safetyCap) ? opts.safetyCap : REACH_SAFETY_CAP;
  const backward = opts.backward === true;
  await page.evaluate(() => { window.__kbdSeen = new WeakSet(); const b = document.body; if (b) { b.tabIndex = -1; b.focus(); } });
  const order = [];
  let wrapped = false, exhausted = false, sawNode = false, sentinelStreak = 0;
  for (let i = 0; i < cap; i++) {
    if (backward) { await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift'); }
    else { await page.keyboard.press('Tab'); }
    const info = await page.evaluate(probeActive).catch(() => ({ sentinel: true, err: true }));
    // A SINGLE body/sentinel mid-ring is normal — positive tabindex routes focus through the document
    // boundary after the highest tabindex, so only TWO consecutive sentinels (or a WeakSet revisit) is a
    // true wrap (audit: positive-tabindex order was truncated to 1 element by treating the 1st sentinel
    // as a wrap). Cycle detection is driven by info.seen; the sentinel only ends a fully-walked ring.
    if (info.sentinel) { if (sawNode && ++sentinelStreak >= 2) { wrapped = true; break; } continue; }
    sentinelStreak = 0;
    if (info.seen) { wrapped = true; break; }                                      // revisited ⇒ ring complete
    sawNode = true;
    order.push({ index: order.length, xpath: info.xpath, tag: info.tag, rect: info.rect, label: info.label });
  }
  if (!wrapped && order.length >= cap) exhausted = true;
  return { order, wrapped, exhausted, count: order.length, backward };
}

// Tab-order check (2.4.3): the forward focus order vs the visual order.
function tabOrderFindings(tab, opts = {}) {
  const items = (tab.order || []).map((s) => ({ xpath: s.xpath, rect: s.rect, label: s.label }));
  const r = visualOrderDivergence(items, { sc: '2.4.3', kind: 'tab-order', rowBand: opts.rowBand });
  return { findings: r.findings, comparable: r.comparable };
}

// ── Keyboard TRAP detection (WCAG 2.1.2 No Keyboard Trap) — LOTUS (ICSE'23) graph reachability ──────
// A keyboard trap is a region focus can ENTER but not LEAVE by keyboard. LOTUS decides this as graph
// reachability from the region's entry node: a region is dismissable iff some reachable node lies
// OUTSIDE it. We realise that directly: focus inside each trap-prone region and drive Tab (forward),
// Shift+Tab (backward), and Esc — a region focus cannot escape by ANY of the three is a confirmed trap.
// Per-region restart (BAGEL's completeness trick) means a trap in one region never halts the scan.
const FOCUSABLE_SEL = 'a[href],button,input:not([type=hidden]),select,textarea,[tabindex],[contenteditable=true]';
// Role-based candidates PLUS class-based heuristics — a JS focus trap often lives in a role-less
// `<div class="modal/overlay/...">` (audit: role-less-div trap was never even a candidate). Over-matching
// is harmless: a region is only ever REPORTED if it actually traps focus (the confirmation gate).
const TRAP_REGION_SEL = '[role=dialog],dialog,[aria-modal=true],[role=menu],[role=listbox],[role=grid],[role=tablist],[class*=modal i],[class*=overlay i],[class*=dialog i],[class*=popup i],[class*=lightbox i]';
const CLOSE_RE = /close|dismiss|cancel|done|\bok\b|×|✕|✖|⨉/i;

async function focusFirstIn(page, regId) {
  return page.evaluate((id, sel) => {
    const reg = document.querySelector(`[data-v3-trapreg="${id}"]`);
    const f = reg && reg.querySelector(sel);
    if (f) { f.focus(); return document.activeElement === f; }
    return false;
  }, regId, FOCUSABLE_SEL);
}
async function stillInside(page, regId) {
  return page.evaluate((id) => {
    const reg = document.querySelector(`[data-v3-trapreg="${id}"]`);
    const a = document.activeElement;
    return !!(reg && a && reg.contains(a));
  }, regId);
}

// Drive `budget` Tab (or Shift+Tab) presses from inside the region; trapped = focus NEVER escaped.
async function probeDirectionalEscape(page, regId, budget, backward) {
  if (!(await focusFirstIn(page, regId))) return { trapped: false, undetermined: true };
  for (let i = 0; i < budget; i++) {
    if (backward) { await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift'); }
    else { await page.keyboard.press('Tab'); }
    if (!(await stillInside(page, regId))) return { trapped: false };
  }
  return { trapped: true };
}

// Is the region dismissed or has focus left it?
async function regionEscaped(page, regId) {
  return page.evaluate((id) => {
    const reg = document.querySelector(`[data-v3-trapreg="${id}"]`);
    const a = document.activeElement;
    const gone = !reg || !reg.isConnected || reg.hidden || getComputedStyle(reg).display === 'none';
    return gone || !(reg && a && reg.contains(a));
  }, regId);
}

// LOTUS dismissability: a region with a keyboard-operable Close control IS escapable even if Tab cycles
// within it (the APG-required modal pattern). Activate each candidate close control and see if focus
// leaves / the region is dismissed. Destructive (it closes the dialog), so the caller runs it last.
async function probeCloseEscape(page, regId, closeRe) {
  const closeIds = await page.evaluate((id, reSrc) => {
    const re = new RegExp(reSrc, 'i');
    const reg = document.querySelector(`[data-v3-trapreg="${id}"]`);
    if (!reg) return [];
    const cands = [...reg.querySelectorAll('button,a[href],[role=button],[tabindex]')].filter((el) => {
      const t = (el.getAttribute('aria-label') || '') + ' ' + (el.getAttribute('title') || '') + ' ' + (el.textContent || '');
      return re.test(t) || el.hasAttribute('data-dismiss');
    });
    return cands.map((el, i) => { const cid = id + '-c' + i; el.setAttribute('data-v3-close', cid); return cid; });
  }, regId, closeRe.source);
  for (const cid of closeIds) {
    const focused = await page.evaluate((cid2) => { const el = document.querySelector(`[data-v3-close="${cid2}"]`); if (el) { el.focus(); return document.activeElement === el; } return false; }, cid);
    if (!focused) continue;
    await page.keyboard.press('Enter');
    await page.evaluate(() => new Promise((r) => setTimeout(r, 60)));
    if (await regionEscaped(page, regId)) return true;
  }
  return false;
}

async function detectKeyboardTraps(page, opts = {}) {
  const regions = await page.evaluate((regSel, focSel) => {
    const getXPath = (e) => {
      if (!e || !e.tagName) return '';
      if (e === document.body) return '/html/body';
      const ns = e.namespaceURI; const isHtml = !ns || ns === 'http://www.w3.org/1999/xhtml';
      const t = isHtml ? e.tagName.toLowerCase() : e.tagName;
      let idx = 1, sib = e.previousElementSibling;
      while (sib) { if (sib.tagName === e.tagName) idx++; sib = sib.previousElementSibling; }
      return getXPath(e.parentElement) + (isHtml ? '/' + t + '[' + idx + ']' : "/*[local-name()='" + t + "'][" + idx + "]");
    };
    const out = []; let n = 0; const seenEl = new Set();
    document.querySelectorAll(regSel).forEach((reg) => {
      if (seenEl.has(reg)) return; seenEl.add(reg);
      const fs = [...reg.querySelectorAll(focSel)].filter((f) => f.offsetParent !== null || getComputedStyle(f).position === 'fixed');
      if (fs.length >= 2) { const id = 'tr' + (n++); reg.setAttribute('data-v3-trapreg', id); out.push({ id, xpath: getXPath(reg), focusableCount: fs.length }); }
    });
    return out;
  }, TRAP_REGION_SEL, FOCUSABLE_SEL);

  const candidates = [];
  for (const reg of regions) {
    const budget = reg.focusableCount + LIMITS.instruments.escapeBudgetMargin; // enough to escape a well-behaved region; a trap cycles forever
    const fwd = await probeDirectionalEscape(page, reg.id, budget, false);
    const bwd = await probeDirectionalEscape(page, reg.id, budget, true);
    let escEscapes = false, closeEscapes = false;
    const looksTrapped = fwd.trapped === true || bwd.trapped === true;
    if (looksTrapped) {
      if (await focusFirstIn(page, reg.id)) {
        await page.keyboard.press('Escape');
        await page.evaluate(() => new Promise((r) => setTimeout(r, 60)));
        escEscapes = await regionEscaped(page, reg.id);
      }
      if (!escEscapes && fwd.trapped === true && bwd.trapped === true) closeEscapes = await probeCloseEscape(page, reg.id, CLOSE_RE);
    }
    // CONFIRMED trap (2.1.2): focus cannot leave by Tab, Shift+Tab, Esc, OR a keyboard Close control.
    const confirmed = fwd.trapped === true && bwd.trapped === true && !escEscapes && !closeEscapes;
    // DIRECTIONAL (one-way) trap: trapped in exactly one Tab direction with no Esc — surfaced separately,
    // NOT authoritative (the user can still move focus away in the other direction, so it is not a hard
    // 2.1.2 trap), but worth reporting.
    const directional = (fwd.trapped === true) !== (bwd.trapped === true) && !escEscapes;
    candidates.push({ regionXpath: reg.xpath, focusableCount: reg.focusableCount,
      forwardTrapped: !!fwd.trapped, backwardTrapped: !!bwd.trapped, escEscapes, closeEscapes,
      confirmed, directional, sc: '2.1.2' });
  }
  return {
    traps: candidates.filter((t) => t.confirmed),
    directionalTraps: candidates.filter((t) => t.directional && !t.confirmed),
    candidates, regionCount: regions.length,
  };
}

// ── SELF-REFOCUS keyboard trap (WCAG 2.1.2) — complements the region-based detectKeyboardTraps ──────
// A LONE focusable can trap the keyboard by re-grabbing its OWN focus on blur (onblur/onfocusout →
// focus(), commonly via setTimeout) so focus can never move off it. The region detector misses this:
// there is no modal region to anchor, and its escape probe is synchronous — it reads focus BEFORE the
// async refocus fires. ACT 80af7b Failed Examples 1-2.
//
// SOUND BY CONSTRUCTION (validated: 0 false positives across every 80af7b passed/inapplicable example).
// An element X is a confirmed trap iff ALL hold: the page has >=2 keyboard-focusables (so the trap is
// genuinely blocking access, not "nowhere else to go"); focusing X then pressing Tab AND Shift+Tab, after
// settling past any async refocus, BOTH return focus to X ITSELF; and focus left X synchronously in at
// least one direction (proving an ACTIVE refocus, not a single-focusable positive-tabindex wrap). The
// mutual-bounce variants (Failed 3-5: focus hops btn1<->btn2, never returning to the SAME element) are
// deliberately NOT flagged — they are empirically indistinguishable from the rule's PASSED bounce
// examples (e.g. Passed Example 7) by focus behaviour, so flagging them would be unsound.
const REFOCUS_SETTLE_MS = 180; // cover an async onblur/onfocusout refocus (setTimeout / chained rAF) + margin
// (raised 140→180 in coverage round 2: a chained-timer/rAF refocus can exceed 140ms, and the tighter
// margin made the forward-walk candidate scan flaky under heavy concurrent-Chrome load — a wider settle
// is a pure robustness margin, it does not change which elements are CONFIRMED traps.)
const RETENTION_CAP = 60;      // bound the candidate scan on large pages (offline instrument lane)
const settleMs = (page, ms) => page.evaluate((t) => new Promise((r) => setTimeout(r, t)), ms);

function tagFocusables(focSel) {
  const getXPath = (e) => {
    if (!e || !e.tagName) return '';
    if (e === document.body) return '/html/body';
    const ns = e.namespaceURI; const isHtml = !ns || ns === 'http://www.w3.org/1999/xhtml';
    const t = isHtml ? e.tagName.toLowerCase() : e.tagName;
    let idx = 1, sib = e.previousElementSibling;
    while (sib) { if (sib.tagName === e.tagName) idx++; sib = sib.previousElementSibling; }
    return getXPath(e.parentElement) + (isHtml ? '/' + t + '[' + idx + ']' : "/*[local-name()='" + t + "'][" + idx + "]");
  };
  const out = [];
  document.querySelectorAll(focSel).forEach((el, i) => {
    const ti = el.getAttribute('tabindex');
    if (ti !== null && parseInt(ti, 10) < 0) return;                    // tabindex<0 is not in the Tab ring
    if (!(el.offsetParent !== null || getComputedStyle(el).position === 'fixed')) return; // not rendered
    const id = 'fr' + i; el.setAttribute('data-v3-foc', id);
    out.push({ id, xpath: getXPath(el), tag: el.tagName.toLowerCase(),
      label: (el.innerText || el.textContent || el.value || '').trim().replace(/\s+/g, ' ').slice(0, 60) });
  });
  return out;
}
const activeFocId = () => { const a = document.activeElement; return a && a.getAttribute ? (a.getAttribute('data-v3-foc') || '') : ''; };

async function detectFocusRetentionTraps(page, opts = {}) {
  const focs = await page.evaluate(tagFocusables, FOCUSABLE_SEL).catch(() => []);
  if (!Array.isArray(focs) || focs.length < 2) return { traps: [], focusableCount: (focs || []).length, candidates: [] };
  const byId = new Map(focs.map((f) => [f.id, f]));
  const scan = focs.slice(0, RETENTION_CAP);

  // settled forward walk: an element that is the active focus for two CONSECUTIVE settled Tab steps has
  // retained focus across a Tab — a self-refocus candidate (cheap; surfaces the blocking trap).
  await page.evaluate(() => { const b = document.body; if (b) { b.tabIndex = -1; b.focus(); } });
  const candIds = new Set();
  let prev = '';
  for (let i = 0; i < scan.length + 4; i++) {
    await page.keyboard.press('Tab');
    await settleMs(page, REFOCUS_SETTLE_MS);
    const cur = await page.evaluate(activeFocId).catch(() => '');
    if (cur && cur === prev) candIds.add(cur);
    prev = cur;
  }

  // confirm each candidate bidirectionally (drain pending timers via body between probes).
  const focusBody = () => page.evaluate(() => { const b = document.body; if (b) { b.tabIndex = -1; b.focus(); } });
  const focusId = (id) => page.evaluate((i) => { const el = document.querySelector(`[data-v3-foc="${i}"]`); if (el) { el.focus(); return document.activeElement === el; } return false; }, id);
  async function dirReturns(id, backward) {
    await focusBody(); await settleMs(page, 50);
    if (!(await focusId(id))) return { returns: false, leftSync: false };
    if (backward) { await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift'); }
    else { await page.keyboard.press('Tab'); }
    const leftSync = (await page.evaluate(activeFocId).catch(() => '')) !== id;
    await settleMs(page, REFOCUS_SETTLE_MS);
    const returns = (await page.evaluate(activeFocId).catch(() => '')) === id;
    return { returns, leftSync };
  }
  const traps = [];
  for (const id of candIds) {
    const f = byId.get(id); if (!f) continue;
    const fwd = await dirReturns(id, false);
    const bwd = await dirReturns(id, true);
    if (fwd.returns && bwd.returns && (fwd.leftSync || bwd.leftSync)) {
      traps.push({ sc: '2.1.2', xpath: f.xpath, tag: f.tag, label: f.label });
    }
  }
  return { traps, focusableCount: focs.length, coverageTruncated: focs.length > RETENTION_CAP, candidates: [...candIds] };
}

// F55 (coverage #15): the INVERSE of a self-refocus trap — an element that REMOVES its own focus the
// instant it receives it (onfocus="this.blur()", or a script that blurs on focus). It "reads as
// non-focusable": focus() never rests on it and focus lands back on <body>, so a keyboard user can never
// operate it (2.1.1) and no focus indicator can ever show (2.4.7). SOUND BY CONSTRUCTION: only genuinely
// FOCUSABLE_SEL candidates are probed; a candidate is flagged ONLY when, across TWO attempts, focus()
// fails to rest on it AND lands specifically on <body> (an ACTIVE removal). A benign focus REDIRECT to a
// different control lands focus elsewhere (not body) and is NOT flagged; a sync OR async blur both caught
// (the post-settle read covers setTimeout(blur)).
async function detectFocusRejection(page, opts = {}) {
  const focs = await page.evaluate(tagFocusables, FOCUSABLE_SEL).catch(() => []);
  if (!Array.isArray(focs) || !focs.length) return { rejections: [], focusableCount: (focs || []).length };
  const scan = focs.slice(0, RETENTION_CAP);
  const focusBody = () => page.evaluate(() => { const b = document.body; if (b) { b.tabIndex = -1; b.focus(); } });
  const tryFocus = (id) => page.evaluate((i) => {
    const el = document.querySelector(`[data-v3-foc="${i}"]`);
    if (!el) return null;
    if (el.disabled || el.getAttribute('aria-disabled') === 'true') return { skip: true };
    const inlineHandler = !!(el.getAttribute('onfocus') || el.getAttribute('onblur') || el.getAttribute('onfocusout'));
    el.focus();
    return { skip: false, inlineHandler };
  }, id).catch(() => null);
  const readFocus = (id) => page.evaluate((i) => {
    const el = document.querySelector(`[data-v3-foc="${i}"]`);
    if (!el) return null;
    return { took: document.activeElement === el || el.contains(document.activeElement), onBody: document.activeElement === document.body };
  }, id).catch(() => null);
  const rejections = [];
  for (const f of scan) {
    await focusBody();
    const a = await tryFocus(f.id);
    if (!a || a.skip) continue;
    await settleMs(page, REFOCUS_SETTLE_MS);          // let a same-tick async blur land (setTimeout F55)
    const s1 = await readFocus(f.id);
    if (!s1 || s1.took || !s1.onBody) continue;       // rests on element ⇒ fine; landed elsewhere ⇒ redirect, not F55
    await focusBody();                                 // confirm with a second independent attempt
    await tryFocus(f.id);
    await settleMs(page, REFOCUS_SETTLE_MS);
    const s2 = await readFocus(f.id);
    if (s2 && !s2.took && s2.onBody) rejections.push({ sc: '2.1.1', xpath: f.xpath, tag: f.tag, label: f.label, inlineHandler: !!a.inlineHandler });
  }
  return { rejections, focusableCount: focs.length, coverageTruncated: focs.length > RETENTION_CAP };
}

module.exports = { collectTabOrder, tabOrderFindings, detectKeyboardTraps, detectFocusRetentionTraps, detectFocusRejection, REACH_SAFETY_CAP, REFOCUS_SETTLE_MS, TRAP_REGION_SEL, FOCUSABLE_SEL };
