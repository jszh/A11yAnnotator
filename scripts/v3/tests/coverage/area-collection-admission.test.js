// THE AREA THE ORACLE COULD NEVER SEE. An <area> has a 0×0 client rect in Chrome, so the element-loop
// visibility skip in act-page-collect dropped every image-map region link before the oracle's new
// `area[href]` branch (aperture-widenings-s10) could enumerate it — the branch was correct and dead on
// arrival. `renderedAreaShape` admits an href-bearing area exactly when its owning <map name> is wired to
// a VISIBLE <img usemap>; this pins the admission AND its negative space (unreferenced map, hidden image,
// href-less area), because the visibility skip exists to keep the collection bounded and an unconditional
// area admission would quietly undo that.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const puppeteer = require('puppeteer');

const { collectActPage } = require('../../lib/act-page-collect.js');
const { BROWSER_ARGS } = require('../../lib/browser-args.js');

const CHROME = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — area-collection-admission SKIPPED');

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'areafx-'));
const writeFx = (name, html) => { fs.writeFileSync(path.join(DIR, name), html); return 'file://' + path.join(DIR, name); };

// Invented generic fixture: a campus map. A 1×1 transparent gif keeps the img visible without an asset.
const PX = 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==';
const FX = writeFx('campus.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Campus</title></head><body>
  <img src="${PX}" usemap="#campus" alt="Campus buildings" width="300" height="200">
  <map name="campus">
    <area shape="rect" coords="0,0,100,100" href="#library" alt="Library">
    <area shape="rect" coords="100,0,200,100" alt="No destination here">
  </map>
  <map name="orphan">
    <area shape="rect" coords="0,0,50,50" href="#nowhere" alt="Unwired region">
  </map>
  <h2 id="library">Library</h2>
</body></html>`);

test('a wired area[href] is collected; href-less and orphan-map areas are not', { skip: !chromeOK, concurrency: false }, async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: BROWSER_ARGS });
  try {
    const page = await browser.newPage();
    const out = await collectActPage(page, { url: FX, elementCap: 200, file: 'fx' });
    const areas = out.elements.filter((e) => e.tag === 'area');
    assert.equal(areas.length, 1, `exactly the wired href-bearing area is admitted, got ${areas.length}`);
    assert.match(areas[0].xpath, /map\[1\]\/area\[1\]/, 'it is the first map\'s first area');
  } finally { await browser.close(); }
});
