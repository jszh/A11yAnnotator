'use strict';
/**
 * The one true Chrome argument list for every browser this repo launches.
 *
 * WHY THIS IS A MODULE AND NOT A LOCAL ARRAY: `--allow-file-access-from-files`
 * is load-bearing for correctness, and omitting it fails SILENTLY. Without it,
 * a `file://` page's <frame>/<iframe> `contentDocument` is null under Chrome's
 * opaque-origin policy, so the collector returns ZERO elements from inside that
 * frame — no error, no warning, just a page that looks emptier than it is. A run
 * launched without the flag under-collects frame-bearing pages and still reports
 * clean metrics.
 *
 * This bit us for real: every full-suite run before 2026-07-01 19:20 UTC
 * (`skip-sonnet-46`, `claude-sonnet-full`, `sonnet5-full`, `run10-deployed-current`,
 * …) launched its browser with a hand-rolled `['--no-sandbox','--disable-dev-shm-usage']`
 * and therefore never saw inside a frame on 47/581 act-subset pages. run-fn-llm.js
 * was fixed at `f1b5bd86`; ~20 other launch sites were not, so the same silent
 * loss kept happening in the fp-experiments and the v3 page libraries.
 *
 * `--autoplay-policy=no-user-gesture-required` matters for media-bearing SCs
 * (1.2.x / 1.4.2 / 2.2.2) where a probe must observe playback it did not click.
 *
 * Import this. Do not re-declare the array — a local copy is how the drift starts.
 */

const BROWSER_ARGS = [
  '--no-sandbox',
  '--disable-dev-shm-usage',
  '--allow-file-access-from-files',
  '--autoplay-policy=no-user-gesture-required',
];

module.exports = { BROWSER_ARGS };
