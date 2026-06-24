# case-02 — Checkout step 3 titled only the shared "Checkout"

## Scenario
Step 3 (Payment) of a 4-step checkout flow on the Loomwell Home store. The progress bar
(Cart → Shipping → **Payment** → Review), the `<h1>` "Step 3 of 4 — Payment", and the
payment fieldset make the page's specific role unmistakable. The `<title>` is only the
section-shared label **"Checkout"** — the identical string carried by all four steps. The
title is accurate about the section but cannot distinguish *which step* the user is on,
exactly F25's "same title for each page on the site."

## Attribute tuple
- **Content domain:** e-commerce — multi-step checkout / payment
- **UI component / pattern:** stepper / wizard with progress bar (APG stepper) + `aria-current="step"`
- **Host-language construct:** `<title>` element carrying a section label shared across all steps
- **Locale / i18n:** en
- **Failure mechanism:** F25 — one title reused across every page (step) in the set; title distinguishes the *flow* but not the *step*

## Developer persona
A junior dev built the checkout as four server-rendered routes (`/checkout/cart`,
`/checkout/shipping`, `/checkout/payment`, `/checkout/review`) sharing one Express layout
template whose `<head>` hard-codes `<title>Checkout</title>`. They updated the visible
`<h1>` per step (it's a route variable) but never parameterized the `<title>` in the
shared layout, so all four steps ship the same document title.

## Element / selector carrying the issue
`head > title` (value: `Checkout`). The step-level identity is present only in
`ol.steps li.current` and `main h1` — never surfaced into the title.

## Exact accessibility mechanism
A screen-reader user who keeps the Cart, Shipping, and Payment steps open in separate
tabs (common when comparing shipping options), or who recovers the session from browser
history after a crash, hears "Checkout" on every one with no way to tell which step each
tab holds. If support says "go back to step 2," the title gives no confirmation of which
step is focused. The visual progress bar conveys the step to sighted users, but `<title>`
— the AT orientation cue — is identical across the set.

## Expected ACT-style outcome
**failed** (SC 2.4.2). Non-empty title present (2779a5 passes) but the same title is
reused across the four steps and does not distinguish this page within the set
(fails c4a8a4 / Trusted Tester 12.B / F25).

## Why automated tools miss it
Each step's snapshot has a valid, non-empty `<title>`, so axe/WAVE/Lighthouse pass 2.4.2
on every step. Detecting the failure requires comparing the title across the four steps
and recognizing it carries no step-level information — a cross-page comparison plus
semantic judgment that single-page automated scans never perform.

## Citation
**Reference:** WCAG Technique F25 (`wcag-techniques/failures/F25.html`)
> "A site generated using templates includes the same title for each page on the site. So the title cannot be used to distinguish among the pages."

**Reference:** WCAG Understanding 2.4.2 (`wcag-understanding/page-titled.html`)
> "Titles identify the current location without requiring users to read or interpret page content."
