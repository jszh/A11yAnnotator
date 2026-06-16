'use strict';
// Harness 3.0 — INSTRUMENT findings stage. Runs the hardened VSR + keyboard instrument detectors against
// a page and emits page-level accessibility FINDINGS. The VSR/keyboard are INSTRUMENTS the harness uses
// to assess the page (memory: vsr-is-harness-instrument). These findings are NON-AUTHORITATIVE shadow
// signals — they never clear/barrier an obligation and never publish authoritative. They are recorded
// for offline scoring against the hand-labeled ground truth (memory: ground-truth-hand-labeled-after-
// harness) and would earn authority only after calibration, exactly like the Phase-3 judgment
// recommendations. Detectors: reading order (1.3.2), announcement-vs-meaning (4.1.2), tab order (2.4.3),
// keyboard traps (2.1.2), and VSR navigation traps. All were adversarially hardened for soundness.
const { collectVsrTranscript } = require('./vsr-collect.js');
const { analyzeTranscript } = require('./vsr-analysis.js');
const { collectTabOrder, tabOrderFindings, detectKeyboardTraps } = require('./kbd-graph.js');
const { vsrNavigationIntegrity } = require('./vsr-graph.js');

const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH || process.env.CHROME_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

// Run every instrument against an already-loaded Puppeteer page. Returns { findings: [...] }.
async function runInstruments(page, opts = {}) {
  const findings = [];
  const add = (detector, list) => { for (const f of (list || [])) findings.push({ detector, sc: f.sc || '', kind: f.kind, xpath: f.xpath || null, detail: f.detail || '', review: !!f.review }); };

  // VSR transcript → reading order (1.3.2) + announcement-vs-meaning (4.1.2)
  const transcript = await collectVsrTranscript(page, opts).catch(() => null);
  if (transcript && transcript.ok) {
    const an = analyzeTranscript(transcript);
    add('vsr-reading-order', an.readingOrder);
    add('vsr-meaning', an.meaning);
    add('vsr-meaning', an.meaningReview);
  }
  // keyboard tab order (2.4.3)
  const tab = await collectTabOrder(page).catch(() => null);
  if (tab) add('tab-order', tabOrderFindings(tab).findings);
  // keyboard traps (2.1.2): confirmed (authoritative-candidate) + directional (review)
  const traps = await detectKeyboardTraps(page).catch(() => null);
  if (traps) {
    add('keyboard-trap', traps.traps.map((t) => ({ sc: t.sc, kind: 'keyboard-trap', xpath: t.regionXpath, detail: 'confirmed keyboard trap: focus cannot escape by Tab, Shift+Tab, Esc, or a Close control' })));
    add('keyboard-trap', traps.directionalTraps.map((t) => ({ sc: t.sc, kind: 'keyboard-trap-directional', xpath: t.regionXpath, detail: 'one-way keyboard trap: focus escapes in only one Tab direction', review: true })));
  }
  // VSR navigation traps (reading-cursor cannot advance/retreat)
  const vt = await vsrNavigationIntegrity(page, opts).catch(() => null);
  if (vt) add('vsr-trap', vt.traps);

  return { findings };
}

// Load a URL in a fresh browser and run the instruments. The instruments artifact carries the run
// identity so a downstream consumer can bind it to the page (non-authoritative, so not hashed).
async function runInstrumentsForUrl(url, opts = {}) {
  const puppeteer = require('puppeteer');
  const browser = await puppeteer.launch({ executablePath: opts.executablePath || CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'load', timeout: opts.gotoTimeoutMs || 30000 }).catch(() => {});
    const res = await runInstruments(page, opts);
    return { file: opts.file || url, runId: opts.runId || null, pageDigest: opts.pageDigest || null, ...res };
  } finally { await browser.close(); }
}

module.exports = { runInstruments, runInstrumentsForUrl, CHROME };
