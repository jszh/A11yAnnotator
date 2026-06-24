# case-03 — Editor toolbar: icon-only buttons (1.50:1) FAIL vs. text-labelled button PASS

## Scenario
A document-editor toolbar sits on a slate `#5b6675` bar. Three controls are icon-only —
Bold, Italic, Bulleted list — drawn with `#788294` glyphs, which is **1.50:1** against the
bar. A fourth control, "Comment," uses the **same 1.50:1 glyph** but adds a white text
label ("Comment") at 5.83:1. None of the buttons has a visible boundary.

- Bold / Italic / List — **FAIL**: the only visual cue that a control exists is the
  1.50:1 icon. The presence of the control depends on perceiving that low-contrast icon.
- Comment — **PASS**: the white "Comment" text identifies the control; the identical
  1.50:1 icon is supplemental and not required to identify presence.

## Attribute tuple
- **content-domain**: SaaS productivity / collaborative document editor
- **UI-component/pattern**: rich-text formatting toolbar (`role="toolbar"`)
- **host-language construct**: `<button aria-label>` icon-only vs. `<button>` with visible text + `<svg aria-hidden>`
- **locale/i18n**: en
- **failure-mechanism**: low-contrast icon is the sole cue of presence on icon-only buttons

## Developer persona
A front-end dev themed the toolbar to match the product's muted "focus mode" palette and
picked an on-brand grey for the icons that "looked subtle and nice" on the slate bar. They
gave every icon button a correct `aria-label`, so the a11y CI passed. The "Comment" button
kept its text because the PM insisted comments be discoverable; nobody noticed that meant
only the text button survived the low-contrast palette as identifiable.

## Element / selector carrying the issue
- FAIL: `.toolbar .icon-btn` (Bold/Italic/Bulleted list) — glyph `#788294` on `#5b6675` = 1.50:1, no text, no border.
- PASS boundary: `.toolbar .text-btn` ("Comment") — same 1.50:1 glyph, but white 5.83:1 label identifies it.

## Exact accessibility mechanism
For a low-vision user the icon glyphs nearly disappear into the slate bar; they cannot tell
that Bold/Italic/List controls are present at all — the toolbar reads as an empty grey
strip. Because the icons are the graphical objects *required to identify the presence and
function* of those controls, they must reach 3:1; at 1.50:1 they fail. The "Comment"
button is fine because the white word "Comment" (5.83:1) is sufficient to identify the
control independent of the faint flag icon. Screen-reader users hear all four button names
(each has an accessible name), so again this is a sighted-low-vision failure only.

## Expected ACT-style outcome
**failed** (icon-only buttons whose sole identifying cue is below 3:1).

## Why automated tools miss it
Every button has a valid accessible name (`aria-label` or visible text), so name/role
checks pass. axe/Lighthouse do not compute the contrast of an `<svg>` glyph against its
toolbar background, and even if a tool measured icon contrast it could not tell that the
"Comment" icon is *exempt* (its text label identifies the control) while the Bold/Italic/
List icons are *required* (they are the only cue). Distinguishing "icon required for
identification" from "icon supplemental to a text label" is the semantic judgement the SC
demands and no scanner performs.

## Citation
> **WCAG 2.2 Understanding 1.4.11 — Boundaries**
> "If a control has visible content (such as text or a sufficiently contrasting icon),
> which helps users identify the presence of the control, then a border or other indication
> of the overall boundary of the hit area is not required ... Having a visual boundary
> indicating the hit area is only required when there is no other visual way to identify the
> presence of the control – and in those cases, the boundary must have sufficient non-text
> contrast in order to pass this success criterion."

> **WCAG 2.2 Understanding 1.4.11 — Passing example "Buttons"**
> "A button which has a distinguishing indicator such as position, text style, or context
> does not need a contrasting visual indicator to show that it is a button, although some
> users are likely to identify a button with an outline that meets contrast requirements
> more easily."
