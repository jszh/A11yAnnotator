'use strict';
// SINGLE SOURCE OF TRUTH for where a page-under-test loads from. A page lives in one of two assets sub-dirs:
//   - assets/saved/     the real-page CORPUS (large, gitignored, local-only)
//   - assets/fixtures/  the tracked synthetic TEST fixtures (fx-*.html)
// Every consumer — the tests AND the spawned loaders (eval-page.js / drive-page.js / run-evaluation.js) —
// MUST resolve the directory through here. So relocating fixtures is a ONE-LINE change (the FIXTURES/CORPUS
// constants below), and no subprocess loader can silently keep its own hardcoded copy (the failure mode that
// bit the assets/saved -> assets/fixtures move: a test-path grep missed the spawned drive-page/eval-page).
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..', '..'); // scripts/lib -> repo root
const FIXTURES = 'fixtures'; // tracked synthetic test pages
const CORPUS = 'saved';      // gitignored real-page corpus

// The assets sub-dir a page lives in: prefer the fixtures dir when the file is present there in the repo,
// else the corpus dir. (A spawned loader serving over http:// or a temp file:// base can't fs-check the base,
// so the check is against the REPO tree — correct for both the repo-served and the corpus cases.)
const assetDirFor = (file) => fs.existsSync(path.join(ROOT, 'assets', FIXTURES, file)) ? FIXTURES : CORPUS;
// absolute filesystem path to a page (page digests, fs reads)
const assetPath = (file) => path.join(ROOT, 'assets', assetDirFor(file), file);
// file:// URL to a page (tests that page.goto a fixture directly)
const assetFileUrl = (file) => 'file://' + assetPath(file);
// the page's path UNDER a base origin (loaders that serve over http://<server> or file://<tmp>)
const assetUrlUnder = (base, file) => `${base}/assets/${assetDirFor(file)}/${encodeURIComponent(file)}`;

module.exports = { ROOT, FIXTURES, CORPUS, assetDirFor, assetPath, assetFileUrl, assetUrlUnder };
