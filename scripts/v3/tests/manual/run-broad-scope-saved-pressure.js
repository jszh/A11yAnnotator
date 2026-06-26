#!/usr/bin/env node
'use strict';

// Pressure-test the broad-scope sidecar on local saved HTML pages.
//
// This script intentionally does not call an LLM and does not publish v3 claims.
// It measures how many sidecar findings/review packets the broad-scope probes
// nominate on saved pages, then writes aggregate evidence for annotation planning.

const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { pathToFileURL } = require('node:url');
const puppeteer = require('puppeteer');

const probes = require('../../lib/broad-scope-probes.js');
const review = require('../../lib/broad-scope-llm-review.js');

const ROOT = path.resolve(__dirname, '../../../..');
const DEFAULT_OUT = path.join(ROOT, 'docs/analysis/improvement-research-2026-06/evidence/broad-scope-saved-pressure');
const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH
  || process.env.CHROME_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

function parseArgs(argv) {
  const out = {
    roots: ['assets/fixtures', 'act-rules/pages', 'eval/checker-comparison/act-subset/pages'],
    limit: 24,
    outDir: DEFAULT_OUT,
    captureTop: 5,
    elementCap: 2500,
    timeoutMs: 20000,
    manifestRoots: [],
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const next = () => argv[++i];
    if (a === '--roots') out.roots = next().split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--limit') out.limit = Number(next());
    else if (a === '--out') out.outDir = path.resolve(ROOT, next());
    else if (a === '--capture-top') out.captureTop = Number(next());
    else if (a === '--element-cap') out.elementCap = Number(next());
    else if (a === '--timeout-ms') out.timeoutMs = Number(next());
    else if (a === '--manifest-roots') out.manifestRoots = next().split(',').map((s) => s.trim()).filter(Boolean);
    else if (a === '--help') {
      console.log('usage: node run-broad-scope-saved-pressure.js [--roots a,b] [--limit n] [--out dir] [--capture-top n] [--element-cap n] [--timeout-ms n] [--manifest-roots a,b]');
      process.exit(0);
    } else {
      throw new Error(`unknown argument: ${a}`);
    }
  }
  out.limit = Number.isFinite(out.limit) && out.limit > 0 ? Math.floor(out.limit) : Infinity;
  out.captureTop = Number.isFinite(out.captureTop) && out.captureTop > 0 ? Math.floor(out.captureTop) : 0;
  out.elementCap = Number.isFinite(out.elementCap) && out.elementCap > 0 ? Math.floor(out.elementCap) : 2500;
  out.timeoutMs = Number.isFinite(out.timeoutMs) && out.timeoutMs > 0 ? Math.floor(out.timeoutMs) : 20000;
  return out;
}

function listHtmlFiles(rootRel) {
  return listFiles(rootRel, '.html');
}

function listJsonFiles(rootRel) {
  return listFiles(rootRel, '.json');
}

function listFiles(rootRel, ext) {
  const rootAbs = path.resolve(ROOT, rootRel);
  if (!fs.existsSync(rootAbs)) return [];
  const out = [];
  const walk = (dir) => {
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, ent.name);
      if (ent.isDirectory()) walk(p);
      else if (ent.isFile() && ent.name.toLowerCase().endsWith(ext)) out.push(path.relative(ROOT, p));
    }
  };
  walk(rootAbs);
  return out;
}

function sha256File(rel) {
  const h = crypto.createHash('sha256');
  h.update(fs.readFileSync(path.join(ROOT, rel)));
  return `sha256:${h.digest('hex')}`;
}

function countBy(rows, keyFn) {
  const out = {};
  for (const row of rows) {
    const k = keyFn(row) || 'unknown';
    out[k] = (out[k] || 0) + 1;
  }
  return Object.fromEntries(Object.entries(out).sort(([a], [b]) => a.localeCompare(b)));
}

function evidenceStrength(row = {}) {
  const detector = String(row.detector || row.aspect || '').toLowerCase();
  const mode = String(row.mode || '').toLowerCase();
  const detail = String(row.detail || '').toLowerCase();
  if (/context-change-dynamic|pointer-activation-dynamic/.test(detector)) return 'observed-trusted-state-delta';
  if (/audio-control-dynamic/.test(detector)) {
    return /observed advancing|playback observed/.test(detail) ? 'observed-playback' : 'applicability-risk-unproven-playback';
  }
  if (/flash-temporal/.test(detector)) return 'temporal-risk-threshold-unproven';
  if (/text-spacing|resize-text|forced-colors/.test(detector)) return 'visual-review-surface';
  if (/auth|captcha|paste|media|scope-media|audio-control/.test(detector)) return 'applicability-review-surface';
  if (/review-only|semantic|process|site-set|applicability/.test(mode)) return 'review-surface';
  if (/hybrid/.test(mode)) return 'hybrid-evidence';
  return 'candidate';
}

function pickRoundRobin(groups, limit) {
  const out = [];
  const seen = new Set();
  let i = 0;
  while (out.length < limit) {
    let added = false;
    for (const g of groups) {
      if (i >= g.length) continue;
      const rel = g[i];
      if (!seen.has(rel)) {
        seen.add(rel);
        out.push(rel);
        if (out.length >= limit) break;
      }
      added = true;
    }
    if (!added) break;
    i++;
  }
  return out;
}

function summarizePage(rel, artifact, elapsedMs) {
  const findings = artifact.findings || [];
  const packets = artifact.reviewPackets || [];
  return {
    file: rel,
    ran: artifact.ran !== false,
    error: artifact.error || null,
    elapsedMs,
    findingCount: findings.length,
    packetCount: packets.length,
    warningCount: (artifact.scopeWarnings || []).length,
    visualCheckCount: (artifact.visualChecks || []).length,
    researchAnnotationCount: (artifact.researchAnnotations || []).length,
    findingsByDetector: countBy(findings, (f) => f.detector),
    findingsBySc: countBy(findings, (f) => f.sc),
    packetsByAspect: countBy(packets, (p) => p.aspect),
    packetsByMode: countBy(packets, (p) => p.mode),
    warnings: artifact.scopeWarnings || [],
    topFindings: findings.slice(0, 20).map((f) => ({
      detector: f.detector,
      sc: f.sc,
      kind: f.kind,
      xpath: f.xpath,
      detail: f.detail,
      evidenceStrength: evidenceStrength(f),
      visualRef: f.visualRef || null,
    })),
  };
}

function analyzeManifestFile(rel) {
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
  } catch (e) {
    return { file: rel, ran: false, error: e && e.message ? e.message : String(e), packets: [] };
  }
  const lower = rel.toLowerCase();
  const looksProcess = lower.includes('complete-process') || Array.isArray(parsed.steps);
  const looksSite = lower.includes('site-set') || Array.isArray(parsed.pages);
  if (!looksProcess && !looksSite) return { file: rel, ran: true, ignored: true, packets: [] };
  const analysis = looksProcess ? probes.analyzeProcessManifest(parsed) : probes.analyzeSiteSetManifest(parsed);
  const packets = looksProcess
    ? review.buildReviewPacketsFromProcessAnalysis(analysis, { file: rel })
    : review.buildReviewPacketsFromSiteSetAnalysis(analysis, { file: rel });
  return {
    file: rel,
    ran: true,
    type: looksProcess ? 'process' : 'site-set',
    warningCount: (analysis.warnings || []).length,
    packetCount: packets.length,
    warnings: analysis.warnings || [],
    packets,
  };
}

async function capturePage(browser, rel, outPath, timeoutMs) {
  const page = await browser.newPage();
  try {
    await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 });
    await page.goto(pathToFileURL(path.join(ROOT, rel)).href, { waitUntil: 'load', timeout: timeoutMs });
    await new Promise((r) => setTimeout(r, 250));
    await page.screenshot({ path: outPath, fullPage: true });
  } finally {
    await page.close().catch(() => {});
  }
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));
  const groups = opts.roots.map((r) => listHtmlFiles(r).sort((a, b) => a.localeCompare(b)));
  const files = pickRoundRobin(groups, opts.limit);
  const manifestFiles = [...new Set(opts.manifestRoots.flatMap(listJsonFiles))]
    .sort((a, b) => a.localeCompare(b));
  fs.mkdirSync(opts.outDir, { recursive: true });
  fs.mkdirSync(path.join(opts.outDir, 'screenshots'), { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--allow-file-access-from-files', '--autoplay-policy=no-user-gesture-required'],
  });
  const pages = [];
  const artifacts = [];
  const manifests = manifestFiles.map(analyzeManifestFile).filter((m) => !m.ignored);
  const startedAt = new Date().toISOString();
  try {
    for (let i = 0; i < files.length; i++) {
      const rel = files[i];
      const t0 = Date.now();
      const artifact = await probes.runBroadScopeForUrl(pathToFileURL(path.join(ROOT, rel)).href, {
        browser,
        file: rel,
        runId: 'broad-scope-saved-pressure',
        pageDigest: sha256File(rel),
        elementCap: opts.elementCap,
        timeoutMs: opts.timeoutMs,
        settleMs: 150,
      });
      const elapsedMs = Date.now() - t0;
      artifacts.push(artifact);
      pages.push(summarizePage(rel, artifact, elapsedMs));
      console.log(`${i + 1}/${files.length} ${rel} — findings=${pages[pages.length - 1].findingCount} packets=${pages[pages.length - 1].packetCount}${artifact.ran === false ? ` ERROR ${artifact.error}` : ''}`);
    }

    const topPages = pages
      .filter((p) => p.ran)
      .sort((a, b) => (b.packetCount + b.findingCount) - (a.packetCount + a.findingCount))
      .slice(0, opts.captureTop);
    for (let i = 0; i < topPages.length; i++) {
      const safe = topPages[i].file.replace(/[^a-z0-9_.-]+/gi, '_').slice(0, 120);
      const shotRel = `screenshots/top-${String(i + 1).padStart(2, '0')}-${safe}.png`;
      await capturePage(browser, topPages[i].file, path.join(opts.outDir, shotRel), opts.timeoutMs).catch((e) => {
        topPages[i].screenshotError = e && e.message ? e.message : String(e);
      });
      if (!topPages[i].screenshotError) topPages[i].screenshot = shotRel;
    }

    const allFindings = artifacts.flatMap((a) => a.findings || []);
    const allPackets = artifacts.flatMap((a) => a.reviewPackets || []);
    const allWarnings = artifacts.flatMap((a) => a.scopeWarnings || []);
    const manifestPackets = manifests.flatMap((m) => m.packets || []);
    const manifestWarnings = manifests.flatMap((m) => m.warnings || []);
    const report = {
      generatedAt: new Date().toISOString(),
      startedAt,
      note: 'Broad-scope saved-page pressure test. Sidecar only; no LLM calls and no conformance publication.',
      options: { ...opts, outDir: path.relative(ROOT, opts.outDir) },
      pageCount: pages.length,
      ran: pages.filter((p) => p.ran).length,
      failed: pages.filter((p) => !p.ran).length,
      manifestCount: manifests.length,
      manifestRan: manifests.filter((m) => m.ran).length,
      manifestFailed: manifests.filter((m) => !m.ran).length,
      totals: {
        findings: allFindings.length,
        packets: allPackets.length,
        manifestPackets: manifestPackets.length,
        warnings: allWarnings.length,
        manifestWarnings: manifestWarnings.length,
        visualChecks: artifacts.reduce((n, a) => n + ((a.visualChecks || []).length), 0),
        researchAnnotations: artifacts.reduce((n, a) => n + ((a.researchAnnotations || []).length), 0),
      },
      findingsByDetector: countBy(allFindings, (f) => f.detector),
      findingsBySc: countBy(allFindings, (f) => f.sc),
      findingsByEvidenceStrength: countBy(allFindings, evidenceStrength),
      packetsByAspect: countBy(allPackets, (p) => p.aspect),
      packetsBySc: countBy(allPackets, (p) => p.sc),
      packetsByMode: countBy(allPackets, (p) => p.mode),
      packetsByEvidenceStrength: countBy(allPackets, evidenceStrength),
      manifestPacketsByAspect: countBy(manifestPackets, (p) => p.aspect),
      manifestWarningsByKind: countBy(manifestWarnings.map((w) => ({ warning: w })), (w) => w.warning),
      warningsByKind: countBy(allWarnings.map((w) => ({ warning: w })), (w) => w.warning),
      topPages,
      pages,
      manifests,
    };
    fs.writeFileSync(path.join(opts.outDir, 'results.json'), JSON.stringify(report, null, 2) + '\n');
    fs.writeFileSync(path.join(opts.outDir, 'artifacts.json'), JSON.stringify({ artifacts }, null, 2) + '\n');
    console.log(path.join(opts.outDir, 'results.json'));
  } finally {
    await browser.close().catch(() => {});
  }
}

main().catch((e) => {
  console.error(e && e.stack ? e.stack : e);
  process.exit(1);
});
