# case-03 — Pricing-card price number styled as a faint "accent" (core info, must meet contrast → failed)

## Scenario
A SaaS pricing page renders each plan's price NUMBER ($19 / $49 / $99) in pale gray
`#a3a3a3` on white = 2.52:1, while everything around it (the "$" sign, "/mo", "Billed
monthly", feature list) is dark and passes. The price magnitude — the single most
decision-critical value on the page — is the only thing below contrast. The designer
rationalized the gray as a "subtle accent." This is the FALSE-NEGATIVE side of the boundary:
information styled to read as decorative.

## Attribute tuple
- **content-domain:** SaaS analytics product — plans & pricing page
- **UI-component/pattern:** three-tier pricing card grid (APG-style card / feature comparison)
- **host-language construct:** hand-authored HTML5 + CSS grid; price split into `.cur` / `.num` / `.per` spans
- **locale/i18n:** en-US, USD currency
- **failure-mechanism:** core information (the price digits) deliberately faded as a design "accent" at 2.52:1, below even the 3:1 large-text bar; author treats it as decorative

## Developer persona
A product designer wanted the price to feel "airy and premium," so in the design system she
set the big number token to a light neutral (`gray-400`) while keeping the dollar sign and
"/mo" in the default ink. It looked elegant in Figma on a large retina display. A junior dev
implemented the tokens faithfully; nobody noticed that the one number a buyer must read is
the faintest text on the page.

## Element / selector carrying the issue
`.price .num` — the price digits, `color:#a3a3a3` at `font-size:56px; font-weight:800` on
the white card.

## Exact accessibility mechanism
The digits are the actual price of each plan — load-bearing information that cannot be
rearranged or substituted without changing meaning (19 vs 49 vs 99 are entirely different
offers). They are therefore squarely in scope for SC 1.4.3, not exempt as decoration. At
56px/800 the number is large-scale text, so the relaxed 3:1 threshold applies — but 2.52:1
fails even that. A low-vision or contrast-impaired user can read the "$" and "/mo" but not
the number itself, losing the price. Result: 1.4.3 failure.

## Why automated tools miss it
Two traps stack. First, the surrounding small text all passes, so a scanner sampling text
nodes sees mostly green. Second, the failing element is large-scale, and the genuine 1.4.3
question — is faint big text decorative or informative? — is exactly the meaning judgment a
checker cannot perform; it sees only a number and a ratio. Even a perfect ratio computation
cannot decide that "$49" is the price (in-scope) rather than an ornamental large numeral.
Recognizing that the faint "accent" is core information requires understanding the page is a
pricing table and that the digit is the price — human semantic reasoning.

## Citation
> **WCAG 2.2 Understanding — Contrast (Minimum)** (`wcag-understanding/contrast-minimum.html`):
> "Text that is decorative and conveys no information is excluded. For example, if random
> words are used to create a background and the words could be rearranged or substituted
> without changing meaning, then it would be decorative and would not need to meet this
> criterion."
