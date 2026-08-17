// TWO FACTS THAT WERE COMPUTABLE AND IN NO PROMPT.
//
// (A) 1.3.1 CONTROL-GROUP CORRESPONDENCE. Whether a set of controls governed by a visible group label is also
// grouped programmatically is a `fieldset`/`legend` or `role=group|radiogroup` + accessible-name lookup, and
// it reached no judge. Its absence produced errors in BOTH directions on one page shape: on a set that WAS
// grouped (a radiogroup naming its heading through aria-labelledby) the judge asserted the visible text was
// "NOT programmatically associated" with the controls — an assertion the DOM contradicts; on sets that were
// NOT grouped it declined to decide, reporting that it "could not confirm programmatic grouping" and "could
// not complete an accessibility-tree query", having made no tool call at all.
//
// The asymmetry is the design problem. Stating the association positively is free. Stating the ABSENCE is
// not: absence is only a barrier where a group relationship is OWED, and announcing it over every heading
// that happens to sit above a run of fields would manufacture barriers across correct forms. So the absence
// is only stated for a set whose members genuinely form ONE question — radios/checkboxes sharing a control
// name, or sibling controls of which NONE carries a label element, aria-label or aria-labelledby. §1 pins
// both the recovery and, in the same breath, the silence on separately-labelled fields.
//
// (B) 3.3.1 AT-REST ERROR STATE. On a server-rendered redisplay the error state is present AS LOADED and
// there is no client-side validation to trigger. The before/after driver the lane routes through is
// guaranteed to abstain AND destroys the evidence — the retained value clears. §2 pins the at-rest
// observation, including the SILENT shape, where the barrier is the absence of any indication and a gate
// keyed on "something is flagged" would be blind on exactly the pages that need it.
//
// Every fixture here is a generic page written for this test. None is derived from any evaluated page.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const puppeteer = require('puppeteer');

const { collectControlGroups, collectActPage } = require('../../lib/act-page-collect.js');
const { collectAtRestErrorState } = require('../../lib/collect-error-summary.js');
const { BROWSER_ARGS } = require('../../lib/browser-args.js');

const CHROME = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — control-group / at-rest browser tests SKIPPED');

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'grouprest-fx-'));
const writeFx = (name, html) => { fs.writeFileSync(path.join(DIR, name), html); return 'file://' + path.join(DIR, name); };

// One page carrying all three group shapes at once, so the collector has to tell them apart rather than
// classify the page: a radio set with NO grouping, the same set shape correctly grouped by fieldset/legend,
// and a set grouped by role=radiogroup + aria-labelledby (the shape that was reported as unassociated).
const GROUPS = writeFx('groups.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Groups</title></head><body>
  <main>
    <h1>Membership options</h1>
    <form action="#" method="post">
      <p class="q">Do you want the printed newsletter?</p>
      <p class="help">It arrives four times a year.</p>
      <div><input type="radio" id="n1" name="news" value="y"><label for="n1">Yes</label></div>
      <div><input type="radio" id="n2" name="news" value="n"><label for="n2">No</label></div>

      <fieldset>
        <legend>How often should we contact you?</legend>
        <div><input type="radio" id="c1" name="freq" value="m"><label for="c1">Monthly</label></div>
        <div><input type="radio" id="c2" name="freq" value="y"><label for="c2">Yearly</label></div>
      </fieldset>

      <p id="tier-label">Choose a membership tier</p>
      <div role="radiogroup" aria-labelledby="tier-label">
        <div><input type="radio" id="t1" name="tier" value="a"><label for="t1">Standard</label></div>
        <div><input type="radio" id="t2" name="tier" value="b"><label for="t2">Supporter</label></div>
      </div>
    </form>
  </main>
</body></html>`);

// The split-one-question-into-parts shape (no label element on any member) beside an ordinary section of
// separately labelled fields. Only the first may ever be reported.
const SPLIT = writeFx('split.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Split</title></head><body>
  <form action="#" method="post">
    <h2>Contact details</h2>
    <div><label for="e">Email address</label><input id="e" type="email"></div>
    <div><label for="p">Phone number</label><input id="p" type="tel"></div>

    <div class="field">
      <div class="group-q">Date of birth</div>
      <div class="dob">
        <input type="text" title="Day" placeholder="DD" maxlength="2">
        <input type="text" title="Month" placeholder="MM" maxlength="2">
        <input type="text" title="Year" placeholder="YYYY" maxlength="4">
      </div>
    </div>
  </form>
</body></html>`);

// A correct form: every field separately labelled under a heading. Nothing here forms one question, so the
// collector must say nothing at all — this is the "does not manufacture barriers" test.
const PLAIN = writeFx('plain.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Plain</title></head><body>
  <form action="#"><h2>Delivery address</h2>
    <div><label for="s">Street</label><input id="s"></div>
    <div><label for="t">Town</label><input id="t"></div>
    <div><label for="pc">Postcode</label><input id="pc"></div>
  </form></body></html>`);

// A server redisplay with its error rendered: the value came back, the control is marked, the message is
// associated. No script, novalidate — nothing to trigger.
const FLAGGED = writeFx('flagged.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Redisplay</title><style>
  input { border:1px solid #999; padding:6px; } input.bad { border:2px solid #c0392b; }
</style></head><body>
  <form action="/x" method="post" novalidate>
    <div><label for="a">Full name</label><input id="a" value="Sam Okafor"></div>
    <div><label for="b">Reference</label><input id="b" class="bad" aria-invalid="true" aria-describedby="b-err" value="XX-1">
      <p id="b-err">That reference is invalid. Use six characters.</p></div>
    <div><label for="c">Town</label><input id="c" value="Harborne"></div>
    <button type="submit">Send</button>
  </form></body></html>`);

// The SILENT redisplay: values came back, and nothing anywhere marks or mentions an error.
const SILENT = writeFx('silent.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Silent</title><style>
  input { border:1px solid #999; padding:6px; }
</style></head><body>
  <main><h1>Request logged</h1><p>Here are the details we have.</p>
  <form action="/x" method="post" novalidate>
    <div><label for="a">Applicant</label><input id="a" value="Sam Okafor"></div>
    <div><label for="b">Event date</label><input id="b" value="2019-03-02"></div>
    <button type="submit">Send</button>
  </form></main></body></html>`);

// The colour/icon-only shape: one field is marked by a border and an icon and by nothing else.
const COLOUR_ONLY = writeFx('colouronly.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Colour</title><style>
  input { border:1px solid #b9c2c8; padding:6px; } input.mark { border:2px solid #d8232a; }
</style></head><body>
  <form action="/x" method="post" novalidate>
    <div><label for="a">Given name</label><input id="a" value="Sam"></div>
    <div><label for="b">Date of birth</label><input id="b" class="mark" value="31/02/1991"><img alt="" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw=="></div>
    <div><label for="c">Town</label><input id="c" value="Harborne"></div>
    <button type="submit">Send</button>
  </form></body></html>`);

// A pristine, empty form — neither gate may open.
const PRISTINE = writeFx('pristine.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Empty</title></head><body>
  <form action="/x"><div><label for="a">Name</label><input id="a"></div>
  <div><label for="b">Town</label><input id="b"></div><button type="submit">Send</button></form></body></html>`);

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

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// §1 — 1.3.1 control-group correspondence
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

test('§1 collectControlGroups RESOLVES in-page (self-contained under page.evaluate)', { skip: !chromeOK }, async () => {
  const g = await withBrowser((b) => evalOn(b, GROUPS, collectControlGroups));
  assert.ok(Array.isArray(g) && g.length === 3, `all three radio sets were found (got ${g && g.length})`);
});

test('§1 a set that IS grouped reports the association POSITIVELY — including via role=radiogroup + aria-labelledby', { skip: !chromeOK }, async () => {
  const g = await withBrowser((b) => evalOn(b, GROUPS, collectControlGroups));
  const fs_ = g.find((x) => x.programmaticGroup && /fieldset/.test(x.programmaticGroup.mechanism));
  assert.ok(fs_, 'the fieldset/legend set is found');
  assert.equal(fs_.correspondence, 'group-named-by-visible-text');
  assert.equal(fs_.programmaticGroup.accessibleName, 'How often should we contact you?');
  assert.equal(fs_.programmaticGroup.nameRenderedOnScreen, true);

  // The inverted hallucination: this is the shape that was reported as NOT programmatically associated.
  const rg = g.find((x) => x.programmaticGroup && /radiogroup/.test(x.programmaticGroup.mechanism));
  assert.ok(rg, 'the radiogroup set is found');
  assert.equal(rg.correspondence, 'group-named-by-visible-text');
  assert.equal(rg.programmaticGroup.accessibleName, 'Choose a membership tier');
  assert.match(rg.uncertainReason, /do NOT report this text as "not programmatically associated"/i);
  assert.equal('precedingVisibleText' in rg, false,
    'and no second candidate label is offered — guessing one where a group already names itself invents a disagreement');
});

test('§1 an UNGROUPED set states the absence positively, offers the preceding text as CANDIDATES, and hands the judgment back', { skip: !chromeOK }, async () => {
  const g = await withBrowser((b) => evalOn(b, GROUPS, collectControlGroups));
  const none = g.find((x) => x.correspondence === 'no-programmatic-group');
  assert.ok(none, 'the ungrouped radio set is reported');
  assert.equal(none.kind, 'shared-control-name');
  assert.equal(none.memberCount, 2);
  assert.equal(none.programmaticGroup, null);

  // the excuse-remover
  assert.match(none.uncertainReason, /has been CHECKED in the DOM/);
  assert.match(none.uncertainReason, /do not ask for an accessibility-tree query/i);
  // the barrier-inventing guard, in the same string
  assert.match(none.uncertainReason, /is NOT one when each control's own accessible name already suffices/);

  // the candidate list is a LIST in reading order, not a pick — an early version chose the trailing help
  // sentence over the question above it.
  const texts = none.precedingVisibleText.map((t) => t.text);
  assert.ok(texts.includes('Do you want the printed newsletter?'), `the question is offered: ${JSON.stringify(texts)}`);
  assert.ok(texts.indexOf('Do you want the printed newsletter?') < texts.indexOf('It arrives four times a year.'),
    'and reading order is preserved, so the question precedes its help text');
});

test('§1 the split-question shape is caught, and a correctly labelled section beside it is NOT', { skip: !chromeOK }, async () => {
  const g = await withBrowser((b) => evalOn(b, SPLIT, collectControlGroups));
  assert.equal(g.length, 1, `only the unlabelled set is reported (got ${JSON.stringify(g.map((x) => x.kind))})`);
  const s = g[0];
  assert.equal(s.kind, 'unlabelled-sibling-controls');
  assert.equal(s.memberCount, 3);
  assert.equal(s.membersWithOwnName, 0, 'no member carries a label element, aria-label or aria-labelledby');
  assert.equal(s.membersNamedOnlyByTitleOrPlaceholder, 3, 'title/placeholder are reported as ABSENT names');
  assert.ok(s.precedingVisibleText.some((t) => t.text === 'Date of birth'), 'the question is among the candidates');
});

test('§1 a form of separately labelled fields under a heading produces NOTHING (no manufactured barrier)', { skip: !chromeOK }, async () => {
  const g = await withBrowser((b) => evalOn(b, PLAIN, collectControlGroups));
  assert.deepEqual(g, [], 'a correct form costs its prompts nothing and is never described as ungrouped');
});

test('§1 act-page-collect attaches the set to EVERY member, and to structure', { skip: !chromeOK }, async () => {
  const collect = await withBrowser(async (browser) => {
    const page = await browser.newPage();
    try {
      await page.setViewport({ width: 1280, height: 800 });
      return await collectActPage(page, { url: GROUPS, elementCap: 400, file: 'fx' });
    } finally { await page.close(); }
  });
  assert.ok((collect.collectorLiveness || []).every((f) => f.collector !== 'collectControlGroups'),
    `the collector did not throw in the page: ${JSON.stringify(collect.collectorLiveness)}`);
  assert.equal((collect.structure.controlGroups || []).length, 3, 'the page-level 1.3.1 view has all three sets');
  const members = (collect.elements || []).filter((e) => e && e.controlGroup);
  assert.equal(members.length, 6, `every radio carries its set (got ${members.length})`);
  for (const m of members) {
    assert.equal(typeof m.controlGroup.correspondence, 'string');
    assert.equal(m.controlGroup.thisMember, m.xpath, 'each member knows which of the set it is');
  }
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// §2 — 3.3.1 at-rest error state
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

test('§2 collectAtRestErrorState RESOLVES in-page and describes a flagged redisplay', { skip: !chromeOK }, async () => {
  const r = await withBrowser((b) => evalOn(b, FLAGGED, collectAtRestErrorState));
  assert.equal(r.length, 3, `every field of the form is described (got ${r.length})`);
  const bad = r.find((x) => x.label === 'Reference');
  assert.equal(bad.flaggedAtRest, true);
  assert.ok(bad.indicators.includes('aria-invalid=true'));
  assert.equal(bad.retainedValue, 'XX-1', 'the rejected value is still in the box, and is stated');
  assert.match(String(bad.associatedErrorText), /reference is invalid/i);
  assert.equal(bad.appearanceDiffersFromPeers, true, 'and its border differs from the form\'s baseline');

  // ...and the unflagged neighbour is stated to be unflagged — the counter-fact that stops a neighbouring
  // red edge in a rectangular crop being attributed to it.
  const ok = r.find((x) => x.label === 'Town');
  assert.equal(ok.flaggedAtRest, false);
  assert.deepEqual(ok.indicators, []);
  assert.equal(ok.appearanceDiffersFromPeers, false);
});

test('§2 the driver-cannot-help facts are stated, and the note says a cleared field is the probe erasing evidence', { skip: !chromeOK }, async () => {
  const r = await withBrowser((b) => evalOn(b, FLAGGED, collectAtRestErrorState));
  const one = r[0];
  assert.equal(one.pageScriptCount, 0, 'no script — client-side validation cannot exist here');
  assert.equal(one.formNoValidate, true);
  assert.match(one.uncertainReason, /it DESTROYS it/);
  assert.match(one.uncertainReason, /driver transcript showing the field emptying, has established\s+NOTHING/);
  assert.match(one.uncertainReason, /facts, not a verdict/);
});

test('§2 the SILENT redisplay is described even though nothing is flagged', { skip: !chromeOK }, async () => {
  // The gate that matters. Keyed on "something is flagged", this page — the one the judgment most needs —
  // would produce nothing at all.
  const r = await withBrowser((b) => evalOn(b, SILENT, collectAtRestErrorState));
  assert.equal(r.length, 2, 'the form is described');
  assert.ok(r.every((x) => x.flaggedAtRest === false), 'and honestly reports that nothing is flagged');
  assert.equal(r[0].prefilledFieldCount, 2, 'the values it came back carrying are counted');
  assert.equal(r[0].pageErrorTextPresent, false, 'and there is no error announcement anywhere on the page');
  assert.match(r[0].uncertainReason, /not on its own evidence that anything was rejected/,
    'the note refuses to turn a pre-filled form into an error by itself');
});

test('§2 a colour-and-icon-only marker is detected by COMPARISON with the other fields', { skip: !chromeOK }, async () => {
  const r = await withBrowser((b) => evalOn(b, COLOUR_ONLY, collectAtRestErrorState));
  const marked = r.find((x) => x.label === 'Date of birth');
  assert.equal(marked.flaggedAtRest, true, 'a border delta alone is a visual flag');
  assert.ok(marked.indicators.some((i) => /border\/background differs/.test(i)));
  assert.ok(marked.indicators.some((i) => /image\/icon sits with this field/.test(i)));
  assert.equal(marked.blockIconAlt, '', 'the icon\'s empty alt is preserved — it is the whole 3.3.1 question here');
  assert.equal(marked.associatedErrorText, null, 'and there is no error text at all');
  for (const other of r.filter((x) => x.label !== 'Date of birth')) {
    assert.equal(other.flaggedAtRest, false, `${other.label} is NOT reported as marked`);
  }
});

test('§2 a pristine empty form produces NOTHING', { skip: !chromeOK }, async () => {
  const r = await withBrowser((b) => evalOn(b, PRISTINE, collectAtRestErrorState));
  assert.deepEqual(r, [], 'a form that loads empty and clean costs its prompts nothing');
});

test('§2 act-page-collect attaches the record to the RIGHT field', { skip: !chromeOK }, async () => {
  const collect = await withBrowser(async (browser) => {
    const page = await browser.newPage();
    try {
      await page.setViewport({ width: 1280, height: 800 });
      return await collectActPage(page, { url: FLAGGED, elementCap: 400, file: 'fx' });
    } finally { await page.close(); }
  });
  assert.ok((collect.collectorLiveness || []).every((f) => f.collector !== 'collectAtRestErrorState'),
    `the collector did not throw in the page: ${JSON.stringify(collect.collectorLiveness)}`);
  const withKey = (collect.elements || []).filter((e) => e && e.atRestErrorState);
  assert.equal(withKey.length, 3);
  const bad = withKey.find((e) => e.atRestErrorState.label === 'Reference');
  assert.ok(bad.xpath.endsWith('input[1]'), 'landed on a real element with a real xpath');
  assert.equal(bad.atRestErrorState.flaggedAtRest, true);
  assert.equal('xpath' in bad.atRestErrorState, false, 'the record does not duplicate the xpath the element carries');
});
