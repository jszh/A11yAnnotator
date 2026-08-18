// Batch-3 #17 (accname-voiced provenance) + #34a (atomic:false mutatedFragment) — the two new
// observation-object fields the 4.1.3 rubric's new clauses read. Invented inline fixtures only (nothing
// corpus-derived); two polarities per item; extends the status-timeline test pattern. Gated on a local
// Chrome like the other instrument suites.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const puppeteer = require('puppeteer');
const { detectStatusMessages } = require('../../lib/status-detector.js');
const { CHROME } = require('../../lib/run-experiments.js');

const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — status-observation-provenance suite SKIPPED');

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
// #17 — an accname-only insertion (svg[role=img][aria-label]) carries provenance:
// {viaAccName, tag, role, lang} + documentLang, so the rubric can see a bare symbol
// name was voiced (possibly in the wrong language) rather than an ordinary outcome word.
// ===================================================================================
test('#17: svg aria-label insertion into a live region carries accNameVoiced provenance + documentLang', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html lang="fr"><body>
    <button id="go">Envoyer la demande</button>
    <div id="st" aria-live="polite"></div>
    <script>
      document.getElementById('go').addEventListener('click', () => {
        const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        s.setAttribute('role', 'img');
        s.setAttribute('aria-label', 'check');
        document.getElementById('st').appendChild(s);
      });
    </script>
  </body></html>`;
  const r = await withHtml(html, (p) => detectStatusMessages(p, {}));
  assert.equal(r.observations.length, 1, `one observation — got ${JSON.stringify(r.observations)}`);
  const o = r.observations[0];
  assert.ok(o.addedInsideLiveRegion.some((t) => /check/i.test(t)), 'the accname is voiced into the in-region channel');
  assert.ok(Array.isArray(o.accNameVoiced) && o.accNameVoiced.length === 1, `provenance present — got ${JSON.stringify(o.accNameVoiced)}`);
  const p0 = o.accNameVoiced[0];
  assert.equal(p0.text, 'check');
  assert.equal(p0.viaAccName, true);
  assert.equal(p0.tag, 'svg');
  assert.equal(p0.role, 'img');
  assert.equal(p0.lang, 'fr', 'no own lang override ⇒ the nearest [lang] is the document');
  assert.equal(o.documentLang, 'fr');
  // sound: an in-region accname insertion is the rubric's call, never a deterministic barrier
  assert.equal(r.findings.length, 0, 'no barrier minted for an in-region announcement');
});

test('#17: a carrier with its own lang records the OVERRIDE, documentLang stays the page', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html lang="en"><body>
    <button id="go">Fetch the ledger</button>
    <div id="st" role="status"></div>
    <script>
      document.getElementById('go').addEventListener('click', () => {
        const s = document.createElement('span');
        s.setAttribute('aria-label', 'fertig');
        s.setAttribute('lang', 'de');
        document.getElementById('st').appendChild(s);
      });
    </script>
  </body></html>`;
  const r = await withHtml(html, (p) => detectStatusMessages(p, {}));
  const o = r.observations[0];
  assert.ok(o && Array.isArray(o.accNameVoiced) && o.accNameVoiced.length, `provenance present — got ${JSON.stringify(o)}`);
  assert.equal(o.accNameVoiced[0].lang, 'de', 'the carrier\'s own lang wins');
  assert.equal(o.documentLang, 'en');
});

test('#17 polarity: a plain-TEXT status leaves the observation byte-identical (no accNameVoiced key)', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html lang="en"><body>
    <button id="go">Refresh totals</button>
    <div id="st" role="status"></div>
    <script>
      document.getElementById('go').addEventListener('click', () => {
        document.getElementById('st').textContent = 'Totals are current';
      });
    </script>
  </body></html>`;
  const r = await withHtml(html, (p) => detectStatusMessages(p, {}));
  const o = r.observations[0];
  assert.ok(o, 'the observation exists');
  assert.ok(!('accNameVoiced' in o), 'no provenance key on a text-only page (prompt byte-identity)');
  assert.ok(!('documentLang' in o), 'documentLang rides ONLY with provenance');
  assert.ok(!('interaction' in o), 'click-driven observations carry no interaction key');
});

// ===================================================================================
// #34a — atomic:false regionsUpdated carries the MUTATED sub-node's text as mutatedFragment
// (what a non-atomic region actually voices), while `after` keeps the whole-region text.
// ===================================================================================
test('#34a: atomic:false region update carries mutatedFragment (the sub-node), after keeps the whole', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html lang="en"><body>
    <button id="go">Recount the shelf</button>
    <p aria-live="polite"><span>Books on the shelf:</span> <b id="n">14</b></p>
    <script>
      document.getElementById('go').addEventListener('click', () => {
        document.getElementById('n').textContent = '15';
      });
    </script>
  </body></html>`;
  const r = await withHtml(html, (p) => detectStatusMessages(p, {}));
  const o = r.observations[0];
  assert.ok(o && o.regionsUpdated.length === 1, `one region update — got ${JSON.stringify(o)}`);
  const u = o.regionsUpdated[0];
  assert.equal(u.atomic, false);
  assert.match(u.after, /Books on the shelf: 15/);
  assert.equal(u.mutatedFragment, '15', `only the mutated node is voiced — got ${JSON.stringify(u)}`);
});

test('#34a polarity: aria-atomic=true region update carries NO mutatedFragment key', { skip: !chromeOK, concurrency: false }, async () => {
  const html = `<!doctype html><html lang="en"><body>
    <button id="go">Recount the shelf</button>
    <p aria-live="polite" aria-atomic="true"><span>Books on the shelf:</span> <b id="n">14</b></p>
    <script>
      document.getElementById('go').addEventListener('click', () => {
        document.getElementById('n').textContent = '15';
      });
    </script>
  </body></html>`;
  const r = await withHtml(html, (p) => detectStatusMessages(p, {}));
  const o = r.observations[0];
  assert.ok(o && o.regionsUpdated.length === 1, `one region update — got ${JSON.stringify(o)}`);
  const u = o.regionsUpdated[0];
  assert.equal(u.atomic, true);
  assert.ok(!('mutatedFragment' in u), 'an atomic region voices the whole — no fragment key (byte-identity)');
});
