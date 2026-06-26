'use strict';
// C6 reflow as a FALSE-BARRIER REDUCER (vision @320px). The deterministic runner FAILS some cases that are actually
// fine — content that "disappears" but has an accessible equivalent at 320px (F102), or horizontal overflow that is a
// legitimate 2-D affordance. The wrapper REVIEWS each such FAIL and CLEARS it only on a skeptic-confirmed equivalent /
// affordance. It touches only fails (never abstains/passes) so it can only LOWER false-barriers.
// TODO (deferred, NOT wired): the abstain "meaningful indentation collapsed at 320px" could be ESCALATED to a fail via
// a micro-check to catch a barrier the runner can't decide — but escalation ADDS false-barriers, so it is left out of
// the integrated path until we want recall over precision. See docs/DEFERRED-TODO.md (micro-check abstain-escalation).
const { runReflow } = require('./reflow-runner.js');
const { resolveClear } = require('./micro-checks.js');

async function shot320(page) { try { await page.setViewport({ width: 320, height: 540 }); await require('./settle.js').awaitSettle(page, { force: true, floorMs: 160 }); return await require('./settle.js').robustScreenshot(page, { encoding: 'base64' }); } catch (e) { return null; } }

async function runReflowChecklist(page, { url, resolveClearFn = resolveClear } = {}) {
  const d = await runReflow(page, { url });
  if (d.decided && d.verdict === 'fail' && d.kind === 'f102-disappearance') {
    const imageB64 = await shot320(page);
    const c = await resolveClearFn('equivalent-content-on-reflow', { label: d.culprit, imageB64 });
    if (c.clear) return { ...d, verdict: 'pass', clearedFalseBarrier: true, via: 'equivalent-content-on-reflow', reason: 'F102 disappearance BUT a skeptic-confirmed equivalent exists at 320px: ' + ((c.raw && c.raw.reason) || ''), checklist: [{ check: 'equivalent-content-on-reflow', clear: c.clear, raw: c.raw, skeptic: c.skeptic }] };
    return { ...d };
  }
  if (d.decided && d.verdict === 'fail' && d.kind === 'document-overflow' && /unbreakable-string/.test(d.culprit || '')) {
    const imageB64 = await shot320(page);
    const c = await resolveClearFn('author-scroll-affordance', { label: d.culprit, imageB64 });
    if (c.clear) return { ...d, verdict: 'pass', clearedFalseBarrier: true, via: 'author-scroll-affordance', reason: 'overflow is a skeptic-confirmed legitimate 2-D affordance: ' + ((c.raw && c.raw.reason) || ''), checklist: [{ check: 'author-scroll-affordance', clear: c.clear, raw: c.raw, skeptic: c.skeptic }] };
    return { ...d };
  }
  return { ...d, checklist: [] };
}
module.exports = { runReflowChecklist };
