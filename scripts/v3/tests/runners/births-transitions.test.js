// Batch-3 #35 (birth observer: emptiedAtMs / last-content transitions) + #37 (auto-update cadence
// derived from the birth recorder's spontaneous content-change stamps). Invented inline fixtures only;
// two polarities per item; pure cadence math tested without a browser. Extends the status-timeline
// pattern (document-start observer must be installed BEFORE a real navigation).
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const puppeteer = require('puppeteer');
const { installLiveRegionBirthObserver, readLiveRegionBirths, markLiveBirthHarnessActive, autoUpdateCadenceFrom, birthFindingsFrom } = require('../../lib/run-instruments.js');
const { CHROME } = require('../../lib/run-experiments.js');

const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — births-transitions browser tests SKIPPED');

async function launchWithRetry() {
  let lastErr;
  for (let i = 0; i < 3; i++) {
    try { return await puppeteer.launch({ executablePath: CHROME, headless: 'new', timeout: 60000, args: ['--no-sandbox', '--disable-dev-shm-usage'] }); }
    catch (e) { lastErr = e; if (!/WS endpoint|Timed out/i.test(String(e && e.message))) throw e; }
  }
  throw lastErr;
}

// evaluateOnNewDocument fires only on a REAL navigation — same pattern status-timeline.test.js pins.
async function withObservedHtml(html, holdMs, fn) {
  const browser = await launchWithRetry();
  try {
    const page = await browser.newPage();
    await installLiveRegionBirthObserver(page);
    await page.goto('data:text/html;charset=utf-8,' + encodeURIComponent(html), { waitUntil: 'load' });
    await new Promise((r) => setTimeout(r, holdMs));
    return await fn(page);
  } finally { await browser.close(); }
}

// ===================================================================================
// #35 — the SILENT-EMPTY transition: filled at 200 ms, emptied at 600 ms, nothing said.
// ===================================================================================
test('#35: fill-then-silent-empty is recorded (firstContent / lastContentText / emptiedAtMs)', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html lang="en"><body>
    <div role="status" id="st"></div>
    <script>
      setTimeout(() => { document.getElementById('st').textContent = 'Uploading the survey'; }, 200);
      setTimeout(() => { document.getElementById('st').textContent = ''; }, 600);
    </script>
  </body></html>`;
  const births = await withObservedHtml(html, 1100, (p) => readLiveRegionBirths(p, { birthWatchMs: 0 }));
  assert.ok(births && births.regions.length === 1, `one region — got ${JSON.stringify(births && births.regions)}`);
  const r = births.regions[0];
  assert.equal(r.emptyAtBirth, true);
  assert.ok(Number.isFinite(r.firstContentAtMs), 'the fill is stamped');
  assert.equal(r.lastContentText, 'Uploading the survey', 'the text that was LOST is kept');
  assert.ok(Number.isFinite(r.emptiedAtMs) && r.emptiedAtMs > r.firstContentAtMs,
    `the silent empty is stamped after the fill — got ${JSON.stringify(r)}`);
});

test('#35 polarity: a region that KEEPS its content never gets emptiedAtMs', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html lang="en"><body>
    <div role="status" id="st"></div>
    <script>
      setTimeout(() => { document.getElementById('st').textContent = 'Survey stored'; }, 200);
    </script>
  </body></html>`;
  const births = await withObservedHtml(html, 800, (p) => readLiveRegionBirths(p, { birthWatchMs: 0 }));
  const r = births.regions[0];
  assert.equal(r.lastContentText, 'Survey stored');
  assert.equal(r.emptiedAtMs, null, 'no empty transition ⇒ null (the field is the signal)');
});

// ===================================================================================
// #37 — auto-update cadence from spontaneous content changes (ticker every ~150 ms).
// ===================================================================================
test('#37: a spontaneous ticker yields contentChangesAtMs and a cadence row', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html lang="en"><body>
    <div aria-live="assertive" id="tick">reading 0</div>
    <script>
      let n = 0;
      setInterval(() => { document.getElementById('tick').textContent = 'reading ' + (++n); }, 150);
    </script>
  </body></html>`;
  const births = await withObservedHtml(html, 1000, (p) => readLiveRegionBirths(p, { birthWatchMs: 0 }));
  const r = births.regions[0];
  assert.ok(Array.isArray(r.contentChangesAtMs) && r.contentChangesAtMs.length >= 3,
    `>=3 spontaneous changes recorded — got ${JSON.stringify(r.contentChangesAtMs)}`);
  const rows = autoUpdateCadenceFrom(births);
  assert.equal(rows.length, 1, `one cadence row — got ${JSON.stringify(rows)}`);
  assert.equal(rows[0].ariaLive, 'assertive', 'politeness rides with the cadence (the 4.1.3 question)');
  assert.ok(rows[0].medianIntervalMs >= 50 && rows[0].medianIntervalMs <= 600,
    `median interval is the ticker's ~150 ms — got ${rows[0].medianIntervalMs}`);
  assert.ok(rows[0].spanMs > 0 && rows[0].updateCount >= 3);
});

test('#37 polarity: changes AFTER the harness-interaction boundary never count as cadence', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html lang="en"><body>
    <div aria-live="polite" id="tick">reading 0</div>
    <script>
      let n = 0;
      setInterval(() => { document.getElementById('tick').textContent = 'reading ' + (++n); }, 150);
    </script>
  </body></html>`;
  const browser = await launchWithRetry();
  try {
    const page = await browser.newPage();
    await installLiveRegionBirthObserver(page);
    await page.goto('data:text/html;charset=utf-8,' + encodeURIComponent(html), { waitUntil: 'load' });
    // F7 (soundness review 2026-08-17): the boundary is now stamped LAZILY, by the first REAL
    // click/keydown/input the armed watch observes — arming alone (markLiveBirthHarnessActive) no longer
    // stamps anything. So a real interaction (a body click; nothing on the page listens for it, it exists
    // purely to cross the boundary) has to land before the boundary can do its job.
    await markLiveBirthHarnessActive(page);            // ARMS the watch — does not itself stamp
    await page.evaluate(() => document.body.click());  // the harness's first interaction — stamps NOW
    await new Promise((r) => setTimeout(r, 1000));
    const births = await readLiveRegionBirths(page, { birthWatchMs: 0 });
    const rows = autoUpdateCadenceFrom(births);
    assert.equal(rows.length, 0, `post-boundary changes are the lane's own — no cadence row: ${JSON.stringify(rows)}`);
  } finally { await browser.close(); }
});

// ===================================================================================
// F7 (soundness review 2026-08-17) — the fix itself: arming the watch does NOT, on its own, stamp the
// boundary. Before the fix `markLiveBirthHarnessActive` stamped EAGERLY (just by being called, no
// interaction required), so any block that spent time scanning before it clicked anything — or that never
// clicked anything at all — still tagged every later spontaneous birth as harness-caused. Two-polarity per
// the review: a delayed spontaneous birth with NO harness click ever preceding it must stay UNTAGGED
// (this test); a birth that follows a real click stays tagged (the existing HARNESS ATTRIBUTION tests in
// status-timeline.test.js already cover that side, and continue to pass unmodified under the new lazy
// stamp because they already perform a real click after arming).
// ===================================================================================
test('F7: arming the watch alone never stamps the boundary — a later spontaneous birth with no interaction stays UNTAGGED', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html lang="en"><body>
    <script>
      setTimeout(() => {
        const s = document.createElement('div');
        s.setAttribute('role', 'status');
        s.textContent = 'Delayed spontaneous update, no click involved';
        document.body.appendChild(s);
      }, 2000);
    </script>
  </body></html>`;
  const browser = await launchWithRetry();
  try {
    const page = await browser.newPage();
    await installLiveRegionBirthObserver(page);
    await page.goto('data:text/html;charset=utf-8,' + encodeURIComponent(html), { waitUntil: 'load' });
    await markLiveBirthHarnessActive(page);   // ARM immediately after load — no click/keydown/input EVER follows
    await new Promise((r) => setTimeout(r, 2400));   // past the 2s spontaneous timer
    const births = await readLiveRegionBirths(page, { birthWatchMs: 0 });
    assert.ok(births && births.installed);
    assert.equal(births.harnessActiveAtMs, null,
      'arming alone never stamps the boundary — only a real interaction does (the F7 fix)');
    const spont = births.regions.find((r) => /Delayed spontaneous/i.test(r.textAtBirth || ''));
    assert.ok(spont && spont.harnessInteraction !== true,
      `the spontaneous birth stays UNTAGGED despite the watch being armed the whole time — ${JSON.stringify(births.regions)}`);
    const rows = birthFindingsFrom(births);
    assert.equal(rows.length, 1, `the untagged birth still earns its 4.1.3 review row — got ${JSON.stringify(rows)}`);
  } finally { await browser.close(); }
});

// ===================================================================================
// #37 — pure math (no browser): thresholds, boundary filter, median, truncation flag.
// ===================================================================================
test('#37 pure: fewer than 3 spontaneous changes ⇒ no row; boundary filters; median + truncated ride', () => {
  const mk = (ts, extra = {}, harnessAt = null) => ({ harnessActiveAtMs: harnessAt, regions: [{ xpath: '/html/body/div[1]', role: 'status', ariaLive: null, contentChangesAtMs: ts, ...extra }] });
  assert.equal(autoUpdateCadenceFrom(null).length, 0);
  assert.equal(autoUpdateCadenceFrom(mk([100, 300])).length, 0, 'two changes is not a cadence');
  const one = autoUpdateCadenceFrom(mk([100, 300, 500, 900]));
  assert.equal(one.length, 1);
  assert.equal(one[0].updateCount, 4);
  assert.equal(one[0].spanMs, 800);
  assert.equal(one[0].medianIntervalMs, 200, 'intervals 200,200,400 ⇒ median 200');
  assert.ok(!('truncated' in one[0]));
  const trunc = autoUpdateCadenceFrom(mk([1, 2, 3, 4], { contentChangesTruncated: true }));
  assert.equal(trunc[0].truncated, true);
  // boundary: only the changes BEFORE harnessActiveAtMs are spontaneous
  assert.equal(autoUpdateCadenceFrom(mk([100, 300, 500], {}, 400)).length, 0, 'one post-boundary change filtered ⇒ under threshold');
  assert.equal(autoUpdateCadenceFrom(mk([100, 300, 500, 700], {}, 650)).length, 1, 'three pre-boundary changes still qualify');
});
