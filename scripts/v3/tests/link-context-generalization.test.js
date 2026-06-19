// Generalization + adversarial guards for the 2.4.4 link-context fixes (#11 onclick jsHref, #12 enclosing-block
// context) AND the generalized prohibited-ARIA condition. Every fixture here is SYNTHETIC (data: URL) and is NOT a
// member of the ACT corpus — the point is to prove the CONDITIONS match the RULE, not the example pages the fixes
// were derived from. Each fix is paired with an OVER-FIRE guard (the variant that must NOT trip it), because the
// full-corpus generalization check proved that passing the tuned examples is not evidence a condition generalizes.
'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const puppeteer = require('puppeteer');
const { CHROME } = require('../lib/run-experiments.js');
const { collectActPage, normalizeCollectRoles } = require('../lib/act-page-collect.js');
const adj = require('../lib/llm-adjudicator.js');

const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — link-context-generalization suite SKIPPED');

let browser;
before(async () => { if (chromeOK) browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] }); });
after(async () => { if (browser) await browser.close(); });

async function collectHtml(html) {
  const page = await browser.newPage();
  try {
    const url = 'data:text/html,' + encodeURIComponent('<!doctype html><html lang="en"><body>' + html + '</body></html>');
    return normalizeCollectRoles(await collectActPage(page, { url, elementCap: 80, file: 't', runId: 't', sourceUrl: url, runAxe: false }));
  } finally { await page.close(); }
}
const links = (c) => (c.elements || []).filter((e) => (e.axRole || e.roleAttr || e.sampledRole) === 'link' || e.tag === 'a');
// reproduce selectRubricSubjects' threading: attach same-named peers, then read the rubric's signal.
function sameNameSignal(c) {
  const ls = links(c);
  const el = ls[0];
  el.__sameNameLinks = ls.slice(1).map((l) => ({ xpath: l.xpath, name: l.axName || l.text, href: l.href || l.jsHref || null }));
  return adj.precomputeSignals(el, 'name-role-state').sameNameLinks;
}
const prohibited = (c) => (c.elements || []).filter((e) => e.prohibitedAriaAttr === true).map((e) => e.tag + (e.roleAttr ? '[role=' + e.roleAttr + ']' : ''));

// ─────────────────────────── #11 — onclick JS-navigation links ───────────────────────────

test('#11 jsHref: a span role=link navigating via onclick="location=…" exposes its destination', { skip: !chromeOK }, async () => {
  const c = await collectHtml(`<span role="link" tabindex="0" onclick="location='/p.html?page=1'">Go</span>`);
  assert.equal(links(c)[0].jsHref, '/p.html?page=1', 'onclick location literal extracted to jsHref');
});

test('#11 jsHref GENERALIZES over the nav idioms (location.href / window.open / .assign), not one string form', { skip: !chromeOK }, async () => {
  for (const [oc, want] of [
    [`location.href='/a.html?x=1'`, '/a.html?x=1'],
    [`location.href = "/b.html"`, '/b.html'],
    [`window.open('/c.html?y=2')`, '/c.html?y=2'],
    [`location.assign("/d.html")`, '/d.html'],
    [`location.replace('/e.html')`, '/e.html'],
  ]) {
    // escape inner double-quotes so a double-quoted JS string literal does not collide with the HTML attribute quoting
    const c = await collectHtml(`<span role="link" tabindex="0" onclick="${oc.replace(/"/g, '&quot;')}">Go</span>`);
    assert.equal(links(c)[0].jsHref, want, `idiom ${oc} → ${want}`);
  }
});

test('#11 OVER-FIRE guard: a computed onclick with NO string literal yields no jsHref (no false destination)', { skip: !chromeOK }, async () => {
  const c = await collectHtml(`<span role="link" tabindex="0" onclick="doNavigate(); track(this)">Go</span>`);
  assert.equal(links(c)[0].jsHref, null, 'a non-literal onclick must NOT invent a jsHref');
});

test('#11 two same-named JS-links to DIFFERENT pages → distinctRawHrefs=2 (cannot false-clear)', { skip: !chromeOK }, async () => {
  const c = await collectHtml(
    `<span role="link" tabindex="0" onclick="location='/contact.html?page=1'">Contact Us</span>` +
    `<span role="link" tabindex="0" onclick="location='/contact.html?page=2'">Contact Us</span>`);
  assert.equal(sameNameSignal(c).distinctRawHrefs, 2, 'page=1 vs page=2 are distinct destinations');
});

test('#11 OVER-FIRE guard: two same-named JS-links to the SAME page → distinctRawHrefs=1 (no spurious 2.4.4 smell)', { skip: !chromeOK }, async () => {
  const c = await collectHtml(
    `<span role="link" tabindex="0" onclick="location='/help.html'">Help</span>` +
    `<span role="link" tabindex="0" onclick="location='/help.html'">Help</span>`);
  assert.equal(sameNameSignal(c).distinctRawHrefs, 1, 'identical destinations must not read as divergent');
});

// ─────────────────────────── #12 — enclosing-block context ───────────────────────────

test('#12 a link ALONE in its block (own <p>) → linkAloneInBlock=true (no programmatic context beyond its name)', { skip: !chromeOK }, async () => {
  const c = await collectHtml(`<p>Some preceding descriptive sentence in a separate paragraph.</p><p><a href="/r.html">Report</a></p>`);
  const el = links(c).find((l) => (l.axName || l.text || '').trim() === 'Report');
  const sig = adj.precomputeSignals(el, 'name-role-state').enclosingContext;
  assert.equal(sig.linkAloneInBlock, true, 'a preceding SIBLING paragraph is NOT enclosing context');
});

test('#12 OVER-FIRE guard: a link INSIDE a sentence → linkAloneInBlock=false (real enclosing context exists)', { skip: !chromeOK }, async () => {
  const c = await collectHtml(`<p>Please read the <a href="/r.html">annual report</a> before the meeting.</p>`);
  const el = links(c)[0];
  const sig = adj.precomputeSignals(el, 'name-role-state').enclosingContext;
  assert.equal(sig.linkAloneInBlock, false, 'enclosing-block prose around the link must be recognized as context');
});

// ─────────────────────────── generalized prohibited-ARIA (variants outside the ACT examples) ───────────────────────────

test('prohibited-ARIA GENERALIZES roledescription beyond div/span: <p>/<em> (prohibited roles) are flagged', { skip: !chromeOK }, async () => {
  assert.deepEqual(prohibited(await collectHtml(`<p aria-roledescription="fancy text">Hello</p>`)), ['p'], 'paragraph role prohibits aria-roledescription');
  assert.deepEqual(prohibited(await collectHtml(`<em aria-roledescription="fancy">Hello</em>`)), ['em'], 'emphasis role prohibits aria-roledescription');
});

test('prohibited-ARIA OVER-FIRE guard: a role that SUPPORTS roledescription (button) is NOT flagged', { skip: !chromeOK }, async () => {
  assert.deepEqual(prohibited(await collectHtml(`<button aria-roledescription="toggle">Menu</button>`)), [], 'button supports aria-roledescription');
  assert.deepEqual(prohibited(await collectHtml(`<div role="button" aria-roledescription="toggle">Menu</div>`)), [], 'role=button supports aria-roledescription');
});

test('prohibited-ARIA braille: unbacked on a paragraph (no name from content) is flagged; backed by content on a heading is NOT', { skip: !chromeOK }, async () => {
  assert.deepEqual(prohibited(await collectHtml(`<p aria-braillelabel="braille">Plain text</p>`)), ['p'], 'a paragraph gets no name from content → braille label is unbacked');
  // OVER-FIRE guard (the corpus FP): a heading is name-from-content, so its braille label IS backed → not prohibited.
  assert.deepEqual(prohibited(await collectHtml(`<div role="heading" aria-braillelabel="braille">Visible Heading</div>`)), [], 'a content-named heading backs its braille label');
  assert.deepEqual(prohibited(await collectHtml(`<h2 aria-braillelabel="braille">Visible Heading</h2>`)), [], 'an <h2> with content backs its braille label');
});
