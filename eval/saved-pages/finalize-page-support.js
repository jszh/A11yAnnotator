#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const F = require('./page-support-finalize.js');

const ROOT = path.join(__dirname, '..', '..');

function arg(name, fallback) {
  const exact = `--${name}`;
  const hit = process.argv.find((value) => value === exact || value.startsWith(`${exact}=`));
  if (!hit) return fallback;
  if (hit.startsWith(`${exact}=`)) return hit.slice(exact.length + 1);
  const next = process.argv[process.argv.indexOf(hit) + 1];
  return next && !next.startsWith('--') ? next : true;
}

function safe(value) {
  return String(value).replace(/[^a-z0-9_.-]+/gi, '-').replace(/^-+|-+$/g, '').slice(0, 100);
}

function main() {
  const inputName = String(arg('in', 'saved-pages-page-support-discovery-server'));
  const outputName = String(arg('out', `${inputName}-final`));
  const inputDir = path.resolve(ROOT, inputName.startsWith('/') ? inputName : path.join('results', inputName));
  const outputDir = path.resolve(ROOT, outputName.startsWith('/') ? outputName : path.join('results', outputName));
  const inputFile = path.join(inputDir, 'results.json');
  const source = JSON.parse(fs.readFileSync(inputFile, 'utf8'));
  if (!Array.isArray(source)) throw new Error(`${inputFile} must contain a page array`);

  const result = F.finalizePages(source);
  fs.mkdirSync(path.join(outputDir, 'pages'), { recursive: true });
  for (const page of result.pages) fs.writeFileSync(path.join(outputDir, 'pages', `${safe(page.file)}.json`), JSON.stringify(page, null, 2));
  fs.writeFileSync(path.join(outputDir, 'results.json'), JSON.stringify(result.pages, null, 2));
  fs.writeFileSync(path.join(outputDir, 'summary.json'), JSON.stringify(result.summary, null, 2));
  fs.writeFileSync(path.join(outputDir, 'manifest.json'), JSON.stringify({
    schema: 'saved-pages-page-support-final/1',
    createdAt: new Date().toISOString(),
    input: path.relative(ROOT, inputDir),
    inputSchema: (() => { try { return JSON.parse(fs.readFileSync(path.join(inputDir, 'manifest.json'), 'utf8')).schema || null; } catch { return null; } })(),
    policy: {
      decision: 'catalog applicability + typed support predicate; deterministic CLAIM only',
      exactDeduplication: 'page + SC + claim family + XPath obligation identity',
      patternClustering: 'non-scoring normalized-XPath grouping for repeated template instances',
      carryForward: 'existing 1.3.2 PROVISIONAL rows remain provisional',
      excludedFromFinal: ['semantic review candidates', '2.2.4/3.2.5 meta-refresh interpretations without harness families'],
    },
    summary: result.summary,
  }, null, 2));
  process.stdout.write(`${JSON.stringify(result.summary, null, 2)}\n`);
}

if (require.main === module) {
  try { main(); }
  catch (error) { console.error(error && error.stack || error); process.exit(1); }
}

module.exports = { main };
