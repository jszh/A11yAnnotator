'use strict';
// 3.3.3 aspect A: suggestion-correctness-vs-constraint
// On SUBMIT with invalid input the form shows an error WITH a suggestion. The question is
// whether the SUGGESTION is CORRECT vs the actual constraint.
// POSITIVE (expected=failed): a suggestion IS provided but it is WRONG / misleading vs the real
//   constraint (suggests a value/format the field still rejects).
// NEGATIVE (expected=passed): the suggestion correctly describes how to satisfy the real constraint.
const { writeCase, add, CITE, validatorScript } = require('./gen-332-333.js');
const SC = '3.3.3', A = 'suggestion-correctness-vs-constraint';

function emit(n, polarity, dim, comment, formBody, valid, msgExpr, invalidValue, rationale, citation, opts = {}) {
  const fieldId = opts.fieldId || 'fld';
  const body = `  <h1>${opts.h1 || 'Form'}</h1>
  <form id="f">
${formBody}
    <p id="err" class="err" role="alert" hidden></p>
    <button id="submit" type="submit">${opts.btn || 'Submit'}</button>
  </form>
${validatorScript({ formId: 'f', fieldId, errId: 'err', testFnSrc: valid, msgExpr })}`;
  const expected = polarity === 'positive' ? 'failed' : 'passed';
  const file = writeCase(SC, A, n, `${polarity.toUpperCase()} | ${A} | ${comment}`, body);
  add(SC, A, {
    file, expected, polarity, aspect: A, dimension: dim,
    fieldSelector: '#' + fieldId, submitSelector: '#submit', invalidValue,
    runnerShould: opts.runnerShould || 'decide', rationale, citation,
  });
}
const pos = (...a) => emit(a[0], 'positive', ...a.slice(1));
const neg = (...a) => emit(a[0], 'negative', ...a.slice(1));

// ---------------- POSITIVES (10): suggestion WRONG vs constraint ----------------
pos(1, 'wrong-format-suggested', 'date: requires DD/MM/YYYY, suggests MM/DD/YYYY',
  `    <label for="fld">Travel date</label>
    <input id="fld" name="d" type="text">`,
  `function(v){return /^(0[1-9]|[12]\\d|3[01])\\/(0[1-9]|1[0-2])\\/\\d{4}$/.test(v.trim());}`,
  `'Please use the format MM/DD/YYYY.'`, '13/25/2026',
  'The field only accepts DD/MM/YYYY, but on error it suggests "MM/DD/YYYY"; a user who follows the suggestion still enters a value the field rejects, so the correction suggestion is wrong vs the constraint.',
  CITE.g177, { h1: 'Booking', btn: 'Book' });

pos(2, 'wrong-length-suggested', 'PIN must be 6 digits, suggests 4',
  `    <label for="fld">PIN</label>
    <input id="fld" name="pin" type="text">`,
  `function(v){return /^\\d{6}$/.test(v.trim());}`,
  `'Enter a 4-digit PIN.'`, '12',
  'The constraint requires exactly 6 digits, but the suggestion tells the user to enter a 4-digit PIN; following it yields a value still rejected, so the suggestion misstates the correct input.',
  CITE.g177, { h1: 'Login', btn: 'Sign in' });

pos(3, 'wrong-allowed-values', 'country list suggests an option not in the set',
  `    <label for="fld">Country (2-letter code)</label>
    <input id="fld" name="cty" type="text">`,
  `function(v){return ['US','CA','GB'].includes(v.trim().toUpperCase());}`,
  `'Enter a code such as USA, CAN, or GBR.'`, 'XX',
  'Situation B: the allowed values are US/CA/GB (2-letter), but the suggestion offers 3-letter codes (USA/CAN/GBR) that are NOT in the allowed set; the suggested correction is itself invalid (G84 done wrong).',
  CITE.g84, { h1: 'Shipping', btn: 'Save' });

pos(4, 'wrong-range', 'quantity 1-10, suggests up to 100',
  `    <label for="fld">Quantity</label>
    <input id="fld" name="qty" type="text">`,
  `function(v){var n=Number(v);return Number.isInteger(n)&&n>=1&&n<=10;}`,
  `'Enter a number between 1 and 100.'`, '0',
  'The field accepts 1–10, but the suggestion advertises 1–100; a user following it (e.g. entering 50) is still rejected, so the suggested range does not match the real constraint.',
  CITE.g177, { h1: 'Cart', btn: 'Update' });

pos(5, 'wrong-example-in-suggestion', 'email suggestion example is itself malformed',
  `    <label for="fld">Email</label>
    <input id="fld" name="em" type="text">`,
  `function(v){return /^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(v.trim());}`,
  `'Enter an email like name@example (no dot needed).'`, 'foo',
  'The constraint requires a dot in the domain, but the suggested example "name@example" omits the dot and would itself fail validation; the suggestion misleads the user about valid format.',
  CITE.g177, { h1: 'Sign up', btn: 'Subscribe' });

pos(6, 'wrong-separator', 'card needs no spaces, suggestion tells user to add dashes',
  `    <label for="fld">Card number</label>
    <input id="fld" name="cc" type="text">`,
  `function(v){return /^\\d{16}$/.test(v.trim());}`,
  `'Enter your card as 4 groups separated by dashes, e.g. 1234-5678-9012-3456.'`, '12 34',
  'The field accepts only 16 bare digits, but the suggestion instructs the user to insert dashes; a dashed value is still rejected, so the suggested correction contradicts the constraint.',
  CITE.g177, { h1: 'Payment', btn: 'Pay' });

pos(7, 'wrong-case-requirement', 'code must be uppercase, suggests lowercase',
  `    <label for="fld">Voucher code</label>
    <input id="fld" name="vc" type="text">`,
  `function(v){return /^[A-Z]{4}\\d{2}$/.test(v.trim());}`,
  `'Use four lowercase letters then two digits, e.g. abcd12.'`, '12',
  'The pattern requires UPPERCASE letters, but the suggestion (and its example "abcd12") tells the user to use lowercase; the suggested correction is rejected, so it is wrong vs the constraint.',
  CITE.g177, { h1: 'Redeem', btn: 'Apply' });

pos(8, 'wrong-required-decimal', 'price needs 2 decimals, suggests whole numbers',
  `    <label for="fld">Price (USD)</label>
    <input id="fld" name="pr" type="text">`,
  `function(v){return /^\\d+\\.\\d{2}$/.test(v.trim());}`,
  `'Enter a whole dollar amount, e.g. 10.'`, '10',
  'The constraint requires two decimal places, but the suggestion says enter a whole number ("10"); following it leaves the value invalid, so the suggested correction does not satisfy the real constraint.',
  CITE.g177, { h1: 'Checkout', btn: 'Buy' });

pos(9, 'wrong-prefix', 'handle must start @, suggestion drops the @',
  `    <label for="fld">Handle</label>
    <input id="fld" name="h" type="text">`,
  `function(v){return /^@[a-z0-9_]{2,15}$/.test(v.trim());}`,
  `'Enter 2-15 lowercase letters or numbers, no symbols.'`, 'A',
  'The field requires a leading @, but the suggestion explicitly says "no symbols"; a value without @ is rejected, so the suggested correction omits the very prefix the constraint requires.',
  CITE.g177, { h1: 'Profile', btn: 'Save' });

pos(10, 'wrong-min-length', 'password >= 12, suggestion says 8',
  `    <label for="fld">New password</label>
    <input id="fld" name="pw" type="text">`,
  `function(v){return v.length>=12;}`,
  `'Use at least 8 characters.'`, 'short',
  'The constraint requires 12+ characters, but the suggestion advises only 8; a user who enters an 8-character password (following the suggestion) is still rejected, so the suggestion understates the requirement.',
  CITE.g177, { h1: 'Account', btn: 'Set password' });

// ---------------- NEGATIVES (10): suggestion CORRECT vs constraint ----------------
neg(11, 'correct-format-suggested', 'date DD/MM/YYYY suggested correctly',
  `    <label for="fld">Travel date</label>
    <input id="fld" name="d" type="text">`,
  `function(v){return /^(0[1-9]|[12]\\d|3[01])\\/(0[1-9]|1[0-2])\\/\\d{4}$/.test(v.trim());}`,
  `'Please use the format DD/MM/YYYY, e.g. 25/12/2026.'`, '2026-12-25',
  'The suggestion states the actual accepted format DD/MM/YYYY with a valid example; a user following it enters data the field accepts, so the correction suggestion is correct (G177).',
  CITE.g177, { h1: 'Booking', btn: 'Book' });

neg(12, 'correct-length-suggested', 'PIN 6 digits suggested correctly',
  `    <label for="fld">PIN</label>
    <input id="fld" name="pin" type="text">`,
  `function(v){return /^\\d{6}$/.test(v.trim());}`,
  `'Enter your 6-digit PIN.'`, '12',
  'The suggestion tells the user to enter exactly 6 digits, matching the constraint; a compliant entry succeeds, so the correction is accurate.',
  CITE.g177, { h1: 'Login', btn: 'Sign in' });

neg(13, 'correct-allowed-values', 'country suggestion lists valid codes',
  `    <label for="fld">Country (2-letter code)</label>
    <input id="fld" name="cty" type="text">`,
  `function(v){return ['US','CA','GB'].includes(v.trim().toUpperCase());}`,
  `'Enter one of: US, CA, GB.'`, 'XX',
  'Situation B done right: the suggestion enumerates the actual allowed values (US/CA/GB); any suggested value is accepted, so the correction matches the constraint (G84).',
  CITE.g84, { h1: 'Shipping', btn: 'Save' });

neg(14, 'correct-range', 'quantity 1-10 suggested correctly',
  `    <label for="fld">Quantity</label>
    <input id="fld" name="qty" type="text">`,
  `function(v){var n=Number(v);return Number.isInteger(n)&&n>=1&&n<=10;}`,
  `'Enter a whole number between 1 and 10.'`, '0',
  'The suggestion gives the exact accepted range 1–10 (integers); following it yields a valid value, so the suggested correction is correct.',
  CITE.g177, { h1: 'Cart', btn: 'Update' });

neg(15, 'correct-example', 'email suggestion example is valid',
  `    <label for="fld">Email</label>
    <input id="fld" name="em" type="text">`,
  `function(v){return /^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(v.trim());}`,
  `'Enter an email like name@example.com.'`, 'foo',
  'The suggested example "name@example.com" itself satisfies the email pattern; the correction tells the user a form that will be accepted (G177 with a valid example).',
  CITE.g177, { h1: 'Sign up', btn: 'Subscribe' });

neg(16, 'correct-separator', 'card suggestion says 16 digits no spaces',
  `    <label for="fld">Card number</label>
    <input id="fld" name="cc" type="text">`,
  `function(v){return /^\\d{16}$/.test(v.trim());}`,
  `'Enter all 16 digits with no spaces or dashes.'`, '12 34',
  'The suggestion accurately tells the user to enter 16 digits with no separators, matching the constraint; a compliant entry is accepted.',
  CITE.g177, { h1: 'Payment', btn: 'Pay' });

neg(17, 'correct-case', 'voucher suggestion specifies uppercase',
  `    <label for="fld">Voucher code</label>
    <input id="fld" name="vc" type="text">`,
  `function(v){return /^[A-Z]{4}\\d{2}$/.test(v.trim());}`,
  `'Use four UPPERCASE letters then two digits, e.g. ABCD12.'`, '12',
  'The suggestion specifies uppercase letters with a valid example "ABCD12", matching the pattern; following it produces an accepted value.',
  CITE.g177, { h1: 'Redeem', btn: 'Apply' });

neg(18, 'correct-decimal', 'price suggestion requires 2 decimals',
  `    <label for="fld">Price (USD)</label>
    <input id="fld" name="pr" type="text">`,
  `function(v){return /^\\d+\\.\\d{2}$/.test(v.trim());}`,
  `'Enter an amount with two decimal places, e.g. 10.00.'`, '10',
  'The suggestion correctly tells the user to include two decimal places with a valid example "10.00"; the suggested form satisfies the constraint.',
  CITE.g177, { h1: 'Checkout', btn: 'Buy' });

neg(19, 'correct-prefix', 'handle suggestion keeps the @',
  `    <label for="fld">Handle</label>
    <input id="fld" name="h" type="text">`,
  `function(v){return /^@[a-z0-9_]{2,15}$/.test(v.trim());}`,
  `'Start with @, then 2-15 lowercase letters, numbers, or underscores, e.g. @ada_99.'`, 'A',
  'The suggestion includes the required leading @ and a valid example "@ada_99"; following it yields an accepted value, so the correction matches the constraint.',
  CITE.g177, { h1: 'Profile', btn: 'Save' });

neg(20, 'correct-min-length', 'password suggestion says 12',
  `    <label for="fld">New password</label>
    <input id="fld" name="pw" type="text">`,
  `function(v){return v.length>=12;}`,
  `'Use at least 12 characters.'`, 'short',
  'The suggestion advises at least 12 characters, exactly the constraint; a 12+ character entry is accepted, so the correction is correct.',
  CITE.g177, { h1: 'Account', btn: 'Set password' });

module.exports = true;
