'use strict';
// C3 — full-page / tiled structure-vision capture. The structure rubrics (info-relationships 1.3.1, sequence 1.3.2,
// heading-descriptive 2.4.6, section-headings 2.4.10) declare visionEvidence:[viewport] → BLIND below the fold. This
// surfaces the full-page structure inventory (every heading/list/table + whether it is below the fold/off-screen)
// AND a full-page screenshot, so those rubrics judge ALL rendered structure, not just the first viewport.

function enumerateStructure() {
  const vh = window.innerHeight;
  const norm = (s) => (s || '').replace(/\s+/g, ' ').trim();
  const below = (r) => r.top >= vh - 1; // top is past the first viewport
  const offscreen = (r) => r.left <= -1000 || r.top <= -1000 || (r.width <= 1 && r.height <= 1);
  const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,[role=heading]')].map((h) => {
    const r = h.getBoundingClientRect();
    const lvl = /^H[1-6]$/.test(h.tagName) ? +h.tagName[1] : (parseInt(h.getAttribute('aria-level'), 10) || null);
    return { text: norm(h.textContent).slice(0, 90), level: lvl, belowFold: below(r), offscreen: offscreen(r) };
  });
  const lists = [...document.querySelectorAll('ul,ol,dl,[role=list]')].map((l) => { const r = l.getBoundingClientRect(); return { type: l.tagName.toLowerCase(), items: l.querySelectorAll('li,dt,dd,[role=listitem]').length, belowFold: below(r) }; });
  const tables = [...document.querySelectorAll('table,[role=table],[role=grid],[role=treegrid]')].map((t) => { const r = t.getBoundingClientRect(); return { hasTh: !!t.querySelector('th'), hasCaption: !!t.querySelector('caption'), belowFold: below(r) }; });
  return { headings, lists, tables, viewportHeight: vh, docHeight: Math.max(document.documentElement.scrollHeight, document.body ? document.body.scrollHeight : 0) };
}

async function captureFullPageStructure(page, { screenshot = false } = {}) {
  const s = await page.evaluate(enumerateStructure).catch(() => null);
  if (!s) return { headings: [], lists: [], tables: [], hasBelowFoldStructure: false };
  const hasBelowFoldStructure = s.headings.some((h) => h.belowFold) || s.lists.some((l) => l.belowFold) || s.tables.some((t) => t.belowFold) || s.docHeight > s.viewportHeight * 1.2;
  let fullPageShot = null;
  if (screenshot) { fullPageShot = await require('./settle.js').robustScreenshot(page, { fullPage: true, encoding: 'base64' }); }
  return { ...s, hasBelowFoldStructure, fullPageShot: fullPageShot ? '(base64 ' + fullPageShot.length + 'B)' : null };
}

module.exports = { captureFullPageStructure, enumerateStructure };
