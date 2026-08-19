# Why 1.4.1 / 1.4.13 / 2.4.3 / 4.1.3 recall is low — root cause of all 12 misses

**Run:** merged Gemini 3.7-flash annotated suite at `48fa8580`
(`results/annot-overlap6-gemini37-current-48fa8580` + `results/annot-rest4-gemini37-current-48fa8580`,
389 cases, tools ON, vision ON). Post-fix re-measurement for 1.4.13/2.4.3 from
`results/annot-r4-slice-3sc-rep{1,2}` (commit `842aad09`).

## 1. The numbers

| SC | recall (base run) | recall (post-`842aad09`) | FN | FP |
|---|---|---|---|---|
| 2.1.2 | 27/27 · 100.0% | — | 0 | 0/9 |
| 1.3.1 | 45/46 · 97.8% | — | 1 | 0/7 |
| 1.1.1 | 41/42 · 97.6% | — | 1 | 0/7 |
| 3.3.1 | 28/29 · 96.6% | 27/29 · 93.1% | 1 | 0/6 |
| **2.4.3** | **28/30 · 93.3%** | 28/30 · 93.3% | **2** | 0/16 |
| 2.4.4 | 25/27 · 92.6% | — | 2 | 0/4 |
| 2.4.2 | 22/24 · 91.7% | — | 2 | 0/5 |
| **1.4.1** | **25/28 · 89.3%** | not re-run | **3** | 0/14 |
| **1.4.13** | **22/25 · 88.0%** | 24/25 · 96.0% / 23/25 · 92.0% | **3** | 0/6 |
| **4.1.3** | **28/32 · 87.5%** | not re-run | **4** | 0/5 |
| **total** | **291/310 · 93.9%** | | **19** | 6/79 |

The four SCs hold **37% of the recall corpus but 63% of the misses** (12/19).

Two caveats on reading the table. These four SCs were the second batch (`--sc 1.4.1,1.4.13,2.4.3,4.1.3`),
so batch and SC are confounded — but every root cause below is per-case and SC-specific, so the confound
does not survive the case-level analysis. And 1.4.13 already moved to 92–96% on the current tree; the
88.0% figure is pre-`842aad09`.

## 2. The finding

**10 of the 12 misses had the decisive fact already measured, already correct, and already in the judge's
prompt.** Only two are sensing gaps. The bottleneck is not perception — it is the last inch: attaching a
measured fact to a subject that is asked the right question, and making the judge spend a fact it was
handed.

| # | SC | case | decisive fact measured? | where it broke | class |
|---|---|---|---|---|---|
| 1 | 1.4.1 | `ui-status-action-color-only-no-text-cue/case-03` | **yes** | delivered to every subject except the one it is about | routing |
| 2 | 1.4.1 | `error-validation-color-only/case-04` | **yes** | rubric's F81 lightness escape clears it | doctrine |
| 3 | 1.4.1 | `scoping-non-failures-and-escape-hatches/case-07` | no | no candidate ⇒ `noObligation` | minting |
| 4 | 1.4.13 | `persistent-auto-timeout…/case-02` | **yes** | facet contradicts its own samples | harness bug |
| 5 | 1.4.13 | `persistent-auto-timeout…/case-03` | no | probe never scrolls | instrument |
| 6 | 1.4.13 | `applicability-author-vs-ua-title-tooltip/case-05` | **yes** | judge overrode a measured facet | rubric authority |
| 7 | 2.4.3 | `modal-focus-not-contained-both-directions/case-03` | partial | containment clause gated on an ARIA declaration | routing gate |
| 8 | 2.4.3 | `css-reorder-tab-vs-visual-meaning/case-07` | **yes** | rubric explicitly licenses the clear | over-broad guard |
| 9 | 4.1.3 | `partial-update-no-atomic…/case-04` | **yes** | structural requirement unenforced | unenforced rubric |
| 10 | 4.1.3 | `announced-text-lacks-visual-context/case-02` | **yes** | same | unenforced rubric |
| 11 | 4.1.3 | `announced-text-lacks-visual-context/case-03` | **yes** | same | unenforced rubric |
| 12 | 4.1.3 | `announced-text-lacks-visual-context/case-04` | **yes** | same | unenforced rubric |

## 3. 4.1.3 — 28/32 (4 FN): the rubric's second half never runs

All four misses are the same shape. `status-message-v0` has two halves: a WIRING check (does a pre-existing
live region announce this, at sane politeness, without a change of context) and a STAND-ALONE check ("the
announced string must stand on its own"). Every one of the four clears quotes only the wiring half:

> "The status message '✓Saved' is properly conveyed through a pre-existing live region without moving focus."
> "The search results status update is properly contained in a pre-existing live region with role status."

Meanwhile the evidence handed to that same judge contains the referent verbatim:

| case | announced string | referent, present in the prompt |
|---|---|---|
| `…case-02` | `"✓Saved"` | `triggerLabel: "Stage for Priya Nair, Helio Logistics"` |
| `…case-03` | `"✓ Saved"` | `sectionHeading: "Wedding · 38 photos"`, `enclosingHtml` carries `<span id="albumTitle">Wedding</span>` |
| `…case-04` | `"Selected"` | `triggerLabel: "Row 12, seat A, available"` |
| `partial-update…case-04` | `"٦"` | `atomic: false` + `mutatedFragment: "٦"` on a region reading `النتائج: ٠ نتيجة` |

The rubric already carries both clauses — the `mutatedFragment` instruction at
`scripts/v3/llm-rubrics/status-message-v0.md:83`, the stand-alone check at `:90-110`, and a **STRUCTURAL
REQUIREMENT** that a clear's `reasoning` must quote the announced string and either name the referent or
name a guard, "return PARTIAL instead" otherwise.

Nothing enforces it. `reasoning` is produced by the judge, consumed only by the refutation cascade
(`llm-adjudicator.js:1676`, itself off by default), and **never persisted** into the scored artifact — the
run's `rubricVerdicts` rows carry `{sc, verdict, confidence, rubric, xpath, summary}` and drop `reasoning`
entirely. So the requirement is unenforceable at runtime and unauditable afterwards. The summaries are
the only surviving trace, and all four are wiring-only.

## 4. 1.4.1 — 25/28 (3 FN): three different failures

**`ui-status-action-color-only-no-text-cue/case-03` — the fact reaches every subject except the right one.**
The instrument measured the barrier exactly:

```
colourStateDeltas.deltas[0] = { trigger: ".../tr[1]/td[4]/button[1]",  xpath: ".../tr[1]", tag: "tr",
  backgroundBefore: "rgba(0,0,0,0)", backgroundAfter: "rgb(215,240,221)", textAlsoChangedNearby: false }
```

and the signal's own note says a flip like this "is information conveyed by colour alone". But
`colourStateDeltas` is broadcast page-level onto every `use-of-color-v0` subject
(`llm-adjudicator.js:2242`), and the only subjects on this page are the four date `<input>`s
(`…/tr[N]/td[3]/input[1]`). The `<tr>` that carries the delta is never minted. The note then instructs the
judge to "match the row's xpath against your subject before attributing any delta to it" — which it did,
correctly, and cleared: *"The date input field renders with standard styling and does not use color alone."*
The harness measured the barrier and then told the judge to ignore it.

**`error-validation-color-only/case-04` — a doctrine call, not a defect.** The confirm field ships
`class="mismatch"` at rest, so the harness saw the real state and measured it correctly:
`border: 1px solid rgb(211,31,47)`, `errorStated: false`, `requiredStated: false`,
`borderColourContrasts: [{ label: "Current password", contrastWithThisBorder: 3.57 }]`. The rubric grants an
F81 escape at `use-of-color-v0.md:250-259` — "a measured ≥3:1 luminance separation between the state
styling and its default/peer styling ON THE SAME PROPERTY — `borderColourContrasts` for a state border vs
the peers' borders". 3.57 ≥ 3, so the judge cleared, verbatim per the rubric. F81's own text does carry the
escape ("It would also not fail if the color chosen had sufficient luminosity difference (lightness) from
the other text … A minimum contrast ratio of 3:1 is considered sufficient") — but F81 scopes it to **text**
("from the other text", "if viewed in black and white"), and the rubric extends it to **borders**. That
extension is the whole disagreement with the label. Related evidence gap: `fieldColourState` records
`border` and `outline` but **not `box-shadow`**, and this page's actual cue is
`box-shadow: 0 0 0 2px #d31f2f` — the harness is applying the escape while blind to part of the styling.

**`scoping-non-failures-and-escape-hatches/case-07` — nothing minted.** A region-health matrix whose
status is `<span class="dot op"></span>` — empty, non-interactive, no name, distinguished from `.deg`/`.down`
by `background` alone, with a hue-keyed legend. No 1.4.1 candidate exists for it, so the case scored
`noObligation` with zero subjects. This is the canonical F81/1.4.1 shape and the harness has no channel
for it: same-shaped, same-sized, accessible-name-empty peers whose only distinguishing computed property is
`background-color`.

## 5. 1.4.13 — 22/25 base, 24/25 & 23/25 post-fix (3 FN, 1–2 residual)

**`persistent-auto-timeout…/case-02` — the facet contradicts its own samples.** A global
`setInterval(…, 5000)` clears the focus bubble while the field still has focus. The probe caught it:

```
persistenceSamples = [{atMs:1000, present:true,  held:true},
                      {atMs:3000, present:false, held:true},
                      {atMs:7000, present:false, held:true}]
vanishedWhileHeld = true          …shipped alongside…          persistent: true
```

`o.persistent = true` is assigned from a 1600 ms dwell at `exp-runners.js:1805`, *before* the longer
persistence probe runs (`:1829-1854`), and is never revised when `vanishedWhileHeld` comes back true. So a
timed dismissal at 5 s ships as `persistent: true`. The rubric note does warn that "content on a timer
longer than that dwell measures true and still fails", but the facet name wins. (Post-`842aad09` this case
is caught in 2/2 reps — the slow-reveal retry made the reveal stable enough that the judge reads the
samples — but the contradiction is still in the payload.)

**`persistent-auto-timeout…/case-03` — genuine instrument gap.** A scroll listener hides the tooltip the
moment the user nudges the grid, with hover still on the trigger. All facets measure clean and all three
samples read `present: true`, because the probe holds the pointer still and never scrolls. Scrolling
removes neither hover nor focus, so this is a real Persistent failure with no measurement channel. Stable
miss in 2/2 post-fix reps.

**`applicability-author-vs-ua-title-tooltip/case-05` — the judge overrode a measured facet.** The overlay is
`pointer-events: none`, and the probe measured `hoverable: false` with `hoverTravel:
{continuousKept: false, coarseKept: false}` on 3 of 4 bars, and routed `hover-hoverable-v0` on exactly
those. The judge cleared anyway: *"The hover-revealed tooltip directly overlaps the trigger element without
a separating gap"* — visual reasoning beating a real pointer travel. Two contributors: the facet note's
"THE NEGATIVES ARE WEAK" caveat is written about *detection* negatives (`contentAppeared`) but reads as
blanket, and the measurement is itself unstable (`hoverable` came back `true` on the other bar of an
identical pair). Marginal: caught in rep1, missed in rep2.

## 6. 2.4.3 — 28/30 (2 FN)

**`modal-focus-not-contained-both-directions/case-03` — containment is gated on an ARIA declaration.** A
promo card over a full-viewport scrim, initial focus moved into the email field, no trap, background never
inert. The tab ring records it precisely:

```
forward[0] Search the archive  occludedBy:/html/body/div[1] occluderPosition:fixed occluderViewportCoverage:1
forward[1] Search              occludedBy:/html/body/div[1] occluderPosition:fixed occluderViewportCoverage:1
forward[2] Email address       initialFocus:true            (inside that same div[1])
```

Two background stops fully covered by a fixed overlay, tabbed before the card's own controls whose first
stop took initial focus — the leak signature, in the evidence. But `focusClauseFacts.modal`
(`llm-adjudicator.js:2042-2043`) opens only on `stops.some(s.modalOpen === true)` or
`reveal.containmentLeak.leakedStops > 0`, and `modalOpen` is derived from
`dialog[open], [aria-modal="true"]` (`kbd-graph.js:103`). A visual-only modal declares neither, so
`focus-modal-containment-v0` — the rubric that owns this doctrine — is never routed. The case falls to
`focus-order-meaning-v0`, which asks whether the sequence is meaningful, and it answers yes. The
per-stop occlusion facts were added for exactly this shape (`kbd-graph.js:107-111`, batch-3 #25) but only
as evidence; no gate consumes them.

**`css-reorder-tab-vs-visual-meaning/case-07` — the rubric licenses the clear.** A seat grid, seats
numbered 1–40 row-major on screen, DOM emitted column-major. Tab walks
`Seat 1 (y=334) → Seat 9 (y=388) → Seat 17 (y=442) → Seat 25 → Seat 33 → Seat 2 …`. The judge:
*"The focus order follows a systematic column-by-column traversal across the seat grid, preserving meaning
and operability."* That is the rubric verbatim — `focus-order-meaning-v0.md:68-70` ("a set laid out in a
two-dimensional arrangement is NOT orderless: the set CONFORMS when the recorded order is a systematic
traversal of it — every row in turn, or…") and `:95` ("a systematic column-by-column or row-by-row
traversal of a 2-D [layout]"). The guard is right for an orderless 2-D set (a photo grid) and wrong when
the set carries an intrinsic sequence the page itself prints. The discriminator is in the evidence and is
computable: the stop labels carry ordinals whose order under the tab ring is 1, 9, 17, 25, 33, 2, … —
non-monotonic — while row-major geometry yields 1, 2, 3, ….

*Corpus note:* this case's `ruleName` in the run artifacts describes "a Lakeview Dental month-grid date
picker for September 2026". The page is a Riverbank Playhouse seat grid. Stale metadata, no effect on
scoring (the label and the page agree), but it makes the FN read as a hallucination when it is not.

## 7. Cross-cutting

1. **Sensing is not the bottleneck; the last inch is.** 10/12. Every fix below is a routing gate, a facet
   correction, or an enforcement check — none needs a new measurement.
2. **The SC's hard half is systematically under-adjudicated.** In three of the four SCs the rubric contains
   both an easy mechanical question (is there a live region / is this field styled / is the order
   systematic) and a hard semantic one (does the string carry the referent / is the state cue non-colour /
   does the order preserve *this* set's meaning). The judge answers the mechanical one and stops. Where a
   rubric anticipated exactly this and wrote a structural requirement against it, nothing enforces it.
3. **FP-suppression guards are load-bearing for these misses.** The systematic-traversal license (2.4.3 #8),
   the F81 border escape (1.4.1 #2), and the "negatives are weak" caveat (1.4.13 #6) each converted a
   correct measurement into a clear. Each was added under FP pressure; each is now the direct cause of a
   miss. FP work on these four SCs is at 0–2 FPs per SC with 14/16 specificity cases on 1.4.1/2.4.3, so
   there is headroom to narrow them.
4. **A measured `false` is not treated as authoritative.** `hoverable: false`, `atomic: false`,
   `textAlsoChangedNearby: false` are positive measurements of failure conditions, but they enter the prompt
   as advisory facts alongside notes emphasising their weakness. The deterministic lane owns the
   corresponding `true`s.

## 8. Ranked change list

| # | fix | SC | cases | risk |
|---|---|---|---|---|
| 1 | Enforce the 4.1.3 structural requirement in code: a `NOT REPRODUCED` on an observed announcement whose `reasoning` neither quotes the announced string nor names `terse-outcome`/`region-carries-its-own-referent` is demoted to `PARTIAL`. Persist `reasoning` so it is auditable. | 4.1.3 | 4 | low; demotes to PARTIAL, never mints |
| 2 | Point the stand-alone check at `triggerLabel` and `sectionHeading` explicitly as referent sources — "compare the announced string against the accessible name of the control that caused it". | 4.1.3 | 3 | low |
| 3 | Mint a 1.4.1 subject on the element named by each `colourStateDeltas` row, instead of broadcasting the row to unrelated subjects. | 1.4.1 | 1 | low; the deltas already exist and are already trusted |
| 4 | Revise `o.persistent` to `false` when `vanishedWhileHeld === true` (the probe re-showed at full signature, so it is a measured timed dismissal), or delete the facet and let the samples speak. | 1.4.13 | 1 | medium — feeds `anyPropertyFails`; needs the live-counter case checked |
| 5 | Open the 2.4.3 containment clause on the geometric modal shape: a stop occluded by a fixed overlay at `occluderViewportCoverage ≈ 1` while another stop sits inside that overlay. Evidence already recorded. | 2.4.3 | 1 | medium — new routing; specificity set is 16 cases |
| 6 | Carve the systematic-traversal license: it does not apply when the stops' names carry an intrinsic ordinal sequence that the recorded order violates. Computable deterministically from the labels + rects. | 2.4.3 | 1 | medium |
| 7 | Make a measured `hoverable: false` authoritative (scope the "negatives are weak" caveat to detection negatives), and stabilise the travel measurement — an identical peer measured `true`. | 1.4.13 | 1 | medium |
| 8 | Add a colour-coded-token candidate channel: same-shape, same-size, name-empty peers distinguished only by `background-color`. | 1.4.1 | 1 | medium — new minting, watch 1.4.1's 14 specificity cases |
| 9 | Add `box-shadow` to `fieldColourState`, and decide whether the F81 lightness escape should be scoped to text cues as F81 words it. | 1.4.1 | 1 | **user call** — doctrine, not a defect |
| 10 | Scroll during the 1.4.13 persistence probe. | 1.4.13 | 1 | medium — new action in the probe repertoire |

Items 1–3 are pure last-inch fixes with no new measurement and no new minting: 8 of the 12 cases.
Item 9 is a doctrine question that should not be decided without the user.
