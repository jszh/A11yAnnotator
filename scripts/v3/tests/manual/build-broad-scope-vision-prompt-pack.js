#!/usr/bin/env node
'use strict';

// Build a compact visual-review prompt pack for broad-scope fixtures with screenshots.
// This is a bridge artifact: it links generated validation rows, packet evidence, and
// captured before/after image paths so vision-capable LLM judges can review the same
// bounded packets used by the harness.

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../../../..');
const DEFAULT_OUT = path.join(ROOT, 'docs/analysis/improvement-research-2026-06/evidence/broad-scope-vision-prompt-pack');

const VALIDATIONS = [
  'scripts/v3/tests/generated/broad-scope/adaptation/validation.json',
  'scripts/v3/tests/generated/broad-scope/non-interference-interaction/validation.json',
  'scripts/v3/tests/generated/broad-scope/media-process-auth/validation.json',
];

const REQUIRED = {
  'text-spacing': ['after-spacing-loss', 'before-after-visual-agreement', 'content-or-function-loss'],
  'resize-text': ['200-percent-text-size-loss', 'before-after-visual-agreement', 'content-or-function-loss'],
  'forced-colors': ['forced-colors-render', 'essential-meaning-or-affordance-loss'],
  'forced-colors-nontext': ['forced-colors-render', 'non-text-boundary-or-state-loss', 'essential-control-boundary'],
  'audio-control': ['audible-autoplay-more-than-three-seconds', 'no-independent-control'],
  'reduced-motion': ['auto-motion-persists', 'duration-or-looping', 'no-working-pause-stop-hide', 'parallel-non-essential-content'],
  'pause-stop-hide': ['auto-motion-persists', 'duration-or-looping', 'no-working-pause-stop-hide', 'parallel-non-essential-content'],
  'flash-risk': ['frame-sampled-flash-rate', 'area-or-red-threshold'],
  'keyboard-trap': ['trusted-tab-or-shift-tab-trap', 'focus-cannot-leave-region-or-element', 'no-advised-keyboard-exit'],
  'context-change': ['trusted-focus-or-input-action', 'context-change-observed', 'not-advised-beforehand'],
  'pointer-operation': ['trusted-pointer-sequence', 'down-event-completes-action', 'no-abort-undo-reversal-or-up-event-completion'],
  'pointer-gesture': ['trusted-path-gesture-operation', 'path-based-functionality-observed', 'target-click-and-marked-alternatives-only-no-equivalent-observed'],
  'dragging-movement': ['trusted-drag-operation', 'dragging-functionality-observed', 'scoped-no-target-click-or-marked-alternative-observed'],
  'status-announcement': ['trusted-activation-action', 'status-message-observed', 'focus-not-moved-to-message', 'no-live-region-or-programmatic-status-role'],
  'label-in-name': ['visible-text-label', 'accessible-name-observed', 'accessible-name-missing-visible-text'],
  'target-size-minimum': ['rendered-pointer-target', 'measured-target-size-below-24', 'target-spacing-intersection'],
  'media-alternatives': ['owned-media-element', 'media-content-model-observed', 'alternative-presence-and-adequacy-evidence'],
  'accessible-authentication': ['authentication-step', 'cognitive-function-test', 'missing-allowed-alternative-or-exception'],
};

const SC = {
  'text-spacing': '1.4.12',
  'resize-text': '1.4.4',
  'forced-colors': 'EN-C.9.7',
  'forced-colors-nontext': 'EN-C.9.7',
  'audio-control': '1.4.2',
  'reduced-motion': '2.2.2',
  'pause-stop-hide': '2.2.2',
  'flash-risk': '2.3.1',
  'keyboard-trap': '2.1.2',
  'context-change': '3.2.1',
  'pointer-operation': '2.5.1/2.5.2/2.5.7',
  'pointer-gesture': '2.5.1',
  'dragging-movement': '2.5.7',
  'status-announcement': '4.1.3',
  'label-in-name': '2.5.3',
  'target-size-minimum': '2.5.8',
  'media-alternatives': '1.2.x',
  'accessible-authentication': '3.3.8',
};

function parseArgs(argv) {
  const opts = { outDir: DEFAULT_OUT };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') opts.outDir = path.resolve(ROOT, argv[++i]);
    else if (a === '--help') {
      console.log('usage: node build-broad-scope-vision-prompt-pack.js [--out dir]');
      process.exit(0);
    } else {
      throw new Error(`unknown argument: ${a}`);
    }
  }
  return opts;
}

function loadRows() {
  const rows = new Map();
  for (const rel of VALIDATIONS) {
    const p = path.join(ROOT, rel);
    const v = JSON.parse(fs.readFileSync(p, 'utf8'));
    for (const r of v.rows || []) rows.set(r.id, { ...r, validationFile: rel });
  }
  return rows;
}

function loadVisualCaptures() {
  const out = new Map();
  for (const rel of [
    'docs/analysis/improvement-research-2026-06/evidence/broad-scope-fixture-matrix/visuals/manifest.json',
    'docs/analysis/improvement-research-2026-06/evidence/broad-scope-fixture-matrix/visuals/non-adaptation/manifest.json',
  ]) {
    const p = path.join(ROOT, rel);
    if (!fs.existsSync(p)) continue;
    const m = JSON.parse(fs.readFileSync(p, 'utf8'));
    for (const c of m.captures || []) {
      const arr = out.get(c.id) || [];
      if (Array.isArray(c.captures)) arr.push(...c.captures.map((x) => ({ state: x.state, file: x.file })));
      else arr.push({ state: c.state, file: c.file });
      out.set(c.id, arr);
    }
  }
  return out;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const rows = loadRows();
  const captures = loadVisualCaptures();
  const entries = [];
  for (const [id, images] of captures.entries()) {
    const row = rows.get(id);
    if (!row) continue;
    entries.push({
      id,
      aspect: row.aspect,
      sc: row.sc || SC[row.aspect] || '',
      file: row.file,
      observedPositive: !!row.observedPositive,
      requiredEvidence: REQUIRED[row.aspect] || [],
      images,
      prompt: [
        'You are a vision-capable WCAG/Trusted Tester/EN judge.',
        'Use only the packet facts and attached screenshots/state labels.',
        'Return LIKELY_BARRIER only if the images/state labels support every required evidence item.',
        'Return UNCERTAIN when the screenshots are merely contextual or threshold/process/semantic evidence is missing.',
        'Return LIKELY_OK only for scoped negative controls where the images positively show the alleged visual issue is absent.',
      ].join(' '),
    });
  }
  entries.sort((a, b) => a.aspect.localeCompare(b.aspect) || a.id.localeCompare(b.id));
  const summary = {
    generatedAt: new Date().toISOString(),
    entries: entries.length,
    byAspect: entries.reduce((m, e) => {
      const b = m[e.aspect] || (m[e.aspect] = { total: 0 });
      b.total++;
      return m;
    }, {}),
  };
  const answerKey = {
    summary: {
      generatedAt: summary.generatedAt,
      entries: entries.length,
      note: 'Fixture expected labels are separate from vision prompts. Do not pass this file to a WCAG judge.',
    },
    entries: [...captures.keys()].map((id) => {
      const row = rows.get(id);
      return row ? { id, aspect: row.aspect, expected: row.expected, file: row.file } : null;
    }).filter(Boolean),
  };
  fs.mkdirSync(opts.outDir, { recursive: true });
  fs.writeFileSync(path.join(opts.outDir, 'vision-prompts.json'), JSON.stringify({ summary, entries }, null, 2) + '\n');
  fs.writeFileSync(path.join(opts.outDir, 'answer-key.json'), JSON.stringify(answerKey, null, 2) + '\n');
  console.log(path.join(opts.outDir, 'vision-prompts.json'));
  console.log(path.join(opts.outDir, 'answer-key.json'));
}

main();
