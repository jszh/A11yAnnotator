'use strict';
// ONE collector viewport for every lane. Vision crops (vision-capture) and the CDP tool session (orchestrator
// openToolSession) have always pinned 1280×900, but the collector (collectActPage), axe, the experiment runners
// and the instruments ran on whatever a fresh tab came up with — Puppeteer's DEFAULT 800×600. Responsive sites
// switch layout at that width (mobile nav, quick-add buttons, hidden desktop links), so the facts/axe results
// and the pixels the judge saw described DIFFERENT pages (expert-FP population check, 2026-09-26: 24/56 saved
// pages got a different axe violation set; 51 published axe barriers existed only at 800px).
//
// pinCollectorViewport() replaces ONLY the Puppeteer default (or an unset/null viewport). A caller that set a
// viewport on purpose — the 320px reflow runner, the 640×512 zoom-clip probe, a test — keeps it.
const COLLECTOR_VIEWPORT = Object.freeze({ width: 1280, height: 900, deviceScaleFactor: 1 });
const PUPPETEER_DEFAULT = Object.freeze({ width: 800, height: 600 });

function isPuppeteerDefault(vp) {
  return !vp || (vp.width === PUPPETEER_DEFAULT.width && vp.height === PUPPETEER_DEFAULT.height);
}

// Returns true when it changed the viewport. Never throws (mock pages without setViewport are a no-op).
async function pinCollectorViewport(page) {
  if (!page || typeof page.setViewport !== 'function') return false;
  let cur = null;
  try { cur = typeof page.viewport === 'function' ? page.viewport() : null; } catch (e) { cur = null; }
  if (!isPuppeteerDefault(cur)) return false;
  try { await page.setViewport(COLLECTOR_VIEWPORT); return true; } catch (e) { return false; }
}

module.exports = { COLLECTOR_VIEWPORT, pinCollectorViewport, isPuppeteerDefault };
