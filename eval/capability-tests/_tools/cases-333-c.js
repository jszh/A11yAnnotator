'use strict';
// 3.3.3 aspect C: security-exception-classification
// The 3.3.3 exception: "...unless it would jeopardize the security or purpose of the content."
// NEGATIVE (expected=passed): the suggestion is CORRECTLY WITHHELD on a security/purpose field
//   (revealing the correct value would defeat the security or the purpose) — the exception applies.
// POSITIVE (expected=failed): EITHER a NON-security field is wrongly given no correction suggestion
//   (no exception applies, so 3.3.3 is owed and not met), OR a security field where a SAFE
//   suggestion was owed (e.g. password COMPOSITION rules, which can be stated without revealing the
//   secret) is wrongly given nothing.
const { writeCase, add, CITE, validatorScript } = require('./gen-332-333.js');
const SC = '3.3.3', A = 'security-exception-classification';

function emit(n, polarity, dim, comment, formBody, valid, msgExpr, invalidValue, rationale, citation, opts = {}) {
  const fieldId = opts.fieldId || 'fld';
  const fieldType = opts.fieldType || 'text';
  const body = `  <h1>${opts.h1 || 'Form'}</h1>
  <form id="f">
${formBody}
    <p id="err" class="err" role="alert" hidden></p>
    <button id="submit" type="submit">${opts.btn || 'Submit'}</button>
  </form>
${validatorScript({ formId: 'f', fieldId, errId: 'err', testFnSrc: valid, msgExpr })}`;
  const expected = polarity === 'positive' ? 'failed' : 'passed';
  const file = writeCase(SC, A, n, `${polarity.toUpperCase()} | ${A} | ${comment}`, body);
  const row = {
    file, expected, polarity, aspect: A, dimension: dim,
    fieldSelector: '#' + fieldId, submitSelector: '#submit', invalidValue,
    runnerShould: opts.runnerShould || 'decide', rationale, citation,
  };
  add(SC, A, row);
}
const pos = (...a) => emit(a[0], 'positive', ...a.slice(1));
const neg = (...a) => emit(a[0], 'negative', ...a.slice(1));

// ============ NEGATIVES (10): exception APPLIES — withholding the value is CORRECT ============
// A bare "incorrect" message with NO correction value is the right behaviour here.

neg(1, 'login-password-no-hint', 'login password: wrong password, no value suggested',
  `    <label for="fld">Password</label>
    <input id="fld" name="pw" type="password">`,
  `function(v){return v==='Sup3rSecret!';}`,
  `'The password you entered is incorrect.'`, 'wrongpass',
  'Suggesting the correct password (or how close the guess was) would jeopardize account security; the exception applies, so a bare "incorrect" message without a correction value is the correct, conformant behaviour.',
  CITE.exc, { h1: 'Sign in', btn: 'Sign in', fieldType: 'password' });

neg(2, 'otp-no-hint', 'one-time passcode: wrong code, no value suggested',
  `    <label for="fld">One-time passcode</label>
    <input id="fld" name="otp" type="text" inputmode="numeric">`,
  `function(v){return v.trim()==='483920';}`,
  `'That code is incorrect or has expired.'`, '000000',
  'Revealing the correct one-time passcode would defeat its security purpose; withholding the correct value (only stating it is wrong/expired) is the conformant application of the 3.3.3 exception. The field is type=text, so a deterministic runner cannot infer the security purpose from markup alone — it should ABSTAIN and leave this to human/LLM judgment rather than risk a false barrier.',
  CITE.exc, { h1: 'Verify', btn: 'Verify', runnerShould: 'abstain' });

neg(3, 'security-question-no-hint', 'security question answer: no value suggested',
  `    <label for="fld">First pet's name</label>
    <input id="fld" name="sq" type="text">`,
  `function(v){return v.trim().toLowerCase()==='rex';}`,
  `'That answer does not match our records.'`, 'fluffy',
  'Suggesting the stored answer to a knowledge-based security question would let an attacker bypass it; the exception applies and withholding the correct value is correct. The security PURPOSE is not encoded in the markup (plain type=text), so a deterministic runner should ABSTAIN rather than flag a missing suggestion as a barrier.',
  CITE.exc, { h1: 'Account recovery', btn: 'Continue', runnerShould: 'abstain' });

neg(4, 'quiz-answer-no-hint', 'graded quiz: wrong answer, no correction (defeats purpose)',
  `    <label for="fld">What is the capital of France? (graded)</label>
    <input id="fld" name="q" type="text">`,
  `function(v){return v.trim().toLowerCase()==='paris';}`,
  `'Incorrect. Try again.'`, 'london',
  'For a GRADED quiz, telling the user the correct answer would defeat the PURPOSE of the content (assessing knowledge); the "purpose of the content" clause of the exception applies, so no correction is owed. Whether the quiz is graded is NOT determinable from markup, so a deterministic runner should ABSTAIN — only a human/LLM can read the field\'s purpose.',
  CITE.exc, { h1: 'Geography quiz', btn: 'Submit answer', runnerShould: 'abstain' });

neg(5, 'current-password-reauth', 'reauth current password: no value suggested',
  `    <label for="fld">Confirm current password</label>
    <input id="fld" name="cpw" type="password">`,
  `function(v){return v==='OldPass99#';}`,
  `'Current password is incorrect.'`, 'guess',
  'Re-authentication with the current password cannot suggest the correct value without exposing the credential; the security exception applies and withholding it is correct.',
  CITE.exc, { h1: 'Change settings', btn: 'Confirm', fieldType: 'password' });

neg(6, 'cvv-no-hint', 'card security code: wrong CVV, no value suggested',
  `    <label for="fld">Card security code (CVV)</label>
    <input id="fld" name="cvv" type="text" inputmode="numeric">`,
  `function(v){return v.trim()==='481';}`,
  `'The security code does not match this card.'`, '000',
  'The CVV is a secret printed only on the card; suggesting the correct value would undermine its anti-fraud purpose, so the exception applies and only a non-revealing error is appropriate. As a plain type=text field, the security purpose is not in the markup, so a deterministic runner should ABSTAIN.',
  CITE.exc, { h1: 'Payment', btn: 'Pay', runnerShould: 'abstain' });

neg(7, 'totp-authenticator', 'authenticator app TOTP: wrong code, no value suggested',
  `    <label for="fld">Authenticator code</label>
    <input id="fld" name="totp" type="text" inputmode="numeric">`,
  `function(v){return v.trim()==='726184';}`,
  `'Incorrect authenticator code.'`, '111111',
  'A time-based authenticator code is a security factor; revealing the expected value would defeat 2FA, so the exception applies and a bare incorrect message is correct. The 2FA purpose is not encoded in the type=text markup, so a deterministic runner should ABSTAIN.',
  CITE.exc, { h1: 'Two-factor', btn: 'Verify', runnerShould: 'abstain' });

neg(8, 'pin-no-hint', 'banking PIN: wrong PIN, no value suggested',
  `    <label for="fld">Telephone banking PIN</label>
    <input id="fld" name="pin" type="password">`,
  `function(v){return v==='5731';}`,
  `'Incorrect PIN.'`, '0000',
  'Suggesting the correct banking PIN would compromise the account; the security exception applies, so withholding the value (stating only that it is incorrect) is conformant.',
  CITE.exc, { h1: 'Phone banking', btn: 'Continue', fieldType: 'password' });

neg(9, 'captcha-answer-no-hint', 'CAPTCHA: wrong answer, no correction (defeats purpose)',
  `    <label for="fld">Type the characters shown: 7K9QX</label>
    <input id="fld" name="cap" type="text">`,
  `function(v){return v.trim().toUpperCase()==='7K9QX';}`,
  `'The characters did not match. A new challenge has been issued.'`, 'aaaaa',
  'A CAPTCHA exists to distinguish humans from bots; programmatically suggesting the correct characters would defeat that purpose, so the "purpose of the content" exception applies. That this is a CAPTCHA is not reliably determinable from generic markup, so a deterministic runner should ABSTAIN.',
  CITE.exc, { h1: 'Are you human?', btn: 'Verify', runnerShould: 'abstain' });

neg(10, 'voucher-secret-no-hint', 'single-use secret token: no value suggested',
  `    <label for="fld">Redemption token</label>
    <input id="fld" name="tok" type="text">`,
  `function(v){return v.trim()==='Z9F2-Q7K1-M3N8';}`,
  `'That redemption token is not valid.'`, 'AAAA-BBBB-CCCC',
  'A secret single-use redemption token must not be suggested or its anti-abuse security is lost; the exception applies, so only a non-revealing invalid-token message is appropriate. Whether the token is a shared secret vs a public code is not in the markup, so a deterministic runner should ABSTAIN.',
  CITE.exc, { h1: 'Redeem', btn: 'Redeem', runnerShould: 'abstain' });

// ============ POSITIVES (10): exception does NOT (fully) apply — a suggestion was OWED ============

// 10a: NON-security fields wrongly given a bare error with NO correction suggestion.
pos(11, 'nonsecurity-bare-error', 'email field: only "invalid", no correction suggested',
  `    <label for="fld">Email</label>
    <input id="fld" name="em" type="text">`,
  `function(v){return /^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(v.trim());}`,
  `'Invalid email.'`, 'notanemail',
  'An email field carries no security secret, so the exception does not apply and a correction suggestion is known (the email format); showing only "Invalid email" with no suggestion fails 3.3.3.',
  CITE.g177, { h1: 'Newsletter', btn: 'Subscribe' });

pos(12, 'nonsecurity-bare-error', 'date field: only "wrong", no format suggested',
  `    <label for="fld">Date</label>
    <input id="fld" name="d" type="text">`,
  `function(v){return /^(0[1-9]|[12]\\d|3[01])\\/(0[1-9]|1[0-2])\\/\\d{4}$/.test(v.trim());}`,
  `'That date is not valid.'`, '2026-12-25',
  'A date field has a knowable correction (the DD/MM/YYYY format) and no security exception; a bare "not valid" with no format suggestion fails 3.3.3 — the exception is wrongly assumed.',
  CITE.g177, { h1: 'Booking', btn: 'Book' });

pos(13, 'nonsecurity-bare-error', 'postal code: only "error", no format suggested',
  `    <label for="fld">ZIP code</label>
    <input id="fld" name="zip" type="text">`,
  `function(v){return /^\\d{5}$/.test(v.trim());}`,
  `'Error.'`, 'abcde',
  'A ZIP code\'s correct format (5 digits) is knowable and not security-sensitive; a bare "Error." with no suggestion withholds a correction that is owed, failing 3.3.3.',
  CITE.g177, { h1: 'Shipping', btn: 'Save' });

pos(14, 'nonsecurity-allowed-values', 'country select-by-text: no allowed values suggested',
  `    <label for="fld">Country (2-letter code)</label>
    <input id="fld" name="cty" type="text">`,
  `function(v){return ['US','CA','GB'].includes(v.trim().toUpperCase());}`,
  `'Not a recognised country code.'`, 'ZZ',
  'Situation B: the allowed values (US/CA/GB) are knowable and non-secret, so they should be suggested (G84); a bare "not recognised" with no list of allowed values fails 3.3.3.',
  CITE.g84, { h1: 'Shipping', btn: 'Save' });

pos(15, 'nonsecurity-bare-error', 'phone field: only "invalid", no format suggested',
  `    <label for="fld">Phone</label>
    <input id="fld" name="ph" type="text">`,
  `function(v){return /^\\+\\d{2} \\d{3} \\d{3} \\d{4}$/.test(v.trim());}`,
  `'Invalid phone number.'`, '12345',
  'The phone format is knowable and not a secret; "Invalid phone number" alone provides no correction, so the owed suggestion is wrongly withheld — no exception applies.',
  CITE.g177, { h1: 'Contact', btn: 'Save' });

// 10b: SECURITY fields where a SAFE, non-revealing suggestion was OWED (composition rules), but
//      the form gives nothing — wrongly invoking the exception to withhold a safe correction.
pos(16, 'security-safe-suggestion-owed', 'NEW password setup: composition rules can be safely stated but are withheld',
  `    <label for="fld">Create a password</label>
    <input id="fld" name="pw" type="password">`,
  `function(v){return /^(?=.{12,})(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).*$/.test(v);}`,
  `'Password does not meet requirements.'`, 'short',
  'For a NEW password the user is CHOOSING, stating the composition rules (12+ chars, uppercase, number, symbol) reveals no secret and is a knowable correction; withholding it as if the security exception applied is wrong — a safe suggestion was owed.',
  CITE.g85, { h1: 'Create account', btn: 'Create', fieldType: 'password' });

pos(17, 'security-safe-suggestion-owed', 'NEW PIN setup: length rule withheld though safe to state',
  `    <label for="fld">Choose a 6-digit PIN</label>
    <input id="fld" name="pin" type="password">`,
  `function(v){return /^\\d{6}$/.test(v);}`,
  `'That PIN cannot be used.'`, '12',
  'When the user is CHOOSING a new PIN, the format rule (exactly 6 digits) reveals no secret and is a knowable correction; a bare "cannot be used" wrongly withholds a safe suggestion — the exception does not apply to the format requirement.',
  CITE.g85, { h1: 'Set up PIN', btn: 'Save PIN', fieldType: 'password' });

pos(18, 'security-safe-suggestion-owed', 'NEW password: gives nothing though "add a symbol" is safe',
  `    <label for="fld">New password</label>
    <input id="fld" name="pw" type="password">`,
  `function(v){return /[^A-Za-z0-9]/.test(v) && v.length>=10;}`,
  `'Invalid password.'`, 'Password12',
  'The only failing rule (missing a symbol, on a 10+ char value) can be safely surfaced as "add at least one symbol" without revealing any secret; the form gives only "Invalid password", wrongly withholding a safe, knowable correction.',
  CITE.g85, { h1: 'Reset password', btn: 'Save', fieldType: 'password' });

pos(19, 'security-safe-suggestion-owed', 'NEW username (not secret) treated as if secret — no suggestion',
  `    <label for="fld">Choose a username</label>
    <input id="fld" name="u" type="text">`,
  `function(v){return /^[a-z0-9]{5,15}$/.test(v.trim());}`,
  `'Username not allowed.'`, 'AB',
  'A username is not a secret and its rule (5–15 lowercase letters/numbers) is a knowable, safe correction; treating it like a security field and giving a bare "not allowed" wrongly withholds an owed suggestion. Whether the author wrongly believed a security exception applied is a judgment a deterministic runner cannot make from markup, so it should ABSTAIN (the ground-truth human label is still failed).',
  CITE.g177, { h1: 'Sign up', btn: 'Reserve', runnerShould: 'abstain' });

pos(20, 'security-safe-suggestion-owed', 'NEW passphrase: min length safely stateable but withheld',
  `    <label for="fld">Create a passphrase</label>
    <input id="fld" name="pp" type="password">`,
  `function(v){return v.trim().split(/\\s+/).filter(Boolean).length>=4;}`,
  `'Passphrase rejected.'`, 'too short',
  'For a passphrase the user chooses, the rule "use at least four words" reveals no secret and is a knowable correction; the bare "rejected" wrongly invokes the security exception to withhold a safe suggestion.',
  CITE.g85, { h1: 'Set passphrase', btn: 'Save', fieldType: 'password' });

module.exports = true;
