#!/usr/bin/env node
/**
 * Strip authoring comments from the eval/act-augmented test-case pages.
 *
 * WHY: 847 of the 1978 HTML comments in the corpus state the answer outright
 * ("SC 1.1.1 FAILURE (F30 — text alternative that is not an alternative)"), and
 * inline CSS/JS comments do the same ("PASS: a single-column changelog…").
 * Anything that reads page source — the LLM evidence lane, a checker prompt, or
 * a human annotator peeking at the source — can read the label off the page
 * instead of judging it. Human annotators demonstrably did: several annotations
 * say "…as mentioned in the comment".
 *
 * SAFETY: comments are located with a real tokenizer, never a bare regex.
 *   - HTML: a spec-shaped scanner that tracks raw-text elements
 *     (script/style/textarea/title) and quoted attribute values, so `<!--`
 *     inside a JS string or an attribute is never mistaken for a comment.
 *   - JS: esprima.tokenize(..., {comment:true, range:true}) — strings, template
 *     literals and regex literals are handled by the parser, not by us.
 *     Block comments are replaced by "\n" when they spanned a newline (so
 *     automatic-semicolon-insertion behaviour is unchanged) and by " " otherwise.
 *     Line comments are cut up to, but not including, their newline.
 *   - CSS: a scanner that tracks strings and url(). A CSS comment is removed
 *     only when whitespace already sits on at least one side; otherwise removing
 *     it could weld two tokens together and inserting a space could turn a
 *     compound selector into a descendant one, so it is LEFT IN PLACE and
 *     reported as `skippedUnsafe` for manual handling.
 *
 * Every page is backed up byte-for-byte with a sha256 manifest before any write,
 * and `--restore` puts the corpus back from that backup.
 *
 * Usage:
 *   node eval/act-augmented/_tools/strip-case-comments.js --dry-run
 *   node eval/act-augmented/_tools/strip-case-comments.js            # backup + strip
 *   node eval/act-augmented/_tools/strip-case-comments.js --restore <backupDir>
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const esprima = require('esprima');

const ROOT = path.resolve(__dirname, '../../..');
const CORPUS = path.join(ROOT, 'eval/act-augmented');
const BACKUP_ROOT = path.join(CORPUS, '_archive/comment-strip-backups');

const RAW_TEXT = new Set(['script', 'style', 'textarea', 'title']);
const JS_TYPES = new Set(['', 'text/javascript', 'application/javascript', 'module', 'text/ecmascript']);

// ------------------------------------------------------------------ scanners

/**
 * Walk HTML source and return {comments:[{start,end}], raw:[{tag,attrs,start,end}]}
 * where `raw` covers the *contents* of script/style blocks.
 */
function scanHtml(src) {
  const comments = [];
  const raw = [];
  let i = 0;
  const n = src.length;
  while (i < n) {
    const lt = src.indexOf('<', i);
    if (lt === -1) break;
    if (src.startsWith('<!--', lt)) {
      // HTML spec also accepts `--!>` as a comment end.
      let end = -1, endLen = 3;
      const a = src.indexOf('-->', lt + 4);
      const b = src.indexOf('--!>', lt + 4);
      if (a !== -1 && (b === -1 || a <= b)) { end = a; endLen = 3; }
      else if (b !== -1) { end = b; endLen = 4; }
      if (end === -1) { i = n; break; } // unterminated: leave the rest alone
      comments.push({ start: lt, end: end + endLen });
      i = end + endLen;
      continue;
    }
    const m = /^<\/?([a-zA-Z][a-zA-Z0-9-]*)/.exec(src.slice(lt, lt + 40));
    if (!m) { i = lt + 1; continue; }
    const tag = m[1].toLowerCase();
    const isClose = src[lt + 1] === '/';
    // consume the tag, honouring quoted attribute values
    let j = lt + 1 + m[0].length - 1;
    let q = null;
    while (j < n) {
      const ch = src[j];
      if (q) { if (ch === q) q = null; }
      else if (ch === '"' || ch === "'") q = ch;
      else if (ch === '>') break;
      j++;
    }
    const tagEnd = j + 1;
    const selfClosing = src[j - 1] === '/';
    if (!isClose && !selfClosing && RAW_TEXT.has(tag)) {
      const close = new RegExp(`</${tag}\\b`, 'i');
      const rest = src.slice(tagEnd);
      const cm = close.exec(rest);
      const bodyEnd = cm ? tagEnd + cm.index : n;
      raw.push({ tag, attrsSrc: src.slice(lt, tagEnd), start: tagEnd, end: bodyEnd });
      i = bodyEnd;
      continue;
    }
    i = tagEnd;
  }
  return { comments, raw };
}

/** JS comment ranges (offsets relative to `code`). */
function scanJs(code) {
  const out = [];
  let toks;
  try {
    toks = esprima.tokenize(code, { comment: true, range: true, tolerant: true });
  } catch {
    return { comments: [], parseFailed: true };
  }
  for (const t of toks) {
    if (t.type === 'LineComment' || t.type === 'BlockComment') {
      out.push({ start: t.range[0], end: t.range[1], block: t.type === 'BlockComment' });
    }
  }
  return { comments: out, parseFailed: false };
}

/**
 * Ranges whose whitespace is rendered verbatim (`<pre>` contents). A comment
 * removed inside one of these must not take its surrounding blank line with it.
 * `<textarea>` is raw text, so the HTML scanner never reports comments in it.
 */
function preRanges(src) {
  const out = [];
  const re = /<pre\b[^>]*>/gi;
  let m;
  while ((m = re.exec(src))) {
    const close = /<\/pre\b/i.exec(src.slice(m.index + m[0].length));
    const end = close ? m.index + m[0].length + close.index : src.length;
    out.push([m.index + m[0].length, end]);
    re.lastIndex = end;
  }
  return out;
}

/** CSS comment ranges (offsets relative to `code`), string/url aware. */
function scanCss(code) {
  const out = [];
  let i = 0;
  const n = code.length;
  while (i < n) {
    const c = code[i];
    if (c === '"' || c === "'") {
      i++;
      while (i < n && code[i] !== c) { if (code[i] === '\\') i++; i++; }
      i++;
      continue;
    }
    if (c === '/' && code[i + 1] === '*') {
      const end = code.indexOf('*/', i + 2);
      if (end === -1) break;
      out.push({ start: i, end: end + 2 });
      i = end + 2;
      continue;
    }
    if (/[uU]/.test(c) && /^url\(/i.test(code.slice(i, i + 4))) {
      const close = code.indexOf(')', i);
      if (close !== -1) { i = close + 1; continue; }
    }
    i++;
  }
  return out;
}

// ------------------------------------------------------------------ planning

const WS = (ch) => ch === undefined || /\s/.test(ch);

/**
 * When a comment is the only thing on its line, take the line with it — the
 * newline that *opened* the line is outside the range and survives, so any two
 * nodes the comment sat between stay whitespace-separated exactly as before.
 * Inside `<pre>` the blank line is rendered content, so it is left alone.
 */
function swallowBlankLine(src, edit, protectedRanges) {
  if (protectedRanges.some(([s, e]) => edit.start >= s && edit.end <= e)) return edit;
  const lineStart = src.lastIndexOf('\n', edit.start - 1) + 1;
  if (!/^[ \t]*$/.test(src.slice(lineStart, edit.start))) return edit;
  let after = edit.end;
  while (after < src.length && (src[after] === ' ' || src[after] === '\t')) after++;
  if (src[after] !== '\n') return edit;
  return { ...edit, start: lineStart, end: after + 1, replacement: '' };
}

/** Build the ordered edit list for one page. */
function planEdits(src) {
  const edits = []; // {start,end,replacement,kind}
  const stats = { html: 0, js: 0, css: 0, skippedUnsafeCss: 0, jsParseFailures: 0 };
  const removedText = [];

  const { comments, raw } = scanHtml(src);
  const protectedRanges = preRanges(src);
  for (const c of comments) {
    edits.push(swallowBlankLine(src, { start: c.start, end: c.end, replacement: '', kind: 'html' }, protectedRanges));
    removedText.push({ kind: 'html', offset: c.start, text: src.slice(c.start, c.end) });
    stats.html++;
  }

  for (const block of raw) {
    const body = src.slice(block.start, block.end);
    if (block.tag === 'script') {
      const typeM = /\btype\s*=\s*["']?([^"'\s>]*)/i.exec(block.attrsSrc);
      const type = (typeM ? typeM[1] : '').toLowerCase();
      if (!JS_TYPES.has(type)) continue; // JSON / templates: leave untouched
      const { comments: jsc, parseFailed } = scanJs(body);
      if (parseFailed) { stats.jsParseFailures++; continue; }
      for (const c of jsc) {
        const text = body.slice(c.start, c.end);
        let replacement = '';
        if (c.block) replacement = /\n/.test(text) ? '\n' : ' ';
        edits.push(swallowBlankLine(src,
          { start: block.start + c.start, end: block.start + c.end, replacement, kind: 'js' }, protectedRanges));
        removedText.push({ kind: 'js', offset: block.start + c.start, text });
        stats.js++;
      }
    } else if (block.tag === 'style') {
      for (const c of scanCss(body)) {
        const before = body[c.start - 1];
        const after = body[c.end];
        if (!WS(before) && !WS(after)) { stats.skippedUnsafeCss++; continue; }
        const text = body.slice(c.start, c.end);
        edits.push(swallowBlankLine(src,
          { start: block.start + c.start, end: block.start + c.end, replacement: '', kind: 'css' }, protectedRanges));
        removedText.push({ kind: 'css', offset: block.start + c.start, text });
        stats.css++;
      }
    }
  }

  edits.sort((a, b) => a.start - b.start);
  return { edits, stats, removedText };
}

function applyEdits(src, edits) {
  let out = '';
  let cur = 0;
  for (const e of edits) {
    if (e.start < cur) continue; // a swallowed line already covered this edit
    out += src.slice(cur, e.start) + e.replacement;
    cur = e.end;
  }
  out += src.slice(cur);
  return out;
}

// ------------------------------------------------------------------ corpus io

function corpusPages() {
  const out = [];
  for (const sc of fs.readdirSync(CORPUS).sort()) {
    const pagesDir = path.join(CORPUS, sc, 'pages');
    if (!fs.existsSync(pagesDir)) continue;
    for (const aspect of fs.readdirSync(pagesDir).sort()) {
      const d = path.join(pagesDir, aspect);
      if (!fs.statSync(d).isDirectory()) continue;
      for (const f of fs.readdirSync(d).sort()) {
        if (f.endsWith('.html')) out.push(path.join(d, f));
      }
    }
  }
  return out;
}

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const stamp = () => new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

function restore(backupDir) {
  const man = JSON.parse(fs.readFileSync(path.join(backupDir, 'backup-manifest.json'), 'utf8'));
  let n = 0, bad = 0;
  for (const e of man.files) {
    const src = path.join(backupDir, 'files', e.rel);
    const body = fs.readFileSync(src, 'utf8');
    if (sha(body) !== e.sha256Original) { console.error('CHECKSUM MISMATCH in backup:', e.rel); bad++; continue; }
    fs.writeFileSync(path.join(ROOT, e.rel), body);
    n++;
  }
  console.log(`restored ${n} files from ${path.relative(ROOT, backupDir)}${bad ? ` (${bad} skipped)` : ''}`);
}

// ------------------------------------------------------------------ main

function main() {
  const argv = process.argv.slice(2);
  if (argv[0] === '--restore') {
    const dir = argv[1] ? path.resolve(argv[1]) : null;
    if (!dir) { console.error('--restore needs a backup directory'); process.exit(1); }
    restore(dir);
    return;
  }
  const dryRun = argv.includes('--dry-run');

  const pages = corpusPages();
  const totals = { pages: pages.length, changed: 0, html: 0, js: 0, css: 0, skippedUnsafeCss: 0, jsParseFailures: 0 };
  const perFile = [];
  const backupDir = path.join(BACKUP_ROOT, stamp());

  if (!dryRun) fs.mkdirSync(path.join(backupDir, 'files'), { recursive: true });
  const backupFiles = [];

  for (const abs of pages) {
    const rel = path.relative(ROOT, abs);
    const src = fs.readFileSync(abs, 'utf8');
    const { edits, stats, removedText } = planEdits(src);
    totals.html += stats.html; totals.js += stats.js; totals.css += stats.css;
    totals.skippedUnsafeCss += stats.skippedUnsafeCss; totals.jsParseFailures += stats.jsParseFailures;
    if (!edits.length) continue;
    const out = applyEdits(src, edits);
    if (out === src) continue;
    totals.changed++;
    perFile.push({ rel, ...stats, bytesBefore: src.length, bytesAfter: out.length, removed: removedText });

    if (!dryRun) {
      const dest = path.join(backupDir, 'files', rel);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.writeFileSync(dest, src);
      backupFiles.push({ rel, sha256Original: sha(src), sha256Stripped: sha(out), bytesBefore: src.length, bytesAfter: out.length });
      fs.writeFileSync(abs, out);
    }
  }

  if (!dryRun) {
    fs.writeFileSync(path.join(backupDir, 'backup-manifest.json'), JSON.stringify({
      schema: 'act-augmented-comment-strip-backup/1',
      createdAt: new Date().toISOString(),
      restoreWith: `node eval/act-augmented/_tools/strip-case-comments.js --restore ${path.relative(ROOT, backupDir)}`,
      totals, files: backupFiles,
    }, null, 2));
    // The removed comments carry the authored failure rationale; keep them
    // queryable outside the pages rather than losing them to the backup tree.
    fs.writeFileSync(path.join(backupDir, 'removed-comments.json'), JSON.stringify({
      schema: 'act-augmented-removed-comments/1', createdAt: new Date().toISOString(), files: perFile,
    }, null, 2));
  }

  console.log(`\n${dryRun ? '[dry-run] ' : ''}pages scanned ${totals.pages}, changed ${totals.changed}`);
  console.log(`  removed: ${totals.html} HTML, ${totals.js} JS, ${totals.css} CSS comments`);
  console.log(`  skipped (unsafe CSS adjacency): ${totals.skippedUnsafeCss}   JS parse failures: ${totals.jsParseFailures}`);
  if (!dryRun) console.log(`  backup: ${path.relative(ROOT, backupDir)}`);
}

if (require.main === module) main();

module.exports = { scanHtml, scanJs, scanCss, planEdits, applyEdits, corpusPages };
