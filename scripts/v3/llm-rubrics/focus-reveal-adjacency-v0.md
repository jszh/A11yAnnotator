---
id: focus-reveal-adjacency-v0
sc: 2.4.3
skill: focus-management
visionEvidence: []
---

# 2.4.3 — REVEALED CONTENT: INSERTION (v0 atomic rubric)

**Your one question:** when a control reveals content, is that content placed in the focus order
immediately after the control that revealed it — or does the user have to tab through the rest of the
page to reach what they just opened?

Nothing else is yours. Where focus lands once the content is DISMISSED again is
`focus-return-after-dismissal-v0`'s question — a separate requirement that a page can fail
independently of this one. Modal containment, resting-order meaning and redundant stops each have
their own rubric. Answer insertion and stop.

**Why you get no screenshots.** This question is about a state the resting page is not in. A panel
that is hidden at rest contributes nothing to a resting screenshot, and a still of the opened panel
cannot show what the TAB key does next. The instrument already entered that state for you and recorded
the answer; a frame would add nothing and would invite an argument from layout that this question does
not turn on.

**Division of labor (v3.2).** You do NOT activate anything. The instrument found a control that
declares it reveals something, ACTIVATED it, recorded the opened-state ring, and measured the fields
below. These are measurements, not inferences — reason from them, do not re-derive them.

**Reading the `reveal` facts on a stop.**
- `adjacent` — whether the FIRST newly-appearing tab stop is the one immediately after the opener in
  the opened-state ring.
- `focusMovedIntoRevealed` — whether activating the control moved focus into the revealed region by
  itself.
- `revealedRegionXpath` / `revealedRegionRole` — what was opened.
- A `null` means the question could not be asked on this page. **Never argue from a `null` in either
  direction.**

**How to decide.** The Understanding's non-modal example states the requirement directly: the revealed
interactive elements are inserted in the focus order immediately after the control that revealed them.
A page satisfies this EITHER by placement (`adjacent: true`) OR by moving focus into the revealed
content (`focusMovedIntoRevealed: true`). Either one is sufficient; neither is required if the other
holds.

- **REPRODUCED** — **both are false.** The user activates a control, tabs onward, and walks the rest of
  the page before reaching the content they just opened, or never reaches it at all.
- **NOT REPRODUCED** — at least one is true.

**WCAG soundness caveats (do NOT manufacture a failure these don't support):**
- **Absence is not a pass.** A page with no `reveal` facts has not been shown to have a sound revealed
  order; it has only not been measured. A complete, clean RESTING ring is evidence about a state the
  user has not entered yet, never evidence that the revealed order is sound. If the revealed-state
  question is this page's whole substance and no facts are present, PARTIAL is the honest answer.
- **Do not fail a page for the ORDER WITHIN the revealed region.** This rubric asks only where the
  region is inserted relative to its opener.
- **A modal dialog's containment is `focus-modal-containment-v0`'s**, and a trap is 2.1.2's. Both are
  separate defects with separate owners; do not fold them in here.
- **One reveal failing is enough.** If several openers were measured, a single one where both fields
  are false is a barrier — say which.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}` — summary = ONE
sentence stating the verdict; reasoning = ONE sentence giving the basis. verdict ∈ {REPRODUCED
(barrier — revealed content is neither adjacent to its opener nor focused on activation), NOT
REPRODUCED (no barrier), PARTIAL (cannot decide from the handed facts), N/A (abstain — NOT "out of
scope", that is the oracle's job)}.
