// Harness 3.0 — trusted experiment runner (plan 3.0-A/C; audit V3-C4/H4/H6 remediation).
// Executes catalog-bounded experiments with REAL browser input and emits TYPED outcomes the builder
// binds to. Phase-1 walking-skeleton: `focus-visual-retry` (SC 2.4.7).
//
// Focus-dependence is judged from REAL PIXELS (an element-clip screenshot diff, unfocused vs
// keyboard-focused) via the same spatial verdict the R2 evidence path uses — NOT a weak computed-
// style rule. Computed style (outline + box-shadow + BORDER) is ALPHA-AWARE and used only to
// confirm the change is focus-dependent (not an always-on style or animation). Consequences:
//   • a transparent focus shadow produces no pixel change ⇒ cannot be "obviously visible" (no false clear);
//   • a visibly-changing focus border changes pixels ⇒ is NOT a "stable absence" (no false barrier);
//   • an invalid/off-screen crop ⇒ neither direction's flags are set ⇒ INCONCLUSIVE ⇒ PARTIAL.
'use strict';

const puppeteer = require('puppeteer');
const attest = require('./attestation.js');
const budget = require('./budget.js');
const cat = require('./catalog.js');

// Chrome path: env override first (CI / non-mac), then the local macOS default.
const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const MAX_TAB = 60;
const CLIP_PAD = 10; // include an outline-offset ring that renders outside the border box

// In-page: resolve an element by xpath and tag it so we can recognise focus landing on it.
function tagByXpath(xpath, marker) {
  const r = document.evaluate(xpath, document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null);
  const el = r.singleNodeValue;
  if (!el) return false;
  el.setAttribute('data-v3-target', marker);
  return true;
}

// In-page: ALPHA-AWARE focus-indicator read of the element AND its ::before/::after pseudo-elements
// (audit R2-F3/F5). A fully-transparent colour (alpha 0 / `transparent`) is NOT a visible indicator.
// Also returns the maximum outward RING EXTENT (px) so the caller can size a clip large enough to
// capture an offset/pseudo ring (audit R2-F4), and the element rect + role/tag.
function readIndicator(marker) {
  const el = document.querySelector(`[data-v3-target="${marker}"]`);
  if (!el) return null;
  const alphaOf = (c) => {
    if (!c) return 0;
    const s = String(c).trim();
    if (s === 'transparent') return 0;
    const m = s.match(/rgba?\(([^)]+)\)/i);
    if (m) { const parts = m[1].split(',').map((x) => x.trim()); return parts.length >= 4 ? parseFloat(parts[3]) : 1; }
    return 1; // named/hex colour with no alpha channel ⇒ opaque
  };
  const pxNums = (s) => (String(s || '').match(/-?\d+(\.\d+)?px/g) || []).map((x) => Math.abs(parseFloat(x)));
  const maxPx = (s) => pxNums(s).reduce((a, b) => Math.max(a, b), 0);

  function readOn(pseudo) {
    const cs = getComputedStyle(el, pseudo || null);
    // a pseudo-element only renders when it has a `content` value
    if (pseudo && (cs.content === 'none' || cs.content === 'normal' || cs.content === '')) return { visible: false, sig: '', extent: 0 };
    const outlineW = parseFloat(cs.outlineWidth) || 0;
    const outlineOffset = parseFloat(cs.outlineOffset) || 0;
    const outlineVisible = outlineW > 0 && cs.outlineStyle !== 'none' && cs.outlineStyle !== 'hidden' && alphaOf(cs.outlineColor) > 0;
    const shadowRaw = cs.boxShadow && cs.boxShadow !== 'none' ? cs.boxShadow : 'none';
    const shadowVisible = shadowRaw !== 'none' && alphaOf(shadowRaw) > 0 && !/^(rgba?\([^)]*,\s*0\s*\))/i.test(shadowRaw.trim());
    let borderVisible = false, borderSig = '';
    for (const s of ['Top', 'Right', 'Bottom', 'Left']) {
      const w = parseFloat(cs[`border${s}Width`]) || 0, st = cs[`border${s}Style`], col = cs[`border${s}Color`];
      if (w > 0 && st !== 'none' && st !== 'hidden' && alphaOf(col) > 0) borderVisible = true;
      borderSig += `${w}|${st}|${col};`;
    }
    // a pseudo with a visible background also paints (rings are often a bg box)
    const bgVisible = !!pseudo && alphaOf(cs.backgroundColor) > 0 && cs.backgroundColor !== 'rgba(0, 0, 0, 0)';
    const visible = outlineVisible || shadowVisible || borderVisible || bgVisible;
    // outward extent this layer can paint beyond the element box
    const extent = Math.max(
      outlineVisible ? outlineW + outlineOffset : 0,
      shadowVisible ? maxPx(shadowRaw) : 0,
      pseudo && visible ? Math.max(maxPx(cs.inset), maxPx(cs.top), maxPx(cs.left), maxPx(cs.right), maxPx(cs.bottom), 8) : 0,
    );
    return { visible, sig: `${cs.outlineStyle}|${cs.outlineWidth}|${cs.outlineOffset}|${cs.outlineColor}|${shadowRaw}|${borderSig}|${pseudo ? cs.content + cs.backgroundColor : ''}`, extent };
  }

  const base = readOn(null), before = readOn('::before'), after = readOn('::after');
  const cs = getComputedStyle(el);
  const r = el.getBoundingClientRect();
  return {
    anyVisible: base.visible || before.visible || after.visible,
    signature: `${base.sig}||${before.sig}||${after.sig}`,
    ringExtent: Math.max(base.extent, before.extent, after.extent),
    rect: { x: Math.round(r.left), y: Math.round(r.top), w: Math.round(r.width), h: Math.round(r.height) },
    role: el.getAttribute('role') || '', tag: el.tagName,
  };
}

// In-page spatial diff of two equal-size base64 PNG crops (the validated R2-H4 technique).
function spatialStatsInPage(a, b) {
  function load(s) { const i = new Image(); i.src = 'data:image/png;base64,' + s; return i.decode().then(() => i).catch(() => null); }
  return (async () => {
    const ia = await load(a), ib = await load(b); if (!ia || !ib) return null;
    if (ia.naturalWidth !== ib.naturalWidth || ia.naturalHeight !== ib.naturalHeight) return null;
    const w = ia.naturalWidth, h = ia.naturalHeight;
    const mk = (img) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); x.drawImage(img, 0, 0); return x.getImageData(0, 0, w, h).data; };
    const d1 = mk(ia), d2 = mk(ib);
    const band = Math.max(2, Math.min(14, Math.floor(Math.min(w, h) / 2)));
    let changed = 0, borderPixels = 0, borderChanged = 0, minX = w, minY = h, maxX = 0, maxY = 0;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const inBand = x < band || x >= w - band || y < band || y >= h - band;
      if (inBand) borderPixels++;
      const dr = Math.abs(d1[i] - d2[i]), dg = Math.abs(d1[i + 1] - d2[i + 1]), db = Math.abs(d1[i + 2] - d2[i + 2]);
      if (Math.max(dr, dg, db) > 28) { changed++; if (inBand) borderChanged++; if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y; }
    }
    const bbox = changed > 0 ? { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 } : { x: 0, y: 0, w: 0, h: 0 };
    const perim = 2 * (bbox.w + bbox.h) || 1;
    return { changedPixels: changed, totalPixels: w * h, borderPixels, borderChanged, bbox, minThicknessPx: +(changed / perim).toFixed(2), maxContrastChange: 0 };
  })();
}

const MAX_PAD = 80; // cap the dynamic clip pad so a pathological ring extent can't blow up the clip

// Element clip in CSS pixels (or null if not in the viewport / zero-size), padded by `pad` so an
// outline-offset / pseudo-element ring is captured (audit R2-F4). `pad` is the dynamic ring extent.
async function clipFor(page, marker, pad = CLIP_PAD) {
  const p = Math.min(MAX_PAD, Math.max(CLIP_PAD, Math.ceil(pad) + 6));
  return page.evaluate((m, p) => {
    const el = document.querySelector(`[data-v3-target="${m}"]`); if (!el) return null;
    el.scrollIntoView({ block: 'center', inline: 'center' });
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return null;
    const vw = window.innerWidth, vh = window.innerHeight;
    const x = Math.max(0, Math.floor(r.left - p)), y = Math.max(0, Math.floor(r.top - p));
    const width = Math.min(vw - x, Math.ceil(r.width + p * 2)), height = Math.min(vh - y, Math.ceil(r.height + p * 2));
    if (width < 1 || height < 1 || r.left > vw || r.top > vh || r.bottom < 0 || r.right < 0) return null;
    return { x, y, width, height };
  }, marker, p).catch(() => null);
}

// Programmatically focus, read the focused ring extent (for clip sizing), then blur. The extent is
// only used to SIZE the clip — never as verdict evidence (which comes from real keyboard focus).
async function focusedRingExtent(page, marker) {
  await page.evaluate((m) => { const el = document.querySelector(`[data-v3-target="${m}"]`); if (el) el.focus(); }, marker).catch(() => {});
  const ind = await page.evaluate(readIndicator, marker).catch(() => null);
  await page.evaluate(() => document.activeElement && document.activeElement.blur()).catch(() => {});
  return (ind && ind.ringExtent) || 0;
}

const PIXEL_MIN = 24; // ignore caret/antialias specks (matches the R2 spatial threshold)
const rectMoved = (a, b) => !a || !b || Math.abs(a.x - b.x) > 1 || Math.abs(a.y - b.y) > 1 || Math.abs(a.w - b.w) > 2 || Math.abs(a.h - b.h) > 2;

// ---- shared, reused by every experiment runner (exp-runners.js) ----
// hydration: fully loaded + fonts ready + a paint settle (so late styling isn't mistaken for absence)
async function hydrate(page) {
  return page.evaluate(async () => {
    if (document.readyState !== 'complete') return false;
    try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (e) {}
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    return true;
  }).catch(() => false);
}
// REAL keyboard reach: Tab from the top of the document until the tagged target is active.
async function realKeyboardReach(page, marker, max = MAX_TAB) {
  await page.evaluate(() => { const b = document.body; if (b) { b.tabIndex = -1; b.focus(); } });
  let reached = false;
  for (let i = 0; i < max && !reached; i++) {
    await page.keyboard.press('Tab');
    reached = await page.evaluate((m) => { const el = document.querySelector(`[data-v3-target="${m}"]`); return !!el && document.activeElement === el; }, marker).catch(() => false);
  }
  return reached;
}
// a paint/idle settle (double-rAF + a short timeout) for time-varying effects.
async function settle(page, ms = 120) {
  await page.evaluate((m) => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => setTimeout(r, m)))), ms).catch(() => {});
}

// A simple, single-mode control: its only operable mode is keyboard focus + activate. A composite/
// application widget is NOT mode-complete from a focus probe alone (audit H4: don't self-certify).
const SIMPLE_ROLES = new Set(['button', 'link', 'checkbox', 'radio', 'switch', 'menuitem', 'menuitemcheckbox', 'menuitemradio', 'tab', 'option']);
const SIMPLE_TAGS = new Set(['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA']);
function isSimpleControl(ind) { return !!ind && (SIMPLE_ROLES.has(ind.role) || SIMPLE_TAGS.has(ind.tag)); }

async function runFocusVisualRetry(page, request) {
  const marker = String(request.candidateId || request.targetXpath);
  const outcome = {
    targetIsFocusable: false, keyboardReachableInState: false, realKeyboardFocus: false,
    hydrationReady: false, focusDependentIndicator: false, obviouslyVisible: false,
    stableIndicatorAbsence: false, modeCompletenessProven: false,
  };
  const measurement = { cropValid: false, stableUnfocused: null, movedOnFocus: null, pixelChanged: null, computedFocusDependent: null, conflict: null, dynamicPad: null };

  outcome.hydrationReady = await hydrate(page);

  const tagged = await page.evaluate(tagByXpath, request.targetXpath, marker).catch(() => false);
  if (!tagged) return finalize(request, outcome, measurement, false);

  // applicability: focusable at all? (programmatic probe — independent of the clear evidence)
  outcome.targetIsFocusable = await page.evaluate((m) => {
    const el = document.querySelector(`[data-v3-target="${m}"]`); if (!el) return false;
    el.focus(); const ok = document.activeElement === el; el.blur(); return ok;
  }, marker).catch(() => false);

  // size the clip to the ACTUAL focus-ring extent (offset/pseudo rings), not a fixed pad (R2-F4).
  const padExtent = await focusedRingExtent(page, marker);
  measurement.dynamicPad = padExtent;

  // unfocused baseline: blur all, capture indicator + rect + TWO crops (a few frames apart) so we
  // can tell a focus change from a time-varying animation (audit R2-F1).
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  const clip = await clipFor(page, marker, padExtent);
  const unfocused = await page.evaluate(readIndicator, marker).catch(() => null);
  const beforeShotA = clip ? await page.screenshot({ clip, encoding: 'base64' }).catch(() => null) : null;
  await settle(page);
  const beforeShotB = clip ? await page.screenshot({ clip, encoding: 'base64' }).catch(() => null) : null;

  // REAL keyboard reach: Tab from the top until the target is the active element
  const reached = await realKeyboardReach(page, marker);
  outcome.keyboardReachableInState = reached;
  outcome.realKeyboardFocus = reached;

  const focused = reached ? await page.evaluate(readIndicator, marker).catch(() => null) : null;
  const afterShot = (reached && clip) ? await page.screenshot({ clip, encoding: 'base64' }).catch(() => null) : null;

  // mode completeness: a simple single-mode control reached by keyboard — NOT a bare `reached`.
  outcome.modeCompletenessProven = reached && isSimpleControl(focused || unfocused);

  // (a) STABILITY: two unfocused crops must agree — else the element animates and a focus diff is
  //     unattributable (audit R2-F1).
  let stableUnfocused = null;
  if (beforeShotA && beforeShotB) {
    const s = await page.evaluate(spatialStatsInPage, beforeShotA, beforeShotB).catch(() => null);
    stableUnfocused = !!s && s.totalPixels > 0 && s.changedPixels < PIXEL_MIN;
  }
  measurement.stableUnfocused = stableUnfocused;

  // (b) MOTION: the element must not move/resize on focus, or the before/after clips capture
  //     different regions (audit R2-F2).
  const movedOnFocus = (focused && unfocused) ? rectMoved(unfocused.rect, focused.rect) : null;
  measurement.movedOnFocus = movedOnFocus;

  // (c) PIXELS: unfocused-B vs focused (same clip).
  let spatial = null;
  if (beforeShotB && afterShot) spatial = await page.evaluate(spatialStatsInPage, beforeShotB, afterShot).catch(() => null);
  const cropValid = !!spatial && spatial.totalPixels > 0;
  measurement.cropValid = cropValid;

  if (focused && unfocused && cropValid) {
    const changedOnFocus = focused.signature !== unfocused.signature;
    const computedFocusDependent = focused.anyVisible && (!unfocused.anyVisible || changedOnFocus);
    const pixelChanged = spatial.changedPixels >= PIXEL_MIN;
    measurement.computedFocusDependent = computedFocusDependent;
    measurement.pixelChanged = pixelChanged;
    // CHANNEL AGREEMENT: the two independent channels must agree, the element must be stable, and it
    // must not have moved. Any disagreement/instability ⇒ INCONCLUSIVE ⇒ PARTIAL (never a confident
    // false clear/barrier). This is the core fix for R2-F1/F2/F3.
    const conflict = pixelChanged !== computedFocusDependent;
    const usable = stableUnfocused === true && movedOnFocus === false && !conflict;
    measurement.conflict = conflict;
    if (usable) {
      outcome.focusDependentIndicator = pixelChanged && computedFocusDependent;
      outcome.obviouslyVisible = pixelChanged;
      outcome.stableIndicatorAbsence = reached && outcome.hydrationReady && !pixelChanged && !computedFocusDependent;
    }
  }
  return finalize(request, outcome, measurement, true);
}

function finalize(request, outcome, measurement, completed) {
  // `valid` = the measurement produced a usable crop AND reached the target (otherwise inconclusive).
  const valid = !!(measurement.cropValid && outcome.realKeyboardFocus);
  return {
    claimId: request.candidateId,
    experimentId: 'focus-visual-retry',
    targetXpath: request.targetXpath,
    sc: '2.4.7',
    completed: !!completed,
    valid,
    measurement,
    outcome,
    applicabilityEvidence: { targetIsFocusable: outcome.targetIsFocusable, keyboardReachableInState: outcome.keyboardReachableInState },
    observationScope: { actionTargetRef: request.targetXpath, state: 'fresh-load', action: 'tab-to-focus', environment: request.environment || 'headless-chromium' },
  };
}

// Run a plan against a page-URL resolver. resolveUrl(request) -> a URL (file:// or http://).
// Every request gets exactly ONE disposition: a typed result, or an explicit `unrun` record
// (skipped/failed/deferred) — nothing disappears silently (audit V3-H6).
async function runPlan(plan, { resolveUrl, executablePath = CHROME, attestationKey = null, budgetOpts = {} } = {}) {
  // dispatch table: focus runner here + the C1/C3–C9 runners (lazy require breaks the module cycle).
  const RUNNERS = Object.assign({ 'focus-visual-retry': runFocusVisualRetry }, require('./exp-runners.js').RUNNERS);
  // the production runner reads the trust-anchor key from the environment too (audit V3R4-H5) — so a
  // real `V3_ATTEST_KEY` run signs its evidence, not only the injected-key test path.
  const key = attestationKey || attest.loadKey({});
  const runBudget = budget.makeRunBudget(budgetOpts); // run-level wall-clock cap (plan Rule 8)
  const browser = await puppeteer.launch({ executablePath, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const results = [];
  const unrun = [];
  let environment = 'headless-chromium';
  // A real run that holds the trust-anchor key ATTESTS each result: the runner signs the lineage —
  // including the page identity it INDEPENDENTLY OBSERVED (a sha256 of the actually-loaded resource,
  // NOT a value copied from the plan, audit V3R4-C1) — so the builder can verify the evidence was
  // produced HERE for THIS page, not hand-authored, replayed, or measured on a different page. Sign
  // ONLY when we hold a key AND observed the page digest — a failed observation stays UNSIGNED ⇒ shadow.
  const sign = (r, observedPageDigest) => (key && observedPageDigest) ? attest.signResult(r, key, { runner: r.experimentId, runnerVersion: '3.0.0-phase0', runIdentity: { file: plan && plan.file, runId: plan && plan.runId, observedPageDigest } }) : r;
  try {
    try { const v = await browser.version(); environment = `headless-chromium/${v}/${process.platform}`; } catch (e) {}
    for (const request of (plan && plan.requests) || []) {
      const req = { ...request, environment };
      const runner = RUNNERS[request.experimentId];
      if (!runner) { // nothing disappears silently (audit V3-H6)
        unrun.push({ candidateId: request.candidateId, experimentId: request.experimentId, status: 'deferred', reason: 'experiment has no registered runner' });
        continue;
      }
      // BUDGET (plan Rule 8): once the run-level wall-clock cap is hit, defer the rest — never run
      // unbounded. Each experiment carries a cost class (wall-clock deadline + retries) enforced below.
      if (runBudget.exceeded()) { unrun.push({ candidateId: request.candidateId, experimentId: request.experimentId, status: 'deferred', reason: `run wall-clock budget (${runBudget.max}ms) exhausted` }); continue; }
      const cost = budget.costFor(RUNNERS[request.experimentId] && cat.getExperiment(request.experimentId));
      const wall = Math.min(cost.maxWallClockMs, runBudget.remaining());
      const t0 = Date.now();
      let produced = false;
      for (let attempt = 0; attempt <= cost.retries && !produced; attempt++) {
        const page = await browser.newPage();                 // FRESH isolated page per attempt (Rule 3)
        const outcome = await budget.withDeadline(async () => {
          // independently digest the resource the browser ACTUALLY loaded — the navigation response
          // body RAW BYTES (the SAME byte domain the collector hashes, audit V3R4). The attestation
          // binds THIS, so a wrong/stale/swapped page cannot be signed as the collector's page.
          const response = await page.goto(resolveUrl(request), { waitUntil: 'load', timeout: Math.max(1, wall) });
          const body = response ? await response.buffer().catch(() => null) : null;
          const observedPageDigest = body != null ? attest.pageDigestOf(body) : null;
          return sign(await runner(page, req), observedPageDigest);
        }, Math.max(1, wall)).catch((e) => ({ ok: false, error: e }));
        await page.close().catch(() => {});                   // abort any work still pending past the deadline
        if (outcome.ok) { results.push(outcome.value); produced = true; }
        else if (outcome.timeout) { unrun.push({ candidateId: request.candidateId, experimentId: request.experimentId, status: 'deferred', reason: `wall-clock budget ${wall}ms exceeded (mutationRisk:${cost.mutationRisk})` }); break; }
        else if (attempt >= cost.retries) { unrun.push({ candidateId: request.candidateId, experimentId: request.experimentId, status: 'failed', reason: String((outcome.error && outcome.error.message) || outcome.error || 'unknown').slice(0, 200) }); }
      }
      runBudget.add(Date.now() - t0);
    }
  } finally { await browser.close().catch(() => {}); }
  return {
    file: plan.file, runId: plan.runId, pageDigest: plan.pageDigest,
    catalogVersion: '3.0.0-phase0',
    environment,
    startedAt: plan._startedAt || 0,
    results,
    unrun,
  };
}

module.exports = {
  runPlan, runFocusVisualRetry, CHROME,
  // shared helpers for exp-runners.js
  tagByXpath, spatialStatsInPage, clipFor, hydrate, realKeyboardReach, settle,
  PIXEL_MIN, MAX_TAB, MAX_PAD,
};
