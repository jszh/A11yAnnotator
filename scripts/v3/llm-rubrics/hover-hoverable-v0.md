---
id: hover-hoverable-v0
sc: 1.4.13
skill: color-and-visual-text
toolMode: required
visionEvidence: [state-before, state-after]
---

# 1.4.13 — HOVERABLE (v0 atomic rubric)

**Your one question:** if the pointer moves off the trigger and ONTO the additional content it
revealed, does that content stay visible?

Nothing else about this content is yours. Whether it can be dismissed in place is
`hover-dismissable-v0`'s question; whether it survives the passage of time is
`hover-persistent-v0`'s. Answer hoverability and stop.

**Division of labor (v3.2).** You do NOT investigate the page. The collector found a trigger that
reveals additional content on POINTER HOVER, and a deterministic probe attempted to travel the pointer
onto that content. You are reading this rubric because hoverability is NOT settled: either the travel
could not be performed, or the probe never ran on this trigger.

**Scope: this condition is about POINTER-hover-triggered content only.** Content that appears on
keyboard FOCUS and not on hover cannot be reached by a pointer travel, so the condition is vacuous
there — the routing already withholds this rubric from a focus-only reveal, so if you are reading it,
hover is the channel in play.

**Reading `signals.hoverFacets`.** These are the probe's own measurements, not a verdict.
- `hoverable` — whether the content survived a real pointer travel from the trigger onto it. You never
  see this rubric when it is `true`; a `false` or a `null` is why you are here.
- `revealMode` — `hover`, `focus`, or absent when the probe could not tell.
- `contentAppeared` / `probeRan` — whether the probe saw anything flip visible, and whether it ran.

**These negatives are WEAK and you must not read them as a pass or as inapplicability.** The probe
detects revealed content by diffing the visibility of real ELEMENTS, so a tooltip drawn by a CSS
pseudo-element, painted into a canvas, or hosted in a namespace the probe could not address reports
`contentAppeared: false` while plainly showing on screen. The `state-after` frame is the authority on
whether content is there.

**What the failure actually looks like (F95).** The barrier is a GAP: the revealed content sits away
from the trigger with un-hoverable space between them, so the pointer leaving the trigger extinguishes
the content before it can arrive. Two shapes reproduce it and both are visible in the frames:
- **A physical gap.** The tooltip floats clear of its trigger and nothing bridges the space, so
  crossing the gap fires the trigger's mouse-leave and the content closes.
- **The content is not a pointer target at all.** A tooltip carrying `pointer-events: none`, or one
  drawn as a CSS pseudo-element, can never receive the pointer; moving toward it necessarily leaves the
  trigger, and it disappears. Generated content of this kind fails by construction.

Read the `state-after` frame for the geometry — where the content sits relative to the trigger, and
whether it touches or overlaps it — and decide:
- **REPRODUCED** — the content cannot be reached with the pointer without extinguishing it.
- **NOT REPRODUCED** — the content adjoins or overlaps the trigger, or a hoverable bridge covers the
  space, so the pointer can arrive and the content remains.

**WCAG soundness caveats (do NOT manufacture a failure these don't support):**
- **A genuine user-agent tooltip is EXEMPT.** Content the browser renders from a NON-EMPTY `title`
  attribute is UA-controlled and outside this criterion. An EMPTY `title=""` carries no advisory
  information and renders no UA tooltip (per the HTML spec), so the attribute alone settles nothing —
  judge what the frames show.
- **Do not fail a page for content the user has no reason to travel to.** The condition exists so the
  additional content can be read, copied or operated. Content that vanishes as intended when the
  pointer leaves the whole trigger-plus-content region is the correct behaviour, not a failure.
- **Do not re-adjudicate the other two properties here.** Dismissability and persistence are owned by
  their own rubrics; a page can satisfy hoverability and still fail one of them, and saying so is not
  your job.
- If the frames do not show where the revealed content sits relative to its trigger, return PARTIAL
  rather than guessing.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}` — summary = ONE
sentence stating the verdict; reasoning = ONE sentence giving the basis. verdict ∈ {REPRODUCED
(barrier — the pointer cannot reach the revealed content without dismissing it), NOT REPRODUCED (no
barrier), PARTIAL (cannot decide from the frames), N/A (abstain — NOT "out of scope", that is the
oracle's job)}.
