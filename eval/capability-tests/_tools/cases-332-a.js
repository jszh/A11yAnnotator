'use strict';
// 3.3.2 aspect A: instruction-vs-constraint-consistency
// POSITIVE (expected=failed): instruction CONTRADICTS the real constraint, OR a non-obvious
//   required format has NO instruction at all.
// NEGATIVE (expected=passed): instruction is present, correct, and consistent with the constraint,
//   OR the constraint is customary/obvious enough that no format instruction is owed.
const { writeCase, add, CITE } = require('./gen-332-333.js');
const SC = '3.3.2', A = 'instruction-vs-constraint-consistency';

function pos(n, dim, comment, body, rationale, citation, fieldSelector, runnerShould = 'decide') {
  const file = writeCase(SC, A, n, `POSITIVE | ${A} | ${comment}`, body);
  add(SC, A, { file, expected: 'failed', polarity: 'positive', aspect: A, dimension: dim, fieldSelector, runnerShould, rationale, citation });
}
function neg(n, dim, comment, body, rationale, citation, fieldSelector, runnerShould = 'decide') {
  const file = writeCase(SC, A, n, `NEGATIVE | ${A} | ${comment}`, body);
  add(SC, A, { file, expected: 'passed', polarity: 'negative', aspect: A, dimension: dim, fieldSelector, runnerShould, rationale, citation });
}

// ---------------- POSITIVES (10) ----------------
pos(1, 'format-instruction-contradicts-constraint',
  'hint says MM/DD/YYYY but pattern requires DD/MM/YYYY',
  `  <h1>Booking date</h1>
  <form id="f">
    <label for="d">Travel date</label>
    <p class="hint" id="d-hint">Format: MM/DD/YYYY</p>
    <!-- CONSTRAINT: pattern accepts DD/MM/YYYY (day first). The instruction says MM/DD/YYYY. -->
    <input id="d" name="d" type="text" aria-describedby="d-hint"
           pattern="(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])/\\d{4}" required>
    <button type="submit">Book</button>
  </form>`,
  'The visible instruction tells the user MM/DD/YYYY, but the field\'s pattern only accepts DD/MM/YYYY; a user who follows the instruction enters data the field rejects, so the instruction does not identify the input actually expected.',
  CITE.intent332fmt, '#d');

pos(2, 'format-instruction-contradicts-constraint',
  'hint says "max 8 chars" but maxlength is 6',
  `  <h1>Promo code</h1>
  <form id="f">
    <label for="p">Promo code</label>
    <p class="hint" id="p-hint">Enter up to 8 characters.</p>
    <!-- CONSTRAINT: maxlength=6. Instruction overstates the allowed length. -->
    <input id="p" name="p" type="text" maxlength="6" aria-describedby="p-hint" required>
    <button type="submit">Apply</button>
  </form>`,
  'The instruction promises up to 8 characters but the control caps input at 6 (maxlength); the stated rule contradicts the enforced constraint, misleading the user about valid input.',
  CITE.intent332fmt, '#p');

pos(3, 'wrong-example',
  'example value violates the field\'s own pattern',
  `  <h1>Account number</h1>
  <form id="f">
    <label for="acct">Account number</label>
    <p class="hint" id="acct-hint">For example: 12-3456 (7 digits)</p>
    <!-- CONSTRAINT: pattern is exactly 8 digits, no dash. The example shows a 6-digit dashed value. -->
    <input id="acct" name="acct" type="text" pattern="\\d{8}" aria-describedby="acct-hint" required>
    <button type="submit">Save</button>
  </form>`,
  'G89 expects a CORRECT example; here the example "12-3456" both contains a dash and has the wrong digit count, so it does not match the field\'s own 8-digit pattern and would itself be rejected.',
  CITE.g89, '#acct');

pos(4, 'missing-instruction-nonobvious-format',
  'product key needs grouped hex but no instruction at all',
  `  <h1>Activate software</h1>
  <form id="f">
    <label for="key">Product key</label>
    <!-- CONSTRAINT: must be AAAA-AAAA-AAAA (uppercase hex groups). NON-OBVIOUS. No instruction or example given. -->
    <input id="key" name="key" type="text" pattern="[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}" required>
    <button type="submit">Activate</button>
  </form>`,
  'The field enforces a non-customary grouped-hex format (AAAA-AAAA-AAAA) but provides no label-borne instruction or example; the user cannot know the expected input before being rejected.',
  CITE.g89, '#key');

pos(5, 'missing-instruction-nonobvious-format',
  'password complexity rules enforced but never stated',
  `  <h1>Create password</h1>
  <form id="f">
    <label for="pw">New password</label>
    <!-- CONSTRAINT: >=10 chars, 1 upper, 1 digit, 1 symbol. NONE of this is stated to the user. -->
    <input id="pw" name="pw" type="password" pattern="(?=.{10,})(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).*" required>
    <button type="submit">Set password</button>
  </form>`,
  'The password field enforces composition rules (length, case, digit, symbol) with no instruction describing them; a non-obvious rule set with no advance instruction fails to tell the user what input is expected.',
  CITE.intent332fmt, '#pw');

pos(6, 'placeholder-only-format-vanishes',
  'format shown only in placeholder that disappears on input',
  `  <h1>Phone</h1>
  <form id="f">
    <label for="ph">Phone number</label>
    <!-- CONSTRAINT: +NN NNN NNN NNN. The ONLY format hint is the placeholder, which vanishes once typing starts. -->
    <input id="ph" name="ph" type="text" placeholder="+44 020 000 0000"
           pattern="\\+\\d{2} \\d{3} \\d{3} \\d{4}" required>
    <button type="submit">Save</button>
  </form>`,
  'The required non-customary phone format is conveyed only by a placeholder, which disappears as soon as the user types; a placeholder that vanishes is not a persistent instruction for the expected input.',
  CITE.intent332fmt, '#ph');

pos(7, 'instruction-for-wrong-field',
  'format instruction describes a different field',
  `  <h1>Identity</h1>
  <form id="f">
    <label for="ssn">Tax ID</label>
    <!-- CONSTRAINT for #ssn: 9 digits. But its describedby points to a hint about the DATE field. -->
    <input id="ssn" name="ssn" type="text" pattern="\\d{9}" aria-describedby="dob-hint" required>
    <label for="dob">Date of birth</label>
    <p class="hint" id="dob-hint">Use YYYY-MM-DD.</p>
    <input id="dob" name="dob" type="text" pattern="\\d{4}-\\d{2}-\\d{2}">
    <button type="submit">Continue</button>
  </form>`,
  'The Tax ID field is programmatically associated (aria-describedby) with an instruction that actually describes the date field\'s format; the instruction the user hears for this field is for a different constraint.',
  CITE.intent332id, '#ssn');

pos(8, 'unit-mismatch',
  'instruction says kilograms but field validates grams range',
  `  <h1>Parcel</h1>
  <form id="f">
    <label for="w">Weight</label>
    <p class="hint" id="w-hint">Enter weight in kilograms (e.g. 2.5).</p>
    <!-- CONSTRAINT: number 100..30000 — i.e. GRAMS, not kg. Instruction names the wrong unit. -->
    <input id="w" name="w" type="number" min="100" max="30000" step="1" aria-describedby="w-hint" required>
    <button type="submit">Submit</button>
  </form>`,
  'The instruction says kilograms and shows "2.5", but the numeric constraint (100–30000, integer step) is a grams range; following the kg instruction yields a value the field rejects as out of range.',
  CITE.intent332fmt, '#w');

pos(9, 'contradictory-required-state',
  'instruction says optional but field is required',
  `  <h1>Survey</h1>
  <form id="f">
    <label for="ref">Referral code</label>
    <p class="hint" id="ref-hint">Optional — leave blank if you don\'t have one.</p>
    <!-- CONSTRAINT: required. Instruction says it is optional. -->
    <input id="ref" name="ref" type="text" aria-describedby="ref-hint" required>
    <button type="submit">Send</button>
  </form>`,
  'The instruction tells the user the field is optional and may be left blank, but the control is required; the stated input expectation directly contradicts the enforced constraint.',
  CITE.intent332id, '#ref');

pos(10, 'range-instruction-contradicts',
  'instruction says 1-100 but min/max enforce 18-65',
  `  <h1>Eligibility</h1>
  <form id="f">
    <label for="age">Age</label>
    <p class="hint" id="age-hint">Any age from 1 to 100.</p>
    <!-- CONSTRAINT: min=18 max=65. Instruction states a wider, wrong range. -->
    <input id="age" name="age" type="number" min="18" max="65" aria-describedby="age-hint" required>
    <button type="submit">Check</button>
  </form>`,
  'The instruction advertises an allowed range of 1–100, but the field only accepts 18–65; the instruction misstates the constraint and a compliant-looking entry (e.g. 10) is rejected.',
  CITE.intent332fmt, '#age');

// ---------------- NEGATIVES (10) ----------------
neg(11, 'correct-format-instruction',
  'hint DD/MM/YYYY matches pattern DD/MM/YYYY',
  `  <h1>Booking date</h1>
  <form id="f">
    <label for="d">Travel date</label>
    <p class="hint" id="d-hint">Format: DD/MM/YYYY (e.g. 25/12/2026)</p>
    <!-- CONSTRAINT and instruction AGREE on DD/MM/YYYY. -->
    <input id="d" name="d" type="text" aria-describedby="d-hint"
           pattern="(0[1-9]|[12][0-9]|3[01])/(0[1-9]|1[0-2])/\\d{4}" required>
    <button type="submit">Book</button>
  </form>`,
  'The visible, programmatically-associated instruction states DD/MM/YYYY with a valid example, exactly matching the field\'s pattern; the format instruction is present, correct, and consistent.',
  CITE.g89, '#d');

neg(12, 'correct-example',
  'example value satisfies the pattern',
  `  <h1>Account number</h1>
  <form id="f">
    <label for="acct">Account number</label>
    <p class="hint" id="acct-hint">8 digits, no spaces. Example: 12345678</p>
    <input id="acct" name="acct" type="text" pattern="\\d{8}" aria-describedby="acct-hint" required>
    <button type="submit">Save</button>
  </form>`,
  'The instruction describes the format ("8 digits, no spaces") and gives an example (12345678) that itself satisfies the pattern; this is exactly G89 done correctly.',
  CITE.g89, '#acct');

neg(13, 'customary-format-no-instruction-owed',
  'plain email field, customary format, no extra instruction needed',
  `  <h1>Newsletter</h1>
  <form id="f">
    <label for="em">Email address</label>
    <!-- CONSTRAINT: type=email (customary). No special format instruction is owed. -->
    <input id="em" name="em" type="email" required>
    <button type="submit">Subscribe</button>
  </form>`,
  'A type=email field with a descriptive label "Email address" uses a customary, well-understood format; per Intent, format instructions are needed when formats are "out of the customary formats", which this is not.',
  CITE.intent332fmt, '#em');

neg(14, 'instruction-present-nonobvious-format',
  'product key format fully described with example',
  `  <h1>Activate software</h1>
  <form id="f">
    <label for="key">Product key</label>
    <p class="hint" id="key-hint">Three groups of four (0-9, A-F), separated by hyphens. Example: 1A2B-3C4D-5E6F</p>
    <input id="key" name="key" type="text" pattern="[0-9A-F]{4}-[0-9A-F]{4}-[0-9A-F]{4}"
           aria-describedby="key-hint" required>
    <button type="submit">Activate</button>
  </form>`,
  'The non-customary grouped-hex format is fully described and exemplified in a programmatically associated instruction whose example matches the pattern; the user knows the expected input in advance.',
  CITE.g89, '#key');

neg(15, 'password-rules-stated',
  'password complexity rules clearly stated before the field',
  `  <h1>Create password</h1>
  <form id="f">
    <label for="pw">New password</label>
    <p class="hint" id="pw-hint">At least 10 characters, including one uppercase letter, one number, and one symbol.</p>
    <input id="pw" name="pw" type="password" aria-describedby="pw-hint"
           pattern="(?=.{10,})(?=.*[A-Z])(?=.*\\d)(?=.*[^A-Za-z0-9]).*" required>
    <button type="submit">Set password</button>
  </form>`,
  'The composition rules enforced by the pattern are stated in full in an associated instruction shown with the field; the user is told the expected input before entering it.',
  CITE.intent332fmt, '#pw');

neg(16, 'persistent-instruction-not-placeholder',
  'phone format in a persistent hint plus a placeholder example',
  `  <h1>Phone</h1>
  <form id="f">
    <label for="ph">Phone number</label>
    <p class="hint" id="ph-hint">Include country code and spaces: +44 020 000 0000</p>
    <input id="ph" name="ph" type="text" placeholder="+44 020 000 0000"
           pattern="\\+\\d{2} \\d{3} \\d{3} \\d{4}" aria-describedby="ph-hint" required>
    <button type="submit">Save</button>
  </form>`,
  'The required format is carried by a PERSISTENT associated instruction (not only the placeholder), so it remains available after the user starts typing; the placeholder merely reinforces it.',
  CITE.intent332fmt, '#ph');

neg(17, 'correct-association',
  'each field describedby its own correct format hint',
  `  <h1>Identity</h1>
  <form id="f">
    <label for="ssn">Tax ID</label>
    <p class="hint" id="ssn-hint">9 digits, no dashes. Example: 123456789</p>
    <input id="ssn" name="ssn" type="text" pattern="\\d{9}" aria-describedby="ssn-hint" required>
    <label for="dob">Date of birth</label>
    <p class="hint" id="dob-hint">Use YYYY-MM-DD.</p>
    <input id="dob" name="dob" type="text" pattern="\\d{4}-\\d{2}-\\d{2}" aria-describedby="dob-hint">
    <button type="submit">Continue</button>
  </form>`,
  'The Tax ID field is associated with its OWN correct 9-digit instruction (and the date field with its own); each instruction describes the constraint of the field it is bound to.',
  CITE.intent332id, '#ssn');

neg(18, 'correct-unit',
  'instruction names grams and field validates grams range',
  `  <h1>Parcel</h1>
  <form id="f">
    <label for="w">Weight</label>
    <p class="hint" id="w-hint">Enter weight in grams (100–30000).</p>
    <input id="w" name="w" type="number" min="100" max="30000" step="1" aria-describedby="w-hint" required>
    <button type="submit">Submit</button>
  </form>`,
  'The instruction names the correct unit (grams) and the actual range (100–30000), matching the numeric constraint exactly; the stated expectation agrees with what the field enforces.',
  CITE.intent332fmt, '#w');

neg(19, 'required-state-consistent',
  'instruction says required and field is required',
  `  <h1>Survey</h1>
  <form id="f">
    <label for="ref">Referral code <span aria-hidden="true">*</span></label>
    <p class="hint" id="ref-hint">Required.</p>
    <input id="ref" name="ref" type="text" aria-describedby="ref-hint" aria-required="true" required>
    <button type="submit">Send</button>
  </form>`,
  'The instruction states the field is required and the control is in fact required (and aria-required), so the stated input expectation matches the constraint; ARIA2 backs the programmatic required indication.',
  CITE.aria2, '#ref');

neg(20, 'range-instruction-correct',
  'instruction 18-65 matches min/max 18-65',
  `  <h1>Eligibility</h1>
  <form id="f">
    <label for="age">Age</label>
    <p class="hint" id="age-hint">Must be between 18 and 65.</p>
    <input id="age" name="age" type="number" min="18" max="65" aria-describedby="age-hint" required>
    <button type="submit">Check</button>
  </form>`,
  'The instruction states the allowed range 18–65, exactly matching the field\'s min/max; the instruction correctly describes the constraint.',
  CITE.intent332fmt, '#age');

module.exports = true;
