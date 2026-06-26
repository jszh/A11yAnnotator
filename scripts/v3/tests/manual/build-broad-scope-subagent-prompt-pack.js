#!/usr/bin/env node
'use strict';

// Build a no-network prompt pack from the generated broad-scope fixture ledgers.
// The pack uses the real broad-scope packet builder and judge/critic prompt builders,
// so subagents can review the same bounded evidence Claude would receive.

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const review = require('../../lib/broad-scope-llm-review.js');
const probes = require('../../lib/broad-scope-probes.js');

const ROOT = path.resolve(__dirname, '../../../..');
const DEFAULT_OUT = path.join(ROOT, 'docs/analysis/improvement-research-2026-06/evidence/broad-scope-subagent-prompt-pack');

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

let visualManifestCache = null;

function loadVisualManifests() {
  if (visualManifestCache) return visualManifestCache;
  const manifests = [];
  for (const rel of [
    'docs/analysis/improvement-research-2026-06/evidence/broad-scope-fixture-matrix/visuals/manifest.json',
    'docs/analysis/improvement-research-2026-06/evidence/broad-scope-fixture-matrix/visuals/non-adaptation/manifest.json',
  ]) {
    const p = path.join(ROOT, rel);
    if (fs.existsSync(p)) manifests.push(JSON.parse(fs.readFileSync(p, 'utf8')));
  }
  visualManifestCache = manifests;
  return visualManifestCache;
}

function visualCheckForRow(row) {
  const captures = [];
  for (const manifest of loadVisualManifests()) {
    for (const c of manifest.captures || []) {
      if (c.id !== row.id) continue;
      if (Array.isArray(c.captures)) captures.push(...c.captures.map((x) => ({ state: x.state, file: x.file })));
      else captures.push({ state: c.state, file: c.file });
    }
  }
  if (!captures.length) return null;
  return {
    id: `visual:${row.id}`,
    detector: TO_DETECTOR[row.aspect] || row.aspect,
    xpath: row.kind === 'json' ? null : (Array.isArray(row.hits) && row.hits[0] ? row.hits[0] : '#target'),
    agreement: (row.aspect === 'audio-control' || row.aspect === 'flash-risk' || row.aspect === 'media-alternatives') ? null : true,
    note: row.aspect === 'audio-control'
      ? 'audio screenshots are contextual only; playback/audibility/control evidence must come from measured media state'
      : row.aspect === 'flash-risk'
        ? 'flash screenshots are contextual only; flash-rate and area/red-threshold evidence must come from temporal samples'
        : row.aspect === 'media-alternatives'
          ? 'media screenshots are contextual only; target ownership, captions/transcripts/descriptions, and adequacy must come from measured media state and extracted alternatives'
          : 'captured representative visual evidence exists for this generated fixture id',
    captures,
  };
}

function parseArgs(argv) {
  const opts = { outDir: DEFAULT_OUT, samplePerClass: 1 };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') opts.outDir = path.resolve(ROOT, argv[++i]);
    else if (a === '--sample-per-class') opts.samplePerClass = Number.parseInt(argv[++i], 10);
    else if (a === '--help') {
      console.log('usage: node build-broad-scope-subagent-prompt-pack.js [--out dir] [--sample-per-class n]');
      process.exit(0);
    } else {
      throw new Error(`unknown argument: ${a}`);
    }
  }
  if (!Number.isFinite(opts.samplePerClass) || opts.samplePerClass < 1) opts.samplePerClass = 1;
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

function sourceDigest(rel) {
  const p = path.join(ROOT, rel);
  const raw = fs.readFileSync(p);
  let generatedAt = '';
  try {
    generatedAt = String((JSON.parse(raw.toString('utf8')).generatedAt) || '');
  } catch (_) {}
  return {
    file: rel,
    sha256: crypto.createHash('sha256').update(raw).digest('hex'),
    generatedAt,
  };
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
  const evidenceClaims = evidenceClaimsForRow(row);
  const visualCheck = visualCheckForRow(row);
  const includeFinding = row.observedPositive || row.reviewOnlyNegative || isAuthControlReviewRow(row) || isRedundantControlReviewRow(row) || isMediaControlReviewRow(row) || isKeyboardTrapControlReviewRow(row) || isAudioControlReviewRow(row) || isShortcutControlReviewRow(row) || isStatusControlReviewRow(row) || isTargetSizeControlReviewRow(row) || isLabelInNameControlReviewRow(row);
  return {
    file: row.file || `${row.id}.fixture`,
    runId: 'broad-subagent-prompt-pack',
    pageDigest: `sha256:${row.id}`,
    findings: includeFinding ? [{
      detector,
      sc,
      kind: row.aspect,
      xpath: targetXpath,
      detail: [
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
        row.evidenceDetails && Object.keys(row.evidenceDetails).length ? `measuredEvidence=${JSON.stringify(row.evidenceDetails)}` : '',
      ].filter(Boolean).join('; '),
      claimFamily,
      evidenceClaims,
      evidenceStrength: (isShortcutControlReviewRow(row) || isStatusControlReviewRow(row) || isTargetSizeControlReviewRow(row) || isLabelInNameControlReviewRow(row)) && evidenceClaims.length
        ? 'fixture-validator-control-proof'
        : (evidenceClaims.length ? 'fixture-validator-positive-proof' : 'review-surface'),
      ...(visualCheck ? { visualRef: visualCheck.id } : {}),
    }] : [],
    scopeWarnings: [],
    visualChecks: visualCheck ? [visualCheck] : [],
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

function expectedDirection(row) {
  if (row.aspect === 'reveal-state-discovery' && row.observedPositive) return 'UNCERTAIN_DISCOVERY';
  if (row.aspect === 'visual-structure-discovery' && row.observedPositive) return 'UNCERTAIN_DISCOVERY';
  if (row.aspect === 'visual-content-discovery' && row.observedPositive) return 'UNCERTAIN_DISCOVERY';
  if (row.expected === 'positive' && row.observedPositive) return 'LIKELY_BARRIER';
  if (row.expected === 'negative' && row.aspect === 'accessible-authentication') return 'SCOPED_AUTH_CONTROL';
  if (row.expected === 'negative' && row.aspect === 'redundant-entry') return 'SCOPED_REDUNDANT_ENTRY_CONTROL';
  if (row.expected === 'negative' && row.aspect === 'complete-process') return 'SCOPED_PROCESS_CONTROL';
  if (row.expected === 'negative' && row.aspect === 'site-set-consistency') return 'SCOPED_SITE_SET_CONTROL';
  if (row.expected === 'negative' && row.aspect === 'media-alternatives') return 'SCOPED_MEDIA_CONTROL';
  if (row.expected === 'negative' && row.aspect === 'keyboard-trap') return 'SCOPED_KEYBOARD_TRAP_CONTROL';
  if (row.expected === 'negative' && row.aspect === 'audio-control') return 'SCOPED_AUDIO_CONTROL';
  if (row.expected === 'negative' && row.aspect === 'character-shortcuts') return 'SCOPED_CHARACTER_SHORTCUT_CONTROL';
  if (row.expected === 'negative' && row.aspect === 'status-announcement') return 'SCOPED_STATUS_ANNOUNCEMENT_CONTROL';
  if (row.expected === 'negative' && row.aspect === 'target-size-minimum') return 'SCOPED_TARGET_SIZE_CONTROL';
  if (row.expected === 'negative' && row.aspect === 'label-in-name') return 'SCOPED_LABEL_IN_NAME_CONTROL';
  if (row.expected === 'negative' && (row.reviewOnlyNegative || row.observedPositive)) return 'UNCERTAIN';
  if (row.expected === 'negative') return 'NO_PACKET_SCOPED_OK';
  return 'UNCERTAIN';
}

function selectSample(entries, samplePerClass) {
  const selected = [];
  const seen = new Map();
  for (const e of entries) {
    const key = `${e.aspect}:${e.expected}`;
    const n = seen.get(key) || 0;
    if (n >= samplePerClass) continue;
    selected.push(e);
    seen.set(key, n + 1);
  }
  return selected;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  fs.mkdirSync(opts.outDir, { recursive: true });
  const entries = [];
  for (const row of loadRows()) {
    const packets = packetsForRow(row);
    if (!packets.length) {
      entries.push({
        id: row.id,
        aspect: row.aspect,
        file: row.file,
        packetId: null,
        note: 'No packet was produced; no LLM review should be run and this must not be treated as a conformance clear.',
      });
      continue;
    }
    for (const packet of packets) {
      entries.push({
        id: row.id,
        aspect: row.aspect,
        file: row.file,
        packetId: packet.packetId,
        packet,
        judgeMessages: review.buildJudgePrompt(packet),
        criticTemplate: {
          note: 'Fill proposed with the judge JSON, then pass this through buildCriticPrompt(packet, proposed).',
          allowedResponses: ['AGREE', 'DISPUTE'],
        },
      });
    }
  }
  const packetEntries = entries.filter((e) => e.packet);
  const sample = selectSample(packetEntries, opts.samplePerClass);
  const byAspect = {};
  for (const e of entries) {
    const b = byAspect[e.aspect] || (byAspect[e.aspect] = { totalRows: 0, packets: 0, noPacketRows: 0 });
    b.totalRows++;
    if (e.packet) b.packets++;
    else b.noPacketRows++;
  }
  const summary = {
    generatedAt: new Date().toISOString(),
    sourceValidations: VALIDATIONS.map(sourceDigest),
    totalEntries: entries.length,
    packetEntries: packetEntries.length,
    noPacketEntries: entries.length - packetEntries.length,
    sampleEntries: sample.length,
    byAspect,
  };
  const answerKey = {
    summary: {
      generatedAt: summary.generatedAt,
      totalEntries: entries.length,
      note: 'Fixture expected labels are kept separate from judge prompts. Do not pass this file to a WCAG judge.',
    },
    entries: loadRows().map((row) => ({
      id: row.id,
      aspect: row.aspect,
      expected: row.expected,
      expectedDirection: expectedDirection(row),
      file: row.file,
    })),
  };
  fs.writeFileSync(path.join(opts.outDir, 'prompts.json'), JSON.stringify({ summary, entries }, null, 2) + '\n');
  fs.writeFileSync(path.join(opts.outDir, 'sample-prompts.json'), JSON.stringify({ summary, entries: sample }, null, 2) + '\n');
  fs.writeFileSync(path.join(opts.outDir, 'answer-key.json'), JSON.stringify(answerKey, null, 2) + '\n');
  console.log(path.join(opts.outDir, 'prompts.json'));
  console.log(path.join(opts.outDir, 'sample-prompts.json'));
  console.log(path.join(opts.outDir, 'answer-key.json'));
}

main();
