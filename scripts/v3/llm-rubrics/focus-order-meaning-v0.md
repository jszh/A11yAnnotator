---
id: focus-order-meaning-v0
sc: 2.4.3
skill: focus-management
visionEvidence: [viewport]
---

# 2.4.3 — focus order (meaning of the resting sequence) (v0 atomic rubric)

**Your one question:** following the recorded tab sequence, does a keyboard user encounter the
content in an order that preserves its meaning and lets them complete the task — or does the sequence
scramble the intended reading/operation flow?

Four other 2.4.3 defects have their own rubrics and are NOT yours. Do not adjudicate them here, and do
not let them influence this verdict:
- focus LEAVING an open modal dialog → `focus-modal-containment-v0`
- revealed content not inserted after the control that revealed it → `focus-reveal-adjacency-v0`
- focus not returned to the opener after revealed content is dismissed → `focus-return-after-dismissal-v0`
- a wrapper or container stop that makes the sequence confusing → `focus-redundant-stop-v0`

Each of those is independently true or false, is measured separately, and reaches its own judge. Your
verdict is about the ORDER of the stops you were handed, and nothing else. Saying "the order is fine"
does not clear those defects, and it is not read as clearing them.

**Division of labor (v3.2).** You do NOT crawl the page or drive the keyboard. The deterministic
tab-order instrument already WALKED the page and RECORDED the focus SEQUENCE — the order in which
focus actually landed, and which elements were reached. The MECHANICAL facts are settled. What a
checker cannot decide is the MEANING question, and that is yours.

**Evidence handed to you:** the recorded tab-order SEQUENCE (each stop with its on-page rect and
accessible name), the `viewport` so you can relate the sequence to the visible layout, and the page's
headings/landmarks so you can name the REGION a stop lands in. Judge meaning over these; do not
re-derive the order yourself.

**Interpreting the deterministic evidence (and why it is uncertain):** the instrument is an
*instrument* — it tells you the SEQUENCE, not whether the sequence is good. This obligation reached
you BECAUSE the deterministic lane recorded the order but could not judge its meaning. A note like
"tab order recorded; meaning not determinable mechanically" is the order handed over for YOUR
judgment, not a clearance. CRITICAL invariant: ABSENCE OF A DETERMINISTIC FINDING IS NOT A PASS. So
never read "order recorded, nothing flagged" as "order preserves meaning"; reason from the sequence
against the visible layout, and if the sequence is too short or the layout relationship is unclear to
judge, abstain.

**CLAUSE A — PATTERNS THAT CONFORM. Check this list BEFORE writing a barrier.** Every one of these is
an order that differs from strict visual/spatial reading order and is still a PASS. The false
positives this rubric produces are these shapes, argued purely from x/y coordinates.
- **Two INDEPENDENT columns, either order.** A sidebar/aside/promo that is not part of the main
  column's task may be tabbed before or after it. *Two columns are independent only when neither is
  part of the other's task — two halves of ONE form are NOT independent, and that is the
  Understanding's own failing example (a form whose tab order skips between its marketing-data and
  newsletter sections).*
  What this bullet permits is **whole-column order**: all of one column, then all of the other. It does
  **not** license *alternating* between them. An order that ping-pongs between two parallel groups,
  taking one member from each in turn, keeps neither group intact — the user is moved off a task they
  have not finished, repeatedly. If the two groups are parallel instances of one task, that
  interleaving is the failure, whatever technique produced it (source order, CSS, or positive
  `tabindex`).
- **Main content before a side nav.** The Understanding lists this VERBATIM as conforming: "An HTML web
  page is created with the left hand navigation occurring in the HTML after the main body content, and
  styled with CSS to appear on the left hand side of the page. This is done to allow focus to move to
  the main body content first." Reaching the nav links after the form is the intended design, not a
  barrier.
- **An ORDERLESS set.** A collection of equal peers where no sequence, grouping or task is conveyed by
  the set at all — reordering its members changes nothing a reader could act on. Rearranging peers
  cannot destroy an order that does not exist. DHS Trusted Tester gives this as its "Does Not Apply"
  example. **Return N/A here, not NOT REPRODUCED** — the criterion does not apply to a set that conveys
  no order.
  *Scope this narrowly.* A set laid out in a **two-dimensional arrangement** is NOT orderless: the
  arrangement itself is the relationship, and the members' positions within it are information. Such a
  set CONFORMS when the recorded order is a **systematic traversal** of it — every row in turn, or
  every column in turn, or an equivalent consistent walk — and the Understanding accepts *any one* of
  those, so do not fail a page for choosing the traversal you did not expect. It FAILS when the order
  follows **none** of them: a sequence that jumps between distant positions with no consistent rule
  destroys the arrangement's meaning even though no two individual members depend on each other. The
  same applies when each member carries its own position marker — a printed index, a coordinate, a step
  number: the order those markers state is the page's own declared order.
  **PRECEDENCE — a declared order OUTRANKS the systematic-traversal licence, it is not weighed against
  it.** The licence exists because an ORDERLESS 2-D set has no preferred traversal, so no traversal of it
  can be wrong. A set whose members are numbered has a preferred traversal and prints it, so "the walk was
  systematic" answers a question that set is not asking: a consistent walk that contradicts the printed
  sequence is out of order BY THE PAGE'S OWN DECLARATION, and being consistent about it does not repair
  the mismatch — it only makes the mismatch uniform. Decide the markers FIRST; reach for the licence only
  once you have established the set carries none.
  When `signals.focusOrder.intrinsicOrdinals` is present this is ANSWERED FOR YOU and you do not have to
  read the numbers off the labels yourself: it means the stops carry DISTINCT numbers, `visualOrdinals`
  shows those numbers ascending in the page's visual reading order, and `navOrdinals` shows the recorded
  ring departing from them. Do not re-derive it, and do not clear such a page on the licence above. It is
  still a fact and not a verdict — the judgment left to you is whether departing from the page's own
  declared sequence destroys meaning or operability for a keyboard user here.
- **A tree/grid/toolbar with roving tabindex** — one Tab stop, arrows inside. The backward ring
  legitimately differs from the forward one (TT 4.F); that asymmetry alone is not a failure.
- **Positive `tabindex` that REPAIRS an order.** A page whose CSS paints controls out of DOM order and
  uses `tabindex="1..n"` to restore the visual sequence is using F44's mechanism correctly. Read the
  recorded order, not the technique.

**PRECONDITION FOR ANY BARRIER: name the relationship that breaks.** Say what the recorded order
defeats. A pairwise dependency between two named elements is the clearest form — one field is reached
before the field whose value determines its meaning, a confirming control is reached before the choice
it confirms — but it is *one* way to establish a barrier, not the only one. A **set-level** property
will do just as well: an arrangement the order fails to traverse systematically, or a group the order
abandons part-way through. What is NOT sufficient, and remains the one argument this criterion
explicitly does not make, is "this does not match the visual left-to-right / top-to-bottom
arrangement" on its own.

**Reading `visualOrderDivergence` on a stop.** Some stops carry this field from the divergence
detector, which clusters the stops into visual columns and flags a stop reached *earlier* than a stop
that sits below it in the same column. It is UNCALIBRATED TRIAGE, not a verdict, and it is directional
evidence in both directions: a systematic column-by-column or row-by-row traversal of a 2-D
arrangement produces **none** of these, so their ABSENCE supports the systematic-traversal reading in
Clause A, while several of them spread across a set is the fingerprint of the scatter that clause
excludes. That absence supports the traversal reading ONLY where the licence itself applies: on a set
carrying its own position markers a transposed-but-systematic walk also produces none of these, so read
the markers, not the silence. Never fail a page on this field alone — the column model cannot resolve right-to-left,
masonry, or z-ordered layouts from geometry.

**CLAUSE B — THE SEQUENCE IS A RING.** The instrument walks a cycle and un-rotates it at the document
boundary, so index 0 is the true first tab stop **only when `signals.focusOrder.startAnchored` is
true**. When it is false the ring is valid evidence about ORDER but not about where the order BEGINS:
never base a failure on which element appears first or last in the list. ("X receives focus last, after
Y" is a claim about a ring; state it as adjacency — X comes after Y — or not at all.)

**WCAG soundness caveats (do NOT manufacture a failure these don't support):**
- 2.4.3 is about preserving MEANING/operability, not matching DOM source order or strict visual
  top-to-bottom — a different-but-sensible order is NOT a failure. Flag only orders that genuinely
  impair meaning or the ability to complete a task.
- **A RESTING ring says nothing about a revealed state.** A panel that is `display:none` at rest
  contributes no stops, so a complete, clean sequence is not evidence that the page's revealed order is
  sound. That question is measured separately and judged elsewhere — do not clear it here, and do not
  flag it here either.
- A focus TRAP is a 2.1.2 concern owned by the trap detector — do not re-adjudicate a trap here.
- Whether an indicator is VISIBLE (2.4.7) and whether focus is OBSCURED (2.4.11/2.4.12) are other
  rubrics' jobs — judge only the ORDER's meaning here.
- If the recorded sequence is empty/degenerate, or you cannot relate it to the layout from the frame
  you were handed, return PARTIAL rather than guessing.
- `signals.focusOrder.partial: true` means the instrument lane hit its wall-clock cap and the sequence
  was salvaged. The ORDER is still sound evidence — the walk itself completed before the cut — so judge
  it normally.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}` — summary = ONE
sentence stating the verdict; reasoning = ONE sentence giving the basis. verdict ∈ {REPRODUCED
(barrier — the recorded order does not preserve meaning/operability), NOT REPRODUCED (no barrier — the
order preserves meaning), PARTIAL (cannot decide from the handed sequence/frame), N/A (abstain — NOT
"out of scope", that is the oracle's job)}.
