// FOUR EXACT 1.3.1 PAGE-LEVEL FACTS + THE PAGE-WIDE CONTROL-GROUP SUMMARY + PER-CASE VISUAL-STRUCTURE.
//
// (residual RCA S10/S11) The page-level info-relationships subject kept answering four decidable questions
// with UNCERTAIN-plus-an-excuse because the deciding fact was computable and in no prompt:
//   · a <blockquote> declaring a quotation with no source anywhere the DOM can see;
//   · a <dl> whose dt/dd ordering can bind the wrong term to the wrong description;
//   · radios sharing a control name with no programmatic grouping ("could not confirm ... grouping");
//   · a form whose required state is nowhere programmatic ("required state unconfirmed from available signals").
// collectStructuralMarkupFacts states each as a CHECKED result. §5 pins the page-wide controlGroupsSummary
// (the s11 finding: collectControlGroups' facts reached only ELEMENT subjects, never the PAGE-LEVEL subject
// where the group question is judged) including the splitFieldGroup routing to 1.3.1. §6 pins the per-case
// visual-structure wiring (the broad-scope probe that previously ran under no per-case harness).
//
// Every fixture here is a generic page invented for this test. None is derived from any evaluated page.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const puppeteer = require('puppeteer');

const { collectStructuralMarkupFacts, collectActPage } = require('../../lib/act-page-collect.js');
const { BROWSER_ARGS } = require('../../lib/browser-args.js');

const CHROME = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — structural-markup-facts browser tests SKIPPED');

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'structfacts-fx-'));
const writeFx = (name, html) => { const p = path.join(DIR, name); fs.writeFileSync(p, html); return 'file://' + p; };

async function withBrowser(fn) {
  const browser = await puppeteer.launch({ headless: 'new', executablePath: CHROME, args: BROWSER_ARGS });
  try { return await fn(browser); } finally { await browser.close(); }
}
const evalOn = async (browser, url, fn) => {
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 1280, height: 800 });
    await page.goto(url, { waitUntil: 'load' });
    return await page.evaluate(fn);
  } finally { await page.close(); }
};
const collectOn = async (url, extraOpts = {}) => withBrowser(async (b) => {
  const page = await b.newPage();
  try {
    await page.setViewport({ width: 1280, height: 800 });
    return await collectActPage(page, { url, elementCap: 400, file: 'fx', autoUpdateWindowMs: 0, ...extraOpts });
  } finally { await page.close(); }
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// §1 — blockquotesWithoutSource
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

// One page, one anomalous quote among four correctly-sourced shapes: cite= attribute, <cite> descendant,
// figure/figcaption, and an adjacent dash-led attribution line. Only the first block may be reported.
const BQ = writeFx('bq.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Quotes</title></head><body>
  <main>
    <blockquote><p>Our roasting method keeps every batch under nine minutes.</p></blockquote>
    <blockquote cite="https://example.org/review"><p>A remarkably steady pour.</p></blockquote>
    <blockquote><p>The queue moved quickly.</p><footer><cite>Weekend visitor survey</cite></footer></blockquote>
    <figure><blockquote><p>Every seat has a view of the kilns.</p></blockquote><figcaption>Tour brochure</figcaption></figure>
    <blockquote><p>Booking twice saved us an hour.</p></blockquote>
    <p>— A returning customer</p>
  </main>
</body></html>`);

test('§1 an unsourced blockquote is reported; every sourced shape is not', { skip: !chromeOK }, async () => {
  const out = await withBrowser((b) => evalOn(b, BQ, collectStructuralMarkupFacts));
  assert.equal(out.blockquotesWithoutSource.length, 1, `exactly the unsourced quote (got ${JSON.stringify(out.blockquotesWithoutSource)})`);
  assert.match(out.blockquotesWithoutSource[0].textSample, /roasting method/);
  assert.match(out.blockquotesWithoutSource[0].xpath, /blockquote/);
});

test('§1 a hidden blockquote is never reported (visibility gate)', { skip: !chromeOK }, async () => {
  const HID = writeFx('bq-hidden.html', `<!DOCTYPE html><html lang="en"><head><title>H</title></head><body>
    <blockquote style="display:none"><p>Draft copy not shown to anyone.</p></blockquote></body></html>`);
  const out = await withBrowser((b) => evalOn(b, HID, collectStructuralMarkupFacts));
  assert.equal(out.blockquotesWithoutSource.length, 0);
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// §2 — dlOrderAnomalies
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const DL = writeFx('dl.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Lists</title></head><body>
  <h1>Workshop schedule</h1>
  <dl id="ok"><dt>Morning</dt><dd>Wheel throwing</dd><dt>Afternoon</dt><dd>Glazing</dd></dl>
  <dl id="inv"><dd>Wheel throwing</dd><dt>Morning</dt><dd>Glazing</dd><dt>Afternoon</dt></dl>
  <dl id="wrapped"><div><dt>Kiln A</dt><dd>Stoneware</dd></div><div><dd>Porcelain</dd><dt>Kiln B</dt></div></dl>
  <dl id="lonely"><dt>Deposit</dt><dd>Refundable</dd><dt>Balance</dt></dl>
</body></html>`);

test('§2 inverted, wrapped-inverted and asymmetric dls are reported with the exact booleans; a proper dl is not', { skip: !chromeOK }, async () => {
  const out = await withBrowser((b) => evalOn(b, DL, collectStructuralMarkupFacts));
  const by = (frag) => out.dlOrderAnomalies.find((d) => d.xpath.includes(frag));
  assert.equal(out.dlOrderAnomalies.length, 3, `three anomalous dls (got ${JSON.stringify(out.dlOrderAnomalies)})`);
  // dl[1] is #ok — absent. dl[2] = #inv: leads with a description and ends on a term.
  const inv = out.dlOrderAnomalies.find((d) => d.leadingDd === true);
  assert.ok(inv, 'the description-first dl is reported');
  assert.equal(inv.trailingDt, true);
  assert.equal(inv.countMismatch, false);
  // #wrapped: a spec-legal <div> wrapper whose description precedes its term.
  const wrapped = out.dlOrderAnomalies.find((d) => d.invertedDivGroups > 0);
  assert.ok(wrapped, 'the wrapper-inverted dl is reported');
  assert.equal(wrapped.invertedDivGroups, 1);
  // #lonely: a trailing term with no description + asymmetric counts.
  const lonely = out.dlOrderAnomalies.find((d) => d.countMismatch === true);
  assert.ok(lonely, 'the asymmetric dl is reported');
  assert.equal(lonely.dtCount, 2);
  assert.equal(lonely.ddCount, 1);
  assert.equal(lonely.trailingDt, true);
  assert.ok(!by('dl[1]'), 'the well-ordered dl is NOT reported');
});

test('§2 several descriptions per term is reported as a COUNT fact only, never an ordering defect', { skip: !chromeOK }, async () => {
  const MULTI = writeFx('dl-multi.html', `<!DOCTYPE html><html lang="en"><head><title>M</title></head><body>
    <dl><dt>Firing</dt><dd>Bisque at 1000 degrees</dd><dd>Glaze at 1240 degrees</dd></dl></body></html>`);
  const out = await withBrowser((b) => evalOn(b, MULTI, collectStructuralMarkupFacts));
  assert.equal(out.dlOrderAnomalies.length, 1);
  const d = out.dlOrderAnomalies[0];
  assert.equal(d.countMismatch, true, 'asymmetry is stated (a fact for the judge — multi-dd groups are legal)');
  assert.equal(d.leadingDd, false);
  assert.equal(d.trailingDt, false);
  assert.equal(d.invertedDivGroups, 0);
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// §3 — radioGroupsWithoutGrouping
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const RADIOS = writeFx('radios.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Survey</title><style>
  .q { font-weight: 700; font-size: 18px; }
</style></head><body>
  <form action="#">
    <p class="q">How did you first hear about the studio?</p>
    <div class="opts">
      <label><input type="radio" name="src" value="friend"> A friend</label>
      <label><input type="radio" name="src" value="market"> The market stall</label>
      <label><input type="radio" name="src" value="online"> Online</label>
    </div>

    <fieldset><legend>Preferred session length</legend>
      <label><input type="radio" name="len" value="1"> One hour</label>
      <label><input type="radio" name="len" value="2"> Two hours</label>
    </fieldset>

    <p id="lvl-q">Experience level</p>
    <div role="radiogroup" aria-labelledby="lvl-q">
      <label><input type="radio" name="lvl" value="new"> First visit</label>
      <label><input type="radio" name="lvl" value="ret"> Returning</label>
    </div>

    <div role="group" aria-label="Wheel preference">
      <label><input type="radio" name="wheel" value="kick"> Kick wheel</label>
      <label><input type="radio" name="wheel" value="el"> Electric wheel</label>
    </div>

    <label><input type="radio" name="single" value="only"> Lone option</label>
  </form>
</body></html>`);

test('§3 the ungrouped shared-name set is reported with its preceding styled text; every grouped shape and the singleton are not', { skip: !chromeOK }, async () => {
  const out = await withBrowser((b) => evalOn(b, RADIOS, collectStructuralMarkupFacts));
  assert.equal(out.radioGroupsWithoutGrouping.length, 1, `only the ungrouped set (got ${JSON.stringify(out.radioGroupsWithoutGrouping)})`);
  const g = out.radioGroupsWithoutGrouping[0];
  assert.equal(g.controlName, 'src');
  assert.equal(g.memberCount, 3);
  assert.equal(g.memberXpaths.length, 3);
  assert.ok(g.precedingText, 'the visible text block immediately before the set is captured');
  assert.match(g.precedingText.text, /hear about the studio/);
  assert.equal(g.precedingText.fontWeight, '700', 'label-like styling is a stated fact');
});

// Batch-2 soundness review: a fieldset carries an IMPLICIT group role, so a fieldset named via aria-label
// or aria-labelledby is a CONFORMANT grouping — reporting it as ungrouped contradicted collectControlGroups'
// richer record inside the same prompt, and the adjudicator note forbids the judge from re-verifying.
// Both aria-named polarities, plus the dangling-reference negative (an unresolvable name names nothing).
// Fixture invented for this test; none of its strings appears in any evaluated page.
test('§3 an aria-named fieldset (aria-label OR resolving aria-labelledby) is grouped and NOT reported; a dangling reference still is', { skip: !chromeOK }, async () => {
  const ARIA = writeFx('radios-arianame.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Orders</title></head><body>
    <form action="#">
      <fieldset aria-label="Collection day">
        <label><input type="radio" name="day" value="wed"> Wednesday drop-off</label>
        <label><input type="radio" name="day" value="sat"> Saturday drop-off</label>
      </fieldset>
      <p id="glaze-q">Glaze finish</p>
      <fieldset aria-labelledby="glaze-q">
        <label><input type="radio" name="glaze" value="iron"> Iron wash</label>
        <label><input type="radio" name="glaze" value="ash"> Ash coat</label>
      </fieldset>
      <p>Pickup point</p>
      <fieldset aria-labelledby="no-such-node">
        <label><input type="radio" name="pickup" value="kiln"> Kiln room</label>
        <label><input type="radio" name="pickup" value="counter"> Studio counter</label>
      </fieldset>
    </form>
  </body></html>`);
  const out = await withBrowser((b) => evalOn(b, ARIA, collectStructuralMarkupFacts));
  assert.equal(out.radioGroupsWithoutGrouping.length, 1,
    `only the fieldset whose aria-labelledby resolves to nothing is reported (got ${JSON.stringify(out.radioGroupsWithoutGrouping)})`);
  const g = out.radioGroupsWithoutGrouping[0];
  assert.equal(g.controlName, 'pickup', 'the aria-label and resolving aria-labelledby fieldsets are grouped shapes');
  assert.match(g.precedingText.text, /Pickup point/, 'the visible question before the unnamed set still rides along');
});

test('§3 radios split across two forms never merge into one set', { skip: !chromeOK }, async () => {
  const TWO = writeFx('radios-two.html', `<!DOCTYPE html><html lang="en"><head><title>T</title></head><body>
    <form action="#"><label><input type="radio" name="a" value="1"> Yes</label></form>
    <form action="#"><label><input type="radio" name="a" value="2"> No</label></form></body></html>`);
  const out = await withBrowser((b) => evalOn(b, TWO, collectStructuralMarkupFacts));
  assert.equal(out.radioGroupsWithoutGrouping.length, 0, 'one radio per form ⇒ no 2+ member set anywhere');
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// §4 — requiredStateInventory
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const REQ = writeFx('req.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Booking</title><style>
  label.must::after { content: " *"; color: #b00; }
</style></head><body>
  <form id="stated" action="#">
    <p>Fields marked required must be completed.</p>
    <div><label for="n">Name (required)</label><input id="n" required></div>
    <div><label for="e">Email *</label><input id="e" aria-required="true"></div>
    <div><label for="t" class="must">Town</label><input id="t"></div>
    <div><label for="o">Notes</label><textarea id="o"></textarea></div>
  </form>
  <form id="silent" action="#">
    <div><label for="x">Voucher code</label><input id="x"></div>
    <div><label for="y">Referrer</label><input id="y"></div>
  </form>
</body></html>`);

test('§4 per-form counts: attributes, word tokens and asterisk markers — and MEASURED zeros on the silent form', { skip: !chromeOK }, async () => {
  const out = await withBrowser((b) => evalOn(b, REQ, collectStructuralMarkupFacts));
  assert.equal(out.requiredStateInventory.length, 2, 'one record per form');
  const [stated, silent] = out.requiredStateInventory;
  assert.equal(stated.fieldCount, 4);
  assert.equal(stated.requiredAttrCount, 1);
  assert.equal(stated.ariaRequiredCount, 1);
  assert.ok(stated.requiredTextTokens >= 2, `the word token is counted (got ${stated.requiredTextTokens})`);
  assert.equal(stated.asteriskMarkers, 2, 'the literal * and the CSS-generated ::after * are both counted');
  // the decisive zero: nothing on this form is programmatically or visibly required.
  assert.equal(silent.fieldCount, 2);
  assert.equal(silent.requiredAttrCount, 0);
  assert.equal(silent.ariaRequiredCount, 0);
  assert.equal(silent.requiredTextTokens, 0);
  assert.equal(silent.asteriskMarkers, 0);
});

test('§4 out-of-form fields get one document-scope record; a page whose fields all sit in forms gets none', { skip: !chromeOK }, async () => {
  const LOOSE = writeFx('req-loose.html', `<!DOCTYPE html><html lang="en"><head><title>L</title></head><body>
    <label for="q">Search</label><input id="q" aria-required="true"></body></html>`);
  const out1 = await withBrowser((b) => evalOn(b, LOOSE, collectStructuralMarkupFacts));
  assert.equal(out1.requiredStateInventory.length, 1);
  assert.equal(out1.requiredStateInventory[0].formXpath, 'document');
  assert.equal(out1.requiredStateInventory[0].ariaRequiredCount, 1);
  const out2 = await withBrowser((b) => evalOn(b, REQ, collectStructuralMarkupFacts));
  assert.ok(out2.requiredStateInventory.every((r) => r.formXpath !== 'document'));
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// §5 — the page-wide controlGroupsSummary + splitFieldGroup routed to 1.3.1
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const SUMMARY = writeFx('summary.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Membership</title></head><body>
  <form action="#">
    <p class="q">Post the newsletter?</p>
    <div><input type="radio" id="n1" name="news" value="y"><label for="n1">Yes</label></div>
    <div><input type="radio" id="n2" name="news" value="n"><label for="n2">No</label></div>

    <fieldset><legend>Contact frequency</legend>
      <div><input type="radio" id="c1" name="freq" value="m"><label for="c1">Monthly</label></div>
      <div><input type="radio" id="c2" name="freq" value="y"><label for="c2">Yearly</label></div>
    </fieldset>

    <div class="field"><div class="group-q">Membership start date</div>
      <div>
        <input type="text" title="Day" maxlength="2">
        <input type="text" title="Month" maxlength="2">
        <input type="text" title="Year" maxlength="4">
      </div></div>
  </form>
</body></html>`);

test('§5 collectActPage builds structure.controlGroupsSummary: per group the visible label-like text and whether a programmatic name exists, plus splitFieldGroupXpaths', { skip: !chromeOK }, async () => {
  const collect = await collectOn(SUMMARY);
  const cs = collect.structure.controlGroupsSummary;
  assert.ok(cs, 'the summary exists on a page with qualifying sets');
  assert.ok(Array.isArray(cs.groups) && cs.groups.length >= 3, `radio sets + the split-field sibling set (got ${cs.groups && cs.groups.length})`);
  const ungrouped = cs.groups.find((g) => g.correspondence === 'no-programmatic-group' && g.kind === 'shared-control-name');
  assert.ok(ungrouped, 'the ungrouped radio set is summarized');
  assert.equal(ungrouped.hasProgrammaticGroupName, false);
  assert.ok(ungrouped.visibleLabelCandidates.length >= 1, 'the preceding visible text rides as label candidates');
  assert.ok(ungrouped.visibleLabelCandidates.some((c) => /newsletter/i.test(c.text)));
  const grouped = cs.groups.find((g) => g.hasProgrammaticGroupName === true);
  assert.ok(grouped, 'the fieldset/legend set is summarized');
  assert.equal(grouped.programmaticGroup.accessibleName, 'Contact frequency');
  assert.equal(grouped.visibleLabelCandidates.length, 0, 'no second label is guessed where the group names itself');
  // splitFieldGroup (the 4.1.2 fact) is routed to the 1.3.1 page-level view.
  assert.ok(cs.splitFieldGroupXpaths.length >= 3, `the day/month/year parts are listed (got ${JSON.stringify(cs.splitFieldGroupXpaths)})`);
  const splitGroup = cs.groups.find((g) => g.membersAreSplitFieldParts === true);
  assert.ok(splitGroup, 'the sibling-set record is marked as split-field parts');
});

test('§5 a page with no qualifying set and no split field carries NO summary at all', { skip: !chromeOK }, async () => {
  const PLAIN = writeFx('summary-plain.html', `<!DOCTYPE html><html lang="en"><head><title>P</title></head><body>
    <form action="#"><div><label for="s">Street</label><input id="s"></div>
    <div><label for="t">Town</label><input id="t"></div></form></body></html>`);
  const collect = await collectOn(PLAIN);
  assert.equal(collect.structure.controlGroupsSummary, undefined, 'undefined ⇒ dropped by JSON — untouched pages serialize as before');
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// §6 — per-case visual-structure discovery (styled non-semantic headings)
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const STYLED = writeFx('styled-heading.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Savings</title><style>
  .banner { font-size: 26px; font-weight: 700; margin: 12px 0; }
  p { font-size: 16px; }
</style></head><body>
  <div class="banner">Double the match on every deposit</div>
  <p>Deposits made before the last banking day of the month are matched at twice the standard rate,
  up to the plan ceiling. The match posts on the first business day that follows.</p>
</body></html>`);

test('§6 a styled non-semantic heading lands in structure.visualHeadings as a deterministic anchor', { skip: !chromeOK }, async () => {
  const collect = await collectOn(STYLED);
  const vh = collect.structure.visualHeadings;
  assert.ok(Array.isArray(vh) && vh.length === 1, `the styled line is discovered (got ${JSON.stringify(vh)})`);
  assert.match(vh[0].text, /Double the match/);
  assert.equal(vh[0].tag, 'div');
  assert.ok(vh[0].fontSize >= 22);
  assert.ok((collect.collectorLiveness || []).every((f) => f.collector !== 'probeVisualStructureDiscovery'),
    `the probe resolved: ${JSON.stringify(collect.collectorLiveness)}`);
});

test('§6 a real <h2> and body prose produce NO visual-heading discovery', { skip: !chromeOK }, async () => {
  const SEMANTIC = writeFx('semantic-heading.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>S</title><style>
    h2 { font-size: 26px; }
  </style></head><body>
    <h2>Opening hours</h2>
    <p>The studio opens at nine and closes at six, every day except public holidays.</p>
  </body></html>`);
  const collect = await collectOn(SEMANTIC);
  assert.deepEqual(collect.structure.visualHeadings, [], 'a semantic heading is never re-discovered');
});

test('§6 opts.visualStructureProbe === false skips the pass entirely', { skip: !chromeOK }, async () => {
  const collect = await collectOn(STYLED, { visualStructureProbe: false });
  assert.deepEqual(collect.structure.visualHeadings, []);
});
