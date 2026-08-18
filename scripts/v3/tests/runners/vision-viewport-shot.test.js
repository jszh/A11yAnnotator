// Batch-3 #19b — the hardened page-wide viewport shot (settle + escalating backoff). Pure mock tests
// (no browser): the whole point of the helper is its behaviour when page.screenshot is FAILING, which a
// real page cannot reproduce on demand. The loud per-subject noVerdict for a still-missing frame is the
// llm-adjudicator half (rubric agent) — this file covers only the capture side.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pageWideViewportShot } = require('../../lib/vision-capture.js');

// a page mock whose screenshot fails `failures` times, then succeeds. awaitSettle no-ops (no evaluate);
// robustScreenshot sees .screenshot only — exactly the shapes both helpers guard for.
function flakyPage(failures, payload = 'PNGBYTES') {
  let calls = 0;
  return {
    calls: () => calls,
    screenshot: async () => { calls++; if (calls <= failures) throw new Error('Protocol error: target crashed'); return payload; },
  };
}

test('#19b: a transiently-failing page-wide shot RECOVERS (inner robustScreenshot retries absorb it)', async () => {
  const page = flakyPage(2);
  const s = await pageWideViewportShot(page, { tries: 2 });
  assert.equal(s, 'PNGBYTES');
  assert.equal(page.calls(), 3, 'two failures + one success, all inside the first robustScreenshot round');
});

test('#19b: a failure past one whole inner round is retried on the NEXT backoff round', async () => {
  const page = flakyPage(3); // one full robustScreenshot round (3 tries) fails; round 2 succeeds
  const t0 = Date.now();
  const s = await pageWideViewportShot(page, { tries: 2 });
  assert.equal(s, 'PNGBYTES');
  assert.equal(page.calls(), 4);
  assert.ok(Date.now() - t0 >= 250, 'the escalating outer backoff was actually paid');
});

test('#19b polarity: a permanently-failing shot degrades to null (never throws, bounded)', async () => {
  const page = flakyPage(Infinity);
  const s = await pageWideViewportShot(page, { tries: 2 });
  assert.equal(s, null);
  assert.equal(page.calls(), 6, '2 outer rounds × 3 inner tries, then stop');
});

test('#19b polarity: a null-returning (non-throwing) screenshot degrades identically', async () => {
  let calls = 0;
  const page = { screenshot: async () => { calls++; return null; } };
  const s = await pageWideViewportShot(page, { tries: 2 });
  assert.equal(s, null);
  assert.equal(calls, 6);
});

test('#19b pin: captureVision routes BOTH page-wide frames through the hardened helper', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', '..', 'lib', 'vision-capture.js'), 'utf8');
  const uses = src.split('pageWideViewportShot(page').length - 1;
  assert.ok(uses >= 2, `viewport AND viewport-320 both use the hardened shot — got ${uses} call sites`);
  assert.ok(!/if \(want\.has\('viewport'\)\) viewport = await shot\(null\)/.test(src), 'the bare one-shot viewport capture is gone');
});
