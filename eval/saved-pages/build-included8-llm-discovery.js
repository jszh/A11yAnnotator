#!/usr/bin/env node
'use strict';

// Combine the page-support semantic lane with current atomic 2.2.2 candidates,
// excluding elements already reported by the earlier saved-page runs.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');

function arg(name, fallback) {
  const exact = `--${name}`;
  const hit = process.argv.find((value) => value === exact || value.startsWith(`${exact}=`));
  if (!hit) return fallback;
  if (hit.startsWith(`${exact}=`)) return hit.slice(exact.length + 1);
  const next = process.argv[process.argv.indexOf(hit) + 1];
  return next && !next.startsWith('--') ? next : true;
}

function resolveResult(value) {
  return path.resolve(ROOT, value.startsWith('/') ? value : path.join('results', value));
}

function detectedElementKey(page, row) {
  return `${page}\0${row.sc}\0${row.xpath || row.obligationId}`;
}

function readPriorDetectedKeys(sc) {
  const resultsDir = path.join(ROOT, 'results');
  const runDirs = [
    'saved-elements-gemini35-flash-lite-high-server',
    ...fs.readdirSync(resultsDir)
      .filter((name) => /^saved-elements-low-count-evaluation-server-round-\d+$/.test(name))
      .sort(),
  ];
  const out = new Set();
  for (const runName of runDirs) {
    const pagesDir = path.join(resultsDir, runName, 'pages');
    if (!fs.existsSync(pagesDir)) continue;
    for (const file of fs.readdirSync(pagesDir).filter((name) => name.endsWith('.json'))) {
      const doc = JSON.parse(fs.readFileSync(path.join(pagesDir, file), 'utf8'));
      const page = doc.spec && doc.spec.file || file;
      for (const row of doc.results && doc.results.obligationLedger || []) {
        if (row.sc === sc && row.disposition === 'PROVISIONAL' && !row.cleared) {
          out.add(detectedElementKey(page, row));
        }
      }
    }
  }
  return out;
}

function main() {
  const sensoryDir = resolveResult(String(arg('sensory', 'saved-pages-included8-sensory-discovery-current-20260820-server')));
  const atomicDir = resolveResult(String(arg('atomic', 'saved-elements-current-all26-discovery-20260820-server')));
  const outputDir = resolveResult(String(arg('out', 'saved-pages-included8-llm-discovery-current-20260820-server')));
  if (fs.existsSync(outputDir)) throw new Error(`output already exists: ${outputDir}`);

  const sensory = JSON.parse(fs.readFileSync(path.join(sensoryDir, 'candidates.json'), 'utf8'));
  const atomic = JSON.parse(fs.readFileSync(path.join(atomicDir, 'candidates.json'), 'utf8'));
  const prior = readPriorDetectedKeys('2.2.2');
  const motion = atomic.filter((row) => row.sc === '2.2.2' && !prior.has(detectedElementKey(row.page, row)));

  const seen = new Set();
  const candidates = [];
  for (const row of [...sensory, ...motion]) {
    const key = `${row.page}\0${row.obligationId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    candidates.push(row);
  }
  candidates.sort((a, b) => a.sc.localeCompare(b.sc) || a.page.localeCompare(b.page) || a.obligationId.localeCompare(b.obligationId));

  const results = JSON.parse(fs.readFileSync(path.join(sensoryDir, 'results.json'), 'utf8'));
  const targets = ['1.3.3', '2.2.2'];
  const summary = {
    schema: 'saved-elements-low-count-discovery/1',
    generatedAt: new Date().toISOString(),
    sources: [path.relative(ROOT, sensoryDir), path.relative(ROOT, atomicDir)],
    priorDetectionDedupe: 'page+sc+element',
    excludedPriorMotionCandidates: atomic.filter((row) => row.sc === '2.2.2').length - motion.length,
    pages: results.length,
    candidateObligations: candidates.length,
    targets,
    bySc: Object.fromEntries(targets.map((sc) => [sc, {
      candidates: candidates.filter((row) => row.sc === sc).length,
      pages: new Set(candidates.filter((row) => row.sc === sc).map((row) => row.page)).size,
    }])),
  };

  fs.mkdirSync(outputDir, { recursive: false });
  fs.writeFileSync(path.join(outputDir, 'results.json'), JSON.stringify(results, null, 2));
  fs.writeFileSync(path.join(outputDir, 'candidates.json'), JSON.stringify(candidates, null, 2));
  fs.writeFileSync(path.join(outputDir, 'summary.json'), JSON.stringify(summary, null, 2));
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

if (require.main === module) {
  try { main(); }
  catch (error) { console.error(error && error.stack || error); process.exit(1); }
}

module.exports = { detectedElementKey, readPriorDetectedKeys, main };
