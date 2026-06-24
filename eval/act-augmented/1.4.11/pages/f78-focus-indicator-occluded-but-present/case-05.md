# case-05 — Online-banking transfer form where a 1px navy focus outline is swallowed by the field's permanent 3px same-navy border (FAIL)

## Scenario
Meridian Bank's brand guidelines mandate a heavy `3px solid #10243f` (navy) border on every form
field. The developer added an author focus indicator that is only a `1px solid #10243f` outline at
`outline-offset: 0`, drawn immediately outside the field. Because the focus outline is a thin navy line
flush against a 3px navy border of the *same* color, it is occluded — the edge merely reads as a 4px
navy edge rather than 3px, which is not a perceivable "this field is now focused" change. The caret is
also navy. The page renders with the *Amount* input focused, and Tabbing between fields yields no
discernible focus change.

## Attribute tuple
- **Content domain:** online banking / fintech (money transfer between accounts)
- **UI component / pattern:** text/number `<input>` fields and `<select>`s in a transfer form
- **Host-language construct:** `border: 3px solid #10243f` on inputs with `:focus { outline: 1px solid #10243f; outline-offset: 0; }` (author outline, same color, flush); `caret-color:#10243f`; `autofocus`
- **Locale / i18n:** en-US, USD
- **Failure mechanism:** F78 (b) — a thin focus outline the same color as a thicker element border drawn against it, so the focus indicator is swallowed by the border

## Developer persona
The bank's design system enforces a thick navy field border as a brand signature. A developer,
following the brand color palette religiously, added a focus indicator "in the brand navy to match the
fields" — a subtle 1px navy outline. They tested with high zoom on a single field and the slightly
thicker edge looked fine to them, but never tabbed through the whole form watching for whether the
*change* between fields is perceivable. Because the focus outline is the same navy as the 3px border it
abuts, the change is essentially invisible.

## Element / selector carrying the issue
`input[type=text] / input[type=number] / select` with `border: 3px solid #10243f`, versus
`input:focus, select:focus { outline: 1px solid #10243f; outline-offset: 0; }`. The focused element at
load is `#amount`.

## Exact accessibility mechanism
The page is not `outline:none`; an author focus outline IS painted on focus. But a 1px navy outline
flush against a 3px navy border of the identical color does not create a perceivable boundary — the two
navy lines fuse into a single slightly-thicker navy edge. A sighted keyboard user moving from
*To account* to *Amount* to *Memo* sees the same navy-bordered fields with no perceptible indication of
which one holds focus. The navy caret does not rescue the indication because the dominating navy field
edge gives no relative change to anchor "focus moved here." Each color individually has high contrast
(navy on white ~13:1), so this is not a contrast-ratio shortfall — it is the F78 occlusion mode: the
focus indicator is present but swallowed by a same-color thicker border, so it no longer meets the
definition of "visible."

## Expected ACT-style outcome
**failed** (SC 1.4.11, also implicates 2.4.7 / F78). A focus indicator is rendered but is occluded by
the same-color heavier border, so the focused field cannot be identified.

## Why automated tools miss it
`outline:none` is not used and an author `:focus` outline is declared, so outline-removal and
"focus-style-exists" checks pass. Each color is individually high-contrast, so any contrast calculator
on the border or the outline passes. axe-core / WAVE / Lighthouse encode no rule for "a thin focus
outline is occluded by a thicker same-color border immediately adjacent to it." Detecting it requires
rendering the focused field, observing the navy-on-navy fusion, and judging that the focus change is not
humanly perceivable — a two-state, same-color adjacency judgment no static checker performs.

## Citation
**Reference:** WCAG Technique F78 — Examples (`wcag-techniques/failures/F78.html`)
> "In this case the focus indicator is drawn just outside the border, but as both are black and the border is thicker than the focus indicator, it no longer meets the definition of \"visible\"."

**Reference:** WCAG 2.2 Understanding 1.4.11 — Text input focus style note (`wcag-understanding/non-text-contrast.html`)
> "A focus indicator is required. If the focus indicator is styled by the author, it must meet the 3:1 contrast ratio with adjacent colors."
