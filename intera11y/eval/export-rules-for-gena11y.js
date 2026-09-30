#!/usr/bin/env node
'use strict';
// Writes eval/gena11y/intera11y-rules.json: InterA11y's test rules for the six SCs GenA11y covers, rendered in
// GenA11y's header format (rubric variant 'rules': heading, pass condition, numbered rules, no tool names). The
// ablation ladder's step 2 runs GenA11y's pipeline with these rules in place of its own (runner.py --rules intera11y).
//
//   node intera11y/eval/export-rules-for-gena11y.js
const fs = require('fs');
const path = require('path');
const { render } = require('../src/judge/rubric.js');

const SIX = ['1.1.1', '1.4.1', '1.4.3', '2.4.4', '3.3.1', '4.1.2'];
const out = Object.fromEntries(SIX.map((sc) => [sc, render(sc, 'rules', { tools: false })]));
const file = path.join(__dirname, '..', '..', 'eval', 'gena11y', 'intera11y-rules.json');
fs.writeFileSync(file, JSON.stringify(out, null, 1));
console.log(`wrote ${path.relative(process.cwd(), file)} (${SIX.length} SCs)`);
