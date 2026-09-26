// Expert-study FP root cause (docs/analysis/EXPERT-FP-ROOT-CAUSE-2026-09-25.md) — the runner/instrument fixes,
// each pinned by the real-page shape that produced the false positive AND a counterexample that must stay a
// barrier. Chrome-gated, like the other runner suites.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { runPlan, CHROME } = require('../../lib/run-experiments.js');

const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — expert-FP runner suite SKIPPED');

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'expert-fp-fx-'));
const writeFx = (name, html) => { const p = path.join(DIR, name); fs.writeFileSync(p, html); return 'file://' + p; };
const runnerResults = (plan, url) => runPlan(plan, { resolveUrl: () => url });
const one = async (experimentId, xp, url, sc) => (await runnerResults({ file: 'f', runId: 'R', pageDigest: 'sha256:f', _startedAt: 1,
  requests: [{ candidateId: 'c', experimentId, targetXpath: xp, sc }] }, url)).results[0].outcome;

// A1 — zoom-clip. div[1]: Zillow's photo carousel — an overflow:hidden strip wider than its box whose only text is
// sr-only "Previous photo"/"Next photo" labels. div[2]: Vueling's 1x8 clip window. div[3]: the same carousel but
// with a VISIBLE caption clipped mid-line — must still be a barrier.
const SR = 'position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0px,0px,0px,0px);white-space:nowrap';
const FX_ZOOM = writeFx('zoom.html', `<!DOCTYPE html><html lang="en"><body>
  <div style="width:300px;height:177px;overflow:hidden;display:flex">
    <img style="width:300px;height:177px;flex:none" alt=""><img style="width:300px;height:177px;flex:none" alt="">
    <button><span style="${SR}">Previous photo</span></button><button><span style="${SR}">Next photo</span></button>
  </div>
  <div style="width:1px;height:8px;overflow:hidden"><span>EN | EUR</span></div>
  <div style="width:300px;height:30px;overflow:hidden;font-size:20px;line-height:20px">A visible caption long enough to wrap onto a second line inside the clipped box.</div>
</body></html>`);

test('A1 zoom-clip: sr-only text and a sub-4px window are not clipped visible text; a visible clipped caption still is', { skip: !chromeOK, concurrency: false }, async () => {
  assert.equal((await one('zoom-clip-probe', '/html/body/div[1]', FX_ZOOM, '1.4.4')).zoomClipApplicable, false, 'sr-only carousel labels');
  assert.equal((await one('zoom-clip-probe', '/html/body/div[2]', FX_ZOOM, '1.4.4')).zoomClipApplicable, false, '1x8 window');
  assert.equal((await one('zoom-clip-probe', '/html/body/div[3]', FX_ZOOM, '1.4.4')).barrierConfirmed, true, 'visible caption clipped mid-line');
});

// A2 — colour-peer groups (peers = same-parent siblings). div[1]: Zillow's dots (active 8x8 white, peers 6x6/4x4 translucent) — size is a
// non-colour cue ⇒ no group. div[2]: identical 6x6 dots differing only in colour ⇒ still a group. nav: text
// links of different widths differing only in colour ⇒ still a group (text width is not a state cue).
const DOT = (w, bg, label) => `<button aria-label="${label}" style="display:block;width:${w}px;height:${w}px;border:0;padding:0;border-radius:50%;background:${bg}"></button>`;
const FX_PEERS = writeFx('peers.html', `<!DOCTYPE html><html lang="en"><body style="background:#333">
  <div style="display:flex;gap:4px">${DOT(8, '#fff', 'Slide 1')}${DOT(6, 'rgba(255,255,255,.6)', 'Slide 2')}${DOT(4, 'rgba(255,255,255,.6)', 'Slide 3')}</div>
  <div style="display:flex;gap:4px">${DOT(6, '#fff', 'Page 1')}${DOT(6, 'rgba(255,255,255,.4)', 'Page 2')}${DOT(6, 'rgba(255,255,255,.4)', 'Page 3')}</div>
  <nav><a href="#a" style="color:#e33">Home</a> <a href="#b" style="color:#9cf">About us today</a></nav>
</body></html>`);

test('A2 colour peers: a size-distinguished dot set is not colour-only; same-size dots and different-width text links still are', { skip: !chromeOK, concurrency: false }, async () => {
  const puppeteer = require('puppeteer');
  const { collectColourPeers } = require('../../lib/collect-colour-peers.js');
  const browser = await puppeteer.launch({ headless: true, executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    await page.goto(FX_PEERS);
    const groups = await page.evaluate(collectColourPeers, {});
    const under = (xp) => groups.some((g) => g.members.some((m) => m.xpath.startsWith(xp)));
    assert.equal(under('/html/body/div[1]/'), false, 'Zillow-shape dots (8 vs 6/4 px) carry a size cue');
    assert.equal(under('/html/body/div[2]/'), true, 'equal-size dots differing only by colour stay a 1.4.1 group');
    assert.equal(under('/html/body/nav[1]/'), true, 'text links of different widths differing only by colour stay a group');
  } finally { await browser.close(); }
});

// A3 — embedded-format trap. iframe[1]: a Zillow-ad shape — 2 own buttons plus a NESTED iframe with 5 more, so
// the walk out is longer than the old `innerFocusables + margin` budget; focus leaves normally ⇒ no trap.
// iframe[2]: a real trap — Tab and Shift+Tab are swallowed and bounced between the two inner buttons.
const q = (s) => s.replace(/"/g, '&quot;');
const INNER = '<button>n1</button><button>n2</button><button>n3</button><button>n4</button><button>n5</button>';
const LONG = `<button>a1</button><button>a2</button><iframe srcdoc="${q(INNER)}"></iframe>`;
const TRAP = `<button id=x>x</button><button id=y>y</button><script>document.addEventListener('keydown',function(e){if(e.key==='Tab'){e.preventDefault();(document.activeElement.id==='x'?document.getElementById('y'):document.getElementById('x')).focus();}});<\/script>`;
const FX_FRAMES_LONG = writeFx('frames-long.html', `<!DOCTYPE html><html lang="en"><body><button>before</button><iframe title="ad" srcdoc="${q(LONG)}"></iframe><button>after</button></body></html>`);
const FX_FRAMES_TRAP = writeFx('frames-trap.html', `<!DOCTYPE html><html lang="en"><body><button>before</button><iframe title="widget" srcdoc="${q(TRAP)}"></iframe><button>after</button></body></html>`);

test('A3 embedded trap: a nested-iframe embed longer than the old budget escapes; a Tab-cycling embed is still a trap', { skip: !chromeOK, concurrency: false }, async () => {
  const puppeteer = require('puppeteer');
  const { detectEmbeddedFormatTraps } = require('../../lib/kbd-graph.js');
  const browser = await puppeteer.launch({ headless: true, executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    const run = async (url) => { const page = await browser.newPage(); await page.goto(url); await new Promise((r) => setTimeout(r, 300)); const r = await detectEmbeddedFormatTraps(page, {}); await page.close(); return r; };
    const long = await run(FX_FRAMES_LONG);
    assert.equal(long.traps.length, 0, 'long nested embed: focus leaves on a later press, not a trap: ' + JSON.stringify(long));
    const trap = await run(FX_FRAMES_TRAP);
    assert.equal(trap.traps.length, 1, 'Tab-cycling embed is a trap: ' + JSON.stringify(trap));
  } finally { await browser.close(); }
});

// A4 — at-rest error state. form[1]: a pristine Ashby-shape job form — text fields, a clip-hidden 1x1 file input
// behind a styled upload button, and a combobox whose chevron lives in its toggle button ⇒ nothing flagged.
// form[2]: a redisplayed form where one text field carries a red border and a (non-interactive) warning icon
// ⇒ that field is still flagged.
const TXT = (n, extra = '') => `<div><input name="${n}" style="border:1px solid #7d8699;width:300px;height:40px"${extra}></div>`;
const FX_ERR = writeFx('err.html', `<!DOCTYPE html><html lang="en"><body>
  <form>${TXT('a')}${TXT('b')}${TXT('c')}
    <div><input type="file" style="position:absolute;width:1px;height:1px;clip:rect(0px,0px,0px,0px);border:1px solid #373e4d"><button type="button">Upload File</button></div>
    <div><input role="combobox" aria-haspopup="listbox" style="border:1px solid #7d8699;width:300px;height:40px"><button type="button"><svg width="10" height="10"></svg></button></div>
  </form>
  <form>${TXT('d')}${TXT('e')}<div><input name="f" style="border:2px solid #d00;width:300px;height:40px"><svg width="12" height="12" role="img"></svg></div></form>
</body></html>`);

test('A4 at-rest error state: hidden file inputs and control chevrons are not error markers; a red-bordered iconed field still is', { skip: !chromeOK, concurrency: false }, async () => {
  const puppeteer = require('puppeteer');
  const { collectAtRestErrorState } = require('../../lib/collect-error-summary.js');
  const browser = await puppeteer.launch({ headless: true, executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage(); await page.goto(FX_ERR);
    const rows = await page.evaluate(collectAtRestErrorState);
    const flagged = rows.filter((r) => r.flaggedAtRest).map((r) => r.xpath);
    assert.deepEqual(flagged.filter((x) => x.startsWith('/html/body/form[1]')), [], 'pristine form: nothing flagged');
    assert.ok(flagged.includes('/html/body/form[2]/div[3]/input[1]'), 'red-bordered, iconed field in the redisplay is flagged: ' + JSON.stringify(flagged));
  } finally { await browser.close(); }
});

// A5 — link context. li[1]: a news card whose title link and "comments: 8" link go to the SAME article ⇒ the title
// is the comments link's enclosing context. li[2]: a format list — PDF and EPUB links to DIFFERENT files in one
// item with no subject text ⇒ the EPUB link still has no context (sibling format words are not a subject).
const FX_LINKCTX = writeFx('linkctx.html', `<!DOCTYPE html><html lang="en"><body><ul>
  <li><article><span>In the News</span><h2><a href="https://news.example/story-1?o=hp">Mayor Opens New Library</a></h2>
    <ul><li><a href="https://news.example/story-1?o=hp&comments=1">The amount of the post comments: 8</a></li></ul></article></li>
  <li><a href="https://files.example/report.pdf">PDF</a> <a href="https://files.example/report.epub">EPUB</a></li>
</ul></body></html>`);

test('A5 link context: a same-resource sibling link supplies context; a different-resource format sibling does not', { skip: !chromeOK, concurrency: false }, async () => {
  const puppeteer = require('puppeteer');
  const { collectActPage } = require('../../lib/act-page-collect.js');
  const browser = await puppeteer.launch({ headless: true, executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    const xpComments = '/html/body/ul[1]/li[1]/article[1]/ul[1]/li[1]/a[1]';
    const xpEpub = '/html/body/ul[1]/li[2]/a[2]';
    const out = await collectActPage(page, { url: FX_LINKCTX, xpaths: [xpComments, xpEpub] });
    const by = Object.fromEntries(out.elements.map((e) => [e.xpath, e]));
    assert.match(by[xpComments].enclosingBlockText, /Mayor Opens New Library/, 'title of the same article is context');
    assert.equal(by[xpEpub].enclosingBlockText, '', 'EPUB beside PDF: no subject context');
  } finally { await browser.close(); }
});

// A7 — status messages. button#dlg opens a cookie-preferences role=dialog (no focus move) ⇒ not a status message.
// button#add inserts "Added to cart" in a plain div ⇒ still an unannounced status. button#css inserts a widget
// that carries its own <style> plus the text "Saved" ⇒ the message is "Saved", never the CSS.
const FX_STATUS = writeFx('status.html', `<!DOCTYPE html><html lang="en"><body>
  <button id="dlg" type="button">Cookie settings</button>
  <div id="d" role="dialog" aria-label="Storage Preferences" hidden></div>
  <button id="add" type="button">Add to cart</button><div id="out"></div>
  <button id="css" type="button">Save draft</button><div id="out2"></div>
  <script>
    document.getElementById('dlg').onclick = function () { var d = document.getElementById('d'); d.hidden = false; d.innerHTML = '<p role="heading" aria-level="1">Storage Preferences</p><p>Choose which cookies we store.</p>'; };
    document.getElementById('add').onclick = function () { document.getElementById('out').innerHTML = '<p>Added to cart</p>'; };
    document.getElementById('css').onclick = function () { document.getElementById('out2').innerHTML = '<span><style>.x{color:red;margin:0 auto}</style>Saved</span>'; };
  <\/script>
</body></html>`);

test('A7 status: an opened dialog is not a status message; a plain insertion still is; <style> text is never the message', { skip: !chromeOK, concurrency: false }, async () => {
  const puppeteer = require('puppeteer');
  const { detectStatusMessages } = require('../../lib/status-detector.js');
  const browser = await puppeteer.launch({ headless: true, executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage(); await page.goto(FX_STATUS);
    const r = await detectStatusMessages(page, { timelineMs: 0 });
    const f = (r.findings || []).filter((x) => x.kind === 'status-not-announced');
    const byTrigger = (id) => f.filter((x) => x.trigger === `/html/body/button[${id}]`);
    assert.equal(byTrigger(1).length, 0, 'dialog content is not a status message: ' + JSON.stringify(f));
    assert.equal(byTrigger(2).length, 1, '"Added to cart" outside a live region is still a finding');
    assert.equal(byTrigger(3).length, 1, 'the styled "Saved" widget is still a finding');
    assert.match(byTrigger(3)[0].detail, /"Saved"/, 'its message is the visible text');
    assert.doesNotMatch(byTrigger(3)[0].detail, /color:red/, 'never the CSS');
  } finally { await browser.close(); }
});

// D1 / D2 / D4 — axe on shadow DOM + failed assets + shadow-hosted controls.
//   nav a[href="/m/film"]        a light-DOM link EARLIER in the document with the same href (the D2 decoy)
//   x-card > (shadow) a > slot   a poster link named only by a slotted x-img whose image FAILS and which then
//                                hides its alt-bearing <img> (D1: asset-failed ⇒ needs-review, joined to x-card)
//   a[href="/z"] > img (no alt)  an image link with no text alternative whose image also fails ⇒ STILL a violation
//   play-x (shadow button)       a host with an onclick whose shadow root holds a native <button> (D4: not emulated)
//   div[onclick]                 a plain clickable div ⇒ still the emulated-control shape
const BAD = 'http://127.0.0.1:9/nope.png';
const FX_SHADOW = writeFx('shadow.html', `<!DOCTYPE html><html lang="en"><body>
  <nav><a href="/m/film">Film</a></nav>
  <main>
    <x-card><x-img alt="Film poster"></x-img></x-card>
    <a href="/z"><img src="${BAD}" width="40" height="40"></a>
    <play-x onclick="void 0" style="display:inline-block;width:40px;height:40px"></play-x>
    <div onclick="void 0" style="width:40px;height:40px;cursor:pointer">go</div>
  </main>
  <script>
    customElements.define('x-card', class extends HTMLElement { connectedCallback() { this.attachShadow({ mode: 'open' }).innerHTML = '<a href="/m/film"><slot></slot></a>'; } });
    customElements.define('x-img', class extends HTMLElement { connectedCallback() {
      const r = this.attachShadow({ mode: 'open' }); const i = document.createElement('img'); i.alt = this.getAttribute('alt'); i.width = 60; i.height = 90;
      i.onerror = () => { i.style.display = 'none'; this.classList.add('fallback'); }; i.src = '${BAD}'; r.appendChild(i); } });
    customElements.define('play-x', class extends HTMLElement { connectedCallback() { this.attachShadow({ mode: 'open' }).innerHTML = '<button aria-label="Play">▶</button>'; } });
  <\/script>
</body></html>`);

test('D1/D2/D4 shadow + failed assets: host-joined, asset-failed downgraded, no-alt kept, shadow-hosted control not emulated', { skip: !chromeOK, concurrency: false }, async () => {
  const puppeteer = require('puppeteer');
  const { collectActPage } = require('../../lib/act-page-collect.js');
  const { surfaceAxeFindings } = require('../../lib/axe-surface.js');
  const browser = await puppeteer.launch({ headless: true, executablePath: CHROME, args: ['--no-sandbox'] });
  try {
    const page = await browser.newPage();
    const X_CARD = '/html/body/main[1]/x-card[1]', NOALT = '/html/body/main[1]/a[1]', PLAY = '/html/body/main[1]/play-x[1]', DIV = '/html/body/main[1]/div[1]';
    const out = await collectActPage(page, { url: FX_SHADOW, xpaths: [X_CARD, NOALT, PLAY, DIV], runAxe: true, axePath: require('node:path').join(__dirname, '..', '..', '..', '..', 'axe.min.js') });
    const linkName = surfaceAxeFindings(out).findings.filter((f) => f.ruleId === 'link-name' && f.sc === '2.4.4');
    const card = linkName.find((f) => f.xpath === X_CARD);
    assert.ok(card, 'the shadow link finding is joined to its light-DOM host, not the same-href nav link: ' + JSON.stringify(linkName.map((f) => f.xpath)));
    assert.ok(!linkName.some((f) => f.xpath === '/html/body/nav[1]/a[1]'), 'never joined to the decoy nav link');
    assert.equal(card.kind, 'incomplete', 'name lost only because the alt-bearing image failed ⇒ needs-review');
    assert.equal(card.uncertainReason, 'asset-load-failed');
    const noalt = linkName.find((f) => f.xpath === NOALT);
    assert.equal(noalt && noalt.kind, 'violation', 'an image link with no alt stays a decided violation even though its image failed');
    const el = Object.fromEntries(out.elements.map((e) => [e.xpath, e]));
    assert.equal(el[PLAY].emulatedControlShape, false, 'a host wrapping a native shadow <button> is not an emulated control');
    assert.equal(el[DIV].emulatedControlShape, true, 'a plain clickable div still is');
  } finally { await browser.close(); }
});

test.after(() => { try { fs.rmSync(DIR, { recursive: true, force: true }); } catch (e) {} });
