'use strict';
// Deterministic probe for TT gap G1 (collect-lists.js). Crafts a fixture with real lists, BOTH faux-list modes,
// and DECOYS that must NOT fire (a card grid without glyphs, a single hyphenated sentence, a real <ul> wrapped in
// a <div>). Prints the extracted lists[] + writes a screenshot to eyeball. Run: node scripts/v3/tests/manual/probe-collect-lists.js
const puppeteer = require('puppeteer');
const path = require('path');
const { collectLists } = require('../../lib/collect-lists.js');

const HTML = `<!doctype html><html><head><meta charset=utf-8><style>
body{font:16px sans-serif;padding:20px} .grid{display:flex;gap:10px} .card{border:1px solid #ccc;padding:10px;width:120px}
</style></head><body>
<h2>Real unordered list</h2>
<ul><li>Apples</li><li>Oranges</li><li>Pears</li></ul>

<h2>Real ordered list (steps)</h2>
<ol><li>Preheat oven</li><li>Mix batter</li><li>Bake 30 min</li></ol>

<h2>Real list with a STRAY child (structural break)</h2>
<ul><li>One</li><div>I am not an li</div><li>Two</li></ul>

<h2>Definition list</h2>
<dl><dt>HTML</dt><dd>HyperText Markup Language</dd><dt>CSS</dt><dd>Cascading Style Sheets</dd></dl>

<h2>FAUX list via &lt;br&gt; (should FIRE)</h2>
<p>Shopping:<br>• Milk<br>• Eggs<br>• Bread<br>• Butter</p>

<h2>FAUX numbered list via &lt;br&gt; (should FIRE)</h2>
<div>Steps:<br>1. Open the box<br>2. Remove the device<br>3. Press power</div>

<h2>FAUX list via sibling blocks (should FIRE)</h2>
<div class=faux><div>- First reason it matters</div><div>- Second reason it matters</div><div>- Third reason it matters</div></div>

<h2>DECOY card grid (must NOT fire — no glyphs)</h2>
<div class=grid><div class=card>Product A</div><div class=card>Product B</div><div class=card>Product C</div></div>

<h2>DECOY single hyphenated sentence (must NOT fire)</h2>
<p>- This is just one introductory line, not a list.</p>

<h2>DECOY real list wrapped in a div (must NOT count the wrapper as faux)</h2>
<div><ul><li>Inside</li><li>A real</li><li>List here</li></ul></div>
</body></html>`;

(async () => {
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setViewport({ width: 800, height: 1200 });
  await page.setContent(HTML, { waitUntil: 'load' });
  const lists = await page.evaluate(collectLists);
  const shot = path.join(__dirname, 'out-collect-lists.png');
  await page.screenshot({ path: shot, fullPage: true });
  console.log(JSON.stringify(lists, null, 2));
  console.log('\n--- SUMMARY ---');
  const real = lists.filter((l) => l.kind === 'real');
  const faux = lists.filter((l) => l.kind === 'faux');
  console.log(`real lists: ${real.length} (expect 5: ul, ol, ul-with-stray, dl, inner-ul)`);
  console.log(`  stray-child flagged: ${real.filter((l) => l.hasNonItemChildren).map((l) => l.tag + '/' + l.itemCount).join(', ')}`);
  console.log(`faux lists: ${faux.length} (expect 3: br-bulleted x2 + sibling-bulleted x1)`);
  for (const f of faux) console.log(`  ${f.via} <${f.tag}> items=${f.itemCount} :: ${f.itemSamples.join(' | ')}`);
  console.log(`\nscreenshot: ${shot}`);
  await browser.close();
})();
