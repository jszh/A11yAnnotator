# case-02 — Donation card in an `<iframe>` whose last field loops Tab back to the first

## Scenario
A nonprofit donation page ("Riverbank Food Relief") collects card details in an embedded
payment widget rendered as a cross-document `<iframe src="case-02-frame.html">` (a
same-origin sibling file mimicking a hosted card-fields iframe such as Stripe / Braintree
Elements; no network). Inside the iframe are an amount field, card number, expiry, CVC,
and a "Donate $25" submit button. The embedded form re-implements its own tab cycle: the
**last** control loops forward Tab back to the **first** field, and Shift+Tab from the
first field loops to the last. Tab therefore cycles forever among the widget's own
controls and never crosses the iframe boundary forward to the parent page's "Cancel and
return to home" link. No instruction tells a keyboard user how to leave the widget.

## Attribute tuple
- **content-domain:** nonprofit / donation flow
- **UI-component/pattern:** hosted payment card-fields widget (multi-input form)
- **host-language construct:** `<iframe src>` boundary; inner first/last controls with `keydown` Tab/Shift+Tab loop
- **locale/i18n:** en-US (USD)
- **failure-mechanism:** F10 / violates G21 mechanism #1 — Tab does not exit after the final control; it re-cycles

## Developer persona
An agency themed a donation template for the charity and self-hosted a "secure card
fields" component to avoid a third-party SDK. To keep card entry tidy they added a focus
trap "like a modal" so Tab would not wander off to the page chrome mid-payment — but they
never wired an exit, and they tested only by clicking field to field with the mouse. The
loop reads as a thoughtful UX detail; it is actually an inescapable cage.

## Element / selector carrying the issue
`iframe[src="case-02-frame.html"]` → inside it, the pair `#amt` (first) and `#donate`
(last). `#donate`'s `keydown` cancels forward Tab and focuses `#amt`; `#amt`'s `keydown`
cancels Shift+Tab and focuses `#donate`. The cycle never releases the boundary.

## Exact accessibility mechanism
A keyboard user tabs into the iframe and moves amount → card → expiry → CVC → Donate.
Pressing Tab on "Donate" should advance focus out of the iframe to "Cancel and return to
home"; instead the embedded script cancels it and sends focus to the amount field, and
the cycle repeats indefinitely. Shift+Tab from the amount field likewise loops to Donate.
Because the loop is implemented inside the embedded format, the host never receives the
boundary-crossing focus event. There is no Esc exit and no documented alternate method, so
the keyboard user can operate the payment fields but can never leave them to cancel or to
reach the rest of the page. Verified with CDP Tab driving: 26 Tab presses, focus never
leaves the iframe; Esc does not free it.

## Expected ACT-style outcome
**failed** — SC 2.1.2 No Keyboard Trap (F10; the G21 sufficient mechanism #1 — "the
keyboard function for advancing focus … exits the subset of the content after it reaches
the final navigation location" — is precisely what is violated). The corpus's only ACT
rule (80af7b) tests single-document inline-button traps and does not model an embedded
form's forward-Tab loop across an iframe boundary.

## Why automated tools miss it
Static scanners see a valid `<iframe>` with a title and, inside, five properly labelled,
operable inputs and a named submit button — every control passes name/role/label checks.
Nothing in the markup declares that forward Tab loops instead of exiting; that is a
runtime focus-traversal behavior. axe/WAVE/Lighthouse never press Tab and never model the
cross-document focus cycle, so the boundary loop is invisible to them. Only a human (or an
interaction-driven probe) tabbing to "Donate" and finding the next Tab returns to the
amount field instead of reaching "Cancel and return to home" can detect it.

## Citation
> **Reference:** WCAG Techniques — G21 "Ensuring that users are not trapped in content"
> (`wcag-techniques/general/G21.html`)
>
> **Quote (verbatim):** "Ensuring that the keyboard function for advancing focus within
> content (commonly the tab key) exits the subset of the content after it reaches the final
> navigation location."
>
> **Reference:** WCAG Techniques — F10 (`wcag-techniques/failures/F10.html`)
>
> **Quote (verbatim):** "Applies when content creates a situation where the user can enter
> the content using the keyboard, but cannot exit the content using the keyboard."
>
> **Reference:** Trusted Tester v5.1.3 — SC 2.1.2 (`refs/trusted-tester/sc-2.1.2-no-keyboard-trap.md`)
>
> **Quote (verbatim):** "Keyboard access is restricted to a small section of the page with
> no way to navigate out of the "loop" to the rest of the page."
