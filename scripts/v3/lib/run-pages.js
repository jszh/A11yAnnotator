'use strict';
// PAGE-LEVEL PARALLELISM (PHASE 2). Run orchestrate() for MANY pages over ONE shared browser + ONE shared tab
// allocator, so the allocator's cap bounds total open tabs GLOBALLY across all in-flight pages — not per page.
// This is the payoff of the central allocator: 5–10 pages can run at once and the only real throttle is maxTabs
// (memory/CPU-bound), with per-item walls + timer-pause keeping each page's budgets honest under contention.
//
// Two independent knobs:
//   • pageConcurrency — how many pages' orchestrate() run at once (a page also does scheduling/build/gating work
//     beyond tabs; this bounds that CPU/heap, not tabs).
//   • maxTabs (the allocator) — the GLOBAL cap on concurrently-open tabs; excess tab requests queue (FIFO).
// They compose: N pages each wanting experimentConcurrency tabs demand up to N×conc tabs; the allocator caps the
// sum at maxTabs and parks the rest (timer-paused), so memory stays bounded no matter how many pages are in flight.
//
// SCOPE: shares the EXPERIMENT-lane browser (the dominant tab consumer). The opt-in LLM tool session, vision
// capture, and instrument lanes still open their own browsers per page (separate, bounded) — folding them onto
// the shared allocator is a follow-on. The deterministic lane — the common case — is fully shared here.

const puppeteer = require('puppeteer');
const { createTabAllocator } = require('./tab-allocator.js');
const { orchestrate } = require('./orchestrator.js');
const { CHROME } = require('./run-experiments.js');

async function runPagesParallel(pageSpecs, opts = {}) {
  const specs = Array.isArray(pageSpecs) ? pageSpecs : [];
  const executablePath = opts.executablePath || CHROME;
  const maxTabs = opts.maxTabs;
  const pageConcurrency = Math.max(1, Number(opts.pageConcurrency) || Math.min(specs.length || 1, 8));
  const browser = await puppeteer.launch({ executablePath, headless: 'new', args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const alloc = createTabAllocator({ browser, maxTabs });
  const results = new Array(specs.length).fill(null);
  try {
    // Bounded page pool over the SHARED browser + allocator (order-preserving slots, like runPool). Each page is
    // self-contained — its own collect/drive/resolveUrl — and tabs are isolated per attempt, so concurrent pages
    // never cross-contaminate; the allocator just throttles the union of their tab opens.
    let cursor = 0;
    const worker = async () => {
      while (true) {
        const i = cursor++;
        if (i >= specs.length) return;
        const spec = specs[i];
        try {
          const out = await orchestrate(spec.collect, spec.drive, {
            ...(opts.orchestrateOpts || {}), ...(spec.opts || {}),
            resolveUrl: spec.resolveUrl || (opts.resolveUrlFor ? opts.resolveUrlFor(spec) : (spec.opts && spec.opts.resolveUrl)),
            executablePath, browser, tabAllocator: alloc, maxTabs,
          });
          results[i] = { spec, out };
        } catch (e) { results[i] = { spec, error: e }; }
        if (opts.onPageDone) { try { await opts.onPageDone(results[i], i); } catch (e) {} }
      }
    };
    const c = Math.min(pageConcurrency, specs.length || 1);
    await Promise.all(Array.from({ length: c }, () => worker()));
  } finally {
    alloc.close();
    await browser.close().catch(() => {});
  }
  return { results, allocStats: alloc.stats() };
}

module.exports = { runPagesParallel };
