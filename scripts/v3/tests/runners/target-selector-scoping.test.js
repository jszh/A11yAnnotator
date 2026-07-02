// #11 fix — a corpus eval harness (eval/trusted-tester/run-trusted-tester.js) whose ground-truth record names a
// specific `target.selector` (the exact element(s) that test is actually about) used to score by SC alone: any
// unrelated finding elsewhere on the page under the same success criterion silently counted against a record it
// had nothing to do with. Confirmed live on a real DHS Trusted-Tester page: an unlabeled textbox flipped a
// LIST-markup test's outcome to a false positive, even though the list itself was correctly coded. Fixed by
// tagging each collected element with `matchesTarget` (via `element.matches()`, computed live during collection —
// works identically for a top-document or in-frame element) when the caller supplies `opts.targetSelectors`, then
// filtering `collect.elements` to matched elements BEFORE orchestrate() ever mints an obligation or spends an LLM
// call — fixing scoring precision and avoiding wasted compute on elements that would never be scored anyway.
'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const chromeOK = fs.existsSync(CHROME);

const { orchestrate, BROWSER_ARGS } = require('../../lib/orchestrator.js');
const { createTabAllocator } = require('../../lib/tab-allocator.js');
const { collectActPage, normalizeCollectRoles } = require('../../lib/act-page-collect.js');

const PAGE = `<!doctype html><html><body>
<ul class="target-list"><li>Alpha</li><li>Beta</li></ul>
<input id="unrelated-field" type="text">
<button id="also-unrelated">Click</button>
</body></html>`;

function writeFixture(dirName, files) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), dirName));
  for (const [name, content] of Object.entries(files)) fs.writeFileSync(path.join(tmp, name), content);
  return tmp;
}

async function collect(url, opts) {
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: BROWSER_ARGS });
  try {
    const alloc = createTabAllocator({ browser, maxTabs: 2 });
    const lease = await alloc.acquire();
    let out;
    try { out = normalizeCollectRoles(await collectActPage(lease.page, { url, elementCap: 40, file: 'p', runId: 'p', sourceUrl: url, autoUpdateWindowMs: 0, ...opts })); }
    finally { await lease.release(); await alloc.close(); }
    return out;
  } finally {
    await browser.close().catch(() => {});
  }
}

test('target-selector-scoping #11 FIX: a single-selector target tags the matching element true and everything else false', { skip: !chromeOK, concurrency: false }, async () => {
  const tmp = writeFixture('target-sel-', { 'index.html': PAGE });
  const out = await collect('file://' + path.join(tmp, 'index.html'), { targetSelectors: 'ul.target-list' });
  const list = (out.elements || []).find((e) => e.tag === 'ul');
  const others = (out.elements || []).filter((e) => e.tag !== 'ul');
  assert.equal(list.matchesTarget, true, 'the target-selector element is tagged true');
  assert.ok(others.length > 0, 'other elements were still collected (not dropped at collection time)');
  assert.ok(others.every((e) => e.matchesTarget === false), 'every non-target element is tagged false');
});

test('target-selector-scoping #11 FIX: an array of selectors (the testcases.json target.selector shape) is joined and matched correctly', { skip: !chromeOK, concurrency: false }, async () => {
  const tmp = writeFixture('target-sel-arr-', { 'index.html': PAGE });
  const out = await collect('file://' + path.join(tmp, 'index.html'), { targetSelectors: ['ul.target-list', '#unrelated-field'] });
  const list = (out.elements || []).find((e) => e.tag === 'ul');
  const field = (out.elements || []).find((e) => e.tag === 'input');
  const button = (out.elements || []).find((e) => e.tag === 'button');
  assert.equal(list.matchesTarget, true);
  assert.equal(field.matchesTarget, true, 'a second array entry also matches');
  assert.equal(button.matchesTarget, false, 'an element matching NEITHER array entry stays false');
});

test('target-selector-scoping #11 REGRESSION GUARD: no targetSelectors opt ⇒ matchesTarget stays undefined on every element (byte-identical to before this fix)', { skip: !chromeOK, concurrency: false }, async () => {
  const tmp = writeFixture('target-sel-none-', { 'index.html': PAGE });
  const out = await collect('file://' + path.join(tmp, 'index.html'), {});
  assert.ok((out.elements || []).length > 0);
  assert.ok((out.elements || []).every((e) => e.matchesTarget === undefined), 'matchesTarget is never computed unless targetSelectors was supplied');
});

test('target-selector-scoping #11 REGRESSION GUARD: matchesTarget also resolves correctly for an in-frame element', { skip: !chromeOK, concurrency: false }, async () => {
  const FRAME_MAIN = `<!doctype html><html><body><ul class="target-list"><li>Alpha</li></ul><input id="unrelated-field"></body></html>`;
  const FRAMESET_INDEX = `<!doctype html><html><frameset rows="*,50px"><frame src="frame-main.html"><frame src="frame-footer.html"></frameset></html>`;
  const FRAME_FOOTER = `<!doctype html><html><body></body></html>`;
  const tmp = writeFixture('target-sel-frame-', { 'index.html': FRAMESET_INDEX, 'frame-main.html': FRAME_MAIN, 'frame-footer.html': FRAME_FOOTER });
  const out = await collect('file://' + path.join(tmp, 'index.html'), { targetSelectors: 'ul.target-list' });
  const inFrameEls = (out.elements || []).filter((e) => e.inFrame);
  const list = inFrameEls.find((e) => e.tag === 'ul');
  const field = inFrameEls.find((e) => e.tag === 'input');
  assert.ok(list, 'the in-frame <ul> was collected');
  assert.equal(list.matchesTarget, true, 'element.matches() resolves correctly for an in-frame element too');
  assert.equal(field && field.matchesTarget, false);
});
