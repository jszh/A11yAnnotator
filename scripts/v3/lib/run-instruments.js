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
const { collectTabOrder, tabOrderFindings, detectKeyboardTraps, detectFocusRetentionTraps, detectFixedSetConfinementTraps, detectFocusRejection, detectFocusRestsInAriaHidden } = require('./kbd-graph.js');
const { vsrNavigationIntegrity } = require('./vsr-graph.js');
const { detectStatusMessages } = require('./status-detector.js');

const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// Run every instrument against an already-loaded Puppeteer page. Returns { findings: [...] }.
async function runInstruments(page, opts = {}) {
  const findings = [];
  const add = (detector, list) => { for (const f of (list || [])) { const row = { detector, sc: f.sc || '', kind: f.kind, xpath: f.xpath || null, detail: f.detail || '', review: !!f.review }; if (f.calibrated === false) row.calibrated = false; if (Array.isArray(f.memberXpaths)) row.memberXpaths = f.memberXpaths; if (Number.isFinite(f.setSize)) row.setSize = f.setSize; findings.push(row); } };

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
  await page.evaluate(() => {
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

  // VSR transcript → reading order (1.3.2) + announcement-vs-meaning (4.1.2)
  const transcript = await collectVsrTranscript(page, opts).catch(() => null);
  if (transcript && transcript.ok) {
    const an = analyzeTranscript(transcript);
    add('vsr-reading-order', an.readingOrder);
    add('vsr-meaning', an.meaning);
    add('vsr-meaning', an.meaningReview);
  }
  // keyboard tab order (2.4.3)
  const tab = await collectTabOrder(page).catch(() => null);
  if (tab) add('tab-order', tabOrderFindings(tab).findings);
  // keyboard traps (2.1.2): confirmed (authoritative-candidate) + directional (review)
  const traps = await detectKeyboardTraps(page).catch(() => null);
  if (traps) {
    add('keyboard-trap', traps.traps.map((t) => ({ sc: t.sc, kind: 'keyboard-trap', xpath: t.regionXpath, detail: 'confirmed keyboard trap: focus cannot escape by Tab, Shift+Tab, Esc, or a Close control' })));
    add('keyboard-trap', traps.directionalTraps.map((t) => ({ sc: t.sc, kind: 'keyboard-trap-directional', xpath: t.regionXpath, detail: 'one-way keyboard trap: focus escapes in only one Tab direction', review: true })));
  }
  // self-refocus traps (2.1.2): a LONE focusable that re-grabs its own focus on blur — the region
  // detector above cannot see these (no region; its escape probe runs before the async refocus fires).
  const selfTraps = await detectFocusRetentionTraps(page).catch(() => null);
  if (selfTraps) add('keyboard-trap', selfTraps.traps.map((t) => ({ sc: t.sc, kind: 'keyboard-trap-self-refocus', xpath: t.xpath, detail: 'confirmed keyboard trap: this focusable re-grabs its own focus on blur, so Tab and Shift+Tab cannot move focus off it' })));
  // fixed-set CONFINEMENT traps (2.1.2): focus mutual-bounces among a small fixed set it can never LEAVE by
  // Tab/Shift+Tab/Esc — the region + self-refocus detectors miss these (no region; focus DOES move, just never out).
  const confine = await detectFixedSetConfinementTraps(page).catch(() => null);
  // DEMOTED to a REVIEW signal — NOT an authoritative deterministic barrier. The held-out adversarial sweep over the
  // full 80af7b rule proved the mutual-bounce confinement detector over-fires on 4/7 PASSED cases: a trap whose only
  // exit is a NON-STANDARD key (e.g. Ctrl+M) is a 2.1.2 PASS *iff the page ADVISES the user of that method*, and a
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
  }
  // focus-rejection (2.1.1/2.4.7, F55): a control that removes its OWN focus the instant it receives it —
  // the inverse of a self-refocus trap (focus can never rest on it, so it can't be operated or shown).
  const rej = await detectFocusRejection(page).catch(() => null);
  if (rej) add('focus-rejection', rej.rejections.map((r) => ({ sc: r.sc, kind: 'focus-rejected-on-receipt', xpath: r.xpath, detail: `this control removes its own keyboard focus the moment it receives it (F55 onfocus→blur)${r.inlineHandler ? ' [inline onfocus/onblur handler]' : ''}; a keyboard user cannot operate it and no focus indicator can ever show (also 2.4.7)` })));
  // 6cfa84 (4.1.2): a tabbable element under an aria-hidden ANCESTOR where focus RESTS (no sentinel redirect) — the
  // AT never announces it. DYNAMIC by necessity: the rule's passed focus-sentinel is statically identical to its
  // failed barrier, so a static flag was unsound (held-out-proven). build-v3 promotes this to a 4.1.2 barrier.
  const ariaHiddenFocus = await detectFocusRestsInAriaHidden(page).catch(() => null);
  if (ariaHiddenFocus) add('aria-hidden-focus', ariaHiddenFocus.traps.map((t) => ({ sc: t.sc, kind: 'focus-rests-in-aria-hidden', detector: 'focus-rest', xpath: t.xpath, detail: 'this focusable element sits inside an aria-hidden=true subtree and focus RESTS on it (no focus sentinel redirected away), so a keyboard user reaches a control the assistive technology never announces — no name, role, or state' })));
  // VSR navigation traps (reading-cursor cannot advance/retreat)
  const vt = await vsrNavigationIntegrity(page, opts).catch(() => null);
  if (vt) add('vsr-trap', vt.traps);
  // 4.1.3 status messages (action→announcement). Runs LAST: it DRIVES actions (clicks), so it must
  // not perturb the read-only VSR/keyboard instruments above. Sound-first (only flags content that
  // demonstrably appeared without a live region and without focus moving to it).
  const status = await detectStatusMessages(page, opts).catch(() => null);
  if (status) add('status-message', status.findings);

  // #21 emit: a native dialog raised during interaction delivers text outside the DOM/ARIA model (review).
  page.off('dialog', onDialog);
  add('native-dialog', nativeDialogs.map((d) => ({ sc: '4.1.3', kind: 'native-dialog', xpath: null, detail: `a native ${d.type}() dialog was raised during interaction (message length ${d.len}); its text is delivered outside the DOM and the ARIA live-region model`, review: true })));
  // #22 emit: a genuine ariaNotify announcement was observed (forward-looking; only fires on a UA that
  // ships the API). Recorded so a future status-detector can CREDIT it rather than false-flag 4.1.3.
  const ariaNotices = await page.evaluate(() => (window.__v3ariaNotify || []).length).catch(() => 0);
  if (ariaNotices > 0) add('aria-notify', [{ sc: '4.1.3', kind: 'aria-notify-announced', xpath: null, detail: `the page made ${ariaNotices} ariaNotify() announcement(s) — a DOM-invisible AT announcement (credit, not a barrier)`, review: true }]);

  return { findings };
}

// Load a URL in a fresh browser and run the instruments. The instruments artifact carries the run
// identity so a downstream consumer can bind it to the page (non-authoritative, so not hashed).
async function runInstrumentsForUrl(url, opts = {}) {
  // shares the run's ONE browser pool (opts.tabAllocator / opts.browser) when given; else launches its own.
  const { withLanePage } = require('./page-lease.js');
  return withLanePage(opts, async (page) => {
    await page.goto(url, { waitUntil: 'load', timeout: opts.gotoTimeoutMs || 30000 }).catch(() => {});
    await require('./settle.js').awaitSettle(page); // gated V3_SETTLE_WAIT — settle before keyboard/VSR state reads
    const res = await runInstruments(page, opts);
    return { file: opts.file || url, runId: opts.runId || null, pageDigest: opts.pageDigest || null, ...res };
  });
}

module.exports = { runInstruments, runInstrumentsForUrl, CHROME };
