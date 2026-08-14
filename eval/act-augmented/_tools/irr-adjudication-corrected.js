#!/usr/bin/env node
/**
 * What does the IRR look like if the raises that adjudication cleared are
 * treated as not having happened?
 *
 * Two readings, both computed, because they answer different questions:
 *
 *   A  RESTRICTED  — drop the clear-adjudicated cases from the pool and measure
 *                    agreement on what is left. Answers "how well do the coders
 *                    agree on the cases that turned out to matter?" Biased
 *                    toward disagreement by construction: a case is in this pool
 *                    largely BECAUSE someone dissented.
 *
 *   B  CORRECTED   — keep every case, but where a coder raised a case that
 *                    adjudication cleared, revert that coder's Q1 to the corpus
 *                    label (their raise is treated as not made). Answers "how
 *                    much of the observed disagreement is attributable to raises
 *                    that did not survive checking?" Inflated by construction:
 *                    an adjudicator has partly overwritten the coders.
 *
 *   B-narrow       — as B, but only correcting cleared BARE CONTRADICTIONS
 *                    (a dissenting yes/no with nothing written down). This is
 *                    the most defensible correction: those raises carry the
 *                    least evidence and had the lowest hit rate.
 *
 * NEITHER A NOR B IS A REPORTABLE IRR. Both use the adjudication outcome, which
 * is not independent of the codings, so they are diagnostics for attributing the
 * observed disagreement — not estimates of rater reliability.
 *
 * Usage: node eval/act-augmented/_tools/irr-adjudication-corrected.js
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../..');
const IRR = path.join(ROOT, 'eval/act-augmented/_annotator/irr');

function kappaStats(pairs) {
  const n = pairs.length;
  if (n < 2) return { n, po: null, kappa: null, ac1: null };
  const po = pairs.filter(([a, b]) => a === b).length / n;
  let pe = 0;
  for (const l of ['yes', 'no']) {
    pe += (pairs.filter(([a]) => a === l).length / n) * (pairs.filter(([, b]) => b === l).length / n);
  }
  const kappa = pe === 1 ? null : (po - pe) / (1 - pe);
  const pi = {};
  for (const l of ['yes', 'no']) pi[l] = 0;
  for (const [a, b] of pairs) { pi[a] += 0.5 / n; pi[b] += 0.5 / n; }
  const peG = (pi.yes * (1 - pi.yes) + pi.no * (1 - pi.no)) / 1;
  return { n, po, kappa, ac1: peG === 1 ? null : (po - peG) / (1 - peG) };
}

function main() {
  const tags = new Map(JSON.parse(fs.readFileSync(path.join(IRR, 'case-reliability-tags.json'), 'utf8'))
    .cases.map((c) => [c.key, c.tag]));
  const m = JSON.parse(fs.readFileSync(path.join(ROOT, 'eval/act-augmented/_annotator/manifest.json'), 'utf8'));
  const corpusOf = new Map();
  for (const sc of m.scs) for (const a of sc.aspects) for (const p of a.pages) {
    corpusOf.set(`${sc.sc}::${a.slug}::${p.id}`, p.expected === 'failed' ? 'yes' : 'no');
  }

  const byKey = new Map();
  for (const f of fs.readdirSync(path.join(ROOT, 'annotations')).filter((f) => f.endsWith('.json')).sort()) {
    const doc = JSON.parse(fs.readFileSync(path.join(ROOT, 'annotations', f), 'utf8'));
    const who = doc.meta?.annotatorName || f;
    for (const [k, a] of Object.entries(doc.annotations)) {
      if (!byKey.has(k)) byKey.set(k, []);
      byKey.get(k).push({ annotator: who, ...a });
    }
  }

  const raiseKind = (c, corpus) => {
    const hasText = !!(c.commentText || '').trim();
    const complaint = (c.disposition === 'comment' || hasText)
      && (c.issueExists !== corpus || hasText || ['other-error', 'page-issue', 'other'].includes(c.commentReason));
    if (complaint) return 'complaint';
    if (c.issueExists !== corpus) return 'contradiction';
    return null;
  };

  const PAIRS = [['Davin', 'Ajit'], ['Mengqi', 'Ajit']];
  const build = (mode) => {
    const out = {};
    for (const [x, y] of PAIRS) {
      const pairs = [];
      let corrections = 0, dropped = 0;
      for (const [k, anns] of byKey) {
        const a = anns.find((c) => c.annotator === x);
        const b = anns.find((c) => c.annotator === y);
        if (!a || !b) continue;
        const corpus = corpusOf.get(k);
        const tag = tags.get(k);
        if (mode === 'restricted') {
          if (tag === 'clear') { dropped++; continue; }
          pairs.push([a.issueExists, b.issueExists]);
          continue;
        }
        const fix = (c) => {
          if (mode === 'baseline') return c.issueExists;
          if (tag !== 'clear') return c.issueExists;
          const kind = raiseKind(c, corpus);
          if (!kind) return c.issueExists;
          if (mode === 'corrected-narrow' && kind !== 'contradiction') return c.issueExists;
          if (c.issueExists !== corpus) corrections++;
          return corpus;
        };
        pairs.push([fix(a), fix(b)]);
      }
      out[`${x} x ${y}`] = { ...kappaStats(pairs), corrections, dropped };
    }
    const pooled = [];
    for (const [x, y] of PAIRS) {
      for (const [k, anns] of byKey) {
        const a = anns.find((c) => c.annotator === x);
        const b = anns.find((c) => c.annotator === y);
        if (!a || !b) continue;
        const corpus = corpusOf.get(k);
        const tag = tags.get(k);
        if (mode === 'restricted') { if (tag === 'clear') continue; pooled.push([a.issueExists, b.issueExists]); continue; }
        const fix = (c) => {
          if (mode === 'baseline') return c.issueExists;
          if (tag !== 'clear') return c.issueExists;
          const kind = raiseKind(c, corpus);
          if (!kind) return c.issueExists;
          if (mode === 'corrected-narrow' && kind !== 'contradiction') return c.issueExists;
          return corpus;
        };
        pooled.push([fix(a), fix(b)]);
      }
    }
    out.pooled = kappaStats(pooled);
    return out;
  };

  const modes = { baseline: build('baseline'), restricted: build('restricted'), corrected: build('corrected'), 'corrected-narrow': build('corrected-narrow') };
  const pct = (x) => (x == null ? 'n/a' : (x * 100).toFixed(1) + '%');
  const f3 = (x) => (x == null ? 'n/a' : x.toFixed(3));

  for (const [name, r] of Object.entries(modes)) {
    console.log(`\n== ${name.toUpperCase()}`);
    for (const [k, s] of Object.entries(r)) {
      console.log(`  ${k.padEnd(16)} n=${String(s.n).padStart(3)}  Po=${pct(s.po).padStart(6)}  kappa=${f3(s.kappa).padStart(7)}  AC1=${f3(s.ac1).padStart(6)}` +
        (s.corrections != null ? `  (labels reverted: ${s.corrections})` : '') + (s.dropped ? `  (cases dropped: ${s.dropped})` : ''));
    }
  }

  fs.writeFileSync(path.join(IRR, 'irr-adjudication-corrected.json'), JSON.stringify({
    schema: 'act-augmented-irr-corrected/1', generatedAt: new Date().toISOString(),
    warning: 'Diagnostic only. Both variants condition on the adjudication outcome, which is not independent of the codings. Do not report as an IRR estimate.',
    modes,
  }, null, 2));
  console.log(`\nwrote ${path.relative(ROOT, path.join(IRR, 'irr-adjudication-corrected.json'))}`);
}

main();
