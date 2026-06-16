---
name: grouping-and-reading-order
description: Verify that visually-grouped sets carry list/group semantics, and that the screen-reader reading order matches the visual order. Combines static DOM checks with a virtual-SR cursor walk.
covers: cat_2 (primary)
wcag: 1.3.1 Info and Relationships (A); 1.3.2 Meaningful Sequence (A); 2.4.3 Focus Order (A)
instruments: DOM, AX tree, virtual SR cursor walk (/sr-order), vision
behavioral: partial (reading-order walk needs scripts only if content is JS-rendered)
---


# grouping-and-reading-order

## v3.2 division of labor
In Harness v3.2 you do NOT investigate or drive tools. The collector and the deterministic
runners have already measured the page and HAND you their signals + the (realism-corrected)
VSR transcript + the declared vision crops. You do not re-run `--eval`, do not call `/ax-node`,
do not drive a submit, do not "Reproduce" — the spoken sequence, the group/role facts, and the
geometry are already on the table. Your job is to **JUDGE MEANING** over that handed evidence:
does the visual grouping or the visual order carry information that the programmatic structure
fails to convey?

**DEFER where a deterministic runner already disposed an obligation.** Wherever a runner emitted
a CLAIM (e.g. it already counted grouping elements, walked the tab order, or owns a sibling SC
like 1.4.3 contrast), that obligation is settled and you are NOT asked about it. The builder hands
you only the **auto-PARTIAL residue** — the meaning calls a deterministic check cannot make.
Judge that residue; never re-litigate what a runner owns.

## What you JUDGE
Three meaning-calls over the handed VSR/tab order + viewport evidence:

- **1.3.2 Meaningful Sequence (A)** — when the *order in which content is presented* affects its
  meaning, that sequence must be programmatically determinable. Compare the handed **spoken/DOM
  sequence** against the handed **visual order** (bounding-box geometry). A divergence is a failure
  ONLY when the order conveys meaning (e.g. "Log In" handed at DOM index 19 but visually rightmost;
  a nav block spoken *after* the main content). Order that doesn't change meaning is not a 1.3.2
  failure even if DOM ≠ paint order.
- **2.4.3 Focus Order (A)** — judge the handed **tab trajectory**: does focus move through
  interactive controls in an order that preserves meaning and operability? A focus path that leaps
  out of visual/reading sequence in a way that changes meaning or breaks operation = failure.
- **1.3.1 Info and Relationships (A)** — judge whether a visually-grouped set (card grid, filter
  chips, nav cluster, steps, a result set, related options) **conveys a relationship** to the
  sighted user that the AT cannot perceive because the members are handed as flat `generic`/`none`
  nodes with no list/group container. The relationship the grouping conveys must be one that is
  **REQUIRED to be programmatically determinable** — a genuine membership/enumeration. Unrelated
  `div`s that merely sit near each other do NOT convey a 1.3.1 relationship.

Also in scope: a **modal whose background still reads** — if the handed evidence shows an open
overlay but the background is not `aria-hidden`/`inert` (the VSR cursor still walks background
nodes), the reading order under the dialog is broken (1.3.2 / 2.4.3). If the snapshot did not
have the modal open, that is auto-PARTIAL residue, not a clear.

## Evidence you are handed
- **Precomputed a11y-eval signals.** For the candidate container: its `tag`/`role`, its children
  (`tag/role` per child), and the grouping-element count (`ul,ol,[role=list],[role=group],fieldset`).
  `groupingEls:0` over flat `div` children is the grouping candidate. Plus the AX-node facts for the
  container (`role:none`/`generic`, `inTree:false` → invisible to AT). Note: absence of grouping is
  **not** an axe rule, so a clean axe run means nothing here — judge the handed structure, not the axe verdict.
- **The realism-corrected VSR transcript.** The screen-reader cursor walk gives the **spoken
  sequence** (prev/next spoken neighbors chained into the full order) and the **tab trajectory** for
  focus order. This is the order an AT user actually experiences.
- **The declared vision crops + viewport geometry.** Each member's `getBoundingClientRect()` x/y
  gives the **visual order** to diff against the spoken/tab order, and the crops show what visually
  reads as a set.
- **The `list-style:none` AT-compat trigger** (precomputed): count of `ul`/`ol` with
  `list-style-type:none`, no explicit `role`, and `<li>` children.

## WCAG soundness caveats (these STOP a false clear or a false barrier)
- **M4 — establish the obligation before calling a 1.3.1 failure.** A flat non-grouped set is a
  candidate, but only fails when the set relationship is one that is **REQUIRED to be programmatically
  determinable** (a genuine list/group whose membership conveys meaning — steps, a result set, related
  options). A handful of unrelated `div`s near each other is NOT a 1.3.1 failure. Only when the visual
  grouping **conveys a relationship** the AT cannot perceive → REPRODUCED.
- **H5 — `list-style:none` is a WebKit AT-COMPAT RISK, not a confirmed Chrome conformance failure.**
  Stripping the bullet can drop the list role in Safari + VoiceOver, while the handed Chrome AX still
  reports a list. Record a present trigger as `best-practice / AT-compat` with the WebKit caveat.
  Escalate to a 1.3.1 finding ONLY if list semantics are *necessary* for the content (a genuine
  enumeration) AND the exposure is real — never on the CSS trigger count alone. (Verified trigger
  present: Klaviyo 67/67, ESPN 111/113.)
- **1.3.2 needs meaning, not just mismatch.** Order that diverges DOM-vs-visual but does not change
  meaning is not a 1.3.2 failure.
- **Modal-not-open ≠ clear.** If the overlay couldn't be opened in the handed snapshot, the
  background-reads check is auto-PARTIAL residue, not NOT REPRODUCED.

## Output
One verdict per finding: **REPRODUCED** (flat set that conveys a relationship AT can't perceive, or
spoken/tab order diverges from visual order in a meaning-bearing way, or a live modal's background
still reads) / **NOT REPRODUCED** (proper list/group semantics and order preserves meaning) /
**PARTIAL** (grouping or order confirmed but the overlay/dynamic reading needs a live open the
snapshot didn't have) / **N/A** (the obligation isn't engaged, or a runner already owns it).
