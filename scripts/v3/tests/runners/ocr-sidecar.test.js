// PP-OCRv6 sidecar (scripts/v3/lib/ocr-sidecar.js) for the non-authoritative ocr_image_text shadow tool.
// Two layers: (1) graceful degradation when the isolated venv is absent — no Python, always runs; (2) a real
// end-to-end vision cross-check that renders known text and asserts PP-OCRv6 reads it — gated on the venv.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { makeOcrSidecar, DEFAULT_PY, DEFAULT_SCRIPT } = require('../../lib/ocr-sidecar.js');
const { CHROME } = require('../../lib/run-experiments.js');

// OPT-IN, not opt-out. The end-to-end test below spawns a real PP-OCRv6 interpreter that loads ~500 MB of
// models and takes minutes to warm. On this machine that turned an ordinary `npm test` into a memory event:
// each run left an interpreter behind (the sidecar's close() sent SIGTERM and never escalated, and its
// undestroyed stdio pipes also held Node's event loop open, which is why this FILE reported a permanent
// "Promise resolution is still pending" hang). The teardown bug is fixed in ocr-sidecar.js — but a routine
// test run has no business loading an OCR model at all, so the heavy path is now behind a flag.
// Run it with:  V3_TEST_OCR=1 node --test scripts/v3/tests/runners/ocr-sidecar.test.js
// The graceful-degradation test above it is pure Node and always runs, so the module's contract stays covered.
const OCR_E2E = process.env.V3_TEST_OCR === '1';
const venvOK = fs.existsSync(DEFAULT_PY) && fs.existsSync(DEFAULT_SCRIPT);
const chromeOK = fs.existsSync(CHROME);
if (!OCR_E2E) console.log('# ocr-sidecar end-to-end test SKIPPED (set V3_TEST_OCR=1 to run it — it loads a ~500 MB model)');
else if (!venvOK) console.log('# PP-OCRv6 venv absent — ocr-sidecar end-to-end test SKIPPED (graceful-degradation test still runs)');

test('makeOcrSidecar: an absent venv degrades to {error:ocr-venv-missing} and never throws', async () => {
  const ocr = makeOcrSidecar({ python: '/nonexistent/python', script: '/nonexistent/script.py' });
  assert.equal(ocr.available(), false);
  const r = await ocr.recognize('aGVsbG8='); // any base64 — should not even spawn
  assert.equal(r.error, 'ocr-venv-missing', 'missing engine ⇒ a clean error the tool maps to INCONCLUSIVE');
  await ocr.close(); // safe to close a never-started sidecar
});

test('PP-OCRv6 sidecar reads known rendered text end-to-end, with a fast warm second call (vision cross-check)', { skip: !(OCR_E2E && venvOK && chromeOK), concurrency: false }, async () => {
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const ocr = makeOcrSidecar();
  try {
    const page = await browser.newPage();
    await page.setContent('<body style="margin:0"><div id="t" style="font:40px Helvetica;padding:14px;color:#111;background:#fff">Checkout Total: $42.00</div></body>');
    const el = await page.$('#t');
    const b64 = await el.screenshot({ encoding: 'base64' });
    const r = await ocr.recognize(b64); // first call warms the model
    assert.ok(!r.error, `ocr ran: ${r.error || 'ok'}`);
    assert.match(r.text, /Checkout Total: \$42\.00/, `PP-OCRv6 read the rendered text (got ${JSON.stringify(r.text)})`);
    assert.ok(r.lines.length >= 1 && r.lines[0].score > 0.8, 'a high-confidence line with a bounding box');
    assert.ok(Array.isArray(r.lines[0].box), 'each line carries its polygon box');
    const r2 = await ocr.recognize(b64); // warm: should be quick + identical (deterministic)
    assert.equal(r2.text, r.text, 'a repeat read is deterministic');
  } finally { await ocr.close(); await browser.close(); }
});
