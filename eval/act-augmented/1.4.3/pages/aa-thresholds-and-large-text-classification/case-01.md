# case-01 — transform-scaled strapline: axe reads 18.0pt large-scale (3:1, PASS), but the rendered 10.8pt is normal-size, so 4.5:1 applies and it FAILS

## Scenario
Tidewater Rewards' cashback statement card opens with a seasonal strapline, "Earn 2.4% cashback
on every purchase this season", set in the brand "muted grey" `#8a8a8a` on white = **3.4522:1**.
The design team authored it as a display line at **font-size: 24px / weight 400** — which is
**18.0pt** by the UA metric (1pt = 1.333px) — but to make it fit on a single line inside the
narrow card they wrapped it in `transform: scale(0.6)`. The **glyphs therefore render at
24px × 0.6 = 14.4px = 10.8pt**, well below the 18pt large-scale boundary. The threshold is set by
the *rendered* size, so this is **normal-size** text and the **4.5:1** ratio governs; 3.4522:1 is
below 4.5:1. Correct 1.4.3 (AA) verdict: **FAIL**. The trap is that axe reads the *computed*
`font-size` (24px = 18.0pt), classifies the line as large-scale, applies the relaxed 3:1, sees
3.45:1, and reports a clean pass — it never folds the CSS transform into the size determination.

## Attribute tuple + developer persona
- **content-domain:** online banking / fintech (credit-card cashback statement)
- **UI-component/pattern:** seasonal promo strapline inside a statement summary card
- **host-language construct:** `<p class="promo">` with `font-size:24px; font-weight:400; color:#8a8a8a; transform:scale(0.6)` on a solid white card
- **locale/i18n:** en-US
- **failure-mechanism:** large-scale-size MIS-classification — the CSS `font-size` (18.0pt) is
  large-scale, but `transform: scale(0.6)` shrinks the rendered glyphs to 10.8pt (normal-size), so
  the governing threshold is 4.5:1, not the relaxed 3:1, and 3.4522:1 fails it
- **developer persona:** A front-end developer who set the strapline at 24px "so it counts as large
  text, which only needs 3:1," then scaled it down with `transform: scale(0.6)` to fit the card on
  one line — not realizing the transform shrinks the text that actually reaches the reader's eye, so
  the line is really 10.8pt normal-size text that must clear 4.5:1.

## Element / selector carrying the issue
- FAILS (element under test): `p.promo#strapline` — `#8a8a8a` on `#fff` = **3.4522:1**. CSS
  `font-size:24px` (= 18.0pt) but `transform:scale(0.6)` → rendered **14.4px = 10.8pt**, weight 400.
  Rendered size is below the 18pt large-scale boundary → normal-size → **4.5:1 applies** →
  3.4522:1 < 4.5:1 → FAIL.
- Controls: `.eyebrow`, `.amount`, `.amount-note`, and the table cells/headers are dark `#1a1a1a`
  on white, well above 4.5:1.

## Exact accessibility mechanism
The Understanding note is explicit that the point size "should be obtained from the user agent or
calculated on font metrics in the way that user agents do." A CSS `transform: scale()` is part of
how the user agent renders the glyphs, so the size that governs the threshold is the *rendered*
size: 24px × 0.6 = 14.4px = 10.8pt. 10.8pt at normal weight is far below the 18pt large-scale
boundary, so the text is normal-size and the **4.5:1** ratio applies — not the relaxed 3:1. At
3.4522:1 the strapline fails by a clear margin. For the reader with ~20/40 acuity that 1.4.3
targets, this faint grey line — visually a small, ordinary-sized run, not a large display element —
is exactly the normal-size case the 4.5:1 floor is meant to guarantee.

## Expected outcome
**failed** — SC 1.4.3 (Contrast (Minimum), Level AA). The strapline renders at 10.8pt (normal-size
after `transform: scale(0.6)`), so the 4.5:1 threshold applies; its contrast of 3.4522:1 is below
4.5:1. (It would only pass if it were genuinely large-scale at 3:1, but the rendered size is not.)

## Why automated tools miss it
Verified empirically (axe-core 4.10.3, harness config): **0 violations and 0 incomplete**. axe's
own `color-contrast` PASS data for this element records
`fontSize: "18.0pt (24px)", fontWeight: "normal", expectedContrastRatio: "3:1", contrastRatio: 3.45`
and the message "Element has sufficient color contrast of 3.45" — i.e. axe reads the *computed*
`font-size` (24px = 18.0pt), classifies the line as large-scale, applies the relaxed 3:1, and
passes 3.45:1. It does **not** fold the `transform: scale(0.6)` into the size used for the
threshold, so it never sees that the glyphs actually render at 10.8pt. The scanner therefore offers
no signal at all — the page looks clean. The human judgment a tool cannot supply is the *rendered*
size determination: (a) note the element carries `transform: scale(0.6)`; (b) compute the rendered
glyph size as 24px × 0.6 = 14.4px = 10.8pt; (c) conclude it is NOT large-scale, so the governing
threshold is 4.5:1, not 3:1; and (d) fail 3.4522:1 against 4.5:1. A reviewer who trusts the source
`font-size:24px` (or the scanner's "18.0pt → 3:1 → pass") reaches the wrong verdict; the correct AA
outcome is FAIL.

## Citation
> **Reference:** WCAG 2.2 Understanding SC 1.4.3 Contrast (Minimum)
> (`wcag-understanding/contrast-minimum.html`)
>
> **Quote (verbatim):** "When evaluating this Success Criterion, the font size in points should be
> obtained from the user agent or calculated on font metrics in the way that user agents do."
>
> **Quote (verbatim):** "The ratio between sizes in points and CSS pixels is `1pt = 1.333px`,
> therefore `14pt` and `18pt` are equivalent to approximately `18.5px` and `24px`."
>
> **Quote (verbatim):** "18 point text or 14 point bold text is judged to be large
> enough to require a lower contrast ratio."
>
> **Reference:** WCAG Technique G145 (`wcag-techniques/general/G145.html`)
>
> **Quote (verbatim):** "This technique relaxes the 4.5:1 contrast ratio requirement for text that
> is at least 18 point (if not bold) or at least 14 point (if bold)."
