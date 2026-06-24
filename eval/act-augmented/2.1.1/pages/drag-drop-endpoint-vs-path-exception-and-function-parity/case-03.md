# case-03 — Résumé upload only via a drag dropzone; the real file input is hidden and never surfaced to the keyboard (FAIL)

## Scenario
Northwind Talent's job-application page requires attaching a résumé. A native
`<input type="file" id="resume">` exists in the DOM with an associated `<label>`, but it is
`display:none` and is **never surfaced to keyboard users**: there is no clickable/visible `<label>`,
no button that calls `resume.click()`, and the dashed "Drag your résumé file here" area is a plain
`<div>` with only `dragover`/`drop` handlers (no `role`, no `tabindex`, no key handler). The only
surfaced way to attach the required file is to drag it from the desktop into the zone.

## Attribute tuple
- **Content domain:** job board / ATS (applicant tracking) — apply flow
- **UI component / pattern:** drag-and-drop file dropzone
- **Host-language construct:** `<input type=file display:none>` (present + labeled but hidden) + a `<div>` dropzone with `dragover`/`drop` only
- **Locale / i18n:** en-US
- **Failure mechanism:** the only surfaced upload affordance is pointer drag; the native input is hidden and never `.click()`-ed, so the upload function has no keyboard route

## Developer persona
A contractor themed a fancy "drag your file here" dropzone from a Dribbble mock. They kept the real
`<input type=file>` in the DOM "for the form post" but hid it with `display:none`, intending to wire a
click-to-browse fallback later — and never did. With a mouse it works (drag a file in), so QA passed it.
They forgot that the hidden input needs a visible, keyboard-reachable trigger (`<label for>` or a button
calling `.click()`) to be operable without a pointer.

## Element / selector carrying the issue
`#drop` (the `div.dropzone`) is the only surfaced upload control and is pointer-drag-only;
`#resume` (`input[type=file]`) is present and labeled but `display:none` with no surfaced trigger.

## Exact accessibility mechanism
A keyboard-only or screen-reader user can complete name and email and Tab to "Submit application," but
**cannot attach the required résumé**: the dropzone div is not focusable and has no key handler, and the
hidden file input is never reachable (display:none removes it from the tab order, and nothing calls
`.click()` on it). Attaching a file is endpoint-dependent — the drop *target* is what matters, not the
pointer path — so the path-of-movement exception does not apply and the function must be keyboard
operable. It is not, so SC 2.1.1 fails (F54: pointer-only mechanism is the sole way to invoke the
function). Contrast: a hidden input paired with a visible `<label for="resume">` or a button calling
`resume.click()` would PASS — the difference is purely keyboard reachability.

## Expected ACT-style outcome
**failed** (SC 2.1.1 Keyboard — the required file-upload function is reachable by pointer drag only; F54).

## Why automated tools miss it
The `<input type="file" id="resume">` has a programmatically associated `<label>`, so axe/WAVE report a
correctly labeled form control and raise no error. They do not detect that the input is `display:none`
with no surfaced trigger, that the visible dropzone is the only upload affordance, or that "attach a
file" is therefore keyboard-unreachable — distinguishing the failing hidden-and-untriggered input from a
passing hidden-input-with-clickable-label requires tracing the interaction and judging that the function
has no keyboard route. That is human reasoning, not a static attribute check.

## Citation
**Reference:** WCAG 2.2 Understanding — Keyboard (`wcag-understanding/keyboard.html`)
> "The intent of this success criterion is to ensure that, wherever possible, content can be operated through a keyboard or keyboard interface (so an alternate keyboard can be used). When content can be operated through a keyboard or alternate keyboard, it is operable by people with no vision (who cannot use devices such as mice that require eye-hand coordination) as well as by people who must use alternate keyboards or input devices that act as keyboard emulators."

**Reference:** WCAG Technique F54 — Failure of SC 2.1.1 due to using only pointing-device-specific event handlers (`wcag-techniques/failures/F54.html`)
> "Check to see whether pointing-device-specific event handlers are the only means to invoke scripting functions."

**Reference:** Trusted Tester v5.1.3 — SC 2.1.1 Keyboard (`refs/trusted-tester/sc-2.1.1-keyboard.md`)
> "If an element has **no keyboard access**, determine whether another keyboard-accessible method on the page provides the same functionality (e.g., one of two print methods is keyboard accessible)."
