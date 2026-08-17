'use strict';
// Harness 3.1 §5.2.2 — the action→announcement instrument (WCAG 4.1.3 Status Messages). v2.9's
// drive-page triggered an action and checked whether a live region announced; v3 had the VSR but no
// such instrument. This adds it: drive each safe, AT-PERCEIVABLE trigger, observe the DOM change it
// causes, and flag a SOUND barrier — a status message that APPEARS (newly, not re-parented existing
// content) without being in a live region AND without focus moving to it, so a screen-reader user is
// never notified. Sound-first: a false positive (flagging a valid pattern) is the cardinal sin, so we
// flag only when content DEMONSTRABLY newly appeared and was DEMONSTRABLY not announced. Each trigger
// is driven in its OWN page.evaluate so a navigating control cannot discard the findings already
// collected (it just ends the sweep). Non-authoritative shadow signal (memory: vsr-is-harness-instrument).

const LIMITS = require('./limits.js'); // status-detector probe cap (tier F)

// the in-page positional XPath helper, shared by both passes.
const XPATH_FN = `function getXPath(e){
  if(!e||!e.tagName) return '';
  if(e===document.body) return '/html/body';
  if(e===document.documentElement) return '/html';
  var t=e.tagName.toLowerCase(),idx=1,sib=e.previousElementSibling;
  while(sib){ if(sib.tagName===e.tagName) idx++; sib=sib.previousElementSibling; }
  return getXPath(e.parentElement)+'/'+t+'['+idx+']';
}`;

// Detect 4.1.3 status-message gaps. opts: { maxTriggers=25, settleMs=300, minTextLen=3 }.
// COVERAGE (Harness 3.3 A4 / Decision C): this instrument is INSERTION-ONLY — it observes content that is
// newly ADDED to the DOM, so a status revealed by toggling `hidden`/`display`/`aria-hidden` on a
// PRE-RENDERED node (addedCount=0) is invisible to it (audit B3). That class is NOT covered here; the
// returned `coverageMode:'insertion-only'` makes the limitation explicit rather than silently complete.
async function detectStatusMessages(page, opts = {}) {
  const maxTriggers = Number.isFinite(opts.maxTriggers) ? opts.maxTriggers : LIMITS.instruments.statusMaxTriggers; // A4: ≥12 (the old cap truncated coverage)
  const settleMs = Number.isFinite(opts.settleMs) ? opts.settleMs : 300;
  // Hard ceiling for the per-trigger QUIESCENCE wait (see the in-page loop). Sized from the corpus:
  // the slowest multi-phase status flows settle at 1400-1800 ms, so 2500 ms covers them with margin
  // while bounding a pathological page. The common case still costs ~one settleMs poll.
  const maxWaitMs = Number.isFinite(opts.maxWaitMs) ? opts.maxWaitMs : 2500;
  const minTextLen = Number.isFinite(opts.minTextLen) ? opts.minTextLen : 3;
  // MULTI-STEP TIMELINE HORIZON (residual RCA S10, the removal-of-status / after-the-fact families). The
  // legacy window above ends at quiescence-or-maxWaitMs and everything the current prompts read is computed
  // there — but the outcome of a multi-phase flow (a progress message emptied, then an ordinary node filled;
  // a control re-enabled by an attribute flip) can land seconds later. So an ACTIVE trigger's observation is
  // EXTENDED to this horizon and everything that happens in it is RECORDED as a per-trigger `timeline`
  // sidecar (a separate artifact — never a new field on the observation object, whose rows are embedded
  // verbatim in a prompt and must stay byte-identical until the surfacing hunk lands). Inactive triggers
  // never pay it, and the per-trigger effective horizon is clamped by the sweep budget (see the loop).
  const timelineMs = Number.isFinite(opts.timelineMs) ? opts.timelineMs : 8000;

  // PASS 1 (Node-side list): enumerate the SAFE + AT-PERCEIVABLE trigger xpaths up front, so the driving
  // loop is one isolated evaluate per trigger (navigation-resilient). A trigger is excluded when it is
  // not in the a11y tree (display:none / visibility:hidden / opacity:0 / inside aria-hidden) — a control
  // no AT user can reach cannot present a 4.1.3 barrier (adversarial B-HIGH-1/2) — or when it would
  // navigate (submit/reset/href/scripted location change), which would end the page. A4: the selector is
  // widened beyond buttons to other activatable controls (checkbox/radio/switch/tab/menuitem/link), and
  // the total count is returned so truncation past the cap is reported, not silently dropped.
  const enumed = await page.evaluate((maxTriggers, XPATH_SRC) => {
    eval(XPATH_SRC); // eslint-disable-line no-eval — defines getXPath in this scope
    const NAV_RE = /location\s*[.=]|\.href|window\.open|\.submit\s*\(|history\.(push|replace|go|back|forward)/i;
    const isPerceivable = (el) => {
      if (el.closest && el.closest('[aria-hidden="true"]')) return false;
      if (el.offsetParent === null && getComputedStyle(el).position !== 'fixed') return false; // display:none
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.visibility === 'collapse') return false;
      if (parseFloat(cs.opacity) === 0) return false;
      return true;
    };
    const isSafe = (el) => {
      // READ THE ATTRIBUTE, not the IDL property, for the submit/reset/image test. `el.type` on a
      // <button> DEFAULTS to 'submit' even with no type= attribute, so `<button>Add to cart</button>`
      // — the single most common status trigger there is — was classified as a submit and excluded
      // from the trigger set entirely. It also made the next line dead code (`!type` can never be true
      // for a BUTTON), which is itself the proof the intended gate was the narrower one: a bare button
      // is only a default-submit hazard when it is INSIDE A FORM.
      const attrType = (el.getAttribute('type') || '').toLowerCase();
      const type = attrType || (el.tagName === 'BUTTON' ? '' : (el.type || '').toLowerCase());
      if (el.tagName === 'A' && el.getAttribute('href')) return false;
      // `type="submit"` is EXCLUDED only where a submit would really leave the page. "Check availability",
      // "Apply filter", "Add to cart", "Calculate" are overwhelmingly written as explicit submit buttons
      // whose handler calls preventDefault() and writes a status — 6 of the 20 residual 4.1.3 cases had a
      // submit button as their ONLY trigger, so the blanket exclusion made those pages untestable. PASS 2
      // installs a one-shot capture-phase `submit` guard that preventDefaults the real navigation, so a
      // submit inside a form is now drivable safely; a submit with NO form has nothing to navigate. `reset`
      // stays excluded (it destroys form state rather than producing a status) and so does `image`.
      if (type === 'reset' || type === 'image') return false;
      if (el.tagName === 'BUTTON' && !type && el.form) return false; // default-submit inside a form (bare <button>, intent unstated)
      if (el.disabled) return false;
      const oc = el.getAttribute('onclick') || '';
      if (NAV_RE.test(oc)) return false;                 // inline scripted navigation — would end the page
      if (el.closest && el.closest('a[href]')) return false; // nested inside a link
      return true;
    };
    const SEL = 'button,[role="button"],input[type="button"],input[type="checkbox"],input[type="radio"],[role="checkbox"],[role="radio"],[role="switch"],[role="tab"],[role="menuitem"],[role="menuitemcheckbox"],[role="menuitemradio"],[role="link"]';
    const all = [...document.querySelectorAll(SEL)].filter((el) => isPerceivable(el) && isSafe(el));
    return { xpaths: all.slice(0, maxTriggers).map((el) => getXPath(el)), total: all.length };
  }, maxTriggers, XPATH_FN)
    // `enumError` distinguishes "this page has no drivable trigger" from "the enumeration DIED". Both used
    // to produce `{ xpaths: [], total: 0 }`, and the caller then reported `triggersProbed: 0, triggersTotal: 0,
    // coverageTruncated: false` — a confident claim of complete coverage over a sweep that never ran. The
    // rubric is instructed that "absence ≠ pass"; it cannot honour that instruction if the artifact hides
    // the difference.
    .catch((e) => ({ xpaths: [], total: 0, enumError: String((e && e.message) || e).slice(0, 200) }));
  const xpaths = enumed.xpaths;

  // PASS 2 (one isolated evaluate per trigger): drive it, observe the change, judge soundly.
  const findings = [];
  const observations = [];   // per-trigger RECORD of what activation did (never a verdict) — see the in-page comment
  const timelines = [];      // per-trigger phase-B SIDECAR ({trigger, timeline:[{atMs,kind,…}], colourStateDeltas}) — separate from observations so those stay byte-identical
  // TOTAL WALL-CLOCK BUDGET for the sweep. The per-trigger observation window had to grow from a flat 300 ms
  // to a 2500 ms quiescence wait (multi-phase status flows settle at 1400-1800 ms and the short window was
  // recording phase 1 as the outcome). Left unbounded that is 25 triggers x 2.5 s, which pushed the whole
  // instruments lane past the orchestrator's 90 s cap — measured directly: a 2.1.2 modal page came back with
  // its tab order salvaged and ZERO findings, because the lane never reached the trap detectors. So: bound
  // the sweep, and report the truncation rather than letting it eat the lanes that run after it.
  const sweepBudgetMs = Number.isFinite(opts.sweepBudgetMs) ? opts.sweepBudgetMs : LIMITS.instruments.statusSweepMs;
  // PHASE-B SPEND POOL (soundness probe 2026-08-17). The old clamp reserved a flat 1000 ms, so on a page
  // with several ACTIVE triggers the first one or two timelines legally spent the whole sweep budget and
  // the LAST triggers were never probed at all — measured directly: 3 conformant triggers + 1 barrier
  // trigger, default config probed 3/4 and MISSED the barrier (budgetExhausted:true) while timelineMs:0
  // probed 4/4 and found it. A recorded-only enrichment must never cost a barrier the legacy sweep would
  // have caught, so phase-B extensions across the WHOLE sweep may spend at most this pool (30% of the
  // budget), and each trigger's clamp additionally reserves a worst-case LEGACY window (maxWaitMs) for
  // every trigger still unprobed — see effectiveTimelineMs. Small pages keep their timelines (one active
  // trigger still gets a multi-second horizon); large pages degrade to exactly the timelineMs:0 coverage.
  const phaseBPoolTotalMs = Math.round(sweepBudgetMs * 0.3);
  let phaseBSpentMs = 0;
  const sweepStart = Date.now();
  let budgetExhausted = false, probed = 0, sweepAborted = null;
  for (const xp of xpaths) {
    if (Date.now() - sweepStart > sweepBudgetMs) { budgetExhausted = true; break; }
    probed++;
    let res;
    // effective phase-B horizon for THIS trigger: the configured horizon, clamped so the extension can never
    // eat the remaining sweep budget (later triggers keep their legacy window instead of being starved).
    const effTimelineMs = effectiveTimelineMs({ timelineMs, sweepBudgetMs, elapsedMs: Date.now() - sweepStart, maxWaitMs,
      remainingTriggers: xpaths.length - probed, phaseBPoolMs: phaseBPoolTotalMs - phaseBSpentMs });
    try {
      res = await page.evaluate(async (xp, settleMs, minTextLen, XPATH_SRC, maxWaitMs, timelineMs) => {
        eval(XPATH_SRC); // eslint-disable-line no-eval
        const LIVE = '[aria-live="polite"],[aria-live="assertive"],[role="status"],[role="alert"],[role="log"],[role="alertdialog"],output';
        const toEl = (n) => { while (n && n.nodeType !== 1) n = n.parentNode; return n; };
        const inLiveRegion = (n) => { const e = toEl(n); return !!(e && e.closest && e.closest(LIVE)); };
        const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
        // ACCNAME-AWARE TEXT (residual RCA S10, non-textual-status-icon case-05). The diff below read
        // `norm(n.textContent)`, so a status carried by an ACCNAME-ONLY node — `<svg role="img"
        // aria-label="check">` inserted into a live region — contributed the empty string and the whole
        // change was invisible to both channels. Approximate what an AT would actually voice: the node's
        // textContent PLUS, for the node and its descendants, any attribute-carried accessible name
        // (aria-label, aria-labelledby resolution, alt on images, title as the last-resort fallback) that
        // the textContent does not already contain. Self-contained by design — this runs serialized
        // in-page, so no require()/helper import is possible.
        const accName1 = (el) => {
          if (!el || !el.getAttribute) return '';
          const al = el.getAttribute('aria-label'); if (al && al.trim()) return norm(al);
          const lb = el.getAttribute('aria-labelledby');
          if (lb) {
            const t = lb.split(/\s+/).filter(Boolean)
              .map((id) => { const r = document.getElementById(id); return r ? norm(r.textContent) : ''; })
              .filter(Boolean).join(' ');
            if (t) return t;
          }
          if (el.tagName === 'IMG') { const alt = el.getAttribute('alt'); if (alt && alt.trim()) return norm(alt); }
          const ti = el.getAttribute('title'); if (ti && ti.trim()) return norm(ti);
          return '';
        };
        // COMPONENT list, not just a joined string: the newness filters below test containment against
        // the before-snapshot, and a node carrying BOTH text and an accname would join into a composite
        // ("☁ Synced to cloud") that exists nowhere verbatim — so a merely RE-PARENTED node would read
        // as new and the barrier channel would fire on relocation, the exact unsoundness B-HIGH-3 exists
        // to prevent. Keeping the parts lets every filter ask its question per component.
        const accParts = (n) => {
          const base = norm(n && n.textContent);
          // only an ELEMENT node widens: for a text node, toEl() would reach its PARENT and sweep in
          // sibling names that were never part of this mutation.
          if (!n || n.nodeType !== 1 || !n.querySelectorAll) return base ? [base] : [];
          const parts = base ? [base] : [];
          const carriers = [n, ...n.querySelectorAll('[aria-label],[aria-labelledby],img[alt],[title]')];
          for (const el of carriers.slice(0, 12)) {
            const nm = accName1(el);
            if (nm && !parts.some((p) => p.toLowerCase().indexOf(nm.toLowerCase()) !== -1)) parts.push(nm);
          }
          return parts;
        };
        const accText = (n) => accParts(n).join(' ').replace(/\s+/g, ' ').trim();
        const trig = document.evaluate(xp, document, null, 9, null).singleNodeValue;
        if (!trig) return { finding: null };

        // snapshot what is ALREADY on the page, so re-parenting / revealing pre-existing visible content
        // is not mistaken for a NEW status message (adversarial B-HIGH-3). Accnames ride along for the
        // same reason: now that the diff voices attribute-carried names, a RE-PARENTED aria-label node
        // must not read as a genuinely new one (soundness — the barrier channel filters on this snapshot).
        const beforeAcc = [...document.querySelectorAll('[aria-label],[aria-labelledby],img[alt],[title]')]
          .slice(0, 300).map(accName1).filter(Boolean).join(' ');
        const beforeText = norm(document.body.innerText + ' ' + beforeAcc).toLowerCase();
        // ---- OBSERVATION CHANNEL (residual RCA S4) -------------------------------------------------
        // The barrier channel below answers ONE question — did text appear OUTSIDE any live region — and
        // it is right to be that narrow (it mints a barrier). But every remaining 4.1.3 failure shape puts
        // its text INSIDE a live region and fails on the announcement's ADEQUACY: a region created together
        // with its message (nothing to announce — the AT had no prior region to watch), a message removed
        // rather than added, the wrong politeness for the urgency. The detector saw all of that and reported
        // none of it, so those pages reached the judge as "no finding" and were cleared. Everything below is
        // RECORDED ONLY: it never decides, it hands the rubric what actually happened.
        //
        // Which live regions existed BEFORE the click, and what they held. `regionBornWithContent` is
        // decidable only against this snapshot, which is why it must be taken here.
        const liveBefore = [...document.querySelectorAll(LIVE)].map((e) => ({
          el: e, text: accText(e),
          politeness: (e.getAttribute('aria-live') || (e.getAttribute('role') === 'alert' || e.getAttribute('role') === 'alertdialog' ? 'assertive' : 'polite')).toLowerCase(),
          atomic: e.getAttribute('aria-atomic') === 'true',
        }));
        const liveBeforeSet = new Set(liveBefore.map((r) => r.el));
        // ---- TIMELINE SCAFFOLDING (phase B — recorded only, never decides) ------------------------
        // Per-region running text so the timeline can carry the ORDER of empties/refills, not just the
        // net before/after that `updatedRegions` reports. `_last` is a working copy; `text` stays the
        // pristine before-snapshot the legacy fields compare against.
        for (const r of liveBefore) r._last = r.text;
        // Pre-activation RENDERED-STATE SNAPSHOT (bounded): per element, visibility + computed colours,
        // so a class/style-driven flip observed later can be reported as a DELTA (what it was → what it
        // became) instead of a bare "something changed". Capped: past the cap the timeline still records
        // content/attribute events, just no deltas for the uncovered tail (reported as truncation).
        const SNAP_CAP = 3000;
        const allSnapEls = document.body.querySelectorAll('*');
        const snapTruncated = allSnapEls.length > SNAP_CAP;
        const snap = new WeakMap();
        {
          let i = 0;
          for (const el of allSnapEls) {
            if (i++ >= SNAP_CAP) break;
            const cs0 = getComputedStyle(el); const r0 = el.getBoundingClientRect();
            snap.set(el, {
              vis: cs0.display !== 'none' && cs0.visibility !== 'hidden' && parseFloat(cs0.opacity) > 0 && r0.width > 0 && r0.height > 0,
              bg: cs0.backgroundColor, fg: cs0.color,
            });
          }
        }
        // WATCHED CONTROLS: state-bearing elements whose attribute/state flips can BE the outcome (a
        // control re-enabled when an operation completes). Attribute flips arrive via the observer; the
        // `value` PROPERTY does not reflect to an attribute, so it is polled instead.
        const WATCH_SEL = 'button,input,select,textarea,[aria-expanded],[aria-busy],[aria-disabled],[role="button"],[role="switch"],[role="checkbox"],[role="radio"]';
        const watched = [...document.querySelectorAll(WATCH_SEL)].slice(0, 40)
          .map((el) => ({ el, value: ('value' in el) ? String(el.value == null ? '' : el.value) : '' }));
        const stateEvents = [];   // attribute/state flips on any element (disabled, aria-busy, …)
        const visFlips = [];      // class/style/hidden-driven rendered-visibility flips
        const valueEvents = [];   // a watched control's value went non-empty → empty
        const regionTrace = [];   // ordered live-region text transitions (emptied / refilled / updated)
        const colourDeltaByEl = new Map(); // Task-3 colour deltas, keyed by element (first-before, last-after)
        const rowTileLike = (el) => {
          const tag = el.tagName ? el.tagName.toLowerCase() : '';
          if (/^(tr|td|th|li|dt|dd)$/.test(tag)) return true;
          const role = (el.getAttribute('role') || '').toLowerCase();
          if (/^(row|listitem|gridcell|cell|option|article)$/.test(role)) return true;
          // repeated-peer shape: ≥2 same-tag siblings — the generic card/tile arrangement
          let n = 0;
          if (el.parentElement) { for (const sib of el.parentElement.children) { if (sib !== el && sib.tagName === el.tagName) n++; if (n >= 2) return true; } }
          return false;
        };
        const pollWatched = () => {
          const at = Date.now();
          for (const w of watched) {
            if (!('value' in w.el)) continue;
            const cur = String(w.el.value == null ? '' : w.el.value);
            if (w.value && !cur && w.el !== trig && valueEvents.length < 12) valueEvents.push({ at, xpath: getXPath(w.el) });
            if (cur !== w.value) w.value = cur;
          }
        };
        // -------------------------------------------------------------------------------------------
        const added = [];
        const removedTexts = [];      // text that LEFT the page — a removal is a status change too
        // Every mutation is TIMESTAMPED because the two channels need different windows. The barrier
        // channel keeps its original short window: it was adversarially tuned there and widening it makes
        // it fire on ordinary primary content that lands after an async round-trip (search RESULTS are not
        // a status message). The observation channel needs the whole multi-phase flow. One observer, two
        // views — so the barrier channel's behaviour is unchanged by this addition.
        const tClick = Date.now();
        const onMuts = (muts) => {
          const at = Date.now();
          for (const m of muts) {
            if (m.type === 'childList') {
              // `inLive` is captured HERE, while the node is attached. Reading it later is unsound: a
              // status message that is added and then REMOVED is detached by the time the window closes,
              // so `closest()` returns null and the message reads as "outside any live region" — a false
              // barrier on exactly the progress-message pattern that prompted the longer window.
              // accParts, not textContent — an accname-only insertion (svg[aria-label], img[alt]) IS the status.
              for (const n of m.addedNodes) { const parts = accParts(n); const t = parts.join(' ').replace(/\s+/g, ' ').trim(); if (t) added.push({ node: n, text: t, parts, at, inLive: inLiveRegion(n) }); }
              for (const n of m.removedNodes) { const parts = accParts(n); const t = parts.join(' ').replace(/\s+/g, ' ').trim(); if (t) removedTexts.push({ text: t, parts, at, fromLive: !!(m.target && m.target.closest && m.target.closest(LIVE)) }); }
            } else if (m.type === 'characterData') {
              const t = norm(m.target.textContent); if (t) added.push({ node: m.target, text: t, parts: [t], at, inLive: inLiveRegion(m.target) });
            } else if (m.type === 'attributes') {
              // TIMELINE-ONLY branch: attribute mutations never touch `added`/`removedTexts`, so every
              // legacy field (and therefore every current prompt) is byte-identical with this observer on.
              const el = m.target;
              if (!el || el.nodeType !== 1) continue;
              const attr = m.attributeName || '';
              if (attr === 'class' || attr === 'style' || attr === 'hidden') {
                const s = snap.get(el);
                if (s) {
                  const csn = getComputedStyle(el); const rn = el.getBoundingClientRect();
                  const visNow = csn.display !== 'none' && csn.visibility !== 'hidden' && parseFloat(csn.opacity) > 0 && rn.width > 0 && rn.height > 0;
                  if (s.vis !== visNow && visFlips.length < 20) {
                    visFlips.push({ at, xpath: getXPath(el), nowVisible: visNow, text: norm(el.textContent).slice(0, 80) });
                  }
                  if (s.vis !== visNow) s.vis = visNow;
                  // Task-3 colour delta: computed background/colour change on a row/tile-like element
                  // (the "a row changes colour on activation" shape). First-before + last-after per element.
                  if (rowTileLike(el) && (csn.backgroundColor !== s.bg || csn.color !== s.fg)) {
                    const d = colourDeltaByEl.get(el) || { at, xpath: getXPath(el), tag: el.tagName.toLowerCase(), bgBefore: s.bg, fgBefore: s.fg };
                    d.bgAfter = csn.backgroundColor; d.fgAfter = csn.color;
                    if (colourDeltaByEl.size < 12 || colourDeltaByEl.has(el)) colourDeltaByEl.set(el, d);
                  }
                }
                if (attr === 'hidden' && stateEvents.length < 30) {
                  stateEvents.push({ at, xpath: getXPath(el), attribute: attr, from: m.oldValue, to: el.getAttribute(attr), onTrigger: el === trig });
                }
              } else if (stateEvents.length < 30) {
                stateEvents.push({ at, xpath: getXPath(el), attribute: attr, from: m.oldValue, to: el.getAttribute(attr), onTrigger: el === trig });
              }
            }
          }
          // ordered live-region transitions: after each batch, re-read every pre-existing region that a
          // mutation may have touched. Regions are few, so this stays cheap; capped like the other lanes.
          for (const r of liveBefore) {
            if (regionTrace.length >= 20) break;
            const t = accText(r.el);
            if (t !== r._last) { regionTrace.push({ at, xpath: getXPath(r.el), from: r._last, to: t }); r._last = t; }
          }
        };
        const obs = new MutationObserver(onMuts);
        obs.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeOldValue: true, attributeFilter: ['disabled', 'aria-disabled', 'aria-busy', 'aria-expanded', 'aria-hidden', 'hidden', 'value', 'class', 'style'] });
        const focusBefore = document.activeElement;
        // NAVIGATION GUARD — capture-phase, one-shot, removed in `finally`. An explicit `type="submit"`
        // button is now in the trigger set (see isSafe), and most such buttons belong to a form whose own
        // handler preventDefaults. This guard covers the ones that do not: without it a real submit would
        // navigate and destroy the execution context mid-observation. Capture phase so it runs BEFORE the
        // page's own submit handler, and `preventDefault` only — the page's handler still runs and still
        // writes whatever status it writes, which is precisely what we are here to observe.
        const onSubmit = (ev) => { ev.preventDefault(); };
        document.addEventListener('submit', onSubmit, true);
        try {
          try { trig.click(); } catch (e) { /* a handler threw — no judgement */ }
          // QUIESCENCE, not a fixed sleep (residual RCA S4). A flat 300 ms window ended mid-sequence on
          // every multi-phase status flow in the corpus — the `removal-of-status` family settles at
          // 1400–1800 ms, so the observation stopped during phase 1 ("Checking…") and recorded a region
          // that looked like it was working. Wait for mutations to STOP instead: cheap on the common case
          // (one synchronous DOM write ⇒ one idle poll ⇒ ~settleMs total) and long enough for the slow
          // ones, with a hard cap so a page animating forever cannot stall the sweep.
          // Quiescence is NOT the right stop condition on its own: a multi-phase flow goes QUIET between
          // phases ("Searching the catalog…" → 1400 ms of silence → results + the message removed), so a
          // no-change poll would stop the observation mid-sequence and record a region that looks healthy.
          // So: once the trigger has done ANYTHING, observe to the cap; if it has done nothing after two
          // polls, stop immediately — which is the overwhelming majority of triggers and keeps the sweep cheap.
          const t0 = Date.now();
          let sawActivity = false;
          while (Date.now() - t0 < maxWaitMs) {
            await new Promise((r) => setTimeout(r, settleMs));
            pollWatched(); // timeline-only: value-property diffs never feed the legacy stop condition
            if (added.length + removedTexts.length > 0) sawActivity = true;
            else if (!sawActivity && Date.now() - t0 >= settleMs * 2) break;
          }
        } finally {
          document.removeEventListener('submit', onSubmit, true);
        }
        // The observer stays CONNECTED here: every legacy field below is computed synchronously (no await
        // between this point and the phase-B loop), so no new mutation can interleave into it — the legacy
        // fields close over exactly the data the old code saw, and phase B then extends the same observer.

        // BARRIER-CHANNEL WINDOW — the original `settleMs` slice only. See the observer comment above.
        const inBarrierWindow = (a) => !Number.isFinite(a.at) || a.at - tClick <= settleMs;
        // genuinely NEW content: at least one COMPONENT (text or accname — see accParts) absent from the
        // before-snapshot. Component-wise on purpose: a re-parented node's joined text+accname composite
        // exists nowhere verbatim, so a whole-string test would call relocation "new".
        const hasNewComponent = (a) => (a.parts || [a.text]).some((p) => !beforeText.includes(p.toLowerCase()));
        let msgs = added.filter((a) => inBarrierWindow(a) && a.text.length >= minTextLen
          && a.node !== trig && !(trig.contains && trig.contains(a.node))
          && hasNewComponent(a)); // genuinely NEW text, not pre-existing/relocated
        // DISCLOSURE / TAB exclusion (A4 / audit B3): a control that EXPANDS its own aria-controls target
        // (aria-expanded toggled true) or reveals its tabpanel is rendering PRIMARY content, not a 4.1.3
        // status message — exclude content inside that controlled region (lazy-rendered disclosure bodies).
        const role = (trig.getAttribute('role') || '').toLowerCase();
        const expandedNow = trig.getAttribute('aria-expanded') === 'true';
        const controlsEls = (trig.getAttribute('aria-controls') || '').split(/\s+/).filter(Boolean).map((id) => document.getElementById(id)).filter(Boolean);
        const isDisclosureReveal = (node) => {
          const e = toEl(node); if (!e) return false;
          if ((expandedNow || role === 'tab') && controlsEls.some((c) => c === e || c.contains(e))) return true;
          if (role === 'tab' && e.closest && e.closest('[role="tabpanel"]')) return true;
          return false;
        };
        msgs = msgs.filter((a) => !isDisclosureReveal(a.node));

        // ---- build the OBSERVATION first, so it is reported whatever the barrier channel decides ----
        const trigLabel = norm(trig.getAttribute('aria-label') || trig.innerText || trig.textContent).slice(0, 40);
        // The observation view spans the WHOLE window (no `inBarrierWindow` filter) and applies only the
        // noise filters that are about identity rather than timing: the trigger's own text, and text that
        // was already on the page. Disclosure/tab reveals stay excluded here too — they are primary
        // content, not status, in both channels.
        const obsMsgs = added.filter((a) => a.text.length >= minTextLen
          && a.node !== trig && !(trig.contains && trig.contains(a.node))
          && hasNewComponent(a)
          && !isDisclosureReveal(a.node));
        const liveNow = [...document.querySelectorAll(LIVE)];
        // A region that did not exist before the click and arrived carrying text: an AT observes live
        // regions that were in the tree when the change happened, so a region INSERTED together with its
        // message announces nothing. This is the `after-the-fact-live-region-timing` family (5 cases) —
        // structurally invisible to a detector that only asks "is the text inside a live region".
        const bornWithContent = liveNow
          .filter((e) => !liveBeforeSet.has(e) && accText(e).length >= minTextLen)
          .map((e) => ({ xpath: getXPath(e), text: accText(e).slice(0, 80), politeness: (e.getAttribute('aria-live') || (/^alert/.test(e.getAttribute('role') || '') ? 'assertive' : 'polite')).toLowerCase() }));
        // A PRE-EXISTING region whose content changed — the healthy shape. Politeness/atomic ride along so
        // the rubric can judge urgency (`wrong-live-region-politeness`) and partial reads (aria-atomic).
        // accText on BOTH sides of the compare (the before snapshot above is accText too): a region that
        // receives an accname-only node has an unchanged textContent, which read as "nothing happened".
        const updatedRegions = liveBefore
          .filter((r) => accText(r.el) !== r.text)
          .map((r) => ({ xpath: getXPath(r.el), before: r.text.slice(0, 80), after: accText(r.el).slice(0, 80), politeness: r.politeness, atomic: r.atomic,
            emptied: r.text.length > 0 && accText(r.el).length === 0 }));
        // Text REMOVED from the page. WCAG's Understanding treats a status message as content that
        // "communicates a change in state" — the disappearance of "3 items in cart" or of an error is such
        // a change, and an AT is told nothing by a removal. Recorded, never decided: a self-dismissing toast
        // is a removal that conveys nothing, and only the rubric can tell the two apart.
        // A removal counts if the text was ON SCREEN at some point — either before the click, or added
        // during this observation. Requiring only the former dropped the very shape this is here for: a
        // progress message is ADDED and then REMOVED inside the same window ("Searching the catalog…"),
        // and the user is told nothing when it goes.
        // …component-wise here too: a removal qualifies when EVERY component was on screen at some point
        // (before the click, or added during this observation) — same question as before, asked per part.
        const addedTextSet = new Set(added.flatMap((a) => a.parts || [a.text]).map((p) => p.toLowerCase()));
        const removed = removedTexts
          .filter((r) => r.text.length >= minTextLen
            && (r.parts || [r.text]).every((p) => beforeText.includes(p.toLowerCase()) || addedTextSet.has(p.toLowerCase())))
          .slice(0, 6).map((r) => ({ text: r.text.slice(0, 80), fromLiveRegion: r.fromLive, appearedThenRemoved: (r.parts || [r.text]).some((p) => !beforeText.includes(p.toLowerCase())) }));
        // FOCUS, told apart from focus LOSS. `focusMoved` is the field the 4.1.3 rubric reads as "activation
        // was a CHANGE OF CONTEXT, so this criterion does not apply" — the single most consequential fact in
        // the observation, because it takes the page out of scope entirely. Computed as
        // `document.activeElement !== focusBefore` it was true in two opposite situations:
        //   · the page SENT focus somewhere (a real change of context — out of scope, correctly); and
        //   · the page DESTROYED the focused element, so focus fell back to <body> (no context change at all
        //     — the user is left with focus nowhere and the new content announced by nothing, which is the
        //     4.1.3 barrier in its purest form).
        // The second is the common shape: the trigger is usually the focused element, and hiding or removing
        // the control you just pressed is what a confirmation flow does. Verified on
        // eval/act-augmented/4.1.3/pages/is-it-a-status-message-scope-boundary/case-06 — the Reserve button
        // is hidden on submit, activeElement becomes <body>, the success line lands in NO live region, and
        // the observation reported `focusMoved: true`, which the judge (correctly, by its instructions) read
        // as out-of-scope. So: focus counts as MOVED only when it came to rest on a real element. A fallback
        // to <body>/documentElement is recorded as `focusDropped`, which is a barrier's symptom, not a defence.
        const focusAfter = document.activeElement;
        const isRealEl = (el) => !!(el && el.nodeType === 1 && el !== document.body && el !== document.documentElement);
        const isRendered = (el) => {
          if (!el || !el.isConnected) return false;
          const cs = getComputedStyle(el);
          if (cs.visibility === 'hidden' || cs.visibility === 'collapse' || cs.display === 'none') return false;
          return el.offsetParent !== null || cs.position === 'fixed';
        };
        const focusRelocated = focusAfter !== focusBefore && isRealEl(focusAfter);
        const observation = {
          trigger: getXPath(trig), triggerLabel: trigLabel,
          addedOutsideLiveRegion: obsMsgs.filter((a) => a.inLive !== true).slice(0, 4).map((a) => a.text.slice(0, 80)),
          addedInsideLiveRegion: obsMsgs.filter((a) => a.inLive === true).slice(0, 4).map((a) => a.text.slice(0, 80)),
          regionsBornWithContent: bornWithContent.slice(0, 4),
          regionsUpdated: updatedRegions.slice(0, 4),
          removedText: removed,
          liveRegionCountBefore: liveBefore.length, liveRegionCountAfter: liveNow.length,
          focusMoved: focusRelocated,
          // focus was LOST rather than moved: the element that held it is gone or no longer rendered, and
          // nothing received it. Never an exclusion — it is the opposite of a change of context.
          focusDropped: isRealEl(focusBefore) && !isRealEl(focusAfter) && !isRendered(focusBefore),
          // …and the ONE case where a focus move genuinely announces the change: focus landed in the new
          // content itself. Same test the barrier channel applies below, published so the rubric can tell
          // "focus went into the message" from "focus went somewhere else entirely".
          focusMovedIntoNewContent: focusRelocated && obsMsgs.some((a) => {
            const e = toEl(a.node);
            return !!(e && (e === focusAfter || e.contains(focusAfter) || (focusAfter.contains && focusAfter.contains(e))));
          }),
        };
        const nothingHappened = !observation.addedOutsideLiveRegion.length && !observation.addedInsideLiveRegion.length
          && !bornWithContent.length && !updatedRegions.length && !removed.length;

        // BARRIER + LEGACY-OBSERVATION DECISIONS ARE FIXED HERE — before the phase-B extension — so the
        // extra observation time can never change what the barrier channel or the current prompts see.
        // The three early returns this replaces are preserved branch-for-branch as assignments.
        let finding = null;
        let observationOut = nothingHappened ? null : observation; // nothing new appeared (or only disclosure/tab content) → not a status (sound)
        if (msgs.length) {
          observationOut = observation;
          // announced via a live region ⇒ no finding (membership read AT MUTATION TIME — see the observer)
          if (!msgs.some((a) => a.inLive === true)) {
            const focusEl = document.activeElement;
            // `isRealEl` is load-bearing here, not a tidy-up. The third clause asks whether focus landed on a
            // CONTAINER of the new message — and <body> contains every message on the page, so an activation that
            // merely DROPPED focus (the focused control was hidden or removed, focus fell back to <body>) matched
            // it for free and suppressed the barrier on the whole "trigger hides itself, plain <div> announces
            // nothing" family. That is the exact page this criterion exists for: focus is nowhere, no live region
            // was involved, and the AT is told nothing. A focus fallback to <body>/<html> announces nothing, so it
            // can never be the reason a change is perceivable.
            const focusMovedToMsg = isRealEl(focusEl) && focusEl !== focusBefore && msgs.some((a) => { const e = toEl(a.node); return e && (e === focusEl || e.contains(focusEl) || (focusEl.contains && focusEl.contains(e))); });
            if (!focusMovedToMsg) { // otherwise perceivable: focus moved into the new content
              const target = toEl(msgs[0].node) || trig;
              finding = {
                sc: '4.1.3', kind: 'status-not-announced',
                xpath: getXPath(target), trigger: getXPath(trig),
                detail: `activating ${JSON.stringify(norm(trig.innerText || trig.textContent).slice(0, 40))} added new visible text that is NOT in a live region and did NOT move focus — a screen-reader user is not notified (message: ${JSON.stringify(msgs[0].text.slice(0, 60))})`,
              };
            }
          }
        }

        // ---- PHASE B: bounded multi-step timeline extension (recorded only) ------------------------
        // Only a trigger that demonstrably DID something keeps the page open to the horizon; a silent
        // trigger returns exactly as before. The one blind spot this leaves — a trigger whose FIRST effect
        // of any kind lands after the legacy window closed — is accepted as the price of a bounded sweep.
        const sawTimelineActivity = added.length + removedTexts.length + stateEvents.length + visFlips.length
          + regionTrace.length + valueEvents.length + colourDeltaByEl.size > 0;
        let phaseBMs = 0; // actual extension spend, reported so the caller can charge the sweep-wide pool
        if (timelineMs > 0 && sawTimelineActivity) {
          const tPhaseB = Date.now();
          while (Date.now() - tClick < timelineMs) {
            const step = Math.min(settleMs, timelineMs - (Date.now() - tClick));
            if (step <= 0) break;
            await new Promise((r) => setTimeout(r, step));
            pollWatched();
          }
          phaseBMs = Date.now() - tPhaseB;
        }
        onMuts(obs.takeRecords()); // flush mutations delivered but not yet dispatched — timeline-only by construction
        obs.disconnect();
        pollWatched();

        // ---- TIMELINE ASSEMBLY (a SIDECAR artifact — never a field on the observation object) ------
        const clip80 = (s) => (s || '').slice(0, 80);
        const tRel = (t) => Math.max(0, Math.round(t - tClick));
        const timeline = [];
        const addedSetFull = new Set(added.flatMap((a) => a.parts || [a.text]).map((p) => p.toLowerCase()));
        for (const a of added) {
          if (a.text.length < minTextLen) continue;
          if (a.node === trig || (trig.contains && trig.contains(a.node))) continue;
          if (!hasNewComponent(a)) continue;              // same identity filters as the observation channel
          if (isDisclosureReveal(a.node)) continue;
          timeline.push({ atMs: tRel(a.at), kind: 'content-added', text: clip80(a.text), inLiveRegion: a.inLive === true });
        }
        for (const r of removedTexts) {
          if (r.text.length < minTextLen) continue;
          if (!(r.parts || [r.text]).every((p) => beforeText.includes(p.toLowerCase()) || addedSetFull.has(p.toLowerCase()))) continue;
          timeline.push({ atMs: tRel(r.at), kind: 'content-removed', text: clip80(r.text), fromLiveRegion: !!r.fromLive });
        }
        for (const rt of regionTrace) {
          timeline.push({ atMs: tRel(rt.at), kind: rt.to.length === 0 ? 'live-region-emptied' : (rt.from.length === 0 ? 'live-region-refilled' : 'live-region-updated'), xpath: rt.xpath, textBefore: clip80(rt.from), textAfter: clip80(rt.to) });
        }
        for (const se of stateEvents) {
          timeline.push({ atMs: tRel(se.at), kind: 'state-change', xpath: se.xpath, attribute: se.attribute, from: se.from == null ? null : String(se.from).slice(0, 40), to: se.to == null ? null : String(se.to).slice(0, 40), ...(se.onTrigger ? { onTrigger: true } : {}) });
        }
        for (const vf of visFlips) timeline.push({ atMs: tRel(vf.at), kind: 'visibility-flip', xpath: vf.xpath, nowVisible: vf.nowVisible, text: clip80(vf.text) });
        for (const ve of valueEvents) timeline.push({ atMs: tRel(ve.at), kind: 'value-emptied', xpath: ve.xpath });
        timeline.sort((x, y) => x.atMs - y.atMs);
        const TIMELINE_CAP = 40;
        const colourStateDeltas = [...colourDeltaByEl.entries()].map(([el, d]) => ({
          atMs: tRel(d.at), xpath: d.xpath, tag: d.tag,
          backgroundBefore: d.bgBefore, backgroundAfter: d.bgAfter,
          colorBefore: d.fgBefore, colorAfter: d.fgAfter,
          // did any TEXT also change in/around the element? (a colour-only state change is the 1.4.1 shape;
          // a colour change accompanied by text is ordinarily fine)
          textAlsoChangedNearby: added.some((a) => {
            if (a.text.length < minTextLen) return false;
            const e = toEl(a.node);
            return !!(e && (el.contains(e) || e.contains(el) || (e.parentElement && e.parentElement === el.parentElement)));
          }),
        })).filter((d) => d.backgroundBefore !== d.backgroundAfter || d.colorBefore !== d.colorAfter);
        const sidecar = (timeline.length || colourStateDeltas.length) ? {
          trigger: getXPath(trig), triggerLabel: trigLabel,
          timeline: timeline.slice(0, TIMELINE_CAP),
          spanMs: Math.round(Date.now() - tClick),
          ...(timeline.length > TIMELINE_CAP ? { truncated: true } : {}),
          ...(snapTruncated ? { snapshotTruncated: true } : {}),
          ...(colourStateDeltas.length ? { colourStateDeltas } : {}),
        } : null;
        return { finding, observation: observationOut, ...(sidecar ? { timeline: sidecar } : {}), phaseBMs };
      }, xp, settleMs, minTextLen, XPATH_FN, maxWaitMs, effTimelineMs);
    // The page navigated / the context was destroyed — keep the findings gathered so far, but SAY that the
    // sweep ended early. `probed` counts this trigger as probed, so without the record an aborted sweep and a
    // complete one are the same artifact whenever the abort happened on the last trigger.
    } catch (e) { sweepAborted = String((e && e.message) || e).slice(0, 200); break; }
    if (res && res.finding) findings.push(res.finding);
    if (res && res.observation) observations.push(res.observation);
    if (res && res.timeline) timelines.push(res.timeline);
    // charge the ACTUAL extension time against the sweep-wide phase-B pool (granted horizon is an upper
    // bound; a trigger that went quiet early must not debit budget it never spent).
    if (res && Number.isFinite(res.phaseBMs) && res.phaseBMs > 0) phaseBSpentMs += res.phaseBMs;
  }
  // A4: report coverage honestly — how many triggers were probed, whether the cap truncated the sweep, and
  // that this instrument only sees INSERTED status (not hidden/display toggles on pre-rendered nodes).
  const coverageTruncated = enumed.total > probed;
  // Report coverage honestly: how many triggers were probed, whether the CAP truncated the enumeration, and
  // whether the wall-clock BUDGET cut the sweep short. `probed` is the count actually driven, which is what a
  // downstream "absence != pass" reader needs — not the length of the list we intended to drive.
  // `enumError` / `sweepAborted` are present ONLY on a run that failed, so a healthy page's shape is
  // byte-identical to before: their presence at all is the signal (same convention as collectorLiveness).
  return { findings, observations, timelines, coverageMode: 'insertion-and-removal', triggersProbed: probed, triggersTotal: enumed.total, coverageTruncated, budgetExhausted, unprobedTriggers: Math.max(0, enumed.total - probed),
    ...(enumed.enumError ? { enumError: enumed.enumError } : {}), ...(sweepAborted ? { sweepAborted } : {}) };
}

// Pure budget math for the phase-B horizon of ONE trigger. The extension may spend only what the sweep
// budget has left (minus a reserve so the NEXT trigger can still be enumerated and driven with its legacy
// window), and an extension that cannot exceed the legacy window buys nothing — return 0 so the trigger
// runs exactly the pre-timeline shape. Exported for unit tests (pure — no DOM, no browser).
//
// STARVATION GUARD (soundness probe 2026-08-17). The flat 1000 ms reserve let one active trigger's
// timeline spend budget that LATER triggers needed for their legacy windows — the sweep then broke off
// before probing them at all, and a barrier on an unprobed trigger is a barrier the legacy (timelineMs:0)
// sweep would have caught. Two levers restore the invariant "phase B never costs a trigger its legacy
// window":
//  · `remainingTriggers` scales the reserve to the WORST-CASE legacy window (maxWaitMs) of every trigger
//    still unprobed, so an extension is granted only out of genuinely spare budget;
//  · `phaseBPoolMs` is the sweep-wide pool the caller debits with each trigger's ACTUAL extension spend
//    (30% of sweepBudgetMs at the call site), bounding total phase-B time even when the reserve math is
//    optimistic (silent triggers cost far less than maxWaitMs, so spare budget can be real but shared).
// Both default to the pre-guard behaviour so existing pure-math callers are unchanged.
function effectiveTimelineMs({ timelineMs, sweepBudgetMs, elapsedMs, maxWaitMs, reserveMs, remainingTriggers = 0, phaseBPoolMs = Infinity }) {
  const t = Number.isFinite(timelineMs) ? timelineMs : 0;
  if (t <= 0) return 0;
  const mw = Number.isFinite(maxWaitMs) ? maxWaitMs : 0;
  const nRemaining = Number.isFinite(remainingTriggers) ? Math.max(0, remainingTriggers) : 0;
  const perTriggerReserve = mw > 0 ? mw : 1000;
  const reserve = Number.isFinite(reserveMs) ? reserveMs : Math.max(1000, nRemaining * perTriggerReserve);
  const remaining = (Number.isFinite(sweepBudgetMs) ? sweepBudgetMs : 0) - (Number.isFinite(elapsedMs) ? elapsedMs : 0) - reserve;
  let eff = Math.min(t, Math.max(0, remaining));
  // the horizon runs from tClick, so only the part past the legacy window is phase-B spend — clamp that
  // part to what the pool has left.
  const pool = Number.isFinite(phaseBPoolMs) ? Math.max(0, phaseBPoolMs) : Infinity;
  eff = Math.min(eff, mw + pool);
  return eff > mw ? eff : 0;
}

module.exports = { detectStatusMessages, effectiveTimelineMs };
