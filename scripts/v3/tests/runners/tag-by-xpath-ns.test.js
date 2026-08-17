// tagByXpath NAMESPACE FALLBACK (LLM-ROUTING-AND-FAILURE-ANALYSIS Tier-0 #1). An unprefixed xpath name-test
// matches only null-namespace nodes, so every runner that tags an SVG/MathML subject resolved null, hit
// `.catch(() => false)` and silently abstained — measured as ALL 9 hover-content flips landing on one SVG
// page. The fallback rewrites plain element steps to *[local-name()='…'] INSIDE the serialized in-page
// function, so all 18 call sites are repaired by the one helper.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const puppeteer = require('puppeteer');
const { CHROME, tagByXpath } = require('../../lib/run-experiments.js');
const { BROWSER_ARGS } = require('../../lib/browser-args.js');
const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — tag-by-xpath-ns e2e SKIPPED');

const PAGE = `<!doctype html><html><body>
  <p>plain html paragraph</p>
  <svg viewBox="0 0 100 20" role="img" aria-label="chart">
    <a href="#detail"><rect width="40" height="12"></rect></a>
  </svg>
</body></html>`;

test('tagByXpath resolves HTML the plain way and SVG-namespaced subjects via the local-name() fallback', { skip: !chromeOK, concurrency: false }, async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: BROWSER_ARGS });
  try {
    const page = await browser.newPage();
    await page.setContent(PAGE, { waitUntil: 'load' });
    // HTML: the plain resolution path is untouched
    assert.equal(await page.evaluate(tagByXpath, '/html/body/p[1]', 'm-html'), true, 'plain HTML step resolves');
    assert.equal(await page.evaluate(() => document.querySelector('[data-v3-target="m-html"]').tagName), 'P');
    // SVG: plain resolution yields null (namespaced), the inlined fallback must tag it anyway
    assert.equal(await page.evaluate(tagByXpath, '/html/body/svg[1]/a[1]', 'm-svg'), true, 'SVG-namespaced step resolves via fallback');
    const tagged = await page.evaluate(() => { const el = document.querySelector('[data-v3-target="m-svg"]'); return el ? el.tagName.toLowerCase() : null; });
    assert.equal(tagged, 'a', 'the tagged node is the SVG <a>');
    // absent element: still false, no throw
    assert.equal(await page.evaluate(tagByXpath, '/html/body/table[9]', 'm-none'), false, 'missing element stays false');
  } finally { await browser.close(); }
});
