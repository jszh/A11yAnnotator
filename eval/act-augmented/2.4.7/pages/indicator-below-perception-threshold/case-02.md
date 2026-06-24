# case-02 — Checkout buttons: `:focus-visible` outline 1px `#f4f4f4` on a white card

## Scenario
An e-commerce checkout ("Lumen & Co.") gives its action buttons (Back to cart / Place
order) an author-supplied focus outline so the page is not just relying on the removed
default ring. But the outline color is the design system's "subtle border" token,
`#f4f4f4`, and it is only 1px. The buttons sit on a `#ffffff` card, so the focus ring is
a near-white hairline on white — present, but well below noticeable.

## Attribute tuple
- **content-domain:** e-commerce checkout / payment
- **UI-component/pattern:** primary/secondary form action buttons in a card
- **host-language construct:** `<button>` with `.btn:focus-visible { outline:1px solid #f4f4f4 }`
- **locale/i18n:** en-US
- **failure-mechanism:** focus outline present but ~1.08:1 contrast and only 1px (G195 contrast + 2px-fallback both fail)

## Developer persona
The team has a design system whose `--color-border-subtle` token (`#f4f4f4`) is used for
hairline dividers between cards. When QA filed "buttons have no visible focus," a developer
added `:focus-visible { outline: 1px solid var(--color-border-subtle) }` because the style
guide said "use the subtle border token for borders and focus." On the gray app chrome the
ring is faintly visible; nobody re-checked it on the white checkout card, where it vanishes.

## Element / selector carrying the issue
`.btn:focus-visible { outline:1px solid #f4f4f4; outline-offset:2px }` on
`button.btn-primary` ("Place order") and `button.btn-secondary` ("Back to cart"), drawn
against the `#ffffff` card / button surfaces. (The text inputs above use a real 2px brand
outline, so the defect is isolated to the buttons.)

## Exact accessibility mechanism
A sighted keyboard user Tabs to the "Place order" button. The focus indicator is a 1px
outline in `#f4f4f4` offset 2px from a white button on a white card. The contrast of the
indicator against the surrounding/behind pixels is about **1.08:1** (`#f4f4f4` vs
`#ffffff` = 1.10:1; verified rendered maxChannelDelta = 11/255) — far below G195's 3:1.
Because the outline is only **1px**, the G195 escape route ("if the indicator does not
have 3:1 contrast, check that it is at least 2px thick") also fails. The outline genuinely
paints a 1px band of slightly-off-white pixels (so oj04fd's "any change" passes), but a
human cannot perceive a near-white hairline on white. The user cannot tell whether focus
is on "Back to cart" or "Place order" — a costly ambiguity at the moment of payment.

## Expected ACT-style outcome
**failed** — SC 2.4.7 (Focus Visible, Level AA). The author-supplied indicator exists but
its magnitude (1px, ~1.08:1) is below perception, so there is no *visible* focus indication
on the buttons.

## Why automated tools miss it
A `:focus-visible` rule is present and sets a real `outline`, so "no focus style" and
"`outline:none` without replacement" heuristics do not fire. axe-core / WAVE / Lighthouse
do not compute the contrast of a focus outline against the colors behind and around it,
nor compare its thickness to G195's 2px fallback. A pixel-diff scanner sees the 1px band
change value and reports "focus changed something." Concluding that a `#f4f4f4` hairline
on white is imperceptible requires rendering the focused state and exercising human visual
judgment about whether the indicator is actually noticeable.

## Citation
> **Reference:** WCAG Technique G195 "Using an author-supplied, visible focus indicator"
> (`wcag-techniques/general/G195.html`)
>
> **Quote (verbatim):** "Check that the change of contrast of the indicator between
> focused and unfocused states has a ratio of 3:1 or more for the minimum focus indicator
> area."
>
> **Quote (verbatim):** "If the focus indicator does not have 3:1 contrast ratio with its
> adjacent colors, check that it is at least 2px thick."
>
> **Reference:** EN 301 549 Annex C — C.9.2.4.7 SC 2.4.7 Focus visible
> (`docs/analysis/en301549/EN301549-ANNEX-C-RELEVANT-CLAUSES.md`)
>
> **Quote (verbatim):** "Check that the web page does not fail WCAG 2.2 Success Criterion
> 2.4.7 Focus Visible according to WCAG Conformance Requirements stated in clause 9.6."
