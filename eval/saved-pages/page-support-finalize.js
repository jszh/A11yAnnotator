'use strict';

// Convert the page-support discovery artifact into the same atomic obligation
// model used by Harness v3. A raw `status`/`detected` flag is never trusted as a
// decision: typed outcomes are revalidated against catalog applicability and
// support predicates before a deterministic CLAIM is emitted.

const crypto = require('crypto');
const catalog = require('../../scripts/v3/lib/catalog.js');
const obligations = require('../../scripts/v3/lib/obligations.js');
const staticChecks = require('../../scripts/v3/lib/static-checks.js');
const { TARGET_SCS } = require('./page-support.js');

const RULES = Object.freeze({
  'reflow-320': Object.freeze({ experimentId: 'reflow-overflow-probe', claimFamily: 'reflow-no-hscroll' }),
  'important-spacing-lock': Object.freeze({ experimentId: 'text-spacing-adequate', claimFamily: 'text-spacing-adequate' }),
  'viewport-zoom-policy': Object.freeze({ experimentId: 'viewport-allows-zoom', claimFamily: 'viewport-allows-zoom' }),
  'zoom-clip-640': Object.freeze({ experimentId: 'zoom-clip-probe', claimFamily: 'text-not-clipped-zoom' }),
  'bypass-blocks': Object.freeze({ experimentId: 'bypass-blocks', claimFamily: 'bypass-blocks' }),
});

const REVIEW_REASONS = Object.freeze({
  'sensory-text': 'semantic rubric required',
  'text-spacing-override': 'broad-scope geometry candidate; no atomic deterministic decision',
  'resize-text-200': 'broad-scope geometry candidate; no atomic deterministic decision',
  'automatic-context-change': 'behavioral candidate; current harness has no deterministic family for this SC',
});

function hash(value) {
  return crypto.createHash('sha256').update(String(value)).digest('hex').slice(0, 20);
}

function candidateRef(row, index) {
  return `page-support:${hash([row.page, row.sc, row.kind, row.xpath, index].join('\0'))}`;
}

function normalizedXpath(xpath) {
  return String(xpath || '').replace(/\[\d+\]/g, '[*]');
}

function typedOutcome(row) {
  if (row.kind === 'viewport-zoom-policy') {
    const result = staticChecks.evalViewportMetas((row.evidence && row.evidence.contents) || []);
    return {
      viewportApplicable: result.applicable === true,
      passConfirmed: result.applicable === true && result.barrier !== true,
      barrierConfirmed: result.applicable === true && result.barrier === true,
    };
  }
  if (row.kind === 'meta-refresh' && row.sc === '2.2.1') {
    const result = staticChecks.evalMetaRefreshContent(row.evidence && row.evidence.content);
    return {
      metaRefreshApplicable: result.applicable === true,
      passConfirmed: result.applicable === true && result.barrier !== true,
      barrierConfirmed: result.applicable === true && result.barrier === true,
    };
  }
  return (row.evidence && row.evidence.outcome) || {};
}

function ruleFor(row) {
  if (row.kind === 'meta-refresh' && row.sc === '2.2.1') {
    return { experimentId: 'no-meta-refresh-delay', claimFamily: 'no-meta-refresh-delay' };
  }
  return RULES[row.kind] || null;
}

function catalogDecision(row) {
  const rule = ruleFor(row);
  if (!rule) return null;
  const experiment = catalog.getExperiment(rule.experimentId);
  if (!experiment || experiment.sc !== row.sc || experiment.claimFamily !== rule.claimFamily) {
    return { rule, error: 'candidate mapping does not match the experiment catalog' };
  }
  const outcome = typedOutcome(row);
  const applicability = catalog.applicabilityHolds(rule.experimentId, outcome);
  const barrier = catalog.supportsDirection(rule.experimentId, 'BARRIER_OBSERVED', outcome);
  const clear = catalog.supportsDirection(rule.experimentId, 'NO_BARRIER_OBSERVED', outcome);
  let decision = 'partial';
  if (applicability.holds && barrier.supported) decision = 'barrier';
  else if (applicability.holds && clear.supported) decision = 'clear';
  return { rule, outcome, applicability, barrier, clear, decision };
}

function reviewReason(row) {
  if (row.kind === 'meaningful-sequence') return 'carried from an existing provisional ledger; not a new deterministic decision';
  if (row.kind === 'meta-refresh' && (row.sc === '2.2.4' || row.sc === '3.2.5')) {
    return 'shared meta-refresh evidence is relevant, but the current harness has no deterministic obligation family for this SC';
  }
  return REVIEW_REASONS[row.kind] || 'no catalog-backed deterministic mapping';
}

function addUnique(map, key, value, errors, label) {
  const prior = map.get(key);
  if (!prior) { map.set(key, value); return; }
  prior.sourceRefs.push(...value.sourceRefs);
  prior.duplicateCandidateCount += value.duplicateCandidateCount;
  if (prior.decision !== value.decision) errors.push(`${label}: conflicting decisions for ${key}: ${prior.decision} vs ${value.decision}`);
}

function issueClusters(findings) {
  const byKey = new Map();
  for (const finding of findings) {
    const key = [finding.page, finding.sc, finding.claimFamily, normalizedXpath(finding.xpath)].join('\0');
    const cluster = byKey.get(key) || {
      clusterId: `page-support-cluster:${hash(key)}`,
      page: finding.page,
      sc: finding.sc,
      claimFamily: finding.claimFamily,
      normalizedXpath: normalizedXpath(finding.xpath),
      representativeObligationId: finding.obligationId,
      obligationIds: [],
    };
    cluster.obligationIds.push(finding.obligationId);
    byKey.set(key, cluster);
  }
  return [...byKey.values()].map((row) => ({ ...row, members: row.obligationIds.length }));
}

function finalizePage(page) {
  const errors = [];
  const inventory = new Map();
  const decisions = new Map();
  const reviews = [];
  const carriedLedger = [];

  for (const [index, row] of (page.candidates || []).entries()) {
    const sourceRef = candidateRef(row, index);
    if (row.kind === 'meaningful-sequence') {
      carriedLedger.push({
        obligationId: obligations.oblId(row.xpath, row.sc, 'meaningful-sequence'),
        xpath: row.xpath,
        sc: row.sc,
        claimFamily: 'meaningful-sequence',
        disposition: row.evidence && row.evidence.disposition || 'PARTIAL',
        cleared: row.status === 'clear',
        autoPartial: false,
        shadow: false,
        provisional: row.evidence && row.evidence.outcome ? {
          source: 'carried-page-support',
          mechanism: 'reused-existing-ledger',
          outcome: row.evidence.outcome,
          confidence: 'unknown',
          evidenceRefs: [sourceRef],
        } : undefined,
      });
      continue;
    }

    if (row.kind === 'sensory-text') {
      const claimFamily = 'sensory-characteristics';
      const obligationId = obligations.oblId(row.xpath, row.sc, claimFamily);
      if (!inventory.has(obligationId)) inventory.set(obligationId, { obligationId, xpath: row.xpath, sc: row.sc, claimFamily });
      reviews.push({ ...row, sourceRef, obligationId, reason: reviewReason(row) });
      continue;
    }

    const adjudicated = catalogDecision(row);
    if (!adjudicated) {
      reviews.push({ ...row, sourceRef, reason: reviewReason(row) });
      continue;
    }
    if (adjudicated.error) {
      errors.push(`${sourceRef}: ${adjudicated.error}`);
      reviews.push({ ...row, sourceRef, reason: adjudicated.error });
      continue;
    }
    if (!adjudicated.applicability.holds) {
      errors.push(`${sourceRef}: catalog applicability failed (${adjudicated.applicability.missing.join(', ')})`);
      reviews.push({ ...row, sourceRef, reason: 'catalog applicability could not be established', adjudication: adjudicated });
      continue;
    }
    if (adjudicated.barrier.supported && adjudicated.clear.supported) {
      errors.push(`${sourceRef}: both barrier and clear predicates were satisfied`);
      reviews.push({ ...row, sourceRef, reason: 'conflicting catalog support predicates', adjudication: adjudicated });
      continue;
    }

    const { claimFamily, experimentId } = adjudicated.rule;
    const obligationId = obligations.oblId(row.xpath, row.sc, claimFamily);
    if (!inventory.has(obligationId)) inventory.set(obligationId, { obligationId, xpath: row.xpath, sc: row.sc, claimFamily });
    if (adjudicated.decision !== 'partial') {
      addUnique(decisions, obligationId, {
        obligationId,
        kind: 'CLAIM',
        cleared: adjudicated.decision === 'clear',
        decision: adjudicated.decision,
        mechanism: `instrument:${experimentId}`,
        sourceRefs: [sourceRef],
        duplicateCandidateCount: 1,
      }, errors, page.file);
    }
  }

  const dispositionRows = [...decisions.values()].map(({ decision: _decision, mechanism: _mechanism, sourceRefs: _refs, duplicateCandidateCount: _duplicates, ...row }) => row);
  const reconciled = obligations.reconcile([...inventory.values()], dispositionRows);
  errors.push(...reconciled.errors);
  const decisionById = decisions;
  const obligationLedger = reconciled.ledger.map((row) => {
    const decision = decisionById.get(row.obligationId);
    return decision ? { ...row, mechanism: decision.mechanism, evidenceRefs: [...new Set(decision.sourceRefs)], duplicateCandidateCount: decision.duplicateCandidateCount } : row;
  });
  const deterministicFindings = obligationLedger.filter((row) => row.disposition === 'CLAIM' && !row.cleared).map((row) => ({ ...row, page: page.file }));
  return {
    file: page.file,
    key: page.key,
    name: page.name,
    coverage: page.coverage,
    warnings: page.warnings || [],
    errors,
    obligationLedger,
    carriedLedger,
    deterministicFindings,
    reviewQueue: reviews,
    exactDuplicateCandidatesCollapsed: [...decisions.values()].reduce((n, row) => n + Math.max(0, row.duplicateCandidateCount - 1), 0),
  };
}

function summarizeFinalized(pages) {
  const ledger = pages.flatMap((page) => page.obligationLedger || []);
  const carried = pages.flatMap((page) => page.carriedLedger || []);
  const findings = pages.flatMap((page) => page.deterministicFindings || []);
  const reviews = pages.flatMap((page) => page.reviewQueue || []);
  const clusters = issueClusters(findings);
  const bySc = {};
  for (const sc of TARGET_SCS) {
    const rows = ledger.filter((row) => row.sc === sc);
    const old = carried.filter((row) => row.sc === sc);
    const queue = reviews.filter((row) => row.sc === sc);
    bySc[sc] = {
      obligations: rows.length,
      deterministicBarriers: rows.filter((row) => row.disposition === 'CLAIM' && !row.cleared).length,
      deterministicClears: rows.filter((row) => row.disposition === 'CLAIM' && row.cleared).length,
      partial: rows.filter((row) => row.disposition === 'PARTIAL').length,
      review: queue.length,
      carriedProvisionalBarriers: old.filter((row) => row.disposition === 'PROVISIONAL' && !row.cleared).length,
      carriedProvisionalClears: old.filter((row) => row.disposition === 'PROVISIONAL' && row.cleared).length,
    };
  }
  return {
    pages: pages.length,
    errors: pages.reduce((n, page) => n + (page.errors || []).length, 0),
    obligations: ledger.length,
    finalDetectedObligations: findings.length,
    deduplicatedIssuePatterns: clusters.length,
    deterministicClears: ledger.filter((row) => row.disposition === 'CLAIM' && row.cleared).length,
    partialObligations: ledger.filter((row) => row.disposition === 'PARTIAL').length,
    reviewCandidates: reviews.length,
    carriedLedgerRows: carried.length,
    exactDuplicateCandidatesCollapsed: pages.reduce((n, page) => n + page.exactDuplicateCandidatesCollapsed, 0),
    bySc,
    issueClusters: clusters,
  };
}

function finalizePages(pages) {
  const finalized = (pages || []).map(finalizePage);
  return { pages: finalized, summary: summarizeFinalized(finalized) };
}

module.exports = {
  RULES,
  normalizedXpath,
  typedOutcome,
  catalogDecision,
  issueClusters,
  finalizePage,
  summarizeFinalized,
  finalizePages,
};
