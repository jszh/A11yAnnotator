#!/usr/bin/env node
// Harness 3.0 — orchestrator CLI (plan 3.0-F). Runs the full deterministic pipeline for one page
// and writes every stage artifact + the gated v3 results. No silent fallback: a gate failure exits
// non-zero. Replay: re-run scripts/v3/tools/build-v3-results.js over the emitted bundle dir.
//
//   node scripts/v3/tools/run-evaluation.js <collect.json> <drive.json> <out-dir> [pageBaseUrl]
'use strict';

const fs = require('fs');
const path = require('path');
const { orchestrate } = require('../lib/orchestrator.js');
const attest = require('../lib/attestation.js');
const { loadGold } = require('../lib/gold-loader.js');
const adapter = require('../lib/llm-agent-adapter.js');

const [collectPath, drivePath, outDir, baseUrl] = process.argv.slice(2);
if (!collectPath || !drivePath || !outDir) { console.error('usage: run-evaluation.js <collect.json> <drive.json> <out-dir> [pageBaseUrl]'); process.exit(2); }

const collect = JSON.parse(fs.readFileSync(collectPath, 'utf8'));
const drive = JSON.parse(fs.readFileSync(drivePath, 'utf8'));
fs.mkdirSync(outDir, { recursive: true });

const ROOT = path.join(__dirname, '..', '..', '..');
const resolveUrl = () => (baseUrl ? `${baseUrl}/assets/saved/${encodeURIComponent(collect.file)}` : 'file://' + path.join(ROOT, 'assets', 'saved', collect.file));

(async () => {
  // exercise the REAL trust path (audit V3R4-H5): the runner signs evidence with V3_ATTEST_KEY from
  // the environment, and the builder verifies promotion provenance against on-disk artifacts. With no
  // key / no promotion configured this run is simply all-shadow, as before.
  // OPTIONAL LLM EVIDENCE LANE (audit D11-1/D4-2): INERT unless V3_LLM=1 AND a key is present — so the
  // on-hold corpus run is never auto-triggered, but a real run is reachable end-to-end (rubrics + vision +
  // gold + both producers). V3_PROVISIONAL=gated requires a canary-promoted mechanism; default ungated.
  const llmKey = process.env.V3_LLM_KEY || process.env.ANTHROPIC_API_KEY || null;
  const runLlm = process.env.V3_LLM === '1' && !!llmKey;
  const runAgent = runLlm ? adapter.makeRunAgent({ transport: adapter.makeAnthropicTransport({ apiKey: llmKey }), model: process.env.V3_LLM_MODEL || undefined }) : null;
  const gold = runLlm ? loadGold().gold : undefined;

  const { candidates, plan, experiments, claimProposals, bundle, built } = await orchestrate(collect, drive, {
    resolveUrl, now: Date.now(),
    attestationKey: attest.loadKey({}),
    artifactVerifier: attest.makeDiskArtifactVerifier(ROOT),
    runLlm, runAgent, captureVision: runLlm, gold,
    provisionalMode: process.env.V3_PROVISIONAL === 'gated' ? 'gated' : 'ungated',
  });
  const w = (name, obj) => fs.writeFileSync(path.join(outDir, name), JSON.stringify(obj, null, 2));
  w('manifest.json', bundle.manifest);   // attested run-manifest (artifact hashes + page identity)
  w('collect.json', collect);            // annotated with applicableScs (oracle-derived)
  w('drive.json', bundle.drive);         // baseline (identity-stamped) — for full-fidelity replay
  w('experiment-candidates.json', candidates);
  w('experiment-plan.json', bundle.plan);
  w('experiments.json', experiments);    // includes unrun[] + environment
  w('claim-proposals.json', claimProposals);
  w('applicability.json', bundle.applicability); // independent applicability observation (Rule 15) — hashed in the manifest, must round-trip for replay (audit V3R5-C1)
  // C0 (Harness 3.3): axe's decided coverage surfaced from the collector's own run — non-authoritative,
  // not hashed, identity-bound. Present whenever the collector ran axe (collect.axeRan).
  if (bundle.checkerFindings) w('checker-findings.json', bundle.checkerFindings);
  // LLM evidence-lane artifacts (only present when the lane ran): non-authoritative, not hashed.
  if (bundle.llm) w('llm.json', bundle.llm);
  if (bundle.judgments) w('judgments.json', bundle.judgments);
  if (bundle.llmRationale) w('llm-rationale.json', bundle.llmRationale);
  if (bundle.llmVision) w('llm-vision.json', bundle.llmVision);
  if (!built.ok) {
    console.error(`REFUSED: ${built.errors.length} gate violation(s):`);
    for (const m of built.errors.slice(0, 40)) console.error('  ' + m);
    process.exit(1);
  }
  w('v3-results.json', built.results);
  const s = built.results.summary;
  console.log(`wrote ${outDir}/v3-results.json — ${s.obligations} obligations, ${s.authoritative} authoritative, ${s.shadow} shadow, ${s.barriersObserved} barrier(s), ${s.autoPartial} auto-PARTIAL.`);
})().catch((e) => { console.error('run-evaluation failed:', e.message); process.exit(1); });
