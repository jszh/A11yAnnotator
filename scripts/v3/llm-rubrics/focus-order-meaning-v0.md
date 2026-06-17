---
id: focus-order-meaning-v0
sc: 2.4.3
skill: focus-management
visionEvidence: [viewport, state-before, state-after]
---

# 2.4.3 — focus order (meaning & operability) (v0 atomic rubric)

**Division of labor (v3.2).** You do NOT crawl the page or drive the keyboard. The deterministic tab-order
instrument already WALKED the page and RECORDED the focus SEQUENCE — the order in which focus actually
landed, which elements were reached, and any trap. The MECHANICAL facts (what got focus, in what order)
are settled. What a checker cannot decide is the MEANING question: does that recorded sequence preserve
the meaning and operability of the content? That perceptual/semantic judgment is yours. Where a
deterministic CLAIM already disposed this obligation (e.g. a focus trap caught by the trap detector, which
is its own failure), DEFER — you judge only the meaning-preservation residue left at auto-PARTIAL.

**Judge:** following the recorded focus order, does a keyboard user encounter the interactive content in an
order that preserves meaning and lets them operate it — or does the sequence scramble the intended reading
/ operation flow? Failure looks like: focus jumping around the layout so a form is filled out of order;
focus entering a revealed dialog/menu's controls only AFTER the rest of the page (or never returning);
tabbing landing in a sequence that contradicts the visible/logical order such that completing a task
becomes confusing or impossible. NOT a barrier: a focus order that follows the logical/visible flow of the
content, where each step makes sense given the one before it, even if it is not strictly top-to-bottom (a
sensible reading order can differ from DOM order).

**Evidence handed to you:** the recorded tab-order SEQUENCE from the deterministic instrument (the ordered
list of reached elements + any trap note), the `viewport` (to relate the sequence to the visible layout),
and a `state-before`/`state-after` pair (so you can see how focus moved across a transition — e.g. into and
back out of a disclosure/dialog). Judge meaning over these; do not re-derive the order yourself.

**Interpreting the deterministic evidence (and why it is uncertain):** the instrument is an *instrument* —
it tells you the SEQUENCE, not whether the sequence is good. This obligation reached you BECAUSE the
deterministic lane recorded the order but could not judge its meaning. A note like "tab order recorded;
meaning not determinable mechanically" is the order handed over for YOUR judgment, not a clearance. CRITICAL
invariant: ABSENCE OF A DETERMINISTIC FINDING IS NOT A PASS. The trap detector firing is a separate
failure it owns; the trap detector NOT firing does not mean the order is meaningful — it only means there
was no trap. So never read "no trap / order recorded" as "order preserves meaning"; reason from the
sequence against the visible layout and the state transition, and if the sequence is too short or the
layout relationship is unclear to judge, abstain.

**WCAG soundness caveats (do NOT manufacture a failure these don't support):**
- 2.4.3 is about preserving MEANING/operability, not matching DOM source order or strict visual top-to-
  bottom — a different-but-sensible order is NOT a failure. Flag only orders that genuinely impair meaning
  or the ability to complete a task.
- A focus TRAP is a 2.1.2 concern owned by the trap detector — do not re-adjudicate a trap here.
- Whether an indicator is VISIBLE (2.4.7) and whether focus is OBSCURED (2.4.11/2.4.12) are other rubrics'
  jobs — judge only the ORDER's meaning here.
- If the recorded sequence is empty/degenerate, or you cannot relate it to the layout from the frames you
  were handed, return PARTIAL rather than guessing.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}` — summary = ONE sentence
stating the verdict; reasoning = ONE sentence giving the basis. verdict ∈ {REPRODUCED (barrier — the focus
order does not preserve meaning/operability), NOT REPRODUCED (no barrier — the order preserves meaning),
PARTIAL (cannot decide from the handed sequence/frames), N/A (abstain — NOT "out of scope", that is the
oracle's job)}.
