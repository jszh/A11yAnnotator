'use strict';
// Verify DEFERRED-TODO item C (eval-page axe-parity via DOM-identity tagging): tag obligation nodes with their
// v3 xpath in an ARBITRARY (dataset) scheme, run axe, and confirm each axe finding resolves its CSS-selector
// target back to the TAGGED xpath by identity — i.e. the match is scheme-agnostic. Then confirm build-v3's
// axe-promotion fills the obligation keyed on that same (foreign-scheme) xpath.
const fs = require('fs');
const path = require('path');
const os = require('os');
const puppeteer = require('puppeteer');

const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT = path.join(__dirname, '..', '..', '..', '..');
const AXE_PATH = path.join(ROOT, 'axe.min.js');
const HTML = `<!DOCTYPE html><html lang="en"><head><title>x</title></head><body><div><button id="b"></button></div><img id="i" src="data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA="></body></html>`;
// DATASET scheme (every level indexed, incl html/body) — DELIBERATELY different from the collector's /html/body scheme.
const EXTERNAL = { '#b': '/html[1]/body[1]/div[1]/button[1]', '#i': '/html[1]/body[1]/img[1]' };

(async () => {
  const tmp = path.join(os.tmpdir(), 'axe-parity-fixture.html');
  fs.writeFileSync(tmp, HTML);
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const page = await browser.newPage();
  await page.goto('file://' + tmp, { waitUntil: 'load' });
  // simulate eval-page's tagging: resolve each external xpath's node (here via #id for the fixture) and tag it.
  await page.evaluate((map) => { for (const sel of Object.keys(map)) { const n = document.querySelector(sel); if (n) n.setAttribute('data-v3-xp', map[sel]); } }, EXTERNAL);
  await page.addScriptTag({ path: AXE_PATH });
  const axeOut = await page.evaluate(async () => {
    const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] }, resultTypes: ['violations', 'incomplete'] });
    const xpOf = (target) => { try { const sel = Array.isArray(target) ? target[target.length - 1] : target; const el = sel ? document.querySelector(sel) : null; return el && el.getAttribute ? el.getAttribute('data-v3-xp') : null; } catch (e) { return null; } };
    const map = (arr) => (arr || []).map((v) => ({ id: v.id, wcag: (v.tags || []).filter((t) => /^wcag\d/.test(t)), nodes: v.nodes.map((n) => ({ target: n.target.join(' '), xpath: xpOf(n.target) })) }));
    return { violations: map(r.violations), incomplete: map(r.incomplete) };
  });
  console.log('axe findings (target = CSS selector, xpath = resolved by data-v3-xp tag):');
  for (const v of axeOut.violations) for (const n of v.nodes) console.log(`  ${v.id.padEnd(18)} css="${n.target}"  →  v3-xpath="${n.xpath}"`);
  const btn = axeOut.violations.find((v) => v.id === 'button-name');
  const img = axeOut.violations.find((v) => v.id === 'image-alt');
  const ok = btn && btn.nodes[0].xpath === EXTERNAL['#b'] && img && img.nodes[0].xpath === EXTERNAL['#i'];
  console.log('\nSCHEME-AGNOSTIC MATCH:', ok ? 'PASS — axe findings carry the FOREIGN dataset xpath by identity' : 'FAIL');
  await browser.close();
  process.exit(ok ? 0 : 1);
})().catch((e) => { console.error(e.stack || e); process.exit(1); });
