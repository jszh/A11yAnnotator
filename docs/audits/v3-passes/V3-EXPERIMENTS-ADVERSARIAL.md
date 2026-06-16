# Harness 3.0 — Adversarial round over the 8 experiment runners

After implementing C1/C3–C9, a fresh red-team agent attacked the runners for false clears / false
barriers (the per-experiment adversarial test-repair loop). It found **8 reproduced** wrong-verdict
bugs across 4 runners; all were fixed and locked in as committed fixtures + regression tests
([experiments.test.js](../scripts/v3/tests/experiments.test.js) "ADV" block,
`assets/saved/fx-v3-c{3,4,7,9}-adversarial.html`).

| # | Runner | Was | Root cause | Fix |
|---|---|---|---|---|
| 1 | text-contrast | FALSE CLEAR (white on translucent-white scrim over black) | backdrop walk jumped to the first opaque ancestor, skipping semi-transparent `rgba` overlay layers | composite EVERY background layer (element-ward → opaque base) before luminance |
| 2 | text-contrast | FALSE CLEAR (differently-coloured child text) | measured only the element's own `color`; ignored child runs | detect a descendant text run with a different colour ⇒ `mixedRuns` ⇒ not computable ⇒ inconclusive |
| 3 | text-contrast | FALSE BARRIER (readable text over a near-opaque scrim) | same skip-to-opaque-base bug, inverted | (same fix as #1 — proper compositing) |
| 4 | keyboard-activation | FALSE BARRIER (native checkbox/radio) | effect watched only ARIA attrs; native `.checked` IDL + Enter-vs-Space contract wrong | broad observation (native `.checked`/`.value`/focus/doc-hash); checkbox contract = Space; native type detected |
| 5 | keyboard-activation | FALSE BARRIER (native submit) | idempotent off-board effect: 2nd key shows no change | native button contract = Enter **or** Space (operability is browser-guaranteed; idempotent-safe) |
| 6 | keyboard-activation | FALSE BARRIER (off-board counter `0→1`) | doc signature used text **length** (same-length change missed) | content **hash** of `body.innerText`, not length |
| 7 | focus-obscured | FALSE BARRIER (`opacity:0` overlay on top) | `obscuringLayerOpaqueAndBlocking` ignored opacity | compute the overlay's effective opacity along its ancestor chain; ~0 ⇒ not blocking |
| 8 | hover-content | FALSE BARRIER (compliant tooltip) | destructive test order: Escape (Dismissible) hid the tooltip before the Hoverable test | reorder Persistent→Hoverable→Dismissible(last), re-hover between sub-tests; static (non-focusing) trigger probe so the pristine "rest" baseline isn't polluted |

The structural rule held: barrier-only runners (hover/reflow/obscured) have no
`NO_BARRIER_OBSERVED` support predicate, so `directionFor` can never propose a clear for them
(verified by the agent). Sound negative results: ancestor `opacity` already blocked contrast clears;
background-image low-contrast blocked; one-way keyboard traps ⇒ inconclusive; partial/behind/
pointer-events:none overlays ⇒ no barrier; two-ARIA-state widgets ⇒ not clearable; disabled controls
⇒ inconclusive.

All eight runners remain **shadow** by default; these fixes harden the measurement so promotion (when
gated on gold + the adversarial fixture suite) rests on sound channels.
