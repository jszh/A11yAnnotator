#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '../../../..');
const DEFAULT_PACK = path.join(ROOT, 'docs/analysis/improvement-research-2026-06/evidence/broad-scope-state-prompt-pack/state-prompts.json');
const DEFAULT_OUT = path.join(ROOT, 'docs/analysis/improvement-research-2026-06/evidence/broad-scope-state-prompt-pack/comparison.json');

function parseArgs(argv) {
  const opts = { pack: DEFAULT_PACK, review: '', out: DEFAULT_OUT };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--pack') opts.pack = path.resolve(ROOT, argv[++i]);
    else if (a === '--review') opts.review = path.resolve(ROOT, argv[++i]);
    else if (a === '--out') opts.out = path.resolve(ROOT, argv[++i]);
    else if (a === '--help') {
      console.log('usage: node compare-broad-scope-state-review.js --review review.json [--pack state-prompts.json] [--out comparison.json]');
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

function acceptable(entry, verdict) {
  if (entry.expected === 'negative') return verdict === 'LIKELY_OK' || verdict === 'UNCERTAIN';
  if (entry.expected === 'positive') return verdict === 'LIKELY_BARRIER' || verdict === 'UNCERTAIN';
  return verdict === 'UNCERTAIN';
}

function unsafe(entry, verdict) {
  if (entry.expected === 'negative' && verdict === 'LIKELY_BARRIER') return true;
  if (entry.expected === 'positive' && verdict === 'LIKELY_OK') return true;
  return false;
}

function loadAnswerKey(packPath) {
  const answerPath = path.join(path.dirname(packPath), 'answer-key.json');
  if (!fs.existsSync(answerPath)) return new Map();
  const answer = JSON.parse(fs.readFileSync(answerPath, 'utf8'));
  return new Map((answer.entries || []).map((e) => [String(e.id), e]));
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const pack = JSON.parse(fs.readFileSync(opts.pack, 'utf8'));
  const answerKey = loadAnswerKey(opts.pack);
  const reviews = readReview(opts.review);
  const byId = new Map(reviews.map((r) => [String(r.id || ''), r]));
  const rows = [];
  for (const entry of pack.entries || []) {
    const key = answerKey.get(String(entry.id)) || {};
    const gradedEntry = { ...entry, expected: entry.expected || key.expected };
    const r = byId.get(entry.id);
    if (!r) continue;
    const verdict = String(r.verdict || '');
    rows.push({
      id: entry.id,
      aspect: entry.aspect,
      expected: gradedEntry.expected,
      verdict,
      acceptable: acceptable(gradedEntry, verdict),
      unsafe: unsafe(gradedEntry, verdict),
      summary: r.summary || '',
      reasoning: r.reasoning || '',
    });
  }
  const summary = {
    generatedAt: new Date().toISOString(),
    totalReviewed: rows.length,
    acceptable: rows.filter((r) => r.acceptable).length,
    unsafe: rows.filter((r) => r.unsafe).length,
    verdicts: rows.reduce((m, r) => { m[r.verdict] = (m[r.verdict] || 0) + 1; return m; }, {}),
  };
  fs.mkdirSync(path.dirname(opts.out), { recursive: true });
  fs.writeFileSync(opts.out, JSON.stringify({ summary, rows }, null, 2) + '\n');
  console.log(opts.out);
}

main();
