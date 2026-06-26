'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const puppeteer = require('puppeteer');
const probes = require('../../lib/broad-scope-probes.js');

const ROOT = path.resolve(__dirname, '../../../..');
const BASE = path.join(ROOT, 'scripts/v3/tests/generated/broad-scope/media-process-auth');
const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH
  || process.env.CHROME_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function main() {
  const jsonOnlyMerge = process.argv.includes('--json-only-merge');
  const manifest = JSON.parse(fs.readFileSync(path.join(BASE, 'manifest.json'), 'utf8'));
  const browser = jsonOnlyMerge ? null : await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage', '--allow-file-access-from-files'] });
  const rows = [];
  try {
    for (const c of manifest.cases) {
      if (jsonOnlyMerge && c.kind !== 'json') continue;
      let observedPositive = false;
      let details = [];
      let evidenceClaims = [];
      let evidenceDetails = {};
      let observedSc = '';
      if (c.kind === 'json') {
        const data = JSON.parse(fs.readFileSync(path.join(ROOT, c.file), 'utf8'));
        const result = c.aspect === 'complete-process' ? probes.analyzeProcessManifest(data) : probes.analyzeSiteSetManifest(data);
        details = result.warnings || [];
        evidenceClaims = Array.isArray(result.evidenceClaims) ? result.evidenceClaims : [];
        observedPositive = c.aspect === 'complete-process'
          ? evidenceClaims.includes('process-failure-observed')
          : c.aspect === 'site-set-consistency'
            ? evidenceClaims.includes('site-set-inconsistency-observed')
            : details.length > 0;
        evidenceDetails = result;
      } else {
        const page = await browser.newPage();
        await page.goto(pathToFileURL(path.join(ROOT, c.file)).href, { waitUntil: 'load' });
        if (c.aspect === 'media-alternatives') {
          const res = await probes.collectMediaAlternativeInventory(page);
          details = res.media.flatMap((m) => m.warnings.map((w) => `${m.path}:${w}`));
          observedPositive = details.length > 0;
          const target = res.media.find((m) => m.path === '#target') || res.media[0] || null;
          if (target && target.fixtureMeta && target.fixtureMeta.sc) observedSc = target.fixtureMeta.sc;
          evidenceClaims = [
            'owned-media-element',
            'media-content-model-observed',
            observedPositive ? 'alternative-missing-or-inadequate-observed' : 'adequate-alternative-or-exception-observed',
          ];
          evidenceDetails = {
            media: res.media.map((m) => ({
              path: m.path,
              tag: m.tag,
              fixtureMeta: m.fixtureMeta,
              tracks: m.tracks,
              nearbyTranscript: m.nearbyTranscript,
              adequacy: m.adequacy,
              warnings: m.warnings,
            })),
          };
        } else if (['redundant-entry', 'accessible-authentication'].includes(c.aspect)) {
          const res = await probes.collectAuthenticationAndEntryCandidates(page);
          details = res.candidates.map((x) => x.family);
          const relevant = c.aspect === 'redundant-entry' ? 'redundant-entry-review' : 'accessible-authentication';
          if (c.aspect === 'accessible-authentication') {
            const authCandidates = res.candidates.filter((x) => x.family === 'accessible-authentication' || x.family === 'captcha-authentication');
            observedPositive = authCandidates.some((x) => {
              const claims = new Set(Array.isArray(x.evidenceClaims) ? x.evidenceClaims : []);
              return claims.has('authentication-step')
                && (claims.has('cognitive-function-test') || x.family === 'captcha-authentication')
                && claims.has('missing-allowed-alternative-or-exception')
                && !claims.has('allowed-alternative-or-exception-declared');
            });
            if (observedPositive) evidenceClaims = ['authentication-step', 'cognitive-function-test', 'missing-allowed-alternative-or-exception'];
          } else {
            const redundantCandidates = res.candidates.filter((x) => x.family === relevant);
            observedPositive = redundantCandidates.some((x) => {
              const claims = new Set(Array.isArray(x.evidenceClaims) ? x.evidenceClaims : []);
              return claims.has('same-process')
                && claims.has('same-information-previously-provided')
                && claims.has('required-reentry')
                && claims.has('no-auto-populate-or-selection-exception')
                && !claims.has('auto-populate-selection-or-exception-declared');
            });
            if (observedPositive) {
              evidenceClaims = [
                'same-process',
                'same-information-previously-provided',
                'required-reentry',
                'no-auto-populate-or-selection-exception',
              ];
            }
          }
          evidenceDetails = res;
        } else if (c.aspect === 'language-readability-cognitive') {
          const res = await probes.collectCognitiveCandidates(page, { longSentenceWords: 25 });
          details = res.candidates.map((x) => x.family);
          observedPositive = res.candidates.some((x) => {
            const claims = new Set(Array.isArray(x.evidenceClaims) ? x.evidenceClaims : []);
            return claims.has('user-facing-required-text')
              && claims.has('reading-level-above-lower-secondary-after-removals')
              && claims.has('proper-names-and-titles-removed')
              && claims.has('no-supplemental-content-observed')
              && claims.has('no-lower-secondary-version-observed')
              && claims.has('supplement-adequacy-evaluated')
              && claims.has('reading-method-language-supported')
              && !claims.has('supplemental-content-declared')
              && !claims.has('lower-secondary-version-declared');
          });
          if (observedPositive) {
            evidenceClaims = [
              'user-facing-required-text',
              'reading-level-above-lower-secondary-after-removals',
              'proper-names-and-titles-removed',
              'no-supplemental-content-observed',
              'no-lower-secondary-version-observed',
              'supplement-adequacy-evaluated',
              'reading-method-language-supported',
            ];
          }
          evidenceDetails = res;
        }
        await page.close();
      }
      const reviewOnlyNegative = c.expected === 'negative' && ['language-readability-cognitive'].includes(c.aspect);
      let invalidReviewOnlyNegative = false;
      if (reviewOnlyNegative && observedPositive) {
        details = [...details, 'review-only-negative-produced-complete-barrier-evidence'];
        observedPositive = false;
        invalidReviewOnlyNegative = true;
      }
      rows.push({ ...c, ...(observedSc ? { sc: observedSc } : {}), observedPositive, details, evidenceClaims, evidenceDetails, reviewOnlyNegative, pass: invalidReviewOnlyNegative ? false : (reviewOnlyNegative ? true : (c.expected === 'positive' ? observedPositive : !observedPositive)) });
    }
  } finally {
    if (browser) await browser.close();
  }
  const out = path.join(BASE, 'validation.json');
  let finalRows = rows;
  if (jsonOnlyMerge && fs.existsSync(out)) {
    const existing = JSON.parse(fs.readFileSync(out, 'utf8'));
    const byId = new Map(rows.map((r) => [r.id, r]));
    finalRows = (existing.rows || []).map((r) => byId.get(r.id) || r);
    for (const r of rows) {
      if (!finalRows.some((x) => x.id === r.id)) finalRows.push(r);
    }
  }
  const summary = { generatedAt: new Date().toISOString(), total: finalRows.length, pass: finalRows.filter((r) => r.pass).length, fail: finalRows.filter((r) => !r.pass).length, byAspect: {}, rows: finalRows };
  for (const r of finalRows) {
    const k = `${r.aspect}:${r.expected}`;
    summary.byAspect[k] = summary.byAspect[k] || { total: 0, pass: 0, fail: 0 };
    summary.byAspect[k].total++;
    summary.byAspect[k][r.pass ? 'pass' : 'fail']++;
  }
  fs.writeFileSync(out, JSON.stringify(summary, null, 2) + '\n');
  console.log(out);
  if (summary.fail) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e && e.stack ? e.stack : e);
  process.exit(1);
});
