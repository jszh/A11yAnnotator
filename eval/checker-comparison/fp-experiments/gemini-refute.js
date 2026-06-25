#!/usr/bin/env node
'use strict';
// CROSS-FAMILY DIVERSE REFUTER (PoLL-style): a different model family (Gemini) tries to OVERTURN each barrier the
// Claude judge flagged in the baseline. The research hypothesis: a different model has DIFFERENT confident errors,
// so it can refute the confident-systematic FPs that same-model self-critique cannot — IF those FPs are model
// errors (not defensible GT-nuance both models share). Uses the separate GEMINI_API_KEY quota (not the exhausted
// Claude subscription) and the FROZEN evidence (signals + crops), so it needs no Claude calls.
//
// For each baseline LLM-flagged case it rebuilds the element's evidence and asks Gemini to refute, then reports the
// refuter's ASYMMETRY: FP-overturned (GT-pass cleared = good) vs recall-overturned (GT-fail cleared = bad). A useful
// refuter overturns FPs ≫ TPs. Usage: node gemini-refute.js --baseline=results/fp-rep-baseline-k10 --frac=0.6

const fs = require('fs');
const path = require('path');
const REPO_ROOT = path.join(__dirname, '..', '..', '..');
require('../../../scripts/v3/lib/load-env.js').loadEnv(REPO_ROOT);
const llmAdj = require('../../../scripts/v3/lib/llm-adjudicator.js');
const { makeSemaphore } = require('../../../scripts/v3/lib/run-telemetry.js');

function arg(n, d = null) { const p = process.argv.find((x) => x === `--${n}` || x.startsWith(`--${n}=`)); if (!p) return d; if (p === `--${n}`) return true; return p.slice(n.length + 3); }
const PACKS_DIR = path.join(REPO_ROOT, arg('packs', 'results/fp-experiments/packs'));
const BASE_DIR = path.join(REPO_ROOT, arg('baseline', 'results/fp-experiments/runs/baseline/fp-rep-baseline-k10'));
const FRAC = Number(arg('frac', 0.6));       // a case "Claude-flags" if caught in ≥FRAC of baseline reps
const MODEL = arg('model', 'gemini-3.5-flash');
const OUT = path.join(REPO_ROOT, 'results/fp-experiments/runs/gemini', arg('out', 'fp-gemini-refute'));
const KEY = (fs.readFileSync(path.join(REPO_ROOT, '.env'), 'utf8').split('\n').find((l) => l.startsWith('GEMINI_API_KEY=')) || '').split('=')[1].trim();

// ---- Gemini transport (vision) → {verdict, reasoning} ----
async function geminiJudge(textPrompt, images) {
  const parts = [{ text: textPrompt }];
  for (const im of images) parts.push({ inlineData: { mimeType: im.mediaType || 'image/png', data: im.data } });
  // gemini-3.5-flash is a THINKING model — it spends ~600-900 tokens on internal reasoning BEFORE the answer, so a
  // small budget truncates to MAX_TOKENS (empty/partial output). Give ample room for thoughts + the short verdict.
  const body = { contents: [{ role: 'user', parts }], generationConfig: { temperature: 0, maxOutputTokens: 2048 } };
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${KEY}`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
      if (r.status === 429 || r.status >= 500) { await new Promise((res) => setTimeout(res, 1500 * (attempt + 1))); continue; }
      const j = await r.json();
      if (!r.ok) return null;
      const text = j.candidates && j.candidates[0] && j.candidates[0].content && j.candidates[0].content.parts.map((p) => p.text || '').join('');
      if (!text) return null;
      const m = text.match(/\{[\s\S]*\}/); if (!m) return null;
      try { return JSON.parse(m[0]); } catch (e) { return null; }
    } catch (e) { await new Promise((res) => setTimeout(res, 1500 * (attempt + 1))); }
  }
  return null;
}

function loadBaselineFlagged() {
  const reps = fs.readdirSync(BASE_DIR).filter((f) => /^results\.rep\d+\.json$/.test(f)).map((f) => JSON.parse(fs.readFileSync(path.join(BASE_DIR, f), 'utf8')));
  const K = reps.length;
  const ids = [...new Set(reps.flatMap((R) => R.map((x) => x.testcaseId)))];
  const flagged = [];
  for (const id of ids) {
    const caught = reps.filter((R) => { const x = R.find((r) => r.testcaseId === id); return x && x.outcome === 'caught'; }).length;
    if (caught / K < FRAC) continue;
    // a representative rep where it was caught — take its flagging verdict
    const rep = reps.find((R) => { const x = R.find((r) => r.testcaseId === id); return x && x.outcome === 'caught'; });
    const x = rep.find((r) => r.testcaseId === id);
    const inScope = new Set(x.sc || []);
    const barrier = (x.rubricVerdicts || []).find((v) => v.verdict === 'LIKELY_BARRIER' && inScope.has(v.sc)) || (x.agentVerdicts || []).find((v) => v.verdict === 'REPRODUCED' && inScope.has(v.sc));
    if (!barrier) continue; // deterministic catch — no LLM verdict to refute
    flagged.push({ id, sc: (x.sc || [])[0], expected: x.expected, xpath: barrier.xpath, summary: barrier.summary || '', caughtFrac: caught / K });
  }
  return flagged;
}

function refutePrompt(sc, signals, claudeClaim) {
  return [
    `An accessibility judge flagged a WCAG ${sc} barrier on the element shown in the image(s), reasoning: "${claudeClaim}".`,
    'You are a SKEPTIC from a different model family. Your job: decide whether that barrier is REAL or should be OVERTURNED.',
    'A real barrier requires a real user to be ACTUALLY blocked: the SC\'s literal requirement is unmet, no recognized WCAG exception applies (e.g. essential image-of-text, decorative content), the element is exposed to assistive tech, programmatic context does not already resolve it, and you are not re-deriving a deterministic facet to manufacture a failure.',
    'Examine the rendered crop AND the structured evidence below. Judge ONLY from this evidence; do not assume facts not present.',
    '--- structured evidence ---',
    JSON.stringify(signals),
    '--- output ---',
    'Return STRICT JSON {"verdict":"BARRIER"|"NOT_BARRIER"|"UNSURE","reasoning":"one sentence"}. BARRIER = the flag stands; NOT_BARRIER = overturn it; UNSURE = cannot tell.',
  ].join('\n');
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const flagged = loadBaselineFlagged();
  console.log(`Gemini refuter (${MODEL}): ${flagged.length} baseline-flagged cases (caught ≥${FRAC}) — ${flagged.filter((f) => f.expected !== 'failed').length} GT-pass(FP) + ${flagged.filter((f) => f.expected === 'failed').length} GT-fail(TP)`);
  const sem = makeSemaphore(6);
  const results = [];
  await Promise.all(flagged.map((f) => sem.run(async () => {
    let pack; try { pack = JSON.parse(fs.readFileSync(path.join(PACKS_DIR, f.id + '.json'), 'utf8')); } catch (e) { return; }
    const subj = [...(pack.rubricSubjects || []), ...(pack.agentSubjects || [])].find((s) => s.xpath === f.xpath) || [...(pack.rubricSubjects || []), ...(pack.agentSubjects || [])].find((s) => s.sc === f.sc);
    if (!subj) { results.push({ ...f, gemini: 'NO_SUBJECT' }); return; }
    const signals = llmAdj.precomputeSignals(subj.element, subj.skill, subj.sc);
    const av = (pack.pOpts.visionByXpath || {})[f.xpath] || (pack.pOpts.visionByXpath || {})[subj.xpath] || {};
    const images = [];
    for (const st of ['element-crop', 'surrounding-region']) if (typeof av[st] === 'string' && av[st].length) images.push({ mediaType: 'image/png', data: av[st] });
    const g = await geminiJudge(refutePrompt(f.sc, signals, f.summary), images);
    results.push({ ...f, hadImages: images.length, gemini: g ? g.verdict : 'NULL', geminiReason: g ? g.reasoning : null });
  })));
  // asymmetry
  const fp = results.filter((r) => r.expected !== 'failed'), tp = results.filter((r) => r.expected === 'failed');
  const overturned = (r) => r.gemini === 'NOT_BARRIER';
  const fpFixed = fp.filter(overturned), tpLost = tp.filter(overturned);
  fs.writeFileSync(path.join(OUT, 'results.json'), JSON.stringify(results, null, 2));
  console.log(`\n=== Gemini diverse-refuter outcome ===`);
  console.log(`  FP cases (GT-pass Claude flagged): ${fp.length}  → Gemini OVERTURNED ${fpFixed.length}  (FP fixed)`);
  console.log(`    ${JSON.stringify(fp.map((r) => r.id.slice(0, 8) + '(' + r.sc + '):' + r.gemini))}`);
  console.log(`  TP cases (GT-fail Claude flagged): ${tp.length}  → Gemini OVERTURNED ${tpLost.length}  (recall LOST)`);
  console.log(`    ${JSON.stringify(tp.map((r) => r.id.slice(0, 8) + '(' + r.sc + '):' + r.gemini))}`);
  console.log(`  ASYMMETRY (FP-fixed / recall-lost) = ${tpLost.length ? (fpFixed.length / tpLost.length).toFixed(2) : (fpFixed.length ? '∞' : 'n/a')}  (want ≫1)`);
  console.log(`  → net effect on the stable set: FP ${fp.length}→${fp.length - fpFixed.length}, recall(of these) ${tp.length}→${tp.length - tpLost.length}`);
}
main().catch((e) => { console.error(e && e.stack || e); process.exit(1); });
