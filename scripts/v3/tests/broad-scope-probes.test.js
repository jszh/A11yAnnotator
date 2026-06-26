'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const puppeteer = require('puppeteer');
const { buildV3 } = require('../lib/build-v3.js');
const { crossArtifactErrors } = require('../lib/cross-artifact.js');
const { orchestrate } = require('../lib/orchestrator.js');

const {
  parseViewportPolicy,
  analyzeProcessManifest,
  analyzeSiteSetManifest,
  collectScopeInventory,
  runBroadScopeForUrl,
  probeTextSpacing,
  probeResizeText,
  probeReducedMotion,
  probeForcedColors,
  probeAudioAutoplay,
  probeFlashTemporal,
  probeContextChanges,
  probePointerActivation,
  probePointerGestures,
  probeDraggingMovements,
  probeRevealStates,
  probeVisualStructureDiscovery,
  probeVisualContentDiscovery,
  probeCharacterShortcuts,
  probeStatusMessages,
  probeLabelInName,
  probeTargetSize,
  collectNonInterferenceCandidates,
  collectInteractionCandidates,
  collectMediaAlternativeInventory,
  collectAuthenticationAndEntryCandidates,
  collectCognitiveCandidatesFromText,
} = require('../lib/broad-scope-probes.js');
const { structuralEvidenceStatus } = require('../lib/broad-scope-llm-review.js');

const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH
  || process.env.CHROME_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function withPage(html, fn) {
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: CHROME,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required'],
  });
  try {
    const page = await browser.newPage();
    await page.goto(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`, { waitUntil: 'load' });
    return await fn(page);
  } finally {
    await browser.close();
  }
}

function toneWavDataUri(seconds = 4, frequency = 440) {
  const sampleRate = 8000;
  const samples = Math.floor(sampleRate * seconds);
  const dataSize = samples;
  const buf = Buffer.alloc(44 + dataSize);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + dataSize, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);
  buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate, 28);
  buf.writeUInt16LE(1, 32);
  buf.writeUInt16LE(8, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < samples; i++) {
    const v = Math.round(128 + 80 * Math.sin((2 * Math.PI * frequency * i) / sampleRate));
    buf[44 + i] = Math.max(0, Math.min(255, v));
  }
  return `data:audio/wav;base64,${buf.toString('base64')}`;
}

const scope = { actionTargetRef: 'node:b1', state: 'fresh-load', action: 'tab-to', environment: 'headless-chromium' };
const FULL = { targetIsFocusable: true, keyboardReachableInState: true, realKeyboardFocus: true, hydrationReady: true, focusDependentIndicator: true, obviouslyVisible: true, stableIndicatorAbsence: true, modeCompletenessProven: true };
const baseBundle = () => ({
  collect: { file: 'p', runId: 'R', pageDigest: 'sha256:d', collectedAt: 1000, elements: [{ xpath: 'node:b1', focusable: true }] },
  experiments: { file: 'p', runId: 'R', pageDigest: 'sha256:d', catalogVersion: '3.0.0-phase0', startedAt: 2000, results: [{ claimId: 'c1', experimentId: 'focus-visual-retry', targetXpath: 'node:b1', sc: '2.4.7', observationScope: scope, outcome: FULL, applicabilityEvidence: { targetIsFocusable: true, keyboardReachableInState: true } }] },
  claimProposals: { file: 'p', runId: 'R', pageDigest: 'sha256:d', proposals: [{ claimId: 'c1', sc: '2.4.7', direction: 'NO_BARRIER_OBSERVED', experimentId: 'focus-visual-retry', claimFamily: 'focus-indicator-visible', observationScope: scope }] },
});

test('viewport parsing catches zoom-restricting policies without flagging ordinary responsive metadata', () => {
  assert.equal(parseViewportPolicy('width=device-width, initial-scale=1').blocksZoom, false);
  assert.equal(parseViewportPolicy('width=device-width, maximum-scale=1').blocksZoom, true);
  assert.equal(parseViewportPolicy('user-scalable=no, width=device-width').blocksZoom, true);
});

test('process and site-set manifests disclose scope risks without page-level claims', () => {
  const process = analyzeProcessManifest({
    requiresPersistedUserData: true,
    requiredStepIds: ['shipping', 'payment', 'confirm'],
    steps: [
      { id: 'shipping', url: '/checkout/shipping', measured: true, result: 'pass' },
      { id: 'shipping', stateRef: 'state://duplicate', measured: true, result: 'pass' },
      { id: 'payment', measured: false, result: 'fail' },
      {},
    ],
  });
  assert(process.warnings.includes('process-step-duplicate:shipping'));
  assert(process.warnings.includes('process-step-missing-target:payment'));
  assert(process.warnings.includes('process-step-unmeasured:payment'));
  assert(process.warnings.includes('process-step-result-fail:payment'));
  assert(process.warnings.includes('process-required-step-unmeasured:confirm'));
  assert(process.warnings.includes('process-boundary-not-proven-complete'));
  assert(process.warnings.includes('redundant-entry-unmeasurable:no-persisted-fields'));
  assert.deepEqual(process.duplicateStepIds, ['shipping']);
  assert.deepEqual(process.missingRequiredSteps.sort(), ['confirm', 'payment'].sort());
  assert(process.evidenceClaims.includes('declared-process-steps'));
  assert(process.evidenceClaims.includes('process-coverage-gap-observed'));
  assert(process.evidenceClaims.includes('process-failure-observed'));
  assert(!process.evidenceClaims.includes('all-required-steps-measured'));

  const site = analyzeSiteSetManifest({
    sameStateBreakpointContext: true,
    pages: [
      {
        url: '/a',
        title: 'Help',
        purpose: 'support home',
        helpMechanisms: [{ type: 'chat', label: 'Support chat', href: '/chat' }],
        navItems: [{ label: 'Home', href: '/' }, { label: 'Help', href: '/help' }],
        components: [{ key: 'search', label: 'Search', role: 'button' }],
        links: [{ name: 'Details', href: '/a/details', purpose: 'article details' }],
      },
      {
        url: '/b',
        title: 'help',
        purpose: 'billing help',
        helpMechanisms: [{ type: 'phone', label: 'Call support', href: 'tel:1' }],
        navItems: [{ label: 'Help', href: '/support' }, { label: 'Home', href: '/' }],
        components: [{ key: 'search', label: 'Find', role: 'button' }],
        links: [{ name: 'Details', href: '/b/details', purpose: 'billing details' }],
      },
    ],
  });
  assert.equal(site.duplicateTitles[0].title, 'help');
  assert(site.warnings.includes('duplicate-page-title-in-set'));
  assert(!site.warnings.includes('inconsistent-help-mechanisms'));
  assert(site.warnings.includes('inconsistent-navigation-order'));
  assert(site.warnings.includes('navigation-label-different-destination:help'));
  assert(site.warnings.includes('inconsistent-component-identification:search'));
  assert(site.warnings.includes('same-link-name-different-purpose:details'));
  assert(site.evidenceClaims.includes('declared-page-set'));
  assert(site.evidenceClaims.includes('same-state-breakpoint-context'));
  assert(site.evidenceClaims.includes('repeated-mechanism-comparison'));
  assert(site.evidenceClaims.includes('site-set-inconsistency-observed'));
  assert(!site.evidenceClaims.includes('site-set-scope-gap-observed'));

  const samePurposeDuplicateTitle = analyzeSiteSetManifest({
    sameStateBreakpointContext: true,
    pages: [
      { url: '/a', title: 'Help', purpose: 'support', helpMechanisms: ['chat'] },
      { url: '/b', title: 'help', purpose: 'support', helpMechanisms: ['chat'] },
    ],
  });
  assert(!samePurposeDuplicateTitle.warnings.includes('duplicate-page-title-in-set'));
});

test('site-set scope gaps are not site-set inconsistency evidence', () => {
  const missingContext = analyzeSiteSetManifest({
    pages: [
      { url: '/a', title: 'A', purpose: 'a', navItems: [{ label: 'Home', href: '/' }] },
      { url: '/b', title: 'B', purpose: 'b', navItems: [{ label: 'Home', href: '/' }] },
    ],
  });
  assert(missingContext.warnings.includes('site-set-state-breakpoint-context-unproven'));
  assert(missingContext.evidenceClaims.includes('site-set-scope-gap-observed'));
  assert(!missingContext.evidenceClaims.includes('site-set-inconsistency-observed'));

  const missingUrl = analyzeSiteSetManifest({
    sameStateBreakpointContext: true,
    pages: [
      { url: '/a', title: 'A', purpose: 'a', navItems: [{ label: 'Home', href: '/' }] },
      { title: 'B', purpose: 'b', navItems: [{ label: 'Home', href: '/' }] },
    ],
  });
  assert(missingUrl.warnings.includes('site-page-missing-url'));
  assert(missingUrl.evidenceClaims.includes('site-set-scope-gap-observed'));
  assert(!missingUrl.evidenceClaims.includes('site-set-inconsistency-observed'));
});

test('site-set link href variance alone is review evidence, not different-purpose proof', () => {
  const hrefOnly = analyzeSiteSetManifest({
    sameStateBreakpointContext: true,
    pages: [
      { url: '/a', title: 'A', purpose: 'a', links: [{ name: 'Details', href: '/a/details' }] },
      { url: '/b', title: 'B', purpose: 'b', links: [{ name: 'Details', href: '/b/details' }] },
    ],
  });
  assert(hrefOnly.warnings.includes('same-link-name-different-destination-review:details'));
  assert(hrefOnly.evidenceClaims.includes('site-set-review-gap-observed'));
  assert(!hrefOnly.evidenceClaims.includes('site-set-inconsistency-observed'));

  const explicitPurpose = analyzeSiteSetManifest({
    sameStateBreakpointContext: true,
    pages: [
      { url: '/a', title: 'A', purpose: 'a', links: [{ name: 'Details', href: '/a/details', purpose: 'article details' }] },
      { url: '/b', title: 'B', purpose: 'b', links: [{ name: 'Details', href: '/b/details', purpose: 'billing details' }] },
    ],
  });
  assert(explicitPurpose.warnings.includes('same-link-name-different-purpose:details'));
  assert(explicitPurpose.evidenceClaims.includes('site-set-inconsistency-observed'));
});

test('process manifests fail closed when coverage or measurement facts are undeclared', () => {
  const incomplete = analyzeProcessManifest({
    processId: 'checkout',
    steps: [
      { id: 'cart', url: '/cart', result: 'pass' },
      { id: 'shipping', url: '/shipping', result: 'pass' },
    ],
  });
  assert(incomplete.warnings.includes('process-required-steps-undeclared'));
  assert(incomplete.warnings.includes('process-boundary-not-proven-complete'));
  assert(incomplete.warnings.includes('process-step-measurement-missing:cart'));
  assert.deepEqual(incomplete.measuredStepIds, []);
  assert(!incomplete.evidenceClaims.includes('process-scope-comparison'));
  assert(!incomplete.evidenceClaims.includes('all-required-steps-measured'));
  assert(incomplete.evidenceClaims.includes('process-coverage-gap-observed'));
  assert(!incomplete.evidenceClaims.includes('process-failure-observed'));
});

test('site-set consistency avoids exact-array false positives and keeps scoped candidates', () => {
  const helpAvailabilityDifference = analyzeSiteSetManifest({
    sameStateBreakpointContext: true,
    pages: [
      { url: '/a', title: 'Account', purpose: 'account', helpMechanisms: [{ type: 'chat', label: 'Chat' }, { type: 'phone', label: 'Phone' }] },
      { url: '/b', title: 'Settings', purpose: 'settings', helpMechanisms: [{ type: 'chat', label: 'Chat' }] },
    ],
  });
  assert(!helpAvailabilityDifference.warnings.includes('inconsistent-help-mechanism-order'));
  assert(!helpAvailabilityDifference.warnings.includes('inconsistent-help-mechanisms'));

  const helpOrder = analyzeSiteSetManifest({
    sameStateBreakpointContext: true,
    pages: [
      { url: '/a', title: 'Account', purpose: 'account', helpMechanisms: [{ type: 'chat', label: 'Chat' }, { type: 'phone', label: 'Phone' }] },
      { url: '/b', title: 'Settings', purpose: 'settings', helpMechanisms: [{ type: 'phone', label: 'Phone' }, { type: 'chat', label: 'Chat' }] },
    ],
  });
  assert(helpOrder.warnings.includes('inconsistent-help-mechanism-order'));

  const currentPageNav = analyzeSiteSetManifest({
    sameStateBreakpointContext: true,
    pages: [
      { url: '/a', title: 'A', purpose: 'a', navItems: [{ label: 'Home', href: '/' }, { label: 'A', href: '/a' }, { label: 'Settings', href: '/settings' }] },
      { url: '/settings', title: 'Settings', purpose: 'settings', navItems: [{ label: 'Home', href: '/' }, { label: 'A', href: '/a' }, { label: 'Settings', href: '' }] },
    ],
  });
  assert(!currentPageNav.warnings.includes('inconsistent-navigation-order'));
  assert(!currentPageNav.warnings.includes('navigation-label-different-destination:settings'));

  const blankTitle = analyzeSiteSetManifest({
    sameStateBreakpointContext: true,
    pages: [
      { url: '/a', title: '', purpose: 'a' },
      { url: '/b', title: 'B', purpose: 'b' },
    ],
  });
  assert(blankTitle.warnings.includes('site-page-title-missing'));
});

test('scope inventory records truncation, cross-origin frame, shadow, pseudo-background, media, and viewport risks', async () => {
  await withPage(`
    <!doctype html>
    <meta name="viewport" content="width=device-width, user-scalable=no">
    <style>#pseudo::before{content:"";display:block;width:20px;height:20px;background-image:url(data:image/gif;base64,R0lGODlhAQABAIAAAAUEBA==)}</style>
    <iframe srcdoc="<button>same origin</button>"></iframe>
    <iframe sandbox srcdoc="<button>opaque origin</button>"></iframe>
    <div id="pseudo"></div>
    <div id="host"></div>
    <video id="movie" autoplay><track kind="captions" src=""></video>
    <script>host.attachShadow({mode:'open'}).innerHTML='<button>Shadow button</button>';</script>
  `, async (page) => {
    const inv = await collectScopeInventory(page, { elementCap: 1 });
    assert(inv.domElementCount > 1);
    assert.equal(inv.sameOriginIframeCount, 1);
    assert.equal(inv.crossOriginIframeCount, 1);
    assert.equal(inv.shadowHostCount, 1);
    assert.equal(inv.pseudoBackgroundCount, 1);
    assert.equal(inv.media.length, 1);
    assert.deepEqual(inv.scopeWarnings.sort(), [
      'cross-origin-frame-untested',
      'page-truncated-risk',
      'pseudo-background-coverage-needed',
      'shadow-root-coverage-needed',
      'viewport-zoom-restricted',
    ].sort());
  });
});

test('text-spacing probe finds newly clipped text and leaves flexible text clean', async () => {
  await withPage(`
    <!doctype html>
    <style>
      #fragile { font: 16px Arial; width: 139px; height: 24px; overflow: hidden; white-space: nowrap; }
      #flex { font: 16px Arial; max-width: 400px; white-space: normal; }
    </style>
    <div id="fragile">Spacing sensitive</div>
    <div id="flex">This flexible block has enough room to wrap under spacing changes.</div>
  `, async (page) => {
    const result = await probeTextSpacing(page);
    assert.equal(result.before.clipped.some((c) => c.path === '#fragile'), false);
    assert.equal(result.candidates.some((c) => c.path === '#fragile'), true);
    assert.equal(result.candidates.some((c) => c.path === '#flex'), false);
  });
});

test('resize-text probe finds 200 percent text clipping and leaves flexible layout clean', async () => {
  await withPage(`
    <!doctype html>
    <style>
      #fragileResize { font-size: 1rem; line-height: 1.2; width: 260px; height: 24px; overflow: hidden; white-space: nowrap; }
      #flexResize { font-size: 1rem; max-width: 600px; white-space: normal; }
    </style>
    <div id="fragileResize">Resize sensitive button label</div>
    <div id="flexResize">This text can wrap when root text size grows.</div>
  `, async (page) => {
    const result = await probeResizeText(page);
    assert.equal(result.before.clipped.some((c) => c.path === '#fragileResize'), false);
    assert.equal(result.candidates.some((c) => c.path === '#fragileResize'), true);
    assert.equal(result.candidates.some((c) => c.path === '#flexResize'), false);
  });
});

test('reduced-motion probe catches persistent motion that ignores user preference and accepts motion disabled by media query', async () => {
  await withPage(`
    <!doctype html>
    <style>
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      @keyframes pulse { from { opacity: .4; } to { opacity: 1; } }
      #bad { animation: spin 10s linear infinite; }
      #good { animation: pulse 10s linear infinite; }
      @media (prefers-reduced-motion: reduce) { #good { animation: none !important; } }
    </style>
    <div id="bad">Bad motion</div>
    <div id="good">Good motion</div>
  `, async (page) => {
    const result = await probeReducedMotion(page);
    const bad = result.candidates.find((c) => c.path === '#bad');
    assert(bad);
    assert.equal(bad.noWorkingPauseStopHide, true);
    assert.equal(bad.workingPauseStopHide, false);
    assert.equal(result.candidates.some((c) => c.path === '#good'), false);
  });
});

test('reduced-motion probe exercises visible pause controls before treating persistent motion as uncontrolled', async () => {
  await withPage(`
    <!doctype html>
    <style>
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      #motionWithControl { animation: spin 10s linear infinite; }
    </style>
    <div id="motionWithControl">Persistent motion with a control</div>
    <button id="pauseMotion" onclick="document.getElementById('motionWithControl').style.animationPlayState='paused'">Pause animation</button>
  `, async (page) => {
    const result = await probeReducedMotion(page);
    const controlled = result.candidates.find((c) => c.path === '#motionWithControl');
    assert(controlled);
    assert.equal(controlled.workingPauseStopHide, true);
    assert.equal(controlled.noWorkingPauseStopHide, false);
    assert.equal(controlled.controlEvidence.workingTargetPaths.includes('#motionWithControl'), true);
    assert.equal(controlled.controlEvidence.attempts.some((a) => a.selector === '#pauseMotion' && a.clicked), true);
  });
});

test('reduced-motion probe preserves essential-motion metadata without treating it as non-essential', async () => {
  await withPage(`
    <!doctype html>
    <style>
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      #essentialMotion { animation: spin 10s linear infinite; }
    </style>
    <p>The animation is the only progress indication for a required security check.</p>
    <div id="essentialMotion" data-v3-essential-motion="true" role="status">Essential security progress animation</div>
  `, async (page) => {
    const result = await probeReducedMotion(page);
    const essential = result.candidates.find((c) => c.path === '#essentialMotion');
    assert(essential);
    assert.equal(essential.essentialMotion, true);
    assert.equal(essential.parallelNonEssential, false);
    assert.equal(essential.noWorkingPauseStopHide, true);
    assert.equal(essential.workingPauseStopHide, false);
  });
});

test('forced-colors probe nominates opt-out surfaces without treating system-color-friendly controls as barriers', async () => {
  await withPage(`
    <!doctype html>
    <style>
      #badForced {
        color: #111;
        background: #fff;
        border: 2px solid #111;
      }
      @media (forced-colors: active) {
        #badForced {
          forced-color-adjust: none;
          color: #777;
          background: #777;
          border-color: #777;
        }
      }
      #goodForced {
        color: ButtonText;
        background: ButtonFace;
        border: 2px solid ButtonText;
      }
    </style>
    <button id="badForced">Invisible-ish</button>
    <button id="goodForced">System color button</button>
  `, async (page) => {
    const result = await probeForcedColors(page);
    assert.equal(result.after.forcedColorsActive, true);
    const bad = result.candidates.find((c) => c.path === '#badForced');
    assert(bad);
    assert.equal(bad.forcedColorAdjust, 'none');
    assert.equal(bad.textContrastLoss, true);
    assert(bad.beforeContrast >= 4.5);
    assert(bad.afterContrast < 3);
    assert.equal(result.candidates.some((c) => c.path === '#goodForced' && c.forcedColorAdjust === 'none'), false);
  });
});

test('forced-colors probe measures non-text boundary loss on focusable controls', async () => {
  await withPage(`
    <!doctype html>
    <style>
      #badBoundary {
        width: 48px;
        height: 36px;
        background: #fff;
        border: 3px solid #111;
      }
      @media (forced-colors: active) {
        #badBoundary {
          forced-color-adjust: none;
          background: #777;
          border-color: #777;
        }
      }
      #goodBoundary {
        width: 48px;
        height: 36px;
        background: ButtonFace;
        border: 3px solid ButtonText;
      }
    </style>
    <button id="badBoundary" aria-label="Open menu"></button>
    <button id="goodBoundary" aria-label="System menu"></button>
  `, async (page) => {
    const result = await probeForcedColors(page);
    const bad = result.candidates.find((c) => c.path === '#badBoundary');
    assert(bad);
    assert.equal(bad.textContrastLoss, false);
    assert.equal(bad.nonTextBoundaryLoss, true);
    assert(bad.beforeNonTextBoundaryContrast >= 3);
    assert(bad.afterNonTextBoundaryContrast < 3);
    assert.equal(result.candidates.some((c) => c.path === '#goodBoundary'), false);
  });
});

test('non-interference candidates nominate audible autoplay, persistent motion, and flash risk but not obvious exceptions', async () => {
  await withPage(`
    <!doctype html>
    <style>
      @keyframes ticker { from { left: 0; } to { left: 10px; } }
      @keyframes flashFast { from { opacity: 0; } to { opacity: 1; } }
      @keyframes brief { from { opacity: 0; } to { opacity: 1; } }
      #move { animation: ticker 8s infinite; }
      #flash { animation: flashFast .2s infinite; }
      #loader { animation: brief 2s 1; }
    </style>
    <audio id="badAudio" autoplay src="tone.mp3"></audio>
    <audio id="mutedAudio" autoplay muted src="tone.mp3"></audio>
    <audio id="controlledAudio" autoplay controls src="tone.mp3"></audio>
    <div id="move">moving</div>
    <div id="flash">flash</div>
    <div id="loader">loader</div>
  `, async (page) => {
    const result = await collectNonInterferenceCandidates(page);
    const byPath = new Map(result.candidates.map((c) => [c.path, c.family]));
    assert.equal(byPath.get('#badAudio'), 'audio-control');
    assert.equal(byPath.get('#move'), 'motion-control');
    assert.equal(byPath.get('#flash'), 'flash-risk');
    assert.equal(byPath.has('#mutedAudio'), false);
    assert.equal(byPath.has('#controlledAudio'), false);
    assert.equal(byPath.has('#loader'), false);
  });
});

test('interaction candidates nominate passive context changes, pointer surfaces, and shortcut surfaces', async () => {
  await withPage(`
    <!doctype html>
    <input id="focusNav" onfocus="location.hash='moved'">
    <select id="changeNav" onchange="location.hash='selected'"><option>One</option></select>
    <canvas id="draw" onpointerdown="window.drawn=true"></canvas>
    <div id="drag" draggable="true">drag me</div>
    <button id="shortcut" accesskey="x">Save</button>
  `, async (page) => {
    const result = await collectInteractionCandidates(page);
    const families = result.candidates.map((c) => `${c.path}:${c.family}`);
    assert(families.includes('#focusNav:context-change'));
    assert(families.includes('#changeNav:context-change'));
    assert(families.includes('#draw:pointer-operation'));
    assert(families.includes('#drag:pointer-operation'));
    assert(families.includes('#shortcut:character-shortcut'));
  });
});

test('status-message probe distinguishes missing live semantics from live/focus channels', async () => {
  await withPage(`
    <!doctype html>
    <button id="badTrigger" data-v3-status-trigger>Save</button>
    <p id="badStatus" data-v3-status-message></p>
    <button id="removeTrigger" data-v3-status-trigger>Finish</button>
    <p id="removeStatus" data-v3-status-message>Application busy</p>
    <button id="liveTrigger" data-v3-status-trigger>Search</button>
    <p id="liveStatus" data-v3-status-message role="status"></p>
    <button id="alertTrigger" data-v3-status-trigger>Warn</button>
    <p id="alertStatus" data-v3-status-message role="alert"></p>
    <button id="focusTrigger" data-v3-status-trigger>Submit</button>
    <p id="focusStatus" data-v3-status-message tabindex="-1"></p>
    <button id="programmaticTrigger" data-v3-status-trigger>Announce</button>
    <p id="programmaticStatus" data-v3-status-message data-v3-programmatic-status-announcement="true"></p>
    <button id="dialogTrigger" data-v3-status-trigger>Dialog</button>
    <dialog id="modal"><p id="dialogStatus" data-v3-status-message></p><button>OK</button></dialog>
    <button id="nativeDialogTrigger" data-v3-status-trigger>Native alert</button>
    <p id="nativeDialogStatus" data-v3-status-message></p>
    <button id="disclosureTrigger" data-v3-status-trigger aria-expanded="false" aria-controls="panel">Reveal</button>
    <section id="panel" data-v3-disclosure-content hidden><p id="disclosureStatus" data-v3-status-message></p></section>
    <script>
      badTrigger.addEventListener('click', () => { badStatus.textContent = 'Saved changes'; });
      removeTrigger.addEventListener('click', () => { removeStatus.textContent = ''; });
      liveTrigger.addEventListener('click', () => { liveStatus.textContent = '3 results loaded'; });
      alertTrigger.addEventListener('click', () => { alertStatus.textContent = 'Warning shown'; });
      focusTrigger.addEventListener('click', () => { focusStatus.textContent = 'Submission error'; focusStatus.focus(); });
      programmaticTrigger.addEventListener('click', () => {
        programmaticStatus.textContent = 'Saved with direct announcement';
        window.__v3AnnounceStatus(programmaticStatus.textContent, programmaticStatus);
      });
      dialogTrigger.addEventListener('click', () => {
        dialogStatus.textContent = 'Submission error in dialog';
        modal.showModal();
        modal.querySelector('button').focus();
      });
      nativeDialogTrigger.addEventListener('click', () => { alert('Native alert dialog'); });
      disclosureTrigger.addEventListener('click', () => {
        disclosureTrigger.setAttribute('aria-expanded', 'true');
        panel.hidden = false;
        disclosureStatus.textContent = 'Expanded details';
      });
    </script>
  `, async (page) => {
    const result = await probeStatusMessages(page);
    const byPath = new Map(result.candidates.map((c) => [c.path, c]));
    assert.equal(byPath.get('#badStatus').noLiveRegionOrProgrammaticStatusRole, true);
    assert.equal(byPath.get('#badStatus').focusNotMovedToMessage, true);
    assert.equal(byPath.get('#badStatus').trustedActivationObserved, true);
    assert.equal(byPath.get('#removeStatus').statusMessageRemoved, true);
    assert.equal(byPath.get('#removeStatus').noLiveRegionOrProgrammaticStatusRole, true);
    assert.equal(byPath.get('#removeStatus').focusNotMovedToMessage, true);
    assert.equal(byPath.get('#liveStatus').noLiveRegionOrProgrammaticStatusRole, false);
    assert.equal(byPath.get('#alertStatus').noLiveRegionOrProgrammaticStatusRole, false);
    assert.equal(byPath.get('#focusStatus').focusNotMovedToMessage, false);
    assert.equal(byPath.get('#programmaticStatus').programmaticAnnouncementObserved, true);
    assert.equal(byPath.get('#programmaticStatus').noLiveRegionOrProgrammaticStatusRole, false);
    assert.equal(byPath.get('#dialogStatus').contextChangedByDialog, true);
    assert.equal(byPath.get('#dialogStatus').focusNotMovedToMessage, false);
    assert.equal(byPath.get('#disclosureStatus').contextChangedByDisclosure, true);
    assert.equal(byPath.get('#disclosureStatus').focusNotMovedToMessage, false);
    assert(result.nativeDialogs.some((d) => d.message === 'Native alert dialog'));
    assert.equal(byPath.has('#nativeDialogStatus'), false);
  });
});

test('label-in-name probe nominates visible labels missing from accessible names', async () => {
  await withPage(`
    <!doctype html>
    <button id="badAria" aria-label="Submit order">Pay now</button>
    <button id="goodAria" aria-label="Pay now, submit order">Pay now</button>
    <button id="goodContent">Pay now</button>
    <span id="named">Review cart, continue checkout</span>
    <a id="goodLabelled" href="#checkout" aria-labelledby="named">Review cart</a>
    <button id="badLabelled" aria-labelledby="named">Save message</button>
  `, async (page) => {
    const result = await probeLabelInName(page);
    const byPath = new Map(result.observations.map((c) => [c.path, c]));
    assert.equal(byPath.get('#badAria').containsVisibleText, false);
    assert.equal(byPath.get('#goodAria').containsVisibleText, true);
    assert.equal(byPath.get('#goodContent').containsVisibleText, true);
    assert.equal(byPath.get('#goodLabelled').containsVisibleText, true);
    assert.equal(byPath.get('#badLabelled').containsVisibleText, false);
    const candidatePaths = result.candidates.map((c) => c.path);
    assert(candidatePaths.includes('#badAria'));
    assert(candidatePaths.includes('#badLabelled'));
    assert.equal(candidatePaths.includes('#goodAria'), false);
  });
});

test('target-size probe separates adjacent undersized failures from spacing and large-target passes', async () => {
  await withPage(`
    <!doctype html>
    <style>
      .row { display:flex; gap:2px; align-items:center; margin-bottom:16px; }
      #bad, #badNeighbor { box-sizing:border-box; width:18px; height:18px; padding:0; border:1px solid #333; }
      #spaced, #far { box-sizing:border-box; width:18px; height:18px; padding:0; border:1px solid #333; }
      #far { margin-left:60px; }
      #large { box-sizing:border-box; width:32px; height:32px; padding:0; border:1px solid #333; }
    </style>
    <div class="row"><button id="bad" aria-label="Bad"></button><button id="badNeighbor" aria-label="Near"></button></div>
    <div class="row"><button id="spaced" aria-label="Spaced"></button><button id="far" aria-label="Far"></button></div>
    <button id="large" aria-label="Large"></button>
  `, async (page) => {
    const result = await probeTargetSize(page);
    const byPath = new Map(result.observations.map((c) => [c.path, c]));
    assert.equal(byPath.get('#bad').result.verdict, 'fail');
    assert.equal(byPath.get('#spaced').result.verdict, 'pass');
    assert.equal(byPath.get('#large').result.verdict, 'pass');
    const candidatePaths = result.candidates.map((c) => c.path);
    assert(candidatePaths.includes('#bad'));
    assert.equal(candidatePaths.includes('#spaced'), false);
    assert.equal(candidatePaths.includes('#large'), false);
  });
});

test('dynamic audio probe requires observed playback and duration/control evidence', async () => {
  const tone = toneWavDataUri();
  await withPage(`
    <!doctype html>
    <audio id="badAudio" autoplay src="tone.mp3"></audio>
    <audio id="playingAudio" autoplay loop data-v3-non-silent-tone="true" src="${tone}"></audio>
    <audio id="mutedAudio" autoplay loop muted data-v3-non-silent-tone="true" src="${tone}"></audio>
    <audio id="controlledAudio" autoplay loop controls data-v3-non-silent-tone="true" src="${tone}"></audio>
    <audio id="customControlledAudio" autoplay loop data-v3-non-silent-tone="true" src="${tone}"></audio>
    <button id="pauseCustom" aria-controls="customControlledAudio">Pause audio</button>
    <audio id="workingCustomAudio" autoplay loop data-v3-non-silent-tone="true" src="${tone}"></audio>
    <button id="pauseWorking" aria-controls="workingCustomAudio" onclick="document.getElementById('workingCustomAudio').pause()">Pause working audio</button>
  `, async (page) => {
    const result = await probeAudioAutoplay(page, { waitMs: 3300 });
    assert.equal(result.candidates.some((c) => c.path === '#badAudio'), true);
    assert.equal(result.candidates.some((c) => c.path === '#playingAudio'), true);
    assert.equal(result.candidates.some((c) => c.path === '#customControlledAudio'), true);
    assert.equal(result.candidates.some((c) => c.path === '#workingCustomAudio'), true);
    assert.equal(result.candidates.some((c) => c.path === '#mutedAudio'), false);
    assert.equal(result.candidates.some((c) => c.path === '#controlledAudio'), false);
    const bad = result.candidates.find((c) => c.path === '#badAudio');
    assert.equal(bad.playbackObserved, false, 'data fixture has no real audible playback; packet must not clear/fail from audibility absence');
    assert.equal(bad.autoplayOverThreeSecondsObserved, false);
    const playing = result.candidates.find((c) => c.path === '#playingAudio');
    assert.equal(playing.playbackObserved, true);
    assert.equal(playing.playbackAdvancedAcrossWindow, true);
    assert.equal(playing.durationBasisOverThreeSeconds, true);
    assert.equal(playing.noIndependentControlObserved, true);
    assert.equal(playing.audibilityObserved, true);
    assert.equal(playing.autoplayOverThreeSecondsObserved, true);
    const customControlled = result.candidates.find((c) => c.path === '#customControlledAudio');
    assert.equal(customControlled.playbackAdvancedAcrossWindow, true);
    assert.equal(customControlled.plausibleIndependentControls.length, 1);
    assert.equal(customControlled.workingIndependentControls.length, 0);
    assert.equal(customControlled.noIndependentControlObserved, true, 'inert custom controls do not count as independent controls');
    assert.equal(customControlled.autoplayOverThreeSecondsObserved, true);
    const workingCustom = result.candidates.find((c) => c.path === '#workingCustomAudio');
    assert.equal(workingCustom.playbackAdvancedAcrossWindow, true);
    assert.equal(workingCustom.plausibleIndependentControls.length, 1);
    assert.equal(workingCustom.workingIndependentControls.length, 1);
    assert.equal(workingCustom.noIndependentControlObserved, false);
    assert.equal(workingCustom.autoplayOverThreeSecondsObserved, false);
  });
});

test('dynamic flash probe samples time and separates fast infinite flash from slow blink', async () => {
  await withPage(`
    <!doctype html>
    <style>
      #fast, #slow { width:360px;height:260px;background:#c00;color:white;opacity:1; }
      #colorOnly { width:360px;height:260px;background:#c00;color:white;opacity:1; }
      #smallBlue { width:70px;height:70px;background:#06c;color:white;opacity:1; }
    </style>
    <div id="fast" data-v3-flash-target>fast flash</div>
    <div id="slow" data-v3-flash-target>slow blink</div>
    <div id="colorOnly" data-v3-flash-target>color flash</div>
    <div id="smallBlue" data-v3-flash-target>small non-red flash</div>
    <script>
      setInterval(() => { fast.style.opacity = fast.style.opacity === '0' ? '1' : '0'; }, 100);
      setInterval(() => { slow.style.opacity = slow.style.opacity === '0' ? '1' : '0'; }, 500);
      setInterval(() => { colorOnly.style.backgroundColor = colorOnly.style.backgroundColor === 'rgb(0, 0, 0)' ? 'rgb(204, 0, 0)' : 'rgb(0, 0, 0)'; }, 100);
      setInterval(() => { smallBlue.style.opacity = smallBlue.style.opacity === '0' ? '1' : '0'; }, 100);
    </script>
  `, async (page) => {
    const result = await probeFlashTemporal(page, { sampleMs: 1200, stepMs: 50 });
    const fast = result.candidates.find((c) => c.path === '#fast');
    assert(fast);
    assert.equal(fast.thresholdEvidenceObserved, true);
    assert(fast.measuredFlashRateHz > 3);
    assert.equal(fast.generatedLargeAreaThreshold, true);
    const colorOnly = result.candidates.find((c) => c.path === '#colorOnly');
    assert(colorOnly);
    assert.equal(colorOnly.thresholdEvidenceObserved, true);
    assert.equal(colorOnly.transitionBasis, 'background-luminance');
    assert(colorOnly.luminanceCrossings >= 3);
    assert.equal(result.candidates.some((c) => c.path === '#slow'), false);
    const smallBlue = result.candidates.find((c) => c.path === '#smallBlue');
    assert(smallBlue);
    assert.equal(smallBlue.thresholdEvidenceObserved, false);
    assert.equal(smallBlue.generatedLargeAreaThreshold, false);
    assert.equal(smallBlue.redThresholdRisk, false);
  });
});

test('dynamic context-change probe observes focus-triggered state changes but ignores inline help focus', async () => {
  await withPage(`
    <!doctype html>
    <input id="focusNav" onfocus="document.title='Moved';document.body.append(' moved')">
    <label for="advised">Shipping code. Focusing this field opens help below.</label>
    <input id="advised" onfocus="document.title='Shipping help';document.body.append(' shipping help')">
    <input id="hint" aria-describedby="h"><span id="h">Helpful inline hint.</span>
  `, async (page) => {
    const result = await probeContextChanges(page);
    const unadvised = result.candidates.find((c) => c.path === '#focusNav');
    const advised = result.candidates.find((c) => c.path === '#advised');
    assert.equal(!!unadvised && unadvised.after.title === 'Moved', true);
    assert.equal(unadvised.advisedBeforehand, false);
    assert.equal(!!advised && advised.after.title === 'Shipping help', true);
    assert.equal(advised.advisedBeforehand, true);
    assert.equal(result.candidates.some((c) => c.path === '#hint'), false);
  });
});

test('dynamic pointer probe observes pointerdown activation before pointerup and ignores ordinary button down', async () => {
  await withPage(`
    <!doctype html>
    <canvas id="draw" width="120" height="40" onpointerdown="window.activated=true"></canvas>
    <button id="ordinary" onclick="window.clicked=true">Ordinary click</button>
  `, async (page) => {
    const result = await probePointerActivation(page);
    const draw = result.candidates.find((c) => c.path === '#draw');
    assert.equal(!!draw && draw.afterDown.activated === true, true);
    assert.equal(draw.downEventCompletesAction, true);
    assert.equal(draw.noAbortUndoReversalOrUpEventCompletion, true);
    assert.equal(result.candidates.some((c) => c.path === '#ordinary'), false);
  });
});

test('pointer-gesture probe requires path-based functionality and rejects click, alternative, and exception cases', async () => {
  await withPage(`
    <!doctype html>
    <style>
      .gesture { width:170px;height:72px;border:2px solid #333;margin:8px;user-select:none;touch-action:none; }
    </style>
    <div id="target" class="gesture" data-v3-path-gesture-target tabindex="0">Bad path gesture</div>
    <div id="clickOk" class="gesture" data-v3-path-gesture-target tabindex="0">Click works too</div>
    <div id="altOk" class="gesture" data-v3-path-gesture-target tabindex="0">Alternative works</div>
    <div id="altWrong" class="gesture" data-v3-path-gesture-target tabindex="0">Wrong alternative</div>
    <button id="alternative" data-v3-pointer-gesture-alternative data-v3-pointer-gesture-alternative-for="altOk">Advance without gesture</button>
    <button id="wrongAlternative" data-v3-pointer-gesture-alternative data-v3-pointer-gesture-alternative-for="altWrong">Change unrelated state</button>
    <div id="essential" class="gesture" data-v3-path-gesture-target data-v3-essential-pointer-gesture="true" tabindex="0">Essential signature</div>
    <p id="status">Waiting</p>
    <script>
      function wire(id, opts = {}) {
        const el = document.getElementById(id);
        let down = false, startX = 0, maxX = 0, minY = 0, maxY = 0;
        function complete(kind) {
          window[id + 'Done'] = kind;
          if (id === 'target') window.pathGestureCompleted = true;
          document.getElementById('status').textContent = id + ':' + kind;
          el.setAttribute('data-state', 'gesture');
        }
        function start(e) { down = true; startX = e.clientX; maxX = e.clientX; minY = e.clientY; maxY = e.clientY; }
        function move(e) {
          if (!down) return;
          maxX = Math.max(maxX, e.clientX);
          minY = Math.min(minY, e.clientY);
          maxY = Math.max(maxY, e.clientY);
          if ((maxX - startX) > 50 && (maxY - minY) > 20) complete('gesture');
        }
        function end() { down = false; }
        el.addEventListener('pointerdown', start);
        el.addEventListener('pointermove', move);
        el.addEventListener('pointerup', end);
        el.addEventListener('mousedown', start);
        el.addEventListener('mousemove', move);
        el.addEventListener('mouseup', end);
        if (opts.click) el.addEventListener('click', () => {
          window.clickCompleted = true;
          complete('click');
          el.setAttribute('data-state', 'gesture');
        });
      }
      wire('target');
      wire('clickOk', { click: true });
      wire('altOk');
      wire('altWrong');
      wire('essential');
      document.getElementById('alternative').addEventListener('click', () => {
        window.alternativeCompleted = true;
        document.getElementById('altOk').setAttribute('data-state', 'gesture');
        document.getElementById('status').textContent = 'alternative completed';
      });
      document.getElementById('wrongAlternative').addEventListener('click', () => {
        window.alternativeCompleted = true;
        document.getElementById('altWrong').setAttribute('data-state', 'unrelated');
        document.getElementById('status').textContent = 'wrong alternative completed';
      });
    </script>
  `, async (page) => {
    const result = await probePointerGestures(page);
    const byPath = new Map(result.traces.map((c) => [c.path, c]));
    assert.equal(byPath.get('#target').pathGestureChanged, true);
    assert.equal(byPath.get('#target').clickChanged, false);
    assert.equal(byPath.get('#clickOk').clickEquivalent, true);
    assert.equal(byPath.get('#altOk').workingAlternative, true);
    assert.equal(byPath.get('#altWrong').workingAlternative, false);
    assert.equal(byPath.get('#essential').essential, true);
    const candidatePaths = result.candidates.map((c) => c.path);
    assert(candidatePaths.includes('#target'));
    assert(candidatePaths.includes('#altWrong'));
    assert.equal(candidatePaths.includes('#clickOk'), false);
    assert.equal(candidatePaths.includes('#altOk'), false);
    assert.equal(candidatePaths.includes('#essential'), false);
  });
});

test('dragging-movement probe requires drag-only functionality and rejects click, alternative, and exception cases', async () => {
  await withPage(`
    <!doctype html>
    <style>
      .drag { width:140px;height:54px;border:2px solid #333;margin:8px;user-select:none;touch-action:none; }
    </style>
    <div id="target" class="drag" data-v3-drag-target tabindex="0">Bad drag-only</div>
    <div id="clickOk" class="drag" data-v3-drag-target tabindex="0">Click works too</div>
    <div id="altOk" class="drag" data-v3-drag-target tabindex="0">Alternative works</div>
    <div id="altWrong" class="drag" data-v3-drag-target tabindex="0">Alternative changes wrong state</div>
    <button id="alternative" data-v3-drag-alternative data-v3-drag-alternative-for="altOk">Move without drag</button>
    <button id="wrongAlternative" data-v3-drag-alternative data-v3-drag-alternative-for="altWrong">Change unrelated state</button>
    <div id="essential" class="drag" data-v3-drag-target data-v3-essential-drag="true" tabindex="0">Essential drag</div>
    <p id="status">Waiting</p>
    <script>
      function wire(id, opts = {}) {
        const el = document.getElementById(id);
        let down = false, startX = 0;
        function complete(kind) {
          window[id + 'Done'] = kind;
          if (id === 'target') window.dragCompleted = true;
          document.getElementById('status').textContent = id + ':' + kind;
          el.setAttribute('data-state', kind);
        }
        function start(e) { down = true; startX = e.clientX; }
        function move(e) { if (down && Math.abs(e.clientX - startX) > 40) complete('drag'); }
        function end() { down = false; }
        el.addEventListener('pointerdown', start);
        el.addEventListener('pointermove', move);
        el.addEventListener('pointerup', end);
        el.addEventListener('mousedown', start);
        el.addEventListener('mousemove', move);
        el.addEventListener('mouseup', end);
        if (opts.click) el.addEventListener('click', () => {
          window.clickCompleted = true;
          complete('click');
          el.setAttribute('data-state', 'drag');
        });
      }
      wire('target');
      wire('clickOk', { click: true });
      wire('altOk');
      wire('altWrong');
      wire('essential');
      document.getElementById('alternative').addEventListener('click', () => {
        window.alternativeCompleted = true;
        document.getElementById('altOk').setAttribute('data-state', 'alternative');
        document.getElementById('altOk').setAttribute('data-state', 'drag');
        document.getElementById('status').textContent = 'alternative completed';
      });
      document.getElementById('wrongAlternative').addEventListener('click', () => {
        window.alternativeCompleted = true;
        document.getElementById('altWrong').setAttribute('data-state', 'unrelated');
        document.getElementById('status').textContent = 'wrong alternative completed';
      });
    </script>
  `, async (page) => {
    const result = await probeDraggingMovements(page);
    const byPath = new Map(result.traces.map((c) => [c.path, c]));
    assert.equal(byPath.get('#target').dragChanged, true);
    assert.equal(byPath.get('#target').clickChanged, false);
    assert.equal(byPath.get('#clickOk').clickChanged, true);
    assert.equal(byPath.get('#clickOk').clickEquivalent, true);
    assert.equal(byPath.get('#altOk').workingAlternative, true);
    assert.equal(byPath.get('#altWrong').workingAlternative, false);
    assert.equal(byPath.get('#essential').essential, true);
    const candidatePaths = result.candidates.map((c) => c.path);
    assert(candidatePaths.includes('#target'));
    assert(candidatePaths.includes('#altWrong'));
    assert.equal(candidatePaths.includes('#clickOk'), false);
    assert.equal(candidatePaths.includes('#altOk'), false);
    assert.equal(candidatePaths.includes('#essential'), false);
  });
});

test('reveal-state probe discovers trusted newly visible states and ignores no-op expansion labels', async () => {
  await withPage(`
    <!doctype html>
    <button id="target" data-v3-reveal-trigger aria-expanded="false" aria-controls="panel">Show panel</button>
    <section id="panel" hidden><h2>Hidden account details</h2><a href="#details">Review details</a></section>
    <button id="noop" data-v3-reveal-trigger aria-expanded="false" aria-controls="missing">No-op reveal</button>
    <script>
      target.addEventListener('click', () => {
        target.setAttribute('aria-expanded', 'true');
        panel.hidden = false;
      });
      noop.addEventListener('click', () => {
        noop.setAttribute('aria-expanded', 'true');
      });
    </script>
  `, async (page) => {
    const result = await probeRevealStates(page);
    const target = result.candidates.find((c) => c.path === '#target');
    assert(target);
    assert.equal(target.afterState.ariaExpanded, 'true');
    assert(target.newInteresting.some((x) => /Hidden account details/.test(x.text)));
    assert.equal(result.candidates.some((c) => c.path === '#noop'), false);
  });
});

test('reveal-state probe keeps repeated controls distinct and surfaces implicit adjacent reveals as discovery-only', async () => {
  await withPage(`
    <!doctype html>
    <button data-v3-reveal-trigger>First unlabeled</button>
    <button data-reveal>Second unlabeled</button>
    <section id="adjacent" hidden><h2>Adjacent reveal details</h2><button>Continue</button></section>
    <script>
      document.querySelectorAll('button')[0].addEventListener('click', () => {});
      document.querySelectorAll('button')[1].addEventListener('click', () => {
        adjacent.hidden = false;
      });
    </script>
  `, async (page) => {
    const result = await probeRevealStates(page);
    assert.equal(result.candidates.length, 1);
    const candidate = result.candidates[0];
    assert.match(candidate.path, /button:nth-of-type\(2\)$/);
    assert.equal(candidate.explicitProgrammaticStateReached, false);
    assert.equal(candidate.implicitVisualStateReached, true);
    assert(candidate.newInteresting.some((x) => /Adjacent reveal details/.test(x.text)));
  });
});

test('visual-structure probe discovers rendered non-semantic headings, lists, and grids without flagging semantic equivalents', async () => {
  await withPage(`
    <!doctype html>
    <style>
      #fakeHeading{font-size:26px;font-weight:700;margin:12px 0}
      #fakeList>div{margin:4px 0}
      #fakeGrid{display:grid;grid-template-columns:repeat(2, 90px);gap:1px}
      #fakeGrid>div{border:1px solid #777;padding:4px}
    </style>
    <h1>Structure test</h1>
    <div id="fakeHeading">Billing Details</div>
    <p>Content under the visual heading.</p>
    <div id="fakeList"><div>• Alpha</div><div>• Beta</div><div>• Gamma</div></div>
    <div id="fakeGrid" data-v3-visual-table="true"><div>Plan</div><div>Cost</div><div>Basic</div><div>$10</div><div>Pro</div><div>$20</div></div>
    <h2 id="realHeading">Semantic Details</h2>
    <ul id="realList"><li>Alpha</li><li>Beta</li><li>Gamma</li></ul>
    <table id="realTable"><tr><th>Plan</th><th>Cost</th></tr><tr><td>Basic</td><td>$10</td></tr></table>
    <button id="bigButton" style="font-size:26px;font-weight:700">Open Settings</button>
  `, async (page) => {
    const result = await probeVisualStructureDiscovery(page);
    const paths = result.candidates.map((c) => c.path);
    assert(paths.includes('#fakeHeading'));
    assert(paths.includes('#fakeList'));
    assert(paths.includes('#fakeGrid'));
    assert(!paths.includes('#realHeading'));
    assert(!paths.includes('#realList'));
    assert(!paths.includes('#realTable'));
    assert(!paths.includes('#bigButton'));
  });
});

test('visual-content probe discovers non-DOM visual content and ignores alternatives or decorative surfaces', async () => {
  await withPage(`
    <!doctype html>
    <style>
      #bgMissing{width:160px;height:64px;background:linear-gradient(135deg,#ffd,#fc9);color:transparent;position:relative}
      #bgMissing::before{content:'SALE';position:absolute;left:24px;top:18px;color:#111;font:bold 24px Arial}
      #bgAlt{width:160px;height:64px;background:linear-gradient(135deg,#ffd,#fc9)}
    </style>
    <h1>Visual content test</h1>
    <div id="bgMissing" data-v3-visual-content="background-image-text" data-v3-bg-image-text="true">SALE</div>
    <canvas id="canvasMissing" width="160" height="80" data-v3-visual-content="canvas-chart"></canvas>
    <svg id="svgDeclared" width="160" height="80" data-v3-visual-content="svg-chart" role="img" aria-label="Revenue chart"><rect x="10" y="20" width="40" height="50"/></svg>
    <svg id="svgAlt" width="160" height="80" data-v3-visual-content="svg-chart" data-v3-visual-alternative-adequate="true" role="img" aria-label="Revenue chart with Q2 highest"><rect x="10" y="20" width="40" height="50"/></svg>
    <div id="colorCue" data-v3-visual-content="color-only-information" data-v3-color-only="true" data-v3-has-noncolor-cue="true"><span style="display:inline-block;width:16px;height:16px;background:#c00"></span> Error <strong>Error</strong></div>
    <div id="decorative" data-v3-visual-content="decorative-background" data-v3-decorative="true" aria-hidden="true" style="width:160px;height:64px;background:#ddd"></div>
    <script>
      const c = document.getElementById('canvasMissing');
      const x = c.getContext('2d');
      x.fillStyle = '#c00'; x.fillRect(20, 40, 30, 30);
      x.fillStyle = '#070'; x.fillRect(70, 10, 30, 60);
    </script>
  `, async (page) => {
    const result = await probeVisualContentDiscovery(page);
    const paths = result.candidates.map((c) => c.path);
    assert(paths.includes('#bgMissing'));
    assert(paths.includes('#canvasMissing'));
    assert(paths.includes('#svgDeclared'));
    assert(!paths.includes('#svgAlt'));
    assert(!paths.includes('#colorCue'));
    assert(!paths.includes('#decorative'));
  });
});

test('dynamic character shortcut probe requires trusted single-character activation and no exceptions', async () => {
  await withPage(`
    <!doctype html>
    <button id="target" data-shortcut-key="x" aria-keyshortcuts="x">Archive</button>
    <button id="off" onclick="window.shortcutsDisabled = true; document.getElementById('status').textContent = 'Shortcuts disabled'">Turn off shortcuts</button>
    <button id="scoped" data-shortcut-key="y" data-shortcut-scope="focus" aria-keyshortcuts="y">Focused shortcut</button>
    <p id="status">Waiting</p>
    <script>
      document.addEventListener('keydown', (e) => {
        if (e.key === 'x' && !e.ctrlKey && !e.altKey && !e.metaKey && !window.shortcutsDisabled) {
          window.shortcutActivationCount = (window.shortcutActivationCount || 0) + 1;
          window.shortcutActivated = true;
          document.body.setAttribute('data-shortcut-activated', 'true');
          document.getElementById('target').setAttribute('data-activated', 'true');
          document.getElementById('status').textContent = 'Archive shortcut activated ' + window.shortcutActivationCount;
        }
      });
      document.getElementById('scoped').addEventListener('keydown', (e) => {
        if (e.key === 'y') {
          window.shortcutActivationCount = (window.shortcutActivationCount || 0) + 1;
          document.getElementById('scoped').setAttribute('data-activated', 'true');
          document.getElementById('status').textContent = 'Focused shortcut activated ' + window.shortcutActivationCount;
        }
      });
    </script>
  `, async (page) => {
    const result = await probeCharacterShortcuts(page);
    assert.equal(result.targets.some((c) => c.path === '#target'), true);
    assert.equal(result.candidates.some((c) => c.path === '#target'), false, 'working off/remap control exception prevents barrier candidate');
    const target = result.observations.find((x) => x.path === '#target');
    assert.equal(target.workingControls.length, 1);
    const scoped = result.observations.find((x) => x.path === '#scoped');
    assert.equal(scoped.bodyActivation.changed, false);
    assert.equal(scoped.focusedActivation.changed, true);
  });

  await withPage(`
    <!doctype html>
    <button id="target" data-shortcut-key="x" aria-keyshortcuts="x">Archive</button>
    <button id="off">Turn off shortcuts</button>
    <p id="status">Waiting</p>
    <script>
      document.addEventListener('keydown', (e) => {
        if (e.key === 'x' && !e.ctrlKey && !e.altKey && !e.metaKey) {
          window.shortcutActivationCount = (window.shortcutActivationCount || 0) + 1;
          window.shortcutActivated = true;
          document.body.setAttribute('data-shortcut-activated', 'true');
          document.getElementById('target').setAttribute('data-activated', 'true');
          document.getElementById('status').textContent = 'Archive shortcut activated ' + window.shortcutActivationCount;
        }
      });
    </script>
  `, async (page) => {
    const result = await probeCharacterShortcuts(page);
    const c = result.candidates.find((x) => x.path === '#target');
    assert(c, 'inert off/remap control must not suppress the barrier candidate');
    assert.equal(c.workingControls.length, 0);
  });

  await withPage(`
    <!doctype html>
    <button id="target" data-shortcut-key="x" aria-keyshortcuts="x">Archive</button>
    <p id="status">Waiting</p>
    <script>
      document.addEventListener('keydown', (e) => {
        if (e.key === 'x' && !e.ctrlKey && !e.altKey && !e.metaKey) {
          window.shortcutActivationCount = (window.shortcutActivationCount || 0) + 1;
          window.shortcutActivated = true;
          document.body.setAttribute('data-shortcut-activated', 'true');
          document.getElementById('target').setAttribute('data-activated', 'true');
          document.getElementById('status').textContent = 'Archive shortcut activated ' + window.shortcutActivationCount;
        }
      });
    </script>
  `, async (page) => {
    const result = await probeCharacterShortcuts(page);
    const c = result.candidates.find((x) => x.path === '#target');
    assert(c);
    assert.equal(c.noOffRemapOrFocusScopeException, true);
    assert.equal(c.key, 'x');
  });

  await withPage(`
    <!doctype html>
    <button id="target" data-shortcut-key="z" aria-keyshortcuts="z">Archive</button>
    <section id="activity">No activity yet</section>
    <script>
      document.addEventListener('keydown', (e) => {
        if (e.key === 'z' && !e.ctrlKey && !e.altKey && !e.metaKey) {
          document.getElementById('activity').textContent = 'Activity changed outside the legacy status oracle';
        }
      });
    </script>
  `, async (page) => {
    const result = await probeCharacterShortcuts(page);
    assert(result.candidates.some((x) => x.path === '#target'), 'DOM signature catches state changes outside #status/#target globals');
  });

  await withPage(`
    <!doctype html>
    <button id="off" onclick="window.remapped = true; document.getElementById('target').setAttribute('aria-keyshortcuts', 'Control+x'); document.getElementById('status').textContent = 'Shortcut remapped'">Remap shortcut</button>
    <button id="target" data-shortcut-key="x" aria-keyshortcuts="x">Archive</button>
    <p id="status">Waiting</p>
    <script>
      document.addEventListener('keydown', (e) => {
        if (e.key === 'x' && (!window.remapped || e.ctrlKey)) {
          window.shortcutActivationCount = (window.shortcutActivationCount || 0) + 1;
          document.getElementById('target').setAttribute('data-activated', 'true');
          document.getElementById('status').textContent = 'Archive shortcut activated ' + window.shortcutActivationCount;
        }
      });
    </script>
  `, async (page) => {
    const result = await probeCharacterShortcuts(page);
    assert.equal(result.candidates.some((x) => x.path === '#target'), false, 'working remap control suppresses the barrier candidate');
    const target = result.observations.find((x) => x.path === '#target');
    assert.equal(target.workingControls.length, 1);
    assert.match(target.workingControls[0].text, /remap/i);
  });
});

test('media inventory surfaces mechanical alternative signals without judging quality', async () => {
  await withPage(`
    <!doctype html>
    <figure>
      <video id="videoNoCaptions" controls src="movie.mp4"></video>
      <a href="transcript.html">Transcript</a>
    </figure>
    <video id="videoBadTrack" controls><track kind="captions" src=""></video>
    <video id="videoWithTracks" controls>
      <track kind="captions" src="captions.vtt" srclang="en" default>
      <track kind="descriptions" src="descriptions.vtt" srclang="en">
    </video>
    <audio id="audioNoTrack" controls src="podcast.mp3"></audio>
  `, async (page) => {
    const result = await collectMediaAlternativeInventory(page);
    const byPath = new Map(result.media.map((m) => [m.path, m]));
    assert(byPath.get('#videoNoCaptions').warnings.includes('video-caption-track-missing'));
    assert.equal(byPath.get('#videoNoCaptions').nearbyTranscript.length, 1);
    assert.equal(byPath.get('#videoBadTrack').nearbyTranscript.length, 0);
    assert(byPath.get('#videoBadTrack').warnings.includes('track-src-empty'));
    assert.deepEqual(byPath.get('#videoWithTracks').warnings, []);
    assert(byPath.get('#audioNoTrack').warnings.includes('no-track-or-nearby-transcript-signal'));
  });
});

test('media inventory uses fixture content model to scope WCAG 1.2.x adequacy checks', async () => {
  const meta = (id, data) => `<script id="${id}" type="application/json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
  await withPage(`
    <!doctype html>
    <video id="captionBad" controls data-v3-media-meta="captionBadMeta"><track kind="captions" src="captions.vtt"></video>
    <video id="captionGood" controls data-v3-media-meta="captionGoodMeta"><track kind="captions" src="captions.vtt"></video>
    <video id="descBad" controls data-v3-media-meta="descBadMeta"><track kind="descriptions" src="desc.vtt"></video>
    <video id="descGood" controls data-v3-media-meta="descGoodMeta"><track kind="descriptions" src="desc.vtt"></video>
    <audio id="audioBad" controls data-v3-media-meta="audioBadMeta"></audio>
    <audio id="audioGood" controls data-v3-media-meta="audioGoodMeta"></audio><a href="transcript.html">Transcript</a>
    ${meta('captionBadMeta', { sc: '1.2.2', mediaType: 'synchronized-video', audioContent: 'alarm sounds evacuation starts', captionText: 'evacuation starts', visualContent: 'speaker at podium' })}
    ${meta('captionGoodMeta', { sc: '1.2.2', mediaType: 'synchronized-video', audioContent: 'alarm sounds evacuation starts', captionText: 'alarm sounds evacuation starts', visualContent: 'speaker at podium' })}
    ${meta('descBadMeta', { sc: '1.2.5', mediaType: 'synchronized-video', audioContent: 'music plays', visualContent: 'onscreen text warning do not drive', descriptionText: 'music plays' })}
    ${meta('descGoodMeta', { sc: '1.2.5', mediaType: 'synchronized-video', audioContent: 'music plays', visualContent: 'onscreen text warning do not drive', descriptionText: 'onscreen text warning do not drive' })}
    ${meta('audioBadMeta', { sc: '1.2.1', mediaType: 'audio-only', audioContent: 'mayor announces library opens monday', transcriptText: '' })}
    ${meta('audioGoodMeta', { sc: '1.2.1', mediaType: 'audio-only', audioContent: 'mayor announces library opens monday', transcriptText: 'mayor announces library opens monday' })}
  `, async (page) => {
    const result = await collectMediaAlternativeInventory(page);
    const byPath = new Map(result.media.map((m) => [m.path, m]));
    assert(byPath.get('#captionBad').warnings.includes('caption-content-inadequate'));
    assert(!byPath.get('#captionGood').warnings.includes('caption-content-inadequate'));
    assert(!byPath.get('#captionGood').warnings.includes('video-description-or-media-alternative-missing'));
    assert(byPath.get('#descBad').warnings.includes('visual-alternative-inadequate'));
    assert(!byPath.get('#descGood').warnings.includes('visual-alternative-inadequate'));
    assert(!byPath.get('#descGood').warnings.includes('video-caption-track-missing'));
    assert(byPath.get('#audioBad').warnings.includes('audio-transcript-missing'));
    assert(!byPath.get('#audioGood').warnings.includes('audio-transcript-inadequate'));
  });
});

test('media inventory does not let transcript text satisfy scoped 1.2.2 captions', async () => {
  const meta = (id, data) => `<script id="${id}" type="application/json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
  await withPage(`
    <!doctype html>
    <figure>
      <video id="captionTrackTranscriptOnly" controls data-v3-media-meta="captionMeta">
        <track kind="captions" src="captions.vtt">
      </video>
      <div data-v3-transcript>Transcript: alarm sounds evacuation starts.</div>
    </figure>
    ${meta('captionMeta', {
      sc: '1.2.2',
      mediaType: 'synchronized-video',
      audioContent: 'alarm sounds evacuation starts',
      captionText: '',
      visualContent: 'speaker at podium',
    })}
  `, async (page) => {
    const result = await collectMediaAlternativeInventory(page);
    const media = result.media.find((m) => m.path === '#captionTrackTranscriptOnly');
    assert(media);
    assert.equal(media.nearbyTranscript.length, 1);
    assert(media.warnings.includes('caption-content-inadequate'));
  });
});

test('live broad-scope media packets preserve SC, structural evidence, and media details', async () => {
  const meta = (id, data) => `<script id="${id}" type="application/json">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;
  const html = `
    <!doctype html>
    <video id="audioDescriptionBad" controls data-v3-media-meta="descBadMeta">
      <track kind="descriptions" src="desc.vtt">
    </video>
    ${meta('descBadMeta', {
      sc: '1.2.5',
      mediaType: 'synchronized-video',
      audioContent: 'music plays',
      visualContent: 'onscreen text warning do not drive',
      descriptionText: 'music plays',
    })}
  `;
  const browser = await puppeteer.launch({
    headless: 'new',
    executablePath: CHROME,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--autoplay-policy=no-user-gesture-required'],
  });
  try {
    const artifact = await runBroadScopeForUrl(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`, {
      browser,
      file: 'media-live.html',
      runId: 'media-live',
      pageDigest: 'sha256:media-live',
    });
    assert.equal(artifact.ran, true, artifact.error || '');
    const finding = artifact.findings.find((f) => f.detector === 'media-alternative-inventory' && f.xpath === '#audioDescriptionBad');
    assert(finding);
    assert.equal(finding.sc, '1.2.5');
    assert(finding.evidenceClaims.includes('owned-media-element'));
    assert(finding.evidenceClaims.includes('media-content-model-observed'));
    assert(finding.evidenceClaims.includes('alternative-missing-or-inadequate-observed'));
    assert.equal(finding.evidenceDetails.media[0].fixtureMeta.visualContent, 'onscreen text warning do not drive');

    const packet = artifact.reviewPackets.find((p) => p.aspect === 'media-alternative-inventory' && p.targetXpath === '#audioDescriptionBad');
    assert(packet);
    assert.equal(packet.sc, '1.2.5');
    assert.deepEqual(structuralEvidenceStatus(packet).missing, []);
    assert.equal(packet.observed.evidenceDetails.media[0].adequacy.description.covered, false);
  } finally {
    await browser.close();
  }
});

test('authentication and redundant-entry inventory nominates auth, captcha, paste-blocking, timeout, and duplicate fields', async () => {
  await withPage(`
    <!doctype html>
    <form>
      <label>Password <input id="pw" type="password" autocomplete="current-password" onpaste="return false"></label>
      <label>Verification code <input id="otp" name="otp_code" autocomplete="one-time-code"></label>
      <label>Postal code <input id="postal" name="postal_code" autocomplete="postal-code"></label>
      <label>Email <input id="email1" name="email" autocomplete="email"></label>
      <label>Confirm email <input id="email2" name="email" autocomplete="email"></label>
      <div id="captcha" class="captcha-box" data-sitekey="abc">captcha</div>
      <div id="countdown" role="timer" aria-live="polite">05:00</div>
    </form>
  `, async (page) => {
    const result = await collectAuthenticationAndEntryCandidates(page);
    const families = result.candidates.map((c) => c.family);
    assert(families.includes('accessible-authentication'));
    assert(!result.candidates.some((c) => c.family === 'accessible-authentication' && c.path === '#postal'));
    assert(families.includes('paste-blocking'));
    assert(families.includes('captcha-authentication'));
    assert(families.includes('timeout-risk'));
    assert(families.includes('redundant-entry-review'));
  });
});

test('cognitive research candidates flag only triage evidence, not conformance claims', () => {
  const text = 'NASA and HTML are acronyms. This sentence is intentionally very long and contains many words because the probe should nominate it as a readability review candidate without pretending that sentence length alone is a WCAG failure or a reliable cognitive accessibility judgment.';
  const result = collectCognitiveCandidatesFromText(text, { longSentenceWords: 25 });
  assert.equal(result.kind, 'cognitive-research-candidates');
  assert.equal(result.candidates.some((c) => c.family === 'plain-language-research'), true);
  assert.equal(result.candidates.some((c) => c.family === 'abbreviation-research'), true);
});

test('build: broadScope sidecar surfaces warnings/findings/visual checks without changing authoritative claims', () => {
  const without = buildV3(baseBundle());
  const bundle = baseBundle();
  bundle.broadScope = {
    file: 'p', runId: 'R', pageDigest: 'sha256:d', ran: true,
    scopeWarnings: ['viewport-zoom-restricted', 'cross-origin-frame-untested'],
    visualChecks: [{ id: 'vis1', detector: 'text-spacing', xpath: '#fragile', agreement: true, note: 'overflow agrees with visual crop' }],
    findings: [
      { detector: 'text-spacing', sc: '1.4.12', kind: 'text-spacing', xpath: '#fragile', detail: 'text clipped after spacing', visualRef: 'vis1' },
      { detector: 'character-shortcut', sc: '2.1.4', kind: 'character-shortcut', xpath: '#shortcut', detail: 'single-character shortcut candidate' },
    ],
    reviewPackets: [
      { packetId: 'pkt1', aspect: 'text-spacing', sc: '1.4.12', targetXpath: '#fragile', mode: 'hybrid-visual', evidenceRefs: ['broadScope.findings[0]', 'vis1'] },
      { packetId: 'pkt2', aspect: 'character-shortcut', sc: '2.1.4', rawSc: '2.1.4', relatedScs: ['2.1.4'], targetXpath: '#shortcut', mode: 'hybrid-keyboard', evidenceRefs: ['broadScope.findings[1]'] },
    ],
  };
  const r = buildV3(bundle);
  assert.equal(r.ok, true, JSON.stringify(r.errors));
  assert.equal(r.results.summary.authoritative, without.results.summary.authoritative);
  assert.equal(r.results.broadScopeFindings.length, 2);
  assert.equal(r.results.broadScopeWarnings.length, 2);
  assert.equal(r.results.broadScopeVisualChecks.length, 1);
  assert.equal(r.results.broadScopeFindings[0].detail, 'text-spacing:text-spacing');
  assert.equal(r.results.broadScopeVisualChecks[0].note, 'redacted-see-evidence-bundle');
  assert.equal(JSON.stringify(r.results).includes('text clipped after spacing'), false);
  assert.equal(JSON.stringify(r.results).includes('overflow agrees with visual crop'), false);
  assert.equal(r.results.broadScopeReviewPackets.length, 2);
  assert.deepEqual(r.results.broadScopeReviewPackets.find((p) => p.packetId === 'pkt2').relatedScs, ['2.1.4']);
  assert.equal(r.results.broadScopeReviewPackets.find((p) => p.packetId === 'pkt2').rawSc, '2.1.4');
  assert.equal(r.results.summary.broadScopeReviewPackets, 2);
  assert.equal(r.results.summary.triageCandidates >= 2, true);
  assert.equal(r.results.summary.evidenceMode.runBroadScope, true);
});

test('cross-artifact: broadScope is identity-bound like other side artifacts', () => {
  const bundle = baseBundle();
  bundle.broadScope = { file: 'other', runId: 'R', pageDigest: 'sha256:d', ran: true, findings: [], scopeWarnings: [], visualChecks: [] };
  const errs = crossArtifactErrors(bundle);
  assert(errs.some((e) => /broadScope\.file/.test(e)), 'wrong-page broadScope artifact is refused');
});

test('orchestrate(runBroadScope): broad-scope artifact is produced and consumed end-to-end', async () => {
  const html = `
    <!doctype html>
    <meta name="viewport" content="width=device-width, maximum-scale=1">
    <style>
      #fragile { font:16px Arial; width:139px; height:24px; overflow:hidden; white-space:nowrap; }
      #resize { font-size:1rem; line-height:1.2; width:260px; height:24px; overflow:hidden; white-space:nowrap; }
      @keyframes spin { from { transform: rotate(0); } to { transform: rotate(360deg); } }
      @keyframes flashFast { from { opacity: 0; } to { opacity: 1; } }
      #motion { animation: spin 10s linear infinite; }
      #flash { animation: flashFast .2s steps(1,end) infinite; }
      #gestureOnly { width:170px;height:72px;border:2px solid #333;user-select:none;touch-action:none; }
      #dragOnly { width:140px;height:54px;border:2px solid #333;user-select:none;touch-action:none; }
      #forced { color:#111; background:#fff; border:2px solid #111; }
      @media (forced-colors: active) {
        #forced { forced-color-adjust:none; color:#777; background:#777; border-color:#777; }
      }
      .tinyTargets { display:flex; gap:2px; margin-top:8px; }
      #tinyTarget,#tinyNeighbor{ box-sizing:border-box; width:18px; height:18px; padding:0; border:1px solid #333; }
    </style>
    <div id="fragile">Spacing sensitive</div>
    <div id="resize">Resize sensitive button label</div>
    <div id="motion">Persistent motion</div>
    <div id="flash">Flash risk</div>
    <button id="forced">Forced color opt-out</button>
    <a href="#">Before trap</a>
    <div id="trapRegion" role="dialog" aria-label="Keyboard trap fixture">
      <button id="trapFirst">Trap first</button>
      <button id="trapLast">Trap last</button>
    </div>
    <a href="#">After trap</a>
    <input id="focusNav" onfocus="document.title='Moved';document.body.append(' moved')">
    <canvas id="draw" width="120" height="40" onpointerdown="window.activated=true"></canvas>
    <div id="gestureOnly" data-v3-path-gesture-target tabindex="0">Path gesture only</div>
    <div id="dragOnly" data-v3-drag-target tabindex="0">Drag only</div>
    <audio id="badAudio" autoplay src="tone.mp3"></audio>
    <button id="shortcut" data-shortcut-key="x" aria-keyshortcuts="x">Save</button>
    <p id="shortcutStatus">Shortcut waiting</p>
    <button id="statusTrigger" data-v3-status-trigger>Status action</button>
    <p id="status" data-v3-status-message></p>
    <button id="labelMismatch" aria-label="Submit order">Pay now</button>
    <div class="tinyTargets"><button id="tinyTarget" aria-label="Tiny target"></button><button id="tinyNeighbor" aria-label="Tiny neighbor"></button></div>
    <form data-v3-redundant-entry="true" data-v3-same-process="true" data-v3-previously-provided="true" data-v3-required-reentry="true" data-v3-no-reuse-exception="true" data-v3-redundant-key="email">
      <label>Previous email <input id="redundantEmail1" name="email" autocomplete="email"></label>
      <label>Enter email again <input id="redundantEmail2" name="email" autocomplete="off" required></label>
    </form>
    <p id="longText">This sentence is intentionally very long and contains many connected clauses because the broad scope readability research path should nominate it as a sidecar review surface without turning it into a conformance claim.</p>
    <script>
      document.getElementById('statusTrigger').addEventListener('click', () => {
        document.getElementById('status').textContent = 'Saved successfully';
      });
      document.getElementById('trapRegion').addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;
        if (e.shiftKey && document.activeElement === document.getElementById('trapFirst')) {
          e.preventDefault();
          document.getElementById('trapLast').focus();
        } else if (!e.shiftKey && document.activeElement === document.getElementById('trapLast')) {
          e.preventDefault();
          document.getElementById('trapFirst').focus();
        }
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'x' && !e.ctrlKey && !e.altKey && !e.metaKey) {
          window.shortcutActivated = true;
          document.body.setAttribute('data-shortcut-activated', 'true');
          document.getElementById('shortcut').setAttribute('data-activated', 'true');
          document.getElementById('shortcutStatus').textContent = 'Shortcut activated';
        }
      });
      {
        const el = document.getElementById('gestureOnly');
        let down = false, startX = 0, maxX = 0, minY = 0, maxY = 0;
        const start = (e) => { down = true; startX = e.clientX; maxX = e.clientX; minY = e.clientY; maxY = e.clientY; };
        const move = (e) => {
          if (!down) return;
          maxX = Math.max(maxX, e.clientX);
          minY = Math.min(minY, e.clientY);
          maxY = Math.max(maxY, e.clientY);
          if ((maxX - startX) > 50 && (maxY - minY) > 20) {
            window.pathGestureCompleted = true;
            document.body.setAttribute('data-path-gesture-completed', 'true');
            el.setAttribute('data-state', 'advanced');
          }
        };
        const end = () => { down = false; };
        el.addEventListener('pointerdown', start);
        el.addEventListener('pointermove', move);
        el.addEventListener('pointerup', end);
        el.addEventListener('mousedown', start);
        el.addEventListener('mousemove', move);
        el.addEventListener('mouseup', end);
      }
      {
        const el = document.getElementById('dragOnly');
        let down = false, startX = 0;
        const start = (e) => { down = true; startX = e.clientX; };
        const move = (e) => {
          if (down && Math.abs(e.clientX - startX) > 40) {
            window.dragCompleted = true;
            document.body.setAttribute('data-drag-completed', 'true');
            el.setAttribute('data-state', 'moved');
          }
        };
        const end = () => { down = false; };
        el.addEventListener('pointerdown', start);
        el.addEventListener('pointermove', move);
        el.addEventListener('pointerup', end);
        el.addEventListener('mousedown', start);
        el.addEventListener('mousemove', move);
        el.addEventListener('mouseup', end);
      }
    </script>
  `;
  const url = `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
  const collect = {
    file: 'broad.html',
    runId: 'R',
    pageDigest: 'sha256:broad',
    collectedAt: 1000,
    elements: [{ xpath: '#motion', tag: 'div', autoMotion: true }],
  };
  const { built, bundle } = await orchestrate(collect, { elements: [] }, {
    resolveUrl: () => url,
    now: 2000,
    runBroadScope: true,
    runBroadScopeJudge: async (_messages, packet) => ({
      verdict: packet.aspect === 'reduced-motion' ? 'LIKELY_BARRIER' : 'UNCERTAIN',
      confidence: 'high',
      evidenceRefs: packet.evidenceRefs || [],
      summary: `broad-scope injected review for ${packet.aspect}`,
      reasoning: packet.aspect === 'reduced-motion' ? 'motion packet contains positive persistence and missing-control evidence' : 'not the targeted integration packet',
    }),
    runBroadScopeCritic: async () => ({ response: 'AGREE', reason: 'integration test accepts the injected scoped verdict' }),
  });
  assert.equal(built.ok, true, JSON.stringify(built.errors));
  assert.equal(bundle.broadScope.ran, true);
  assert(built.results.broadScopeWarnings.includes('viewport-zoom-restricted'));
  assert(built.results.broadScopeFindings.some((f) => f.detector === 'text-spacing'));
  assert(built.results.broadScopeFindings.some((f) => f.detector === 'resize-text'));
  assert(built.results.broadScopeFindings.some((f) => f.detector === 'reduced-motion'));
  assert(built.results.broadScopeFindings.some((f) => f.detector === 'forced-colors'));
  assert(built.results.broadScopeFindings.some((f) => f.detector === 'character-shortcut'));
  assert(built.results.broadScopeFindings.some((f) => f.detector === 'audio-control-dynamic'));
  assert(built.results.broadScopeFindings.some((f) => f.detector === 'flash-temporal'));
  assert(built.results.broadScopeFindings.some((f) => f.detector === 'keyboard-trap'));
  assert(built.results.broadScopeFindings.some((f) => f.detector === 'context-change-dynamic'));
  assert(built.results.broadScopeFindings.some((f) => f.detector === 'pointer-activation-dynamic'));
  assert(built.results.broadScopeFindings.some((f) => f.detector === 'pointer-gesture'));
  assert(built.results.broadScopeFindings.some((f) => f.detector === 'dragging-movement'));
  assert(built.results.broadScopeFindings.some((f) => f.detector === 'character-shortcut-dynamic'));
  assert(built.results.broadScopeFindings.some((f) => f.detector === 'status-announcement-dynamic'));
  assert(built.results.broadScopeFindings.some((f) => f.detector === 'label-in-name'));
  assert(built.results.broadScopeFindings.some((f) => f.detector === 'target-size-minimum'));
  assert(built.results.broadScopeFindings.some((f) => f.detector === 'plain-language-research'));
  assert(bundle.broadScope.reviewPackets.length > 0);
  assert.equal(built.results.summary.broadScopeReviewPackets, bundle.broadScope.reviewPackets.length);
  assert(built.results.broadScopeReviewPackets.some((p) => p.aspect === 'reduced-motion' && p.claimFamily === 'motion-control'));
  assert(built.results.broadScopeReviewPackets.some((p) => p.aspect === 'plain-language-research' && p.claimFamily === null));
  const forcedPacket = bundle.broadScope.reviewPackets.find((p) => p.aspect === 'forced-colors' && p.targetXpath === '#forced');
  assert(forcedPacket.observed.evidenceClaims.includes('forced-colors-render'));
  assert(forcedPacket.observed.evidenceClaims.includes('essential-meaning-or-affordance-loss'));
  const motionPacket = bundle.broadScope.reviewPackets.find((p) => p.aspect === 'reduced-motion' && p.targetXpath === '#motion');
  assert(motionPacket.observed.evidenceClaims.includes('auto-motion-persists'));
  assert(motionPacket.observed.evidenceClaims.includes('duration-or-looping'));
  assert(motionPacket.observed.evidenceClaims.includes('no-working-pause-stop-hide'));
  const trapPacket = bundle.broadScope.reviewPackets.find((p) => p.aspect === 'keyboard-trap');
  assert(trapPacket);
  assert(trapPacket.observed.evidenceClaims.includes('trusted-tab-or-shift-tab-trap'));
  assert(trapPacket.observed.evidenceClaims.includes('focus-cannot-leave-region-or-element'));
  assert(trapPacket.observed.evidenceClaims.includes('no-advised-keyboard-exit'));
  assert.equal(bundle.broadScopeRationale.rationales.length, bundle.broadScope.reviewPackets.length);
  assert.equal((bundle.judgments && bundle.judgments.judgments.length) || 0, 0);
  assert.equal(bundle.broadScopeRationale.rationales.find((r) => r.targetXpath === '#motion').convertedToJudgment, false);
  const contextPacket = bundle.broadScope.reviewPackets.find((p) => p.detector === 'context-change-dynamic');
  assert(contextPacket.observed.evidenceClaims.includes('trusted-focus-or-input-action'));
  assert(contextPacket.observed.evidenceClaims.includes('context-change-observed'));
  assert(contextPacket.observed.evidenceClaims.includes('not-advised-beforehand'));
  const pointerPacket = bundle.broadScope.reviewPackets.find((p) => p.detector === 'pointer-activation-dynamic');
  assert(pointerPacket.observed.evidenceClaims.includes('trusted-pointer-sequence'));
  assert(pointerPacket.observed.evidenceClaims.includes('down-event-completes-action'));
  assert(pointerPacket.observed.evidenceClaims.includes('no-abort-undo-reversal-or-up-event-completion'));
  const gesturePacket = bundle.broadScope.reviewPackets.find((p) => p.detector === 'pointer-gesture');
  assert.equal(gesturePacket.sc, '2.5.1');
  assert(gesturePacket.observed.evidenceClaims.includes('trusted-path-gesture-operation'));
  assert(gesturePacket.observed.evidenceClaims.includes('path-based-functionality-observed'));
  assert(gesturePacket.observed.evidenceClaims.includes('target-click-and-marked-alternatives-only-no-equivalent-observed'));
  const dragPacket = bundle.broadScope.reviewPackets.find((p) => p.detector === 'dragging-movement');
  assert.equal(dragPacket.sc, '2.5.7');
  assert(dragPacket.observed.evidenceClaims.includes('trusted-drag-operation'));
  assert(dragPacket.observed.evidenceClaims.includes('dragging-functionality-observed'));
  assert(dragPacket.observed.evidenceClaims.includes('scoped-no-target-click-or-marked-alternative-observed'));
  const shortcutPacket = bundle.broadScope.reviewPackets.find((p) => p.detector === 'character-shortcut-dynamic');
  assert(shortcutPacket.observed.evidenceClaims.includes('trusted-keyboard-action'));
  assert(shortcutPacket.observed.evidenceClaims.includes('single-printable-character-shortcut-observed'));
  assert(shortcutPacket.observed.evidenceClaims.includes('no-off-remap-or-focus-scope-exception'));
  const statusPacket = bundle.broadScope.reviewPackets.find((p) => p.detector === 'status-announcement-dynamic');
  assert(statusPacket.observed.evidenceClaims.includes('trusted-activation-action'));
  assert(statusPacket.observed.evidenceClaims.includes('status-message-observed'));
  assert(statusPacket.observed.evidenceClaims.includes('no-live-region-or-programmatic-status-role'));
  const redundantPacket = bundle.broadScope.reviewPackets.find((p) => p.aspect === 'redundant-entry-review' && p.rawSc === '3.3.7');
  assert(redundantPacket.observed.evidenceClaims.includes('same-process'));
  assert(redundantPacket.observed.evidenceClaims.includes('same-information-previously-provided'));
  assert(redundantPacket.observed.evidenceClaims.includes('required-reentry'));
  assert(redundantPacket.observed.evidenceClaims.includes('no-auto-populate-or-selection-exception'));
  const labelPacket = bundle.broadScope.reviewPackets.find((p) => p.detector === 'label-in-name');
  assert(labelPacket.observed.evidenceClaims.includes('visible-text-label'));
  assert(labelPacket.observed.evidenceClaims.includes('accessible-name-observed'));
  assert(labelPacket.observed.evidenceClaims.includes('accessible-name-missing-visible-text'));
  const targetSizePacket = bundle.broadScope.reviewPackets.find((p) => p.detector === 'target-size-minimum');
  assert(targetSizePacket.observed.evidenceClaims.includes('rendered-pointer-target'));
  assert(targetSizePacket.observed.evidenceClaims.includes('measured-target-size-below-24'));
  assert(targetSizePacket.observed.evidenceClaims.includes('target-spacing-intersection'));
  assert.equal(built.results.summary.authoritative, 0);
});
