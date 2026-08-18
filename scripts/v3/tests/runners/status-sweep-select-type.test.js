// Batch-3 #33 (drive select-change in the status activation sweep) + #34b (bounded generic type-probe
// into textareas/contenteditables near live regions). Invented inline fixtures only (nothing
// corpus-derived); two polarities per item. Gated on a local Chrome like the other instrument suites.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const puppeteer = require('puppeteer');
const { detectStatusMessages } = require('../../lib/status-detector.js');
const { CHROME } = require('../../lib/run-experiments.js');

const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — status-sweep-select-type suite SKIPPED');

async function launchWithRetry() {
  let lastErr;
  for (let i = 0; i < 3; i++) {
    try { return await puppeteer.launch({ executablePath: CHROME, headless: 'new', timeout: 60000, args: ['--no-sandbox', '--disable-dev-shm-usage'] }); }
    catch (e) { lastErr = e; if (!/WS endpoint|Timed out/i.test(String(e && e.message))) throw e; }
  }
  throw lastErr;
}

async function withHtml(html, fn) {
  const browser = await launchWithRetry();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    return await fn(page);
  } finally { await browser.close(); }
}

// ===================================================================================
// #33 — SELECT-CHANGE. A save-on-change select that writes into a live region is now
// DRIVEN (it was untestable before: no click opens a native dropdown from script).
// ===================================================================================
test('#33: a save-on-change select writing into a live region is driven and observed (no barrier)', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html lang="en"><body>
    <label for="lane">Shipping lane</label>
    <select id="lane" aria-label="Shipping lane">
      <option>Coastal</option><option>Overland</option><option>Air</option>
    </select>
    <span role="status" id="saved"></span>
    <script>
      document.getElementById('lane').addEventListener('change', () => {
        document.getElementById('saved').textContent = 'Preference saved';
      });
    </script>
  </body></html>`;
  const r = await withHtml(html, (p) => detectStatusMessages(p, {}));
  assert.equal(r.triggersTotal, 1, `the select IS a trigger — got ${JSON.stringify({ total: r.triggersTotal, probed: r.triggersProbed })}`);
  assert.equal(r.observations.length, 1, `the change was observed — got ${JSON.stringify(r.observations)}`);
  const o = r.observations[0];
  assert.equal(o.interaction, 'change', 'the observation names the interaction honestly');
  assert.ok(o.addedInsideLiveRegion.some((t) => /Preference saved/.test(t)) || o.regionsUpdated.some((u) => /Preference saved/.test(u.after)),
    `the saved-status reached deterministic evidence — got ${JSON.stringify(o)}`);
  assert.equal(r.findings.length, 0, 'an in-region announcement mints no barrier');
});

test('#33: a select-change status OUTSIDE any live region mints the classic 4.1.3 barrier', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html lang="en"><body>
    <select id="lane" aria-label="Shipping lane">
      <option>Coastal</option><option>Overland</option>
    </select>
    <div id="saved"></div>
    <script>
      document.getElementById('lane').addEventListener('change', () => {
        document.getElementById('saved').textContent = 'Preference saved to the manifest';
      });
    </script>
  </body></html>`;
  const r = await withHtml(html, (p) => detectStatusMessages(p, {}));
  assert.equal(r.findings.length, 1, `barrier minted — got ${JSON.stringify(r.findings)}`);
  assert.equal(r.findings[0].kind, 'status-not-announced');
});

test('#33 polarity: a jump-menu select (onchange navigates) is EXCLUDED from the trigger set', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html lang="en"><body>
    <select id="jump" aria-label="Go to section" onchange="location.href=this.value">
      <option value="#a">Almanac</option><option value="#b">Bulletins</option>
    </select>
  </body></html>`;
  const r = await withHtml(html, (p) => detectStatusMessages(p, {}));
  assert.equal(r.triggersTotal, 0, `the jump menu is never driven — got ${JSON.stringify({ total: r.triggersTotal })}`);
  assert.ok(!r.sweepAborted, 'nothing navigated');
});

// ===================================================================================
// F8 (soundness review 2026-08-17) — the STATIC pre-filter above (isSafe) only reads the `onchange`
// ATTRIBUTE, so a jump menu wired via addEventListener is invisible to it and DOES enter the trigger set.
// Two-polarity: this listener-based jump menu must be driven-but-INTERCEPTED (the sweep survives, the
// lane page never actually navigates); the ordinary non-navigating select two tests above stays observed
// exactly as before (unaffected — the new guard only ever fires when a real unload is attempted).
// ===================================================================================
test('F8: a LISTENER-based jump menu (addEventListener writes location) is intercepted — the sweep survives and the page never navigates', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html lang="en"><body>
    <select id="jump" aria-label="Go to section">
      <option value="">Choose a section</option>
      <option value="https://example.invalid/a">Almanac</option>
      <option value="https://example.invalid/b">Bulletins</option>
    </select>
    <script>
      // A listener-based jump menu — invisible to the STATIC inline-onchange pre-filter above (isSafe()
      // only inspects the onchange ATTRIBUTE), so this select IS admitted to the trigger set and driven.
      document.getElementById('jump').addEventListener('change', function (e) {
        if (e.target.value) window.location = e.target.value;
      });
    </script>
  </body></html>`;
  const browser = await launchWithRetry();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    const before = page.url();
    const r = await detectStatusMessages(page, {});
    assert.equal(r.triggersTotal, 1, `the listener-based jump menu IS a trigger — the static pre-filter cannot see it — got ${JSON.stringify({ total: r.triggersTotal })}`);
    assert.equal(r.triggersProbed, 1, `it was driven, not skipped — got ${JSON.stringify({ probed: r.triggersProbed })}`);
    assert.ok(!r.sweepAborted, `the sweep survived the navigation attempt — got ${JSON.stringify(r.sweepAborted)}`);
    assert.equal(page.url(), before, `the beforeunload guard kept the lane page in place — before=${before} after=${page.url()}`);
  } finally { await browser.close(); }
});

test('#33 polarity: a single-option select has nothing to change to and is not a trigger', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html lang="en"><body>
    <select id="only" aria-label="Region"><option>North</option></select>
  </body></html>`;
  const r = await withHtml(html, (p) => detectStatusMessages(p, {}));
  assert.equal(r.triggersTotal, 0);
});

// ===================================================================================
// #34b — TYPE PROBE. Typing is a status trigger (counters, remaining-length warnings);
// bounded, generic probe string, gated on a live region near the field.
// ===================================================================================
test('#34b: typing into a textarea near a live-region counter is driven and observed', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html lang="en"><body>
    <section>
      <label for="memo">Delivery memo</label>
      <textarea id="memo" maxlength="60"></textarea>
      <p role="status" id="meter">60 characters left</p>
    </section>
    <script>
      document.getElementById('memo').addEventListener('input', (e) => {
        document.getElementById('meter').textContent = (60 - e.target.value.length) + ' characters left';
      });
    </script>
  </body></html>`;
  const r = await withHtml(html, (p) => detectStatusMessages(p, {}));
  assert.equal(r.triggersTotal, 1, `the textarea IS a (type) trigger — got ${r.triggersTotal}`);
  const o = r.observations[0];
  assert.ok(o, `the typing produced an observation — got ${JSON.stringify(r.observations)}`);
  assert.equal(o.interaction, 'type');
  assert.ok(o.regionsUpdated.some((u) => /characters left/.test(u.after)), `the counter update is recorded — got ${JSON.stringify(o)}`);
  // the harness's own focus() into the field must never read as a change of context
  assert.equal(o.focusMoved, false, 'the probe\'s own focus() is not a page-caused focus move');
  assert.equal(r.findings.length, 0, 'an in-region counter mints no barrier');
});

test('#34b: a contenteditable field is probed; the probe\'s own text never leaks into the evidence', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html lang="en"><body>
    <form>
      <div id="note" contenteditable="true" aria-label="Field notes"></div>
      <output id="save"></output>
    </form>
    <script>
      document.getElementById('note').addEventListener('input', () => {
        document.getElementById('save').textContent = 'Draft stored locally';
      });
    </script>
  </body></html>`;
  const r = await withHtml(html, (p) => detectStatusMessages(p, {}));
  assert.equal(r.triggersTotal, 1, 'the contenteditable IS a (type) trigger');
  const o = r.observations[0];
  assert.ok(o, `observation exists — got ${JSON.stringify(r.observations)}`);
  assert.ok(o.addedInsideLiveRegion.some((t) => /Draft stored/.test(t)) || o.regionsUpdated.some((u) => /Draft stored/.test(u.after)),
    `the page's RESPONSE is observed — got ${JSON.stringify(o)}`);
  const all = JSON.stringify([o.addedInsideLiveRegion, o.addedOutsideLiveRegion, o.regionsUpdated]);
  assert.ok(!/sample entry text/.test(all), 'the harness\'s own probe string is excluded (trigger-contained)');
  assert.equal(r.findings.length, 0);
});

test('#34b leak guard: a contenteditable INSIDE a live region is never type-probed — the probe text would become the region\'s own prompt-bound content', { skip: !chromeOK, concurrency: false }, async () => {
  // The ancestor topology the sibling-topology test above cannot see (batch-3 leakage review,
  // finding 2): a live-region wrapper containing the editable field. Probing it would land the
  // probe string verbatim in regionsUpdated[].after / mutatedFragment.
  const html = `<!doctype html><html lang="en"><body>
    <section role="status" id="wrap">
      <div id="draft" contenteditable="true" aria-label="Reply draft"></div>
    </section>
  </body></html>`;
  const r = await withHtml(html, (p) => detectStatusMessages(p, {}));
  assert.equal(r.triggersTotal, 0, 'a field inside a live region is skipped by the type-probe gate');
  const all = JSON.stringify(r.observations || []);
  assert.ok(!/sample entry text/.test(all), 'no probe text anywhere in evidence');
});

test('#34b polarity: a textarea with NO live region near it is never type-probed (the gate)', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html lang="en"><body>
    <textarea id="memo" aria-label="Notes"></textarea>
    <div id="mirror"></div>
    <script>
      document.getElementById('memo').addEventListener('input', (e) => {
        document.getElementById('mirror').textContent = e.target.value;
      });
    </script>
  </body></html>`;
  const r = await withHtml(html, (p) => detectStatusMessages(p, {}));
  assert.equal(r.triggersTotal, 0, 'no live region near ⇒ no type probe (a plain page never pays)');
  assert.equal(r.observations.length, 0);
});

test('#34b polarity: readonly/disabled fields are never typed into; the probe cap holds at 3', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html lang="en"><body>
    <section>
      <div role="status" id="st"></div>
      <textarea id="a" aria-label="a"></textarea>
      <textarea id="b" aria-label="b"></textarea>
      <textarea id="c" aria-label="c"></textarea>
      <textarea id="d" aria-label="d"></textarea>
      <textarea id="ro" aria-label="ro" readonly></textarea>
      <textarea id="dis" aria-label="dis" disabled></textarea>
    </section>
  </body></html>`;
  const r = await withHtml(html, (p) => detectStatusMessages(p, {}));
  assert.equal(r.triggersTotal, 3, `bounded at 3 and readonly/disabled excluded — got ${r.triggersTotal}`);
});

// ===================================================================================
// F15 (soundness review round 2) — the type-probe's appended "sample entry text" (or contenteditable
// text node) used to be left on the page FOREVER: nothing ever restored the field. The #34b leak-guard
// tests above only prove the probe text stays OUT of the returned evidence; these prove the probe text is
// gone from the PAGE ITSELF once the sweep finishes — no residue survives for a screenshot, a later
// instrument, or a human reading the DOM to find.
// ===================================================================================
test('F15: a typed-into textarea is restored to its ORIGINAL value after the sweep — no probe residue on the page', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html lang="en"><body>
    <div role="status" id="counter"></div>
    <textarea id="bio" aria-label="Short bio">Loves long walks by the canal</textarea>
    <script>
      document.getElementById('bio').addEventListener('input', (e) => {
        document.getElementById('counter').textContent = e.target.value.length + ' characters';
      });
    </script>
  </body></html>`;
  const { r, valueAfter } = await withHtml(html, async (p) => {
    const res = await detectStatusMessages(p, {});
    const val = await p.evaluate(() => document.getElementById('bio').value);
    return { r: res, valueAfter: val };
  });
  assert.equal(r.triggersTotal, 1, 'the textarea is a type trigger');
  assert.ok(r.observations.length === 1 && r.observations[0].addedInsideLiveRegion.some((t) => /characters/.test(t)),
    `the page's response was still observed while the probe text was live — got ${JSON.stringify(r.observations)}`);
  assert.equal(valueAfter, 'Loves long walks by the canal',
    `the field is restored to its ORIGINAL value, probe text fully removed — got ${JSON.stringify(valueAfter)}`);
});

test('F15: a probed contenteditable field is restored — the appended probe text node is gone afterward', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html lang="en"><body>
    <form>
      <div id="note" contenteditable="true" aria-label="Field notes">Existing note text</div>
      <output id="save"></output>
    </form>
    <script>
      document.getElementById('note').addEventListener('input', () => {
        document.getElementById('save').textContent = 'Draft stored locally';
      });
    </script>
  </body></html>`;
  const { r, textAfter, htmlAfter } = await withHtml(html, async (p) => {
    const res = await detectStatusMessages(p, {});
    const text = await p.evaluate(() => document.getElementById('note').textContent);
    const inner = await p.evaluate(() => document.getElementById('note').innerHTML);
    return { r: res, textAfter: text, htmlAfter: inner };
  });
  assert.equal(r.triggersTotal, 1, 'the contenteditable is a type trigger');
  assert.equal(textAfter, 'Existing note text', `the ORIGINAL text is intact, the appended probe node is gone — got ${JSON.stringify(textAfter)}`);
  assert.ok(!/sample entry text/.test(htmlAfter), `no probe residue anywhere in the field's markup — got ${JSON.stringify(htmlAfter)}`);
});
