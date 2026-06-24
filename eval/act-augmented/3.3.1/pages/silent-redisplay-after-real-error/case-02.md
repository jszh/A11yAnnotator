# case-02 — Checkout bounced on a 13-digit card, but a green "your order is being processed" banner sits above the retained invalid card

## Scenario
A Folio & Thread e-commerce checkout, Step 3 of 3 (Payment). The customer pressed "Place order"
with a **13-digit card number** ("4716 1234 5678 9" — a real card is 15–16 digits) and **no CVC**.
The payment gateway rejected it and the store re-displayed the payment step with the bad card value
retained. But the theme injected a **green success banner**: "Thank you — your order is being
processed. A confirmation email is on its way." The banner directly contradicts the failure: it
claims the order went through while the payment did not, and the form is still sitting there holding
an invalid card. Variant B of the aspect: a mismatched success banner masks the failure.

## Attribute tuple
- **content-domain:** e-commerce product & checkout
- **UI-component/pattern:** mismatched success banner (`role="status"`, green tick) above a re-displayed payment form
- **host-language construct:** `<div role="status" class="banner-success">` + native `<form method="post">` with retained `value` on the card input
- **locale/i18n:** en (GBP store)
- **failure-mechanism:** the page shows a NEUTRAL/SUCCESS message that contradicts a real validation failure — error conveyed in no text

## Developer persona
A freelance theme developer customised a Shopify-style "Dawn" theme. They wired the post-submit
banner once, in the layout, to always render the store's standard "order is being processed"
confirmation after the pay action fires — assuming the gateway always succeeds in the happy path
they tested with a test card. When the gateway returns a decline, their controller re-renders the
checkout step (so the bad card is re-bound) but the banner partial is still emitted unconditionally,
so the green success message rides on top of the failed checkout. They never tested a declined card
with a screen reader.

## Element / selector carrying the issue
`div.banner-success[role="status"]` (the false "your order is being processed" message) combined
with `input#cardnum[value="4716 1234 5678 9"]` (13 digits, invalid) and the empty `input#cvc`. The
banner is not malformed — its **content is misleading** relative to the page's true state.

## Exact accessibility mechanism (what AT experiences, why it fails)
The card was rejected — an input error was automatically detected (the gateway enforced card-number
validity). 3.3.1 requires that error be described to the user in text. Instead, the only status text
on the page is a `role="status"` banner that announces success: a screen-reader user who lands here
(focus or a fresh page) hears "Thank you — your order is being processed," concludes the purchase
completed, and leaves. The retained 13-digit card and empty CVC are the only evidence a failure
occurred, and neither is described as an error. The page does not merely omit the error — it
overwrites it with an affirmatively false success message, which is strictly worse than a bare
re-display.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The banner is a valid `<div role="status">` with high-contrast green text; the card input has a
proper `<label for>`, valid markup, and an accessible name. Nothing is structurally wrong and there
is no error element to lint. axe/WAVE/Lighthouse cannot read "your order is being processed" and
judge it false, cannot compute that "4716 1234 5678 9" is too short to be a card, and cannot know
the payment was declined. Telling apart a legitimate confirmation page from a failure dressed up as
success requires understanding the message's meaning against the retained invalid data — human
semantic + visual judgment.

## Citation
> **WCAG 2.2 Understanding 3.3.1 (Intent), `wcag-understanding/error-identification.html`:**
> "The intent of this success criterion is to ensure that users are aware that an error has occurred
> and can determine what is wrong. In the case of an unsuccessful form submission, it is not
> sufficient to only re-display the form without providing any hint that the submission failed."

> **WCAG Technique G85 (Test Procedure), `wcag-techniques/general/G85.html`:**
> "Fill out a form, deliberately enter user input that falls outside the required format or values …
> Check that a text description is provided that identifies the field in error and provides some
> information about the nature of the invalid entry and how to fix it."

(The card number falls outside the required format; G85's required text description is not just
absent — it is replaced by a green message asserting the opposite, that the order succeeded.)
