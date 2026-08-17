// THE FRAGMENT DESTINATION WAS A TOOL-CALL COIN FLIP.
//
// WHAT WENT WRONG. The 2.4.4 rubric's name-contradicts-destination mode needs to know what the link's
// destination IS. For a same-document fragment (`href="#…"`) that answer previously arrived only if the
// judge happened to call `resolve_destination`: a run that made the call caught the contradiction, a run
// that did not cleared it with high confidence, and the tool's screenshot/OCR path is lossy on RTL text
// where the DOM is exact. But a fragment target lives in the SAME document the collector already stands
// in — resolving it is a getElementById, not a navigation.
//
// WHAT THIS PINS. (§1) fragment resolution in a real browser — target-is-a-heading, heading INSIDE the
// target, heading immediately FOLLOWING an empty anchor, aria-label'd target, and a missing target;
// (§2) the per-link href facts — terminal path segment + extension, and none fabricated for a
// fragment-only or non-navigational href; (§3) `sameNameDifferentTarget` in both directions — true only
// when a same-named link resolves elsewhere; (§4) `area[href]` is enumerated like `a[href]`;
// (§5) act-page-collect joins the record onto the RIGHT element — the wiring whose silent failure has
// twice killed a whole lane.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const puppeteer = require('puppeteer');

const { collectLinkTargetFacts } = require('../../lib/collect-link-facts.js');
const { collectActPage } = require('../../lib/act-page-collect.js');
const { BROWSER_ARGS } = require('../../lib/browser-args.js');

const CHROME = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — link-target-facts browser tests SKIPPED');

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'linkfacts-fx-'));
const writeFx = (name, html) => { fs.writeFileSync(path.join(DIR, name), html); return 'file://' + path.join(DIR, name); };

// Every fixture is a generic page invented for this test — a plain museum-style site. None is derived
// from, or related to, any evaluated page.
const LINKS = writeFx('links.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Links</title></head><body>
  <nav>
    <a href="#history">Our history</a>
    <a href="#staff">Meet the staff</a>
    <a href="#legal">Legal notices</a>
    <a href="#nowhere">Site map</a>
    <a href="docs/annual-report.pdf">Annual report</a>
    <a href="https://example.org/about/team.html">The team</a>
    <a href="mailto:hello@example.org">Write to us</a>
  </nav>
  <p>Read the <a href="#history">details</a> or download the <a href="docs/annual-report.pdf">details</a>.</p>
  <p><a href="#staff">Directory</a> and again the <a href="#staff">Directory</a>.</p>
  <img src="floorplan.png" alt="Floor plan" usemap="#wings" width="80" height="40">
  <map name="wings"><area shape="rect" coords="0,0,40,40" href="#history" alt="History wing"></map>

  <h2 id="history">A century of collecting</h2>
  <p>Founded long ago.</p>
  <section id="staff">
    <h2>Staff directory</h2>
    <p>Curators and conservators.</p>
  </section>
  <a id="legal"></a>
  <h2>Terms of service</h2>
  <p>Boring but necessary.</p>
  <div id="chart" role="img" aria-label="Visitor numbers by season"></div>
</body></html>`);

async function withBrowser(fn) {
  const browser = await puppeteer.launch({ headless: 'new', executablePath: CHROME, args: BROWSER_ARGS });
  try { return await fn(browser); } finally { await browser.close(); }
}
const factsOn = async (browser, url) => {
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(url, { waitUntil: 'load' });
    return await page.evaluate(collectLinkTargetFacts);
  } finally { await page.close(); }
};
// One browser pass for the whole file — the fixture is static and the machine is shared.
let RECS = null;
const recs = async () => { if (!RECS) RECS = await withBrowser((b) => factsOn(b, LINKS)); return RECS; };

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// §1 — fragment resolution: what the destination says it is, in the destination's own words
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

test('§1 a fragment whose target IS a heading reports the heading text', { skip: !chromeOK }, async () => {
  const r = (await recs()).find((x) => x.href === '#history' && x.xpath.includes('/nav'));
  assert.ok(r, 'the nav link produced a record');
  assert.equal(r.fragment.targetExists, true);
  assert.equal(r.fragment.targetTag, 'h2');
  assert.equal(r.fragment.targetHeadingText, 'A century of collecting');
});

test('§1 a fragment targeting a container reports the FIRST heading inside it', { skip: !chromeOK }, async () => {
  const r = (await recs()).find((x) => x.href === '#staff' && x.xpath.includes('/nav'));
  assert.equal(r.fragment.targetExists, true);
  assert.equal(r.fragment.targetTag, 'section');
  assert.equal(r.fragment.firstHeadingText, 'Staff directory');
  assert.equal('targetHeadingText' in r.fragment, false, 'the container is not itself a heading');
});

test('§1 an empty-anchor target reports the heading immediately FOLLOWING it', { skip: !chromeOK }, async () => {
  const r = (await recs()).find((x) => x.href === '#legal');
  assert.equal(r.fragment.targetExists, true);
  assert.equal(r.fragment.firstHeadingText, 'Terms of service');
});

test('§1 a missing target is stated as a fact, not left to a tool call', { skip: !chromeOK }, async () => {
  const r = (await recs()).find((x) => x.href === '#nowhere');
  assert.deepEqual(r.fragment, { targetId: 'nowhere', targetExists: false });
});

test("§1 a heading-less target still carries its accessible name (aria-label)", { skip: !chromeOK }, async () => {
  // exercised directly (no link in the fixture points here, so resolve it via a one-off page)
  const url = writeFx('named-target.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>N</title></head><body>
    <a href="#chart">See the chart</a>
    <div id="chart" role="img" aria-label="Visitor numbers by season"></div>
  </body></html>`);
  const out = await withBrowser((b) => factsOn(b, url));
  const r = out.find((x) => x.href === '#chart');
  assert.equal(r.fragment.targetExists, true);
  assert.equal(r.fragment.targetName, 'Visitor numbers by season');
  assert.equal('firstHeadingText' in r.fragment, false, 'no heading exists to report');
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// §2 — per-link href facts: terminal segment + extension, never fabricated
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

test('§2 a file href reports its terminal segment and extension', { skip: !chromeOK }, async () => {
  const r = (await recs()).find((x) => x.href === 'docs/annual-report.pdf' && x.xpath.includes('/nav'));
  assert.equal(r.terminalSegment, 'annual-report.pdf');
  assert.equal(r.extension, 'pdf');
  assert.equal('fragment' in r, false, 'a path href is not a same-document fragment');
});

test('§2 an absolute page href reports its terminal segment too', { skip: !chromeOK }, async () => {
  const r = (await recs()).find((x) => x.href === 'https://example.org/about/team.html');
  assert.equal(r.terminalSegment, 'team.html');
  assert.equal(r.extension, 'html');
});

test('§2 a fragment-only href reports NO terminal segment (the href names no path of its own)', { skip: !chromeOK }, async () => {
  const r = (await recs()).find((x) => x.href === '#history' && x.xpath.includes('/nav'));
  assert.equal('terminalSegment' in r, false);
  assert.equal('extension' in r, false);
});

test('§2 a non-navigational scheme (mailto:) reports no terminal segment', { skip: !chromeOK }, async () => {
  const r = (await recs()).find((x) => x.href === 'mailto:hello@example.org');
  assert.ok(r, 'the link is still enumerated');
  assert.equal('terminalSegment' in r, false);
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// §3 — sameNameDifferentTarget, in BOTH directions
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

test('§3 two links sharing a trimmed name but resolving to DIFFERENT hrefs are both flagged', { skip: !chromeOK }, async () => {
  const details = (await recs()).filter((x) => x.xpath.includes('/p[1]/a'));
  assert.equal(details.length, 2, 'both same-named links produced records');
  for (const r of details) assert.equal(r.sameNameDifferentTarget, true, `${r.href} is flagged`);
});

test('§3 same name to the SAME destination is NOT flagged, and a unique name is NOT flagged', { skip: !chromeOK }, async () => {
  const all = await recs();
  const directory = all.filter((x) => x.xpath.includes('/p[2]/a'));
  assert.equal(directory.length, 2);
  for (const r of directory) assert.equal(r.sameNameDifferentTarget, false, 'two bearers, one destination — no flag');
  const unique = all.find((x) => x.href === 'mailto:hello@example.org');
  assert.equal(unique.sameNameDifferentTarget, false, 'a unique name is a stated false, not an omission');
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// §4 — area[href] is a link too (the image-map shape the element enumeration previously missed)
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

test('§4 an area[href] gets a record with the same fragment resolution, named by its alt', { skip: !chromeOK }, async () => {
  const r = (await recs()).find((x) => x.xpath.includes('/area['));
  assert.ok(r, 'the area produced a record');
  assert.equal(r.href, '#history');
  assert.equal(r.fragment.targetExists, true);
  assert.equal(r.fragment.targetHeadingText, 'A century of collecting');
  assert.equal(r.sameNameDifferentTarget, false, "the area's alt name ('History wing') is unique on the page");
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// §5 — the join. A collector that runs but is attached to nothing is the silent-lane failure mode.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

test('§5 act-page-collect attaches linkTargetFacts to the RIGHT element records', { skip: !chromeOK }, async () => {
  const collect = await withBrowser(async (browser) => {
    const page = await browser.newPage();
    try {
      await page.setViewport({ width: 1280, height: 800 });
      return await collectActPage(page, { url: LINKS, elementCap: 400, file: 'fx' });
    } finally { await page.close(); }
  });
  assert.ok((collect.collectorLiveness || []).every((f) => f.collector !== 'collectLinkTargetFacts'),
    `the collector did not throw in the page: ${JSON.stringify(collect.collectorLiveness)}`);
  const withFacts = (collect.elements || []).filter((e) => e && e.linkTargetFacts);
  assert.ok(withFacts.length >= 5, `the facts reached the element inventory (got ${withFacts.length})`);
  // the join is BY XPATH, so a mismatched key would attach another link's destination to this one
  const history = withFacts.find((e) => e.linkTargetFacts.href === '#history' && e.xpath.includes('/nav'));
  assert.ok(history, 'the fragment link carries its own record');
  assert.equal(history.tag, 'a');
  assert.equal(history.linkTargetFacts.fragment.targetHeadingText, 'A century of collecting');
  const pdf = withFacts.find((e) => e.linkTargetFacts.href === 'docs/annual-report.pdf' && e.xpath.includes('/nav'));
  assert.equal(pdf.linkTargetFacts.extension, 'pdf');
  // and a record whose element is not in the inventory is dropped, never synthesized
  for (const e of withFacts) assert.equal(typeof e.xpath, 'string');
});

test('§6 a content-bearing headingless target gets NO following-sibling heading (next section is not the destination)', { skip: !chromeOK, concurrency: false }, async () => {
  // Adversarial soundness finding #4: the sibling walk captured the NEXT section's heading for a target
  // that simply has none, and the prompt then called that unrelated heading AUTHORITATIVE — manufacturing
  // a 2.4.4 contradiction on a correct link. The walk is now empty-anchor-only, direct siblings, 2 hops.
  const url = writeFx('headingless.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Guide</title></head><body>
    <a href="#notes">Field notes</a>
    <div id="notes"><p>Observations collected during the spring survey.</p></div>
    <section><h2>Equipment checklist</h2><p>Unrelated next section.</p></section>
    <a href="#gap"></a>
    <a id="gap"></a>
    <h2>Crossing the gap</h2>
  </body></html>`);
  const recs = await withBrowser((b) => factsOn(b, url));
  const byHref = new Map(recs.map((r) => [r.href, r]));
  const headingless = byHref.get('#notes');
  assert.ok(headingless && headingless.fragment && headingless.fragment.targetExists, 'target resolves');
  assert.equal(headingless.fragment.firstHeadingText, undefined,
    'a content-bearing headingless destination reports NO heading — the next section\'s heading is not its name');
  // …while the empty-anchor idiom still resolves its immediately-following heading.
  const anchor = byHref.get('#gap');
  assert.equal(anchor.fragment.firstHeadingText, 'Crossing the gap', 'empty-anchor idiom still resolves');
});
