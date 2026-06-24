# case-01 — Payment iframe titled `title="iframe"`

## Scenario
A coffee-shop checkout page (step 3 of 3, "Payment") embeds the card-entry widget as a
hosted-fields `<iframe>`. The frame renders a complete credit-or-debit card form (card
number, expiry, CVC, billing ZIP, "Pay $42.00"). Its `title` attribute is the literal
string `"iframe"` — non-empty, so the accessible-name rule passes, but it tells an AT
user nothing about what the frame is.

## Attribute tuple
- **content-domain:** e-commerce / fintech checkout
- **UI-component/pattern:** payment hosted-fields iframe (PCI card form)
- **host-language construct:** `<iframe srcdoc title="iframe">`
- **locale/i18n:** en-US
- **failure-mechanism:** generated/boilerplate default name left unchanged ("iframe")

## Developer persona
A junior full-stack dev integrating the payment gateway pasted the "quick start"
embed snippet straight from the processor's docs. That snippet ships with
`title="iframe"` as a placeholder and a TODO the dev never circled back to. The
integration worked visually and shipped; nobody navigated the page by frame with a
screen reader.

## Element / selector carrying the issue
`main .panel iframe[title="iframe"]` (the single payment iframe). Accessible name
computed by Chrome: `"iframe"` (verified via CDP `Accessibility` snapshot).

## Exact accessibility mechanism
The iframe is in sequential focus order (no negative tabindex) and is exposed in the
accessibility tree with role `Iframe` and accessible name `"iframe"`. A screen-reader
user navigating frames (e.g. JAWS frame list, NVDA) hears only "iframe" and cannot tell
this is the payment step — the most consequential frame on the page. The name is present
and programmatically determined, satisfying the literal non-emptiness rule, but it does
not communicate the frame's purpose, so the "Name" limb of 4.1.2 fails for the embedded
frame under Trusted Tester 12.D.

## Expected ACT-style outcome
**failed** (TT 12.D `4.1.2-iframe-name`). cae760 *passes* (name is non-empty); 4b1c6c is
*inapplicable* (only one iframe, no identical-name set).

## Why automated tools miss it
axe-core, WAVE, and Lighthouse evaluate iframe accessible names only for non-emptiness.
`"iframe"` is non-empty, so cae760 passes and no tool flags it. There is a single frame,
so the only descriptiveness-adjacent rule (4b1c6c) never applies. No automated tool can
render the frame's document, recognise it as a credit-card payment form, and judge that
"iframe" fails to describe it — that requires a human to look inside the frame and
compare its content against the name.

## Citation
> **Reference:** Trusted Tester v5.1.3 — Test 12.D `4.1.2-iframe-name` (iFrames)
> (`refs/trusted-tester/sc-4.1.2-name-role-value.md`)
>
> **Quote (verbatim):** "Test Condition: *The combination of accessible name and
> description for each `<iframe>` describes its content.*"
>
> **Quote (verbatim):** "Review the ANDI Output for each iframe with a non-negative
> tabindex (or where tabindex is not defined) to determine whether the accessible name
> and description accurately describe the content of each `<iframe>`."
