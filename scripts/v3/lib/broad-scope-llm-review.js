'use strict';

const V = require('./v3-schema.js');
const oracle = require('./applicability-oracle.js');

const VERDICTS = ['LIKELY_BARRIER', 'LIKELY_OK', 'UNCERTAIN'];
const DISCOVERY_ONLY_ASPECTS = new Set([
  'reveal-state-discovery',
  'visual-structure-discovery',
  'visual-content-discovery',
]);

const ASPECTS = Object.freeze({
  'text-spacing': {
    sc: '1.4.12',
    standard: 'WCAG 2.2 SC 1.4.12 Text Spacing',
    mode: 'hybrid-visual',
    requiredEvidence: ['after-spacing-loss', 'before-after-visual-agreement', 'content-or-function-loss'],
    questions: [
      'Did the text-spacing override cause loss of content or functionality?',
      'Is the observed clipping/overlap newly introduced by the override?',
      'Is there an exception or alternate way to view the full content?',
    ],
  },
  'resize-text': {
    sc: '1.4.4',
    standard: 'WCAG 2.2 SC 1.4.4 Resize Text',
    mode: 'hybrid-visual',
    requiredEvidence: ['200-percent-text-size-loss', 'before-after-visual-agreement', 'content-or-function-loss'],
    questions: [
      'Did resizing text to 200 percent cause loss of content or functionality?',
      'Is the affected content text rather than an explicit exception such as captions or images of text?',
      'Is the content still reachable through scrolling or an equivalent mechanism?',
    ],
  },
  'forced-colors': {
    sc: 'EN-C.9.7',
    standard: 'EN 301 549 C.9.7 user preference / forced-colors support, with WCAG visual-adaptation adjacency',
    mode: 'review-only',
    requiredEvidence: ['forced-colors-render', 'essential-meaning-or-affordance-loss'],
    questions: [
      'Does forced-colors mode cause loss of essential text, state, boundary, focus, or meaning?',
      'Is forced-color-adjust:none merely present, or is there visible loss?',
      'Is the affected content decorative or redundant?',
    ],
  },
  'forced-colors-nontext': {
    sc: 'EN-C.9.7',
    standard: 'EN 301 549 C.9.7 user preference / forced-colors support, with WCAG 2.2 SC 1.4.11 non-text contrast adjacency',
    mode: 'hybrid-visual',
    requiredEvidence: ['forced-colors-render', 'non-text-boundary-or-state-loss', 'essential-control-boundary'],
    questions: [
      'Does forced-colors mode remove the visible boundary, state, or affordance of a focusable control?',
      'Is the non-text boundary/state essential for identifying the control or its state?',
      'Is the affected boundary decorative or redundantly conveyed by text or another visible affordance?',
    ],
  },
  'reduced-motion': {
    sc: '2.2.2',
    claimFamily: 'motion-control',
    standard: 'WCAG 2.2 SC 2.2.2 Pause, Stop, Hide',
    mode: 'hybrid-temporal',
    requiredEvidence: ['auto-motion-persists', 'duration-or-looping', 'no-working-pause-stop-hide', 'parallel-non-essential-content'],
    questions: [
      'Does moving/blinking/scrolling/updating content start automatically and persist for more than five seconds?',
      'Is it presented in parallel with other content and non-essential?',
      'Is there a working pause, stop, hide, or frequency control?',
    ],
  },
  'motion-control': {
    sc: '2.2.2',
    claimFamily: 'motion-control',
    standard: 'WCAG 2.2 SC 2.2.2 Pause, Stop, Hide',
    mode: 'hybrid-temporal',
    requiredEvidence: ['auto-motion-persists', 'duration-or-looping', 'no-working-pause-stop-hide', 'parallel-non-essential-content'],
    questions: [
      'Does moving/blinking/scrolling/updating content start automatically and persist for more than five seconds?',
      'Is it presented in parallel with other content and non-essential?',
      'Is there a working pause, stop, hide, or frequency control?',
    ],
  },
  'audio-control': {
    sc: '1.4.2',
    standard: 'WCAG 2.2 SC 1.4.2 Audio Control',
    mode: 'hybrid-temporal',
    allowedVerdicts: ['LIKELY_BARRIER', 'UNCERTAIN'],
    requiredEvidence: ['audible-autoplay-more-than-three-seconds', 'no-independent-control'],
    promptRules: [
      'Return LIKELY_BARRIER only when audible non-muted audio was observed to start automatically, continue for more than three seconds, and lack an independent pause/stop/mute/volume control.',
      'Muted media, native controls, independent page controls, no autoplay, unproven audibility, or playback blocked/not advancing are scoped controls and must return UNCERTAIN, not LIKELY_OK.',
      'Still screenshots are contextual only; duration, autoplay, audibility, muted state, and controls must come from measured media state.',
    ],
    questions: [
      'Was audible audio observed to start automatically and continue for more than three seconds?',
      'Is there an independent pause, stop, mute, or volume control for the page audio?',
      'Could browser autoplay blocking or offline capture explain the absence of playback?',
    ],
  },
  'scope-media-autoplay': {
    sc: '1.4.2',
    standard: 'WCAG 2.2 SC 1.4.2 Audio Control',
    mode: 'applicability-risk',
    requiredEvidence: ['audible-autoplay-more-than-three-seconds', 'no-independent-control'],
    questions: [
      'Does the media actually play audible audio automatically in this captured state?',
      'Does any visible or programmatic control pause, stop, mute, or adjust the audio?',
      'If playback was blocked or unobserved, return UNCERTAIN rather than LIKELY_OK.',
    ],
  },
  'flash-risk': {
    sc: '2.3.1',
    standard: 'WCAG 2.2 SC 2.3.1 Three Flashes or Below Threshold',
    mode: 'temporal-threshold-required',
    requiredEvidence: ['frame-sampled-flash-rate', 'area-or-red-threshold'],
    questions: [
      'Was the flashing rate measured temporally rather than inferred from CSS names?',
      'Does the flashing exceed three flashes per second and relevant area/red thresholds?',
      'If no temporal sampling exists, return UNCERTAIN or LIKELY_BARRIER only as a review risk, not a definite threshold verdict.',
    ],
  },
  'keyboard-trap': {
    sc: '2.1.2',
    claimFamily: 'no-keyboard-trap',
    standard: 'WCAG 2.2 SC 2.1.2 No Keyboard Trap',
    mode: 'trusted-keyboard',
    allowedVerdicts: ['LIKELY_BARRIER', 'UNCERTAIN'],
    requiredEvidence: ['trusted-tab-or-shift-tab-trap', 'focus-cannot-leave-region-or-element', 'no-advised-keyboard-exit'],
    promptRules: [
      'Return LIKELY_BARRIER only when trusted keyboard traversal demonstrates that focus cannot leave the region or element and no advised keyboard exit is available.',
      'If focus can leave with Tab, Shift+Tab, Escape, or an advised key sequence, return UNCERTAIN for this sidecar rather than LIKELY_OK.',
      'A single-focusable page or a scoped clean-control fixture is not proof that the full page conforms to SC 2.1.2.',
    ],
    questions: [
      'Was the trap reproduced with real keyboard focus movement and settle timing?',
      'Is there another keyboard method to move focus away, and is the user advised of it?',
      'Is this a genuine trap that blocks access to other focusable content rather than a single-focusable page?',
    ],
  },
  'context-change': {
    sc: null,
    standard: 'WCAG 2.2 SC 3.2.1 On Focus / SC 3.2.2 On Input',
    mode: 'hybrid-behavioral',
    requiredEvidence: ['trusted-focus-or-input-action', 'context-change-observed', 'not-advised-beforehand'],
    questions: [
      'Was the change caused by focus/input rather than explicit activation?',
      'Was it a change of context such as navigation, focus relocation, form submission, new window, or major content replacement?',
      'Was the user advised before using the component?',
    ],
  },
  'pointer-operation': {
    sc: null,
    standard: 'WCAG 2.2 SC 2.5.1 Pointer Gestures / 2.5.2 Pointer Cancellation / 2.5.7 Dragging Movements',
    mode: 'hybrid-behavioral',
    requiredEvidence: ['trusted-pointer-sequence', 'down-event-completes-action', 'no-abort-undo-reversal-or-up-event-completion'],
    questions: [
      'Which pointer SC applies: path/multipoint gesture, down-event cancellation, or dragging movement?',
      'Was an equivalent non-path/non-drag/simple-pointer alternative tested?',
      'For pointer cancellation, did the action complete on down-event without abort/undo/reversal?',
    ],
  },
  'pointer-gesture': {
    sc: '2.5.1',
    standard: 'WCAG 2.2 SC 2.5.1 Pointer Gestures',
    mode: 'trusted-pointer',
    requiredEvidence: ['trusted-path-gesture-operation', 'path-based-functionality-observed', 'target-click-and-marked-alternatives-only-no-equivalent-observed'],
    questions: [
      'Did a trusted path-based or multipoint-like gesture operate functionality in the tested state?',
      'Can the same functionality be achieved by a single pointer action without a path-based gesture, such as click/tap, buttons, menu selection, or text input?',
      'Is the path-based or multipoint gesture essential or determined by unmodified user agent or assistive technology behavior rather than author content?',
    ],
  },
  'character-shortcut': {
    sc: '2.1.4',
    claimFamily: 'character-key-shortcut',
    standard: 'WCAG 2.2 SC 2.1.4 Character Key Shortcuts',
    mode: 'hybrid-keyboard',
    allowedVerdicts: ['LIKELY_BARRIER', 'UNCERTAIN'],
    requiredEvidence: ['trusted-keyboard-action', 'single-printable-character-shortcut-observed', 'no-off-remap-or-focus-scope-exception'],
    promptRules: [
      'Return LIKELY_BARRIER only when a trusted single printable character key changes page state outside a focused component and no working off, remap, or focus-only exception is observed.',
      'No shortcut surface, modified-key shortcuts such as Control+key, focus-only shortcuts, or a working off/remap control are scoped controls and must return UNCERTAIN, not LIKELY_OK.',
      'A visible off/remap/settings control counts only when the procedure records that using it prevented the single-character shortcut from changing page state.',
    ],
    questions: [
      'Was a single printable character shortcut observed outside a text input or focused component?',
      'Can the shortcut be turned off, remapped to include a non-printable key, or scoped only while focused?',
      'Was the outcome caused by a trusted keyboard action?',
    ],
  },
  'label-in-name': {
    sc: '2.5.3',
    standard: 'WCAG 2.2 SC 2.5.3 Label in Name',
    mode: 'hybrid-semantic',
    allowedVerdicts: ['LIKELY_BARRIER', 'UNCERTAIN'],
    requiredEvidence: ['visible-text-label', 'accessible-name-observed', 'accessible-name-missing-visible-text'],
    disqualifyingEvidence: ['accessible-name-contains-visible-text'],
    promptRules: [
      'Return LIKELY_BARRIER only when the component has a visible text label and a measured accessible name, and the accessible name does not contain the visible label text after the packet normalization.',
      'An exact match, visible label contained anywhere in the accessible name, native content/value naming, aria-label containing the visible label, or aria-labelledby containing the visible label is scoped control evidence and must return UNCERTAIN, not LIKELY_OK.',
      'Label at the start of the name is best practice, not required for a barrier; do not fail solely because extra words appear before or after the visible label when the visible label is contained.',
      'Do not decide image-of-text labels, localization, mathematical symbols, icon-only labels, or hidden/offscreen text beyond the packet evidence; return UNCERTAIN if the packet does not show the visible label and computed name relationship.',
      'Because this broad-scope label-in-name lane has no registered v3 publication claim family, do not treat a clean scoped control as a conformance pass.',
    ],
    questions: [
      'Is the component a user interface component with a visible text label?',
      'Does the accessible name contain the visible label text, in the same language and order after normalization?',
      'Could punctuation, hidden explanatory text, icon text, or localization explain an apparent mismatch?',
    ],
  },
  'target-size-minimum': {
    sc: '2.5.8',
    standard: 'WCAG 2.2 SC 2.5.8 Target Size (Minimum)',
    mode: 'hybrid-geometry',
    allowedVerdicts: ['LIKELY_BARRIER', 'UNCERTAIN'],
    requiredEvidence: ['rendered-pointer-target', 'measured-target-size-below-24', 'target-spacing-intersection'],
    disqualifyingEvidence: [
      'target-size-at-least-24',
      'target-spacing-exception-observed',
      'inline-target-exception-observed',
      'equivalent-target-exception-observed',
      'essential-target-exception-observed',
      'ua-control-exception-observed',
    ],
    promptRules: [
      'Return LIKELY_BARRIER only when a rendered pointer target is smaller than 24 by 24 CSS pixels, the 24px circle spacing test intersects another target or undersized-target circle, and no spacing, equivalent, inline, user-agent-control, or essential exception is observed.',
      'A target at least 24 by 24 CSS pixels, sufficient 24px-circle spacing, inline/in-sentence constraint, equivalent same-page control, unmodified user-agent control, or essential/legal presentation is scoped control evidence and must return UNCERTAIN, not LIKELY_OK.',
      'Do not treat fixture exception markers or labels as global conformance proof; they are scoped evidence for this generated case only.',
      'Because this broad-scope target-size lane has no registered v3 publication claim family, do not treat a clean scoped control as a conformance pass.',
    ],
    questions: [
      'Is the measured item a rendered pointer target in the tested state?',
      'Is the target smaller than 24 by 24 CSS pixels, and does its 24px circle intersect another target?',
      'Does any exception apply, such as equivalent target, inline/in-sentence target, essential presentation, or unmodified user-agent control?',
    ],
  },
  'dragging-movement': {
    sc: '2.5.7',
    standard: 'WCAG 2.2 SC 2.5.7 Dragging Movements',
    mode: 'trusted-pointer',
    requiredEvidence: ['trusted-drag-operation', 'dragging-functionality-observed', 'scoped-no-target-click-or-marked-alternative-observed'],
    questions: [
      'Did a trusted drag movement operate functionality in the tested state?',
      'Can the same functionality be achieved by a single pointer action without dragging, such as click/tap, buttons, menu selection, or text input?',
      'Is the dragging movement essential or determined by an unmodified user agent rather than author content?',
    ],
  },
  'reveal-state-discovery': {
    sc: null,
    standard: 'Trusted Tester reveal-state discovery surface for WCAG 1.3.1 / 2.4.3 / 2.4.10 / 4.1.2 follow-up checks',
    mode: 'trusted-state-discovery',
    requiredEvidence: ['trusted-reveal-action', 'state-reached', 'newly-rendered-content-or-focusable'],
    questions: [
      'Was a disclosure, tab, summary, menu, dialog, carousel, or similar control activated with trusted input?',
      'Did the activation reach a new state with newly visible content, headings, lists, tables, or focusable controls?',
      'Which downstream WCAG/Trusted Tester checks should be run in the revealed state, and what evidence is still missing?',
      'Do not return LIKELY_BARRIER from reveal discovery alone; use UNCERTAIN unless the packet also contains downstream conformance evidence.',
    ],
  },
  'visual-structure-discovery': {
    sc: null,
    standard: 'WCAG 2.2 visual structure discovery surface for 1.3.1 Info and Relationships / 2.4.6 Headings and Labels, plus optional AAA 2.4.10 Section Headings follow-up checks',
    mode: 'hybrid-visual-structure-discovery',
    requiredEvidence: ['rendered-visual-structure-signal', 'programmatic-structure-missing', 'content-region-observed'],
    questions: [
      'Does the rendered page present text or layout that functions like a heading, list, or table/grid?',
      'Is the corresponding semantic/programmatic structure missing or mismatched in DOM/ARIA?',
      'Which downstream WCAG/Trusted Tester structure checks should be run for this region, and what evidence is still missing?',
      'Do not return LIKELY_BARRIER from visual-structure discovery alone; use UNCERTAIN unless the packet also contains downstream conformance evidence.',
    ],
  },
  'visual-content-discovery': {
    sc: null,
    standard: 'WCAG 2.2 visual content discovery surface for 1.1.1 Non-text Content / 1.4.1 Use of Color / 1.4.5 Images of Text follow-up checks',
    mode: 'hybrid-visual-content-discovery',
    requiredEvidence: ['rendered-non-dom-visual-content-signal', 'semantic-alternative-missing-or-unproven', 'content-region-observed'],
    questions: [
      'Does the rendered page contain meaningful visual content that is not ordinary DOM text, such as background-image text, canvas/SVG chart content, icon-only meaning, or color-only status?',
      'Is there an equivalent accessible name, text alternative, adjacent text, table/data alternative, or redundant non-color cue?',
      'Which downstream WCAG/Trusted Tester checks should be run for this visual region, and what evidence is still missing?',
      'Do not return LIKELY_BARRIER from visual-content discovery alone; use UNCERTAIN unless the packet also contains downstream conformance evidence.',
    ],
  },
  'status-announcement': {
    sc: '4.1.3',
    standard: 'WCAG 2.2 SC 4.1.3 Status Messages',
    mode: 'hybrid-behavioral',
    allowedVerdicts: ['LIKELY_BARRIER', 'UNCERTAIN'],
    requiredEvidence: ['trusted-activation-action', 'status-message-observed', 'focus-not-moved-to-message', 'no-live-region-or-programmatic-status-role'],
    promptRules: [
      'Return LIKELY_BARRIER only when a trusted activation creates or changes visible status information, focus is not moved to the message, no dialog/disclosure context owns the message, and no live/status/alert/log/direct announcement channel is observed.',
      'A role=status, role=alert, role=log, aria-live region, direct programmatic announcement, focus move to the message, dialog/alert context, or disclosure context is scoped control evidence and must return UNCERTAIN, not LIKELY_OK.',
      'No observed status message change is insufficient evidence; return UNCERTAIN.',
      'Because this broad-scope status lane has no registered publication claim family, do not treat a clean scoped control as a conformance pass.',
    ],
    questions: [
      'Did a trusted user action cause a visible status message to appear or change without changing focus?',
      'Is the changed content a status message about results, progress, or state rather than a dialog, expanded/collapsed state, or ordinary page content?',
      'Is the status conveyed programmatically through role=status, role=alert, role=log, aria-live, direct accessibility API announcement, or by moving focus/opening dialog context to the message?',
      'If waiting/status text was removed, is equivalent completion/availability status conveyed programmatically?',
    ],
  },
  'media-alternative-inventory': {
    sc: null,
    claimFamily: null,
    standard: 'WCAG 2.2 SC 1.2.x Time-based Media Alternatives',
    mode: 'hybrid-semantic',
    task: 'Decide whether this evidence packet supports a scoped time-based-media barrier, or is insufficient for a barrier. Current media sidecar packets must not clear conformance.',
    allowedVerdicts: ['LIKELY_BARRIER', 'UNCERTAIN'],
    requiredEvidence: ['owned-media-element', 'media-content-model-observed', 'alternative-missing-or-inadequate-observed'],
    promptRules: [
      'For SC 1.2.1 audio-only, a transcript or media alternative must convey the auditory information; for video-only, a text alternative or audio track must convey the visual information.',
      'For SC 1.2.2, synchronized video needs captions/subtitles that convey the auditory information, including meaningful sound effects; transcript, description, or visible video controls alone do not satisfy this SC.',
      'For SC 1.2.3, synchronized video needs audio description or a full media alternative/transcript that conveys essential visual information; captions alone do not satisfy this SC.',
      'For SC 1.2.5, audio description must convey essential visual information; a transcript/media alternative alone is not enough for this SC.',
      'Judge only the scoped SC named in packet.sc/rawSc. Do not infer pass or fail for adjacent 1.2.x SCs that are not scoped in this packet.',
      'Visual screenshots corroborate target ownership/context only unless the packet explicitly says the media content model was derived from those pixels.',
      'Adequate alternatives, media-alternative-for-text exceptions, or clean scoped controls are evidence for UNCERTAIN in this sidecar, not a conformance pass.',
      'Because this media inventory has no registered v3 claim family, return UNCERTAIN rather than LIKELY_OK for adequate alternatives, exceptions, or clean scoped controls.',
    ],
    questions: [
      'What time-based media SC applies to this media element?',
      'What auditory and visual information does the fixture media content model say must be conveyed?',
      'Is an owned caption, transcript, audio-description, audio track, or media alternative present and adequate for that content?',
      'Does the packet prove semantic adequacy, or only mechanical presence/absence?',
    ],
  },
  'complete-process': {
    sc: null,
    standard: 'WCAG 2.2 Conformance Requirement 5.2.3 Complete Processes / EN 301 549 C.9.6.3',
    mode: 'process-scope',
    task: 'Decide whether this manifest evidence supports a scoped complete-process barrier, or is insufficient. Current process-scope packets must not clear conformance.',
    allowedVerdicts: ['LIKELY_BARRIER', 'UNCERTAIN'],
    requiredEvidence: ['declared-process-steps', 'process-scope-comparison', 'process-failure-observed'],
    promptRules: [
      'A complete-process barrier requires positive evidence that a measured page or step in the declared process failed an accessibility requirement.',
      'Treat missing, duplicated, unmeasured, targetless, boundary-incomplete, or otherwise unverified process steps as scope/coverage gaps, not as barriers by themselves.',
      'Do not treat a clean or fully measured process manifest as a conformance pass; this packet family is a scoped review surface only.',
      'Return UNCERTAIN when the packet lacks process-failure-observed, including when the packet only proves process-coverage-gap-observed.',
      'Do not infer page-level or element-level conformance from a process-scope packet.',
    ],
    questions: [
      'Is a complete process declared with every required step included?',
      'Are any process steps missing targets, duplicated, or unmeasured?',
      'Does this evidence support only process-scope review rather than a page-level conformance claim?',
    ],
  },
  'site-set-consistency': {
    sc: null,
    standard: 'WCAG 2.2 site/page-set consistency: 2.4.2, 3.2.3, 3.2.4, 3.2.6',
    mode: 'site-set-scope',
    task: 'Decide whether this site/page-set manifest evidence supports a scoped site-set barrier, or is insufficient. Current site-set packets must not clear conformance.',
    allowedVerdicts: ['LIKELY_BARRIER', 'UNCERTAIN'],
    requiredEvidence: ['declared-page-set', 'same-state-breakpoint-context', 'repeated-mechanism-comparison', 'site-set-inconsistency-observed'],
    disqualifyingEvidence: ['site-set-scope-gap-observed'],
    promptRules: [
      'A site-set barrier requires positive evidence of a user-meaningful inconsistency or page-title/link/help/navigation/component problem across pages in the same declared set, state, locale, and breakpoint context.',
      'Treat too-small page sets, missing URLs, and unproven same-state/breakpoint context as scope gaps, not as barriers by themselves.',
      'Do not treat a clean or internally consistent page-set manifest as a conformance pass; this packet family is a scoped review surface only.',
      'Return UNCERTAIN when the packet lacks site-set-inconsistency-observed, including when the packet only proves site-set-scope-gap-observed.',
      'Do not infer single-page, page-level, or element-level conformance from a site-set packet.',
    ],
    questions: [
      'Are the compared pages in the same site/set/state/breakpoint context?',
      'Do repeated mechanisms, help mechanisms, titles, or link names differ in a user-meaningful way?',
      'Is the issue site-set scoped rather than a single-page verdict?',
    ],
  },
  'accessible-authentication': {
    sc: '3.3.8',
    standard: 'WCAG 2.2 SC 3.3.8 Accessible Authentication (Minimum)',
    mode: 'flow-semantic',
    task: 'Decide whether this evidence supports a scoped accessible-authentication barrier, or is insufficient. Current broad-scope auth packets must not clear conformance.',
    allowedVerdicts: ['LIKELY_BARRIER', 'UNCERTAIN'],
    requiredEvidence: ['authentication-step', 'cognitive-function-test', 'missing-allowed-alternative-or-exception'],
    promptRules: [
      'SC 3.3.8 applies only to an authentication process for the user.',
      'A barrier requires a cognitive function test such as remembering/retyping a password, solving a puzzle/calculation, transcribing content, recognizing objects, or recalling personal content.',
      'Do not report a barrier if an allowed alternative/mechanism/exception is proven, such as password-manager support, paste/autocomplete/passkey/magic-link/push approval, another non-cognitive modality, object-recognition exception, or personal-content exception.',
      'A CAPTCHA-like surface also needs evidence that no non-cognitive/non-single-sensory alternative is available before a barrier verdict.',
      'Judge only the scoped authentication step. Do not infer process-wide authentication conformance from one field or one clean control.',
      'Because this broad-scope authentication lane has no registered v3 claim family, return UNCERTAIN rather than LIKELY_OK for adequate alternatives or exceptions.',
    ],
    questions: [
      'Is this an authentication step for an existing user?',
      'Does it require a cognitive function test?',
      'Is there an allowed alternative, mechanism, object-recognition exception, or personal-content exception?',
    ],
  },
  'plain-language-research': {
    sc: '3.1.5',
    standard: 'WCAG 2.2 SC 3.1.5 Reading Level / plain-language cognitive review surface',
    mode: 'semantic-research',
    task: 'Decide whether this evidence supports a scoped WCAG 3.1.5 reading-level barrier, or is insufficient. Current broad-scope reading-level packets must not clear conformance.',
    allowedVerdicts: ['LIKELY_BARRIER', 'UNCERTAIN'],
    requiredEvidence: [
      'user-facing-required-text',
      'reading-level-above-lower-secondary-after-removals',
      'proper-names-and-titles-removed',
      'no-supplemental-content-observed',
      'no-lower-secondary-version-observed',
      'supplement-adequacy-evaluated',
      'reading-method-language-supported',
    ],
    promptRules: [
      'SC 3.1.5 is AAA. Keep this as a sidecar review unless the conformance target explicitly includes AAA.',
      'A barrier requires text that demands reading ability more advanced than lower secondary education level after removing proper names and titles.',
      'Do not report a barrier when supplemental content, a lower-secondary version, glossary/examples, audio/illustrated support, or another adequate comprehension support is proven.',
      'Do not report a barrier for incidental, optional, sample, or marketing text that is not needed for the user task.',
      'Do not rely on sentence length, acronym count, or specialized vocabulary alone as proof of the reading-level threshold.',
      'If the language or method is unsupported, return UNCERTAIN rather than guessing.',
      'Because this broad-scope reading-level lane has no registered v3 claim family, return UNCERTAIN rather than LIKELY_OK for adequate alternatives or scoped controls.',
    ],
    questions: [
      'Is the text part of required content rather than incidental/sample text?',
      'Does it require reading ability more advanced than lower secondary education after proper names/titles are removed?',
      'Is supplemental content or a lower-reading-level version available?',
    ],
  },
  'captcha-authentication': {
    sc: null,
    standard: 'WCAG 2.2 SC 3.3.8 and SC 1.1.1 CAPTCHA alternatives',
    mode: 'flow-semantic',
    requiredEvidence: ['captcha-like-surface', 'alternative-modalities'],
    questions: [
      'Is this CAPTCHA part of authentication or another process?',
      'Are non-cognitive and non-single-sensory alternatives available?',
      'Does the packet prove absence of alternatives, or only nominate a review surface?',
    ],
  },
  'paste-blocking': {
    sc: null,
    standard: 'WCAG 2.2 SC 3.3.8 / 3.3.7 authentication and redundant-entry support',
    mode: 'flow-semantic',
    requiredEvidence: ['paste-blocking-observed', 'authentication-or-reentry-impact'],
    questions: [
      'Was paste actually blocked by a trusted paste/input attempt?',
      'Does the field participate in authentication or repeated-entry workflow?',
      'Is there another mechanism that avoids the cognitive/re-entry burden?',
    ],
  },
  'redundant-entry-review': {
    sc: '3.3.7',
    standard: 'WCAG 2.2 SC 3.3.7 Redundant Entry',
    mode: 'process-semantic',
    task: 'Decide whether this evidence supports a scoped redundant-entry barrier, or is insufficient. Current broad-scope redundant-entry packets must not clear conformance.',
    allowedVerdicts: ['LIKELY_BARRIER', 'UNCERTAIN'],
    requiredEvidence: ['same-process', 'same-information-previously-provided', 'required-reentry', 'no-auto-populate-or-selection-exception'],
    promptRules: [
      'SC 3.3.7 applies only when information was previously entered by or provided to the user in the same process.',
      'A barrier requires the same information to be required again, not merely two different fields with similar labels.',
      'Do not report a barrier if the information is auto-populated, available for selection, optional to repeat, required for security, required because previous data is invalid, or essential to the activity.',
      'Judge only the scoped repeated-entry evidence. Do not infer process-wide conformance from one clean field pair or from absence of a duplicate name.',
      'Because this broad-scope redundant-entry lane has no registered v3 claim family, return UNCERTAIN rather than LIKELY_OK for adequate reuse mechanisms, exceptions, or scoped controls.',
    ],
    questions: [
      'Is this the same process, and was the same information previously entered or provided?',
      'Is re-entry required, and is the value available for selection or auto-populated?',
      'Does a security, invalid-data, or essential exception apply?',
    ],
  },
  'timeout-risk': {
    sc: null,
    standard: 'WCAG 2.2 SC 2.2.1 Timing Adjustable / SC 2.2.6 Timeouts',
    mode: 'process-semantic',
    requiredEvidence: ['timed-session-or-countdown', 'adjustment-warning-preservation-evidence'],
    questions: [
      'Is a time limit imposed by the content rather than the user agent?',
      'Can the user turn off, adjust, or extend the limit before expiry?',
      'Is this an essential real-time/security exception?',
    ],
  },
});

function buildReviewPacketsFromProcessAnalysis(processAnalysis = {}, context = {}) {
  const warnings = Array.isArray(processAnalysis.warnings) ? processAnalysis.warnings : [];
  if (!warnings.length && !context.includeControls) return [];
  return [{
    packetId: `${context.prefix || 'process-packet'}:${safeIdPart(context.id || context.file || 'process')}`,
    aspect: 'complete-process',
    detector: 'process-manifest',
    sc: null,
    rawSc: '',
    claimFamily: null,
    targetXpath: null,
    standard: ASPECTS['complete-process'].standard,
    mode: ASPECTS['complete-process'].mode,
    defaultIfInsufficient: 'UNCERTAIN',
    evidenceRefs: ['process-manifest'],
    observed: {
      kind: processAnalysis.kind || 'process-scope',
      stepCount: processAnalysis.stepCount || 0,
      requiredStepIds: Array.isArray(processAnalysis.requiredStepIds) ? processAnalysis.requiredStepIds.map(String) : [],
      measuredStepIds: Array.isArray(processAnalysis.measuredStepIds) ? processAnalysis.measuredStepIds.map(String) : [],
      missingRequiredSteps: Array.isArray(processAnalysis.missingRequiredSteps) ? processAnalysis.missingRequiredSteps.map(String) : [],
      duplicateStepIds: Array.isArray(processAnalysis.duplicateStepIds) ? processAnalysis.duplicateStepIds.map(String) : [],
      missingTargets: Array.isArray(processAnalysis.missingTargets) ? processAnalysis.missingTargets.map(String) : [],
      unmeasuredSteps: Array.isArray(processAnalysis.unmeasuredSteps) ? processAnalysis.unmeasuredSteps.map(String) : [],
      missingStepResults: Array.isArray(processAnalysis.missingStepResults) ? processAnalysis.missingStepResults.map(String) : [],
      failedSteps: Array.isArray(processAnalysis.failedSteps) ? processAnalysis.failedSteps.map(String) : [],
      redundantEntryFindings: Array.isArray(processAnalysis.redundantEntryFindings) ? processAnalysis.redundantEntryFindings.map(String) : [],
      evidenceClaims: Array.isArray(processAnalysis.evidenceClaims) ? processAnalysis.evidenceClaims.map(String) : [],
      findings: Array.isArray(processAnalysis.findings) ? processAnalysis.findings : [],
      warnings: warnings.map(String),
    },
    requiredEvidence: ASPECTS['complete-process'].requiredEvidence,
    questions: ASPECTS['complete-process'].questions,
    limitations: [
      'Process-scope packet; never lift into an element-level v3 judgment.',
      'Do not infer complete-process conformance from clean individual pages.',
      'Clean process manifests are review controls only unless a registered claim family derives a definite conformance outcome.',
    ],
  }];
}

function buildReviewPacketsFromSiteSetAnalysis(siteAnalysis = {}, context = {}) {
  const warnings = Array.isArray(siteAnalysis.warnings) ? siteAnalysis.warnings : [];
  if (!warnings.length && !context.includeControls) return [];
  return [{
    packetId: `${context.prefix || 'site-packet'}:${safeIdPart(context.id || context.file || 'site-set')}`,
    aspect: 'site-set-consistency',
    detector: 'site-set-manifest',
    sc: null,
    rawSc: '',
    claimFamily: null,
    targetXpath: null,
    standard: ASPECTS['site-set-consistency'].standard,
    mode: ASPECTS['site-set-consistency'].mode,
    defaultIfInsufficient: 'UNCERTAIN',
    evidenceRefs: ['site-set-manifest'],
    observed: {
      kind: siteAnalysis.kind || 'site-set-scope',
      pageCount: siteAnalysis.pageCount || 0,
      sameStateBreakpointContext: siteAnalysis.sameStateBreakpointContext === true,
      duplicateTitles: siteAnalysis.duplicateTitles || [],
      comparisonCounts: siteAnalysis.comparisonCounts || {},
      evidenceClaims: Array.isArray(siteAnalysis.evidenceClaims) ? siteAnalysis.evidenceClaims.map(String) : [],
      findings: Array.isArray(siteAnalysis.findings) ? siteAnalysis.findings : [],
      warnings: warnings.map(String),
    },
    requiredEvidence: ASPECTS['site-set-consistency'].requiredEvidence,
    questions: ASPECTS['site-set-consistency'].questions,
    limitations: [
      'Site-set packet; never back-project into a single-page element verdict.',
      'Requires same state, locale, and breakpoint context before a no-human LLM can make a strong judgment.',
      'Clean site-set manifests are review controls only unless a registered claim family derives a definite conformance outcome.',
    ],
  }];
}

function buildJudgePrompt(packet = {}) {
  const discoveryOnly = DISCOVERY_ONLY_ASPECTS.has(String(packet.aspect || ''));
  const spec = ASPECTS[String(packet.aspect || '')] || {};
  const allowedVerdicts = discoveryOnly
    ? ['UNCERTAIN']
    : (Array.isArray(spec.allowedVerdicts) && spec.allowedVerdicts.length ? spec.allowedVerdicts : VERDICTS);
  return [
    {
      role: 'system',
      content: 'You are judging broad-scope accessibility evidence. Use WCAG/Trusted Tester/EN semantics. Absence of evidence is not a pass. Output strict JSON only.',
    },
    {
      role: 'user',
      content: JSON.stringify({
        task: spec.task || (discoveryOnly
          ? 'Identify the downstream accessibility checks needed for this discovery packet; do not decide conformance from discovery alone.'
          : 'Decide whether this evidence packet supports a barrier, supports no barrier/exception, or is insufficient.'),
        allowedVerdicts,
        rules: [
          ...(discoveryOnly ? ['Discovery-only packets must return UNCERTAIN; downstream conformance evidence is required before barrier or clear verdicts.'] : []),
          ...(Array.isArray(spec.promptRules) ? spec.promptRules : []),
          'Return UNCERTAIN when scope, applicability, required measurement, process context, or exception evidence is missing.',
          'Require visual agreement only when the packet claims visual evidence is load-bearing; temporal/state packets may use screenshots as context while measured state is load-bearing.',
          'Do not clear from absence of a finding.',
          'For broad-scope packets, a clean detector result is scoped evidence only, never page-wide conformance.',
          'For threshold/time/process claims, require positive measurement of the threshold/scope named in the packet.',
          'For broad lanes, cite evidenceRefs only; do not invent facts outside the packet.',
        ],
        packet,
      }),
    },
  ];
}

function buildCriticPrompt(packet = {}, proposed = {}) {
  return [
    {
      role: 'system',
      content: 'You are an adversarial WCAG reviewer. Attack both false positives and false negatives. Output strict JSON only.',
    },
    {
      role: 'user',
      content: JSON.stringify({
        task: 'Review the proposed broad-scope verdict. If it could be wrong under WCAG/Trusted Tester/EN, say so.',
        allowedResponses: ['AGREE', 'DISPUTE'],
        disputeMeans: 'Any missing evidence, scope gap, exception, or contradiction that should force PARTIAL/UNCERTAIN.',
        packet,
        proposed,
      }),
    },
  ];
}

function wcagScTokens(sc) {
  return [...new Set([...String(sc || '').matchAll(/\b\d\.\d{1,2}\.\d{1,2}\b/g)].map((m) => m[0]))];
}

function firstSc(sc) {
  return wcagScTokens(sc)[0] || null;
}

function aspectForFinding(f = {}) {
  const d = String(f.detector || f.family || f.kind || '');
  if (ASPECTS[d]) return d;
  if (/text-spacing/i.test(d)) return 'text-spacing';
  if (/resize-text/i.test(d)) return 'resize-text';
  if (/forced-colors-nontext/i.test(d)) return 'forced-colors-nontext';
  if (/forced-colors/i.test(d)) return 'forced-colors';
  if (/reduced-motion/i.test(d)) return 'reduced-motion';
  if (/motion|pause-stop-hide/i.test(d)) return 'motion-control';
  if (/audio/i.test(d)) return 'audio-control';
  if (/flash/i.test(d)) return 'flash-risk';
  if (/keyboard-trap|trap/i.test(d)) return 'keyboard-trap';
  if (/context-change/i.test(d)) return 'context-change';
  if (/pointer-gesture|path-gesture|path-based/i.test(d)) return 'pointer-gesture';
  if (/pointer/i.test(d)) return 'pointer-operation';
  if (/character-shortcut|shortcut/i.test(d)) return 'character-shortcut';
  if (/label-in-name|name-label|visible-label/i.test(d)) return 'label-in-name';
  if (/target-size|pointer-target-size/i.test(d)) return 'target-size-minimum';
  if (/dragging-movement|dragging|drag-/i.test(d)) return 'dragging-movement';
  if (/reveal-state|disclosure-state|dynamic-subject/i.test(d)) return 'reveal-state-discovery';
  if (/visual-structure|rendered-structure|page-structure-vision/i.test(d)) return 'visual-structure-discovery';
  if (/visual-content|non-dom-visual|background-image-text|canvas-visual|svg-visual|color-only/i.test(d)) return 'visual-content-discovery';
  if (/status-announcement|status-message/i.test(d)) return 'status-announcement';
  if (/media-alternative/i.test(d)) return 'media-alternative-inventory';
  if (/captcha/i.test(d)) return 'captcha-authentication';
  if (/paste/i.test(d)) return 'paste-blocking';
  if (/redundant-entry/i.test(d)) return 'redundant-entry-review';
  if (/timeout/i.test(d)) return 'timeout-risk';
  if (/authentication/i.test(d)) return 'accessible-authentication';
  return d || 'broad-scope';
}

function buildReviewPacketsFromBroadScope(broadScope = {}, opts = {}) {
  const findings = Array.isArray(broadScope.findings) ? broadScope.findings : [];
  const visualById = new Map((Array.isArray(broadScope.visualChecks) ? broadScope.visualChecks : []).map((v) => [String(v.id || ''), v]));
  const scopeWarnings = Array.isArray(broadScope.scopeWarnings) ? broadScope.scopeWarnings.map(String) : [];
  const packets = [];
  findings.forEach((f, i) => {
    if (!f || typeof f !== 'object') return;
    const aspect = aspectForFinding(f);
    const spec = ASPECTS[aspect] || {};
    const rawSc = String(f.sc || spec.sc || '');
    const relatedScs = wcagScTokens(rawSc);
    const sc = firstSc(rawSc) || spec.sc || null;
    const detector = String(f.detector || aspect);
    const targetXpath = f.xpath || f.path || null;
    const visualRef = f.visualRef != null ? String(f.visualRef) : null;
    const visual = visualRef ? visualById.get(visualRef) : null;
    const claimFamily = spec.claimFamily || null;
    packets.push({
      packetId: `${opts.prefix || 'broad-packet'}:${i}:${safeIdPart(aspect)}:${safeIdPart(targetXpath || 'page')}`,
      aspect,
      detector,
      sc,
      rawSc,
      relatedScs,
      claimFamily,
      targetXpath,
      standard: spec.standard || `Broad-scope accessibility review for ${aspect}`,
      mode: spec.mode || 'review-only',
      defaultIfInsufficient: 'UNCERTAIN',
      evidenceRefs: [
        `broadScope.findings[${i}]`,
        ...(visualRef ? [visualRef] : []),
      ],
      observed: {
        kind: String(f.kind || aspect),
        detail: String(f.detail || f.reason || ''),
        evidenceClaims: Array.isArray(f.evidenceClaims) ? f.evidenceClaims.map(String) : [],
        evidenceStrength: f.evidenceStrength != null ? String(f.evidenceStrength) : '',
        ...(f.evidenceDetails && typeof f.evidenceDetails === 'object' ? { evidenceDetails: f.evidenceDetails } : {}),
        ...(f.facts && typeof f.facts === 'object' ? { facts: f.facts } : {}),
        hasVisualRef: !!visualRef,
        visualAgreement: visual ? (visual.agreement === true ? true : visual.agreement === false ? false : null) : null,
        visualNote: visual && visual.note != null ? String(visual.note) : '',
        scopeWarnings,
      },
      requiredEvidence: spec.requiredEvidence || ['positive-evidence', 'applicability', 'exceptions'],
      questions: spec.questions || [
        'Does the packet provide positive evidence of applicability?',
        'Does it provide positive evidence for a barrier or exception?',
        'If any required evidence is missing, return UNCERTAIN.',
      ],
      limitations: [
        'Do not infer a clear from absence of this candidate.',
        'Do not use detector labels as conformance verdicts.',
        ...(targetXpath ? [] : ['No concrete target xpath; this cannot be lifted into an element-level v3 judgment.']),
        ...(claimFamily ? [] : ['No registered v3 claim family; this packet remains sidecar/review unless a family is registered.']),
        ...(/temporal/i.test(spec.mode || '') ? ['Temporal measured evidence is load-bearing; still screenshots may be contextual only.'] : []),
      ],
    });
  });
  return packets;
}

function structuralEvidenceStatus(packet = {}) {
  const aspect = String(packet.aspect || '');
  const spec = ASPECTS[aspect] || {};
  const required = Array.isArray(packet.requiredEvidence) && packet.requiredEvidence.length
    ? packet.requiredEvidence.map(String)
    : (Array.isArray(spec.requiredEvidence) ? spec.requiredEvidence.map(String) : []);
  const observed = packet.observed && typeof packet.observed === 'object' ? packet.observed : {};
  const claims = new Set(Array.isArray(observed.evidenceClaims) ? observed.evidenceClaims.map(String) : []);
  const missing = required.filter((r) => !claims.has(r));
  const disqualifying = Array.isArray(spec.disqualifyingEvidence) ? spec.disqualifyingEvidence.map(String) : [];
  const disqualifyingFound = disqualifying.filter((r) => claims.has(r));
  return {
    ok: required.length > 0 && missing.length === 0 && disqualifyingFound.length === 0,
    required,
    disqualifying,
    disqualifyingFound,
    claims: [...claims],
    missing,
  };
}

function parseJsonish(out) {
  if (!out) return null;
  if (typeof out === 'object') return out;
  if (typeof out !== 'string') return null;
  try { return JSON.parse(out); } catch (e) { return null; }
}

function normalizeJudge(out) {
  const j = parseJsonish(out);
  if (!j || !VERDICTS.includes(j.verdict)) return { verdict: 'UNCERTAIN', confidence: 'low', evidenceRefs: [], reasoning: 'malformed judge output' };
  return {
    verdict: j.verdict,
    confidence: ['low', 'medium', 'high'].includes(j.confidence) ? j.confidence : 'low',
    evidenceRefs: Array.isArray(j.evidenceRefs) ? j.evidenceRefs.map(String) : [],
    summary: String(j.summary || ''),
    reasoning: String(j.reasoning || ''),
  };
}

function normalizeCritic(out) {
  const c = parseJsonish(out);
  if (!c || !['AGREE', 'DISPUTE'].includes(c.response)) return { response: 'DISPUTE', reason: 'malformed critic output' };
  return { response: c.response, reason: String(c.reason || c.reasoning || '') };
}

function reconcileJudgeCritic(judge, critic) {
  const j = normalizeJudge(judge);
  const c = normalizeCritic(critic);
  if (c.response !== 'AGREE') return { ...j, verdict: 'UNCERTAIN', confidence: 'low', critic: c, reasoning: `critic disputed: ${c.reason}` };
  return { ...j, critic: c };
}

function clampAllowedVerdict(packet = {}, reviewed = {}) {
  const aspect = String(packet.aspect || '');
  const spec = ASPECTS[aspect] || {};
  const allowed = Array.isArray(spec.allowedVerdicts) && spec.allowedVerdicts.length
    ? spec.allowedVerdicts
    : VERDICTS;
  const j = normalizeJudge(reviewed);
  if (allowed.includes(j.verdict)) return { ...j, critic: reviewed.critic || j.critic || null };
  return {
    ...j,
    verdict: 'UNCERTAIN',
    confidence: 'low',
    critic: reviewed.critic || j.critic || null,
    reasoning: [
      j.reasoning || '',
      `${aspect} does not allow ${j.verdict}; allowed verdicts are ${allowed.join(', ')}.`,
    ].filter(Boolean).join(' '),
  };
}

function clampDiscoveryVerdict(packet = {}, reviewed = {}) {
  const aspect = String(packet.aspect || '');
  const j = normalizeJudge(reviewed);
  if (!DISCOVERY_ONLY_ASPECTS.has(aspect)) return { ...j, critic: reviewed.critic || j.critic || null };
  return {
    ...j,
    verdict: 'UNCERTAIN',
    confidence: 'low',
    critic: reviewed.critic || j.critic || null,
    reasoning: [
      j.reasoning || '',
      `${aspect} is discovery-only; downstream conformance evidence is required before any barrier/clear verdict.`,
    ].filter(Boolean).join(' '),
  };
}

function clampUnsupportedBarrierVerdict(packet = {}, reviewed = {}) {
  const j = normalizeJudge(reviewed);
  if (j.verdict !== 'LIKELY_BARRIER') return { ...j, critic: reviewed.critic || j.critic || null };
  const evidence = structuralEvidenceStatus(packet);
  if (evidence.ok) return { ...j, critic: reviewed.critic || j.critic || null };
  return {
    ...j,
    verdict: 'UNCERTAIN',
    confidence: 'low',
    critic: reviewed.critic || j.critic || null,
    reasoning: [
      j.reasoning || '',
      evidence.missing.length
        ? `LIKELY_BARRIER requires structural evidence: missing ${evidence.missing.join(', ')}.`
        : `LIKELY_BARRIER is blocked by disqualifying evidence: ${evidence.disqualifyingFound.join(', ') || 'disqualifying evidence'}.`,
    ].filter(Boolean).join(' '),
  };
}

async function runBroadScopeLlmReview(packet, { runJudge, runCritic } = {}) {
  if (typeof runJudge !== 'function' || typeof runCritic !== 'function') {
    throw new Error('runBroadScopeLlmReview requires injected runJudge and runCritic functions');
  }
  const judgeOut = await runJudge(buildJudgePrompt(packet), packet);
  const judge = normalizeJudge(judgeOut);
  const criticOut = await runCritic(buildCriticPrompt(packet, judge), packet, judge);
  return clampUnsupportedBarrierVerdict(
    packet,
    clampDiscoveryVerdict(packet, clampAllowedVerdict(packet, reconcileJudgeCritic(judge, criticOut))),
  );
}

function safeIdPart(s) {
  return String(s || '')
    .replace(/[^a-zA-Z0-9_.:-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 120) || 'unknown';
}

function reviewToJudgment(packet = {}, reviewed = {}, opts = {}) {
  const sc = String(packet.sc || '');
  const claimFamily = String(packet.claimFamily || packet.family || '');
  const targetXpath = String(packet.targetXpath || packet.xpath || '');
  const j = normalizeJudge(reviewed);
  // Broad-scope LLM review is a recall/triage lane. In no-human operation, clearing
  // from semantic broad-scope evidence is the stealthy failure mode, so the v3 bridge
  // is barrier-only. Clear-side reviews remain sidecar rationale.
  if (j.verdict !== 'LIKELY_BARRIER') return null;
  if (!V.ALL_SCS.includes(sc)) return null;
  if (!claimFamily || !targetXpath) return null;
  const familySpec = oracle.FAMILIES[claimFamily];
  if (!familySpec || familySpec.sc !== sc) return null;
  const evidence = structuralEvidenceStatus(packet);
  if (!evidence.ok) return null;
  const judgmentId = opts.judgmentId || [
    'broad',
    safeIdPart(sc),
    safeIdPart(claimFamily),
    safeIdPart(targetXpath),
  ].join(':');
  return {
    judgmentId,
    sc,
    claimFamily,
    targetXpath,
    observationScope: {
      actionTargetRef: targetXpath,
      state: String(packet.state || 'broad-scope-review'),
      action: String(packet.action || 'inspect'),
      environment: String(packet.environment || 'headless-chromium'),
    },
    rubricRef: String(opts.rubricRef || packet.rubricRef || `broad-scope-${safeIdPart(claimFamily)}-v0`),
    verdict: j.verdict,
    confidence: j.confidence,
    evidenceRefs: j.evidenceRefs,
    summary: j.summary,
    reasoning: j.reasoning,
  };
}

function buildJudgmentsArtifact(broadScope = {}, reviews = [], opts = {}) {
  const judgments = [];
  for (const row of reviews || []) {
    const packet = row && row.packet ? row.packet : row;
    const reviewed = row && row.reviewed ? row.reviewed : row;
    const j = reviewToJudgment(packet, reviewed, opts);
    if (j) judgments.push(j);
  }
  return {
    file: broadScope.file,
    runId: broadScope.runId,
    pageDigest: broadScope.pageDigest,
    judgments,
  };
}

async function runBroadScopePacketReviews(broadScope = {}, { runJudge, runCritic, maxPackets = Infinity } = {}) {
  if (typeof runJudge !== 'function' || typeof runCritic !== 'function') {
    throw new Error('runBroadScopePacketReviews requires injected runJudge and runCritic functions');
  }
  const id = { file: broadScope.file, runId: broadScope.runId, pageDigest: broadScope.pageDigest };
  const packets = Array.isArray(broadScope.reviewPackets) && broadScope.reviewPackets.length
    ? broadScope.reviewPackets
    : buildReviewPacketsFromBroadScope(broadScope);
  const reviews = [];
  const rationales = [];
  let n = 0;
  for (const packet of packets) {
    if (n++ >= maxPackets) break;
    const reviewed = await runBroadScopeLlmReview(packet, { runJudge, runCritic });
    const judgment = reviewToJudgment(packet, reviewed);
    reviews.push({ packet, reviewed, judgmentId: judgment ? judgment.judgmentId : null });
    rationales.push({
      id: judgment ? judgment.judgmentId : `${packet.packetId || 'broad-packet'}#review`,
      packetId: packet.packetId || null,
      aspect: packet.aspect || null,
      targetXpath: packet.targetXpath || null,
      sc: packet.sc || null,
      claimFamily: packet.claimFamily || null,
      verdict: reviewed.verdict,
      confidence: reviewed.confidence,
      summary: reviewed.summary || '',
      reasoning: reviewed.reasoning || '',
      critic: reviewed.critic || null,
      evidenceRefs: reviewed.evidenceRefs || [],
      convertedToJudgment: !!judgment,
    });
  }
  return {
    reviews,
    judgments: buildJudgmentsArtifact(id, reviews),
    broadScopeRationale: { ...id, rationales },
  };
}

module.exports = {
  VERDICTS,
  buildJudgePrompt,
  buildCriticPrompt,
  normalizeJudge,
  normalizeCritic,
  reconcileJudgeCritic,
  clampDiscoveryVerdict,
  runBroadScopeLlmReview,
  buildReviewPacketsFromBroadScope,
  buildReviewPacketsFromProcessAnalysis,
  buildReviewPacketsFromSiteSetAnalysis,
  structuralEvidenceStatus,
  clampUnsupportedBarrierVerdict,
  reviewToJudgment,
  buildJudgmentsArtifact,
  runBroadScopePacketReviews,
};
