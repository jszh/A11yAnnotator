#!/usr/bin/env node
'use strict';
// Print LLM conversations from a run's turns.jsonl as readable text, turn by turn.
//
//   node intera11y/eval/turns.js <run dir> [--id=<page id substring>] [--sc=2.4.7] [--stage=judge|screen] [--batch=0]
//                                          [--full]   (do not shorten long prompt text and tool results)
const fs = require('fs');
const path = require('path');

const args = Object.fromEntries(process.argv.slice(3).map((a) => { const m = /^--([^=]+)(?:=(.*))?$/.exec(a); return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true]; }));
const dir = process.argv[2];
if (!dir) { console.error('usage: turns.js <run dir> [--id=] [--sc=] [--stage=] [--batch=] [--full]'); process.exit(1); }
const cut = (s, n) => (args.full || s.length <= n ? s : `${s.slice(0, n)}… [${s.length - n} more chars]`);
const show = (v, n) => cut(typeof v === 'string' ? v : JSON.stringify(v, null, 1), n);

const rows = fs.readFileSync(path.join(dir, 'turns.jsonl'), 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l))
  .filter((r) => (!args.id || String(r.id || '').includes(args.id)) && (!args.sc || r.sc === args.sc)
    && (!args.stage || r.stage === args.stage) && (args.batch === undefined || String(r.batch ?? r.chunk) === String(args.batch)));

let lastConv = null;
for (const r of rows) {
  const conv = `${r.id} | ${r.sc} | ${r.stage} ${r.stage === 'judge' ? `batch ${r.batch}` : `chunk ${r.chunk}`}`;
  if (conv !== lastConv) { console.log(`\n${'='.repeat(100)}\n${conv}`); lastConv = conv; }
  if (r.turn === 'prompt') {
    console.log(`\n[prompt] model ${r.model} (${r.effort}), tool budget ${r.toolBudget}, tools: ${(r.tools || []).join(', ') || 'none'}`);
    if (r.candidates) console.log(`  candidates: ${r.candidates.join('\n              ')}`);
    console.log(`  system: ${show(r.system, 600)}`);
    for (const b of r.blocks || []) console.log(b.type === 'image' ? `  [image ${b.data}]` : `  ${show(b.text, 3000).replace(/\n/g, '\n  ')}`);
  } else if (r.role === 'model') {
    console.log(`\n[turn ${r.turn}] model — ${r.finishReason}, tools offered: ${r.toolsOffered}, ${r.usage ? `${r.usage.inputTokens} in / ${r.usage.outputTokens} out (${r.usage.thoughtTokens} thinking)` : ''}, ${r.ms} ms`);
    for (const p of r.parts || []) {
      if (p.thought !== undefined) console.log(`  (thinking) ${show(p.thought, 2000).replace(/\n/g, '\n             ')}`);
      else if (p.text !== undefined) console.log(`  ${show(p.text, 6000).replace(/\n/g, '\n  ')}`);
      else if (p.toolCall) console.log(`  → ${p.toolCall.name}(${JSON.stringify(p.toolCall.args)})`);
    }
  } else if (r.role === 'tool') {
    console.log(`  ← ${r.name} (${r.ms} ms): ${show(r.result, 1500)}`);
    for (const im of r.images || []) console.log(`     [image ${im}]`);
  } else if (r.role === 'harness') {
    console.log(`\n[turn ${r.turn}] harness: ${r.text}${r.because ? ` (after: ${r.because})` : ''}`);
  } else if (r.turn === 'end') {
    console.log(`\n[end] ${r.error ? `ERROR ${r.error}` : `finish ${r.finishReason}`}, tool calls ${r.toolCalls}, $${(r.usage && r.usage.costUsd || 0).toFixed(4)}`);
  } else if (r.error) {
    console.log(`\n[turn ${r.turn}] ERROR ${r.error} (${r.ms} ms)`);
  }
}
