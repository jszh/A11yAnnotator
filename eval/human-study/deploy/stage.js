#!/usr/bin/env node
/**
 * stage.js - assemble the Cloud Build context.
 *
 * The repository is 15GB and `assets/` alone is 10GB, almost none of which the
 * study needs. This copies out exactly the 51 page snapshots the sample refers
 * to (plus the `_files` directory each one loads its images and stylesheets
 * from), the vendored CDN replacements the offline serving rewrites to, and the
 * two servers - about 820MB - into a clean directory that can be uploaded as a
 * build context.
 *
 * It fails rather than warns on a missing page: a snapshot that is absent from
 * the image is a task a participant cannot do, and that is not something to
 * discover mid-session.
 *
 * Usage: node eval/human-study/deploy/stage.js [--out=<dir>] [--sample=<file>]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '../../..');
const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const m = /^--([^=]+)(?:=(.*))?$/.exec(a);
  return m ? [m[1], m[2] === undefined ? true : m[2]] : [a, true];
}));
const OUT = path.resolve(args.out || path.join(ROOT, '.deploy-context'));
const SAMPLE = path.resolve(ROOT, args.sample || 'eval/human-study/sample/study-sample-200.json');

const copy = (from, to) => fs.cpSync(from, to, { recursive: true, dereference: true });
const bytes = (p) => {
  let total = 0;
  const walk = (f) => {
    const st = fs.statSync(f);
    if (st.isDirectory()) for (const e of fs.readdirSync(f)) walk(path.join(f, e));
    else total += st.size;
  };
  walk(p);
  return total;
};

const sample = JSON.parse(fs.readFileSync(SAMPLE, 'utf8'));

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(OUT, { recursive: true });

// --- the pages the sample actually uses -----------------------------------
const pages = [...new Set(sample.cases.map((c) => `${c.page.assetDir}/${c.page.file}`))].sort();
const missing = [];
let copied = 0;
for (const rel of pages) {
  const src = path.join(ROOT, 'assets', rel);
  if (!fs.existsSync(src)) { missing.push(rel); continue; }
  const dst = path.join(OUT, 'assets', rel);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  copy(src, dst);
  copied++;
  // Save-As puts a page's subresources in a sibling directory named after it.
  // Both spellings occur in this corpus.
  const dir = path.dirname(rel);
  const base = path.basename(rel);
  for (const cand of [`${base.replace(/\.[^.]+$/, '')}_files`, `${base}_files`]) {
    const s = path.join(ROOT, 'assets', dir, cand);
    if (fs.existsSync(s)) copy(s, path.join(OUT, 'assets', dir, cand));
  }
}
if (missing.length) {
  console.error(`FAIL - ${missing.length} page(s) in the sample are not in assets/:`);
  for (const m of missing) console.error(`  ${m}`);
  process.exit(1);
}

// pages.json is small and a couple of the page server's routes read it.
for (const f of ['pages.json']) {
  const src = path.join(ROOT, 'assets', f);
  if (fs.existsSync(src)) copy(src, path.join(OUT, 'assets', f));
}

// --- the servers and their static files -----------------------------------
copy(path.join(ROOT, 'vendor'), path.join(OUT, 'vendor'));
copy(path.join(ROOT, 'server.js'), path.join(OUT, 'server.js'));
copy(path.join(__dirname, 'Dockerfile'), path.join(OUT, 'Dockerfile'));

const studyOut = path.join(OUT, 'eval/human-study');
fs.mkdirSync(studyOut, { recursive: true });
for (const f of ['server.js', 'lib', 'public', 'sc-guidance.json']) copy(path.join(ROOT, 'eval/human-study', f), path.join(studyOut, f));
fs.mkdirSync(path.join(studyOut, 'sample'), { recursive: true });
copy(SAMPLE, path.join(studyOut, 'sample', path.basename(SAMPLE)));
// Deliberately not copied: test/ (never runs in the image), sample/pool-*.json
// (a build-time artifact), data/ (local state that must not ship anywhere).

// A package.json with no dependencies, so nothing tries to install at build
// time and `type: commonjs` still applies to both servers.
fs.writeFileSync(path.join(OUT, 'package.json'), `${JSON.stringify({
  name: 'a11y-human-study',
  version: '1.0.0',
  private: true,
  type: 'commonjs',
  scripts: { start: 'node eval/human-study/server.js' },
}, null, 2)}\n`);

// --- report ---------------------------------------------------------------
const mb = (n) => `${(n / 1e6).toFixed(1)} MB`;
console.log(`context -> ${OUT}`);
console.log(`  pages     ${copied}`);
console.log(`  assets    ${mb(bytes(path.join(OUT, 'assets')))}`);
console.log(`  vendor    ${mb(bytes(path.join(OUT, 'vendor')))}`);
console.log(`  app       ${mb(bytes(path.join(OUT, 'eval')) + bytes(path.join(OUT, 'server.js')))}`);
console.log(`  total     ${mb(bytes(OUT))}`);
