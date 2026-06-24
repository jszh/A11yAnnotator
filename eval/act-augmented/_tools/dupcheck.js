#!/usr/bin/env node
// Self-Instruct-style near-duplicate gate for a directory of generated test pages.
// Research basis: Self-Instruct keeps a new sample only if its ROUGE-L similarity to
// every existing one is < 0.7 (arXiv:2212.10560). For HTML we augment that lexical
// signal with a DOM-STRUCTURAL signal (tag-bigram Jaccard), since two pages can use
// different prose yet be the same structural stub. Reports near-duplicate pairs so the
// constructor (or a repair pass) can diversify the more generic one.
//
// Usage: node dupcheck.js <dir-of-case-*.html> [--threshold 0.8]
// Output: JSON { files, pairs:[{a,b,textSim,domSim,combined}], maxCombined }
const fs = require('fs');
const path = require('path');

const dir = process.argv[2];
if (!dir) { console.error('need <dir>'); process.exit(2); }
const ti = process.argv.indexOf('--threshold');
const THRESH = ti !== -1 ? parseFloat(process.argv[ti + 1]) : 0.8;

const files = fs.readdirSync(dir).filter(f => /^case-\d+\.html$/i.test(f)).sort();
function visibleText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .toLowerCase().trim();
}
function tagSeq(html) {
  const m = html.match(/<([a-zA-Z][a-zA-Z0-9]*)/g) || [];
  return m.map(t => t.slice(1).toLowerCase());
}
function shingles(tokens, n) {
  const s = new Set();
  for (let i = 0; i + n <= tokens.length; i++) s.add(tokens.slice(i, i + n).join(' '));
  return s;
}
function jaccard(a, b) {
  if (!a.size && !b.size) return 1;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

const docs = files.map(f => {
  const html = fs.readFileSync(path.join(dir, f), 'utf8');
  const words = visibleText(html).split(' ').filter(Boolean);
  return { f, textShingles: shingles(words, 5), domBigrams: shingles(tagSeq(html), 2) };
});

const pairs = [];
let maxCombined = 0;
for (let i = 0; i < docs.length; i++) {
  for (let j = i + 1; j < docs.length; j++) {
    const textSim = +jaccard(docs[i].textShingles, docs[j].textShingles).toFixed(3);
    const domSim = +jaccard(docs[i].domBigrams, docs[j].domBigrams).toFixed(3);
    const combined = +(0.6 * textSim + 0.4 * domSim).toFixed(3);
    if (combined > maxCombined) maxCombined = combined;
    if (combined >= THRESH) pairs.push({ a: docs[i].f, b: docs[j].f, textSim, domSim, combined });
  }
}
pairs.sort((x, y) => y.combined - x.combined);
process.stdout.write(JSON.stringify({ dir, files, threshold: THRESH, maxCombined, nearDuplicatePairs: pairs }, null, 2));
