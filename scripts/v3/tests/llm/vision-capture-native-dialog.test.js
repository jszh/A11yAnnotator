// #12 fix — a real DHS Trusted-Tester page's 3.3.1 error-identification mechanism calls a NATIVE
// window.alert(...) on invalid submit (not a DOM-toggled error element, which is what
// fx-v3-submit-pair.html / the sibling "form-submit pairs" test exercises). A native dialog freezes the
// page's JS realm until dismissed — with no `page.on('dialog', ...)` listener registered, the VERY NEXT
// page.evaluate() call (measureForm, right after driveInvalidSubmit) hung INDEFINITELY, not just slowly.
// Confirmed live against the real page: captureVisionForUrl's submit-pair capture took 800+ SECONDS per
// subject (eventually degrading to noVerdict, having captured nothing) before this fix; with the listener,
// the whole pair completes in under a second AND the dialog's message text — the ACTUAL evidence 3.3.1/3.3.3
// need — is captured, which a screenshot could never show either way (a native dialog is browser chrome,
// not page content).
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const chromeOK = fs.existsSync(CHROME);

const { BROWSER_ARGS } = require('../../lib/orchestrator.js');
const { captureStateVision, buildStatePlan } = require('../../lib/vision-capture.js');

const PAGE_HTML = `<!doctype html><html><head><meta charset="utf-8"></head><body>
<form id="f1" novalidate>
  <label for="e1">Email</label>
  <input type="email" id="e1" required>
  <button type="submit" id="s1">Submit</button>
</form>
<script>
  document.getElementById('f1').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!document.getElementById('e1').value.trim()) alert('Email is required - enter an address like name@example.com.');
  });
</script>
</body></html>`;

function writeFixture(dirName, html) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), dirName));
  const file = path.join(tmp, 'index.html');
  fs.writeFileSync(file, html);
  return 'file://' + file;
}

test('vision-capture #12 FIX: a native alert() on submit does not hang captureStateVision, and its message is captured', { skip: !chromeOK, concurrency: false }, async () => {
  const url = writeFixture('native-dialog-', PAGE_HTML);
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: BROWSER_ARGS });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 600 });
    await page.goto(url, { waitUntil: 'load' });
    const plan = buildStatePlan([{ xpath: '/html/body/form[1]/input[1]', sc: '3.3.1' }]);
    const t0 = Date.now();
    const out = await captureStateVision(page, plan, {});
    const elapsed = Date.now() - t0;
    assert.ok(elapsed < 15000, `completed in ${elapsed}ms, not hung (pre-fix: indefinite hang, confirmed past a 30s watchdog on the real page)`);
    const pair = out['/html/body/form[1]/input[1]'];
    assert.ok(pair && pair['state-before'] && pair['state-after'], 'the submit pair still captures a before/after screenshot');
    assert.equal(pair.nativeDialogText, 'Email is required - enter an address like name@example.com.', 'the dialog message is captured — the ACTUAL evidence 3.3.1 needs, uncapturable any other way');
  } finally { await browser.close().catch(() => {}); }
});

test('vision-capture #12 REGRESSION GUARD: a normal DOM-toggled error (no native dialog) is unaffected — no nativeDialogText, still a real before/after pair', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html><body>
<form id="f1">
  <label for="e1">Name</label>
  <input type="text" id="e1">
  <div id="err1" style="display:none">Name is required.</div>
  <button type="submit" id="s1">Send</button>
</form>
<script>
  document.getElementById('f1').addEventListener('submit', function (e) {
    e.preventDefault();
    if (!document.getElementById('e1').value.trim()) document.getElementById('err1').style.display = 'block';
  });
</script>
</body></html>`;
  const url = writeFixture('no-dialog-', html);
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: BROWSER_ARGS });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 600 });
    await page.goto(url, { waitUntil: 'load' });
    const plan = buildStatePlan([{ xpath: '/html/body/form[1]/input[1]', sc: '3.3.1' }]);
    const out = await captureStateVision(page, plan, {});
    const pair = out['/html/body/form[1]/input[1]'];
    assert.ok(pair && pair['state-before'] && pair['state-after']);
    assert.equal(pair.nativeDialogText, undefined, 'no dialog fired, so no nativeDialogText key at all — the #12 fix does not fabricate one');
  } finally { await browser.close().catch(() => {}); }
});
