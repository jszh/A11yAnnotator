'use strict';
// C4 as a CHECKLIST ORCHESTRATOR. The deterministic runner (nontext-contrast-runner) decides the contrast MATH; the
// ONE item it can't resolve on a FAIL is the SEMANTIC exemption question, dispatched to focused micro-checks:
//  • deterministic FAIL  → exemption checklist [essential-presentation → decorative-or-component]; any 'clear' ⇒ pass.
//  • abstains ("graphical object" / "state indicator" / "gradient/image/pixels" / "focus-indicator") are PERCEPTUAL
//    CONTRAST or geometry questions — they stay deterministic (route to the pixel-contrast / 2.4.7 lanes). VALIDATED:
//    handing perceptual-contrast judgements to the LLM introduced 7 false-clears (it cannot eyeball 3:1 from a crop),
//    so micro-checks here are restricted to SEMANTIC questions only.
// CLEAR is authoritative-conservative: a 'clear' from a check flips a fail to pass ONLY because the prompts default to
// 'barrier'/'uncertain' unless confidently no-barrier (so a check can't manufacture a false-clear).
const { runNonTextContrast } = require('./nontext-contrast-runner.js');
const { resolveClear } = require('./micro-checks.js');

async function cropOf(page, selector, pad = 18) {
  const box = await page.evaluate((sel) => {
    const el = sel.startsWith('//') ? document.evaluate(sel, document, null, 9, null).singleNodeValue : document.querySelector(sel);
    if (!el) return null; const r = el.getBoundingClientRect();
    const label = (el.getAttribute('aria-label') || el.textContent || el.getAttribute('alt') || el.getAttribute('title') || '').replace(/\s+/g, ' ').trim().slice(0, 60);
    return { x: r.left, y: r.top, w: r.width, h: r.height, label };
  }, selector).catch(() => null);
  if (!box || box.w < 1 || box.h < 1) return { imageB64: null, label: '' };
  const clip = { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: Math.min(1280, box.w + 2 * pad), height: Math.min(1280, box.h + 2 * pad) };
  let imageB64 = await require('./settle.js').robustScreenshot(page, { clip, encoding: 'base64' });
  return { imageB64, label: box.label };
}

async function runNonTextContrastChecklist(page, { selector, focusState = false, resolveClearFn = resolveClear } = {}) {
  const d = await runNonTextContrast(page, { selector, focusState });
  const role = (d.facts && d.facts.role) || null;
  const checklist = [];

  // ---- deterministic FAIL: REVIEW for a false barrier — CLEAR only on a skeptic-confirmed exemption/out-of-scope ----
  if (d.decided && d.verdict === 'fail') {
    const { imageB64, label } = await cropOf(page, selector);
    const ev = { ratio: d.ratio, role, label, imageB64 };
    // Only `essential-presentation` clears here. `decorative-or-component` was prompt-engineered (structured
    // operable/informative/decorative rubric won the synthetic bake-off 10/10) and RE-GATED on held-out — but it STILL
    // over-cleared 2 adversarial cases (a false-essential divider, a component that looks like a fill): the
    // decorative-vs-component line is irreducibly ambiguous on adversarial inputs, like the essential brand-swatch.
    // Kept OFF. (Same overfitting the held-out gate caught for the use-of-color routing design.)
    const c = await resolveClearFn('essential-presentation', ev);
    checklist.push({ check: 'essential-presentation', clear: c.clear, raw: c.raw, error: c.error });
    if (c.clear) return { ...d, decided: true, verdict: 'pass', exempt: true, clearedFalseBarrier: true, via: 'essential-presentation', reason: 'contrast ' + d.ratio + ':1 < 3:1 BUT essential-presentation found NO barrier (exempt): ' + ((c.raw && c.raw.reason) || ''), checklist };
    return { ...d, confirmedBy: 'micro-check', reason: d.reason + ' — essential check confirms a real in-scope component (not exempt)', checklist };
  }

  // ABSTAINS (graphical / state-indicator / gradient / focus) are PERCEPTUAL-CONTRAST or geometry — kept deterministic
  // (pixel-contrast / 2.4.7 lanes), NOT routed to an LLM (which false-clears on fine contrast). No micro-check here.
  return { ...d, checklist };
}

module.exports = { runNonTextContrastChecklist, cropOf };
