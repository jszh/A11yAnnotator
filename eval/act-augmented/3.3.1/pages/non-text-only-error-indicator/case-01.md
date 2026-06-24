# case-01 — "Places" field flagged only by a red 2px border + red-tinted background

## Scenario
A community adult-education centre's course-enrolment form, re-rendered by the server after a
failed submit. The learner asked to reserve **6** places, but the *Watercolour for Beginners*
workshop is capped at 4 seats, so server-side logic rejected the request and re-displayed the
form with that one input wearing `class="flagged"` (a 2px red border and a soft red-tinted
background, `#fdecee`). To a sighted user the "places" box obviously reads as "wrong." But the
server emitted **no** error message, no instruction, no `aria-invalid`, no hidden text, no
`title` — nothing anywhere on the page states that an error occurred or what it is. The red
styling is the entire conveyance.

Crucially, the field is plain `<input type="text">` with **no** `required`, `pattern`, `min`,
`max`, `maxlength` or other HTML constraint, and the value `"6"` is a perfectly well-formed
string. The error is a *business rule* (class capacity) that only the server knows — the browser
platform sees nothing wrong, so there is no native constraint-validation message and the
accessibility tree exposes the field as fully valid.

## Attribute tuple
- **content-domain:** education / adult-learning course enrolment
- **UI-component/pattern:** plain server-rendered `<form>` with text inputs
- **host-language construct:** `<input type="text" class="flagged">` styled red border + tint
- **locale/i18n:** en-GB
- **failure-mechanism:** error signalled solely by CSS colour (red border + red background) on
  the input itself, no text equivalent; a server-side *business-rule* violation that triggers
  no native browser validity (F81 in spirit; SC 3.3.1 "in text" limb)

## Developer persona
A volunteer who maintains the centre's site in raw PHP. He added a server-side capacity check
because over-subscribed classes caused chaos, and styled the rejected field red with a one-line
CSS class he copied from a Bootstrap example (`.is-invalid` → red border). He never added the
matching `.invalid-feedback` message element, reasoning "the red box makes it obvious." He has
never used a screen reader and does not know the red box says nothing to one. He deliberately
kept the field as `type="text"` (not `type="number"`) so older browsers would not reject
non-numeric entry on the client.

## Element / selector carrying the issue
`input#seats.flagged` (value `6`). Its red border + `background:#fdecee` are the sole error
indicator on the page.

## Exact accessibility mechanism (what AT experiences, why it fails)
A screen-reader user who tabs to the field hears "Number of places to reserve, edit, 6" —
identical in every respect to a valid field. `border-color` and `background-color` are not part
of the accessible name and are not announced. Because the input is plain `type="text"` with no
HTML constraints, `element.validity.valid` is `true`, the browser raises no native
constraint-validation message, and the field's accessibility-tree `invalid` state stays
`false` — exactly the same as the two valid fields. There is no `aria-invalid`, no associated
message, and no text anywhere that says the value is wrong. So a blind or low-vision user has no
way to learn that the submission failed or which field caused it, while a sighted user sees an
unmistakable red box. The error is conveyed by colour/styling alone, never "in text," which is
exactly what SC 3.3.1 forbids.

## Verification (why the AT actually hears it as valid)
Rendered headless in Chromium: all three inputs report `validity.valid === true` with an empty
`validationMessage`, and `Accessibility.getFullAXTree` reports the flagged "places" textbox with
`invalid: "false"` — byte-identical to the two unflagged fields. No node in the tree carries a
non-false `invalid` property. This is the load-bearing distinction from a `type="email"`/`number`
field, where Chromium would surface native `typeMismatch`/`rangeOverflow` as AX `invalid:true`
and a real screen reader would announce it. Here nothing does.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The DOM is pristine: real `<label>`s, a page title, sound headings, sufficient contrast. A red
border and a tinted background are among the most common decorative styles on the web, so
axe-core/WAVE/Lighthouse have no rule that treats them as an *error indicator* — there is
literally nothing for a structural scanner to flag. There is also no native constraint to lean
on: the field is valid to the platform. ACT rule 36b590 is triggered by error *text* and checks
whether that text describes the error; with no error text emitted at all, the rule finds nothing
to evaluate and passes vacuously. Only a human looking at the rendered page can recognise the red
box as an error signal and confirm the meaning is absent from text.

## Citation
> The intent of this success criterion is to ensure that users are aware that an error has
> occurred and can determine what is wrong. In the case of an unsuccessful form submission, it is
> not sufficient to only re-display the form without providing any hint that the submission
> failed. The error must be indicated in text.

(Verbatim from `wcag-understanding/error-identification.html`, "Intent of Error Identification".
The server re-displays the form with only a red box and no textual hint, the precise situation
this sentence prohibits.)

> This success criterion does not mean that color or text styles cannot be used to indicate
> errors. It simply requires that errors also be identified using text.

(Verbatim from `wcag-understanding/error-identification.html`, "Examples of Error Identification"
note. Colour styling alone is permitted only *in addition to* text identification, which this
page omits.)
