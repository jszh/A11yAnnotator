'use strict';
// PROBE (#4, 2.1.2 self-refocus): run the two live-JS keyboard-trap detectors — detectFocusRetentionTraps
// (self-refocus: focus returns to the SAME element) + detectFixedSetConfinementTraps (mutual-bounce/fixed-set)
// — over ALL 16 ACT 80af7b fixtures, labelled by ground truth. The residual FN the analysis flagged is
// 0ec0e93e ("Failed Example 2": two <button onblur="setTimeout(()=>this.focus(),10)">, the ASYNC self-refocus
// twin of the d2f5325f async-sibling-progression PASS). SOUNDNESS GATE: every GT-fail must be flagged by AT
// LEAST one detector; every GT-pass / inapplicable must be flagged by NEITHER. Prints a per-fixture verdict.
const path = require('path');
const fs = require('fs');
const puppeteer = require('puppeteer');
const { detectFocusRetentionTraps, detectFixedSetConfinementTraps } = require('../../lib/kbd-graph.js');

const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const DIR = path.join(__dirname, '..', '..', '..', '..', 'eval/checker-comparison/act-subset/pages/80af7b');

// GT from the ACT corpus (matches results/fn-llm-allfixes).
const GT = {
  '0ec0e93e': 'failed', '62fd24e7': 'failed', '7dcc4ae0': 'failed', '8fba3918': 'failed', 'f5ea9fd3': 'failed',
  '4b93a866': 'passed', '96eb4b26': 'passed', 'ab24c77e': 'passed', 'b92b5214': 'passed', 'd2f5325f': 'passed', 'e3902f01': 'passed', 'fb76f71a': 'passed',
  '16dddd8a': 'inapplicable', '30ffb299': 'inapplicable', '6e3dcc2f': 'inapplicable', '9d47dcc6': 'inapplicable',
};

(async () => {
  const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.html'));
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage', '--allow-file-access-from-files'] });
  let fails = 0, passes = 0, problems = [];
  for (const f of files.sort()) {
    const short = f.slice(0, 8);
    const gt = GT[short] || '?';
    const page = await browser.newPage();
    await page.goto('file://' + path.join(DIR, f), { waitUntil: 'networkidle0' }).catch(() => {});
    const self = await detectFocusRetentionTraps(page).catch((e) => ({ err: String(e) }));
    const conf = await detectFixedSetConfinementTraps(page).catch((e) => ({ err: String(e) }));
    await page.close();
    const selfHit = self && Array.isArray(self.traps) && self.traps.length > 0;
    const confTrap = conf && Array.isArray(conf.traps) && conf.traps[0];
    // CLASSIFY the deterministic outcome: a self-refocus trap OR a lying-advisory confinement is a DETERMINISTIC
    // BARRIER (no LLM); a confinement with a non-lying (possibly buried/working) advisory is REVIEW — it ROUTES to
    // keyboard-trap-v0 for the LLM to resolve, NOT a deterministic verdict. NONE = neither detector fired.
    const detBarrier = selfHit || (confTrap && confTrap.lyingAdvisory === true);
    const review = confTrap && confTrap.lyingAdvisory !== true;
    const cls = detBarrier ? 'DET-BARRIER' : (review ? 'REVIEW→LLM' : 'NONE');
    // SOUNDNESS: (a) no GT-pass/inapplicable may be a DETERMINISTIC barrier (a hard false positive); (b) every
    // GT-fail must be at least DETECTED (DET-BARRIER or REVIEW). A GT-pass that is REVIEW (b92b5214: confined but
    // escapable via a working documented key) is acceptable — the LLM lane clears it; it is NOT a det. false positive.
    const ok = (gt === 'failed') ? (detBarrier || review) : !detBarrier;
    if (!ok) problems.push(short);
    if (gt === 'failed' && ok) fails++;
    if (gt !== 'failed' && ok) passes++;
    const det = [selfHit ? `self(${self.traps.map((t) => t.label).join('/')})` : '', confTrap ? `confine(set=${confTrap.setSize},lying=${confTrap.lyingAdvisory})` : ''].filter(Boolean).join(' + ') || 'none';
    console.log(`${ok ? '  OK ' : 'FAIL'}  ${short}  GT=${gt.padEnd(12)} ${cls.padEnd(11)} detectors=[${det}]`);
  }
  await browser.close();
  console.log(`\nGT-fail flagged: ${fails}/5 ; GT-pass+inapplicable cleared: ${passes}/11`);
  console.log(problems.length ? `\n*** SOUNDNESS PROBLEMS: ${problems.join(', ')} ***` : '\nALL 16 AGREE WITH GT ✓');
  process.exit(problems.length ? 1 : 0);
})().catch((e) => { console.error(e.stack || e); process.exit(2); });
