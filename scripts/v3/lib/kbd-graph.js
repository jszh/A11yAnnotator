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

// ── MUTUAL-BOUNCE / FIXED-SET CONFINEMENT keyboard trap (WCAG 2.1.2) — the live-JS complement to the two
// detectors above ──────────────────────────────────────────────────────────────────────────────────────
// detectFocusRetentionTraps only flags a self-refocus (focus returns to the SAME element) and deliberately
// skips the mutual-bounce variants (ACT 80af7b Failed 3-5: focus hops btn1↔btn2↔…, never the SAME element)
// because they are indistinguishable from the rule's PASSED bounce examples by the self-return test ALONE.
// The distinguishing signal the rule actually turns on is whether focus can ever LEAVE the bounce set: a
// PASSED bounce (e.g. Passed Ex7's sibling progression) eventually steps OUT of the set, and a legitimate
// modal that traps focus still RELEASES on Escape — both let the user out. A 2.1.2 trap does not: with the
// page handlers ACTIVE, focus stays confined to one small fixed set S under Tab AND Shift+Tab AND Escape,
// and a focusable demonstrably OUTSIDE S is never reached. We measure exactly that on the live page.
//
// SOUND BY CONSTRUCTION: a set S is CONFIRMED only when ALL hold — |S| >= 2 (a genuine bounce, not a lone
// stuck element, which the self-refocus detector owns); at least one focusable lies OUTSIDE S (so escape is
// genuinely blocked, not "nowhere else to go"); a long forward sweep (>= CONFINE_WINDOW presses, bounded by
// REACH_SAFETY_CAP) never leaves S; an independent extended Shift+Tab sweep also never leaves S; and pressing
// Escape, after settling, still leaves focus inside S (an ESCAPABLE modal fails here — Escape moves focus out
// of S or dissolves the set, so it is NOT flagged). Fail-closed: any probe step that cannot run abandons the
// candidate (no false NO_BARRIER is ever asserted from here — the caller's other outcomes stand).
const CONFINE_MULTIPLE = 4;    // a fixed set is "confined" only after Tab cycles through it >= this many times over
const CONFINE_FLOOR = 16;      // …but never fewer than this many presses (a legit ring must get a fair chance to exit)
const escSettle = REFOCUS_SETTLE_MS; // Escape may trigger an async close/refocus — settle before reading, like the rest

async function detectFixedSetConfinementTraps(page, opts = {}) {
  const focs = await page.evaluate(tagFocusables, FOCUSABLE_SEL).catch(() => []);
  // need >= 3 focusables: a confining set of >= 2 PLUS at least one element outside it that focus cannot reach.
  if (!Array.isArray(focs) || focs.length < 3) return { traps: [], focusableCount: (focs || []).length };
  const cap = Number.isFinite(opts.safetyCap) ? opts.safetyCap : REACH_SAFETY_CAP;
  const byId = new Map(focs.map((f) => [f.id, f]));
  const total = focs.length;

  // forward sweep from <body> with handlers ACTIVE: record the SETTLED active id at each Tab (so an async
  // refocus has landed before we read). Bounded by CONFINE_WINDOW (and REACH_SAFETY_CAP) so a pathological
  // page cannot run away. The visited SEQUENCE is the evidence; the distinct set is the confinement candidate.
  const window = Math.min(cap, Math.max(CONFINE_FLOOR, total * CONFINE_MULTIPLE));
  async function sweep(backward, budget) {
    await page.evaluate(() => { const b = document.body; if (b) { b.tabIndex = -1; b.focus(); } }).catch(() => null);
    const seq = [];
    for (let i = 0; i < budget; i++) {
      if (backward) { await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift'); }
      else { await page.keyboard.press('Tab'); }
      await settleMs(page, REFOCUS_SETTLE_MS);
      const cur = await page.evaluate(activeFocId).catch(() => null);
      if (cur === null) return null;                 // probe failed mid-sweep ⇒ fail-closed (abandon candidate)
      seq.push(cur);
    }
    return seq;
  }
  const fwdSeq = await sweep(false, window);
  if (!fwdSeq) return { traps: [], focusableCount: total, undetermined: true };

  // the confinement candidate is the distinct set of REAL elements (drop body/sentinel '' entries) that the
  // forward sweep settled on AFTER it had a chance to start cycling — we take the tail half so a clean ring's
  // one-time pass through every element is not mistaken for a confined set. >= 2 distinct, < total focusables.
  const tail = fwdSeq.slice(Math.floor(fwdSeq.length / 2)).filter((id) => id && byId.has(id));
  const S = new Set(tail);
  if (S.size < 2 || S.size >= total) return { traps: [], focusableCount: total };
  // the WHOLE forward window must have stayed inside S once it entered (a legit ring would have left it) —
  // i.e. every settled focus from the first time we were in S onward is still in S.
  const firstInS = fwdSeq.findIndex((id) => S.has(id));
  if (firstInS < 0) return { traps: [], focusableCount: total };
  const fwdConfined = fwdSeq.slice(firstInS).every((id) => S.has(id));
  if (!fwdConfined) return { traps: [], focusableCount: total };

  // an independent extended Shift+Tab sweep must ALSO never leave S (a one-way bounce is not a hard trap —
  // the user can still escape backward; that case is left to the directional reporting in detectKeyboardTraps).
  const bwdSeq = await sweep(true, window);
  if (!bwdSeq) return { traps: [], focusableCount: total, undetermined: true };
  const bwdTail = bwdSeq.filter((id) => id && byId.has(id));
  if (!bwdTail.length || !bwdTail.every((id) => S.has(id))) return { traps: [], focusableCount: total };

  // ESCAPE route check (CRITICAL false-positive guard): drive focus into S, press Escape, settle, and confirm
  // focus is STILL inside S. A legitimate modal that traps focus but releases on Escape moves focus OUT of S
  // (or dissolves the set), so escEscapes = true ⇒ NOT a 2.1.2 barrier and we do not flag it.
  const entered = await page.evaluate((id) => { const el = document.querySelector(`[data-v3-foc="${id}"]`); if (el) { el.focus(); return document.activeElement === el; } return false; }, [...S][0]).catch(() => null);
  if (entered === null) return { traps: [], focusableCount: total, undetermined: true };
  let escEscapes = false;
  if (entered) {
    await page.keyboard.press('Escape');
    await settleMs(page, escSettle);
    const after = await page.evaluate(activeFocId).catch(() => null);
    if (after === null) return { traps: [], focusableCount: total, undetermined: true };
    escEscapes = !S.has(after);                      // focus left S (or set element gone) ⇒ Escape is a way out
  } else {
    return { traps: [], focusableCount: total, undetermined: true }; // could not enter S ⇒ fail-closed
  }
  if (escEscapes) return { traps: [], focusableCount: total };       // escapable ⇒ not a barrier

  // CONFIRMED: focus is confined to a small fixed set S it cannot leave by Tab, Shift+Tab, or Escape, while a
  // focusable outside S is never reached. Report the set (the entry element anchors the finding's xpath).
  const members = [...S].map((id) => byId.get(id)).filter(Boolean);
  const anchor = members[0];
  return {
    traps: [{ sc: '2.1.2', xpath: anchor.xpath, tag: anchor.tag, label: anchor.label,
      memberXpaths: members.map((m) => m.xpath), setSize: S.size,
      deterministicTrapConfirmed: true }],
    focusableCount: total, candidateSet: members.map((m) => m.xpath),
  };
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

// 6cfa84 (4.1.2): a tabbable element with an aria-hidden ANCESTOR — the AT never announces it, so a keyboard
// user reaches a control with no name/role/state. This MUST be a DYNAMIC detector: the held-out check proved the
// rule's PASSED example (an off-screen focus-SENTINEL <a> in aria-hidden that redirects focus on receipt) is
// STATICALLY IDENTICAL to its FAILED example — a static flag can only over-fit one and FP the other. We drive
// focus and observe whether it RESTS. SOUND BY CONSTRUCTION + held-out-validated over the whole 6cfa84 rule:
//  - applicability mirrors the rule: only FOCUSABLE_SEL candidates in the Tab ring (tabFocusables already drops
//    tabindex<0, so an inapplicable tabindex=-1/aria-hidden control is never probed) that have a PROPER ANCESTOR
//    (not self) with aria-hidden=true — a self-aria-hidden control is a different concern and is NOT 6cfa84;
//  - a candidate is a barrier ONLY when, after focus() + a full settle (covering a setTimeout/rAF redirect),
//    focus still RESTS on that same element. A sentinel redirects focus AWAY → settledId !== id → NOT flagged.
//  Fail-closed: a candidate whose focus cannot be read is abandoned (never a false barrier).
async function detectFocusRestsInAriaHidden(page, opts = {}) {
  const focs = await page.evaluate(tagFocusables, FOCUSABLE_SEL).catch(() => []);
  if (!Array.isArray(focs) || !focs.length) return { traps: [], focusableCount: (focs || []).length };
  // which tagged (tabbable) focusables sit under a PROPER ANCESTOR with aria-hidden=true
  const candidateIds = await page.evaluate(() => {
    const out = [];
    document.querySelectorAll('[data-v3-foc]').forEach((el) => {
      let p = el.parentElement;
      while (p) { if (p.getAttribute && p.getAttribute('aria-hidden') === 'true') { out.push(el.getAttribute('data-v3-foc')); break; } p = p.parentElement; }
    });
    return out;
  }).catch(() => []);
  const byId = new Map(focs.map((f) => [f.id, f]));
  const traps = [];
  for (const id of candidateIds) {
    const f = byId.get(id); if (!f) continue;
    await page.evaluate(() => { const b = document.body; if (b) { b.tabIndex = -1; b.focus(); } }).catch(() => null);
    const focused = await page.evaluate((i) => { const el = document.querySelector(`[data-v3-foc="${i}"]`); if (!el) return false; el.focus(); return true; }, id).catch(() => null);
    if (focused === null) continue;                                  // fail-closed: cannot drive focus
    await settleMs(page, REFOCUS_SETTLE_MS);                          // let a sentinel's onfocus redirect (sync OR setTimeout) land
    const settledId = await page.evaluate(activeFocId).catch(() => null);
    if (settledId === null) continue;                                // fail-closed: cannot read focus
    if (settledId === id) traps.push({ sc: '4.1.2', xpath: f.xpath, tag: f.tag, label: f.label });
  }
  return { traps, focusableCount: focs.length };
}

module.exports = { collectTabOrder, tabOrderFindings, detectKeyboardTraps, detectFocusRetentionTraps, detectFixedSetConfinementTraps, detectFocusRejection, detectFocusRestsInAriaHidden, REACH_SAFETY_CAP, REFOCUS_SETTLE_MS, TRAP_REGION_SEL, FOCUSABLE_SEL };
