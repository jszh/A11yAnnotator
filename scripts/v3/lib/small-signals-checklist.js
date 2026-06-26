'use strict';
// C8 as a FALSE-BARRIER REDUCER (integrated path). A deterministic glyph FAIL is REVIEWED — if the glyph is actually
// DECORATIVE (the runner over-flagged it) the fail is CLEARED. The iframe/long-desc SEMANTIC abstains have value only
// via ESCALATION (catching a barrier), which ADDS false-barriers, so that is DEFERRED behind `escalateAbstains`
// (default false; docs/DEFERRED-TODO.md: micro-check abstain-escalation). Integrated path can only LOWER false-barriers.
const { runSmallSignal } = require('./small-signals.js');
const { resolveEscalation, resolveClear } = require('./micro-checks.js');

async function cropOf(page, selector, pad = 22) {
  const box = await page.evaluate((sel) => { const el = sel && sel.startsWith('//') ? document.evaluate(sel, document, null, 9, null).singleNodeValue : document.querySelector(sel); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.left, y: r.top, w: r.width, h: r.height }; }, selector).catch(() => null);
  if (!box || box.w < 1 || box.h < 1) return null;
  const clip = { x: Math.max(0, box.x - pad), y: Math.max(0, box.y - pad), width: Math.min(1280, box.w + 2 * pad), height: Math.min(1280, box.h + 2 * pad) };
  return await require('./settle.js').robustScreenshot(page, { clip, encoding: 'base64' });
}

async function runSmallSignalChecklist(page, { aspect, targetSelector, escalateAbstains = false, escalate = resolveEscalation, resolveClearFn = resolveClear } = {}) {
  const d = await runSmallSignal(page, { aspect, targetSelector });
  // INTEGRATED (FB-reducing) path: review a glyph FAIL — clear it if the glyph is skeptic-confirmed DECORATIVE.
  if (d.decided && d.verdict === 'fail' && aspect === 'glyph-substitution') {
    const imageB64 = await cropOf(page, targetSelector);
    const c = await resolveClearFn('glyph-informative', { via: 'an icon font / pseudo-element glyph', label: '(rendered glyph)', imageB64 });
    if (c.clear) return { ...d, verdict: 'pass', clearedFalseBarrier: true, via: 'glyph-informative', reason: 'glyph FAIL CLEARED — skeptic-confirmed decorative: ' + ((c.raw && c.raw.reason) || ''), checklist: [{ check: 'glyph-informative', clear: c.clear, raw: c.raw, skeptic: c.skeptic }] };
    return { ...d, checklist: [] };
  }
  if (!escalateAbstains) return { ...d, checklist: [] }; // abstain-escalation DEFERRED (off by default)
  if (!(d.decided === false && d.abstain)) return { ...d, checklist: [] };
  const f = d.facts || {};
  let check = null, evidence = null;

  if (aspect === 'iframe-name-vs-content' && f.title != null) {
    const contentSummary = await page.evaluate((sel) => { const el = document.querySelector(sel); try { const doc = el && el.contentDocument; return doc ? (doc.body ? doc.body.textContent : doc.documentElement.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 240) : '(cross-origin / no access)'; } catch (e) { return '(no access)'; } }, targetSelector).catch(() => '(no access)');
    check = 'iframe-describes-content'; evidence = { title: f.title, contentSummary };
  } else if (aspect === 'glyph-substitution') {
    const imageB64 = await cropOf(page, targetSelector);
    check = 'glyph-informative'; evidence = { via: f.before || f.after ? 'a ::before/::after pseudo-element' : 'an icon font / mixed-script text', label: (f.before || '') + ' ' + (f.after || '') + ' ' + (f.text || ''), imageB64 };
  } else if (aspect === 'long-description-presence') {
    const descText = [f.describedby, f.figcap].filter(Boolean).join(' / ') || (f.hasDetails ? '(a <details> exists)' : f.hasTable ? '(an adjacent table exists)' : '(source present)');
    const imageB64 = await cropOf(page, targetSelector, 8);
    check = 'long-desc-complete'; evidence = { descText, imageB64 };
  }
  if (!check) return { ...d, checklist: [] };

  const esc = await escalate(check, evidence);
  const item = { check, result: esc.result, raw: esc.raw, skeptic: esc.skeptic, escalate: esc.escalate, error: esc.error };
  if (esc.escalate) return { ...d, decided: true, abstain: false, verdict: 'fail', via: check, reason: check + ' → barrier (skeptic-confirmed): ' + ((esc.raw && esc.raw.reason) || ''), checklist: [item] };
  return { ...d, checklist: [item] }; // not confirmed ⇒ keep abstain (escalate-only)
}

module.exports = { runSmallSignalChecklist };
