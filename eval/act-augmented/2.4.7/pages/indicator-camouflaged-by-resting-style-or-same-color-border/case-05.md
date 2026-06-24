# case-05 — RTL Arabic transit-booking form: author near-black focus ring (offset 0) swallowed by the 3px near-black field frame

## Scenario
A government public-transport agency's monthly bus-pass booking form, authored in
Arabic with `lang="ar" dir="rtl"`. Every field (full name, national ID, bus-line
select, start date, zone select) and the submit button carry a permanent
`border:3px solid #1a1a1a` near-black frame so the form looks bold and official.
The developer *did* write a focus style, but chose a near-black ring in the same
`#1a1a1a` as the resting border — `:focus-visible { outline:2px solid #1a1a1a;
outline-offset:0 }` — so on Tab the thin ring is drawn flush against the thicker
same-colour frame and is absorbed by it. The focused field is therefore not
distinguishable from the others.

## Attribute tuple
- **content-domain:** municipal transit / government services (RTL)
- **UI-component/pattern:** multi-field booking form (text/select/date + submit)
- **host-language construct:** native controls with `border:3px solid #1a1a1a` and an **author** `:focus-visible` outline in the same near-black, `outline-offset:0`
- **locale/i18n:** Arabic, `lang="ar"`, `dir="rtl"` (right-to-left)
- **failure-mechanism:** F78 mode 3 — a thinner same-colour (near-black) ring drawn against a thicker same-colour border is occluded; the ring colour is author-chosen, so the failure is renderer-independent (does not rely on the browser default ring)

## Developer persona
A government contractor localised an existing booking form for the transit
authority. The visual spec called for strong, official-looking framed inputs, so
they applied a uniform 3px near-black border to every control and the button.
Reacting to a review note about disabled outlines, they explicitly authored a
`:focus-visible` ring — but reflexively gave it the brand's near-black `#1a1a1a`
to "match the frame" and used `outline-offset:0` to keep it tight to the box.
Working in an RTL layout, they verified the form mirrored correctly and that a
focus rule existed — never that the focus ring was *distinguishable* against the
heavy near-black frame.

## Element / selector carrying the issue
`input[type=text|date], select` and `.submit` — all carry `border:3px solid
#1a1a1a` on white, with an author `:focus-visible { outline:2px solid #1a1a1a;
outline-offset:0 }`. The 2px near-black ring abuts the matching 3px near-black
border and is the only focus signal.

## Exact accessibility mechanism
Focusing a field draws the author's 2px `#1a1a1a` outline at `outline-offset:0`,
laid directly against the existing 3px solid `#1a1a1a` border. Both are the same
near-black and the resting border is thicker than the ring, so the ring is
occluded and the focused state fails the "visible" definition exactly as F78
mode 3 describes. A sighted keyboard user filling the form cannot tell which
control holds focus. Because the ring colour is **author-set** (not the browser's
default), the camouflage occurs regardless of which browser default ring would
otherwise apply — the page does not depend on a legacy near-black UA outline. The
RTL/Arabic direction does not alter the verdict — labels, roles and reading order
are correct for AT; the barrier is the camouflaged *visible* focus for sighted
keyboard and low-vision users. Including an RTL/non-Latin page broadens the aspect
beyond the ACT corpus's LTR link-only fixtures.

## Expected ACT-style outcome
**failed** (SC 2.4.7 Focus Visible). A real author outline is painted, so the
single-element focused/unfocused diff is non-zero and ACT oj04fd would *pass*; the
same-colour ring-against-thicker-same-colour-border occlusion is the uncovered
gap, independent of text direction.

## Why automated tools miss it
No `outline:none` anywhere; an author `:focus-visible` rule paints a real 2px
outline, so an edge-pixel diff on the focused field is non-zero — axe-core, WAVE
and Lighthouse pass 2.4.7. None of them compares the ring colour to the adjacent
border colour to judge distinguishability, and none reasons about whether RTL
changes anything (it does not). Concluding the 2px near-black ring is lost against
the 3px near-black border requires human visual judgment in context.

## Citation
> **Reference:** WCAG Technique F78 — "Elements have a border that occludes the
> focus indicator" example (`wcag-techniques/failures/F78.html`)
>
> **Quote (verbatim):** "In this case the focus indicator is drawn just outside the
> border, but as both are black and the border is thicker than the focus indicator,
> it no longer meets the definition of \"visible\"."
>
> **Reference:** EN 301 549 Annex C, clause C.9.2.4.7 Focus visible
> (`docs/analysis/en301549/EN301549-ANNEX-C-RELEVANT-CLAUSES.md`)
>
> **Quote (verbatim):** "Check that the web page does not fail WCAG 2.2 Success
> Criterion 2.4.7 Focus Visible according to WCAG Conformance Requirements stated in
> clause 9.6."
