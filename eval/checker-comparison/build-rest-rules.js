#!/usr/bin/env node
'use strict';
// Task B: mirror the DESCRIPTION pages for the 50 "rest-of-ACT" rules (the rules referenced by act-rest/) into
// act-rules/rest/, following the existing act-rules/ layout:
//   act-rules/rest/pages/<id>.html      — raw rule page as fetched
//   act-rules/rest/extracted/<id>.md    — lean text extraction (Description / Applicability / Expectation /
//                                          Background / Requirements Mapping / Examples; Glossary omitted)
//   act-rules/rest/manifest.json        — id, name, status, implement tokens (if on page), WCAG requirements, url
//
// Fetch order: https://www.w3.org/WAI/standards-guidelines/act/rules/<id>/proposed/ , falling back to
// https://www.w3.org/WAI/standards-guidelines/act/rules/<id>/ when the proposed URL 404s. Polite/retrying,
// idempotent (a cached raw page is re-extracted, not re-fetched).
//
// Usage: node build-rest-rules.js [--concurrency=6]

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const OUT = path.join(__dirname, '..', '..', 'act-rules', 'rest');
const PAGES = path.join(OUT, 'pages');
const EXTRACTED = path.join(OUT, 'extracted');
const arg = (n, d) => { const p = process.argv.find((x) => x === `--${n}` || x.startsWith(`--${n}=`)); return p == null ? d : (p === `--${n}` ? true : p.slice(n.length + 3)); };
const CONC = Number(arg('concurrency', 6));
const DELAY_MS = Number(arg('delay', 400));
const RETRIES = Number(arg('retries', 4));
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const testcases = require(path.join(ROOT, 'testcases.json')).testcases;
const restSubset = require(path.join(__dirname, 'act-rest', 'subset.json'));
const REST_RULE_IDS = [...new Set(restSubset.map((r) => r.ruleId))].sort();

// per-rule metadata: name, rule-level status (approved if ANY testcase is approved), the rule's WCAG SCs taken
// straight from act-rest/subset.json's sc[] (SAME derivation the corpus scores against: direct forConformance,
// else technique-mapped; [] for pure-ARIA rules), and the raw requirement keys for full transparency.
function ruleMeta(id) {
  const rows = testcases.filter((t) => t.ruleId === id);
  const anyApproved = rows.some((t) => !!(t.approved || t.isApproved));
  const reqKeys = new Set();
  for (const t of rows) for (const k of Object.keys(t.ruleAccessibilityRequirements || {})) reqKeys.add(k);
  const scRow = restSubset.find((r) => r.ruleId === id);
  return {
    id, name: rows[0].ruleName,
    status: anyApproved ? 'approved' : 'proposed',
    wcagRequirements: scRow ? scRow.sc.slice() : [],   // == act-rest/subset.json sc[]
    requirementKeys: [...reqKeys].sort(),
  };
}

// TRANSPORT: curl, NOT node/undici `fetch` — the W3C CDN blocks non-curl client/TLS fingerprints with a
// persistent 429 (see build-rest-subset.js). Backoff on 429/5xx; fail-fast (with e.status) on other 4xx so
// the caller's proposed→plain 404 fallback works.
const { execFile } = require('child_process');
const os = require('os');
const UA = 'A11yAnnotator research mirror (jason.nkg@gmail.com)';
function curlGetText(url) {
  return new Promise((resolve, reject) => {
    const tmp = path.join(os.tmpdir(), `arest-rule-${process.pid}-${Math.random().toString(36).slice(2)}.html`);
    execFile('curl', ['-sS', '-L', '--compressed', '-A', UA, '--max-time', '120', '-o', tmp, '-w', '%{http_code}', url],
      { maxBuffer: 1 << 20 }, (err, stdout) => {
        if (err) { try { fs.unlinkSync(tmp); } catch (_) {} return reject(err); }
        let text = ''; try { text = fs.readFileSync(tmp, 'utf8'); } catch (_) {}
        try { fs.unlinkSync(tmp); } catch (_) {}
        resolve({ code: parseInt(String(stdout).trim(), 10) || 0, text });
      });
  });
}
async function fetchText(url) {
  let lastErr;
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    if (attempt === 0) await sleep(DELAY_MS * (0.5 + Math.random()));
    let r;
    try { r = await curlGetText(url); }
    catch (e) { lastErr = e; await sleep(Math.min(DELAY_MS * Math.pow(2, attempt) * (0.5 + Math.random()), 60000)); continue; }
    if (r.code >= 200 && r.code < 300) return r.text;
    if (r.code !== 429 && r.code < 500) { const e = new Error(`HTTP ${r.code}`); e.status = r.code; throw e; }
    lastErr = new Error(`HTTP ${r.code}`);
    await sleep(Math.min(DELAY_MS * Math.pow(2, attempt) * (0.5 + Math.random()), 60000));
  }
  throw lastErr || new Error('fetch failed');
}

// --- HTML entity decode (named + numeric) ---
const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', mdash: '—', ndash: '–', hellip: '…', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', times: '×', copy: '©', reg: '®', trade: '™', deg: '°', laquo: '«', raquo: '»', middot: '·', bull: '•', dagger: '†' };
function decodeEntities(s) {
  return s.replace(/&(#x?[0-9a-f]+|[a-z][a-z0-9]*);/gi, (m, ent) => {
    if (ent[0] === '#') { const cp = ent[1] === 'x' || ent[1] === 'X' ? parseInt(ent.slice(2), 16) : parseInt(ent.slice(1), 10); return Number.isFinite(cp) ? String.fromCodePoint(cp) : m; }
    const k = ent.toLowerCase();
    return Object.prototype.hasOwnProperty.call(NAMED, k) ? NAMED[k] : m;
  });
}

// --- lean extraction: main content from <h1> through the section BEFORE the Glossary (glossary omitted). ---
// Faithful to act-rules/extracted/: headings become #/##/###/####; every OTHER tag becomes a single space
// (this reproduces the inter-<span> spacing of the syntax-highlighted code examples, e.g. `alt= "W3C logo"`);
// paragraph/list boundaries become newlines; entities decoded; runs of blank lines collapsed.
function extractLean(html, meta, resolvedUrl) {
  let s = html;
  const mainOpen = s.search(/<main\b[^>]*>/i);
  if (mainOpen >= 0) s = s.slice(mainOpen);
  const glossary = s.search(/<h2\b[^>]*id=["']glossary["']/i);
  if (glossary >= 0) s = s.slice(0, glossary);
  else { const mc = s.search(/<\/main>/i); if (mc >= 0) s = s.slice(0, mc); }
  // drop non-content blocks that can appear inside <main>
  s = s.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, ' ')
       .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, ' ')
       .replace(/<svg\b[^>]*>[\s\S]*?<\/svg>/gi, ' ')
       .replace(/<nav\b[^>]*>[\s\S]*?<\/nav>/gi, ' ');
  // headings -> markdown prefixes
  s = s.replace(/<h1\b[^>]*>/gi, '\n\n# ').replace(/<h2\b[^>]*>/gi, '\n\n## ')
       .replace(/<h3\b[^>]*>/gi, '\n\n### ').replace(/<h4\b[^>]*>/gi, '\n\n#### ')
       .replace(/<\/h[1-6]>/gi, '\n');
  // block boundaries -> newlines (before the generic tag->space pass)
  s = s.replace(/<\/?(p|li|ul|ol|tr|div|header|section|table|thead|tbody|pre|blockquote)\b[^>]*>/gi, '\n')
       .replace(/<br\s*\/?>/gi, '\n');
  // every remaining tag -> a single space (preserves span-boundary spacing in code samples)
  s = s.replace(/<[^>]+>/g, ' ');
  s = decodeEntities(s);
  // normalize: trim each line + collapse intra-line whitespace, then collapse blank-line runs
  s = s.split('\n').map((ln) => ln.replace(/[ \t ]+/g, ' ').trim()).join('\n').replace(/\n{3,}/g, '\n\n').trim();

  const header = [
    `# ACT Rule ${meta.id} — ${meta.name}`,
    `status: ${meta.status}`,
    `implement: ${meta.implement && meta.implement.length ? meta.implement.join(',') : '(not listed on rule page)'}`,
    `requirements: ${meta.wcagRequirements.length ? meta.wcagRequirements.join(', ') : '(no mapped WCAG SC — pure ARIA/other; requirementKeys: ' + meta.requirementKeys.join(', ') + ')'}`,
    `url: ${resolvedUrl}`,
    '',
  ].join('\n');
  return `${header}\n${s}\n\n<h2 id="glossary">\n[Glossary section omitted for brevity — see raw HTML]\n`;
}

// implement tokens if the page happens to expose them (data-implement=… anywhere in the markup); else null.
function implementFromPage(html) {
  const toks = new Set();
  let m; const re = /data-implement=["']([^"']+)["']/gi;
  while ((m = re.exec(html))) for (const t of m[1].split(/[\s,]+/)) if (t) toks.add(t.toLowerCase());
  return toks.size ? [...toks].sort() : null;
}

async function pool(items, n, fn) {
  const q = items.slice(); let active = 0; const out = [];
  return new Promise((resolve) => {
    const next = () => {
      if (!q.length && active === 0) return resolve(out);
      while (active < n && q.length) {
        const it = q.shift(); active++;
        fn(it).then((r) => out.push(r)).catch((e) => out.push({ id: it, error: String(e && e.message || e) })).finally(() => { active--; next(); });
      }
    };
    next();
  });
}

(async () => {
  try { require('child_process').execFileSync('curl', ['--version'], { stdio: 'ignore' }); }
  catch (e) { console.error('curl unavailable — this mirror uses curl as its transport (the W3C CDN blocks node/undici fingerprints)'); process.exit(1); }
  fs.mkdirSync(PAGES, { recursive: true }); fs.mkdirSync(EXTRACTED, { recursive: true });
  const base = 'https://www.w3.org/WAI/standards-guidelines/act/rules';

  const results = await pool(REST_RULE_IDS, CONC, async (id) => {
    const meta = ruleMeta(id);
    const rawPath = path.join(PAGES, `${id}.html`);
    let html, resolvedUrl;
    if (fs.existsSync(rawPath)) {           // cached — idempotent
      html = fs.readFileSync(rawPath, 'utf8');
      resolvedUrl = `${base}/${id}/proposed/`;
      const u = html.match(/<!--\s*source-url:\s*([^\s]+)\s*-->/); if (u) resolvedUrl = u[1];
    } else {
      const proposed = `${base}/${id}/proposed/`, plain = `${base}/${id}/`;
      try { html = await fetchText(proposed); resolvedUrl = proposed; }
      catch (e) {
        if (e.status === 404) { html = await fetchText(plain); resolvedUrl = plain; }
        else throw e;
      }
      fs.writeFileSync(rawPath, `<!-- source-url: ${resolvedUrl} -->\n${html}`);
    }
    meta.implement = implementFromPage(html);
    const md = extractLean(html, meta, resolvedUrl);
    fs.writeFileSync(path.join(EXTRACTED, `${id}.md`), md);
    return { ...meta, implement: meta.implement || [], url: resolvedUrl };
  });

  const rules = results.filter((r) => !r.error).sort((a, b) => a.id.localeCompare(b.id));
  const errors = results.filter((r) => r.error);
  const manifest = {
    generated: null,
    source: 'https://www.w3.org/WAI/standards-guidelines/act/rules/<id>/proposed/ (fallback: /<id>/)',
    note: 'Rest-of-ACT rule description pages: the 50 rules referenced by eval/checker-comparison/act-rest/. Complement of act-rules/act-rules-manifest.json (this project\'s in-scope 40). status is rule-level (approved if any testcase is approved). implement tokens are only populated when present on the rule page.',
    count: rules.length,
    rules: rules.map((r) => ({ id: r.id, name: r.name, status: r.status, implement: r.implement, wcagRequirements: r.wcagRequirements, requirementKeys: r.requirementKeys, url: r.url })),
  };
  fs.writeFileSync(path.join(OUT, 'manifest.json'), JSON.stringify(manifest, null, 2));
  console.log(`rest rules: ${rules.length}/${REST_RULE_IDS.length} mirrored to ${path.relative(ROOT, OUT)}`);
  console.log(`  status:`, { approved: rules.filter((r) => r.status === 'approved').length, proposed: rules.filter((r) => r.status === 'proposed').length });
  if (errors.length) { console.log(`  ${errors.length} error(s):`); for (const e of errors) console.log(`   ${e.id}: ${e.error}`); }
})();
