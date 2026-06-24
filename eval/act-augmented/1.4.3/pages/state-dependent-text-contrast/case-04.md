# case-04 — JS-injected validation error at ~2.48:1 (plus a long-tail :active pressed-label at ~2.65:1)

## Scenario
A bank "Transfer money" form. On load every text node passes contrast. The defect appears only in driven states:
- **Primary failure:** submitting with an empty amount makes JS *insert* an inline error `Enter an amount to transfer.` styled light-red `#e98a8a` on white — about **2.48:1**. The error node does not exist in the DOM until the failed submit, so a static scan has nothing to measure; once present, the text is real, meaningful, and below threshold.
- **Long-tail twist:** the submit button label is fine at rest and on hover, but the `:active` (pressed) rule recolors the label to `#a9c2e8` on the `#2f6fd6` button — about **2.65:1**, so while the button is held down its label is unreadable.

Both are non-initial states the corpus never drives.

## Attribute tuple
- **content-domain:** retail banking / payments
- **UI-component / pattern:** money-transfer form with client-side validation + a primary submit button
- **host-language construct:** JS-injected `<p class="err">` (post-submit) **and** a `button:active` pseudo-class color rule
- **locale / i18n:** en-GB (£, "payee")
- **failure-mechanism:** error text below 4.5:1 in the failed-submit state; pressed-state button label below 4.5:1 in the `:active` state

## Developer persona
A back-end-leaning engineer added inline validation in a hurry before a release. They pulled the error color from a "soft red" Figma swatch meant for *badges*, not body text, so the message landed at ~2.48:1. Separately, a designer had added a "press depress" affect to the CTA — lightening the label on `:active` for a tactile feel — and nobody contrast-checked a transient pressed state. The happy path (filled form) and the resting button both passed review, so the build shipped green.

## Element / selector carrying the issue
- `#amount-err .err` — injected error text, `color:#e98a8a` on `#fff` (~2.48:1).
- `.submit:active` — pressed-state label, `color:#a9c2e8` on `#2f6fd6` (~2.65:1).

## Exact accessibility mechanism (what AT experiences / why it fails)
- **Low-vision sighted user, failed submit:** the one piece of text telling them what went wrong (`Enter an amount to transfer.`) is the hardest text on the page to read at ~2.48:1, right when they need it most.
- **Pointer user pressing the CTA:** while the button is held, the label "Review transfer" drops to ~2.65:1 — a transient but real state where in-scope text fails. (The button is enabled/active, so the inactive-control exception does not apply.)
- Both states are reachable in a real browser and present genuine, in-scope text; neither exists at initial render.

## Expected ACT-style outcome
**failed** (SC 1.4.3 — injected error text 2.48:1 and pressed-state label 2.65:1, both < 4.5:1; error and active-state text are in scope).

## Why automated tools miss it
The error element is not in the DOM at load, so axe/WAVE/Lighthouse have no node to evaluate; they do not submit the form to trigger validation. The `:active` label color is only computed while the button is pressed, a state scanners never synthesize. Every text node present at initial render passes, the markup is well-formed (labels, `aria-live`, `aria-describedby` all present), so naive automated checks are green. Catching either failure requires a human to drive the page — submit empty, and press-and-hold the button — then measure the resulting text.

## Citation
> "Some text may not initially be visible (appears on mouseover or focus). It must still conform to the contrast requirement **wherever it occurs**."
— refs/trusted-tester/sc-1.4.3-contrast-minimum.md (Identify Content, Note)

> "This success criterion applies to text in the page, including placeholder text and text that is shown when a pointer is hovering over an object or when an object has keyboard focus. If any of these are used in a page, the text needs to provide sufficient contrast."
— wcag-understanding/contrast-minimum.html (Intent)
