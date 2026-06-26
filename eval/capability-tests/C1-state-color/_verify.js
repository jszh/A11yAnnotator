'use strict';
// Independent cross-check of the C1-state-color corpus: render each case, drive the labeled
// pseudo-state, read the COMPUTED color of the target vs its backdrop, compute the real WCAG
// ratio, and confirm it agrees with the manifest's expected pass/fail DIRECTION + threshold.
// This is a state-correctness audit, not the production runner. abstain rows are skipped (no
// flat measurement expected); 1.4.1 presence/absence rows (null ratio) are reported, not graded.
const fs = require('fs'); const path = require('path');
const puppeteer = require('puppeteer');
const { ratio } = require('./_contrast.js');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT = __dirname;
const ASPECTS = {
  'state-dependent-text-contrast': { sc: '1.4.3' },
  'state-indicator-contrast': { sc: '1.4.11' },
  'inline-link-color-state': { sc: '1.4.1' },
  'ui-status-color-state': { sc: '1.4.1' },
};

function rgbToHex(s) {
  const m = String(s).match(/rgba?\(([^)]+)\)/i); if (!m) return null;
  const p = m[1].split(',').map((x) => parseFloat(x.trim()));
  const a = p.length > 3 ? p[3] : 1;
  // composite over white (page default) if translucent — approximation for audit only
  const comp = [0, 1, 2].map((i) => Math.round(p[i] * a + 255 * (1 - a)));
  return '#' + comp.map((c) => Math.max(0, Math.min(255, c)).toString(16).padStart(2, '0')).join('');
}

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  let textChecked = 0, textOK = 0; const disagreements = []; const skipped = { abstain: 0, nullRatio: 0 };
  for (const [aspect, meta] of Object.entries(ASPECTS)) {
    const rows = JSON.parse(fs.readFileSync(path.join(ROOT, aspect, 'labels.json'), 'utf8'));
    for (const row of rows) {
      if (row.runnerShould === 'abstain') { skipped.abstain++; continue; }
      const file = path.join(ROOT, aspect, row.file);
      const page = await browser.newPage();
      await page.goto('file://' + file, { waitUntil: 'load' }).catch(() => {});
      const sel = String(row.targetSelector).split(',')[0].trim();
      // drive the labeled state
      try {
        if (row.state === 'hover') await page.hover(sel);
        else if (row.state === 'focus') await page.evaluate((s) => { const e = document.querySelector(s); e && e.focus && e.focus(); }, sel);
        else if (row.state === 'active') { const el = await page.$(sel); if (el) { const b = await el.boundingBox(); if (b) { await page.mouse.move(b.x + b.width / 2, b.y + b.height / 2); await page.mouse.down(); } } }
        else if (row.state === 'checked') {
          // drive the toggling input so the :checked sibling rule applies, then re-resolve to the styled text node
          await page.evaluate(() => { document.querySelectorAll('input[type=checkbox],input[type=radio]').forEach((i) => { if (!i.disabled) i.checked = true; }); });
        }
        // visited can't be forced from file://; those rows are skipped from text grading below
      } catch (e) { /* selector may be non-hoverable; continue */ }
      const got = await page.evaluate((s) => {
        const el = document.querySelector(s); if (!el) return { err: 'no-el' };
        const cs = getComputedStyle(el);
        // walk up for an opaque background
        function bg(node) {
          let n = node;
          while (n && n !== document.documentElement) {
            const c = getComputedStyle(n).backgroundColor;
            if (c && !/rgba?\(0,\s*0,\s*0,\s*0\)|transparent/.test(c)) return c;
            n = n.parentElement;
          }
          return 'rgb(255,255,255)';
        }
        return { color: cs.color, background: bg(el), text: (el.textContent || '').trim().slice(0, 20) };
      }, sel).catch(() => ({ err: 'eval-fail' }));
      if (row.state === 'active') { await page.mouse.up().catch(() => {}); }
      await page.close();
      if (got.err) { disagreements.push({ aspect, file: row.file, why: got.err }); continue; }
      // Only grade text-contrast (1.4.3) decide rows with a numeric ratio — color vs its own backdrop.
      // Skip rows the file:// harness can't truly drive (visited) or that pass via exemption (disabled).
      const ungradeable = row.state === 'visited' || /exempt|disabled|inactive/i.test(row.dimension || '');
      if (meta.sc === '1.4.3' && typeof row.measuredRatioApproxInState === 'number' && !ungradeable) {
        const fg = rgbToHex(got.color); const bgx = rgbToHex(got.background);
        if (!fg || !bgx) { disagreements.push({ aspect, file: row.file, why: 'color-parse', got }); continue; }
        const r = ratio(fg, bgx);
        textChecked++;
        // large-text dims use 3:1, else 4.5:1 — infer from dimension/rationale string
        const large = /large|3.1|3to1|-3-1|24px/i.test((row.dimension || '') + ' ' + (row.rationale || ''));
        const thr = large ? 3.0 : 4.5;
        const computedVerdict = r >= thr ? 'pass' : 'fail';
        const wantVerdict = row.expected === 'passed' ? 'pass' : 'fail';
        const ratioClose = Math.abs(r - row.measuredRatioApproxInState) <= 0.25;
        if (computedVerdict === wantVerdict && ratioClose) textOK++;
        else disagreements.push({ aspect, file: row.file, dim: row.dimension, state: row.state, fg, bg: bgx, computedRatio: +r.toFixed(3), manifestRatio: row.measuredRatioApproxInState, thr, computedVerdict, wantVerdict, ratioClose });
      } else if (row.measuredRatioApproxInState === null) {
        skipped.nullRatio++;
      }
    }
  }
  await browser.close();
  console.log('=== C1-state-color independent state-render audit ===');
  console.log(`1.4.3 text-contrast decide rows graded: ${textOK}/${textChecked} agree (verdict + ratio within 0.25)`);
  console.log(`skipped: ${skipped.abstain} abstain, ${skipped.nullRatio} presence/absence (1.4.1 null-ratio)`);
  console.log(`\nDISAGREEMENTS (${disagreements.length}):`);
  for (const d of disagreements) console.log('  ', JSON.stringify(d));
})().catch((e) => { console.error(e.stack); process.exit(1); });
