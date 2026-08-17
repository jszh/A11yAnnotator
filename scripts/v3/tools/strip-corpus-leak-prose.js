#!/usr/bin/env node
/**
 * Strip answer-leak PROSE from eval/act-augmented test pages, driven by a
 * reviewed inventory (built by the corpus-leak inventory scanner).
 *
 * The corpus carries in-page authorial notes that explain the deliberate defect
 * and why automated tools miss it ("Why automated checkers miss this: ...").
 * That text is an answer key: body.innerText consumers ingest it, and one
 * keyboard-advisory parser was proven to pass a case only via a note's text.
 * This tool removes exactly the inventoried leak elements while preserving
 * every functional element of each page.
 *
 * SAFETY MODEL
 *   - DRY-RUN IS THE DEFAULT. Nothing is written without --apply.
 *   - Only entries whose action is NOT "REVIEW" are applied.
 *   - Each target block is re-located by its exact recorded outerHTML (must
 *     occur exactly once in the file); recorded offsets+sha256 are a fallback.
 *     If neither locates the block unambiguously, the FILE is skipped.
 *   - Before any write, the original is backed up byte-for-byte to
 *     eval/_corpus-archive/act-augmented/prose-strip-<timestamp>/<relative path>
 *     with a sha256 manifest.
 *   - After each edit the result is re-verified, in memory, before writing:
 *       (a) element count outside the removed node(s) is unchanged;
 *       (b) no id / aria-labelledby / aria-describedby / other id-reference is
 *           newly broken (a page may carry deliberately broken refs as the
 *           defect under test, so the check is: brokenRefs(edited) must be a
 *           subset of brokenRefs(original));
 *       (c) none of the removed visible text (chunks >= 15 chars) appears
 *           anywhere in the edited file (raw source or rendered text).
 *     A file failing any check is NOT written and is reported.
 *
 * Usage:
 *   node scripts/v3/tools/strip-corpus-leak-prose.js --inventory <path>            # dry-run (default)
 *   node scripts/v3/tools/strip-corpus-leak-prose.js --inventory <path> --apply    # backup + write
 *   Optional: --backup-root <dir> to override the backup destination root.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '../../..');
const DEFAULT_BACKUP_PARENT = path.join(ROOT, 'eval/_corpus-archive/act-augmented');
const CORPUS_PREFIX = 'eval/act-augmented' + path.sep;

// ------------------------------------------------------------------ HTML parser
// Minimal tolerant parser (mirrors the inventory scanner's). Offsets are JS
// string (UTF-16 code unit) offsets — the same units the inventory recorded.
const VOID = new Set(['area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr']);
const RAW_TEXT = new Set(['script','style','textarea','title']);
const BLOCKISH = new Set(['p','div','section','article','aside','header','footer','main','nav','ul','ol','li','dl','dt','dd','table','tr','td','th','caption','figure','figcaption','blockquote','pre','h1','h2','h3','h4','h5','h6','details','summary','form','fieldset','legend','label','br','hr','option','tbody','thead','tfoot']);

function parseAttrs(tagSrc) {
  const attrs = {};
  const m = /^<\/?[a-zA-Z][a-zA-Z0-9-]*/.exec(tagSrc);
  if (!m) return attrs;
  const rest = tagSrc.slice(m[0].length).replace(/\/?>$/, '');
  const re = /([a-zA-Z_:@][-a-zA-Z0-9_:.]*)(?:\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
  let a;
  while ((a = re.exec(rest))) {
    const name = a[1].toLowerCase();
    const val = a[3] !== undefined ? a[3] : a[4] !== undefined ? a[4] : a[5] !== undefined ? a[5] : '';
    if (!(name in attrs)) attrs[name] = val;
  }
  return attrs;
}

function parseHtml(src) {
  const root = { type: 'el', tag: '#root', attrs: {}, children: [], parent: null, start: 0, end: src.length, contentStart: 0, contentEnd: src.length };
  let cur = root;
  let i = 0;
  const n = src.length;
  const flushText = (s, e) => { if (e > s) cur.children.push({ type: 'text', start: s, end: e, parent: cur }); };
  while (i < n) {
    const lt = src.indexOf('<', i);
    if (lt === -1) { flushText(i, n); break; }
    flushText(i, lt);
    if (src.startsWith('<!--', lt)) {
      let end = src.indexOf('-->', lt + 4);
      if (end === -1) end = n - 3;
      i = end + 3;
      continue;
    }
    if (src.startsWith('<!', lt) || src.startsWith('<?', lt)) {
      const gt = src.indexOf('>', lt);
      i = gt === -1 ? n : gt + 1;
      continue;
    }
    const m = /^<(\/?)([a-zA-Z][a-zA-Z0-9-]*)/.exec(src.slice(lt, lt + 60));
    if (!m) { flushText(lt, lt + 1); i = lt + 1; continue; }
    const isClose = m[1] === '/';
    const tag = m[2].toLowerCase();
    let j = lt + m[0].length;
    let q = null;
    while (j < n) {
      const ch = src[j];
      if (q) { if (ch === q) q = null; }
      else if (ch === '"' || ch === "'") q = ch;
      else if (ch === '>') break;
      j++;
    }
    const tagEnd = Math.min(j + 1, n);
    const selfClosing = src[j - 1] === '/';
    if (isClose) {
      let node = cur;
      while (node !== root && node.tag !== tag) node = node.parent;
      if (node !== root) {
        node.contentEnd = lt;
        node.end = tagEnd;
        let c = cur;
        while (c !== node) { c.contentEnd = lt; c.end = lt; c = c.parent; }
        cur = node.parent;
      }
      i = tagEnd;
      continue;
    }
    const el = { type: 'el', tag, attrs: parseAttrs(src.slice(lt, tagEnd)), children: [], parent: cur, start: lt, end: tagEnd, contentStart: tagEnd, contentEnd: tagEnd };
    cur.children.push(el);
    if (VOID.has(tag) || selfClosing) { i = tagEnd; continue; }
    if (RAW_TEXT.has(tag)) {
      const close = new RegExp(`</${tag}\\b[^>]*>`, 'i');
      const cm = close.exec(src.slice(tagEnd));
      const bodyEnd = cm ? tagEnd + cm.index : n;
      el.rawContent = src.slice(tagEnd, bodyEnd);
      el.contentEnd = bodyEnd;
      el.end = cm ? tagEnd + cm.index + cm[0].length : n;
      i = el.end;
      continue;
    }
    cur = el;
    i = tagEnd;
  }
  let c = cur;
  while (c && c !== root) { c.contentEnd = n; c.end = n; c = c.parent; }
  return root;
}

function walk(node, fn) { fn(node); if (node.children) for (const ch of node.children) walk(ch, fn); }

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–', ldquo: '“', rdquo: '”', lsquo: '‘', rsquo: '’', hellip: '…', times: '×', middot: '·', bull: '•', copy: '©', rarr: '→', larr: '←', darr: '↓', uarr: '↑', deg: '°' };
function decodeEntities(s) {
  return s
    .replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16)))
    .replace(/&#(\d+);/g, (_, d) => String.fromCodePoint(parseInt(d, 10)))
    .replace(/&([a-z]+);/gi, (_, name) => (name.toLowerCase() in ENT ? ENT[name.toLowerCase()] : ' '));
}
function visibleText(node, src) {
  if (node.type === 'text') return decodeEntities(src.slice(node.start, node.end));
  if (RAW_TEXT.has(node.tag)) return '';
  let out = '';
  for (const ch of node.children) {
    const t = visibleText(ch, src);
    if (!t) continue;
    if (ch.type === 'el' && BLOCKISH.has(ch.tag)) out += ' ' + t + ' ';
    else out += t;
  }
  return out;
}
const norm = (s) => s.replace(/\s+/g, ' ').trim();

// ---------------------------------------------------------------- doc queries
const IDREF_LIST_ATTRS = ['aria-labelledby','aria-describedby','aria-controls','aria-owns','aria-flowto','headers','aria-details','aria-errormessage','aria-activedescendant','for','list','form','itemref'];

function countElements(rootNode) {
  let k = 0;
  walk(rootNode, (nd) => { if (nd.type === 'el' && nd.tag !== '#root') k++; });
  return k;
}

/** Set of "attr->id" reference strings whose target id does not exist. */
function brokenRefs(rootNode) {
  const ids = new Set();
  const refs = [];
  walk(rootNode, (nd) => {
    if (nd.type !== 'el') return;
    if (nd.attrs.id) ids.add(nd.attrs.id);
    for (const a of IDREF_LIST_ATTRS) {
      if (nd.attrs[a]) for (const id of nd.attrs[a].split(/\s+/).filter(Boolean)) refs.push(`${a}->${id}`);
    }
    if (nd.attrs.href && nd.attrs.href.startsWith('#') && nd.attrs.href.length > 1) refs.push(`href->${nd.attrs.href.slice(1)}`);
    if (nd.attrs.usemap && nd.attrs.usemap.startsWith('#')) refs.push(`usemap->${nd.attrs.usemap.slice(1)}`);
  });
  return new Set(refs.filter((r) => !ids.has(r.split('->')[1])));
}

// ----------------------------------------------------------------- edit logic
/** Locate an inventory entry's block in src. Returns {start,end,contentStart,contentEnd} or null. */
function locate(src, entry) {
  const outer = entry.outerHtml;
  if (!outer) return null;
  const first = src.indexOf(outer);
  if (first !== -1 && src.indexOf(outer, first + 1) === -1) {
    const rootNode = parseHtml(src);
    let hit = null;
    walk(rootNode, (nd) => { if (!hit && nd.type === 'el' && nd.start === first && nd.end === first + outer.length) hit = nd; });
    if (hit) return { start: hit.start, end: hit.end, contentStart: hit.contentStart, contentEnd: hit.contentEnd };
    return { start: first, end: first + outer.length, contentStart: null, contentEnd: null };
  }
  // fallback: recorded offsets + sha
  if (Number.isInteger(entry.startOffset) && Number.isInteger(entry.endOffset)) {
    const slice = src.slice(entry.startOffset, entry.endOffset);
    const sha = crypto.createHash('sha256').update(slice).digest('hex');
    if (sha === entry.outerHtmlSha256) return { start: entry.startOffset, end: entry.endOffset, contentStart: null, contentEnd: null };
  }
  return null;
}

/** Cut [start,end) plus surrounding indentation/blank-line remnants. */
function cutSpan(src, start, end) {
  let s = start, e = end;
  // absorb leading whitespace back to (and including) the newline that indents the block
  let ls = s;
  while (ls > 0 && (src[ls - 1] === ' ' || src[ls - 1] === '\t')) ls--;
  if (ls === 0 || src[ls - 1] === '\n') s = ls;
  // absorb one trailing newline so no blank line is left behind
  if (src[e] === '\r') e++;
  if (src[e] === '\n') e++;
  return src.slice(0, s) + src.slice(e);
}

function applyEntries(src, entries) {
  // work back-to-front so earlier offsets stay valid
  const located = [];
  for (const entry of entries) {
    const loc = locate(src, entry);
    if (!loc) return { error: `could not locate block ${entry.selector} (outerHTML not unique / offsets stale)` };
    located.push({ entry, loc });
  }
  located.sort((a, b) => b.loc.start - a.loc.start);
  // overlapping blocks would corrupt the edit
  for (let k = 1; k < located.length; k++) {
    if (located[k].loc.end > located[k - 1].loc.start) return { error: 'entries overlap; refusing to edit' };
  }
  let out = src;
  for (const { entry, loc } of located) {
    if (entry.action === 'remove-element') out = cutSpan(out, loc.start, loc.end);
    else if (entry.action === 'remove-text-keep-element') {
      if (loc.contentStart == null) return { error: `content bounds unavailable for ${entry.selector}` };
      out = out.slice(0, loc.contentStart) + out.slice(loc.contentEnd);
    } else return { error: `unknown action ${entry.action}` };
  }
  return { out };
}

function verify(srcBefore, srcAfter, entries) {
  const failures = [];
  const before = parseHtml(srcBefore);
  const after = parseHtml(srcAfter);

  // (a) element count outside the removed nodes is unchanged
  let removedEls = 0;
  for (const entry of entries) {
    const loc = locate(srcBefore, entry);
    if (!loc) { failures.push('verify: block vanished before edit?'); continue; }
    let contained = 0;
    walk(before, (nd) => { if (nd.type === 'el' && nd.tag !== '#root' && nd.start >= loc.start && nd.end <= loc.end) contained++; });
    if (entry.action === 'remove-element') removedEls += contained;
    else removedEls += Math.max(0, contained - 1); // container survives
  }
  const cb = countElements(before);
  const ca = countElements(after);
  if (ca !== cb - removedEls) failures.push(`(a) element count: before=${cb} after=${ca} expected=${cb - removedEls}`);

  // (b) no id-reference newly broken
  const bb = brokenRefs(before);
  const ba = brokenRefs(after);
  for (const r of ba) if (!bb.has(r)) failures.push(`(b) newly broken reference: ${r}`);

  // (c) removed text must be gone (raw source and rendered text)
  const afterNormSrc = norm(decodeEntities(srcAfter.replace(/<[^>]+>/g, ' ')));
  const afterVisible = norm(visibleText(after, srcAfter));
  for (const entry of entries) {
    const t = norm(entry.text || '');
    const chunks = t.split(/(?<=[.?!])\s+/).map(norm).filter((c) => c.length >= 15);
    if (!chunks.length && t.length >= 15) chunks.push(t);
    for (const c of chunks) {
      if (afterNormSrc.includes(c) || afterVisible.includes(c)) { failures.push(`(c) removed text still present: "${c.slice(0, 60)}..."`); break; }
    }
  }
  return failures;
}

// ----------------------------------------------------------------------- main
function main() {
  const argv = process.argv.slice(2);
  const flag = (name) => argv.includes(name);
  const opt = (name) => { const i = argv.indexOf(name); return i > -1 ? argv[i + 1] : null; };

  const invPath = opt('--inventory');
  if (!invPath) {
    console.error('Usage: node scripts/v3/tools/strip-corpus-leak-prose.js --inventory <inventory.json> [--apply] [--backup-root <dir>]');
    console.error('Dry-run is the default; nothing is written without --apply.');
    process.exit(2);
  }
  const apply = flag('--apply');
  const inv = JSON.parse(fs.readFileSync(path.resolve(invPath), 'utf8'));
  if (!inv.files || !Array.isArray(inv.files)) { console.error('inventory has no .files[]'); process.exit(2); }

  const ts = new Date().toISOString().replace(/:/g, '-').replace(/\..*$/, '');
  const backupRoot = opt('--backup-root') || path.join(DEFAULT_BACKUP_PARENT, `prose-strip-${ts}`);
  const manifest = { createdAt: new Date().toISOString(), inventory: { schema: inv.schema, generatedAt: inv.generatedAt }, files: {} };

  let filesTouched = 0, entriesApplied = 0, entriesReview = 0, filesFailed = 0, filesSkipped = 0;
  const failReport = [];

  for (const f of inv.files) {
    const applicable = f.entries.filter((e) => e.action !== 'REVIEW');
    entriesReview += f.entries.length - applicable.length;
    if (!applicable.length) { filesSkipped++; continue; }
    const abs = path.join(ROOT, f.file);
    if (!f.file.startsWith(CORPUS_PREFIX.replace(/\\/g, '/')) && !f.file.startsWith('eval/act-augmented/')) {
      failReport.push(`${f.file}: outside eval/act-augmented — refusing`); filesFailed++; continue;
    }
    if (!fs.existsSync(abs)) { failReport.push(`${f.file}: missing on disk`); filesFailed++; continue; }
    const src = fs.readFileSync(abs, 'utf8');

    const res = applyEntries(src, applicable);
    if (res.error) { failReport.push(`${f.file}: ${res.error}`); filesFailed++; continue; }
    const failures = verify(src, res.out, applicable);
    if (failures.length) { failReport.push(`${f.file}: ${failures.join(' | ')}`); filesFailed++; continue; }

    filesTouched++;
    entriesApplied += applicable.length;
    if (apply) {
      const rel = path.relative(path.join(ROOT, 'eval/act-augmented'), abs);
      const dest = path.join(backupRoot, rel);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(abs, dest);
      manifest.files[rel] = crypto.createHash('sha256').update(src).digest('hex');
      fs.writeFileSync(abs, res.out);
      console.log(`stripped ${f.file} (${applicable.length} block(s))`);
    } else {
      console.log(`[dry-run] would strip ${f.file}: ${applicable.map((e) => `${e.action} ${e.selector}`).join('; ')}`);
    }
  }

  if (apply && filesTouched) {
    fs.mkdirSync(backupRoot, { recursive: true });
    fs.writeFileSync(path.join(backupRoot, 'manifest.json'), JSON.stringify(manifest, null, 2));
  }

  console.log('');
  console.log(`${apply ? 'APPLIED' : 'DRY-RUN (pass --apply to write)'}`);
  console.log(`files strippable : ${filesTouched}`);
  console.log(`entries applied  : ${entriesApplied}`);
  console.log(`REVIEW entries   : ${entriesReview} (left untouched across ${filesSkipped} review-only file(s))`);
  console.log(`files FAILED     : ${filesFailed}`);
  for (const r of failReport) console.log(`  FAIL ${r}`);
  if (apply && filesTouched) console.log(`backups: ${path.relative(ROOT, backupRoot)} (+ manifest.json)`);
  process.exit(filesFailed ? 1 : 0);
}

main();
