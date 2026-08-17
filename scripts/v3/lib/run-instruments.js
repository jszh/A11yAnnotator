'use strict';
// Harness 3.0 — INSTRUMENT findings stage. Runs the hardened VSR + keyboard instrument detectors against
// a page and emits page-level accessibility FINDINGS. The VSR/keyboard are INSTRUMENTS the harness uses
// to assess the page (memory: vsr-is-harness-instrument). These findings are NON-AUTHORITATIVE shadow
// signals — they never clear/barrier an obligation and never publish authoritative. They are recorded
// for offline scoring against the hand-labeled ground truth (memory: ground-truth-hand-labeled-after-
// harness) and would earn authority only after calibration, exactly like the Phase-3 judgment
// recommendations. Detectors: reading order (1.3.2), announcement-vs-meaning (4.1.2), tab order (2.4.3),
// keyboard traps (2.1.2), and VSR navigation traps. All were adversarially hardened for soundness.
const { collectVsrTranscript } = require('./vsr-collect.js');
const { analyzeTranscript } = require('./vsr-analysis.js');
const { collectTabOrder, tabOrderFindings, redundantStopFacts, collectRevealedFocusOrder, detectKeyboardTraps, detectFocusRetentionTraps, detectFixedSetConfinementTraps, detectFocusRejection, detectFocusRestsInAriaHidden, detectEmbeddedFormatTraps } = require('./kbd-graph.js');
const { vsrNavigationIntegrity } = require('./vsr-graph.js');
const { detectStatusMessages } = require('./status-detector.js');

const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// VERIFIED RESTORE after the reveal-state pass activated a control. The old form was a bare
// `page.goto(url).catch(() => {})`: a reload that FAILED — a goto timeout is the ordinary failure under lane
// concurrency — was indistinguishable from one that worked, and every detector below then ran against an
// opened dialog while the artifact claimed a page at rest. So: reload, PROVE it, retry once, and hand the
// caller the proof. The proof is the pass's own markers (`data-v3-revopener` / `-revregion` / `-revfocus` /
// `-revhidden`): a real document load wipes every one of them, so their survival is positive evidence that
// the page in front of us is still the one the pass left behind.
async function restoreLoadedPage(page, opts, installAriaNotifySpy) {
  const url = opts.url;
  const markerSel = require('./kbd-graph.js').REVEAL_MARKER_SEL;
  let error = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      await page.goto(url, { waitUntil: 'load', timeout: opts.gotoTimeoutMs || 30000 });
      await require('./settle.js').awaitSettle(page).catch(() => {});
    } catch (e) { error = 'reload: ' + String((e && e.message) || e).slice(0, 160); continue; }
    // `null` from the probe means the question could not even be ASKED (detached context) — which is not
    // proof of restoration, so it fails closed exactly like a surviving marker.
    const clean = await page.evaluate((sel) => !!document.body && document.querySelectorAll(sel).length === 0, markerSel).catch(() => null);
    if (clean === true) {
      await installAriaNotifySpy();   // an in-page wrapper does not survive the load it just did
      return { ok: true, error: null };
    }
    error = clean === false
      ? 'the reveal pass\'s in-page markers survived the reload, so the document was never replaced'
      : 'the restored page could not be inspected (detached execution context)';
  }
  return { ok: false, error };
}

// ── DOCUMENT-START LIVE-REGION BIRTH OBSERVER (residual RCA S10, the after-the-fact family) ────────────
// Everything else in this file reads the page AFTER load, so it is structurally blind to the one fact the
// after-the-fact 4.1.3 shapes turn on: whether a live region EXISTED (and was empty) BEFORE it received its
// content. A region mounted after load with its message pre-filled — or an element wired live only after its
// text was already set — announces nothing on many AT, and by collect time it can even have removed itself.
// This recorder is installed via page.evaluateOnNewDocument (the same page-init channel the probe tooling
// uses), runs from document-start on EVERY new document on the page (so the reveal pass's restore reload
// re-arms it), and only ever RECORDS: per live region, when it entered the tree, whether it was empty at
// birth, when it first received content, and when (if ever) it was removed.
function liveRegionBirthInit() {
  if (window.__v3LiveBirth) return;
  // `harnessActiveAtMs` is the HARNESS-INTERACTION BOUNDARY (soundness probe 2026-08-17): the lane stamps
  // it (earliest wins — see markLiveBirthHarnessActive) just before its first click-driving pass, so a
  // birth recorded after the stamp is attributable to the harness's own activity, not to the page. Without
  // it, a toast mounted by the status sweep's OWN click was recorded as a spontaneous post-load birth and
  // reviewed as "appeared with no user action at all" — a fabricated 4.1.3 signal.
  const rec = { regions: [], truncated: false, loadAtMs: null, harnessActiveAtMs: null };
  window.__v3LiveBirth = rec;
  const MAX = 40;
  const LIVE = '[aria-live],[role="status"],[role="alert"],[role="log"],[role="alertdialog"],output';
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const now = () => Math.round(performance.now());
  const xp = (e) => {
    try {
      if (!e || !e.tagName) return '';
      if (e === document.body) return '/html/body';
      if (e === document.documentElement) return '/html';
      const t = e.tagName.toLowerCase();
      let i = 1, s = e.previousElementSibling;
      while (s) { if (s.tagName === e.tagName) i++; s = s.previousElementSibling; }
      return xp(e.parentElement) + '/' + t + '[' + i + ']';
    } catch (err) { return ''; }
  };
  const seen = new WeakSet();
  const record = (el, via) => {
    if (!el || seen.has(el)) return; seen.add(el);
    if (rec.regions.length >= MAX) { rec.truncated = true; return; }
    const text = norm(el.textContent);
    const entry = {
      xpath: xp(el), role: el.getAttribute('role') || null, ariaLive: el.getAttribute('aria-live') || null,
      atMs: now(), via,
      duringInitialParse: document.readyState === 'loading',
      mountedAfterLoad: document.readyState === 'complete',
      emptyAtBirth: text.length === 0, textAtBirth: text.slice(0, 80),
      firstContentAtMs: text.length ? now() : null, removedAtMs: null,
    };
    // birth AFTER the harness started clicking ⇒ attributed to the harness, never to the page. The entry
    // stays in the artifact (tagged) so the evidence is complete; birthFindingsFrom emits no row for it.
    if (rec.harnessActiveAtMs != null) entry.harnessInteraction = true;
    rec.regions.push(entry);
    try { el.__v3BirthEntry = entry; } catch (err) {}
  };
  const scanIn = (n) => {
    if (!n || n.nodeType !== 1) return;
    try { if (n.matches && n.matches(LIVE)) record(n, 'mount'); } catch (err) {}
    try { if (n.querySelectorAll) for (const e of n.querySelectorAll(LIVE)) record(e, 'mount'); } catch (err) {}
  };
  const scanOut = (n) => {
    if (!n || n.nodeType !== 1) return;
    const list = [];
    try { if (n.matches && n.matches(LIVE)) list.push(n); } catch (err) {}
    try { if (n.querySelectorAll) list.push(...n.querySelectorAll(LIVE)); } catch (err) {}
    const t = now();
    for (const e of list) { const en = e.__v3BirthEntry; if (en && en.removedAtMs == null) en.removedAtMs = t; }
  };
  const mo = new MutationObserver((muts) => {
    for (const m of muts) {
      if (m.type === 'childList') {
        for (const n of m.addedNodes) scanIn(n);
        for (const n of m.removedNodes) scanOut(n);
      } else if (m.type === 'attributes') {
        // an element WIRED live after the fact (role/aria-live added later) — recorded with its text state
        // at wiring time, which is the whole point: live semantics added onto already-set content.
        const el = m.target;
        try { if (el && el.nodeType === 1 && el.matches && el.matches(LIVE) && !seen.has(el)) record(el, 'attribute-wired'); } catch (err) {}
      }
      if (m.type !== 'attributes') {
        // first content into a recorded-empty region: the healthy existed-empty-then-filled shape.
        const host = m.target && (m.target.nodeType === 1 ? m.target : m.target.parentElement);
        try {
          const r = host && host.closest ? host.closest(LIVE) : null;
          const en = r && r.__v3BirthEntry;
          if (en && en.firstContentAtMs == null) {
            const t2 = norm(r.textContent);
            if (t2) { en.firstContentAtMs = now(); en.firstContentText = t2.slice(0, 80); }
          }
        } catch (err) {}
      }
    }
  });
  try { mo.observe(document, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ['aria-live', 'role'] }); } catch (err) {}
  addEventListener('load', () => { rec.loadAtMs = now(); }, { once: true });
  // regions in the initial markup stream in as parser childList additions; a UA that batched any before the
  // observer attached is covered by one catch-up scan.
  addEventListener('DOMContentLoaded', () => { try { scanIn(document.documentElement); } catch (err) {} }, { once: true });
}

// Register the recorder on the page. Returns the registration (for removeScriptToEvaluateOnNewDocument
// cleanup where the Puppeteer build supports it) or null when registration failed — never throws.
async function installLiveRegionBirthObserver(page) {
  try { return await page.evaluateOnNewDocument(liveRegionBirthInit); } catch (e) { return null; }
}

// Stamp the HARNESS-INTERACTION BOUNDARY into the CURRENT document's recorder — earliest wins, so calling
// it before every click-driving pass costs nothing and never moves an already-set mark. The lane calls it
// immediately before the reveal-state focus pass activates an opener and immediately before the 4.1.3
// status sweep starts clicking triggers; a navigation wipes the mark WITH the recorder, which is correct
// (a freshly loaded document has seen no interaction yet, so its spontaneous births are genuine).
// Never throws; a page without the recorder is a no-op.
async function markLiveBirthHarnessActive(page) {
  await page.evaluate(() => {
    const rec = window.__v3LiveBirth;
    if (rec && rec.harnessActiveAtMs == null) rec.harnessActiveAtMs = Math.round(performance.now());
  }).catch(() => {});
}

// Read the recorder's state. Null when the recorder was never installed (a bare runInstruments() on an
// already-loaded page cannot observe pre-load state, and null says so rather than claiming "no births").
// BOUNDED TOP-UP: a page that has already mounted a live region after load may be mid-flow (the
// mount-announce-self-remove shape), so the read holds open to the watch horizon — gated on an observed
// post-load birth precisely so a static page never pays a millisecond for it.
async function readLiveRegionBirths(page, opts = {}) {
  const snap = () => page.evaluate(() => {
    const rec = window.__v3LiveBirth;
    if (!rec) return null;
    return { installed: true, documentAgeMs: Math.round(performance.now()), loadAtMs: rec.loadAtMs, truncated: !!rec.truncated,
      harnessActiveAtMs: rec.harnessActiveAtMs == null ? null : rec.harnessActiveAtMs,
      regions: rec.regions.map((r) => ({ ...r })) };
  }).catch(() => null);
  let out = await snap();
  if (!out) return null;
  const watchMs = Number.isFinite(opts.birthWatchMs) ? opts.birthWatchMs : 8500;
  // the top-up holds the page open ONLY for a birth the PAGE produced. A harnessInteraction-tagged birth is
  // the lane's own click echoing back — paying up to 7 s to watch our own toast finish is budget spent on
  // manufactured evidence (soundness probe 2026-08-17).
  if (out.documentAgeMs < watchMs && out.regions.some((r) => r.mountedAfterLoad === true && r.harnessInteraction !== true)) {
    await new Promise((r) => setTimeout(r, Math.min(watchMs - out.documentAgeMs, 7000)));
    out = (await snap()) || out;
  }
  return out;
}

// Birth facts → REVIEW findings (never a barrier: whether anything was owed an announcement is the rubric's
// call). Pure — exported for unit tests. Only the two suspicious shapes produce a row; the healthy
// existed-empty-then-filled shape stays evidence-only on the liveRegionBirths artifact.
function birthFindingsFrom(births) {
  const rows = [];
  for (const r of ((births && Array.isArray(births.regions)) ? births.regions : [])) {
    if (rows.length >= 6) break;
    // a birth the HARNESS caused (recorded after the interaction boundary — see markLiveBirthHarnessActive)
    // is evidence about the lane's own clicks, not about the page at rest: it stays in the artifact,
    // tagged, and never becomes a review row. The activation sweep's own observation channel already
    // covers what a CLICK-triggered region does.
    if (r.harnessInteraction === true) continue;
    const bornFilled = r.mountedAfterLoad === true && r.emptyAtBirth === false;
    const wiredOntoContent = r.via === 'attribute-wired' && r.emptyAtBirth === false;
    if (!bornFilled && !wiredOntoContent) continue;
    rows.push({
      sc: '4.1.3', kind: 'live-region-birth', xpath: r.xpath || null, review: true,
      detail: (bornFilled
        ? 'a live region was INSERTED into the document after load already carrying its message'
        : 'an element already carrying text was WIRED as a live region after load (live semantics added onto existing content)')
        + ' — an AT observes live regions that existed BEFORE their content changed, so a region born (or wired) together with its message may announce nothing'
        + (Number.isFinite(r.removedAtMs) ? '; it later REMOVED ITSELF from the document, so the message may also never be readable on demand' : '')
        + '. This is a page-init OBSERVATION, not a verdict — whether an announcement was owed and delivered is the rubric\'s call.',
    });
  }
  return rows;
}

// Flatten the detector's per-trigger colour deltas into the ONE instrument fact the use-of-color lane will
// be routed (each delta stamped with the trigger that produced it). Pure — exported for unit tests.
function colourDeltasFrom(statusTimelines) {
  const out = [];
  for (const t of (Array.isArray(statusTimelines) ? statusTimelines : [])) {
    for (const d of (t && Array.isArray(t.colourStateDeltas) ? t.colourStateDeltas : [])) {
      out.push({ trigger: (t && t.trigger) || null, ...d });
    }
  }
  return out;
}

// Run every instrument against an already-loaded Puppeteer page. Returns { findings: [...] }.
async function runInstruments(page, opts = {}) {
  const findings = [];
  // `partialSink` (residual RCA S5) mirrors each finding out as soon as it is produced, so the caller's
  // wall-clock guard can return WHAT WAS ALREADY MEASURED instead of an empty bundle. Instruments are
  // non-authoritative, so a partial set is always safe — it can only forgo a catch, never assert one.
  const publish = () => { if (opts.partialSink) opts.partialSink.findings = findings.slice(); };
  // COLLECTOR LIVENESS. Every detector below is invoked as `await detect…(page).catch(() => null)`, and a
  // null is then read as "this detector found nothing" — which is exactly what a detector that DIED also
  // looks like. On non-authoritative shadow signals that reads through as "absence ⇒ pass", the failure mode
  // this campaign keeps rediscovering (collect-colour-peers' lost export, reflow's cross-scope helper, the
  // reveal pass's unverified restore). The guard below keeps the swallow — a dead instrument must never end
  // the lane — but RECORDS it, so the artifact says "this detector threw" instead of nothing at all.
  const collectorLiveness = [];
  const guard = async (phase, p) => {
    try { return await p; }
    catch (e) { collectorLiveness.push({ phase, where: phase, error: String((e && e.message) || e).slice(0, 200) }); return null; }
  };
  const add = (detector, list) => { for (const f of (list || [])) { const row = { detector, sc: f.sc || '', kind: f.kind, xpath: f.xpath || null, detail: f.detail || '', review: !!f.review }; if (f.calibrated === false) row.calibrated = false; if (Array.isArray(f.memberXpaths)) row.memberXpaths = f.memberXpaths; if (Number.isFinite(f.setSize)) row.setSize = f.setSize; findings.push(row); } publish(); };

  // #21 NATIVE DIALOG capture: Puppeteer auto-DISMISSES native alert()/confirm()/prompt() when no listener
  // is attached, so a page that surfaces validation/confirmation text via a native dialog goes invisible to
  // the DOM observers (3.3.1/3.3.3) and is unannounced in the ARIA model (4.1.3). We listen, RECORD the
  // message+type, then dismiss so the instrument run continues. These fire during the action-driving
  // instruments below (status-detector clicks); captured page-level.
  const nativeDialogs = [];
  const onDialog = async (d) => { try { nativeDialogs.push({ type: d.type(), len: (d.message() || '').length }); } finally { try { await d.dismiss(); } catch (e) {} } };
  page.on('dialog', onDialog);
  // #22 ariaNotify SPY: element.ariaNotify()/document.ariaNotify() delivers an AT announcement with NO DOM
  // footprint — invisible to the mutation-based status detector. We wrap it (where the UA exposes it) so a
  // genuine announcement is CREDITED, not false-flagged as a 4.1.3 barrier. NOTE: the project Chrome build
  // already ships these as functions, so this spy is LIVE here (the typeof guards keep it inert only on a UA
  // that lacks the API); the sentinel + try/catch make it safe and non-double-wrapping (adversarial verify #5).
  // Factored out because the reveal-state pass RELOADS the page, which wipes an in-page wrapper — a spy that
  // is not re-installed after that reload silently stops crediting announcements for the rest of the lane.
  const installAriaNotifySpy = () => page.evaluate(() => {
    if (window.__v3ariaNotify) return; window.__v3ariaNotify = [];
    const rec = (msg) => { try { window.__v3ariaNotify.push({ len: String(msg == null ? '' : msg).length }); } catch (e) {} };
    try {
      if (typeof Element !== 'undefined' && Element.prototype && typeof Element.prototype.ariaNotify === 'function') {
        const orig = Element.prototype.ariaNotify;
        Element.prototype.ariaNotify = function (msg, opts) { rec(msg); return orig.call(this, msg, opts); };
      }
      if (typeof document !== 'undefined' && typeof document.ariaNotify === 'function') {
        const od = document.ariaNotify.bind(document);
        document.ariaNotify = (msg, opts) => { rec(msg); return od(msg, opts); };
      }
    } catch (e) {}
  }).catch(() => {});
  await installAriaNotifySpy();

  // VSR transcript → reading order (1.3.2) + announcement-vs-meaning (4.1.2)
  const transcript = await guard('vsr.transcript', collectVsrTranscript(page, opts));
  if (transcript && transcript.ok) {
    const an = analyzeTranscript(transcript);
    add('vsr-reading-order', an.readingOrder);
    add('vsr-meaning', an.meaning);
    add('vsr-meaning', an.meaningReview);
  }
  // keyboard tab order (2.4.3). The SEQUENCE — not just the derived divergence findings — is the
  // evidence focus-order-meaning-v0 is written around ("the recorded tab-order SEQUENCE from the
  // deterministic instrument … Judge meaning over these"). Until 2026-08-15 only
  // `tabOrderFindings(tab).findings` was kept and `tab.order` was dropped on the next line, so the
  // rubric was promised an artifact it never received and correctly abstained: 17 of 24 2.4.3 misses
  // were PARTIAL, and the SC scored 20.0% — the worst in the run — as a pure evidence gap.
  // Backward (Shift+Tab) matters independently: a one-way escape reads as a clean ring forward.
  // COLLECTOR LIVENESS (2026-08-16). `collectTabOrder` guards its two in-page `probeActive` evaluates with
  // `.catch(() => ({ sentinel: true }))`, and a sentinel is READ AS A DOCUMENT-BOUNDARY CROSSING rather than
  // as an error — so a dead probe does not produce an empty ring, it produces a plausible WRONG one. It now
  // records what it swallowed (fallback values unchanged); collect it here so the failure is visible in the
  // artifact instead of only in a live console. Surfaced on the instruments artifact as `collectorLiveness`,
  // matching the field act-page-collect publishes on the collect artifact.
  const tab = await guard('tabOrder.forward', collectTabOrder(page));
  if (tab && Array.isArray(tab.liveness)) collectorLiveness.push(...tab.liveness.map((l) => ({ ...l, phase: 'tabOrder.forward' })));
  const tabFindings = tab ? tabOrderFindings(tab).findings : [];
  if (tab) add('tab-order', tabFindings);
  const tabBack = await guard('tabOrder.backward', collectTabOrder(page, { backward: true }));
  if (tabBack && Array.isArray(tabBack.liveness)) collectorLiveness.push(...tabBack.liveness.map((l) => ({ ...l, phase: 'tabOrder.backward' })));
  // VISUAL-ORDER DIVERGENCE, threaded to the stop it is ABOUT. `tabOrderFindings` already runs the
  // column-aware divergence detector over this very ring and emits one uncalibrated-triage finding per
  // stop that is reached out of its own column's visual order — and until now every one of them was
  // dropped into `findings` and never reached the rubric that is written around this artifact. That is a
  // measured recall loss: the detector separates a systematic column-by-column walk of a 2-D arrangement
  // (no findings — the Understanding blesses either whole-row or whole-column traversal) from a scatter
  // that follows neither (findings on most of its stops), which is exactly the discrimination the judge
  // was being asked to make by eye. It rides as `visualOrderDivergence` on the stop, tagged as triage.
  const divergenceByXpath = {};
  for (const f of tabFindings) { if (f && f.xpath && !divergenceByXpath[f.xpath]) divergenceByXpath[f.xpath] = f.detail || ''; }
  // REDUNDANT / MEANINGLESS STOP facts (2.4.3), a pure function of the ring — see kbd-graph.
  const redundant = tab ? redundantStopFacts(tab) : {};
  // Keep the stops small and judgeable: xpath + label + rect are what relate a stop to the layout.
  const seq = (t, decorate) => (t && Array.isArray(t.order) ? t.order.map((o, i) => ({
    index: Number.isFinite(o.index) ? o.index : i,
    xpath: o.xpath || null, tag: o.tag || null, label: o.label || null, rect: o.rect || null,
    // modal-containment facts (2.4.3 clause C): a stop with modalOpen but insideOpenModal:false is a
    // tab stop OUTSIDE an open modal — a containment leak, decidable without rect geometry.
    ...(o.modalOpen ? { modalOpen: true, insideOpenModal: o.insideOpenModal === true, modalXpath: o.modalXpath || null } : {}),
    ...(decorate && divergenceByXpath[o.xpath] ? { visualOrderDivergence: divergenceByXpath[o.xpath] } : {}),
    ...(decorate && redundant[o.xpath] ? redundant[o.xpath] : {}),
  })) : []);
  const tabOrder = tab ? {
    forward: seq(tab, true), backward: seq(tabBack, false),
    wrapped: !!tab.wrapped, exhausted: !!tab.exhausted, count: tab.count || seq(tab).length,
    backwardWrapped: tabBack ? !!tabBack.wrapped : null,
    // whether index 0 is genuinely the FIRST tab stop, or merely where the ring happened to be entered
    // (an open modal makes body.focus() inert — see collectTabOrder). The rubric must not read an
    // unanchored index 0 as "focus starts here".
    startAnchored: tab.startAnchored !== false,
  } : null;
  // PUBLISH-AS-YOU-GO (residual RCA S5): the orchestrator races this whole stage against a 90 s wall-clock
  // cap and, on expiry, substitutes an EMPTY bundle — discarding a tab order that was already in hand.
  // Measured at 67/392 = 17.1% of a corpus run, and it landed exactly where it hurts: 2.4.3 recall was 0%
  // on timed-out pages against 54% elsewhere. Hand each artifact to the sink the moment it exists so the
  // timeout downgrades the stage to PARTIAL instead of to NOTHING.
  if (opts.partialSink) { opts.partialSink.tabOrder = tabOrder; opts.partialSink.findings = findings.slice(); if (collectorLiveness.length) opts.partialSink.collectorLiveness = collectorLiveness.slice(); }
  // ── REVEAL-STATE FOCUS ORDER (2.4.3 / F85). The resting ring above is the only state anything measured,
  // and a panel that is display:none at rest contributes no stops to it — so every reveal-order failure was
  // structurally invisible. `collectRevealedFocusOrder` activates the page's DECLARED reveal openers and
  // records the opened-state ring plus what happens on dismissal.
  //
  // PLACEMENT is deliberate and load-bearing. This sits immediately after the tab-order publish and BEFORE
  // the trap detectors and the 4.1.3 sweep, for two reasons: the lane's wall-clock cap fires on ~17% of a
  // corpus run, and it cuts whatever is at the END (the existing bounded reveal pass for 2.1.2 lives there
  // and is duly cut); and the resting ring this pass diffs against has just been collected on this same
  // load, so it can be handed over instead of re-walked. The pass RELOADS, so the ariaNotify spy is
  // re-installed and the page is returned to a clean load before the read-only detectors below continue —
  // which is the state they used to see anyway (nothing before this point activates anything).
  if (tab && tabOrder && opts.url && opts.revealFocusPass !== false) {
    const before = Date.now();
    // PROGRESS SINK, not the return value, is what decides the restore. `rev` is null on a rejection, and the
    // one fact the restore turns on — "an opener was clicked" — used to travel ONLY inside `rev`, so the throw
    // path skipped cleanup on exactly the runs that went wrong. `progress` is mutated in place inside the pass
    // before each irreversible step, so it survives whatever the pass does next.
    const progress = {};
    let revealError = null;
    // HARNESS-INTERACTION BOUNDARY: the reveal pass is the lane's FIRST click-driving step, so stamp the
    // birth recorder before it — a live region its opener click mounts must read as harness-caused, not as
    // a spontaneous post-load birth (this matters on the restore-failed path, where the clicked document is
    // the one the births are later read from).
    await markLiveBirthHarnessActive(page);
    const rev = await collectRevealedFocusOrder(page, opts.url, {
      restingXpaths: (tab.order || []).map((o) => o.xpath),
      maxOpeners: Number.isFinite(opts.maxRevealOpeners) ? opts.maxRevealOpeners : 2,
      gotoTimeoutMs: opts.gotoTimeoutMs,
      pageIsFresh: true,           // only Tab presses have touched this load
      progress,
    }).catch((e) => { revealError = String((e && e.message) || e).slice(0, 200); return null; });
    if (rev && rev.states && rev.states.length) {
      tabOrder.revealedStates = rev.states;
      // Bind each state to the STOP whose control produces it. The opener is an ordinary tab stop, so this
      // is where the fact belongs — and it is the only per-stop channel the judging subject carries, so a
      // page-level side-car would be dropped before the prompt.
      const byOpener = {};
      for (const st of rev.states) if (st && st.openerXpath) byOpener[st.openerXpath] = st;
      for (const stop of tabOrder.forward) {
        const st = byOpener[stop.xpath];
        if (st) stop.reveal = st;
      }
      if (opts.partialSink) opts.partialSink.tabOrder = tabOrder;
    }
    // RESTORE whenever an opener was ATTEMPTED — not only when one yielded a usable state. An opener that
    // was clicked and then abandoned (it navigated, revealed nothing, or threw) leaves the page just as
    // dirty as one that worked, and every detector below this point assumes a page at rest. Gating the
    // restore on `states.length` would have skipped it on exactly the pages where the pass went wrong.
    //
    // …and the trigger is `progress.activated`, which is set INSIDE the pass immediately before the click,
    // so a pass that threw after activating still restores. `rev.openers > 0` is kept as a second, weaker
    // trigger: it covers a (currently impossible) future in which the pass activates without going through
    // that line, and it is the shape the tests pin.
    const mustRestore = progress.activated === true || (rev && rev.openers > 0);
    let restored = null, restoreError = null;
    if (mustRestore) restored = await restoreLoadedPage(page, opts, installAriaNotifySpy).then((r) => {
      restoreError = r.error; return r.ok;
    });
    // PROVENANCE. A lane that cannot PROVE it restored is as bad as one that did not: the reload's own error
    // was swallowed here (`.catch(() => {})`), so a restore that failed under load looked exactly like one
    // that worked, and every detector below silently ran on an opened dialog. Publish what happened —
    // `restored:false` is the signal the artifact was collected on a page this pass had activated.
    if (progress.ran) {
      tabOrder.revealPass = {
        openersFound: Number.isFinite(progress.openersFound) ? progress.openersFound : 0,
        activated: progress.activated === true,
        restoreAttempted: !!mustRestore,
        restored: mustRestore ? restored === true : null,
        ...(revealError ? { error: revealError } : {}),
        ...(restoreError ? { restoreError } : {}),
      };
      // Same channel `collectTabOrder` uses for a swallowed in-page throw: a failure that is only visible in
      // a live console is a failure nobody sees. Both conditions are silent-by-construction otherwise.
      if (revealError) collectorLiveness.push({ phase: 'revealFocusPass', where: 'collectRevealedFocusOrder', error: revealError });
      if (mustRestore && restored !== true) collectorLiveness.push({ phase: 'revealFocusPass.restore', where: 'page.goto(restore)', error: restoreError || 'the page could not be proven restored after the reveal pass activated a control; every detector below this point ran on a page that may still be in its opened state' });
    }
    tabOrder.revealPassMs = Date.now() - before;
  }
  // keyboard traps (2.1.2): confirmed (authoritative-candidate) + directional (review)
  const traps = await guard('keyboardTraps', detectKeyboardTraps(page));
  if (traps) {
    add('keyboard-trap', traps.traps.map((t) => ({ sc: t.sc, kind: 'keyboard-trap', xpath: t.regionXpath, detail: 'confirmed keyboard trap: focus cannot escape by Tab, Shift+Tab, Esc, or a Close control' })));
    add('keyboard-trap', traps.directionalTraps.map((t) => ({ sc: t.sc, kind: 'keyboard-trap-directional', xpath: t.regionXpath, detail: 'one-way keyboard trap: focus escapes in only one Tab direction', review: true })));
  }
  // self-refocus traps (2.1.2): a LONE focusable that re-grabs its own focus on blur — the region
  // detector above cannot see these (no region; its escape probe runs before the async refocus fires).
  const selfTraps = await guard('focusRetentionTraps', detectFocusRetentionTraps(page));
  if (selfTraps) add('keyboard-trap', selfTraps.traps.map((t) => ({ sc: t.sc, kind: 'keyboard-trap-self-refocus', xpath: t.xpath, detail: 'confirmed keyboard trap: this focusable re-grabs its own focus on blur, so Tab and Shift+Tab cannot move focus off it' })));
  // fixed-set CONFINEMENT traps (2.1.2): focus mutual-bounces among a small fixed set it can never LEAVE by
  // Tab/Shift+Tab/Esc — the region + self-refocus detectors miss these (no region; focus DOES move, just never out).
  const confine = await guard('confinementTraps', detectFixedSetConfinementTraps(page));
  // DEMOTED to a REVIEW signal — NOT an authoritative deterministic barrier. The held-out adversarial sweep over the
  // full 80af7b rule proved the mutual-bounce confinement detector over-fires on 4/7 PASSED cases: a trap whose only
  // exit is a NON-STANDARD key (e.g. Alt+F6) is a 2.1.2 PASS *iff the page ADVISES the user of that method*, and a
  // FAIL otherwise — yet the two are MECHANICALLY IDENTICAL (Tab/Shift+Tab/Escape all fail to exit in both). The
  // advisory is semantic; keyboard-driving cannot see it. So confinement routes to the 2.1.2 rubric (which can read
  // the page for the escape advisory), and never mints a barrier on its own. The SOUND deterministic catch is the
  // self-refocus detector above (focus returns to the SAME element ⇒ inescapable regardless of any advisory).
  // FAN OUT over the WHOLE confined set so each member carries the review signal (de-duped; lone-anchor fallback).
  if (confine) {
    const confineRows = [];
    for (const t of (confine.traps || [])) {
      const members = (Array.isArray(t.memberXpaths) && t.memberXpaths.length) ? t.memberXpaths : [t.xpath];
      const seen = new Set();
      for (const xpath of members) {
        if (!xpath || seen.has(xpath)) continue; seen.add(xpath);
        // PROMOTABLE only when the detector confirmed a LYING STATIC advisory (the page advertises a Ctrl+key exit that
        // does NOT free focus) — an unambiguous 2.1.2 barrier the keyboard driver verified. Otherwise the confinement
        // stays a REVIEW finding and ROUTES to the keyboard-trap-v0 rubric, where the REGULAR LLM judge investigates a
        // buried / non-canonical advisory (observe_state_after_activation + interact_and_observe, fresh clones).
        confineRows.push({ sc: t.sc, kind: 'keyboard-trap-confinement', detector: 'confinement', review: !t.lyingAdvisory, xpath, memberXpaths: t.memberXpaths, setSize: t.setSize, detail: t.lyingAdvisory
          ? `confirmed keyboard trap: focus is confined to a fixed set of ${t.setSize} element(s) and cannot leave by Tab, Shift+Tab, or Escape, AND the page's documented escape key does NOT free focus (a lying advisory) — a 2.1.2 barrier.`
          : `focus is confined to a fixed set of ${t.setSize} element(s) and cannot leave by Tab, Shift+Tab, or Escape. A 2.1.2 barrier UNLESS the user is told how to exit (a non-standard key, possibly behind a help control) AND that key works — verify by revealing instructions and pressing the key.` });
      }
    }
    add('keyboard-trap', confineRows);
    // ONE-WAY confinement (REVIEW, never a barrier): a forward loop that walls off later content while the
    // other direction still escapes. TT 4.C counts "restricted to a small section … no way to navigate out of
    // the loop" as a failure and lists backward navigation only as a tester workaround — but 4.C's
    // required-interaction exception (a section that genuinely requires input before releasing focus) is
    // semantic, so this routes to keyboard-trap-v0 and never mints on its own. Fan out over the members like
    // the full confinement above so the rubric gate can key on any member xpath.
    const onewayRows = [];
    for (const t of (confine.onewayTraps || [])) {
      const members = (Array.isArray(t.memberXpaths) && t.memberXpaths.length) ? t.memberXpaths : [t.xpath];
      const seenOw = new Set();
      for (const xpath of members) {
        if (!xpath || seenOw.has(xpath)) continue; seenOw.add(xpath);
        onewayRows.push({ sc: t.sc, kind: 'keyboard-trap-oneway', detector: 'confinement', review: true, xpath,
          memberXpaths: t.memberXpaths, setSize: t.setSize, direction: t.direction || 'forward',
          unreached: Array.isArray(t.unreached) ? t.unreached : [], unreachedCount: t.unreachedCount,
          detail: `focus is confined to a fixed set of ${t.setSize} element(s) in the ${t.direction || 'forward'} Tab direction only: ${t.unreachedCount} rendered focusable(s) outside the set are never reached in that direction, though focus escapes the other way. A 2.1.2 barrier UNLESS the section genuinely requires input or interaction — completable by keyboard — before allowing focus to progress, or a documented exit key works; the keyboard-trap rubric decides which.` });
      }
    }
    add('keyboard-trap', onewayRows);
  }
  // EMBEDDED-FORMAT traps (2.1.2 / F10): focus enters an <iframe>/<object>/<embed> or a shadow root and
  // cannot leave. Structurally invisible to every region detector above — their candidate regions come
  // from focusables in THIS document, and the trapping content lives in another one. Runs after the
  // region detectors (it drives Tab hard) and before the status sweep.
  const embedTraps = await guard('embeddedFormatTraps', detectEmbeddedFormatTraps(page, opts));
  if (embedTraps) {
    add('keyboard-trap', (embedTraps.traps || []).map((t) => ({
      sc: t.sc, kind: 'keyboard-trap', xpath: t.xpath,
      // A CROSS-ORIGIN embedded document cannot be counted, so its budget is a guess and the result is a
      // review signal rather than a barrier — "trapped" and "took longer than we waited" are the same
      // observation from outside.
      review: t.sameOrigin !== true,
      detail: `confirmed keyboard trap (WCAG F10): focus enters this ${t.kind} and cannot leave by Tab, Shift+Tab, or Escape`
        + (Number.isFinite(t.innerFocusables) ? ` (${t.innerFocusables} focusable element(s) inside; the walk allowed for all of them)` : ' (cross-origin — inner focusables could not be counted, so this is a REVIEW signal)'),
    })));
    add('keyboard-trap', (embedTraps.directional || []).map((t) => ({
      sc: t.sc, kind: 'keyboard-trap-directional', xpath: t.xpath, review: true,
      detail: `one-way keyboard trap: focus enters this ${t.kind} and escapes in only one Tab direction`,
    })));
  }
  // focus-rejection (2.1.1/2.4.7, F55): a control that removes its OWN focus the instant it receives it —
  // the inverse of a self-refocus trap (focus can never rest on it, so it can't be operated or shown).
  const rej = await guard('focusRejection', detectFocusRejection(page));
  if (rej) add('focus-rejection', rej.rejections.map((r) => ({ sc: r.sc, kind: 'focus-rejected-on-receipt', xpath: r.xpath, detail: `this control removes its own keyboard focus the moment it receives it (F55 onfocus→blur)${r.inlineHandler ? ' [inline onfocus/onblur handler]' : ''}; a keyboard user cannot operate it and no focus indicator can ever show (also 2.4.7)` })));
  // 6cfa84 (4.1.2): a tabbable element under an aria-hidden ANCESTOR where focus RESTS (no sentinel redirect) — the
  // AT never announces it. DYNAMIC by necessity: the rule's passed focus-sentinel is statically identical to its
  // failed barrier, so a static flag was unsound (held-out-proven). build-v3 promotes this to a 4.1.2 barrier.
  const ariaHiddenFocus = await guard('focusRestsInAriaHidden', detectFocusRestsInAriaHidden(page));
  if (ariaHiddenFocus) add('aria-hidden-focus', ariaHiddenFocus.traps.map((t) => ({ sc: t.sc, kind: 'focus-rests-in-aria-hidden', detector: 'focus-rest', xpath: t.xpath, detail: 'this focusable element sits inside an aria-hidden=true subtree and focus RESTS on it (no focus sentinel redirected away), so a keyboard user reaches a control the assistive technology never announces — no name, role, or state' })));
  // VSR navigation traps (reading-cursor cannot advance/retreat)
  const vt = await guard('vsrNavigationIntegrity', vsrNavigationIntegrity(page, opts));
  if (vt) add('vsr-trap', vt.traps);
  // 4.1.3 status messages (action→announcement). Runs LAST: it DRIVES actions (clicks), so it must
  // not perturb the read-only VSR/keyboard instruments above. Sound-first (only flags content that
  // demonstrably appeared without a live region and without focus moving to it).
  //
  // FOCUS NEUTRALISATION (2026-08-16). "It must not perturb the instruments above" was only ever half the
  // contract; nothing stopped the instruments above from perturbing IT. The sweep records, per trigger,
  // whether activation MOVED FOCUS, and the 4.1.3 rubric reads `focusMoved: true` as "a change of context ⇒
  // 4.1.3 does not apply". That fact is computed against `document.activeElement` AS THE SWEEP FINDS IT —
  // and every detector between here and the tab-order walk drives focus (detectFocusRejection focuses each
  // focusable in turn and leaves the last one focused). Measured on
  // eval/act-augmented/4.1.3/pages/is-it-a-status-message-scope-boundary/case-06: the lane hands the sweep a
  // page with focus parked on `#reserveBtn` — the trigger itself — whose handler hides the form, so focus
  // falls to <body> and `activeElement !== focusBefore` reports "focus moved" about a page where focus was
  // DESTROYED and nothing was announced. Same page, same click, pristine load ⇒ focusMoved:false; focus
  // parked on the trigger ⇒ focusMoved:true. Blur back to the state a document has at load so the
  // observation is a property of the PAGE, not of which detector happened to run last. (status-detector.js
  // separately hardens the fact itself, so a page that focuses something mid-sweep is still read correctly.)
  await page.evaluate(() => { const a = document.activeElement; if (a && a !== document.body && typeof a.blur === 'function') a.blur(); }).catch(() => {});
  // HARNESS-INTERACTION BOUNDARY for the status sweep: everything it is about to click is harness activity,
  // so births it causes must be tagged — the current document is a fresh restore (or the original load), so
  // the earliest-wins stamp lands here and every sweep-caused mount reads harnessInteraction:true.
  await markLiveBirthHarnessActive(page);
  const status = await guard('statusMessages', detectStatusMessages(page, opts));
  if (status) add('status-message', status.findings);
  // The sweep swallows two failures of its own and reports them as fields rather than throwing: a trigger
  // ENUMERATION that died (which otherwise reads as "this page has no drivable control") and a sweep that
  // ABORTED mid-way on a destroyed context. Both look exactly like "nothing to find" downstream, so they
  // ride the same liveness channel as the rest.
  if (status && status.enumError) collectorLiveness.push({ phase: 'statusMessages.enumerate', where: 'trigger enumeration', error: status.enumError });
  if (status && status.sweepAborted) collectorLiveness.push({ phase: 'statusMessages.sweep', where: `aborted after ${status.triggersProbed} of ${status.triggersTotal} trigger(s)`, error: status.sweepAborted });
  // 4.1.3 OBSERVATIONS (residual RCA S4): what each trigger actually DID, whether or not it barriered.
  // The barrier channel answers one narrow question (text appeared outside any live region) and every
  // remaining 4.1.3 failure shape lives inside a live region and fails on the announcement's ADEQUACY —
  // a region created together with its message, a message silently removed, the wrong politeness. Those
  // pages produced NO finding and were therefore cleared with no judge ever asked. These rows are
  // `review: true`: they never barrier on their own, they exist so the page carries an obligation and the
  // rubric gets the facts.
  const statusObs = (status && Array.isArray(status.observations)) ? status.observations : [];
  if (statusObs.length) {
    add('status-message', statusObs.map((o) => ({
      sc: '4.1.3', kind: 'status-change-observed', xpath: o.trigger || null, review: true,
      detail: 'activating ' + JSON.stringify(o.triggerLabel || '(unlabelled control)') + ' changed page content: '
        + [
          o.addedInsideLiveRegion.length ? `${o.addedInsideLiveRegion.length} text change(s) INSIDE a live region` : null,
          o.addedOutsideLiveRegion.length ? `${o.addedOutsideLiveRegion.length} OUTSIDE any live region` : null,
          o.regionsBornWithContent.length ? `${o.regionsBornWithContent.length} live region(s) INSERTED already carrying their message (an AT observes regions present BEFORE the change — a region born with its content announces nothing)` : null,
          o.regionsUpdated.some((r) => r.emptied) ? 'a pre-existing live region was EMPTIED' : null,
          o.removedText.length ? `${o.removedText.length} status text(s) REMOVED from the page` : null,
          // The two focus facts that DECIDE scope, spelled out where they are otherwise only a boolean on the
          // structured observation. `focusDropped` in particular must never be read as a change of context.
          o.focusMovedIntoNewContent ? 'focus MOVED INTO the new content (the change is announced by the focus move)' : null,
          o.focusDropped ? 'focus was DROPPED to the document body — the element holding it was hidden or removed, so focus was DESTROYED rather than moved; this is NOT a change of context' : null,
        ].filter(Boolean).join('; ')
        + '. This is an OBSERVATION, not a verdict — whether the announcement is adequate is the rubric\'s call.',
    })));
  }
  if (opts.partialSink) opts.partialSink.statusObservations = statusObs;
  // MULTI-STEP TIMELINES + COLOUR DELTAS (residual RCA S10) — the detector's phase-B sidecars. Kept OFF the
  // observation objects ON PURPOSE: `statusObservations` rows are embedded verbatim in the status-message
  // prompt, so a new key on them would reach a judge the moment it exists. As separate artifacts they are
  // collected and persisted now, and reach no prompt until the adjudicator/orchestrator hunks that surface
  // them land — the same two-step the controlGroup/atRestErrorState lanes used.
  const statusTimelines = (status && Array.isArray(status.timelines)) ? status.timelines : [];
  const colourStateDeltas = colourDeltasFrom(statusTimelines);
  if (opts.partialSink) { opts.partialSink.statusTimelines = statusTimelines; opts.partialSink.colourStateDeltas = colourStateDeltas; }
  // LIVE-REGION BIRTH facts (document-start recorder — see liveRegionBirthInit above). Null whenever the
  // recorder was never installed on this page: an already-loaded page cannot be observed from before its
  // load, and null says that honestly instead of reading as "no births happened".
  // BUDGET ORDER (2026-08-17): with `opts.deferBirthTopUp` the read here is an INSTANT snapshot (no
  // up-to-7s hold) — runInstrumentsForUrl runs the bounded 2.1.2 reveal-trap pass first and performs the
  // top-up only afterwards, so the hold can never displace trap detection under the orchestrator's 90 s
  // lane cap. Direct callers (tests, page-only runs) keep the full read unchanged.
  const liveRegionBirths = await readLiveRegionBirths(page, opts.deferBirthTopUp ? { ...opts, birthWatchMs: 0 } : opts).catch(() => null);
  if (liveRegionBirths && Array.isArray(liveRegionBirths.regions) && liveRegionBirths.regions.length) {
    add('live-region-birth', birthFindingsFrom(liveRegionBirths));
  }
  if (liveRegionBirths && opts.partialSink) opts.partialSink.liveRegionBirths = liveRegionBirths;

  // #21 emit: a native dialog raised during interaction delivers text outside the DOM/ARIA model (review).
  page.off('dialog', onDialog);
  add('native-dialog', nativeDialogs.map((d) => ({ sc: '4.1.3', kind: 'native-dialog', xpath: null, detail: `a native ${d.type}() dialog was raised during interaction (message length ${d.len}); its text is delivered outside the DOM and the ARIA live-region model`, review: true })));
  // #22 emit: a genuine ariaNotify announcement was observed (forward-looking; only fires on a UA that
  // ships the API). Recorded so a future status-detector can CREDIT it rather than false-flag 4.1.3.
  const ariaNotices = await page.evaluate(() => (window.__v3ariaNotify || []).length).catch(() => 0);
  if (ariaNotices > 0) add('aria-notify', [{ sc: '4.1.3', kind: 'aria-notify-announced', xpath: null, detail: `the page made ${ariaNotices} ariaNotify() announcement(s) — a DOM-invisible AT announcement (credit, not a barrier)`, review: true }]);

  // `tabOrder` is EVIDENCE, not a finding: it never clears or barriers anything on its own. It rides
  // alongside `findings` so build-v3/orchestrator can thread it to the 2.4.3 judging subject.
  // `statusObservations` rides alongside `tabOrder` for the same reason: it is EVIDENCE for the 4.1.3
  // rubric, not a finding that decides anything on its own.
  // `collectorLiveness` records which `.catch()`-guarded in-page evaluate THREW on this page — empty on a
  // healthy page, so its presence at all is the signal. Not folded into `results.summary.collectorFailures`
  // here: that join lives in build-v3, which this change does not own.
  // `statusTimelines` / `colourStateDeltas` / `liveRegionBirths` are EVIDENCE artifacts on the same terms:
  // persisted here, surfaced to prompts only by the (lead-applied) orchestrator/adjudicator hunks.
  return { findings, tabOrder, statusObservations: statusObs, statusTimelines, colourStateDeltas, liveRegionBirths, collectorLiveness };
}

// Load a URL in a fresh browser and run the instruments. The instruments artifact carries the run
// identity so a downstream consumer can bind it to the page (non-authoritative, so not hashed).
async function runInstrumentsForUrl(url, opts = {}) {
  // shares the run's ONE browser pool (opts.tabAllocator / opts.browser) when given; else launches its own.
  const { withLanePage } = require('./page-lease.js');
  return withLanePage(opts, async (page) => {
    // DOCUMENT-START birth recorder, registered BEFORE the first navigation so it observes the page from the
    // very first byte of every document this lane loads (including the reveal pass's restore reload). The
    // registration is page-scoped, so it is REMOVED on the way out where the Puppeteer build allows — a
    // pooled lane page must not keep observing other lanes' documents.
    const birthReg = await installLiveRegionBirthObserver(page);
    try {
    await page.goto(url, { waitUntil: 'load', timeout: opts.gotoTimeoutMs || 30000 }).catch(() => {});
    await require('./settle.js').awaitSettle(page); // gated V3_SETTLE_WAIT — settle before keyboard/VSR state reads
    // `url` rides in opts so the reveal-state pass (2.4.3) can reload THIS page mid-lane; runInstruments is
    // otherwise page-only and stays callable against an already-loaded page in the tests.
    // `deferBirthTopUp`: the births read inside runInstruments is an instant snapshot; the up-to-7s top-up
    // hold runs BELOW, after the reveal-trap pass — see the BUDGET ORDER comments at both sites.
    const res = await runInstruments(page, { ...opts, url, deferBirthTopUp: true });
    // BOUNDED REVEAL PASS (2.1.2, residual RCA S4/TOOL). The at-rest detectors can only see regions that
    // have visible focusables, so a CLOSED modal is invisible to them and the whole modal-trap family read
    // as clean. Run LAST, on this same lane page (every read-only instrument is already finished, and the
    // pass reloads before each probe anyway) and ONLY when nothing confirmed was found at rest.
    //
    // BUDGET ORDER (2026-08-17): this pass runs BEFORE the live-region-birth top-up. Both compete for the
    // tail of the orchestrator's 90 s lane cap, and the top-up is an ENRICHMENT hold (it can only stamp
    // removedAtMs/firstContentAtMs onto births already recorded) while this pass is the only detector that
    // can CONFIRM the whole hidden-modal 2.1.2 trap family — an up-to-7s hold must never displace it.
    const alreadyConfirmed = res.findings.some((f) => f.sc === '2.1.2' && !f.review);
    const revealTrapInvoked = !alreadyConfirmed && opts.revealPass !== false;
    if (revealTrapInvoked) {
      const kbd = require('./kbd-graph.js');
      const revealed = await kbd.detectTrapsAfterReveal(page, url, opts).catch(() => null);
      if (revealed) {
        const via = ` (revealed by activating ${JSON.stringify(revealed.opener.name || revealed.opener.xpath)})`;
        for (const t of ((revealed.traps && revealed.traps.traps) || [])) {
          res.findings.push({ detector: 'keyboard-trap', sc: t.sc, kind: 'keyboard-trap', xpath: t.regionXpath, review: false,
            detail: 'confirmed keyboard trap: focus cannot escape by Tab, Shift+Tab, Esc, or a Close control' + via });
        }
        for (const t of ((revealed.selfTraps && revealed.selfTraps.traps) || [])) {
          res.findings.push({ detector: 'keyboard-trap', sc: t.sc, kind: 'keyboard-trap-self-refocus', xpath: t.xpath, review: false,
            detail: 'confirmed keyboard trap: this focusable re-grabs its own focus on blur' + via });
        }
        // EMBEDDED-FORMAT traps found in the REVEALED state (F10 — e.g. a KYC widget iframe inside a modal
        // that is display:none at rest). Same kinds and review semantics as the at-rest embed emission above:
        // a cross-origin embed cannot be counted, so its budget was a guess and the row stays review.
        for (const t of ((revealed.embedTraps && revealed.embedTraps.traps) || [])) {
          res.findings.push({ detector: 'keyboard-trap', sc: t.sc, kind: 'keyboard-trap', xpath: t.xpath,
            review: t.sameOrigin !== true,
            detail: `confirmed keyboard trap (WCAG F10): focus enters this ${t.kind} and cannot leave by Tab, Shift+Tab, or Escape`
              + (Number.isFinite(t.innerFocusables) ? ` (${t.innerFocusables} focusable element(s) inside; the walk allowed for all of them)` : ' (cross-origin — inner focusables could not be counted, so this is a REVIEW signal)')
              + via });
        }
        for (const t of ((revealed.embedTraps && revealed.embedTraps.directional) || [])) {
          res.findings.push({ detector: 'keyboard-trap', sc: t.sc, kind: 'keyboard-trap-directional', xpath: t.xpath, review: true,
            detail: `one-way keyboard trap: focus enters this ${t.kind} and escapes in only one Tab direction` + via });
        }
        // FIXED-SET CONFINEMENT found in the REVEALED state. Mirrors the at-rest fan-out exactly (kinds
        // keyboard-trap-confinement / keyboard-trap-oneway, member fan-out, review: !lyingAdvisory) so the
        // adjudicator's confinement gate and build-v3's mint loops treat these rows identically.
        if (revealed.confinement) {
          for (const t of (revealed.confinement.traps || [])) {
            const members = (Array.isArray(t.memberXpaths) && t.memberXpaths.length) ? t.memberXpaths : [t.xpath];
            const seenRc = new Set();
            for (const xpath of members) {
              if (!xpath || seenRc.has(xpath)) continue; seenRc.add(xpath);
              res.findings.push({ detector: 'keyboard-trap', sc: t.sc, kind: 'keyboard-trap-confinement', review: !t.lyingAdvisory, xpath,
                memberXpaths: t.memberXpaths, setSize: t.setSize, detail: (t.lyingAdvisory
                  ? `confirmed keyboard trap: focus is confined to a fixed set of ${t.setSize} element(s) and cannot leave by Tab, Shift+Tab, or Escape, AND the page's documented escape key does NOT free focus (a lying advisory) — a 2.1.2 barrier.`
                  : `focus is confined to a fixed set of ${t.setSize} element(s) and cannot leave by Tab, Shift+Tab, or Escape. A 2.1.2 barrier UNLESS the user is told how to exit (a non-standard key, possibly behind a help control) AND that key works — verify by revealing instructions and pressing the key.`) + via });
            }
          }
          for (const t of (revealed.confinement.onewayTraps || [])) {
            const members = (Array.isArray(t.memberXpaths) && t.memberXpaths.length) ? t.memberXpaths : [t.xpath];
            const seenRo = new Set();
            for (const xpath of members) {
              if (!xpath || seenRo.has(xpath)) continue; seenRo.add(xpath);
              res.findings.push({ detector: 'keyboard-trap', sc: t.sc, kind: 'keyboard-trap-oneway', review: true, xpath,
                memberXpaths: t.memberXpaths, setSize: t.setSize, direction: t.direction || 'forward',
                unreached: Array.isArray(t.unreached) ? t.unreached : [], unreachedCount: t.unreachedCount,
                detail: `focus is confined to a fixed set of ${t.setSize} element(s) in the ${t.direction || 'forward'} Tab direction only: ${t.unreachedCount} rendered focusable(s) outside the set are never reached in that direction, though focus escapes the other way. A 2.1.2 barrier UNLESS the section genuinely requires input or interaction — completable by keyboard — before allowing focus to progress, or a documented exit key works; the keyboard-trap rubric decides which.` + via });
            }
          }
        }
        if (opts.partialSink) opts.partialSink.findings = res.findings.slice();
      }
    }
    // DEFERRED LIVE-REGION-BIRTH TOP-UP (the hold runInstruments skipped under deferBirthTopUp). Only when
    // the reveal-trap pass was NOT invoked: that pass reloads the page at entry, so after it the document
    // whose lifecycle the snapshot recorded is gone and there is nothing left to top up — losing the
    // removedAtMs enrichment on exactly those pages is the deliberate trade (trap detection outranks it
    // under the lane cap; the born-filled/wired review rows never depended on the hold). When the pass was
    // skipped the document is untouched and the full read behaves exactly as before the reorder.
    if (!revealTrapInvoked) {
      const topped = await readLiveRegionBirths(page, opts).catch(() => null);
      if (topped && Array.isArray(topped.regions)) {
        res.liveRegionBirths = topped;
        res.findings = res.findings.filter((f) => f.detector !== 'live-region-birth');
        for (const f of birthFindingsFrom(topped)) {
          res.findings.push({ detector: 'live-region-birth', sc: f.sc || '', kind: f.kind, xpath: f.xpath || null, detail: f.detail || '', review: !!f.review });
        }
        if (opts.partialSink) { opts.partialSink.findings = res.findings.slice(); opts.partialSink.liveRegionBirths = topped; }
      }
    }
    return { file: opts.file || url, runId: opts.runId || null, pageDigest: opts.pageDigest || null, ...res };
    } finally {
      // UNREGISTER the document-start recorder so a pooled lane page stops observing once this lane is done.
      // Older Puppeteer builds return no identifier / lack the removal API — then the recorder stays and is
      // inert-by-construction on the next lane (it only ever records into that document's own window object).
      if (birthReg && birthReg.identifier && typeof page.removeScriptToEvaluateOnNewDocument === 'function') {
        await page.removeScriptToEvaluateOnNewDocument(birthReg.identifier).catch(() => {});
      }
    }
  });
}

// `restoreLoadedPage` is exported for its OWN tests: its whole value is the failure path (a reload that did
// not happen), which is unreachable through the lane on a healthy page.
// The birth-observer trio and `colourDeltasFrom` are exported for THEIR tests: install/read need a live
// page, `birthFindingsFrom`/`colourDeltasFrom` are pure.
module.exports = { runInstruments, runInstrumentsForUrl, restoreLoadedPage, CHROME,
  installLiveRegionBirthObserver, readLiveRegionBirths, birthFindingsFrom, colourDeltasFrom,
  markLiveBirthHarnessActive };
