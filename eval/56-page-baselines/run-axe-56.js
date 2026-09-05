#!/usr/bin/env node
'use strict';

// Standalone axe-core baseline over the SAME 56 saved pages the Gemini-3.7 harness run used.
//
// Parity with the harness run (results/56-page-runs/current/…-combined-repaired):
//   • same page list + per-page `?offline=1[&noscript=1]` query (eval/56-page-baselines/page-list-56.json)
//   • same axe build (axe.min.js), same tag set, same in-page xpathOf() so every axe node resolves to
//     the SAME v3 xpath scheme the harness element records use — that is what makes a row-level
//     comparison against the 774-element sample possible at all.
//
// Unlike the collector's opt-in pass this keeps the FULL axe result (every violating rule and node,
// not just the surfaced allow-list), and additionally emits the harness's surfaced view so both
// framings are on record.
//
//   node eval/56-page-baselines/run-axe-56.js --out=axe-56-<date> [--pages=8] [--base=http://127.0.0.1:3001]

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const puppeteer = require('puppeteer');

const ROOT = path.join(__dirname, '..', '..');
require('../../scripts/v3/lib/load-env.js').loadEnv(ROOT);
const { BROWSER_ARGS } = require('../../scripts/v3/lib/orchestrator.js');
const { assetUrlUnder } = require('../../scripts/lib/asset-paths.js');
const { surfaceAxeFindings, wcagTagToSc } = require('../../scripts/v3/lib/axe-surface.js');

function arg(name, def = null) {
  const exact = `--${name}`;
  const p = process.argv.find((x) => x === exact || x.startsWith(exact + '='));
  if (!p) return def;
  if (p.startsWith(exact + '=')) return p.slice(exact.length + 1);
  const next = process.argv[process.argv.indexOf(p) + 1];
  return next && !next.startsWith('--') ? next : true;
}

const RUN_NAME = String(arg('out', 'axe-56'));
const OUT = path.join(ROOT, 'results', RUN_NAME);
const BASE = String(arg('base', process.env.A11Y_BASE || 'http://127.0.0.1:3001'));
const PAGE_CONC = Math.max(1, Number(arg('pages', 8)) || 8);
const CHROME = process.env.CHROME_PATH || process.env.PUPPETEER_EXECUTABLE_PATH || undefined;
const AXE_PATH = process.env.AXE_PATH || path.join(ROOT, 'axe.min.js');
const LIST = path.resolve(ROOT, String(arg('list', 'eval/56-page-baselines/page-list-56.json')));
const SAMPLE = path.resolve(ROOT, String(arg('sample',
  'results/56-page-runs/stratified-sample-500-plus-proportional-llm-partials.json')));
const NAV_TIMEOUT = Math.max(1000, Number(arg('nav-timeout-ms', 120000)) || 120000);

const normXpath = (v) => String(v || '').replace(/\[1\](?=\/|$)/g, '');
const safe = (s) => String(s).replace(/[^A-Za-z0-9._-]+/g, '-').slice(0, 120);

// The in-page pass: inject axe, run it, and resolve every node target to the collector's xpath scheme.
// Kept byte-identical in behaviour to scripts/v3/lib/act-page-collect.js's xpathOf/resolveXpath so the
// two runs' xpaths are comparable; here we keep every violation + incomplete rule rather than a subset.
async function runAxeInPage(page) {
  return page.evaluate(async () => {
    function xpathOf(e) {
      if (!e || !e.tagName) return '';
      if (e === document.documentElement) return '/html';
      if (e === document.body && e.tagName === 'BODY') return '/html/body';
      const tag = e.tagName.toLowerCase();
      let idx = 1;
      for (let s = e.previousElementSibling; s; s = s.previousElementSibling) if (s.tagName === e.tagName) idx++;
      return xpathOf(e.parentElement) + '/' + tag + '[' + idx + ']';
    }
    const resolveXpath = (target) => {
      try {
        if (Array.isArray(target) && target.length > 1) return null; // cross-frame: never mis-attribute
        const sel = Array.isArray(target) ? target[0] : target;
        const el = sel ? document.querySelector(sel) : null;
        return el ? xpathOf(el) : null;
      } catch (e) { return null; }
    };
    const cfg = {
      runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
      resultTypes: ['violations', 'incomplete'],
    };
    const r = await axe.run(document, cfg);
    const map = (arr) => (arr || []).map((v) => ({
      id: v.id, impact: v.impact, help: v.help,
      tags: v.tags || [],
      wcag: (v.tags || []).filter((t) => /^wcag\d/.test(t)),
      nodes: (v.nodes || []).map((n) => ({ target: n.target, xpath: resolveXpath(n.target) })),
    }));
    return { engine: (axe.version || null), violations: map(r.violations), incomplete: map(r.incomplete) };
  });
}

function rowsFor(pageFile, axeData) {
  const rows = [];
  const emit = (list, kind) => {
    for (const v of list || []) {
      const scs = [...new Set((v.wcag || []).map(wcagTagToSc).filter(Boolean))];
      for (const n of (v.nodes && v.nodes.length ? v.nodes : [null])) {
        const target = n && Array.isArray(n.target) ? n.target.join(' ') : (n && n.target != null ? String(n.target) : null);
        const xpath = (n && typeof n.xpath === 'string' && n.xpath) || null;
        // A rule with no wcag tag (best-practice) still gets a row with sc:null so the raw axe
        // output is never silently dropped; the surfaced view is where the SC mapping is opinionated.
        for (const sc of (scs.length ? scs : [null])) {
          rows.push({ page: pageFile, ruleId: v.id, sc, impact: v.impact || null, kind,
                      xpath, normalizedXpath: xpath ? normXpath(xpath) : null, cssTarget: target });
        }
      }
    }
  };
  emit(axeData.violations, 'violation');
  emit(axeData.incomplete, 'incomplete');
  return rows;
}

async function main() {
  fs.mkdirSync(path.join(OUT, 'pages'), { recursive: true });
  const list = JSON.parse(fs.readFileSync(LIST, 'utf8'));
  const specs = list.pages;
  const health = await fetch(BASE + '/engine/status').catch(() => null);
  if (!health || !health.ok) throw new Error(`annotator server is not reachable at ${BASE}`);

  const manifest = {
    schema: '56-page-axe-baseline/1', runName: RUN_NAME, startedAt: new Date().toISOString(),
    base: BASE, pageList: path.relative(ROOT, LIST), sourceRun: list.sourceRun,
    axePath: path.relative(ROOT, AXE_PATH), pageConc: PAGE_CONC,
    axeConfig: { tags: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'],
                 resultTypes: ['violations', 'incomplete'] },
  };
  try { manifest.commit = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim(); } catch { manifest.commit = null; }
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));

  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: BROWSER_ARGS, protocolTimeout: 300000 });
  const results = [];
  const errors = [];
  let cursor = 0;
  const worker = async () => {
    while (true) {
      const i = cursor++;
      if (i >= specs.length) return;
      const spec = specs[i];
      const url = assetUrlUnder(BASE, spec.file) + spec.query;
      const started = Date.now();
      let page = null;
      try {
        page = await browser.newPage();
        page.setDefaultNavigationTimeout(NAV_TIMEOUT);
        await page.goto(url, { waitUntil: 'load', timeout: NAV_TIMEOUT });
        await page.addScriptTag({ path: AXE_PATH });
        const axeData = await runAxeInPage(page);
        const rows = rowsFor(spec.file, axeData);
        const surfaced = surfaceAxeFindings({ axeRan: true, axe: axeData.violations, axeIncomplete: axeData.incomplete });
        fs.writeFileSync(path.join(OUT, 'pages', safe(spec.file) + '.json'),
          JSON.stringify({ spec, url, axe: axeData, rows, surfaced: surfaced.findings }, null, 2));
        results.push({ page: spec.file, name: spec.name, url, ran: true,
          violationRules: axeData.violations.length, incompleteRules: axeData.incomplete.length,
          rows: rows.length, violationRows: rows.filter((r) => r.kind === 'violation').length,
          surfacedFindings: surfaced.findings.length, elapsedMs: Date.now() - started });
        console.log(`[${results.length + errors.length}/${specs.length}] ${spec.file} — ` +
          `${axeData.violations.length} violation rules / ${rows.filter((r) => r.kind === 'violation').length} rows ` +
          `(${Date.now() - started}ms)`);
      } catch (e) {
        errors.push({ page: spec.file, error: String(e && e.message || e) });
        results.push({ page: spec.file, name: spec.name, url, ran: false, error: String(e && e.message || e) });
        console.log(`[${results.length + errors.length}/${specs.length}] ${spec.file} — ERROR ${e && e.message}`);
      } finally { if (page) await page.close().catch(() => {}); }
    }
  };
  await Promise.all(Array.from({ length: Math.min(PAGE_CONC, specs.length) }, worker));
  await browser.close();

  // Row-level tie-back to the 774-element sample: which sampled (page, xpath) elements does axe flag,
  // and under which SC. This is the join the harness-vs-axe comparison needs.
  let sampleJoin = null;
  if (fs.existsSync(SAMPLE)) {
    const sample = JSON.parse(fs.readFileSync(SAMPLE, 'utf8'));
    const allRows = specs.flatMap((s) => {
      const f = path.join(OUT, 'pages', safe(s.file) + '.json');
      return fs.existsSync(f) ? JSON.parse(fs.readFileSync(f, 'utf8')).rows : [];
    });
    const byPageXpath = new Map();
    for (const r of allRows) {
      if (!r.normalizedXpath) continue;
      const k = `${r.page}|${r.normalizedXpath}`;
      if (!byPageXpath.has(k)) byPageXpath.set(k, []);
      byPageXpath.get(k).push(r);
    }
    const entries = (sample.entries || []).map((e) => {
      const k = `${e.page}|${normXpath(e.normalizedXpath || e.xpath)}`;
      const hits = byPageXpath.get(k) || [];
      const sameSc = hits.filter((h) => h.sc === e.sc);
      return { key: e.key, page: e.page, sc: e.sc, recordKind: e.recordKind,
               normalizedXpath: normXpath(e.normalizedXpath || e.xpath),
               axeAnyRuleOnElement: hits.length > 0,
               axeSameScViolation: sameSc.some((h) => h.kind === 'violation'),
               axeSameScIncomplete: sameSc.some((h) => h.kind === 'incomplete'),
               axeRules: [...new Set(hits.map((h) => `${h.ruleId}:${h.kind}`))],
               axeSameScRules: [...new Set(sameSc.map((h) => `${h.ruleId}:${h.kind}`))] };
    });
    sampleJoin = {
      sample: path.relative(ROOT, SAMPLE), entries: entries.length,
      axeSameScViolation: entries.filter((e) => e.axeSameScViolation).length,
      axeSameScAny: entries.filter((e) => e.axeSameScViolation || e.axeSameScIncomplete).length,
      axeAnyRuleOnElement: entries.filter((e) => e.axeAnyRuleOnElement).length,
      rows: entries,
    };
    fs.writeFileSync(path.join(OUT, 'sample-join.json'), JSON.stringify(sampleJoin, null, 2));
  }

  const ran = results.filter((r) => r.ran);
  const summary = {
    schema: '56-page-axe-baseline-summary/1', runName: RUN_NAME, base: BASE,
    pages: specs.length, ran: ran.length, errors: errors.length,
    totals: {
      violationRules: ran.reduce((n, r) => n + r.violationRules, 0),
      incompleteRules: ran.reduce((n, r) => n + r.incompleteRules, 0),
      violationRows: ran.reduce((n, r) => n + r.violationRows, 0),
      rows: ran.reduce((n, r) => n + r.rows, 0),
      surfacedFindings: ran.reduce((n, r) => n + r.surfacedFindings, 0),
    },
    sampleJoin: sampleJoin ? { entries: sampleJoin.entries, axeSameScViolation: sampleJoin.axeSameScViolation,
      axeSameScAny: sampleJoin.axeSameScAny, axeAnyRuleOnElement: sampleJoin.axeAnyRuleOnElement } : null,
    errorList: errors, perPage: results,
  };
  fs.writeFileSync(path.join(OUT, 'summary.json'), JSON.stringify(summary, null, 2));
  console.log(`\nDONE  pages=${summary.ran}/${summary.pages} errors=${summary.errors}  ` +
    `violationRows=${summary.totals.violationRows} surfaced=${summary.totals.surfacedFindings}`);
  if (sampleJoin) console.log(`sample join: ${sampleJoin.axeSameScViolation}/${sampleJoin.entries} sampled elements have a same-SC axe violation`);
  console.log(`wrote ${path.relative(ROOT, OUT)}/`);
  if (errors.length) process.exitCode = 1;
}

main().catch((e) => { console.error(e); process.exit(1); });
