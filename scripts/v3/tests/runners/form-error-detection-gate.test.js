// 3.3.1 — no AUTOMATIC DETECTION means no obligation (2026-08-19).
//
// The probe writes an invalid value, submits, and reports a barrier when no error message surfaces. But the
// absence of a message is AMBIGUOUS: the page may never have DETECTED the error at all, and 3.3.1 attaches
// only to errors that ARE automatically detected. On a `novalidate` form the UA performs no constraint
// validation, so `required`/`pattern`/`type=email` prove only that a rule was AUTHORED. A barrier there now
// needs POSITIVE evidence of detection — the page reacted, declared the field invalid, or ships a validator.
//
// Fixtures INVENTED (a boat-club moorings form). Polarities differ ONLY in whether anything detects the error.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const puppeteer = require('puppeteer');
const { RUNNERS } = require('../../lib/exp-runners.js');
const { CHROME } = require('../../lib/run-experiments.js');

const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — 3.3.1 detection-gate suite SKIPPED');

// `validator`: 'none' = inert page (no script at all)
//              'reacts' = a hand-rolled vanilla-JS validator that flags the field but describes nothing
const MOORINGS = (validator) => `<!doctype html><html><body style="font:14px system-ui">
  <main>
    <h1>Renew a mooring</h1>
    <form ${'novalidate'}>
      <label for="berth">Berth number</label>
      <input type="text" id="berth" value="D14">
      <label for="post">Contact address</label>
      <input type="email" id="post" value="harbourmaster@westquay.example">
      <button type="submit">Renew mooring</button>
    </form>
  </main>
  ${validator === 'reacts' ? `<script>
    document.querySelector('form').addEventListener('submit', function () {
      const f = document.getElementById('post');
      // detects the bad address and flags it — but never says what is wrong (a genuine 3.3.1 barrier)
      if (!/^[^@]+@[^@]+$/.test(f.value)) f.classList.add('is-flagged');
    });
  </script>` : ''}
</body></html>`;

async function runProbe(html, targetXpath) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', timeout: 60000, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    return await RUNNERS['form-error-probe'](page, { candidateId: 'c-fe', targetXpath });
  } finally { await browser.close(); }
}

const EMAIL_XPATH = '/html/body/main[1]/form[1]/input[2]';

test('3.3.1 an INERT novalidate form detects nothing ⇒ ABSTAIN, never a barrier', { skip: !chromeOK, concurrency: false }, async () => {
  const r = await runProbe(MOORINGS('none'), EMAIL_XPATH);
  assert.equal(r.measurement.pageReacted, false, 'a page with no script cannot react');
  assert.equal(r.measurement.detectionUnproven, true, 'so automatic detection is unproven');
  assert.equal(r.outcome.errorNotIdentified, false, 'and the probe must NOT report a barrier for an error the page never detects');
});

test('3.3.1 the SAME form with a vanilla-JS validator that flags but does not describe IS a barrier', { skip: !chromeOK, concurrency: false }, async () => {
  const r = await runProbe(MOORINGS('reacts'), EMAIL_XPATH);
  assert.equal(r.measurement.pageReacted, true, 'the validator mutated the DOM — detection is proven');
  assert.ok(!r.measurement.detectionUnproven, 'so the gate does not fire');
  assert.equal(r.outcome.errorNotIdentified, true, 'the true catch is preserved: detected, flagged, never described');
  // and the gate must not be a framework allow-list — this validator is hand-rolled, no library present
  assert.ok(!/jquery|angular/i.test(String(r.measurement.abstainReason || '')), 'no library was needed to qualify');
});

// ---------------------------------------------------------------------------------------------------
// The probe could not create an error condition AT ALL (2026-08-19)
// ---------------------------------------------------------------------------------------------------
//
// The gate above asks whether the probe MANUFACTURED a condition the page treats as valid. It cannot fire
// when the probe manufactured NOTHING. A bare `type=number` counts as CONSTRAINED at the applicability gate,
// but `el.value = 'abc'` runs the value-sanitization algorithm and leaves '' behind — which for an OPTIONAL
// field is VALID. The probe then submitted an acceptable value, saw no message, and reported a barrier on a
// field that was never in error, on a page whose REAL error elsewhere was correctly identified (measured,
// model-independent false positive). Where a range DOES exist there is a violable rule, so the probe now
// breaks the range instead and keeps measuring what it meant to measure.
//
// Fixture INVENTED (a allotment-society water-meter reading form).
const METERS = (range, validator, native) => `<!doctype html><html><body style="font:14px system-ui">
  <main>
    <h1>Submit a water reading</h1>
    <form${native ? '' : ' novalidate'}>
      <label for="plot">Plot</label>
      <input type="text" id="plot" value="Upper field 7">
      <label for="reading">Reading (cubic metres)</label>
      <input type="number" id="reading" value="118"${range ? ' min="0" max="120"' : ''}>
      <button type="submit">Send reading</button>
    </form>
  </main>
  ${validator ? `<script>
    document.querySelector('form').addEventListener('submit', function (e) {
      // The society's own rule lives in JS, not in HTML: a reading must be present and not run backwards.
      // It DETECTS — and then says nothing, which is the barrier this SC is about.
      const f = document.getElementById('reading');
      if (f.value === '' || Number(f.value) > 120) f.classList.add('is-flagged');
    });
  </script>` : ''}
</body></html>`;

const READING_XPATH = '/html/body/main[1]/form[1]/input[2]';

test('3.3.1 a field the probe cannot invalidate ⇒ ABSTAIN, never a barrier', { skip: !chromeOK, concurrency: false }, async () => {
  const r = await runProbe(METERS(false, false), READING_XPATH);
  assert.equal(r.measurement.conditionAbsent, true, 'the injected value sanitizes away and the field is STILL valid');
  assert.equal(r.measurement.detectionUnproven, true, 'so there is no automatically detected error to attach to');
  assert.equal(r.outcome.errorNotIdentified, false, 'and the probe must not report a barrier on a field with no error');
  assert.match(String(r.measurement.abstainReason || ''), /could not put this field into an error state/,
    'the abstain names the condition-absent cause, not the fabricated-condition one');
});

test('3.3.1 an authored RANGE is violable — the probe breaks the range, not the type', { skip: !chromeOK, concurrency: false }, async () => {
  // Same field with min/max: `el.value = "abc"` would sanitize away here too, so the probe writes an
  // out-of-range NUMBER instead and the field really is invalid. This form is still `novalidate` over an
  // inert page, so it abstains either way — but for the OTHER reason, and that distinction is the fix.
  const r = await runProbe(METERS(true, false), READING_XPATH);
  assert.equal(r.measurement.conditionAbsent, false, 'an out-of-range number is genuinely invalid');
  assert.match(String(r.measurement.abstainReason || ''), /MANUFACTURED this error condition/,
    'so this abstains under the novalidate clause, not the condition-absent one');
});

test('3.3.1 condition-absent is NOT a blanket exemption — a page that detects is still on the hook', { skip: !chromeOK, concurrency: false }, async () => {
  // The guard: the same unfalsifiable field, but the page carries its own JS rule and reacts to the submit.
  // A rule expressed only in script is still automatic detection, so silence about it is still a barrier —
  // the abstain must not swallow every optional number field on the web.
  const r = await runProbe(METERS(false, true), READING_XPATH);
  assert.equal(r.measurement.conditionAbsent, true, 'the field is still valid by its own HTML constraints');
  assert.equal(r.measurement.pageReacted, true, 'but the page detected something and mutated the DOM');
  assert.ok(!r.measurement.detectionUnproven, 'so the abstain does not fire');
  assert.equal(r.outcome.errorNotIdentified, true, 'detected, flagged, never described — still a barrier');
});

test('3.3.1 the abstain is scoped to novalidate — a UA-VALIDATED form is still on the hook', { skip: !chromeOK, concurrency: false }, async () => {
  // THE PIN THE UNIT SUITE WAS MISSING. Every fixture above is written `novalidate`, so a first cut that
  // dropped that qualifier from the condition-absent branch passed all of them — and abstained on four
  // validated ACT failures, costing 4 true positives on the 581-case held-out gate before anything caught it.
  //
  // The distinction: WITHOUT `novalidate` the user agent performs constraint validation itself, so the page
  // HAS automatic detection even when THIS field carries no violable rule of its own. The error a user meets
  // can sit elsewhere in the form and be reported by a message that never says what is wrong — a plain
  // `<form>` with a bare `type=number` and no script. That is a real 3.3.1 failure and must keep firing.
  const r = await runProbe(METERS(false, false, true), READING_XPATH);
  assert.equal(r.measurement.conditionAbsent, true, 'the field itself still cannot be invalidated');
  assert.ok(!r.measurement.detectionUnproven, 'but the UA validates this form, so detection is not unproven');
  assert.equal(r.outcome.errorNotIdentified, true, 'and the barrier stands');
});
