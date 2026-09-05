#!/usr/bin/env node
'use strict';

// Emit the canonical 56-page list used by the harness run
// results/56-page-runs/current/saved-elements-stratified774-gemini37-flash-high-20260820-combined-repaired,
// so the GenA11y and axe baselines load EXACTLY the same pages, with the same
// per-page load flags (?offline=1 and the per-page noscript switch), as the
// harness did. Reading the specs back out of the run's own page artifacts is
// what makes the three runs comparable — a re-derived sample would not be.
//
//   node eval/56-page-baselines/build-page-list.js [--run=<dir>] [--out=<file>]

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const { assetPath, assetDirFor } = require('../../scripts/lib/asset-paths.js');

function arg(name, def = null) {
  const exact = `--${name}`;
  const p = process.argv.find((x) => x === exact || x.startsWith(exact + '='));
  if (!p) return def;
  if (p.startsWith(exact + '=')) return p.slice(exact.length + 1);
  const next = process.argv[process.argv.indexOf(p) + 1];
  return next && !next.startsWith('--') ? next : true;
}

const RUN_DIR = path.resolve(ROOT, String(arg('run',
  'results/56-page-runs/current/saved-elements-stratified774-gemini37-flash-high-20260820-combined-repaired')));
const OUT = path.resolve(ROOT, String(arg('out', 'eval/56-page-baselines/page-list-56.json')));

const pagesDir = path.join(RUN_DIR, 'pages');
const files = fs.readdirSync(pagesDir).filter((f) => f.endsWith('.json'));
const pages = files.map((f) => {
  const spec = JSON.parse(fs.readFileSync(path.join(pagesDir, f), 'utf8')).spec;
  const rel = path.relative(ROOT, assetPath(spec.file));
  if (!fs.existsSync(path.join(ROOT, rel))) throw new Error(`corpus page missing: ${spec.file}`);
  return {
    key: spec.key,
    file: spec.file,
    name: spec.name,
    noscript: !!spec.noscript,
    assetDir: assetDirFor(spec.file),
    relPath: rel,
    // the exact query the harness appended when it loaded this page
    query: '?offline=1' + (spec.noscript ? '&noscript=1' : ''),
    sampledXpaths: (spec.xpaths || []).length,
  };
}).sort((a, b) => a.file.localeCompare(b.file));

const out = {
  schema: '56-page-baseline-page-list/1',
  generatedAt: new Date().toISOString(),
  sourceRun: path.relative(ROOT, RUN_DIR),
  pages,
  totals: { pages: pages.length, noscript: pages.filter((p) => p.noscript).length,
            sampledXpaths: pages.reduce((n, p) => n + p.sampledXpaths, 0) },
};
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(out, null, 2));
console.log(`wrote ${path.relative(ROOT, OUT)}: ${pages.length} pages ` +
            `(${out.totals.noscript} noscript, ${out.totals.sampledXpaths} sampled xpaths)`);
