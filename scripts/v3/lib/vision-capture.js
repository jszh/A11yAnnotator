'use strict';
// Harness 3.2 §11 — vision evidence capture. Produces the `visionByXpath` map the adjudicator threads
// (exactly like `transcriptByXpath`): xpath -> { 'element-crop', 'surrounding-region', 'viewport',
// 'viewport-320' } as base64 PNGs. This captures the STATIC crops from a loaded page (the collector
// context); the orchestrator's runLlm path calls captureVisionForUrl and threads the result.
//
// NOTE (not yet wired): the `state-before`/`state-after` PAIRS that 5 rubrics declare (focus / forms /
// dynamic) are NOT produced here — they require driving the focus/hover/submit transitions (drive-page.js
// already screenshots those). `mergeVision` exists to fold them in once that driver→visionByXpath bridge
// lands; until then those rubrics receive no state frame and must abstain (PARTIAL) when they cannot see
// the before/after, per their rubric text. Keeping capture here leaves `runAdjudication` pure over inputs.

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
    // scroll the target into view first — on a real page most sampled elements are BELOW THE FOLD, so
    // without this their element-crop is skipped (off-viewport) and the LLM gets no pixels (probe finding
    // on the corpus). scrollIntoView centres it; getBoundingClientRect is then viewport-relative and clips.
    await page.evaluate((x) => { const el = document.evaluate(x, document, null, 9, null).singleNodeValue; if (el && el.scrollIntoView) try { el.scrollIntoView({ block: 'center', inline: 'center' }); } catch (e) { el.scrollIntoView(); } }, xp).catch(() => {});
    const rect = await page.evaluate((x) => {
      const el = document.evaluate(x, document, null, 9, null).singleNodeValue;
      if (!el || !el.getBoundingClientRect) return null;
      // an AT-imperceivable element (visibility:hidden / opacity:0) keeps a layout box but a crop of it is
      // a BLANK rectangle — a misleading "no visible content" signal to the agent. Skip it (adversarial).
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.visibility === 'collapse' || parseFloat(cs.opacity) === 0) return null;
      const r = el.getBoundingClientRect();
      // a DEGENERATE box (either dim < 6px — a collapsed layout artifact or a hairline element) yields a
      // near-blank crop that misleads the agent (corpus probe: Domino's 5x5, Amazon's 200x2 link). Skip
      // it — a <6px element is not a meaningful visual target anyway.
      if (!(r.width >= 6) || !(r.height >= 6)) return null;
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

// Launch a fresh browser, load `url`, and capture vision for `xpaths` — the production entry point the
// orchestrator/CLI calls so the adjudicator stays a pure function over `visionByXpath` (audit D11-1).
async function captureVisionForUrl(url, xpaths, opts = {}) {
  const puppeteer = require('puppeteer');
  const CHROME = opts.executablePath || process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH
    || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: opts.width || 1280, height: opts.height || 900 });
    await page.goto(url, { waitUntil: 'load', timeout: opts.gotoTimeoutMs || 30000 }).catch(() => {});
    return await captureVision(page, xpaths, opts);
  } finally { await browser.close(); }
}

module.exports = { captureVision, captureVisionForUrl, mergeVision };
