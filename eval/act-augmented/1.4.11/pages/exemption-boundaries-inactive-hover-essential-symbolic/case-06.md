# case-06 — RTL toolbar: disabled (NA) + active-faint (FAIL) + hover-glow (NA) + symbolic ✕ (FAIL)

## Scenario
A right-to-left (Arabic) transit-authority route-map editor. One `role="toolbar"` holds four
visually-similar icon controls plus a close glyph, each demanding a DIFFERENT 1.4.11 verdict:
(A) a disabled Delete tool with a ~1.7:1 icon → NA (inactive); (B) an active Draw tool with the
same ~1.7:1 icon → FAILS (operable, must reach 3:1); (C) an active Zoom tool whose icon is ~7.6:1
with only a faint supplemental hover glow → NA; (D) a "✕" close glyph at ~2.0:1 → FAILS as
symbolic non-text content. The RTL layout puts the close glyph on the visual left, defeating
position heuristics.

## Attribute tuple
- **Content domain:** municipal transit / government editor tool
- **UI component / pattern:** APG toolbar with mixed-state icon buttons + a symbolic close glyph
- **Host-language construct:** `<button>` icons via inline `<svg>`; `disabled` attr; `:hover` box-shadow; character-entity glyph
- **Locale / i18n:** Arabic, `dir="rtl"`, `lang="ar"` (bilingual labels)
- **Failure mechanism:** per-element category judgement — same faint icon is exempt on one button and failing on another; one supplemental hover; one symbolic glyph — all on one bar

## Developer persona
A government-contractor team localized an existing LTR editor to Arabic. The designer set a single
muted icon color for the toolbar to look "calm and official," not noticing it computes to ~1.7:1
on the grey bar. They kept Delete disabled until a route is selected (correctly inactive), but the
identical-looking Draw tool is always active. The Zoom tool inherited a stronger icon from an
older sprite plus a hover glow. The "✕" close was pasted as a character to avoid an icon font.
Nobody reasoned that these visually-similar elements need four separate contrast verdicts.

## Element / selector carrying the issue
Failing: `.tool--active-fail` (active Draw icon ~1.7:1) and `.panel-close` (symbolic ✕ ~2.0:1).
Exempt/NA: `.tool[disabled]` (Delete, inactive) and `.tool--glow` (Zoom icon 7.6:1 with a
supplemental `:hover` glow).

## Exact accessibility mechanism
- **Delete (NA):** inactive components "are not required to meet contrast requirements," so the
  faint icon is exempt.
- **Draw (FAIL):** an active control's identifying visual must reach 3:1; the same ~1.7:1 icon is
  in scope here because the control is operable. A low-vision user cannot see the Draw tool exists.
- **Zoom (NA):** the icon already passes at 7.6:1; the hover glow is a supplemental author
  treatment (pointer position is the hover indicator) and need not reach 3:1.
- **Close ✕ (FAIL):** the "✕" is a text character used as a symbol → non-text content needing 3:1;
  at ~2.0:1 it fails. The RTL placement (visual left) is irrelevant to the contrast verdict but
  breaks position-based assumptions.

## Expected ACT-style outcome
**failed** (SC 1.4.11). At least two operable controls (active Draw icon and symbolic ✕) are below
3:1; the disabled tool and the supplemental hover glow are the NA boundaries on the same surface.

## Why automated tools miss it
The two ~1.7:1 icons (Delete and Draw) are pixel-identical to a scanner, which would flag or skip
both together — but only the operable Draw one fails. The scanner cannot tell the Zoom hover glow
is supplemental (not a required state), and it reads the "✕" close as plain text rather than a
graphical symbol. Four correct, differing verdicts on one bar require reasoning about
active-vs-inactive, hover-vs-state, and symbol-vs-language — none measurable. The RTL layout
additionally defeats naive "close is top-right" heuristics.

## Citation
**Reference:** WCAG 2.2 Understanding Non-text Contrast (`wcag-understanding/non-text-contrast.html`)
> "Inactive components, such as disabled controls in HTML, are not available for user interaction."

**Reference:** WCAG 2.2 Understanding Non-text Contrast (`wcag-understanding/non-text-contrast.html`)
> "The key consideration for any hover effect is that it does not cause a component itself to lose sufficient contrast against adjacent colors, or cause the visual indicators for other states, such as focus or selection, to lose sufficient contrast."
