#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../../../..');
const DEFAULT_OUT = path.join(ROOT, 'docs/analysis/improvement-research-2026-06/evidence/broad-scope-state-prompt-pack');
const MANIFEST = 'docs/analysis/improvement-research-2026-06/evidence/broad-scope-fixture-matrix/visuals/non-adaptation/manifest.json';

const REQUIRED = {
  'pause-stop-hide': ['auto-motion-persists', 'duration-or-looping', 'no-working-pause-stop-hide', 'parallel-non-essential-content'],
  'flash-risk': ['frame-sampled-flash-rate', 'area-or-red-threshold'],
  'context-change': ['trusted-focus-or-input-action', 'context-change-observed', 'not-advised-beforehand'],
  'pointer-operation': ['trusted-pointer-sequence', 'down-event-completes-action', 'no-abort-undo-reversal-or-up-event-completion'],
  'pointer-gesture': ['trusted-path-gesture-operation', 'path-based-functionality-observed', 'target-click-and-marked-alternatives-only-no-equivalent-observed'],
  'dragging-movement': ['trusted-drag-operation', 'dragging-functionality-observed', 'scoped-no-target-click-or-marked-alternative-observed'],
  'keyboard-trap': ['trusted-tab-or-shift-tab-trap', 'focus-cannot-leave-region-or-element', 'no-advised-keyboard-exit'],
  'status-announcement': ['trusted-activation-action', 'status-message-observed', 'focus-not-moved-to-message', 'no-live-region-or-programmatic-status-role'],
  'label-in-name': ['visible-text-label', 'accessible-name-observed', 'accessible-name-missing-visible-text'],
  'target-size-minimum': ['rendered-pointer-target', 'measured-target-size-below-24', 'target-spacing-intersection'],
  'media-alternatives': ['owned-media-element', 'media-content-model-observed', 'alternative-presence-and-adequacy-evidence'],
};

const SC = {
  'pause-stop-hide': '2.2.2',
  'flash-risk': '2.3.1',
  'context-change': '3.2.1',
  'pointer-operation': '2.5.2',
  'pointer-gesture': '2.5.1',
  'dragging-movement': '2.5.7',
  'keyboard-trap': '2.1.2',
  'status-announcement': '4.1.3',
  'label-in-name': '2.5.3',
  'target-size-minimum': '2.5.8',
  'media-alternatives': '1.2.x',
};

function parseArgs(argv) {
  const opts = { outDir: DEFAULT_OUT };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--out') opts.outDir = path.resolve(ROOT, argv[++i]);
    else if (a === '--help') {
      console.log('usage: node build-broad-scope-state-prompt-pack.js [--out dir]');
      process.exit(0);
    } else throw new Error(`unknown argument: ${a}`);
  }
  return opts;
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const m = JSON.parse(fs.readFileSync(path.join(ROOT, MANIFEST), 'utf8'));
  const wanted = new Set(Object.keys(REQUIRED));
  const entries = (m.captures || [])
    .filter((c) => wanted.has(c.aspect))
    .map((c) => ({
      id: c.id,
      aspect: c.aspect,
      sc: SC[c.aspect],
      requiredEvidence: REQUIRED[c.aspect],
      observations: c.observations || {},
      imageRefs: (c.captures || []).map((x) => ({ state: x.state, file: x.file })),
      prompt: [
        'You are a WCAG/Trusted Tester state-trace judge.',
        'Use only the JSON observations and state labels.',
        'Return LIKELY_BARRIER only when the trace supports every required evidence item.',
        'Return LIKELY_OK only for scoped negative controls where the trace positively shows the alleged issue is absent.',
        'Return UNCERTAIN when threshold, exception, alternative, or process context is missing.',
      ].join(' '),
    }))
    .sort((a, b) => a.aspect.localeCompare(b.aspect) || a.id.localeCompare(b.id));
  const summary = {
    generatedAt: new Date().toISOString(),
    entries: entries.length,
    byAspect: entries.reduce((m2, e) => {
      const b = m2[e.aspect] || (m2[e.aspect] = { total: 0 });
      b.total++;
      return m2;
    }, {}),
  };
  const answerKey = {
    summary: {
      generatedAt: summary.generatedAt,
      entries: entries.length,
      note: 'Fixture expected labels are separate from state prompts. Do not pass this file to a WCAG judge.',
    },
    entries: (m.captures || [])
      .filter((c) => wanted.has(c.aspect))
      .map((c) => ({ id: c.id, aspect: c.aspect, expected: c.expected })),
  };
  fs.mkdirSync(opts.outDir, { recursive: true });
  fs.writeFileSync(path.join(opts.outDir, 'state-prompts.json'), JSON.stringify({ summary, entries }, null, 2) + '\n');
  fs.writeFileSync(path.join(opts.outDir, 'answer-key.json'), JSON.stringify(answerKey, null, 2) + '\n');
  console.log(path.join(opts.outDir, 'state-prompts.json'));
  console.log(path.join(opts.outDir, 'answer-key.json'));
}

main();
