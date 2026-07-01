'use strict';
// LLM-INDEPENDENT SPLICE — persist the "run only the LLM-dependent cases, splice back the deterministic ones"
// optimization as a first-class, provenance-guarded artifact.
//
// WHY IT'S SOUND. The FN×LLM eval judges the REACHES-LLM set (458 cases). A case's outcome depends on the LLM
// ONLY if the deterministic pipeline minted an in-scope auto-PARTIAL obligation for it — that obligation is what
// the LLM lane is asked to fill. Obligations are minted DETERMINISTICALLY (collector + oracle + ledger + axe +
// instruments), never by the LLM: the LLM can only FILL or RECONCILE an obligation, it cannot create one. So a
// case with ZERO in-scope auto-PARTIAL obligations never reaches the LLM — its outcome is `noObligation`
// regardless of model or provider. Those cases are LLM-INDEPENDENT BY CONSTRUCTION, and every one is a negative
// (expected passed/inapplicable) scored as a true-negative. Splicing them back at fixed TN reconstructs the full
// 458-case metrics EXACTLY while running only the ~325 LLM-dependent cases live (recall stays fully live — no
// `failed` case is ever spliced).
//
// THE GUARD. "Zero obligation" is a property of the DETERMINISTIC pipeline source. If that source changes, the
// set can drift (measured: 137 → 132 across recent commits). So the manifest records a PIPELINE HASH over the
// deterministic pipeline files at derivation time; `--skip-llm-independent` recomputes it and REFUSES to splice a
// stale set unless the hash matches (or `--force-splice` overrides for an edit known to be LLM-only). Re-derivation
// is a single cheap `--no-llm` pass (`--derive-independent`) — no LLM, no vision, no tools.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const REPO_ROOT = path.join(__dirname, '..', '..', '..');
const LIB_DIR = path.join(REPO_ROOT, 'scripts', 'v3', 'lib');
const MANIFEST_PATH = path.join(__dirname, '..', 'llm-independent-set.json');

// The pipeline-hash covers EVERY scripts/v3/lib/*.js file. This is deliberately conservative: obligations can be
// minted by the collector, the oracle, the ledger builder, axe-surface, the instrument lanes, and any detector, so
// enumerating "only the files that mint obligations" risks silently UNDER-tripping the guard (the dangerous failure).
// Hashing the whole lib OVER-trips on LLM-only edits (rubric selection, transports, tools) — which cannot change the
// zero-obligation set — but an over-trip is safe: it just prompts a cheap re-derive, or `--force-splice` when the
// editor knows the change is LLM-only. Bias to safe.
function pipelineFiles() {
  return fs.readdirSync(LIB_DIR)
    .filter((f) => f.endsWith('.js'))
    .map((f) => path.join('scripts/v3/lib', f))
    .sort();
}

// sha256 over the sorted (relativePath \n content) of every pipeline file — machine-independent + reproducible.
function computePipelineHash() {
  const h = crypto.createHash('sha256');
  const rels = pipelineFiles();
  for (const rel of rels) {
    h.update(rel);
    h.update('\n');
    h.update(fs.readFileSync(path.join(REPO_ROOT, rel)));
    h.update('\n');
  }
  return { hash: h.digest('hex'), fileCount: rels.length };
}

// The independent set = the negative cases the deterministic pipeline leaves with NO in-scope obligation. Derived
// from a `--no-llm` (or any) results.json: `outcome==='noObligation'` (the LLM was never invoked), never `failed`
// (recall must stay live), never a false positive, and never a special-cased row (cross-rule-excluded or a
// criterion-level GT override) — those keep their bespoke scoring and are re-run live.
function isIndependent(r) {
  return !!(r
    && r.outcome === 'noObligation'
    && !r.excluded
    && !r.gtOverride
    && r.expected !== 'failed'
    && r.effectiveExpected !== 'failed'
    && !r.falsePositive);
}

function deriveCasesFromResults(results) {
  return (results || []).filter(isIndependent).map((r) => ({
    testcaseId: r.testcaseId,
    ruleId: r.ruleId,
    sc: r.sc || [],
    expected: r.expected,
  }));
}

// A spliced record, shaped so summarize()/printSummary() in run-fn-llm.js score it as a deterministic true-negative
// (polarity=specificity, not flagged). `spliced`/`llmIndependent` mark it in the written results.json for audit.
function spliceRecord(c) {
  return {
    testcaseId: c.testcaseId,
    ruleId: c.ruleId,
    ruleName: c.ruleName || null,
    sc: c.sc || [],
    expected: c.expected,
    effectiveExpected: c.expected,
    outcome: 'noObligation',
    polarity: 'specificity',
    correct: true,
    falsePositive: false,
    llmIndependent: true,
    spliced: true,
  };
}

function loadManifest(p) {
  const fp = p || MANIFEST_PATH;
  if (!fs.existsSync(fp)) return null;
  return JSON.parse(fs.readFileSync(fp, 'utf8'));
}

function writeManifest(m, p) {
  const fp = p || MANIFEST_PATH;
  fs.writeFileSync(fp, JSON.stringify(m, null, 2) + '\n');
  return fp;
}

function buildManifest({ cases, derivedFromCommit, reachesLlmTotal, note }) {
  const { hash, fileCount } = computePipelineHash();
  return {
    schema: 'llm-independent-set/v1',
    note: note || 'Deterministically LLM-independent cases (no in-scope obligation ⇒ noObligation regardless of model). Splice as fixed TN; keep recall fully live.',
    derivedFromCommit: derivedFromCommit || null,
    derivedVia: 'run-fn-llm.js --derive-independent (--no-llm --reaches-llm deterministic pass)',
    reachesLlmTotal: reachesLlmTotal != null ? reachesLlmTotal : null,
    independentCount: cases.length,
    pipelineHash: hash,
    pipelineFileCount: fileCount,
    pipelineHashAlgo: 'sha256 over sorted (relpath\\ncontent) of scripts/v3/lib/*.js',
    cases,
  };
}

// EXACT-RECONSTRUCTION partition. The eval scores 458 ENTRIES, but a few testcaseIds appear MORE THAN ONCE (the
// same page listed under two ACT rules — e.g. 8ff1c1f8 under qt1vmo+e88epe, both 1.1.1/inapplicable). The manifest
// is testcaseId-keyed (independence was derived per page), so it cannot say whether BOTH entries of a duplicated id
// are independent. Skipping such an id would remove 2+ entries but splice back only 1 → the denominator drifts
// (457 not 458). So we splice ONLY testcaseIds that appear EXACTLY ONCE in the reaches set; any duplicated-independent
// id is left LIVE (it's noObligation, so it costs no LLM call and each of its entries is scored correctly). Result:
// entries-removed === spliceRecords === skipIds, and live + spliced === total, exactly.
//   reachesCases: the run's case list (objects with .testcaseId — duplicates included, i.e. 458 entries).
function partitionForSplice(manifest, reachesCases) {
  const freq = new Map();
  for (const c of reachesCases) freq.set(c.testcaseId, (freq.get(c.testcaseId) || 0) + 1);
  const skipIds = new Set();
  const spliceRecords = [];
  const liveDuplicated = [];
  const missing = [];
  for (const c of (manifest.cases || [])) {
    const n = freq.get(c.testcaseId) || 0;
    if (n === 0) { missing.push(c.testcaseId); continue; }   // absent from reaches (corpus drift — guard catches it)
    if (n > 1) { liveDuplicated.push({ testcaseId: c.testcaseId, count: n }); continue; } // run live, don't splice
    skipIds.add(c.testcaseId);
    spliceRecords.push(spliceRecord(c));
  }
  return { skipIds, spliceRecords, liveDuplicated, missing };
}

// The guard: is `manifest` safe to splice into a run over `reachesIds` at the CURRENT pipeline state?
// Returns { ok, reason, pipelineChanged, missing } — the caller decides whether --force-splice overrides.
function checkGuard(manifest, reachesIds) {
  if (!manifest) return { ok: false, reason: 'no manifest (run --derive-independent first)' };
  if (!Array.isArray(manifest.cases) || !manifest.cases.length) return { ok: false, reason: 'manifest has no cases' };
  const { hash } = computePipelineHash();
  const pipelineChanged = hash !== manifest.pipelineHash;
  // every spliced id must still be a member of the live reaches-llm set (corpus drift check)
  const reaches = reachesIds instanceof Set ? reachesIds : new Set(reachesIds || []);
  const missing = manifest.cases.filter((c) => !reaches.has(c.testcaseId)).map((c) => c.testcaseId);
  const failedLeak = manifest.cases.filter((c) => c.expected === 'failed').map((c) => c.testcaseId);
  if (failedLeak.length) return { ok: false, reason: `manifest contains ${failedLeak.length} failed case(s) — refusing (recall must stay live)`, failedLeak };
  if (missing.length) return { ok: false, reason: `${missing.length} manifest case(s) absent from the current reaches-llm set (corpus drift)`, missing, pipelineChanged };
  if (pipelineChanged) return { ok: false, reason: `pipeline changed since derivation (hash mismatch)`, pipelineChanged, currentHash: hash, manifestHash: manifest.pipelineHash };
  return { ok: true, pipelineChanged: false };
}

module.exports = {
  MANIFEST_PATH,
  pipelineFiles,
  computePipelineHash,
  isIndependent,
  deriveCasesFromResults,
  spliceRecord,
  partitionForSplice,
  loadManifest,
  writeManifest,
  buildManifest,
  checkGuard,
};
