'use strict';
// C4 — deterministic WCAG 1.4.11 (Non-text Contrast) runner.
//
// The non-text-contrast-v0 rubric is written against a deterministic producer that did not exist:
// "The deterministic non-text-contrast runner already CLEARS (or fails) every UI component / graphical
// object it can reduce to two flat, opaque colors." This module IS that producer.
//
// CORE MODEL (1.4.11): a component is perceivable iff the STRONGEST visual cue that distinguishes it from
// its ADJACENT surface has >= 3:1 contrast. Cues = each visible opaque BORDER side, the opaque FILL (when it
// differs from the adjacent surface), and (focus state) the OUTLINE / box-shadow ring. The component fails iff
// the strongest such cue is < 3:1 (the worst boundary governs perceivability of the WHOLE component, but a
// component with ONE strong cue is perceivable — so we take the MAX over cues, then compare to 3:1).
//
// DETERMINISM BOUNDARY: decide ONLY when the adjacent surface AND the cue are FLAT + OPAQUE. A gradient /
// image / semi-transparent / anti-aliased-into-neighbor adjacent ⇒ ABSTAIN (leave auto-PARTIAL with an
// uncertainReason naming the side the pixels must judge — exactly what the rubric consumes). Absence of a
// finding is NEVER a pass.
//
// EXEMPTIONS (return decided=false, exempt=true): inactive/disabled components; pure default-UA styling
// (no author border/outline/background/box-shadow — the UA default is exempt); decorative/aria-hidden.

const A = require('../../lib/a11y-eval.js');

const THRESHOLD = 3.0; // 1.4.11 fixed threshold

// ---- in-page resolver: gather the component's cue colors + the adjacent surface, all as used-rgba ----
// Returns null on not-found. Strings are canvas-normalized rgba so parseRGB never chokes (oklch/color()).
function collectNonTextFacts(selector, opts) {
  const want = opts || {};
  const el = selector.startsWith('//')
    ? document.evaluate(selector, document, null, 9, null).singleNodeValue
    : document.querySelector(selector);
  if (!el || el.nodeType !== 1) return null;
  const toRgba = (c) => { try { const cv = document.createElement('canvas'); cv.width = cv.height = 1; const cx = cv.getContext('2d'); cx.fillStyle = c; cx.fillRect(0, 0, 1, 1); const d = cx.getImageData(0, 0, 1, 1).data; return `rgba(${d[0]}, ${d[1]}, ${d[2]}, ${(d[3] / 255).toFixed(3)})`; } catch (e) { return c; } };
  const alphaOf = (rgba) => { const m = /rgba?\(([^)]+)\)/.exec(rgba); if (!m) return 1; const p = m[1].split(',').map((x) => parseFloat(x)); return p.length >= 4 ? p[3] : 1; };
  const transparent = (rgba) => alphaOf(rgba) < 0.999;
  // alpha-composite a translucent cue OVER its (opaque) backdrop ⇒ the actual rendered opaque colour. A semi-transparent
  // border/fill IS deterministic once composited (e.g. rgba(0,0,0,.45) over white = #8c8c8c), so do not abstain on it.
  const compositeOver = (fg, bg) => { const fa = alphaOf(fg); const fm = /(\d+),\s*(\d+),\s*(\d+)/.exec(fg); const bm = /(\d+),\s*(\d+),\s*(\d+)/.exec(bg); if (!fm || !bm) return null; const mix = (i) => Math.round(fa * +fm[i] + (1 - fa) * +bm[i]); return `rgba(${mix(1)}, ${mix(2)}, ${mix(3)}, 1.000)`; };
  const cs = getComputedStyle(el);

  // EXEMPTIONS — only GENUINELY inactive. Native `disabled` is truly inactive ⇒ exempt. But `aria-disabled="true"`
  // on a STILL-FOCUSABLE/operable control is a "looks-disabled" trap, NOT inactive ⇒ in scope. So aria-disabled
  // exempts only when the element is also non-focusable (tabindex<0 / not natively focusable).
  const ariaDis = el.getAttribute('aria-disabled') === 'true' || el.closest('[aria-disabled="true"]') != null;
  const nativeFocusable = /^(a|button|select|textarea)$/i.test(el.tagName) || (el.tagName === 'INPUT' && el.getAttribute('type') !== 'hidden');
  const focusable = el.tabIndex >= 0 || (nativeFocusable && el.tabIndex !== -1 && el.disabled !== true);
  const disabled = el.disabled === true || el.closest('[disabled]') != null || (ariaDis && !focusable);
  const ariaHidden = el.getAttribute('aria-hidden') === 'true' || el.closest('[aria-hidden="true"]') != null;
  // GRAPHICAL OBJECT: a chart/icon/diagram/canvas whose MEANING-BEARING parts need per-part perceptual judgment
  // (which parts are required, anti-aliased wedge boundaries, etc.) — the deterministic flat-cue model cannot
  // reduce it soundly, so DEFER to the rubric (this is exactly the "graphical objects ... reach you" contract).
  const graphical = /^(svg|canvas|img)$/i.test(el.tagName) || ['img', 'figure', 'graphics-document', 'graphics-symbol', 'graphics-object'].includes(el.getAttribute('role')) || el.querySelector('svg, canvas') != null || /chart|graph|diagram|gauge|legend|sparkline|\bplot\b|wedge|donut|pie/i.test(typeof el.className === 'string' ? el.className : '');
  // STATE INDICATOR (toggle/checkbox/radio): the state is conveyed by an internal SUB-PART (knob/tick) against its
  // track, not the component boundary vs the page — a sound comparison needs per-part rendered pixels. Defer.
  const clsName = typeof el.className === 'string' ? el.className : '';
  const stateIndicator = /^(checkbox|radio)$/i.test(el.getAttribute('type') || '') || ['switch', 'checkbox', 'radio'].includes(el.getAttribute('role')) || /\b(toggle|switch|track|knob|thumb|slider-handle)\b/i.test(clsName);
  // gradient/image ON THE COMPONENT ITSELF ⇒ no flat cue to reduce.
  const componentImage = cs.backgroundImage != null && cs.backgroundImage !== 'none';
  // SUB-PART cues the flat boundary model cannot measure against the right surface — defer to pixels (like state
  // indicators): a ::before/::after BAR/underline (e.g. a selected-tab underline), or a NESTED fill occupying part of
  // the box (a progress fill vs its track, a highlight ring on a dark row).
  const pseudoBar = (ps) => { const s = getComputedStyle(el, ps); const c = s.content; if (!c || c === 'none') return false; return !transparent(toRgba(s.backgroundColor)); };
  const pseudoCue = pseudoBar('::before') || pseudoBar('::after');
  const myBg = toRgba(cs.backgroundColor); const ownBox = el.getBoundingClientRect();
  const nestedFill = [...el.children].some((ch) => { const cbg = toRgba(getComputedStyle(ch).backgroundColor); if (transparent(cbg) || cbg === myBg) return false; const cr = ch.getBoundingClientRect(); return cr.width >= 2 && cr.height >= 2 && (cr.width < ownBox.width - 2 || cr.height < ownBox.height - 2); });

  // ADJACENT surface (1.4.11 judges the boundary against the ADJACENT colour, not the page bg). Sample it at the 4
  // side-midpoints JUST OUTSIDE the box via elementFromPoint → each point's effective opaque bg. If the sampled
  // adjacents DISAGREE (a boundary straddling two surfaces — worst side governs) or any is an image, the adjacent
  // is non-uniform ⇒ abstain (safe; a single flat ratio would false-clear the failing side). Else use the uniform
  // sampled colour. Falls back to the ancestor walk-up when no point is samplable (off-viewport).
  const effBg = (node) => { let s = node, img = false, c = null; while (s) { const sb = getComputedStyle(s); if (sb.backgroundImage && sb.backgroundImage !== 'none') { img = true; break; } const b = toRgba(sb.backgroundColor); if (!transparent(b)) { c = b; break; } s = s.parentElement; } return img ? 'IMAGE' : (c || 'rgba(255, 255, 255, 1.000)'); };
  const lum = (rgba) => { const m = /(\d+),\s*(\d+),\s*(\d+)/.exec(rgba || ''); if (!m) return null; const ln = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); }; return 0.2126 * ln(+m[1]) + 0.7152 * ln(+m[2]) + 0.0722 * ln(+m[3]); };
  const b0 = el.getBoundingClientRect();
  const pts = [[b0.left - 2, b0.top + b0.height / 2], [b0.right + 2, b0.top + b0.height / 2], [b0.left + b0.width / 2, b0.top - 2], [b0.left + b0.width / 2, b0.bottom + 2]];
  const adjSamples = [];
  for (const [px, py] of pts) { if (px < 0 || py < 0 || px >= window.innerWidth || py >= window.innerHeight) continue; const e2 = document.elementFromPoint(px, py); if (!e2 || el.contains(e2) || e2.contains(el)) continue; adjSamples.push(effBg(e2)); }
  let surfImage = adjSamples.includes('IMAGE'); let surf = null;
  const lvals = adjSamples.filter((x) => x !== 'IMAGE').map(lum).filter((x) => x != null);
  if (lvals.length >= 2 && (Math.max(...lvals) - Math.min(...lvals)) > 0.05) surfImage = true; // sides disagree ⇒ non-uniform (worst-side-governs) ⇒ abstain
  if (!surfImage) { const flat = adjSamples.find((x) => x !== 'IMAGE'); if (flat) surf = flat; }
  if (surf == null && !surfImage) { // fallback: ancestor walk-up (no samplable point)
    let surfEl = el.parentElement;
    while (surfEl) { const sb = getComputedStyle(surfEl); if (sb.backgroundImage && sb.backgroundImage !== 'none') { surfImage = true; break; } const bg = toRgba(sb.backgroundColor); if (!transparent(bg)) { surf = bg; break; } surfEl = surfEl.parentElement; }
    if (surf == null && !surfImage) surf = 'rgba(255, 255, 255, 1.000)';
  }

  // DEFAULT-UA exemption needs AUTHOR styling, not just computed presence (a bare <button> has a UA border).
  // getComputedStyle can't distinguish UA vs author, so detect author appearance from the inline style attr +
  // any AUTHOR stylesheet rule (document.styleSheets excludes the UA sheet) that matches el and sets a border/
  // background/outline/box-shadow/appearance. Native controls with NO author appearance = UA default = exempt.
  const native = /^(button|input|select|textarea|a|summary|details)$/i.test(el.tagName);
  const APPEAR = /(^| )(border|background|outline|box-shadow|appearance)/;
  let authorAppearance = false;
  const inlineStyle = el.getAttribute('style') || '';
  if (/(border|background|outline|box-shadow|appearance)/i.test(inlineStyle)) authorAppearance = true;
  if (!authorAppearance) {
    try {
      for (const sh of document.styleSheets) {
        let rules; try { rules = sh.cssRules; } catch (e) { continue; }
        if (!rules) continue;
        for (const rule of rules) {
          if (rule.type !== 1 || !rule.selectorText) continue;
          let m = false; try { m = el.matches(rule.selectorText.replace(/:focus(-visible)?/g, '')); } catch (e) { m = false; }
          if (!m) continue;
          const st = rule.style; for (let i = 0; i < st.length; i++) { if (APPEAR.test(st[i])) { authorAppearance = true; break; } }
          if (authorAppearance) break;
        }
        if (authorAppearance) break;
      }
    } catch (e) { /* ignore */ }
  }
  const fill = toRgba(cs.backgroundColor);
  const hasAuthorFill = !transparent(fill);
  const hasOutline = parseFloat(cs.outlineWidth) > 0 && cs.outlineStyle !== 'none';

  // CUES (only opaque ones are deterministic; a translucent cue ⇒ abstain-marker)
  // A translucent cue is deterministic ONCE composited over the flat adjacent surface; only abstain when the surface
  // itself is non-flat (an image/gradient — then there is no single backdrop to composite over).
  const flatSurf = surf && surf !== 'IMAGE' && !surfImage ? surf : null;
  const cues = []; let translucentCue = false;
  for (const side of ['Top', 'Right', 'Bottom', 'Left']) {
    const w = parseFloat(cs['border' + side + 'Width']); const style = cs['border' + side + 'Style'];
    if (w > 0 && style !== 'none') {
      const c = toRgba(cs['border' + side + 'Color']);
      if (transparent(c)) { const comp = flatSurf ? compositeOver(c, flatSurf) : null; if (comp) cues.push({ kind: 'border-' + side.toLowerCase(), color: comp, composited: true }); else translucentCue = true; }
      else cues.push({ kind: 'border-' + side.toLowerCase(), color: c });
    }
  }
  if (hasAuthorFill) cues.push({ kind: 'fill', color: fill });
  else { const fa = alphaOf(fill); if (fa > 0.02 && fa < 0.999) { const comp = flatSurf ? compositeOver(fill, flatSurf) : null; if (comp) cues.push({ kind: 'fill', color: comp, composited: true }); else translucentCue = true; } } // semi-transparent fill ⇒ composite over the surface
  if (want.focusState) {
    if (hasOutline) { const c = toRgba(cs.outlineColor); if (transparent(c)) { const comp = flatSurf ? compositeOver(c, flatSurf) : null; if (comp) cues.push({ kind: 'outline', color: comp, composited: true }); else translucentCue = true; } else cues.push({ kind: 'outline', color: c }); }
  }

  // FOCUS OCCLUSION/CLIP risk (F78): a focus indicator can have fine COLOR contrast yet be invisible because it is
  // clipped by an overflow ancestor or covered by a fixed/sticky element. Color alone cannot clear that — abstain to
  // the focus rubric (which sees the rendered pixels). Detect clip-ancestor + a fixed/sticky element overlapping the
  // (outline-padded) focus rect.
  let focusRisk = null;
  if (want.focusState) {
    const offset = parseFloat(cs.outlineOffset) || 0; const ow = parseFloat(cs.outlineWidth) || 0;
    let clip = false; let an = el.parentElement;
    while (an) { const ab = getComputedStyle(an); if (/(hidden|clip|scroll|auto)/.test(ab.overflow + ' ' + ab.overflowX + ' ' + ab.overflowY)) { clip = true; break; } an = an.parentElement; }
    const fr = el.getBoundingClientRect(); const pad = Math.max(4, ow) + Math.max(0, offset);
    const z = { l: fr.left - pad, t: fr.top - pad, r: fr.right + pad, b: fr.bottom + pad };
    let overlapFixed = false;
    try { for (const o of document.querySelectorAll('*')) { const os = getComputedStyle(o); if (os.position !== 'fixed' && os.position !== 'sticky') continue; if (o.contains(el) || el.contains(o)) continue; const orr = o.getBoundingClientRect(); if (orr.width < 2 || orr.height < 2) continue; if (!(orr.right < z.l || orr.left > z.r || orr.bottom < z.t || orr.top > z.b)) { overlapFixed = true; break; } } } catch (e) { /* ignore */ }
    if (clip || overlapFixed) focusRisk = { clip, overlapFixed };
  }
  const box = el.getBoundingClientRect();
  return {
    found: true, disabled, ariaHidden, graphical, stateIndicator, componentImage, pseudoCue, nestedFill, focusRisk, native, authorAppearance, surfaceImage: surfImage, surface: surf, fill,
    cues, translucentCue, role: el.getAttribute('role') || el.tagName.toLowerCase(),
    box: { w: box.width, h: box.height },
  };
}

// ---- Node-side disposition from the collected facts ----
function disposeFromFacts(f, opts) {
  const want = opts || {};
  if (!f || !f.found) return { decided: false, reason: 'not-found' };
  if (f.disabled) return { decided: false, exempt: true, exemptReason: 'inactive/disabled component (1.4.11 exempt)' };
  if (f.ariaHidden) return { decided: false, exempt: true, exemptReason: 'removed from a11y tree (decorative)' };
  if (f.graphical) return { decided: false, abstain: true, uncertainReason: 'graphical object (svg/canvas/chart/icon) — meaning-bearing parts need per-part perceptual judgment; defer to the non-text-contrast rubric' };
  if (f.stateIndicator) return { decided: false, abstain: true, uncertainReason: 'state indicator (toggle/checkbox/radio) — the state cue is an internal sub-part (knob/tick) vs its track; per-part contrast needs rendered pixels; defer to the rubric' };
  if (f.componentImage) return { decided: false, abstain: true, uncertainReason: 'component has a gradient/image background — no flat cue to reduce; judge from pixels' };
  if (f.nestedFill) return { decided: false, abstain: true, uncertainReason: 'a nested fill/indicator occupies part of the component (progress fill vs track / highlight ring on a row) — the perceivable cue is an INTERNAL sub-part contrast, judge from pixels' };
  // DEFAULT-UA exemption: a NATIVE control the author has not restyled renders with the (exempt) UA appearance +
  // UA focus ring. Once the author touches its border/background/outline, it is in scope.
  if (f.native && !f.authorAppearance) return { decided: false, exempt: true, exemptReason: 'default user-agent styling (1.4.11 exempt)' };
  if (f.surfaceImage) return { decided: false, abstain: true, uncertainReason: 'adjacent surface is a gradient/image — cannot reduce to a flat color; judge the boundary from pixels' };
  // FOCUS-INDICATOR scope: under focus, the cue that must clear 3:1 is the focus INDICATOR (the outline added on
  // focus), NOT the resting border/fill. Restrict cues to the outline; a non-outline indicator (box-shadow/border
  // delta) is not isolated deterministically yet ⇒ abstain to the focus rubric.
  // FOCUS indicators are owned by the 2.4.7 focus-visible lane: occlusion, off-component/offset geometry, partial
  // perimeter, and same-color-as-component all need the rendered focus pixels (a colour check alone false-clears
  // them). C4 owns RESTING component non-text contrast; defer focus entirely.
  if (want.focusState) return { decided: false, abstain: true, uncertainReason: 'focus-indicator non-text contrast (geometry/occlusion/offset) is owned by the 2.4.7 focus-visible lane — deferring' };
  const cues = f.cues;
  if (f.translucentCue && !cues.length) return { decided: false, abstain: true, uncertainReason: 'the only boundary cue is semi-transparent — composited color is not flat; judge from pixels' };
  if (!cues.length) {
    // the distinguishing cue may be a ::before/::after pseudo-element (a selected-tab underline/bar) the flat model
    // doesn't collect — defer to pixels rather than calling "no cue".
    if (f.pseudoCue) return { decided: false, abstain: true, uncertainReason: 'the distinguishing cue is a ::before/::after pseudo-element (bar/underline) — its contrast against the adjacent surface needs rendered pixels' };
    // no opaque distinguishing cue at all ⇒ the component has no perceivable boundary against its surface
    return { decided: true, verdict: 'fail', ratio: 1.0, cue: 'none', adjacent: f.surface, reason: 'no opaque border/fill/outline cue distinguishes the component from its adjacent surface (< 3:1)' };
  }
  const surf = A.parseRGB(f.surface); if (!surf) return { decided: false, abstain: true, uncertainReason: 'adjacent color unparseable' };
  let best = { ratio: 0, cue: null };
  for (const c of cues) {
    const p = A.parseRGB(c.color); if (!p) continue;
    const r = A.contrastRatioRaw([p.r, p.g, p.b], [surf.r, surf.g, surf.b]);
    if (r > best.ratio) best = { ratio: r, cue: c.kind, color: c.color };
  }
  if (best.cue == null) return { decided: false, abstain: true, uncertainReason: 'no parseable cue' };
  const ratio = +best.ratio.toFixed(2);
  // WCAG "do not round up": compare the unrounded ratio to 3.0
  const pass = best.ratio >= THRESHOLD;
  return {
    decided: true, verdict: pass ? 'pass' : 'fail', ratio, threshold: THRESHOLD,
    cue: best.cue, cueColor: best.color, adjacent: f.surface,
    reason: (pass ? 'strongest distinguishing cue ' : 'strongest distinguishing cue only ') + best.cue + ' = ' + ratio + ':1 vs adjacent surface' + (pass ? ' (>= 3:1)' : ' (< 3:1 — component boundary not perceivable)'),
    translucentCueAlsoPresent: f.translucentCue,
  };
}

// ---- driver: resolve in the page, optionally under :focus, dispose in Node ----
async function runNonTextContrast(page, { selector, focusState = false } = {}) {
  if (focusState) { try { await page.evaluate((sel) => { const el = sel.startsWith('//') ? document.evaluate(sel, document, null, 9, null).singleNodeValue : document.querySelector(sel); if (el && el.focus) el.focus({ preventScroll: true }); }, selector); } catch (e) { /* ignore */ } }
  const facts = await page.evaluate(collectNonTextFacts, selector, { focusState }).catch(() => null);
  const d = disposeFromFacts(facts, { focusState });
  return { sc: '1.4.11', selector, focusState, facts, ...d };
}

module.exports = { runNonTextContrast, disposeFromFacts, collectNonTextFacts, THRESHOLD };
