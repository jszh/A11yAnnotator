'use strict';
// PROBE (Tier-0 #5): the e88epe missedAgree fixture (<img aria-hidden="true" alt="W3C logo">) — confirm the
// collector now flags removedFromA11yTree / ariaHiddenWithName / renderedMeaningful, and the name-role-state
// precompute surfaces s.decorativeMarking so the adequacy rubric judges the PIXELS, not the hidden author name.
const path = require('path');
const puppeteer = require('puppeteer');
const { orchestrate } = require('../../lib/orchestrator.js');
const { createTabAllocator } = require('../../lib/tab-allocator.js');
const { collectActPage, normalizeCollectRoles } = require('../../lib/act-page-collect.js');
const llmAdj = require('../../lib/llm-adjudicator.js');
const { loadRubrics } = require('../../lib/rubric-loader.js');

const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT = path.join(__dirname, '..', '..', '..', '..');
const url = 'file://' + path.join(ROOT, 'eval/checker-comparison/act-subset/pages/e88epe/5d0c52f3b06b60f712efaa08eb6947f18494c241.html');

(async () => {
  const { rubrics } = loadRubrics();
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const alloc = createTabAllocator({ browser, maxTabs: 4 });
  const lease = await alloc.acquire();
  let collect;
  try { collect = normalizeCollectRoles(await collectActPage(lease.page, { url, elementCap: 80, file: 'p', runId: 'p', sourceUrl: url })); }
  finally { await lease.release(); }
  for (const el of collect.elements) {
    if (el.isImage || el.removedFromA11yTree) {
      console.log(`IMG ${el.xpath} tag=${el.tag} axName=${JSON.stringify(el.axName)}`);
      console.log(`    removedFromA11yTree=${el.removedFromA11yTree} hiddenMechanism=${el.hiddenMechanism} ariaHiddenWithName=${el.ariaHiddenWithName} renderedMeaningful=${el.renderedMeaningful}`);
    }
  }
  const out = await orchestrate(collect, { file: 'p', runId: 'p', pageDigest: collect.pageDigest, drivenAt: collect.collectedAt + 1, elements: [] }, { resolveUrl: () => url, browser, tabAllocator: alloc, now: collect.collectedAt + 2, maxAutomatic: 16, experimentConcurrency: 2 });
  const ledger = (out.built && out.built.results && out.built.results.obligationLedger) || [];
  const subjects = llmAdj.selectRubricSubjects(collect, ledger, rubrics).filter((s) => s.sc === '1.1.1' && s.skill === 'name-role-state');
  for (const subj of subjects) {
    const sig = llmAdj.precomputeSignals(subj.element, subj.skill);
    if (sig.decorativeMarking) {
      console.log(`SUBJECT ${subj.rubricId} xpath=${subj.xpath}`);
      console.log(`    signals.accessibleName = ${JSON.stringify(sig.accessibleName)}`);
      console.log(`    signals.decorativeMarking = ${JSON.stringify(sig.decorativeMarking)}`);
    }
  }
  if (!subjects.some((s) => llmAdj.precomputeSignals(s.element, s.skill).decorativeMarking)) console.log('(no decorativeMarking surfaced — check enumeration)');
  alloc.close(); await browser.close();
})().catch((e) => { console.error(e.stack || e); process.exit(1); });
