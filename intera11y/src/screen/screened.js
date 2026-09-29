'use strict';
// SCREENED candidates — elements the screening sweep selected that the criterion's rule-based inventory did not
// produce. They carry no kind-specific probe record, so no kind-specific rule can decide them: they go to the judge
// (assessment OPEN) with the element's record, every probe observation that concerns the element, and a crop of it
// when it is in the first viewport. The sweep's note says what to test; it is labelled as a selection reason, not a
// finding.
const png = require('../lib/png.js');
const { key } = require('../lib/xpath.js');

const MAX_RECORDS = 6;
const MAX_STRING = 400;
const B64 = /^[A-Za-z0-9+/]{2000,}={0,2}$/;

// Every object in the criterion's probe observations whose xpath is this element's, with images lifted out.
function observationsOf(xpath, obs) {
  const k = key(xpath);
  const records = [], images = [];
  const strip = (v, label, depth) => {
    if (typeof v === 'string') {
      if (B64.test(v)) { if (images.length < 4) images.push({ label: `${label} (probe capture)`, data: v }); return undefined; }
      return v.length > MAX_STRING ? v.slice(0, MAX_STRING) + '…' : v;
    }
    if (!v || typeof v !== 'object' || v instanceof Map || depth > 4) return v instanceof Map ? undefined : v;
    if (Array.isArray(v)) return v.slice(0, 12).map((x, i) => strip(x, `${label}[${i}]`, depth + 1));
    const o = {};
    for (const [kk, x] of Object.entries(v)) { const s = strip(x, `${label}.${kk}`, depth + 1); if (s !== undefined) o[kk] = s; }
    return o;
  };
  const walk = (v, where, depth) => {
    if (records.length >= MAX_RECORDS || !v || typeof v !== 'object' || v instanceof Map || depth > 5) return;
    if (Array.isArray(v)) { v.forEach((x) => walk(x, where, depth + 1)); return; }
    const own = v.xpath || v.regionXpath;
    if (typeof own === 'string' && key(own) === k) { records.push({ observedBy: where, ...strip(v, where, 0) }); return; }
    for (const [kk, x] of Object.entries(v)) if (kk !== 'byKey' && kk !== 'sequenceMap') walk(x, `${where}.${kk}`, depth + 1);
  };
  for (const [probe, v] of Object.entries(obs)) walk(v, probe, 0);
  return { records, images };
}

const decoded = new WeakMap();
function cropOf(model, e) {
  const r = e.rect;
  if (!model.screenshot || !r || !r.w || !r.h || r.y + r.h > 900 || r.x + r.w > 1280 || r.x < 0 || r.y < 0) return null;
  if (!decoded.has(model)) { try { decoded.set(model, png.decode(model.screenshot)); } catch (err) { decoded.set(model, null); } }
  const img = decoded.get(model);
  if (!img) return null;
  const m = 16;
  return png.cropBase64(img, { x: r.x - m, y: r.y - m, w: Math.min(700, r.w + 2 * m), h: Math.min(450, r.h + 2 * m) });
}

// The criterion's own applicability and sound rules apply to a screened element too: the sweep widens what is tested,
// never what the criterion covers. `criterion.applies(element)` is the element-level applicability its inventory
// uses; `criterion.assessScreened(candidate, obs, model)` decides what its observations settle for any element.
function assess(c, criterion, obs, model) {
  const e = model.get(c.xpath);
  if (e && criterion.applies && !criterion.applies(e, model)) return { status: 'NOT_APPLICABLE', rule: 'outside-applicability', reason: criterion.applicability || 'The element is outside the criterion\'s applicability.' };
  const decided = criterion.assessScreened ? criterion.assessScreened(c, obs, model) : null;
  return decided || { status: 'OPEN', rule: 'screened' };
}

function evidence(c, obs, model) {
  const e = model.get(c.xpath) || {};
  const seen = observationsOf(c.xpath, obs);
  const crop = cropOf(model, e);
  return {
    facts: {
      selectedForTestingBecause: c.aspect ? `${c.aspect} (a screening pass chose this element for testing; this is not a finding)` : undefined,
      elementBox: e.rect, rendered: e.rendered, occupiesSpace: e.boxed, visuallyHidden: e.visuallyHidden || undefined,
      tabindex: e.tabindex, nativelyFocusable: e.nativeFocusable, disabled: e.disabled || undefined,
      eventListeners: e.listeners || undefined, inlineHandlers: e.inlineHandlers && e.inlineHandlers.length ? e.inlineHandlers : undefined,
      pointerCursor: e.cursorPointer || undefined, ariaHidden: e.ariaHiddenSelf || e.ariaHiddenAncestor || undefined, inShadowRoot: e.inShadow || undefined,
      probeObservationsOfThisElement: seen.records.length ? seen.records : 'none — no probe recorded this element; use the tools to observe it',
    },
    images: [...(crop ? [{ label: 'the element as rendered at page load', data: crop }] : []), ...seen.images],
  };
}

module.exports = { assess, evidence, observationsOf };
