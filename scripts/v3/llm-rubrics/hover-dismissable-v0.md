---
id: hover-dismissable-v0
sc: 1.4.13
skill: color-and-visual-text
toolMode: required
visionEvidence: [state-before, state-after]
---

# 1.4.13 — DISMISSABLE (v0 atomic rubric)

**Your one question:** can the additional content that appeared on hover or focus be REMOVED without
moving the pointer and without moving focus — and does it need to be?

Nothing else about this content is yours. Whether the pointer can travel onto it is
`hover-hoverable-v0`'s question; whether it stays put over time is `hover-persistent-v0`'s. Answer
dismissability and stop.

**Division of labor (v3.2).** You do NOT investigate the page. The collector found a trigger that
reveals additional content on hover and/or focus, and a deterministic probe attempted to settle the
three 1.4.13 properties. You are reading this rubric because dismissability is NOT settled: either the
probe could not establish it, or it never ran on this trigger.

**Reading `signals.hoverFacets`.** These are the probe's own measurements, not a verdict.
- `dismissible` — whether pressing Escape, with the trigger still hovered/focused, removed the content
  (or whether the content obscures nothing, which exempts it). You never see this rubric when it is
  `true`; a `false` or a `null` is why you are here.
- `contentAppeared` / `contentIsAdditional` — whether the probe SAW anything flip visible.
- `nativeTitleOnly` — the trigger carries a `title` attribute and no `aria-describedby`.
- `probeRan` — whether the measuring pass executed at all on this element.

**These negatives are WEAK and you must not read them as a pass or as inapplicability.** The probe
detects revealed content by diffing the visibility of real ELEMENTS. Content drawn by a CSS
pseudo-element (`::before`/`::after` with generated `content`), painted into a canvas, or hosted in a
namespace the probe could not address, flips no element and reports `contentAppeared: false` on a page
that plainly shows a tooltip. Treat `contentAppeared: false` as "the probe saw nothing", never as
"nothing appears" — the `state-after` frame is the authority on whether content is on screen.
Likewise `nativeTitleOnly` is an ATTRIBUTE test, not a behavioural one: per the HTML spec an EMPTY
`title=""` carries NO advisory information and renders no UA tooltip, so the flag being true does not
establish that what you see is the browser's own tooltip.

**Judge from the frames.** Compare `state-before` (trigger inactive) with `state-after` (content
shown). Then decide:
- **REPRODUCED** — content is shown, it obscures or replaces other content, and no mechanism exists to
  dismiss it in place. A hover tooltip drawn purely in CSS with no script has no Escape handler at all,
  and a keyboard user who triggers it by focus cannot get rid of it without leaving the control.
- **NOT REPRODUCED** — a dismissal mechanism exists and works, or the exemption applies (below).

**WCAG soundness caveats (do NOT manufacture a failure these don't support):**
- **The obscuring exemption is REAL and is checked FIRST.** The Dismissable condition is owed only when
  the additional content hides or replaces other content. An overlay that occupies empty space beside
  its trigger and covers nothing owes no Escape handler; return NOT REPRODUCED.
- **A genuine user-agent tooltip is EXEMPT.** Content the browser itself renders from a NON-EMPTY
  `title` attribute is UA-controlled, and the criterion excludes it. Judge what the frames show: if the
  bubble is styled — colours, radius, shadow, a position the OS tooltip does not use — it is the
  author's and the exemption does not apply, whatever the attribute says.
- **Do not decide this from a keyboard question.** Whether the content can be reached by keyboard at
  all is 2.1.1's. Dismissability is only about removing content that is already showing.
- If `state-after` is identical to `state-before` — nothing was triggered in the captured pair — say so
  and return PARTIAL. Do not describe a tooltip you cannot see, and do not read the absence of one as a
  pass.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}` — summary = ONE
sentence stating the verdict; reasoning = ONE sentence giving the basis. verdict ∈ {REPRODUCED
(barrier — showing content that obscures, with no way to dismiss it in place), NOT REPRODUCED (no
barrier), PARTIAL (cannot decide from the frames), N/A (abstain — NOT "out of scope", that is the
oracle's job)}.
