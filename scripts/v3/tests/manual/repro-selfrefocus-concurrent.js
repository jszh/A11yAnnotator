'use strict';
// Concurrent-Chrome stress for detectFocusRetentionTraps (the flake repro + fix verification). Many SEPARATE
// Chrome processes compete for cores (as in a parallel `node --test`), irregularly delaying CDP round-trips +
// renderer scheduling. Runs the detector concurrently on BOTH the trap fixture (must detect every time) and the
// OK-guard fixture (must NEVER false-positive). Reports miss/FP rates. Pre-fix: ~27% trap misses.
const path = require('path');
const puppeteer = require('puppeteer');
const kg = require('../../lib/kbd-graph.js');
const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const FXDIR = path.join(__dirname, '..', '..', '..', '..', 'assets', 'fixtures');
const TRAP = 'file://' + path.join(FXDIR, 'fx-v3-self-refocus-trap.html');
const OK = 'file://' + path.join(FXDIR, 'fx-v3-self-refocus-ok.html');
const CONC = Number(process.argv[2] || 24);
const REPS = Number(process.argv[3] || 4);
async function run(url) {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  try { const page = await browser.newPage(); await page.goto(url, { waitUntil: 'load' }); return await kg.detectFocusRetentionTraps(page); }
  finally { await browser.close(); }
}
(async () => {
  const tasks = [];
  for (let w = 0; w < CONC; w++) tasks.push((async () => {
    const out = { trapHit: 0, trapMiss: 0, okClean: 0, okFP: 0 };
    for (let i = 0; i < REPS; i++) {
      const t = await run(TRAP).catch(() => ({ traps: [] }));
      (t.traps.length === 1 && t.traps[0].xpath === '/html/body/button[1]') ? out.trapHit++ : out.trapMiss++;
      const o = await run(OK).catch(() => ({ traps: [] }));
      (o.traps.length === 0) ? out.okClean++ : out.okFP++;
    }
    return out;
  })());
  const r = (await Promise.all(tasks)).reduce((a, b) => ({ trapHit: a.trapHit + b.trapHit, trapMiss: a.trapMiss + b.trapMiss, okClean: a.okClean + b.okClean, okFP: a.okFP + b.okFP }), { trapHit: 0, trapMiss: 0, okClean: 0, okFP: 0 });
  const n = CONC * REPS;
  console.log(`CONC=${CONC} REPS=${REPS}`);
  console.log(`  TRAP detected: ${r.trapHit}/${n}  MISSES=${r.trapMiss} (${(100*r.trapMiss/n).toFixed(0)}%)  ${r.trapMiss===0?'✅ no flake':'❌ FLAKY'}`);
  console.log(`  OK-guard clean: ${r.okClean}/${n}  FALSE-POS=${r.okFP}  ${r.okFP===0?'✅ sound':'❌ FALSE POSITIVE'}`);
  process.exit((r.trapMiss === 0 && r.okFP === 0) ? 0 : 1);
})().catch((e) => { console.error(e.stack || e); process.exit(2); });
