// #2 FP/FN fix — frame-sourced structural signals (headings/lists/tables). A legacy HTML4 frameset page's real
// content — and its headings/lists/tables — live in a child <frame>, never the bare top-level document. Before
// this fix, collectActPage's structure.headings/lists/tables were computed via `document.querySelectorAll(...)`
// against the TOP document ONLY (a separate frame-traversal loop existed but only fed interactive elements, not
// structure), so a frameset page's real <h1>/<ul>/<table> never reached the info-relationships-v0 rubric — it
// judged an apparently-empty page and (in the real DHS Trusted-Tester corpus) wrongly claimed "no programmatic
// headings or lists" on a page that had both. This pins the fix on a small self-contained frameset fixture (no
// dependency on the gitignored refs/DHS-Trusted-Tester-examples/ corpus) plus a non-framed counter-case, so a
// regression in either direction (frame content still missed, or a non-framed page's own headings/lists/tables
// double-counted / broken) fails HERE.
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

const FRAME_MAIN = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>frame content</title></head><body>
<h1>Section One</h1>
<ul class="real-list"><li>Alpha</li><li>Beta</li><li>Gamma</li></ul>
<table><tr><th>Rank</th><td>First</td><td>Second</td></tr><tr><th>Name</th><td>Ann</td><td>Bo</td></tr></table>
</body></html>`;
const FRAMESET_INDEX = `<!doctype html><html><head><title>frameset shell</title></head>
<frameset rows="*,50px"><frame src="frame-main.html"><frame src="frame-footer.html"></frameset></html>`;
const FRAME_FOOTER = `<!doctype html><html><body><p>footer</p></body></html>`;

const SINGLE_DOC = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>plain page</title></head><body>
<h2>Only Heading</h2>
<ol class="only-list"><li>One</li><li>Two</li></ol>
</body></html>`;

function writeFixture(dirName, files) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), dirName));
  for (const [name, content] of Object.entries(files)) fs.writeFileSync(path.join(tmp, name), content);
  return tmp;
}

async function collect(url) {
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: BROWSER_ARGS });
  try {
    const alloc = createTabAllocator({ browser, maxTabs: 2 });
    const lease = await alloc.acquire();
    let out;
    try { out = normalizeCollectRoles(await collectActPage(lease.page, { url, elementCap: 40, file: 'p', runId: 'p', sourceUrl: url })); }
    finally { await lease.release(); await alloc.close(); }
    return out;
  } finally {
    await browser.close().catch(() => {});
  }
}

test('frame-structure #2: a frameset page\'s real headings/lists/tables are collected from the child <frame>, not lost', { skip: !chromeOK, concurrency: false }, async () => {
  const tmp = writeFixture('frame-struct-', { 'index.html': FRAMESET_INDEX, 'frame-main.html': FRAME_MAIN, 'frame-footer.html': FRAME_FOOTER });
  const out = await collect('file://' + path.join(tmp, 'index.html'));

  assert.equal(out.structure.headings.length, 1, 'the frame\'s <h1> is collected');
  assert.equal(out.structure.headings[0].text, 'Section One');
  assert.equal(out.structure.headings[0].inFrame, true);
  assert.match(out.structure.headings[0].xpath, /^\/html\[?1?\]?\/body\[?1?\]?\/frame\[1\]>>/, 'a CDP-resolvable namespaced xpath, not null');

  assert.equal(out.structure.lists.length, 1, 'the frame\'s real <ul> is collected');
  assert.equal(out.structure.lists[0].kind, 'real');
  assert.equal(out.structure.lists[0].itemCount, 3);
  assert.equal(out.structure.lists[0].inFrame, true);

  assert.equal(out.structure.tables.length, 1, 'the frame\'s <table> is collected');
  assert.equal(out.structure.tables[0].inFrame, true);
  assert.equal(out.structure.tables[0].firstColAllTh, true, 'the frame table\'s own facts are computed correctly, not just its presence');
});

test('frame-structure #2 COUNTER-CASE: a non-framed page\'s own headings/lists/tables are unaffected (no duplication, no inFrame flag)', { skip: !chromeOK, concurrency: false }, async () => {
  const tmp = writeFixture('no-frame-struct-', { 'index.html': SINGLE_DOC });
  const out = await collect('file://' + path.join(tmp, 'index.html'));

  assert.equal(out.structure.headings.length, 1);
  assert.equal(out.structure.headings[0].text, 'Only Heading');
  assert.equal(!!out.structure.headings[0].inFrame, false, 'a top-document heading must not be mislabeled inFrame');

  assert.equal(out.structure.lists.length, 1);
  assert.equal(out.structure.lists[0].itemCount, 2);
  assert.equal(!!out.structure.lists[0].inFrame, false);
});

test('frame-structure #2 end-to-end: the info-relationships-v0 subject sees the frame-sourced structure (not an apparently-empty page)', { skip: !chromeOK, concurrency: false }, async () => {
  const llmAdj = require('../../lib/llm-adjudicator.js');
  const { loadRubrics } = require('../../lib/rubric-loader.js');
  const tmp = writeFixture('frame-struct-e2e-', { 'index.html': FRAMESET_INDEX, 'frame-main.html': FRAME_MAIN, 'frame-footer.html': FRAME_FOOTER });
  const url = 'file://' + path.join(tmp, 'index.html');
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: BROWSER_ARGS });
  try {
    const alloc = createTabAllocator({ browser, maxTabs: 2 });
    const lease = await alloc.acquire();
    let out;
    try { out = normalizeCollectRoles(await collectActPage(lease.page, { url, elementCap: 40, file: 'p', runId: 'p', sourceUrl: url })); }
    finally { await lease.release(); }
    const { rubrics } = loadRubrics();
    const driven = await orchestrate(out, { file: out.file, runId: out.runId, pageDigest: out.pageDigest, drivenAt: out.collectedAt + 1, elements: [] }, {
      resolveUrl: () => url, browser, tabAllocator: alloc, now: out.collectedAt + 2, maxAutomatic: 8, experimentConcurrency: 2,
    });
    const ledger = (driven.built && driven.built.results && driven.built.results.obligationLedger) || [];
    const subjects = llmAdj.selectRubricSubjects(out, ledger, rubrics).filter((s) => s.sc === '1.3.1');
    assert.ok(subjects.length > 0, 'a 1.3.1 info-relationships subject is enumerated');
    for (const subj of subjects) {
      const sig = llmAdj.precomputeSignals(subj.element, subj.skill, subj.sc);
      assert.equal(sig.structure.headings.length, 1, 'the rubric subject sees the frame heading, not an empty array');
      assert.equal(sig.structure.lists.length, 1, 'the rubric subject sees the frame list, not an empty array');
    }
    await alloc.close();
  } finally {
    await browser.close().catch(() => {});
  }
});

// ===================== #3 fix — frameTitles (2.4.2 frameset title/content mismatch) =====================
// document.title (structure.title) correctly stays the OUTER frameset's own title — that IS what the browser
// tab/AT reports, so it must not be silently swapped for a child frame's title. What was missing: a signal
// letting the page-title-v0 rubric know a rendered child frame carries its OWN, different title, so it can
// cross-reference the outer title against what's actually shown instead of guessing purely from the screenshot.
const MISMATCH_INDEX = `<!doctype html><html><head><title>Acme News Network</title></head>
<frameset rows="*"><frame src="grocery.html"></frameset></html>`;
const MISMATCH_FRAME = `<!doctype html><html><head><title>Acme Grocery Checkout</title></head><body><h1>Checkout</h1></body></html>`;

const MATCH_INDEX = `<!doctype html><html><head><title>Acme News Network</title></head>
<frameset rows="*"><frame src="news.html"></frameset></html>`;
const MATCH_FRAME = `<!doctype html><html><head><title>Acme News Network</title></head><body><h1>Breaking News</h1></body></html>`;

test('frame-structure #3: a child frame with a DIFFERENT title than the outer frameset surfaces frameTitles', { skip: !chromeOK, concurrency: false }, async () => {
  const tmp = writeFixture('frame-title-mismatch-', { 'index.html': MISMATCH_INDEX, 'grocery.html': MISMATCH_FRAME });
  const out = await collect('file://' + path.join(tmp, 'index.html'));
  assert.equal(out.structure.title, 'Acme News Network', 'the OUTER title stays the reported document.title — unchanged by #3');
  assert.deepEqual(out.structure.frameTitles, ['Acme Grocery Checkout'], 'the child frame\'s own, divergent title is surfaced as a hint');
});

test('frame-structure #3 COUNTER-CASE: a child frame whose title MATCHES the outer title does not spuriously flag a divergence', { skip: !chromeOK, concurrency: false }, async () => {
  const tmp = writeFixture('frame-title-match-', { 'index.html': MATCH_INDEX, 'news.html': MATCH_FRAME });
  const out = await collect('file://' + path.join(tmp, 'index.html'));
  assert.equal(out.structure.title, 'Acme News Network');
  assert.deepEqual(out.structure.frameTitles, [], 'identical title ⇒ nothing new to report ⇒ empty, not a spurious hint');
});

test('frame-structure #3 COUNTER-CASE: a non-framed page never populates frameTitles', { skip: !chromeOK, concurrency: false }, async () => {
  const tmp = writeFixture('no-frame-title-', { 'index.html': SINGLE_DOC });
  const out = await collect('file://' + path.join(tmp, 'index.html'));
  assert.deepEqual(out.structure.frameTitles, []);
});

test('frame-structure #3 signal surfacing: llm-adjudicator only adds pageTitle.frameTitles when non-empty (byte-identical shape otherwise)', () => {
  const llmAdj = require('../../lib/llm-adjudicator.js');
  const el = (frameTitles) => ({ xpath: '/page-level::title', __pageStructure: { title: 'Acme News Network', frameTitles, headings: [], lists: [], tables: [] } });
  const withMismatch = llmAdj.precomputeSignals(el(['Acme Grocery Checkout']), 'page-structure', '2.4.2');
  assert.deepEqual(withMismatch.pageTitle, { value: 'Acme News Network', present: true, frameTitles: ['Acme Grocery Checkout'] });
  const withoutMismatch = llmAdj.precomputeSignals(el([]), 'page-structure', '2.4.2');
  assert.deepEqual(withoutMismatch.pageTitle, { value: 'Acme News Network', present: true }, 'no frameTitles key at all when empty — non-framed pages keep the pre-#3 shape exactly');
});
