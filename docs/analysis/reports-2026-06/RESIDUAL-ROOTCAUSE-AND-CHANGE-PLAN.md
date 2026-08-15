# Residual failure analysis and change plan — post-fix synthetic corpus

**Run:** `results/aug-annot-postfix-2026-08-15/` · Sonnet 4.6 · tools ON · 392 pages · **0 hard errors** · commit `c9b94a47`
**Scope:** all 112 false negatives + 10 false positives = **122 cases**, individually root-caused.
**Method:** 7 parallel agents, one per SC lane. Every case read, most probed live; every claim
grounded in the repo's normative sources (`wcag-understanding/`, `wcag-techniques/failures/`,
`act-rules/`, `refs/trusted-tester/`) and re-verified by the coordinator against `file:line`.

This analyses what SURVIVED the [first fix campaign](SYNTHETIC-CORPUS-FP-FN-ROOTCAUSE.md), which
took recall 52.4% → 64.2% at an unchanged FP rate.

---

## 1. Root causes

| root cause | n | what it means |
|---|---:|---|
| `applicability-gate` | 25 | the obligation is never created — the harness does not ask |
| `collector-blind` | 19 | the fact needed was never collected (sub-documents, shadow DOM, computed style) |
| `rubric-coverage` | 17 | the rubric has no clause for this failure shape |
| `evidence-gap` | 17 | the evidence exists but is not delivered, is truncated, or is wrong |
| `corpus-label-wrong` | 14 | the page conforms; the harness was right |
| `rubric-judgment` | 13 | the clause exists and the judge reasoned wrongly |
| `tool-not-invoked` | 9 | an adequate tool exists but is not routed to this SC |
| **`fix-did-not-work`** | **5** | **a shipped fix demonstrably failed to take effect** |
| `aggregation` | 2 | a correct finding was produced then dropped |
| `wrong-element` | 1 | the obligation attached to a healthy sibling |

**102 of 122 are genuine harness failures; 20 are corpus defects (16.4%)** — up from 7.6% last round,
as expected: fixing the harness leaves a residual with proportionally more label noise.

### Remedy lane

| lane | cases | change items |
|---|---:|---:|
| **PIPELINE** | 56 (46%) | 36 |
| **RUBRIC** | 31 (25%) | 21 |
| **TOOL** | 25 (20%) | 21 |
| **SC** (new capability) | 7 (6%) | 10 |
| corpus (no lane) | 3 | — |

The shape has shifted from the first round. Then it was 56% plumbing / 3.5% tooling. Now **TOOL rises
to 20%** — because the plumbing fixes exposed lanes where the instrument itself is absent, unrouted,
or returns the wrong observation. **SC (genuinely missing capability) remains small at 6%.**

---

## 2. Five shipped fixes that did not work — with proof

This is the most important section. Each was verified end-to-end, not inferred.

**R1 (1.3.1 / F46) — no effect.** `c9b94a47` added 38 lines of F46 prose to `info-relationships-v0.md`
and **never touched the deterministic table gate**. `git show c9b94a47 -- llm-adjudicator.js` contains
zero matches for `isData|looksLikeDataTable|NOT_DATA|tVerdict`; `collect-tables.js` is not in the commit.
The gate self-describes as *"a HARD GATE you may not override"* at `info-relationships-v0.md:14`, ~180
lines before the new clause. F46 remains unreachable in both directions: a layout table **with** a `<th>`
is reclassified as data and cleared `VALID` (via `scope=`), and **without** one is cleared `NOT_DATA`
(`rows.length > 1`). The inversion is exact — [F46](../../../wcag-techniques/failures/F46.html) names
`th`/`caption`/non-empty `summary` in a layout table as *the failure*, while `hasScope` treats `scope=`
as *proof of conformance*.

**P3b (4.1.3 trigger set) — half-blind.** `status-detector.js:62` still returns false for explicit
`type="submit"`. The fix rescued only *typeless* buttons; a page whose sole trigger is
`<button type="submit">` still has none — 6 of 20 cases.

**P3b (4.1.3 routing) — right answer, discarded.** A live `orchestrate` on
`is-it-a-status-message-scope-boundary/case-05` produced **5 correct detector findings on the right
element** → `obligationLedger413: 0` → outcome `noObligation`. `build-v3.js:861` routes 4.1.3 into
`TRIAGE_SCS` ("never clear/barrier"); `score-lib.js` never reads it.

**P3a (4.1.3 live regions) — fixed the wrong half.** It landed (empty regions now collected with
`liveRegionHiddenAtRest`), but **7 of 8 `noObligation` cases have no live region at rest at all** — and
that absence *is* the F103 failure. `applicability-oracle.js:241` still gates on `el.liveRegion === true`,
so 4.1.3 can only be asked on pages that are already partly conformant.

**P7 (empty announcements) — landed, no consumer.** The probe now returns
`emptyLiveRegionEvents: 2` with an explicit "user hears SILENCE" note, and `status-message-v0.md`
contains no clause that reads the field. The judge cleared the page anyway.

### And three defects in the fix that worked best

P2 (tab sequence → 2.4.3) drove the largest gain (+26.7pp) and shipped **untrustworthy evidence**:

1. **Ring rotation, no start marker.** Reproduced directly: with an open modal, `body.focus()` cannot
   take effect (outside content is inert), so the walk begins wherever the page left focus.
   Actual dialog order `bold → italic → submit`; recorded `italic → submit → bold`. The judge reads
   index 0 as "first tab stop" and reports a barrier. Causes **2 of the 4 new 2.4.3 FPs**. The `<doc>`
   sentinel that marks the boundary is discarded at `kbd-graph.js:58`.
2. **Empty labels.** `kbd-graph.js:40` reads `innerText || textContent || value` — no `aria-label`,
   `aria-labelledby`, or `<label for>`. On a form (the commonest 2.4.3 shape) every stop arrives unnamed.
3. **The 90 s instruments cap wipes it entirely.** `orchestrator.js:159` substitutes an `empty` bundle
   with no `tabOrder` key. Measured **67/392 = 17.1%** of the run. Effect is exactly where it should be:

   | SC | timed out | recall when timed out | recall otherwise |
   |---|---|---|---|
   | 2.4.3 | 8/46 | **0%** | 54% |
   | 1.4.1 | 10/42 | **17%** | 64% |
   | 2.4.4 / 3.3.1 | 0 | — | 89% / 83% |

---

## 3. The keystone: instrument findings cannot create obligations

Found independently on 2.1.2, and it generalises. `build-v3.js` gives `axeObs` a mint loop
(`axeDecidedObligations`, `:444`) and `detBarrierObs` a mint loop (`detBarrierObligations`, `:459`).
**`trapObs` has none** — it appears only at `:293`/`:299` (creation) and then exclusively in *fill*
paths (`:528`, `:560`, `:594`). A confirmed keyboard trap can therefore only fill an obligation the
oracle already enumerated, and it cannot: `detectKeyboardTraps` reports a **region** xpath while
`applicability-oracle.js:268` enumerates per **focusable element**, so the fill key never matches.

**Consequence: every 2.1.2 instrument improvement recovers zero cases until this lands.** The same
shape is why 4.1.3's correct detector findings are discarded. This is the single highest-leverage
change in the document.

---

## 4. Per-SC change list

### 4.1.3 status messages — 37.5% recall, worst in run (20 cases: PIPELINE 8, TOOL 5, RUBRIC 4, corpus 3)
The obligation is anchored to the live region — *the one element that is already correct*. Every
failure mode lives elsewhere (a plain `<div>` receiving status text, a region born with its content,
a region emptied, a control merely becoming enabled).
- **PIPELINE** `applicability-oracle.js:241` — replace the element-level live-region-gated obligation
  with a **page-level** status-message obligation. Recovers 8. *Guard:* fires on all 392 pages instead
  of ~17; the Understanding's tablist and survey-question exceptions must be in the rubric first, or
  the 2 `expected:inapplicable` cases flip to FPs. Note the specificity denominator is **5 cases**, so
  one new FP moves this SC's FP rate 20 points.
- **PIPELINE** `build-v3.js:861/289` — drop 4.1.3 from `TRIAGE_SCS`, add to `INSTRUMENT_BARRIER`.
  Measured FP cost: **0 findings on all 5 negative cases and 0 across a 45-page non-4.1.3 sample.**
- **TOOL** `status-detector.js:62` — stop excluding explicit `type=submit` (6 cases).
- **TOOL** `cdp-tools.js:270/681` — the observation windows (2500 ms cap, ~1400 ms floor) are shorter
  than the pages: the `removal-of-status` family completes at 1400–1800 ms, so both tools return during
  phase 1 ("Checking…") reporting `inLiveRegion:true, liveRegionPreExisted:true` — a textbook
  "this region works" signal. **The judge's clear was rational from actively misleading evidence.**
  Do not quiesce while a live region holds a progress-shaped message.
- **RUBRIC** `status-message-v0.md` — add "removal of status text is itself a status change"; add a
  clause that reads `emptyLiveRegionEvents`. *Guard:* a self-dismissing toast is not a removal.

### 1.3.1 info & relationships — 56.5% (20 cases: PIPELINE 9, SC 7, RUBRIC 4)
- **PIPELINE (do this first, ~9 cases)** split the table gate: keep `tVerdict` byte-identical (its FP
  protections must survive) and *add* `s.structure.tableSemantics`. Plus `collect-tables.js`: read
  `summary=` (never read today), stop short-circuiting on `isTableRole`, add `allTdGrid`.
  *Guard:* never fail a layout table carrying `role=presentation`/`none` (TT 14.C's own PASS condition),
  nor an empty `summary=""`; F92 requires *positive* data evidence.
- **SC** four new facets 1.3.1 needs and does not have: declared-structure truth (F46/F92/F43, 9 cases),
  control semantics (F42, 3), whitespace/`<pre>` faux tables (F34, 2), styling-outlier semantics (F2, 2).
- **RUBRIC** promote wrong-list-TYPE from a trailing sub-clause to an enumerated failure; extend
  `field-programmatic-association-v0` clause 3 beyond *graphical* cues.

### 2.4.3 focus order — 46.7%, and the only FP regression (21 cases: RUBRIC 9, TOOL 9, PIPELINE 3)
- **TOOL** route `interact_and_observe` + `observe_state_after_activation` to 2.4.3/`focus-management`
  (`cdp-tool-catalog.js:22,28-30`). 2.4.3 is in neither `scs` nor `skills`; **all 21 cases have
  `toolUse.calls: 0`.** Recovers 9. Decisive proof the rest-ring cannot close this lane: cases 05/06
  did not time out, got a complete ring, and were read as clean — the panel is `display:none` at rest
  and contributes no stops.
- **RUBRIC** the paired clause set (3 FPs killed, 6 misses recovered). The clause carrying the trade is
  the independent-columns bullet, which must end: *"two columns are independent only when neither is
  part of the other's task — two halves of ONE form are NOT independent."* Stated recall cost: **zero
  of the 14 measured TPs**, enumerated by id. Plus: *"the recorded sequence is a RING; index 0 is not
  necessarily first."*
- **PIPELINE** fix the ring start point (2 FPs) and stop discarding `tabOrder` on the 90 s timeout.
- *Sequencing:* ship rubric + routing **together** — routing without F85's carve-outs would repeat the
  +8/−4 trade, since both F85 rule families contain PASS siblings.

### 2.1.2 keyboard trap — 50.0% (14 cases: TOOL 10, PIPELINE 4)
- **PIPELINE (prerequisite for all 11)** `build-v3.js:459` — mint an obligation from a CONFIRMED
  instrument trap. *Guard:* mint only from `review:false`; a directional one-way loop must never mint.
- **TOOL** bounded reveal pass before the trap detectors (4 cases — *measured*: after one opener click
  the existing detector already returns `confirmed:true` for all four); frame/shadow-piercing detectors
  (5 cases, the whole F10 family); `stillInside` counts a transient `<body>` landing as an escape;
  Escape is probed from the wrong element.
- **P5 blind spots (proven by direct CDP test):** `getEventListeners` on an objectId minted by the *top
  frame* for an in-frame node returns `[]` silently at depth 0 **and** −1; and `depth` is *descendant*
  depth, so no value reaches an ancestor — delegated listeners on a container are invisible.

### 1.4.1 use of colour — 53.6%, 0 FPs (13 cases: PIPELINE 9, RUBRIC 3, TOOL 1)
- **PIPELINE** peer-group aperture: bucket by tag+role+parent, split on non-colour axes, fire when ≥2
  distinct used colours; one obligation per *group*. Recovers 7. **Held-out tested over 168 pages from
  the other 21 SCs: 76% produce zero groups, mean 0.30/page, p90 = 1, max = 4** — not a flood.
  *Must not match:* lone coloured elements, colour-uniform groups, peers already differing in
  weight/size/underline, plain `<img>`, syntax highlighting, zebra stripes, `:visited`, hover-only.
- **TOOL** **withdraw** `render_with_overrides(grayscale)` as required 1.4.1 evidence
  (`required-tool-routing.js:10`) — grayscale **preserves luminance**, so hue-only differences survive
  it looking distinct. It was the only tool that fired in this bucket and produced its **only false
  clear**; `micro-checks.js`'s own header already records grayscale as the bake-off loser. Route
  `compute_contrast_ratio` on the peer colours instead.
- **RUBRIC** add the G14/G182 category-coding failure mode; harden the ratio ban into a rule with a
  named escape; state that a grayscale/CVD re-render is not evidence a cue survives.

### 1.1.1 non-text content — 71.4% (13 cases: PIPELINE 11, RUBRIC 2)
- **PIPELINE** `backgroundImageMeaningful` (`act-page-collect.js:695`) requires `text.length === 0`,
  which excludes **all three of F3's own examples** — F3's book-distributor example puts
  `new.png`/`limited.png`/`instock.png` backgrounds on text-bearing list entries. 3 cases.
  *Guard:* dropping the no-text rule floods on icon-bulleted lists; bound with reserved-area +
  sibling-contrast disjuncts and gate on the 581-case corpus.
- **PIPELINE** `nearbyText` is `textOf(el.parentElement)`, which for an inline SVG **includes the SVG's
  own aria-hidden text** — the redundancy test the whole lane turns on self-satisfies. Still present at
  HEAD (introduced `ed1bc3f2`, untouched by `c9b94a47`). Plus `svgLiveText` ships "its text is REAL and
  machine-readable" about an aria-hidden SVG. **Every rubric that asks "is this also available as text"
  is judging against an inflated baseline.**
- **PIPELINE** confusable-text predicate requires *mixed* script in one node, so a fully-substituted
  run (`$ЗОО`) is invisible; the codepoint census omits U+1D400–1D7FF (the "fancy text" block).
- **RUBRIC** the single FP is a genuine over-reach: WCAG does not require an alt to transcribe every
  word rendered in a photo (G95; and 1.4.5 exempts "text that is part of a picture that contains
  significant other visual content"). Add that to the soundness caveats.
- Counting by *"did the failing element ever reach a judge"* rather than by outcome label, 1.1.1 is
  **6 never-reached vs 7 reached**, and only **2** are genuine judgment errors on sound evidence.

### 1.4.13 / 2.4.2 / 2.4.4 / 3.3.1 (21 cases: PIPELINE 12, RUBRIC 9, no SC gap)
- **1.4.13 PIPELINE** listener-derived `hasHoverContent` — `act-page-collect.js:1015` already collects
  `el.listenerTypes` (shipped as P5 for 2.1.2) and 1.4.13 throws it away. Plus `appearedSig`'s
  topmost-flipped guard (`exp-runners.js:1472`) drops a revealed tooltip when its portal wrapper is a
  0×0 absolutely-positioned layer (the React/Vue pattern). 4 cases.
- **2.4.2 RUBRIC** instance-discriminator clause in `page-title-v0.md` (4 cases) — no new instrument;
  all four discriminators are on screen. Grounded in TT 12.B and F25.
- **2.4.4 RUBRIC** — **an over-correction in R3.** The clause tells the judge to compare name against
  `href` but is silent on the agreement case, so the href leaked in as a *source* of purpose (the judge
  wrote "a step-by-step chicken kabsa recipe PDF"; "PDF" appears nowhere in the name or on screen).
  Add the asymmetry: **destination evidence may REFUTE a name, never RESCUE one.**
- **3.3.1 PIPELINE** both surviving FPs are in one function: `visibleText()` (`exp-runners.js:605`)
  returns `textContent` only, so an `<img alt>` — which 3.3.1 expressly permits as a text alternative —
  is discarded before the P9a credit path is reached; and the unchanged-surface branch has a credit path
  but no abstain path, so a *pre-rendered* inline error becomes a hard BARRIER where the identical
  *dynamic* error would be a PARTIAL. Both deterministic; the LLM abstained correctly on both pages.

---

## 5. Corpus findings

**20 of 122 (16.4%) are corpus defects.** Notable:
- The **`error-summary-incoherent-with-flagged-state` family (7 cases) has an unsound premise**: 3.3.1's
  Understanding says the SC "does not cover which of these methods should be used", TT 5.F evaluates per
  erroring field, and on every page each field actually in error carries `aria-invalid` plus a correct
  associated message. If relabelled `passed`, 3.3.1 recall rises 82.8% → **91.3%** while its FP rate
  rises 33% → **38%** — so the exposure is on *precision*, not on the reported gain.
- **4.1.3 recall from this corpus is optimistically biased**: all 6 scope-boundary pages carry
  `data-intended-classification="failed" data-sc="4.1.3"` on `<body>`, all 5 after-the-fact pages carry
  `data-region-born-with-content="true"` on the node under test, and 4.1.3 owns **29 of the corpus's 119
  prose-leak files**.
- Three 2.1.2 cases are **forward-only** loops where Shift+Tab demonstrably escapes; ACT `a1b64e`
  requires escape in one direction only. Real defects, but 2.4.3 (or F42/2.1.1), not 2.1.2.

---

## 6. Recommended sequencing

1. **`build-v3.js:459` mint loop for instrument traps** — prerequisite for all 11 2.1.2 cases and the
   same shape blocking 4.1.3. Nothing else in 2.1.2 pays until this lands.
2. **1.3.1 table-gate split** — 9 cases, purely additive to `tVerdict`, invents no detector.
3. **2.4.3 rubric clauses + tool routing, shipped together** — 9 + 6 cases and kills 3 FPs.
4. **4.1.3 page-level obligation + `TRIAGE_SCS` removal** — 8 cases, but land the rubric exceptions
   first and watch a 5-case specificity denominator.
5. **The three P2 evidence defects** (ring start, labels, 90 s timeout) — cheap, and they currently
   corrupt the lane that gained most.
6. Then the new detectors (F42, F34, F2, peer-group colour), each with its own held-out gate.

Everything above states the over-correction it must not cause. The first campaign's tab-order fix
recovered 8 cases and introduced 4 false positives; that trade was only visible because it was measured.
