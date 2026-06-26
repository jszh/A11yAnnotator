#!/usr/bin/env node
'use strict';

// Audit the generated broad-scope prompt pack using the real prompt builders and
// v3 bridge. This is a no-network integration check: it does not grade WCAG truth,
// but it proves which fixture packets are sidecar-only, which have complete
// structural evidence for a barrier bridge, and whether any broad-scope clear can
// accidentally enter the v3 judgment lane.

const fs = require('node:fs');
const path = require('node:path');

const review = require('../../lib/broad-scope-llm-review.js');

const ROOT = path.resolve(__dirname, '../../../..');
const DEFAULT_PACK = path.join(ROOT, 'docs/analysis/improvement-research-2026-06/evidence/broad-scope-subagent-prompt-pack/prompts.json');
const DEFAULT_OUT = path.join(ROOT, 'docs/analysis/improvement-research-2026-06/evidence/broad-scope-subagent-prompt-pack/integration-audit.json');

function parseArgs(argv) {
  const opts = { pack: DEFAULT_PACK, out: DEFAULT_OUT };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--pack') opts.pack = path.resolve(ROOT, argv[++i]);
    else if (a === '--out') opts.out = path.resolve(ROOT, argv[++i]);
    else if (a === '--help') {
      console.log('usage: node audit-broad-scope-prompt-pack.js [--pack prompts.json] [--out integration-audit.json]');
      process.exit(0);
    } else {
      throw new Error(`unknown argument: ${a}`);
    }
  }
  return opts;
}

function blankAspect() {
  return {
    rows: 0,
    positives: 0,
    negatives: 0,
    packetEntries: 0,
    noPacketEntries: 0,
    structuralBarrierReady: 0,
    barrierBridgeable: 0,
    clearBridgeable: 0,
    promptsMissingProcedureRules: 0,
    promptsMissingExpectedVisualRef: 0,
    expectedDirections: {},
    missingEvidence: {},
  };
}

function bump(map, key, n = 1) {
  const k = key || 'NONE';
  map[k] = (map[k] || 0) + n;
}

function promptText(messages) {
  return (messages || []).map((m) => `${m.role || ''}\n${m.content || ''}`).join('\n');
}

function promptHasProcedureRules(packet) {
  const judge = promptText(review.buildJudgePrompt(packet));
  const critic = promptText(review.buildCriticPrompt(packet, { verdict: 'LIKELY_BARRIER', confidence: 'medium' }));
  return [
    'Use WCAG/Trusted Tester/EN semantics',
    'Absence of evidence is not a pass',
    'Do not clear from absence of a finding',
    'Return UNCERTAIN when scope',
    'Attack both false positives and false negatives',
    'Any missing evidence, scope gap, exception, or contradiction',
    'requiredEvidence',
  ].every((needle) => judge.includes(needle) || critic.includes(needle));
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
  const rows = [];
  const byAspect = {};
  for (const e of pack.entries || []) {
    const expected = e.expected || (answerKey.get(String(e.id)) || {}).expected;
    const expectedDirection = e.expectedDirection || (answerKey.get(String(e.id)) || {}).expectedDirection;
    const aspect = String(e.aspect || 'unknown');
    const b = byAspect[aspect] || (byAspect[aspect] = blankAspect());
    b.rows++;
    if (expected === 'positive') b.positives++;
    if (expected === 'negative') b.negatives++;
    bump(b.expectedDirections, expectedDirection);

    if (!e.packet) {
      b.noPacketEntries++;
      rows.push({
        id: e.id,
        aspect,
        expected,
        expectedDirection,
        packet: false,
        structuralEvidenceOk: false,
        barrierBridgeable: false,
        clearBridgeable: false,
        promptHasProcedureRules: false,
        missingEvidence: [],
      });
      continue;
    }

    b.packetEntries++;
    const structural = review.structuralEvidenceStatus(e.packet);
    if (structural.ok) b.structuralBarrierReady++;
    for (const m of structural.missing) bump(b.missingEvidence, m);
    const barrierBridgeable = !!review.reviewToJudgment(e.packet, {
      verdict: 'LIKELY_BARRIER',
      confidence: 'high',
      evidenceRefs: e.packet.evidenceRefs || [],
      summary: 'audit barrier bridge check',
      reasoning: 'audit barrier bridge check',
    });
    const clearBridgeable = !!review.reviewToJudgment(e.packet, {
      verdict: 'LIKELY_OK',
      confidence: 'high',
      evidenceRefs: e.packet.evidenceRefs || [],
      summary: 'audit clear bridge check',
      reasoning: 'audit clear bridge check',
    });
    const hasRules = promptHasProcedureRules(e.packet);
    const expectedVisualRef = ['visual-structure-discovery', 'visual-content-discovery'].includes(aspect) && expected === 'positive';
    const hasVisualRef = !!(e.packet.observed && e.packet.observed.hasVisualRef);
    if (barrierBridgeable) b.barrierBridgeable++;
    if (clearBridgeable) b.clearBridgeable++;
    if (!hasRules) b.promptsMissingProcedureRules++;
    if (expectedVisualRef && !hasVisualRef) b.promptsMissingExpectedVisualRef++;
    rows.push({
      id: e.id,
      packetId: e.packetId,
      aspect,
      expected,
      expectedDirection,
      packet: true,
      sc: e.packet.sc,
      claimFamily: e.packet.claimFamily,
      targetXpath: e.packet.targetXpath,
      structuralEvidenceOk: structural.ok,
      missingEvidence: structural.missing,
      barrierBridgeable,
      clearBridgeable,
      promptHasProcedureRules: hasRules,
      expectedVisualRef,
      hasVisualRef,
    });
  }

  const summary = {
    generatedAt: new Date().toISOString(),
    pack: path.relative(ROOT, opts.pack),
    totalEntries: rows.length,
    packetEntries: rows.filter((r) => r.packet).length,
    noPacketEntries: rows.filter((r) => !r.packet).length,
    structuralBarrierReady: rows.filter((r) => r.structuralEvidenceOk).length,
    barrierBridgeable: rows.filter((r) => r.barrierBridgeable).length,
    clearBridgeable: rows.filter((r) => r.clearBridgeable).length,
    promptsMissingProcedureRules: rows.filter((r) => r.packet && !r.promptHasProcedureRules).length,
    promptsMissingExpectedVisualRef: rows.filter((r) => r.packet && r.expectedVisualRef && !r.hasVisualRef).length,
    unsafe: {
      anyClearBridgeable: rows.some((r) => r.clearBridgeable),
      anyPromptMissingProcedureRules: rows.some((r) => r.packet && !r.promptHasProcedureRules),
      anyExpectedVisualRefMissing: rows.some((r) => r.packet && r.expectedVisualRef && !r.hasVisualRef),
    },
    byAspect,
  };

  fs.mkdirSync(path.dirname(opts.out), { recursive: true });
  fs.writeFileSync(opts.out, JSON.stringify({ summary, rows }, null, 2) + '\n');
  console.log(opts.out);
  if (summary.unsafe.anyClearBridgeable || summary.unsafe.anyPromptMissingProcedureRules || summary.unsafe.anyExpectedVisualRefMissing) process.exitCode = 1;
}

main();
