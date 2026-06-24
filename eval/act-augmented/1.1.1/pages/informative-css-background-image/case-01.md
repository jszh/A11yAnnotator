# case-01 — Loan headline rate trapped in a stylesheet background-image

## Scenario
A building-society personal-loan product page. The card teases the deal with the rhetorical
line **"Where else would you find a better interest rate?"** but never states a rate in
text. The actual headline figure — **"19.3% APR Typical Variable"** — exists only as pixels
inside a green flag rendered by the stylesheet rule `p#bestinterest { background: ... url(svg) }`.
This is the verbatim F3 example 1, reconstructed as a real, self-contained page.

## Attribute tuple
- **content-domain:** finance / retail banking (regulated lending)
- **UI-component / pattern:** marketing product card with a "rate flag" graphic
- **host-language construct:** external (in-document `<style>`) stylesheet rule `background-image` on a `<p>`
- **locale / i18n:** en-GB (£, APR, "Typical Variable")
- **failure-mechanism:** F3 — information conveyed exclusively by a CSS background image (stylesheet carrier)

## Developer persona
A marketing designer at the agency built the "rate flag" in Figma and exported it as a single
graphic so the brand-green pill and the exact APR typography would be pixel-perfect across
browsers. The dev dropped it in as a CSS background on the existing teaser paragraph rather
than re-typesetting the rate in HTML. The compliance team only ever proofreads the *visible
rendered* page, where the rate is plainly readable, so nobody noticed it is image-only.

## Element / selector carrying the issue
- `p#bestinterest` — its `background-image` is a 180×56 SVG whose pixels read
  "19.3% APR" / "Typical Variable".
- The paragraph's text node is only "Where else would you find a better interest rate?".

## Exact accessibility mechanism (what AT experiences)
A screen-reader user reaches the paragraph and hears exactly "Where else would you find a
better interest rate?" — a question with no answer. The single most decision-relevant fact
on the page (the price of the loan) is never announced, because a CSS `background-image`
generates no accessibility-tree node and cannot carry a text alternative. A sighted user in
Windows High Contrast / forced-colors mode (which suppresses background images) loses the
rate for the same reason. The information that "serves the equivalent purpose" required by
1.1.1 simply does not exist in any non-visual form.

## Expected ACT-style outcome
**failed** — F3 failure condition met: the rate is conveyed exclusively by a CSS background
image and is not available as programmatically determinable text anywhere on the page.
Every ACT 1.1.1 rule (image-accessible-name etc.) is **Inapplicable** because there is no
`img`/`svg`/`role=img`/`object`/`input[type=image]` to evaluate — which is precisely why this
aspect is uncovered by the ACT corpus.

## Why automated tools miss it
There is no nameable element for axe-core/WAVE/Lighthouse to flag: a `background-image` is
not in scope for `image-alt` and produces no accessibility node. The tools cannot OCR the
data-URI SVG to learn it contains "19.3% APR", cannot classify the flag as informative vs
decorative, and cannot perform the meaning-comparison ("is this rate stated elsewhere as
text?") that the failure turns on. The markup is fully valid and passes every naive check.

## Citation
**Reference:** WCAG Technique F3 — *Failure of Success Criterion 1.1.1 due to conveying
information exclusively using CSS background images* (`wcag-techniques/failures/F3.html`).

> "In this example, the image TopRate.png is a 180 by 200 pixel image that contains the text,
> \"19.3% APR Typical Variable.\""

> "If check #2 is true and #3 is false, then this failure condition applies and the content
> fails this success criterion."

**Supporting reference:** Trusted Tester v5.1.3 — Test 7.C
(`refs/trusted-tester/sc-1.1.1-non-text-content.md`).

> "The background image is not the only means used to convey important information."
