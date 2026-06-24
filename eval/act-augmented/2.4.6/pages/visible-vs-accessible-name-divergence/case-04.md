# case-04 — REVERSE / verdict-flip: visible cryptic "X" but accessible name "Close conversation"

## Scenario
A web email client's message toolbar. The close control is rendered as a bare ASCII **"X"** glyph
with no accompanying text, while its `aria-label="Close conversation"` is fully descriptive. This is
the **reverse direction** of the other cases: the AT/braille/screen-reader surface is the GOOD one,
and the **visible** surface is the inadequate one. It is the verdict-FLIP test — the page is designed
so the two methodologies could disagree, and a human must decide which surface governs.

## Attribute tuple
- **Content domain:** web email client (productivity SaaS)
- **UI component / pattern:** icon-only toolbar button (close), beside labelled text buttons
- **Host-language construct:** `<button aria-label="Close conversation">✕</button>` (glyph child)
- **Locale / i18n:** en-US
- **Failure mechanism:** **VISIBLE-CRYPTIC / ANNOUNCED-DESCRIPTIVE** — a lone "X" glyph is the only
  visible label; the descriptive name lives only in `aria-label`
- **ARIA anti-pattern (facets.json):** "icon-font or SVG glyph as the only label" — here the glyph IS
  named for AT, but the *visible* glyph alone is not self-describing

## Developer persona
A React developer used a shared `<IconButton glyph="✕" aria-label="Close conversation" />` component,
assuming that supplying a good `aria-label` was "enough" for accessibility. They overlooked that
2.4.6 also governs the *visible* label: a bare "X" in a mail toolbar is ambiguous to sighted users
(delete? dismiss? remove label? close?) and especially to sighted users with cognitive disabilities,
the population this SC most protects.

## Element / selector carrying the issue
`button.iconbtn` (top-right of the toolbar) — visible content is the glyph "✕" only;
`aria-label="Close conversation"`. Verified in Chromium: `role=button`, `accName="Close conversation"`,
`visibleText="✕"`. The three preceding toolbar buttons (Archive, Spam, Delete) pair icon + visible
text and are fine.

## Exact accessibility mechanism
This case isolates *which surface 2.4.6 judges*. ACT rule **b49b2e** ("Heading is descriptive") and
axe-style checks judge the **accessible name**, which here is excellent ("Close conversation") → they
would say *pass*. Trusted Tester **5.B** judges the **visible** button label: "Each visual button
label is sufficiently clear and descriptive, so users know its function" — and a lone "X" glyph, with
no text and no commonly-fixed meaning in a mail toolbar, is not. A sighted user (including
low-vision/cognitive users who do not run a screen reader) cannot tell what the bare "X" does. We mark
this **failed** on the WCAG/TT *visible-label* reading, which is the conservative reading the
Understanding doc supports (2.4.6 is about whether the label, as a label, is descriptive — and the
visible one is not). The point of the page is that the verdict depends on the human's choice of
surface.

## Expected ACT-style outcome
**failed** — TT 5.B visible-button-label limb: the visible "X" is not sufficiently clear or
descriptive of its function. (Note: under a pure ACT/accessible-name reading the same control would be
called *passed* — this divergence is the deliberate test.)

## Why automated tools miss it
The button has a correct role and a descriptive non-empty accessible name, so axe/WAVE/Lighthouse pass
it outright — verified: a full `axe.run` (default + `label-content-name-mismatch`) reports **0
violations**. 2.5.3 Label-in-Name is inapplicable (there is no visible *text* label to be contained).
No automated tool evaluates whether the *visible glyph* is self-describing to a sighted user — that
requires looking at the rendered "X", knowing the toolbar context, and judging human comprehension,
which is precisely the TT 5.B manual call. Tools that key off the accessible name will actively
*pass* it, masking the visible-surface failure.

## Citation
> "Each visual button label is sufficiently clear and descriptive, so users know its function."
— Trusted Tester v5.1.3, Test **5.B** `2.4.6-label-descriptive`, *Evaluate Results* and *Notes*
> ("The label or instruction can be graphical or textual") — the visible graphical label here (a bare
> "X") does not make the function clear, so this check is false even though the accessible name is good.
> (`refs/trusted-tester/sc-2.4.6-headings-and-labels.md`)
