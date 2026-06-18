---
id: motion-control-v0
sc: 2.2.2
skill: timing-and-motion
visionEvidence: [viewport, element-crop]
---

# 2.2.2 — pause, stop, hide (v0 atomic rubric, A)

**Division of labor (v3.2).** The collector detected AUTO-MOVING content on this element — a looping or >5s CSS
animation, a `<marquee>`, or autoplay media without controls. The MECHANICAL fact (it auto-moves) is settled. You
judge whether the user can PAUSE/STOP/HIDE it, and whether 2.2.2 even applies.

**Judge:** for content that (a) MOVES/blinks/scrolls/auto-updates, (b) starts AUTOMATICALLY, (c) lasts more than 5
seconds, and (d) is presented in parallel with other content — is there a mechanism to PAUSE, STOP, or HIDE it? If
such moving content has NO pause/stop/hide control visible (in the viewport or near the element), that is a barrier.

**WCAG soundness caveats (REQUIRED before failing or clearing):**
- **Exceptions are NOT failures.** Motion that is ESSENTIAL (a loading spinner/progress indicator, a real-time data
  display where the movement IS the information), or that auto-stops within 5 seconds, carries no 2.2.2 obligation —
  return NOT-REPRODUCED (or PARTIAL if you cannot tell it is essential).
- A pause control may live elsewhere on the page (a global "reduce motion" / pause button) — if you cannot confirm
  from the viewport whether a pause mechanism exists, return PARTIAL, not a barrier.
- Do NOT measure flash rate (that is 2.3.1, out of scope here) — judge only the pause/stop/hide affordance.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}`.
