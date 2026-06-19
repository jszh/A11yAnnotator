#!/usr/bin/env node
'use strict';
// Adversarial probe for EN 301 549 V4.1.0 C.9.6.2 "Full pages" (WCAG conformance requirement 2: the WHOLE
// page must conform). The v3 harness collects elements with a hard cap (elementCap, default 80) and BREAKS —
// run-v3-act-suite.js:254 `for (... body *) { if (els.length >= cap) break; }`. Every v3 lane (deterministic
// AND llm) operates on that truncated list, so a barrier past element #cap is invisible to the whole harness;
// axe (full-DOM) backstops STATIC SCs but nothing covers a BEHAVIORAL barrier placed beyond the cap.
//
// This probe loads fixtures/fullpage-cap.html (100 interactive elements, a 4.1.2 barrier planted at #95) and
// runs the harness's own collection logic at cap=80, showing the planted barrier is never collected.
//
// Usage: CHROME_PATH=".../Google Chrome" node probe-fullpage-cap.js [--cap=80]
const path = require('path');
const puppeteer = require('puppeteer');
const CHROME = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const capArg = (process.argv.find((a) => a.startsWith('--cap=')) || '').split('=')[1];
const CAP = Number(capArg || process.env.V3_ACT_ELEMENT_CAP || 80);
const FIXTURE = 'file://' + path.join(__dirname, 'fixtures', 'fullpage-cap.html');

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.goto(FIXTURE, { waitUntil: 'load' });
    // mirror the harness collect: iterate body *, keep visible interactive/text elements, BREAK at cap.
    const r = await page.evaluate((cap) => {
      const visible = (el) => { const cs = getComputedStyle(el), b = el.getBoundingClientRect();
        return cs.display !== 'none' && cs.visibility !== 'hidden' && b.width > 0 && b.height > 0; };
      const els = []; let totalRelevant = 0; let plantedIndex = -1;
      const all = [...document.querySelectorAll('body *')];
      for (const el of all) {
        if (!visible(el)) continue;
        const tag = el.tagName.toLowerCase();
        const focusable = el.tabIndex >= 0 || (tag === 'a' && el.hasAttribute('href'))
          || ['button', 'input', 'select', 'textarea', 'summary'].includes(tag);
        const text = (el.innerText || '').trim();
        const role = el.getAttribute('role') || '';
        if (!focusable && !role && !text) continue;
        totalRelevant++;
        if (els.length >= cap) continue;          // harness BREAKS here; we keep counting to show the overflow
        els.push(el.id || tag);
        if (el.id === 'planted-barrier') plantedIndex = els.length;
      }
      return { collected: els.length, totalRelevant, plantedCollected: plantedIndex !== -1, plantedIndex };
    }, CAP);
    console.log(`cap=${CAP}`);
    console.log(`relevant elements on page: ${r.totalRelevant}`);
    console.log(`collected (capped):         ${r.collected}`);
    console.log(`planted 4.1.2 barrier (#95) collected? ${r.plantedCollected}` +
      (r.plantedCollected ? ` (at ${r.plantedIndex})` : '   <-- NOT collected: invisible to every v3 lane'));
    console.log(r.plantedCollected
      ? 'NO GAP at this cap (raise the fixture size or lower --cap to reproduce).'
      : 'GAP CONFIRMED: EN C.9.6.2 "Full pages" fails; the harness clears the page.');
  } finally { await browser.close(); }
})().catch((e) => { console.error(e); process.exit(1); });
