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

// In-page: ALPHA-AWARE focus-indicator read (outline + box-shadow + border). A fully-transparent
// colour (alpha 0 / `transparent`) is NOT a visible indicator. Returns enough to compare unfocused
// vs focused and to detect focus-dependence, plus the role/tag for mode-completeness.
function readIndicator(marker) {
  const el = document.querySelector(`[data-v3-target="${marker}"]`);
  if (!el) return null;
  const cs = getComputedStyle(el);
  const alphaOf = (c) => {
    if (!c) return 0;
    const s = String(c).trim();
    if (s === 'transparent') return 0;
    const m = s.match(/rgba?\(([^)]+)\)/i);
    if (m) { const parts = m[1].split(',').map((x) => x.trim()); return parts.length >= 4 ? parseFloat(parts[3]) : 1; }
    return 1; // named/hex colour with no alpha channel ⇒ opaque
  };
  const outlineW = parseFloat(cs.outlineWidth) || 0;
  const outlineVisible = outlineW > 0 && cs.outlineStyle !== 'none' && cs.outlineStyle !== 'hidden' && alphaOf(cs.outlineColor) > 0;
  // box-shadow: visible only if present AND not entirely transparent
  const shadowRaw = cs.boxShadow && cs.boxShadow !== 'none' ? cs.boxShadow : 'none';
  const shadowVisible = shadowRaw !== 'none' && alphaOf(shadowRaw) > 0 && !/^(rgba?\([^)]*,\s*0\s*\))/i.test(shadowRaw.trim());
  // border: max visible side
  const sides = ['Top', 'Right', 'Bottom', 'Left'];
  let borderVisible = false; let borderSig = '';
  for (const s of sides) {
    const w = parseFloat(cs[`border${s}Width`]) || 0;
    const st = cs[`border${s}Style`];
    const col = cs[`border${s}Color`];
    if (w > 0 && st !== 'none' && st !== 'hidden' && alphaOf(col) > 0) borderVisible = true;
    borderSig += `${w}|${st}|${col};`;
  }
  const role = el.getAttribute('role') || '';
  return {
    outlineVisible, shadowVisible, borderVisible,
    anyVisible: outlineVisible || shadowVisible || borderVisible,
    signature: `${cs.outlineStyle}|${cs.outlineWidth}|${cs.outlineColor}|${shadowRaw}|${borderSig}`,
    role, tag: el.tagName,
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

// Element clip in CSS pixels (or null if not in the viewport / zero-size), padded for the ring.
async function clipFor(page, marker, pad = CLIP_PAD) {
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
  }, marker, pad).catch(() => null);
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
  const measurement = { cropValid: false, pixelChanged: null, computedFocusDependent: null };

  // hydration: fully loaded + fonts ready + a paint settle (so late styling isn't mistaken for absence)
  outcome.hydrationReady = await page.evaluate(async () => {
    if (document.readyState !== 'complete') return false;
    try { if (document.fonts && document.fonts.ready) await document.fonts.ready; } catch (e) {}
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    return true;
  }).catch(() => false);

  const tagged = await page.evaluate(tagByXpath, request.targetXpath, marker).catch(() => false);
  if (!tagged) return finalize(request, outcome, measurement, false);

  // applicability: focusable at all? (programmatic probe — independent of the clear evidence)
  outcome.targetIsFocusable = await page.evaluate((m) => {
    const el = document.querySelector(`[data-v3-target="${m}"]`); if (!el) return false;
    el.focus(); const ok = document.activeElement === el; el.blur(); return ok;
  }, marker).catch(() => false);

  // unfocused baseline: blur all, settle the clip, capture indicator + crop
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  const clip = await clipFor(page, marker);
  const unfocused = await page.evaluate(readIndicator, marker).catch(() => null);
  const beforeShot = clip ? await page.screenshot({ clip, encoding: 'base64' }).catch(() => null) : null;

  // REAL keyboard reach: Tab from the top until the target is the active element
  await page.evaluate(() => { const b = document.body; if (b) { b.tabIndex = -1; b.focus(); } });
  let reached = false;
  for (let i = 0; i < MAX_TAB && !reached; i++) {
    await page.keyboard.press('Tab');
    reached = await page.evaluate((m) => { const el = document.querySelector(`[data-v3-target="${m}"]`); return !!el && document.activeElement === el; }, marker).catch(() => false);
  }
  outcome.keyboardReachableInState = reached;
  outcome.realKeyboardFocus = reached;

  const focused = reached ? await page.evaluate(readIndicator, marker).catch(() => null) : null;
  const afterShot = (reached && clip) ? await page.screenshot({ clip, encoding: 'base64' }).catch(() => null) : null;

  // mode completeness: a simple single-mode control reached by keyboard — NOT a bare `reached`.
  outcome.modeCompletenessProven = reached && isSimpleControl(focused || unfocused);

  // real-pixel spatial verdict (area-independent). cropValid only when both crops exist + same size.
  let spatial = null;
  if (beforeShot && afterShot) spatial = await page.evaluate(spatialStatsInPage, beforeShot, afterShot).catch(() => null);
  const cropValid = !!spatial && spatial.totalPixels > 0;
  measurement.cropValid = cropValid;

  if (focused && unfocused) {
    const changedOnFocus = focused.signature !== unfocused.signature;
    // a VISIBLE indicator that appears on focus or changes on focus (alpha-aware via readIndicator)
    const computedFocusDependent = focused.anyVisible && (!unfocused.anyVisible || changedOnFocus);
    measurement.computedFocusDependent = computedFocusDependent;

    if (cropValid) {
      const FOCUS_MIN_CHANGED = 24;
      const pixelChanged = spatial.changedPixels >= FOCUS_MIN_CHANGED;
      measurement.pixelChanged = pixelChanged;
      // CLEAR evidence: BOTH real pixels changed AND the change is computed-focus-dependent.
      outcome.focusDependentIndicator = pixelChanged && computedFocusDependent;
      // obviously visible = a real, perceivable pixel change (transparent styling → no pixels → false).
      outcome.obviouslyVisible = pixelChanged;
      // BARRIER evidence: reached + hydrated + valid crop + NO pixel change + no focus-dependent style.
      outcome.stableIndicatorAbsence = reached && outcome.hydrationReady && !pixelChanged && !computedFocusDependent;
    }
    // crop invalid ⇒ leave both clear and barrier flags false ⇒ INCONCLUSIVE ⇒ PARTIAL (safe).
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
async function runPlan(plan, { resolveUrl, executablePath = CHROME } = {}) {
  const browser = await puppeteer.launch({ executablePath, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const results = [];
  const unrun = [];
  let environment = 'headless-chromium';
  try {
    try { const v = await browser.version(); environment = `headless-chromium/${v}/${process.platform}`; } catch (e) {}
    for (const request of (plan && plan.requests) || []) {
      const req = { ...request, environment };
      if (request.experimentId !== 'focus-visual-retry') { // skeleton scope: not yet implemented
        unrun.push({ candidateId: request.candidateId, experimentId: request.experimentId, status: 'deferred', reason: 'experiment not implemented in Phase-1 runner' });
        continue;
      }
      const page = await browser.newPage();
      try {
        await page.goto(resolveUrl(request), { waitUntil: 'load', timeout: 15000 });
        results.push(await runFocusVisualRetry(page, req));
      } catch (e) {
        unrun.push({ candidateId: request.candidateId, experimentId: request.experimentId, status: 'failed', reason: String(e && e.message || e).slice(0, 200) });
      } finally { await page.close().catch(() => {}); }
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

module.exports = { runPlan, runFocusVisualRetry, CHROME };
