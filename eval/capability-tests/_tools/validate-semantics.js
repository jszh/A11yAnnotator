'use strict';
// Deeper adversarial-semantics check for 3.3.3. Extracts the example/suggested value embedded in
// each case's suggestion text and tests it against the page's OWN validator to confirm the
// adversarial premise actually holds:
//   - suggestion-correctness NEGATIVE: the example in the suggestion must be ACCEPTED by valid().
//   - suggestion-correctness POSITIVE: the format/value the suggestion steers the user to must be
//       REJECTED by valid() (the suggestion is genuinely misleading).
// Also: security-exception NEGATIVE must not leak the secret string in the error text.
const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const ROOT = path.resolve(__dirname, '..');

// candidate "fixed" values to probe the validator with, per case, keyed by file under each aspect.
// We test the value the SUGGESTION points the user toward.
const PROBE = {
  'suggestion-correctness-vs-constraint': {
    // POSITIVE: suggestion-implied value should be REJECTED (proves it's wrong)
    'case-01.html': { kind: 'pos', val: '12/25/2026' },      // MM/DD/YYYY suggested; field needs DD/MM
    'case-02.html': { kind: 'pos', val: '1234' },            // 4-digit suggested; needs 6
    'case-03.html': { kind: 'pos', val: 'USA' },             // 3-letter suggested; needs 2-letter set
    'case-04.html': { kind: 'pos', val: '50' },              // up to 100 suggested; max 10
    'case-05.html': { kind: 'pos', val: 'name@example' },    // dot-less example
    'case-06.html': { kind: 'pos', val: '1234-5678-9012-3456' }, // dashes suggested; needs bare 16
    'case-07.html': { kind: 'pos', val: 'abcd12' },          // lowercase suggested; needs UPPER
    'case-08.html': { kind: 'pos', val: '10' },              // whole number suggested; needs 2 decimals
    'case-09.html': { kind: 'pos', val: 'ada99' },           // no-@ suggested; needs leading @
    'case-10.html': { kind: 'pos', val: 'eightch1' },        // 8 chars suggested; needs 12
    // NEGATIVE: suggestion example should be ACCEPTED (proves it's correct)
    'case-11.html': { kind: 'neg', val: '25/12/2026' },
    'case-12.html': { kind: 'neg', val: '123456' },
    'case-13.html': { kind: 'neg', val: 'GB' },
    'case-14.html': { kind: 'neg', val: '5' },
    'case-15.html': { kind: 'neg', val: 'name@example.com' },
    'case-16.html': { kind: 'neg', val: '1234567890123456' },
    'case-17.html': { kind: 'neg', val: 'ABCD12' },
    'case-18.html': { kind: 'neg', val: '10.00' },
    'case-19.html': { kind: 'neg', val: '@ada_99' },
    'case-20.html': { kind: 'neg', val: 'abcdefghijkl' }, // 12 chars
  },
};

// secret strings that must NOT appear in the error text for security-exception negatives
const SECRETS = {
  'case-01.html': 'Sup3rSecret!', 'case-02.html': '483920', 'case-03.html': 'rex',
  'case-04.html': 'paris', 'case-05.html': 'OldPass99#', 'case-06.html': '481',
  'case-07.html': '726184', 'case-08.html': '5731', 'case-09.html': '7K9QX',
  'case-10.html': 'Z9F2-Q7K1-M3N8',
};

(async () => {
  const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
  const page = await browser.newPage();
  const problems = [];

  // 1) suggestion-correctness semantics
  const aspDir = path.join(ROOT, '3.3.3', 'suggestion-correctness-vs-constraint');
  for (const [file, { kind, val }] of Object.entries(PROBE['suggestion-correctness-vs-constraint'])) {
    const f = path.join(aspDir, file);
    await page.goto('file://' + f, { waitUntil: 'load' });
    // Reach the page's valid() by re-submitting with the probe value and reading aria-invalid.
    const accepted = await page.evaluate((v) => {
      const fld = document.getElementById('fld'); fld.value = v;
      document.getElementById('submit').click();
      // valid => aria-invalid removed and #err hidden
      return !fld.hasAttribute('aria-invalid');
    }, val);
    if (kind === 'pos' && accepted) problems.push(`correctness/${file}: POSITIVE but suggestion-implied value '${val}' was ACCEPTED — suggestion is not actually wrong`);
    if (kind === 'neg' && !accepted) problems.push(`correctness/${file}: NEGATIVE but suggestion example '${val}' was REJECTED — suggestion is not actually correct`);
  }

  // 2) security-exception negatives must not leak the secret
  const secDir = path.join(ROOT, '3.3.3', 'security-exception-classification');
  for (const [file, secret] of Object.entries(SECRETS)) {
    const f = path.join(secDir, file);
    const rows = JSON.parse(fs.readFileSync(path.join(secDir, 'labels.json'), 'utf8'));
    const row = rows.find((r) => r.file === file);
    await page.goto('file://' + f, { waitUntil: 'load' });
    const txt = await page.evaluate((sSel, fSel, val) => {
      document.querySelector(fSel).value = val;
      document.querySelector(sSel).click();
      const e = document.getElementById('err');
      return e ? (e.textContent || '') : '';
    }, row.submitSelector, row.fieldSelector, String(row.invalidValue));
    if (txt.includes(secret)) problems.push(`security/${file}: error text LEAKS the secret '${secret}' — withholding is not actually demonstrated`);
  }

  await browser.close();
  if (problems.length === 0) console.log('SEMANTICS CLEAN — wrong suggestions are genuinely rejected, correct suggestions are genuinely accepted, security negatives do not leak secrets.');
  else { console.log(`${problems.length} SEMANTIC PROBLEM(S):`); for (const p of problems) console.log('  -', p); process.exitCode = 1; }
})().catch((e) => { console.error(e.stack); process.exit(1); });
