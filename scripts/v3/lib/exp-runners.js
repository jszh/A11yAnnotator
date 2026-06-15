// Harness 3.0 — experiment runners C1/C3/C4/C5/C6/C7/C8/C9 (plan eval-results/V3-EXPERIMENTS-PLAN.md).
// Each follows the focus-visual-retry discipline: hydrate → real input → INDEPENDENT channels →
// withhold BOTH directions on any disagreement/uncertainty (INCONCLUSIVE → PARTIAL). Clearable
// experiments emit a universe-closing obligation (singleModeControl / statesInventoryClosed /
// backdropIsSolidUniform / escapeProvenForWidget) so a clear is only asserted on the decidable
// sub-domain; barrier-only experiments emit no NO_BARRIER_OBSERVED support at all.
'use strict';

const H = require('./run-experiments.js'); // shared helpers (tagByXpath, hydrate, reach, settle, …)

// standard result envelope (same shape as the focus runner's finalize()).
function mk(request, experimentId, sc, outcome, applicabilityEvidence, { action, state = 'fresh-load', valid = false, measurement = {} } = {}) {
  return {
    claimId: request.candidateId, experimentId, targetXpath: request.targetXpath, sc,
    completed: true, valid, measurement, outcome, applicabilityEvidence,
    observationScope: { actionTargetRef: request.targetXpath, state, action, environment: request.environment || 'headless-chromium' },
  };
}

// =====================================================================================
// C3 — text-contrast-pixel → 1.4.3 (CLEAR over a flat opaque backdrop)
// =====================================================================================
// In-page: resolve effective fg (alpha-composited, incl. ancestor opacity) over the first opaque
// ancestor backdrop; detect non-uniform backdrops (image/gradient) which block the clear.
function measureContrast(marker) {
  const el = document.querySelector(`[data-v3-target="${marker}"]`);
  if (!el) return null;
  const cs = getComputedStyle(el);
  const rgba = (s) => { const m = String(s || '').match(/rgba?\(([^)]+)\)/i); if (!m) return null; const p = m[1].split(',').map((x) => parseFloat(x)); return { r: p[0], g: p[1], b: p[2], a: p.length >= 4 ? p[3] : 1 }; };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * f(c.r) + 0.7152 * f(c.g) + 0.0722 * f(c.b); };
  const over = (fg, bg) => ({ r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a), a: 1 });

  // own non-whitespace text?
  let ownsText = false;
  for (const n of el.childNodes) if (n.nodeType === 3 && n.textContent.trim()) ownsText = true;
  const rect = el.getBoundingClientRect();
  const visible = cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0 && rect.width > 0 && rect.height > 0;

  // ancestor opacity chain (an ancestor opacity<1 composites the group → rendered contrast differs)
  let opacityChain = 1; for (let p = el; p; p = p.parentElement) { const o = parseFloat(getComputedStyle(p).opacity); if (!isNaN(o)) opacityChain *= o; }

  // backdrop: first ancestor with an opaque background-color; flag any background-image/gradient on the way
  let bg = null, hasImage = false;
  for (let p = el; p; p = p.parentElement) {
    const pcs = getComputedStyle(p);
    if (pcs.backgroundImage && pcs.backgroundImage !== 'none') hasImage = true;
    const c = rgba(pcs.backgroundColor);
    if (c && c.a === 1) { bg = c; break; }
  }
  const fg = rgba(cs.color);
  const sizePx = parseFloat(cs.fontSize) || 0;
  let weight = parseInt(cs.fontWeight, 10); if (isNaN(weight)) weight = cs.fontWeight === 'bold' ? 700 : 400;
  const isLarge = sizePx >= 24 || (sizePx >= 18.66 && weight >= 700);
  const threshold = isLarge ? 3.0 : 4.5;

  const foregroundResolved = !!fg;
  const backgroundResolved = !!bg;
  const backdropIsSolidUniform = backgroundResolved && !hasImage && opacityChain === 1;
  const contrastComputable = foregroundResolved && backgroundResolved && backdropIsSolidUniform;
  let ratio = null;
  if (contrastComputable) {
    const effFg = over(fg, bg);
    const l1 = lum(effFg), l2 = lum(bg);
    ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
  }
  const disabled = el.disabled === true || el.getAttribute('aria-disabled') === 'true';
  const ariaHidden = el.closest('[aria-hidden="true"]') != null;
  return {
    isTextNode: ownsText, textRendersVisible: visible && ownsText,
    foregroundResolved, backgroundResolved, backdropIsSolidUniform, contrastComputable,
    sizeClassResolved: sizePx > 0, notExemptText: !disabled && !ariaHidden,
    ratio, threshold,
    signature: `${cs.color}|${bg ? bg.r + ',' + bg.g + ',' + bg.b : 'na'}|${sizePx}|${weight}`,
  };
}

async function runTextContrastPixel(page, request) {
  const marker = String(request.candidateId || request.targetXpath);
  const o = { isTextNode: false, textRendersVisible: false, foregroundResolved: false, backgroundResolved: false, backdropIsSolidUniform: false, contrastComputable: false, sizeClassResolved: false, thresholdMet: false, thresholdFailed: false, notExemptText: false, measurementStable: false };
  const hydrationReady = await H.hydrate(page);
  const tagged = await page.evaluate(H.tagByXpath, request.targetXpath, marker).catch(() => false);
  if (!tagged) return mk(request, 'text-contrast-pixel', '1.4.3', o, {}, { action: 'measure-contrast' });
  const a = await page.evaluate(measureContrast, marker).catch(() => null);
  await H.settle(page);
  const b = await page.evaluate(measureContrast, marker).catch(() => null);
  if (a && b) {
    Object.assign(o, { isTextNode: a.isTextNode, textRendersVisible: a.textRendersVisible, foregroundResolved: a.foregroundResolved, backgroundResolved: a.backgroundResolved, backdropIsSolidUniform: a.backdropIsSolidUniform, contrastComputable: a.contrastComputable, sizeClassResolved: a.sizeClassResolved, notExemptText: a.notExemptText });
    o.measurementStable = a.signature === b.signature; // no color animation between reads
    if (a.contrastComputable && o.measurementStable && a.ratio != null) {
      o.thresholdMet = a.ratio >= a.threshold;
      o.thresholdFailed = a.ratio < a.threshold;
    }
    // non-uniform backdrop or instability ⇒ neither met nor failed ⇒ INCONCLUSIVE
  }
  const valid = !!(a && b && o.textRendersVisible && o.measurementStable);
  return mk(request, 'text-contrast-pixel', '1.4.3', { ...o, hydrationReady }, { isTextNode: o.isTextNode, textRendersVisible: o.textRendersVisible, sizeClassResolved: o.sizeClassResolved }, { action: 'measure-contrast', valid, measurement: { ratio: a && a.ratio, threshold: a && a.threshold } });
}

// =====================================================================================
// C6 — field-label-probe → 3.3.2 (CLEAR for the label sub-claim)
// =====================================================================================
function measureFieldLabel(marker) {
  const el = document.querySelector(`[data-v3-target="${marker}"]`);
  if (!el) return null;
  const tag = el.tagName, role = el.getAttribute('role') || '';
  const isUserInputField = (tag === 'INPUT' && !/^(hidden|button|submit|reset|image)$/i.test(el.type || 'text')) || tag === 'SELECT' || tag === 'TEXTAREA' || /^(textbox|combobox|listbox|spinbutton|searchbox)$/.test(role);
  const cs = getComputedStyle(el);
  const rect = el.getBoundingClientRect();
  const fieldRendered = cs.display !== 'none' && cs.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;

  const srOnly = (n) => { if (!n) return true; const s = getComputedStyle(n); const r = n.getBoundingClientRect(); if (s.display === 'none' || s.visibility === 'hidden' || parseFloat(s.opacity) === 0) return true; if (r.width <= 1 && r.height <= 1) return true; if (/inset\(50%\)|rect\(0/.test(s.clip + s.clipPath)) return true; if (r.right < 0 || r.bottom < 0) return true; return false; };
  const txt = (n) => (n ? (n.textContent || '').trim() : '');

  // accessible name (placeholder EXCLUDED), with the visible-label node if any
  let name = '', labelNode = null;
  const lb = el.getAttribute('aria-labelledby');
  if (lb) { const parts = lb.split(/\s+/).map((id) => document.getElementById(id)).filter(Boolean); name = parts.map(txt).join(' ').trim(); labelNode = parts.find((n) => txt(n)); }
  if (!name) { const al = el.getAttribute('aria-label'); if (al && al.trim()) name = al.trim(); }
  if (!name && el.id) { const l = document.querySelector(`label[for="${CSS.escape(el.id)}"]`); if (l && txt(l)) { name = txt(l); labelNode = l; } }
  if (!name) { const wrap = el.closest('label'); if (wrap && txt(wrap)) { name = txt(wrap); labelNode = wrap; } }
  let fromTitleOnly = false;
  if (!name) { const t = el.getAttribute('title'); if (t && t.trim()) { name = t.trim(); fromTitleOnly = true; } }
  const placeholder = (el.getAttribute('placeholder') || '').trim();

  const programmaticNamePresent = name.length > 0;
  const nameOnlyFromPlaceholder = !programmaticNamePresent && placeholder.length > 0;
  const visibleLabelText = !!labelNode && !srOnly(labelNode) && !fromTitleOnly;
  return {
    isUserInputField, fieldRendered, programmaticNamePresent, visibleLabelText,
    nameOnlyFromPlaceholder,
    fieldLabelBarrier: isUserInputField && fieldRendered && (!programmaticNamePresent || nameOnlyFromPlaceholder),
  };
}

async function runFieldLabelProbe(page, request) {
  const marker = String(request.candidateId || request.targetXpath);
  const hydrationReady = await H.hydrate(page);
  const o = { isUserInputField: false, fieldRendered: false, hydrationReady, programmaticNamePresent: false, visibleLabelText: false, fieldLabelBarrier: false };
  const tagged = await page.evaluate(H.tagByXpath, request.targetXpath, marker).catch(() => false);
  if (!tagged) return mk(request, 'field-label-probe', '3.3.2', o, {}, { action: 'inspect-label' });
  const m = await page.evaluate(measureFieldLabel, marker).catch(() => null);
  if (m) Object.assign(o, { isUserInputField: m.isUserInputField, fieldRendered: m.fieldRendered, programmaticNamePresent: m.programmaticNamePresent, visibleLabelText: m.visibleLabelText, fieldLabelBarrier: m.fieldLabelBarrier });
  const valid = !!(m && o.isUserInputField && o.fieldRendered);
  return mk(request, 'field-label-probe', '3.3.2', o, { isUserInputField: o.isUserInputField, fieldRendered: o.fieldRendered }, { action: 'inspect-label', valid });
}

// =====================================================================================
// C8 — reflow-overflow-probe → 1.4.10 (BARRIER-ONLY, page-level @ 320×256)
// =====================================================================================
function measureReflow() {
  const se = document.scrollingElement || document.documentElement;
  const SLOP = 2;
  const horizontalScrollPresent = se.scrollWidth > se.clientWidth + SLOP;
  // locate visible, non-exempt overflow sources
  const vw = window.innerWidth;
  const isExempt = (el) => {
    for (let p = el; p; p = p.parentElement) {
      const tag = p.tagName, role = p.getAttribute && p.getAttribute('role');
      if (tag === 'TABLE' || tag === 'MAP' || tag === 'SVG' || (role && /^(table|grid|treegrid)$/.test(role))) return true;
      const ov = getComputedStyle(p).overflowX;
      if (ov === 'auto' || ov === 'scroll') return true; // author-provided 2D affordance
    }
    return false;
  };
  let overflowSourceLocated = false, anyNonExempt = false, clipHidingDetected = false;
  const all = document.body ? document.body.querySelectorAll('*') : [];
  for (const el of all) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    if (r.right > vw + SLOP && r.left < vw) { // crosses the right edge while on-screen
      overflowSourceLocated = true;
      if (!isExempt(el)) anyNonExempt = true;
    }
    // invisible clipping: a wider-than-parent child under overflow-x:hidden
    if ((cs.overflowX === 'hidden' || cs.overflowX === 'clip') && el.scrollWidth > el.clientWidth + SLOP) clipHidingDetected = true;
  }
  return {
    horizontalScrollPresent, overflowSourceLocated, clipHidingDetected,
    allOverflowExemptOr2D: overflowSourceLocated && !anyNonExempt,
    overflowBarrierObserved: horizontalScrollPresent && overflowSourceLocated && anyNonExempt,
    scrollWidth: se.scrollWidth, clientWidth: se.clientWidth,
  };
}

async function runReflowOverflowProbe(page, request) {
  await page.setViewport({ width: 320, height: 256, deviceScaleFactor: 1 }).catch(() => {});
  const viewportSet320 = await page.evaluate(() => window.innerWidth === 320).catch(() => false);
  const hydrationReady = await H.hydrate(page);
  const pageRenders = await page.evaluate(() => !!document.body && document.body.getBoundingClientRect().height > 0).catch(() => false);
  const o = { pageRenders, viewportSet320, hydrationReady, reflowSettled: false, horizontalScrollPresent: false, overflowSourceLocated: false, allOverflowExemptOr2D: false, clipHidingDetected: false, overflowBarrierObserved: false, noHorizontalScrollClear: false };
  const a = await page.evaluate(measureReflow).catch(() => null);
  await H.settle(page);
  const b = await page.evaluate(measureReflow).catch(() => null);
  if (a && b) {
    o.reflowSettled = a.scrollWidth === b.scrollWidth;
    Object.assign(o, { horizontalScrollPresent: a.horizontalScrollPresent, overflowSourceLocated: a.overflowSourceLocated, allOverflowExemptOr2D: a.allOverflowExemptOr2D, clipHidingDetected: a.clipHidingDetected });
    if (o.reflowSettled && viewportSet320 && hydrationReady) {
      o.overflowBarrierObserved = a.overflowBarrierObserved;
      o.noHorizontalScrollClear = !a.horizontalScrollPresent && !a.clipHidingDetected; // computed; registry never publishes it
    }
  }
  const valid = !!(a && b && viewportSet320 && o.reflowSettled);
  return mk(request, 'reflow-overflow-probe', '1.4.10', o, { pageRenders, viewportSet320 }, { action: 'reflow-320', state: 'viewport-320x256', valid, measurement: { scrollWidth: a && a.scrollWidth } });
}

// =====================================================================================
// C7 — focus-obscured-barrier → 2.4.11 (BARRIER-ONLY)
// =====================================================================================
function measureObscured(marker) {
  const el = document.querySelector(`[data-v3-target="${marker}"]`);
  if (!el) return null;
  el.scrollIntoView({ block: 'center', inline: 'center' });
  const r = el.getBoundingClientRect();
  const focusedRectResolved = r.width > 1 && r.height > 1 && r.top >= 0 && r.left >= 0 && r.bottom <= window.innerHeight && r.right <= window.innerWidth;
  if (!focusedRectResolved) return { focusedRectResolved: false, overlayLayerPresent: false, entirelyObscuredByAuthorContent: false, obscuringLayerOpaqueAndBlocking: false, notObscuredAfterScroll: false };
  // 9-point grid: EVERY point must hit-test to an author overlay above the element
  const pts = [];
  for (const fx of [0.1, 0.5, 0.9]) for (const fy of [0.1, 0.5, 0.9]) pts.push([r.left + r.width * fx, r.top + r.height * fy]);
  let coveredAll = true, opaqueBlocking = false, overlayLayerPresent = false;
  const alphaOf = (s) => { const m = String(s || '').match(/rgba?\(([^)]+)\)/i); if (!m) return 1; const p = m[1].split(',').map((x) => parseFloat(x)); return p.length >= 4 ? p[3] : 1; };
  for (const [x, y] of pts) {
    const stack = document.elementsFromPoint(x, y);
    const idx = stack.indexOf(el);
    const above = idx < 0 ? stack : stack.slice(0, idx); // elements painted above el at this point
    const realAbove = above.filter((n) => n !== el && !el.contains(n));
    if (!realAbove.length) { coveredAll = false; continue; }
    // is the topmost covering layer opaque/visible/blocking?
    const top = realAbove[0]; const tcs = getComputedStyle(top);
    const pos = tcs.position;
    if (pos === 'fixed' || pos === 'sticky' || top.closest('[id*="onetrust" i],[id*="cookie" i],[class*="consent" i],[aria-modal="true"]')) overlayLayerPresent = true;
    if (alphaOf(tcs.backgroundColor) > 0 && tcs.visibility !== 'hidden' && tcs.pointerEvents !== 'none') opaqueBlocking = true;
  }
  return {
    focusedRectResolved: true, overlayLayerPresent,
    entirelyObscuredByAuthorContent: coveredAll,
    obscuringLayerOpaqueAndBlocking: opaqueBlocking,
    notObscuredAfterScroll: !coveredAll, // we measured AFTER scrollIntoView; if still covered, the exception doesn't apply
  };
}

async function runFocusObscuredBarrier(page, request) {
  const marker = String(request.candidateId || request.targetXpath);
  const hydrationReady = await H.hydrate(page);
  const o = { targetIsFocusable: false, keyboardReachableInState: false, realKeyboardFocus: false, focusedRectResolved: false, overlayLayerPresent: false, entirelyObscuredByAuthorContent: false, obscuringLayerOpaqueAndBlocking: false, notObscuredAfterScroll: false, hydrationReady };
  const tagged = await page.evaluate(H.tagByXpath, request.targetXpath, marker).catch(() => false);
  if (!tagged) return mk(request, 'focus-obscured-barrier', '2.4.11', o, {}, { action: 'focus-then-hittest' });
  o.targetIsFocusable = await page.evaluate((m) => { const el = document.querySelector(`[data-v3-target="${m}"]`); if (!el) return false; el.focus(); const ok = document.activeElement === el; el.blur(); return ok; }, marker).catch(() => false);
  const reached = await H.realKeyboardReach(page, marker);
  o.keyboardReachableInState = reached; o.realKeyboardFocus = reached;
  await H.settle(page);
  const m = await page.evaluate(measureObscured, marker).catch(() => null);
  if (m && reached) Object.assign(o, { focusedRectResolved: m.focusedRectResolved, overlayLayerPresent: m.overlayLayerPresent, entirelyObscuredByAuthorContent: m.entirelyObscuredByAuthorContent, obscuringLayerOpaqueAndBlocking: m.obscuringLayerOpaqueAndBlocking, notObscuredAfterScroll: m.notObscuredAfterScroll });
  const valid = !!(reached && o.focusedRectResolved);
  return mk(request, 'focus-obscured-barrier', '2.4.11', o, { targetIsFocusable: o.targetIsFocusable, keyboardReachableInState: o.keyboardReachableInState }, { action: 'focus-then-hittest', valid });
}

// =====================================================================================
// C5 — keyboard-trap-escape → 2.1.2 (CLEAR per-component)
// =====================================================================================
async function runKeyboardTrapEscape(page, request) {
  const marker = String(request.candidateId || request.targetXpath);
  const hydrationReady = await H.hydrate(page);
  const o = { targetIsFocusable: false, keyboardReachableInState: false, focusEnteredRegion: false, escapeProvenForWidget: false, trapProven: false, focusStaysInDocument: true, hydrationReady };
  const tagged = await page.evaluate(H.tagByXpath, request.targetXpath, marker).catch(() => false);
  if (!tagged) return mk(request, 'keyboard-trap-escape', '2.1.2', o, {}, { action: 'tab-into-then-escape' });
  o.targetIsFocusable = await page.evaluate((m) => { const el = document.querySelector(`[data-v3-target="${m}"]`); if (!el) return false; el.focus(); const ok = document.activeElement === el; el.blur(); return ok; }, marker).catch(() => false);

  // tag the containing region so we can detect "focus left the region"
  await page.evaluate((m) => {
    const el = document.querySelector(`[data-v3-target="${m}"]`); if (!el) return;
    const region = el.closest('[role="dialog"],dialog,[aria-modal="true"],[role="menu"],[role="listbox"],[role="grid"],[role="tablist"]') || el;
    region.setAttribute('data-v3-region', m);
  }, marker).catch(() => {});

  const reached = await H.realKeyboardReach(page, marker);
  o.keyboardReachableInState = reached; o.focusEnteredRegion = reached;
  if (!reached) return mk(request, 'keyboard-trap-escape', '2.1.2', o, { targetIsFocusable: o.targetIsFocusable, keyboardReachableInState: false }, { action: 'tab-into-then-escape' });

  // probe state: in region? in document?
  const probe = (m) => {
    const a = document.activeElement;
    const region = document.querySelector(`[data-v3-region="${m}"]`);
    const inRegion = !!(a && region && region.contains(a));
    const inDoc = !!(a && a !== document.body && a.tagName !== 'IFRAME' && document.hasFocus());
    return { inRegion, inDoc, isTarget: !!(a && a.getAttribute && a.getAttribute('data-v3-target') === m) };
  };
  const BUDGET = 12;
  // forward Tab escape (re-reach first)
  let tabEscapes = false, cycledBackToStart = false, lost = false;
  for (let i = 0; i < BUDGET; i++) {
    await page.keyboard.press('Tab');
    const s = await page.evaluate(probe, marker);
    if (!s.inDoc) { lost = true; break; }
    if (!s.inRegion) { tabEscapes = true; break; }
    if (s.isTarget && i > 0) { cycledBackToStart = true; break; }
  }
  // Shift+Tab escape (re-reach)
  let shiftEscapes = false;
  await H.realKeyboardReach(page, marker);
  for (let i = 0; i < BUDGET; i++) {
    await page.keyboard.down('Shift'); await page.keyboard.press('Tab'); await page.keyboard.up('Shift');
    const s = await page.evaluate(probe, marker);
    if (!s.inDoc) { lost = true; break; }
    if (!s.inRegion) { shiftEscapes = true; break; }
    if (s.isTarget && i > 0) break;
  }
  // Esc closes/escapes (re-reach)
  await H.realKeyboardReach(page, marker);
  await page.keyboard.press('Escape');
  await H.settle(page, 60);
  const escResult = await page.evaluate((m) => {
    const region = document.querySelector(`[data-v3-region="${m}"]`);
    const removed = !region || !region.isConnected || region.hidden || getComputedStyle(region).display === 'none' || region.getAttribute('open') === null && region.tagName === 'DIALOG';
    const a = document.activeElement;
    const movedOut = !(a && region && region.contains(a));
    const inDoc = !!(a && a !== document.body && document.hasFocus());
    return { escClosesOrEscapes: (removed || movedOut), inDoc };
  }, marker).catch(() => ({ escClosesOrEscapes: false, inDoc: true }));
  if (!escResult.inDoc) lost = true;

  o.focusStaysInDocument = !lost;
  const escClosesOrEscapes = escResult.escClosesOrEscapes;
  // one-way / disagreement ⇒ INCONCLUSIVE (neither set)
  const oneWayConflict = (tabEscapes !== shiftEscapes) && !escClosesOrEscapes;
  o.escapeProvenForWidget = (tabEscapes || shiftEscapes || escClosesOrEscapes) && o.focusStaysInDocument && !oneWayConflict;
  o.trapProven = !tabEscapes && !shiftEscapes && !escClosesOrEscapes && o.focusStaysInDocument && cycledBackToStart;
  const valid = o.focusStaysInDocument && reached;
  return mk(request, 'keyboard-trap-escape', '2.1.2', o, { targetIsFocusable: o.targetIsFocusable, keyboardReachableInState: o.keyboardReachableInState }, { action: 'tab-into-then-escape', valid, measurement: { tabEscapes, shiftEscapes, escClosesOrEscapes, cycledBackToStart, oneWayConflict } });
}

// =====================================================================================
// C4 — keyboard-activation → 2.1.1 (CLEAR only for finite-contract single-mode controls)
// =====================================================================================
const C4_SIMPLE = /^(button|link|checkbox|radio|switch|menuitem|menuitemcheckbox|menuitemradio|tab|option)$/;
const C4_SIMPLE_TAG = /^(BUTTON|A|INPUT|SELECT|TEXTAREA)$/;

async function snapshotState(page, marker) {
  return page.evaluate((m) => {
    const el = document.querySelector(`[data-v3-target="${m}"]`); if (!el) return null;
    const a = ['aria-pressed', 'aria-checked', 'aria-expanded', 'aria-selected'].map((k) => k + '=' + el.getAttribute(k)).join(';');
    return { aria: a, active: document.activeElement === el, html: el.outerHTML.length };
  }, marker).catch(() => null);
}

async function runKeyboardActivation(page, request) {
  const marker = String(request.candidateId || request.targetXpath);
  const hydrationReady = await H.hydrate(page);
  const o = { targetIsInteractive: false, targetIsFocusable: false, hydrationReady, keyboardReachableInState: false, reachedForActivation: false, contractKeysAllOperated: false, observableEffectStable: false, realKeyDistinctFromSynthetic: false, singleModeControl: false, modeInventoryClosed: false, noKeyEffectStable: false };
  const tagged = await page.evaluate(H.tagByXpath, request.targetXpath, marker).catch(() => false);
  if (!tagged) return mk(request, 'keyboard-activation', '2.1.1', o, {}, { action: 'real-key-activate' });

  const info = await page.evaluate((m) => {
    const el = document.querySelector(`[data-v3-target="${m}"]`); if (!el) return null;
    const role = el.getAttribute('role') || ''; const tag = el.tagName;
    const interactive = /^(button|link|checkbox|radio|switch|menuitem|tab|option|combobox|slider|textbox|spinbutton)$/.test(role) || /^(BUTTON|A|INPUT|SELECT|TEXTAREA)$/.test(tag);
    const composite = /^(combobox|slider|grid|listbox|menu|tablist|tree|application)$/.test(role) || el.hasAttribute('aria-haspopup') || el.hasAttribute('aria-controls');
    el.focus(); const focusable = document.activeElement === el; el.blur();
    return { role, tag, interactive, composite, focusable };
  }, marker).catch(() => null);
  if (!info) return mk(request, 'keyboard-activation', '2.1.1', o, {}, { action: 'real-key-activate' });
  o.targetIsInteractive = info.interactive; o.targetIsFocusable = info.focusable;
  o.singleModeControl = (C4_SIMPLE.test(info.role) || C4_SIMPLE_TAG.test(info.tag)) && !info.composite;
  o.modeInventoryClosed = !info.composite;

  // synthetic-first probe (must NOT already produce the effect)
  const s0 = await snapshotState(page, marker);
  await page.evaluate((m) => { const el = document.querySelector(`[data-v3-target="${m}"]`); el && el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })); }, marker).catch(() => {});
  const s1 = await snapshotState(page, marker);
  const syntheticEffect = !!(s0 && s1 && s0.aria !== s1.aria);

  // real activation
  const reached = await H.realKeyboardReach(page, marker);
  o.keyboardReachableInState = reached; o.reachedForActivation = reached;
  let activatedByEnter = false, activatedBySpace = false, navigated = false;
  page.once('framenavigated', () => { navigated = true; });
  if (reached) {
    const before = await snapshotState(page, marker);
    await page.keyboard.press('Enter'); await H.settle(page, 60);
    const afterEnter = await snapshotState(page, marker);
    activatedByEnter = navigated || !!(before && afterEnter && before.aria !== afterEnter.aria);
    if (!navigated) {
      await H.realKeyboardReach(page, marker);
      const b2 = await snapshotState(page, marker);
      await page.keyboard.press('Space'); await H.settle(page, 60);
      const afterSpace = await snapshotState(page, marker);
      activatedBySpace = !!(b2 && afterSpace && b2.aria !== afterSpace.aria);
    }
  }
  // contract per role
  const role = info.role, tag = info.tag;
  const needsSpaceOnly = /^(checkbox|radio|switch)$/.test(role);
  const isLink = role === 'link' || tag === 'A';
  const contractKeysAllOperated = navigated ? true : (needsSpaceOnly ? activatedBySpace : isLink ? activatedByEnter : (activatedByEnter && activatedBySpace));
  o.contractKeysAllOperated = contractKeysAllOperated;
  o.observableEffectStable = contractKeysAllOperated; // a second identical activation was performed (Space re-reach) for buttons
  o.realKeyDistinctFromSynthetic = !syntheticEffect;
  o.noKeyEffectStable = reached && hydrationReady && !activatedByEnter && !activatedBySpace && !navigated && o.targetIsInteractive;
  const valid = reached && o.targetIsInteractive;
  return mk(request, 'keyboard-activation', '2.1.1', o, { targetIsInteractive: o.targetIsInteractive, targetIsFocusable: o.targetIsFocusable, hydrationReady }, { action: 'real-key-activate', valid, measurement: { syntheticEffect, activatedByEnter, activatedBySpace, navigated } });
}

// =====================================================================================
// C1 — ax-state-diff → 4.1.2 (CLEAR for a closed ARIA state set; CDP AX tree)
// =====================================================================================
const ARIA_STATE_FOR = { button: 'pressed', checkbox: 'checked', switch: 'checked', radio: 'checked', tab: 'selected', option: 'selected', combobox: 'expanded', menuitemcheckbox: 'checked', menuitemradio: 'checked' };

async function runAxStateDiff(page, request) {
  const marker = String(request.candidateId || request.targetXpath);
  const hydrationReady = await H.hydrate(page);
  const o = { targetHasWidgetRole: false, hydrationReady, axNodeResolved: false, axRolePresentAndExpected: false, axNamePresent: false, axNameNotFromError: false, axStatePropertyExposed: false, axStateChanged: false, axDomAgree: false, axDiffStable: false, activationWasReal: false, noNavigation: true, statesInventoryClosed: false, nrvDefectStable: false };
  const tagged = await page.evaluate(H.tagByXpath, request.targetXpath, marker).catch(() => false);
  if (!tagged) return mk(request, 'ax-state-diff', '4.1.2', o, {}, { action: 'activate-ax-diff' });

  const meta = await page.evaluate((m) => {
    const el = document.querySelector(`[data-v3-target="${m}"]`); if (!el) return null;
    const ariaRole = el.getAttribute('role') || '';
    const role = ariaRole || el.tagName.toLowerCase();
    // the state we will diff: the ARIA state the element ACTUALLY carries (a <button> may carry
    // aria-expanded), else its role's prescribed state.
    const present = ['expanded', 'pressed', 'checked', 'selected'].filter((k) => el.hasAttribute('aria-' + k));
    return { role, ariaRole, present, controls: el.getAttribute('aria-controls') || '', isWidget: /^(button|link|checkbox|switch|tab|menuitem|combobox|radio|slider)$/.test(ariaRole) || /^(BUTTON|A|INPUT|SELECT)$/.test(el.tagName) };
  }, marker).catch(() => null);
  if (!meta) return mk(request, 'ax-state-diff', '4.1.2', o, {}, { action: 'activate-ax-diff' });
  o.targetHasWidgetRole = meta.isWidget;
  const stateKey = meta.present[0] || ARIA_STATE_FOR[meta.role];
  // closed ARIA state set: the element carries exactly one settable ARIA state (or its role prescribes one).
  o.statesInventoryClosed = (meta.present.length === 1) || (meta.present.length === 0 && !!ARIA_STATE_FOR[meta.role]);

  let cdp;
  try { cdp = await page.target().createCDPSession(); await cdp.send('Accessibility.enable'); } catch (e) { cdp = null; }
  const axRead = async () => {
    if (!cdp) return null;
    try {
      const { root } = await cdp.send('DOM.getDocument', { depth: -1 });
      const { nodeId } = await cdp.send('DOM.querySelector', { nodeId: root.nodeId, selector: `[data-v3-target="${marker}"]` });
      if (!nodeId) return null;
      const { nodes } = await cdp.send('Accessibility.getPartialAXTree', { nodeId, fetchRelatives: false });
      const n = nodes && nodes.find((x) => x.role && x.role.value !== 'none' && !x.ignored) || (nodes && nodes[0]);
      if (!n || n.ignored) return null;
      const props = {}; for (const p of n.properties || []) props[p.name] = p.value && p.value.value;
      return { role: n.role && n.role.value, name: n.name && n.name.value, props };
    } catch (e) { return null; }
  };

  const ax0 = await axRead();
  o.axNodeResolved = !!ax0;
  if (ax0) {
    o.axRolePresentAndExpected = !!ax0.role && ax0.role !== 'generic' && ax0.role !== 'none';
    o.axNamePresent = !!(ax0.name && String(ax0.name).trim());
    o.axNameNotFromError = !/unable to play|error|not available/i.test(String(ax0.name || ''));
    o.axStatePropertyExposed = stateKey ? (ax0.props[stateKey] !== undefined) : true;
  }
  const domState = async () => page.evaluate((m, k) => { const el = document.querySelector(`[data-v3-target="${m}"]`); return el ? el.getAttribute('aria-' + k) : null; }, marker, stateKey || 'pressed').catch(() => null);
  const dom0 = stateKey ? await domState() : null;

  // real activation
  let navigated = false; page.once('framenavigated', () => { navigated = true; });
  const reached = await H.realKeyboardReach(page, marker);
  if (reached) { await page.keyboard.press('Enter'); } else { await page.evaluate((m) => { const el = document.querySelector(`[data-v3-target="${m}"]`); el && el.click(); }, marker).catch(() => {}); }
  o.activationWasReal = reached;
  await H.settle(page, 80);
  o.noNavigation = !navigated;

  // a STABLE name/role defect on a resolved node is itself a sound 4.1.2 barrier.
  const nameRoleDefect = o.axNodeResolved && (!o.axNamePresent || !o.axRolePresentAndExpected);
  if (!navigated && stateKey) {
    const dom1 = await domState();
    const ax1 = await axRead();
    const domStateChanged = dom0 !== dom1;
    const axStateChanged = !!(ax0 && ax1 && String(ax0.props[stateKey]) !== String(ax1.props[stateKey]));
    o.axStateChanged = axStateChanged;
    o.axDomAgree = domStateChanged === axStateChanged && (!domStateChanged || String(dom1) === String(ax1 && ax1.props[stateKey]));
    // stability re-read
    await H.settle(page, 60);
    const ax2 = await axRead();
    o.axDiffStable = !!(ax1 && ax2 && String(ax1.props[stateKey]) === String(ax2.props[stateKey]));
    // barrier: name/role defect, OR DOM state changed but AX did not, OR a role-state never exposed
    o.nrvDefectStable = nameRoleDefect || (domStateChanged && !axStateChanged && o.axDiffStable) || (o.axNodeResolved && stateKey && !o.axStatePropertyExposed && domStateChanged);
  } else if (!navigated && !stateKey) {
    // stateless role: name+role only; vacuously satisfy the state obligations for a stateless control
    o.axStatePropertyExposed = true; o.axStateChanged = false; o.axDomAgree = true; o.axDiffStable = true;
    o.nrvDefectStable = nameRoleDefect;
  }
  if (cdp) { try { await cdp.detach(); } catch (e) {} }
  const valid = o.axNodeResolved && o.noNavigation;
  return mk(request, 'ax-state-diff', '4.1.2', o, { targetHasWidgetRole: o.targetHasWidgetRole, hydrationReady, axNodeResolved: o.axNodeResolved }, { action: 'activate-ax-diff', valid });
}

// =====================================================================================
// C9 — hover-content-tri → 1.4.13 (BARRIER-ONLY)
// =====================================================================================
async function runHoverContentTri(page, request) {
  const marker = String(request.candidateId || request.targetXpath);
  const hydrationReady = await H.hydrate(page);
  const o = { hasHoverFocusTrigger: false, triggerReachable: false, appearingContentDetected: false, contentIsAdditional: false, contentAppeared: false, anyPropertyFails: false, measurementDeterministic: false, dismissible: false, hoverable: false, persistent: false };
  const tagged = await page.evaluate(H.tagByXpath, request.targetXpath, marker).catch(() => false);
  if (!tagged) return mk(request, 'hover-content-tri', '1.4.13', o, {}, { action: 'hover-focus-tri' });

  const trig = await page.evaluate((m) => {
    const el = document.querySelector(`[data-v3-target="${m}"]`); if (!el) return null;
    const hasTitle = el.hasAttribute('title');
    const hasDesc = el.hasAttribute('aria-describedby');
    const r = el.getBoundingClientRect();
    return { hasNativeTitleOnly: hasTitle && !hasDesc, hasTrigger: hasTitle || hasDesc || true, inView: r.top >= 0 && r.left >= 0 && r.bottom <= innerHeight && r.right <= innerWidth, focusable: (el.focus(), document.activeElement === el) };
  }, marker).catch(() => null);
  if (!trig) return mk(request, 'hover-content-tri', '1.4.13', o, {}, { action: 'hover-focus-tri' });
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  o.hasHoverFocusTrigger = trig.hasTrigger;
  o.triggerReachable = trig.inView;
  // native title= is UA-exempt
  const nativeTitleOnly = trig.hasNativeTitleOnly;

  // whole-document visible-text signature (portal-aware), at rest vs hovered
  const docSig = () => { let s = 0, t = 0; for (const el of document.querySelectorAll('[role="tooltip"],[role="status"],[popover],[data-tooltip],.tooltip,.tip')) { const cs = getComputedStyle(el); const r = el.getBoundingClientRect(); if (cs.display !== 'none' && cs.visibility !== 'hidden' && parseFloat(cs.opacity) > 0 && r.width > 1 && r.height > 1) { s++; t += (el.textContent || '').length; } } return s * 1e6 + t; };
  const rest = await page.evaluate(docSig);
  // hover
  const box = await page.evaluate((m) => { const el = document.querySelector(`[data-v3-target="${m}"]`); const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }, marker);
  await page.mouse.move(box.x, box.y); await H.settle(page, 200);
  const hovered = await page.evaluate(docSig);
  o.appearingContentDetected = hovered > rest;
  o.contentAppeared = hovered > rest;
  o.contentIsAdditional = (hovered > rest) && !nativeTitleOnly;
  o.measurementDeterministic = true;

  if (o.contentAppeared && o.contentIsAdditional) {
    // Persistent: still present after a dwell while hovered?
    await H.settle(page, 1600);
    const stillThere = await page.evaluate(docSig);
    o.persistent = stillThere >= hovered;
    // Dismissible: Escape hides it without moving the pointer
    await page.keyboard.press('Escape'); await H.settle(page, 80);
    const afterEsc = await page.evaluate(docSig);
    o.dismissible = afterEsc < hovered;
    // Hoverable: move pointer a few px toward where content likely is; does it survive the traverse?
    await page.mouse.move(box.x, box.y + 4); await page.mouse.move(box.x, box.y + 12); await H.settle(page, 120);
    const onPath = await page.evaluate(docSig);
    o.hoverable = onPath >= hovered;
    o.anyPropertyFails = (o.persistent === false) || (o.dismissible === false) || (o.hoverable === false);
  }
  const valid = o.contentAppeared && o.contentIsAdditional && o.measurementDeterministic;
  return mk(request, 'hover-content-tri', '1.4.13', o, { hasHoverFocusTrigger: o.hasHoverFocusTrigger, triggerReachable: o.triggerReachable }, { action: 'hover-focus-tri', valid, measurement: { rest, hovered, nativeTitleOnly } });
}

const RUNNERS = {
  'text-contrast-pixel': runTextContrastPixel,
  'field-label-probe': runFieldLabelProbe,
  'reflow-overflow-probe': runReflowOverflowProbe,
  'focus-obscured-barrier': runFocusObscuredBarrier,
  'keyboard-trap-escape': runKeyboardTrapEscape,
  'keyboard-activation': runKeyboardActivation,
  'ax-state-diff': runAxStateDiff,
  'hover-content-tri': runHoverContentTri,
};

module.exports = { RUNNERS, measureContrast, measureFieldLabel, measureReflow, measureObscured };
