#!/usr/bin/env node
'use strict';

// Adaptive controller for the low-count saved-page evaluation. It creates
// page-balanced rounds and delegates each round to run-sampled-elements.js,
// which imports the unchanged server harness. Each SC stops independently at
// 20 cumulative detected issues or 1,000 newly evaluated candidate obligations.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execFileSync } = require('child_process');

const ROOT = path.join(__dirname, '..', '..');

function arg(name, def = null) {
  const exact = `--${name}`;
  const p = process.argv.find((x) => x === exact || x.startsWith(exact + '='));
  if (!p) return def;
  if (p.startsWith(exact + '=')) return p.slice(exact.length + 1);
  const next = process.argv[process.argv.indexOf(p) + 1];
  return next && !next.startsWith('--') ? next : true;
}

const RUN_NAME = String(arg('out', 'saved-elements-low-count-evaluation-server'));
const OUT = path.join(ROOT, 'results', RUN_NAME);
const DISCOVERY = path.resolve(ROOT, String(arg('discovery', 'results/saved-elements-low-count-discovery-server')));
const BASELINE_ANALYSIS = path.resolve(ROOT, String(arg('baseline', 'results/saved-elements-gemini35-flash-lite-high-server/analysis.json')));
const BASELINE_RUN = path.dirname(BASELINE_ANALYSIS);
const ROUND_PER_SC = Math.max(1, Number(arg('round-per-sc', 200)) || 200);
const CANDIDATE_LIMIT = Math.max(1, Number(arg('candidate-limit', 1000)) || 1000);
const DETECTION_TARGET = Math.max(1, Number(arg('detection-target', 20)) || 20);
const SEED = Number(arg('seed', 20260819)) || 20260819;
const MODEL = String(arg('model', 'gemini-3.5-flash-lite'));
const EFFORT = String(arg('effort', 'high'));
const PLAN_ONLY = !!arg('plan-only', false);
const DEDUPE_DETECTED_ELEMENTS = !!arg('dedupe-detected-elements', false);

const keyOf = (x) => `${x.page}\0${x.obligationId}`;
const elementKey = (x) => `${x.page}\0${x.xpath}`;
const countBy = (items, key) => {
  const out = {};
  for (const x of items || []) { const k = typeof key === 'function' ? key(x) : x[key]; if (k) out[k] = (out[k] || 0) + 1; }
  return out;
};
function makeRng(seed) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6D2B79F5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
function shuffle(items, rand) {
  const out = items.slice();
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}
function seedFor(sc) {
  return crypto.createHash('sha256').update(`${SEED}\0${sc}`).digest().readUInt32LE(0);
}
function pageSpread(items, sc) {
  const rand = makeRng(seedFor(sc)), byPage = new Map();
  for (const item of items) { const a = byPage.get(item.page) || []; a.push(item); byPage.set(item.page, a); }
  for (const [page, rows] of byPage) byPage.set(page, shuffle(rows, rand));
  const pages = shuffle([...byPage.keys()], rand), out = [];
  let left = true;
  while (left) {
    left = false;
    for (const page of pages) {
      const rows = byPage.get(page);
      if (rows.length) { out.push(rows.pop()); left = true; }
    }
  }
  return out;
}

function detectedKey(page, row) {
  if (DEDUPE_DETECTED_ELEMENTS) {
    return `${page}\0${row.sc}\0${row.xpath || row.obligationId}`;
  }
  return `${page}\0${row.obligationId}`;
}

function readBaselineDetectedKeys(targetSet) {
  const out = new Set(), pagesDir = path.join(BASELINE_RUN, 'pages');
  if (!fs.existsSync(pagesDir)) return out;
  for (const file of fs.readdirSync(pagesDir).filter((x) => x.endsWith('.json'))) {
    const doc = JSON.parse(fs.readFileSync(path.join(pagesDir, file), 'utf8'));
    const page = (doc.spec && doc.spec.file) || file;
    for (const row of (doc.results && doc.results.obligationLedger) || []) {
      if (targetSet.has(row.sc) && row.disposition === 'PROVISIONAL' && !row.cleared) out.add(detectedKey(page, row));
    }
  }
  return out;
}

function updateStopReasons(state, queues) {
  for (const sc of state.targets) {
    const s = state.bySc[sc];
    if (s.stopReason) continue;
    if (s.baselineDetected + s.detectedNew >= DETECTION_TARGET) s.stopReason = 'detection-target';
    else if (s.evaluated >= CANDIDATE_LIMIT) s.stopReason = 'candidate-limit';
    else if (s.cursor >= queues[sc].length) s.stopReason = 'candidate-pool-exhausted';
  }
}

function summarize(state, discovery, roundSummaries) {
  const llm = roundSummaries.reduce((a, s) => {
    const x = s.llm || {};
    a.calls += x.calls || 0; a.done += x.done || 0; a.inputTokens += x.inputTokens || 0; a.outputTokens += x.outputTokens || 0; a.costUsd += x.costUsd || 0; a.peakInFlight = Math.max(a.peakInFlight, x.peakInFlight || 0);
    return a;
  }, {calls:0,done:0,peakInFlight:0,inputTokens:0,outputTokens:0,costUsd:0});
  return {
    runName: RUN_NAME, startedAt: state.startedAt, updatedAt: new Date().toISOString(), rounds: state.round,
    discovery: { path: path.relative(ROOT, DISCOVERY), pages: discovery.pages, candidateObligations: discovery.candidateObligations },
    rules: {
      detectionTarget: DETECTION_TARGET,
      candidateLimit: CANDIDATE_LIMIT,
      roundPerSc: ROUND_PER_SC,
      distinctFromFirstRound: true,
      pageBalanced: true,
      detectedIssueDedupe: DEDUPE_DETECTED_ELEMENTS ? 'page+sc+element' : 'page+obligation',
    },
    bySc: Object.fromEntries(state.targets.map((sc) => [sc, state.bySc[sc]])),
    newDetectedIssues: state.detectedIssues.length, llm,
  };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const discoverySummary = JSON.parse(fs.readFileSync(path.join(DISCOVERY, 'summary.json'), 'utf8'));
  const discoveryResults = JSON.parse(fs.readFileSync(path.join(DISCOVERY, 'results.json'), 'utf8'));
  const candidates = JSON.parse(fs.readFileSync(path.join(DISCOVERY, 'candidates.json'), 'utf8'));
  const baseline = JSON.parse(fs.readFileSync(BASELINE_ANALYSIS, 'utf8'));
  const targets = discoverySummary.targets.slice(), targetSet = new Set(targets);
  const pageMeta = new Map(discoveryResults.map((x) => [x.file, x]));

  const deduped = [];
  const seen = new Set();
  for (const c of candidates) { const k = keyOf(c); if (!seen.has(k)) { seen.add(k); deduped.push(c); } }
  const queues = Object.fromEntries(targets.map((sc) => [sc, pageSpread(deduped.filter((x) => x.sc === sc), sc)]));
  const byElement = new Map();
  for (const c of deduped) { const k = elementKey(c), a = byElement.get(k) || []; a.push(c); byElement.set(k, a); }

  const statePath = path.join(OUT, 'state.json');
  let state;
  if (fs.existsSync(statePath)) state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  else {
    state = {
      schema:'saved-elements-adaptive-eval/1',runName:RUN_NAME,startedAt:new Date().toISOString(),round:0,targets,
      bySc:Object.fromEntries(targets.map((sc)=>[sc,{baselineDetected:Number((baseline.bySc&&baseline.bySc[sc]&&baseline.bySc[sc].barriers)||0),available:queues[sc].length,cursor:0,attempted:0,evaluated:0,unresolved:0,detectedNew:0,stopReason:null}])),
      evaluatedKeys:[],detectedKeys:[],detectedIssues:[],rounds:[],
    };
  }
  const evaluated = new Set(state.evaluatedKeys), detectedKeys = new Set(state.detectedKeys), baselineDetectedKeys = readBaselineDetectedKeys(targetSet);
  updateStopReasons(state, queues);

  while (state.targets.some((sc) => !state.bySc[sc].stopReason)) {
    const active = new Set(state.targets.filter((sc) => !state.bySc[sc].stopReason));
    const selectedElements = new Set(), explicit = [];
    for (const sc of active) {
      const s = state.bySc[sc], q = queues[sc];
      let took = 0;
      while (s.cursor < q.length && took < ROUND_PER_SC && s.evaluated + took < CANDIDATE_LIMIT) {
        const c = q[s.cursor++], k = keyOf(c);
        if (evaluated.has(k)) continue;
        explicit.push(c); selectedElements.add(elementKey(c)); took++;
      }
    }
    const scheduled = [], scheduledBySc = Object.fromEntries(state.targets.map((sc)=>[sc,0]));
    for (const ek of selectedElements) for (const c of byElement.get(ek) || []) {
      if (!active.has(c.sc) || evaluated.has(keyOf(c))) continue;
      const room = CANDIDATE_LIMIT - state.bySc[c.sc].evaluated - scheduledBySc[c.sc];
      if (room <= 0) continue;
      scheduled.push(c); scheduledBySc[c.sc]++;
    }
    if (!scheduled.length || !selectedElements.size) { updateStopReasons(state, queues); break; }

    state.round++;
    const roundName = `${RUN_NAME}-round-${String(state.round).padStart(2,'0')}`;
    const roundDir = path.join(ROOT, 'results', roundName);
    const pages = new Map();
    for (const ek of selectedElements) {
      const split = ek.indexOf('\0'), page = ek.slice(0, split), xpath = ek.slice(split + 1), meta = pageMeta.get(page);
      if (!meta) throw new Error(`missing discovery page metadata for ${page}`);
      const rec = pages.get(page) || {key:meta.key,file:page,name:meta.name,noscript:!!meta.noscript,randomCount:null,xpaths:[]};
      rec.xpaths.push(xpath); pages.set(page, rec);
    }
    const selection = {schema:'saved-elements-adaptive-round/1',generatedAt:new Date().toISOString(),round:state.round,seed:SEED,pages:[...pages.values()].sort((a,b)=>a.file.localeCompare(b.file)),scheduledCandidates:scheduled};
    const selectionPath = path.join(OUT, `round-${String(state.round).padStart(2,'0')}-selection.json`);
    fs.writeFileSync(selectionPath, JSON.stringify(selection, null, 2));
    if (PLAN_ONLY) {
      console.log(JSON.stringify({event:'plan-only',round:state.round,pages:selection.pages.length,elements:selection.pages.reduce((n,p)=>n+p.xpaths.length,0),scheduledCandidates:scheduled.length,scheduledBySc},null,2));
      return;
    }

    const runnerArgs = [
      path.join(ROOT,'eval','saved-pages','run-sampled-elements.js'),'--phase=full',`--selection=${selectionPath}`,'--variable-elements',`--page-count=${selection.pages.length}`,`--out=${roundName}`,
      '--pages=64','--global-llm=100','--max-tabs=256','--browsers=16','--instruments-conc=32','--instruments-timeout-ms=300000','--require-instruments-complete',`--model=${MODEL}`,`--effort=${EFFORT}`,
    ];
    console.log(JSON.stringify({event:'round-start',round:state.round,roundName,pages:selection.pages.length,elements:selection.pages.reduce((n,p)=>n+p.xpaths.length,0),scheduledBySc},null,2));
    execFileSync(process.execPath, runnerArgs, {cwd:ROOT,stdio:'inherit',env:process.env});

    const pageDocs = new Map();
    for (const file of fs.readdirSync(path.join(roundDir,'pages')).filter((x)=>x.endsWith('.json'))) {
      const doc=JSON.parse(fs.readFileSync(path.join(roundDir,'pages',file),'utf8'));pageDocs.set(doc.spec.file,doc);
    }
    const roundIssueKeys = [];
    for (const c of scheduled) {
      const doc=pageDocs.get(c.page), resolved=new Set(((doc&&doc.collect&&doc.collect.elements)||[]).map((x)=>x.xpath)).has(c.xpath);
      state.bySc[c.sc].attempted++;
      if (resolved) { const k=keyOf(c); evaluated.add(k); state.bySc[c.sc].evaluated++; }
      else state.bySc[c.sc].unresolved++;
    }
    for (const [page,doc] of pageDocs) for (const row of (doc.results&&doc.results.obligationLedger)||[]) {
      if (!targetSet.has(row.sc) || row.disposition!=='PROVISIONAL' || row.cleared) continue;
      const k=detectedKey(page, row);
      if (baselineDetectedKeys.has(k) || detectedKeys.has(k)) continue;
      detectedKeys.add(k);roundIssueKeys.push(k);state.bySc[row.sc].detectedNew++;
      state.detectedIssues.push({round:state.round,page,xpath:row.xpath,sc:row.sc,claimFamily:row.claimFamily,obligationId:row.obligationId,source:row.provisional&&row.provisional.source,mechanism:row.provisional&&row.provisional.mechanism});
    }
    const roundSummary=JSON.parse(fs.readFileSync(path.join(roundDir,'summary.json'),'utf8'));
    state.rounds.push({round:state.round,runName:roundName,pages:selection.pages.length,elements:selection.pages.reduce((n,p)=>n+p.xpaths.length,0),scheduledBySc,newDetected:roundIssueKeys.length,summary:roundSummary});
    state.evaluatedKeys=[...evaluated];state.detectedKeys=[...detectedKeys];
    updateStopReasons(state,queues);
    fs.writeFileSync(statePath,JSON.stringify(state,null,2));
    fs.writeFileSync(path.join(OUT,'detected-issues.json'),JSON.stringify(state.detectedIssues,null,2));
    fs.writeFileSync(path.join(OUT,'summary.json'),JSON.stringify(summarize(state,discoverySummary,state.rounds.map((x)=>x.summary)),null,2));
    console.log(JSON.stringify({event:'round-finish',round:state.round,newDetected:roundIssueKeys.length,bySc:state.bySc},null,2));
  }

  updateStopReasons(state,queues);
  state.finishedAt=new Date().toISOString();state.evaluatedKeys=[...evaluated];state.detectedKeys=[...detectedKeys];
  fs.writeFileSync(statePath,JSON.stringify(state,null,2));
  fs.writeFileSync(path.join(OUT,'detected-issues.json'),JSON.stringify(state.detectedIssues,null,2));
  const finalSummary=summarize(state,discoverySummary,state.rounds.map((x)=>x.summary));
  finalSummary.finishedAt=state.finishedAt;
  fs.writeFileSync(path.join(OUT,'summary.json'),JSON.stringify(finalSummary,null,2));
  console.log(JSON.stringify({event:'done',summary:finalSummary},null,2));
}

main().catch((e)=>{console.error(e.stack||e);process.exit(1);});
