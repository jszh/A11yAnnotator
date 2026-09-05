#!/usr/bin/env node
/**
 * recombine-harness-verdict.js - make the harness column show the harness's
 * COMBINED verdict for (element x SC), not the verdict of the single sampled
 * obligation row.
 *
 * The 200 cases were drawn from the harness's 774-row stratified sample, whose
 * unit is one obligation: (page, SC, element, claim family). One element can
 * carry several obligations under the same SC - an <img> gets both
 * `non-text-content` (is there a text alternative?) and `long-description` (is
 * a longer description needed, and is there one?) - and the draw picks ONE of
 * them. The study then asked the participant about the element, while showing
 * the verdict of whichever row happened to be drawn.
 *
 * C045 and C064 are the same finding on two ESPN thumbnails: both have
 * `non-text-content` = barrier (from axe, which runs inside the harness) and
 * `long-description` = PARTIAL. C064 was drawn on the element-keyed row and
 * read "problem"; C045 was drawn on the long-description row and read "clear".
 * Nothing about the harness differed - only which row the sample drew.
 *
 * The combined verdict unions every obligation the harness holds for that
 * element under that SC, across all of its sources:
 *
 *   ledger  a row that reached a terminal, uncleared disposition - CLAIM from
 *           the deterministic lane, or PROVISIONAL carrying BARRIER_OBSERVED
 *           from a checker, an instrument, a geometry measurement or a rubric.
 *   shadow  a non-authoritative observation whose `wouldBe` outcome is
 *           BARRIER_OBSERVED, on an obligation the ledger left PARTIAL. This is
 *           the LLM lane, and it is already what the comparison counted for the
 *           `llm-terminal-partial-obligation` rows, so leaving it out would
 *           silently retract 9 findings the study is currently showing.
 *
 * PARTIAL on its own is NOT a barrier and stays not-flagging. The harness
 * having no verdict is not the harness reporting a problem, and the study has
 * no third column state: a participant sees "reports a problem" or nothing.
 *
 * Page-scope cases are unioned the same way over the `/page-level::<family>`
 * obligations for that SC (in this sample every one of them is 1:1 anyway).
 *
 * Additive and idempotent: it rewrites tools.harness.flagged and the `pattern`
 * string derived from it, records what it did under tools.harness.combined, and
 * touches nothing else - case ids, strata, targets and assignments all hold.
 * Re-run enrich-tool-reasons.js afterwards so a newly flagged column gets its
 * sentence.
 *
 * Usage: node eval/human-study/recombine-harness-verdict.js [--sample=<file>] [--dry]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../..');
const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const m = /^--([^=]+)(?:=(.*))?$/.exec(a);
  return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true];
}));
const SAMPLE = path.resolve(ROOT, args.sample || 'eval/human-study/sample/study-sample-200.json');
const HARNESS = path.join(ROOT, 'results/56-page-runs/current/saved-elements-stratified774-gemini37-flash-high-20260820-combined-repaired/pages');

const norm = (xp) => String(xp || '').normalize('NFC').replace(/\[1\]/g, '').replace(/\s+/g, ' ').trim();
const npage = (p) => String(p || '').normalize('NFC').replace(/\s+/g, ' ').trim();

// page -> { ledger: [...], shadow: [...] }
const pages = new Map();
for (const f of fs.readdirSync(HARNESS)) {
  if (!f.endsWith('.json')) continue;
  const d = JSON.parse(fs.readFileSync(path.join(HARNESS, f), 'utf8'));
  const r = d.results || {};
  pages.set(npage(d.spec.file), { ledger: r.obligationLedger || [], shadow: r.shadowObservations || [] });
}

const isPageLevel = (xp) => /^\/page-level/.test(String(xp || ''));
const ledgerBarrier = (o) => o.disposition !== 'PARTIAL' && o.cleared === false;
const shadowBarrier = (s) => ((s.wouldBe || {}).observationOutcome === 'BARRIER_OBSERVED');

/** Every harness obligation and shadow observation for this case's element+SC. */
function harnessRows(c) {
  const p = pages.get(npage(c.page.file));
  if (!p) throw new Error(`no harness page result for ${c.page.file}`);
  const hit = c.scope === 'page'
    ? (xp) => isPageLevel(xp)
    : (xp) => norm(xp) === c.normalizedXpath;
  const ledger = p.ledger.filter((o) => o.sc === c.sc && hit(o.xpath));
  const shadow = p.shadow.filter((s) => s.sc === c.sc && hit((s.observationScope || {}).actionTargetRef));
  return { ledger, shadow };
}

const sample = JSON.parse(fs.readFileSync(SAMPLE, 'utf8'));
const changed = [];
const noRows = [];
for (const c of sample.cases) {
  const { ledger, shadow } = harnessRows(c);
  if (!ledger.length && !shadow.length) noRows.push(c.caseId);
  const bLedger = ledger.filter(ledgerBarrier);
  const bShadow = shadow.filter(shadowBarrier);
  const flagged = bLedger.length > 0 || bShadow.length > 0;
  const was = !!c.tools.harness.flagged;

  c.tools.harness.combined = {
    flagged,
    // The family the draw happened to land on, kept so the analysis can still
    // see which obligation the row came from.
    sampledFamily: c.claimFamily || null,
    families: ledger.map((o) => ({
      family: o.claimFamily || null,
      disposition: o.disposition,
      barrier: ledgerBarrier(o),
      mechanism: (o.provisional && o.provisional.mechanism) || o.mechanism || null,
    })),
    shadowBarrierFamilies: [...new Set(bShadow.map((s) => s.claimFamily || null))],
    // What the single sampled row said, so the change is auditable from the
    // sample alone without going back to the run.
    sampledFlagged: was,
  };
  if (flagged !== was) {
    changed.push({ caseId: c.caseId, sc: c.sc, from: was, to: flagged, pattern: c.pattern });
    c.tools.harness.flagged = flagged;
    c.pattern = (flagged ? 'H' : '-') + c.pattern.slice(1);
  }
}

sample.harnessRecombinedAt = new Date().toISOString();
if (!args.dry) fs.writeFileSync(SAMPLE, `${JSON.stringify(sample, null, 2)}\n`);

const flaggedNow = sample.cases.filter((c) => c.tools.harness.flagged).length;
console.log(`${args.dry ? 'DRY - ' : ''}combined harness verdict -> ${path.relative(ROOT, SAMPLE)}`);
console.log(`  harness flags ${flaggedNow} of ${sample.cases.length} cases (${changed.length} changed)`);
for (const ch of changed) console.log(`    ${ch.caseId} ${ch.sc}  ${ch.from ? 'problem' : 'clear'} -> ${ch.to ? 'problem' : 'clear'}  (pattern ${ch.pattern})`);
if (noRows.length) console.log(`  WARNING no harness rows at all for ${noRows.length}: ${noRows.join(' ')}`);
