// FN ROUND 1 (2026-08-19) — the IN-BROWSER half of fn-rootcause-4sc-2026-08-19.test.js: the two fixes that
// live inside page.evaluate and cannot be reached from Node. Launches Chrome, so it is skipped when Chrome
// is absent (the ordinary suite glob picks it up).
//
// Every fixture here is INVENTED and generic — none is derived from, or named after, any corpus page.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const puppeteer = require('puppeteer');

const { observeApplicability } = require('../../lib/applicability-observer.js');
const { collectFieldColourState } = require('../../lib/collect-colour-peers.js');
const { BROWSER_ARGS } = require('../../lib/browser-args.js');

const CHROME = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — fn-rootcause browser tests SKIPPED');

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'fnround1-fx-'));
const writeFx = (name, html) => { fs.writeFileSync(path.join(DIR, name), html); return 'file://' + path.join(DIR, name); };

const withPage = async (url, fn) => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: BROWSER_ARGS });
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle0' });
    return await fn(page);
  } finally { await browser.close(); }
};

// A chart whose bars are SVG rects: each carries an SVG <title> child (the SVG-native tooltip — an ELEMENT,
// not an attribute) and a JS-wired author overlay. The last rect declares nothing at all.
const CHART = writeFx('chart.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Usage</title></head><body>
<svg width="300" height="120" role="img" aria-label="Usage by week">
  <rect id="a" x="10" y="20" width="40" height="80" fill="#39c"><title>Week 1: 22 units</title></rect>
  <rect id="b" x="70" y="40" width="40" height="60" fill="#39c" onmouseenter="void 0"></rect>
  <rect id="c" x="130" y="60" width="40" height="40" fill="#39c"></rect>
</svg>
</body></html>`);

test('F1 an SVG <title> child and an inline hover handler are each an independent trigger declaration', { skip: !chromeOK }, async () => {
  // through observeApplicability, the real entry point — it is what makes the xpath namespace-aware, and
  // an SVG subject that the observer cannot even RESOLVE is the other way this gate silently fails closed.
  const obs = await withPage(CHART, (page) => observeApplicability(page,
    ['/html/body/svg[1]/rect[1]', '/html/body/svg[1]/rect[2]', '/html/body/svg[1]/rect[3]']));
  assert.equal(obs.length, 3, 'every SVG subject resolves');
  const facts = { svgTitle: obs[0].facts, inlineHandler: obs[1].facts, bare: obs[2].facts };
  assert.equal(facts.svgTitle.hasHoverFocusTrigger, true, 'an SVG <title> child is the SVG form of the title attribute');
  assert.equal(facts.inlineHandler.hasHoverFocusTrigger, true, 'an inline onmouseenter declares a hover trigger');
  // the negative half: a bare rect declares nothing, so the observer must NOT wave it through. Widening the
  // gate to "any SVG shape" would corroborate every runner claim on every chart on the web.
  assert.equal(facts.bare.hasHoverFocusTrigger, false, 'a bare shape declares no trigger');
});

test('F2 a plain <div> with no hover declaration is still not a trigger', { skip: !chromeOK }, async () => {
  const url = writeFx('plain.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Plain</title></head>
<body><div id="d" style="width:50px;height:20px">Totals</div></body></html>`);
  const obs = await withPage(url, (page) => observeApplicability(page, ['/html/body/div[1]']));
  assert.equal(obs[0].facts.hasHoverFocusTrigger, false);
});

// A form whose coded state is drawn as a shadow RING (no layout shift, no border-width change) — the shape
// that was invisible to a border+outline-only reading of the styling.
const FORM = writeFx('form.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Details</title><style>
  input { border: 1px solid rgb(200, 205, 212); padding: 6px; }
  input.flagged { box-shadow: 0 0 0 2px rgb(198, 40, 40); border-color: rgb(198, 40, 40); }
</style></head><body>
<form>
  <label for="p">Depot code</label><input id="p">
  <label for="q">Reference</label><input id="q" class="flagged">
</form>
</body></html>`);

test('F3 a shadow ring is captured on the field and surfaced on the peer row that differs', { skip: !chromeOK }, async () => {
  const states = await withPage(FORM, (page) => page.evaluate(collectFieldColourState, {}));
  const byLabel = {};
  for (const s of states) byLabel[s.label] = s;
  assert.equal(byLabel['Depot code'].boxShadow, 'none', 'a field with no shadow reports none, never a missing key');
  assert.match(byLabel.Reference.boxShadow, /rgb\(198, 40, 40\)/, 'the coded state\'s shadow ring is captured');
  const peer = (byLabel.Reference.group.differentAppearanceFrom || []).find((p) => p.label === 'Depot code');
  assert.ok(peer, 'the plain field is a differently-appearing peer');
  assert.equal(peer.boxShadow, 'none', 'the peer row states the shadow it lacks, so the difference is legible');
  // and the byte-discipline half: a peer whose shadow MATCHES omits the key entirely.
  const self = (byLabel['Depot code'].group.differentAppearanceFrom || []).find((p) => p.label === 'Reference');
  assert.ok(self && self.boxShadow !== undefined, 'the reverse row carries the differing shadow too');
});
