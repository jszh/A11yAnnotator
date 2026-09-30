'use strict';
// One page: read the PageModel, then evaluate each criterion — identify → observe → assess → judge → resolve.
const { openSession } = require('./session.js');
const { CONFIG } = require('./config.js');
const { buildPageModel, isRendered } = require('../model/page-model.js');
const { makeProbeRunner } = require('../probes/index.js');
const { CRITERIA } = require('../criteria/index.js');
const { judgeCandidates } = require('../judge/judge.js');
const { resolveCriterion } = require('./resolve.js');
const { sweep } = require('../screen/sweep.js');
const screened = require('../screen/screened.js');
const { key, within } = require('../lib/xpath.js');
const { PAGE } = require('../criteria/common.js');

// targets: null, or { page: bool, keys: Set<xpath key> } — evaluate only these elements (page: every candidate)
async function evaluateCriterion({ criterion, session, model, probes, client, llmPool, trace, targets = null }) {
  if (CONFIG.ablation.candidates === 'pool') return evaluatePool({ criterion, session, model, probes, client, llmPool, trace, targets });
  const t0 = Date.now();
  // the probes and the screening sweep are independent of each other: they run together
  const [obs, screen] = await Promise.all([
    probes.get(criterion.probes),
    CONFIG.screen.enabled ? sweep({ criterion, model, client, llmPool, trace }) : null,
  ]);
  const coverage = Object.fromEntries(Object.entries(obs).map(([k, v]) => [k, { completeness: v.completeness, reason: v.reason, ms: v.ms }]));
  if (screen) coverage.screen = { completeness: screen.failedCalls ? 'truncated' : 'complete', reason: screen.failedCalls ? `${screen.failedCalls} of ${screen.calls} sweep calls gave no answer` : undefined };
  // candidates: the rule-based inventory, united with the elements the sweep selected. A candidate is an
  // (element, facet) pair — one element can be tested on two facets (e.g. a control's resting boundary and its
  // focus indicator); the key is the XPath, suffixed with the facet when the XPath repeats. An element both
  // sources produce keeps its native candidate(s) and native rules; an element only the sweep produced is a
  // `screened` candidate.
  const proposals = new Map([...((screen && screen.proposals) || new Map())].map(([x, aspect]) => [key(x), { xpath: x, aspect }]));
  const seen = new Set();
  const native = criterion.identify(model, obs).filter((c) => { const k = `${c.xpath}|${c.kind}`; if (seen.has(k)) return false; seen.add(k); return true; })
    .map((c) => ({ ...c, origin: proposals.has(key(c.xpath)) ? 'rules+screen' : 'rules' }));
  const nativeKeys = new Set(native.map((c) => key(c.xpath)));
  const selectedOnly = [...proposals.values()].filter((p) => !nativeKeys.has(key(p.xpath)));
  // a criterion whose unit is the page (a sequence) takes the sweep's picks as evidence on its page-level
  // candidate: an element's place in a sequence is not judged apart from the sequence
  const pageCands = criterion.screen && criterion.screen.scope === 'page' ? native.filter((c) => c.xpath === PAGE) : [];
  for (const c of pageCands) { c.screenNotes = selectedOnly; if (selectedOnly.length) c.origin = 'rules+screen'; }
  const screenedOnly = pageCands.length ? [] : selectedOnly.map((p) => ({ xpath: p.xpath, kind: 'screened', aspect: p.aspect, origin: 'screen' }));
  let raw = [...native, ...screenedOnly];
  // evaluation restricted to given elements (the expert study's annotated elements): the candidates are the
  // union above that are one of them or inside one (testing an element includes its content — the text in a
  // button, the links in a hidden slide); an element neither source proposed is not added
  if (targets && !targets.page) raw = raw.filter((c) => { const k = key(c.xpath); return [...targets.keys].some((t) => within(k, t)); });
  const counts = new Map();
  for (const c of raw) counts.set(c.xpath, (counts.get(c.xpath) || 0) + 1);
  // a page-level candidate (no element) is keyed page#<facet>: the judge is shown this key as the candidate's path
  // and answers with it (a null path was shown as "null" and its answer never matched)
  const candidates = raw.map((c) => ({ ...c, key: c.xpath == null ? `page#${c.kind}` : counts.get(c.xpath) > 1 ? `${c.xpath}#${c.kind}` : c.xpath }));
  const assessed = candidates.map((c) => ({ ...c, assessment: c.kind === 'screened' ? screened.assess(c, criterion, obs, model) : criterion.assess(c, obs, model) }));
  const open = assessed.filter((c) => c.assessment.status === 'OPEN');
  let judged = { results: new Map(), pageFindings: [], usage: null };
  if (open.length) {
    const cards = open.map((c) => {
      const ev = c.kind === 'screened' ? screened.evidence(c, obs, model) : criterion.evidence(c, obs, model);
      if (c.screenNotes && c.screenNotes.length) ev.facts = { ...ev.facts, elementsAScreeningPassSelectedForTesting: { note: 'selected for testing, not findings', elements: c.screenNotes.map((p) => ({ path: p.xpath, aspect: p.aspect })) } };
      return { path: c.key, element: model.get(c.xpath), ...ev };
    });
    judged = await judgeCandidates({ criterion, page: model, session, candidates: cards, client, llmPool, trace });
  }
  const screenCost = screen ? screen.usage.costUsd : 0;
  return resolveCriterion({
    criterion, assessed, judged, coverage, ms: Date.now() - t0,
    costUsd: (judged.usage ? judged.usage.costUsd : 0) + screenCost, usage: judged.usage,
    screen: screen && { pool: screen.pool, calls: screen.calls, failedCalls: screen.failedCalls, selected: screen.selected, unknownPaths: screen.unknownPaths, screenedOnly: screenedOnly.length, usage: screen.usage },
  });
}

// Ablation (CONFIG.ablation.candidates = 'pool'): GenA11y's scope inside InterA11y's pipeline. Every rendered
// element of the criterion's kinds (the sweep's element pool) is a candidate and goes to the judge — no rule-based
// inventory, no sweep, no measurement rule decides anything. With evidence 'markup' no probe runs and a card carries
// the element's markup only; with 'full' it carries what a screened candidate carries (every probe observation of
// the element, a crop) and the element's computed accessibility facts.
async function evaluatePool({ criterion, session, model, probes, client, llmPool, trace, targets }) {
  const t0 = Date.now();
  const markupOnly = CONFIG.ablation.evidence === 'markup';
  const obs = markupOnly ? {} : await probes.get(criterion.probes);
  const coverage = Object.fromEntries(Object.entries(obs).map(([k, v]) => [k, { completeness: v.completeness, reason: v.reason, ms: v.ms }]));
  const spec = criterion.screen;
  let raw = model.elements.filter((e) => isRendered(e) && spec && spec.select(e, model)).map((e) => ({ xpath: e.xpath, kind: 'pool', origin: 'pool' }));
  if (targets && !targets.page) raw = raw.filter((c) => { const k = key(c.xpath); return [...targets.keys].some((t) => within(k, t)); });
  const assessed = raw.map((c) => ({ ...c, key: c.xpath, assessment: { status: 'OPEN', rule: 'pool' } }));
  let judged = { results: new Map(), pageFindings: [], usage: null };
  if (assessed.length) {
    const cards = assessed.map((c) => {
      const e = model.get(c.xpath);
      if (markupOnly) return { path: c.key, element: e, markupOnly: true };
      return { path: c.key, element: e, ...screened.evidence(c, obs, model) };
    });
    judged = await judgeCandidates({ criterion, page: model, session, candidates: cards, client, llmPool, trace });
  }
  return resolveCriterion({
    criterion, assessed, judged, coverage, ms: Date.now() - t0,
    costUsd: judged.usage ? judged.usage.costUsd : 0, usage: judged.usage, screen: null,
  });
}

// targets: null, or { [sc]: { page, keys } } — see evaluateCriterion
async function evaluatePage({ browser, url, scs, client, llmPool, trace, targets = null }) {
  const t0 = Date.now();
  const session = await openSession(browser, url);
  try {
    const model = await buildPageModel(session.page);
    const probes = makeProbeRunner(session, model);
    const criteria = {};
    await Promise.all(scs.filter((sc) => CRITERIA[sc]).map(async (sc) => {
      try {
        criteria[sc] = await evaluateCriterion({ criterion: CRITERIA[sc], session, model, probes, client, llmPool, trace: trace && ((ev) => trace({ url, ...ev })), targets: targets ? targets[sc] || { page: false, keys: new Set() } : null });
      } catch (e) {
        criteria[sc] = { verdict: 'INCOMPLETE', error: String((e && e.stack) || e).slice(0, 800), findings: [], candidates: [] };
      }
    }));
    return { url, doc: model.doc, elements: model.elements.length, modelTruncated: model.truncated, criteria, ms: Date.now() - t0 };
  } finally { await session.close(); }
}

module.exports = { evaluatePage };
