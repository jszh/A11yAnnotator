'use strict';

// Experimental broad-scope probes. These intentionally DO NOT publish v3 claims; they produce
// scope metadata, review candidates, and positive evidence packets for future lanes.

const { buildReviewPacketsFromBroadScope } = require('./broad-scope-llm-review.js');
const kbd = require('./kbd-graph.js');
const A = require('../../lib/a11y-eval.js');

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const norm = (v) => String(v == null ? '' : v).trim().replace(/\s+/g, ' ').toLowerCase();
const arr = (v) => Array.isArray(v) ? v : [];
const stableSig = (v) => JSON.stringify(v == null ? null : v);
const indexOf = (list, value) => list.findIndex((x) => x === value);

function parseViewportPolicy(content = '') {
  const raw = String(content || '');
  const toks = {};
  for (const part of raw.split(',')) {
    const [k, v = ''] = part.split('=').map((s) => s.trim().toLowerCase());
    if (k) toks[k] = v || true;
  }
  const maxScale = toks['maximum-scale'] != null ? Number(toks['maximum-scale']) : null;
  const blocksZoom = toks['user-scalable'] === 'no' || toks['user-scalable'] === '0' || (Number.isFinite(maxScale) && maxScale < 2);
  return {
    content: raw,
    userScalable: toks['user-scalable'] == null ? null : String(toks['user-scalable']),
    maximumScale: Number.isFinite(maxScale) ? maxScale : null,
    blocksZoom,
    warning: blocksZoom ? 'viewport zoom appears restricted; this is a user-preference/adaptation risk, not a full conformance verdict' : null,
  };
}

function analyzeProcessManifest(manifest = {}) {
  const steps = Array.isArray(manifest.steps) ? manifest.steps : [];
  const warnings = [];
  const findings = [];
  const evidenceClaims = [];
  const requiredStepIds = arr(manifest.requiredStepIds).map(String);
  const hasDeclaredRequiredSteps = requiredStepIds.length > 0;
  const required = hasDeclaredRequiredSteps ? requiredStepIds : [];
  const measured = new Set();
  const duplicateStepIds = [];
  const missingTargets = [];
  const unmeasuredSteps = [];
  const failedSteps = [];
  const missingStepResults = [];
  const processCoverageGaps = [];
  const processFailures = [];
  const add = (code, detail = {}) => {
    warnings.push(code);
    findings.push({ code, ...detail });
  };
  if (!steps.length) add('process-manifest-empty');
  if (steps.length) evidenceClaims.push('declared-process-steps');
  if (!hasDeclaredRequiredSteps) add('process-required-steps-undeclared');
  if (hasDeclaredRequiredSteps) evidenceClaims.push('process-scope-comparison');
  const seen = new Set();
  for (const s of steps) {
    const id = s && s.id ? String(s.id) : '';
    if (!id) add('process-step-missing-id', { step: s || null });
    if (id && seen.has(id)) {
      duplicateStepIds.push(id);
      add(`process-step-duplicate:${id}`, { stepId: id });
    }
    if (id) seen.add(id);
    if (!s || (!s.url && !s.stateRef)) {
      missingTargets.push(id || '?');
      add(`process-step-missing-target:${id || '?'}`, { stepId: id || '?' });
    }
    if (s && id && s.measured === true && (s.url || s.stateRef)) measured.add(id);
    if (s && id && s.measured == null) {
      unmeasuredSteps.push(id);
      add(`process-step-measurement-missing:${id}`, { stepId: id });
    }
    if (s && id && s.measured === false) {
      unmeasuredSteps.push(id);
      add(`process-step-unmeasured:${id}`, { stepId: id });
    }
    if (s && id && s.result === 'fail') {
      failedSteps.push(id);
      add(`process-step-result-fail:${id}`, { stepId: id });
    }
    if (s && id && s.result == null) {
      missingStepResults.push(id);
      add(`process-step-result-missing:${id}`, { stepId: id });
    }
  }
  const missingRequiredSteps = required.filter((id) => !measured.has(id));
  for (const id of missingRequiredSteps) add(`process-required-step-unmeasured:${id}`, { stepId: id });
  if (hasDeclaredRequiredSteps && missingRequiredSteps.length === 0) evidenceClaims.push('all-required-steps-measured');
  if (steps.length && missingStepResults.length === 0) evidenceClaims.push('per-step-results');
  if (manifest.processBoundaryComplete !== true) add('process-boundary-not-proven-complete', { processId: manifest.processId || null });
  if (manifest.requiresPersistedUserData === true && !Array.isArray(manifest.persistedFields))
    add('redundant-entry-unmeasurable:no-persisted-fields');
  const redundantEntryFindings = [];
  for (const check of arr(manifest.redundantEntryChecks)) {
    if (!check || typeof check !== 'object') continue;
    const requiredAgain = check.requiredAgain !== false;
    const previouslyProvided = check.previouslyProvided !== false;
    const sameProcess = check.sameProcess !== false;
    const exception = check.exception || check.autoPopulated === true || check.availableForSelection === true || check.userConfirmedReuse === true;
    if (sameProcess && previouslyProvided && requiredAgain && !exception) {
      const field = String(check.field || check.name || 'unknown');
      redundantEntryFindings.push(field);
      add(`redundant-entry-required:${field}`, { field });
    }
  }
  for (const code of warnings) {
    if (code.startsWith('process-step-result-fail:') || code.startsWith('redundant-entry-required:')) {
      processFailures.push(code);
    } else {
      processCoverageGaps.push(code);
    }
  }
  const scopedEvidenceClaims = [
    ...evidenceClaims,
    ...(processCoverageGaps.length ? ['process-coverage-gap-observed'] : []),
    ...(processFailures.length ? ['process-failure-observed'] : []),
  ];
  return {
    kind: 'process-scope',
    processId: manifest.processId || null,
    stepCount: steps.length,
    requiredStepIds: required,
    measuredStepIds: [...measured],
    duplicateStepIds,
    missingTargets,
    missingRequiredSteps,
    unmeasuredSteps,
    failedSteps,
    missingStepResults,
    redundantEntryFindings,
    processCoverageGaps,
    processFailures,
    warnings,
    findings,
    evidenceClaims: [...new Set(scopedEvidenceClaims)],
  };
}

function analyzeSiteSetManifest(manifest = {}) {
  const pages = Array.isArray(manifest.pages) ? manifest.pages : [];
  const warnings = [];
  const findings = [];
  const evidenceClaims = [];
  const siteSetScopeGaps = [];
  const siteSetInconsistencies = [];
  const add = (code, detail = {}) => {
    warnings.push(code);
    findings.push({ code, ...detail });
  };
  if (pages.length < 2) add('site-set-too-small');
  if (pages.length) evidenceClaims.push('declared-page-set');
  if (manifest.sameStateBreakpointContext === true) evidenceClaims.push('same-state-breakpoint-context');
  else add('site-set-state-breakpoint-context-unproven');
  const titleMap = new Map();
  const helpLists = [];
  const navLists = [];
  const navHrefByLabel = new Map();
  const componentByKey = new Map();
  const linkPurposeByName = new Map();
  const siteSetReviewGaps = [];
  for (const p of pages) {
    if (!p || !p.url) add('site-page-missing-url');
    if (!p || !norm(p.title)) add('site-page-title-missing', { url: p && p.url ? p.url : '' });
    if (p && p.title) {
      const key = norm(p.title);
      if (!titleMap.has(key)) titleMap.set(key, []);
      titleMap.get(key).push({ url: p.url || '', title: p.title, purpose: p.purpose || '' });
    }
    const help = arr(p && p.helpMechanisms).map((h) => typeof h === 'string' ? { type: h, label: h, href: '' } : h)
      .map((h) => ({ type: norm(h.type || h.kind || h.label), label: norm(h.label || h.type || h.kind), href: norm(h.href || h.url || '') }));
    if (help.length) helpLists.push(help.map((h) => `${h.type}:${h.label}:${h.href}`));
    const nav = arr(p && p.navItems).map((n) => ({ label: norm(n.label || n.text || n.name), href: norm(n.href || n.url || '') }));
    if (nav.length) {
      navLists.push(nav.map((n) => n.label).filter(Boolean));
      for (const n of nav) {
        if (!n.label) continue;
        if (!navHrefByLabel.has(n.label)) navHrefByLabel.set(n.label, new Set());
        if (n.href) navHrefByLabel.get(n.label).add(n.href.replace(/\/+$/, '') || '/');
      }
    }
    for (const c of arr(p && p.components)) {
      const key = norm(c.key || c.function || c.id || c.purpose);
      if (!key) continue;
      const sig = stableSig({ label: norm(c.label || c.name || c.accessibleName), role: norm(c.role || '') });
      if (!componentByKey.has(key)) componentByKey.set(key, new Set());
      componentByKey.get(key).add(sig);
    }
    for (const l of arr(p && p.links)) {
      const name = norm(l.name || l.text || l.label);
      if (!name) continue;
      if (!linkPurposeByName.has(name)) linkPurposeByName.set(name, []);
      linkPurposeByName.get(name).push({ href: norm(l.href || l.url || ''), purpose: norm(l.purpose || '') });
    }
  }
  const duplicateTitles = [...titleMap.entries()]
    .filter(([, items]) => items.length > 1 && new Set(items.map((x) => norm(x.purpose || x.url))).size > 1)
    .map(([title, items]) => ({ title, count: items.length, pages: items }));
  if (duplicateTitles.length) add('duplicate-page-title-in-set', { duplicateTitles });
  const helpOrderConflict = repeatedOrderConflict(helpLists);
  if (helpOrderConflict) add('inconsistent-help-mechanism-order', helpOrderConflict);
  const navOrderConflict = repeatedOrderConflict(navLists);
  if (navOrderConflict) add('inconsistent-navigation-order', navOrderConflict);
  for (const [label, hrefs] of navHrefByLabel) if (hrefs.size > 1) add(`navigation-label-different-destination:${label}`, { label, hrefs: [...hrefs] });
  for (const [key, sigs] of componentByKey) if (sigs.size > 1) add(`inconsistent-component-identification:${key}`, { key, signatures: [...sigs] });
  for (const [name, links] of linkPurposeByName) {
    const purposes = new Set(links.map((l) => l.purpose).filter(Boolean));
    const hrefs = new Set(links.map((l) => l.href).filter(Boolean));
    if (purposes.size > 1) {
      add(`same-link-name-different-purpose:${name}`, { name, purposes: [...purposes], links });
    } else if (hrefs.size > 1) {
      add(`same-link-name-different-destination-review:${name}`, { name, hrefs: [...hrefs], links });
    }
  }
  if (pages.length >= 2 && (helpLists.length > 0 || navLists.length > 0 || componentByKey.size > 0 || linkPurposeByName.size > 0)) evidenceClaims.push('repeated-mechanism-comparison');
  for (const code of warnings) {
    if (
      code === 'site-set-too-small' ||
      code === 'site-set-state-breakpoint-context-unproven' ||
      code === 'site-page-missing-url'
    ) {
      siteSetScopeGaps.push(code);
    } else if (code.startsWith('same-link-name-different-destination-review:')) {
      siteSetReviewGaps.push(code);
    } else {
      siteSetInconsistencies.push(code);
    }
  }
  const scopedEvidenceClaims = [
    ...evidenceClaims,
    ...(siteSetScopeGaps.length ? ['site-set-scope-gap-observed'] : []),
    ...(siteSetReviewGaps.length ? ['site-set-review-gap-observed'] : []),
    ...(siteSetInconsistencies.length ? ['site-set-inconsistency-observed'] : []),
  ];
  return {
    kind: 'site-set-scope',
    setId: manifest.setId || null,
    pageCount: pages.length,
    sameStateBreakpointContext: manifest.sameStateBreakpointContext === true,
    duplicateTitles,
    comparisonCounts: {
      helpLists: helpLists.length,
      navigationLists: navLists.length,
      componentKeys: componentByKey.size,
      linkNames: linkPurposeByName.size,
    },
    warnings,
    findings,
    siteSetScopeGaps,
    siteSetReviewGaps,
    siteSetInconsistencies,
    evidenceClaims: [...new Set(scopedEvidenceClaims)],
  };
}

function repeatedOrderConflict(lists) {
  let baseline = null;
  for (const list of lists) {
    if (!Array.isArray(list) || list.length < 2) continue;
    for (let i = 0; i < list.length; i++) {
      for (let j = i + 1; j < list.length; j++) {
        const a = list[i], b = list[j];
        if (!a || !b || a === b) continue;
        const key = `${a}\u0000${b}`;
        const reverseKey = `${b}\u0000${a}`;
        if (baseline && baseline.has(reverseKey)) return { before: b, after: a };
        if (!baseline) baseline = new Set();
        baseline.add(key);
      }
    }
  }
  for (let i = 0; i < lists.length; i++) {
    for (let j = i + 1; j < lists.length; j++) {
      const common = lists[i].filter((x) => lists[j].includes(x));
      for (let a = 0; a < common.length; a++) {
        for (let b = a + 1; b < common.length; b++) {
          const one = common[a], two = common[b];
          const d1 = indexOf(lists[i], one) - indexOf(lists[i], two);
          const d2 = indexOf(lists[j], one) - indexOf(lists[j], two);
          if (d1 * d2 < 0) return { before: one, after: two };
        }
      }
    }
  }
  return null;
}

async function collectScopeInventory(page, opts = {}) {
  const cap = Number.isFinite(opts.elementCap) ? opts.elementCap : null;
  const inv = await page.evaluate(() => {
    const all = [...document.querySelectorAll('*')];
    const css = (el, pseudo = null) => {
      try { return getComputedStyle(el, pseudo); } catch (e) { return null; }
    };
    const shadowHosts = all.filter((el) => !!el.shadowRoot);
    const iframes = [...document.querySelectorAll('iframe,frame')].map((f) => {
      let sameOrigin = false;
      try { sameOrigin = !!(f.contentDocument && f.contentDocument.documentElement); } catch (e) { sameOrigin = false; }
      return { src: f.getAttribute('src') || '', sameOrigin };
    });
    let generatedContentCount = 0, pseudoBackgroundCount = 0;
    for (const el of all) {
      for (const pseudo of ['::before', '::after']) {
        const s = css(el, pseudo);
        if (!s) continue;
        const content = String(s.content || '');
        if (content && content !== 'none' && content !== 'normal' && content !== '""') generatedContentCount++;
        if (s.backgroundImage && s.backgroundImage !== 'none') pseudoBackgroundCount++;
      }
    }
    const media = [...document.querySelectorAll('audio,video')].map((m) => ({
      tag: m.tagName.toLowerCase(),
      autoplay: m.hasAttribute('autoplay'),
      controls: m.hasAttribute('controls'),
      muted: m.muted || m.hasAttribute('muted'),
      loop: m.hasAttribute('loop'),
      src: m.getAttribute('src') || '',
      tracks: [...m.querySelectorAll('track')].map((t) => ({ kind: t.getAttribute('kind') || 'subtitles', src: t.getAttribute('src') || '' })),
    }));
    const viewport = document.querySelector('meta[name="viewport"]');
    return {
      url: location.href,
      domElementCount: all.length,
      iframeCount: iframes.length,
      sameOriginIframeCount: iframes.filter((f) => f.sameOrigin).length,
      crossOriginIframeCount: iframes.filter((f) => !f.sameOrigin).length,
      shadowHostCount: shadowHosts.length,
      generatedContentCount,
      pseudoBackgroundCount,
      media,
      metaViewport: viewport ? viewport.getAttribute('content') || '' : '',
    };
  });
  const warnings = [];
  if (cap != null && inv.domElementCount > cap) warnings.push('page-truncated-risk');
  if (inv.crossOriginIframeCount > 0) warnings.push('cross-origin-frame-untested');
  if (inv.shadowHostCount > 0) warnings.push('shadow-root-coverage-needed');
  if (inv.pseudoBackgroundCount > 0) warnings.push('pseudo-background-coverage-needed');
  const viewportPolicy = parseViewportPolicy(inv.metaViewport);
  if (viewportPolicy.blocksZoom) warnings.push('viewport-zoom-restricted');
  return { kind: 'scope-inventory', ...inv, viewportPolicy, scopeWarnings: warnings };
}

async function runBroadScopeForUrl(url, opts = {}) {
  const browser = opts.browser;
  if (!browser || typeof browser.newPage !== 'function') throw new Error('runBroadScopeForUrl requires an injected Puppeteer browser');
  const id = { file: opts.file || 'page', runId: opts.runId || 'run', pageDigest: opts.pageDigest || 'sha256:unknown' };
  const open = async () => {
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'load', timeout: opts.timeoutMs || 45000 });
    await sleep(Number.isFinite(opts.settleMs) ? opts.settleMs : 150);
    return page;
  };
  const findings = [];
  const scopeWarnings = [];
  const visualChecks = [];
  const researchAnnotations = [];
  let probes = {};
  const addFinding = (f) => findings.push({
    source: 'broad-scope',
    detector: String(f.detector || f.family || f.kind || 'broad-scope'),
    sc: String(f.sc || ''),
    kind: String(f.kind || f.family || 'candidate'),
    xpath: f.path || f.xpath || null,
    detail: String(f.detail || f.reason || ''),
    review: f.review !== false,
    authoritative: false,
    shadow: true,
    evidenceClaims: Array.isArray(f.evidenceClaims) ? f.evidenceClaims.map(String) : [],
    evidenceStrength: f.evidenceStrength != null ? String(f.evidenceStrength) : '',
    ...(f.evidenceDetails && typeof f.evidenceDetails === 'object' ? { evidenceDetails: f.evidenceDetails } : {}),
    ...(f.facts && typeof f.facts === 'object' ? { facts: f.facts } : {}),
    ...(f.visualRef ? { visualRef: f.visualRef } : {}),
  });
  try {
    const page = await open();
    try {
      probes.scopeInventory = await collectScopeInventory(page, { elementCap: opts.elementCap });
      scopeWarnings.push(...(probes.scopeInventory.scopeWarnings || []));
      for (const m of probes.scopeInventory.media || []) {
        if (m.autoplay && !m.controls && !m.muted) addFinding({ detector: 'scope-media-autoplay', sc: '1.4.2', path: null, reason: 'media appears to autoplay without native controls/mute in scope inventory' });
      }
    } finally { await page.close().catch(() => {}); }

    const spacingPage = await open();
    try {
      probes.textSpacing = await probeTextSpacing(spacingPage);
      for (const c of probes.textSpacing.candidates || []) {
        const visualRef = `broad-vis:text-spacing:${visualChecks.length}`;
        visualChecks.push({ id: visualRef, detector: 'text-spacing', xpath: c.path, agreement: true, note: 'DOM overflow appeared only after WCAG text-spacing override; candidate requires visual review for intended clipping/exemptions' });
        addFinding({ detector: 'text-spacing', sc: '1.4.12', path: c.path, reason: c.reason, visualRef, evidenceClaims: ['after-spacing-loss', 'before-after-visual-agreement'], evidenceStrength: 'observed-layout-delta' });
      }
    } finally { await spacingPage.close().catch(() => {}); }

    const resizePage = await open();
    try {
      probes.resizeText = await probeResizeText(resizePage);
      for (const c of probes.resizeText.candidates || []) {
        const visualRef = `broad-vis:resize-text:${visualChecks.length}`;
        visualChecks.push({ id: visualRef, detector: 'resize-text', xpath: c.path, agreement: true, note: 'DOM overflow appeared only after 200% root text-size override; candidate requires visual review for WCAG exceptions and author mechanisms' });
        addFinding({ detector: 'resize-text', sc: '1.4.4', path: c.path, reason: c.reason, visualRef, evidenceClaims: ['200-percent-text-size-loss', 'before-after-visual-agreement'], evidenceStrength: 'observed-layout-delta' });
      }
    } finally { await resizePage.close().catch(() => {}); }

    const motionPage = await open();
    try {
      probes.reducedMotion = await probeReducedMotion(motionPage);
      for (const c of probes.reducedMotion.candidates || []) {
        const evidenceClaims = ['auto-motion-persists', 'duration-or-looping'];
        if (c.workingPauseStopHide) evidenceClaims.push('working-pause-stop-hide');
        else if (c.noWorkingPauseStopHide) evidenceClaims.push('no-working-pause-stop-hide');
        if (c.parallelNonEssential) evidenceClaims.push('parallel-non-essential-content');
        addFinding({
          detector: 'reduced-motion',
          sc: '2.2.2',
          path: c.path,
          reason: c.reason,
          evidenceClaims,
          evidenceStrength: c.workingPauseStopHide ? 'observed-user-preference-state-with-working-control' : 'observed-user-preference-state',
        });
      }
    } finally { await motionPage.close().catch(() => {}); }

    const forcedPage = await open();
    try {
      probes.forcedColors = await probeForcedColors(forcedPage);
      for (const c of probes.forcedColors.candidates || []) {
        const visualRef = `broad-vis:forced-colors:${visualChecks.length}`;
        visualChecks.push({
          id: visualRef,
          detector: 'forced-colors',
          xpath: c.path,
          agreement: c.textContrastLoss === true,
          note: c.textContrastLoss
            ? 'before/after forced-colors emulation shows readable text becoming low contrast on a forced-color-adjust:none surface'
            : 'forced-colors opt-out or color delta observed; visual semantics still require judgment',
        });
        const textContrastLoss = c.textContrastLoss === true;
        const nonTextBoundaryLoss = c.nonTextBoundaryLoss === true;
        addFinding({
          detector: textContrastLoss ? 'forced-colors' : (nonTextBoundaryLoss ? 'forced-colors-nontext' : 'forced-colors'),
          sc: 'EN-C.9.7',
          path: c.path,
          reason: c.reason,
          visualRef,
          evidenceClaims: textContrastLoss
            ? ['forced-colors-render', 'essential-meaning-or-affordance-loss']
            : (nonTextBoundaryLoss ? ['forced-colors-render', 'non-text-boundary-or-state-loss', 'essential-control-boundary'] : []),
          evidenceStrength: textContrastLoss
            ? 'observed-forced-colors-contrast-loss'
            : (nonTextBoundaryLoss ? 'observed-forced-colors-nontext-boundary-loss' : 'review-surface'),
        });
      }
    } finally { await forcedPage.close().catch(() => {}); }

    const staticPage = await open();
    try {
      probes.nonInterference = await collectNonInterferenceCandidates(staticPage);
      for (const c of probes.nonInterference.candidates || []) addFinding({
        detector: c.family,
        sc: c.sc,
        path: c.path,
        reason: c.reason,
        evidenceClaims: Array.isArray(c.evidenceClaims) ? c.evidenceClaims : [],
        evidenceStrength: Array.isArray(c.evidenceClaims) && c.evidenceClaims.length ? 'candidate-measured-evidence' : 'review-surface',
      });
      probes.interaction = await collectInteractionCandidates(staticPage);
      for (const c of probes.interaction.candidates || []) addFinding({
        detector: c.family,
        sc: c.sc,
        path: c.path,
        reason: c.reason,
        evidenceClaims: Array.isArray(c.evidenceClaims) ? c.evidenceClaims : [],
        evidenceStrength: Array.isArray(c.evidenceClaims) && c.evidenceClaims.length ? 'candidate-measured-evidence' : 'review-surface',
      });
      probes.labelInName = await probeLabelInName(staticPage);
      for (const c of probes.labelInName.candidates || []) addFinding({
        detector: 'label-in-name',
        sc: '2.5.3',
        path: c.path,
        reason: c.reason,
        evidenceClaims: ['visible-text-label', 'accessible-name-observed', 'accessible-name-missing-visible-text'],
        evidenceStrength: 'observed-visible-label-name-mismatch',
      });
      probes.targetSize = await probeTargetSize(staticPage);
      for (const c of probes.targetSize.candidates || []) addFinding({
        detector: 'target-size-minimum',
        sc: '2.5.8',
        path: c.path,
        reason: c.reason,
        evidenceClaims: ['rendered-pointer-target', 'measured-target-size-below-24', 'target-spacing-intersection'],
        evidenceStrength: 'observed-target-size-geometry-fail',
      });
      probes.mediaAlternatives = await collectMediaAlternativeInventory(staticPage);
      for (const m of probes.mediaAlternatives.media || []) {
        for (const w of m.warnings || []) {
          const scopedSc = mediaWarningSc(m, w);
          const evidenceClaims = ['owned-media-element'];
          if (mediaHasContentModel(m)) {
            evidenceClaims.push('media-content-model-observed');
            if (mediaWarningShowsMissingOrInadequateAlternative(w)) evidenceClaims.push('alternative-missing-or-inadequate-observed');
          }
          addFinding({
            detector: 'media-alternative-inventory',
            sc: scopedSc,
            path: m.path,
            reason: w,
            evidenceClaims,
            evidenceStrength: evidenceClaims.includes('alternative-missing-or-inadequate-observed')
              ? 'observed-media-alternative-gap'
              : 'media-inventory-review-surface',
            evidenceDetails: { media: [m], warning: w },
          });
        }
      }
      probes.authenticationAndEntry = await collectAuthenticationAndEntryCandidates(staticPage);
      for (const c of probes.authenticationAndEntry.candidates || []) addFinding({
        detector: c.family,
        sc: c.sc,
        path: c.path || null,
        reason: c.reason || c.key,
        evidenceClaims: Array.isArray(c.evidenceClaims) ? c.evidenceClaims : [],
        evidenceStrength: Array.isArray(c.evidenceClaims) && c.evidenceClaims.length ? 'candidate-measured-evidence' : 'review-surface',
      });
      probes.cognitiveResearch = await collectCognitiveCandidates(staticPage, { longSentenceWords: 35 });
      for (const c of probes.cognitiveResearch.candidates || []) {
        researchAnnotations.push({ detector: c.family, kind: 'cognitive-research', detail: c.reason, examples: c.examples || [], review: true });
        addFinding({
          detector: c.family,
          sc: '3.1.5',
          path: c.path || null,
          reason: c.reason,
          evidenceClaims: Array.isArray(c.evidenceClaims) ? c.evidenceClaims : [],
          evidenceStrength: Array.isArray(c.evidenceClaims) && c.evidenceClaims.length ? 'candidate-measured-evidence' : 'semantic-review-surface',
        });
      }
      probes.visualStructure = await probeVisualStructureDiscovery(staticPage);
      for (const c of probes.visualStructure.candidates || []) addFinding({
        detector: 'visual-structure-discovery',
        sc: c.sc || '1.3.1/2.4.6/2.4.10',
        path: c.path,
        reason: c.reason,
        evidenceClaims: ['rendered-visual-structure-signal', 'programmatic-structure-missing', 'content-region-observed'],
        evidenceStrength: 'rendered-structure-discovery',
      });
      probes.visualContent = await probeVisualContentDiscovery(staticPage);
      for (const c of probes.visualContent.candidates || []) addFinding({
        detector: 'visual-content-discovery',
        sc: c.sc || '1.1.1/1.4.1/1.4.5',
        path: c.path,
        reason: c.reason,
        evidenceClaims: ['rendered-non-dom-visual-content-signal', 'semantic-alternative-missing-or-unproven', 'content-region-observed'],
        evidenceStrength: 'rendered-visual-content-discovery',
      });
    } finally { await staticPage.close().catch(() => {}); }

    const revealPage = await open();
    try {
      probes.revealStates = await probeRevealStates(revealPage);
      for (const c of probes.revealStates.candidates || []) addFinding({
        detector: 'reveal-state-discovery',
        sc: '1.3.1/2.4.3/2.4.10/4.1.2',
        path: c.path,
        reason: c.reason,
        evidenceClaims: ['trusted-reveal-action', 'state-reached', 'newly-rendered-content-or-focusable'],
        evidenceStrength: 'trusted-reveal-state-diff',
      });
    } finally { await revealPage.close().catch(() => {}); }

    const audioPage = await open();
    try {
      probes.audioAutoplay = await probeAudioAutoplay(audioPage);
      for (const c of probes.audioAutoplay.candidates || []) addFinding({
        detector: 'audio-control-dynamic',
        sc: '1.4.2',
        path: c.path,
        reason: c.reason,
        evidenceClaims: c.autoplayOverThreeSecondsObserved ? ['audible-autoplay-more-than-three-seconds', 'no-independent-control'] : [],
        evidenceStrength: c.autoplayOverThreeSecondsObserved ? 'observed-playback-duration-and-control-absence' : 'applicability-risk-unproven-playback',
      });
    } finally { await audioPage.close().catch(() => {}); }

    const flashPage = await open();
    try {
      probes.flashTemporal = await probeFlashTemporal(flashPage);
      for (const c of probes.flashTemporal.candidates || []) addFinding({
        detector: 'flash-temporal',
        sc: '2.3.1',
        path: c.path,
        reason: c.reason,
        evidenceClaims: c.thresholdEvidenceObserved ? ['frame-sampled-flash-rate', 'area-or-red-threshold'] : [],
        evidenceStrength: c.thresholdEvidenceObserved ? 'observed-flash-rate-and-area-threshold' : 'temporal-risk-threshold-unproven',
      });
    } finally { await flashPage.close().catch(() => {}); }

    const keyboardTrapPage = await open();
    try {
      const retention = await kbd.detectFocusRetentionTraps(keyboardTrapPage);
      const region = await kbd.detectKeyboardTraps(keyboardTrapPage);
      const fixedSet = await kbd.detectFixedSetConfinementTraps(keyboardTrapPage);
      const traps = [
        ...(retention.traps || []).map((x) => ({ ...x, detectorKind: 'focus-retention' })),
        ...(region.traps || []).map((x) => ({ ...x, detectorKind: 'region-escape' })),
        ...(fixedSet.traps || []).map((x) => ({ ...x, detectorKind: 'fixed-set-confinement' })),
      ];
      probes.keyboardTraps = {
        kind: 'keyboard-trap-probe',
        traps,
        focusRetention: retention,
        regionEscape: region,
        fixedSetConfinement: fixedSet,
      };
      for (const t of traps) addFinding({
        detector: 'keyboard-trap',
        sc: '2.1.2',
        path: t.xpath || t.regionXpath,
        reason: `${t.detectorKind || 'keyboard'} trap confirmed by trusted keyboard traversal`,
        evidenceClaims: ['trusted-tab-or-shift-tab-trap', 'focus-cannot-leave-region-or-element', 'no-advised-keyboard-exit'],
        evidenceStrength: `observed-${t.detectorKind || 'keyboard'}-trap`,
        evidenceDetails: {
          trap: t,
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
        },
      });
    } finally { await keyboardTrapPage.close().catch(() => {}); }

    const contextPage = await open();
    try {
      probes.contextChanges = await probeContextChanges(contextPage);
      for (const c of probes.contextChanges.candidates || []) addFinding({
        detector: 'context-change-dynamic',
        sc: c.sc || '3.2.1',
        path: c.path,
        reason: c.reason,
        evidenceClaims: [
          'trusted-focus-or-input-action',
          'context-change-observed',
          ...(c.advisedBeforehand ? ['advised-beforehand'] : ['not-advised-beforehand']),
        ],
        evidenceStrength: c.advisedBeforehand ? 'observed-trusted-state-delta-with-advice' : 'observed-trusted-state-delta',
      });
    } finally { await contextPage.close().catch(() => {}); }

    const pointerPage = await open();
    try {
      probes.pointerActivation = await probePointerActivation(pointerPage);
      for (const c of probes.pointerActivation.candidates || []) addFinding({
        detector: 'pointer-activation-dynamic',
        sc: '2.5.2',
        path: c.path,
        reason: c.reason,
        evidenceClaims: [
          'trusted-pointer-sequence',
          ...(c.downEventCompletesAction ? ['down-event-completes-action'] : []),
          ...(c.noAbortUndoReversalOrUpEventCompletion ? ['no-abort-undo-reversal-or-up-event-completion'] : []),
        ],
        evidenceStrength: c.noAbortUndoReversalOrUpEventCompletion ? 'observed-pointer-cancellation-risk' : 'observed-trusted-state-delta',
      });
    } finally { await pointerPage.close().catch(() => {}); }

    const gesturePage = await open();
    try {
      probes.pointerGestures = await probePointerGestures(gesturePage);
      for (const c of probes.pointerGestures.candidates || []) addFinding({
        detector: 'pointer-gesture',
        sc: '2.5.1',
        path: c.path,
        reason: c.reason,
        evidenceClaims: ['trusted-path-gesture-operation', 'path-based-functionality-observed', 'target-click-and-marked-alternatives-only-no-equivalent-observed'],
        evidenceStrength: 'observed-path-gesture-without-simple-pointer-alternative',
      });
    } finally { await gesturePage.close().catch(() => {}); }

    const dragPage = await open();
    try {
      probes.draggingMovements = await probeDraggingMovements(dragPage);
      for (const c of probes.draggingMovements.candidates || []) addFinding({
        detector: 'dragging-movement',
        sc: '2.5.7',
        path: c.path,
        reason: c.reason,
        evidenceClaims: ['trusted-drag-operation', 'dragging-functionality-observed', 'scoped-no-target-click-or-marked-alternative-observed'],
        evidenceStrength: 'observed-dragging-without-simple-pointer-alternative',
      });
    } finally { await dragPage.close().catch(() => {}); }

    const shortcutPage = await open();
    try {
      probes.characterShortcuts = await probeCharacterShortcuts(shortcutPage);
      for (const c of probes.characterShortcuts.candidates || []) addFinding({
        detector: 'character-shortcut-dynamic',
        sc: '2.1.4',
        path: c.path,
        reason: c.reason,
        evidenceClaims: [
          'trusted-keyboard-action',
          'single-printable-character-shortcut-observed',
          ...(c.noOffRemapOrFocusScopeException ? ['no-off-remap-or-focus-scope-exception'] : []),
        ],
        evidenceStrength: 'trusted-keyboard-state-delta',
      });
    } finally { await shortcutPage.close().catch(() => {}); }

    const statusPage = await open();
    try {
      probes.statusMessages = await probeStatusMessages(statusPage);
      for (const c of probes.statusMessages.candidates || []) addFinding({
        detector: 'status-announcement-dynamic',
        sc: '4.1.3',
        path: c.path,
        reason: c.reason,
        evidenceClaims: [
          'trusted-activation-action',
          'status-message-observed',
          ...(c.focusNotMovedToMessage ? ['focus-not-moved-to-message'] : []),
          ...(c.noLiveRegionOrProgrammaticStatusRole ? ['no-live-region-or-programmatic-status-role'] : ['live-region-or-status-role-present']),
        ],
        evidenceStrength: c.noLiveRegionOrProgrammaticStatusRole && c.focusNotMovedToMessage
          ? 'observed-status-update-without-programmatic-announcement'
          : 'observed-status-update-with-programmatic-or-focus-channel',
      });
    } finally { await statusPage.close().catch(() => {}); }
  } catch (e) {
    return { ...id, ran: false, error: e && e.message ? e.message : String(e), probes: {}, findings: [], scopeWarnings: [], visualChecks: [], reviewPackets: [], researchAnnotations: [] };
  }
  const artifact = { ...id, ran: true, probes, findings, scopeWarnings: [...new Set(scopeWarnings)], visualChecks, researchAnnotations };
  artifact.reviewPackets = buildReviewPacketsFromBroadScope(artifact);
  return artifact;
}

async function probeTextSpacing(page) {
  const before = await page.evaluate(measureTextLayout);
  await page.addStyleTag({ content: `
    * {
      line-height: 1.5 !important;
      letter-spacing: 0.12em !important;
      word-spacing: 0.16em !important;
    }
    p { margin-bottom: 2em !important; }
  ` });
  await sleep(100);
  const after = await page.evaluate(measureTextLayout);
  const newlyClipped = after.clipped.filter((a) => !before.clipped.some((b) => b.path === a.path));
  return {
    kind: 'text-spacing-probe',
    before,
    after,
    candidates: newlyClipped.map((c) => ({ ...c, reason: 'text became clipped/overflowed after WCAG text-spacing override' })),
    scope: 'single-rendered-state',
  };
}

async function probeResizeText(page) {
  const viewport = page.viewport() || { width: 1280, height: 900 };
  const before = await page.evaluate(measureTextLayout);
  await page.addStyleTag({ content: `
    html { font-size: 200% !important; }
    body { font-size: 100% !important; }
    input, button, select, textarea { font-size: 100% !important; }
  ` });
  await sleep(120);
  const after = await page.evaluate(measureTextLayout);
  const newlyClipped = after.clipped.filter((a) => !before.clipped.some((b) => b.path === a.path));
  return {
    kind: 'resize-text-probe',
    viewport: { width: viewport.width, height: viewport.height },
    before,
    after,
    candidates: newlyClipped.map((c) => ({ ...c, reason: 'text became clipped/overflowed after a 200% root text-size override' })),
    scope: 'single-rendered-state',
  };
}

function measureTextLayout() {
  const pathOf = (el) => {
    if (!el || !el.tagName) return '';
    if (el.id) return `#${el.id}`;
    const tag = el.tagName.toLowerCase();
    let i = 1; for (let p = el.previousElementSibling; p; p = p.previousElementSibling) if (p.tagName === el.tagName) i++;
    return `${pathOf(el.parentElement)}/${tag}[${i}]`;
  };
  const clipped = [];
  for (const el of [...document.querySelectorAll('body *')]) {
    const text = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (text.length < 3) continue;
    const s = getComputedStyle(el);
    if (s.display === 'none' || s.visibility === 'hidden') continue;
    const r = el.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) continue;
    const overflowHidden = ['hidden', 'clip'].includes(s.overflow) || ['hidden', 'clip'].includes(s.overflowX) || ['hidden', 'clip'].includes(s.overflowY);
    const overflows = el.scrollWidth > el.clientWidth + 1 || el.scrollHeight > el.clientHeight + 1;
    if (overflowHidden && overflows) clipped.push({ path: pathOf(el), text: text.slice(0, 80), width: Math.round(r.width), height: Math.round(r.height) });
  }
  return { clipped };
}

async function probeReducedMotion(page) {
  const before = await page.evaluate(collectMotion);
  if (typeof page.emulateMediaFeatures === 'function') {
    await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
    await sleep(120);
  }
  const after = await page.evaluate(collectMotion);
  const persistent = after.moving.filter((m) => m.active && (m.infinite || m.durationMs > 5000));
  const controlEvidence = await exerciseMotionControls(page, persistent.map((m) => m.path));
  return {
    kind: 'reduced-motion-probe',
    before,
    after,
    controlEvidence,
    candidates: persistent.map((m) => {
      const workingPauseStopHide = controlEvidence.workingTargetPaths.includes(m.path);
      const noWorkingPauseStopHide = !workingPauseStopHide && controlEvidence.completed === true;
      return {
        ...m,
        controlEvidence,
        workingPauseStopHide,
        noWorkingPauseStopHide,
        reason: workingPauseStopHide
          ? 'motion persists under prefers-reduced-motion: reduce, but an exercised pause/stop/hide control affected it'
          : 'motion persists under prefers-reduced-motion: reduce and no exercised pause/stop/hide control affected it',
      };
    }),
    scope: 'single-rendered-state',
  };
}

async function exerciseMotionControls(page, targetPaths) {
  const uniqueTargets = [...new Set((targetPaths || []).filter(Boolean).map(String))];
  if (!uniqueTargets.length) return { completed: true, controls: [], attempts: [], workingTargetPaths: [] };
  const controls = await page.evaluate(() => {
    const esc = (v) => {
      if (window.CSS && typeof window.CSS.escape === 'function') return window.CSS.escape(v);
      return String(v).replace(/["\\#.:()[\]\s]/g, '\\$&');
    };
    const visible = (el) => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0;
    };
    const label = (el) => [
      el.getAttribute('aria-label') || '',
      el.getAttribute('title') || '',
      el.value || '',
      el.innerText || el.textContent || '',
    ].join(' ').replace(/\s+/g, ' ').trim();
    const matches = (text) => /\b(pause|stop|hide|reduce motion|animation off|disable animation|turn off animation)\b/i.test(text);
    return [...document.querySelectorAll('button,a[href],[role="button"],input[type="button"],input[type="submit"]')]
      .filter((el) => visible(el) && matches(label(el)))
      .map((el, i) => {
        if (!el.id) el.setAttribute('data-broad-scope-motion-control-index', String(i));
        return {
          selector: el.id ? `#${esc(el.id)}` : `[data-broad-scope-motion-control-index="${i}"]`,
          text: label(el).slice(0, 120),
          tag: el.tagName.toLowerCase(),
        };
      });
  }).catch(() => []);

  const working = new Set();
  const attempts = [];
  const activeByPath = (snapshot) => new Map((snapshot.moving || []).map((m) => [m.path, m.active]));
  for (const control of controls) {
    const before = await page.evaluate(collectMotion).catch(() => ({ moving: [] }));
    let clicked = false;
    let error = '';
    try {
      await page.click(control.selector);
      clicked = true;
      await sleep(180);
    } catch (e) {
      error = e && e.message ? String(e.message) : String(e);
    }
    const after = await page.evaluate(collectMotion).catch(() => ({ moving: [] }));
    const beforeActive = activeByPath(before);
    const afterActive = activeByPath(after);
    const affectedTargetPaths = uniqueTargets.filter((path) => beforeActive.get(path) === true && afterActive.get(path) !== true);
    for (const path of affectedTargetPaths) working.add(path);
    attempts.push({ ...control, clicked, error, affectedTargetPaths });
    if (working.size === uniqueTargets.length) break;
  }
  return { completed: true, controls, attempts, workingTargetPaths: [...working].sort() };
}

async function probeForcedColors(page) {
  const before = await page.evaluate(collectForcedColorsSnapshot);
  const cdp = await page.createCDPSession();
  await cdp.send('Emulation.setEmulatedMedia', { features: [{ name: 'forced-colors', value: 'active' }] }).catch(() => {});
  await sleep(120);
  const after = await page.evaluate(collectForcedColorsSnapshot);
  const beforeByPath = new Map(before.elements.map((e) => [e.path, e]));
  const changed = after.elements.filter((a) => {
    const b = beforeByPath.get(a.path);
    return b && (b.color !== a.color || b.backgroundColor !== a.backgroundColor || b.borderColor !== a.borderColor || b.outlineColor !== a.outlineColor);
  });
  const candidates = after.elements.filter((a) => {
    const b = beforeByPath.get(a.path);
    const textContrastLoss = !!b && b.textContrast != null && a.textContrast != null
      && b.textContrast >= 4.5 && a.textContrast < 3;
    const nonTextBoundaryLoss = !!b && b.nonTextBoundaryContrast != null && a.nonTextBoundaryContrast != null
      && b.nonTextBoundaryContrast >= 3 && a.nonTextBoundaryContrast < 3;
    return a.forcedColorAdjust === 'none' || textContrastLoss || nonTextBoundaryLoss;
  }).map((a) => ({
    path: a.path,
    text: a.text,
    focusable: a.focusable,
    forcedColorAdjust: a.forcedColorAdjust,
    before: beforeByPath.get(a.path) || null,
    after: a,
    beforeContrast: beforeByPath.get(a.path) ? beforeByPath.get(a.path).textContrast : null,
    afterContrast: a.textContrast,
    beforeNonTextBoundaryContrast: beforeByPath.get(a.path) ? beforeByPath.get(a.path).nonTextBoundaryContrast : null,
    afterNonTextBoundaryContrast: a.nonTextBoundaryContrast,
    textContrastLoss: !!beforeByPath.get(a.path) && beforeByPath.get(a.path).textContrast != null && a.textContrast != null
      && beforeByPath.get(a.path).textContrast >= 4.5 && a.textContrast < 3,
    nonTextBoundaryLoss: !!beforeByPath.get(a.path) && beforeByPath.get(a.path).nonTextBoundaryContrast != null && a.nonTextBoundaryContrast != null
      && beforeByPath.get(a.path).nonTextBoundaryContrast >= 3 && a.nonTextBoundaryContrast < 3,
    reason: !!beforeByPath.get(a.path) && beforeByPath.get(a.path).textContrast != null && a.textContrast != null
      && beforeByPath.get(a.path).textContrast >= 4.5 && a.textContrast < 3
      ? 'forced-colors emulation changes readable text into low-contrast text on an essential surface'
      : (!!beforeByPath.get(a.path) && beforeByPath.get(a.path).nonTextBoundaryContrast != null && a.nonTextBoundaryContrast != null
        && beforeByPath.get(a.path).nonTextBoundaryContrast >= 3 && a.nonTextBoundaryContrast < 3
        ? 'forced-colors emulation removes visible non-text boundary/state contrast on an essential focusable control'
        : (a.forcedColorAdjust === 'none'
        ? 'element opts out of forced-colors adjustment; review essential boundaries/text/focus'
        : 'rendered colors changed under forced-colors; review survival of meaning and affordances')),
  }));
  return { kind: 'forced-colors-probe', before, after, changedCount: changed.length, candidates, scope: 'single-rendered-state' };
}

async function probeAudioAutoplay(page, opts = {}) {
  const waitMs = Number.isFinite(opts.waitMs) ? opts.waitMs : 3300;
  const collect = () => page.evaluate(() => {
    const pathOf = (el) => {
      if (el.id) return `#${CSS.escape(el.id)}`;
      const parts = [];
      let node = el;
      while (node && node.nodeType === Node.ELEMENT_NODE && node !== document.body) {
        const tag = node.tagName.toLowerCase();
        const siblings = [...node.parentElement.children].filter((x) => x.tagName === node.tagName);
        const nth = siblings.length > 1 ? `:nth-of-type(${siblings.indexOf(node) + 1})` : '';
        parts.unshift(`${tag}${nth}`);
        node = node.parentElement;
      }
      return parts.join('>') || el.tagName.toLowerCase();
    };
    const visible = (el) => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0;
    };
    const textOf = (el) => [
      el.innerText || el.textContent || '',
      el.getAttribute('aria-label') || '',
      el.getAttribute('title') || '',
      el.value || '',
    ].join(' ').replace(/\s+/g, ' ').trim().toLowerCase();
    const controlEls = [...document.querySelectorAll('button,[role="button"],input[type="button"],input[type="range"],a[href],[aria-controls]')];
    return [...document.querySelectorAll('audio,video')].map((m) => ({
        path: pathOf(m),
        id: m.id || '',
        tag: m.tagName.toLowerCase(),
        autoplay: m.hasAttribute('autoplay'),
        controls: m.hasAttribute('controls'),
        muted: m.muted || m.hasAttribute('muted'),
        volume: Number.isFinite(m.volume) ? m.volume : null,
        paused: m.paused,
        currentTime: Number.isFinite(m.currentTime) ? m.currentTime : null,
        duration: Number.isFinite(m.duration) ? m.duration : null,
        loop: m.loop || m.hasAttribute('loop'),
        readyState: m.readyState,
        hasSrc: !!(m.currentSrc || m.getAttribute('src')),
        knownNonSilentTone: m.getAttribute('data-v3-non-silent-tone') === 'true',
        decodedAudioBytes: Number.isFinite(m.webkitAudioDecodedByteCount) ? m.webkitAudioDecodedByteCount : null,
        visibleBox: (() => { const r = m.getBoundingClientRect(); return r.width > 0 && r.height > 0; })(),
        plausibleIndependentControls: controlEls.filter((c) => {
          if (c === m || !visible(c)) return false;
          const label = textOf(c);
          const ariaControls = (c.getAttribute('aria-controls') || '').trim();
          const namesAudioAction = /\b(pause|stop|mute|unmute|volume|audio|sound)\b/i.test(label);
          const controlsTarget = m.id && ariaControls.split(/\s+/).includes(m.id);
          return ariaControls ? controlsTarget : namesAudioAction;
        }).map((c) => ({
          path: pathOf(c),
          tag: c.tagName.toLowerCase(),
          type: (c.getAttribute('type') || '').toLowerCase(),
          label: textOf(c).slice(0, 80),
          ariaControls: c.getAttribute('aria-controls') || '',
        })),
      }));
  });
  const mediaState = (mediaPath) => page.evaluate((selector) => {
    const m = document.querySelector(selector);
    if (!m) return null;
    return {
      paused: typeof m.paused === 'boolean' ? m.paused : null,
      muted: m.muted === true || m.hasAttribute('muted'),
      volume: Number.isFinite(m.volume) ? m.volume : null,
      currentTime: Number.isFinite(m.currentTime) ? m.currentTime : null,
    };
  }, mediaPath).catch(() => null);
  const exerciseControls = async (mediaList) => {
    const effects = [];
    for (const m of mediaList) {
      for (const c of arr(m.plausibleIndependentControls)) {
        const beforeState = await mediaState(m.path);
        const handle = await page.$(c.path).catch(() => null);
        if (!beforeState || !handle) {
          effects.push({ ...c, mediaPath: m.path, tested: false, worked: false, reason: 'control or media was not queryable' });
          continue;
        }
        try {
          if (c.tag === 'input' && c.type === 'range') {
            const box = await handle.boundingBox();
            if (!box) throw new Error('range control has no rendered box');
            await page.mouse.click(box.x + 2, box.y + box.height / 2);
          } else {
            await handle.click();
          }
          await sleep(180);
          const afterState = await mediaState(m.path);
          const paused = beforeState.paused === false && afterState && afterState.paused === true;
          const muted = beforeState.muted === false && afterState && afterState.muted === true;
          const volumeReduced = Number.isFinite(beforeState.volume) && afterState && Number.isFinite(afterState.volume)
            && afterState.volume < beforeState.volume - 0.05;
          effects.push({
            ...c,
            mediaPath: m.path,
            tested: true,
            worked: !!(paused || muted || volumeReduced),
            effect: { paused, muted, volumeReduced },
            before: beforeState,
            after: afterState,
          });
        } catch (e) {
          effects.push({ ...c, mediaPath: m.path, tested: true, worked: false, reason: e && e.message ? e.message : String(e) });
        }
      }
    }
    return effects;
  };
  const before = await collect();
  await sleep(waitMs);
  const mediaRaw = await collect();
  const controlEffects = await exerciseControls(mediaRaw);
  const effectsByMediaPath = new Map();
  for (const effect of controlEffects) {
    if (!effectsByMediaPath.has(effect.mediaPath)) effectsByMediaPath.set(effect.mediaPath, []);
    effectsByMediaPath.get(effect.mediaPath).push(effect);
  }
  const media = mediaRaw.map((m) => {
    const testedIndependentControls = effectsByMediaPath.get(m.path) || [];
    return {
      ...m,
      testedIndependentControls,
      workingIndependentControls: testedIndependentControls.filter((c) => c.worked),
    };
  });
  const beforeByPath = new Map(before.map((m) => [m.path, m]));
  const candidates = media.filter((m) => (
    m.autoplay && !m.controls && !m.muted && (m.volume == null || m.volume > 0)
  )).map((m) => ({
    ...m,
    before: beforeByPath.get(m.path) || null,
    playbackObserved: m.paused === false && m.currentTime != null && m.currentTime > 0,
    playbackAdvancedAcrossWindow: !!beforeByPath.get(m.path) && beforeByPath.get(m.path).currentTime != null && m.currentTime != null
      && m.currentTime > beforeByPath.get(m.path).currentTime + Math.min(0.25, waitMs / 4000),
    durationBasisOverThreeSeconds: m.loop === true || (m.duration != null && Number.isFinite(m.duration) && m.duration > 3),
    noIndependentControlObserved: m.controls !== true && (!Array.isArray(m.workingIndependentControls) || m.workingIndependentControls.length === 0),
    audibilityObserved: m.knownNonSilentTone === true,
    autoplayOverThreeSecondsObserved: m.paused === false && m.currentTime != null && m.currentTime > 0
      && !!beforeByPath.get(m.path) && beforeByPath.get(m.path).currentTime != null
      && m.currentTime > beforeByPath.get(m.path).currentTime + Math.min(0.25, waitMs / 4000)
      && (m.loop === true || (m.duration != null && Number.isFinite(m.duration) && m.duration > 3))
      && m.knownNonSilentTone === true
      && m.controls !== true && (!Array.isArray(m.workingIndependentControls) || m.workingIndependentControls.length === 0),
    reason: m.paused === false && m.currentTime != null && m.currentTime > 0
      && !!beforeByPath.get(m.path) && beforeByPath.get(m.path).currentTime != null
      && m.currentTime > beforeByPath.get(m.path).currentTime + Math.min(0.25, waitMs / 4000)
      && (m.loop === true || (m.duration != null && Number.isFinite(m.duration) && m.duration > 3))
      && m.knownNonSilentTone === true
      && (!Array.isArray(m.workingIndependentControls) || m.workingIndependentControls.length === 0)
      ? 'known non-silent autoplaying media without independent controls was observed advancing across a >3s sampling window'
      : m.paused === false && m.currentTime != null && m.currentTime > 0
        ? 'autoplaying unmuted media without controls advanced, but duration over three seconds was not proven'
      : 'unmuted autoplay media without native controls is present, but playback/audibility was not proven',
  }));
  return { kind: 'audio-autoplay-probe', waitMs, before, media, candidates, scope: 'single-rendered-state' };
}

async function probeFlashTemporal(page, opts = {}) {
  const sampleMs = Number.isFinite(opts.sampleMs) ? opts.sampleMs : 1000;
  const stepMs = Number.isFinite(opts.stepMs) ? opts.stepMs : 100;
  const samples = [];
  const start = Date.now();
  while (Date.now() - start <= sampleMs) {
    samples.push(await page.evaluate(() => {
      const pathOf = (el) => el.id ? `#${el.id}` : el.tagName.toLowerCase();
      const rgb = (raw) => {
        const m = String(raw || '').match(/rgba?\(([^)]+)\)/i);
        if (!m) return null;
        const parts = m[1].split(',').map((x) => Number.parseFloat(x.trim()));
        return parts.length >= 3 && parts.slice(0, 3).every((n) => Number.isFinite(n)) ? parts.slice(0, 3) : null;
      };
      const linear = (v) => {
        const c = v / 255;
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
      };
      const luminance = (v) => v ? (0.2126 * linear(v[0]) + 0.7152 * linear(v[1]) + 0.0722 * linear(v[2])) : null;
      return [...document.querySelectorAll('*')].map((el) => {
        const s = getComputedStyle(el);
        const names = String(s.animationName || '').split(',').map((x) => x.trim()).filter((x) => x && x !== 'none');
        if (!names.length && !el.hasAttribute('data-v3-flash-target')) return null;
        const r = el.getBoundingClientRect();
        const bg = rgb(s.backgroundColor);
        const color = rgb(s.color);
        const redLike = (bg && bg[0] >= 180 && bg[1] <= 80 && bg[2] <= 80) || (color && color[0] >= 180 && color[1] <= 80 && color[2] <= 80);
        const bgLuminance = luminance(bg);
        const textLuminance = luminance(color);
        return {
          path: pathOf(el),
          text: (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80),
          opacity: Number.parseFloat(s.opacity || '1'),
          color: s.color,
          backgroundColor: s.backgroundColor,
          bgLuminance,
          textLuminance,
          redLike,
          animationName: names.join(','),
          animationDuration: s.animationDuration,
          animationIterationCount: s.animationIterationCount,
          box: { width: Math.round(r.width), height: Math.round(r.height), area: Math.round(r.width * r.height) },
          viewport: { width: window.innerWidth, height: window.innerHeight },
        };
      }).filter(Boolean);
    }));
    await sleep(stepMs);
  }
  const byPath = new Map();
  samples.forEach((frame, i) => {
    for (const row of frame) {
      if (!byPath.has(row.path)) byPath.set(row.path, []);
      byPath.get(row.path).push({
        i,
        opacity: row.opacity,
        bgLuminance: row.bgLuminance,
        textLuminance: row.textLuminance,
        animationDuration: row.animationDuration,
        animationIterationCount: row.animationIterationCount,
        animationName: row.animationName,
        box: row.box,
        viewport: row.viewport,
        redLike: row.redLike,
        text: row.text,
      });
    }
  });
  const candidates = [];
  for (const [path, rows] of byPath.entries()) {
    const values = rows.map((r) => r.opacity);
    const min = Math.min(...values), max = Math.max(...values);
    const bgValues = rows.map((r) => Number.isFinite(r.bgLuminance) ? r.bgLuminance : null).filter((v) => v != null);
    const bgMin = bgValues.length ? Math.min(...bgValues) : null;
    const bgMax = bgValues.length ? Math.max(...bgValues) : null;
    let crossings = 0;
    let luminanceCrossings = 0;
    let redStateCrossings = 0;
    for (let i = 1; i < values.length; i++) {
      const a = values[i - 1] >= 0.5;
      const b = values[i] >= 0.5;
      if (a !== b) crossings++;
      if (Number.isFinite(rows[i - 1].bgLuminance) && Number.isFinite(rows[i].bgLuminance)) {
        const low = bgMin != null && bgMax != null ? (bgMin + ((bgMax - bgMin) / 2)) : 0.5;
        const la = rows[i - 1].bgLuminance >= low;
        const lb = rows[i].bgLuminance >= low;
        if (la !== lb) luminanceCrossings++;
      }
      if (rows[i - 1].redLike !== rows[i].redLike) redStateCrossings++;
    }
    const first = rows[0] || {};
    const sampleSeconds = Math.max(0.001, ((rows.length - 1) * stepMs) / 1000);
    const transitionCrossings = Math.max(crossings, luminanceCrossings, redStateCrossings);
    const measuredFlashRateHz = (transitionCrossings / 2) / sampleSeconds;
    const area = first.box && Number.isFinite(first.box.area) ? first.box.area : 0;
    const generatedLargeAreaThreshold = area >= 87600;
    const redThresholdRisk = rows.some((r) => r.redLike === true);
    const opacityDelta = max - min;
    const luminanceDelta = bgMin != null && bgMax != null ? bgMax - bgMin : 0;
    const visualDeltaObserved = opacityDelta > 0.45 || luminanceDelta > 0.2 || redStateCrossings >= 3;
    const thresholdEvidenceObserved = visualDeltaObserved && measuredFlashRateHz > 3 && (generatedLargeAreaThreshold || redThresholdRisk);
    const fastCss = String(first.animationName || '').match(/flash|blink|strobe/i)
      && String(first.animationIterationCount || '').includes('infinite')
      && String(first.animationDuration || '').split(',').some((d) => parseCssTime(d) > 0 && parseCssTime(d) <= 333);
    if ((visualDeltaObserved && transitionCrossings >= 3) || fastCss) {
      candidates.push({
        path,
        samples: rows.length,
        opacityRange: Number(opacityDelta.toFixed(3)),
        luminanceRange: Number(luminanceDelta.toFixed(3)),
        thresholdCrossings: transitionCrossings,
        opacityCrossings: crossings,
        luminanceCrossings,
        redStateCrossings,
        transitionBasis: transitionCrossings === crossings
          ? 'opacity'
          : (transitionCrossings === luminanceCrossings ? 'background-luminance' : 'red-state'),
        measuredFlashRateHz: Number(measuredFlashRateHz.toFixed(2)),
        area,
        generatedLargeAreaThreshold,
        redThresholdRisk,
        thresholdEvidenceObserved,
        fastCss: !!fastCss,
        reason: thresholdEvidenceObserved
          ? 'temporal rendered-style samples show >3 flashes/second on a generated large-area or red-like flashing surface'
          : visualDeltaObserved && transitionCrossings >= 3
          ? 'temporal rendered-style samples show fast flashing risk; area/red threshold still requires review'
          : 'CSS declares fast infinite flash-like animation; temporal samples did not prove threshold, so this remains review-risk evidence',
      });
    }
  }
  return { kind: 'flash-temporal-probe', sampleMs, stepMs, candidates, sampleCount: samples.length, scope: 'single-rendered-state' };
}

async function probeContextChanges(page) {
  const targets = await page.evaluate(() => {
    const pathOf = (el) => el.id ? `#${el.id}` : el.tagName.toLowerCase();
    const textOf = (el) => (el && (el.innerText || el.textContent || '') || '').replace(/\s+/g, ' ').trim();
    const adviceFor = (el) => {
      const bits = [];
      if (el.id) {
        const label = document.querySelector(`label[for="${CSS.escape(el.id)}"]`);
        if (label) bits.push(textOf(label));
      }
      const wrapping = el.closest('label');
      if (wrapping) bits.push(textOf(wrapping));
      const describedBy = String(el.getAttribute('aria-describedby') || '').split(/\s+/).filter(Boolean);
      for (const id of describedBy) {
        const desc = document.getElementById(id);
        if (desc) bits.push(textOf(desc));
      }
      return bits.filter(Boolean).join(' ');
    };
    return [...document.querySelectorAll('input,select,textarea,button,a,[tabindex]')].filter((el) => {
      const attrs = el.getAttributeNames();
      return attrs.some((a) => /^on(focus|change|input)$/.test(a));
    }).map((el) => ({
      path: pathOf(el),
      tag: el.tagName.toLowerCase(),
      attrs: el.getAttributeNames().filter((a) => /^on(focus|change|input)$/.test(a)),
      actionType: el.hasAttribute('onfocus') ? 'focus' : el.hasAttribute('oninput') ? 'input' : 'change',
      adviceText: adviceFor(el),
    }));
  });
  const candidates = [];
  for (const t of targets) {
    const before = await page.evaluate(() => ({
      href: location.href,
      hash: location.hash,
      title: document.title,
      activeId: document.activeElement && document.activeElement.id || '',
      bodyTextLength: document.body ? (document.body.innerText || '').length : 0,
    }));
    if (t.actionType === 'focus') {
      await page.focus(t.path).catch(() => {});
    } else {
      await page.focus(t.path).catch(() => {});
      await page.keyboard.type('x').catch(() => {});
      if (t.actionType === 'change') await page.keyboard.press('Tab').catch(() => {});
    }
    await sleep(80);
    const after = await page.evaluate(() => ({
      href: location.href,
      hash: location.hash,
      title: document.title,
      activeId: document.activeElement && document.activeElement.id || '',
      bodyTextLength: document.body ? (document.body.innerText || '').length : 0,
    }));
    const changed = before.href !== after.href || before.hash !== after.hash || before.title !== after.title
      || Math.abs(before.bodyTextLength - after.bodyTextLength) > 40;
    if (changed) {
      const advice = String(t.adviceText || '');
      const advisedBeforehand = /\b(focus|focusing|select|change|opens?|moves?|navigates?|submits?|updates?|redirects?)\b/i.test(advice)
        && /\b(help|context|page|section|window|dialog|below|opens?|moves?|navigates?|submits?|updates?|redirects?)\b/i.test(advice);
      candidates.push({
        path: t.path,
        tag: t.tag,
        attrs: t.attrs,
        actionType: t.actionType,
        sc: t.actionType === 'focus' ? '3.2.1' : '3.2.2',
        before,
        after,
        adviceText: advice.slice(0, 240),
        advisedBeforehand,
        reason: advisedBeforehand
          ? 'trusted focus/input probe observed state change with advance advice text'
          : 'trusted focus/input probe observed URL/title/content state change without detected advance advice',
      });
    }
  }
  return { kind: 'context-change-probe', targets, candidates, scope: 'single-rendered-state' };
}

async function probePointerActivation(page) {
  const targets = await page.evaluate(() => {
    const pathOf = (el) => el.id ? `#${el.id}` : el.tagName.toLowerCase();
    return [...document.querySelectorAll('canvas,[draggable=true],[onpointerdown],[onmousedown],[ontouchstart],[role=slider],[role*=map i]')].map((el) => {
      const r = el.getBoundingClientRect();
      return { path: pathOf(el), tag: el.tagName.toLowerCase(), role: el.getAttribute('role') || '', x: r.x + r.width / 2, y: r.y + r.height / 2, width: r.width, height: r.height };
    }).filter((t) => t.width > 0 && t.height > 0);
  });
  const candidates = [];
  for (const t of targets) {
    const state = () => page.evaluate(() => ({
      href: location.href,
      hash: location.hash,
      activated: window.activated === true,
      bodyText: document.body ? (document.body.innerText || '').slice(0, 500) : '',
      undoOrCancelControls: [...document.querySelectorAll('button,a,[role=button]')]
        .map((el) => (el.innerText || el.textContent || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim())
        .filter((txt) => /\b(undo|cancel|reverse|reset|revert)\b/i.test(txt)),
    }));
    const sameEffectState = (a, b) => a && b
      && a.href === b.href
      && a.hash === b.hash
      && a.activated === b.activated
      && a.bodyText === b.bodyText;
    const before = await state();
    await page.mouse.move(t.x, t.y);
    await page.mouse.down();
    await sleep(80);
    const afterDown = await state();
    await page.mouse.move(t.x + Math.min(80, Math.max(20, t.width + 10)), t.y + Math.min(80, Math.max(20, t.height + 10)));
    await page.mouse.up();
    await sleep(40);
    const afterCancelLike = await state();
    const downChanged = before.href !== afterDown.href || before.hash !== afterDown.hash || before.activated !== afterDown.activated || before.bodyText !== afterDown.bodyText;
    if (downChanged) {
      const downEventCompletesAction = true;
      const noAbortUndoReversalOrUpEventCompletion = sameEffectState(afterDown, afterCancelLike)
        && !((afterCancelLike.undoOrCancelControls || []).length);
      candidates.push({
        path: t.path,
        tag: t.tag,
        role: t.role,
        before,
        afterDown,
        afterCancelLike,
        downEventCompletesAction,
        noAbortUndoReversalOrUpEventCompletion,
        reason: noAbortUndoReversalOrUpEventCompletion
          ? 'trusted pointerdown completed action and move-away/up did not abort or reveal undo/reversal controls'
          : 'trusted pointerdown caused state change before pointerup/cancel-like release; review pointer-cancellation and alternatives',
      });
    }
  }
  return { kind: 'pointer-activation-probe', targets, candidates, scope: 'single-rendered-state' };
}

async function probePointerGestures(page) {
  const initialUrl = page.url();
  const readTargets = () => page.evaluate(() => {
    const pathOf = (el) => {
      if (el.id) return `#${el.id}`;
      const tag = el.tagName.toLowerCase();
      let i = 1; for (let p = el.previousElementSibling; p; p = p.previousElementSibling) if (p.tagName === el.tagName) i++;
      return `${tag}[${i}]`;
    };
    const selectorOf = (el) => el.id ? `#${CSS.escape(el.id)}` : pathOf(el);
    const visible = (el) => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0;
    };
    const targets = [...document.querySelectorAll('[data-v3-path-gesture-target],[data-v3-pointer-gesture-target]')]
      .filter((el) => visible(el))
      .map((el) => {
        const r = el.getBoundingClientRect();
        return {
          path: pathOf(el),
          selector: selectorOf(el),
          tag: el.tagName.toLowerCase(),
          role: el.getAttribute('role') || '',
          text: (el.innerText || el.textContent || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 80),
          x: r.x + r.width / 2,
          y: r.y + r.height / 2,
          width: r.width,
          height: r.height,
          id: el.id || '',
          essential: el.getAttribute('data-v3-essential-pointer-gesture') === 'true',
          uaProvided: el.getAttribute('data-v3-ua-pointer-gesture') === 'true',
        };
      });
    const alternatives = [...document.querySelectorAll('[data-v3-pointer-gesture-alternative]')]
      .filter((el) => visible(el))
      .map((el) => {
        const r = el.getBoundingClientRect();
        return {
          path: pathOf(el),
          selector: selectorOf(el),
          x: r.x + r.width / 2,
          y: r.y + r.height / 2,
          text: (el.innerText || el.textContent || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 80),
          forAttr: el.getAttribute('data-v3-pointer-gesture-alternative-for') || '',
        };
      });
    return { targets, alternatives };
  });
  const state = (targetSelector) => page.evaluate((selector) => {
    let target = null;
    try { target = selector ? document.querySelector(selector) : null; } catch (_) { target = null; }
    if (!target) target = document.querySelector('#target');
    return {
      href: location.href,
      hash: location.hash,
      pathGestureCompleted: window.pathGestureCompleted === true || document.body.getAttribute('data-path-gesture-completed') === 'true',
      clickCompleted: window.clickCompleted === true || document.body.getAttribute('data-click-completed') === 'true',
      alternativeCompleted: window.alternativeCompleted === true || document.body.getAttribute('data-alternative-completed') === 'true',
      targetState: target?.getAttribute('data-state') || '',
      status: document.querySelector('#status')?.textContent || '',
    };
  }, targetSelector);
  const changed = (a, b) => a && b && (
    a.href !== b.href ||
    a.hash !== b.hash ||
    a.pathGestureCompleted !== b.pathGestureCompleted ||
    a.clickCompleted !== b.clickCompleted ||
    a.alternativeCompleted !== b.alternativeCompleted ||
    a.targetState !== b.targetState ||
    a.status !== b.status
  );
  const reload = async () => {
    await page.goto(initialUrl, { waitUntil: 'load', timeout: 45000 });
    await sleep(120);
  };
  const candidates = [];
  const traces = [];
  const first = await readTargets();
  for (const target of first.targets || []) {
    await reload();
    let current = (await readTargets()).targets.find((t) => t.path === target.path);
    if (!current) continue;
    const beforeGesture = await state(current.selector);
    const dx = Math.max(70, current.width / 2);
    const dy = Math.max(32, current.height / 2);
    await page.mouse.move(current.x - dx / 2, current.y);
    await page.mouse.down();
    await page.mouse.move(current.x - dx / 6, current.y, { steps: 3 });
    await page.mouse.move(current.x + dx / 6, current.y + dy, { steps: 5 });
    await page.mouse.move(current.x + dx / 2, current.y + dy, { steps: 3 });
    await page.mouse.up();
    await sleep(120);
    const afterGesture = await state(current.selector);
    const pathGestureChanged = changed(beforeGesture, afterGesture);

    await reload();
    current = (await readTargets()).targets.find((t) => t.path === target.path);
    if (!current) continue;
    const beforeClick = await state(current.selector);
    await page.mouse.click(current.x, current.y);
    await sleep(120);
    const afterClick = await state(current.selector);
    const clickChanged = changed(beforeClick, afterClick);
    const clickEquivalent = clickChanged && (
      afterGesture.targetState
        ? afterClick.targetState === afterGesture.targetState
        : (afterGesture.pathGestureCompleted && afterClick.clickCompleted)
    );

    await reload();
    const altSnapshot = await readTargets();
    const allAlternatives = altSnapshot.alternatives || [];
    const alternatives = allAlternatives.filter((alt) => {
      const ref = String(alt.forAttr || '').trim();
      if (!ref) return (altSnapshot.targets || []).length === 1;
      return ref === current.id || ref === `#${current.id}` || ref === current.path || ref === current.selector;
    });
    const beforeAlt = await state(current.selector);
    let afterAlt = beforeAlt;
    let workingAlternative = false;
    const triedAlternatives = [];
    for (const alt of alternatives) {
      await page.mouse.click(alt.x, alt.y);
      await sleep(120);
      afterAlt = await state(current.selector);
      const altChanged = changed(beforeAlt, afterAlt);
      const equivalent = altChanged && (
        afterGesture.targetState
          ? afterAlt.targetState === afterGesture.targetState
          : (afterGesture.pathGestureCompleted && afterAlt.alternativeCompleted)
      );
      triedAlternatives.push({ path: alt.path, text: alt.text, changed: altChanged, equivalent });
      if (equivalent) { workingAlternative = true; break; }
    }
    const trace = {
      path: target.path,
      tag: target.tag,
      role: target.role,
      text: target.text,
      box: { width: Math.round(target.width), height: Math.round(target.height) },
      essential: target.essential,
      uaProvided: target.uaProvided,
      pathGestureChanged,
      clickChanged,
      clickEquivalent,
      workingAlternative,
      alternatives: triedAlternatives,
      beforeGesture,
      afterGesture,
      afterClick,
      afterAlt,
    };
    traces.push(trace);
    if (pathGestureChanged && !clickEquivalent && !workingAlternative && !target.essential && !target.uaProvided) {
      candidates.push({
        ...trace,
        reason: 'trusted path gesture changed functionality, a simple target click did not reach the same observed state, and no target-scoped marked simple-pointer alternative reached the same observed state',
      });
    }
  }
  return { kind: 'pointer-gesture-probe', targets: first.targets || [], traces, candidates, scope: 'single-rendered-state' };
}

async function probeDraggingMovements(page) {
  const initialUrl = page.url();
  const readTargets = () => page.evaluate(() => {
    const pathOf = (el) => {
      if (el.id) return `#${el.id}`;
      const tag = el.tagName.toLowerCase();
      let i = 1; for (let p = el.previousElementSibling; p; p = p.previousElementSibling) if (p.tagName === el.tagName) i++;
      return `${tag}[${i}]`;
    };
    const selectorOf = (el) => el.id ? `#${CSS.escape(el.id)}` : pathOf(el);
    const visible = (el) => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0;
    };
    const targets = [...document.querySelectorAll('[data-v3-drag-target],[draggable=true],[role=slider]')]
      .filter((el) => visible(el))
      .map((el) => {
        const r = el.getBoundingClientRect();
        return {
          path: pathOf(el),
          selector: selectorOf(el),
          tag: el.tagName.toLowerCase(),
          role: el.getAttribute('role') || '',
          text: (el.innerText || el.textContent || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 80),
          x: r.x + r.width / 2,
          y: r.y + r.height / 2,
          width: r.width,
          height: r.height,
          id: el.id || '',
          essential: el.getAttribute('data-v3-essential-drag') === 'true',
          uaProvided: el.getAttribute('data-v3-ua-drag') === 'true',
        };
      });
    const alternatives = [...document.querySelectorAll('[data-v3-drag-alternative]')]
      .filter((el) => visible(el))
      .map((el) => {
        const r = el.getBoundingClientRect();
        return {
          path: pathOf(el),
          selector: selectorOf(el),
          x: r.x + r.width / 2,
          y: r.y + r.height / 2,
          text: (el.innerText || el.textContent || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 80),
          forAttr: el.getAttribute('data-v3-drag-alternative-for') || '',
        };
      });
    return { targets, alternatives };
  });
  const state = (targetSelector) => page.evaluate((selector) => {
    let target = null;
    try { target = selector ? document.querySelector(selector) : null; } catch (_) { target = null; }
    if (!target) target = document.querySelector('#target');
    return {
      href: location.href,
      hash: location.hash,
      dragCompleted: window.dragCompleted === true || document.body.getAttribute('data-drag-completed') === 'true',
      clickCompleted: window.clickCompleted === true || document.body.getAttribute('data-click-completed') === 'true',
      alternativeCompleted: window.alternativeCompleted === true || document.body.getAttribute('data-alternative-completed') === 'true',
      targetState: target?.getAttribute('data-state') || '',
      status: document.querySelector('#status')?.textContent || '',
    };
  }, targetSelector);
  const changed = (a, b) => a && b && (
    a.href !== b.href ||
    a.hash !== b.hash ||
    a.dragCompleted !== b.dragCompleted ||
    a.clickCompleted !== b.clickCompleted ||
    a.alternativeCompleted !== b.alternativeCompleted ||
    a.targetState !== b.targetState ||
    a.status !== b.status
  );
  const reload = async () => {
    await page.goto(initialUrl, { waitUntil: 'load', timeout: 45000 });
    await sleep(120);
  };
  const candidates = [];
  const traces = [];
  const first = await readTargets();
  for (const target of first.targets || []) {
    await reload();
    let current = (await readTargets()).targets.find((t) => t.path === target.path);
    if (!current) continue;
    const beforeDrag = await state(current.selector);
    await page.mouse.move(current.x, current.y);
    await page.mouse.down();
    await page.mouse.move(current.x + Math.max(60, current.width + 40), current.y, { steps: 8 });
    await page.mouse.up();
    await sleep(120);
    const afterDrag = await state(current.selector);
    const dragChanged = changed(beforeDrag, afterDrag);

    await reload();
    current = (await readTargets()).targets.find((t) => t.path === target.path);
    if (!current) continue;
    const beforeClick = await state(current.selector);
    await page.mouse.click(current.x, current.y);
    await sleep(120);
    const afterClick = await state(current.selector);
    const clickChanged = changed(beforeClick, afterClick);
    const clickEquivalent = clickChanged && (
      afterDrag.targetState
        ? afterClick.targetState === afterDrag.targetState
        : (afterDrag.dragCompleted && afterClick.clickCompleted)
    );

    await reload();
    const altSnapshot = await readTargets();
    const allAlternatives = altSnapshot.alternatives || [];
    const alternatives = allAlternatives.filter((alt) => {
      const ref = String(alt.forAttr || '').trim();
      if (!ref) return (altSnapshot.targets || []).length === 1;
      return ref === current.id || ref === `#${current.id}` || ref === current.path || ref === current.selector;
    });
    const beforeAlt = await state(current.selector);
    let afterAlt = beforeAlt;
    let workingAlternative = false;
    const triedAlternatives = [];
    for (const alt of alternatives) {
      await page.mouse.click(alt.x, alt.y);
      await sleep(120);
      afterAlt = await state(current.selector);
      const altChanged = changed(beforeAlt, afterAlt);
      const equivalent = altChanged && (
        afterDrag.targetState
          ? afterAlt.targetState === afterDrag.targetState
          : (afterDrag.dragCompleted && afterAlt.alternativeCompleted)
      );
      triedAlternatives.push({ path: alt.path, text: alt.text, changed: altChanged, equivalent });
      if (equivalent) { workingAlternative = true; break; }
    }
    const trace = {
      path: target.path,
      tag: target.tag,
      role: target.role,
      text: target.text,
      box: { width: Math.round(target.width), height: Math.round(target.height) },
      essential: target.essential,
      uaProvided: target.uaProvided,
      dragChanged,
      clickChanged,
      clickEquivalent,
      workingAlternative,
      alternatives: triedAlternatives,
      beforeDrag,
      afterDrag,
      afterClick,
      afterAlt,
    };
    traces.push(trace);
    if (dragChanged && !clickEquivalent && !workingAlternative && !target.essential && !target.uaProvided) {
      candidates.push({
        ...trace,
        reason: 'trusted drag changed functionality, a simple target click did not reach the same observed state, and no target-scoped marked simple-pointer alternative reached the same observed state',
      });
    }
  }
  return { kind: 'dragging-movement-probe', targets: first.targets || [], traces, candidates, scope: 'single-rendered-state' };
}

async function probeRevealStates(page, opts = {}) {
  const waitMs = Number.isFinite(opts.waitMs) ? opts.waitMs : 180;
  const limit = Number.isFinite(opts.limit) ? opts.limit : 20;
  const controls = await page.evaluate((max) => {
    const esc = (s) => (window.CSS && CSS.escape) ? CSS.escape(s) : String(s).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
    const pathOf = (el) => {
      if (el.id) return `#${esc(el.id)}`;
      const tag = el.tagName.toLowerCase();
      if (!el.parentElement) return tag;
      let i = 1;
      for (let p = el.previousElementSibling; p; p = p.previousElementSibling) {
        if (p.tagName === el.tagName) i++;
      }
      return `${pathOf(el.parentElement)} > ${tag}:nth-of-type(${i})`;
    };
    const label = (el) => (el.innerText || el.textContent || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim();
    const nodes = [
      ...document.querySelectorAll([
        '[data-v3-reveal-trigger]',
        '[aria-expanded][aria-controls]',
        '[role="tab"][aria-controls]',
        'details > summary',
        '[popover] + button',
        'button[popovertarget]',
        '[role="button"][popovertarget]',
        'button[aria-haspopup]',
        '[role="button"][aria-haspopup]',
        'button[data-reveal]',
        '[role="button"][data-reveal]',
      ].join(', ')),
    ];
    const unique = [...new Set(nodes)];
    return unique.slice(0, max).map((el) => {
      const details = el.tagName.toLowerCase() === 'summary' ? el.closest('details') : null;
      return {
        path: pathOf(el),
        tag: el.tagName.toLowerCase(),
        text: label(el),
        controls: el.getAttribute('aria-controls') || '',
        ariaExpanded: el.getAttribute('aria-expanded'),
        ariaSelected: el.getAttribute('aria-selected'),
        detailsOpen: details ? details.open : null,
        disabled: el.disabled === true || el.getAttribute('aria-disabled') === 'true',
      };
    });
  }, limit);
  const observations = [];
  const candidates = [];
  const snapshot = async () => page.evaluate(() => {
    const esc = (s) => (window.CSS && CSS.escape) ? CSS.escape(s) : String(s).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
    const pathOf = (el) => {
      if (el.id) return `#${esc(el.id)}`;
      const tag = el.tagName.toLowerCase();
      if (!el.parentElement) return tag;
      let i = 1;
      for (let p = el.previousElementSibling; p; p = p.previousElementSibling) {
        if (p.tagName === el.tagName) i++;
      }
      return `${pathOf(el.parentElement)} > ${tag}:nth-of-type(${i})`;
    };
    const visible = (el) => {
      if (!el || el.hidden) return false;
      const closedDetails = el.closest && el.closest('details:not([open])');
      if (closedDetails && el.tagName !== 'SUMMARY' && el !== closedDetails) return false;
      const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    const focusableSel = 'a[href],button,input,textarea,select,[tabindex]:not([tabindex="-1"])';
    return [...document.querySelectorAll('body *')].filter(visible).map((el) => ({
      path: pathOf(el),
      tag: el.tagName.toLowerCase(),
      text: (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 120),
      role: el.getAttribute('role') || '',
      focusable: el.matches(focusableSel) && !el.disabled && el.getAttribute('aria-disabled') !== 'true',
      heading: /^H[1-6]$/.test(el.tagName),
      list: ['UL', 'OL', 'DL'].includes(el.tagName) || /^(list|listbox|tree|grid|table)$/.test(el.getAttribute('role') || ''),
      box: (() => {
        const r = el.getBoundingClientRect();
        return { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) };
      })(),
    })).filter((x) => x.text || x.focusable || x.heading || x.list);
  });
  const controlState = async (path) => page.evaluate((selector) => {
    const el = document.querySelector(selector);
    if (!el) return null;
    const details = el.tagName.toLowerCase() === 'summary' ? el.closest('details') : null;
    const controlled = el.getAttribute('aria-controls') ? document.getElementById(el.getAttribute('aria-controls')) : null;
    const visible = (node) => {
      if (!node || node.hidden) return false;
      const closedDetails = node.closest && node.closest('details:not([open])');
      if (closedDetails && node.tagName !== 'SUMMARY' && node !== closedDetails) return false;
      const s = getComputedStyle(node);
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
      const r = node.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    return {
      ariaExpanded: el.getAttribute('aria-expanded'),
      ariaSelected: el.getAttribute('aria-selected'),
      detailsOpen: details ? details.open : null,
      popoverOpen: el.getAttribute('popovertarget') ? document.getElementById(el.getAttribute('popovertarget'))?.matches(':popover-open') || false : null,
      controlledVisible: controlled ? visible(controlled) : null,
      activeElementId: document.activeElement && document.activeElement.id || '',
    };
  }, path).catch(() => null);
  for (const c of controls) {
    if (!c.path || c.disabled) {
      observations.push({ ...c, skipped: true, reason: 'disabled-or-unresolvable' });
      continue;
    }
    const before = await snapshot();
    const beforeState = await controlState(c.path);
    const handle = await page.$(c.path);
    if (!handle) {
      observations.push({ ...c, skipped: true, reason: 'control-not-found' });
      continue;
    }
    await handle.click().catch(() => {});
    await sleep(waitMs);
    const after = await snapshot();
    const afterState = await controlState(c.path);
    const beforeKeys = new Set(before.map((x) => `${x.path}|${x.tag}|${x.focusable}`));
    const newVisible = after.filter((x) => !beforeKeys.has(`${x.path}|${x.tag}|${x.focusable}`));
    const newInteresting = newVisible.filter((x) => (
      x.tag !== 'body' && x.tag !== 'main' && (x.focusable || x.heading || x.list || x.text.length >= 8)
    ));
    const stateReached = !!(
      (beforeState && afterState && beforeState.ariaExpanded !== 'true' && afterState.ariaExpanded === 'true') ||
      (beforeState && afterState && beforeState.ariaSelected !== 'true' && afterState.ariaSelected === 'true') ||
      (beforeState && afterState && beforeState.detailsOpen === false && afterState.detailsOpen === true) ||
      (beforeState && afterState && beforeState.popoverOpen === false && afterState.popoverOpen === true) ||
      (beforeState && afterState && beforeState.controlledVisible === false && afterState.controlledVisible === true)
    );
    const implicitVisualStateReached = !stateReached && newInteresting.length > 0 && (
      c.controls === '' || (beforeState && afterState && beforeState.controlledVisible == null && afterState.controlledVisible == null)
    );
    const obs = {
      ...c,
      beforeState,
      afterState,
      stateReached: stateReached || implicitVisualStateReached,
      explicitProgrammaticStateReached: stateReached,
      implicitVisualStateReached,
      newVisibleCount: newVisible.length,
      newInteresting: newInteresting.slice(0, 12),
    };
    observations.push(obs);
    if ((stateReached || implicitVisualStateReached) && newInteresting.length) {
      candidates.push({
        path: c.path,
        reason: stateReached
          ? 'trusted activation revealed new visible content or focusable descendants; newly reached state needs downstream WCAG/TT checks'
          : 'trusted activation revealed new visible content without a complete programmatic state relation; this is discovery evidence only and needs downstream WCAG/TT checks',
        beforeState,
        afterState,
        newInteresting: newInteresting.slice(0, 12),
        explicitProgrammaticStateReached: stateReached,
        implicitVisualStateReached,
        evidenceClaims: ['trusted-reveal-action', 'state-reached', 'newly-rendered-content-or-focusable'],
      });
    }
  }
  return { kind: 'reveal-state-discovery', waitMs, observations, candidates };
}

async function probeVisualStructureDiscovery(page, opts = {}) {
  const limit = Number.isFinite(opts.limit) ? opts.limit : 50;
  return page.evaluate((max) => {
    const esc = (s) => (window.CSS && CSS.escape) ? CSS.escape(s) : String(s).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
    const pathOf = (el) => {
      if (el.id) return `#${esc(el.id)}`;
      const tag = el.tagName.toLowerCase();
      if (!el.parentElement) return tag;
      let i = 1;
      for (let p = el.previousElementSibling; p; p = p.previousElementSibling) {
        if (p.tagName === el.tagName) i++;
      }
      return `${pathOf(el.parentElement)} > ${tag}:nth-of-type(${i})`;
    };
    const textOf = (el) => (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
    const visible = (el) => {
      if (!el || el.hidden) return false;
      const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    const semanticHeading = (el) => /^H[1-6]$/.test(el.tagName) || (el.getAttribute('role') || '').toLowerCase() === 'heading';
    const semanticList = (el) => ['UL', 'OL', 'DL'].includes(el.tagName) || /^(list|listbox|tree|menu)$/.test((el.getAttribute('role') || '').toLowerCase());
    const semanticTable = (el) => el.tagName === 'TABLE' || /^(table|grid|treegrid)$/.test((el.getAttribute('role') || '').toLowerCase());
    const semanticListItem = (el) => el.tagName === 'LI' || (el.getAttribute('role') || '').toLowerCase() === 'listitem';
    const candidates = [];
    const observations = [];
    for (const el of [...document.querySelectorAll('body *')]) {
      if (!visible(el)) continue;
      const text = textOf(el);
      if (!text || text.length < 2) continue;
      const tag = el.tagName.toLowerCase();
      const role = (el.getAttribute('role') || '').toLowerCase();
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const fontSize = Number.parseFloat(s.fontSize) || 0;
      const fontWeight = Number.parseInt(s.fontWeight, 10) || 400;
      const children = [...el.children].filter(visible);
      const directTexts = children.map(textOf).filter((t) => t.length >= 2);
      const bulletChildren = children.filter((c) => /^[•●▪◦\-*]\s+\S/.test(textOf(c)) || getComputedStyle(c, '::before').content.replace(/^["']|["']$/g, '').match(/^[•●▪◦\-*]$/));
      const gridChildren = children.filter((c) => {
        const cs = getComputedStyle(c);
        const cr = c.getBoundingClientRect();
        return textOf(c).length >= 1 && cr.width > 0 && cr.height > 0 && cs.display !== 'none';
      });
      const visualHeading = !semanticHeading(el)
        && !['button', 'a', 'label', 'input', 'textarea', 'select', 'summary'].includes(tag)
        && !el.closest('h1,h2,h3,h4,h5,h6,[role="heading"]')
        && text.length >= 3 && text.length <= 90
        && (fontSize >= 22 || (fontSize >= 18 && fontWeight >= 650))
        && r.height <= Math.max(80, fontSize * 3.2)
        && children.length <= 2;
      if (visualHeading) {
        const obs = {
          path: pathOf(el),
          kind: 'visual-heading',
          sc: '1.3.1/2.4.6/2.4.10',
          tag,
          role,
          text: text.slice(0, 120),
          fontSize,
          fontWeight,
          box: { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) },
        };
        observations.push(obs);
        candidates.push({
          ...obs,
          reason: 'rendered text appears heading-like but is not a programmatic heading; downstream structure/section-heading review needed',
          evidenceClaims: ['rendered-visual-structure-signal', 'programmatic-structure-missing', 'content-region-observed'],
        });
        if (candidates.length >= max) break;
        continue;
      }
      const visualList = !semanticList(el)
        && !el.closest('ul,ol,dl,[role="list"],[role="listbox"],[role="tree"],[role="menu"]')
        && directTexts.length >= 3
        && bulletChildren.length >= 3
        && children.every((c) => !semanticListItem(c));
      if (visualList) {
        const obs = {
          path: pathOf(el),
          kind: 'visual-list',
          sc: '1.3.1',
          tag,
          role,
          items: directTexts.slice(0, 8),
          box: { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) },
        };
        observations.push(obs);
        candidates.push({
          ...obs,
          reason: 'rendered bullet-like group appears list-like but is not a programmatic list; downstream info-and-relationships review needed',
          evidenceClaims: ['rendered-visual-structure-signal', 'programmatic-structure-missing', 'content-region-observed'],
        });
        if (candidates.length >= max) break;
        continue;
      }
      const displayGrid = s.display.includes('grid');
      const visualTable = !semanticTable(el)
        && !el.closest('table,[role="table"],[role="grid"],[role="treegrid"]')
        && gridChildren.length >= 6
        && (displayGrid || el.getAttribute('data-v3-visual-table') === 'true')
        && ((s.gridTemplateColumns || '').split(' ').filter(Boolean).length >= 2 || el.getAttribute('data-v3-visual-table') === 'true');
      if (visualTable) {
        const obs = {
          path: pathOf(el),
          kind: 'visual-table',
          sc: '1.3.1',
          tag,
          role,
          cells: directTexts.slice(0, 12),
          box: { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) },
        };
        observations.push(obs);
        candidates.push({
          ...obs,
          reason: 'rendered grid/table-like layout appears tabular but is not a programmatic table/grid; downstream info-and-relationships review needed',
          evidenceClaims: ['rendered-visual-structure-signal', 'programmatic-structure-missing', 'content-region-observed'],
        });
        if (candidates.length >= max) break;
      }
    }
    return { kind: 'visual-structure-discovery', observations, candidates };
  }, limit);
}

async function probeVisualContentDiscovery(page, opts = {}) {
  const limit = Number.isFinite(opts.limit) ? opts.limit : 50;
  return page.evaluate((max) => {
    const esc = (s) => (window.CSS && CSS.escape) ? CSS.escape(s) : String(s).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
    const pathOf = (el) => {
      if (el.id) return `#${esc(el.id)}`;
      const tag = el.tagName.toLowerCase();
      if (!el.parentElement) return tag;
      let i = 1;
      for (let p = el.previousElementSibling; p; p = p.previousElementSibling) {
        if (p.tagName === el.tagName) i++;
      }
      return `${pathOf(el.parentElement)} > ${tag}:nth-of-type(${i})`;
    };
    const textOf = (el) => (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
    const visible = (el) => {
      if (!el || el.hidden) return false;
      const s = getComputedStyle(el);
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false;
      const r = el.getBoundingClientRect();
      return r.width > 0 && r.height > 0;
    };
    const explicitAlternativeText = (el) => [
      el.getAttribute('aria-label'),
      el.getAttribute('alt'),
      el.getAttribute('title'),
      el.getAttribute('data-v3-visual-alternative'),
      el.getAttribute('data-v3-text-alternative'),
    ].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
    const referencedText = (el) => {
      const ids = `${el.getAttribute('aria-labelledby') || ''} ${el.getAttribute('aria-describedby') || ''}`.trim().split(/\s+/).filter(Boolean);
      return ids.map((id) => document.getElementById(id)).filter(Boolean).map(textOf).join(' ').trim();
    };
    const declaredFacts = (el) => {
      const explicitAlt = `${explicitAlternativeText(el)} ${referencedText(el)}`.replace(/\s+/g, ' ').trim();
      const decorativeDeclared = el.getAttribute('aria-hidden') === 'true'
        || el.getAttribute('role') === 'presentation'
        || el.getAttribute('role') === 'none'
        || el.getAttribute('data-v3-decorative') === 'true';
      const nonColorCueDeclared = el.getAttribute('data-v3-has-noncolor-cue') === 'true';
      const alternativeDeclared = explicitAlt.length > 0 || nonColorCueDeclared;
      const alternativeAdequacyProven = el.getAttribute('data-v3-visual-alternative-adequate') === 'true'
        || el.getAttribute('data-v3-text-alternative-adequate') === 'true'
        || nonColorCueDeclared;
      return {
        explicitAlt,
        decorativeDeclared,
        nonColorCueDeclared,
        alternativeDeclared,
        alternativeAdequacyProven,
      };
    };
    const suppressCandidate = (facts) => {
      if (facts.decorativeDeclared) return true;
      if (facts.alternativeAdequacyProven) return true;
      return false;
    };
    const candidates = [];
    const observations = [];
    for (const el of [...document.querySelectorAll('[data-v3-visual-content], canvas, svg, [data-v3-color-only], [data-v3-bg-image-text]')]) {
      if (!visible(el)) continue;
      const tag = el.tagName.toLowerCase();
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      const bgImage = s.backgroundImage && s.backgroundImage !== 'none' ? s.backgroundImage : '';
      const kind = el.getAttribute('data-v3-visual-content')
        || (el.hasAttribute('data-v3-bg-image-text') ? 'background-image-text'
          : (el.hasAttribute('data-v3-color-only') ? 'color-only-information'
            : (tag === 'canvas' ? 'canvas-visual-content'
              : (tag === 'svg' ? 'svg-visual-content' : 'visual-content'))));
      const sc = kind === 'background-image-text'
        ? '1.4.5/1.1.1'
        : (kind === 'color-only-information' ? '1.4.1/1.1.1' : '1.1.1');
      const facts = declaredFacts(el);
      const observation = {
        path: pathOf(el),
        kind,
        sc,
        tag,
        role: el.getAttribute('role') || '',
        text: textOf(el).slice(0, 120),
        altText: facts.explicitAlt.slice(0, 160),
        decorative: facts.decorativeDeclared,
        alternativeDeclared: facts.alternativeDeclared,
        alternativeAdequacyProven: facts.alternativeAdequacyProven,
        nonColorCueDeclared: facts.nonColorCueDeclared,
        suppressCandidate: suppressCandidate(facts),
        backgroundImage: bgImage ? 'present' : '',
        color: s.color,
        backgroundColor: s.backgroundColor,
        box: { x: Math.round(r.x), y: Math.round(r.y), width: Math.round(r.width), height: Math.round(r.height) },
      };
      observations.push(observation);
      if (!observation.suppressCandidate) {
        candidates.push({
          ...observation,
          reason: `${kind} is rendered without proven adequate semantic/text/non-color alternative evidence; downstream WCAG visual-content review needed`,
          evidenceClaims: ['rendered-non-dom-visual-content-signal', 'semantic-alternative-missing-or-unproven', 'content-region-observed'],
        });
        if (candidates.length >= max) break;
      }
    }
    return { kind: 'visual-content-discovery', observations, candidates };
  }, limit);
}

async function probeCharacterShortcuts(page) {
  const surfaces = await page.evaluate(() => {
    const pathOf = (el) => {
      if (el.id) return `#${el.id}`;
      const tag = el.tagName.toLowerCase();
      let i = 1; for (let p = el.previousElementSibling; p; p = p.previousElementSibling) if (p.tagName === el.tagName) i++;
      return `${tag}[${i}]`;
    };
    const visible = (el) => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0;
    };
    const textOf = (el) => [
      el.getAttribute('aria-label') || '',
      el.getAttribute('title') || '',
      el.value || '',
      el.innerText || el.textContent || '',
    ].join(' ').replace(/\s+/g, ' ').trim();
    const keyTokens = (el) => [
      el.getAttribute('data-shortcut-key') || '',
      el.getAttribute('aria-keyshortcuts') || '',
    ].join(' ').split(/\s+/).map((x) => x.trim()).filter(Boolean);
    const singlePrintable = (token) => token.length === 1 && /^[ -~]$/.test(token);
    const modifiedPrintable = (token) => /(^|\+)(alt|control|ctrl|meta|shift)\+/i.test(token) || /\+(.)$/i.test(token);
    const controls = [...document.querySelectorAll('button,a[href],[role="button"],input[type="button"],input[type="submit"]')]
      .filter((el) => visible(el) && /\b(turn off|disable|shortcuts off|remap|change shortcut|keyboard shortcut settings)\b/i.test(textOf(el)))
      .map((el) => ({ path: pathOf(el), text: textOf(el).slice(0, 120) }));
    const targets = [];
    const modifiedTargets = [];
    for (const el of [...document.querySelectorAll('[data-shortcut-key],[aria-keyshortcuts],[onkeydown],[onkeypress],[onkeyup]')]) {
      if (!visible(el) && el !== document.body) continue;
      const rawTokens = keyTokens(el);
      const tokens = rawTokens.filter(singlePrintable);
      if (!tokens.length) {
        if (rawTokens.some(modifiedPrintable)) {
          modifiedTargets.push({
            path: pathOf(el),
            tokens: rawTokens,
            text: textOf(el).slice(0, 120),
          });
        }
        continue;
      }
      targets.push({
        path: pathOf(el),
        key: tokens[0],
        rawTokens,
        text: textOf(el).slice(0, 120),
        focusScoped: (el.getAttribute('data-shortcut-scope') || '').toLowerCase() === 'focus',
        controls,
      });
    }
    return { targets, modifiedTargets, controls };
  });

  const state = async () => page.evaluate(() => {
    const interestingAttrs = (el) => {
      const out = {};
      for (const a of el.getAttributeNames ? el.getAttributeNames() : []) {
        if (/^(aria-|data-|class$|hidden$|disabled$|checked$|selected$|open$|value$)/i.test(a)) {
          out[a] = String(el.getAttribute(a) || '').slice(0, 160);
        }
      }
      return out;
    };
    const nodes = [...document.body.querySelectorAll('*')].slice(0, 220)
      .filter((el) => {
        const s = getComputedStyle(el);
        return s.display !== 'none' && s.visibility !== 'hidden';
      })
      .map((el) => ({
        tag: el.tagName.toLowerCase(),
        id: el.id || '',
        role: el.getAttribute('role') || '',
        text: String(el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 200),
        attrs: interestingAttrs(el),
      }));
    return {
      href: location.href,
      hash: location.hash,
      title: document.title,
      shortcutActivated: window.shortcutActivated === true || document.body.getAttribute('data-shortcut-activated') === 'true',
      shortcutActivationCount: Number(window.shortcutActivationCount || 0),
      targetActivated: document.querySelector('#target')?.getAttribute('data-activated') || '',
      status: document.querySelector('#status')?.textContent || '',
      activeTag: document.activeElement ? document.activeElement.tagName.toLowerCase() : '',
      activeId: document.activeElement ? document.activeElement.id || '' : '',
      domSignature: JSON.stringify(nodes),
    };
  });

  const changedBetween = (before, after) => before.href !== after.href
    || before.hash !== after.hash
    || before.title !== after.title
    || before.shortcutActivated !== after.shortcutActivated
    || before.shortcutActivationCount !== after.shortcutActivationCount
    || before.targetActivated !== after.targetActivated
    || before.status !== after.status
    || before.domSignature !== after.domSignature;
  const reload = async () => {
    await page.reload({ waitUntil: 'load', timeout: 45000 }).catch(() => null);
    await sleep(120);
  };
  const focusBody = () => page.evaluate(() => {
    if (!document.body.hasAttribute('tabindex')) document.body.setAttribute('tabindex', '-1');
    document.body.focus();
    if (document.activeElement && /^(input|textarea|select)$/i.test(document.activeElement.tagName)) document.activeElement.blur();
  }).catch(() => {});
  const candidates = [];
  const observations = [];
  for (const t of surfaces.targets || []) {
    await focusBody();
    const before = await state();
    await page.keyboard.press(t.key);
    await sleep(120);
    const after = await state();
    const changed = changedBetween(before, after);
    let focusedActivation = null;
    if (t.focusScoped) {
      await reload();
      await page.focus(t.path).catch(() => null);
      const focusedBefore = await state();
      await page.keyboard.press(t.key);
      await sleep(120);
      const focusedAfter = await state();
      focusedActivation = {
        before: focusedBefore,
        after: focusedAfter,
        changed: changedBetween(focusedBefore, focusedAfter),
      };
    }
    const testedControls = [];
    if (changed && !t.focusScoped) {
      for (const control of t.controls || []) {
        await reload();
        const controlHandle = await page.$(control.path).catch(() => null);
        if (!controlHandle) {
          testedControls.push({ ...control, tested: false, worked: false, reason: 'control not queryable' });
          continue;
        }
        await controlHandle.click().catch(() => null);
        await sleep(120);
        await focusBody();
        const controlBefore = await state();
        await page.keyboard.press(t.key);
        await sleep(120);
        const controlAfter = await state();
        const changedAfterControl = changedBetween(controlBefore, controlAfter);
        testedControls.push({
          ...control,
          tested: true,
          worked: !changedAfterControl,
          before: controlBefore,
          after: controlAfter,
          changedAfterControl,
        });
      }
    }
    const workingControls = testedControls.filter((c) => c.worked);
    const noOffRemapOrFocusScopeException = changed && !t.focusScoped && !workingControls.length;
    observations.push({
      path: t.path,
      key: t.key,
      rawTokens: t.rawTokens || [],
      focusScoped: t.focusScoped,
      bodyActivation: { before, after, changed },
      focusedActivation,
      controls: t.controls || [],
      testedControls,
      workingControls,
      noOffRemapOrFocusScopeException,
    });
    if (changed && noOffRemapOrFocusScopeException) {
      candidates.push({
        path: t.path,
        key: t.key,
        before,
        after,
        controls: t.controls || [],
        testedControls,
        workingControls,
        focusScoped: t.focusScoped,
        noOffRemapOrFocusScopeException,
        reason: `trusted single printable character "${t.key}" changed page state with no off/remap/focus-scope exception observed`,
      });
    }
  }
  return {
    kind: 'character-shortcut-probe',
    targets: surfaces.targets || [],
    modifiedTargets: surfaces.modifiedTargets || [],
    controls: surfaces.controls || [],
    observations,
    candidates,
    scope: 'single-rendered-state',
  };
}

async function probeStatusMessages(page) {
  const nativeDialogs = [];
  const dialogHandler = async (dialog) => {
    nativeDialogs.push({
      type: typeof dialog.type === 'function' ? dialog.type() : '',
      message: typeof dialog.message === 'function' ? dialog.message() : '',
      defaultValue: typeof dialog.defaultValue === 'function' ? dialog.defaultValue() : '',
      time: Date.now(),
    });
    await dialog.accept().catch(() => {});
  };
  page.on('dialog', dialogHandler);
  await page.evaluate(() => {
    if (window.__v3StatusProbeInstalled) return;
    window.__v3StatusProbeInstalled = true;
    window.__v3StatusAnnouncements = [];
    const pathOf = (el) => {
      if (!el) return '';
      if (el.id) return `#${el.id}`;
      const tag = el.tagName.toLowerCase();
      let i = 1; for (let p = el.previousElementSibling; p; p = p.previousElementSibling) if (p.tagName === el.tagName) i++;
      return `${tag}[${i}]`;
    };
    window.__v3AnnounceStatus = (message, target = null) => {
      window.__v3StatusAnnouncements.push({
        message: String(message || ''),
        targetPath: target && target.nodeType === 1 ? pathOf(target) : '',
        time: Date.now(),
        source: 'page-programmatic-announcement',
      });
    };
    if (document.ariaNotify && typeof document.ariaNotify === 'function' && !document.__v3OriginalAriaNotify) {
      document.__v3OriginalAriaNotify = document.ariaNotify.bind(document);
      document.ariaNotify = (...args) => {
        const message = args.length ? String(args[0] || '') : '';
        window.__v3StatusAnnouncements.push({
          message,
          targetPath: '',
          time: Date.now(),
          source: 'document.ariaNotify',
        });
        return document.__v3OriginalAriaNotify(...args);
      };
    }
    document.addEventListener('click', (event) => {
      window.__v3LastStatusActivation = {
        type: 'click',
        isTrusted: event.isTrusted === true,
        targetPath: pathOf(event.target),
        time: Date.now(),
      };
    }, true);
  }).catch(() => {});
  const targets = await page.evaluate(() => {
    const pathOf = (el) => {
      if (el.id) return `#${el.id}`;
      const tag = el.tagName.toLowerCase();
      let i = 1; for (let p = el.previousElementSibling; p; p = p.previousElementSibling) if (p.tagName === el.tagName) i++;
      return `${tag}[${i}]`;
    };
    const selectorOf = (el) => {
      if (el.id) return `#${CSS.escape(el.id)}`;
      const parts = [];
      for (let cur = el; cur && cur.nodeType === 1 && cur.tagName.toLowerCase() !== 'html'; cur = cur.parentElement) {
        const tag = cur.tagName.toLowerCase();
        let i = 1;
        for (let p = cur.previousElementSibling; p; p = p.previousElementSibling) if (p.tagName === cur.tagName) i++;
        parts.unshift(`${tag}:nth-of-type(${i})`);
      }
      return parts.length ? parts.join(' > ') : null;
    };
    const visible = (el) => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0;
    };
    return [...document.querySelectorAll('[data-v3-status-trigger],button,input[type=button],input[type=submit],[role=button]')]
      .filter((el) => visible(el))
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { path: pathOf(el), selector: selectorOf(el), x: r.x + r.width / 2, y: r.y + r.height / 2 };
      });
  });

  const snapshot = async () => page.evaluate(() => {
    const pathOf = (el) => {
      if (!el) return '';
      if (el.id) return `#${el.id}`;
      const tag = el.tagName.toLowerCase();
      let i = 1; for (let p = el.previousElementSibling; p; p = p.previousElementSibling) if (p.tagName === el.tagName) i++;
      return `${tag}[${i}]`;
    };
    const visible = (el) => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0;
    };
    const inOpenDialog = (el) => {
      const dialog = el.closest('dialog,[role="dialog"],[role="alertdialog"],[aria-modal="true"]');
      if (!dialog) return false;
      return dialog.matches('dialog') ? dialog.open === true : true;
    };
    const inDisclosureContent = (el) => !!el.closest('[data-v3-disclosure-content],[data-v3-expanded-content]');
    const hasProgrammaticStatus = (el) => {
      for (let cur = el; cur; cur = cur.parentElement) {
        const role = String(cur.getAttribute('role') || '').toLowerCase();
        const live = String(cur.getAttribute('aria-live') || '').toLowerCase();
        if (role === 'status' || role === 'alert' || role === 'log' || live === 'polite' || live === 'assertive') return true;
      }
      if (el.getAttribute('data-v3-programmatic-status-announcement') === 'true') return true;
      return false;
    };
    const active = document.activeElement;
    const statusEls = [...document.querySelectorAll('[data-v3-status-message],#status,[role=status],[role=alert],[aria-live]')]
      .filter((el) => visible(el))
      .map((el) => ({
        path: pathOf(el),
        text: ((el.innerText || el.textContent || '') || el.getAttribute('data-v3-status-meaning') || '').replace(/\s+/g, ' ').trim(),
        role: el.getAttribute('role') || '',
        ariaLive: el.getAttribute('aria-live') || '',
        hasProgrammaticStatus: hasProgrammaticStatus(el),
        dataProgrammaticStatusAnnouncement: el.getAttribute('data-v3-programmatic-status-announcement') === 'true',
        dataStatusMeaning: el.getAttribute('data-v3-status-meaning') || '',
        inOpenDialog: inOpenDialog(el),
        inDisclosureContent: inDisclosureContent(el),
        focused: el === active,
      }));
    return {
      activePath: pathOf(active),
      statusEls,
      title: document.title,
      lastStatusActivation: window.__v3LastStatusActivation || null,
      statusAnnouncements: window.__v3StatusAnnouncements || [],
    };
  });

  try {
    const candidates = [];
    for (const t of targets) {
      const dialogsBefore = nativeDialogs.length;
      const before = await snapshot();
      if (t.selector) await page.click(t.selector);
      else await page.mouse.click(t.x, t.y);
      await sleep(320);
      const after = await snapshot();
      const dialogsDuringActivation = nativeDialogs.slice(dialogsBefore);
      await page.evaluate(() => {
        for (const dialog of document.querySelectorAll('dialog[open]')) {
          try { dialog.close(); } catch (e) {}
        }
      }).catch(() => {});
      const beforeByPath = new Map((before.statusEls || []).map((el) => [el.path, el]));
      const afterByPath = new Map((after.statusEls || []).map((el) => [el.path, el]));
      const paths = new Set([...beforeByPath.keys(), ...afterByPath.keys()]);
      for (const p of paths) {
        const prev = beforeByPath.get(p);
        const el = afterByPath.get(p);
        const beforeText = prev && prev.text ? prev.text : '';
        const afterText = el && el.text ? el.text : '';
        const addedOrModified = !!afterText && (!prev || beforeText !== afterText);
        const removedStatus = !!beforeText && (!afterText || !el);
        if (!addedOrModified && !removedStatus) continue;
        const current = el || {
          path: p,
          text: '',
          role: prev.role || '',
          ariaLive: prev.ariaLive || '',
          hasProgrammaticStatus: prev.hasProgrammaticStatus,
          focused: false,
          inOpenDialog: false,
          inDisclosureContent: false,
        };
        const relevantAnnouncements = (after.statusAnnouncements || []).filter((a) => {
          const msg = String(a.message || '').toLowerCase();
          const text = String(afterText || beforeText || '').toLowerCase();
          return a.targetPath === p || (text && msg.includes(text.slice(0, Math.min(24, text.length))));
        });
        const programmaticAnnouncementObserved = current.dataProgrammaticStatusAnnouncement === true || relevantAnnouncements.length > 0;
        const contextChangedByDialog = current.inOpenDialog === true || dialogsDuringActivation.length > 0;
        const contextChangedByDisclosure = current.inDisclosureContent === true;
        const focusNotMovedToMessage = after.activePath !== p
          && current.focused !== true
          && !contextChangedByDialog
          && !contextChangedByDisclosure;
        const noLiveRegionOrProgrammaticStatusRole = !current.hasProgrammaticStatus && !programmaticAnnouncementObserved;
        candidates.push({
          path: p,
          triggerPath: t.path,
          before: prev || null,
          after: current,
          beforeActivePath: before.activePath,
          afterActivePath: after.activePath,
          trustedActivationObserved: !!(after.lastStatusActivation && after.lastStatusActivation.isTrusted === true),
          activation: after.lastStatusActivation || null,
          focusNotMovedToMessage,
          noLiveRegionOrProgrammaticStatusRole,
          programmaticAnnouncementObserved,
          announcements: relevantAnnouncements,
          contextChangedByDialog,
          nativeDialogs: dialogsDuringActivation,
          contextChangedByDisclosure,
          statusMessageRemoved: removedStatus,
          reason: noLiveRegionOrProgrammaticStatusRole && focusNotMovedToMessage
            ? 'trusted activation changed visible status information without live/status/alert/direct-announcement semantics and without moving focus or opening dialog/disclosure context'
            : 'trusted activation changed visible status information; review whether the programmatic announcement, focus, dialog, disclosure, or live-region channel is sufficient',
        });
      }
    }
    return { kind: 'status-message-probe', targets, candidates, nativeDialogs, scope: 'single-rendered-state' };
  } finally {
    page.off('dialog', dialogHandler);
  }
}

async function probeLabelInName(page) {
  return page.evaluate(() => {
    const pathOf = (el) => {
      if (el.id) return `#${el.id}`;
      const tag = el.tagName.toLowerCase();
      let i = 1; for (let p = el.previousElementSibling; p; p = p.previousElementSibling) if (p.tagName === el.tagName) i++;
      return `${tag}[${i}]`;
    };
    const visible = (el) => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0;
    };
    const norm = (raw) => String(raw || '')
      .toLowerCase()
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201c\u201d]/g, '"')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
    const textOf = (el) => {
      if (el.matches('input[type=button],input[type=submit],input[type=reset]')) return el.value || '';
      return (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
    };
    const labelledbyText = (el) => String(el.getAttribute('aria-labelledby') || '')
      .split(/\s+/)
      .map((id) => id && document.getElementById(id))
      .filter(Boolean)
      .map((ref) => (ref.innerText || ref.textContent || '').replace(/\s+/g, ' ').trim())
      .filter(Boolean)
      .join(' ');
    const nameOf = (el, visibleText) => {
      const ariaLabel = el.getAttribute('aria-label');
      if (ariaLabel != null) return { name: ariaLabel.trim(), source: 'aria-label' };
      const labelled = labelledbyText(el);
      if (labelled) return { name: labelled, source: 'aria-labelledby' };
      if (el.matches('input[type=button],input[type=submit],input[type=reset]')) return { name: el.value || '', source: 'value' };
      if (visibleText) return { name: visibleText, source: 'contents' };
      const title = el.getAttribute('title');
      if (title != null && title.trim()) return { name: title.trim(), source: 'title' };
      return { name: '', source: 'none' };
    };
    const elements = [...document.querySelectorAll('button,a[href],input[type=button],input[type=submit],input[type=reset],[role=button],[role=link],[role=menuitem],[role=tab]')]
      .filter((el) => visible(el));
    const observations = [];
    const candidates = [];
    for (const el of elements) {
      const visibleText = textOf(el);
      const visibleNorm = norm(visibleText);
      if (!visibleNorm) continue;
      const { name, source } = nameOf(el, visibleText);
      const nameNorm = norm(name);
      if (!nameNorm) continue;
      const containsVisibleText = nameNorm.includes(visibleNorm);
      const rec = {
        path: pathOf(el),
        tag: el.tagName.toLowerCase(),
        role: el.getAttribute('role') || '',
        visibleText: visibleText.slice(0, 160),
        accessibleName: String(name || '').slice(0, 160),
        nameSource: source,
        visibleNorm,
        nameNorm,
        containsVisibleText,
      };
      observations.push(rec);
      if (!containsVisibleText) {
        candidates.push({
          ...rec,
          reason: `visible label ${JSON.stringify(visibleText)} is not contained in accessible name ${JSON.stringify(name)}`,
        });
      }
    }
    return { kind: 'label-in-name-probe', observations, candidates, scope: 'single-rendered-state' };
  });
}

async function probeTargetSize(page) {
  const measured = await page.evaluate(() => {
    const pathOf = (el) => {
      if (el.id) return `#${el.id}`;
      const tag = el.tagName.toLowerCase();
      let i = 1; for (let p = el.previousElementSibling; p; p = p.previousElementSibling) if (p.tagName === el.tagName) i++;
      return `${tag}[${i}]`;
    };
    const visible = (el) => {
      const s = getComputedStyle(el);
      const r = el.getBoundingClientRect();
      return s.display !== 'none' && s.visibility !== 'hidden' && r.width > 0 && r.height > 0;
    };
    const targetSelector = 'button,a[href],input[type=button],input[type=submit],input[type=reset],input[type=checkbox],input[type=radio],[role=button],[role=link],[role=menuitem],[role=tab],[data-v3-pointer-target]';
    const isTarget = (el) => el.matches(targetSelector);
    const squareFits = (el, r) => {
      if (r.width < 24 || r.height < 24) return null;
      const cx = r.x + r.width / 2;
      const cy = r.y + r.height / 2;
      for (let dx = -11; dx <= 11; dx += 5.5) {
        for (let dy = -11; dy <= 11; dy += 5.5) {
          const hit = document.elementFromPoint(cx + dx, cy + dy);
          if (!(hit && (hit === el || el.contains(hit)))) return false;
        }
      }
      return true;
    };
    const sentenceLike = (el) => {
      const p = el.parentElement;
      const text = p ? (p.innerText || p.textContent || '').replace(/\s+/g, ' ').trim() : '';
      return text.length > 40 && /[a-z][,.!?]\s+[a-z]/.test(text.toLowerCase());
    };
    const targets = [...document.querySelectorAll(targetSelector)]
      .filter((el) => visible(el) && isTarget(el))
      .map((el) => {
        const r = el.getBoundingClientRect();
        const s = getComputedStyle(el);
        const box = { x: Math.round(r.x * 100) / 100, y: Math.round(r.y * 100) / 100, w: Math.round(r.width * 100) / 100, h: Math.round(r.height * 100) / 100 };
        return {
          path: pathOf(el),
          tag: el.tagName.toLowerCase(),
          role: el.getAttribute('role') || '',
          text: (el.innerText || el.textContent || el.value || el.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim().slice(0, 80),
          box,
          squareFits: squareFits(el, r),
          inlineCandidate: s.display === 'inline' || el.getAttribute('data-v3-inline-target') === 'true',
          inSentence: sentenceLike(el) || el.getAttribute('data-v3-in-sentence') === 'true',
          inlineException: el.getAttribute('data-v3-inline-exception') === 'true',
          essential: el.getAttribute('data-v3-essential-target') === 'true',
          equivalent: el.getAttribute('data-v3-equivalent-target') === 'true',
          uaControl: el.getAttribute('data-v3-ua-control') === 'true',
        };
      });
    return targets;
  });
  const observations = measured.map((t) => {
    const neighbors = measured.filter((n) => n.path !== t.path).map((n) => n.box);
    const evalBox = { x: t.box.x, y: t.box.y, w: t.box.w, h: t.box.h };
    let result = A.evalTargetSize(evalBox, {
      neighbors,
      squareFits: t.squareFits,
      inlineCandidate: t.inlineCandidate,
      inSentence: t.inSentence,
      essential: t.essential,
      uaControl: t.uaControl,
    });
    if (t.equivalent === true) result = { verdict: 'pass', passes: true, requiresJudgment: false, reason: 'generated equivalent-target exception', minDim: Math.min(t.box.w, t.box.h) };
    if (t.inlineException === true) result = { verdict: 'pass', passes: true, requiresJudgment: false, reason: 'generated inline/in-sentence exception', minDim: Math.min(t.box.w, t.box.h) };
    return { ...t, neighbors, result };
  });
  const candidates = observations
    .filter((o) => o.result && o.result.verdict === 'fail' && o.equivalent !== true && o.essential !== true)
    .map((o) => ({
      ...o,
      reason: o.result.reason,
    }));
  return { kind: 'target-size-probe', observations, candidates, scope: 'single-rendered-state' };
}

function collectForcedColorsSnapshot() {
  const pathOf = (el) => {
    if (el.id) return `#${el.id}`;
    const tag = el.tagName.toLowerCase();
    let i = 1; for (let p = el.previousElementSibling; p; p = p.previousElementSibling) if (p.tagName === el.tagName) i++;
    return `${tag}[${i}]`;
  };
  const parseRgb = (raw) => {
    const m = String(raw || '').match(/rgba?\(([^)]+)\)/i);
    if (!m) return null;
    const parts = m[1].split(',').map((x) => Number.parseFloat(x.trim()));
    if (parts.length < 3 || parts.slice(0, 3).some((n) => !Number.isFinite(n))) return null;
    if (parts.length >= 4 && Number.isFinite(parts[3]) && parts[3] < 0.1) return null;
    return parts.slice(0, 3).map((n) => Math.max(0, Math.min(255, n)));
  };
  const linear = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const luminance = (rgb) => rgb ? (0.2126 * linear(rgb[0]) + 0.7152 * linear(rgb[1]) + 0.0722 * linear(rgb[2])) : null;
  const contrastRatio = (fgRaw, bgRaw) => {
    const fg = luminance(parseRgb(fgRaw));
    const bg = luminance(parseRgb(bgRaw));
    if (fg == null || bg == null) return null;
    const light = Math.max(fg, bg);
    const dark = Math.min(fg, bg);
    return Math.round(((light + 0.05) / (dark + 0.05)) * 100) / 100;
  };
  const elements = [];
  for (const el of [...document.querySelectorAll('body *')]) {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    const text = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 80);
    const focusable = el.matches('a[href],button,input,select,textarea,[tabindex]:not([tabindex="-1"])');
    if (s.display === 'none' || s.visibility === 'hidden' || r.width <= 0 || r.height <= 0) continue;
    if (!text && !focusable && s.forcedColorAdjust !== 'none') continue;
    elements.push({
      path: pathOf(el),
      text,
      focusable,
      forcedColorAdjust: s.forcedColorAdjust || '',
      color: s.color,
      backgroundColor: s.backgroundColor,
      borderColor: s.borderTopColor,
      outlineColor: s.outlineColor,
      textContrast: text ? contrastRatio(s.color, s.backgroundColor) : null,
      nonTextBoundaryContrast: focusable ? contrastRatio(s.borderTopColor, s.backgroundColor) : null,
    });
  }
  return { forcedColorsActive: matchMedia('(forced-colors: active)').matches, elements };
}

function collectMotion() {
  const parseTime = (t) => {
    const s = String(t || '').trim();
    if (s.endsWith('ms')) return Number.parseFloat(s) || 0;
    if (s.endsWith('s')) return (Number.parseFloat(s) || 0) * 1000;
    return Number.parseFloat(s) || 0;
  };
  const moving = [];
  const pathOf = (el) => el.id ? `#${el.id}` : el.tagName.toLowerCase();
  for (const el of [...document.querySelectorAll('*')]) {
    const s = getComputedStyle(el);
    const names = String(s.animationName || '').split(',').map((x) => x.trim()).filter((x) => x && x !== 'none');
    if (!names.length && el.tagName.toLowerCase() !== 'marquee') continue;
    const durs = String(s.animationDuration || '0s').split(',').map(parseTime);
    const iters = String(s.animationIterationCount || '1').split(',').map((x) => x.trim());
    const playStates = String(s.animationPlayState || 'running').split(',').map((x) => x.trim().toLowerCase());
    const durationMs = Math.max(0, ...durs);
    const infinite = iters.includes('infinite') || el.tagName.toLowerCase() === 'marquee';
    const active = el.tagName.toLowerCase() === 'marquee' || playStates.some((x) => x !== 'paused');
    moving.push({
      path: pathOf(el),
      names,
      durationMs,
      infinite,
      playState: playStates.join(','),
      active,
      parallelNonEssential: el.getAttribute('data-v3-parallel-non-essential') === 'true',
      essentialMotion: el.getAttribute('data-v3-essential-motion') === 'true',
    });
  }
  return { moving };
}

function parseCssTime(t) {
  const s = String(t || '').trim();
  if (s.endsWith('ms')) return Number.parseFloat(s) || 0;
  if (s.endsWith('s')) return (Number.parseFloat(s) || 0) * 1000;
  return Number.parseFloat(s) || 0;
}

async function collectNonInterferenceCandidates(page) {
  return page.evaluate(() => {
    const pathOf = (el) => el.id ? `#${el.id}` : el.tagName.toLowerCase();
    const candidates = [];
    for (const m of [...document.querySelectorAll('audio,video')]) {
      const tag = m.tagName.toLowerCase();
      if (m.hasAttribute('autoplay') && !m.hasAttribute('controls') && !(m.muted || m.hasAttribute('muted'))) {
        candidates.push({ family: 'audio-control', sc: '1.4.2', path: pathOf(m), reason: `${tag} autoplays without controls and is not muted` });
      }
    }
    for (const el of [...document.querySelectorAll('*')]) {
      const s = getComputedStyle(el);
      const names = String(s.animationName || '').split(',').map((x) => x.trim()).filter((x) => x && x !== 'none');
      const dur = Math.max(0, ...String(s.animationDuration || '').split(',').map((x) => {
        x = x.trim(); return x.endsWith('ms') ? Number.parseFloat(x) : x.endsWith('s') ? Number.parseFloat(x) * 1000 : 0;
      }));
      const infinite = String(s.animationIterationCount || '').split(',').map((x) => x.trim()).includes('infinite');
      const playStates = String(s.animationPlayState || 'running').split(',').map((x) => x.trim().toLowerCase());
      const active = el.tagName.toLowerCase() === 'marquee' || playStates.some((x) => x !== 'paused');
      if (((names.length && active && infinite && dur > 5000) || el.tagName.toLowerCase() === 'marquee')) {
        candidates.push({ family: 'motion-control', sc: '2.2.2', path: pathOf(el), reason: 'auto-moving content appears persistent/looping' });
      }
      if (names.some((n) => /flash|blink|strobe/i.test(n)) && infinite && dur > 0 && dur <= 333) {
        candidates.push({ family: 'flash-risk', sc: '2.3.1', path: pathOf(el), reason: 'fast infinite flash-like CSS animation; review flash threshold manually' });
      }
    }
    return { kind: 'non-interference-candidates', candidates };
  });
}

async function collectInteractionCandidates(page) {
  return page.evaluate(() => {
    const pathOf = (el) => el.id ? `#${el.id}` : el.tagName.toLowerCase();
    const candidates = [];
    for (const el of [...document.querySelectorAll('*')]) {
      const tag = el.tagName.toLowerCase();
      const attrs = el.getAttributeNames();
      if (attrs.some((a) => /^on(focus|change|input)$/.test(a))) {
        candidates.push({ family: 'context-change', sc: attrs.includes('onfocus') ? '3.2.1' : '3.2.2', path: pathOf(el), reason: 'inline focus/input/change handler can cause a context change; needs driven probe' });
      }
      if (el.hasAttribute('draggable') || tag === 'canvas' || /map|slider/i.test(el.getAttribute('role') || '') || attrs.some((a) => /^on(pointer|touch|mouse)/.test(a))) {
        candidates.push({ family: 'pointer-operation', sc: '2.5.1/2.5.2/2.5.7', path: pathOf(el), reason: 'pointer/drag/gesture surface; needs alternative/cancellation review' });
      }
      if (el.hasAttribute('accesskey') || el.hasAttribute('aria-keyshortcuts') || el.hasAttribute('data-shortcut-key') || attrs.some((a) => /^onkey/.test(a))) {
        candidates.push({ family: 'character-shortcut', sc: '2.1.4', path: pathOf(el), reason: 'keyboard shortcut surface; review single-character shortcut exceptions' });
      }
    }
    return { kind: 'interaction-candidates', candidates };
  });
}

async function collectMediaAlternativeInventory(page) {
  return page.evaluate(() => {
    const pathOf = (el) => el.id ? `#${el.id}` : el.tagName.toLowerCase();
    const norm = (raw) => String(raw || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    const words = (raw) => new Set(norm(raw).split(/\s+/).filter((w) => w.length > 2));
    const coverage = (requiredRaw, providedRaw) => {
      const required = [...words(requiredRaw)];
      if (!required.length) return { covered: true, missing: [], score: 1 };
      const provided = words(providedRaw);
      const missing = required.filter((w) => !provided.has(w));
      return { covered: missing.length === 0, missing, score: Math.round(((required.length - missing.length) / required.length) * 100) / 100 };
    };
    const fixtureMeta = (el) => {
      let data = {};
      const scriptId = el.getAttribute('data-v3-media-meta');
      const script = scriptId ? document.getElementById(scriptId) : null;
      if (script && script.textContent) {
        try { data = JSON.parse(script.textContent); } catch (e) { data = { parseError: true }; }
      }
      return {
        mediaType: el.getAttribute('data-v3-media-type') || data.mediaType || '',
        sc: el.getAttribute('data-v3-media-sc') || data.sc || '',
        audioContent: el.getAttribute('data-v3-audio-content') || data.audioContent || '',
        visualContent: el.getAttribute('data-v3-visual-content') || data.visualContent || '',
        captionText: el.getAttribute('data-v3-caption-text') || data.captionText || '',
        transcriptText: el.getAttribute('data-v3-transcript-text') || data.transcriptText || '',
        descriptionText: el.getAttribute('data-v3-description-text') || data.descriptionText || '',
        mediaAlternativeForText: el.getAttribute('data-v3-media-alternative-for-text') === 'true' || data.mediaAlternativeForText === true,
        clearlyLabeledAlternative: el.getAttribute('data-v3-clearly-labeled-alternative') === 'true' || data.clearlyLabeledAlternative === true,
      };
    };
    const nearbyTranscript = (el) => {
      const haystack = new Set();
      const addLinks = (root) => {
        if (!root || typeof root.querySelectorAll !== 'function') return;
        for (const n of root.querySelectorAll('a,button,[role=link]')) haystack.add(n);
      };
      const addInlineAlternatives = (root) => {
        if (!root || typeof root.querySelectorAll !== 'function') return;
        for (const n of root.querySelectorAll('[data-v3-transcript],details,[aria-label*="transcript" i],[aria-label*="description" i]')) haystack.add(n);
      };
      const fig = el.closest('figure');
      if (fig) {
        addLinks(fig);
        addInlineAlternatives(fig);
      }
      for (const sib of [el.previousElementSibling, el.nextElementSibling]) {
        if (!sib) continue;
        if (sib.matches?.('a,button,[role=link]')) haystack.add(sib);
        if (sib.matches?.('[data-v3-transcript],details,[aria-label*="transcript" i],[aria-label*="description" i]')) haystack.add(sib);
        if (!sib.querySelector?.('audio,video')) addLinks(sib);
        if (!sib.querySelector?.('audio,video')) addInlineAlternatives(sib);
      }
      return [...haystack].map((n) => ({
        text: (n.textContent || n.innerText || '').replace(/\s+/g, ' ').trim(),
        href: n.getAttribute('href') || null,
        source: n.hasAttribute?.('data-v3-transcript') || String(n.tagName || '').toLowerCase() === 'details' ? 'inline-transcript' : 'link',
      })).filter((n) => /transcript|captions?|subtitles?|description/i.test(n.text || n.href || '')).slice(0, 5);
    };
    const nearbyDescription = (el) => {
      const nodes = [];
      const add = (root) => {
        if (!root || typeof root.querySelectorAll !== 'function') return;
        for (const n of root.querySelectorAll('[data-v3-description-text]')) {
          const text = (n.textContent || n.innerText || '').replace(/\s+/g, ' ').trim();
          if (text) nodes.push({ text, source: 'inline-description' });
        }
      };
      const fig = el.closest('figure');
      if (fig) add(fig);
      for (const sib of [el.previousElementSibling, el.nextElementSibling]) {
        if (!sib || sib.querySelector?.('audio,video')) continue;
        if (sib.matches?.('[data-v3-description-text]')) {
          const text = (sib.textContent || sib.innerText || '').replace(/\s+/g, ' ').trim();
          if (text) nodes.push({ text, source: 'inline-description' });
        }
        add(sib);
      }
      return nodes.slice(0, 5);
    };
    const media = [...document.querySelectorAll('audio,video')].map((m) => {
      const tag = m.tagName.toLowerCase();
      const meta = fixtureMeta(m);
      const tracks = [...m.querySelectorAll('track')].map((t) => ({
        kind: (t.getAttribute('kind') || 'subtitles').toLowerCase(),
        srclang: t.getAttribute('srclang') || '',
        label: t.getAttribute('label') || '',
        src: t.getAttribute('src') || '',
        default: t.hasAttribute('default'),
      }));
      const kinds = new Set(tracks.map((t) => t.kind));
      const transcriptLinks = nearbyTranscript(m);
      const descriptionLinks = nearbyDescription(m);
      const transcriptEvidence = meta.transcriptText || transcriptLinks.map((l) => l.text).join(' ');
      const descriptionEvidence = meta.descriptionText || descriptionLinks.map((l) => l.text).join(' ');
      const captionAdequacy = meta.audioContent
        ? coverage(meta.audioContent, meta.captionText || '')
        : null;
      const transcriptAdequacy = (meta.audioContent || meta.visualContent)
        ? coverage(`${meta.audioContent} ${meta.visualContent}`, transcriptEvidence)
        : null;
      const descriptionAdequacy = meta.visualContent
        ? coverage(meta.visualContent, String(meta.sc || '') === '1.2.5' ? descriptionEvidence : `${descriptionEvidence} ${transcriptEvidence}`)
        : null;
      const clearlyAlternativeForText = meta.mediaAlternativeForText && meta.clearlyLabeledAlternative;
      const sc = String(meta.sc || '');
      const checksCaption = !sc || sc === '1.2.2';
      const checksAudioVideoOnly = !sc || sc === '1.2.1';
      const checksDescriptionOrMediaAlternative = !sc || sc === '1.2.3';
      const checksDescription = !sc || sc === '1.2.5';
      const warnings = [];
      if (checksCaption && !clearlyAlternativeForText && tag === 'video' && (meta.audioContent || !sc) && !kinds.has('captions') && !kinds.has('subtitles')) warnings.push('video-caption-track-missing');
      if (checksCaption && !clearlyAlternativeForText && tag === 'video' && captionAdequacy && !captionAdequacy.covered) warnings.push('caption-content-inadequate');
      if ((checksDescriptionOrMediaAlternative || checksDescription) && !clearlyAlternativeForText && tag === 'video' && meta.visualContent && !kinds.has('descriptions') && !transcriptEvidence) warnings.push('video-description-or-media-alternative-missing');
      if ((checksDescriptionOrMediaAlternative || checksDescription) && !clearlyAlternativeForText && tag === 'video' && descriptionAdequacy && !descriptionAdequacy.covered) warnings.push('visual-alternative-inadequate');
      if (checksAudioVideoOnly && !clearlyAlternativeForText && tag === 'audio' && meta.audioContent && !transcriptEvidence && transcriptLinks.length === 0) warnings.push('audio-transcript-missing');
      if (checksAudioVideoOnly && !clearlyAlternativeForText && tag === 'audio' && transcriptAdequacy && !transcriptAdequacy.covered) warnings.push('audio-transcript-inadequate');
      if (checksAudioVideoOnly && !clearlyAlternativeForText && tag === 'video' && meta.mediaType === 'video-only' && meta.visualContent && !transcriptEvidence && !descriptionEvidence) warnings.push('video-only-alternative-missing');
      if (checksAudioVideoOnly && !clearlyAlternativeForText && tag === 'video' && meta.mediaType === 'video-only' && descriptionAdequacy && !descriptionAdequacy.covered) warnings.push('video-only-alternative-inadequate');
      if (tracks.some((t) => !t.src.trim())) warnings.push('track-src-empty');
      if (!tracks.length && transcriptLinks.length === 0 && !transcriptEvidence && !clearlyAlternativeForText) warnings.push('no-track-or-nearby-transcript-signal');
      return {
        path: pathOf(m),
        tag,
        fixtureMeta: meta,
        controls: m.hasAttribute('controls'),
        autoplay: m.hasAttribute('autoplay'),
        muted: m.muted || m.hasAttribute('muted'),
        durationKnown: Number.isFinite(m.duration) && m.duration > 0,
        tracks,
        nearbyTranscript: transcriptLinks,
        nearbyDescription: descriptionLinks,
        adequacy: {
          caption: captionAdequacy,
          transcript: transcriptAdequacy,
          description: descriptionAdequacy,
          clearlyAlternativeForText,
        },
        warnings,
      };
    });
    return { kind: 'media-alternative-inventory', media };
  });
}

function mediaHasContentModel(media = {}) {
  const meta = media.fixtureMeta && typeof media.fixtureMeta === 'object' ? media.fixtureMeta : {};
  return Boolean(
    String(meta.mediaType || '').trim()
    || String(meta.audioContent || '').trim()
    || String(meta.visualContent || '').trim()
    || String(meta.captionText || '').trim()
    || String(meta.transcriptText || '').trim()
    || String(meta.descriptionText || '').trim()
  );
}

function mediaWarningShowsMissingOrInadequateAlternative(warning) {
  return /missing|inadequate|empty/i.test(String(warning || ''));
}

function mediaWarningSc(media = {}, warning) {
  const meta = media.fixtureMeta && typeof media.fixtureMeta === 'object' ? media.fixtureMeta : {};
  const scoped = String(meta.sc || '').trim();
  if (/^1\.2\.[1235]$/.test(scoped)) return scoped;
  const w = String(warning || '');
  if (/caption/i.test(w)) return '1.2.2';
  if (/audio-transcript|video-only/i.test(w)) return '1.2.1';
  if (/description|visual-alternative/i.test(w)) return '1.2.3/1.2.5';
  return media.tag === 'audio' ? '1.2.1' : '1.2.x';
}

async function collectAuthenticationAndEntryCandidates(page) {
  return page.evaluate(() => {
    const pathOf = (el) => el.id ? `#${el.id}` : el.tagName.toLowerCase();
    const candidates = [];
    const formFacts = (el) => {
      const form = el.closest?.('form,[data-v3-auth-step],[data-v3-cognitive-test],[data-v3-auth-exception],[data-v3-no-auth-exception]');
      return {
        authenticationStep: form?.getAttribute('data-v3-auth-step') === 'true',
        explicitlyNotAuthentication: form?.getAttribute('data-v3-auth-step') === 'false',
        cognitiveFunctionTest: form?.getAttribute('data-v3-cognitive-test') || '',
        authException: form?.getAttribute('data-v3-auth-exception') || '',
        noAuthException: form?.getAttribute('data-v3-no-auth-exception') === 'true',
        contextText: (form?.innerText || form?.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 240),
      };
    };
    const redundantFacts = (el) => {
      const form = el.closest?.('form,[data-v3-redundant-entry]');
      const exception = form?.getAttribute('data-v3-reuse-exception') || '';
      return {
        markedRedundantEntry: form?.getAttribute('data-v3-redundant-entry') === 'true',
        explicitlyNotRedundantEntry: form?.getAttribute('data-v3-redundant-entry') === 'false',
        sameProcess: form?.getAttribute('data-v3-same-process') === 'true',
        notSameProcess: form?.getAttribute('data-v3-same-process') === 'false',
        previouslyProvided: form?.getAttribute('data-v3-previously-provided') === 'true',
        notPreviouslyProvided: form?.getAttribute('data-v3-previously-provided') === 'false',
        requiredReentry: form?.getAttribute('data-v3-required-reentry') === 'true',
        notRequiredReentry: form?.getAttribute('data-v3-required-reentry') === 'false',
        noReuseException: form?.getAttribute('data-v3-no-reuse-exception') === 'true',
        reuseException: exception,
        redundantKey: form?.getAttribute('data-v3-redundant-key') || '',
      };
    };
    const fields = [...document.querySelectorAll('input,textarea,select')].map((el) => ({
      path: pathOf(el),
      type: (el.getAttribute('type') || el.tagName.toLowerCase()).toLowerCase(),
      name: el.getAttribute('name') || '',
      autocomplete: el.getAttribute('autocomplete') || '',
      required: el.hasAttribute('required'),
      pasteBlocked: el.hasAttribute('onpaste') && /return\s+false|preventDefault/i.test(el.getAttribute('onpaste') || ''),
      labelText: (el.closest('label')?.innerText || '').replace(/\s+/g, ' ').trim(),
      facts: formFacts(el),
      redundantFacts: redundantFacts(el),
    }));
    for (const f of fields) {
      const authText = `${f.name} ${f.labelText} ${f.autocomplete}`;
      const looksAuth = f.facts.authenticationStep
        || f.type === 'password'
        || /otp|one.?time|verification|security\s+code|auth(?:entication)?\s+code|login\s+code/i.test(authText);
      if (looksAuth && !f.facts.explicitlyNotAuthentication) {
        candidates.push({
          family: 'accessible-authentication',
          sc: '3.3.8',
          path: f.path,
          reason: f.facts.noAuthException
            ? 'authentication cognitive-function test with no allowed alternative/exception declared'
            : 'authentication surface; review cognitive-function test and allowed alternatives/exceptions',
          autocomplete: f.autocomplete || null,
          pasteBlocked: f.pasteBlocked,
          evidenceClaims: [
            ...(f.facts.authenticationStep ? ['authentication-step'] : []),
            ...(f.facts.cognitiveFunctionTest ? ['cognitive-function-test'] : []),
            ...(f.facts.noAuthException ? ['missing-allowed-alternative-or-exception'] : []),
            ...(f.facts.authException ? ['allowed-alternative-or-exception-declared'] : []),
          ],
          facts: f.facts,
        });
      }
      if (f.pasteBlocked) candidates.push({ family: 'paste-blocking', sc: '3.3.8/3.3.7', path: f.path, reason: 'field appears to block paste; review authentication/redundant-entry impact', facts: f.facts });
    }
    const captchaEls = [...document.querySelectorAll('[class*=captcha i],[id*=captcha i],[data-sitekey],iframe[src*=captcha i],iframe[src*=turnstile i]')];
    const captcha = captchaEls.map((el) => pathOf(el));
    for (const el of captchaEls) {
      const path = pathOf(el);
      const facts = el ? formFacts(el) : {};
      candidates.push({
        family: 'captcha-authentication',
        sc: '3.3.8/1.1.1',
        path,
        reason: facts.noAuthException ? 'captcha-like authentication surface with no alternative declared' : 'captcha-like surface; review non-cognitive/non-visual alternatives',
        evidenceClaims: [
          'captcha-like-surface',
          ...(facts.authException ? ['alternative-modalities'] : []),
          ...(facts.noAuthException ? ['missing-allowed-alternative-or-exception'] : []),
        ],
        facts,
      });
    }
    const timers = [...document.querySelectorAll('[aria-live],[role=timer],[id*=timer i],[class*=timer i],[id*=countdown i],[class*=countdown i]')].map((el) => pathOf(el));
    for (const path of timers) candidates.push({ family: 'timeout-risk', sc: '2.2.1/2.2.6', path, reason: 'timer/countdown-like surface; review timeout adjustment and authentication impact' });
    const names = new Map();
    for (const f of fields) {
      const key = (f.redundantFacts.redundantKey || f.autocomplete || f.name || f.labelText || '').trim().toLowerCase();
      if (!key) continue;
      names.set(key, (names.get(key) || 0) + 1);
    }
    const redundantForms = new Map();
    for (const f of fields) {
      const rf = f.redundantFacts || {};
      if (!rf.markedRedundantEntry && !rf.explicitlyNotRedundantEntry) continue;
      const key = rf.redundantKey || f.name || f.labelText || f.path;
      if (!redundantForms.has(key)) redundantForms.set(key, { key, count: 0, paths: [], facts: rf });
      const entry = redundantForms.get(key);
      entry.count += 1;
      entry.paths.push(f.path);
    }
    for (const [, item] of redundantForms) {
      const rf = item.facts || {};
      candidates.push({
        family: 'redundant-entry-review',
        sc: '3.3.7',
        key: item.key,
        count: item.count,
        paths: item.paths,
        reason: rf.noReuseException
          ? 'same-process re-entry is marked as required without auto-populate, selection, or exception evidence'
          : 'redundant-entry surface; review same-process, previous-entry, required re-entry, and exceptions',
        evidenceClaims: [
          ...(rf.sameProcess ? ['same-process'] : []),
          ...(rf.previouslyProvided ? ['same-information-previously-provided'] : []),
          ...(rf.requiredReentry ? ['required-reentry'] : []),
          ...(rf.noReuseException ? ['no-auto-populate-or-selection-exception'] : []),
          ...(rf.reuseException ? ['auto-populate-selection-or-exception-declared'] : []),
          ...(rf.notSameProcess ? ['not-same-process'] : []),
          ...(rf.notPreviouslyProvided ? ['not-same-information-previously-provided'] : []),
          ...(rf.notRequiredReentry ? ['not-required-reentry'] : []),
          ...(rf.explicitlyNotRedundantEntry ? ['not-redundant-entry'] : []),
        ],
        facts: rf,
      });
    }
    for (const [key, count] of names) {
      if (count > 1 && !redundantForms.has(key)) {
        candidates.push({
          family: 'redundant-entry-review',
          sc: '3.3.7',
          key,
          count,
          reason: 'same field-like key appears more than once in a captured state; process context needed',
          evidenceClaims: [],
        });
      }
    }
    return { kind: 'authentication-and-entry-candidates', fields, candidates };
  });
}

function collectCognitiveCandidatesFromText(text, opts = {}) {
  const source = String(text || '');
  const candidates = [];
  const longSentences = source.split(/[.!?]+/).map((s) => s.trim()).filter((s) => s.split(/\s+/).filter(Boolean).length >= (opts.longSentenceWords || 35));
  const acronyms = [...new Set([...source.matchAll(/\b[A-Z]{3,}\b/g)].map((m) => m[0]))];
  if (longSentences.length) candidates.push({ family: 'plain-language-research', reason: 'long sentences may increase cognitive load', examples: longSentences.slice(0, 3) });
  if (acronyms.length) candidates.push({ family: 'abbreviation-research', reason: 'unexpanded acronyms may need review', examples: acronyms.slice(0, 8) });
  return { kind: 'cognitive-research-candidates', candidates };
}

async function collectCognitiveCandidates(page, opts = {}) {
  const structured = await page.evaluate(() => {
    const pathOf = (el) => el.id ? `#${el.id}` : el.tagName.toLowerCase();
    return [...document.querySelectorAll('[data-v3-reading-review]')].map((el) => {
      const yes = (name) => el.getAttribute(name) === 'true';
      const no = (name) => el.getAttribute(name) === 'false';
      const supplemental = el.getAttribute('data-v3-supplemental-content') || '';
      const lowerVersion = el.getAttribute('data-v3-lower-secondary-version') || '';
      const language = el.getAttribute('data-v3-reading-language') || (document.documentElement.lang || '');
      const text = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
      const evidenceClaims = [
        ...(yes('data-v3-required-content') ? ['user-facing-required-text'] : []),
        ...(no('data-v3-required-content') ? ['not-user-facing-required-text'] : []),
        ...(yes('data-v3-above-lower-secondary') ? ['reading-level-above-lower-secondary-after-removals'] : []),
        ...(no('data-v3-above-lower-secondary') ? ['not-above-lower-secondary'] : []),
        ...(yes('data-v3-proper-names-titles-removed') ? ['proper-names-and-titles-removed'] : []),
        ...(yes('data-v3-no-supplement') ? ['no-supplemental-content-observed', 'no-lower-secondary-version-observed', 'supplement-adequacy-evaluated'] : []),
        ...(supplemental ? ['supplemental-content-declared'] : []),
        ...(lowerVersion ? ['lower-secondary-version-declared'] : []),
        ...(yes('data-v3-reading-method-supported') ? ['reading-method-language-supported'] : []),
        ...(no('data-v3-reading-method-supported') ? ['reading-method-language-unsupported'] : []),
      ];
      return {
        family: 'plain-language-research',
        sc: '3.1.5',
        path: pathOf(el),
        reason: yes('data-v3-no-supplement')
          ? 'required text is marked as above lower secondary level after removals with no supplemental/lower-level version'
          : 'reading-level review surface with declared supplement, lower-level version, non-required content, or unsupported method',
        evidenceClaims,
        facts: {
          requiredContent: yes('data-v3-required-content') ? true : (no('data-v3-required-content') ? false : null),
          aboveLowerSecondary: yes('data-v3-above-lower-secondary') ? true : (no('data-v3-above-lower-secondary') ? false : null),
          properNamesTitlesRemoved: yes('data-v3-proper-names-titles-removed'),
          noSupplement: yes('data-v3-no-supplement'),
          supplemental,
          lowerVersion,
          language,
          textSample: text.slice(0, 320),
        },
        examples: text ? [text.slice(0, 240)] : [],
      };
    });
  }).catch(() => []);
  const bodyText = await page.evaluate(() => document.body ? document.body.innerText || '' : '').catch(() => '');
  const fallback = collectCognitiveCandidatesFromText(bodyText, opts);
  const fallbackCandidates = structured.length ? [] : fallback.candidates;
  return {
    kind: 'cognitive-research-candidates',
    candidates: [...structured, ...fallbackCandidates],
  };
}

module.exports = {
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
  collectCognitiveCandidates,
};
