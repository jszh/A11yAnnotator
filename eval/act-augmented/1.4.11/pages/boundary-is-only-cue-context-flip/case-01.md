# case-01 — Twin civic search boxes: labelled vs. ghost, identical 2.32:1 border

## Scenario
A municipal "Public Records" page offers two search controls side by side. The left
control ("Find by address") has a visible `<label>` "Search by address" plus a
placeholder. The right control ("Have a case number?") is a bare white box with no
visible label, no placeholder, no icon, and no adjacent text. **Both inputs carry the
exact same border: `2px solid #AAAAAA`, which is 2.32:1 against the white page.**

The verdict flips on the SAME number:
- Left input — **PASS**: the visible label identifies the control, so the low-contrast
  border is *not the only cue* and is therefore not subject to non-text contrast.
- Right input — **FAIL**: the 2.32:1 border is the *only* visual way to know the control
  is there, so it is required to reach 3:1 — and does not.

## Attribute tuple
- **content-domain**: government / civic services portal (permits & property records)
- **UI-component/pattern**: paired site search inputs
- **host-language construct**: `<input type="search">` with `<label for>` vs. `aria-label`
- **locale/i18n**: en
- **failure-mechanism**: low-contrast boundary that is the sole identifying cue

## Developer persona
A city-IT contractor built the address search with a proper label, then was asked late
to "add a quick case-number jump box like the one Records uses." They copied the same
`.faint-search` class but dropped the visible label to "save vertical space," adding only
`aria-label="Case number"` because the linter complained about an unlabelled field. The
linter went quiet; the visual cue never came back.

## Element / selector carrying the issue
- FAIL: `input#case.faint-search` (right column) — border `#AAAAAA` (2.32:1) is the only cue.
- PASS boundary: `input#addr.faint-search` (left column) — same border, but `label[for="addr"]` identifies it.

## Exact accessibility mechanism
A sighted user with moderately low vision relies on contrast to perceive that a control
exists. For the right box, nothing but the 2.32:1 grey rectangle distinguishes "an input
is here" from "blank card." At that contrast the rectangle can disappear for a low-vision
user, leaving the field invisible — they cannot tell there is anywhere to type the case
number. A screen-reader user is unaffected (the `aria-label` gives the control a name),
which is exactly why this is a *visual* low-vision failure, not a name/role failure. On
the left box the literal text "Search by address" tells any sighted user a control is
present regardless of the border, so the identical border is exempt.

## Expected ACT-style outcome
**failed** (the page contains a required-but-insufficient boundary on the case-number input).

## Why automated tools miss it
axe-core and Lighthouse do not measure non-text/border contrast for inputs at all, so
they never flag the right box. A hypothetical "measure every border" checker would do the
*opposite* wrong thing: it would flag BOTH boxes (including the labelled left one, which
passes) because it cannot perform the "is this border the only cue?" judgement. Neither
behaviour matches the correct answer. The discriminator — "does any *other* visual cue
identify this control?" — requires a human to read the label text and reason about the
whole component. Both inputs also have a valid accessible name, so name/label checks
(the only thing a linter could catch here) are green.

## Citation
> **WCAG 2.2 Understanding 1.4.11 — Boundaries**
> "This success criterion does not require that controls have a visual boundary indicating
> the hit area. If a control has visible content (such as text or a sufficiently
> contrasting icon), which helps users identify the presence of the control, then a border
> or other indication of the overall boundary of the hit area is not required, as is
> therefore not subject to non-text contrast requirements. Having a visual boundary
> indicating the hit area is only required when there is no other visual way to identify
> the presence of the control – and in those cases, the boundary must have sufficient
> non-text contrast in order to pass this success criterion."

> **WCAG 2.2 Understanding 1.4.11 — Failing example "Text input - no label or other indication, low contrast border"**
> "The text input lacks any form of label to hint at its presence. The border color
> (`#AAA`) has contrast lower than 3:1 against its adjacent white background. As the border
> here is required to identify the presence of the input, it must have sufficient contrast
> to pass this criterion."
