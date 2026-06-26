#!/usr/bin/env node
'use strict';

// Stratified integration pressure for the broad-scope LLM packet lane.
//
// This consumes the generated fixture validation ledgers, builds the same
// bounded review packets used by the v3 sidecar, runs the judge+critic
// procedure with injected no-network model-like responses, and writes a
// per-aspect positive/negative integration summary.

const fs = require('node:fs');
const path = require('node:path');

const review = require('../../lib/broad-scope-llm-review.js');
const probes = require('../../lib/broad-scope-probes.js');

const ROOT = path.resolve(__dirname, '../../../..');
const DEFAULT_OUT = path.join(ROOT, 'docs/analysis/improvement-research-2026-06/evidence/broad-scope-stratified-packet-pressure');

const VALIDATIONS = [
  'scripts/v3/tests/generated/broad-scope/adaptation/validation.json',
  'scripts/v3/tests/generated/broad-scope/non-interference-interaction/validation.json',
  'scripts/v3/tests/generated/broad-scope/media-process-auth/validation.json',
];

const TO_DETECTOR = {
  'text-spacing': 'text-spacing',
  'resize-text': 'resize-text',
  'forced-colors': 'forced-colors',
  'forced-colors-nontext': 'forced-colors-nontext',
  'reduced-motion': 'reduced-motion',
  'audio-control': 'audio-control',
  'pause-stop-hide': 'motion-control',
  'flash-risk': 'flash-risk',
  'keyboard-trap': 'keyboard-trap',
  'context-change': 'context-change',
  'pointer-operation': 'pointer-operation',
  'pointer-gesture': 'pointer-gesture',
  'dragging-movement': 'dragging-movement',
  'character-shortcuts': 'character-shortcut',
  'status-announcement': 'status-announcement',
  'label-in-name': 'label-in-name',
  'target-size-minimum': 'target-size-minimum',
  'reveal-state-discovery': 'reveal-state-discovery',
  'visual-structure-discovery': 'visual-structure-discovery',
  'visual-content-discovery': 'visual-content-discovery',
  'media-alternatives': 'media-alternative-inventory',
  'redundant-entry': 'redundant-entry-review',
  'accessible-authentication': 'accessible-authentication',
  'language-readability-cognitive': 'plain-language-research',
};

const TO_SC = {
  'text-spacing': '1.4.12',
  'resize-text': '1.4.4',
  'forced-colors': 'EN-C.9.7',
  'forced-colors-nontext': 'EN-C.9.7',
  'reduced-motion': '2.2.2',
  'audio-control': '1.4.2',
  'pause-stop-hide': '2.2.2',
  'flash-risk': '2.3.1',
  'keyboard-trap': '2.1.2',
  'context-change': '3.2.1',
  'pointer-operation': '2.5.1/2.5.2/2.5.7',
  'pointer-gesture': '2.5.1',
  'dragging-movement': '2.5.7',
  'character-shortcuts': '2.1.4',
  'status-announcement': '4.1.3',
  'label-in-name': '2.5.3',
  'target-size-minimum': '2.5.8',
  'reveal-state-discovery': '1.3.1/2.4.3/2.4.10/4.1.2',
  'visual-structure-discovery': '1.3.1/2.4.6/2.4.10',
  'visual-content-discovery': '1.1.1/1.4.1/1.4.5',
  'media-alternatives': '1.2.x',
  'redundant-entry': '3.3.7',
  'accessible-authentication': '3.3.8',
  'language-readability-cognitive': '3.1.5',
};

const TO_FAMILY = {
  'reduced-motion': 'motion-control',
  'pause-stop-hide': 'motion-control',
  'keyboard-trap': 'no-keyboard-trap',
};

function parseArgs(argv) {
  const opts = { outDir: DEFAULT_OUT };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') opts.outDir = path.resolve(ROOT, argv[++i]);
    else if (a === '--help') {
      console.log('usage: node run-broad-scope-stratified-packet-pressure.js [--out dir]');
      process.exit(0);
    } else {
      throw new Error(`unknown argument: ${a}`);
    }
  }
  return opts;
}

function loadRows() {
  const rows = [];
  for (const rel of VALIDATIONS) {
    const v = JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
    for (const r of v.rows || []) rows.push({ ...r, validationFile: rel });
  }
  return rows;
}

function isAuthControlReviewRow(row) {
  return row.aspect === 'accessible-authentication' && row.expected === 'negative';
}

function isRedundantControlReviewRow(row) {
  return row.aspect === 'redundant-entry' && row.expected === 'negative';
}

function isCognitiveControlReviewRow(row) {
  return row.aspect === 'language-readability-cognitive' && row.expected === 'negative';
}

function isMediaControlReviewRow(row) {
  return row.aspect === 'media-alternatives' && row.expected === 'negative';
}

function isKeyboardTrapControlReviewRow(row) {
  return row.aspect === 'keyboard-trap' && row.expected === 'negative';
}

function isAudioControlReviewRow(row) {
  return row.aspect === 'audio-control' && row.expected === 'negative';
}

function isShortcutControlReviewRow(row) {
  return row.aspect === 'character-shortcuts' && row.expected === 'negative';
}

function isStatusControlReviewRow(row) {
  return row.aspect === 'status-announcement' && row.expected === 'negative';
}

function isTargetSizeControlReviewRow(row) {
  return row.aspect === 'target-size-minimum' && row.expected === 'negative';
}

function isLabelInNameControlReviewRow(row) {
  return row.aspect === 'label-in-name' && row.expected === 'negative';
}

function evidenceClaimsForRow(row) {
  if (Array.isArray(row.evidenceClaims) && row.evidenceClaims.length) {
    return row.evidenceClaims.map(String);
  }
  if (!isAuthControlReviewRow(row) && !isRedundantControlReviewRow(row) && !isCognitiveControlReviewRow(row) && !isMediaControlReviewRow(row) && !isKeyboardTrapControlReviewRow(row) && !isAudioControlReviewRow(row) && !isShortcutControlReviewRow(row) && !isStatusControlReviewRow(row) && !isTargetSizeControlReviewRow(row) && !isLabelInNameControlReviewRow(row)) return [];
  if (isLabelInNameControlReviewRow(row)) {
    return ['label-in-name-procedure-run'];
  }
  if (isTargetSizeControlReviewRow(row)) {
    return ['target-size-procedure-run'];
  }
  if (isStatusControlReviewRow(row)) {
    return ['trusted-status-message-procedure-run'];
  }
  if (isShortcutControlReviewRow(row)) {
    return ['trusted-keyboard-shortcut-procedure-run'];
  }
  if (isAudioControlReviewRow(row)) {
    return ['audio-playback-measured-or-applicability-checked'];
  }
  if (isKeyboardTrapControlReviewRow(row)) {
    return ['trusted-keyboard-navigation-observed', 'focus-escape-or-advised-exit-observed'];
  }
  if (isMediaControlReviewRow(row)) {
    return ['owned-media-element', 'media-content-model-observed', 'adequate-alternative-or-exception-observed'];
  }
  const details = row.evidenceDetails || {};
  const candidates = Array.isArray(details.candidates) ? details.candidates : [];
  const claims = new Set();
  for (const candidate of candidates) {
    if (candidate && (
      (isAuthControlReviewRow(row) && candidate.family === 'accessible-authentication') ||
      (isRedundantControlReviewRow(row) && candidate.family === 'redundant-entry-review') ||
      (isCognitiveControlReviewRow(row) && candidate.family === 'plain-language-research')
    )) {
      for (const claim of candidate.evidenceClaims || []) claims.add(String(claim));
    }
  }
  if (!claims.size && isAuthControlReviewRow(row)) {
    const fields = Array.isArray(details.fields) ? details.fields : [];
    if (fields.some((field) => field && field.facts && field.facts.explicitlyNotAuthentication)) {
      claims.add('not-authentication-step');
    }
  }
  return [...claims];
}

function rowToBroadScope(row) {
  const detector = TO_DETECTOR[row.aspect] || row.aspect;
  const sc = row.sc || TO_SC[row.aspect] || '';
  const claimFamily = TO_FAMILY[row.aspect] || null;
  const targetXpath = row.kind === 'json' ? null : (Array.isArray(row.hits) && row.hits[0] ? row.hits[0] : '#target');
  const detail = [
    `generated fixture ${row.id}`,
    `validatorObserved=${!!row.observedPositive}`,
    row.reviewOnlyNegative ? 'reviewOnlyNegative=true' : '',
    isMediaControlReviewRow(row) ? 'scopedMediaControl=true' : '',
    isKeyboardTrapControlReviewRow(row) ? 'scopedKeyboardTrapControl=true' : '',
    isAudioControlReviewRow(row) ? 'scopedAudioControl=true' : '',
    isShortcutControlReviewRow(row) ? 'scopedShortcutControl=true' : '',
    isStatusControlReviewRow(row) ? 'scopedStatusControl=true' : '',
    isTargetSizeControlReviewRow(row) ? 'scopedTargetSizeControl=true' : '',
    isLabelInNameControlReviewRow(row) ? 'scopedLabelInNameControl=true' : '',
    isAuthControlReviewRow(row) ? 'scopedAuthControl=true' : '',
    isRedundantControlReviewRow(row) ? 'scopedRedundantEntryControl=true' : '',
    row.expectedProbeCoverage === false ? 'expectedProbeCoverage=false' : '',
    row.evidenceDetails && Object.keys(row.evidenceDetails).length ? `measuredEvidence=${JSON.stringify(row.evidenceDetails)}` : '',
  ].filter(Boolean).join('; ');
  const evidenceClaims = evidenceClaimsForRow(row);
  return {
    file: row.file || `${row.id}.fixture`,
    runId: 'broad-stratified-packet-pressure',
    pageDigest: `sha256:${row.id}`,
    findings: row.observedPositive || row.reviewOnlyNegative || isAuthControlReviewRow(row) || isRedundantControlReviewRow(row) || isMediaControlReviewRow(row) || isKeyboardTrapControlReviewRow(row) || isAudioControlReviewRow(row) || isShortcutControlReviewRow(row) || isStatusControlReviewRow(row) || isTargetSizeControlReviewRow(row) || isLabelInNameControlReviewRow(row) ? [{
      detector,
      sc,
      kind: row.aspect,
      xpath: targetXpath,
      detail,
      claimFamily,
      evidenceClaims,
      evidenceStrength: (isShortcutControlReviewRow(row) || isStatusControlReviewRow(row) || isTargetSizeControlReviewRow(row) || isLabelInNameControlReviewRow(row)) && evidenceClaims.length
        ? 'fixture-validator-control-proof'
        : (evidenceClaims.length ? 'fixture-validator-positive-proof' : 'review-surface'),
    }] : [],
    scopeWarnings: [],
    visualChecks: [],
  };
}

function packetsForRow(row) {
  if (row.kind === 'json' && row.aspect === 'complete-process') {
    const data = JSON.parse(fs.readFileSync(path.join(ROOT, row.file), 'utf8'));
    return review.buildReviewPacketsFromProcessAnalysis(probes.analyzeProcessManifest(data), {
      id: row.id,
      file: row.file,
      includeControls: row.expected === 'negative',
    });
  }
  if (row.kind === 'json' && row.aspect === 'site-set-consistency') {
    const data = JSON.parse(fs.readFileSync(path.join(ROOT, row.file), 'utf8'));
    return review.buildReviewPacketsFromSiteSetAnalysis(probes.analyzeSiteSetManifest(data), {
      id: row.id,
      file: row.file,
      includeControls: row.expected === 'negative',
    });
  }
  return review.buildReviewPacketsFromBroadScope(rowToBroadScope(row));
}

function judgeVerdictForRow(row, packets = []) {
  if (row.aspect === 'reveal-state-discovery' && packets.length) return 'UNCERTAIN';
  if (row.aspect === 'visual-structure-discovery' && packets.length) return 'UNCERTAIN';
  if (row.aspect === 'visual-content-discovery' && packets.length) return 'UNCERTAIN';
  if (row.aspect === 'complete-process' && row.expected === 'negative' && packets.length) return 'UNCERTAIN';
  if (row.aspect === 'site-set-consistency' && row.expected === 'negative' && packets.length) return 'UNCERTAIN';
  if (isMediaControlReviewRow(row) && packets.length) return 'UNCERTAIN';
  if (isKeyboardTrapControlReviewRow(row) && packets.length) return 'UNCERTAIN';
  if (isAudioControlReviewRow(row) && packets.length) return 'UNCERTAIN';
  if (isShortcutControlReviewRow(row) && packets.length) return 'UNCERTAIN';
  if (isStatusControlReviewRow(row) && packets.length) return 'UNCERTAIN';
  if (isTargetSizeControlReviewRow(row) && packets.length) return 'UNCERTAIN';
  if (isLabelInNameControlReviewRow(row) && packets.length) return 'UNCERTAIN';
  if (packets.some((packet) => review.structuralEvidenceStatus(packet).ok)) return 'LIKELY_BARRIER';
  if (row.reviewOnlyNegative || row.observedPositive || isAuthControlReviewRow(row) || isRedundantControlReviewRow(row) || isCognitiveControlReviewRow(row) || isMediaControlReviewRow(row) || isKeyboardTrapControlReviewRow(row) || isAudioControlReviewRow(row) || isStatusControlReviewRow(row) || isTargetSizeControlReviewRow(row) || isLabelInNameControlReviewRow(row)) return 'UNCERTAIN';
  if (row.expected === 'negative') return 'LIKELY_OK';
  return 'UNCERTAIN';
}

async function reviewPackets(row, packets) {
  if (!packets.length) {
    return {
      reviews: [],
      judgments: { judgments: [] },
      broadScopeRationale: { rationales: [] },
      syntheticVerdict: 'NO_REVIEW',
    };
  }
  const expected = judgeVerdictForRow(row, packets);
  return review.runBroadScopePacketReviews({
    file: row.file,
    runId: 'broad-stratified-packet-pressure',
    pageDigest: `sha256:${row.id}`,
    reviewPackets: packets,
  }, {
    runJudge: async (_messages, packet) => ({
      verdict: expected,
      confidence: expected === 'UNCERTAIN' ? 'low' : 'medium',
      evidenceRefs: packet.evidenceRefs || [],
      summary: `stratified injected judge for ${row.id}`,
      reasoning: expected === 'LIKELY_BARRIER'
        ? 'packet contains structurally complete measured evidence and needs a barrier-oriented review'
        : expected === 'LIKELY_OK'
          ? 'negative fixture produced no positive packet evidence; this is only scoped absence, not a page-wide clear'
          : 'evidence is review-only, unsupported by threshold/flow proof, or contradictory',
    }),
    runCritic: async (_messages, packet, judge) => {
      if (judge.verdict === 'LIKELY_OK' && row.expected === 'positive') return { response: 'DISPUTE', reason: 'positive fixture cannot be cleared' };
      if (judge.verdict === 'LIKELY_OK' && (row.observedPositive || row.reviewOnlyNegative)) return { response: 'DISPUTE', reason: `${packet.aspect} still has a review packet; clear is unsafe` };
      return { response: 'AGREE', reason: 'fixture evidence direction and proposed scoped verdict are aligned' };
    },
  });
}

function blankBucket() {
  return {
    total: 0,
    positives: 0,
    negatives: 0,
    observedPositive: 0,
    packetRows: 0,
    packets: 0,
    convertedJudgments: 0,
    zeroPacketRows: 0,
    reviewOnlyNegativeRows: 0,
    expectedProbeCoverageFalse: 0,
    verdicts: {},
    relatedScs: {},
  };
}

function bump(map, key, n = 1) {
  const k = key || 'NONE';
  map[k] = (map[k] || 0) + n;
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  fs.mkdirSync(opts.outDir, { recursive: true });
  const rows = loadRows();
  const outputs = [];
  const byAspect = {};
  for (const row of rows) {
    const packets = packetsForRow(row);
    const reviewed = await reviewPackets(row, packets);
    const rationales = reviewed.broadScopeRationale.rationales || [];
    const verdict = rationales[0] ? rationales[0].verdict : reviewed.syntheticVerdict;
    const convertedJudgments = reviewed.judgments.judgments.length;
    const out = {
      id: row.id,
      aspect: row.aspect,
      expected: row.expected,
      file: row.file,
      kind: row.kind || 'html',
      observedPositive: !!row.observedPositive,
      pass: !!row.pass,
      reviewOnlyNegative: !!row.reviewOnlyNegative,
      expectedProbeCoverage: row.expectedProbeCoverage !== false,
      packetCount: packets.length,
      convertedJudgments,
      verdict,
      relatedScs: [...new Set(packets.flatMap((p) => Array.isArray(p.relatedScs) ? p.relatedScs : []))],
    };
    outputs.push(out);
    const b = byAspect[row.aspect] || (byAspect[row.aspect] = blankBucket());
    b.total++;
    if (row.expected === 'positive') b.positives++;
    if (row.expected === 'negative') b.negatives++;
    if (row.observedPositive) b.observedPositive++;
    if (packets.length) b.packetRows++;
    else b.zeroPacketRows++;
    if (row.reviewOnlyNegative) b.reviewOnlyNegativeRows++;
    if (row.expectedProbeCoverage === false) b.expectedProbeCoverageFalse++;
    b.packets += packets.length;
    b.convertedJudgments += convertedJudgments;
    bump(b.verdicts, verdict);
    for (const sc of out.relatedScs) bump(b.relatedScs, sc);
  }
  const summary = {
    generatedAt: new Date().toISOString(),
    note: 'Stratified broad-scope packet integration pressure. No external LLM calls; injected judge/critic exercises the same prompt/reconciliation path.',
    total: outputs.length,
    aspects: Object.keys(byAspect).length,
    packets: outputs.reduce((n, r) => n + r.packetCount, 0),
    convertedJudgments: outputs.reduce((n, r) => n + r.convertedJudgments, 0),
    zeroPacketRows: outputs.filter((r) => r.packetCount === 0).length,
    byAspect: Object.fromEntries(Object.entries(byAspect).sort(([a], [b]) => a.localeCompare(b))),
    rows: outputs,
  };
  fs.writeFileSync(path.join(opts.outDir, 'results.json'), JSON.stringify(summary, null, 2) + '\n');
  console.log(path.join(opts.outDir, 'results.json'));
}

main().catch((e) => {
  console.error(e && e.stack ? e.stack : e);
  process.exit(1);
});
