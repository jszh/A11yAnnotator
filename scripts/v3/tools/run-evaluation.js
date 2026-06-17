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
  // SINGLE LLM ACTIVATION GATE (Harness 3.4): one switch — V3_LLM=1 turns the judge ON, unset/0 is OFF and
  // byte-identical to today's deterministic run. ON authenticates via the Claude Code SUBSCRIPTION (Agent
  // SDK + CLAUDE_CODE_OAUTH_TOKEN — NO metered API key; .env, never committed). The on-hold corpus run is
  // never auto-triggered — OFF is the default and only an explicit V3_LLM=1 fires it. V3_PROVISIONAL=gated
  // requires a canary-promoted mechanism; default ungated. Model defaults to sonnet-4.6 (V3_LLM_MODEL).
  require('../lib/load-env.js').loadEnv(ROOT); // populate CLAUDE_CODE_OAUTH_TOKEN from .env if present
  const runLlm = process.env.V3_LLM === '1';
  // PHASE 2: V3_LLM_TOOLS=1 (on top of V3_LLM=1) gives the judge the live in-process CDP tool repertoire
  // (multi-turn). The orchestrator builds the tool-enabled runAgent from llmTransportConfig (it owns the
  // live page session); the single-shot runAgent below is the no-tools fallback.
  const llmTransportConfig = runLlm ? {
    oauthToken: process.env.CLAUDE_CODE_OAUTH_TOKEN,
    model: process.env.V3_LLM_MODEL || 'claude-sonnet-4-6',
    perTurnTimeoutMs: +(process.env.V3_LLM_TURN_TIMEOUT_MS || 60000),
    runTimeoutMs: +(process.env.V3_LLM_RUN_TIMEOUT_MS || 120000),
  } : undefined;
  const runAgent = runLlm ? adapter.makeRunAgent({ transport: adapter.makeClaudeSdkTransport(llmTransportConfig), model: llmTransportConfig.model }) : null;
  const llmTools = runLlm && process.env.V3_LLM_TOOLS === '1';
  const gold = runLlm ? loadGold().gold : undefined;
  // INSTRUMENT lane (Harness 3.3, B): opt-in shadow VSR/keyboard findings. Independent of the LLM lane —
  // no API key, no cost — so it can run on its own (V3_INSTRUMENTS=1) for the annotation-input corpus.
  const runInstruments = process.env.V3_INSTRUMENTS === '1';
  // EXTERNAL CHECKER lane (Harness 3.3, C1): opt-in IBM Equal Access. INERT unless V3_CHECKER=1 AND the
  // `accessibility-checker` package is installed — it fetches its rulepack from a CDN at runtime, so it is
  // never auto-run (records checkerUnavailable when absent).
  const runChecker = process.env.V3_CHECKER === '1';

  const { candidates, plan, experiments, claimProposals, bundle, built } = await orchestrate(collect, drive, {
    resolveUrl, now: Date.now(),
    attestationKey: attest.loadKey({}),
    artifactVerifier: attest.makeDiskArtifactVerifier(ROOT),
    runLlm, runAgent, captureVision: runLlm, gold, runInstruments, runChecker,
    llmConcurrency: +(process.env.V3_LLM_CONCURRENCY || 10), // bounded judge concurrency (429-backoff is the real governor)
    llmTools, llmTransportConfig, // PHASE 2: live CDP tool session (opt-in V3_LLM_TOOLS)
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
  if (bundle.instruments) w('instruments.json', bundle.instruments); // B: shadow VSR/keyboard findings (V3_INSTRUMENTS)
  if (built.ok && built.results.triageCandidates && built.results.triageCandidates.length) w('triage-candidates.json', built.results.triageCandidates); // E: non-ledger semantic review queue
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
