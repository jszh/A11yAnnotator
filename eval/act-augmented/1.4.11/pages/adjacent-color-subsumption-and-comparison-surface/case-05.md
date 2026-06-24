# case-05 — Pill filters whose interior matches the page: outline is the required cue at 2.62:1 (FAIL)

## Scenario
A community forum (`r/trailrunning`) shows a row of "pill" tag-filter buttons. Each pill's
**interior fill is identical to the page** (`#F4F6F8`), and the labels carry no distinguishing
weight or icon — so the **outline is the only visual information** that a control is present,
which makes the outline subject to the 3:1 requirement. Two pills use a `#7E8B96` outline =
**3.22:1** (PASS); three pills use a near-identical `#8E9BA6` outline = **2.62:1** (FAIL). The
two outlines look almost the same to a casual eye.

## Attribute tuple
- **content-domain:** community forum / discussion site
- **UI-component/pattern:** toggle "pill" filter chips whose interior matches the page (boundary outline is the sole cue)
- **host-language construct:** `<button>` with `border-radius:999px`, `background` == page color, `aria-pressed`
- **locale/i18n:** en-US
- **failure-mechanism:** the outline is the required identifying cue (no other), and it is below 3:1 against the page

## Developer persona
A developer building a filter bar wanted "ghost" pills that blend with the page until pressed,
so they set the pill background to the page color and added a thin outline. They eyeballed two
slightly different greys for "regular" vs "secondary" tags and shipped both, not realizing one
grey (`#8E9BA6`) dipped under 3:1 — and, more importantly, not realizing that because the pill
interior matches the page, the outline is *required* to identify the control rather than being
an optional decorative border.

## Element / selector carrying the issue
`.pill.bad` (Nutrition, Injuries, Beginner) — outline `#8E9BA6` at 2.62:1 against the
`#F4F6F8` page; interior == page (1.00:1) so the outline is the only cue. Contrast PASS
control: `.pill.ok` (Gear reviews, Race reports), outline `#7E8B96` at 3.22:1.

## Exact accessibility mechanism
Because each pill's interior is the page color, there is no fill cue and no other visual way to
tell a control is there — per the "Boundaries" guidance, the visual boundary IS required and
must therefore have sufficient non-text contrast. A low-vision user can just make out the
3.22:1 pills but loses the 2.62:1 pills against the page, so three of the five filters are not
reliably perceivable as controls. Verdict for `.pill.bad`: **FAIL**.

## Expected ACT-style outcome
**failed** — SC 1.4.11 Non-text Contrast (Level AA). The boundary outline that is required to
identify the `.pill.bad` controls is 2.62:1 against the page, below 3:1.

## Why automated tools miss it
Two judgments defeat automation. First, deciding the outline is REQUIRED — because the pill
interior matches the page there is "no other visual way to identify the presence of the
control," so the boundary must contrast. A tool treats every `<button>` border as an ordinary
decorative border (per the "boundary is not required when there is visible content" rule) and
does not flag it. Second, even if measured, distinguishing the 2.62:1 fail from the visually
near-identical 3.22:1 pass is exactly the sub-perceptual boundary the SC is calibrated to. Both
steps need a human reasoning about whether the boundary is the sole cue.

## Citation
> **Reference:** WCAG 2.2 Understanding SC 1.4.11 Non-text Contrast — "Boundaries"
> (`wcag-understanding/non-text-contrast.html`)
>
> **Quote (verbatim):** "Having a visual boundary indicating the hit area is only required when
> there is no other visual way to identify the presence of the control – and in those cases,
> the boundary must have sufficient non-text contrast in order to pass this success criterion."
>
> **Quote (verbatim, Intent note):** "The 3:1 contrast ratios referenced in this success
> criterion is intended to be treated as threshold values. When comparing the computed contrast
> ratio to the success criterion ratio, the computed values should not be rounded (e.g. 2.999:1
> would not meet the 3:1 threshold)."
