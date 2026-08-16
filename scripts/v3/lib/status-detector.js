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
  }, maxTriggers, XPATH_FN).catch(() => ({ xpaths: [], total: 0 }));
  const xpaths = enumed.xpaths;

  // PASS 2 (one isolated evaluate per trigger): drive it, observe the change, judge soundly.
  const findings = [];
  const observations = [];   // per-trigger RECORD of what activation did (never a verdict) — see the in-page comment
  // TOTAL WALL-CLOCK BUDGET for the sweep. The per-trigger observation window had to grow from a flat 300 ms
  // to a 2500 ms quiescence wait (multi-phase status flows settle at 1400-1800 ms and the short window was
  // recording phase 1 as the outcome). Left unbounded that is 25 triggers x 2.5 s, which pushed the whole
  // instruments lane past the orchestrator's 90 s cap — measured directly: a 2.1.2 modal page came back with
  // its tab order salvaged and ZERO findings, because the lane never reached the trap detectors. So: bound
  // the sweep, and report the truncation rather than letting it eat the lanes that run after it.
  const sweepBudgetMs = Number.isFinite(opts.sweepBudgetMs) ? opts.sweepBudgetMs : LIMITS.instruments.statusSweepMs;
  const sweepStart = Date.now();
  let budgetExhausted = false, probed = 0;
  for (const xp of xpaths) {
    if (Date.now() - sweepStart > sweepBudgetMs) { budgetExhausted = true; break; }
    probed++;
    let res;
    try {
      res = await page.evaluate(async (xp, settleMs, minTextLen, XPATH_SRC, maxWaitMs) => {
        eval(XPATH_SRC); // eslint-disable-line no-eval
        const LIVE = '[aria-live="polite"],[aria-live="assertive"],[role="status"],[role="alert"],[role="log"],[role="alertdialog"],output';
        const toEl = (n) => { while (n && n.nodeType !== 1) n = n.parentNode; return n; };
        const inLiveRegion = (n) => { const e = toEl(n); return !!(e && e.closest && e.closest(LIVE)); };
        const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
        const trig = document.evaluate(xp, document, null, 9, null).singleNodeValue;
        if (!trig) return { finding: null };

        // snapshot what is ALREADY on the page, so re-parenting / revealing pre-existing visible content
        // is not mistaken for a NEW status message (adversarial B-HIGH-3).
        const beforeText = norm(document.body.innerText).toLowerCase();
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
          el: e, text: norm(e.textContent),
          politeness: (e.getAttribute('aria-live') || (e.getAttribute('role') === 'alert' || e.getAttribute('role') === 'alertdialog' ? 'assertive' : 'polite')).toLowerCase(),
          atomic: e.getAttribute('aria-atomic') === 'true',
        }));
        const liveBeforeSet = new Set(liveBefore.map((r) => r.el));
        const added = [];
        const removedTexts = [];      // text that LEFT the page — a removal is a status change too
        // Every mutation is TIMESTAMPED because the two channels need different windows. The barrier
        // channel keeps its original short window: it was adversarially tuned there and widening it makes
        // it fire on ordinary primary content that lands after an async round-trip (search RESULTS are not
        // a status message). The observation channel needs the whole multi-phase flow. One observer, two
        // views — so the barrier channel's behaviour is unchanged by this addition.
        const tClick = Date.now();
        const obs = new MutationObserver((muts) => {
          const at = Date.now();
          for (const m of muts) {
            if (m.type === 'childList') {
              // `inLive` is captured HERE, while the node is attached. Reading it later is unsound: a
              // status message that is added and then REMOVED is detached by the time the window closes,
              // so `closest()` returns null and the message reads as "outside any live region" — a false
              // barrier on exactly the progress-message pattern that prompted the longer window.
              for (const n of m.addedNodes) { const t = norm(n.textContent); if (t) added.push({ node: n, text: t, at, inLive: inLiveRegion(n) }); }
              for (const n of m.removedNodes) { const t = norm(n.textContent); if (t) removedTexts.push({ text: t, at, fromLive: !!(m.target && m.target.closest && m.target.closest(LIVE)) }); }
            } else if (m.type === 'characterData') {
              const t = norm(m.target.textContent); if (t) added.push({ node: m.target, text: t, at, inLive: inLiveRegion(m.target) });
            }
          }
        });
        obs.observe(document.body, { childList: true, subtree: true, characterData: true });
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
            if (added.length + removedTexts.length > 0) sawActivity = true;
            else if (!sawActivity && Date.now() - t0 >= settleMs * 2) break;
          }
        } finally {
          document.removeEventListener('submit', onSubmit, true);
        }
        obs.disconnect();

        // BARRIER-CHANNEL WINDOW — the original `settleMs` slice only. See the observer comment above.
        const inBarrierWindow = (a) => !Number.isFinite(a.at) || a.at - tClick <= settleMs;
        let msgs = added.filter((a) => inBarrierWindow(a) && a.text.length >= minTextLen
          && a.node !== trig && !(trig.contains && trig.contains(a.node))
          && !beforeText.includes(a.text.toLowerCase())); // genuinely NEW text, not pre-existing/relocated
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
          && !beforeText.includes(a.text.toLowerCase())
          && !isDisclosureReveal(a.node));
        const liveNow = [...document.querySelectorAll(LIVE)];
        // A region that did not exist before the click and arrived carrying text: an AT observes live
        // regions that were in the tree when the change happened, so a region INSERTED together with its
        // message announces nothing. This is the `after-the-fact-live-region-timing` family (5 cases) —
        // structurally invisible to a detector that only asks "is the text inside a live region".
        const bornWithContent = liveNow
          .filter((e) => !liveBeforeSet.has(e) && norm(e.textContent).length >= minTextLen)
          .map((e) => ({ xpath: getXPath(e), text: norm(e.textContent).slice(0, 80), politeness: (e.getAttribute('aria-live') || (/^alert/.test(e.getAttribute('role') || '') ? 'assertive' : 'polite')).toLowerCase() }));
        // A PRE-EXISTING region whose content changed — the healthy shape. Politeness/atomic ride along so
        // the rubric can judge urgency (`wrong-live-region-politeness`) and partial reads (aria-atomic).
        const updatedRegions = liveBefore
          .filter((r) => norm(r.el.textContent) !== r.text)
          .map((r) => ({ xpath: getXPath(r.el), before: r.text.slice(0, 80), after: norm(r.el.textContent).slice(0, 80), politeness: r.politeness, atomic: r.atomic,
            emptied: r.text.length > 0 && norm(r.el.textContent).length === 0 }));
        // Text REMOVED from the page. WCAG's Understanding treats a status message as content that
        // "communicates a change in state" — the disappearance of "3 items in cart" or of an error is such
        // a change, and an AT is told nothing by a removal. Recorded, never decided: a self-dismissing toast
        // is a removal that conveys nothing, and only the rubric can tell the two apart.
        // A removal counts if the text was ON SCREEN at some point — either before the click, or added
        // during this observation. Requiring only the former dropped the very shape this is here for: a
        // progress message is ADDED and then REMOVED inside the same window ("Searching the catalog…"),
        // and the user is told nothing when it goes.
        const addedTextSet = new Set(added.map((a) => a.text.toLowerCase()));
        const removed = removedTexts
          .filter((r) => r.text.length >= minTextLen
            && (beforeText.includes(r.text.toLowerCase()) || addedTextSet.has(r.text.toLowerCase())))
          .slice(0, 6).map((r) => ({ text: r.text.slice(0, 80), fromLiveRegion: r.fromLive, appearedThenRemoved: !beforeText.includes(r.text.toLowerCase()) }));
        const observation = {
          trigger: getXPath(trig), triggerLabel: trigLabel,
          addedOutsideLiveRegion: obsMsgs.filter((a) => a.inLive !== true).slice(0, 4).map((a) => a.text.slice(0, 80)),
          addedInsideLiveRegion: obsMsgs.filter((a) => a.inLive === true).slice(0, 4).map((a) => a.text.slice(0, 80)),
          regionsBornWithContent: bornWithContent.slice(0, 4),
          regionsUpdated: updatedRegions.slice(0, 4),
          removedText: removed,
          liveRegionCountBefore: liveBefore.length, liveRegionCountAfter: liveNow.length,
          focusMoved: document.activeElement !== focusBefore,
        };
        const nothingHappened = !observation.addedOutsideLiveRegion.length && !observation.addedInsideLiveRegion.length
          && !bornWithContent.length && !updatedRegions.length && !removed.length;

        if (!msgs.length) return { finding: null, observation: nothingHappened ? null : observation }; // nothing new appeared (or only disclosure/tab content) → not a status (sound)
        if (msgs.some((a) => a.inLive === true)) return { finding: null, observation }; // announced via a live region (membership read AT MUTATION TIME — see the observer)
        const focusEl = document.activeElement;
        const focusMovedToMsg = focusEl && focusEl !== focusBefore && msgs.some((a) => { const e = toEl(a.node); return e && (e === focusEl || e.contains(focusEl) || (focusEl.contains && focusEl.contains(e))); });
        if (focusMovedToMsg) return { finding: null, observation }; // perceivable: focus moved into the new content

        const target = toEl(msgs[0].node) || trig;
        return { observation, finding: {
          sc: '4.1.3', kind: 'status-not-announced',
          xpath: getXPath(target), trigger: getXPath(trig),
          detail: `activating ${JSON.stringify(norm(trig.innerText || trig.textContent).slice(0, 40))} added new visible text that is NOT in a live region and did NOT move focus — a screen-reader user is not notified (message: ${JSON.stringify(msgs[0].text.slice(0, 60))})`,
        } };
      }, xp, settleMs, minTextLen, XPATH_FN, maxWaitMs);
    } catch (e) { break; } // the page navigated / context was destroyed — keep the findings gathered so far
    if (res && res.finding) findings.push(res.finding);
    if (res && res.observation) observations.push(res.observation);
  }
  // A4: report coverage honestly — how many triggers were probed, whether the cap truncated the sweep, and
  // that this instrument only sees INSERTED status (not hidden/display toggles on pre-rendered nodes).
  const coverageTruncated = enumed.total > probed;
  // Report coverage honestly: how many triggers were probed, whether the CAP truncated the enumeration, and
  // whether the wall-clock BUDGET cut the sweep short. `probed` is the count actually driven, which is what a
  // downstream "absence != pass" reader needs — not the length of the list we intended to drive.
  return { findings, observations, coverageMode: 'insertion-and-removal', triggersProbed: probed, triggersTotal: enumed.total, coverageTruncated, budgetExhausted, unprobedTriggers: Math.max(0, enumed.total - probed) };
}

module.exports = { detectStatusMessages };
