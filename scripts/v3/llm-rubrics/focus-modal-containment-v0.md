---
id: focus-modal-containment-v0
sc: 2.4.3
skill: focus-management
visionEvidence: [viewport]
---

# 2.4.3 — MODAL CONTAINMENT (v0 atomic rubric)

**Your one question:** while a modal dialog is open, does every tab stop stay inside it?

Nothing else about the focus order is yours. Whether the resting order preserves meaning is
`focus-order-meaning-v0`'s question; revealed-content placement and focus return belong to
`focus-reveal-adjacency-v0` and `focus-return-after-dismissal-v0`; a redundant stop is
`focus-redundant-stop-v0`'s. Answer containment and stop.

**Division of labor (v3.2).** You do NOT drive the keyboard. The deterministic tab-order instrument
already WALKED the page and RECORDED the sequence, and it stamped each stop with the modal facts
below. You are reading this rubric because at least one recorded stop was taken while a modal dialog
was open, so the containment question is live on this page.

**Reading the facts.** Each stop in `signals.focusOrder.forward` may carry:
- `modalOpen` — a modal dialog was RENDERED and open when this stop was taken.
- `insideOpenModal` — this stop is inside that dialog.
- `modalXpath` — which dialog.

**The decision is a fact test, not a judgment call.** If any stop has `modalOpen: true` and
`insideOpenModal: false`, focus left the open dialog and that is a barrier — whether those stops come
before or after the dialog's own controls, and however few of them there are. The Understanding's modal
example requires content behind the dialog to be inert. A page may inert its main wrapper correctly and
still leak, because some element sits outside that wrapper; judge the stops you were handed, not the
intent behind them.

- **REPRODUCED** — at least one stop is `modalOpen: true, insideOpenModal: false`.
- **NOT REPRODUCED** — every stop taken while the modal was open is inside it.

**WCAG soundness caveats (do NOT manufacture a failure these don't support):**
- **Scope is MODAL dialogs only.** A NON-modal dialog or disclosure is explicitly ALLOWED to sit in the
  page's focus order — the Understanding's non-modal example runs button → dialog contents → the
  element after the button — so background stops around a non-modal are not a failure. `modalOpen` is
  what marks the modal case; do not extend this rubric to a disclosure.
- **`modalOpen` is gated on the dialog being RENDERED**, not merely declared. Markup carrying modal
  attributes inside a hidden container reports nothing, so a stop that does carry `modalOpen` means a
  modal really is on screen.
- **The ABSENCE of `modalOpen` is not proof that nothing modal is happening.** A region made modal by
  purely visual means — an overlay or scrim with no dialog semantics — declares nothing to read. If the
  `viewport` shows stops sitting underneath such an overlay, judge that from the frame and say so.
- **A focus TRAP is 2.1.2's**, owned by the trap detector. Containment is the opposite defect: focus
  ESCAPING a dialog that should hold it. Do not re-adjudicate a trap here.
- If no stop carries the modal facts and the frame shows nothing modal, return N/A rather than
  inventing a dialog.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}` — summary = ONE
sentence stating the verdict; reasoning = ONE sentence giving the basis. verdict ∈ {REPRODUCED
(barrier — focus leaves an open modal dialog), NOT REPRODUCED (no barrier — containment holds),
PARTIAL (cannot decide from the handed stops), N/A (abstain — NOT "out of scope", that is the oracle's
job)}.
