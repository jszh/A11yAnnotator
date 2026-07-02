---
id: motion-control-v0
sc: 2.2.2
skill: timing-and-motion
visionEvidence: [viewport, element-crop]
---

# 2.2.2 — pause, stop, hide (v0 atomic rubric, A)

**Division of labor (v3.2).** The collector detected on this element EITHER auto-MOVING content — a looping or >5s
CSS animation, a `<marquee>`, or autoplay media without controls (`motionMechanism.autoMotion`) — OR AUTO-UPDATING
content — a timer-driven ticker whose TEXT a deterministic MutationObserver saw rewritten repeatedly
(`motionMechanism.autoUpdatingText`). The MECHANICAL fact is settled. You judge whether the user can
PAUSE/STOP/HIDE it, and whether 2.2.2 even applies.

**Judge — SC 2.2.2 has TWO clauses with DIFFERENT conditions; apply the one matching the detected mechanism:**
- **MOVING / BLINKING / SCROLLING** (`autoMotion`): for content that (a) moves/blinks/scrolls, (b) starts
  AUTOMATICALLY, (c) lasts MORE THAN 5 SECONDS, and (d) is presented in parallel with other content — is there a
  mechanism to PAUSE, STOP, or HIDE it? No visible pause/stop/hide control (in the viewport or near the element)
  is a barrier.
- **AUTO-UPDATING** (`autoUpdatingText`, or any content that updates itself on a schedule): for content that
  (a) auto-updates, (b) starts AUTOMATICALLY, and (c) is presented in parallel with other content — is there a
  mechanism to PAUSE, STOP, or HIDE it, OR to CONTROL THE FREQUENCY of the update? There is NO 5-second condition
  in this clause: a ticker that rewrites every 3 seconds forever owes the mechanism regardless of how long each
  individual update takes.

**WCAG soundness caveats (REQUIRED before failing or clearing):**
- **Exceptions are NOT failures.** Content that is ESSENTIAL (a loading spinner/progress indicator, a real-time data
  display where the movement/update IS the information) carries no 2.2.2 obligation — return NOT-REPRODUCED (or
  PARTIAL if you cannot tell it is essential). "Auto-stops within 5 seconds" clears ONLY moving/blinking/scrolling
  content — it does NOT clear auto-updating content (that clause has no 5-second grace).
- A pause control may live elsewhere on the page (a global "reduce motion" / pause button) — if you cannot confirm
  from the viewport whether a pause mechanism exists, return PARTIAL, not a barrier. This holds for BOTH clauses.
- Do NOT measure flash rate (that is 2.3.1, out of scope here) — judge only the pause/stop/hide affordance.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}`.
