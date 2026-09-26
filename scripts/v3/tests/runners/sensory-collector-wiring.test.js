'use strict';

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const puppeteer = require('puppeteer');

const { collectActPage } = require('../../lib/act-page-collect.js');
const { familiesFor } = require('../../lib/applicability-oracle.js');
const { buildV3 } = require('../../lib/build-v3.js');
const { BROWSER_ARGS } = require('../../lib/browser-args.js');
const { selectRubricSubjects } = require('../../lib/llm-adjudicator.js');
const { loadRubrics } = require('../../lib/rubric-loader.js');

const CHROME = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const chromeOK = fs.existsSync(CHROME);

const DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'sensory-collector-'));
const FILE = path.join(DIR, 'index.html');
fs.writeFileSync(FILE, `<!doctype html><html lang="en"><head><title>Sensory wiring fixture</title></head><body>
  <p id="direct">Choose the round control to continue.</p>
  <div id="wrapper"><span id="nested">Use the square icon to open settings.</span></div>
  <p id="plain">Choose the labelled Continue control.</p>
  <iframe title="embedded instructions" srcdoc="&lt;p id='frame-sensory'&gt;Use the triangular control to proceed.&lt;/p&gt;"></iframe>
</body></html>`);

let browser;
test.before(async () => {
  if (chromeOK) browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: BROWSER_ARGS });
});
test.after(async () => { if (browser) await browser.close(); });

test('the shared collector universally wires direct sensory text into 1.3.3 obligations', { skip: !chromeOK, concurrency: false }, async () => {
  const page = await browser.newPage();
  let collect;
  try {
    collect = await collectActPage(page, {
      url: 'file://' + FILE,
      file: 'sensory-fixture',
      runId: 'sensory-run',
      elementCap: 80,
      autoUpdateWindowMs: 0,
      visualStructureProbe: false,
      scope: 'all', // 1.3.3 is an ACT-REST shadow lane, outside categories.json — scored unscoped (V3 scope filter)
    });
  } finally {
    await page.close();
  }

  const byId = (id) => collect.elements.find((el) => el.htmlSnippet && new RegExp(`^<[^>]*\\bid="${id}"`).test(el.htmlSnippet));
  const direct = byId('direct');
  const nested = byId('nested');
  const wrapper = byId('wrapper');
  const plain = byId('plain');
  const inFrame = collect.elements.find((el) => el.inFrame && el.htmlSnippet && el.htmlSnippet.includes('frame-sensory'));

  assert.ok(direct && nested && wrapper && plain && inFrame, 'top-level, nested, negative, and same-origin-frame records were collected');
  assert.equal(direct.ownText, 'Choose the round control to continue.');
  assert.deepEqual(direct.sensoryWords, ['round']);
  assert.equal(nested.sensoryWordHint, true);
  assert.deepEqual(nested.sensoryWords, ['square']);
  assert.equal(wrapper.ownText, '');
  assert.equal(wrapper.sensoryWordHint, undefined, 'ancestor wrappers do not duplicate a descendant instruction');
  assert.equal(plain.sensoryWordHint, undefined, 'ordinary instructions without a sensory reference are not nominated');
  assert.equal(inFrame.sensoryWordHint, true, 'same-origin frame content uses the universal gate too');
  assert.deepEqual(inFrame.sensoryWords, ['triangular']);
  assert.ok(familiesFor(direct).includes('sensory-characteristics'));

  const identity = { file: collect.file, runId: collect.runId, pageDigest: collect.pageDigest };
  const built = buildV3({
    collect,
    experiments: { ...identity, catalogVersion: '3.0.0-phase0', startedAt: collect.collectedAt + 1, results: [] },
    claimProposals: { ...identity, proposals: [] },
  });
  assert.equal(built.ok, true, JSON.stringify(built.errors));
  const sensoryRows = built.results.obligationLedger.filter((row) => row.sc === '1.3.3' && row.claimFamily === 'sensory-characteristics');
  assert.deepEqual(new Set(sensoryRows.map((row) => row.xpath)), new Set([direct.xpath, nested.xpath, inFrame.xpath]));
  assert.ok(sensoryRows.every((row) => row.autoPartial === true), 'the lexicon only creates LLM-review obligations, never verdicts');
  const subjects = selectRubricSubjects(collect, sensoryRows, loadRubrics().rubrics);
  assert.equal(subjects.length, 3);
  assert.ok(subjects.every((subject) => subject.rubricId === 'sensory-characteristics-v0'), 'every obligation reaches the existing 1.3.3 rubric');
});
