# case-04 — Two inputs on one panel: which adjacency is meaningful flips the verdict (one FAIL, one PASS)

## Scenario
"Harbor & Vale" home-insurance quote wizard, Step 3. Both inputs sit on the **same lavender
panel** (`#DDE3F0`). The verdict for each depends entirely on choosing the meaningful adjacency:

- **Input A — "Estimated home value":** white interior (`#FFFFFF`), steel-blue border
  (`#6E8FB5`). Border-vs-interior = 3.36:1 (a tool measuring the inner edge says PASS). BUT the
  white interior vs the lavender panel is **1.29:1** — the field is nearly invisible against the
  panel, so the *border* is the identifying cue, and border-vs-panel is only **2.61:1**. → **FAIL**.
- **Input B — "Annual policy budget":** muted-violet interior (`#6E5A86`), grape border
  (`#7A4A8A`). Border-vs-interior = 1.09:1 (a tool measuring the inner edge says FAIL). BUT the
  violet fill vs the lavender panel is **4.70:1** — the control is clearly identifiable by its
  fill, and the border is decorative. → **PASS**.

Same panel, opposite verdicts, and a literal per-edge tool gets BOTH backwards.

## Attribute tuple
- **content-domain:** insurance quote wizard
- **UI-component/pattern:** two text inputs on a single colored form panel, with conflicting border/interior adjacencies
- **host-language construct:** `<input>` with distinct `background` + `border` colors inside a `#DDE3F0` panel
- **locale/i18n:** en-US
- **failure-mechanism:** input A fails because its only viable cue (the border) is below 3:1 against the panel; the meaningful interior-vs-panel adjacency is 1.29:1

## Developer persona
A designer themed both inputs from the same brand palette without checking each against the
panel they actually sit on. They reasoned per-control ("the value field's border pops against
its white inside; the budget field's border blends into its violet inside, so I'll keep the
border subtle there") — i.e. they measured each border against the wrong neighbor. The verdict
that matters (each fill vs the shared panel) was never considered.

## Element / selector carrying the issue
`.field.input-a input` (FAIL) — white interior on lavender panel at 1.29:1, with a `#6E8FB5`
border that is only 2.61:1 against the panel. Contrast PASS control: `.field.input-b input`,
whose `#6E5A86` fill is 4.70:1 against the panel.

## Exact accessibility mechanism
A low-vision user sees the violet "Annual policy budget" field clearly (its fill is 4.70:1
against the lavender panel) — identifiable regardless of its near-invisible border. The white
"Estimated home value" field, however, is barely distinguishable from the lavender panel
(1.29:1); its only potential cue is the steel-blue border, which is subsumed toward the panel
at 2.61:1, below 3:1. The user struggles to perceive that an input is there or where its edges
are. The correct test for each control is "the meaningful adjacency that identifies it": for A
that is interior-vs-panel (fails, and the fallback border also fails); for B that is
fill-vs-panel (passes). Verdicts: A **FAIL**, B **PASS**.

## Expected ACT-style outcome
**failed** — SC 1.4.11 Non-text Contrast (Level AA). The page fails because input A's
identifying visual information does not reach 3:1 against its adjacent color (the panel); input
B on the same panel passes, which is what makes the "choose the meaningful adjacency" judgment
load-bearing.

## Why automated tools miss it
A per-edge checker measures each declared border against an adjacent color and is fooled in
opposite directions: for input A it picks border-vs-interior (3.36:1) and reports PASS (wrong);
for input B it picks border-vs-interior (1.09:1) and reports FAIL (wrong). It never performs
the interpretive step of deciding WHICH adjacency actually identifies each control on the
shared panel (interior/fill-vs-panel). Only a human reasoning about the meaningful comparison
surface gets both right.

## Citation
> **Reference:** WCAG 2.2 Understanding SC 1.4.11 Non-text Contrast — "Adjacent colors"
> (`wcag-understanding/non-text-contrast.html`)
>
> **Quote (verbatim):** "For user interface components 'adjacent colors' means the colors
> adjacent to the component. For example, if an input has a white internal background, dark
> border, and white external background the 'adjacent color' to the component would be the
> white external background."
>
> **Quote (verbatim, Intent):** "Unless the control is inactive, any visual information
> provided that is necessary for a user to identify that a control is present and how to
> operate it must have a minimum 3:1 contrast ratio with the adjacent colors."
