'use strict';

const { sensoryWordsIn } = require('../../scripts/v3/lib/sensory-lexicon.js');
const staticChecks = require('../../scripts/v3/lib/static-checks.js');

const TARGET_SCS = Object.freeze([
  '1.3.2', '1.3.3', '1.4.10', '1.4.12', '1.4.4',
  '2.2.1', '2.2.4', '2.4.1', '3.2.5',
]);

function candidate({ page, sc, kind, xpath = null, status = 'review', detected = false, evidence = {} }) {
  if (!TARGET_SCS.includes(sc)) throw new Error(`unsupported page-pass SC ${sc}`);
  return { page, sc, kind, xpath, status, detected: detected === true, evidence };
}

function sensoryCandidates(page, records) {
  const seen = new Set();
  const out = [];
  for (const record of records || []) {
    const xpath = String(record && record.xpath || '');
    const text = String(record && record.text || '').replace(/\s+/g, ' ').trim();
    if (!xpath || !text) continue;
    const terms = sensoryWordsIn(text);
    if (!terms.length) continue;
    const key = `${xpath}\0${text}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(candidate({
      page, sc: '1.3.3', kind: 'sensory-text', xpath,
      evidence: { text: text.slice(0, 500), terms, lang: record.lang || null },
    }));
  }
  return out;
}

function firstValidRefresh(contents) {
  for (const content of contents || []) {
    const result = staticChecks.evalMetaRefreshContent(content);
    if (result.applicable) return { content, ...result };
  }
  return null;
}

function metaEvidence(page, facts = {}) {
  const out = [];
  const viewport = staticChecks.evalViewportMetas(facts.viewportContents || []);
  if (viewport.applicable) {
    out.push(candidate({
      page, sc: '1.4.4', kind: 'viewport-zoom-policy', xpath: '/page-level::viewport',
      status: viewport.barrier ? 'barrier' : 'clear', detected: viewport.barrier,
      evidence: { contents: facts.viewportContents || [], reason: viewport.reason },
    }));
  }

  const refresh = firstValidRefresh(facts.refreshContents || []);
  if (refresh) {
    for (const sc of ['2.2.1', '2.2.4', '3.2.5']) {
      out.push(candidate({
        page, sc, kind: 'meta-refresh', xpath: '/page-level::meta-refresh',
        status: refresh.barrier ? 'barrier' : 'clear', detected: refresh.barrier,
        evidence: {
          actRule: 'bc659a', content: refresh.content,
          delaySeconds: refresh.delaySeconds, reason: refresh.reason,
          sharedMeasurementScs: ['2.2.1', '2.2.4', '3.2.5'],
        },
      }));
    }
  }
  return out;
}

function staticExperimentStatus(result) {
  const outcome = result && result.outcome || {};
  if (outcome.barrierConfirmed === true) return { status: 'barrier', detected: true };
  if (outcome.passConfirmed === true) return { status: 'clear', detected: false };
  return { status: 'partial', detected: false };
}

function reflowStatus(result) {
  const outcome = result && result.outcome || {};
  if (outcome.overflowBarrierObserved === true) return { status: 'barrier', detected: true };
  if (outcome.noHorizontalScrollClear === true) return { status: 'clear', detected: false };
  return { status: 'partial', detected: false };
}

function summarize(pages) {
  const all = (pages || []).flatMap((page) => page.candidates || []);
  const bySc = {};
  for (const sc of TARGET_SCS) {
    const rows = all.filter((row) => row.sc === sc);
    bySc[sc] = {
      candidates: rows.length,
      pages: new Set(rows.map((row) => row.page)).size,
      detected: rows.filter((row) => row.detected).length,
      barrier: rows.filter((row) => row.status === 'barrier').length,
      clear: rows.filter((row) => row.status === 'clear').length,
      partial: rows.filter((row) => row.status === 'partial').length,
      review: rows.filter((row) => row.status === 'review').length,
    };
  }
  return {
    coverageRecords: all.length,
    // These are direct probe outputs, not adjudicated obligation-ledger findings.
    // A separate finalization pass validates them against the experiment catalog.
    probeBarrierSignals: all.filter((row) => row.detected).length,
    bySc,
  };
}

module.exports = {
  TARGET_SCS,
  candidate,
  sensoryCandidates,
  firstValidRefresh,
  metaEvidence,
  staticExperimentStatus,
  reflowStatus,
  summarize,
};
