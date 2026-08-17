#!/usr/bin/env node
/**
 * Consume the adjudicators' verdicts: apply the fixes that are beyond dispute,
 * and durably tag everything else so no downstream evaluation silently treats a
 * questioned case as ground truth.
 *
 * Dry-run by default — it validates every proposed patch (the anchor must occur
 * exactly once in the named file) and prints what it WOULD do. `--apply` writes.
 *
 * Outputs (always):
 *   _annotator/irr/case-reliability-tags.json   per-case tag: fixed | needs-validation | clear
 *   _annotator/irr/needs-validation.md          human worklist, highest-priority first
 *
 * Usage:
 *   node eval/act-augmented/_tools/apply-adjudication.js            # dry run
 *   node eval/act-augmented/_tools/apply-adjudication.js --apply
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '../../..');
const IRR = path.join(ROOT, 'eval/act-augmented/_annotator/irr');
const ADJ = path.join(IRR, 'adjudication');

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');

function loadVerdicts() {
  const out = [];
  for (const f of fs.readdirSync(ADJ).filter((f) => /^verdict-\d+\.json$/.test(f)).sort()) {
    const doc = JSON.parse(fs.readFileSync(path.join(ADJ, f), 'utf8'));
    for (const c of doc.cases || []) out.push({ ...c, _from: f });
  }
  return out;
}

/**
 * Cases the adjudicators called FIX-OBVIOUS that a review of the patch itself
 * downgraded. Held rather than applied, with the reason recorded in the tags so
 * the decision is visible rather than silent.
 */
const HELD = {
  '1.4.13::persistent-auto-timeout-vs-valid-info-invalidation::case-01':
    'The page bug is confirmed (tooltip renders at (500,1170), ~950px from its trigger at (331,221) — it is invisible to the user, exactly as the annotator reported). The proposed repair is correct on that axis (tooltip moves to (203,260) under the trigger, and the documented 4s auto-dismiss-while-hovered defect survives), but it lifts the trigger button out of <label for="amt">, which changes the input\'s accessible name from "Amount (USD) About the daily transfer limit" to "Amount (USD)" (verified via CDP). Changing an accessible name in a WCAG fixture is an owner decision, and .tip\'s CSS (left:50%; top:130% against .help) admits no narrower repair.',
  '4.1.3::after-the-fact-live-region-timing::case-06':
    'Removes a visible answer-key block from a served page. Real, but one instance of the 119-page prose-leak class — fixing a single page piecemeal leaves the corpus inconsistent. Belongs to the systemic decision in answer-leaks.json.',
  '4.1.3::is-it-a-status-message-scope-boundary::case-01':
    'Same prose-leak class, and its second edit strips body[data-intended-classification], which is present on all six pages of this aspect — patching one is worse than patching none. Belongs to the systemic decision.',
};

function main() {
  const apply = process.argv.includes('--apply');
  const verdicts = loadVerdicts();
  const flagged = JSON.parse(fs.readFileSync(path.join(IRR, 'unreliable-cases.json'), 'utf8'));
  const byKey = new Map(flagged.cases.map((c) => [c.key, c]));

  // ---- validate every proposed patch before touching anything
  const patches = [];
  const rejected = [];
  const held = [];
  for (const v of verdicts) {
    if (v.verdict !== 'FIX-OBVIOUS') continue;
    if (HELD[v.key]) { held.push({ key: v.key, why: HELD[v.key] }); continue; }
    const fix = v.proposedFix;
    if (!fix || !fix.file || !Array.isArray(fix.edits) || !fix.edits.length) {
      rejected.push({ key: v.key, why: 'FIX-OBVIOUS with no usable proposedFix' });
      continue;
    }
    const abs = path.join(ROOT, fix.file);
    if (!fs.existsSync(abs)) { rejected.push({ key: v.key, why: `file not found: ${fix.file}` }); continue; }
    const src = fs.readFileSync(abs, 'utf8');
    const bad = [];
    for (const e of fix.edits) {
      if (typeof e.oldString !== 'string' || typeof e.newString !== 'string') { bad.push('edit missing oldString/newString'); continue; }
      const n = src.split(e.oldString).length - 1;
      if (n === 0) bad.push(`anchor not found: ${JSON.stringify(e.oldString.slice(0, 70))}`);
      else if (n > 1) bad.push(`anchor occurs ${n}x (not unique): ${JSON.stringify(e.oldString.slice(0, 70))}`);
      if (e.oldString === e.newString) bad.push('no-op edit');
    }
    if (bad.length) { rejected.push({ key: v.key, file: fix.file, why: bad.join('; ') }); continue; }
    patches.push({ key: v.key, file: fix.file, rationale: fix.rationale, edits: fix.edits, verdict: v });
  }

  // group by file so multi-edit files apply once and conflicts surface
  const byFile = new Map();
  for (const p of patches) {
    if (!byFile.has(p.file)) byFile.set(p.file, []);
    byFile.get(p.file).push(p);
  }

  const applied = [];
  if (apply) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const bdir = path.join(ROOT, 'eval/_corpus-archive/act-augmented/adjudication-fixes', stamp);
    fs.mkdirSync(bdir, { recursive: true });
    for (const [file, ps] of byFile) {
      const abs = path.join(ROOT, file);
      let src = fs.readFileSync(abs, 'utf8');
      const before = sha(src);
      const dest = path.join(bdir, file);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, src);
      let ok = true;
      for (const p of ps) {
        for (const e of p.edits) {
          const n = src.split(e.oldString).length - 1;
          if (n !== 1) { // a previous patch in this file moved the anchor
            rejected.push({ key: p.key, file, why: `anchor no longer unique after earlier edit (${n} matches)` });
            ok = false; break;
          }
          src = src.replace(e.oldString, e.newString);
        }
        if (ok) applied.push({ key: p.key, file, rationale: p.rationale, edits: p.edits.length });
      }
      fs.writeFileSync(abs, src);
      fs.appendFileSync(path.join(bdir, 'patch-log.jsonl'),
        JSON.stringify({ file, shaBefore: before, shaAfter: sha(src), cases: ps.map((p) => p.key) }) + '\n');
    }
    console.log(`backups + patch log: ${path.relative(ROOT, bdir)}`);
  }

  // ---- tags for every adjudicated case
  const appliedKeys = new Set(applied.map((a) => a.key));
  const tags = verdicts.map((v) => {
    const f = byKey.get(v.key) || {};
    const wasApplied = appliedKeys.has(v.key);
    const heldWhy = HELD[v.key];
    const stillOpen = v.verdict === 'FIX-OBVIOUS' && !wasApplied && !heldWhy;
    const tag = v.verdict === 'NO-DEFECT' ? 'clear'
      : wasApplied ? 'fixed'
      : 'needs-validation';
    return {
      key: v.key, sc: f.sc, aspect: f.aspect, caseId: f.caseId, file: f.file,
      tag,
      adjudicatorVerdict: v.verdict,
      heldFromAutoFix: heldWhy || undefined,
      reason: stillOpen ? 'FIX-OBVIOUS but the patch could not be applied — see rejected[]' : undefined,
      annotationClarity: v.annotationClarity,
      complaintCorrect: v.complaintCorrect,
      defectType: v.defectType,
      groundTruthDisputed: !!v.groundTruthDisputed,
      internallyContradictory: !!v.internallyContradictory,
      confidence: v.confidence,
      corpusExpected: f.corpusExpected,
      signals: f.signals,
      humanComplaints: (f.coders || []).filter((c) => c.disposition === 'comment' || c.commentText)
        .map((c) => ({ annotator: c.annotator, issueExists: c.issueExists, reason: c.commentReason, text: c.commentText })),
      evidence: v.evidence,
      reasoning: v.reasoning,
      proposedFix: v.verdict === 'FIX-OBVIOUS' ? v.proposedFix : null,
    };
  });

  const counts = tags.reduce((a, t) => ((a[t.tag] = (a[t.tag] || 0) + 1), a), {});
  fs.writeFileSync(path.join(IRR, 'case-reliability-tags.json'), JSON.stringify({
    schema: 'act-augmented-case-reliability/1',
    generatedAt: new Date().toISOString(),
    applied: apply,
    counts,
    note: 'tag=needs-validation means the case is NOT settled ground truth: exclude it, or resolve it, before using this corpus as a scored benchmark.',
    rejectedPatches: rejected,
    cases: tags,
  }, null, 2));

  // ---- human worklist
  const open = tags.filter((t) => t.tag === 'needs-validation')
    .sort((a, b) => (b.internallyContradictory - a.internallyContradictory)
      || (b.groundTruthDisputed - a.groundTruthDisputed) || (b.confidence || 0) - (a.confidence || 0));
  const md = [];
  md.push('# act-augmented — cases needing human validation', '');
  md.push(`Generated ${new Date().toISOString().slice(0, 10)} from the annotator complaints in \`annotations/\`, adjudicated case by case.`, '');
  md.push(`**${open.length} cases** are not settled ground truth. Until each is resolved, treat it as excluded from any scored use of this corpus.`, '');
  md.push('| # | case | corpus says | why it is open | confidence |');
  md.push('|---|------|-------------|----------------|-----------|');
  open.forEach((t, i) => {
    const why = [t.internallyContradictory ? '**self-contradictory rationale**' : null,
      t.groundTruthDisputed ? 'label disputed' : null,
      t.heldFromAutoFix ? 'confirmed defect, repair held for owner' : null, t.defectType].filter(Boolean).join(', ');
    md.push(`| ${i + 1} | \`${t.key}\` | ${t.corpusExpected} | ${why} | ${t.confidence ?? '—'} |`);
  });
  md.push('', '## Detail', '');
  for (const t of open) {
    md.push(`### \`${t.key}\``);
    md.push(`- file: [${t.file}](${t.file})`);
    md.push(`- corpus label: \`${t.corpusExpected}\` · defect type: \`${t.defectType}\` · clarity of complaint: \`${t.annotationClarity}\` · complaint: \`${t.complaintCorrect}\``);
    for (const c of t.humanComplaints) md.push(`- ${c.annotator} (issue=${c.issueExists}, reason=${c.reason || '—'}): ${c.text || '_no text_'}`);
    if (t.reasoning) md.push(`- adjudication: ${t.reasoning}`);
    if (t.heldFromAutoFix) md.push(`- **repair held for owner sign-off:** ${t.heldFromAutoFix}`);
    md.push('');
  }
  fs.writeFileSync(path.join(IRR, 'needs-validation.md'), md.join('\n'));

  console.log(`\nverdicts read: ${verdicts.length}`);
  if (held.length) { console.log(`held from auto-fix (patch reviewed and downgraded): ${held.length}`); for (const h of held) console.log(`  - ${h.key}`); }
  console.log(`patches validated: ${patches.length}${apply ? `, applied: ${applied.length}` : ' (dry run — pass --apply to write)'}`);
  if (rejected.length) {
    console.log(`patches REJECTED: ${rejected.length}`);
    for (const r of rejected) console.log(`  - ${r.key}: ${r.why}`);
  }
  console.log(`tags: ${JSON.stringify(counts)}`);
  console.log(`wrote ${path.relative(ROOT, path.join(IRR, 'case-reliability-tags.json'))} and needs-validation.md`);
}

main();
