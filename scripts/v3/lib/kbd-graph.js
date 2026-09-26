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
// SEGMENTED (composite) inputs — <input type=time|date|datetime-local|month|week> — are ONE element wrapping
// several internal segments (hour/minute, day/month/year): Tab moves BETWEEN the segments while
// document.activeElement stays the same <input>. Bound on how many consecutive Tab presses the ring-walk will
// spend inside one such element before giving up. Chrome renders SEVEN segments for datetime-local with
// step=1 (mm/dd/yyyy hh:mm:ss AM/PM — adversarial soundness finding #2, probe-confirmed), so the bound is 10;
// and exhausting it is recorded as `exhausted`, NEVER as a wrap — a cap hit means the recording is
// incomplete, and calling it a completed ring is exactly the degenerate one-stop artifact this guard exists
// to prevent.
const SEGMENTED_PRESS_CAP = 10;
// #26b (batch-3 RCA): ZERO-FOCUSABLE EARLY EXIT. On a page with no focusable element every Tab press
// reads the document-boundary sentinel, and the wrap logic (which requires sawNode first) never fires —
// so the walk burned the FULL safety cap in no-op presses: measured 67.6 s per page (2000 presses x two
// directions) on zero-focusable pages, chronically capping out the 90 s instrument lane. Before the first
// real stop is seen, N consecutive boundary sentinels are proof the ring is EMPTY (a single press from
// the boundary always lands on the first focusable when one exists), so the walk ends there with the
// byte-identical result the full-cap walk produced ({ order: [], wrapped: false, exhausted: false }).
// N=5, not 2: generous slack for a settle hiccup or a focus-rejecting first element, at a cost of ~100 ms.
const EMPTY_RING_SENTINEL_CAP = 5;

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
  //
  // VISIBILITY GATE (2026-08-16). The selector alone matched markup that is NOT open. The commonest shape
  // for a scripted dialog is to ship its markup at rest inside a `display:none` scrim and toggle a class,
  // and `[aria-modal="true"]` sits on the dialog INSIDE that scrim — so a page with no dialog showing
  // stamped `modalOpen: true` on EVERY stop while `insideOpenModal` was false for all of them (the dialog's
  // own contents are unreachable at rest). The 2.4.3 rubric's containment clause is fact-gated on exactly
  // that pair, so it fired deterministically on pages with nothing open: a manufactured barrier, measured
  // as the whole of this SC's false-positive set. The comment above is still right that a purely VISUAL
  // scrim declares nothing programmatically; the converse — a programmatic declaration inside a HIDDEN
  // container — is not an open modal either. Same predicate findRevealOpeners uses for a visible control.
  const modalShowing = (el) => {
    if (!el) return false;
    if (el.closest && el.closest('[aria-hidden="true"]')) return false;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return false;
    if (!(el.offsetParent !== null || cs.position === 'fixed')) return false;
    const br = el.getBoundingClientRect();
    return br.width >= 1 && br.height >= 1;
  };
  let openModal = null;
  for (const m of document.querySelectorAll('dialog[open], [aria-modal="true"]')) { if (modalShowing(m)) { openModal = m; break; } }
  let ownModal = a.closest ? a.closest('dialog[open], [aria-modal="true"]') : null;
  if (ownModal && !modalShowing(ownModal)) ownModal = null;
  // #25 (batch-3 RCA): PER-STOP OCCLUSION fact. A page can overlay content withOUT declaring a dialog —
  // a plain fixed-position scrim div carries no dialog[open]/aria-modal, so the containment facts above
  // never exist, while the underlying stops stay fully tabbable and focus visits elements the user cannot
  // see (measured shape: the page force-focuses INTO the visible overlay at load and every underlying
  // stop hit-tests to the scrim). Whether that occlusion breaks 2.4.3 meaning is the judge's call, so —
  // exactly like the modal facts above — record the FACT per stop: the topmost element at the stop's own
  // viewport centre, when that element is OUTSIDE the stop's subtree (neither ancestor nor descendant).
  // null = not occluded OR unmeasurable (centre off-viewport) — fail-open, never a manufactured claim.
  //
  // SOUNDNESS FIX F10 (batch-3 adversarial review round 2): a bare centre-point hit-test cannot tell a
  // scrim from a STICKY HEADER — a routine, non-modal pattern that occludes whatever scrolls under it and
  // fires this exact same `occludedBy` shape on every ordinary page that has one. The rubric downstream
  // used to treat ANY occluder as if it declared a modal overlay; that is unsound (measured: sticky
  // headers/cookie bars fired it routinely). The fix is not to STOP recording the fact — it is to record
  // enough about the OCCLUDER for the rubric to tell a scrim from a header: its `position` (a scrim is
  // fixed/absolute; a normal in-flow element that merely happens to be tall enough to reach the point is
  // not occluding by DESIGN) and how much of the VIEWPORT it actually covers (a scrim dominates the
  // screen; a header is a thin strip). Both ride ALONGSIDE `occludedBy` — the xpath contract for existing
  // consumers is untouched (still a bare string-or-null) — and are present only when `occludedBy` is.
  let occludedBy = null, occluderPosition = null, occluderRect = null, occluderViewportCoverage = null;
  try {
    const cxv = r.left + r.width / 2, cyv = r.top + r.height / 2;
    if (cxv >= 0 && cyv >= 0 && cxv < window.innerWidth && cyv < window.innerHeight) {
      const top = document.elementFromPoint(cxv, cyv);
      if (top && top !== a && !a.contains(top) && !top.contains(a)) {
        occludedBy = getXPath(top);
        const tcs = getComputedStyle(top);
        occluderPosition = tcs.position || null;
        const tr = top.getBoundingClientRect();
        occluderRect = { x: Math.round(tr.left + window.scrollX), y: Math.round(tr.top + window.scrollY), w: Math.round(tr.width), h: Math.round(tr.height) };
        // fraction of the VIEWPORT the occluder's own box actually covers, clamped to the viewport (a
        // fixed element can extend off-screen) — a full-bleed scrim reads near 1.0; a header pinned to one
        // edge reads small even when it spans the full width, because it is short.
        const ix = Math.max(0, Math.min(tr.right, window.innerWidth) - Math.max(tr.left, 0));
        const iy = Math.max(0, Math.min(tr.bottom, window.innerHeight) - Math.max(tr.top, 0));
        const vpArea = window.innerWidth * window.innerHeight;
        occluderViewportCoverage = vpArea > 0 ? Math.round(((ix * iy) / vpArea) * 1000) / 1000 : null;
      }
    }
  } catch (e) { /* hit-test unavailable — no claim */ }
  return { sentinel: false, seen, xpath: getXPath(a), tag: a.tagName.toLowerCase(),
    rect: { x: Math.round(pinned ? r.left : r.left + window.scrollX), y: Math.round(pinned ? r.top : r.top + window.scrollY), w: Math.round(r.width), h: Math.round(r.height) },
    label,
    // ROLE + explicit tabindex (2.4.3 redundant-stop pre-computation, redundantStopFacts below). A stop's
    // TAG alone cannot distinguish a real widget from a generic container that merely carries tabindex.
    role: (a.getAttribute && a.getAttribute('role')) || null,
    tabindexAttr: (a.getAttribute && a.getAttribute('tabindex')) || null,
    // SEGMENTED composite input (time/date/…): Tab traverses INTERNAL segments while activeElement stays this
    // same element, so a revisit read here is not necessarily a ring wrap — the walk loop needs to know.
    segmented: a.tagName === 'INPUT' && /^(time|date|datetime-local|month|week)$/.test(a.type || ''),
    modalOpen: !!openModal,
    insideOpenModal: !!ownModal,
    modalXpath: ownModal ? getXPath(ownModal) : null,
    occludedBy, occluderPosition, occluderRect, occluderViewportCoverage };
}

// Node-side (not evaluated in-page): the compact conditional-spread shape every stop-building call site
// below uses to thread the F10 occlusion facts — `occludedBy` stays a bare xpath string for every existing
// consumer, and the new position/rect/coverage facts ride ALONGSIDE it, present only when it is (a ring
// with nothing occluded stays byte-identical, same contract `occludedBy` alone already had).
const occlusionSpread = (o) => (o && o.occludedBy ? {
  occludedBy: o.occludedBy,
  occluderPosition: o.occluderPosition || null,
  occluderRect: o.occluderRect || null,
  occluderViewportCoverage: Number.isFinite(o.occluderViewportCoverage) ? o.occluderViewportCoverage : null,
} : {});

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
  // COLLECTOR LIVENESS for the two probeActive evaluates. Both are `.catch()`-guarded, and the fallback they
  // return is `{ sentinel: true }` — which the ring logic reads as a legitimate DOCUMENT-BOUNDARY crossing,
  // not as a failure. So a dead probeActive does not degrade to "this page has no tab stops"; it fabricates
  // a plausible boundary, and the rotation logic then anchors the ring on it. The recorded order that every
  // 2.4.3 judgment rests on would be silently wrong while looking entirely normal. (Two collectors have
  // already shipped dead in this campaign from exactly this shape of guard, both with a green test suite.)
  //
  // Same contract as act-page-collect's `liveEval`: the fallback VALUE is unchanged, so a genuinely broken
  // page degrades exactly as it does today — the throw merely becomes OBSERVABLE. `err: true` on the
  // in-loop fallback was already there and was read by nothing; it now has a consumer.
  const liveness = [];
  const note = (where, e) => liveness.push({ collector: 'probeActive@' + where, error: String((e && e.message) || e).replace(/\s+/g, ' ').slice(0, 300) });
  // Whatever the page itself focused on load IS the user's first stop, and the walk (which records the
  // element AFTER each Tab) can never see it otherwise — seed it. probeActive also enrols it in the
  // cycle-detection WeakSet, so returning to it still ends the ring.
  const entry = await page.evaluate(probeActive).catch((e) => { note('entry', e); return { sentinel: true }; });
  const order = [];
  let wrapped = false, exhausted = false, sawNode = false, sentinelStreak = 0, emptySentinelStreak = 0;
  let boundaryAt = -1;   // index in `order` after which the document boundary was crossed
  // COMPOSITE-INPUT WRAP GUARD (2026-08-16). A segmented control (<input type=time|date|…>) consumes Tab for
  // its INTERNAL segments while document.activeElement stays the same element, so the plain revisit test
  // (`info.seen ⇒ wrapped`) fired on the SECOND press and recorded a one-stop "ring" for a page whose real
  // ring had dozens of stops — and everything downstream (2.4.3 order findings, the __focusOrder evidence the
  // focus-order rubric leans on) then reasoned from that degenerate artifact as if it were the page. A repeat
  // of the SAME segmented element is therefore NOT judged a wrap: keep pressing Tab (bounded by
  // SEGMENTED_PRESS_CAP per element) until focus moves on; only a repeat that is NOT a same-element segmented
  // continuation — or a segmented element that exhausts the per-element cap — is a wrap. Every non-segmented
  // element keeps the exact pre-existing behavior (immediate wrap on revisit).
  let lastXpath = entry.sentinel ? null : entry.xpath;
  let segPresses = 0;
  if (!entry.sentinel) {
    // #25: the seeded stop IS the page-set initial focus — surface that (the walk can never re-derive it),
    // plus the occlusion fact. Both fields appear only when they say something, so every other ring stays
    // byte-identical.
    order.push({ index: 0, xpath: entry.xpath, tag: entry.tag, rect: entry.rect, label: entry.label, role: entry.role || null, tabindexAttr: entry.tabindexAttr || null, modalOpen: entry.modalOpen, insideOpenModal: entry.insideOpenModal, modalXpath: entry.modalXpath, initialFocus: true, ...occlusionSpread(entry) });
    sawNode = true;
  }
  for (let i = 0; i < cap; i++) {
    if (backward) { await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift'); }
    else { await page.keyboard.press('Tab'); }
    if (process.env.V3_SETTLE_KBD !== '0') await require('./settle.js').awaitFocusSettle(page); // DEFAULT-ON (opt out V3_SETTLE_KBD=0); settle the FOCUSED element before reading activeElement — see settle.js
    const info = await page.evaluate(probeActive).catch((e) => { note('walk', e); return { sentinel: true, err: true }; });
    // A SINGLE body/sentinel mid-ring is normal — positive tabindex routes focus through the document
    // boundary after the highest tabindex, so only TWO consecutive sentinels (or a WeakSet revisit) is a
    // true wrap (audit: positive-tabindex order was truncated to 1 element by treating the 1st sentinel
    // as a wrap). Cycle detection is driven by info.seen; the sentinel only ends a fully-walked ring.
    if (info.sentinel) {
      if (sawNode) {
        if (boundaryAt < 0) boundaryAt = order.length - 1;  // the cycle restarts after this stop
        if (++sentinelStreak >= 2) { wrapped = true; break; }
      } else if (++emptySentinelStreak >= EMPTY_RING_SENTINEL_CAP) {
        break; // #26b: N consecutive boundary reads before ANY stop ⇒ the ring is empty — stop pressing
      }
      continue;
    }
    sentinelStreak = 0;
    if (info.seen) {                                                               // revisited ⇒ ring complete…
      // …UNLESS this is the SAME segmented element still consuming Tab for an internal segment (see the
      // guard note above). Not a new stop and not a wrap — press again, bounded per element. Cap
      // exhaustion is an INCOMPLETE recording (`exhausted`), never a completed ring.
      if (info.segmented && info.xpath === lastXpath) {
        if (segPresses < SEGMENTED_PRESS_CAP) { segPresses++; continue; }
        exhausted = true; break;
      }
      wrapped = true; break;
    }
    segPresses = 0;
    lastXpath = info.xpath;
    sawNode = true;
    order.push({ index: order.length, xpath: info.xpath, tag: info.tag, rect: info.rect, label: info.label, role: info.role || null, tabindexAttr: info.tabindexAttr || null, modalOpen: info.modalOpen, insideOpenModal: info.insideOpenModal, modalXpath: info.modalXpath, ...occlusionSpread(info) });
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
  // `liveness` is EMPTY on every healthy page (the common case), so it costs nothing to carry and its mere
  // presence in an artifact is the signal. A repeated 'probeActive@walk' entry means the recorded sequence
  // is short by that many stops AND may be anchored on a fabricated boundary — read it before the order.
  // #25: the page-set initial-focus STOP RECORD, surfaced at the top level too — after rotation its
  // position in `order` moves, and a consumer that trims the ring would lose the per-stop flag. Shape is
  // the CONTRACT with the rubric lane (impl-rubrics batch-3): `focusOrder.initialFocus` = the stop the
  // PAGE focused at load (before any Tab), or null when load left focus at the document boundary.
  const initialFocus = entry.sentinel ? null
    : { xpath: entry.xpath, tag: entry.tag, label: entry.label, rect: entry.rect, ...occlusionSpread(entry) };
  return { order, wrapped, exhausted, count: order.length, backward, startAnchored, boundaryAt, initialFocus, liveness };
}

// Tab-order check (2.4.3): the forward focus order vs the visual order.
function tabOrderFindings(tab, opts = {}) {
  const items = (tab.order || []).map((s) => ({ xpath: s.xpath, rect: s.rect, label: s.label }));
  const r = visualOrderDivergence(items, { sc: '2.4.3', kind: 'tab-order', rowBand: opts.rowBand });
  return { findings: r.findings, comparable: r.comparable };
}

// ── REDUNDANT / MEANINGLESS TAB STOP pre-computation (2.4.3) ────────────────────────────────────────
// 2.4.3 is not only about the ORDER of the stops: the Understanding's own failure example is a stop that
// should not exist at all — "a control appearing to receive focus multiple times due to the use of nested
// focusable elements. <div tabindex="0"><button>...</button></div>". A page with that shape records a
// sequence in perfect visual order, so an order-only reading of the ring answers "this preserves meaning"
// — correctly, on the question it was asked — and the defect is invisible.
//
// Both signatures are decidable from the ring we already collected, with no extra driving:
//  (a) WRAPPER-THEN-CHILD. Two CONSECUTIVE stops where the first element is a DOM ANCESTOR of the second.
//      The recorded xpaths make this exact (an ancestor's xpath is a path prefix of its descendant's), and
//      it is precisely the Understanding's example. Corroborating geometry/naming — the wrapper's rect
//      encloses the child's, and their accessible names are equal or the wrapper's contains the child's —
//      rides along so the judge can see it is the SAME control reached twice rather than a group followed
//      by its first member.
//  (b) GENERIC-CONTAINER STOP. A stop whose element is a layout container (div/span/p/section/li/td/…)
//      that is in the ring only because it carries an explicit non-negative `tabindex`, and that declares
//      no interactive role. Focusable static content is EXPLICITLY permitted by the Understanding, so this
//      is deliberately reported as a FACT and never as a verdict — a scroll region, a labelled group that
//      owns its own controls, and a live-region container are all legitimate. What makes it a barrier is
//      whether the stop interrupts a sequence the user is working through, which is the judge's call.
// Both are pure functions of the ring: no page access, no extra Tab presses, no extra wall-clock.
const GENERIC_TAGS = new Set(['div', 'span', 'p', 'section', 'article', 'li', 'td', 'th', 'label', 'figure', 'header', 'footer', 'main', 'aside', 'nav', 'ul', 'ol', 'dl', 'dd', 'dt', 'blockquote', 'pre', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6']);
// roles that make a generic element a REAL widget/landmark the user is meant to reach — never "meaningless"
const INTERACTIVE_ROLES = /^(button|link|checkbox|radio|switch|tab|menuitem|menuitemcheckbox|menuitemradio|option|combobox|listbox|slider|spinbutton|textbox|searchbox|treeitem|gridcell|columnheader|rowheader|scrollbar|separator|application|toolbar|tablist|menu|menubar|tree|grid|table|radiogroup|group|region|dialog|alertdialog|navigation|banner|main|contentinfo|complementary|form|search|article|list|listitem|figure|img|document|feed|log|status|marquee|timer|tooltip|progressbar|meter|tabpanel|treegrid|row|rowgroup)$/i;
// A DATA-ENTRY stop: something the user types/chooses into, as opposed to a link or a command button.
const FIELD_TAGS = new Set(['input', 'select', 'textarea']);
const FIELD_ROLES = /^(textbox|searchbox|combobox|spinbutton|slider|listbox|checkbox|radio|switch)$/i;
const norm = (s) => String(s == null ? '' : s).toLowerCase().replace(/\s+/g, ' ').trim();
const isFieldStop = (s) => !!s && (FIELD_TAGS.has(String(s.tag || '').toLowerCase()) || (s.role && FIELD_ROLES.test(s.role)));
// The tag of the deepest ancestor COMMON to a set of stops, read straight off their xpaths (an xpath is a
// path, so the shared prefix IS the common ancestor). Used only to ask "are these stops in one field group".
const commonAncestorTag = (xpaths) => {
  const parts = xpaths.map((x) => String(x || '').split('/').filter(Boolean));
  if (parts.some((p) => !p.length)) return null;
  const lim = Math.min(...parts.map((p) => p.length));
  let i = 0;
  for (; i < lim; i++) { const s = parts[0][i]; if (!parts.every((p) => p[i] === s)) break; }
  return i ? String(parts[0][i - 1]).replace(/\[\d+\]$/, '').toLowerCase() : null;
};

function redundantStopFacts(tab) {
  const order = (tab && Array.isArray(tab.order)) ? tab.order : [];
  const byXpath = {};
  const encloses = (a, b) => !!(a && b) && a.w * a.h >= b.w * b.h
    && a.x <= b.x + 1 && a.y <= b.y + 1 && a.x + a.w >= b.x + b.w - 1 && a.y + a.h >= b.y + b.h - 1;
  for (let i = 0; i < order.length; i++) {
    const cur = order[i];
    if (!cur || !cur.xpath) continue;
    const next = order[i + 1];
    // (a) the stop IMMEDIATELY BEFORE its own descendant
    if (next && next.xpath && next.xpath.startsWith(cur.xpath + '/')) {
      const a = norm(cur.label), b = norm(next.label);
      const f = byXpath[cur.xpath] || (byXpath[cur.xpath] = {});
      f.wrapsNextStop = true;
      f.rectEnclosesNextStop = encloses(cur.rect, next.rect);
      f.nameCoversNextStop = !!(a && b && (a === b || a.includes(b)));
    }
    // (b) a generic layout container in the ring only because of an explicit tabindex
    const ti = cur.tabindexAttr == null ? null : parseInt(cur.tabindexAttr, 10);
    if (GENERIC_TAGS.has(String(cur.tag || '').toLowerCase()) && Number.isFinite(ti) && ti >= 0
        && !(cur.role && INTERACTIVE_ROLES.test(cur.role))) {
      const f = byXpath[cur.xpath] || (byXpath[cur.xpath] = {});
      f.genericContainerStop = true;
      // …and WHERE it sits, which is the whole difference between tedious and confusing. Probed directly:
      // the bare flag also fires on a static stop that OPENS a group of links and on one that TRAILS a
      // completed form, neither of which impedes anything — reporting it unqualified would trade a catch
      // for two false alarms. The Understanding's concern is a stop that makes the sequence CONFUSING, and
      // the sharp version of that is a non-operable stop wedged between two data-entry fields OF THE SAME
      // field group: the user is part-way through filling one thing in and focus lands on nothing.
      const prev = order[i - 1];
      f.interruptsCoupledSequence = !!(isFieldStop(prev) && isFieldStop(next)
        && ['form', 'fieldset'].includes(commonAncestorTag([prev.xpath, cur.xpath, next.xpath])));
    }
  }
  return byXpath;
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

// =====================================================================================
// SHARED 2.1.2 ADVISORY GRAMMAR — parsed in Node, never re-derived per lane.
// =====================================================================================
// WCAG 2.1.2 permits a NON-STANDARD keyboard exit when the user is ADVISED of it. Two lanes ask that
// question — this instrument (`tryAdvised`) and the `keyboard-trap-escape` experiment runner — and they had
// drifted into two different hand-written grammars, both too narrow, in the same way the close-control
// escape had drifted before it. So the grammar lives HERE, once, as a PURE function over already-extracted
// text: each lane decides its own scope (whole page vs the trapping region) and its own focus model, but
// they read the same sentence the same way.
//
// Three defects the old patterns shared, all measured on real advisory prose:
//   1. VERB SET. Both required the advisory to say "to leave/exit/close/escape/dismiss". Authors write the
//      thing the key DOES — "to move focus back out to the rest of the page", "to return focus to the page".
//      Neither parsed, so a documented exit read as no exit at all.
//   2. WORD ORDER. The runner's pattern accepted only "press X to VERB"; prose overwhelmingly leads with the
//      goal ("To VERB …, press X"). The instrument already handled both — the runner did not.
//   4. GAP BOUND. The instrument's verb-first form allowed ten words between the goal and "press". Advisories
//      that name the destination as well as the region ("To move focus back out to the rest of the page using
//      only the keyboard, press Ctrl+M") run longer than that. The bound exists only to stop the two halves
//      being stitched across sentences, and the token class already forbids crossing `.`/`!`/`?`, so it is
//      widened to sixteen rather than removed.
//   3. KEY SHAPE. Both matched a SINGLE alphanumeric character, so no modifier chord (Ctrl+M, Alt+0) and no
//      function key could ever be named. The instrument's own documentation example — "press Alt+F6 to exit"
//      — did not parse under the instrument's own grammar: `F6` fails a one-char match.
//
// Deliberately still conservative: an explicit "press", a bounded word gap in the verb-first form so the two
// halves cannot be stitched across sentences, and a key that is a single character, a function key, or a
// named editing key — never a bare word.
const ADVISORY_MODS = '(?:ctrl|control|alt|option|shift|cmd|command|meta)';
// The verb set is WIDER than an exit vocabulary because the advisory names the EFFECT, not the SC. That is
// safe only because a parsed advisory no longer EXCUSES a confinement on its own — both lanes now PRESS the
// named key and require focus to actually leave (see `pressAdvised`). An over-match therefore costs one
// keystroke and can only clear when the key genuinely frees focus, which IS the criterion's test.
const ADVISORY_VERB = '(?:leave|exit|close|escape|dismiss|continue|return|go|move|get|jump|step|skip|bypass|advance)';
const ADVISORY_KEY = '["\']?(F(?:1[0-2]|[1-9])|Esc(?:ape)?|Enter|Spacebar|Space|Tab|[A-Za-z0-9])["\']?(?![A-Za-z0-9])';
const ADVISORY_COMBO = '((?:' + ADVISORY_MODS + '\\s*\\+\\s*)*)';
// The advertised key and the purpose clause are not always adjacent: authors write "press Ctrl+M AT ANY TIME
// to skip past the panel". The old pattern allowed only an optional literal "key" between them, so that
// sentence did not parse — and an unparsed advisory ASSERTS a trap, which made a page with a genuinely bound
// and genuinely working exit read as a keyboard trap (measured: 2.1.2 multi-element-region-loop case-06,
// surfaced once region identification was repaired and stopped clearing every such page trivially).
// Bounded and lazy, and `[^\s.!?]` keeps it inside one sentence — the same guard the verb-first pattern uses,
// for the same reason: an advisory stitched across a full stop is not an advisory.
const ADVISORY_GAP = '(?:\\s+[^\\s.!?]+){0,4}?\\s+';
// A presence test, kept separate from the key parse AND deliberately NARROWER than it: text that clearly
// ADVISES an exit but whose key we cannot extract is INCONCLUSIVE, not "no advice" (audit V3R2-H4) — the
// caller must not assert a trap on it. That suppression is the one place a loose match costs a MISSED trap
// rather than a keystroke, so this side keeps an unambiguous exit vocabulary while `ADVISORY_VERB` above
// stays wide: "To move the slider, press the arrow keys" is an interaction instruction, not an exit advisory,
// and must not silence a real confinement.
const ADVISORY_HINT_RE = /\bto\s+(?:leave|exit|escape|dismiss|close|get\s+out|skip\s+(?:past|over|ahead)|bypass|(?:move|return|take|send|put)\s+(?:the\s+)?focus)\b/i;

// Chords the USER AGENT owns. The page may name one, but the browser intercepts it before the document sees
// it, so it cannot move focus in practice — WCAG's exception asks for a method that WORKS. We must not press
// these (Ctrl+W closes the tab out from under the probe) and we must not treat them as a working exit.
const ADVISORY_RESERVED = new Set(['ctrl+w', 'meta+w', 'ctrl+t', 'meta+t', 'ctrl+n', 'meta+n', 'ctrl+q', 'meta+q', 'alt+f4', 'ctrl+shift+q']);

// Parse an exit advisory out of already-extracted text.
//   → null                                  no advisory phrasing at all
//   → { advised:true, key:null }            advice is present but no key could be extracted ⇒ INCONCLUSIVE
//   → { advised:true, key, mods, reserved } a testable keystroke (reserved ⇒ known-unusable, do not press)
function parseAdvisory(text) {
  const t = String(text || '');
  if (!t) return null;
  const hinted = ADVISORY_HINT_RE.test(t);
  let m = t.match(new RegExp('press\\s+(?:the\\s+)?' + ADVISORY_COMBO + ADVISORY_KEY + ADVISORY_GAP + 'to\\s+' + ADVISORY_VERB, 'i'));
  if (!m) m = t.match(new RegExp('to\\s+' + ADVISORY_VERB + '(?:\\s+[^\\s.!?]+){0,16}?[,:]?\\s+press(?:ing)?\\s+(?:the\\s+)?' + ADVISORY_COMBO + ADVISORY_KEY, 'i'));
  if (!m) return hinted ? { advised: true, key: null, mods: [], reserved: false } : null;
  const mods = (m[1] || '').split('+').map((x) => x.trim().toLowerCase()).filter(Boolean);
  // "press a key to leave", "to leave, press a button" — the ARTICLE, not a keystroke. Without this the
  // parser extracts `a`, presses it, watches nothing happen, and reports a TESTED-AND-FAILED advisory, which
  // ASSERTS a trap. Vague advice must land on the untestable side instead, where it suppresses: that is the
  // conservative direction, and the asymmetry is the whole point of separating `advised` from `key`. The cost
  // is failing to verify a genuine unmodified "press A to leave", which then suppresses rather than asserts —
  // a missed trap, never a manufactured one. Only bare `a` is affected; any modifier makes it a real chord.
  if (!mods.length && /^a$/i.test(m[2])) return { advised: true, key: null, mods: [], reserved: false };
  const key = normalizeAdvisedKey(m[2]);
  const canon = mods.map((x) => ({ control: 'ctrl', option: 'alt', command: 'meta', cmd: 'meta' }[x] || x)).sort().concat(String(m[2]).toLowerCase()).join('+');
  return { advised: true, key, mods, reserved: ADVISORY_RESERVED.has(canon) };
}

// Written key name → the name Puppeteer's keyboard understands.
function normalizeAdvisedKey(raw) {
  const k = String(raw || '');
  if (/^f\d+$/i.test(k)) return 'F' + k.toUpperCase().slice(1);
  const named = { esc: 'Escape', escape: 'Escape', enter: 'Enter', space: 'Space', spacebar: 'Space', tab: 'Tab' };
  if (named[k.toLowerCase()]) return named[k.toLowerCase()];
  // Single characters are LOWERCASED — an advisory writes "Ctrl+M" for readability, but pressing the capital
  // sends a shifted keystroke, and a page listening for `e.key === 'm' && e.ctrlKey` would never see it. Any
  // genuine Shift is carried explicitly in `mods` and held around the press, so lowercasing the base key is
  // the faithful reading of the chord, not a loss of information. (This is what the pre-shared grammar did.)
  return k.length === 1 ? k.toLowerCase() : k;
}

// Press a parsed advisory chord, holding every named modifier in written order. Returns false without
// touching the keyboard for a user-agent-reserved chord or an unparsed key.
async function pressAdvised(page, advised) {
  if (!advised || !advised.key || advised.reserved) return false;
  const MOD = { ctrl: 'Control', control: 'Control', alt: 'Alt', option: 'Alt', shift: 'Shift', cmd: 'Meta', command: 'Meta', meta: 'Meta' };
  const mods = (advised.mods || []).map((k) => MOD[k]).filter(Boolean);
  for (const mod of mods) await page.keyboard.down(mod);
  try { await page.keyboard.press(advised.key); }
  finally { for (const mod of mods.slice().reverse()) await page.keyboard.up(mod); }
  return true;
}

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
// `attr` is parameterised (default = this module's own tag) so runKeyboardTrapEscape in exp-runners.js can
// reuse the LITERAL close-control probe below against its `data-v3-region` tag — a second hand-written copy
// is exactly how the two 2.1.2 lanes drifted apart in the first place — without clobbering a tag this
// module may already have written on the same element.
async function regionEscaped(page, regId, attr = 'data-v3-trapreg') {
  return page.evaluate((id, a2) => {
    const reg = document.querySelector(`[${a2}="${id}"]`);
    const a = document.activeElement;
    // A `<dialog>` whose `open` attribute is gone is dismissed even if author CSS still paints it: the UA
    // sheet's display:none is easy to override (`dialog[open]{display:flex}` leaves a stale rule behind on
    // some sheets), and a dismissed dialog is the single most common way a keyboard user leaves a region.
    // Mirrors the same test exp-runners' Esc branch already applies.
    const dialogClosed = !!reg && reg.tagName === 'DIALOG' && !reg.hasAttribute('open');
    const gone = !reg || !reg.isConnected || reg.hidden || dialogClosed || getComputedStyle(reg).display === 'none';
    return gone || !(reg && a && reg.contains(a));
  }, regId, attr);
}

// LOTUS dismissability: a region with a keyboard-operable Close control IS escapable even if Tab cycles
// within it (the APG-required modal pattern). Activate each candidate close control and see if focus
// leaves / the region is dismissed. Destructive (it closes the dialog), so the caller runs it last.
async function probeCloseEscape(page, regId, closeRe, attr = 'data-v3-trapreg') {
  const closeIds = await page.evaluate((id, reSrc, a2) => {
    const re = new RegExp(reSrc, 'i');
    const reg = document.querySelector(`[${a2}="${id}"]`);
    if (!reg) return [];
    const cands = [...reg.querySelectorAll('button,a[href],[role=button],[tabindex]')].filter((el) => {
      const t = (el.getAttribute('aria-label') || '') + ' ' + (el.getAttribute('title') || '') + ' ' + (el.textContent || '');
      return re.test(t) || el.hasAttribute('data-dismiss');
    });
    return cands.map((el, i) => { const cid = id + '-c' + i; el.setAttribute('data-v3-close', cid); return cid; });
  }, regId, closeRe.source, attr);
  for (const cid of closeIds) {
    const focused = await page.evaluate((cid2) => { const el = document.querySelector(`[data-v3-close="${cid2}"]`); if (el) { el.focus(); return document.activeElement === el; } return false; }, cid);
    if (!focused) continue;
    await page.keyboard.press('Enter');
    await page.evaluate(() => new Promise((r) => setTimeout(r, 60)));
    if (await regionEscaped(page, regId, attr)) return true;
  }
  return false;
}

// V6 (expert-FP population check): a region is only a keyboard trap if a keyboard user can GET INTO it. The
// probe enters by script (`focus()`), so on the saved pages it "trapped" focus inside regions the Tab key never
// reaches — Newegg's off-canvas cookie drawer, whose buttons sit visibility:hidden until it opens (and whose
// `offsetParent` is non-null, so it counted them as focusables). Two gates:
//   · focusables are counted only when they can hold focus (rendered including `visibility`, not inert, not
//     disabled), and at least one must be a Tab ENTRY (no negative tabindex — a roving grid has exactly one);
//   · `opts.reachableXpaths` (the page's real Tab walk, forward ∪ backward, passed only when that walk completed
//     its ring) — a region none of whose focusables the walk reached is not probed and is reported in
//     `unreachableRegions` instead. Without a complete walk the tabbable gate alone applies (never a silent skip
//     on a truncated walk, which would hide a real trap late in the ring).
async function detectKeyboardTraps(page, opts = {}) {
  const reachable = Array.isArray(opts.reachableXpaths) ? opts.reachableXpaths : null;
  const scan = await page.evaluate((regSel, focSel, reach) => {
    const getXPath = (e) => {
      if (!e || !e.tagName) return '';
      if (e === document.body) return '/html/body';
      const ns = e.namespaceURI; const isHtml = !ns || ns === 'http://www.w3.org/1999/xhtml';
      const t = isHtml ? e.tagName.toLowerCase() : e.tagName;
      let idx = 1, sib = e.previousElementSibling;
      while (sib) { if (sib.tagName === e.tagName) idx++; sib = sib.previousElementSibling; }
      return getXPath(e.parentElement) + (isHtml ? '/' + t + '[' + idx + ']' : "/*[local-name()='" + t + "'][" + idx + "]");
    };
    const reachSet = reach ? new Set(reach) : null;
    // FOCUSABLE = can hold focus at all (rendered incl. visibility, not inert/disabled) — a roving grid's
    // tabindex=-1 cells count, because arrow keys and script move focus there and the trap lives among them.
    // ENTRY = a focusable Tab itself can land on (no negative tabindex). A region needs ≥2 focusables and ≥1 entry.
    const focusableNow = (f) => {
      if (!(f.offsetParent !== null || getComputedStyle(f).position === 'fixed')) return false;
      if (typeof f.checkVisibility === 'function' && !f.checkVisibility({ visibilityProperty: true })) return false;
      return !(f.closest('[inert]') || f.disabled === true);
    };
    const isEntry = (f) => { const ti = f.getAttribute('tabindex'); return !(ti !== null && parseInt(ti, 10) < 0); };
    const out = []; const unreachable = []; let n = 0; const seenEl = new Set();
    document.querySelectorAll(regSel).forEach((reg) => {
      if (seenEl.has(reg)) return; seenEl.add(reg);
      const fs = [...reg.querySelectorAll(focSel)].filter(focusableNow);
      const entries = fs.filter(isEntry);
      if (fs.length < 2 || !entries.length) return;
      if (reachSet && !entries.some((f) => reachSet.has(getXPath(f)))) { if (unreachable.length < 20) unreachable.push({ xpath: getXPath(reg), focusableCount: fs.length }); return; }
      const id = 'tr' + (n++); reg.setAttribute('data-v3-trapreg', id); out.push({ id, xpath: getXPath(reg), focusableCount: fs.length });
    });
    return { out, unreachable };
  }, TRAP_REGION_SEL, FOCUSABLE_SEL, reachable);
  const regions = scan.out;

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
    candidates, regionCount: regions.length, unreachableRegions: scan.unreachable,
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
  //
  // ADAPTIVE SETTLE (batch-3, instrument-lane residual — same mechanism as the confinement sweep below,
  // reusing the __frLog focusin recorder just installed): the flat REFOCUS_SETTLE_MS per press made this
  // scan ~3.2 s of designed idle on an ordinary page. The full window is paid for the calibration presses
  // and after ANY async focus signal (settled != immediate, or a between-press focusin none of the
  // adjacent reads saw); the first signal after a short-window press RESTARTS the scan once with the full
  // window — so an async-refocus page (the very thing this scan hunts) gets the byte-identical old walk,
  // and only pages that demonstrably never async-refocus get the short window, on which the reads are
  // identical by construction (a SYNC self-refocus lands before even the immediate read).
  const scanPress = (winMs) => page.evaluate(async (w) => {
    const carried = (window.__frLog || []).slice(); window.__frLog = [];
    const read = () => { const a = document.activeElement; return a && a.getAttribute ? (a.getAttribute('data-v3-foc') || '') : ''; };
    const t0 = Date.now(); const imm = read(); let cur = imm, changedAt = null;
    while (Date.now() - t0 < w) {
      await new Promise((r) => setTimeout(r, 16));
      const now = read();
      if (now !== cur) { cur = now; changedAt = (now !== imm) ? Date.now() : null; }
      else if (changedAt != null && Date.now() - changedAt >= 64) break;
    }
    return { imm, cur, carried };
  }, winMs);
  let scanAsyncSeen = false;
  async function scanWalk(forceFull) {
    await page.evaluate(() => { const b = document.body; if (b) { b.tabIndex = -1; b.focus(); } });
    await page.evaluate(() => { window.__frLog = []; }).catch(() => null);  // the body.focus() above is ours
    const ids = new Set();
    let prevRead = null, prevId = '', usedShort = false;
    for (let i = 0; i < scan.length + 4; i++) {
      await page.keyboard.press('Tab');
      const full = forceFull || scanAsyncSeen || i < CONFINE_CALIBRATION_PRESSES;
      if (!full) usedShort = true;
      const r = await scanPress(full ? REFOCUS_SETTLE_MS : CONFINE_SHORT_SETTLE_MS).catch(() => null);
      const cur = r ? r.cur : '';
      const carriedForeign = r && prevRead ? r.carried.some((id) => id !== prevRead.imm && id !== prevRead.cur && id !== r.imm && id !== r.cur) : false;
      if (r && (r.cur !== r.imm || carriedForeign) && !scanAsyncSeen) {
        scanAsyncSeen = true;
        if (usedShort) return scanWalk(true);       // short reads are unproven on an async page — rewalk in full
      }
      if (cur && cur === prevId) ids.add(cur);
      prevId = cur; prevRead = r;
    }
    return ids;
  }
  const candIds = await scanWalk(false);

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
const CONFINE_CALIBRATION_PRESSES = 4; // full-window presses at the head of every sweep before the short window may engage
const CONFINE_SHORT_SETTLE_MS = 24;    // settle window on a page that has demonstrably shown zero async focus behavior
                                       // (the window is NOT the guard — the focusin log catches anything that lands
                                       // after it, at the next press, and triggers the full-window restart)
const escSettle = REFOCUS_SETTLE_MS; // Escape may trigger an async close/refocus — settle before reading, like the rest

// In-page: install the confinement sweep's focusin log (idempotent — a re-install between sweeps just
// clears it). NAMED (not an inline closure) so cfPressSettleRead below is the literal function production
// calls — a test that wants to pin the F11 early-exit fix evaluates the SAME function, never a
// hand-duplicated copy that could silently drift from what ships.
function installCfFocusinLog() {
  if (window.__cfInstalled) { window.__cfLog = []; return; }
  window.__cfInstalled = true; window.__cfLog = [];
  document.addEventListener('focusin', (e) => {
    const t = e.target; window.__cfLog.push((t && t.getAttribute && t.getAttribute('data-v3-foc')) || '');
  }, true);
}

// In-page: one press's settle-and-read (see the ONE-ROUND-TRIP ADAPTIVE PRESS SETTLE comment above
// detectFixedSetConfinementTraps for the full rationale, and the F11 note there for the early-exit fix
// this function carries). `earlyExitOk` must be true ONLY for a genuine short-window (adaptive,
// non-full) press — a full-window press always polls its entire `winMs`, so a CHAINED bounce (a first
// hop that settles and holds >= 64 ms, then a SECOND hop later in the same window) is never truncated
// away. Exported (module scope, not an inline closure) so it is independently testable.
async function cfPressSettleRead(winMs, earlyExitOk) {
  const carried = (window.__cfLog || []).slice(); window.__cfLog = []; // focus events since the LAST read (late bounces land here)
  const read = () => { const a = document.activeElement; return a && a.getAttribute ? (a.getAttribute('data-v3-foc') || '') : ''; };
  const t0 = Date.now();
  const imm = read();
  let cur = imm, changedAt = null;
  while (Date.now() - t0 < winMs) {
    await new Promise((r) => setTimeout(r, 16));
    const now = read();
    if (now !== cur) { cur = now; changedAt = (now !== imm) ? Date.now() : null; }
    else if (earlyExitOk && changedAt != null && Date.now() - changedAt >= 64) break; // the bounce landed and held ⇒ settled
  }
  return { imm, cur, carried };
}

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
  //
  // ONE-ROUND-TRIP, ADAPTIVE PRESS SETTLE (batch-3, instrument-lane residual). The old per-press shape was
  // THREE CDP round-trips (pre-settle read; a driver-side sleep-evaluate of REFOCUS_SETTLE_MS; settled
  // read), so a region-loop page paid ~36-56 presses x 2 directions x (180 ms designed idle + 3 queued
  // round-trips) ≈ 19-21 s IDLE in this detector alone — and under corpus concurrency (PAGE_CONC 12) the
  // queued round-trips stretched that past the 90 s lane cap INSIDE the sweep, so the one-way rows this
  // sweep itself emits could never land (measured: results/b3-impl-212-post, region-loop 01/02/04/06).
  //
  // Two changes, each verdict-preserving:
  //  1. ONE evaluate per press does all three reads: the IMMEDIATE landing on entry (same pre-settle
  //     semantics — the transient-reach guard's input), then an in-page poll of the active id every ~16 ms
  //     across the settle window. Early exit only PAST-THE-BOUNCE: an async refocus was OBSERVED to land
  //     and then hold stable >= 64 ms (a chained rAF/timer hop keeps resetting the clock — the 140→180
  //     margin note above still holds; "hasn't bounced yet" never exits early). SOUNDNESS FIX F11 (batch-3
  //     adversarial review round 2): that early exit is a SHORT-WINDOW-ONLY optimisation — it must never
  //     fire on a FULL-window read. A full window is what "hold stable >= 64 ms" was tuned against in the
  //     first place (a single bounce settling well inside 180 ms), but a CHAINED bounce — the first hop
  //     settles, holds >= 64 ms, and only THEN a second hop fires later in the same window — is exactly
  //     what the early exit would truncate away on a full read, and `opts.adaptiveSettle: false` promises
  //     "the exact old timing envelope" (unconditional full-window wait, no early exit at all) below. Both
  //     were false before this fix: every press, adaptive or not, could exit the instant ONE bounce settled,
  //     so a full-window press silently stopped reading before its window elapsed and a second, later hop
  //     read as if it never happened. `allowEarlyExit` is threaded from the caller and is true ONLY for a
  //     genuine short-window (adaptive, non-full) press — never for a full-window one, whatever the reason
  //     it needed the full window (calibration / async-seen / forceFull / `adaptiveSettle: false`).
  //  2. ADAPTIVE WINDOW behind an event-driven guard. The full window exists to catch an ASYNC refocus —
  //     but every press on a page that has shown ZERO async focus behavior reads the same id at 48 ms as
  //     at 180 ms, so the full window is paid only while the page might still be an async page: the first
  //     CONFINE_CALIBRATION_PRESSES presses of each sweep, and every press after ANY async signal. The
  //     guard is a capture-phase focusin LOG (event-driven, so a bounce landing BETWEEN presses — the one
  //     shape sampling could miss — is never lost): each press returns the ids that fired since the last
  //     read, and an id outside that press's {immediate, settled} pair, or any settled≠immediate read, is
  //     the async signal. On the FIRST signal after a short-window press was used, the CURRENT sweep is
  //     RESTARTED ONCE with the full window — so any page with observable async focus behavior gets the
  //     byte-identical old sweep, and only pages that demonstrably never async-refocus get the short
  //     window (on which the reads are identical by construction). `opts.refocusSettleMs` remains the
  //     caller's bounded full-window override (run-instruments' lane-budget knob); `opts.adaptiveSettle:
  //     false` forces the full window on every press (the exact old timing envelope).
  const settleWindowMs = Number.isFinite(opts.refocusSettleMs) ? opts.refocusSettleMs : REFOCUS_SETTLE_MS;
  const adaptive = opts.adaptiveSettle !== false;
  await page.evaluate(installCfFocusinLog).catch(() => null);
  const pressSettleRead = (windowMs, allowEarlyExit) => page.evaluate(cfPressSettleRead, windowMs, allowEarlyExit === true);
  const window = Math.min(cap, Math.max(CONFINE_FLOOR, total * CONFINE_MULTIPLE));
  let asyncSeen = false;                             // page-level: any async focus signal anywhere so far
  async function sweep(backward, budget, forceFull) {
    await page.evaluate(() => { const b = document.body; if (b) { b.tabIndex = -1; b.focus(); } }).catch(() => null);
    await page.evaluate(() => { window.__cfLog = []; }).catch(() => null); // the body.focus() above is ours, not the page's
    const seq = [], imm = [];
    let usedShort = false, prev = null;
    for (let i = 0; i < budget; i++) {
      if (backward) { await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift'); }
      else { await page.keyboard.press('Tab'); }
      const full = !adaptive || forceFull || asyncSeen || i < CONFINE_CALIBRATION_PRESSES;
      // F11: early exit is permitted ONLY on the genuine short-window path (adaptive AND not full) — a
      // full-window press (whatever made it full) always polls its entire window.
      const r = await pressSettleRead(full ? settleWindowMs : CONFINE_SHORT_SETTLE_MS, !full).catch(() => null);
      if (!r) return null;                           // probe failed mid-sweep ⇒ fail-closed (abandon candidate)
      if (!full) usedShort = true;
      // async signal: a settled id that differs from the immediate landing, or a focus event between reads
      // whose id belongs to NEITHER of the previous press's reads NOR this press's own (the drained log
      // naturally contains THIS press's landing focusin — that is the Tab itself, not an async event; a
      // genuine between-press bounce is an id none of the four reads saw).
      const carriedForeign = prev ? r.carried.some((id) => id !== prev.imm && id !== prev.cur && id !== r.imm && id !== r.cur) : false;
      if (r.cur !== r.imm || carriedForeign) {
        if (!asyncSeen) {
          asyncSeen = true;
          // a short-window read may already sit in seq — those reads are only PROVEN equal to the old
          // shape's on never-async pages, which this page just stopped being: rewalk this sweep in full.
          if (usedShort) return sweep(backward, budget, true);
        }
      }
      prev = r;
      seq.push(r.cur); imm.push(r.imm);
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
  // OBSERVED-CYCLE guard (adversarial soundness finding #7): on a page with more focusables than the sweep
  // budget the forward walk never wraps, the tail half passes the confinement test VACUOUSLY (each element
  // settled exactly once), and everything past the truncation point reads as "walled off". Confinement — and
  // the one-way REVIEW lane below — may only be asserted when the window demonstrably LOOPED over S: the
  // confined slice must revisit (>= 2 settles per member on average), which a truncated single pass cannot.
  const confinedSettles = fwdSeq.slice(firstInS).filter((id) => id && byId.has(id)).length;
  if (confinedSettles < S.size * 2) return { traps: [], focusableCount: total };
  // TRANSIENT-REACH guard (80af7b Passed Ex7, async sibling-progression): a `setTimeout(()=>sibling.focus())` bounce
  // lets the browser FIRST land focus on the element OUTSIDE S (the next sibling) before the timer bounces it back.
  // The user genuinely reached that outside element, so this is PROGRESSION, not a hard trap. If any PRE-settle
  // (immediate) focus, once we are in S, lands on a real focusable outside S, abandon the candidate. (A SYNCHRONOUS
  // onblur bounce — the failed cases — never lets focus settle outside S even immediately.)
  if (fwd.imm.slice(firstInS).some((id) => id && byId.has(id) && !S.has(id))) return { traps: [], focusableCount: total };

  // ── ONE-WAY CONFINEMENT evidence (2.1.2, REVIEW — never a barrier) ─────────────────────────────────
  // Derived ENTIRELY from the forward sweep already in hand: zero extra page driving. The forward window is
  // confined to S, and any rendered focusable that NO forward press ever landed on (settled or pre-settle) is
  // content walled off in the normal navigation direction. That is exactly TT 4.C's "keyboard access is
  // restricted to a small section of the page with no way to navigate out of the loop" — but 4.C also carves
  // out a section that legitimately REQUIRES input/interaction before allowing focus to progress, and that
  // exception is semantic: keyboard-driving cannot see it. So a one-way confinement is emitted as a REVIEW
  // finding that routes to the keyboard-trap rubric, and it is emitted ONLY when the backward gate below shows
  // focus is NOT confined backward — a region confined in BOTH directions (a modal) takes the existing,
  // stronger confinement lane and can never arrive here.
  const reachedForward = new Set([...fwdSeq, ...fwd.imm].filter((id) => id && byId.has(id)));
  const unreachedForward = focs.filter((f) => !reachedForward.has(f.id));
  const onewayReturn = () => {
    if (!unreachedForward.length) return { traps: [], focusableCount: total };  // nothing walled off ⇒ nothing to review
    const members = [...S].map((id) => byId.get(id)).filter(Boolean);
    if (!members.length) return { traps: [], focusableCount: total };
    const anchor = members[0];
    return {
      traps: [], focusableCount: total,
      onewayTraps: [{ sc: '2.1.2', kind: 'keyboard-trap-oneway', direction: 'forward', review: true,
        xpath: anchor.xpath, tag: anchor.tag, label: anchor.label,
        memberXpaths: members.map((m) => m.xpath), setSize: S.size,
        unreached: unreachedForward.slice(0, 5).map((f) => ({ tag: f.tag, label: f.label })),
        unreachedCount: unreachedForward.length }],
    };
  };

  // BACKWARD GATE, MIRRORED (2026-08-16). The old gate required the ENTIRE backward sequence's real stops to
  // sit inside S — but every backward sweep starts at the document boundary and reaches the page's LAST
  // focusable first, so unless S happened to contain the last tab stop the gate could essentially never pass,
  // and genuine both-direction traps were declined (the backward sweep legitimately crosses outside-S content
  // BEFORE it enters the trap, exactly as the forward sweep does). Mirror the forward logic: locate the first
  // settled stop inside S and require confinement — and the transient-reach guard — from that point onward.
  const bwd = await sweep(true, window);
  if (!bwd) return { traps: [], focusableCount: total, undetermined: true };
  const bwdFirstInS = bwd.seq.findIndex((id) => S.has(id));
  const bwdConfined = bwdFirstInS >= 0
    && bwd.seq.slice(bwdFirstInS).filter((id) => id && byId.has(id)).every((id) => S.has(id))
    // backward transient-reach guard (mirror of the forward one): an async progression escapes backward too.
    && !bwd.imm.slice(bwdFirstInS).some((id) => id && byId.has(id) && !S.has(id));
  // confined FORWARD only ⇒ the one-way REVIEW lane (or nothing, when no focusable is actually walled off).
  if (!bwdConfined) return onewayReturn();

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
  // of it AND that key actually works. `tryAdvised` parses an advisory ("press Alt+F6 to exit") from the CURRENT page
  // text via the shared `parseAdvisory` grammar, drives focus into S, presses the combo, and reports: 'clear' (the
  // advised key freed focus ⇒ documented exit works ⇒ NOT a barrier), 'lying' (the page advises a key that does NOT
  // move focus ⇒ a 2.1.2 barrier), 'none' (no advisory, or none we can test), or
  // 'undetermined' (probe failed ⇒ fail-closed).
  const tryAdvised = async () => {
    // Grammar and chord-pressing live in `parseAdvisory`/`pressAdvised` at the top of this module — shared
    // verbatim with the `keyboard-trap-escape` experiment runner, which asks the same question against a
    // different scope. Text is extracted here, parsed in Node: keeping the regexes out of `page.evaluate`
    // is what makes one grammar servable to both lanes (and unit-testable without a browser).
    const text = await page.evaluate(() => (document.body && (document.body.innerText || document.body.textContent)) || '').catch(() => null);
    if (text === null) return 'undetermined';
    const advised = parseAdvisory(text);
    if (!advised) return 'none';
    // Advice we can SEE but cannot TEST — no extractable key, or a chord the user agent owns — is not a
    // documented working exit. It is also not "no advisory": the caller must treat it as advertised-but-
    // unverified rather than silently clearing. `lying` is the honest report for a reserved chord: the page
    // names a method that cannot move focus in this user agent.
    // No extractable key ⇒ we cannot test the claim. This lane keeps its PRE-EXISTING disposition for that
    // case (fall through as if unadvised, i.e. confirm on the confinement evidence alone) — only the GRAMMAR
    // changed here, not the contract. The runner lane treats the same input as inconclusive because audit
    // V3R2-H4 imposed that rule on the runner specifically; the two are deliberately not unified beyond the
    // parse, and unifying them is a behaviour change that needs its own measurement.
    // UNTESTABLE advice — no extractable key, or a chord the user agent owns and we must not press (Ctrl+W
    // would close the tab out from under the probe). Both lanes classify testability the same way; each then
    // applies its OWN established policy for it, and those policies differ deliberately. Here that policy is
    // the pre-existing one: fall through as if unadvised and confirm on the confinement evidence alone. Only
    // the GRAMMAR changed in this lane, not the contract.
    //
    // Reserved chords are NOT reported as `lying` even though the criterion's exception plainly is not met by
    // a method the user agent intercepts. `lying` is promoted to a deterministic barrier downstream, and this
    // lane would be asserting that from a hard-coded list rather than from a measurement — the same
    // over-claim the deterministic lanes are elsewhere forbidden from making. Naming a cause we did not
    // observe is how a detector earns a false positive.
    if (!advised.key || advised.reserved) return 'none';
    await page.evaluate((id) => { const el = document.querySelector(`[data-v3-foc="${id}"]`); if (el) el.focus(); }, [...S][0]).catch(() => null);
    await pressAdvised(page, advised);
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

// In-page: one candidate's focus-rejection probe (see detectFocusRejection below for the full rationale).
// NAMED (not an inline closure) so it is independently testable — a test can drive the exact function
// production calls, never a hand-duplicated copy. `gap` is the F14 (soundness review round 2) fix: a
// settle BETWEEN body.focus() and el.focus(), so a still-pending timer left over from a PREVIOUSLY probed
// candidate (page-JS timers are not cancelled just because probeOnce moved on to a fresh evaluate call —
// they persist across calls in the same document) gets a chance to fire and resolve harmlessly while body
// (not this candidate) holds focus, rather than landing DURING this candidate's own measurement window and
// reading as this candidate's own rejection.
async function focusRejectionProbeOnce(i, w, gap) {
  const b = document.body; if (b) { b.tabIndex = -1; b.focus(); }
  if (gap > 0) await new Promise((r) => setTimeout(r, gap));
  const el = document.querySelector(`[data-v3-foc="${i}"]`);
  if (!el) return null;
  if (el.disabled || el.getAttribute('aria-disabled') === 'true') return { skip: true };
  const inlineHandler = !!(el.getAttribute('onfocus') || el.getAttribute('onblur') || el.getAttribute('onfocusout'));
  window.__fojLog = [];                              // our own focusBody/focus churn is not a signal
  el.focus();
  await new Promise((r) => setTimeout(r, w));        // let a same-tick async blur land (setTimeout F55)
  const lateBlur = (window.__fojLog || []).includes(i); // el lost focus at some point during the wait
  return { skip: false, inlineHandler, lateBlur, took: document.activeElement === el || el.contains(document.activeElement), onBody: document.activeElement === document.body };
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
  // ONE round-trip per attempt, SHORT-WINDOW TRIAGE + EVENT-GUARDED full-window confirm (batch-3,
  // instrument-lane residual). The old shape paid focusBody + focus + a flat REFOCUS_SETTLE_MS + read as
  // FOUR CDP round-trips per candidate (~2.4 s idle on an ordinary page; x lane concurrency). The wait
  // exists for ONE reason — an async F55 blur (setTimeout) landing after the read — and an async blur is
  // an EVENT: a capture-phase focusout recorder sees it WHENEVER it fires, so the triage read can be
  // short. Every candidate whose short read looks rejected, AND every candidate the recorder later shows
  // a focusout for (the async blur the short read raced), is re-probed with the FULL window and the
  // original two-attempt confirmation — so nothing is ever FLAGGED off a short read, and nothing async
  // is MISSED by one: the flag path is byte-identical to the old detector's.
  await page.evaluate(() => {
    if (window.__fojInstalled) { window.__fojLog = []; return; }
    window.__fojInstalled = true; window.__fojLog = [];
    document.addEventListener('focusout', (e) => {
      const t = e.target; window.__fojLog.push((t && t.getAttribute && t.getAttribute('data-v3-foc')) || '');
    }, true);
  }).catch(() => null);
  const probeOnce = (id, winMs, interCandidateSettleMs) => page.evaluate(focusRejectionProbeOnce, id, winMs,
    Number.isFinite(interCandidateSettleMs) ? interCandidateSettleMs : CONFINE_SHORT_SETTLE_MS).catch(() => null);
  const rejections = [];
  const confirmFull = async (f, inlineHandler) => {
    const s1 = await probeOnce(f.id, REFOCUS_SETTLE_MS);
    if (!s1 || s1.skip || s1.took || !s1.onBody) return;
    const s2 = await probeOnce(f.id, REFOCUS_SETTLE_MS);   // confirm with a second independent attempt
    if (s2 && !s2.skip && !s2.took && s2.onBody) rejections.push({ sc: '2.1.1', xpath: f.xpath, tag: f.tag, label: f.label, inlineHandler: !!(inlineHandler != null ? inlineHandler : s1.inlineHandler) });
  };
  const suspects = [];
  for (const f of scan) {
    const q = await probeOnce(f.id, CONFINE_SHORT_SETTLE_MS);
    if (!q || q.skip) continue;
    // suspect = quick read already shows the rejection, OR the element demonstrably lost focus during
    // the short wait (sync-blur-then-async-refocus shapes), OR it carries an inline focus handler (the
    // static F55 tell — cheap to be generous, the full confirm still decides).
    if ((!q.took && q.onBody) || q.lateBlur || q.inlineHandler) suspects.push({ f, inlineHandler: q.inlineHandler });
  }
  // one final drain: an async blur from the LAST candidates may land after their loop iteration.
  const lateIds = await page.evaluate(() => { const l = (window.__fojLog || []).slice(); window.__fojLog = []; return l; }).catch(() => []);
  for (const f of scan) if (lateIds.includes(f.id) && !suspects.some((s) => s.f.id === f.id)) suspects.push({ f, inlineHandler: null });
  for (const s of suspects) await confirmFull(s.f, s.inlineHandler);
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

// ── REVEAL-STATE FOCUS ORDER (WCAG 2.4.3 / F85) ────────────────────────────────────────────────────
// The tab-order instrument records the ring AT REST, and a panel that is `display:none` at rest
// contributes no stops — so a complete, clean ring is not evidence about the state the user is actually
// in once they open something. It is evidence about a state they have not entered yet. Every reveal-order
// failure is therefore invisible to the resting ring by construction.
//
// The rubric already carried a clause telling the judge to drive this itself with the live tool
// repertoire. Measured over a full corpus run that clause produced ZERO tool calls on 6 of the 7 pages it
// was written for, and the one page that did call a tool still cleared. "Ask the judge to go and look" is
// a proven-failed lever here; the reveal state has to arrive as a deterministic FACT the judge reasons
// over, exactly like the resting ring does.
//
// Two facts decide it, and both come from the normative sources rather than from any page:
//
//  · ADJACENCY. Understanding 2.4.3's non-modal example states the requirement directly: "the interactive
//    elements in the dialog are inserted in the focus order immediately after the button". So: record the
//    ring at rest, activate the opener, record the ring again, and ask whether the FIRST newly-appearing
//    stop is the one immediately after the opener. A page that satisfies this by DOM placement passes with
//    no script at all; a page that satisfies it by MOVING focus into the revealed content passes too, which
//    is why `focusMovedIntoRevealed` is recorded alongside and a barrier needs BOTH to be false.
//
//  · RETURN. DHS Trusted Tester 4.F step 2b requires checking the focus order "to, from, and within the
//    revealed content" — the FROM half is where focus lands once the content is dismissed again. So:
//    enter the revealed region, dismiss it, and record where focus went.
//
// Three guard rails, each of which a probe showed to be load-bearing:
//  1. only claim anything when a region that was HIDDEN at rest is now VISIBLE. Activating a control that
//     merely APPENDS nodes (add a row, load more) also grows the ring, and reading that as "revealed
//     content placed far from its trigger" would be a manufactured barrier. Tagging the hidden ancestors
//     BEFORE activation makes the distinction exact rather than heuristic.
//  2. only judge the return when the region ACTUALLY became hidden again. A multi-step panel whose buttons
//     advance rather than close is not a dismissal, and requiring focus to return from one would fail a
//     conforming page.
//  3. scope the close-control search INSIDE the revealed region, and record whether the opener still
//     exists afterwards. A trigger and a confirm button can legitimately share a name, so a document-wide
//     name match re-opens what it meant to close; and when the activated action DELETES its own trigger,
//     "focus did not return to the trigger" is not a failure — F85's own note blesses a logical neighbour.
// Every field is a FACT. Nothing here mints a finding or a barrier on its own.
const REVEAL_ACT_SETTLE_MS = 250;   // let an open/close handler (class toggle, transition, focus move) land

// in-page: mark every currently-HIDDEN ancestor of a focusable. Walking UP from the focusables (rather
// than over every element) keeps this proportional to the focusable count, not the DOM size.
function tagHiddenRegionsInPage(focSel, mark) {
  const isHidden = (el) => {
    if (!el || el.nodeType !== 1) return false;
    if (el.hidden) return true;
    if (el.getAttribute && el.getAttribute('aria-hidden') === 'true') return true;
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') return true;
    if (!(el.offsetParent !== null || cs.position === 'fixed')) return true;
    const r = el.getBoundingClientRect();
    return r.width < 1 && r.height < 1;
  };
  let n = 0;
  const seen = new Set();
  for (const f of document.querySelectorAll(focSel)) {
    for (let p = f; p && p !== document.documentElement; p = p.parentElement) {
      if (seen.has(p) || p.hasAttribute('data-v3-revhidden')) break;   // this chain was already walked
      seen.add(p);
      if (isHidden(p)) { if (mark) p.setAttribute('data-v3-revhidden', '1'); n++; }
    }
  }
  return n;
}

const REVEAL_XPATH_FN = `(e) => { const gx = (n) => { if (!n || !n.tagName) return ''; if (n === document.body) return '/html/body';
  const ns = n.namespaceURI, isHtml = !ns || ns === 'http://www.w3.org/1999/xhtml', t = isHtml ? n.tagName.toLowerCase() : n.tagName;
  let i = 1; for (let s = n.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === n.tagName) i++;
  return gx(n.parentElement) + (isHtml ? '/' + t + '[' + i + ']' : "/*[local-name()='" + t + "'][" + i + "]"); }; return gx(e); }`;

// MARKERS this pass writes into the page. They are the proof-of-restoration probe: a genuine reload wipes
// every one of them, so their ABSENCE after the caller's restore is evidence the page really was reloaded,
// and their presence is evidence it was not. Exported so run-instruments can verify without duplicating the list.
const REVEAL_MARKER_SEL = '[data-v3-revopener],[data-v3-revregion],[data-v3-revfocus],[data-v3-revhidden]';

async function collectRevealedFocusOrder(page, url, opts = {}) {
  const maxOpeners = Number.isFinite(opts.maxOpeners) ? opts.maxOpeners : 2;
  const gotoTimeoutMs = opts.gotoTimeoutMs || 20000;
  // PROGRESS SINK (2026-08-16). The caller restores the page whenever this pass ACTIVATED anything, and it
  // learns that from the return value — which a rejection destroys, taking the "an opener was clicked" fact
  // with it and silently skipping the cleanup on exactly the runs that went wrong. `opts.progress` is a
  // caller-owned object mutated in place BEFORE each irreversible step, so the record survives any throw.
  const progress = (opts.progress && typeof opts.progress === 'object') ? opts.progress : {};
  progress.ran = true;
  const settle = require('./settle.js');
  const wait = (ms) => page.evaluate((t) => new Promise((r) => setTimeout(r, t)), ms).catch(() => null);
  const activeXpath = () => page.evaluate(`(${REVEAL_XPATH_FN})(document.activeElement)`).catch(() => null);
  const reload = async () => {
    await page.goto(url, { waitUntil: 'load', timeout: gotoTimeoutMs });
    await settle.awaitSettle(page).catch(() => {});
  };

  // PRECONDITION — this page must demonstrably HAVE something to reveal, and a control that declares it
  // reveals something. Both are answered on the page AS IT STANDS (the caller hands it over at rest), so a
  // page with no hidden focusable content pays two in-page queries and NO page load at all. That matters:
  // most pages are that page, and a speculative reload each would be the whole cost of this instrument.
  const hiddenRegions = await page.evaluate(tagHiddenRegionsInPage, FOCUSABLE_SEL, false).catch(() => 0);
  progress.hiddenRegions = hiddenRegions;
  if (!hiddenRegions) return { states: [], openers: 0, hiddenRegions: 0 };
  // DECLARED-INTENT openers first. findRevealOpeners' rank 3 is "any other safe button" — good enough to
  // speculatively hunt for a trap (where a false candidate simply finds nothing), but not, ON ITS OWN,
  // good enough to ground a 2.4.3 evidence claim, because clicking an arbitrary button and reading the
  // ring difference is exactly the shape that would manufacture one. Ranks 0-2 are aria-haspopup /
  // aria-expanded=false / aria-controls-at-a-hidden-target / a reveal verb in the name.
  //
  // #10 (batch-3 RCA): RANK-3 ADMISSION behind a structural gate. The measured corpus shape this pass
  // starved on: a list of plain "Remove"/"Refill" action buttons (no ARIA declaration, no verb-list name)
  // each opening a hidden aria-modal confirm dialog — openersFound: 0, and every reveal-order fact the
  // clause lanes feed on never existed. The gate is the same fact detectTrapsAfterReveal already blesses
  // rank-3 clicking with: the page demonstrably CONTAINS a closed DIALOG-shaped region holding >= 2
  // focusables ("is there a closed dialog on this page" is a fact, not a guess about button names). A
  // false candidate still manufactures nothing — guard 1 below requires the new stops to come from a
  // formerly-HIDDEN region before any claim, and a click that reveals nothing yields no state at all.
  const hiddenDialogShaped = await page.evaluate((focSel) => {
    for (const reg of document.querySelectorAll('dialog,[role="dialog"],[role="alertdialog"],[aria-modal="true"]')) {
      const hidden = reg.offsetParent === null || reg.hidden || getComputedStyle(reg).visibility === 'hidden'
        || (reg.tagName === 'DIALOG' && !reg.hasAttribute('open'));
      if (!hidden) continue;
      if (reg.querySelectorAll(focSel).length >= 2) return true;
    }
    return false;
  }, FOCUSABLE_SEL).catch(() => false);
  const openers = (await findRevealOpeners(page, 8)).filter((o) => o && (o.rank <= 2 || hiddenDialogShaped)).slice(0, maxOpeners);
  progress.openersFound = openers.length;
  if (!openers.length) return { states: [], openers: 0, hiddenRegions };

  const states = [];
  // The caller's page is already AT REST on `url` and has only been READ (Tab presses move focus; they do
  // not activate anything), so the first opener needs no reload. Every subsequent one does — one opener's
  // dialog state must never contaminate the next probe.
  let fresh = opts.pageIsFresh === true;
  for (const op of openers) {
    try {
      if (!fresh) await reload();
      fresh = false;
      await page.evaluate(tagHiddenRegionsInPage, FOCUSABLE_SEL, true).catch(() => 0);
      const here = page.url();   // compare against what the browser ACTUALLY has, not the requested string
      // the RESTING ring. The caller normally hands over the one the lane already collected on this same
      // load of this same page (identical by construction), so the common path costs no extra walk.
      let restXpaths = Array.isArray(opts.restingXpaths) && opts.restingXpaths.length ? opts.restingXpaths : null;
      if (!restXpaths) {
        const t0 = await collectTabOrder(page).catch(() => null);
        restXpaths = t0 ? (t0.order || []).map((o) => o.xpath) : [];
      }
      const restSet = new Set(restXpaths);

      // TAG the opener before activating it. Every identity question after this point — is the opener still
      // in the ring, is it still on the page, is focus back on it — must be asked of the ELEMENT, never of
      // its xpath: an xpath is positional, so an action that removes a sibling silently re-points it at a
      // DIFFERENT element. Measured on a fixture whose confirm handler deletes its own trigger: the trigger's
      // xpath then resolved to the NEXT button, and "focus returned to the opener" was reported about an
      // element that was not the opener. There it happened to agree with the truth; the mirror case (a node
      // removed BEFORE the trigger) would have manufactured a barrier out of the same aliasing.
      // Recorded BEFORE the await, not after: this evaluate both TAGS the page and CLICKS, so a rejection
      // (navigation, detached context, closed target) can leave the page activated with no return value to
      // say so. From here on the caller MUST restore, whatever this function goes on to return or throw.
      progress.activated = true;
      const clicked = await page.evaluate((xp) => {
        const el = document.evaluate(xp, document, null, 9, null).singleNodeValue;
        if (!el) return false;
        el.setAttribute('data-v3-revopener', '1');
        if (el.focus) el.focus();
        el.click();
        return true;
      }, op.xpath).catch(() => false);
      if (!clicked) continue;
      await wait(REVEAL_ACT_SETTLE_MS);
      if (page.url() !== here) continue;   // the click navigated — there is no opened state to compare

      // pin the post-activation focus to the ELEMENT too, and re-read the opener's CURRENT xpath — opening
      // can restructure the DOM, and the ring below is walked against the restructured document.
      const afterOpen = await page.evaluate(() => {
        const gx = (n) => { if (!n || !n.tagName) return ''; if (n === document.body) return '/html/body';
          const ns = n.namespaceURI, isHtml = !ns || ns === 'http://www.w3.org/1999/xhtml', t = isHtml ? n.tagName.toLowerCase() : n.tagName;
          let i = 1; for (let s = n.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === n.tagName) i++;
          return gx(n.parentElement) + (isHtml ? '/' + t + '[' + i + ']' : "/*[local-name()='" + t + "'][" + i + "]"); };
        const a = document.activeElement;
        if (a && a.setAttribute && a !== document.body && a !== document.documentElement) a.setAttribute('data-v3-revfocus', '1');
        const op2 = document.querySelector('[data-v3-revopener]');
        return { focusXpath: gx(a), openerXpathNow: op2 ? gx(op2) : null };
      }).catch(() => ({ focusXpath: null, openerXpathNow: null }));
      const opened = await collectTabOrder(page).catch(() => null);
      if (!opened) continue;
      const openedXpaths = (opened.order || []).map((o) => o.xpath);
      const newStops = openedXpaths.map((x, i) => ({ x, i })).filter((s) => !restSet.has(s.x));
      const openerIndex = openedXpaths.indexOf(afterOpen.openerXpathNow || op.xpath);
      const firstNewStopIndex = newStops.length ? newStops[0].i : -1;
      // #10 (batch-3 RCA): OPENED-RING CONTAINMENT aggregate. The walk above just recorded the per-stop
      // modal-containment facts (modalOpen / insideOpenModal) for the OPENED state — the state clause C is
      // actually about — and then this function reduced the ring to bare xpaths, dropping them. Keep them,
      // aggregated: with a modal rendered open, every stop still tabbable OUTSIDE it is a containment
      // leak. A FACT on the state (the rubric's clause-C gate opens on it), never a finding on its own.
      const modalStops = (opened.order || []).filter((s) => s && s.modalOpen === true);
      const leakedStops = modalStops.filter((s) => s.insideOpenModal !== true);
      const containmentLeak = modalStops.length ? {
        modalXpath: (modalStops.find((s) => s.modalXpath) || {}).modalXpath || null,
        openedStops: openedXpaths.length,
        leakedStops: leakedStops.length,
        leakedSample: leakedStops.slice(0, 6).map((s) => ({ xpath: s.xpath, label: s.label || null })),
      } : null;

      // GUARD 1: the first new stop must live inside a region that was HIDDEN at rest and is visible now.
      const region = newStops.length ? await page.evaluate((xp) => {
        const gx = (n) => { if (!n || !n.tagName) return ''; if (n === document.body) return '/html/body';
          const ns = n.namespaceURI, isHtml = !ns || ns === 'http://www.w3.org/1999/xhtml', t = isHtml ? n.tagName.toLowerCase() : n.tagName;
          let i = 1; for (let s = n.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === n.tagName) i++;
          return gx(n.parentElement) + (isHtml ? '/' + t + '[' + i + ']' : "/*[local-name()='" + t + "'][" + i + "]"); };
        const vis = (el) => { const cs = getComputedStyle(el);
          if (cs.display === 'none' || cs.visibility === 'hidden') return false;
          if (!(el.offsetParent !== null || cs.position === 'fixed')) return false;
          const r = el.getBoundingClientRect(); return r.width >= 1 && r.height >= 1; };
        const el = document.evaluate(xp, document, null, 9, null).singleNodeValue;
        if (!el) return null;
        let best = null;
        for (let p = el; p && p !== document.documentElement; p = p.parentElement) {
          if (p.getAttribute && p.getAttribute('data-v3-revhidden') === '1' && vis(p)) best = p;
        }
        if (!best) return null;
        best.setAttribute('data-v3-revregion', '1');
        return { xpath: gx(best), role: best.getAttribute('role') || null, tag: best.tagName.toLowerCase(),
          focusables: best.querySelectorAll('a[href],button,input:not([type=hidden]),select,textarea,[tabindex],[contenteditable=true]').length };
      }, newStops[0].x).catch(() => null) : null;

      const st = {
        openerXpath: op.xpath, openerName: op.name || null,
        restingStops: restXpaths.length, openedStops: openedXpaths.length, newStops: newStops.length,
        revealedRegionXpath: region ? region.xpath : null,
        revealedRegionRole: region ? (region.role || region.tag) : null,
        openerIndex: openerIndex >= 0 ? openerIndex : null,
        firstNewStopIndex: firstNewStopIndex >= 0 ? firstNewStopIndex : null,
        // null (not false) whenever the question could not be asked: nothing was revealed, the opener is
        // no longer in the ring (an inerted background is the usual reason), or the new stops did not come
        // from a formerly-hidden region.
        adjacent: (region && openerIndex >= 0 && firstNewStopIndex >= 0) ? (firstNewStopIndex === openerIndex + 1) : null,
        focusMovedIntoRevealed: null,
        focusAfterOpen: afterOpen.focusXpath || null,
        newStopLabels: newStops.slice(0, 6).map((s) => (opened.order[s.i] || {}).label || null),
        // #10: null when no modal was rendered open during the opened-state walk (leakedStops: 0 with a
        // modal open is itself evidence — a fully contained modal).
        containmentLeak,
      };
      if (region) {
        st.focusMovedIntoRevealed = await page.evaluate(() => {
          const reg = document.querySelector('[data-v3-revregion]');
          const el = document.querySelector('[data-v3-revfocus]');
          if (!reg) return null;
          return !!(el && reg.contains(el));   // no tagged focus ⇒ activation left focus on body ⇒ not moved in
        }).catch(() => null);
      }

      // ── RETURN. Enter the region explicitly first: after the opened-ring walk focus is wherever the ring
      // left it, and a page that does nothing on dismissal would then be graded on a coincidence. Entering
      // also reproduces the situation the requirement is about — the user is INSIDE the thing they close.
      if (region && region.focusables > 0) {
        const entered = await page.evaluate((focSel) => {
          const reg = document.querySelector('[data-v3-revregion]');
          if (!reg) return false;
          for (const f of reg.querySelectorAll(focSel)) {
            const cs = getComputedStyle(f);
            if (!(f.offsetParent !== null || cs.position === 'fixed') || cs.visibility === 'hidden') continue;
            const ti = f.getAttribute('tabindex');
            if (ti !== null && parseInt(ti, 10) < 0) continue;
            f.focus();
            if (reg.contains(document.activeElement)) return true;
          }
          return false;
        }, FOCUSABLE_SEL).catch(() => false);
        if (entered) {
          const regionHidden = () => page.evaluate(() => {
            const reg = document.querySelector('[data-v3-revregion]');
            if (!reg || !reg.isConnected) return true;
            const cs = getComputedStyle(reg);
            if (cs.display === 'none' || cs.visibility === 'hidden' || reg.hidden) return true;
            if (reg.getAttribute('aria-hidden') === 'true') return true;
            if (!(reg.offsetParent !== null || cs.position === 'fixed')) return true;
            const r = reg.getBoundingClientRect(); return r.width < 1 && r.height < 1;
          }).catch(() => null);
          await page.keyboard.press('Escape').catch(() => {});
          await wait(REVEAL_ACT_SETTLE_MS);
          let hidden = await regionHidden();
          let via = hidden ? 'escape' : null, control = null;
          if (!hidden) {
            // GUARD 3: only controls INSIDE the revealed region, and only ones that NAME themselves as a
            // way out. A control that advances a multi-step flow is not a dismissal.
            control = await page.evaluate((reSrc) => {
              const re = new RegExp(reSrc, 'i');
              const reg = document.querySelector('[data-v3-revregion]');
              if (!reg) return null;
              for (const b of reg.querySelectorAll('button,[role=button],input[type=button]')) {
                const cs = getComputedStyle(b);
                if (!(b.offsetParent !== null || cs.position === 'fixed') || cs.visibility === 'hidden') continue;
                if (b.disabled) continue;
                const n = ((b.getAttribute('aria-label') || '') + ' ' + (b.getAttribute('title') || '') + ' ' + (b.textContent || '')).replace(/\s+/g, ' ').trim();
                if (re.test(n) || b.hasAttribute('data-dismiss')) { b.click(); return n.slice(0, 40) || '(unnamed)'; }
              }
              return null;
            }, CLOSE_RE.source).catch(() => null);
            if (control) {
              await wait(REVEAL_ACT_SETTLE_MS);
              hidden = await regionHidden();
              if (hidden) via = 'close-control';
            }
          }
          st.dismissAttempted = true;
          st.dismissedVia = via;
          st.dismissControlName = control;
          // GUARD 2: a region that did not actually hide was not dismissed, so its focus position says
          // nothing about the return requirement.
          st.regionHiddenAfterDismiss = hidden === true;
          if (hidden === true) {
            st.focusAfterDismiss = await activeXpath();
            // BOTH questions asked of the tagged ELEMENT, never of a positional xpath — see the tagging note.
            const back = await page.evaluate(() => {
              const el = document.querySelector('[data-v3-revopener]');
              if (!el || !el.isConnected) return { present: false, returned: false };
              const cs = getComputedStyle(el);
              return {
                present: (el.offsetParent !== null || cs.position === 'fixed') && cs.visibility !== 'hidden' && !el.disabled,
                returned: document.activeElement === el,
              };
            }).catch(() => null);
            st.returnedToOpener = back ? back.returned : null;
            // …and the trigger has to still BE there for "return to the trigger" to be the right question.
            st.openerStillPresent = back ? back.present : null;
          }
        }
      }
      states.push(st);
    } catch (e) { /* this opener did not work out — the next one still gets its turn */ }
  }
  return { states, openers: openers.length, hiddenRegions };
}

// Reload → click one opener → run the trap detectors. Returns the first CONFIRMED result, tagged with the
// opener that revealed it, or null. The caller owns page lifetime; this never touches the shared lane page.
//
// REVEALED-STATE DETECTOR SET (2026-08-17, RCA-residual-s10 2.1.2 `modal-popover-…-vs-trap/case-06`).
// This pass used to run ONLY detectKeyboardTraps + detectFocusRetentionTraps after the opener click, which
// re-created for the revealed state exactly the structural blind spot detectEmbeddedFormatTraps documents for
// the at-rest one: an F10 trap inside an <iframe>/srcdoc/shadow root is invisible to the region detectors
// because its focusables live in ANOTHER document. Worse, the region detector can OBSERVE the confinement and
// still clear it — probed on the case-06 shape (hard trap in a same-origin srcdoc iframe inside a hidden
// modal): the revealed dialog IS nominated, probeDirectionalEscape tabs into the iframe and reads 'inside'
// forever (both directions trapped), and then the Esc probe calls focusFirstIn — resetting focus to the
// region's first focusable in the PARENT document — before pressing Escape. The parent's Escape handler
// works from there, so escEscapes=true and `confirmed` is false; but the user trapped INSIDE the frame can
// never deliver that keydown to the parent document. Escape-from-the-parent is the wrong question; only
// detectEmbeddedFormatTraps presses Escape from INSIDE the boundary. So the revealed state now runs the
// embedded-format detector, then the fixed-set confinement detector, after the two originals:
//  · the revealed state is RE-OPENED (fresh load + the same opener) before the two new detectors run,
//    because the Esc probe above legitimately CLOSES a conformant outer modal — the very page shape this
//    fix targets — and a detector run against the re-closed page is the at-rest blindness all over again;
//  · each detector re-collects focusables from the LIVE revealed DOM (the modal's controls are visible now,
//    so tagFocusables keeps them), and the embedded detector counts same-origin iframe/srcdoc inner
//    focusables via contentDocument / CDP contentFrame to size its walk — nothing at-rest is widened;
//  · every internal guard travels with the detector unchanged: Tab AND Shift+Tab AND Escape must all fail,
//    directional escapes stay review, cross-origin counts stay review, the confinement floor / observed-cycle
//    / transient-reach / advisory guards all apply as at rest;
//  · CONFIRMED-authority results (region trap, self-refocus, same-origin embed trap, lyingAdvisory
//    confinement) return immediately; review-grade results (cross-origin/directional embed rows, advisory-
//    possible confinement, one-way loops) are HELD and returned only if no opener yields anything confirmed,
//    so a weaker signal from opener 1 never pre-empts a confirmed trap behind opener 2.
// The caller emits these under the SAME kinds/review flags as the at-rest lane (keyboard-trap /
// -directional / -confinement / -oneway) with the existing "(revealed by activating …)" provenance suffix —
// no new provenance scheme, and build-v3's mint loops and S1 guards apply unchanged.
async function detectTrapsAfterReveal(page, url, opts = {}) {
  const maxOpeners = Number.isFinite(opts.maxOpeners) ? opts.maxOpeners : 2;
  // RELOAD BEFORE LOOKING. This runs at the END of the instrument lane, by which point the page has been
  // driven hard — the status detector alone clicks every safe trigger it can find, which on a modal page
  // means the dialog is ALREADY OPEN. Enumerating against that state made the precondition below answer
  // "no hidden region on this page" and the whole pass returned null, silently: verified by a direct probe
  // that found the trap on a clean load and nothing at all through the lane.
  //
  // …and the reload's own failure was SWALLOWED (`.catch(() => {})`), which reinstated the very bug the
  // paragraph above describes: a goto that timed out left the driven page in place and the pass went on to
  // enumerate against it, answering "no hidden dialog here" about a page whose dialog was merely already
  // open. A reload we cannot confirm is not a clean load, so BAIL — returning null (no claim) is the sound
  // reading of "we could not get the page into the state this pass requires".
  const reloaded = await page.goto(url, { waitUntil: 'load', timeout: opts.gotoTimeoutMs || 20000 }).then(() => true).catch(() => false);
  if (!reloaded) return null;
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
  let firstReview = null;   // review-grade result held while a later opener may still yield a CONFIRMED one
  for (const op of openers) {
    try {
      // OPEN (and, below, RE-OPEN) the revealed state. A closure because it is needed twice per opener:
      // detectKeyboardTraps' own Escape probe is DESTRUCTIVE — on the very shape this pass exists for (a
      // conformant outer modal whose parent-document Escape handler works), probing Esc from the region's
      // first focusable CLOSES the modal. The two detectors added below would then run against a re-closed
      // page and read it as boundary-free/floored — the at-rest blindness all over again, one reload later.
      const openState = async () => {
        await page.goto(url, { waitUntil: 'load', timeout: opts.gotoTimeoutMs || 20000 });
        await require('./settle.js').awaitSettle(page);
        const clicked = await page.evaluate((xp) => {
          const el = document.evaluate(xp, document, null, 9, null).singleNodeValue;
          if (!el) return false; el.click(); return true;
        }, op.xpath).catch(() => false);
        if (clicked) await page.evaluate(() => new Promise((r) => setTimeout(r, 250))).catch(() => {});
        return clicked;
      };
      if (!(await openState())) continue;
      const traps = await detectKeyboardTraps(page, opts).catch(() => null);
      if (traps && Array.isArray(traps.traps) && traps.traps.length) return { opener: op, traps };
      const self = await detectFocusRetentionTraps(page, opts).catch(() => null);
      if (self && Array.isArray(self.traps) && self.traps.length) return { opener: op, selfTraps: self };
      // RE-OPEN: the probes above may have dismissed the revealed state (see openState). Fresh load, same
      // opener — the established per-opener hygiene — so the two detectors below see the state the user is in.
      if (!(await openState())) continue;
      // EMBEDDED-FORMAT (F10) in the revealed state — the detector whose Escape probe is pressed from INSIDE
      // the embedded document, which is the only sound reading of "can the trapped user get out". A same-origin
      // trap row is confirmed authority (return now); cross-origin rows and directional escapes are review by
      // the detector's own contract and are held below.
      const embed = await detectEmbeddedFormatTraps(page, opts).catch(() => null);
      if (embed && Array.isArray(embed.traps) && embed.traps.length) {
        if (embed.traps.some((t) => t.sameOrigin === true)) return { opener: op, embedTraps: embed };
        if (!firstReview) firstReview = { opener: op, embedTraps: embed };
      } else if (embed && Array.isArray(embed.directional) && embed.directional.length && !firstReview) {
        firstReview = { opener: op, embedTraps: embed };
      }
      // RE-OPEN AGAIN whenever the embed detector actually DROVE the revealed state (it had boundaries to
      // probe, or died where we cannot know). It is state-destructive on exactly the shape this pass exists
      // for: its escape probe presses Escape with focus inside a boundary — which, for a shadow root,
      // BUBBLES into the parent document — and its enter path blurs and walks up to 40 Tabs. On a
      // conformant-closable modal that Escape CLOSES the dialog, so without a fresh open the confinement
      // detector below ran against the re-closed page, floored out (< 3 rendered focusables), and its
      // one-way/advisory lanes never saw the revealed set at all (soundness probe 2026-08-17). Mirrors the
      // existing re-open between the region detectors and the embed detector. A boundary-free page skips
      // the reload: the embed enumeration alone is read-only.
      const embedDrove = !embed || !Number.isFinite(embed.boundaries) || embed.boundaries > 0;
      if (embedDrove && !(await openState())) continue;
      // FIXED-SET CONFINEMENT in the revealed state. At rest this page floored out (< 3 rendered focusables);
      // with the modal open its members are rendered and the sweep can run. All of the detector's guards
      // (floor, observed-cycle, transient-reach, backward mirror, Escape, advisory) apply unchanged. Only a
      // LYING static advisory is confirmed authority; everything else — including one-way loops — is
      // review-routed to the rubric, same as at rest. Runs LAST: it is the most expensive probe here, and a
      // page decided by any detector above never pays for it.
      const confine = await detectFixedSetConfinementTraps(page, opts).catch(() => null);
      if (confine && Array.isArray(confine.traps) && confine.traps.length) {
        if (confine.traps.some((t) => t.lyingAdvisory === true)) return { opener: op, confinement: confine };
        if (!firstReview) firstReview = { opener: op, confinement: confine };
      } else if (confine && Array.isArray(confine.onewayTraps) && confine.onewayTraps.length && !firstReview) {
        firstReview = { opener: op, confinement: confine };
      }
    } catch (e) { /* this opener did not work out — try the next */ }
  }
  return firstReview;
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

  // WHERE focus is, down through nested frames and open shadow roots: one key per real focus position. A trap
  // is focus that CYCLES — it comes back to a position it already held without ever leaving the boundary. A
  // count budget cannot tell a trap from a long embed: `innerFocusables` counts only the embed's own document,
  // and measured on a real Zillow ad (C253) the nested ad iframes and their scrollable frame bodies made the
  // walk 8 stops long against a budget of 6, so a region a user leaves on the 9th Tab was reported as a trap.
  const deepKey = async () => {
    let frame = page.mainFrame(); const parts = [];
    for (let depth = 0; depth < 6; depth++) {
      const r = await frame.evaluate(() => {
        let a = document.activeElement; let path = '';
        while (a && a.shadowRoot && a.shadowRoot.activeElement) { path += a.tagName + '>'; a = a.shadowRoot.activeElement; }
        if (!a) return { key: 'none', frame: false };
        const all = a.getRootNode().querySelectorAll('*'); let i = 0; for (; i < all.length; i++) if (all[i] === a) break;
        return { key: path + a.tagName + '#' + i, frame: /^(IFRAME|FRAME|OBJECT|EMBED)$/.test(a.tagName) };
      }).catch(() => null);
      if (!r) return null;
      parts.push(r.key);
      if (!r.frame) break;
      const h = await frame.evaluateHandle(() => document.activeElement).catch(() => null);
      const child = h && h.asElement() ? await h.asElement().contentFrame().catch(() => null) : null;
      if (h) await h.dispose().catch(() => {});
      // focus is inside an embedded document we cannot read (a plugin <object>, a detached frame): the host
      // element would repeat on every press and fake a cycle, so report the position as unreadable instead.
      if (!child) return null;
      frame = child;
    }
    return parts.join('/');
  };
  const HARD_CAP = 150; // no cycle and no exit within this many presses ⇒ undetermined, never "trapped"
  const walkOut = async (b, backward) => {
    if (!(await enter(b))) return { escaped: null };
    if (!(await atBoundary(b.id))) return { escaped: null };   // focus refused to enter — nothing to test
    const budget = (Number.isFinite(b.innerFocusables) ? b.innerFocusables : 8) + margin;
    const seen = new Set();
    for (let i = 0; i < HARD_CAP; i++) {
      if (backward) { await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift'); }
      else { await page.keyboard.press('Tab'); }
      await page.evaluate(() => new Promise((r) => setTimeout(r, 25))).catch(() => {});
      if (!(await atBoundary(b.id))) return { escaped: true };
      const key = await deepKey();
      // Position unreadable: fall back to the count budget (the pre-cycle behaviour) rather than guess.
      if (key == null) { if (i + 1 >= budget) return { escaped: false }; continue; }
      if (seen.has(key)) return { escaped: false };             // focus came back round inside the boundary
      seen.add(key);
    }
    return { escaped: null };
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

module.exports = { parseAdvisory, normalizeAdvisedKey, pressAdvised, ADVISORY_RESERVED, collectTabOrder, tabOrderFindings, redundantStopFacts, detectKeyboardTraps, detectFocusRetentionTraps, detectFixedSetConfinementTraps, detectFocusRejection, detectFocusRestsInAriaHidden, findRevealOpeners, collectRevealedFocusOrder, detectTrapsAfterReveal, detectEmbeddedFormatTraps, REACH_SAFETY_CAP, REFOCUS_SETTLE_MS, TRAP_REGION_SEL, FOCUSABLE_SEL, OPENER_VERB_RE, REVEAL_MARKER_SEL,
  // F11 (soundness review round 2): the confinement sweep's in-page settle-read primitive + its focusin-log
  // installer + the tagger it reads `data-v3-foc` from, exported so a test can pin the early-exit fix by
  // calling the LITERAL function production runs, never a hand-duplicated copy.
  cfPressSettleRead, installCfFocusinLog, tagFocusables,
  // 2.1.2 close-control escape (LOTUS dismissability), exported so the experiment runner shares the one
  // implementation rather than re-deriving the rule: see runKeyboardTrapEscape in exp-runners.js.
  probeCloseEscape, regionEscaped, CLOSE_RE,
  // F14 (soundness review round 2): the focus-rejection probe primitive, exported for the same reason.
  focusRejectionProbeOnce };
