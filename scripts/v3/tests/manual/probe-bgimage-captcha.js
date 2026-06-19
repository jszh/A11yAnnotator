'use strict';
// Deterministic probe for TT gaps G2 (background-image meaning) + G3 (CAPTCHA) — drives the REAL collector
// (collectActPage) over a crafted fixture and checks which elements get backgroundImageMeaningful / isCaptcha.
// Positive cases must fire; decoys (text overlay, aria-hidden, named, too-big) must NOT. Run:
//   node scripts/v3/tests/manual/probe-bgimage-captcha.js
const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { collectActPage } = require('../../lib/act-page-collect.js');

const HTML = `<!doctype html><html><head><meta charset=utf-8><style>
  body{font:16px sans-serif;padding:16px}
  .bg{background-image:url(https://example.com/icon.png);background-size:cover}
  .icon{display:inline-block;width:32px;height:32px}
  .hero{width:600px;height:300px}
  .fb{width:900px;height:700px}
  a.btn{display:inline-block;width:40px;height:40px}
</style></head><body>
  <!-- POSITIVE: interactive control labelled ONLY by a bg-image (also a 4.1.2 fail) -->
  <a id="p1" class="bg btn" href="#"></a>
  <!-- POSITIVE: small icon-sized bg-image, no text/name, not interactive -->
  <span id="p2" class="bg icon"></span>
  <!-- DECOY: bg-image button WITH an accessible name -->
  <button id="d1" class="bg btn" aria-label="Search"></button>
  <!-- DECOY: large hero bg-image with TEXT overlay -->
  <div id="d2" class="bg hero">Welcome to our site</div>
  <!-- POSITIVE: medium non-interactive bg-image, no text — NOW nominated (size deferred to the rubric) -->
  <div id="p4" class="bg hero"></div>
  <!-- DECOY: a FULL-BLEED background (near-full-screen) — almost always decorative, must NOT fire -->
  <div id="df" class="bg fb"></div>
  <!-- DECOY: small bg-image but aria-hidden (decorative) -->
  <span id="d4" class="bg icon" aria-hidden="true"></span>
  <!-- DECOY: small bg-image but role=presentation -->
  <span id="d5" class="bg icon" role="presentation"></span>

  <!-- POSITIVE captchas -->
  <div id="c1" class="g-recaptcha" data-sitekey="abc" style="width:300px;height:78px"></div>
  <div id="c2" class="cf-turnstile" data-sitekey="xyz" style="width:300px;height:65px"></div>
  <iframe id="c3" title="hCaptcha challenge" src="https://hcaptcha.com/c?x=1" style="width:300px;height:80px"></iframe>
  <div id="c4" class="captcha-container" style="width:300px;height:80px">verify</div>
  <!-- DECOYS: not a captcha — a buried "captcha" substring + a prose title (R2 G3-1 tokenizer) -->
  <div id="d6" class="login-box" style="width:300px;height:80px">Sign in</div>
  <div id="d9" class="no-captcha-needed-badge" style="width:120px;height:40px">verified</div>
  <p id="d10" title="What is a CAPTCHA?">help</p>
</body></html>`;

const idOf = (xpath) => xpath; // we'll map via box/text below; print xpath + flags + a hint

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 900, height: 900 });
  const tmp = path.join(os.tmpdir(), 'probe-bgimage-captcha.html');
  fs.writeFileSync(tmp, HTML);
  const collect = await collectActPage(page, { url: 'file://' + tmp, file: 'probe:bgcaptcha', runId: 'probe' });
  await page.screenshot({ path: path.join(__dirname, 'out-bgimage-captcha.png'), fullPage: true });

  // resolve each collected element's OWN xpath back to its id (the collector's xpath scheme, authoritative)
  const xpaths = collect.elements.map((e) => e.xpath);
  const idByIndex = await page.evaluate((xps) => xps.map((xp) => {
    try { const n = document.evaluate(xp.split('>>')[0], document, null, 9, null).singleNodeValue; return n ? (n.id || null) : null; } catch (e) { return null; }
  }), xpaths);

  const rows = [];
  collect.elements.forEach((el, i) => {
    const id = idByIndex[i] || '(other)';
    if (el.backgroundImageMeaningful || el.isCaptcha || /^[pdc]\d$/.test(id)) {
      rows.push({ id, bgMeaningful: !!el.backgroundImageMeaningful, isCaptcha: !!el.isCaptcha });
    }
  });
  rows.sort((a, b) => (a.id < b.id ? -1 : 1));
  console.log('id     bgMeaningful  isCaptcha');
  for (const r of rows) console.log(`${r.id.padEnd(6)} ${String(r.bgMeaningful).padEnd(13)} ${r.isCaptcha}`);

  const got = (id) => rows.find((r) => r.id === id) || { bgMeaningful: false, isCaptcha: false };
  const expect = [
    ['p1 bg', got('p1').bgMeaningful === true],
    ['p2 bg', got('p2').bgMeaningful === true],
    ['p4 medium bg fires (size deferred to LLM)', got('p4').bgMeaningful === true],
    ['d1 NOT bg (named)', got('d1').bgMeaningful === false],
    ['d2 NOT bg (text)', got('d2').bgMeaningful === false],
    ['df NOT bg (full-bleed hero)', got('df').bgMeaningful === false],
    ['d4 NOT bg (aria-hidden)', got('d4').bgMeaningful === false],
    ['d5 NOT bg (presentation)', got('d5').bgMeaningful === false],
    ['c1 captcha', got('c1').isCaptcha === true],
    ['c2 captcha', got('c2').isCaptcha === true],
    ['c3 captcha', got('c3').isCaptcha === true],
    ['c4 captcha (captcha-container, leading token)', got('c4').isCaptcha === true],
    ['d6 NOT captcha', got('d6').isCaptcha === false],
    ['d9 NOT captcha (buried substring)', got('d9').isCaptcha === false],
    ['d10 NOT captcha (prose title)', got('d10').isCaptcha === false],
  ];
  console.log('\n--- ASSERTIONS ---');
  let pass = 0;
  for (const [label, ok] of expect) { console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`); if (ok) pass++; }
  console.log(`\n${pass}/${expect.length} assertions passed`);
  await browser.close();
  process.exit(pass === expect.length ? 0 : 1);
})();
