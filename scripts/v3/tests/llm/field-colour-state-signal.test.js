// 1.4.1 FIELD COLOUR/STATE EVIDENCE (residual RCA S10) — the counter-fact that makes a mis-attributed
// border un-assertable.
//
// WHAT WENT WRONG. A 1.4.1 form-field subject reached the judge with NO colour facts of any kind: this
// collector never emits color/effBg/contrastReliable, so `s.contrast` is a stub carrying only a generic
// "could not compute" notice, and every appearance question — is this field red, is it in the error state —
// had exactly one source, the crops. The `surrounding-region` crop is a RECTANGLE, and a rectangle drawn
// around one field of a two-column row also contains the NEIGHBOURING field's border. Measured: a
// default-state input sitting beside an invalid one was reported as having a "red LEFT border ... sole error
// indicator", on a page whose markup gives that input no error class and no aria-invalid. The judge was not
// inventing a colour; it was ATTRIBUTING a real pixel to the wrong element, and nothing in the prompt could
// contradict it. An explicit rubric prohibition against asserting unseen colours had already shipped and did
// not stop it — it could not, because the colour HAD been seen.
//
// WHAT THIS PINS. (§1) the collector reads the field's own resolved colours + state in a real browser, gates
// itself off colour-uniform forms, and reports per-side borders; (§2) act-page-collect joins the records onto
// the right elements by xpath — the wiring whose silent failure has twice killed a whole lane; (§3) the
// signal reaches the prompt, is confined to the colour skill, and is strictly ADDITIVE.
//
// §3's first test FAILS until the hunk in docs/analysis/reports-2026-06/HUNK-fieldColourState-llm-adjudicator.md
// is applied to llm-adjudicator.js (that file is held by another agent). Every other test here passes either way.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const crypto = require('node:crypto');
const puppeteer = require('puppeteer');

const { collectFieldColourState } = require('../../lib/collect-colour-peers.js');
const { collectActPage } = require('../../lib/act-page-collect.js');
const { BROWSER_ARGS } = require('../../lib/browser-args.js');
const llmAdj = require('../../lib/llm-adjudicator.js');

const CHROME = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — field-colour-state browser tests SKIPPED');

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'fieldcolour-fx-'));
const writeFx = (name, html) => { fs.writeFileSync(path.join(DIR, name), html); return 'file://' + path.join(DIR, name); };

// Two fields side by side in one row, one flagged and one not — the geometry that puts a neighbour's coloured
// edge inside the subject's crop. Deliberately a generic booking form, unrelated to any corpus page.
const SIDE_BY_SIDE = writeFx('side-by-side.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Booking</title><style>
  body { font:16px/1.5 Arial, sans-serif; }
  input { border:2px solid rgb(200,200,200); padding:8px; }
  input.bad { border-color: rgb(200,0,0); }
  .row { display:flex; gap:12px; } .cell { flex:1; }
  label { display:block; }
  .msg { color:#900; }
</style></head><body>
  <form>
    <div class="cell"><label for="a">Party size</label><input id="a" value="4"></div>
    <div class="row">
      <div class="cell"><label for="b">Arrival date</label>
        <input id="b" class="bad" aria-invalid="true" aria-describedby="b-msg" value="31/02">
        <p class="msg" id="b-msg"><img src="data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==" alt="">Error: that date does not exist.</p>
      </div>
      <div class="cell"><label for="c">Nights</label><input id="c" value="2"></div>
    </div>
  </form>
</body></html>`);

// Every field renders identically ⇒ nothing is encoded in colour ⇒ the collector must add nothing.
const UNIFORM = writeFx('uniform.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Uniform</title><style>
  input { border:1px solid #999; } label { color:#222; display:block; }
</style></head><body><form>
  <div><label for="p">Given name</label><input id="p"></div>
  <div><label for="q">Family name</label><input id="q"></div>
  <div><label for="r">Town</label><input id="r"></div>
</form></body></html>`);

// A one-sided accent bar, plus a two-colour label scheme the page explains by shade.
const ACCENT = writeFx('accent.html', `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Accent</title><style>
  input { border:1px solid #bbb; } .hot input { border-left:4px solid rgb(180,0,0); }
  label { display:block; color:#222222; } .hot label { color:#767676; }
</style></head><body><form>
  <div class="hot"><label for="x">Departure</label><input id="x"></div>
  <div><label for="y">Return</label><input id="y"></div>
</form></body></html>`);

async function withBrowser(fn) {
  const browser = await puppeteer.launch({ headless: 'new', executablePath: CHROME, args: BROWSER_ARGS });
  try { return await fn(browser); } finally { await browser.close(); }
}
const evalOn = async (browser, url, fn) => {
  const page = await browser.newPage();
  try { await page.goto(url, { waitUntil: 'load' }); return await page.evaluate(fn); } finally { await page.close(); }
};

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// §1 — the collector, in a real browser
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

test('§1 collectFieldColourState RESOLVES in-page (self-contained under page.evaluate)', { skip: !chromeOK }, async () => {
  // The failure mode this guards is a ReferenceError from a helper declared in a DIFFERENT serialized
  // function: it throws IN THE PAGE, the .catch() returns [], and the lane reads as "no findings".
  const recs = await withBrowser((b) => evalOn(b, SIDE_BY_SIDE, collectFieldColourState));
  assert.ok(Array.isArray(recs), 'the collector resolved rather than throwing inside the page');
  assert.ok(recs.length >= 3, `all three visible fields produced a record (got ${recs.length})`);
});

test('§1 the DEFAULT field beside a flagged one states its own neutral border and its default state', { skip: !chromeOK }, async () => {
  const recs = await withBrowser((b) => evalOn(b, SIDE_BY_SIDE, collectFieldColourState));
  const nights = recs.find((r) => r.label === 'Nights');
  assert.ok(nights, 'the default-state field in the two-column row produced a record');

  // The whole point: the coded colour is absent from EVERY side of this field's own border, so the crop's
  // red edge is contradicted by a stated fact rather than by an instruction not to believe one's eyes.
  const sides = typeof nights.border === 'string' ? [nights.border] : Object.values(nights.border);
  assert.ok(sides.every((s) => !/rgb\(200, 0, 0\)/.test(s)), `no side carries the coded colour: ${JSON.stringify(nights.border)}`);
  assert.equal(nights.errorStated, false);
  assert.equal(nights.state.ariaInvalid, null);
  assert.deepEqual(nights.state.classes, []);

  // ...and the peer reading is DATA, not a reasoning step the judge has to perform: it matches the peer that
  // carries no cue and differs from the one that is stated to be in a state AND carries a non-colour cue.
  assert.ok(nights.group.sameAppearanceAs.includes('Party size'), 'matches the other default field exactly');
  const flagged = nights.group.differentAppearanceFrom.find((p) => p.label === 'Arrival date');
  assert.ok(flagged, 'the flagged peer is reported as differing');
  assert.equal(flagged.errorStated, true);
  assert.match(String(flagged.nonColourCue), /does not exist/, 'the differing peer carries its non-colour cue text');
  assert.equal(flagged.blockHasIcon, true, 'and its icon');
});

test('§1 GATE: a colour-uniform form produces no records at all', { skip: !chromeOK }, async () => {
  const recs = await withBrowser((b) => evalOn(b, UNIFORM, collectFieldColourState));
  assert.deepEqual(recs, [], 'a form that encodes nothing in colour costs its prompts nothing');
});

test('§1 a one-sided accent border is reported PER SIDE, and label colours carry a measured separation', { skip: !chromeOK }, async () => {
  const recs = await withBrowser((b) => evalOn(b, ACCENT, collectFieldColourState));
  const hot = recs.find((r) => r.label === 'Departure');
  assert.ok(hot, 'the accented field produced a record');
  assert.equal(hot.borderUniform, false, 'the four sides differ, so they are listed individually');
  assert.match(hot.border.left, /rgb\(180, 0, 0\)/, 'the accent is on the LEFT and is named as such');
  assert.ok(!/rgb\(180, 0, 0\)/.test(hot.border.top), 'and is absent from the other sides');

  const sep = hot.group.labelColourContrasts.find((c) => c.label === 'Return');
  assert.ok(sep, 'the other label colour in the set is reported');
  assert.equal(typeof sep.contrastWithThisLabel, 'number');
  // #767676 vs #222222 — a real, checkable luminance separation, so the G182/G183 shade question is a number
  // in the prompt rather than something a per-field subject is invited to estimate from a crop.
  assert.ok(sep.contrastWithThisLabel > 2 && sep.contrastWithThisLabel < 4, `plausible ratio, got ${sep.contrastWithThisLabel}`);
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// §2 — the join. A collector that runs but is attached to nothing is the silent-lane failure mode.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

test('§2 act-page-collect attaches fieldColourState to the RIGHT element records', { skip: !chromeOK }, async () => {
  const collect = await withBrowser(async (browser) => {
    const page = await browser.newPage();
    try { return await collectActPage(page, { url: SIDE_BY_SIDE, elementCap: 400, file: 'fx' }); } finally { await page.close(); }
  });
  const withKey = (collect.elements || []).filter((e) => e && e.fieldColourState);
  assert.ok(withKey.length >= 3, `the records reached the element inventory (got ${withKey.length})`);
  for (const el of withKey) {
    assert.ok(['string', 'object'].includes(typeof el.fieldColourState.border), 'border is a collapsed string or a per-side object');
    assert.ok(!('xpath' in el.fieldColourState), 'the record does not duplicate the xpath the element already carries');
    assert.ok(el.isFormField === true || /^(input|select|textarea)$/.test(String(el.tag)), 'only form fields carry it');
  }
  // the join is BY XPATH, so a mismatched key would silently attach the wrong field's colours
  const nights = withKey.find((e) => e.fieldColourState.label === 'Nights');
  assert.ok(nights && nights.xpath.endsWith('input[1]'), 'the record landed on a real element with a real xpath');
  assert.equal(nights.fieldColourState.errorStated, false);
  assert.ok((collect.collectorLiveness || []).every((f) => f.collector !== 'collectFieldColourState'),
    'the collector did not throw in the page (liveness record is clean)');
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════
// §3 — the prompt. Additive by construction: the branch reads a key that did not exist before.
// ═══════════════════════════════════════════════════════════════════════════════════════════════════

const FIELD_EL = {
  xpath: '/html/body/form[1]/div[2]/input[1]', tag: 'input', isFormField: true, axRole: 'textbox',
  fieldColourState: {
    label: 'Nights', color: 'rgb(0, 0, 0)', background: 'rgb(255, 255, 255)',
    border: '2px solid rgb(200, 200, 200)', borderUniform: true, outline: 'none',
    labelColor: 'rgb(34, 34, 34)', labelGeneratedContent: null, labelHasIcon: false,
    state: { ariaInvalid: null, ariaRequired: null, required: false, cssInvalid: false, classes: [], blockClasses: ['cell'] },
    cue: { describedByText: null, errorMessageText: null, blockExtraText: null, blockHasIcon: false },
    errorStated: false, requiredStated: false,
    group: { scope: 'form', fieldCount: 3, distinctFieldAppearances: 2, distinctLabelColours: 1, sameAppearanceAs: ['Party size'], differentAppearanceFrom: [], labelColourContrasts: [] },
  },
};
const stripKey = (el) => { const { fieldColourState, ...rest } = el; return rest; };

test('§3 precomputeSignals surfaces fieldColourState for a colour-skill field subject [REQUIRES THE HUNK]', () => {
  const s = llmAdj.precomputeSignals(FIELD_EL, 'color-and-visual-text', '1.4.1');
  assert.ok(s.fieldColourState, 'the field\'s own resolved colours reach the signals block\n'
    + '  → apply docs/analysis/reports-2026-06/HUNK-fieldColourState-llm-adjudicator.md to llm-adjudicator.js');
  assert.equal(s.fieldColourState.border, '2px solid rgb(200, 200, 200)');
  assert.equal(s.fieldColourState.errorStated, false);
  assert.ok(/AUTHORITATIVE over the crops/.test(String(s.fieldColourState.uncertainReason)),
    'and carry the precedence rule that settles a crop/computed-style disagreement');
});

test('§3 the signal is CONFINED to the colour skill', () => {
  const s = llmAdj.precomputeSignals(FIELD_EL, 'forms-instructions-errors', '3.3.1');
  assert.equal(s.fieldColourState, undefined, 'a 3.3.1 field subject on the same element is untouched');
});

test('§3 ADDITIVE: an element without the key produces signals identical to the same element with it deleted', () => {
  const a = llmAdj.precomputeSignals(stripKey(FIELD_EL), 'color-and-visual-text', '1.4.1');
  const b = llmAdj.precomputeSignals(FIELD_EL, 'color-and-visual-text', '1.4.1');
  delete b.fieldColourState;
  assert.deepEqual(b, a, 'the branch adds one key and perturbs nothing else');
  const hash = (o) => crypto.createHash('sha256').update(JSON.stringify(o)).digest('hex');
  assert.equal(hash(b), hash(a), 'byte-identical once the new key is removed');
});

test('§3 no key ⇒ no key: nothing is fabricated for a field that was not collected', () => {
  const s = llmAdj.precomputeSignals(stripKey(FIELD_EL), 'color-and-visual-text', '1.4.1');
  assert.equal('fieldColourState' in s, false, 'absent, not null — matching the field-omission pattern used elsewhere');
});
