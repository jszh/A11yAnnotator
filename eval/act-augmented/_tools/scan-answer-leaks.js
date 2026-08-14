#!/usr/bin/env node
/**
 * Find remaining ground-truth leaks in the served test pages, after comment
 * stripping. Comments were only the first layer; the adjudication pass turned up
 * two more, and unlike comments these are part of the DOM the page actually
 * serves, so removing them is a content change and a judgment call — this tool
 * reports, it does not rewrite.
 *
 * Classes:
 *   attribute  — machine-readable answer keys, e.g. body[data-intended-classification].
 *                Invisible to a user; pure leak; nothing legitimately reads them.
 *   prose      — author-facing explanation rendered as page CONTENT, e.g.
 *                <div class="devnote">Why automated tools cannot catch this: …</div>.
 *                A reader (human annotator or LLM) is told the answer in the copy.
 *                Removing it changes what the page renders, so it needs a human call.
 *
 * Usage: node eval/act-augmented/_tools/scan-answer-leaks.js [--json out.json]
 */

const fs = require('fs');
const path = require('path');
const { corpusPages, scanHtml } = require('./strip-case-comments.js');

const ROOT = path.resolve(__dirname, '../../..');

// attributes that encode the expected outcome
const ATTR = /\b(data-[a-z0-9-]*(?:intended|expected|classification|outcome|verdict|groundtruth|wcag-?(?:sc|fail|pass))[a-z0-9-]*)\s*=\s*"([^"]*)"/gi;

// Phrases only an author explaining the test would write into page copy.
// `strong` = unambiguous authorial voice about the test itself. `weak` = a term
// a real page could legitimately use (an accessibility-statement page may say
// "WCAG"), reported separately so the two are never conflated in a count.
const PROSE_STRONG = [
  /why automated (?:tools|checkers|scanners)/i,
  /automated (?:tools|checkers|scanners) (?:cannot|can't|miss|fail to)/i,
  /\b(?:axe(?:-core)?|WAVE|Lighthouse|ANDI|IBM Equal Access|QualWeb)\b/,
  /why this (?:passes|fails|is a pass|is a fail)/i,
  /this is (?:a )?(?:deliberate|intentional)(?:ly)? (?:pass|fail)/i,
  /must not be flagged/i,
  /(?:true|false) (?:positive|negative)/i,
  /implementation note:/i,
  /requires? human (?:interpretation|judgment|judgement)/i,
];
const PROSE_WEAK = [/\bWCAG\b|\bSC \d\.\d\.\d\b|\bF\d{2,3}\b(?!\w)/];

/** Text a reader actually sees: markup, comments, script and style removed. */
function visibleText(src) {
  const { comments, raw } = scanHtml(src);
  const cuts = [...comments.map((c) => [c.start, c.end])];
  for (const b of raw) if (b.tag === 'script' || b.tag === 'style') cuts.push([b.start, b.end]);
  cuts.sort((a, b) => a[0] - b[0]);
  let out = '', cur = 0;
  for (const [s, e] of cuts) { if (s < cur) continue; out += src.slice(cur, s); cur = e; }
  out += src.slice(cur);
  return out.replace(/<[^>]+>/g, ' ').replace(/&[a-z]+;/gi, ' ').replace(/\s+/g, ' ').trim();
}

function main() {
  const pages = corpusPages().filter((p) => !p.includes('__origcheck'));
  const findings = [];
  for (const abs of pages) {
    const rel = path.relative(ROOT, abs);
    const src = fs.readFileSync(abs, 'utf8');
    const hit = { file: rel, sc: rel.split('/')[2], attributes: [], prose: [], proseWeak: [] };

    ATTR.lastIndex = 0;
    let m;
    while ((m = ATTR.exec(src))) hit.attributes.push({ attr: m[1], value: m[2] });

    const text = visibleText(src);
    const scan = (list, into) => {
      for (const re of list) {
        const mm = re.exec(text);
        if (mm) into.push({ pattern: re.source.slice(0, 46), match: mm[0], context: text.slice(Math.max(0, mm.index - 70), mm.index + 110) });
      }
    };
    scan(PROSE_STRONG, hit.prose);
    scan(PROSE_WEAK, hit.proseWeak);
    if (hit.attributes.length || hit.prose.length || hit.proseWeak.length) findings.push(hit);
  }

  const attrFiles = findings.filter((f) => f.attributes.length);
  const proseFiles = findings.filter((f) => f.prose.length);
  const weakOnly = findings.filter((f) => !f.prose.length && f.proseWeak.length);
  const bySC = {};
  for (const f of proseFiles) bySC[f.sc] = (bySC[f.sc] || 0) + 1;

  const doc = {
    schema: 'act-augmented-answer-leaks/2', generatedAt: new Date().toISOString(),
    pagesScanned: pages.length,
    attributeLeakFiles: attrFiles.length,
    proseLeakFiles: proseFiles.length,
    weakSignalOnlyFiles: weakOnly.length,
    proseBySC: bySC, findings,
  };
  const jIdx = process.argv.indexOf('--json');
  const dest = jIdx > -1 ? path.resolve(process.argv[jIdx + 1])
    : path.join(ROOT, 'eval/act-augmented/_annotator/irr/answer-leaks.json');
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, JSON.stringify(doc, null, 2));

  console.log(`pages scanned: ${pages.length}`);
  console.log(`attribute leaks : ${attrFiles.length} files`);
  for (const f of attrFiles) console.log(`   ${f.file} -> ${f.attributes.map((a) => `${a.attr}="${a.value}"`).join(' ')}`);
  console.log(`prose leaks     : ${proseFiles.length} files (high confidence) + ${weakOnly.length} weak-signal-only`);
  console.log(`   by SC: ${JSON.stringify(Object.fromEntries(Object.entries(bySC).sort((a, b) => b[1] - a[1])))}`);
  for (const f of proseFiles.slice(0, 6)) console.log(`   e.g. ${f.file}\n        "${f.prose[0].context.trim()}"`);
  console.log(`\nwrote ${path.relative(ROOT, dest)}`);
}

main();
