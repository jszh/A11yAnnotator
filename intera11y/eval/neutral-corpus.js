#!/usr/bin/env node
'use strict';
// Builds the label-free copies of the ACT and supplementary-585 pages that InterA11y and GenA11y evaluate
// (eval/corpus-neutral/, not tracked; rebuild with `node intera11y/eval/neutral-corpus.js`).
//
// The originals give the expected answer away to anything that reads a page's URL, title or markup:
//   - 456 of the 581 ACT pages are titled "Passed Example 3" / "Failed Example 1" / "Inapplicable Example 2";
//   - an ACT page's path holds its rule id (pages/<ruleId>/<testcaseId>.html), and its asset folders the rule's
//     name and id (test-assets/links-with-identical-names-serve-equivalent-purpose-b20e66/...), which appear in
//     every src/href the judge reads;
//   - a supplementary page's path holds the aspect under test (1.1.1/pages/meaningful-image-suppressed-as-
//     decorative/case-03.html), and one page's title says "(accessible)".
// The copy renames every page to a hash of its case id, renames every top-level ACT asset entry to a hash (and
// rewrites the references to it, in pages and in assets), replaces the example titles with "Example page", and
// drops the "(accessible)" / "(inaccessible)" title suffix. Nothing else in a page changes, so no case's
// expected result depends on the edit: none of the criteria in scope reads the title, and every asset still
// resolves exactly as before.
//
// map.json: { [original page path]: copy's path }, both relative to the repo root; read by corpora.js and
// GenA11y's runner (eval/gena11y/runner.py), which load every ACT and supplementary page through it.
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const OUT = path.join(ROOT, 'eval/corpus-neutral');
const ACT = path.join(ROOT, 'eval/checker-comparison/act-subset/pages');
const TEST_ASSETS = path.join(ACT, '_assets/WAI/content-assets/wcag-act-rules/test-assets');
const SUPP = path.join(ROOT, 'eval/act-augmented/_tools/full-supplementary-585-cases.json');
const safe = (s) => String(s).replace(/[^a-z0-9_]+/gi, '-').slice(0, 80);   // as corpora.js

const hash = (s) => crypto.createHash('sha1').update(`corpus-neutral:${s}`).digest('hex').slice(0, 16);
const TEXT = /\.(html?|css|js|svg|xml|json|txt)$/i;

// top-level asset entries → hashed names (files keep their extension, so they are served with the same type)
const entries = fs.readdirSync(TEST_ASSETS);
const renamed = Object.fromEntries(entries.map((e) => {
  const isDir = fs.statSync(path.join(TEST_ASSETS, e)).isDirectory();
  return [e, isDir ? hash(e) : `${hash(e)}${path.extname(e)}`];
}));
// any other segment named in a reference (a missing file, or a root-absolute /WAI/... path that never resolved
// from file://) is hashed too, and stays just as unresolvable
const nameOf = (seg) => renamed[seg] || `${hash(seg)}${path.extname(seg)}`;
const SEG = '([^/"\'?#)\\s]+)';

function rewriteRefs(text) {
  return text
    .replace(new RegExp(`\\.\\./_assets/WAI/content-assets/wcag-act-rules/test-assets/${SEG}`, 'g'), (m, e) => `../a/${nameOf(e)}`)
    .replace(new RegExp(`/WAI/content-assets/wcag-act-rules/test-assets/${SEG}`, 'g'), (m, e) => `/a/${nameOf(e)}`)
    .replace(new RegExp(`((?:\\.\\./)+)test-assets/${SEG}`, 'g'), (m, up, e) => `${up}a/${nameOf(e)}`);   // an asset's own relative links
}
// Navigation targets written root-absolute (/WAI/content-assets/wcag-act-rules/test-assets/<entry>/…, as served on
// w3.org) point nowhere offline; in a page, a link's href or a script's location/open target to an entry the corpus
// has is pointed at the local copy (../a/<hashed entry>/…), so following the link reaches the page ACT links to.
// Embedded resources (src, data) are left unresolved: rendering stays exactly as before.
const ROOT_NAV = /((?:\shref=|location(?:\.href)?\s*=\s*|location\.(?:assign|replace)\(\s*|window\.open\(\s*)["'])\/WAI\/content-assets\/wcag-act-rules\/test-assets\/([^/"'?#)\s]+)/g;
const resolveNavigation = (html) => html.replace(ROOT_NAV, (m, pre, seg) => (renamed[seg] ? `${pre}../a/${renamed[seg]}` : m));

const neutralTitle = (html) => html
  .replace(/<title>\s*(Passed|Failed|Inapplicable) Example \d*\s*<\/title>/gi, '<title>Example page</title>')
  .replace(/(<title>[^<]*?)\s*\((?:in)?accessible\)\s*(<\/title>)/gi, '$1$2');

function copyTree(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src)) {
    const s = path.join(src, e), d = path.join(dst, e);
    if (fs.statSync(s).isDirectory()) copyTree(s, d);
    else if (TEXT.test(e)) fs.writeFileSync(d, rewriteRefs(fs.readFileSync(s, 'utf8')));
    else fs.copyFileSync(s, d);
  }
}

fs.rmSync(OUT, { recursive: true, force: true });
fs.mkdirSync(path.join(OUT, 'p'), { recursive: true });
const map = {};

// ACT assets: every top-level entry under its hashed name, in a/ beside p/ (so "../a/..." resolves from a page)
for (const e of entries) {
  const s = path.join(TEST_ASSETS, e), d = path.join(OUT, 'a', renamed[e]);
  if (fs.statSync(s).isDirectory()) copyTree(s, d);
  else { fs.mkdirSync(path.dirname(d), { recursive: true }); if (TEXT.test(e)) fs.writeFileSync(d, rewriteRefs(fs.readFileSync(s, 'utf8'))); else fs.copyFileSync(s, d); }
}

let actN = 0, titled = 0;
for (const rule of fs.readdirSync(ACT)) {
  if (rule === '_assets' || !fs.statSync(path.join(ACT, rule)).isDirectory()) continue;
  for (const f of fs.readdirSync(path.join(ACT, rule))) {
    if (!f.endsWith('.html')) continue;
    const id = `${rule}/${f.replace(/\.html$/, '')}`;
    const src = fs.readFileSync(path.join(ACT, rule, f), 'utf8');
    const out = neutralTitle(rewriteRefs(resolveNavigation(src)));
    if (/<title>Example page<\/title>/.test(out) && !/<title>Example page<\/title>/.test(src)) titled++;
    const rel = `eval/corpus-neutral/p/${hash(id)}.html`;
    fs.writeFileSync(path.join(ROOT, rel), out);
    map[path.relative(ROOT, path.join(ACT, rule, f))] = rel;
    actN++;
  }
}

let suppN = 0, embedded = 0;
for (const c of JSON.parse(fs.readFileSync(SUPP, 'utf8'))) {
  const id = `aug-${c.sc}-${safe(c.aspect)}-${safe(c.id)}`;
  let html = fs.readFileSync(path.join(ROOT, c.file), 'utf8');
  // a file the page embeds by a relative path (an iframe document, an object's SVG) is copied beside it under a
  // hashed name; links (<a href>) are left as they are, since nothing loads them
  html = html.replace(/(<(?!a\b)[a-z][^>]*?\s(?:src|data)=)(["'])(?!https?:|data:|\/|#)([^"']+)\2/gi, (m, pre, q, ref) => {
    const from = path.join(ROOT, path.dirname(c.file), ref);
    if (!fs.existsSync(from)) return m;
    const name = `${hash(`${id}:${ref}`)}${path.extname(ref)}`;
    fs.copyFileSync(from, path.join(OUT, 'p', name));
    embedded++;
    return `${pre}${q}${name}${q}`;
  });
  const rel = `eval/corpus-neutral/p/${hash(id)}.html`;
  fs.writeFileSync(path.join(ROOT, rel), neutralTitle(html));
  map[c.file] = rel;
  suppN++;
}

// what is left that could still name the answer: any original rule folder name or example title in the copy
const leaks = [];
for (const rel of Object.values(map)) {
  const t = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  if (/<title>\s*(Passed|Failed|Inapplicable) Example/i.test(t) || /wcag-act-rules\/test-assets/.test(t)) leaks.push(rel);
}
fs.writeFileSync(path.join(OUT, 'map.json'), JSON.stringify(map, null, 1));
console.log(`ACT pages ${actN} (${titled} example titles replaced), supplementary pages ${suppN} (${embedded} embedded files), asset entries ${entries.length}; leaks left: ${leaks.length}`);
if (leaks.length) { console.log(leaks.slice(0, 10).join('\n')); process.exit(1); }
