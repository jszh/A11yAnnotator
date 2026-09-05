---
id: focus-redundant-stop-v0
sc: 2.4.3
skill: focus-management
toolMode: required
visionEvidence: [viewport]
---

# 2.4.3 — A STOP THAT SHOULD NOT BE THERE (v0 atomic rubric)

**Your one question:** is there a tab stop that makes the sequence confusing to work through — a
wrapper reached immediately before the control inside it, or an inoperable container wedged into a
sequence the user is part-way through?

Nothing else is yours. Whether the ORDER of the stops preserves meaning is
`focus-order-meaning-v0`'s question, and it is a different question: the defect here shows up in a
sequence that is in perfect visual order. Modal containment and the two revealed-content requirements
have their own rubrics. Answer the redundant stop and stop.

**Why this rubric exists.** 2.4.3 covers more than the ORDER of the stops. The Understanding's own
failure example is a stop that makes the sequence confusing rather than one that is out of sequence: a
control that appears to receive focus twice because a focusable element is nested inside another,
written as `<div tabindex="0"><button>…</button></div>`. A page with that shape records a sequence in
perfect visual order, so "does this order preserve meaning" answers yes and the defect is missed. This
is the second question.

**Division of labor (v3.2).** You do NOT drive the keyboard. The instrument walked the page and
pre-computed the facts below as a pure function of the recorded ring. You are reading this rubric
because at least one stop carries one of them.

**Reading the facts on a stop.**
- `wrapsNextStop` — the very next stop is a DESCENDANT of this one, so the user Tabs onto a wrapper and
  then onto the control inside it. `rectEnclosesNextStop` and `nameCoversNextStop` say whether it also
  *looks* and *announces* like the same thing twice.
- `genericContainerStop` — this stop is a layout element that is in the ring only because it carries an
  explicit `tabindex`, and declares no interactive role.
- `interruptsCoupledSequence` — this stop is wedged between two data-entry fields of the SAME field
  group.

**How to decide.**
- **A wrapper reached immediately before the control it contains is a barrier when the user cannot tell
  the two stops apart.** `wrapsNextStop` with `rectEnclosesNextStop` and `nameCoversNextStop` both true
  is the Understanding's example exactly: one control, reached twice, indistinguishable. Say
  REPRODUCED. When the wrapper is visibly and audibly its own thing — a distinct region with its own
  name that happens to contain a control — the two stops are distinguishable and it is not this defect.
- **`genericContainerStop` ON ITS OWN IS NOT A FAILURE.** Static content is explicitly permitted to be
  focusable. A focusable scroll region, a labelled group that owns its own controls, and a heading-like
  marker introducing a set of links are all legitimate, and extra stops that are merely tedious do not
  impede operation. It becomes a barrier only when it INTERRUPTS a sequence the user is working
  through, which `interruptsCoupledSequence` reports: focus lands on something inoperable part-way
  through filling one thing in. **Weigh `interruptsCoupledSequence: false` as a reason NOT to flag.**

**WCAG soundness caveats (do NOT manufacture a failure these don't support):**
- **Tedium is not a barrier.** The criterion is about meaning and operability. An extra stop the user
  passes over costs a keystroke; that is not what 2.4.3 prohibits.
- **A roving-tabindex widget is not this defect.** A tree, grid or toolbar deliberately exposes ONE tab
  stop and moves within itself using arrow keys; the container stop is the design.
- **Do not argue this from the layout alone.** The `viewport` is here so you can see whether the
  wrapper and the control it contains look like one thing or two. It is not a licence to flag stops for
  sitting in an unexpected place — that is the other rubric's question, and even there a
  different-but-sensible order is not a failure.
- If no stop carries these facts, return N/A. If the facts are present but the frame cannot show you
  whether the stops are distinguishable, return PARTIAL.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}` — summary = ONE
sentence stating the verdict; reasoning = ONE sentence giving the basis. verdict ∈ {REPRODUCED
(barrier — a stop makes the sequence confusing or interrupts a coupled sequence), NOT REPRODUCED (no
barrier — the extra stop is legitimate and distinguishable), PARTIAL (cannot decide from the handed
facts and frame), N/A (abstain — NOT "out of scope", that is the oracle's job)}.
