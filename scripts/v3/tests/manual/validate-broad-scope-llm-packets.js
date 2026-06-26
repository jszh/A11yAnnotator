'use strict';

const fs = require('node:fs');
const path = require('node:path');
const review = require('../../lib/broad-scope-llm-review.js');
const probes = require('../../lib/broad-scope-probes.js');

const ROOT = path.resolve(__dirname, '../../../..');
const OUT = path.join(ROOT, 'scripts/v3/tests/generated/broad-scope/llm-packet-validation.json');

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
  'pointer-operation': '2.5.2',
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

function loadRows() {
  const rows = [];
  for (const rel of VALIDATIONS) {
    const v = JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
    for (const r of v.rows || []) rows.push(r);
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
  const xpath = row.kind === 'json' ? null : (Array.isArray(row.hits) && row.hits[0] ? row.hits[0] : '#target');
  const evidenceClaims = evidenceClaimsForRow(row);
  const finding = {
    detector,
    sc,
    kind: row.aspect,
    xpath,
    detail: [
      `generated fixture ${row.id}`,
      `validatorObserved=${row.observedPositive}`,
      isMediaControlReviewRow(row) ? 'scopedMediaControl=true' : '',
      isKeyboardTrapControlReviewRow(row) ? 'scopedKeyboardTrapControl=true' : '',
      isAudioControlReviewRow(row) ? 'scopedAudioControl=true' : '',
      isShortcutControlReviewRow(row) ? 'scopedShortcutControl=true' : '',
      isStatusControlReviewRow(row) ? 'scopedStatusControl=true' : '',
      isTargetSizeControlReviewRow(row) ? 'scopedTargetSizeControl=true' : '',
      isLabelInNameControlReviewRow(row) ? 'scopedLabelInNameControl=true' : '',
      isAuthControlReviewRow(row) ? 'scopedAuthControl=true' : '',
      isRedundantControlReviewRow(row) ? 'scopedRedundantEntryControl=true' : '',
      row.evidenceDetails && Object.keys(row.evidenceDetails).length ? `measuredEvidence=${JSON.stringify(row.evidenceDetails)}` : '',
    ].filter(Boolean).join('; '),
    evidenceClaims,
    evidenceStrength: (isShortcutControlReviewRow(row) || isStatusControlReviewRow(row) || isTargetSizeControlReviewRow(row) || isLabelInNameControlReviewRow(row)) && evidenceClaims.length
      ? 'fixture-validator-control-proof'
      : (evidenceClaims.length ? 'fixture-validator-positive-proof' : 'review-surface'),
  };
  return {
    file: row.file || `${row.id}.fixture`,
    runId: 'broad-generated',
    pageDigest: `sha256:${row.id}`,
    findings: row.observedPositive || row.reviewOnlyNegative || isAuthControlReviewRow(row) || isRedundantControlReviewRow(row) || isMediaControlReviewRow(row) || isKeyboardTrapControlReviewRow(row) || isAudioControlReviewRow(row) || isShortcutControlReviewRow(row) || isStatusControlReviewRow(row) || isTargetSizeControlReviewRow(row) || isLabelInNameControlReviewRow(row) ? [finding] : [],
    scopeWarnings: row.expected === 'positive' && row.pass === false ? ['fixture-validation-failed'] : [],
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

function evidenceDrivenJudge(row, packets) {
  if (row.aspect === 'reveal-state-discovery' && (packets || []).length) return 'UNCERTAIN';
  if (row.aspect === 'visual-structure-discovery' && (packets || []).length) return 'UNCERTAIN';
  if (row.aspect === 'visual-content-discovery' && (packets || []).length) return 'UNCERTAIN';
  if ((packets || []).some((packet) => review.structuralEvidenceStatus(packet).ok)) return 'LIKELY_BARRIER';
  if (row.observedPositive || row.reviewOnlyNegative || isMediaControlReviewRow(row) || isKeyboardTrapControlReviewRow(row) || isAudioControlReviewRow(row) || isShortcutControlReviewRow(row) || isStatusControlReviewRow(row) || isTargetSizeControlReviewRow(row) || isLabelInNameControlReviewRow(row)) return 'UNCERTAIN';
  return 'UNCERTAIN';
}

async function main() {
  const rows = loadRows();
  const outputs = [];
  for (const row of rows) {
    const broadScope = rowToBroadScope(row);
    broadScope.reviewPackets = packetsForRow(row);
    if (!broadScope.reviewPackets.length) {
      outputs.push({
        id: row.id,
        aspect: row.aspect,
        expected: row.expected,
        observedPositive: !!row.observedPositive,
        pass: !!row.pass,
        packetCount: 0,
        convertedJudgments: 0,
        verdict: 'NO_REVIEW',
        convertedToJudgment: false,
      });
      continue;
    }
    const expected = evidenceDrivenJudge(row, broadScope.reviewPackets);
    const out = await review.runBroadScopePacketReviews(broadScope, {
      runJudge: async (_messages, packet) => ({
        verdict: expected,
        confidence: expected === 'UNCERTAIN' ? 'low' : 'medium',
        evidenceRefs: packet.evidenceRefs || [],
        summary: `mock independent judge for ${row.id}`,
        reasoning: expected === 'LIKELY_OK'
          ? 'no positive detector evidence was present'
          : expected === 'LIKELY_BARRIER'
            ? 'packet contains structurally complete measured evidence'
            : 'evidence is review-only, structurally incomplete, or contradictory',
      }),
      runCritic: async (_messages, _packet, judge) => {
        if (judge.verdict === 'LIKELY_OK' && row.expected === 'positive') return { response: 'DISPUTE', reason: 'positive fixture cannot clear from absence' };
        if (judge.verdict === 'LIKELY_OK' && row.observedPositive) return { response: 'DISPUTE', reason: 'negative/control row still has a review candidate; clear is unsafe' };
        return { response: 'AGREE', reason: 'fixture expectation and evidence direction agree' };
      },
    });
    const rationale = out.broadScopeRationale.rationales[0] || null;
    outputs.push({
      id: row.id,
      aspect: row.aspect,
      expected: row.expected,
      observedPositive: !!row.observedPositive,
      pass: !!row.pass,
      packetCount: broadScope.reviewPackets.length,
      convertedJudgments: out.judgments.judgments.length,
      verdict: rationale && rationale.verdict,
      convertedToJudgment: !!(rationale && rationale.convertedToJudgment),
    });
  }
  const summary = {
    generatedAt: new Date().toISOString(),
    total: outputs.length,
    packets: outputs.reduce((n, r) => n + r.packetCount, 0),
    convertedJudgments: outputs.reduce((n, r) => n + r.convertedJudgments, 0),
    verdicts: outputs.reduce((m, r) => { m[r.verdict || 'NONE'] = (m[r.verdict || 'NONE'] || 0) + 1; return m; }, {}),
    rows: outputs,
  };
  fs.writeFileSync(OUT, JSON.stringify(summary, null, 2) + '\n');
  console.log(OUT);
}

main().catch((e) => {
  console.error(e && e.stack ? e.stack : e);
  process.exit(1);
});
