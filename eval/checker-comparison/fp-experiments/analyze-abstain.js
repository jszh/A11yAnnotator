#!/usr/bin/env node
'use strict';
// Confidence-gated abstention, simulated OFFLINE from an existing baseline run's replicates — no new LLM calls.
// Each saved record carries the in-scope verdicts + their confidence; abstain-high/med simply downgrades a BARRIER
// verdict below the bar to non-barrier and recomputes the outcome (deterministic catches are unaffected). This
// re-confirms round 1's "FPs are high-confidence → confidence-gating can't separate FP from TP" with K replicates,
// for free. Usage: node analyze-abstain.js --dir=results/fp-rep-baseline-k10
const fs = require('fs'); const path = require('path');
const REPO_ROOT = path.join(__dirname, '..', '..', '..');
function arg(n, d=null){const p=process.argv.find(x=>x===`--${n}`||x.startsWith(`--${n}=`));if(!p)return d;if(p===`--${n}`)return true;return p.slice(n.length+3);}
const dir = arg('dir'); if(!dir){console.error('usage: --dir=results/<baseline run>');process.exit(1);}
const D = path.isAbsolute(dir)?dir:path.join(REPO_ROOT,dir);
const reps = fs.readdirSync(D).filter(f=>/^results\.rep\d+\.json$/.test(f)).sort().map(f=>JSON.parse(fs.readFileSync(path.join(D,f),'utf8')));
const RANK={low:0,medium:1,high:2};
function caughtUnderBar(rec, bar){
  if (rec.v3Barrier || (rec.inScopeBarrierFilled||0) > 0) return true; // deterministic catch — abstain can't touch it
  const need = bar==null ? -1 : RANK[bar];
  const inScope = new Set(rec.sc||[]);
  const rub = (rec.rubricVerdicts||[]).some(v=>v.verdict==='LIKELY_BARRIER' && inScope.has(v.sc) && (RANK[v.confidence]??0) >= need);
  const agt = (rec.agentVerdicts||[]).some(v=>v.verdict==='REPRODUCED' && inScope.has(v.sc) && (RANK[v.confidence]??0) >= need);
  return rub || agt;
}
function tally(R, bar){
  let tp=0,fn=0,fp=0; for(const x of R){ const c=caughtUnderBar(x,bar);
    if(x.expected==='failed'){c?tp++:fn++;} else if(c)fp++; } return {tp,fp,fn};
}
const bars = [null,'medium','high']; // null = baseline (any confidence keeps the barrier)
console.log(`\n=== Offline abstention sweep over ${reps.length} baseline replicates (${dir}) ===`);
// also: confidence distribution of the BARRIER verdicts that land on GT-pass (the FPs) vs GT-fail (the TPs)
const confFP={low:0,medium:0,high:0}, confTP={low:0,medium:0,high:0};
for(const R of reps) for(const x of R){ const inScope=new Set(x.sc||[]);
  const barriers=[...(x.rubricVerdicts||[]).filter(v=>v.verdict==='LIKELY_BARRIER'&&inScope.has(v.sc)),...(x.agentVerdicts||[]).filter(v=>v.verdict==='REPRODUCED'&&inScope.has(v.sc))];
  for(const b of barriers){ const t=(x.expected!=='failed')?confFP:confTP; t[b.confidence]=(t[b.confidence]||0)+1; } }
for(const bar of bars){
  const ts=reps.map(R=>tally(R,bar)); const m=(k)=>(ts.reduce((s,t)=>s+t[k],0)/ts.length);
  console.log(`  abstain=${bar||'baseline'}:  FP mean ${m('fp').toFixed(1)} [${ts.map(t=>t.fp).join(',')}]   recall(TP) mean ${m('tp').toFixed(1)} [${ts.map(t=>t.tp).join(',')}]`);
}
console.log(`\n  confidence of BARRIER verdicts (summed over reps):`);
console.log(`    on GT-pass (FPs): ${JSON.stringify(confFP)}   ← if mostly 'high', abstain can't fix them`);
console.log(`    on GT-fail (TPs): ${JSON.stringify(confTP)}`);
