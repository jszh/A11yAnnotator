'use strict';
// Every tunable in one place. There is one time limit — per (page, criterion) unit — plus the judge's per-batch
// tool-call budget. Everything else is a property of the measurement, not a cap.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..', '..', '..');

function loadEnv() {
  const f = path.join(ROOT, '.env');
  if (!fs.existsSync(f)) return;
  for (const line of fs.readFileSync(f, 'utf8').split('\n')) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(line);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, '');
  }
}
loadEnv();

const MAC_CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const CONFIG = {
  root: ROOT,
  chromePath: process.env.CHROME_PATH || (fs.existsSync(MAC_CHROME) ? MAC_CHROME : '/usr/bin/google-chrome'),
  viewport: { width: 1280, height: 900, deviceScaleFactor: 1 },
  navTimeoutMs: 30000,
  settleFloorMs: 150,
  // the time limit: each probe and each sweep call gets it once; a judge batch gets it once per element it holds
  unitDeadlineMs: Number(process.env.INTERA11Y_UNIT_DEADLINE_MS || 10 * 60 * 1000),
  // a safety net for the whole page, above the per-unit limits: it catches a hang, and so must allow for a full judge
  // batch (12 elements × 10 minutes) and the time batches spend waiting for the shared LLM pool; a page that
  // exceeds it is recorded as an error
  pageDeadlineMs: Number(process.env.INTERA11Y_PAGE_DEADLINE_MS || 360 * 60 * 1000),
  // the page-wide LLM screening sweep that adds elements to every criterion's candidate set (INTERA11Y_SCREEN=0 turns it off)
  screen: { enabled: process.env.INTERA11Y_SCREEN !== '0' },
  // the ablation ladder's switches (DESIGN §6); the defaults are InterA11y as designed.
  //   candidates: 'triage' — rule inventory + sweep, measurement rules decide first; 'pool' — every rendered element
  //               of the criterion's kinds goes to the judge (GenA11y's scope), no inventory, sweep or rules
  //   evidence:   'full' — computed facts, probe observations, crops, page text; 'markup' — the element's markup only
  ablation: {
    candidates: process.env.INTERA11Y_CANDIDATES || 'triage',
    evidence: process.env.INTERA11Y_EVIDENCE || 'full',
  },
  judge: {
    provider: 'gemini',
    model: process.env.INTERA11Y_MODEL || 'gemini-3.7-flash',
    effort: process.env.INTERA11Y_EFFORT || 'high',
    // which rendering of the test rules the judge gets: 'v1' (GenA11y-format rules + tool names) or 'v2' (v1 +
    // InterA11y's rubric under each rule that names a tool)
    rubric: process.env.INTERA11Y_RUBRIC || 'v2',
    // whether the judge may call live tools (INTERA11Y_TOOLS=0: no tools, and the rules are shown without them)
    tools: process.env.INTERA11Y_TOOLS !== '0',
    // tool calls a judge batch may make: perCandidate × candidates, within [min, max]
    toolCalls: { perCandidate: 2, min: 4, max: 24 },
    // batch size is set by an evidence-token estimate, and capped in candidates so the answer (one verdict with
    // evidence per candidate, after the model's thinking) fits the output limit
    batchTokenBudget: 24000,
    maxImagesPerBatch: 24,
    maxCandidatesPerBatch: 12,
    concurrency: Number(process.env.INTERA11Y_LLM_CONC || 16),
  },
};

module.exports = { CONFIG };
