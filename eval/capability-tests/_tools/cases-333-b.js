'use strict';
// 3.3.3 aspect B: suggestion-reachability-proximity
// A CORRECT suggestion exists on submit, but the question is whether it is REACHABLE / proximate
// to the field (placed close, focusable/announced, programmatically associated).
// POSITIVE (expected=failed): correct suggestion but stranded far / not associated / not announced
//   / hidden from a11y tree, so a user at the field cannot reach or perceive it.
// NEGATIVE (expected=passed): correct suggestion placed close to / associated with the field and
//   exposed (role=alert or aria-describedby), per G177 placement guidance.
const { writeCase, add, CITE, validatorScript } = require('./gen-332-333.js');
const SC = '3.3.3', A = 'suggestion-reachability-proximity';

function emit(n, polarity, dim, comment, formBody, valid, msgExpr, invalidValue, rationale, citation, opts = {}) {
  const fieldId = opts.fieldId || 'fld';
  const body = `  <h1>${opts.h1 || 'Form'}</h1>
  <form id="f">
${formBody}
    <button id="submit" type="submit">${opts.btn || 'Submit'}</button>
${opts.errHtml}
  </form>
${validatorScript({ formId: 'f', fieldId, errId: opts.errId || 'err', testFnSrc: valid, msgExpr })}`;
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

const EMAIL = `function(v){return /^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$/.test(v.trim());}`;
const SIXD = `function(v){return /^\\d{6}$/.test(v.trim());}`;
const DDMM = `function(v){return /^(0[1-9]|[12]\\d|3[01])\\/(0[1-9]|1[0-2])\\/\\d{4}$/.test(v.trim());}`;

// ---------------- POSITIVES (10): correct suggestion but not reachable ----------------
pos(1, 'stranded-far-below', 'correct email suggestion 600px below the field',
  `    <label for="fld">Email</label>
    <input id="fld" name="em" type="text">`,
  EMAIL, `'Enter an email like name@example.com.'`, 'foo',
  'The suggestion is correct but rendered ~600px below the field with no association; a user focused on the field cannot perceive or reach the suggestion at the point of error.',
  CITE.g177prox, { h1: 'Sign up', btn: 'Subscribe', errId: 'err',
    errHtml: `    <div class="far"><p id="err" class="err" hidden></p></div>` });

pos(2, 'no-association-no-role', 'suggestion placed but not associated and not announced',
  `    <label for="fld">Code</label>
    <input id="fld" name="c" type="text">`,
  SIXD, `'Enter the 6-digit code.'`, '12',
  'The correct suggestion appears far below with no role=alert and no aria-describedby tying it to the field; it is neither announced to assistive tech nor positioned near the field, so it is effectively unreachable.',
  CITE.g177prox, { h1: 'Verify', btn: 'Verify', errId: 'err',
    errHtml: `    <div class="far"><p id="err" class="err" hidden></p></div>` });

pos(3, 'aria-hidden-message', 'correct suggestion but aria-hidden=true',
  `    <label for="fld">Date</label>
    <input id="fld" name="d" type="text">`,
  DDMM, `'Use DD/MM/YYYY, e.g. 25/12/2026.'`, '2026-12-25',
  'The suggestion text is correct and visible but the message container is aria-hidden=true, removing it from the accessibility tree; a screen-reader user never receives the reachable suggestion.',
  CITE.g177prox, { h1: 'Booking', btn: 'Book', errId: 'err',
    errHtml: `    <p id="err" class="err" aria-hidden="true" hidden></p>` });

pos(4, 'offscreen-positioned', 'suggestion pushed off-screen via absolute positioning',
  `    <label for="fld">Email</label>
    <input id="fld" name="em" type="text">`,
  EMAIL, `'Enter an email like name@example.com.'`, 'bar',
  'The suggestion is positioned off-screen (left:-9999px) so a sighted user cannot see it where the error occurs; with no association/announcement it is not reachable at the field.',
  CITE.g177prox, { h1: 'Sign up', btn: 'Join', errId: 'err',
    errHtml: `    <p id="err" class="err" style="position:absolute;left:-9999px" hidden></p>` });

pos(5, 'in-collapsed-disclosure', 'suggestion hidden inside a closed details',
  `    <label for="fld">Code</label>
    <input id="fld" name="c" type="text">`,
  SIXD, `'<details><summary>Why was this rejected?</summary>Enter the 6-digit code.</details>'`, '99',
  'The correct suggestion is buried inside a collapsed disclosure the user must hunt for and open; it is not surfaced near the field at the moment of error, defeating reachability.',
  CITE.g177prox, { h1: 'Verify', btn: 'Submit', errId: 'err',
    errHtml: `    <div class="far"><span id="err" hidden></span></div>` });

pos(6, 'suggestion-at-page-bottom-footnote', 'correct suggestion only in a far footnote',
  `    <label for="fld">Email</label>
    <input id="fld" name="em" type="text">`,
  EMAIL, `'See footnote: enter an email like name@example.com.'`, 'baz',
  'The suggestion is rendered only in a footnote at the page bottom, far from the field and unassociated; the user has no proximate path from the error to the correction text.',
  CITE.g177prox, { h1: 'Newsletter', btn: 'Subscribe', errId: 'err',
    errHtml: `    <div class="far"><p id="err" class="err" hidden></p></div>` });

pos(7, 'wrong-target-describedby', 'suggestion associated to a different field',
  `    <label for="fld">Email</label>
    <input id="fld" name="em" type="text">
    <label for="other">Name</label>
    <input id="other" name="nm" type="text" aria-describedby="err">`,
  EMAIL, `'Enter an email like name@example.com.'`, 'qux',
  'The correct email suggestion is programmatically associated (aria-describedby) with the unrelated Name field, not the email field that erred; from the erring field the suggestion is not reachable via its own description.',
  CITE.g177prox, { h1: 'Contact', btn: 'Send', errId: 'err',
    errHtml: `    <p id="err" class="err" hidden></p>` });

pos(8, 'message-far-and-not-focusable', 'suggestion far, focus not moved, no live region',
  `    <label for="fld">Date</label>
    <input id="fld" name="d" type="text">`,
  DDMM, `'Use DD/MM/YYYY.'`, '31-31-2026',
  'The correct suggestion is placed far below and is not a live region, and focus stays on the submit button; a keyboard/AT user gets no announcement and must scroll to find it, so it is effectively unreachable at the error.',
  CITE.g177prox, { h1: 'Schedule', btn: 'Save', errId: 'err',
    errHtml: `    <div class="far"><p id="err" class="err" hidden></p></div>` });

pos(9, 'display-none-then-far', 'suggestion text present in DOM but far + unstyled hidden block',
  `    <label for="fld">Code</label>
    <input id="fld" name="c" type="text">`,
  SIXD, `'Enter the 6-digit code.'`, '1',
  'The suggestion is rendered into a container far below the field with no association and no announcement; although correct, its placement violates G177\'s guidance to keep suggestions close to the field.',
  CITE.g177prox, { h1: 'Verify', btn: 'Verify', errId: 'err',
    errHtml: `    <div class="far"><p id="err" class="err" hidden></p></div>` });

pos(10, 'banner-far-above-no-focus', 'suggestion injected in a banner far above the field, focus not moved',
  `    <p id="err" class="err" role="alert" hidden></p>
    <div class="far"></div>
    <label for="fld">Email</label>
    <input id="fld" name="em" type="text">`,
  EMAIL, `'Enter an email like name@example.com.'`, 'nope',
  'The correct suggestion is injected into a banner ~600px above the field (a 600px spacer separates them) and focus is not moved to it; a user at the field is not taken to the correction and must scroll up to find it, so it is not reachable from the error point.',
  CITE.g177prox, { h1: 'Sign up', btn: 'Subscribe', errId: 'err',
    errHtml: '' });

// ---------------- NEGATIVES (10): correct suggestion, reachable + proximate ----------------
neg(11, 'proximate-and-alert', 'email suggestion right under field, role=alert',
  `    <label for="fld">Email</label>
    <input id="fld" name="em" type="text" aria-describedby="err">
    <p id="err" class="err" role="alert" hidden></p>`,
  EMAIL, `'Enter an email like name@example.com.'`, 'foo',
  'The correct suggestion appears immediately below the field, is a role=alert (announced), and is the field\'s aria-describedby target; it is proximate and reachable per G177 placement guidance.',
  CITE.g177prox, { h1: 'Sign up', btn: 'Subscribe', errId: 'err', errHtml: '' });

neg(12, 'describedby-proximate', 'code suggestion adjacent and associated',
  `    <label for="fld">Code</label>
    <input id="fld" name="c" type="text" aria-describedby="err">
    <p id="err" class="err" role="alert" hidden></p>`,
  SIXD, `'Enter the 6-digit code.'`, '12',
  'The suggestion sits adjacent to the field and is bound via aria-describedby and announced via role=alert; it is reachable from the field at the moment of error.',
  CITE.g177prox, { h1: 'Verify', btn: 'Verify', errId: 'err', errHtml: '' });

neg(13, 'date-suggestion-proximate', 'date suggestion next to field, exposed',
  `    <label for="fld">Date</label>
    <input id="fld" name="d" type="text" aria-describedby="err">
    <p id="err" class="err" role="alert" hidden></p>`,
  DDMM, `'Use DD/MM/YYYY, e.g. 25/12/2026.'`, '2026-12-25',
  'The correct DD/MM/YYYY suggestion is placed immediately by the field, exposed to the accessibility tree, and associated; it is both proximate and reachable.',
  CITE.g177prox, { h1: 'Booking', btn: 'Book', errId: 'err', errHtml: '' });

neg(14, 'top-of-form-summary-with-link', 'error summary at top of short form preceding fields',
  `    <p id="err" class="err" role="alert" hidden></p>
    <label for="fld">Email</label>
    <input id="fld" name="em" type="text" aria-describedby="err">`,
  EMAIL, `'Enter an email like name@example.com.'`, 'bar',
  'G177 explicitly permits placing suggestions "at the top of the form, preceding the form fields"; here the correct suggestion is at the top of a short form, announced via role=alert and associated, so it is reachable.',
  CITE.g177prox, { h1: 'Sign up', btn: 'Join', errId: 'err', errHtml: '' });

neg(15, 'aria-live-polite-proximate', 'suggestion in an adjacent aria-live region',
  `    <label for="fld">Code</label>
    <input id="fld" name="c" type="text" aria-describedby="err">
    <p id="err" class="err" aria-live="polite"></p>`,
  SIXD, `'Enter the 6-digit code.'`, '7',
  'The correct suggestion is rendered into an adjacent aria-live=polite region associated with the field; it is announced and proximate, so it is reachable.',
  CITE.g177prox, { h1: 'Verify', btn: 'Verify', errId: 'err', errHtml: '' });

neg(16, 'inline-next-to-field', 'suggestion inline immediately after the input',
  `    <label for="fld">Email</label>
    <input id="fld" name="em" type="text" aria-describedby="err">
    <span id="err" class="err" role="alert" hidden></span>`,
  EMAIL, `'Enter an email like name@example.com.'`, 'baz',
  'The suggestion is inline immediately after the input, announced and associated; it sits "next to the form field requiring correction" exactly as G177 recommends.',
  CITE.g177prox, { h1: 'Newsletter', btn: 'Subscribe', errId: 'err', errHtml: '' });

neg(17, 'correct-field-describedby', 'suggestion associated to the erring field, not another',
  `    <label for="other">Name</label>
    <input id="other" name="nm" type="text">
    <label for="fld">Email</label>
    <input id="fld" name="em" type="text" aria-describedby="err">
    <p id="err" class="err" role="alert" hidden></p>`,
  EMAIL, `'Enter an email like name@example.com.'`, 'qux',
  'The email suggestion is associated (aria-describedby) with the email field that erred and announced via role=alert; the correction is reachable from the correct field.',
  CITE.g177prox, { h1: 'Contact', btn: 'Send', errId: 'err', errHtml: '' });

neg(18, 'focus-moved-to-message', 'message proximate and a live alert',
  `    <label for="fld">Date</label>
    <input id="fld" name="d" type="text" aria-describedby="err">
    <p id="err" class="err" role="alert" hidden></p>`,
  DDMM, `'Use DD/MM/YYYY.'`, '31-31-2026',
  'The correct suggestion is adjacent, associated, and a role=alert that is announced on appearance; the user is informed of the correction at the field without scrolling.',
  CITE.g177prox, { h1: 'Schedule', btn: 'Save', errId: 'err', errHtml: '' });

neg(19, 'exposed-not-hidden', 'suggestion exposed (not aria-hidden) and proximate',
  `    <label for="fld">Code</label>
    <input id="fld" name="c" type="text" aria-describedby="err">
    <p id="err" class="err" role="alert" hidden></p>`,
  SIXD, `'Enter the 6-digit code.'`, '1',
  'The suggestion is exposed to the accessibility tree (no aria-hidden), placed by the field, and associated; it is perceivable and reachable.',
  CITE.g177prox, { h1: 'Verify', btn: 'Verify', errId: 'err', errHtml: '' });

neg(20, 'preceding-fields-summary-associated', 'summary precedes field and is its description',
  `    <p id="err" class="err" role="alert" hidden></p>
    <label for="fld">Email</label>
    <input id="fld" name="em" type="text" aria-describedby="err">`,
  EMAIL, `'Enter an email like name@example.com.'`, 'nope',
  'The correct suggestion precedes the fields (an allowed G177 placement) and is the field\'s aria-describedby target with role=alert; it is reachable and proximate.',
  CITE.g177prox, { h1: 'Sign up', btn: 'Subscribe', errId: 'err', errHtml: '' });

module.exports = true;
