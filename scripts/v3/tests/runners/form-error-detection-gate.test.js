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
