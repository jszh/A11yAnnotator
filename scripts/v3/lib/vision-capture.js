'use strict';
// Harness 3.2 §11 — vision evidence capture. Produces the `visionByXpath` map the adjudicator threads
// (exactly like `transcriptByXpath`): xpath -> { 'element-crop', 'surrounding-region', 'viewport',
// 'viewport-320' } as base64 PNGs. This captures the STATIC crops from a loaded page (the collector
// context). The state-before/after PAIRS come from drive-page.js, which already screenshots the
// focus/hover/submit transitions — the caller MERGES those into this map by (xpath, state). Keeping
// capture here (where the page lives) leaves `runAdjudication` a pure function over its inputs.

// Capture the declared static crops for a set of element xpaths. opts: { states[], pad=24 }.
async function captureVision(page, xpaths, opts = {}) {
  const want = new Set(opts.states || ['element-crop', 'surrounding-region', 'viewport', 'viewport-320']);
  const pad = Number.isFinite(opts.pad) ? opts.pad : 24;
  const shot = (clip) => page.screenshot(clip ? { clip, encoding: 'base64' } : { encoding: 'base64' }).catch(() => null);
  const out = {};

  // page-wide viewport crops are shared across all elements — capture once.
  let viewport = null, viewport320 = null;
  if (want.has('viewport')) viewport = await shot(null);
  if (want.has('viewport-320')) {
    // `page.viewport()` is null under defaultViewport:null (a real browser window). Measure the live size
    // so we ALWAYS restore — otherwise the page is left at 320px and EVERY later crop is silently corrupted.
    const orig = page.viewport();
    const cur = orig || await page.evaluate(() => ({ width: window.innerWidth, height: window.innerHeight })).catch(() => null);
    try { await page.setViewport({ width: 320, height: (cur && cur.height) || 800 }); viewport320 = await shot(null); }
    finally { if (cur && cur.width) await page.setViewport(cur).catch(() => {}); }
  }

  for (const xp of xpaths) {
    const rect = await page.evaluate((x) => {
      const el = document.evaluate(x, document, null, 9, null).singleNodeValue;
      if (!el || !el.getBoundingClientRect) return null;
      // an AT-imperceivable element (visibility:hidden / opacity:0) keeps a layout box but a crop of it is
      // a BLANK rectangle — a misleading "no visible content" signal to the agent. Skip it (adversarial).
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.visibility === 'collapse' || parseFloat(cs.opacity) === 0) return null;
      const r = el.getBoundingClientRect();
      if (!(r.width > 0) || !(r.height > 0)) return null;
      return { x: r.left, y: r.top, w: r.width, h: r.height, vw: window.innerWidth, vh: window.innerHeight };
    }, xp).catch(() => null);
    const frames = {};
    if (rect) {
      // clamp the clip fully inside the viewport (page.screenshot errors on an out-of-bounds clip).
      const clip = (p) => {
        const x = Math.max(0, Math.min(rect.x - p, rect.vw - 1));
        const y = Math.max(0, Math.min(rect.y - p, rect.vh - 1));
        return { x, y, width: Math.max(1, Math.min(rect.w + 2 * p, rect.vw - x)), height: Math.max(1, Math.min(rect.h + 2 * p, rect.vh - y)) };
      };
      const inView = rect.x < rect.vw && rect.y < rect.vh && rect.x + rect.w > 0 && rect.y + rect.h > 0;
      if (inView && want.has('element-crop')) frames['element-crop'] = await shot(clip(2));
      if (inView && want.has('surrounding-region')) frames['surrounding-region'] = await shot(clip(pad));
    }
    if (viewport && want.has('viewport')) frames['viewport'] = viewport;
    if (viewport320 && want.has('viewport-320')) frames['viewport-320'] = viewport320;
    const clean = {};
    for (const [k, v] of Object.entries(frames)) if (typeof v === 'string' && v.length) clean[k] = v;
    if (Object.keys(clean).length) out[xp] = clean;
  }
  return out;
}

// Merge driver-captured state pairs (xpath -> { 'state-before', 'state-after' }) into a visionByXpath map.
function mergeVision(base, ...more) {
  const out = {};
  for (const src of [base, ...more]) {
    if (!src || typeof src !== 'object' || Array.isArray(src)) continue; // ignore non-map inputs (arrays → junk numeric keys)
    for (const [xp, frames] of Object.entries(src)) {
      out[xp] = out[xp] || {};
      for (const [state, data] of Object.entries(frames || {})) if (typeof data === 'string' && data.length) out[xp][state] = data;
    }
  }
  return out;
}

module.exports = { captureVision, mergeVision };
