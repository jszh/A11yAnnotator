#!/usr/bin/env node
'use strict';

// Adapt page-support semantic review subjects to the discovery contract used by
// evaluate-low-count-candidates.js. This deliberately includes only SCs that
// already have a current Harness v3 atomic rubric + obligation family.

const fs = require('fs');
const path = require('path');
const obligations = require('../../scripts/v3/lib/obligations.js');

const ROOT = path.join(__dirname, '..', '..');
const SUPPORTED = Object.freeze({
  '1.3.3': Object.freeze({ kind: 'sensory-text', claimFamily: 'sensory-characteristics' }),
});

function canonicalCollectorXpath(xpath) {
  // The original page-support/1 pass emitted body[1], while the current ACT
  // collector deliberately canonicalizes the unique HTML body as /html/body.
  return String(xpath || '').replace(/^\/html\/body\[1\](?=\/|$)/, '/html/body');
}

function arg(name, fallback) {
  const exact = `--${name}`;
  const hit = process.argv.find((value) => value === exact || value.startsWith(`${exact}=`));
  if (!hit) return fallback;
  if (hit.startsWith(`${exact}=`)) return hit.slice(exact.length + 1);
  const next = process.argv[process.argv.indexOf(hit) + 1];
  return next && !next.startsWith('--') ? next : true;
}

function main() {
  const inputName = String(arg('in', 'saved-pages-page-support-discovery-server'));
  const outputName = String(arg('out', 'saved-pages-page-support-semantic-discovery-server'));
  const inputDir = path.resolve(ROOT, inputName.startsWith('/') ? inputName : path.join('results', inputName));
  const outputDir = path.resolve(ROOT, outputName.startsWith('/') ? outputName : path.join('results', outputName));
  const pages = JSON.parse(fs.readFileSync(path.join(inputDir, 'results.json'), 'utf8'));
  const candidates = [];
  const seen = new Set();
  for (const page of pages) for (const row of page.candidates || []) {
    const spec = SUPPORTED[row.sc];
    if (!spec || row.kind !== spec.kind || !row.xpath) continue;
    const xpath = canonicalCollectorXpath(row.xpath);
    const obligationId = obligations.oblId(xpath, row.sc, spec.claimFamily);
    const key = `${page.file}\0${obligationId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    candidates.push({
      page: page.file,
      xpath,
      sc: row.sc,
      claimFamily: spec.claimFamily,
      obligationId,
      source: 'full-page-support-discovery',
      evidence: row.evidence,
    });
  }
  candidates.sort((a, b) => a.page.localeCompare(b.page) || a.xpath.localeCompare(b.xpath));
  const results = pages.map((page) => ({ key: page.key, file: page.file, name: page.name, noscript: !!page.noscript }));
  const targets = Object.keys(SUPPORTED);
  const summary = {
    schema: 'saved-elements-low-count-discovery/1',
    generatedAt: new Date().toISOString(),
    source: path.relative(ROOT, inputDir),
    pages: results.length,
    candidateObligations: candidates.length,
    targets,
    bySc: Object.fromEntries(targets.map((sc) => [sc, {
      candidates: candidates.filter((row) => row.sc === sc).length,
      pages: new Set(candidates.filter((row) => row.sc === sc).map((row) => row.page)).size,
    }])),
  };
  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(path.join(outputDir, 'results.json'), JSON.stringify(results, null, 2));
  fs.writeFileSync(path.join(outputDir, 'candidates.json'), JSON.stringify(candidates, null, 2));
  fs.writeFileSync(path.join(outputDir, 'summary.json'), JSON.stringify(summary, null, 2));
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

if (require.main === module) {
  try { main(); }
  catch (error) { console.error(error && error.stack || error); process.exit(1); }
}

module.exports = { SUPPORTED, canonicalCollectorXpath, main };
