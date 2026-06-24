# case-02 — Closing spoiler "Editor's note" floated to top on mobile via `order:-1`

## Scenario
An investigative long-read ("The Riverside Contract"). The article ends with an **Editor's note**
that intentionally spoils the conclusion — it names the leaker (Dana Whitcomb) and the outcome
(contract rescinded, two officials indicted). As a *closing* afterword this is acceptable:
the reader has already watched the reporting earn that conclusion, and the note even opens "As
detailed above," referring back to the body. In source order the note is **last**, and the
desktop render (article column + side rail) places it last. Correct.

At `max-width:680px` the layout collapses to one column and the author applied `order:-1` to the
editor's note so it "leads" on phones (the common "summary on top" pattern). Now the **spoiler
note renders above the entire article**, so a mobile reader is handed the source's identity and
the ending in the first thing they see — turning a deliberate closing recap into a misleading
lede that guts the piece. The note's own phrase "As detailed above" becomes false: nothing is
above it anymore.

## Attribute tuple
- **content-domain:** news / long-form editorial (investigative)
- **UI-component/pattern:** article + side rail with a closing `<aside>` editor's note
- **host-language construct:** flexbox `order:-1` inside `@media (max-width:680px)`
- **locale/i18n:** en (US)
- **failure-mechanism:** responsive `order` reflow promotes a meaning-bearing *closing* block to
  the lede at one breakpoint (C27 confusion; F1-style meaning change conditional on viewport)

## Developer persona
A junior front-end dev on the newsroom's web team. They copied a "make the key summary sticky at
the top on mobile" snippet from a Stack Overflow answer that used `order:-1`, and applied it to
the `.editors-note` block thinking "note = summary = should lead on small screens." They QA'd on
a desktop browser where the note correctly sits at the bottom, and never resized to phone width
to see that the spoiler now opens the article.

## Element / selector carrying the issue
`aside.editors-note` — specifically `@media (max-width:680px) .editors-note { order:-1 }`. On
desktop the note has `order:99` (renders last, correct); below 680px `order:-1` moves it before
all article content. Defect manifests ONLY below 680px.

## Exact accessibility mechanism (what AT experiences / why it fails)
The harm is conditional and cross-state. (a) A **sighted mobile / screen-magnifier reader** sees
the spoiler note first, which reorders the narrative such that the ending and the confidential
source are revealed before any of the reporting — the meaning of the article (a story you follow
to an earned conclusion) is destroyed by the reorder, and the anaphoric "As detailed above" now
points at nothing. (b) A **screen-reader user** reads the DOM in source order — article body
first, note last — i.e. the *intended* sequence, so the blind and sighted mobile experiences
diverge. The visual order at ≤680px no longer matches the meaningful source order: the order of
content here demonstrably affects its meaning (a spoiler as afterword vs. as lede), which is the
heart of 1.3.2. Linearizing/stripping CSS (Trusted Tester method) yields body→note, but the
rendered mobile order is note→body — they disagree.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
DOM order is the correct order (note last), the `<aside>` is valid and has an accessible name,
and `order:-1` is legal CSS. axe/WAVE/Lighthouse test one viewport and never render the ≤680px
state; even rendered, no automated rule can judge that a closing recap floated to the top is now
a misleading lede — that requires reading the prose, understanding it is a deliberate spoiler
meant to come last, and comparing the two rendered states. The contradiction ("As detailed
above" with nothing above) is a pure semantic inference. No DOM-vs-visual diff tool running at a
single width has any of this.

## Citation
> **WCAG Understanding 1.3.2, Intent:**
> "Content that does not meet this Success Criterion may confuse or disorient users when
> assistive technology reads the content in the wrong order, or when alternate style sheets or
> other formatting changes are applied."

(Verbatim from `wcag-understanding/meaningful-sequence.html`. The mobile media query is a
"formatting change" that applies a wrong order — spoiler before story — disorienting the reader.)

> **WCAG Techniques, C27 — "Making the DOM order match the visual order":**
> "There may also be situations where the visually presented order is necessary to the overall
> understanding of the page, and if the source order is presented differently, it may be much
> more difficult to understand."

(Verbatim from `wcag-techniques/css/C27.html`. The story's overall understanding depends on the
note coming last; presenting it first at the mobile breakpoint makes the page much harder to
understand.)
