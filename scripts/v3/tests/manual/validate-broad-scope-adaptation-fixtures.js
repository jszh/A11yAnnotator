'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const puppeteer = require('puppeteer');
const probes = require('../../lib/broad-scope-probes.js');

const ROOT = path.resolve(__dirname, '../../../..');
const BASE = path.join(ROOT, 'scripts/v3/tests/generated/broad-scope/adaptation');
const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH
  || process.env.CHROME_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const EVIDENCE_CLAIMS = {
  'text-spacing': ['after-spacing-loss', 'before-after-visual-agreement', 'content-or-function-loss'],
  'resize-text': ['200-percent-text-size-loss', 'before-after-visual-agreement', 'content-or-function-loss'],
  'forced-colors': ['forced-colors-render', 'essential-meaning-or-affordance-loss'],
  'forced-colors-nontext': ['forced-colors-render', 'non-text-boundary-or-state-loss', 'essential-control-boundary'],
};

async function hasParallelNonEssentialMarker(page, path) {
  return page.evaluate((selector) => {
    const el = document.querySelector(selector);
    return !!el && el.getAttribute('data-v3-parallel-non-essential') === 'true';
  }, path).catch(() => false);
}

async function main() {
  const manifest = JSON.parse(fs.readFileSync(path.join(BASE, 'manifest.json'), 'utf8'));
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage', '--allow-file-access-from-files'] });
  const rows = [];
  try {
    for (const c of manifest.cases) {
      const url = pathToFileURL(path.join(ROOT, c.file)).href;
      const page = await browser.newPage();
      await page.goto(url, { waitUntil: 'load' });
      let hits = [];
      let evidenceClaims = [];
      let evidenceDetails = {};
      if (c.aspect === 'text-spacing') hits = (await probes.probeTextSpacing(page)).candidates.map((x) => x.path);
      else if (c.aspect === 'forced-colors') {
        const res = await probes.probeForcedColors(page);
        const proven = res.candidates.filter((x) => x.textContrastLoss);
        hits = proven.map((x) => x.path);
        evidenceDetails = {
          candidates: res.candidates.map((x) => ({
            path: x.path,
            textContrastLoss: x.textContrastLoss,
            nonTextBoundaryLoss: x.nonTextBoundaryLoss,
            beforeContrast: x.beforeContrast,
            afterContrast: x.afterContrast,
            beforeNonTextBoundaryContrast: x.beforeNonTextBoundaryContrast,
            afterNonTextBoundaryContrast: x.afterNonTextBoundaryContrast,
            reason: x.reason,
          })),
        };
      } else if (c.aspect === 'forced-colors-nontext') {
        const res = await probes.probeForcedColors(page);
        const proven = res.candidates.filter((x) => x.path === '#target' && x.nonTextBoundaryLoss);
        hits = proven.map((x) => x.path);
        evidenceDetails = {
          candidates: res.candidates.map((x) => ({
            path: x.path,
            focusable: x.focusable,
            textContrastLoss: x.textContrastLoss,
            nonTextBoundaryLoss: x.nonTextBoundaryLoss,
            beforeContrast: x.beforeContrast,
            afterContrast: x.afterContrast,
            beforeNonTextBoundaryContrast: x.beforeNonTextBoundaryContrast,
            afterNonTextBoundaryContrast: x.afterNonTextBoundaryContrast,
            reason: x.reason,
          })),
        };
      }
      else if (c.aspect === 'reduced-motion') {
        const res = await probes.probeReducedMotion(page);
        const proven = [];
        for (const x of res.candidates || []) {
          if (x.noWorkingPauseStopHide && await hasParallelNonEssentialMarker(page, x.path)) proven.push(x);
        }
        hits = proven.map((x) => x.path);
        if (proven.length) {
          evidenceClaims = ['auto-motion-persists', 'duration-or-looping', 'no-working-pause-stop-hide', 'parallel-non-essential-content'];
        }
        evidenceDetails = {
          candidates: (res.candidates || []).map((x) => ({
            path: x.path,
            names: x.names,
            durationMs: x.durationMs,
            infinite: x.infinite,
            active: x.active,
            parallelNonEssential: x.parallelNonEssential,
            essentialMotion: x.essentialMotion,
            noWorkingPauseStopHide: x.noWorkingPauseStopHide,
            workingPauseStopHide: x.workingPauseStopHide,
          })),
          controlEvidence: res.controlEvidence,
        };
      }
      else if (c.aspect === 'resize-text') hits = (await probes.probeResizeText(page)).candidates.map((x) => x.path);
      await page.close();
      const observedPositive = hits.includes('#target');
      if (observedPositive && !evidenceClaims.length) evidenceClaims = EVIDENCE_CLAIMS[c.aspect] || [];
      rows.push({ ...c, observedPositive, hits, evidenceClaims, evidenceDetails, pass: c.expected === 'positive' ? observedPositive : !observedPositive });
    }
  } finally {
    await browser.close();
  }
  const summary = {
    generatedAt: new Date().toISOString(),
    total: rows.length,
    pass: rows.filter((r) => r.pass).length,
    fail: rows.filter((r) => !r.pass).length,
    byAspect: {},
    rows,
  };
  for (const r of rows) {
    const k = `${r.aspect}:${r.expected}`;
    summary.byAspect[k] = summary.byAspect[k] || { total: 0, pass: 0, fail: 0 };
    summary.byAspect[k].total++;
    summary.byAspect[k][r.pass ? 'pass' : 'fail']++;
  }
  const out = path.join(BASE, 'validation.json');
  fs.writeFileSync(out, JSON.stringify(summary, null, 2) + '\n');
  console.log(out);
  if (summary.fail) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e && e.stack ? e.stack : e);
  process.exit(1);
});
