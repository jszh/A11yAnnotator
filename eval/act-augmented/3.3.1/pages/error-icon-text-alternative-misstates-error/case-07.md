# case-07 — CONTROL (passes): malformed-email error icon with a correct, specific `alt`

## Scenario
A government heating-assistance application ("State Benefits Portal"). The email `carla.mendes#state.gov` uses `#` instead of `@` — a genuine format error. The error indicator is an `<img>` icon whose `alt` is specific and accurate: `alt="Email address must contain an @ symbol — for example, name@example.com"`. A linked error summary repeats the same identification. This is the boundary variant: same machinery as the failing siblings (an icon delivering the error via a text alternative), but here the alternative is done right, so it should PASS SC 3.3.1.

## Attribute tuple + developer persona
- **content-domain:** government / benefits application
- **UI-component / pattern:** error-summary + inline `<img>` error icon with a descriptive `alt`
- **host-language construct:** `<img alt>` text alternative carrying a full error description (+ example), plus `aria-describedby`
- **locale / i18n:** en-US (US government service pattern)
- **failure-mechanism:** NONE — included as a passing control to prove the aspect is about the alternative's MEANING, not its presence
- **developer persona:** A government-service team following a design-system pattern that mandates error text identify the field and describe the problem in plain language with an example. The accessibility reviewer required the icon's `alt` to carry the full message, not a generic token, so the icon and the summary say the same specific thing.

## Element / selector carrying the issue (here: the element that makes it pass)
`img#email-ico` (`alt="Email address must contain an @ symbol — for example, name@example.com"`) beside `input#email` (`carla.mendes#state.gov`, `aria-invalid="true"`, `aria-describedby="email-ico"`).

## Exact accessibility mechanism (what AT experiences, why it passes)
- The icon is a valid `role=img` whose non-empty accessible name fully identifies the field's error and even how to fix it.
- A screen-reader user on the email field hears "Email address, invalid, Email address must contain an @ symbol — for example, name@example.com." That identifies the item in error and describes the error in text (a text alternative), satisfying the SC's "in text or a text alternative" limb. The linked summary provides the same identification at the top of the form.
- CDP accessibility tree confirms the icon computes the full descriptive `name`.

## Expected ACT-style outcome
**passed** — the input error is identified (the email field) and described in a text alternative that conveys the actual error (missing `@`), meeting SC 3.3.1.

## Why automated tools miss it (i.e., why this control matters)
Automated tools would "pass" this page — but they would equally have "passed" the failing siblings (case-01..06), because they only verify the alt is PRESENT, never that it correctly describes the error. This control is statically near-identical to the failures (img + non-empty alt + aria wiring) yet is the only one a human would mark conforming. It demonstrates that the aspect is decided by the alternative's MEANING, which automated checkers do not evaluate.

## Citation
> "It is perfectly acceptable to indicate the error in other ways such as through the use of an image, color, or other visual indicator, in addition to the text description."
— wcag-understanding/error-identification.html (Intent — the image-delivery path the SC blesses, which this page exercises correctly)

> "the only requirement is for errors to be presented to users in text or a text alternative."
— wcag-understanding/error-identification.html (Intent, note on presentation methods)
