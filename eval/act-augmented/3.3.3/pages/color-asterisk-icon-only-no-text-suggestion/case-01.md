# case-01 — Donation "Other amount" rejected with red label + pink box, no correction text

## Scenario
A wildlife charity's one-time donation form, re-rendered by the server after a failed submit.
The supporter entered **£3** in the "Other amount" field, but the payment processor enforces a
**£5 minimum**, so server-side logic rejected the submission and re-displayed the form with that
one field wearing `class="is-error"` — a red label, a 2px red border, and a pink fill (`#fdecec`).
To a sighted user the amount box reads unmistakably as "wrong." But the server emitted **no**
correction text: no error summary, no inline message, no `aria-invalid`, no hidden/off-screen
text, no `title`. The red styling is the entire conveyance — and crucially it never states the
knowable fix ("enter £5 or more").

## Attribute tuple
- **content-domain:** nonprofit / donation flow
- **UI-component/pattern:** server-rendered `<form>` with a suggested-amounts button group + text inputs
- **host-language construct:** `<input type="text">` styled via a `.is-error` CSS class (red label + red border + pink background)
- **locale/i18n:** en-GB (currency £, £5 floor)
- **failure-mechanism:** detected input error whose correction is knowable, conveyed ONLY by colour; no text suggestion exists anywhere (G84 "in text" limb)

## Developer persona
A part-time webmaster who maintains the charity site in raw PHP. He added a server-side
minimum-gift check after the processor started bouncing sub-£5 charges. To flag the bad field he
copied a single Bootstrap-flavoured CSS class (`.is-invalid` → red border) and renamed it
`.is-error`, reasoning "the red box makes it obvious." He never added the matching feedback
`<p>` element and never wrote the "minimum is £5" sentence into the page. He has never used a
screen reader and assumes red speaks for itself. He kept the field `type="text"` (not
`type="number"`) so the £ sign and decimals wouldn't trip older mobile keyboards.

## Element / selector carrying the issue
`.field.is-error` wrapping `input#amount` (value `3`). Its red label + 2px red border + pink
`background:#fdecec` are the sole error indicator; no text suggestion exists in the DOM.

## Exact accessibility mechanism (what AT experiences, why it fails)
A screen-reader user who tabs to the field hears "Other amount (pound), edit, 3" — byte-identical
to a valid field. `color`, `border-color` and `background-color` are not part of the accessible
name and are never announced. Because the input is plain `type="text"` with a well-formed value
(`"3"`), `element.validity.valid` is `true`, the browser raises no native constraint-validation
message, and the field's accessibility-tree `invalid` state stays `false`. There is no
`aria-invalid`, no associated message, no text anywhere that an error occurred or that the
acceptable value is "£5 or more." So a blind or low-vision user cannot learn that the
submission failed, which field caused it, or — the 3.3.3-specific point — **what value would be
accepted**. The suggested correction (the £5 floor) is knowable and trivial, yet is provided
only implicitly through red colour, which G84 explicitly says does not satisfy the SC.

## Expected ACT-style outcome
**failed** — an input error was automatically detected and the correction is knowable, but no
text suggestion is provided; the indication is colour-only.

## Why automated tools miss it
- The DOM is valid HTML5; the input has a programmatic `<label for>`; nothing is empty or
  malformed, so structural linters pass.
- The input is `type="text"` with a well-formed value, so the constraint-validation API reports
  `validity.valid === true` and the accessibility tree exposes `invalid:false` — identical to a
  passing field. There is no `aria-invalid="true"` for a scanner to key on.
- axe/WAVE/Lighthouse have no rule asserting "a detected input error must carry a TEXT correction
  suggestion." They cannot know an error was detected (the £3<£5 rule lives on the server), cannot
  know the £5 business rule, and cannot judge that the red styling is the *only* carrier of the
  fix. A generic 1.4.1 "use of colour" heuristic might notice red, but cannot determine that the
  specifically-missing thing is the *correction text* (the 3.3.3 obligation) rather than just
  identification. Catching this requires submitting the form, reading the rendered page, and
  reasoning about meaning.

## Citation
> **WCAG Technique G84 (Providing a text description when the user provides information that is
> not in the list of allowed values), Description:** "The 'in text' portion of the success
> criterion underscores that it is not sufficient simply to indicate that a field has an error by
> putting an asterisk on its label or turning the label red. A text description of the problem
> should be provided."
>
> Source file: `wcag-techniques/general/G84.html`
