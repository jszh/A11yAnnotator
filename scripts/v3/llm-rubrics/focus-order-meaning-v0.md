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

**CLAUSE A — PATTERNS THAT CONFORM. Check this list BEFORE writing a barrier.** Every one of these is an
order that differs from strict visual/spatial reading order and is still a PASS. Three of the four false
positives this rubric produced were exactly these shapes, each argued purely from x/y coordinates.
- **Two INDEPENDENT columns, either order.** A sidebar/aside/promo that is not part of the main column's
  task may be tabbed before or after it. *Two columns are independent only when neither is part of the
  other's task — two halves of ONE form are NOT independent, and that is the Understanding's own failing
  example (a form whose tab order skips between its marketing-data and newsletter sections).*
- **Main content before a side nav.** The Understanding lists this VERBATIM as conforming: "An HTML web
  page is created with the left hand navigation occurring in the HTML after the main body content, and
  styled with CSS to appear on the left hand side of the page. This is done to allow focus to move to the
  main body content first." Reaching the nav links after the form is the intended design, not a barrier.
- **An ORDERLESS set.** A collection of equal peers where no sequence, grouping or task is conveyed by the
  set at all — reordering its members changes nothing a reader could act on. Rearranging peers cannot destroy an order that does not
  exist. DHS Trusted Tester gives this as its "Does Not Apply" example. **Return N/A here, not NOT
  REPRODUCED** — the criterion does not apply to a set that conveys no order.
- **A tree/grid/toolbar with roving tabindex** — one Tab stop, arrows inside. The backward ring legitimately
  differs from the forward one (TT 4.F); that asymmetry alone is not a failure.
- **Positive `tabindex` that REPAIRS an order.** A page whose CSS paints controls out of DOM order and uses
  `tabindex="1..n"` to restore the visual sequence is using F44's mechanism correctly. Read the recorded
  order, not the technique.

**PRECONDITION FOR ANY BARRIER: name the relationship that breaks.** Say which two elements have a
dependency, and how the recorded order defeats it — one field is reached before the field whose value
determines its meaning, or a confirming control is reached before the choice it confirms. If your
reasoning reduces to "this does not match the visual left-to-right / top-to-bottom arrangement", you do not
have a 2.4.3 finding — that is the one argument this criterion explicitly does not make.

**CLAUSE B — THE SEQUENCE IS A RING.** The instrument walks a cycle and un-rotates it at the document
boundary, so index 0 is the true first tab stop **only when `signals.focusOrder.startAnchored` is true**.
When it is false the ring is valid evidence about ORDER but not about where the order BEGINS: never base a
failure on which element appears first or last in the list. ("X receives focus last, after Y" is a claim
about a ring; state it as adjacency — X comes after Y — or not at all.)

**CLAUSE C — MODAL CONTAINMENT.** When a modal dialog is open, focus must stay inside it; content behind it
should be inert (the Understanding's modal example). Each stop carries `modalOpen` / `insideOpenModal` /
`modalXpath`, so this is decidable from facts: **if any stop has `modalOpen: true` and
`insideOpenModal: false`, focus leaves the open dialog and that is a barrier** — whether those stops come
before or after the dialog's own controls. Note that a page may inert its main wrapper correctly and still
leak, if some element sits outside that wrapper; judge the stops you are given, not the intent. Scope:
MODAL dialogs only. A NON-modal dialog/disclosure is explicitly allowed to sit in
the page's focus order (the Understanding's non-modal example: focus goes button → dialog contents → the
element after the button), so background stops there are not a failure.

**CLAUSE D — THE RESTING RING DOES NOT COVER REVEALED CONTENT.** A panel that is `display:none` at rest
contributes NO stops, so a complete, clean recorded ring is not evidence that the revealed order is sound —
it is evidence about a state the user has not entered yet. When the page has a disclosure, menu, or dialog
trigger and the question is the order AFTER it opens, drive it: `interact_and_observe` with
`[{op:"click",xpath:trigger},{op:"press",key:"Tab"},{op:"press",key:"Tab"},…]` and read each step's
`activeAfter` to reconstruct the opened-state sequence, or `observe_state_after_activation` for the single
question of whether activation moves focus into the revealed content at all (F85). Do not infer either from
the resting ring.

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
