'use strict';
// 3.3.2 aspect B: instruction-field-proximity
// POSITIVE (expected=failed): a NEEDED instruction exists but is stranded far from its field
//   and/or NOT programmatically associated, so it does not function as the field's instruction.
// NEGATIVE (expected=passed): the needed instruction is proximate AND/OR programmatically
//   associated (aria-describedby / adjacent within the field's labelling context).
const { writeCase, add, CITE } = require('./gen-332-333.js');
const SC = '3.3.2', A = 'instruction-field-proximity';

function pos(n, dim, comment, body, rationale, citation, fieldSelector, runnerShould = 'decide') {
  const file = writeCase(SC, A, n, `POSITIVE | ${A} | ${comment}`, body);
  add(SC, A, { file, expected: 'failed', polarity: 'positive', aspect: A, dimension: dim, fieldSelector, runnerShould, rationale, citation });
}
function neg(n, dim, comment, body, rationale, citation, fieldSelector, runnerShould = 'decide') {
  const file = writeCase(SC, A, n, `NEGATIVE | ${A} | ${comment}`, body);
  add(SC, A, { file, expected: 'passed', polarity: 'negative', aspect: A, dimension: dim, fieldSelector, runnerShould, rationale, citation });
}
const farBlock = (id, text) => `    <div class="far"><p class="hint" id="${id}">${text}</p></div>`;

// ---------------- POSITIVES (10) ----------------
pos(1, 'stranded-far-no-association',
  'format hint sits 600px below the field, not associated',
  `  <h1>Wire transfer</h1>
  <form id="f">
    <label for="iban">IBAN</label>
    <!-- CONSTRAINT: IBAN format. Instruction exists but is 600px below and NOT associated. -->
    <input id="iban" name="iban" type="text" pattern="[A-Z]{2}\\d{2}[A-Z0-9]{1,30}" required>
    <button type="submit">Send</button>
${farBlock('iban-hint', 'IBAN must start with a 2-letter country code, then 2 check digits, then up to 30 characters.')}
  </form>`,
  'The IBAN format instruction needed to enter valid data exists but is stranded ~600px below the field and is not programmatically associated; it does not sit where a sighted user reading the field would see it, nor is it in the field\'s accessible description.',
  CITE.g162, '#iban');

pos(2, 'wrong-target-association',
  'instruction associated to the submit button, not the field',
  `  <h1>Coupon</h1>
  <form id="f">
    <label for="code">Coupon code</label>
    <!-- CONSTRAINT: 3 letters + 4 digits. The hint is bound to the BUTTON, not the input. -->
    <input id="code" name="code" type="text" pattern="[A-Z]{3}\\d{4}" required>
    <button type="submit" aria-describedby="code-hint">Apply</button>
    <p class="hint" id="code-hint">Codes are 3 letters followed by 4 digits, e.g. ABC1234.</p>
  </form>`,
  'The correct format instruction is programmatically associated with the submit button via aria-describedby, not with the input it describes; the input field carries no instruction of its own.',
  CITE.intent332id, '#code');

pos(3, 'in-collapsed-region',
  'instruction hidden inside a collapsed details the user must hunt for',
  `  <h1>Username</h1>
  <form id="f">
    <label for="u">Username</label>
    <!-- CONSTRAINT: 5-15 lowercase alnum. Rule buried in a closed disclosure far from field, not associated. -->
    <input id="u" name="u" type="text" pattern="[a-z0-9]{5,15}" required>
    <button type="submit">Reserve</button>
${farBlock('u-rules', '<details><summary>Rules</summary> Usernames are 5–15 characters, lowercase letters and numbers only.</details>')}
  </form>`,
  'The required username format is buried in a collapsed disclosure far below the field and not associated with it; the instruction is neither proximate nor programmatically available when the field is reached.',
  CITE.g162, '#u');

pos(4, 'between-different-field',
  'hint physically sits next to a DIFFERENT input',
  `  <h1>Profile</h1>
  <form id="f">
    <label for="nick">Nickname</label>
    <input id="nick" name="nick" type="text">
    <p class="hint">Use letters only, 2-12 characters.</p>
    <label for="handle">Handle</label>
    <!-- CONSTRAINT belongs to #handle (must start @), but the only instruction sits up by Nickname. -->
    <input id="handle" name="handle" type="text" pattern="@[a-z0-9_]{2,15}" required>
    <button type="submit">Save</button>
  </form>`,
  'The handle field requires a leading @ but the only format instruction is positioned next to the unrelated Nickname field; nothing proximate or associated tells the user the handle\'s expected format.',
  CITE.g162, '#handle');

pos(5, 'stranded-far-no-association',
  'OTP length rule far above in page header, not by field',
  `  <h1 id="hdr">Enter the 6-digit code we texted you</h1>
  <div class="far">
    <form id="f">
      <label for="otp">Code</label>
      <!-- CONSTRAINT: exactly 6 digits. The "6-digit" instruction is only in the far page header. -->
      <input id="otp" name="otp" type="text" pattern="\\d{6}" required>
      <button type="submit">Verify</button>
    </form>
  </div>`,
  'The "6-digit" requirement appears only in a page header ~600px above the field and is not associated with the input; the instruction needed to enter valid data is not proximate to or bound to the field.',
  CITE.g162, '#otp');

pos(6, 'association-points-to-empty',
  'aria-describedby points to an element with no text',
  `  <h1>Postal code</h1>
  <form id="f">
    <label for="pc">Postcode</label>
    <!-- CONSTRAINT: UK format. describedby points to an EMPTY element; the real hint is stranded far away. -->
    <input id="pc" name="pc" type="text" pattern="[A-Z]{1,2}\\d[A-Z0-9]? \\d[A-Z]{2}"
           aria-describedby="pc-empty" required>
    <span id="pc-empty"></span>
    <button type="submit">Save</button>
${farBlock('pc-real', 'UK postcodes look like SW1A 1AA — outward code, a space, then the inward code.')}
  </form>`,
  'The field\'s aria-describedby resolves to an empty element, so its accessible description is blank; the real format instruction sits far below, unassociated. The user gets no proximate or programmatic instruction.',
  CITE.intent332id, '#pc');

pos(7, 'instruction-after-submit-only',
  'format only revealed AFTER an error, never before the field',
  `  <h1>Card</h1>
  <form id="f">
    <label for="cc">Card number</label>
    <!-- CONSTRAINT: 16 digits. No advance instruction; the rule is only shown after a failed submit. -->
    <input id="cc" name="cc" type="text" pattern="\\d{16}" required>
    <button type="submit">Pay</button>
    <p class="hint far" id="cc-hint">Card numbers are 16 digits with no spaces.</p>
  </form>`,
  '3.3.2 requires the instruction to be available when content requires input — proactively. Here the 16-digit rule is stranded far below and not associated, so it is not present at the field before the user enters data.',
  CITE.g184, '#cc');

pos(8, 'label-far-placeholder-empty',
  'visible label text exists but is positioned far and not for-associated',
  `  <h1>Search filters</h1>
  <form id="f">
    <p class="hint">Date range (YYYY-MM-DD to YYYY-MM-DD)</p>
    <div class="far">
      <!-- The only instruction (the YYYY-MM-DD format) is far above; no label/for and no describedby. -->
      <input id="from" name="from" type="text" pattern="\\d{4}-\\d{2}-\\d{2}" required>
      <button type="submit">Filter</button>
    </div>
  </form>`,
  'The required YYYY-MM-DD format instruction is positioned ~600px above the input with no programmatic association (no for, no aria-describedby); a user at the field has no proximate or bound instruction.',
  CITE.g162, '#from');

pos(9, 'wrong-target-association',
  'describedby points to a sibling field\'s hint id',
  `  <h1>Shipping</h1>
  <form id="f">
    <label for="zip">ZIP</label>
    <input id="zip" name="zip" type="text" pattern="\\d{5}" aria-describedby="state-hint" required>
    <label for="state">State</label>
    <input id="state" name="state" type="text" pattern="[A-Z]{2}">
    <p class="hint" id="state-hint">Two-letter state abbreviation, e.g. CA.</p>
    <button type="submit">Save</button>
  </form>`,
  'The ZIP field\'s aria-describedby points to the STATE field\'s hint, so the description the user hears for ZIP is the wrong instruction; the ZIP\'s own 5-digit constraint has no proximate or correct association.',
  CITE.intent332id, '#zip');

pos(10, 'stranded-far-no-association',
  'amount precision rule in a footnote at page bottom',
  `  <h1>Donate</h1>
  <form id="f">
    <label for="amt">Amount (USD)</label>
    <!-- CONSTRAINT: 2-decimal places, min 5.00. Rule is in a far footnote, unassociated. -->
    <input id="amt" name="amt" type="text" pattern="\\d+\\.\\d{2}" required>
    <button type="submit">Give</button>
${farBlock('amt-note', 'Footnote: enter amounts to two decimal places, minimum 5.00.')}
  </form>`,
  'The two-decimal-place requirement is only in a footnote ~600px below the field and not associated; the instruction needed to enter valid data is neither proximate nor programmatically bound to the amount field.',
  CITE.g162, '#amt');

// ---------------- NEGATIVES (10) ----------------
neg(11, 'describedby-proximate',
  'IBAN hint directly under field and associated',
  `  <h1>Wire transfer</h1>
  <form id="f">
    <label for="iban">IBAN</label>
    <p class="hint" id="iban-hint">2-letter country code, 2 check digits, then up to 30 characters.</p>
    <input id="iban" name="iban" type="text" pattern="[A-Z]{2}\\d{2}[A-Z0-9]{1,30}"
           aria-describedby="iban-hint" required>
    <button type="submit">Send</button>
  </form>`,
  'The IBAN format instruction sits immediately above the field AND is its accessible description via aria-describedby; it is both visually proximate and programmatically associated.',
  CITE.g162, '#iban');

neg(12, 'adjacent-no-association-but-proximate',
  'coupon hint immediately adjacent (sighted proximity satisfied)',
  `  <h1>Coupon</h1>
  <form id="f">
    <label for="code">Coupon code</label>
    <p class="hint" id="code-hint">3 letters followed by 4 digits, e.g. ABC1234.</p>
    <input id="code" name="code" type="text" pattern="[A-Z]{3}\\d{4}" aria-describedby="code-hint" required>
    <button type="submit">Apply</button>
  </form>`,
  'The correct format instruction is positioned immediately adjacent to the input and bound by aria-describedby; the instruction is in the field\'s labelling context, satisfying proximity and programmatic association.',
  CITE.g162, '#code');

neg(13, 'instruction-in-legend-proximate',
  'username rules in a proximate, associated hint',
  `  <h1>Username</h1>
  <form id="f">
    <label for="u">Username</label>
    <p class="hint" id="u-hint">5–15 characters, lowercase letters and numbers only.</p>
    <input id="u" name="u" type="text" pattern="[a-z0-9]{5,15}" aria-describedby="u-hint" required>
    <button type="submit">Reserve</button>
  </form>`,
  'The username format rule is shown immediately with the field and associated via aria-describedby; it is proximate and programmatically available, not buried.',
  CITE.g162, '#u');

neg(14, 'correct-field-proximity',
  'handle hint sits with the handle field',
  `  <h1>Profile</h1>
  <form id="f">
    <label for="nick">Nickname</label>
    <p class="hint" id="nick-hint">Letters only, 2-12 characters.</p>
    <input id="nick" name="nick" type="text" pattern="[A-Za-z]{2,12}" aria-describedby="nick-hint">
    <label for="handle">Handle</label>
    <p class="hint" id="handle-hint">Start with @, then 2-15 lowercase letters, numbers, or underscores.</p>
    <input id="handle" name="handle" type="text" pattern="@[a-z0-9_]{2,15}" aria-describedby="handle-hint" required>
    <button type="submit">Save</button>
  </form>`,
  'Each field has its own proximate, associated instruction; the handle\'s leading-@ rule sits with the handle field and is bound by aria-describedby.',
  CITE.g162, '#handle');

neg(15, 'header-plus-proximate-association',
  'OTP length stated in header AND in associated hint at the field',
  `  <h1>Enter the 6-digit code we texted you</h1>
  <form id="f">
    <label for="otp">Code</label>
    <p class="hint" id="otp-hint">Enter the 6 digits exactly as received.</p>
    <input id="otp" name="otp" type="text" pattern="\\d{6}" aria-describedby="otp-hint" required>
    <button type="submit">Verify</button>
  </form>`,
  'Beyond the header, the field itself carries a proximate, associated instruction confirming the 6-digit input; the user at the field has a bound instruction.',
  CITE.g162, '#otp');

neg(16, 'describedby-nonempty',
  'postcode describedby resolves to the real hint text',
  `  <h1>Postal code</h1>
  <form id="f">
    <label for="pc">Postcode</label>
    <p class="hint" id="pc-hint">UK format like SW1A 1AA — outward code, a space, then inward code.</p>
    <input id="pc" name="pc" type="text" pattern="[A-Z]{1,2}\\d[A-Z0-9]? \\d[A-Z]{2}"
           aria-describedby="pc-hint" required>
    <button type="submit">Save</button>
  </form>`,
  'aria-describedby resolves to a non-empty, proximate instruction giving the postcode format with an example; the description is both present and correct.',
  CITE.intent332id, '#pc');

neg(17, 'form-level-instruction-at-top',
  'G184 instruction at top of a short form covers the field',
  `  <h1>Card</h1>
  <form id="f">
    <p class="hint" id="form-hint">All card numbers are 16 digits with no spaces.</p>
    <label for="cc">Card number</label>
    <input id="cc" name="cc" type="text" pattern="\\d{16}" aria-describedby="form-hint" required>
    <button type="submit">Pay</button>
  </form>`,
  'A G184 instruction placed at the very beginning of the short form, immediately preceding and associated with the field, tells the user the 16-digit format ahead of time; it is proximate and bound.',
  CITE.g184, '#cc');

neg(18, 'label-and-hint-proximate',
  'date-range field has proximate label and associated format hint',
  `  <h1>Search filters</h1>
  <form id="f">
    <label for="from">From date</label>
    <p class="hint" id="from-hint">Use YYYY-MM-DD.</p>
    <input id="from" name="from" type="text" pattern="\\d{4}-\\d{2}-\\d{2}" aria-describedby="from-hint" required>
    <button type="submit">Filter</button>
  </form>`,
  'The YYYY-MM-DD format instruction is immediately adjacent to the input and associated via aria-describedby; there is a proper visible label and a proximate bound instruction.',
  CITE.g162, '#from');

neg(19, 'correct-field-association',
  'ZIP describedby points to ZIP\'s own hint',
  `  <h1>Shipping</h1>
  <form id="f">
    <label for="zip">ZIP</label>
    <p class="hint" id="zip-hint">5-digit ZIP code, e.g. 90210.</p>
    <input id="zip" name="zip" type="text" pattern="\\d{5}" aria-describedby="zip-hint" required>
    <label for="state">State</label>
    <p class="hint" id="state-hint">Two-letter state abbreviation, e.g. CA.</p>
    <input id="state" name="state" type="text" pattern="[A-Z]{2}" aria-describedby="state-hint">
    <button type="submit">Save</button>
  </form>`,
  'The ZIP field is associated with its OWN 5-digit instruction (and the state field with its own); each field hears the correct, proximate instruction for its constraint.',
  CITE.intent332id, '#zip');

neg(20, 'proximate-precision-hint',
  'amount precision hint sits under the field and is associated',
  `  <h1>Donate</h1>
  <form id="f">
    <label for="amt">Amount (USD)</label>
    <p class="hint" id="amt-hint">Two decimal places, minimum 5.00 (e.g. 10.00).</p>
    <input id="amt" name="amt" type="text" pattern="\\d+\\.\\d{2}" aria-describedby="amt-hint" required>
    <button type="submit">Give</button>
  </form>`,
  'The two-decimal-place precision instruction is shown directly with the field and associated via aria-describedby; it is proximate and programmatically available.',
  CITE.g162, '#amt');

module.exports = true;
