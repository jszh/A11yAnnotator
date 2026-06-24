# case-05 — Recipe: hover-only metric conversion, but identical text in a table below (PASS, "available elsewhere")

## Scenario
"Folded & Floured" food blog, "Brown Butter Banana Bread" recipe. Each ingredient amount has a
dashed underline; hovering it pops a JS tooltip with the metric conversion (e.g. "2 cups" →
"240 g"). The reveal is pointer-only — `mouseover`/`mouseout`, the trigger spans are not
focusable, no focus handler. In isolation that mirrors case-03's failure. The decisive
difference: every conversion shown on hover is ALSO printed, verbatim and as plain visible
text, in a "Metric conversions" `<table>` lower on the page that is fully keyboard- and
screen-reader-reachable. The hover is a convenience duplicate, not the sole source — so it
PASSES via the "available elsewhere on the page" allowance.

## Attribute tuple
- **content-domain:** food / recipe blogging
- **UI-component/pattern:** inline measurement tooltip (hover-reveal) + redundant conversions table
- **host-language construct:** `<span class="amt" data-metric>` + JS `mouseover`; equivalent data in a semantic `<table>`
- **locale/i18n:** en-US recipe with metric (g/ml) conversions
- **failure-mechanism (averted):** pointer-only reveal, BUT same info present as visible text elsewhere → not a failure

## Developer persona
A food blogger on a custom theme added "hover for grams" because readers kept asking for metric
amounts but the blogger didn't want to clutter the ingredient list. Being careful, the blogger
ALSO kept the full conversions table they'd always published at the bottom of every recipe. The
hover is just sugar on top; the table remains the canonical, keyboard-accessible source. This is
the deliberate boundary variant: a pointer-only reveal that nonetheless passes because nothing
essential is keyboard-inaccessible.

## Element / selector carrying the issue (here: the reason it does NOT fail)
`span.amt` (e.g. the "2 cups" flour amount) — pointer-only `mouseover` reveal of `data-metric`.
The redundant equivalent is `table.metric` (labelled by `#metric-h` "Metric conversions"),
which lists every conversion as visible text.

## Exact accessibility mechanism
A keyboard user cannot trigger the hover tooltips (the `.amt` spans are not focusable and the
reveal is bound only to `mouseover`). However, when they Tab/read down the page they reach the
"Metric conversions" table, an ordinary semantic `<table>` with `<th scope="col">` headers,
fully exposed to keyboard and screen-reader users, listing the identical conversions (226 g
butter, 240 g flour, 5 ml vanilla, …). Per Trusted Tester Test 4.A, an element that does not
provide essential information via keyboard still passes if that information is available
elsewhere on the page as text — and it is, verbatim. No functionality is lost (the tooltips
carry no action, only data). SC 2.1.1 is met. Verdict: **PASSED**.

## Expected ACT-style outcome
**passed** — SC 2.1.1 Keyboard (Level A). A pointer-only reveal exists, but the information it
shows is duplicated as keyboard-accessible visible text elsewhere on the page, satisfying the
"available elsewhere" allowance.

## Why automated tools miss it
An automated tool would also not flag this page — but for the wrong reason and with no
understanding. axe/WAVE/Lighthouse never read the tooltip text, never read the table, and have
no mechanism to reason that one is a redundant copy of the other; they simply see well-formed
markup. The judgment that makes this a genuine PASS — that the hover content is merely
redundant AND that an equivalent keyboard-accessible text source exists on the same page — is
exactly the human reasoning the SC's "available elsewhere" clause demands. It is included as
the boundary case that distinguishes a real failure (case-03/04) from an acceptable
pointer-only convenience.

## Citation
> **Reference:** Trusted Tester v5.1.3 — SC 2.1.1, Test 4.A *How to Test* and *Evaluate Results*
> (`refs/trusted-tester/sc-2.1.1-keyboard.md`)
>
> **Quote (verbatim):** "If an element does not provide access to essential information via
> keyboard, determine whether the information is available elsewhere on the page (e.g., as
> text)."
>
> **Quote (verbatim, Evaluate Results):** "PASS if BOTH true: … 2. All essential information
> can be accessed via keyboard OR is available elsewhere on the page."
>
> **Reference:** Trusted Tester v5.1.3 — SC 2.1.1, *Notes*
> (`refs/trusted-tester/sc-2.1.1-keyboard.md`)
>
> **Quote (verbatim):** "Title/tooltip information that is **not** essential does not require
> keyboard access."
