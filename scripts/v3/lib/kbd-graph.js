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
  // LABEL — what a reader would CALL this stop. Content text alone (the pre-2026-08-16 reading) is empty
  // for the single commonest 2.4.3 shape there is: a form of `aria-label`led inputs and icon buttons. Every
  // stop then arrived unnamed, and `focus-order-meaning-v0` was asked to judge whether a sequence "preserves
  // meaning" from a list of bare xpaths. Resolve the accessible name the way the AX tree does — explicit
  // aria-label, then aria-labelledby, then an associated <label>, then content — before falling back to
  // value/placeholder/title/alt, which are what an unlabelled control actually announces.
  const clean = (s) => String(s == null ? '' : s).trim().replace(/\s+/g, ' ').slice(0, 60);
  const labelledBy = () => {
    const ids = (a.getAttribute && a.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean);
    if (!ids.length) return '';
    return clean(ids.map((id) => { const n = document.getElementById(id); return n ? (n.innerText || n.textContent || '') : ''; }).join(' '));
  };
  const forLabel = () => {
    if (!a.id) return '';
    const l = document.querySelector('label[for="' + (window.CSS && CSS.escape ? CSS.escape(a.id) : a.id) + '"]');
    if (l) return clean(l.innerText || l.textContent);
    const anc = a.closest ? a.closest('label') : null;    // implicit <label><input>…</label>
    return anc ? clean(anc.innerText || anc.textContent) : '';
  };
  const label = clean(a.getAttribute && a.getAttribute('aria-label')) || labelledBy() || forLabel()
    || clean(a.innerText || a.textContent) || clean(a.value)
    || clean(a.getAttribute && a.getAttribute('placeholder')) || clean(a.title)
    || clean(a.getAttribute && a.getAttribute('alt'));
  // MODAL CONTAINMENT fact (2.4.3). When a modal is open, a tab stop OUTSIDE it is a containment leak —
  // but deciding that from rect geometry alone is guesswork, so record it as a fact per stop. Covers both
  // the native top-layer form and the ARIA form; a purely VISUAL scrim declares nothing programmatically
  // and is deliberately left to the judge and the viewport.
  const openModal = document.querySelector('dialog[open], [aria-modal="true"]');
  const ownModal = a.closest ? a.closest('dialog[open], [aria-modal="true"]') : null;
  return { sentinel: false, seen, xpath: getXPath(a), tag: a.tagName.toLowerCase(),
    rect: { x: Math.round(pinned ? r.left : r.left + window.scrollX), y: Math.round(pinned ? r.top : r.top + window.scrollY), w: Math.round(r.width), h: Math.round(r.height) },
    label,
    modalOpen: !!openModal,
    insideOpenModal: !!ownModal,
    modalXpath: ownModal ? getXPath(ownModal) : null };
}

async function collectTabOrder(page, opts = {}) {
  const cap = Number.isFinite(opts.safetyCap) ? opts.safetyCap : REACH_SAFETY_CAP;
  const backward = opts.backward === true;
  // RING START — do NOT try to reset focus; UN-ROTATE the ring afterwards instead.
  //
  // The walk records a CYCLE, so index 0 is "the first tab stop" only if focus sat at the document
  // boundary before the first Tab. The old `body.tabIndex=-1; body.focus()` was meant to guarantee that
  // and did the opposite, in two measured ways:
  //   1. It MOVES the sequential-navigation starting point into <body>'s DOM position, from which
  //      Chromium resumes in DOM order and reaches the POSITIVE tabindexes only after crossing the
  //      document boundary. Measured on f44 case-03: untouched gives ti=1,2,3,4,5; after body.focus()
  //      the same page records name,email,Donate,<doc>,amount,custom — so a page using positive tabindex
  //      to REPAIR its order was handed to the judge looking scrambled, and was duly failed.
  //   2. Under `showModal()` everything outside the dialog is INERT, so the call silently does nothing
  //      and the walk starts wherever the page had put focus (bold → recorded italic,submit,<doc>,bold).
  // There is no in-page primitive that fixes this: `blur()` was measured too and does NOT restore the
  // starting point once focus has moved (it only looked correct on a page where focus had never moved).
  //
  // But the `<doc>` sentinel IS the ring boundary — exactly one crossing per cycle — so the true order is
  // recoverable without touching focus at all: walk, note where the boundary fell, and rotate the recorded
  // sequence to start just after it. Verified to reproduce the user-visible order in all three shapes above.
  await page.evaluate(() => { window.__kbdSeen = new WeakSet(); }).catch(() => {});
  // Whatever the page itself focused on load IS the user's first stop, and the walk (which records the
  // element AFTER each Tab) can never see it otherwise — seed it. probeActive also enrols it in the
  // cycle-detection WeakSet, so returning to it still ends the ring.
  const entry = await page.evaluate(probeActive).catch(() => ({ sentinel: true }));
  const order = [];
  let wrapped = false, exhausted = false, sawNode = false, sentinelStreak = 0;
  let boundaryAt = -1;   // index in `order` after which the document boundary was crossed
  if (!entry.sentinel) {
    order.push({ index: 0, xpath: entry.xpath, tag: entry.tag, rect: entry.rect, label: entry.label, modalOpen: entry.modalOpen, insideOpenModal: entry.insideOpenModal, modalXpath: entry.modalXpath });
    sawNode = true;
  }
  for (let i = 0; i < cap; i++) {
    if (backward) { await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift'); }
    else { await page.keyboard.press('Tab'); }
    if (process.env.V3_SETTLE_KBD !== '0') await require('./settle.js').awaitFocusSettle(page); // DEFAULT-ON (opt out V3_SETTLE_KBD=0); settle the FOCUSED element before reading activeElement — see settle.js
    const info = await page.evaluate(probeActive).catch(() => ({ sentinel: true, err: true }));
    // A SINGLE body/sentinel mid-ring is normal — positive tabindex routes focus through the document
    // boundary after the highest tabindex, so only TWO consecutive sentinels (or a WeakSet revisit) is a
    // true wrap (audit: positive-tabindex order was truncated to 1 element by treating the 1st sentinel
    // as a wrap). Cycle detection is driven by info.seen; the sentinel only ends a fully-walked ring.
    if (info.sentinel) {
      if (sawNode) {
        if (boundaryAt < 0) boundaryAt = order.length - 1;  // the cycle restarts after this stop
        if (++sentinelStreak >= 2) { wrapped = true; break; }
      }
      continue;
    }
    sentinelStreak = 0;
    if (info.seen) { wrapped = true; break; }                                      // revisited ⇒ ring complete
    sawNode = true;
    order.push({ index: order.length, xpath: info.xpath, tag: info.tag, rect: info.rect, label: info.label, modalOpen: info.modalOpen, insideOpenModal: info.insideOpenModal, modalXpath: info.modalXpath });
  }
  if (!wrapped && order.length >= cap) exhausted = true;
  // UN-ROTATE at the boundary so index 0 is the page's genuine first tab stop. A boundary at the very end
  // (or none seen at all) means the sequence already starts there and is left untouched.
  let startAnchored = entry.sentinel === true;   // started at the document boundary ⇒ already canonical
  if (boundaryAt >= 0 && boundaryAt < order.length - 1) {
    const rotated = [...order.slice(boundaryAt + 1), ...order.slice(0, boundaryAt + 1)];
    order.length = 0;
    rotated.forEach((o, i) => order.push({ ...o, index: i }));
    startAnchored = true;
  } else if (boundaryAt >= 0) {
    startAnchored = true;                        // boundary fell at the end ⇒ index 0 is already first
  }
  return { order, wrapped, exhausted, count: order.length, backward, startAnchored, boundaryAt };
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
// Where did focus land relative to the region? Three outcomes, not two — the missing third is the bug this
// replaces. `inside` / `outside` are self-explanatory; `boundary` means focus is on <body>/<html>/nothing,
// i.e. it is CROSSING the document boundary, which is a normal waypoint in a ring rather than an escape.
// Every tab ring passes through it exactly once per cycle, INCLUDING a native `<dialog>`'s: measured
// directly, a modal whose real order is three buttons records `b1 → b2 → b3 → <doc> → b1`. Treating that
// waypoint as "focus left the region" made `probeDirectionalEscape` report `trapped: false` for every trap
// whose ring reaches the boundary — the whole native-modal family — while still confirming JS traps that
// snap focus back without ever touching it.
async function focusPositionFor(page, regId) {
  return page.evaluate((id) => {
    const reg = document.querySelector(`[data-v3-trapreg="${id}"]`);
    const a = document.activeElement;
    if (!a || a === document.body || a === document.documentElement) return 'boundary';
    return (reg && reg.contains(a)) ? 'inside' : 'outside';
  }, regId);
}
async function stillInside(page, regId) {
  return (await focusPositionFor(page, regId)) === 'inside';
}

// Drive `budget` Tab (or Shift+Tab) presses from inside the region; trapped = focus NEVER escaped.
async function probeDirectionalEscape(page, regId, budget, backward) {
  if (!(await focusFirstIn(page, regId))) return { trapped: false, undetermined: true };
  let boundaryHits = 0;
  for (let i = 0; i < budget; i++) {
    if (backward) { await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift'); }
    else { await page.keyboard.press('Tab'); }
    // NO settle here: stillInside() is a synchronous CONTAINMENT check (reg.contains(activeElement)) — it doesn't read
    // scroll/layout, and this high-frequency probe presses up to `budget` tabs PER REGION (the dominant call source —
    // ~80% of the focus-settle calls). The order-bearing read that DOES want a settle is the tab-order walk above.
    const pos = await focusPositionFor(page, regId);
    if (pos === 'outside') return { trapped: false };          // a REAL element outside the region ⇒ escaped
    if (pos === 'boundary') {
      // A document-boundary waypoint. Tolerate a bounded number of them — one per ring cycle is normal —
      // and keep pressing: if the next press lands on a real element outside the region, that IS the escape
      // and the line above catches it. Unbounded tolerance would let a page that parks focus on <body>
      // forever read as trapped, so the budget caps it.
      if (++boundaryHits > 2) return { trapped: false, undetermined: true };
    }
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
// CONCURRENCY-ROBUST confirmation (fixes the flake under heavy parallel Chrome): the old dirReturns read
// focus via single CDP round-trips — `leftSync` immediately after Tab, `returns` after ONE fixed 180ms settle.
// Under process contention those round-trips are irregularly delayed PAST the fixture's 10ms onblur→setTimeout
// refocus, so the snapshot races the refocus and the trap is intermittently missed (~27% under 24-way load).
// Instead we (1) record EVERY focus change in-page via a focusin listener (event-driven ⇒ a departure is never
// lost to a slow sample) and (2) POLL for the refocus to RETURN focus, up to a generous deadline, exiting early
// when focus has demonstrably SETTLED on another focusable. Robust to load; no fixed sleep that load can outrun.
const RETURN_POLL_MS = 20;       // poll cadence while waiting for a refocus to land
const RETURN_MAX_MS = 1500;      // upper bound for a load-delayed refocus to pull focus back (only fully spent on a NON-return)
const MIN_REFOCUS_WAIT_MS = 200; // never conclude "no return" before this — covers a load-delayed onblur→setTimeout refocus
const SETTLED_ELSEWHERE_MS = 140;// …and only after focus has been STABLE on another real focusable this long

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
  // install an in-page focus-change recorder (capture phase, idempotent): every focusin pushes the target's
  // data-v3-foc id (or '' for body/untagged). dirReturns reads this log so a transient departure that a slow
  // CDP sample would miss is still recorded — the load-robust basis for `leftSync`.
  await page.evaluate(() => {
    if (window.__frInstalled) { window.__frLog = []; return; }
    window.__frInstalled = true; window.__frLog = [];
    document.addEventListener('focusin', (e) => {
      const t = e.target; window.__frLog.push((t && t.getAttribute && t.getAttribute('data-v3-foc')) || '');
    }, true);
  }).catch(() => null);

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
    await page.evaluate(() => { window.__frLog = []; }).catch(() => null); // record focus changes from the Tab onward
    if (backward) { await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift'); }
    else { await page.keyboard.press('Tab'); }
    // POLL for the refocus to RETURN focus to `id`, instead of one fixed-settle snapshot that load can outrun.
    // Stop early (returns=false) only once focus has demonstrably SETTLED on ANOTHER real focusable past the
    // refocus window — so a genuine non-trap candidate costs ~MIN_REFOCUS_WAIT, while a real (possibly delayed)
    // refocus is caught the instant it lands. Also tracks whether focus was EVER observed off `id` (sampled).
    const t0 = Date.now();
    let returns = false, sawNonId = false, elsewhere = '', elsewhereSince = 0;
    while (Date.now() - t0 < RETURN_MAX_MS) {
      const cur = await page.evaluate(activeFocId).catch(() => null);
      if (cur === id) { returns = true; break; }
      if (cur != null) {
        sawNonId = true;
        if (cur && byId.has(cur)) { // a real, tab-reachable focusable (not body '')
          if (cur !== elsewhere) { elsewhere = cur; elsewhereSince = Date.now(); }
          else if (Date.now() - t0 >= MIN_REFOCUS_WAIT_MS && Date.now() - elsewhereSince >= SETTLED_ELSEWHERE_MS) break;
        } else { elsewhere = ''; }
      }
      await settleMs(page, RETURN_POLL_MS);
    }
    if (!returns) { await settleMs(page, REFOCUS_SETTLE_MS); returns = (await page.evaluate(activeFocId).catch(() => '')) === id; }
    // leftSync = focus DEMONSTRABLY left `id` (an active departure + pull-back, not a single-focusable wrap):
    // the event log captured a focusin on some OTHER element, OR a poll sampled focus off `id`. Event-driven, so
    // not lost to a slow sample like the old single read was.
    const log = await page.evaluate(() => (window.__frLog || []).slice()).catch(() => []);
    const leftSync = sawNonId || log.some((x) => x && x !== id);
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
    const seq = [], imm = [];
    for (let i = 0; i < budget; i++) {
      if (backward) { await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift'); }
      else { await page.keyboard.press('Tab'); }
      const i0 = await page.evaluate(activeFocId).catch(() => null); // PRE-settle read: where the browser landed BEFORE any async refocus bounces it
      await settleMs(page, REFOCUS_SETTLE_MS);
      const cur = await page.evaluate(activeFocId).catch(() => null);
      if (cur === null) return null;                 // probe failed mid-sweep ⇒ fail-closed (abandon candidate)
      seq.push(cur); imm.push(i0);
    }
    return { seq, imm };
  }
  const fwd = await sweep(false, window);
  if (!fwd) return { traps: [], focusableCount: total, undetermined: true };
  const fwdSeq = fwd.seq;

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
  // TRANSIENT-REACH guard (80af7b Passed Ex7, async sibling-progression): a `setTimeout(()=>sibling.focus())` bounce
  // lets the browser FIRST land focus on the element OUTSIDE S (the next sibling) before the timer bounces it back.
  // The user genuinely reached that outside element, so this is PROGRESSION, not a hard trap. If any PRE-settle
  // (immediate) focus, once we are in S, lands on a real focusable outside S, abandon the candidate. (A SYNCHRONOUS
  // onblur bounce — the failed cases — never lets focus settle outside S even immediately.)
  if (fwd.imm.slice(firstInS).some((id) => id && byId.has(id) && !S.has(id))) return { traps: [], focusableCount: total };

  // an independent extended Shift+Tab sweep must ALSO never leave S (a one-way bounce is not a hard trap —
  // the user can still escape backward; that case is left to the directional reporting in detectKeyboardTraps).
  const bwd = await sweep(true, window);
  if (!bwd) return { traps: [], focusableCount: total, undetermined: true };
  const bwdTail = bwd.seq.filter((id) => id && byId.has(id));
  if (!bwdTail.length || !bwdTail.every((id) => S.has(id))) return { traps: [], focusableCount: total };
  // backward transient-reach guard (mirror): an async progression escapes backward too.
  if (bwd.imm.some((id) => id && byId.has(id) && !S.has(id))) return { traps: [], focusableCount: total };

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

  // ADVISED-KEY escape (80af7b advisory exception): 2.1.2 PERMITS a non-standard exit IF the page ADVISES the user
  // of it AND that key actually works. `tryAdvised` parses an advisory ("Press Ctrl+M to Exit") from the CURRENT page
  // text, drives focus into S, presses the combo, and reports: 'clear' (the advised key freed focus ⇒ documented exit
  // works ⇒ NOT a barrier), 'lying' (the page advises a key that does NOT move focus ⇒ a 2.1.2 barrier), 'none' (no
  // advisory in the current text), or 'undetermined' (probe failed ⇒ fail-closed).
  const tryAdvised = async () => {
    const advised = await page.evaluate(() => {
      const t = (document.body && (document.body.innerText || document.body.textContent)) || '';
      const m = t.match(/press\s+(?:the\s+)?((?:ctrl|control|alt|option|shift|cmd|command|meta)\s*\+\s*)?["']?([A-Za-z0-9])["']?\s+(?:key\s+)?to\s+(?:leave|exit|close|escape|dismiss|continue|go)/i);
      return m ? { mod: (m[1] || '').replace(/[^a-z]/gi, '').toLowerCase(), key: m[2].toLowerCase() } : null;
    }).catch(() => null);
    if (!advised || !advised.key) return 'none';
    await page.evaluate((id) => { const el = document.querySelector(`[data-v3-foc="${id}"]`); if (el) el.focus(); }, [...S][0]).catch(() => null);
    const MOD = { ctrl: 'Control', control: 'Control', alt: 'Alt', option: 'Alt', shift: 'Shift', cmd: 'Meta', command: 'Meta', meta: 'Meta' };
    const mod = MOD[advised.mod] || null;
    if (mod) await page.keyboard.down(mod);
    await page.keyboard.press(advised.key);
    if (mod) await page.keyboard.up(mod);
    await settleMs(page, escSettle);
    const after = await page.evaluate(activeFocId).catch(() => null);
    if (after === null) return 'undetermined';
    return S.has(after) ? 'lying' : 'clear';
  };

  // Phase 1 — STATIC advisory (visible without interaction).
  const r1 = await tryAdvised();
  if (r1 === 'clear') return { traps: [], focusableCount: total };                       // documented static exit works ⇒ not a barrier
  if (r1 === 'undetermined') return { traps: [], focusableCount: total, undetermined: true };
  const lyingAdvisory = (r1 === 'lying');

  // CONFIRMED: focus is confined to a small fixed set S it cannot leave by Tab, Shift+Tab, Escape, or a documented
  // STATIC advised key, while a focusable outside S is never reached. Report the set (the entry element anchors the
  // xpath). `lyingAdvisory` (the page advertises a STATIC exit key that does NOT work) is an unambiguous deterministic
  // barrier (promoted in build-v3). A confinement with NO static advisory stays a REVIEW finding that ROUTES to the
  // 2.1.2 keyboard-trap RUBRIC: the regular LLM judge investigates a buried / non-canonically-phrased advisory by
  // ACTIVATING the confined controls via observe_state_after_activation and verifying the key with
  // interact_and_observe — both run on FRESH CLONES with navigation/popup guards, so no live page is clicked.
  const members = [...S].map((id) => byId.get(id)).filter(Boolean);
  const anchor = members[0];
  return {
    traps: [{ sc: '2.1.2', xpath: anchor.xpath, tag: anchor.tag, label: anchor.label,
      memberXpaths: members.map((m) => m.xpath), setSize: S.size,
      deterministicTrapConfirmed: true, lyingAdvisory }],
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

// ── BOUNDED REVEAL PASS (2.1.2) ────────────────────────────────────────────────────────────────────
// `detectKeyboardTraps` enumerates candidate regions from VISIBLE focusables, so a modal that is closed at
// rest has no region, no candidate, and no verdict — the page reads as trap-free. That is the whole 2.1.2
// modal family: the trap only exists once the dialog is open. Measured on the corpus, ONE opener click is
// enough — the existing detector then returns confirmed:true on the cases it previously could not see.
//
// Deliberately bounded and deliberately conservative:
//  · runs ONLY when the at-rest pass found no CONFIRMED trap (never adds work to a page already decided);
//  · at most `maxOpeners` (2) candidate openers, each on a FRESHLY RELOADED page so one modal's state
//    cannot contaminate the next probe — or the rest of the instrument lane, which is why the caller
//    hands it its own page rather than the shared one;
//  · openers are ranked by DECLARED intent (aria-haspopup / aria-expanded=false / aria-controls at a
//    hidden target) before falling back to a verb match, so a "Delete account" button is not clicked
//    speculatively ahead of an "Open filters" one;
//  · anything that would leave the page (a link, a submit, inline navigation) is excluded outright.
const OPENER_VERB_RE = /\b(open|show|view|edit|create|add|new|settings?|filters?|menu|options?|configure|manage|details?|preview|select|choose|pick|sign in|log in)\b/i;

async function findRevealOpeners(page, maxOpeners = 2) {
  return page.evaluate((max) => {
    const VERB = /\b(open|show|view|edit|create|add|new|settings?|filters?|menu|options?|configure|manage|details?|preview|select|choose|pick|sign in|log in)\b/i;
    const NAV_RE = /location\s*[.=]|\.href|window\.open|\.submit\s*\(|history\.(push|replace|go|back|forward)/i;
    const getXPath = (e) => {
      if (!e || !e.tagName) return '';
      if (e === document.body) return '/html/body';
      const t = e.tagName.toLowerCase();
      let idx = 1, sib = e.previousElementSibling;
      while (sib) { if (sib.tagName === e.tagName) idx++; sib = sib.previousElementSibling; }
      return getXPath(e.parentElement) + '/' + t + '[' + idx + ']';
    };
    const visible = (el) => (el.offsetParent !== null || getComputedStyle(el).position === 'fixed')
      && getComputedStyle(el).visibility !== 'hidden' && !el.closest('[aria-hidden="true"]');
    const out = [];
    for (const el of document.querySelectorAll('button,[role="button"],input[type="button"]')) {
      if (!visible(el) || el.disabled) continue;
      if (el.closest('a[href]')) continue;
      const type = (el.getAttribute('type') || '').toLowerCase();
      if (type === 'submit' || type === 'reset' || type === 'image') continue;   // would leave the page
      if (el.tagName === 'BUTTON' && !type && el.form) continue;                 // default-submit
      if (NAV_RE.test(el.getAttribute('onclick') || '')) continue;
      // already inside a dialog/menu ⇒ it is a control OF the revealed thing, not its opener
      if (el.closest('[role=dialog],dialog,[aria-modal="true"],[role=menu],[role=listbox]')) continue;
      const name = (el.getAttribute('aria-label') || el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
      const controlled = (el.getAttribute('aria-controls') || '').split(/\s+/).filter(Boolean)
        .map((id) => document.getElementById(id)).filter(Boolean);
      const controlsHidden = controlled.some((c) => c.offsetParent === null || c.hidden || c.getAttribute('aria-hidden') === 'true');
      let rank = 3;                                   // any other SAFE button — see the precondition below
      if (el.getAttribute('aria-haspopup')) rank = 0;
      else if (el.getAttribute('aria-expanded') === 'false' || controlsHidden) rank = 1;
      else if (VERB.test(name)) rank = 2;
      out.push({ xpath: getXPath(el), name: name.slice(0, 40), rank });
    }
    out.sort((a, b) => a.rank - b.rank);
    return out.slice(0, max);
  }, maxOpeners).catch(() => []);
}

// Reload → click one opener → run the trap detectors. Returns the first CONFIRMED result, tagged with the
// opener that revealed it, or null. The caller owns page lifetime; this never touches the shared lane page.
async function detectTrapsAfterReveal(page, url, opts = {}) {
  const maxOpeners = Number.isFinite(opts.maxOpeners) ? opts.maxOpeners : 2;
  // RELOAD BEFORE LOOKING. This runs at the END of the instrument lane, by which point the page has been
  // driven hard — the status detector alone clicks every safe trigger it can find, which on a modal page
  // means the dialog is ALREADY OPEN. Enumerating against that state made the precondition below answer
  // "no hidden region on this page" and the whole pass returned null, silently: verified by a direct probe
  // that found the trap on a clean load and nothing at all through the lane.
  await page.goto(url, { waitUntil: 'load', timeout: opts.gotoTimeoutMs || 20000 }).catch(() => {});
  await require('./settle.js').awaitSettle(page).catch(() => {});
  // PRECONDITION — and the reason ranked-3 openers are allowed at all. Run this pass ONLY on a page that
  // demonstrably HAS something to reveal: a trap-region-shaped container (dialog/menu/listbox/modal) that
  // is hidden right now and holds two or more focusables. No hidden dialog ⇒ no reveal pass, no clicks.
  // Names alone were too narrow a gate — the corpus's openers say "Subscribe — first month free" and
  // "Verify your identity", neither of which any verb list would predict — while "is there a closed
  // dialog on this page" is a fact rather than a guess.
  const hasHiddenRegion = await page.evaluate((regSel, focSel) => {
    for (const reg of document.querySelectorAll(regSel)) {
      const hidden = reg.offsetParent === null || reg.hidden || getComputedStyle(reg).visibility === 'hidden'
        || (reg.tagName === 'DIALOG' && !reg.hasAttribute('open'));
      if (!hidden) continue;
      if (reg.querySelectorAll(focSel).length >= 2) return true;
    }
    return false;
  }, TRAP_REGION_SEL, FOCUSABLE_SEL).catch(() => false);
  if (!hasHiddenRegion) return null;
  const openers = await findRevealOpeners(page, maxOpeners);
  for (const op of openers) {
    try {
      await page.goto(url, { waitUntil: 'load', timeout: opts.gotoTimeoutMs || 20000 });
      await require('./settle.js').awaitSettle(page);
      const clicked = await page.evaluate((xp) => {
        const el = document.evaluate(xp, document, null, 9, null).singleNodeValue;
        if (!el) return false; el.click(); return true;
      }, op.xpath).catch(() => false);
      if (!clicked) continue;
      await page.evaluate(() => new Promise((r) => setTimeout(r, 250))).catch(() => {});
      const traps = await detectKeyboardTraps(page, opts).catch(() => null);
      if (traps && Array.isArray(traps.traps) && traps.traps.length) return { opener: op, traps };
      const self = await detectFocusRetentionTraps(page, opts).catch(() => null);
      if (self && Array.isArray(self.traps) && self.traps.length) return { opener: op, selfTraps: self };
    } catch (e) { /* this opener did not work out — try the next */ }
  }
  return null;
}


// ── EMBEDDED-FORMAT traps (WCAG 2.1.2 / F10, residual RCA S7) ─────────────────────────────────────
// F10: "combining multiple content formats in a way that traps users inside one format type". The
// region detectors above cannot see this at all, for a structural reason: they enumerate candidate
// regions from focusable elements in THIS document, and the trapping content lives in another one —
// an <iframe>, an <object>/<embed> plugin document, or a shadow root. None of their focusables is in
// `document.querySelectorAll`, so no region is ever nominated.
//
// But the failure has ONE observable that needs no per-frame execution context, and it is the same
// for all three: when focus is inside embedded content, the HOST document's `document.activeElement`
// is the BOUNDARY ELEMENT itself — the <iframe>, the <object>, the shadow host. So: put focus into
// the boundary, press Tab, and watch whether activeElement ever moves OFF it. If it never does
// within a budget that exceeds the embedded content's own focusable count, the embedded format is
// holding the user.
//
// Budget matters: a payment iframe with ten fields legitimately needs ten-plus tabs to walk through
// before it hands focus back. Where the embedded document is same-origin we COUNT its focusables and
// size the budget from that; where it is cross-origin (contentDocument null) we fall back to a fixed
// budget and mark the result `review`, because we cannot distinguish "trapped" from "longer than we
// waited" without being able to see inside.
//
// ACT a1b64e applies unchanged: escape in ONE direction is enough, so a boundary that holds Tab but
// releases Shift+Tab is DIRECTIONAL and emits as review, never as a barrier.
const EMBED_SEL = 'iframe,object,embed,frame';

async function detectEmbeddedFormatTraps(page, opts = {}) {
  const margin = Number.isFinite(opts.escapeMargin) ? opts.escapeMargin : LIMITS.instruments.escapeBudgetMargin;
  const boundaries = await page.evaluate((embedSel, focSel) => {
    const getXPath = (e) => {
      if (!e || !e.tagName) return '';
      if (e === document.body) return '/html/body';
      const t = e.tagName.toLowerCase();
      let i = 1; for (let s = e.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === e.tagName) i++;
      return getXPath(e.parentElement) + '/' + t + '[' + i + ']';
    };
    const visible = (e) => {
      const cs = getComputedStyle(e); const r = e.getBoundingClientRect();
      return cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 1 && r.height > 1;
    };
    const out = [];
    let n = 0;
    // (a) EMBEDDED DOCUMENTS — iframe / object / embed / frame.
    for (const el of document.querySelectorAll(embedSel)) {
      if (!visible(el)) continue;
      const ti = el.getAttribute('tabindex');
      if (ti !== null && +ti < 0) continue;                 // deliberately out of the tab order — nothing to enter
      // In-page counting works only same-origin; the CDP pass below re-counts through the frame API,
      // which is not bound by the same-origin policy. Kept as the cheap path and as the origin signal.
      let inner = null, sameOrigin = false;
      try { const d = el.contentDocument; if (d) { sameOrigin = true; inner = d.querySelectorAll(focSel).length; } } catch (e) { /* cross-origin */ }
      const id = 'emb' + (n++);
      el.setAttribute('data-v3-embed', id);
      out.push({ id, xpath: getXPath(el), kind: el.tagName.toLowerCase(), innerFocusables: inner, sameOrigin });
    }
    // (b) SHADOW ROOTS — the host is what the outer document sees focus on.
    const walk = (root) => {
      for (const el of root.querySelectorAll('*')) {
        if (!el.shadowRoot) continue;
        if (!visible(el)) continue;
        const inner = el.shadowRoot.querySelectorAll(focSel).length;
        if (inner < 1) continue;                            // nothing focusable inside ⇒ cannot trap
        const id = 'emb' + (n++);
        el.setAttribute('data-v3-embed', id);
        out.push({ id, xpath: getXPath(el), kind: 'shadow-root', innerFocusables: inner, sameOrigin: true });
      }
    };
    walk(document);
    return out;
  }, EMBED_SEL, FOCUSABLE_SEL).catch(() => []);

  // CROSS-ORIGIN FOCUSABLE COUNT. `contentDocument` is null for a cross-origin embed, so the in-page pass
  // above cannot size the escape budget and the result had to degrade to `review` — "trapped" and "slower
  // than we waited" are the same observation when you cannot see inside. But the HARNESS is not the page:
  // it drives CDP, which is not subject to the same-origin policy, and Puppeteer exposes every child frame
  // (out-of-process ones included) via `elementHandle.contentFrame()`. So re-count through the frame API and
  // treat a successful count as first-class evidence, exactly as the P5 listener fix re-resolves an in-frame
  // node in its OWN execution context rather than the top frame's.
  for (const b of boundaries) {
    if (Number.isFinite(b.innerFocusables)) continue;                  // same-origin count already in hand
    if (b.kind === 'shadow-root') continue;                            // no frame — the in-page count is exact
    let handle = null;
    try {
      handle = await page.$(`[data-v3-embed="${b.id}"]`);
      if (!handle) continue;
      const frame = await handle.contentFrame();
      if (!frame) continue;
      const n = await frame.evaluate((sel) => document.querySelectorAll(sel).length, FOCUSABLE_SEL);
      if (Number.isFinite(n)) { b.innerFocusables = n; b.countedViaCdp = true; b.sameOrigin = true; }
    } catch (e) { /* frame detached or genuinely unreachable — stays review */ }
    // An ElementHandle pins a JSHandle in the browser until disposed. Leaking one per embed per page
    // across a few hundred pages is exactly the kind of slow browser-side growth that ends in a dead
    // renderer, so release it on every path.
    finally { if (handle) { try { await handle.dispose(); } catch (e) {} } }
  }

  const atBoundary = (id) => page.evaluate((bid) => {
    const el = document.querySelector(`[data-v3-embed="${bid}"]`);
    const a = document.activeElement;
    return !!(el && a && (a === el || el.contains(a)));
  }, id);

  // Put focus INTO the boundary — and for an embedded DOCUMENT that means TABBING in, not calling
  // `.focus()` on the host. Measured: focusing an <object> host puts focus on the host element, so the
  // next Tab leaves for the element AFTER it and the probe concludes "escaped"; walking in with Tab
  // instead lands focus on the first station INSIDE the embedded document, which is where the user
  // actually ends up and where the trap actually is. A shadow root is different — `document.activeElement`
  // retargets to the host, so focusing the first focusable inside the root is both correct and cheaper.
  const enterShadow = (id) => page.evaluate((bid) => {
    const el = document.querySelector(`[data-v3-embed="${bid}"]`);
    if (!el || !el.shadowRoot) return false;
    const f = el.shadowRoot.querySelector('a[href],button,input:not([type=hidden]),select,textarea,[tabindex],[contenteditable=true]');
    if (f && f.focus) { f.focus(); return true; }
    return false;
  }, id);
  const ENTER_STEPS = 40;
  const enterByTab = async (id) => {
    await page.evaluate(() => { const a = document.activeElement; if (a && a.blur) a.blur(); }).catch(() => {});
    for (let i = 0; i < ENTER_STEPS; i++) {
      await page.keyboard.press('Tab');
      await page.evaluate(() => new Promise((r) => setTimeout(r, 25))).catch(() => {});
      if (await atBoundary(id)) return true;
    }
    return false;
  };
  const enter = async (b) => (b.kind === 'shadow-root' ? enterShadow(b.id) : enterByTab(b.id));

  const walkOut = async (b, backward) => {
    if (!(await enter(b))) return { escaped: null };
    if (!(await atBoundary(b.id))) return { escaped: null };   // focus refused to enter — nothing to test
    const budget = (Number.isFinite(b.innerFocusables) ? b.innerFocusables : 8) + margin;
    for (let i = 0; i < budget; i++) {
      if (backward) { await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift'); }
      else { await page.keyboard.press('Tab'); }
      await page.evaluate(() => new Promise((r) => setTimeout(r, 25))).catch(() => {});
      if (!(await atBoundary(b.id))) return { escaped: true };
    }
    return { escaped: false };
  };

  const traps = [];
  const directional = [];
  for (const b of boundaries) {
    const fwd = await walkOut(b, false).catch(() => ({ escaped: null }));
    if (fwd.escaped !== false) continue;                       // escaped forward, or could not be tested
    const bwd = await walkOut(b, true).catch(() => ({ escaped: null }));
    const row = { sc: '2.1.2', xpath: b.xpath, kind: b.kind, innerFocusables: b.innerFocusables, sameOrigin: b.sameOrigin };
    if (bwd.escaped === true) { directional.push(row); continue; }   // ACT a1b64e: one direction is enough
    // ESCAPE. A text editor that swallows Tab (inserting a tab character is what an editor is FOR) but
    // releases focus on Escape is an a1b64e PASS, not a trap — the standard exit works. The region
    // detector already probes this; omitting it here made a documented-Escape editor read as trapped,
    // which was measured directly against a GT-pass page.
    let escEscapes = false;
    if (await enter(b)) {
      await page.keyboard.press('Escape');
      await page.evaluate(() => new Promise((r) => setTimeout(r, 60))).catch(() => {});
      escEscapes = !(await atBoundary(b.id));
    }
    if (escEscapes) continue;
    traps.push(row);
  }
  return { traps, directional, boundaries: boundaries.length };
}

module.exports = { collectTabOrder, tabOrderFindings, detectKeyboardTraps, detectFocusRetentionTraps, detectFixedSetConfinementTraps, detectFocusRejection, detectFocusRestsInAriaHidden, findRevealOpeners, detectTrapsAfterReveal, detectEmbeddedFormatTraps, REACH_SAFETY_CAP, REFOCUS_SETTLE_MS, TRAP_REGION_SEL, FOCUSABLE_SEL, OPENER_VERB_RE };
