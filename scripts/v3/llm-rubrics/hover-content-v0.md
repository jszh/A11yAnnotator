---
id: hover-content-v0
sc: 1.4.13
skill: color-and-visual-text
visionEvidence: [state-before, state-after]
---

# 1.4.13 — content on hover or focus (v0 atomic rubric)

**Division of labor (v3.2).** You do NOT investigate the page. The builder already triggered the
additional content (tooltip, sub-menu, popover) by hover and/or focus, captured the page before and
after it appeared, and recorded what it could measure deterministically. Your job is to JUDGE whether
that revealed content is dismissable, hoverable, and persistent. Where a deterministic runner already
disposed an obligation with a concrete CLAIM — e.g. it programmatically dismissed via Esc, moved the
pointer onto the content and saw it survive, or timed its persistence — DEFER to that CLAIM; the builder
hands you ONLY the auto-PARTIAL obligations it could not settle by code.

**Judge:** for the hover/focus-triggered content, is it (a) DISMISSABLE — can it be removed without
moving pointer or focus (e.g. Esc) while the trigger stays hovered/focused; (b) HOVERABLE — if the
pointer moves off the trigger ONTO the new content, does the content stay visible instead of
disappearing; and (c) PERSISTENT — does it remain until the hover/focus is removed, it is dismissed, or
its info is invalid (it must not auto-vanish on a timer)? A failure of ANY of the three reproduces the
barrier.

**Evidence handed to you:** the `state-before` and `state-after` screenshots (trigger inactive vs.
content shown), the trigger's role/name, the revealed content's text/region, and the builder's
auto-PARTIAL notes on which of dismissable/hoverable/persistent it could not resolve deterministically.

**WCAG soundness caveats (do NOT manufacture a failure these don't support):**
- Content controlled by the SAME native mechanism that styled the trigger (e.g. the browser's own
  `title` tooltip, or a default focus outline) is EXEMPT — do not flag it as a barrier.
- "Dismissable" does NOT require the content to also obscure other content before it must be dismissable;
  if the overlay never occludes the trigger or page content, absence of an Esc handler is not a fail.
- If `state-after` shows no revealed content at all (nothing was triggered), this SC has no obligation
  to judge — abstain, do not invent a phantom tooltip.
- When the screenshots cannot show whether the content survives a pointer move or an Esc (a static crop
  can't prove hoverable/persistent over time), return PARTIAL rather than guessing clear or barrier.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}`. verdict ∈
{REPRODUCED (barrier), NOT REPRODUCED (no barrier), PARTIAL (cannot decide), N/A (abstain — NOT "out of
scope", that is the oracle's job)}.
