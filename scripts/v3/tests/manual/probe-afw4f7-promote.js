'use strict';
// PROBE (#1 contrast promotion gate): run the FULL pipeline (collect→orchestrate→experiments→build→ledger) over the
// WHOLE local afw4f7 1.4.3 set, label each fixture by its GT, and report whether the EXISTING text-contrast-pixel
// runner's outcome matches GT (failed→BARRIER, passed→NO_BARRIER, inapplicable→no-obligation/INAPPLICABLE). This is
// the reliability gate: text-contrast-pixel may be promoted to `canary` (deterministic PROVISIONAL fill) ONLY if its
// measurement is correct across this set. Read-only diagnostic — touches no code.
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const { orchestrate } = require('../../lib/orchestrator.js');
const { createTabAllocator } = require('../../lib/tab-allocator.js');
const { collectActPage, normalizeCollectRoles } = require('../../lib/act-page-collect.js');

const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT = path.join(__dirname, '..', '..', '..', '..');
const SUB = path.join(ROOT, 'eval/checker-comparison/act-subset/pages/afw4f7');

// GT labels mined from results/claude-sonnet-full/results.json
const GT = {};
try {
  for (const c of JSON.parse(fs.readFileSync(path.join(ROOT, 'results/claude-sonnet-full/results.json'), 'utf8'))) {
    if (c.ruleId === 'afw4f7') GT[c.testcaseId] = c.expected;
  }
} catch (e) { /* fall back to unknown */ }

(async () => {
  const files = fs.readdirSync(SUB).filter((f) => f.endsWith('.html')).map((f) => f.replace('.html', ''));
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const alloc = createTabAllocator({ browser, maxTabs: 4 });
  const rows = [];
  for (const tc of files) {
    const gt = GT[tc] || 'unknown';
    const url = 'file://' + path.join(SUB, tc + '.html');
    let collect;
    const lease = await alloc.acquire();
    try { collect = normalizeCollectRoles(await collectActPage(lease.page, { url, elementCap: 80, file: 'p', runId: 'p', sourceUrl: url })); }
    catch (e) { rows.push({ tc: tc.slice(0, 8), gt, exp: 'COLLECT_ERR', led: '-', match: '?' }); await lease.release(); continue; }
    finally { await lease.release().catch(() => {}); }
    let out;
    try {
      out = await orchestrate(collect, { file: 'p', runId: 'p', pageDigest: collect.pageDigest, drivenAt: collect.collectedAt + 1, elements: [] },
        { resolveUrl: () => url, browser, tabAllocator: alloc, now: collect.collectedAt + 2, maxAutomatic: 16, experimentConcurrency: 2 });
    } catch (e) { rows.push({ tc: tc.slice(0, 8), gt, exp: 'ORCH_ERR:' + (e.message || e).slice(0, 30), led: '-', match: '?' }); continue; }
    const exps = (out.experiments && out.experiments.results) || [];
    const cExp = exps.find((e) => /text-contrast-pixel/.test(e.catalogId || e.experimentId || '') || e.sc === '1.4.3');
    const ledger = (out.built && out.built.results && out.built.results.obligationLedger) || [];
    const cRow = ledger.find((r) => r.sc === '1.4.3' && r.claimFamily === 'text-contrast');
    const o = (cExp && cExp.outcome) || {};
    // the runner's MEASURED signal (independent of promotion): thresholdFailed ⇒ insufficient contrast (barrier),
    // thresholdMet ⇒ sufficient (clear). Promotion (canary) would turn these into a disposition.
    const measured = o.thresholdFailed ? 'INSUFFICIENT(barrier)' : o.thresholdMet ? 'SUFFICIENT(clear)' : (cExp ? 'INCONCLUSIVE' : 'NO_EXP');
    const led = cRow ? `${cRow.disposition}${cRow.cleared ? '/cleared' : ''}${cRow.autoPartial ? '/autoPartial' : ''}${cRow.shadow ? '/shadow' : ''}` : 'NO_OBL';
    let match = '?';
    if (gt === 'failed') match = o.thresholdFailed ? 'OK' : (o.thresholdMet ? 'FALSE-CLEAR' : 'abstain');
    else if (gt === 'passed') match = o.thresholdMet ? 'OK' : (o.thresholdFailed ? 'FALSE-BARRIER' : 'abstain');
    else if (gt === 'inapplicable') match = (!cExp || (!o.thresholdMet && !o.thresholdFailed)) ? 'OK' : 'fires-on-inapp';
    rows.push({ tc: tc.slice(0, 8), gt, measured, led, match,
      flags: cExp ? `solidUniform=${o.backdropIsSolidUniform} computable=${o.contrastComputable} met=${o.thresholdMet} failed=${o.thresholdFailed} exempt=${o.notExemptText}` : '(no contrast exp ran)' });
  }
  alloc.close(); await browser.close();
  console.log('\n==== afw4f7 text-contrast-pixel validation (GT vs runner outcome) ====');
  for (const g of ['failed', 'passed', 'inapplicable', 'unknown']) {
    const grp = rows.filter((r) => r.gt === g); if (!grp.length) continue;
    console.log(`\n--- GT=${g} (${grp.length}) ---`);
    for (const r of grp) console.log(`  ${r.tc} measured=${String(r.measured).padEnd(22)} ledger=${String(r.led).padEnd(26)} match=${r.match}\n        ${r.flags || ''}`);
  }
  const failed = rows.filter((r) => r.gt === 'failed');
  const passed = rows.filter((r) => r.gt === 'passed');
  console.log(`\nSUMMARY: failed→barrier ${failed.filter((r) => r.match === 'OK').length}/${failed.length} | passed FALSE-BARRIERS ${passed.filter((r) => r.match === 'FALSE-BARRIER').length}/${passed.length} | passed cleared ${passed.filter((r) => r.match === 'OK').length}/${passed.length} | passed abstain ${passed.filter((r) => r.match === 'abstain').length}/${passed.length}`);
})().catch((e) => { console.error(e.stack || e); process.exit(1); });
