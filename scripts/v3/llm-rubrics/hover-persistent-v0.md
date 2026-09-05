---
id: hover-persistent-v0
sc: 1.4.13
skill: color-and-visual-text
toolMode: required
visionEvidence: []
---

# 1.4.13 — PERSISTENT (v0 atomic rubric)

**Your one question:** does the additional content remain visible until the hover/focus is removed,
the user dismisses it, or its information becomes invalid — or does it withdraw ITSELF while the user
is still on the trigger?

Nothing else about this content is yours. Dismissability and hoverability are owned by
`hover-dismissable-v0` and `hover-hoverable-v0`. Answer persistence and stop.

**Why you get no screenshots.** Persistence is a claim about ELAPSED TIME. A pair of stills cannot
show that content withdrew itself, so this rubric is not handed any — asking for them would only
invite a judgment the pixels cannot support. Your evidence is the probe's timing measurement and, if
tools are available to you, a timing observation you make yourself.

**Division of labor (v3.2).** The collector found a trigger that reveals additional content on hover
and/or focus. A deterministic probe dwelled on the trigger and re-read the page. That dwell is a
BOUNDED window, which is why this question reaches you even when the probe reports success.

**Reading `signals.hoverFacets`.** These are measurements, not a verdict.
- `persistent` — whether the content was still present at the END of the probe's dwell, with the
  trigger still hovered or focused. `dwellMs` is how long that dwell was.
- **`persistent: true` DOES NOT CLOSE THIS QUESTION, and that is the whole reason this rubric exists.**
  It means "still there after `dwellMs`". A tooltip on a timer LONGER than that dwell measures `true`
  and still fails the criterion. What is left to you is exactly that residue: is there a timer at all,
  and is it longer than the window that was tested?
- `persistent: false` is a positive observation that the content withdrew itself inside the window.
- `probeRan` / `contentAppeared` — whether the pass executed, and whether it saw content flip visible.
  `contentAppeared: false` means the probe saw nothing, NOT that nothing appears: content drawn by a
  CSS pseudo-element, painted into a canvas, or hosted in a namespace the probe could not address is
  invisible to it. Never read it as a pass.
- `persistenceSamples` / `vanishedWhileHeld` (when present) — the probe re-revealed the content and
  re-read it at fixed offsets PAST the dwell, with the trigger state held. Each sample carries `atMs`
  (the offset), `present` (the content was still there), and `held` (the hold was POSITIVELY verified
  at that sample). **`vanishedWhileHeld: true` is a positive observation of SELF-WITHDRAWAL** — the
  content left while the hold demonstrably survived — and it is refutable ONLY by a LONGER timing
  measurement: a held dwell you drive yourself (via `interact_and_observe`) that exceeds the LAST
  sample's `atMs` offset and still finds the content present. Nothing shorter, and no amount of
  reasoning about the markup, can refute it; and `persistent: true` from the shorter dwell does not
  contradict it — the samples simply looked further. The permitted-removal reasons stay yours to
  weigh: if what the content reported stopped being true at the moment it vanished, that is the
  information-invalid exception, not a timer. `vanishedWhileHeld: false` with samples present means
  the content survived to the last sampled offset — persistence evidence out to that `atMs`, and
  still silent about anything longer.

**How to settle it.** The criterion is failed by content that removes itself on a timer while the user
is still hovering or still focused. If an `interact_and_observe` tool is offered, that is the way to
answer this: hover the trigger, then read what is present after a wait, and compare. A dwell that
outlasts a plausible auto-hide is worth more than any amount of reasoning about the markup.

Decide:
- **REPRODUCED** — the content disappears on its own while the trigger is still hovered or focused.
- **NOT REPRODUCED** — the content stays for as long as the trigger is held, and goes away only when
  hover/focus leaves, when the user dismisses it, or when what it says stops being true.

**WCAG soundness caveats (do NOT manufacture a failure these don't support):**
- **Content that disappears because its INFORMATION became invalid is explicitly allowed.** A message
  that clears once the condition it reported is resolved satisfies the criterion; that is one of the
  three permitted reasons for removal, not a timer.
- **Content that disappears because hover or focus LEFT is not a failure** — that is the first
  permitted reason. The failure requires the trigger to still be held.
- **A genuine user-agent tooltip is EXEMPT.** The browser's own tooltip, rendered from a NON-EMPTY
  `title` attribute, is UA-controlled and outside this criterion — including its UA-chosen timeout. An
  EMPTY `title=""` renders no such tooltip and grants no exemption.
- **Absence of a timing observation is not a pass.** If nothing in your evidence speaks to what happens
  over time — no dwell result, and no tool with which to make one — return PARTIAL. Do not infer
  persistence from the fact that a probe once saw the content.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}` — summary = ONE
sentence stating the verdict; reasoning = ONE sentence giving the basis. verdict ∈ {REPRODUCED
(barrier — the content withdraws itself while the trigger is still held), NOT REPRODUCED (no barrier),
PARTIAL (cannot decide — no timing evidence), N/A (abstain — NOT "out of scope", that is the oracle's
job)}.
