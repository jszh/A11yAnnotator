#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../../../..');
const DEFAULT_PACK = path.join(ROOT, 'docs/analysis/improvement-research-2026-06/evidence/broad-scope-adversarial-state-pack/adversarial-state-prompts.json');
const DEFAULT_OUT = path.join(ROOT, 'docs/analysis/improvement-research-2026-06/evidence/broad-scope-adversarial-state-pack/comparison.json');

function parseArgs(argv) {
  const opts = { pack: DEFAULT_PACK, review: '', out: DEFAULT_OUT };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--pack') opts.pack = path.resolve(ROOT, argv[++i]);
    else if (a === '--review') opts.review = path.resolve(ROOT, argv[++i]);
    else if (a === '--out') opts.out = path.resolve(ROOT, argv[++i]);
    else if (a === '--help') {
      console.log('usage: node compare-broad-scope-adversarial-state-review.js --review review.json');
      process.exit(0);
    } else throw new Error(`unknown argument: ${a}`);
  }
  if (!opts.review) throw new Error('--review is required');
  return opts;
}

function readReview(file) {
  const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (Array.isArray(raw)) return raw;
  if (Array.isArray(raw.results)) return raw.results;
  if (Array.isArray(raw.reviews)) return raw.reviews;
  throw new Error('review JSON must be an array or contain results/reviews array');
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const pack = JSON.parse(fs.readFileSync(opts.pack, 'utf8'));
  const reviews = readReview(opts.review);
  const byId = new Map(reviews.map((r) => [String(r.id || ''), r]));
  const rows = [];
  for (const c of pack.cases || []) {
    const r = byId.get(c.id);
    const verdict = r ? String(r.verdict || '') : 'MISSING';
    rows.push({
      id: c.id,
      aspect: c.aspect,
      expected: c.expected,
      verdict,
      pass: verdict === c.expected,
      unsafeFalseClear: c.expected === 'LIKELY_BARRIER' && verdict === 'LIKELY_OK',
      unsafeFalseBarrier: c.expected === 'LIKELY_OK' && verdict === 'LIKELY_BARRIER',
      summary: r && r.summary || '',
      reasoning: r && r.reasoning || '',
    });
  }
  const summary = {
    generatedAt: new Date().toISOString(),
    total: rows.length,
    pass: rows.filter((r) => r.pass).length,
    fail: rows.filter((r) => !r.pass).length,
    unsafeFalseClear: rows.filter((r) => r.unsafeFalseClear).length,
    unsafeFalseBarrier: rows.filter((r) => r.unsafeFalseBarrier).length,
    verdicts: rows.reduce((m, r) => { m[r.verdict] = (m[r.verdict] || 0) + 1; return m; }, {}),
  };
  fs.mkdirSync(path.dirname(opts.out), { recursive: true });
  fs.writeFileSync(opts.out, JSON.stringify({ summary, rows }, null, 2) + '\n');
  console.log(opts.out);
}

main();
