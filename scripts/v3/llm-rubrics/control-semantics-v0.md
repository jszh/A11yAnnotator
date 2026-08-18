---
id: control-semantics-v0
sc: 1.3.1
skill: grouping-and-reading-order
visionEvidence: [element-crop, surrounding-region]
---

# 1.3.1 — control semantics (emulated controls) (v0 atomic rubric)

**Division of labor (v3.2).** The collector found an element carrying a script ACTIVATION handler (an
inline `onclick`/`onkey*`, or a `click`/`keydown` listener) that is **not focusable**, declares **no
interactive role**, has **no `tabindex`**, contains **no natively-interactive descendant**, and is not a
page-sized delegation root. Those structural facts are settled — you do not need to re-derive them. What a
checker cannot decide is whether the element genuinely FUNCTIONS as a control, which is your judgment.

**A SECOND ADMITTED SHAPE — the FOCUSABLE role-less variant (`signals.emulatedControlFocusable`).** When
this signal is present, the collector admitted the element under the SIBLING premise: the same
activation-handler guards, but the element IS keyboard-focusable (a `tabindex` ≥ 0, or native
focusability) while still declaring NO interactive role. Do not reject the premise because the element
is focusable — that is this variant's definition, not a contradiction of the paragraph above. The
mismatch to judge is the same, with one consequence shifted: a keyboard user CAN reach it, but assistive
technology still announces it as ordinary content — no role, no control semantics, absent from the links
and controls lists — so what the element visibly does remains programmatically undeclared, and a
focus stop that announces as plain text is itself part of the confusion. Apply the same affordance test
below, unchanged.

**Judge:** does this element present itself to a sighted user as something to activate — a link, a button,
a tab, a clickable row or card — while its markup says it is ordinary content? That mismatch is the 1.3.1
failure (WCAG **F42**): the relationship between what the element looks like and what it does exists only
for a mouse user. Two consequences follow and both are real: a keyboard user cannot reach it at all, and
assistive technology never announces it as a control, so it does not appear in a links or controls list.

Read the `element-crop` and `surrounding-region` and decide:
- **REPRODUCED** when the element reads as an interactive affordance — it is styled as a link or button
  (underline, button chrome, pointer cursor, a control-like label such as a page number, an action verb, an
  icon that stands for an action), or it sits in a set whose siblings ARE real controls, or the surrounding
  copy instructs the user to activate it.
- **NOT REPRODUCED** when the handler is an enhancement over content that is not itself a control — an
  analytics or tracking hook, a "dismiss on outside click" region, a drag surface, a container whose real
  controls live inside it and are reachable on their own.

**How to fix it is not your call, but it tells you what is missing:** a native `<a href>`/`<button>`, or
failing that a role plus `tabindex="0"` plus a keyboard handler. F42 notes the ARIA route is a fallback, not
the recommended one — do not treat "it could have had `role=button`" as evidence that it does.

**WCAG soundness caveats (do NOT manufacture a failure these don't support):**
- **A decorative or inert element with a stray handler is not a control.** If nothing about the rendering
  invites activation, say so and return NOT REPRODUCED. The collector's structural facts establish that this
  COULD be an emulated control, never that it IS one.
- **Do not flag event delegation.** A handler on a wrapper that dispatches to real controls inside it is
  correct practice; the structural guards exclude the obvious cases, but if the crop shows real controls
  inside this element, that is what is happening.
- **This rubric owns the SEMANTICS question only.** Whether the control can be operated by keyboard is
  2.1.1's, whether it has an adequate accessible name is 4.1.2's, and whether its purpose is clear from its
  name is 2.4.4's. Judge the missing role/relationship here and leave those to their own rubrics.
- If the crop is inconclusive about how the element renders, return PARTIAL rather than guessing.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}`. verdict ∈
{REPRODUCED (barrier — an interactive affordance with no programmatic control semantics), NOT REPRODUCED
(no barrier), PARTIAL (cannot decide from the crop), N/A (abstain — NOT "out of scope", that is the
oracle's job)}.
