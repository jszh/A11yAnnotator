// R2.1-G — meta-tests: prove the documented run-all command actually runs tests, and
// that the regression sweep fails loudly on a known violation (the auditor noted neither
// was proven). Pure (no annotator server needed).
'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync, execFileSync: run } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const ROOT = path.join(__dirname, '..', '..');

test('run-all is not broken: the sweep CLI is OUT of the test glob (the MODULE_NOT_FOUND fix)', () => {
  const testFiles = fs.readdirSync(path.join(ROOT, 'scripts/tests')).filter(f => f.endsWith('.test.js'));
  assert.ok(testFiles.length >= 5, 'has the expected test files');
  assert.ok(!testFiles.includes('regression-sweep.js'), 'the CLI must not be a *.test.js');
  assert.ok(fs.existsSync(path.join(ROOT, 'scripts/tools/regression-sweep.js')), 'sweep lives under scripts/tools');
});

test('the documented PURE glob (multiple files) executes >0 tests and exits 0', () => {
  // R21-M2: run the ACTUAL multi-file pure glob, not just unit.test.js. (The browser
  // suites are excluded here only because they need the live server; the full glob is
  // run separately in the green-suite verification.)
  const env = { ...process.env }; delete env.NODE_TEST_CONTEXT;
  const files = ['unit.test.js', 'result.test.js', 'docs.test.js'].map(f => 'scripts/tests/' + f);
  let out = '';
  try { out = execFileSync('node', ['--test', ...files], { cwd: ROOT, encoding: 'utf8', env }); }
  catch (e) { out = (e.stdout || '') + (e.stderr || ''); if (!out) assert.fail('pure glob errored: ' + e.message); }
  const tests = +(/\btests\s+(\d+)/.exec(out) || [])[1] || 0;
  const fail = +(/\bfail\s+(\d+)/.exec(out) || [])[1] || 0;
  assert.ok(tests >= 30, `must execute the multi-file glob (saw tests=${tests}, tail: ${out.slice(-160)})`);
  assert.equal(fail, 0);
});

test('regression sweep FAILS (exit 1) on a known anyIssue/contract violation', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sweepcorpus_'));
  const slug = path.join(dir, 'badpage'); fs.mkdirSync(slug);
  // minimal drive.json so the slug is picked up
  fs.writeFileSync(path.join(slug, 'drive.json'), JSON.stringify({ elements: [], forms: [] }));
  // a results.json with a deliberate violation: REPRODUCED but anyIssue:false
  const S = require('../lib/result-schema.js');
  const skills = {}; for (const k of S.SKILLS) skills[k] = { verdict: 'N/A', sc: null, level: null, evidence: 'na' };
  skills['focus-visibility'] = { verdict: 'REPRODUCED', sc: '2.4.7', level: 'AA', evidence: 'no ring' };
  fs.writeFileSync(path.join(slug, 'results.json'), JSON.stringify({ file: 'x', slug: 'badpage', elements: [{ xpath: '/a', skills, anyIssue: false }] }));
  let failed = false, output = '';
  try { run('node', ['scripts/tools/regression-sweep.js', dir], { cwd: ROOT, encoding: 'utf8' }); }
  catch (e) { failed = true; output = (e.stdout || '') + (e.stderr || ''); }
  fs.rmSync(dir, { recursive: true, force: true });
  assert.ok(failed, 'sweep must exit non-zero on a violation');
  assert.match(output, /anyIssue|REGRESSION SWEEP FAILED/);
});

test('regression sweep PASSES (exit 0) on a clean builder-produced corpus', () => {
  const { buildResults } = require('../lib/result-builder.js');
  const S = require('../lib/result-schema.js');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sweepok_'));
  const slug = path.join(dir, 'goodpage'); fs.mkdirSync(slug);
  // R2.4-B: the definite focus-visibility verdict below must be backed by a driver focus probe.
  fs.writeFileSync(path.join(slug, 'drive.json'), JSON.stringify({ elements: [{ xpath: '/a', focusIndicator: { present: false }, behavioralTrust: { activation: { trusted: true, isolated: true } } }], forms: [] }));
  const skills = {}; for (const k of S.SKILLS) skills[k] = { verdict: 'N/A', sc: null, level: null, evidence: 'not applicable to this element' };
  skills['focus-visibility'] = { verdict: 'REPRODUCED', sc: '2.4.7', level: 'AA', evidence: 'no visible focus ring' };
  // R2.3-C: page skills are inherently applicable (no N/A); provenance ties to collect.
  const pageOk = {}; for (const k of S.PAGE_SKILLS) pageOk[k] = { verdict: 'NOT REPRODUCED', sc: null, level: null, evidence: 'checked: no page-level issue' };
  const built = buildResults({ file: 'x', slug: 'goodpage', elements: [{ xpath: '/a', axRole: 'link', axName: 'y', skills }], pageSkills: pageOk, provenance: { collect: { xpaths: ['/a'], count: 1 } } });
  fs.writeFileSync(path.join(slug, 'results.json'), JSON.stringify(built));
  let ok = true;
  try { run('node', ['scripts/tools/regression-sweep.js', dir], { cwd: ROOT, encoding: 'utf8' }); }
  catch (e) { ok = false; }
  fs.rmSync(dir, { recursive: true, force: true });
  assert.ok(ok, 'a builder-produced corpus must pass the sweep');
});

test('R2.6-C: build-results.js CLI rejects a run-id mismatch (stale drive) and a normalized-dup inventory', () => {
  const S = require('../lib/result-schema.js');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'runid_'));
  const sk = {}; for (const k of S.SKILLS) sk[k] = { verdict: 'N/A', sc: null, level: null, evidence: 'na' };
  const ps = {}; for (const k of S.PAGE_SKILLS) ps[k] = { verdict: 'NOT REPRODUCED', sc: null, level: null, evidence: 'ok' };
  const rec = { file: 'p.html', slug: 's', pageSkills: ps, elements: [{ xpath: '/a', axRole: 'x', axName: 'y', skills: sk }] };
  const recP = path.join(dir, 'rec.json'); fs.writeFileSync(recP, JSON.stringify(rec));
  fs.writeFileSync(path.join(dir, 'collect.json'), JSON.stringify({ file: 'p.html', runId: 'RUN-A', collectedAt: 1000, elements: [{ xpath: '/a' }], axe: [] }));
  fs.writeFileSync(path.join(dir, 'drive_ok.json'), JSON.stringify({ file: 'p.html', runId: 'RUN-A', drivenAt: 2000, elements: [], forms: [] }));
  fs.writeFileSync(path.join(dir, 'drive_stale.json'), JSON.stringify({ file: 'p.html', runId: 'RUN-OLD', drivenAt: 2000, elements: [], forms: [] }));
  // R2.7-C: reused run-id but the drive predates this collect (drivenAt < collectedAt) → stale.
  fs.writeFileSync(path.join(dir, 'drive_old.json'), JSON.stringify({ file: 'p.html', runId: 'RUN-A', drivenAt: 500, elements: [], forms: [] }));
  fs.writeFileSync(path.join(dir, 'collect_dup.json'), JSON.stringify({ file: 'p.html', runId: 'RUN-A', collectedAt: 1000, elements: [{ xpath: '//d[@id="x"]' }, { xpath: '//d[@id = "x"]' }], axe: [] })); // predicate-spacing variant
  const cli = (collect, drive) => { try { run('node', ['scripts/tools/build-results.js', recP, path.join(dir, 'out.json'), path.join(dir, collect), path.join(dir, drive)], { cwd: ROOT, encoding: 'utf8' }); return { ok: true, out: '' }; } catch (e) { return { ok: false, out: (e.stdout || '') + (e.stderr || '') }; } };
  assert.equal(cli('collect.json', 'drive_ok.json').ok, true, 'matching run-id + fresh drive validates');
  const stale = cli('collect.json', 'drive_stale.json'); assert.equal(stale.ok, false); assert.match(stale.out, /run-identity mismatch/);
  const old = cli('collect.json', 'drive_old.json'); assert.equal(old.ok, false); assert.match(old.out, /stale drive/);
  const dup = cli('collect_dup.json', 'drive_ok.json'); assert.equal(dup.ok, false); assert.match(dup.out, /duplicate xpath/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('R2.8-B: build-results.js CLI rejects a DUPLICATE or EXTRA driver xpath', () => {
  const S = require('../lib/result-schema.js');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'drvinv_'));
  const sk = {}; for (const k of S.SKILLS) sk[k] = { verdict: 'N/A', sc: null, level: null, evidence: 'na' };
  const ps = {}; for (const k of S.PAGE_SKILLS) ps[k] = { verdict: 'NOT REPRODUCED', sc: null, level: null, evidence: 'ok' };
  const rec = { file: 'p.html', slug: 's', pageSkills: ps, elements: [{ xpath: '/a', axRole: 'x', axName: 'y', skills: sk }] };
  const recP = path.join(dir, 'rec.json'); fs.writeFileSync(recP, JSON.stringify(rec));
  fs.writeFileSync(path.join(dir, 'collect.json'), JSON.stringify({ file: 'p.html', runId: 'R', collectedAt: 1000, elements: [{ xpath: '/a' }], axe: [], axeRan: true }));
  fs.writeFileSync(path.join(dir, 'drive_dup.json'), JSON.stringify({ file: 'p.html', runId: 'R', drivenAt: 2000, elements: [{ xpath: '/a', focusIndicator: { present: false } }, { xpath: '/a', focusIndicator: { present: true } }], forms: [] }));
  fs.writeFileSync(path.join(dir, 'drive_extra.json'), JSON.stringify({ file: 'p.html', runId: 'R', drivenAt: 2000, elements: [{ xpath: '/a' }, { xpath: '/ghost' }], forms: [] }));
  const cli = (drive) => { try { run('node', ['scripts/tools/build-results.js', recP, path.join(dir, 'out.json'), path.join(dir, 'collect.json'), path.join(dir, drive)], { cwd: ROOT, encoding: 'utf8' }); return { ok: true, out: '' }; } catch (e) { return { ok: false, out: (e.stdout || '') + (e.stderr || '') }; } };
  const dup = cli('drive_dup.json'); assert.equal(dup.ok, false); assert.match(dup.out, /driver inventory has 1 duplicate/);
  const extra = cli('drive_extra.json'); assert.equal(extra.ok, false); assert.match(extra.out, /NOT in the collector inventory/);
  fs.rmSync(dir, { recursive: true, force: true });
});

test('R2.8-D: build-results.js CLI rejects MISSING freshness timestamps (no longer fail-open)', () => {
  const S = require('../lib/result-schema.js');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fresh_'));
  const sk = {}; for (const k of S.SKILLS) sk[k] = { verdict: 'N/A', sc: null, level: null, evidence: 'na' };
  const ps = {}; for (const k of S.PAGE_SKILLS) ps[k] = { verdict: 'NOT REPRODUCED', sc: null, level: null, evidence: 'ok' };
  const recP = path.join(dir, 'rec.json'); fs.writeFileSync(recP, JSON.stringify({ file: 'p.html', slug: 's', pageSkills: ps, elements: [{ xpath: '/a', axRole: 'x', axName: 'y', skills: sk }] }));
  // collect WITHOUT collectedAt, drive WITHOUT drivenAt — was fail-open, now rejected.
  fs.writeFileSync(path.join(dir, 'collect.json'), JSON.stringify({ file: 'p.html', runId: 'R', axeRan: true, axe: [], elements: [{ xpath: '/a' }] }));
  fs.writeFileSync(path.join(dir, 'drive.json'), JSON.stringify({ file: 'p.html', runId: 'R', elements: [{ xpath: '/a' }], forms: [] }));
  let out = '';
  try { run('node', ['scripts/tools/build-results.js', recP, path.join(dir, 'out.json'), path.join(dir, 'collect.json'), path.join(dir, 'drive.json')], { cwd: ROOT, encoding: 'utf8' }); }
  catch (e) { out = (e.stdout || '') + (e.stderr || ''); }
  assert.match(out, /missing freshness timestamps/);
  fs.rmSync(dir, { recursive: true, force: true });
});
