'use strict';

// Repro runner for the broad WCAG/Trusted-Tester/EN expansion prototype.
// It intentionally writes observations/review candidates, not v3 conformance claims.

const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');
const puppeteer = require('puppeteer');

const probes = require('../../lib/broad-scope-probes.js');

const ROOT = path.resolve(__dirname, '../../../..');
const OUT_DIR = path.join(ROOT, 'docs/analysis/improvement-research-2026-06/evidence/broad-scope-prototype');
const FX = path.join(OUT_DIR, 'fixtures');
const CHROME = process.env.PUPPETEER_EXECUTABLE_PATH
  || process.env.CHROME_PATH
  || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function openFixture(browser, name) {
  const page = await browser.newPage();
  await page.goto(pathToFileURL(path.join(FX, name)).href, { waitUntil: 'load' });
  return page;
}

async function main() {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: 'new',
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--allow-file-access-from-files'],
  });
  try {
    const manifest = JSON.parse(fs.readFileSync(path.join(FX, 'process-site.json'), 'utf8'));
    const scopePage = await openFixture(browser, 'scope-adaptation.html');
    const nonInterferencePage = await openFixture(browser, 'non-interference.html');
    const interactionPage = await openFixture(browser, 'interaction.html');
    const mediaAuthPage = await openFixture(browser, 'media-auth.html');
    const observations = {
      generatedAt: new Date().toISOString(),
      note: 'Prototype observations only. Do not publish as v3 conformance outcomes.',
      processScope: probes.analyzeProcessManifest(manifest.process),
      siteSetScope: probes.analyzeSiteSetManifest(manifest.siteSet),
      cognitiveResearch: probes.collectCognitiveCandidatesFromText(manifest.cognitiveText, { longSentenceWords: 25 }),
      scopeInventory: await probes.collectScopeInventory(scopePage, { elementCap: 1 }),
      textSpacing: await probes.probeTextSpacing(scopePage),
      reducedMotion: await probes.probeReducedMotion(scopePage),
      forcedColors: await probes.probeForcedColors(scopePage),
      nonInterference: await probes.collectNonInterferenceCandidates(nonInterferencePage),
      interaction: await probes.collectInteractionCandidates(interactionPage),
      mediaAlternatives: await probes.collectMediaAlternativeInventory(mediaAuthPage),
      authenticationAndEntry: await probes.collectAuthenticationAndEntryCandidates(mediaAuthPage),
    };
    await scopePage.close();
    await nonInterferencePage.close();
    await interactionPage.close();
    await mediaAuthPage.close();
    const out = path.join(OUT_DIR, 'observations.json');
    fs.writeFileSync(out, JSON.stringify(observations, null, 2) + '\n');
    console.log(out);
  } finally {
    await browser.close();
  }
}

main().catch((e) => {
  console.error(e && e.stack ? e.stack : e);
  process.exit(1);
});
