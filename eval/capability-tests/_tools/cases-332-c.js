'use strict';
// 3.3.2 aspect C: field-group-label-detection
// A group of fields (radio set, split date, segmented input) needs a GROUP label/instruction.
// POSITIVE (expected=failed): the group label/instruction is MISSING or INADEQUATE (e.g. each
//   sub-field labeled but no group identity; or a fieldset with no legend; or radios with no group name).
// NEGATIVE (expected=passed): the group has an adequate programmatic group label (fieldset/legend,
//   role=group + aria-labelledby, radiogroup with aria-label).
const { writeCase, add, CITE } = require('./gen-332-333.js');
const SC = '3.3.2', A = 'field-group-label-detection';

function pos(n, dim, comment, body, rationale, citation, fieldSelector, runnerShould = 'decide') {
  const file = writeCase(SC, A, n, `POSITIVE | ${A} | ${comment}`, body);
  add(SC, A, { file, expected: 'failed', polarity: 'positive', aspect: A, dimension: dim, fieldSelector, runnerShould, rationale, citation });
}
function neg(n, dim, comment, body, rationale, citation, fieldSelector, runnerShould = 'decide') {
  const file = writeCase(SC, A, n, `NEGATIVE | ${A} | ${comment}`, body);
  add(SC, A, { file, expected: 'passed', polarity: 'negative', aspect: A, dimension: dim, fieldSelector, runnerShould, rationale, citation });
}

// ---------------- POSITIVES (10) ----------------
pos(1, 'radio-set-no-group-label',
  'radio set: options labeled but no group question',
  `  <h1>Order</h1>
  <form id="f">
    <!-- The radios have individual labels but NO group label stating WHAT is being chosen. -->
    <div>
      <input type="radio" id="s" name="size" value="s"><label for="s">Small</label>
      <input type="radio" id="m" name="size" value="m"><label for="m">Medium</label>
      <input type="radio" id="l" name="size" value="l"><label for="l">Large</label>
    </div>
    <button type="submit">Next</button>
  </form>`,
  'Each radio has an individual label (Small/Medium/Large) but the set has no group label identifying what the choice is for (size); a user landing on a radio hears "Small" with no question, so the group is not identified.',
  CITE.h71, 'input[name="size"]');

pos(2, 'fieldset-no-legend',
  'split date in a fieldset with no legend',
  `  <h1>Date of birth</h1>
  <form id="f">
    <!-- Split date: three inputs, fieldset present but NO legend; sub-labels alone don't name the group. -->
    <fieldset>
      <label for="dd">Day</label><input id="dd" name="dd" type="text" inputmode="numeric" maxlength="2" required>
      <label for="mm">Month</label><input id="mm" name="mm" type="text" inputmode="numeric" maxlength="2" required>
      <label for="yy">Year</label><input id="yy" name="yy" type="text" inputmode="numeric" maxlength="4" required>
    </fieldset>
    <button type="submit">Save</button>
  </form>`,
  'The split-date group is wrapped in a fieldset but has no legend, so the three Day/Month/Year inputs are not collectively identified as "Date of birth"; the H71 group label is missing.',
  CITE.h71, '#dd');

pos(3, 'segmented-input-no-group-name',
  'segmented OTP boxes with no group instruction',
  `  <h1>Verify</h1>
  <form id="f">
    <!-- Six single-char boxes that together form one code; no group label/instruction. -->
    <div>
      <input id="c1" type="text" maxlength="1" aria-label="1">
      <input id="c2" type="text" maxlength="1" aria-label="2">
      <input id="c3" type="text" maxlength="1" aria-label="3">
      <input id="c4" type="text" maxlength="1" aria-label="4">
      <input id="c5" type="text" maxlength="1" aria-label="5">
      <input id="c6" type="text" maxlength="1" aria-label="6">
    </div>
    <button type="submit">Verify</button>
  </form>`,
  'The six single-character boxes are positional ("1".."6") with no group label or instruction explaining they jointly form the verification code; the group identity needed to enter valid data is missing.',
  CITE.intent332id, '#c1');

pos(4, 'radiogroup-role-no-name',
  'role=radiogroup with no accessible name',
  `  <h1>Shipping speed</h1>
  <form id="f">
    <!-- role=radiogroup but NO aria-label / aria-labelledby; the group has no name. -->
    <div role="radiogroup">
      <label><input type="radio" name="speed" value="std"> Standard</label>
      <label><input type="radio" name="speed" value="exp"> Express</label>
    </div>
    <button type="submit">Continue</button>
  </form>`,
  'The container carries role=radiogroup but has neither aria-label nor aria-labelledby, so the radiogroup has no accessible name; the group identity is not conveyed programmatically.',
  CITE.h71, 'input[name="speed"]');

pos(5, 'group-label-not-associated',
  'visible heading near a radio set but not a legend/labelledby',
  `  <h1>Survey</h1>
  <form id="f">
    <!-- A visible "Preferred contact" heading sits above, but it is NOT a legend and NOT referenced. -->
    <p style="font-weight:600">Preferred contact</p>
    <div>
      <label><input type="radio" name="contact" value="email"> Email</label>
      <label><input type="radio" name="contact" value="sms"> SMS</label>
    </div>
    <button type="submit">Submit</button>
  </form>`,
  'A sighted user sees "Preferred contact" above the radios, but it is a plain paragraph — not a legend and not referenced by aria-labelledby — so the group name is not programmatically associated with the radio set.',
  CITE.h71, 'input[name="contact"]');

pos(6, 'inadequate-group-label',
  'fieldset legend is generic ("Information")',
  `  <h1>Address</h1>
  <form id="f">
    <!-- Legend exists but is generic and does not identify the split-field group purpose. -->
    <fieldset>
      <legend>Information</legend>
      <label for="a1">Line 1</label><input id="a1" name="a1" type="text" required>
      <label for="a2">Line 2</label><input id="a2" name="a2" type="text">
    </fieldset>
    <button type="submit">Save</button>
  </form>`,
  'The legend "Information" is generic and does not make the group\'s purpose clear; per G131 a descriptive group label is required, and "Information" fails to identify these as address lines.',
  CITE.g131, '#a1');

pos(7, 'split-phone-no-group',
  'country-code + number split with no group label',
  `  <h1>Contact</h1>
  <form id="f">
    <!-- Two parts of one phone number; each labeled, but no group label names them as "Phone". -->
    <label for="cc">Code</label><input id="cc" name="cc" type="text" maxlength="3" required>
    <label for="num">Number</label><input id="num" name="num" type="text" maxlength="10" required>
    <button type="submit">Save</button>
  </form>`,
  'The country-code and number inputs are two halves of one phone number, each labeled only "Code"/"Number"; there is no group label tying them together as a phone entry, so the combined input requirement is not identified.',
  CITE.intent332id, '#cc');

pos(8, 'checkbox-set-no-group-question',
  'checkbox set of permissions with no group label',
  `  <h1>Permissions</h1>
  <form id="f">
    <!-- Multiple checkboxes that answer one question, but no group label states the question. -->
    <div>
      <label><input type="checkbox" name="perm" value="read"> Read</label>
      <label><input type="checkbox" name="perm" value="write"> Write</label>
      <label><input type="checkbox" name="perm" value="admin"> Admin</label>
    </div>
    <button type="submit">Grant</button>
  </form>`,
  'The checkboxes (Read/Write/Admin) collectively answer "which permissions to grant", but no fieldset/legend or labelled group states that; the set\'s collective purpose is not identified.',
  CITE.h71, 'input[name="perm"]');

pos(9, 'legend-removed-from-fieldset',
  'split date legend present but visually & semantically detached (aria-hidden)',
  `  <h1>Expiry</h1>
  <form id="f">
    <fieldset>
      <!-- The would-be group label is aria-hidden, so it is removed from the accessibility tree. -->
      <legend aria-hidden="true">Card expiry</legend>
      <label for="em">MM</label><input id="em" name="em" type="text" maxlength="2" required>
      <label for="ey">YY</label><input id="ey" name="ey" type="text" maxlength="2" required>
    </fieldset>
    <button type="submit">Save</button>
  </form>`,
  'The legend "Card expiry" is aria-hidden, so although it is visible it is removed from the accessibility tree; the fieldset therefore has no programmatic group name for assistive technology.',
  CITE.h71, '#em');

pos(10, 'radio-group-split-across-fieldsets',
  'one logical choice split so no single group label covers it',
  `  <h1>Plan</h1>
  <form id="f">
    <!-- One name=plan radio group, but options scattered with NO enclosing labeled group. -->
    <p>Choose carefully.</p>
    <div><label><input type="radio" name="plan" value="free"> Free</label></div>
    <hr>
    <div><label><input type="radio" name="plan" value="pro"> Pro</label></div>
    <button type="submit">Choose</button>
  </form>`,
  'The single logical choice (name=plan) is scattered across separated blocks with no fieldset/legend or labelled radiogroup, so there is no group label identifying that these options form one required selection.',
  CITE.h71, 'input[name="plan"]');

// ---------------- NEGATIVES (10) ----------------
neg(11, 'fieldset-legend-present',
  'radio set with proper fieldset + legend',
  `  <h1>Order</h1>
  <form id="f">
    <fieldset>
      <legend>Choose a size</legend>
      <input type="radio" id="s" name="size" value="s"><label for="s">Small</label>
      <input type="radio" id="m" name="size" value="m"><label for="m">Medium</label>
      <input type="radio" id="l" name="size" value="l"><label for="l">Large</label>
    </fieldset>
    <button type="submit">Next</button>
  </form>`,
  'The radio set is wrapped in a fieldset with a descriptive legend "Choose a size", which programmatically labels the group; each radio inherits the group identity per H71.',
  CITE.h71, 'input[name="size"]');

neg(12, 'split-date-legend',
  'split date fieldset with legend "Date of birth"',
  `  <h1>Registration</h1>
  <form id="f">
    <fieldset>
      <legend>Date of birth</legend>
      <label for="dd">Day</label><input id="dd" name="dd" type="text" inputmode="numeric" maxlength="2" required>
      <label for="mm">Month</label><input id="mm" name="mm" type="text" inputmode="numeric" maxlength="2" required>
      <label for="yy">Year</label><input id="yy" name="yy" type="text" inputmode="numeric" maxlength="4" required>
    </fieldset>
    <button type="submit">Save</button>
  </form>`,
  'The split-date inputs are grouped in a fieldset whose legend "Date of birth" names the group; the three sub-fields are collectively identified as required by H71.',
  CITE.h71, '#dd');

neg(13, 'group-aria-labelledby',
  'segmented OTP with role=group + instruction labelledby',
  `  <h1>Verify</h1>
  <form id="f">
    <p id="otp-grp">Enter the 6-digit verification code, one digit per box.</p>
    <div role="group" aria-labelledby="otp-grp">
      <input id="c1" type="text" maxlength="1" aria-label="Digit 1">
      <input id="c2" type="text" maxlength="1" aria-label="Digit 2">
      <input id="c3" type="text" maxlength="1" aria-label="Digit 3">
      <input id="c4" type="text" maxlength="1" aria-label="Digit 4">
      <input id="c5" type="text" maxlength="1" aria-label="Digit 5">
      <input id="c6" type="text" maxlength="1" aria-label="Digit 6">
    </div>
    <button type="submit">Verify</button>
  </form>`,
  'The six boxes are in a role=group named via aria-labelledby by an instruction explaining they form the 6-digit code; the group purpose is programmatically conveyed.',
  CITE.h71, '#c1');

neg(14, 'radiogroup-aria-label',
  'role=radiogroup with aria-label',
  `  <h1>Shipping speed</h1>
  <form id="f">
    <div role="radiogroup" aria-label="Shipping speed">
      <label><input type="radio" name="speed" value="std"> Standard</label>
      <label><input type="radio" name="speed" value="exp"> Express</label>
    </div>
    <button type="submit">Continue</button>
  </form>`,
  'The radiogroup has an accessible name via aria-label "Shipping speed", so the group is identified to assistive technology; ARIA2/H71-style grouping is satisfied.',
  CITE.h71, 'input[name="speed"]');

neg(15, 'heading-referenced-by-labelledby',
  'visible heading referenced by the group via aria-labelledby',
  `  <h1>Survey</h1>
  <form id="f">
    <p id="contact-q" style="font-weight:600">Preferred contact method</p>
    <div role="radiogroup" aria-labelledby="contact-q">
      <label><input type="radio" name="contact" value="email"> Email</label>
      <label><input type="radio" name="contact" value="sms"> SMS</label>
    </div>
    <button type="submit">Submit</button>
  </form>`,
  'The visible "Preferred contact method" heading is referenced by the radiogroup via aria-labelledby, so the group name is programmatically associated, not merely visual.',
  CITE.h71, 'input[name="contact"]');

neg(16, 'descriptive-legend',
  'address fieldset with descriptive legend',
  `  <h1>Address</h1>
  <form id="f">
    <fieldset>
      <legend>Mailing address</legend>
      <label for="a1">Line 1</label><input id="a1" name="a1" type="text" required>
      <label for="a2">Line 2</label><input id="a2" name="a2" type="text">
    </fieldset>
    <button type="submit">Save</button>
  </form>`,
  'The legend "Mailing address" makes the group\'s purpose clear (G131), so the address lines are collectively and descriptively identified.',
  CITE.g131, '#a1');

neg(17, 'split-phone-grouped',
  'phone parts grouped under a legend "Phone number"',
  `  <h1>Contact</h1>
  <form id="f">
    <fieldset>
      <legend>Phone number</legend>
      <label for="cc">Country code</label><input id="cc" name="cc" type="text" maxlength="3" required>
      <label for="num">Local number</label><input id="num" name="num" type="text" maxlength="10" required>
    </fieldset>
    <button type="submit">Save</button>
  </form>`,
  'The code and number inputs are grouped under a legend "Phone number", so the two halves are tied together as one phone entry and the group is identified.',
  CITE.h71, '#cc');

neg(18, 'checkbox-set-grouped',
  'permissions checkbox set in a labeled group',
  `  <h1>Permissions</h1>
  <form id="f">
    <fieldset>
      <legend>Permissions to grant</legend>
      <label><input type="checkbox" name="perm" value="read"> Read</label>
      <label><input type="checkbox" name="perm" value="write"> Write</label>
      <label><input type="checkbox" name="perm" value="admin"> Admin</label>
    </fieldset>
    <button type="submit">Grant</button>
  </form>`,
  'The checkbox set is wrapped in a fieldset with legend "Permissions to grant", which states the collective question the set answers; the group purpose is identified per H71.',
  CITE.h71, 'input[name="perm"]');

neg(19, 'legend-visible-in-a11y-tree',
  'card expiry fieldset legend present and exposed',
  `  <h1>Expiry</h1>
  <form id="f">
    <fieldset>
      <legend>Card expiry</legend>
      <label for="em">Month (MM)</label><input id="em" name="em" type="text" maxlength="2" required>
      <label for="ey">Year (YY)</label><input id="ey" name="ey" type="text" maxlength="2" required>
    </fieldset>
    <button type="submit">Save</button>
  </form>`,
  'The legend "Card expiry" is present and exposed to the accessibility tree, naming the MM/YY group; the split fields are collectively identified.',
  CITE.h71, '#em');

neg(20, 'single-fieldset-all-options',
  'plan radio group all within one labeled fieldset',
  `  <h1>Plan</h1>
  <form id="f">
    <fieldset>
      <legend>Choose your plan</legend>
      <label><input type="radio" name="plan" value="free"> Free</label>
      <label><input type="radio" name="plan" value="pro"> Pro</label>
    </fieldset>
    <button type="submit">Choose</button>
  </form>`,
  'All options of the single logical choice (name=plan) sit within one fieldset whose legend "Choose your plan" labels the group; the required selection is identified as one group.',
  CITE.h71, 'input[name="plan"]');

module.exports = true;
