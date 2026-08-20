'use strict';
// FP round 4 (Gemini 3.7 annotated-suite run, 2026-08-18) — the two HARNESS-side clusters, two polarities each.
// Fixtures are INVENTED inline HTML — nothing corpus-derived.
//
//  3.3.1 form-error-probe (deterministic, cross-model-stable FPs):
//   A1  a surface that IS an <img alt> (aria-describedby → the icon) read as EMPTY text and was skipped by the
//       before/after diff ⇒ a correctly identified error scored errorNotIdentified. Its own alt now counts.
//   A2  a field the AUTHOR already declares to be in error at rest (aria-invalid="true" / error-class token
//       on the control) is a rendered error state — the probe's synthetic invalid-submit is a different error
//       condition than the one on screen, so it ABSTAINS (never barrier). Pristine fields, `:invalid`-only
//       retained values, and block-level classes stay probeable (ACT 36b590 failed shapes; silent redisplay).
//   A3  collectAtRestErrorState: an ID reference to an <img alt> resolves to the alt (accessible-description
//       reading), and OTHER visible text in a field's block that matched no lexicon/class is reported as
//       `blockOtherText` (fact, judge reads it) — only when both lexicon channels are empty.
//
//  1.4.13 hover-content-tri / LLM facet lane:
//   B1  facets the runner never measured (nothing appeared; not additional) are ABSENT, not `false` — the
//       orchestrator then propagates null and no reasoning feeds on a phantom "measured failure".
//   B2  the LLM facet gate closes on the POSITIVE redundancy fact (#30) the deterministic lane already
//       decided on; any other contentIsAdditional:false leaves the facets open (fail-open preserved).

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const puppeteer = require('puppeteer');
const { RUNNERS } = require('../../lib/exp-runners.js');
const { CHROME } = require('../../lib/run-experiments.js');
const { collectAtRestErrorState } = require('../../lib/collect-error-summary.js');
const { selectRubricSubjects, precomputeSignals } = require('../../lib/llm-adjudicator.js');
const { loadRubrics } = require('../../lib/rubric-loader.js');
const { BROWSER_ARGS } = require('../../lib/browser-args.js');

const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — fp-round4 browser tests SKIPPED');

async function withPage(html, fn) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', timeout: 60000, args: BROWSER_ARGS });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 900 });
    await page.setContent(html, { waitUntil: 'load' });
    return await fn(page);
  } finally { await browser.close(); }
}
let seq = 0;
// distinct candidateIds: the runner tags the target with `data-v3-target=<candidateId>` and re-finds it by that marker
const probe = (page, targetXpath) => RUNNERS['form-error-probe'](page, { candidateId: 'c-fe-' + (++seq), targetXpath });

// ── 3.3.1 A1/A2 ─────────────────────────────────────────────────────────────────────────────────────
// A static form (no script, novalidate) rendered in its error state: field 1 is declared invalid and its
// message is an <img alt> the field points at; field 2 is declared invalid by CLASS with a plain sibling
// message; field 3 is pristine + genuinely constrained (`required` and empty — the probe's own error
// condition applies); field 4 carries a retained `:invalid` value with NO declaration (silent-redisplay
// shape — stays probeable); field 5 is a BARE optional `type=number`, which carries no rule the probe can
// violate at all.
//
// Field 3 used to be that bare number and was asserted a BARRIER, which encoded the over-claim this suite
// now guards against: an empty optional number is a perfectly valid state, `el.value='abc'` sanitizes back
// to '', and reporting "the page failed to identify an error" where no error exists is a measured false
// positive. `required` restores what the pin was actually for — a pristine constrained field on a page that
// surfaces nothing — and field 5 pins the corrected semantics beside it, so neither reading is lost.
const RENDERED = `<!doctype html><html><body>
  <form action="#" novalidate>
    <div class="f"><label for="a">Contact address</label>
      <input id="a" type="email" value="someone-at-example.org" aria-invalid="true" aria-describedby="a-ico">
      <img id="a-ico" alt="The address must contain an at-sign, e.g. name@example.org" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" width="16" height="16"></div>
    <div class="f"><label for="b">Postcode</label>
      <input id="b" type="text" value="12" class="is-invalid" pattern="[0-9]{5}">
      <p class="note">Enter all five digits of the postcode.</p></div>
    <div class="f"><label for="c">Reference number</label>
      <input id="c" type="number" value="" required></div>
    <div class="f"><label for="d">Backup address</label>
      <input id="d" type="email" value="nobody-here"></div>
    <div class="f"><label for="e">Meter reading</label>
      <input id="e" type="number" value=""></div>
    <button type="submit">Send</button>
  </form></body></html>`;

test('A1/A2 declared-invalid-at-rest fields ABSTAIN (never barrier); an <img alt> surface counts as text', { skip: !chromeOK, concurrency: false }, async () => {
  const [ra, rb, rc, rd, re] = await withPage(RENDERED, async (page) => [
    await probe(page, '/html/body/form[1]/div[1]/input[1]'),
    await probe(page, '/html/body/form[1]/div[2]/input[1]'),
    await probe(page, '/html/body/form[1]/div[3]/input[1]'),
    await probe(page, '/html/body/form[1]/div[4]/input[1]'),
    await probe(page, '/html/body/form[1]/div[5]/input[1]'),
  ]);
  // A2 — aria-invalid="true": rendered error state ⇒ abstain, applicable, no barrier
  assert.equal(ra.outcome.errorNotIdentified, false, 'aria-invalid at rest ⇒ never errorNotIdentified');
  assert.equal(ra.valid, true, 'the field IS applicable (constrained) — this is an abstain, not an applicability failure');
  // A2 — error-class token on the CONTROL ⇒ same
  assert.equal(rb.outcome.errorNotIdentified, false, 'error-class token on the control at rest ⇒ never errorNotIdentified');
  // pristine + genuinely constrained (required, empty): the probe's own condition applies; nothing surfaces ⇒ barrier
  assert.equal(rc.outcome.errorNotIdentified, true, 'a pristine constrained field on a page that identifies nothing on submit is still the barrier');
  // `:invalid` retained value with NO declaration: NOT an at-rest declaration ⇒ still probed ⇒ barrier
  assert.equal(rd.outcome.errorNotIdentified, true, 'a retained invalid value with no author declaration is the silent-redisplay shape and stays probeable');
  // bare optional `type=number`: nothing the probe writes can make it invalid, so there is no automatically
  // detected error for 3.3.1 to attach to — abstain, never barrier (the measured false positive).
  assert.equal(re.measurement.conditionAbsent, true, 'an empty optional number stays valid however it is written to');
  assert.equal(re.outcome.errorNotIdentified, false, 'and a field with no error condition is not an unidentified error');
});

// A1 in isolation: a DYNAMICALLY surfaced <img alt> referenced by the field must be credited as identification.
const DYNAMIC_ICON = `<!doctype html><html><body>
  <form action="#" novalidate id="f">
    <label for="e">Alias</label>
    <input id="e" type="text" required aria-describedby="e-ico">
    <img id="e-ico" alt="Alias is required" hidden src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" width="16" height="16">
    <button type="submit">Go</button>
  </form>
  <script>
    document.getElementById('f').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var e = document.getElementById('e');
      if (!e.value) { e.setAttribute('aria-invalid', 'true'); document.getElementById('e-ico').hidden = false; }
    });
  </script></body></html>`;

test('A1 a referenced <img alt> that SURFACES on submit is identification (the surface node\'s own alt counts)', { skip: !chromeOK, concurrency: false }, async () => {
  const r = await withPage(DYNAMIC_ICON, (page) => probe(page, '/html/body/form[1]/input[1]'));
  assert.equal(r.outcome.errorNotIdentified, false, 'the icon alt surfaced (hidden→shown), is referenced by the field, and identifies the error');
  assert.equal(r.measurement.customIdentifies, true);
});

// ── 3.3.1 A3 collector facts ─────────────────────────────────────────────────────────────────────────
test('A3 collectAtRestErrorState: describedby→<img alt> resolves to the alt; plain block text is a fact', { skip: !chromeOK, concurrency: false }, async () => {
  const recs = await withPage(RENDERED, (page) => page.evaluate(collectAtRestErrorState));
  const a = recs.find((r) => /input\[1\]$/.test(r.xpath) && /div\[1\]/.test(r.xpath));
  const b = recs.find((r) => /div\[2\]/.test(r.xpath));
  assert.ok(a && b, 'both flagged fields are described');
  // the alt has no lexicon word, so it is NOT associatedErrorText — but the icon alt is reported verbatim
  assert.match(a.blockIconAlt || '', /at-sign/, 'the icon\'s text alternative is reported');
  // field b: message text matches no lexicon/class ⇒ surfaces as blockOtherText, not adjacentErrorText
  assert.equal(b.adjacentErrorText, null);
  assert.match(b.blockOtherText || '', /five digits/, 'plain text in the field\'s block is reported as a fact');
  assert.ok(b.blockOtherTextXpath, 'with its xpath');
  assert.doesNotMatch(b.blockOtherText || '', /Postcode/, 'the label is never reported as the message');
  assert.match(a.uncertainReason, /blockOtherText/, 'the reading rule names the new fact');
});

test('A3 an ID reference to an <img alt> that DOES carry a lexicon word becomes associatedErrorText', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html><body><form novalidate>
    <div><label for="q">Quantity</label><input id="q" type="number" value="0" aria-invalid="true" aria-describedby="q-ico">
    <img id="q-ico" alt="Invalid quantity: must be at least 1" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" width="16" height="16"></div>
    <div><label for="r">Notes</label><input id="r" type="text" value=""></div>
    <button>Go</button></form></body></html>`;
  const recs = await withPage(html, (page) => page.evaluate(collectAtRestErrorState));
  const q = recs.find((r) => /div\[1\]/.test(r.xpath));
  assert.match(q.associatedErrorText || '', /Invalid quantity/, 'aria-describedby → img alt is read as the description text');
  assert.equal(q.blockOtherText, undefined, 'blockOtherText is present only when both lexicon channels are empty');
});

// ── 1.4.13 B1: unmeasured facets are ABSENT ────────────────────────────────────────────────────────
const SWATCH_REDUNDANT = `<!doctype html><html><body style="margin:0">
  <div style="margin:40px;position:relative">
    <span class="wrap" style="display:inline-flex;flex-direction:column;align-items:center">
      <span class="swatch" tabindex="0" style="display:block;width:28px;height:28px;background:#4a6;position:relative"></span>
      <span id="bub" style="display:none;position:absolute;left:0;top:-28px;background:#123;color:#fff;padding:2px 8px">Moss</span>
      <span class="name" style="display:block;font:12px sans-serif">Moss</span>
    </span>
  </div>
  <style>.swatch:hover ~ #bub, .wrap:hover #bub{display:block!important}</style>
</body></html>`;

test('B1 a redundant (not-additional) reveal leaves dismissible/hoverable/persistent ABSENT — never measured-false', { skip: !chromeOK, concurrency: false }, async () => {
  const res = await withPage(SWATCH_REDUNDANT, (page) => RUNNERS['hover-content-tri'](page, { candidateId: 'c-tri', targetXpath: '/html/body/div[1]/span[1]/span[1]', persistenceSampleOffsetsMs: [150, 250] }));
  assert.equal(res.outcome.contentAppeared, true);
  assert.equal(res.outcome.contentIsAdditional, false, 'redundant with the visible label ⇒ not additional');
  for (const k of ['dismissible', 'hoverable', 'persistent']) assert.equal(Object.prototype.hasOwnProperty.call(res.outcome, k), false, `${k} was never measured ⇒ absent (was a phantom false)`);
  assert.equal(res.outcome.anyPropertyFails, false);
});

test('B1 a trigger that reveals NOTHING also reports no facet (absent, not false)', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html><body style="margin:0"><div style="margin:40px"><button id="b" tabindex="0" style="width:40px;height:40px">Go</button></div></body></html>`;
  const res = await withPage(html, (page) => RUNNERS['hover-content-tri'](page, { candidateId: 'c-tri', targetXpath: '/html/body/div[1]/button[1]', persistenceSampleOffsetsMs: [150, 250] }));
  assert.equal(res.outcome.contentAppeared, false);
  for (const k of ['dismissible', 'hoverable', 'persistent']) assert.equal(Object.prototype.hasOwnProperty.call(res.outcome, k), false, `${k} absent when nothing appeared`);
});

// ── 1.4.13 B2: the LLM facet gate honours the measured redundancy ──────────────────────────────────
const RUBRICS = loadRubrics().rubrics;
const HOVER_RUBRICS = ['hover-dismissable-v0', 'hover-hoverable-v0', 'hover-persistent-v0'].sort();
const TRIG = '/html/body/span[1]';
const hoverCollect = { elements: [{ xpath: TRIG, tag: 'span', hasHoverContent: true }] };
const hoverLedger = [{ xpath: TRIG, sc: '1.4.13', claimFamily: 'hover-content', autoPartial: true }];
const hoverSubjects = (facets) => selectRubricSubjects(hoverCollect, hoverLedger, RUBRICS, { hoverFacets: facets ? { [TRIG]: facets } : null });
const hoverIds = (facets) => hoverSubjects(facets).map((s) => s.rubricId).sort();
const base = { probeRan: true, contentAppeared: true, nativeTitleOnly: false, revealMode: 'hover', dwellMs: 1600, dismissible: null, hoverable: null, persistent: null };

test('B2 contentIsAdditional:false WITH the positive redundancy fact closes all three facets', () => {
  assert.deepEqual(hoverIds({ ...base, contentIsAdditional: false, redundantWithVisibleText: { redundant: true, matchedBy: 'local-rest-text', revealedText: 'moss', localTextSample: 'colour moss bark', accName: null } }), []);
});

test('B2 contentIsAdditional:false for ANY OTHER reason keeps every facet open (fail-open preserved)', () => {
  assert.deepEqual(hoverIds({ ...base, contentIsAdditional: false }), HOVER_RUBRICS, 'no redundancy fact ⇒ open');
  assert.deepEqual(hoverIds({ ...base, contentIsAdditional: false, redundantWithVisibleText: { redundant: false, matchedBy: null, revealedText: 'ships in 3 days', localTextSample: 'colour moss', accName: null } }), HOVER_RUBRICS, 'redundant:false ⇒ open');
  assert.deepEqual(hoverIds({ ...base, contentIsAdditional: true, redundantWithVisibleText: { redundant: true } }), HOVER_RUBRICS, 'a stray redundant:true with contentIsAdditional:true does not close anything (the runner never emits this; the gate needs BOTH)');
});

test('B2 null facets are documented to the judge as UNMEASURED; redundant:false is documented as additional', () => {
  const sub = hoverSubjects({ ...base, contentIsAdditional: true, redundantWithVisibleText: { redundant: false, matchedBy: null, revealedText: 'x', localTextSample: 'y', accName: null } })
    .find((s) => s.rubricId === 'hover-hoverable-v0');
  assert.ok(sub, 'the hoverable subject exists');
  const sig = precomputeSignals(sub.element, sub.skill, sub.sc);
  assert.ok(sig.hoverFacets, 'facts are threaded');
  assert.equal(sig.hoverFacets.hoverable, null);
  assert.match(sig.hoverFacets.note, /reported as `null` was NOT MEASURED/);
  assert.match(sig.hoverFacets.note, /`redundant: false`[\s\S]*every facet is owed/);
});

// ── adversarial-review pins (round-4 review, 2026-08-18) ─────────────────────────────────────────────
// #1 HIGH: the at-rest declaration lexicon is token-anchored and error-only — `class="required"` (a REQUIRED
// marker, jQuery-Validate/Drupal idiom) or `class="alert"` on a pristine control is NOT a declared error state,
// so the probe still probes and a genuine silent-swallow barrier is still found.
test('review #1: class="required"/"alert" on a pristine control does NOT silence the probe (still barrier)', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html><body>
    <form id="f" novalidate>
      <label for="e">Contact address</label><input id="e" type="email" class="form-input required" required>
      <label for="g">Alias</label><input id="g" type="text" class="alert" required>
      <button type="submit">Send</button>
    </form>
    <script>document.getElementById('f').addEventListener('submit', function (ev) { ev.preventDefault(); });</script>
  </body></html>`;
  const [r1, r2] = await withPage(html, async (page) => [await probe(page, '/html/body/form[1]/input[1]'), await probe(page, '/html/body/form[1]/input[2]')]);
  assert.equal(r1.outcome.errorNotIdentified, true, 'class="required" is not a declaration of error state — the swallowed submit is still the barrier');
  assert.equal(r2.outcome.errorNotIdentified, true, 'class="alert" (loose surface lexicon only) is not a declaration either');
  assert.equal(r1.measurement.atRestDeclaredInvalid, undefined);
});

test('review #1/#2: a token-anchored error class IS a declaration; the abstain is published in the measurement', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html><body><form novalidate>
    <div><label for="p">Postcode</label><input id="p" type="text" class="field is-invalid" pattern="[0-9]{5}" value="12"><p>Enter all five digits.</p></div>
    <button type="submit">Send</button></form></body></html>`;
  const r = await withPage(html, (page) => probe(page, '/html/body/form[1]/div[1]/input[1]'));
  assert.equal(r.outcome.errorNotIdentified, false);
  assert.equal(r.measurement.atRestDeclaredInvalid, true, 'the abstain is visible in the artifact');
  assert.match(r.measurement.abstainReason || '', /rendered error state/);
  assert.equal(r.measurement.nativeWouldBlock, null, 'unmeasured ⇒ null, not a phantom false');
});

// #9: A1's credit has an informativeness floor — a bare symbol alt does not credit identification
test('review #9: a surfaced referenced <img alt="!"> does NOT credit identification (bare symbol)', { skip: !chromeOK, concurrency: false }, async () => {
  const html = DYNAMIC_ICON.replace('alt="Alias is required"', 'alt="!"');
  const r = await withPage(html, (page) => probe(page, '/html/body/form[1]/input[1]'));
  assert.equal(r.measurement.customIdentifies, false, 'a symbol-only alt is not text identification');
});

// #3/#4/#5: collector selection rules
test('review #3: a hint with a decorative error-named icon is NOT promoted to associatedErrorText', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html><body><form novalidate>
    <div class="field"><label for="pw">Passphrase</label>
      <input id="pw" type="password" class="is-invalid" aria-describedby="pw-hint" value="abc">
      <p id="pw-hint"><img alt="Error icon" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" width="12" height="12"> Must be at least 8 characters.</p></div>
    <div class="field"><label for="n">Nickname</label><input id="n" type="text" value=""></div>
    <button>Go</button></form></body></html>`;
  const recs = await withPage(html, (page) => page.evaluate(collectAtRestErrorState));
  const pw = recs.find((r) => /div\[1\]/.test(r.xpath));
  assert.equal(pw.associatedErrorText, null, 'the node has its own text; the icon alt must not push it through the lexicon gate');
  assert.match(pw.blockOtherText || '', /at least 8 characters/, 'the hint is still surfaced as a fact');
});

test('review #4: an icon-only adjacent message (class err, alt carries the text) IS adjacentErrorText', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html><body><form novalidate>
    <div class="field"><label for="d">Start date</label><input id="d" type="text" class="is-invalid" value="31/02">
      <span class="err"><img alt="Date is not valid" src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" width="12" height="12"></span></div>
    <div class="field"><label for="n">Notes</label><input id="n" type="text" value=""></div>
    <button>Go</button></form></body></html>`;
  const recs = await withPage(html, (page) => page.evaluate(collectAtRestErrorState));
  const d = recs.find((r) => /div\[1\]/.test(r.xpath));
  assert.match(d.adjacentErrorText || '', /not valid/, 'the adjacent scan is alt-aware for text-less nodes');
});

test('review #5: blockOtherText excludes aria-labelledby labels and prefers the text AFTER the control', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html><body><form novalidate>
    <div class="field"><span id="lbl">Card number</span><span class="hint">Format: 16 digits</span>
      <input id="card" class="is-invalid" aria-labelledby="lbl" value="4111">
      <p class="msg">Only 4 of 16 digits were entered.</p></div>
    <div class="field"><label for="n">Name on card</label><input id="n" type="text" value=""></div>
    <button>Go</button></form></body></html>`;
  const recs = await withPage(html, (page) => page.evaluate(collectAtRestErrorState));
  const c = recs.find((r) => /div\[1\]/.test(r.xpath));
  assert.match(c.blockOtherText || '', /4 of 16 digits/, 'the message after the control is preferred over the preceding hint');
  assert.ok(Array.isArray(c.blockOtherTexts) && c.blockOtherTexts.some((t) => /Format: 16/.test(t)), 'the hint still rides as a candidate');
  assert.ok(!c.blockOtherTexts.some((t) => /^Card number$/.test(t)), 'the aria-labelledby label is never a candidate');
});

// #6 (partial): off-canvas rest text does not make a visual bubble redundant
test('review #6: sr-only text parked at left:-9999px does NOT make a hover bubble redundant', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html><body style="margin:0">
    <div style="margin:40px;position:relative">
      <span class="wrap" style="display:inline-flex;flex-direction:column;align-items:center">
        <span class="swatch" tabindex="0" style="display:block;width:28px;height:28px;background:#4a6;position:relative"></span>
        <span id="bub" style="display:none;position:absolute;left:0;top:-28px;background:#123;color:#fff;padding:2px 8px">Moss</span>
        <span class="sr" style="position:absolute;left:-9999px;top:auto;width:80px;height:20px">Moss</span>
      </span>
    </div>
    <style>.swatch:hover ~ #bub, .wrap:hover #bub{display:block!important}</style>
  </body></html>`;
  const res = await withPage(html, (page) => RUNNERS['hover-content-tri'](page, { candidateId: 'c-tri', targetXpath: '/html/body/div[1]/span[1]/span[1]', persistenceSampleOffsetsMs: [150, 250] }));
  assert.equal(res.outcome.contentIsAdditional, true, 'off-canvas text is not rest-VISIBLE — the bubble stays additional content');
  assert.equal(res.measurement.redundantWithVisibleText && res.measurement.redundantWithVisibleText.redundant, false);
});
