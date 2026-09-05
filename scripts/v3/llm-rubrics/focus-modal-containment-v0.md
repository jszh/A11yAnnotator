---
id: focus-modal-containment-v0
sc: 2.4.3
skill: focus-management
toolMode: required
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

**The OPENED-RING aggregate — `reveal.containmentLeak` on a stop (when present).** Some dialogs exist only
after the instrument activates an opener, so the containment facts arrive as an aggregate on that stop's
`reveal`: `{ modalXpath, openedStops, leakedStops, leakedSample }` measured over the walk taken WHILE that
dialog was open. Read it with the same fact test: `leakedStops > 0` means stops were tabbable OUTSIDE the
open dialog (the sample names them) — a barrier exactly as `modalOpen: true, insideOpenModal: false` is;
`leakedStops: 0` with the aggregate present is measured containment — evidence FOR the page; a null/absent
aggregate means no modal was rendered open during that walk and claims nothing.

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
  When the occlusion facts are present (per-stop `occludedBy` — the xpath of the element visually
  covering that stop — plus, on that SAME stop, `occluderPosition`/`occluderRect`/
  `occluderViewportCoverage`, and `signals.focusOrder.initialFocus`, the stop the PAGE ITSELF focused at
  load), read them as the deterministic form of this case ONLY WHEN THE OCCLUDER IS SCRIM-SHAPED — **a
  bare `occludedBy` is NOT, by itself, evidence of a modal overlay.** A ROUTINE sticky header or pinned
  toolbar occludes whatever scrolls underneath it on countless ordinary, non-modal pages, and a
  centre-point hit-test reports that occlusion exactly the same way a real scrim does; treating any
  occluder as a modal overlay manufactures a barrier out of a sticky header. The occluder counts as
  scrim-shaped only when EITHER **(a)** `occluderPosition` is `fixed` or `absolute` AND
  `occluderViewportCoverage` is large — roughly half the viewport or more, the element visually
  DOMINATING the screen rather than pinning a strip to one edge — **OR (b)** the evidence shows everything
  BEHIND it is `aria-hidden`/`inert` (an accessibility-tree declaration, not a geometry one). ONLY when
  that test passes: a page that places initial focus INTO the scrim and whose later stops are
  `occludedBy` that same scrim is presenting the overlay as modal, and the covered stops are OUTSIDE it —
  judge containment exactly as if those stops carried `modalOpen: true, insideOpenModal: false`. A stop
  merely `occludedBy` a header/toolbar/sidebar that fails BOTH tests is not this case — do not manufacture
  a barrier from it (N/A absent any other modal fact).
- **A focus TRAP is 2.1.2's**, owned by the trap detector. Containment is the opposite defect: focus
  ESCAPING a dialog that should hold it. Do not re-adjudicate a trap here.
- If no stop carries the modal facts and the frame shows nothing modal, return N/A rather than
  inventing a dialog.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}` — summary = ONE
sentence stating the verdict; reasoning = ONE sentence giving the basis. verdict ∈ {REPRODUCED
(barrier — focus leaves an open modal dialog), NOT REPRODUCED (no barrier — containment holds),
PARTIAL (cannot decide from the handed stops), N/A (abstain — NOT "out of scope", that is the oracle's
job)}.
