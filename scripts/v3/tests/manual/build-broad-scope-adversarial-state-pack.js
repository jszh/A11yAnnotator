#!/usr/bin/env node
'use strict';

// Construct adversarial state packets that include or withhold the exact WCAG
// evidence facts missing from the basic state traces. These are no-browser,
// no-network prompt fixtures for the no-human LLM review procedure.

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../../../..');
const OUT = path.join(ROOT, 'docs/analysis/improvement-research-2026-06/evidence/broad-scope-adversarial-state-pack');

const cases = [
  {
    id: 'adv-motion-barrier',
    aspect: 'pause-stop-hide',
    sc: '2.2.2',
    expected: 'LIKELY_BARRIER',
    requiredEvidence: ['auto-motion-persists', 'duration-or-looping', 'no-working-pause-stop-hide', 'parallel-non-essential-content'],
    observations: {
      target: { text: 'Stock ticker', animationDuration: '8s', animationIterationCount: 'infinite', transformDeltaPx: 14 },
      controlsSearched: ['button', '[aria-label*=pause]', '[aria-label*=stop]', '[aria-label*=hide]', 'video[controls]', 'audio[controls]'],
      controlsFound: [],
      pageContext: 'decorative/secondary ticker shown alongside main article content',
      evidenceClaims: ['auto-motion-persists', 'duration-or-looping', 'no-working-pause-stop-hide', 'parallel-non-essential-content'],
    },
  },
  {
    id: 'adv-motion-controlled',
    aspect: 'pause-stop-hide',
    sc: '2.2.2',
    expected: 'LIKELY_OK',
    requiredEvidence: ['auto-motion-persists', 'duration-or-looping', 'working-pause-stop-hide'],
    observations: {
      target: { text: 'Carousel', animationDuration: '8s', animationIterationCount: 'infinite', transformDeltaPx: 10 },
      controlExercised: { label: 'Pause animation', beforeAnimationPlayState: 'running', afterClickAnimationPlayState: 'paused' },
      evidenceClaims: ['auto-motion-persists', 'duration-or-looping', 'working-pause-stop-hide'],
    },
  },
  {
    id: 'adv-context-barrier',
    aspect: 'context-change',
    sc: '3.2.1',
    expected: 'LIKELY_BARRIER',
    requiredEvidence: ['trusted-focus-or-input-action', 'context-change-observed', 'not-advised-beforehand'],
    observations: {
      beforeFocus: { url: '/checkout', hash: '', activeElement: '' },
      afterFocus: { url: '/checkout#shipping', hash: '#shipping', activeElement: 'shipping-postal-code' },
      labelAndInstructions: 'Postal code',
      nearbyAdviceText: '',
      evidenceClaims: ['trusted-focus-or-input-action', 'context-change-observed', 'not-advised-beforehand'],
    },
  },
  {
    id: 'adv-context-advised',
    aspect: 'context-change',
    sc: '3.2.1',
    expected: 'LIKELY_OK',
    requiredEvidence: ['trusted-focus-or-input-action', 'context-change-observed', 'advised-beforehand'],
    observations: {
      beforeFocus: { url: '/checkout', hash: '', activeElement: '' },
      afterFocus: { url: '/checkout#shipping-help', hash: '#shipping-help', activeElement: 'shipping-postal-code' },
      labelAndInstructions: 'Postal code. Focusing this field opens shipping help below.',
      nearbyAdviceText: 'Focusing this field opens shipping help below.',
      evidenceClaims: ['trusted-focus-or-input-action', 'context-change-observed', 'advised-beforehand'],
    },
  },
  {
    id: 'adv-pointer-barrier',
    aspect: 'pointer-operation',
    sc: '2.5.2',
    expected: 'LIKELY_BARRIER',
    requiredEvidence: ['trusted-pointer-sequence', 'down-event-completes-action', 'no-abort-undo-reversal-or-up-event-completion'],
    observations: {
      before: { activated: false, value: 'not submitted' },
      afterPointerDown: { activated: true, value: 'submitted' },
      afterMoveAwayAndPointerUp: { activated: true, value: 'submitted' },
      undoOrCancelControlsFound: [],
      evidenceClaims: ['trusted-pointer-sequence', 'down-event-completes-action', 'no-abort-undo-reversal-or-up-event-completion'],
    },
  },
  {
    id: 'adv-pointer-up-event',
    aspect: 'pointer-operation',
    sc: '2.5.2',
    expected: 'LIKELY_OK',
    requiredEvidence: ['trusted-pointer-sequence', 'up-event-completion-or-abort'],
    observations: {
      before: { activated: false },
      afterPointerDown: { activated: false },
      afterMoveAwayAndPointerUp: { activated: false },
      afterSecondPointerUpOnTarget: { activated: true },
      evidenceClaims: ['trusted-pointer-sequence', 'up-event-completion-or-abort'],
    },
  },
  {
    id: 'adv-trap-barrier',
    aspect: 'keyboard-trap',
    sc: '2.1.2',
    expected: 'LIKELY_BARRIER',
    requiredEvidence: ['trusted-tab-or-shift-tab-trap', 'focus-cannot-leave-region-or-element', 'no-advised-keyboard-exit'],
    observations: {
      focusSequence: ['before-link', 'target', 'target', 'target'],
      shiftTabSequence: ['target', 'target'],
      advisedExitText: '',
      evidenceClaims: ['trusted-tab-or-shift-tab-trap', 'focus-cannot-leave-region-or-element', 'no-advised-keyboard-exit'],
    },
  },
  {
    id: 'adv-trap-advised-exit',
    aspect: 'keyboard-trap',
    sc: '2.1.2',
    expected: 'LIKELY_OK',
    requiredEvidence: ['trusted-tab-or-shift-tab-trap', 'focus-cannot-leave-region-or-element', 'advised-keyboard-exit-works'],
    observations: {
      focusSequence: ['before-link', 'target', 'target'],
      advisedExitText: 'Press Escape to leave the widget.',
      afterEscapeFocus: 'after-link',
      evidenceClaims: ['trusted-tab-or-shift-tab-trap', 'focus-cannot-leave-region-or-element', 'advised-keyboard-exit-works'],
    },
  },
];

function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const summary = {
    generatedAt: new Date().toISOString(),
    total: cases.length,
    byAspect: cases.reduce((m, c) => {
      const b = m[c.aspect] || (m[c.aspect] = { total: 0, barrier: 0, ok: 0 });
      b.total++;
      if (c.expected === 'LIKELY_BARRIER') b.barrier++;
      if (c.expected === 'LIKELY_OK') b.ok++;
      return m;
    }, {}),
  };
  fs.writeFileSync(path.join(OUT, 'adversarial-state-prompts.json'), JSON.stringify({ summary, cases }, null, 2) + '\n');
  console.log(path.join(OUT, 'adversarial-state-prompts.json'));
}

main();
