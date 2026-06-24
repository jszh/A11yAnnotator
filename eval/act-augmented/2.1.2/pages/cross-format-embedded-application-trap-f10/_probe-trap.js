#!/usr/bin/env node
/*
 * Deterministic keyboard-trap probe for the F10 cross-format pages.
 * Drives real Tab presses via CDP (Input.dispatchKeyEvent) and reports, for each page,
 * the sequence of focused-element descriptors AND whether forward Tab ever reaches the
 * page's "AFTER" sentinel (the element marked data-after="true", typically the link that
 * follows the embed). If Tab cycles without ever reaching the sentinel, the embed is a
 * trap (FAIL). If the sentinel is reached, the boundary is crossable (PASS candidate).
 *
 * Also presses Escape after some Tabs to detect a documented/working Esc exit.
 *
 * Usage: node _probe-trap.js [case-01.html case-04.html ...]   (default: all case-*.html)
 */
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

const dir = __dirname;
const args = process.argv.slice(2);
const files = (args.length ? args : fs.readdirSync(dir).filter(f => /^case-\d+\.html$/.test(f)).sort());

// Returns a short descriptor of the deeply-focused element, piercing iframes & shadow roots.
const DESCRIBE = `(() => {
  function descEl(el, where) {
    if (!el) return where + ':<none>';
    const tag = el.tagName ? el.tagName.toLowerCase() : '?';
    const id = el.id ? '#' + el.id : '';
    const txt = (el.getAttribute && el.getAttribute('aria-label')) || (el.value) || (el.textContent || '').trim().slice(0, 24);
    const after = (el.getAttribute && el.getAttribute('data-after') === 'true') ? ' [AFTER]' : '';
    return where + ':' + tag + id + (txt ? '(' + txt.replace(/\\s+/g,' ') + ')' : '') + after;
  }
  let el = document.activeElement, where = 'doc', guard = 0;
  while (el && guard++ < 10) {
    if (el.shadowRoot && el.shadowRoot.activeElement) { where = 'shadow<' + el.tagName.toLowerCase() + '>'; el = el.shadowRoot.activeElement; continue; }
    if (el.tagName === 'IFRAME') {
      try { const d = el.contentDocument; if (d && d.activeElement && d.activeElement !== d.body) { where = 'iframe'; el = d.activeElement; continue; } } catch(e) { return 'iframe:<cross-origin>'; }
    }
    break;
  }
  return descEl(el, where);
})()`;

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  for (const f of files) {
    const page = await browser.newPage();
    const url = 'file://' + path.join(dir, f);
    await page.goto(url, { waitUntil: 'networkidle0' });
    await page.evaluate(() => { if (document.body) document.body.focus(); });
    // Park focus at the very start: focus <body>, then Tab to first focusable.
    const seq = [];
    let reachedAfter = false;
    let escWorked = false;
    const MAX = 26;
    for (let i = 0; i < MAX; i++) {
      await page.keyboard.press('Tab');
      await new Promise(r => setTimeout(r, 40));
      const d = await page.evaluate(DESCRIBE);
      seq.push(d);
      if (/\[AFTER\]/.test(d)) { reachedAfter = true; break; }
    }
    // Probe Escape from wherever we are stuck.
    const beforeEsc = await page.evaluate(DESCRIBE);
    await page.keyboard.press('Escape');
    await new Promise(r => setTimeout(r, 40));
    await page.keyboard.press('Tab');
    await new Promise(r => setTimeout(r, 40));
    const afterEsc = await page.evaluate(DESCRIBE);
    if (!/\[AFTER\]/.test(beforeEsc) && /\[AFTER\]/.test(afterEsc)) escWorked = true;

    console.log('\n=== ' + f + ' ===');
    console.log('  tab sequence (' + seq.length + ' presses, capped ' + MAX + '):');
    seq.forEach((s, i) => console.log('    ' + String(i + 1).padStart(2) + '  ' + s));
    console.log('  reachedAfterByTab : ' + reachedAfter);
    console.log('  escThenTabReachesAfter: ' + escWorked + '   (beforeEsc=' + beforeEsc + ' | afterEsc=' + afterEsc + ')');
    console.log('  VERDICT: ' + (reachedAfter ? 'NOT TRAPPED (Tab crosses boundary)' :
                  escWorked ? 'NOT TRAPPED via Esc (documented-exit pattern)' :
                  'TRAPPED (focus never reaches AFTER by Tab or Esc)'));
    await page.close();
  }
  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
