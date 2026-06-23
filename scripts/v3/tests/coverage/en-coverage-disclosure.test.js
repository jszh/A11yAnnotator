'use strict';
// EN 301 549 V4.1.0 Annex C.9.6.2 "Full pages": the collector's element cap truncates collection, so a page-clear
// covers ONLY the collected prefix — a barrier past the cap is unseen by every v3 lane. The build must DISCLOSE the
// truncation (collect.coverage + build.coverage + summary.coverageTruncated) so a clear is never read as a full-page
// conformance claim — the harness's "never a false clear" rail, applied at PAGE scope.
// (docs/reference/standards/en301549/EN301549-ANNEX-C-ANALYSIS.md §4a)
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'); const os = require('node:os'); const path = require('node:path');
const puppeteer = require('puppeteer');
const { buildV3 } = require('../../lib/build-v3.js');
const { withPipeline, promoted } = require('../helpers.js');
const { collectActPage } = require('../../lib/act-page-collect.js');

const PROMOTED = promoted(['focus-visual-retry/NO_BARRIER_OBSERVED', 'focus-visual-retry/BARRIER_OBSERVED']);
const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const chromeOK = fs.existsSync(CHROME);
if (!chromeOK) console.log('# Chrome not found — EN collector-truncation test SKIPPED');

const bundleWith = (collectExtra, elements) => ({
  collect: { file: 'p', runId: 'R', pageDigest: 'sha256:d', collectedAt: 1000, elements, ...collectExtra },
  experiments: { file: 'p', runId: 'R', pageDigest: 'sha256:d', catalogVersion: '3.0.0-phase0', startedAt: 2000, results: [] },
  claimProposals: { file: 'p', runId: 'R', pageDigest: 'sha256:d', proposals: [] },
});

test('EN C.9.6.2: a truncated collect surfaces coverage.truncated + summary.coverageTruncated', () => {
  const r = buildV3(withPipeline(bundleWith({ coverage: { truncated: true, collected: 80, domElementCount: 200, cap: 80 } }, [{ xpath: 'node:b1', focusable: true }])), { authority: PROMOTED });
  assert.equal(r.results.coverage.truncated, true);
  assert.equal(r.results.coverage.collected, 80);
  assert.equal(r.results.coverage.domElementCount, 200);
  assert.equal(r.results.summary.coverageTruncated, true);
  assert.match(r.results.coverage.note, /full-pages|cap/i);
});

test('EN C.9.6.2: an untruncated collect reports coverage.truncated:false (no false disclosure)', () => {
  const r = buildV3(withPipeline(bundleWith({ coverage: { truncated: false } }, [{ xpath: 'node:b1', focusable: true }])), { authority: PROMOTED });
  assert.equal(r.results.coverage.truncated, false);
  assert.equal(r.results.summary.coverageTruncated, false);
});

test('EN C.9.6.2: a collect with NO coverage field defaults to untruncated (back-compat)', () => {
  const r = buildV3(withPipeline(bundleWith({}, [{ xpath: 'node:b1', focusable: true }])), { authority: PROMOTED });
  assert.equal(r.results.coverage.truncated, false);
  assert.equal(r.results.summary.coverageTruncated, false);
});

test('EN C.9.6.2: the collector flags truncation on a >cap page; a barrier past the cap is unseen (now disclosed)', { skip: !chromeOK, concurrency: false }, async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage();
    let body = ''; for (let i = 1; i <= 100; i++) body += (i === 95) ? '<div role="button" tabindex="0" data-planted="1"></div>' : `<button>btn ${i}</button>`;
    const tmp = path.join(os.tmpdir(), 'en-fullpage-cap.html');
    fs.writeFileSync(tmp, `<!doctype html><meta charset=utf-8><title>cap</title><body>${body}</body>`);
    const collect = await collectActPage(page, { url: 'file://' + tmp, file: 'cap', runId: 't' });
    assert.equal(collect.coverage.truncated, true, 'a 100-element page truncates at the 80 cap');
    assert.equal(collect.coverage.collected, 80);
    assert.ok(collect.coverage.domElementCount >= 100, 'the total DOM size is recorded');
    // the planted barrier at #95 is NOT in the collected set — exactly the EN full-pages hole the disclosure flags.
    const sawPlanted = await page.evaluate((xps) => xps.some((xp) => { try { const n = document.evaluate(xp.split('>>')[0], document, null, 9, null).singleNodeValue; return !!(n && n.getAttribute('data-planted') === '1'); } catch (e) { return false; } }), collect.elements.map((e) => e.xpath));
    assert.equal(sawPlanted, false, 'the planted barrier past the cap is invisible to the collector — now disclosed (coverage.truncated), not silently cleared');
  } finally { await browser.close(); }
});

test('Pre-selected subset (saved pages): collect EXACTLY the given xpaths — past the cap, structural, hidden — and report subset/untruncated', { skip: !chromeOK, concurrency: false }, async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage();
    let body = '<div id="wrapper" style="padding:1px"></div>'; // structural div — body scan would EXCLUDE it
    for (let i = 1; i <= 100; i++) body += `<button id="b${i}">btn ${i}</button>`;
    body += '<button id="deep" style="display:none">hidden</button>'; // hidden — body scan would EXCLUDE it
    const tmp = path.join(os.tmpdir(), 'en-subset.html');
    fs.writeFileSync(tmp, `<!doctype html><meta charset=utf-8><title>s</title><body>${body}</body>`);
    await page.goto('file://' + tmp, { waitUntil: 'load' });
    const xpOf = (id) => `(function(){var e=document.getElementById(${JSON.stringify(id)});var p=[];for(var n=e;n&&n.nodeType===1;n=n.parentElement){var i=1;for(var s=n.previousElementSibling;s;s=s.previousElementSibling)if(s.tagName===n.tagName)i++;p.unshift(n.tagName.toLowerCase()+'['+i+']');}return '/'+p.join('/');})()`;
    const ids = ['wrapper', 'b95', 'b100', 'deep']; // structural + two past the cap + hidden
    const xpaths = [];
    for (const id of ids) xpaths.push(await page.evaluate(`(${xpOf(id)})`));
    const collect = await collectActPage(page, { url: 'file://' + tmp, file: 's', runId: 't', xpaths });
    assert.equal(collect.elementCount, ids.length, 'collected EXACTLY the subset (no cap, no inclusion/visibility filter)');
    assert.equal(collect.coverage.subset, true);
    assert.equal(collect.coverage.truncated, false, 'a subset is the complete selection — never truncated');
    const got = (await page.evaluate((xps) => xps.map((x) => { try { const n = document.evaluate(x, document, null, 9, null).singleNodeValue; return n ? n.id : null; } catch (e) { return null; } }), collect.elements.map((e) => e.xpath))).sort();
    assert.deepEqual(got, ['b100', 'b95', 'deep', 'wrapper'], 'incl. a past-cap button, a structural div, and a display:none button — all the body scan would have dropped');
  } finally { await browser.close(); }
});
