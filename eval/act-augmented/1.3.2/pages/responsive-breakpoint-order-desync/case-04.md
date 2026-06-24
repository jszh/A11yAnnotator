# case-04 — Recipe: mobile `grid-template-areas` drops a tip into the middle of a safety sentence

## Scenario
A water-bath canning recipe ("Spiced Tomato Relish"). The **Method** is one continuous,
sentence-ordered instruction split across two prose blocks (`.m1`, `.m2`) that must be read
consecutively, because a critical safety instruction spans the join: `.m1` ends "…ladle the hot
relish into sterilized jars, leaving 1 cm of headspace, **then**" and `.m2` begins "**do NOT seal
the jars until the headspace has cooled to room temperature**…". A short, unrelated **Tip** (about
dating jar lids) sits in a side cell. Source order is `m1, m2, tip`. On desktop a two-column grid
(`"m1 tip" / "m2 tip"`) renders the two method halves stacked on the left, reading naturally
consecutive — correct and safe.

At `max-width:620px` the author redefines `grid-template-areas` to a single column ordered
`"m1" / "tip" / "m2"` — explicitly to "break up the long method with a tip in the middle." Source
order is unchanged, but the grid now **interleaves the unrelated tip between the two halves of the
safety sentence**, so a phone reader sees: "…leaving 1 cm of headspace, then" → [Tip: write the
date on each lid…] → "do NOT seal the jars until cooled." The instruction is fractured by an
interruption; a hurried cook may read the first half ending in "then," act, and seal hot jars —
the precise hazard the sentence warns against.

## Attribute tuple
- **content-domain:** recipe / food (home canning)
- **UI-component/pattern:** recipe method block with a side "Tip" callout, laid out via CSS Grid
- **host-language construct:** `grid-template-areas` redefined inside `@media (max-width:620px)`
- **locale/i18n:** en; metric units (cm)
- **failure-mechanism:** responsive grid-area reordering interleaves unrelated content into a
  meaning-bearing sequence at one breakpoint (C27; F1-style meaning change conditional on viewport)

## Developer persona
A food blogger using a magazine-style WordPress theme who edits the page template directly. They
felt the method paragraph "looked like a wall of text on phones" and remembered grid-template-areas
lets you rearrange cells per breakpoint, so they moved the `tip` area between `m1` and `m2` on
mobile for visual rhythm. They did not realize `m1` and `m2` are two halves of a single sentence —
on their wide editor preview the method reads correctly down the left column, so it looked fine.

## Element / selector carrying the issue
`.method-grid` — `@media (max-width:620px) .method-grid { grid-template-areas: "m1" "tip" "m2" }`.
The DOM order (`m1`, `m2`, `tip`) is correct; the interleave is purely a mobile grid-placement
artifact below 620px.

## Exact accessibility mechanism (what AT experiences / why it fails)
Viewport-conditional, cross-state desync. (a) A **sighted mobile / screen-magnifier user** reads
the rendered grid order `m1 → tip → m2`, so the safety sentence is split by an unrelated tip; the
sequence the meaning depends on (one continuous "do this, then do NOT do that until cooled"
instruction) is broken, and the partial first half ending in "then" reads as a complete, dangerous
instruction. (b) A **screen-reader user** reads the DOM in source order `m1 → m2 → tip`, getting
the *intact* safety sentence followed by the tip — so the blind and sighted experiences of the
same phone diverge. The order is clearly meaningful (a single instruction must not be interrupted),
and at ≤620px the visual order diverges from the meaningful source order. Per the Trusted Tester
linearization method, stripping CSS yields `m1 → m2 → tip` (safe), but the rendered mobile order is
`m1 → tip → m2` (broken) — they disagree, so it fails.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
Source/DOM order is correct, all elements are valid, the tip has an accessible name, and
`grid-template-areas` is legal CSS. axe/WAVE/Lighthouse test one viewport and never render the
≤620px single-column grid; even rendered, no rule can detect that the tip lands between two halves
of one continuous sentence — that requires reading the prose, recognizing `.m1` ends mid-sentence
("…then") and `.m2` completes it, and judging that an interruption changes the meaning. The defect
exists only in the rendered grid placement at one width; the DOM is identical across breakpoints.
This is exactly the human semantic + multi-viewport reasoning a DOM-vs-visual tool at a single
width cannot do.

## Citation
> **WCAG Understanding 1.3.2, Examples:**
> "In a multi-column document, the linear presentation of the content flows from the top of a
> column to the bottom of the column, then to the top of the next column."

(Verbatim from `wcag-understanding/meaningful-sequence.html`. The desktop grid preserves this
column flow so the method reads consecutively; the mobile grid-template-areas interleaves an
unrelated cell into that flow, breaking the linear sequence the meaning depends on.)

> **WCAG Techniques, F1 — Description:**
> "Thus, it is important not to rely on CSS to visually position content in a specific sequence if
> this sequence results in a meaning that is different from the programmatically determined reading
> order."

(Verbatim from `wcag-techniques/failures/F1.html`. At ≤620px the CSS grid positions the tip into a
visual sequence whose meaning — a fractured, unsafe instruction — differs from the intact
programmatic reading order, the F1 failure conditioned on the breakpoint.)
