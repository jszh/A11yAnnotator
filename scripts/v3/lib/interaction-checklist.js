'use strict';
// C1 interaction as a FALSE-BARRIER REDUCER. The deterministic runner re-measures state-dependent contrast + dynamic
// name/state and FAILS some cases it shouldn't (an exempt disabled control; a state that DOES distinguish by a non-
// colour cue; a state that DID update correctly). The wrapper REVIEWS each deterministic FAIL with a focused check and
// CLEARS it only when high-confidence + skeptic-confirmed exempt/acceptable. It never touches abstains or passes, so it
// can only LOWER the false-barrier count; the skeptic keeps false-clears near zero.
const { runStateColor, runDynamicNRV } = require('./interaction-capture.js');
const { resolveClear } = require('./micro-checks.js');

async function cropOf(page, selector, pad = 24, grayscale = false) {
  const box = await page.evaluate((sel) => { const el = sel && sel.startsWith('//') ? document.evaluate(sel, document, null, 9, null).singleNodeValue : document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); const label = (el.getAttribute('aria-label') || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 50); return { x: r.left, y: r.top, w: r.width, h: r.height, label }; }, selector).catch(() => null);
  if (!box || box.w < 1) return { imageB64: null, label: '' };
  const clip = { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: Math.min(1000, box.w + 2 * pad), height: Math.min(800, box.h + 2 * pad) };
  if (grayscale) await page.evaluate(() => { document.documentElement.style.setProperty('filter', 'grayscale(1)', 'important'); }).catch(() => {});
  let imageB64 = await require('./settle.js').robustScreenshot(page, { clip, encoding: 'base64' });
  if (grayscale) await page.evaluate(() => { document.documentElement.style.removeProperty('filter'); }).catch(() => {});
  return { imageB64, label: box.label };
}

async function runInteractionChecklist(page, { mode, targetSelector, state, sc, activation, resolveClearFn = resolveClear } = {}) {
  if (mode === 'dynamic-nrv') {
    // `state-value-correct` as a CLEAR was MEASURED to over-clear real stale/frozen-state barriers (+5 false-clears
    // for 1 false-barrier removed) at any effort/confidence — the LLM declares a stale exposure "correct". Kept OFF.
    return { ...await runDynamicNRV(page, { targetSelector, activation }), checklist: [] };
  }
  const d = await runStateColor(page, { targetSelector, state: state || 'hover', sc: sc || '1.4.3' });
  if (d.decided && d.verdict === 'fail') {
    // 1.4.1 colour-only fail → PER-CUE BOOLEAN RUBRIC on the COLOUR crop (the robust winner: held-out 2 FC, 0 new
    // false-barriers; a both-state/routed design scored 12/12 on synthetic but OVERFIT — it did worse on held-out, so
    // it was dropped). 1.4.3/1.4.11 contrast fail → essential/inactive exemption only (the ratio is never re-judged).
    const { imageB64, label } = await cropOf(page, targetSelector, 28);
    const check = (sc === '1.4.1') ? 'use-of-color-adequacy' : 'essential-presentation';
    const c = await resolveClearFn(check, { label, imageB64, role: 'control', ratio: d.ratio });
    if (c.clear) return { ...d, verdict: 'pass', clearedFalseBarrier: true, via: check, reason: 'deterministic fail CLEARED — ' + check + ': ' + ((c.raw && c.raw.reason) || ''), checklist: [{ check, clear: c.clear, raw: c.raw }] };
  }
  return { ...d, checklist: [] };
}
module.exports = { runInteractionChecklist };
