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
  fs.writeFileSync(path.join(slug, 'drive.json'), JSON.stringify({ elements: [], forms: [] }));
  const skills = {}; for (const k of S.SKILLS) skills[k] = { verdict: 'N/A', sc: null, level: null, evidence: 'na' };
  skills['focus-visibility'] = { verdict: 'REPRODUCED', sc: '2.4.7', level: 'AA', evidence: 'no visible focus ring' };
  const pageOk = {}; for (const k of S.PAGE_SKILLS) pageOk[k] = { verdict: 'N/A', sc: null, level: null, evidence: 'na' };
  const built = buildResults({ file: 'x', slug: 'goodpage', elements: [{ xpath: '/a', axRole: 'link', axName: 'y', skills }], pageSkills: pageOk });
  fs.writeFileSync(path.join(slug, 'results.json'), JSON.stringify(built));
  let ok = true;
  try { run('node', ['scripts/tools/regression-sweep.js', dir], { cwd: ROOT, encoding: 'utf8' }); }
  catch (e) { ok = false; }
  fs.rmSync(dir, { recursive: true, force: true });
  assert.ok(ok, 'a builder-produced corpus must pass the sweep');
});
