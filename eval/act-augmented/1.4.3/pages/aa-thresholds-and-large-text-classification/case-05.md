# case-05 — 14pt NORMAL-weight card heading at 3.36:1: the weight (not the size) decides the threshold, so 4.5:1 applies and it FAILS

## Scenario
The Glassroom team-workspace dashboard shows a "frosted glass" card whose heading "Open review
requests" is the designer's "secondary" grey `#8c8c8c`, set at **font-size: 14pt / weight 400**.
14pt = **18.667px**. The critical rule: 14pt earns the relaxed 3:1 ratio **only when it is bold**;
at weight 400 it is **normal** text, and the large-scale boundary for normal text is **18pt**.
14pt < 18pt, so this is normal-size text and the **4.5:1** threshold applies. The card sits on a
faint diagonal gradient (white → `#efefef`), giving 3.36:1 at the white end down to ~2.92:1 over
the grey end — both below 4.5:1. **FAILS**. The same heading set **bold** would be large-scale,
need only 3:1, and pass — the verdict flips entirely on font weight.

## Attribute tuple + developer persona
- **content-domain:** developer tooling / SaaS team workspace
- **UI-component/pattern:** dashboard card heading on a "frosted" gradient panel
- **host-language construct:** `<h2>` with `font-size:14pt; font-weight:400; color:#8c8c8c` over `linear-gradient(135deg,#fff,#efefef)`
- **locale/i18n:** en-US
- **failure-mechanism:** the large-scale classification turns on weight — 14pt qualifies for 3:1
  only if bold; at normal weight 14pt is below the 18pt boundary, so 4.5:1 governs and 3.36:1 fails
- **developer persona:** A designer who set the header at "14pt, heading-ish" and assumed headings
  get the relaxed 3:1 ratio, not realizing that 14pt only qualifies for 3:1 when bold and that
  their weight-400 header is therefore normal-size text requiring 4.5:1.

## Element / selector carrying the issue
- FAILS: `.panel h2` and `.panel .count` — `#8c8c8c` at 14pt / weight 400 over the gradient.
  18.667px normal → NOT large-scale → 4.5:1 required → 3.36:1…2.92:1 < 4.5:1.
- Controls: `.row` text is dark on the panel, above 4.5:1.

## Exact accessibility mechanism
The large-scale definition gives two doors to the relaxed 3:1 ratio: **≥18pt at any weight**, or
**≥14pt if bold**. This heading is 14pt but weight 400, so it takes neither door and remains normal
text bound by 4.5:1. For the low-vision reader the grey-on-near-white header at 3.36:1 is too faint
to scan reliably. The defect is invisible unless the analyst checks the *weight* and recognizes that
14pt-normal is not large-scale — a determination axe makes internally (it reports "expected 4.5:1")
but cannot complete because of the gradient.

## Expected outcome
**failed** — SC 1.4.3. The heading is 14pt at normal weight, which is not large-scale, so 4.5:1
applies; the contrast (3.36:1 best case, lower over the gradient) is below 4.5:1.

## Why automated tools miss it
Verified empirically: **axe-core 4.10.3 returns 0 violations and marks the heading `incomplete`**
("background color could not be determined due to a background gradient"); notably its own data
records `fontSize:"14.0pt (18.6667px)", fontWeight:"normal", expectedContrastRatio:"4.5:1"` — axe
correctly computes that 14pt-normal needs 4.5:1, but it abstains rather than violating because it
cannot resolve the gradient background. So no violation is emitted. The human must (1) sample the
worst-case background pixel across the faint gradient (white → `#efefef`) to confirm the contrast
never reaches 4.5:1, and (2) apply the weight-dependent large-scale rule: 14pt counts as large only
if bold, and this is weight 400, so 4.5:1 governs. A reviewer who assumes "header → 3:1" passes it
wrongly; the correct verdict is FAIL.

## Citation
> **Reference:** WCAG 2.2 Understanding SC 1.4.3 (`wcag-understanding/contrast-minimum.html`)
>
> **Quote (verbatim):** "18 point text or 14 point bold text is judged to be large enough to require
> a lower contrast ratio."
>
> **Quote (verbatim):** ""18 point" and "bold" can both have different meanings in different fonts
> but, except for very thin or unusual fonts, they should be sufficient."
>
> **Reference:** WCAG Technique G145 (`wcag-techniques/general/G145.html`)
>
> **Quote (verbatim):** "This technique relaxes the 4.5:1 contrast ratio requirement for text that
> is at least 18 point (if not bold) or at least 14 point (if bold)."
>
> **Reference:** Trusted Tester v5.1.3 — Test 13.C (`refs/trusted-tester/sc-1.4.3-contrast-minimum.md`)
>
> **Quote (verbatim):** "Normal text: **4.5:1**; Large-scale text (≥18pt or ≥14pt bold): **3:1**."
