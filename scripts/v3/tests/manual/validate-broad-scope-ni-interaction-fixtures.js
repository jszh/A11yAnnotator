'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const puppeteer = require('puppeteer');
const probes = require('../../lib/broad-scope-probes.js');

const ROOT = path.resolve(__dirname, '../../../..');
const BASE = path.join(ROOT, 'scripts/v3/tests/generated/broad-scope/non-interference-interaction');
const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH
  || process.env.CHROME_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const FAMILY = {
  'audio-control': 'audio-control',
  'pause-stop-hide': 'motion-control',
  'flash-risk': 'flash-risk',
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
};

const EVIDENCE_CLAIMS = {
  'keyboard-trap': ['trusted-tab-or-shift-tab-trap', 'focus-cannot-leave-region-or-element', 'no-advised-keyboard-exit'],
  'character-shortcuts': ['trusted-keyboard-action', 'single-printable-character-shortcut-observed', 'no-off-remap-or-focus-scope-exception'],
  'status-announcement': ['trusted-activation-action', 'status-message-observed', 'focus-not-moved-to-message', 'no-live-region-or-programmatic-status-role'],
  'label-in-name': ['visible-text-label', 'accessible-name-observed', 'accessible-name-missing-visible-text'],
  'target-size-minimum': ['rendered-pointer-target', 'measured-target-size-below-24', 'target-spacing-intersection'],
  'pointer-gesture': ['trusted-path-gesture-operation', 'path-based-functionality-observed', 'target-click-and-marked-alternatives-only-no-equivalent-observed'],
  'dragging-movement': ['trusted-drag-operation', 'dragging-functionality-observed', 'scoped-no-target-click-or-marked-alternative-observed'],
  'reveal-state-discovery': ['trusted-reveal-action', 'state-reached', 'newly-rendered-content-or-focusable'],
  'visual-structure-discovery': ['rendered-visual-structure-signal', 'programmatic-structure-missing', 'content-region-observed'],
  'visual-content-discovery': ['rendered-non-dom-visual-content-signal', 'semantic-alternative-missing-or-unproven', 'content-region-observed'],
};

function targetSizeControlEvidence(observations = []) {
  const obs = observations.find((x) => x && x.path === '#target');
  if (!obs) return [];
  const claims = new Set(['target-size-procedure-run', 'rendered-pointer-target']);
  const box = obs.box || {};
  const minDim = Math.min(Number(box.w) || 0, Number(box.h) || 0);
  if (minDim >= 24 || (obs.result && obs.result.reason === 'target admits a 24x24 square')) {
    claims.add('target-size-at-least-24');
  } else {
    claims.add('measured-target-size-below-24');
  }
  if (obs.result && /spacing exception/i.test(String(obs.result.reason || ''))) {
    claims.add('target-spacing-exception-observed');
  }
  if (obs.inlineException || (obs.inlineCandidate && obs.inSentence)) {
    claims.add('inline-target-exception-observed');
  }
  if (obs.equivalent) claims.add('equivalent-target-exception-observed');
  if (obs.essential) claims.add('essential-target-exception-observed');
  if (obs.uaControl) claims.add('ua-control-exception-observed');
  return [...claims];
}

function labelInNameControlEvidence(observations = []) {
  const obs = observations.find((x) => x && x.path === '#target');
  if (!obs) return [];
  const claims = new Set(['label-in-name-procedure-run']);
  if (obs.visibleText || obs.visibleNorm) claims.add('visible-text-label');
  if (obs.accessibleName || obs.nameNorm) claims.add('accessible-name-observed');
  if (obs.containsVisibleText === true) claims.add('accessible-name-contains-visible-text');
  if (obs.nameSource) claims.add(`accessible-name-source-${String(obs.nameSource).replace(/[^a-z0-9_-]+/gi, '-').toLowerCase()}`);
  return [...claims];
}

async function hasParallelNonEssentialMarker(page, path) {
  return page.evaluate((selector) => {
    const el = document.querySelector(selector);
    return !!el && el.getAttribute('data-v3-parallel-non-essential') === 'true';
  }, path).catch(() => false);
}

async function openCasePage(browser, file) {
  const url = pathToFileURL(path.join(ROOT, file)).href;
  let lastError = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    const page = await browser.newPage();
    try {
      await page.goto(url, { waitUntil: 'load', timeout: 45000 });
      return page;
    } catch (e) {
      lastError = e;
      await page.close().catch(() => {});
      await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
    }
  }
  throw lastError || new Error(`failed to open ${file}`);
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(path.join(BASE, 'manifest.json'), 'utf8'));
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage', '--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'] });
  const rows = [];
  try {
    for (const c of manifest.cases) {
      const page = await openCasePage(browser, c.file);
      let hits = [];
      let evidenceClaims = [];
      let evidenceDetails = {};
      let observedSc = '';
      if (c.aspect === 'audio-control') {
        const res = await probes.probeAudioAutoplay(page, { waitMs: 3300 });
        const proven = res.candidates.filter((x) => x.autoplayOverThreeSecondsObserved);
        hits = proven.map((x) => x.path);
        if (proven.length) evidenceClaims = ['audible-autoplay-more-than-three-seconds', 'no-independent-control'];
        const targetBefore = (res.before || []).find((x) => x.path === '#target') || null;
        const targetAfter = (res.media || []).find((x) => x.path === '#target') || null;
        if (!proven.length && c.expected === 'negative') {
          evidenceClaims = ['audio-playback-measured-or-applicability-checked'];
          if (targetAfter && targetAfter.muted) evidenceClaims.push('muted-audio-observed');
          if (targetAfter && targetAfter.controls) evidenceClaims.push('native-audio-controls-observed');
          if (targetAfter && !targetAfter.autoplay) evidenceClaims.push('no-autoplay-observed');
          if (targetAfter && targetAfter.knownNonSilentTone === false) evidenceClaims.push('audibility-not-established');
          if (targetAfter && Array.isArray(targetAfter.workingIndependentControls) && targetAfter.workingIndependentControls.length) evidenceClaims.push('independent-audio-control-observed');
          if (targetBefore && targetAfter && Number.isFinite(targetBefore.currentTime) && Number.isFinite(targetAfter.currentTime) && targetAfter.currentTime <= targetBefore.currentTime + 0.25) {
            evidenceClaims.push('playback-not-observed-advancing');
          }
        }
        evidenceDetails = {
          waitMs: res.waitMs,
          targetBefore,
          targetAfter,
          candidates: res.candidates.map((x) => ({
            path: x.path,
            autoplay: x.autoplay,
            muted: x.muted,
            controls: x.controls,
            volume: x.volume,
            beforeCurrentTime: x.before && x.before.currentTime,
            afterCurrentTime: x.currentTime,
            duration: x.duration,
            loop: x.loop,
            knownNonSilentTone: x.knownNonSilentTone,
            playbackObserved: x.playbackObserved,
            playbackAdvancedAcrossWindow: x.playbackAdvancedAcrossWindow,
            durationBasisOverThreeSeconds: x.durationBasisOverThreeSeconds,
            noIndependentControlObserved: x.noIndependentControlObserved,
            audibilityObserved: x.audibilityObserved,
            autoplayOverThreeSecondsObserved: x.autoplayOverThreeSecondsObserved,
            plausibleIndependentControls: x.plausibleIndependentControls || [],
            testedIndependentControls: x.testedIndependentControls || [],
            workingIndependentControls: x.workingIndependentControls || [],
          })),
        };
      } else if (c.aspect === 'flash-risk') {
        const res = await probes.probeFlashTemporal(page, { sampleMs: 1200, stepMs: 50 });
        const proven = res.candidates.filter((x) => x.thresholdEvidenceObserved);
        hits = proven.map((x) => x.path);
        if (proven.length) evidenceClaims = ['frame-sampled-flash-rate', 'area-or-red-threshold'];
        evidenceDetails = {
          sampleMs: res.sampleMs,
          stepMs: res.stepMs,
          sampleCount: res.sampleCount,
          candidates: res.candidates.map((x) => ({
            path: x.path,
            samples: x.samples,
            opacityRange: x.opacityRange,
            luminanceRange: x.luminanceRange,
            thresholdCrossings: x.thresholdCrossings,
            opacityCrossings: x.opacityCrossings,
            luminanceCrossings: x.luminanceCrossings,
            redStateCrossings: x.redStateCrossings,
            transitionBasis: x.transitionBasis,
            measuredFlashRateHz: x.measuredFlashRateHz,
            area: x.area,
            generatedLargeAreaThreshold: x.generatedLargeAreaThreshold,
            redThresholdRisk: x.redThresholdRisk,
            thresholdEvidenceObserved: x.thresholdEvidenceObserved,
            fastCss: x.fastCss,
          })),
        };
      } else if (['pause-stop-hide'].includes(c.aspect)) {
        const res = await probes.probeReducedMotion(page);
        const proven = [];
        for (const x of res.candidates || []) {
          if (x.noWorkingPauseStopHide && await hasParallelNonEssentialMarker(page, x.path)) proven.push(x);
        }
        hits = proven.map((x) => x.path);
        if (proven.length) evidenceClaims = ['auto-motion-persists', 'duration-or-looping', 'no-working-pause-stop-hide', 'parallel-non-essential-content'];
        evidenceDetails = {
          candidates: (res.candidates || []).map((x) => ({
            path: x.path,
            names: x.names,
            durationMs: x.durationMs,
            infinite: x.infinite,
            active: x.active,
            parallelNonEssential: x.parallelNonEssential,
            noWorkingPauseStopHide: x.noWorkingPauseStopHide,
            workingPauseStopHide: x.workingPauseStopHide,
          })),
          controlEvidence: res.controlEvidence,
        };
      } else if (c.aspect === 'keyboard-trap') {
        const kbd = require('../../lib/kbd-graph.js');
        const retention = await kbd.detectFocusRetentionTraps(page);
        const region = await kbd.detectKeyboardTraps(page);
        const fixedSet = await kbd.detectFixedSetConfinementTraps(page);
        const allTraps = [
          ...(retention.traps || []).map((x) => ({ ...x, detector: 'focus-retention' })),
          ...(region.traps || []).map((x) => ({ ...x, detector: 'region-escape' })),
          ...(fixedSet.traps || []).map((x) => ({ ...x, detector: 'fixed-set-confinement' })),
        ];
        hits = allTraps.map((x) => x.xpath || x.regionXpath).filter(Boolean);
        evidenceDetails = {
          traps: allTraps,
          focusRetention: {
            traps: retention.traps || [],
            candidates: retention.candidates || [],
            focusableCount: retention.focusableCount,
          },
          regionEscape: {
            traps: region.traps || [],
            directionalTraps: region.directionalTraps || [],
            candidates: region.candidates || [],
            regionCount: region.regionCount,
          },
          fixedSetConfinement: {
            traps: fixedSet.traps || [],
            candidateSet: fixedSet.candidateSet || [],
            focusableCount: fixedSet.focusableCount,
          },
        };
        if (!hits.length && c.expected === 'negative') {
          evidenceClaims = ['trusted-keyboard-navigation-observed', 'focus-escape-or-advised-exit-observed'];
        }
      } else if (c.aspect === 'character-shortcuts') {
        const res = await probes.probeCharacterShortcuts(page);
        hits = res.candidates.map((x) => x.path);
        if (!res.candidates.length && c.expected === 'negative') {
          evidenceClaims = ['trusted-keyboard-shortcut-procedure-run'];
          const observations = Array.isArray(res.observations) ? res.observations : [];
          if (!observations.length && !(res.modifiedTargets || []).length) evidenceClaims.push('no-single-character-shortcut-surface-observed');
          if (observations.some((x) => x.focusScoped && x.bodyActivation && x.bodyActivation.changed === false && x.focusedActivation && x.focusedActivation.changed === true)) {
            evidenceClaims.push('focus-scope-exception-observed');
          }
          if (observations.some((x) => Array.isArray(x.workingControls) && x.workingControls.length)) {
            evidenceClaims.push('off-or-remap-control-observed');
          }
          if (Array.isArray(res.modifiedTargets) && res.modifiedTargets.length) {
            evidenceClaims.push('modified-key-shortcut-observed');
          }
        }
        evidenceDetails = {
          targets: res.targets || [],
          modifiedTargets: res.modifiedTargets || [],
          controls: res.controls || [],
          observations: (res.observations || []).map((x) => ({
            path: x.path,
            key: x.key,
            rawTokens: x.rawTokens || [],
            focusScoped: x.focusScoped,
            bodyActivationChanged: x.bodyActivation && x.bodyActivation.changed,
            focusedActivationChanged: x.focusedActivation && x.focusedActivation.changed,
            controls: x.controls || [],
            testedControls: x.testedControls || [],
            workingControls: x.workingControls || [],
            noOffRemapOrFocusScopeException: x.noOffRemapOrFocusScopeException,
          })),
          candidates: res.candidates.map((x) => ({
            path: x.path,
            key: x.key,
            focusScoped: x.focusScoped,
            noOffRemapOrFocusScopeException: x.noOffRemapOrFocusScopeException,
            controls: x.controls || [],
            testedControls: x.testedControls || [],
            workingControls: x.workingControls || [],
          })),
        };
      } else if (c.aspect === 'context-change') {
        const res = await probes.probeContextChanges(page);
        const proven = (res.candidates || []).filter((x) => x.path === '#target' && !x.advisedBeforehand);
        hits = proven.map((x) => x.path);
        observedSc = proven[0] && proven[0].sc || '';
        if (proven.length) evidenceClaims = ['trusted-focus-or-input-action', 'context-change-observed', 'not-advised-beforehand'];
        evidenceDetails = {
          candidates: (res.candidates || []).map((x) => ({
            path: x.path,
            actionType: x.actionType,
            sc: x.sc,
            attrs: x.attrs,
            before: x.before,
            after: x.after,
            adviceText: x.adviceText,
            advisedBeforehand: x.advisedBeforehand,
          })),
        };
      } else if (c.aspect === 'pointer-operation') {
        const res = await probes.probePointerActivation(page);
        const proven = (res.candidates || []).filter((x) => x.path === '#target' && x.downEventCompletesAction && x.noAbortUndoReversalOrUpEventCompletion);
        hits = proven.map((x) => x.path);
        if (proven.length) observedSc = '2.5.2';
        if (proven.length) evidenceClaims = ['trusted-pointer-sequence', 'down-event-completes-action', 'no-abort-undo-reversal-or-up-event-completion'];
        evidenceDetails = {
          candidates: (res.candidates || []).map((x) => ({
            path: x.path,
            tag: x.tag,
            role: x.role,
            downEventCompletesAction: x.downEventCompletesAction,
            noAbortUndoReversalOrUpEventCompletion: x.noAbortUndoReversalOrUpEventCompletion,
            before: x.before,
            afterDown: x.afterDown,
            afterCancelLike: x.afterCancelLike,
          })),
        };
      } else if (c.aspect === 'pointer-gesture') {
        const res = await probes.probePointerGestures(page);
        const proven = (res.candidates || []).filter((x) => x.path === '#target');
        hits = proven.map((x) => x.path);
        if (proven.length) observedSc = '2.5.1';
        if (proven.length) evidenceClaims = ['trusted-path-gesture-operation', 'path-based-functionality-observed', 'target-click-and-marked-alternatives-only-no-equivalent-observed'];
        evidenceDetails = {
          traces: (res.traces || []).filter((x) => x.path === '#target').map((x) => ({
            path: x.path,
            tag: x.tag,
            role: x.role,
            text: x.text,
            box: x.box,
            essential: x.essential,
            uaProvided: x.uaProvided,
            pathGestureChanged: x.pathGestureChanged,
            clickChanged: x.clickChanged,
            clickEquivalent: x.clickEquivalent,
            workingAlternative: x.workingAlternative,
            alternatives: x.alternatives,
            beforeGesture: x.beforeGesture,
            afterGesture: x.afterGesture,
            afterClick: x.afterClick,
            afterAlt: x.afterAlt,
          })),
          candidates: (res.candidates || []).filter((x) => x.path === '#target').map((x) => ({
            path: x.path,
            pathGestureChanged: x.pathGestureChanged,
            clickChanged: x.clickChanged,
            clickEquivalent: x.clickEquivalent,
            workingAlternative: x.workingAlternative,
            essential: x.essential,
            uaProvided: x.uaProvided,
            reason: x.reason,
          })),
        };
      } else if (c.aspect === 'dragging-movement') {
        const res = await probes.probeDraggingMovements(page);
        const proven = (res.candidates || []).filter((x) => x.path === '#target');
        hits = proven.map((x) => x.path);
        if (proven.length) observedSc = '2.5.7';
        if (proven.length) evidenceClaims = ['trusted-drag-operation', 'dragging-functionality-observed', 'scoped-no-target-click-or-marked-alternative-observed'];
        evidenceDetails = {
          traces: (res.traces || []).filter((x) => x.path === '#target').map((x) => ({
            path: x.path,
            tag: x.tag,
            role: x.role,
            text: x.text,
            box: x.box,
            essential: x.essential,
            uaProvided: x.uaProvided,
            dragChanged: x.dragChanged,
            clickChanged: x.clickChanged,
            clickEquivalent: x.clickEquivalent,
            workingAlternative: x.workingAlternative,
            alternatives: x.alternatives,
            beforeDrag: x.beforeDrag,
            afterDrag: x.afterDrag,
            afterClick: x.afterClick,
            afterAlt: x.afterAlt,
          })),
          candidates: (res.candidates || []).filter((x) => x.path === '#target').map((x) => ({
            path: x.path,
            dragChanged: x.dragChanged,
            clickChanged: x.clickChanged,
            clickEquivalent: x.clickEquivalent,
            workingAlternative: x.workingAlternative,
            essential: x.essential,
            uaProvided: x.uaProvided,
            reason: x.reason,
          })),
        };
      } else if (c.aspect === 'status-announcement') {
        const res = await probes.probeStatusMessages(page);
        const proven = (res.candidates || []).filter((x) => x.path === '#status' && x.trustedActivationObserved && x.noLiveRegionOrProgrammaticStatusRole && x.focusNotMovedToMessage);
        hits = proven.map((x) => x.path);
        if (proven.length) observedSc = '4.1.3';
        if (proven.length) evidenceClaims = ['trusted-activation-action', 'status-message-observed', 'focus-not-moved-to-message', 'no-live-region-or-programmatic-status-role'];
        if (!proven.length && c.expected === 'negative') {
          const observed = (res.candidates || []).filter((x) => x.path === '#status');
          evidenceClaims = ['trusted-status-message-procedure-run'];
          if (!observed.length) evidenceClaims.push('no-status-message-change-observed');
          if (observed.some((x) => x.trustedActivationObserved)) evidenceClaims.push('trusted-activation-action');
          if (observed.some((x) => x.after && (x.after.text || x.after.dataStatusMeaning))) evidenceClaims.push('status-message-observed');
          if (observed.some((x) => !x.noLiveRegionOrProgrammaticStatusRole)) evidenceClaims.push('live-region-or-programmatic-status-channel-observed');
          if (observed.some((x) => !x.focusNotMovedToMessage)) evidenceClaims.push('focus-or-context-move-observed');
          if (observed.some((x) => x.programmaticAnnouncementObserved)) evidenceClaims.push('programmatic-status-announcement-observed');
          if (observed.some((x) => x.contextChangedByDialog || x.contextChangedByDisclosure || (x.nativeDialogs || []).length)) evidenceClaims.push('dialog-or-disclosure-context-observed');
        }
        evidenceDetails = {
          candidates: (res.candidates || []).map((x) => ({
            path: x.path,
            triggerPath: x.triggerPath,
            text: x.after && x.after.text,
            role: x.after && x.after.role,
            ariaLive: x.after && x.after.ariaLive,
            dataStatusMeaning: x.after && x.after.dataStatusMeaning,
            trustedActivationObserved: x.trustedActivationObserved,
            activation: x.activation,
            focusNotMovedToMessage: x.focusNotMovedToMessage,
            noLiveRegionOrProgrammaticStatusRole: x.noLiveRegionOrProgrammaticStatusRole,
            programmaticAnnouncementObserved: x.programmaticAnnouncementObserved,
            announcements: x.announcements,
            contextChangedByDialog: x.contextChangedByDialog,
            nativeDialogs: x.nativeDialogs,
            contextChangedByDisclosure: x.contextChangedByDisclosure,
            statusMessageRemoved: x.statusMessageRemoved,
            beforeActivePath: x.beforeActivePath,
            afterActivePath: x.afterActivePath,
            reason: x.reason,
          })),
          nativeDialogs: res.nativeDialogs || [],
        };
      } else if (c.aspect === 'label-in-name') {
        const res = await probes.probeLabelInName(page);
        const proven = (res.candidates || []).filter((x) => x.path === '#target');
        hits = proven.map((x) => x.path);
        if (proven.length) observedSc = '2.5.3';
        if (proven.length) evidenceClaims = ['visible-text-label', 'accessible-name-observed', 'accessible-name-missing-visible-text'];
        const labelObservations = (res.observations || []).filter((x) => x.path === '#target');
        if (!proven.length && c.expected === 'negative') {
          evidenceClaims = labelInNameControlEvidence(labelObservations);
        }
        evidenceDetails = {
          observations: labelObservations,
          candidates: (res.candidates || []).filter((x) => x.path === '#target'),
        };
      } else if (c.aspect === 'target-size-minimum') {
        const res = await probes.probeTargetSize(page);
        const proven = (res.candidates || []).filter((x) => x.path === '#target');
        hits = proven.map((x) => x.path);
        if (proven.length) observedSc = '2.5.8';
        if (proven.length) evidenceClaims = ['rendered-pointer-target', 'measured-target-size-below-24', 'target-spacing-intersection'];
        const targetObservations = (res.observations || []).filter((x) => x.path === '#target').map((x) => ({
          path: x.path,
          box: x.box,
          text: x.text,
          squareFits: x.squareFits,
          inlineCandidate: x.inlineCandidate,
          inSentence: x.inSentence,
          inlineException: x.inlineException,
          essential: x.essential,
          equivalent: x.equivalent,
          uaControl: x.uaControl,
          result: x.result,
        }));
        if (!proven.length && c.expected === 'negative') {
          evidenceClaims = targetSizeControlEvidence(targetObservations);
        }
        evidenceDetails = {
          observations: targetObservations,
          candidates: (res.candidates || []).filter((x) => x.path === '#target').map((x) => ({
            path: x.path,
            box: x.box,
            result: x.result,
            reason: x.reason,
          })),
        };
      } else if (c.aspect === 'reveal-state-discovery') {
        const res = await probes.probeRevealStates(page);
        const proven = (res.candidates || []).filter((x) => x.path === '#target');
        hits = proven.map((x) => x.path);
        if (proven.length) evidenceClaims = ['trusted-reveal-action', 'state-reached', 'newly-rendered-content-or-focusable'];
        evidenceDetails = {
          observations: (res.observations || []).filter((x) => x.path === '#target').map((x) => ({
            path: x.path,
            tag: x.tag,
            text: x.text,
            beforeState: x.beforeState,
            afterState: x.afterState,
            stateReached: x.stateReached,
            newVisibleCount: x.newVisibleCount,
            newInteresting: x.newInteresting,
            skipped: x.skipped,
            reason: x.reason,
          })),
          candidates: (res.candidates || []).filter((x) => x.path === '#target').map((x) => ({
            path: x.path,
            beforeState: x.beforeState,
            afterState: x.afterState,
            newInteresting: x.newInteresting,
            reason: x.reason,
          })),
        };
      } else if (c.aspect === 'visual-structure-discovery') {
        const res = await probes.probeVisualStructureDiscovery(page);
        const proven = (res.candidates || []).filter((x) => x.path === '#target');
        hits = proven.map((x) => x.path);
        if (proven.length) {
          observedSc = proven[0].sc || '1.3.1/2.4.6/2.4.10';
          evidenceClaims = ['rendered-visual-structure-signal', 'programmatic-structure-missing', 'content-region-observed'];
        }
        evidenceDetails = {
          observations: (res.observations || []).filter((x) => x.path === '#target').map((x) => ({
            path: x.path,
            kind: x.kind,
            sc: x.sc,
            tag: x.tag,
            role: x.role,
            text: x.text,
            items: x.items,
            cells: x.cells,
            fontSize: x.fontSize,
            fontWeight: x.fontWeight,
            box: x.box,
          })),
          candidates: proven.map((x) => ({
            path: x.path,
            kind: x.kind,
            sc: x.sc,
            reason: x.reason,
          })),
        };
      } else if (c.aspect === 'visual-content-discovery') {
        const res = await probes.probeVisualContentDiscovery(page);
        const proven = (res.candidates || []).filter((x) => x.path === '#target');
        hits = proven.map((x) => x.path);
        if (proven.length) {
          observedSc = proven[0].sc || '1.1.1/1.4.1/1.4.5';
          evidenceClaims = ['rendered-non-dom-visual-content-signal', 'semantic-alternative-missing-or-unproven', 'content-region-observed'];
        }
        evidenceDetails = {
          observations: (res.observations || []).filter((x) => x.path === '#target').map((x) => ({
            path: x.path,
            kind: x.kind,
            sc: x.sc,
            tag: x.tag,
            role: x.role,
            text: x.text,
            altText: x.altText,
            decorative: x.decorative,
            alternativeDeclared: x.alternativeDeclared,
            alternativeAdequacyProven: x.alternativeAdequacyProven,
            nonColorCueDeclared: x.nonColorCueDeclared,
            suppressCandidate: x.suppressCandidate,
            backgroundImage: x.backgroundImage,
            color: x.color,
            backgroundColor: x.backgroundColor,
            box: x.box,
          })),
          candidates: proven.map((x) => ({
            path: x.path,
            kind: x.kind,
            sc: x.sc,
            reason: x.reason,
          })),
        };
      } else {
        hits = (await probes.collectInteractionCandidates(page)).candidates.filter((x) => x.family === FAMILY[c.aspect]).map((x) => x.path);
      }
      await page.close();
      const observedPositive = c.aspect === 'keyboard-trap'
        ? hits.length > 0
        : c.aspect === 'status-announcement'
          ? hits.includes('#status')
          : c.aspect === 'label-in-name'
            ? hits.includes('#target')
          : c.aspect === 'target-size-minimum'
            ? hits.includes('#target')
            : c.aspect === 'pointer-gesture'
              ? hits.includes('#target')
            : c.aspect === 'dragging-movement'
              ? hits.includes('#target')
            : c.aspect === 'reveal-state-discovery'
              ? hits.includes('#target')
            : c.aspect === 'visual-structure-discovery'
              ? hits.includes('#target')
            : c.aspect === 'visual-content-discovery'
              ? hits.includes('#target')
          : hits.includes('#target');
      if (observedPositive && !evidenceClaims.length && EVIDENCE_CLAIMS[c.aspect]) {
        evidenceClaims = EVIDENCE_CLAIMS[c.aspect];
      }
      const expectedProbeCoverage = true;
      rows.push({ ...c, ...(observedSc ? { sc: observedSc } : {}), expectedProbeCoverage, observedPositive, hits, evidenceClaims, evidenceDetails, pass: expectedProbeCoverage ? (c.expected === 'positive' ? observedPositive : !observedPositive) : true });
      await page.close().catch(() => {});
    }
  } finally {
    await browser.close();
  }
  const summary = { generatedAt: new Date().toISOString(), total: rows.length, pass: rows.filter((r) => r.pass).length, fail: rows.filter((r) => !r.pass).length, byAspect: {}, rows };
  for (const r of rows) {
    const k = `${r.aspect}:${r.expected}`;
    summary.byAspect[k] = summary.byAspect[k] || { total: 0, pass: 0, fail: 0, expectedProbeCoverage: r.expectedProbeCoverage };
    summary.byAspect[k].total++;
    summary.byAspect[k][r.pass ? 'pass' : 'fail']++;
  }
  const out = path.join(BASE, 'validation.json');
  fs.writeFileSync(out, JSON.stringify(summary, null, 2) + '\n');
  console.log(out);
  if (summary.fail) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e && e.stack ? e.stack : e);
  process.exit(1);
});
