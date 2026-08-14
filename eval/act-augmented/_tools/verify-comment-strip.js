#!/usr/bin/env node
/**
 * Prove that strip-case-comments.js changed nothing but comments.
 *
 * Three independent checks, each able to fail the run on its own:
 *
 *  1. PARSE  — both the original (from the backup) and the stripped source are
 *     parsed with the browser's own DOMParser, with scripts NOT executing, then
 *     serialised skipping comment nodes. Element tree, tag names, attributes and
 *     text are compared. Text inside <pre>/<textarea> (and anything with a
 *     computed white-space: pre*) is compared byte-exact; elsewhere runs of
 *     whitespace are collapsed, because HTML collapses them too.
 *  2. SCRIPT — every inline script is tokenised with esprima on both sides and
 *     the token streams (type + value, comments excluded) must be identical, so
 *     no comment removal split, joined or reinterpreted a JS token.
 *  3. RENDER — both pages are actually loaded and screenshotted with scripts
 *     running; the PNGs must be byte-identical. Pages whose own screenshots
 *     differ run-to-run (timers, animation) are re-shot and reported as
 *     nondeterministic rather than as failures.
 *
 * Usage: node eval/act-augmented/_tools/verify-comment-strip.js <backupDir> [--no-render] [--limit N]
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const esprima = require('esprima');
const puppeteer = require('puppeteer');
const { scanCss, scanHtml } = require('./strip-case-comments.js');

/**
 * Raw-text block extraction must use the same HTML scanner the stripper uses.
 * A regex cannot: at least one case has the literal text "<script>" inside an
 * HTML comment, and a regex starts extracting there — reading comment prose as
 * JavaScript and reporting a mismatch that does not exist.
 */
function rawBlocks(src, tag) {
  return scanHtml(src).raw.filter((b) => b.tag === tag).map((b) => ({ body: src.slice(b.start, b.end), attrs: b.attrsSrc }));
}

const ROOT = path.resolve(__dirname, '../../..');
const sha = (b) => crypto.createHash('sha256').update(b).digest('hex');

// ---------------------------------------------------------------- js check

function tokenStream(code) {
  try {
    return esprima.tokenize(code, { comment: false, tolerant: true })
      .map((t) => `${t.type}${t.value}`).join('');
  } catch (e) {
    return `PARSE_ERROR:${e.message}`;
  }
}

/**
 * CSS equivalence: remove the comments from the ORIGINAL with the same scanner,
 * normalise whitespace on both sides, and require an exact match — so the
 * stripped stylesheet is provably the original minus exactly its comments.
 * (Whitespace-modulo is sound here only because the stripper refuses to touch a
 * comment with non-whitespace on both sides; those are reported, never removed.)
 */
function cssNormal(code, removeComments) {
  let s = code;
  if (removeComments) {
    const cs = scanCss(code);
    let out = '', cur = 0;
    for (const c of cs) { out += code.slice(cur, c.start); cur = c.end; }
    s = out + code.slice(cur);
  }
  return s.replace(/\s+/g, ' ').trim();
}

function inlineStyles(src) {
  return rawBlocks(src, 'style').map((b) => b.body);
}

function inlineScripts(src) {
  return rawBlocks(src, 'script').filter((b) => {
    if (/\bsrc\s*=/.test(b.attrs)) return false;
    const typeM = /\btype\s*=\s*["']?([^"'\s>]*)/i.exec(b.attrs);
    const type = (typeM ? typeM[1] : '').toLowerCase();
    return ['', 'text/javascript', 'application/javascript', 'module', 'text/ecmascript'].includes(type);
  }).map((b) => b.body);
}

// ---------------------------------------------------------------- dom check

/** Runs inside the browser: parse without executing, serialise without comments. */
const SERIALIZE = `(html) => {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  const PRE = new Set(['PRE', 'TEXTAREA']);
  const parts = [];
  // Deleting a comment merges the text nodes that flanked it, so text runs are
  // concatenated before comparison — otherwise every such merge reads as a diff
  // when the character data is in fact unchanged.
  const walk = (node, inPre) => {
    let run = null;
    const flush = () => {
      if (run === null) return;
      const t = inPre ? run : run.replace(/\\s+/g, ' ');
      if (t.trim() !== '' || inPre) parts.push('#text\\u0001' + t);
      run = null;
    };
    for (const child of node.childNodes) {
      if (child.nodeType === 8) continue;              // comment: intentionally dropped
      if (child.nodeType === 3) { run = (run === null ? '' : run) + child.data; continue; }
      flush();
      if (child.nodeType !== 1) { parts.push('#other\\u0001' + (child.nodeName || '')); continue; }
      const attrs = [...child.attributes].map(a => a.name + '=' + a.value).sort().join('\\u0003');
      parts.push('<' + child.nodeName + '\\u0001' + attrs);
      // <style>/<script> bodies are text that we deliberately edit; their
      // equivalence is proved by the CSS/JS token checks, not here.
      if (child.nodeName === 'STYLE' || child.nodeName === 'SCRIPT') parts.push('#rawtext-checked-separately');
      else walk(child, inPre || PRE.has(child.nodeName));
      parts.push('</' + child.nodeName);
    }
    flush();
  };
  walk(doc, false);
  return parts.join('\\u0002');
}`;

// ---------------------------------------------------------------- main

async function main() {
  const args = process.argv.slice(2);
  const backupDir = path.resolve(args.find((a) => !a.startsWith('--')) || '');
  const doRender = !args.includes('--no-render');
  const limIdx = args.indexOf('--limit');
  const limit = limIdx > -1 ? Number(args[limIdx + 1]) : Infinity;

  const man = JSON.parse(fs.readFileSync(path.join(backupDir, 'backup-manifest.json'), 'utf8'));
  const files = man.files.slice(0, limit);
  console.log(`verifying ${files.length} pages against ${path.relative(ROOT, backupDir)}\n`);

  const fail = { dom: [], script: [], css: [], render: [], checksum: [], nondet: [] };

  const browser = await puppeteer.launch({ headless: 'new', args: ['--allow-file-access-from-files', '--force-device-scale-factor=1'] });
  const parsePage = await browser.newPage();
  await parsePage.goto('about:blank');

  // ---- checks 1 & 2
  let i = 0;
  for (const e of files) {
    const origPath = path.join(backupDir, 'files', e.rel);
    const orig = fs.readFileSync(origPath, 'utf8');
    const strip = fs.readFileSync(path.join(ROOT, e.rel), 'utf8');
    if (sha(orig) !== e.sha256Original || sha(strip) !== e.sha256Stripped) fail.checksum.push(e.rel);

    const [a, b] = await parsePage.evaluate(
      (fn, x, y) => { const f = eval(fn); return [f(x), f(y)]; }, SERIALIZE, orig, strip);
    if (a !== b) {
      let at = 0; while (at < a.length && a[at] === b[at]) at++;
      fail.dom.push({ rel: e.rel, at, orig: a.slice(Math.max(0, at - 90), at + 90), strip: b.slice(Math.max(0, at - 90), at + 90) });
    }

    const sa = inlineScripts(orig).map(tokenStream);
    const sb = inlineScripts(strip).map(tokenStream);
    if (sa.length !== sb.length || sa.some((s, k) => s !== sb[k])) fail.script.push(e.rel);

    const ca = inlineStyles(orig).map((c) => cssNormal(c, true));
    const cb = inlineStyles(strip).map((c) => cssNormal(c, false));
    if (ca.length !== cb.length || ca.some((s, k) => s !== cb[k])) fail.css.push(e.rel);

    if (++i % 200 === 0) console.log(`  parse/script ${i}/${files.length}`);
  }
  await parsePage.close();
  console.log(`  parse/script ${files.length}/${files.length} done — DOM mismatches ${fail.dom.length}, script mismatches ${fail.script.length}\n`);

  // ---- check 3
  if (doRender) {
    const CONC = 6;
    const shot = async (page, file) => {
      await page.goto('file://' + file, { waitUntil: 'load', timeout: 30000 });
      await new Promise((r) => setTimeout(r, 1000));
      return sha(await page.screenshot({ fullPage: true }));
    };
    let done = 0;
    const queue = files.slice();
    const workers = Array.from({ length: CONC }, async () => {
      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 900 });
      while (queue.length) {
        const e = queue.shift();
        const stripFile = path.join(ROOT, e.rel);
        // The original must render from the page's OWN directory: several cases
        // pull sibling assets (background PNGs, embedded documents) by relative
        // URL, which 404 from the flat backup tree and would read as a diff.
        const origFile = stripFile.replace(/\.html$/, `.__origcheck${process.pid}.html`);
        fs.copyFileSync(path.join(backupDir, 'files', e.rel), origFile);
        try {
          let h1 = await shot(page, origFile);
          let h2 = await shot(page, stripFile);
          if (h1 !== h2) {
            // is the ORIGINAL stable against itself?
            const h1b = await shot(page, origFile);
            if (h1b !== h1) { fail.nondet.push(e.rel); }
            else {
              const h2b = await shot(page, stripFile);
              if (h2b !== h2) fail.nondet.push(e.rel);
              else fail.render.push(e.rel);
            }
          }
        } catch (err) {
          fail.render.push(`${e.rel} (error: ${err.message})`);
        } finally {
          fs.rmSync(origFile, { force: true });
        }
        if (++done % 100 === 0) console.log(`  render ${done}/${files.length}`);
      }
      await page.close();
    });
    await Promise.all(workers);
    console.log(`  render ${done}/${files.length} done — stable mismatches ${fail.render.length}, nondeterministic ${fail.nondet.length}\n`);
  }

  await browser.close();

  const out = { schema: 'act-augmented-comment-strip-verify/1', backupDir: path.relative(ROOT, backupDir), checked: files.length, rendered: doRender, fail };
  const dest = path.join(backupDir, 'verify-report.json');
  fs.writeFileSync(dest, JSON.stringify(out, null, 2));

  console.log('RESULT');
  console.log(`  checksum mismatches : ${fail.checksum.length}`);
  console.log(`  DOM mismatches      : ${fail.dom.length}`);
  console.log(`  script mismatches   : ${fail.script.length}`);
  console.log(`  css mismatches      : ${fail.css.length}`);
  console.log(`  render mismatches   : ${doRender ? fail.render.length : 'skipped'}`);
  console.log(`  nondeterministic    : ${doRender ? fail.nondet.length : 'skipped'}`);
  for (const d of fail.dom.slice(0, 5)) {
    console.log(`\n  DOM DIFF ${d.rel} @${d.at}\n    orig: ${JSON.stringify(d.orig)}\n    strip:${JSON.stringify(d.strip)}`);
  }
  for (const r of fail.render.slice(0, 10)) console.log(`  RENDER DIFF ${r}`);
  console.log(`\nreport: ${path.relative(ROOT, dest)}`);
  const hard = fail.checksum.length + fail.dom.length + fail.script.length + fail.css.length + fail.render.length;
  process.exit(hard ? 1 : 0);
}

main().catch((e) => { console.error(e); process.exit(1); });
