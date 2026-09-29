'use strict';
// Case loaders. Each returns [{ id, url, scs, expected?, meta }] where `scs` is the criteria InterA11y evaluates
// on that page. Case ids match the existing scorers: ACT (ruleId, testcaseId), supplementary 585 / act-augmented
// (`aug-<sc>-<aspect>-<id>`), saved pages (the page-list key).
const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { SCS } = require('../src/criteria/index.js');
const { CONFIG } = require('../src/core/config.js');

const ROOT = CONFIG.root;
const OURS = new Set(SCS);
const safe = (s) => String(s).replace(/[^a-z0-9_]+/gi, '-').slice(0, 80);
const fileUrl = (rel) => pathToFileURL(path.join(ROOT, rel)).href;

// ACT and supplementary pages are evaluated from their label-free copies (eval/neutral-corpus.js): the originals'
// titles ("Failed Example 2"), paths (rule id, aspect under test) and asset folder names give the answer away.
let neutral = null;
function neutralUrl(rel) {
  if (!neutral) {
    const f = path.join(ROOT, 'eval/corpus-neutral/map.json');
    if (!fs.existsSync(f)) throw new Error('eval/corpus-neutral/map.json is missing: run node intera11y/eval/neutral-corpus.js');
    neutral = JSON.parse(fs.readFileSync(f, 'utf8'));
  }
  if (!neutral[rel]) throw new Error(`no label-free copy of ${rel}: rebuild with node intera11y/eval/neutral-corpus.js`);
  return fileUrl(neutral[rel]);
}

function act() {
  const raw = JSON.parse(fs.readFileSync(path.join(ROOT, 'eval/checker-comparison/upstream-evidence/v3-act-subset-proposed/raw.json'), 'utf8'));
  const rows = Array.isArray(raw) ? raw : raw.cases || raw.rows;
  const out = [];
  for (const r of rows) {
    if (r.error) continue;
    const scs = (r.sc || []).filter((s) => OURS.has(s));
    if (!scs.length) continue;
    const rel = `eval/checker-comparison/act-subset/pages/${r.ruleId}/${r.testcaseId}.html`;
    if (!fs.existsSync(path.join(ROOT, rel))) continue;
    out.push({ id: `${r.ruleId}/${r.testcaseId}`, url: neutralUrl(rel), scs, expected: r.expected,
      meta: { ruleId: r.ruleId, testcaseId: r.testcaseId, ruleName: r.ruleName, sc: r.sc, reachesLlm: !r.axeFlag && !r.v3Flag } });
  }
  return out;
}

function supplementary() {
  const cases = JSON.parse(fs.readFileSync(path.join(ROOT, 'eval/act-augmented/_tools/full-supplementary-585-cases.json'), 'utf8'));
  return cases.filter((c) => OURS.has(c.sc)).map((c) => ({
    id: `aug-${c.sc}-${safe(c.aspect)}-${safe(c.id)}`, url: neutralUrl(c.file), scs: [c.sc], expected: c.expected,
    meta: { testcaseId: `aug-${c.sc}-${safe(c.aspect)}-${safe(c.id)}`, sc: c.sc, aspect: c.aspect, source: c.source, key: c.key },
  }));
}

// act-augmented pages outside the supplementary-585 draw: the development pool (labels unvalidated).
function augmentedDev() {
  const drawn = new Set(JSON.parse(fs.readFileSync(path.join(ROOT, 'eval/act-augmented/_tools/full-supplementary-585-cases.json'), 'utf8')).map((c) => c.file));
  const out = [];
  for (const sc of SCS) {
    const f = path.join(ROOT, 'eval/act-augmented', sc, 'result.json');
    if (!fs.existsSync(f)) continue;
    const r = JSON.parse(fs.readFileSync(f, 'utf8'));
    for (const a of r.aspectResults || []) for (const p of (a.built && a.built.pages) || []) {
      if (drawn.has(p.file) || !fs.existsSync(path.join(ROOT, p.file))) continue;
      const id = `aug-${sc}-${safe(a.aspect)}-${safe(p.id)}`;
      out.push({ id, url: fileUrl(p.file), scs: [sc], expected: p.expected, meta: { testcaseId: id, sc, aspect: a.aspect, scenario: (p.scenario || '').slice(0, 300) } });
    }
  }
  return out;
}

function savedPages(base = process.env.A11Y_BASE || 'http://127.0.0.1:3001') {
  const list = JSON.parse(fs.readFileSync(path.join(ROOT, 'eval/56-page-baselines/page-list-56.json'), 'utf8')).pages;
  return list.map((p) => ({
    id: p.key, url: `${base}/assets/${p.assetDir}/${encodeURIComponent(p.file)}${p.query || ''}`, scs: SCS.slice(),
    meta: { file: p.file, name: p.name, noscript: p.noscript },
  }));
}

// The saved pages, each evaluated only on the elements annotated in the expert study (P2–P5 study manifests):
// per criterion, the annotated elements' XPath keys, or every candidate when the study has a page-scope case for
// that criterion on the page.
function expertAnnotated() {
  const { key } = require('../src/lib/xpath.js');
  const SRC = path.join(ROOT, 'docs/chi-evidence/claim5-expert-study');
  const byFile = new Map();
  for (const f of ['round1-manifest.json', 'round2-manifest.json']) {
    for (const c of JSON.parse(fs.readFileSync(path.join(SRC, f), 'utf8')).cases) {
      if (!OURS.has(c.sc)) continue;
      const file = String(c.page.file).normalize('NFC');
      const t = byFile.get(file) || {};
      const s = t[c.sc] || (t[c.sc] = { page: false, keys: new Set() });
      if (c.scope === 'page') s.page = true; else s.keys.add(key(c.xpath));
      byFile.set(file, t);
    }
  }
  return savedPages().filter((p) => byFile.has(String(p.meta.file).normalize('NFC'))).map((p) => {
    const targets = byFile.get(String(p.meta.file).normalize('NFC'));
    return { ...p, scs: Object.keys(targets), targets };
  });
}

// The validated cases split once into development and test (eval/split.js): ACT stratified by rule, the
// human-annotated supplementary cases by aspect. Generated (unvalidated) supplementary cases are excluded.
const { assign } = require('./split.js');
function validated(which) {
  const a = act();
  const sa = assign(a, (c) => c.meta.ruleId);
  const s = supplementary().filter((c) => c.meta.source === 'human-annotated');
  const ss = assign(s, (c) => `${c.meta.sc}|${c.meta.aspect}`);
  return [...a.filter((c) => sa.get(c.id) === which), ...s.filter((c) => ss.get(c.id) === which)];
}

const CORPORA = { act, supplementary, 'augmented-dev': augmentedDev, 'saved-pages': savedPages,
  'validated-dev': () => validated('dev'), 'validated-test': () => validated('test'), 'expert-annotated': expertAnnotated };
module.exports = { CORPORA, validated };
