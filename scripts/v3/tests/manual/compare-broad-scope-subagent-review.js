#!/usr/bin/env node
'use strict';

// Compare a saved subagent/LLM review JSON array against the prompt-pack sample.
// This is intentionally simple: it records agreement with the fixture-direction
// expectation and highlights cases where the safer answer is UNCERTAIN.

const fs = require('node:fs');
const path = require('node:path');
const reviewLib = require('../../lib/broad-scope-llm-review.js');

const ROOT = path.resolve(__dirname, '../../../..');
const DEFAULT_PACK = path.join(ROOT, 'docs/analysis/improvement-research-2026-06/evidence/broad-scope-subagent-prompt-pack/sample-prompts.json');
const DEFAULT_OUT = path.join(ROOT, 'docs/analysis/improvement-research-2026-06/evidence/broad-scope-subagent-prompt-pack/comparison.json');

function parseArgs(argv) {
  const opts = { pack: DEFAULT_PACK, review: '', criticReview: '', out: DEFAULT_OUT };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--pack') opts.pack = path.resolve(ROOT, argv[++i]);
    else if (a === '--review') opts.review = path.resolve(ROOT, argv[++i]);
    else if (a === '--critic-review') opts.criticReview = path.resolve(ROOT, argv[++i]);
    else if (a === '--out') opts.out = path.resolve(ROOT, argv[++i]);
    else if (a === '--help') {
      console.log('usage: node compare-broad-scope-subagent-review.js --review judge.json [--critic-review critic.json] [--pack sample-prompts.json] [--out comparison.json]');
      process.exit(0);
    } else {
      throw new Error(`unknown argument: ${a}`);
    }
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

function expectedForEntry(e) {
  if (!e.packet) return 'NO_PACKET_SCOPED_OK';
  return e.expectedDirection || 'UNCERTAIN';
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
  const criticReviews = opts.criticReview ? readReview(opts.criticReview) : [];
  const byId = new Map(reviews.map((r) => [String(r.id || r.packetId || ''), r]));
  const criticById = new Map(criticReviews.map((r) => [String(r.id || r.packetId || ''), r]));
  const rows = [];
  for (const e of pack.entries || []) {
    const key = answerKey.get(String(e.id)) || {};
    const expected = expectedForEntry({ ...e, expectedDirection: e.expectedDirection || key.expectedDirection });
    const r = byId.get(e.id) || byId.get(e.packetId || '');
    const c = criticById.get(e.id) || criticById.get(e.packetId || '');
    const reconciled = r && c ? reviewLib.reconcileJudgeCritic(r, c) : (r ? reviewLib.normalizeJudge(r) : null);
    const verdict = reconciled ? String(reconciled.verdict || '') : 'MISSING';
    const judgment = e.packet && reconciled ? reviewLib.reviewToJudgment(e.packet, reconciled) : null;
    rows.push({
      id: e.id,
      packetId: e.packetId || null,
      aspect: e.aspect,
      expected,
      judgeVerdict: r ? String(r.verdict || '') : 'MISSING',
      criticResponse: c ? String(c.response || '') : '',
      verdict,
      agreesWithFixtureDirection: verdict === expected,
      saferThanFixtureDirection: expected === 'LIKELY_BARRIER' && verdict === 'UNCERTAIN',
      unsafeClear: verdict === 'LIKELY_OK' && expected !== 'LIKELY_OK',
      convertedToJudgment: !!judgment,
      missing: !r,
      criticMissing: !!r && !!opts.criticReview && !c,
      summary: r && r.summary || '',
      reasoning: r && r.reasoning || '',
    });
  }
  const summary = {
    generatedAt: new Date().toISOString(),
    total: rows.length,
    missing: rows.filter((r) => r.missing).length,
    criticMissing: rows.filter((r) => r.criticMissing).length,
    criticUsed: !!opts.criticReview,
    exactAgreement: rows.filter((r) => r.agreesWithFixtureDirection).length,
    saferUncertain: rows.filter((r) => r.saferThanFixtureDirection).length,
    unsafeClear: rows.filter((r) => r.unsafeClear).length,
    convertedToJudgment: rows.filter((r) => r.convertedToJudgment).length,
    verdicts: rows.reduce((m, r) => {
      m[r.verdict] = (m[r.verdict] || 0) + 1;
      return m;
    }, {}),
  };
  fs.mkdirSync(path.dirname(opts.out), { recursive: true });
  fs.writeFileSync(opts.out, JSON.stringify({ summary, rows }, null, 2) + '\n');
  console.log(opts.out);
}

main();
