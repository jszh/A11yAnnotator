// #7 fix — captureVisionForUrl's page.setViewport() was the ONE unguarded call in an otherwise defensively-wrapped
// function (every other await here degrades to null/{} on failure; robustScreenshot itself retries 3x). Under real
// concurrent-tab pressure (confirmed on a 54-case run: pages with 12-17 obligations went from 0 verdicts to correct
// verdicts purely by REDUCING page-level concurrency), setViewport can throw ("Target closed"/"Protocol error" —
// a well-known Puppeteer failure mode). Before this fix, that single throw propagated out of captureVisionForUrl
// entirely; orchestrator.js's top-level `.catch(() => ({}))` silently collapsed vision to EMPTY for the WHOLE page,
// so every vision-requiring rubric subject on that page hit the required-evidence gate and abstained — ZERO LLM
// calls attempted for potentially a dozen+ obligations, atomically, not a random subset. This pins the retry: a
// transient setViewport failure must not propagate and kill the whole page's vision capture.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');

process.env.V3_SETTLE_WAIT = '0'; // skip awaitSettle's page.evaluate entirely — isolates this test to setViewport/goto

const { captureVisionForUrl } = require('../../lib/vision-capture.js');

// a minimal mock page: just enough surface for captureVisionForUrl's own calls (setViewport/goto/viewport) with
// V3_SETTLE_WAIT=0 skipping awaitSettle, and states:[] + xpaths:[] skipping captureVision's screenshot work.
function makeMockPage({ setViewportThrows = 0 } = {}) {
  let setViewportCalls = 0;
  return {
    setViewport: async () => {
      setViewportCalls++;
      if (setViewportCalls <= setViewportThrows) throw new Error('Protocol error (Page.setViewport): Target closed.');
    },
    goto: async () => {},
    viewport: () => ({ width: 1280, height: 900 }),
    close: async () => {},
    getCallCount: () => setViewportCalls,
  };
}

test('captureVisionForUrl #7 FIX: a transient setViewport throw is retried, not propagated', async () => {
  const mockPage = makeMockPage({ setViewportThrows: 1 }); // fails once, succeeds on retry
  const mockBrowser = { newPage: async () => mockPage, };
  const out = await captureVisionForUrl('file:///nonexistent.html', [], { browser: mockBrowser, states: [] });
  assert.deepEqual(out, {}, 'completes cleanly (no xpaths requested) rather than throwing');
  assert.equal(mockPage.getCallCount(), 2, 'setViewport was retried exactly once after the first failure');
});

test('captureVisionForUrl #7 FIX REGRESSION GUARD: a setViewport that fails BOTH attempts still does not propagate (best-effort continue, not a page-wide abort)', async () => {
  const mockPage = makeMockPage({ setViewportThrows: 999 }); // always fails
  const mockBrowser = { newPage: async () => mockPage };
  // must NOT throw/reject — degraded continue is the whole point of the fix (some vision > zero vision)
  const out = await captureVisionForUrl('file:///nonexistent.html', [], { browser: mockBrowser, states: [] });
  assert.deepEqual(out, {});
  assert.equal(mockPage.getCallCount(), 2, 'exactly one retry attempt, then gives up gracefully (not an infinite loop)');
});

test('captureVisionForUrl #7 NO OVER-CORRECTION: the normal (non-throwing) path calls setViewport exactly once — no wasted retry overhead on the common case', async () => {
  const mockPage = makeMockPage({ setViewportThrows: 0 });
  const mockBrowser = { newPage: async () => mockPage };
  await captureVisionForUrl('file:///nonexistent.html', [], { browser: mockBrowser, states: [] });
  assert.equal(mockPage.getCallCount(), 1, 'no retry when the first call succeeds');
});

// #7b fix — a SECOND unguarded setViewport, inside captureVision's viewport-320 branch (not captureVisionForUrl's
// main resize). Caught live: orchestrator.js never passes opts.states, so captureVision's `want` set DEFAULTS to
// ALL FOUR states (including viewport-320) on every real page — this call runs unconditionally, not just for
// rubrics that actually declared viewport-320 evidence. A throw here, structurally identical to #7's, still
// propagated out of captureVision ⇒ captureVisionForUrl ⇒ orchestrator's `.catch(() => ({}))`, collapsing vision
// for the WHOLE page — confirmed on a real DHS page (1.4.5 image-of-text, 402180-16) that still showed zero
// rubric verdicts across 12 minted obligations after #7 alone shipped.
const { captureVision } = require('../../lib/vision-capture.js');

function makeCaptureVisionMockPage({ setViewport320Throws = 0 } = {}) {
  let call320 = 0;
  return {
    setViewport: async ({ width }) => {
      if (width === 320) { call320++; if (call320 <= setViewport320Throws) throw new Error('Protocol error (Page.setViewport): Target closed.'); }
    },
    viewport: () => ({ width: 1280, height: 900 }),
    evaluate: async (fn, ...args) => {
      // scrollIntoView calls (no return needed) vs the probe (needs a box) — distinguish by arg count/shape isn't
      // reliable across call sites, so just always return a plausible visible box; scrollIntoView's return is unused.
      return { box: { x: 10, y: 10, w: 50, h: 20, vw: 1280, vh: 900 } };
    },
    screenshot: async () => 'ZmFrZS1wbmc=', // base64 "fake-png" — any non-empty string satisfies robustScreenshot
  };
}

test('captureVision #7b FIX: a transient viewport-320 setViewport throw is retried, not propagated (DEFAULT states — no opts.states override, matching real orchestrator.js usage)', async () => {
  const mockPage = makeCaptureVisionMockPage({ setViewport320Throws: 1 });
  const out = await captureVision(mockPage, ['/el']); // no opts ⇒ want defaults to all 4 states, incl. viewport-320
  assert.ok(out['/el'], 'the element still gets SOME evidence, not an empty result');
  assert.ok(out['/el']['viewport-320'], 'the retry succeeded, so viewport-320 evidence is present');
});

test('captureVision #7b FIX REGRESSION GUARD: a viewport-320 setViewport that fails BOTH attempts still does not propagate — element-crop/surrounding-region for a REAL element are NOT lost just because the unrelated 320px resize failed', async () => {
  const mockPage = makeCaptureVisionMockPage({ setViewport320Throws: 999 });
  const out = await captureVision(mockPage, ['/el']); // must not throw/reject
  assert.ok(out['/el'], 'the element still gets its element-crop/surrounding-region evidence');
  assert.equal(out['/el']['element-crop'], 'ZmFrZS1wbmc=');
  assert.equal(out['/el']['surrounding-region'], 'ZmFrZS1wbmc=');
  assert.ok(!out['/el']['viewport-320'], 'viewport-320 alone degrades to absent — the ONLY thing lost, not everything');
});

test('captureVision #7b NO OVER-CORRECTION: the normal (non-throwing) path still produces viewport-320 evidence', async () => {
  const mockPage = makeCaptureVisionMockPage({ setViewport320Throws: 0 });
  const out = await captureVision(mockPage, ['/el']);
  assert.ok(out['/el']['viewport-320'], 'viewport-320 is present on the happy path — the fix does not accidentally drop it');
});
