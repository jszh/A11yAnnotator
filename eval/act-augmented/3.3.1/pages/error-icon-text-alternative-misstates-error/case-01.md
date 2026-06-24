# case-01 — Malformed-email error icon with generic `alt="error"`

## Scenario
A retail outdoor-gear signup ("Mappa Outdoor"). The account form was re-displayed after a failed server-side submit. The email field holds `jane.summit.example.com` — a genuinely malformed address (no `@`). The only per-field error indicator is an `<img>` error icon, and it carries a non-empty `alt="error"`. The summary banner is equally generic ("Please review the highlighted field below.").

## Attribute tuple + developer persona
- **content-domain:** retail / outdoor-gear account creation
- **UI-component / pattern:** inline per-field error icon (`<img>` data-URI SVG) beside a re-displayed invalid input
- **host-language construct:** `<img alt>` text alternative + `aria-describedby`/`aria-invalid` wiring
- **locale / i18n:** en-US
- **failure-mechanism:** text alternative exists but is uselessly generic — restates "an error" without identifying the email-format problem
- **developer persona:** A backend dev added a single reusable error sprite to the server template and gave it the literal `alt="error"` ("it's an error icon, so that's the alt"), assuming the visible red field plus the banner would carry the meaning. They never considered that a screen-reader user gets only the word "error" and the field name.

## Element / selector carrying the issue
`img#email-icon` (`alt="error"`), the sole per-field indicator beside `input#email` (value `jane.summit.example.com`, `aria-invalid="true"`).

## Exact accessibility mechanism (what AT experiences, why it fails)
- The icon is a real `role=img` with a non-empty accessible name, correctly associated to the email input via `aria-describedby`.
- A screen-reader user reaching the email field hears the label "Email address", the value, "invalid", and the icon's name: **"error"**. That conveys only that *something* is wrong — not that the address is missing an `@`, is not a valid email, or how it must be formatted.
- The visible field error (no `@`) is unambiguous, but the text alternative does not encode it. SC 3.3.1 requires the error be identified and described "in text or a text alternative"; here the alternative exists yet identifies nothing about the actual error.
- CDP accessibility tree confirms the icon computes `name="error"` (rendered, not ignored).

## Expected ACT-style outcome
**failed** — an input error is detected and the only textual conveyance (`alt="error"`) does not describe the nature of the error; it merely asserts an error exists.

## Why automated tools miss it
axe-core / WAVE / Lighthouse verify that the image HAS a text alternative — `alt="error"` is non-empty, so the image "has alt text" and passes. There is no missing/empty attribute, the aria wiring is intact, and contrast is fine. No automated rule compares the alt's *meaning* against the field's actual error state (malformed email). Recognising that "error" fails to identify or describe the specific input error is a semantic comparison only a human (or judging model) can make.

## Citation
> "The intent of this success criterion is to ensure that users are aware that an error has occurred and can determine what is wrong. ... This SC requires that users be provided with information about the nature of the error, including the identity of the item in error."
— wcag-understanding/error-identification.html (Intent of Error Identification)

> "Text describes the error (e.g., in a dialog message that states "the Password you entered is incorrect.")."
— refs/trusted-tester/sc-3.3.1-error-identification.md (How to Test, 3b)
