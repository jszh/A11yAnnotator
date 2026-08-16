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
  What this bullet permits is **whole-column order**: all of one column, then all of the other. It does
  **not** license *alternating* between them. An order that ping-pongs between two parallel groups, taking
  one member from each in turn, keeps neither group intact — the user is moved off a task they have not
  finished, repeatedly. If the two groups are parallel instances of one task, that interleaving is the
  failure, whatever technique produced it (source order, CSS, or positive `tabindex`).
- **Main content before a side nav.** The Understanding lists this VERBATIM as conforming: "An HTML web
  page is created with the left hand navigation occurring in the HTML after the main body content, and
  styled with CSS to appear on the left hand side of the page. This is done to allow focus to move to the
  main body content first." Reaching the nav links after the form is the intended design, not a barrier.
- **An ORDERLESS set.** A collection of equal peers where no sequence, grouping or task is conveyed by the
  set at all — reordering its members changes nothing a reader could act on. Rearranging peers cannot destroy an order that does not
  exist. DHS Trusted Tester gives this as its "Does Not Apply" example. **Return N/A here, not NOT
  REPRODUCED** — the criterion does not apply to a set that conveys no order.
  *Scope this narrowly.* A set laid out in a **two-dimensional arrangement** is NOT orderless: the
  arrangement itself is the relationship, and the members' positions within it are information. Such a set
  CONFORMS when the recorded order is a **systematic traversal** of it — every row in turn, or every column
  in turn, or an equivalent consistent walk — and the Understanding accepts *any one* of those, so do not
  fail a page for choosing the traversal you did not expect. It FAILS when the order follows **none** of
  them: a sequence that jumps between distant positions with no consistent rule destroys the arrangement's
  meaning even though no two individual members depend on each other. The same applies when each member
  carries its own position marker — a printed index, a coordinate, a step number: the order those markers
  state is the page's own declared order.
- **A tree/grid/toolbar with roving tabindex** — one Tab stop, arrows inside. The backward ring legitimately
  differs from the forward one (TT 4.F); that asymmetry alone is not a failure.
- **Positive `tabindex` that REPAIRS an order.** A page whose CSS paints controls out of DOM order and uses
  `tabindex="1..n"` to restore the visual sequence is using F44's mechanism correctly. Read the recorded
  order, not the technique.

**PRECONDITION FOR ANY BARRIER: name the relationship that breaks.** Say what the recorded order defeats.
A pairwise dependency between two named elements is the clearest form — one field is reached before the
field whose value determines its meaning, a confirming control is reached before the choice it confirms —
but it is *one* way to establish a barrier, not the only one. A **set-level** property will do just as
well: an arrangement the order fails to traverse systematically, a group the order abandons part-way
through, a revealed region the order never places next to what revealed it. What is NOT sufficient, and
remains the one argument this criterion explicitly does not make, is "this does not match the visual
left-to-right / top-to-bottom arrangement" on its own.

**Reading `visualOrderDivergence` on a stop.** Some stops carry this field from the divergence detector,
which clusters the stops into visual columns and flags a stop reached *earlier* than a stop that sits below
it in the same column. It is UNCALIBRATED TRIAGE, not a verdict, and it is directional evidence in both
directions: a systematic column-by-column or row-by-row traversal of a 2-D arrangement produces **none** of
these, so their ABSENCE supports the systematic-traversal reading in Clause A, while several of them spread
across a set is the fingerprint of the scatter that clause excludes. Never fail a page on this field alone
— the column model cannot resolve right-to-left, masonry, or z-ordered layouts from geometry.

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
element after the button), so background stops there are not a failure. `modalOpen` is gated on the dialog
being RENDERED, not merely declared: markup that carries the modal attributes while sitting inside a hidden
container reports nothing here, so a stop that does carry `modalOpen` means a modal really is on screen.
Correspondingly, the ABSENCE of `modalOpen` is not proof that nothing modal is happening — a region made
modal purely by visual means (an overlay/scrim with no dialog semantics) declares nothing to read, and if
the frames show stops sitting underneath such an overlay, judge that from the frames.

**CLAUSE D — REVEALED CONTENT: THE `reveal` FACTS ON A STOP.** A panel that is `display:none` at rest
contributes NO stops, so a complete, clean recorded ring is not evidence that the revealed order is sound —
it is evidence about a state the user has not entered yet. Where the page has a control that declares it
reveals something, the instrument has already ACTIVATED it and recorded the opened state, and that stop
carries a `reveal` object. These are measurements, not inferences; reason from them, do not re-derive them.

*What the fields mean.* `adjacent` — whether the FIRST newly-appearing tab stop is the one immediately
after the opener in the opened-state ring. `focusMovedIntoRevealed` — whether activating the control moved
focus into the revealed region by itself. `regionHiddenAfterDismiss` — whether the region actually went
away again when the instrument dismissed it (Escape, else a close-named control inside the region).
`returnedToOpener` — where focus was once it had. `openerStillPresent` — whether the control that opened it
even exists any more afterwards. A `null` means the question could not be asked on this page; never argue
from a `null` in either direction.

*How to decide from them.* Two independent requirements, and a page can fail either:
- **Insertion.** The Understanding's non-modal example states the requirement directly: the revealed
  interactive elements are inserted in the focus order immediately after the control that revealed them.
  A page satisfies this EITHER by placement (`adjacent: true`) OR by moving focus into the revealed content
  (`focusMovedIntoRevealed: true`) — either one is enough, and neither is required if the other holds. It is
  a BARRIER only when **both are false**: the user activates a control, tabs onward, and walks the rest of
  the page before reaching — or never reaches — the content they just opened.
- **Return.** DHS Trusted Tester 4.F step 2b requires checking the focus order to, from, AND within revealed
  content; the *from* half is where focus lands once the content is gone. It is a BARRIER when
  `regionHiddenAfterDismiss: true` **and** `returnedToOpener: false` **and** `openerStillPresent: true` —
  focus was dumped somewhere unrelated (commonly the document body, which restarts the whole ring) instead
  of back where the user was. It is NOT a barrier when `openerStillPresent` is false: if the action removed
  its own trigger, moving focus to a logical neighbour is the documented correct behaviour. It is NOT a
  barrier when `regionHiddenAfterDismiss` is false or absent — nothing was dismissed, so nothing is owed.

*Absence is not a pass.* A page with no `reveal` object anywhere has not been shown to have a sound revealed
order; it has only not been measured. Do not read a missing `reveal` as evidence of conformance, and do not
manufacture one — if the revealed-state question is the page's whole substance and no facts are present,
PARTIAL is the honest answer.

**CLAUSE E — A STOP THAT SHOULD NOT BE THERE.** 2.4.3 covers more than the ORDER of the stops. The
Understanding's own failure example is a stop that makes the sequence confusing rather than one that is out
of sequence: a control that appears to receive focus more than once because a focusable element is nested
inside another, written there as `<div tabindex="0"><button>…</button></div>`. A page with that shape
records a sequence in perfect visual order, so "does this order preserve meaning" answers yes and the defect
is missed. Ask the second question too.

Two pre-computed facts may appear on a stop:
- `wrapsNextStop` — the very next stop is a DESCENDANT of this one, so the user Tabs onto a wrapper and then
  onto the control inside it. `rectEnclosesNextStop` and `nameCoversNextStop` say whether it also *looks*
  and *announces* like the same thing twice. All three together are the Understanding's example exactly:
  one control, reached twice, with no way to tell the two stops apart — a barrier.
- `genericContainerStop` — this stop is a layout element that is in the ring only because it carries an
  explicit `tabindex`, and declares no interactive role. **On its own this is NOT a failure.** Static
  content is explicitly permitted to be focusable; a focusable scroll region, a labelled group that owns its
  own controls, and a heading-like marker introducing a set of links are all legitimate, and extra stops
  that are merely tedious do not impede operation. It becomes a barrier when it INTERRUPTS a sequence the
  user is working through, which `interruptsCoupledSequence` reports: the stop is wedged between two
  data-entry fields of the same field group, so focus lands on something inoperable part-way through
  filling one thing in. Weigh `interruptsCoupledSequence: false` as a reason NOT to flag.

**WCAG soundness caveats (do NOT manufacture a failure these don't support):**
- 2.4.3 is about preserving MEANING/operability, not matching DOM source order or strict visual top-to-
  bottom — a different-but-sensible order is NOT a failure. Flag only orders that genuinely impair meaning
  or the ability to complete a task.
- A focus TRAP is a 2.1.2 concern owned by the trap detector — do not re-adjudicate a trap here.
- Whether an indicator is VISIBLE (2.4.7) and whether focus is OBSCURED (2.4.11/2.4.12) are other rubrics'
  jobs — judge only the ORDER's meaning here.
- If the recorded sequence is empty/degenerate, or you cannot relate it to the layout from the frames you
  were handed, return PARTIAL rather than guessing.
- `signals.focusOrder.partial: true` means the instrument lane hit its wall-clock cap and the sequence was
  salvaged. The ORDER is still sound evidence — the walk itself completed before the cut — so judge it
  normally; treat only the LATER facts (trap notes, revealed-state records) as possibly missing rather than
  absent-and-therefore-fine.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}` — summary = ONE sentence
stating the verdict; reasoning = ONE sentence giving the basis. verdict ∈ {REPRODUCED (barrier — the focus
order does not preserve meaning/operability), NOT REPRODUCED (no barrier — the order preserves meaning),
PARTIAL (cannot decide from the handed sequence/frames), N/A (abstain — NOT "out of scope", that is the
oracle's job)}.
