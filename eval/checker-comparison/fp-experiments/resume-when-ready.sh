#!/bin/bash
# Self-pacing resume: probe Claude subscription quota every 6 min (up to 60 min). Once recovered, run the two
# highest-information untested methods on the decision set, with the in-harness collapse-guard + a break if quota
# re-throttles. Conservative pack-conc to minimize 429 pressure.
cd /Users/jason/Developer/A11yAnnotator/eval/checker-comparison/fp-experiments
PROBE_ANS() { node replay-judge.js --packs=results/fp-experiments/probes/fp-packs-smoke --out=fp-quota-probe-loop --method=baseline >/dev/null 2>&1; node -e "try{const R=require('/Users/jason/Developer/A11yAnnotator/results/fp-experiments/runs/fp-quota-probe-loop/results.rep1.json');console.log(R.filter(x=>(x.rubricVerdicts&&x.rubricVerdicts.length)||(x.agentVerdicts&&x.agentVerdicts.length)).length)}catch(e){console.log(0)}"; }
recovered=0
for i in $(seq 1 10); do
  sleep 360
  ans=$(PROBE_ANS)
  echo "probe $i (~$((i*6))min): answered=$ans/6"
  if [ "$ans" -ge 4 ]; then recovered=1; echo "QUOTA RECOVERED ~$((i*6))min"; break; fi
done
if [ "$recovered" -ne 1 ]; then echo "STILL THROTTLED after 60min"; exit 0; fi
for m in strip-question refute grounded boundary; do
  echo "######## method=$m K=5 decision-set ########"
  node replay-judge.js --packs=results/fp-experiments/packs --cases=results/fp-experiments/sets/decision-set.txt --rep=5 --out=fp-rep-$m-k5 --method=$m --pack-conc=6
  ans=$(node -e "try{const R=require('/Users/jason/Developer/A11yAnnotator/results/fp-rep-$m-k5/results.rep1.json');console.log(R.filter(x=>(x.rubricVerdicts&&x.rubricVerdicts.length)||(x.agentVerdicts&&x.agentVerdicts.length)).length)}catch(e){console.log(0)}")
  echo ">>> $m rep1 answered=$ans"
  if [ "$ans" -lt 15 ]; then echo ">>> re-throttled after $m — stopping"; break; fi
done
echo "RESUME BATCH DONE"
