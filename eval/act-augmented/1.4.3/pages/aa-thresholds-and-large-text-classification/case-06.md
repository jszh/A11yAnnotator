# case-06 — Policy body at 4.4151:1 (16px normal): the ratio must NOT be rounded up to 4.5, so it FAILS

## Scenario
Fern & Field's "Returns & Refunds" page sets the policy body in the brand "soft charcoal"
`#787878` at **16px / weight 400**. 16px = 12pt normal — clearly not large-scale, so **4.5:1** is
required. The page sits on a barely-there vertical "paper" gradient (white → `#f4f4f4`), which
reads as a flat off-white sheet but has no single background colour. Against it the contrast is
**4.4151:1** at the white top and falls to **~4.0142:1** over the `#f4f4f4` lower region. The
threshold values are normative and **must not be rounded**: 4.4151:1 does not become 4.5:1.
**FAILS** — and it fails by more at the bottom of the column where the gradient darkens.

## Attribute tuple + developer persona
- **content-domain:** e-commerce / store policy page
- **UI-component/pattern:** legal/policy body copy on a subtle "paper" gradient background
- **host-language construct:** `<p class="policy">` with `color:#787878; font-size:16px; font-weight:400` over `linear-gradient(180deg,#fff,#f4f4f4)`
- **locale/i18n:** en-GB
- **failure-mechanism:** a contrast sitting just below the threshold (4.4151:1) that must not be
  rounded to 4.5:1, on a non-uniform background where the worst-case region is lower still
- **developer persona:** A developer who ran a contrast calculator that displayed "4.4" or "≈4.5"
  and rounded it in their head to "passes," and who tested only against pure white, missing both
  the no-rounding rule and the darker lower region of the paper gradient.

## Element / selector carrying the issue
- FAILS: `p.policy` (three paragraphs) — `#787878` at 16px / weight 400, normal-size → 4.5:1
  required. White-top contrast 4.4151:1; over `#f4f4f4` ~4.0142:1. Both below 4.5:1.
- Controls: `h1`, `.updated`, `.footer` are near-black on the paper, above 4.5:1.

## Exact accessibility mechanism
The Understanding note states the ratios are threshold values and the computed value must not be
rounded — "4.499:1 would not meet the 4.5:1 threshold." 4.4151:1 is below 4.5:1 by the same logic,
so the policy text fails for normal-size text even at the most favourable (white) background pixel,
and fails by a wider margin (~4.01:1) over the grey lower region. For the reader with ~20/40 acuity
this dense legal copy at just under 4.5:1 is exactly the readability case the 4.5:1 floor is meant
to guarantee.

## Expected outcome
**failed** — SC 1.4.3. Normal-size text at 4.4151:1 (and lower over the gradient) does not meet the
4.5:1 threshold; the value must not be rounded up.

## Why automated tools miss it
Verified empirically: **axe-core 4.10.3 returns 0 violations and marks the policy paragraphs
`incomplete`** ("background color could not be determined due to a background gradient",
contrastRatio 0): the faint paper gradient defeats axe's background sampling, so it abstains rather
than emitting a violation. (On a flat white background axe *would* flag 4.4151:1 — it does enforce
the threshold without rounding — but here the gradient pushes it to abstain.) The human judgment is
two-fold: (1) sample the worst-case background pixel across the gradient and compute the true ratio
(4.4151:1 at best, ~4.01:1 over `#f4f4f4`), and (2) apply the no-rounding rule — 4.4151:1 is NOT
4.5:1 — for normal-size text. A reviewer who eyeballs "about 4.4, basically passes," or who tests
only the white top, reaches the wrong verdict; the correct outcome is FAIL.

## Citation
> **Reference:** WCAG 2.2 Understanding SC 1.4.3 (`wcag-understanding/contrast-minimum.html`)
>
> **Quote (verbatim):** "The 3:1 and 4.5:1 contrast ratios referenced in this success criterion are
> intended to be treated as threshold values. When comparing the computed contrast ratio to the
> Success Criterion ratio, the computed values should not be rounded (e.g., 4.499:1 would not meet
> the 4.5:1 threshold)."
>
> **Reference:** Trusted Tester v5.1.3 — Test 13.C (`refs/trusted-tester/sc-1.4.3-contrast-minimum.md`)
>
> **Quote (verbatim):** "If the background is varied, choose a pixel that provides the **least contrast**."
>
> **Reference:** EN 301 549 Annex C — C.9.1.4.3 Contrast (minimum)
> (`docs/analysis/en301549/EN301549-ANNEX-C-RELEVANT-CLAUSES.md`)
>
> **Quote (verbatim):** "Check that the web page does not fail WCAG 2.2 Success Criterion 1.4.3
> Contrast (Minimum) according to WCAG Conformance Requirements stated in clause 9.6."
