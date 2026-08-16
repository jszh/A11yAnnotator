# Residual fix campaign — executing the change plan

**Input:** [RESIDUAL-ROOTCAUSE-AND-CHANGE-PLAN.md](RESIDUAL-ROOTCAUSE-AND-CHANGE-PLAN.md) (122 root-caused
failures, `3aedcb47`). **Baseline commit:** `3aedcb47`.
**Scope:** the report's §6 sequence, plus the two recommendations it identified as WRONG, plus a prompt-hygiene
defect found during the work.

Every fix below was validated the same way: reproduce the failing shape live, apply the change, re-probe the
same page end-to-end through `orchestrate`, and — where the change widens an aperture — **measure the new
aperture held-out across the whole 926-page corpus before wiring it**. Unit tests pin the observable
consequence (an obligation exists; a disposition is a barrier; a signal reaches the prompt), never the
presence of prose. That is deliberate: the previous campaign's R1 shipped 38 lines of correct F46 prose that
a hard gate 180 lines above it made unreachable, and no test noticed.

---

## 1. The five fixes that had not worked

| | what was wrong | what landed |
|---|---|---|
| **R1** 1.3.1/F46 | prose added; the deterministic table gate never touched, and it self-describes as "a HARD GATE you may not override" | `tableSemantics`, a second verdict computed from independent facts. `tVerdict` is byte-identical — verified by a test that pins its three outcomes. |
| **P3b** `type=submit` | explicit submits still excluded, so 6 cases had no trigger at all | excluded only `reset`/`image`; a one-shot capture-phase `submit` guard `preventDefault`s the navigation, so a submit is drivable |
| **P3b** routing | correct findings discarded — 4.1.3 went to `TRIAGE_SCS`, which `score-lib` never reads | 4.1.3 removed from `TRIAGE_SCS`, added to `INSTRUMENT_BARRIER`, and given a mint loop |
| **P3a** live regions | fixed the half that wasn't broken: 7 of 8 misses have **no live region at rest**, and that absence *is* the failure | page-level 4.1.3 obligation, gated on the detector having observed a change |
| **P7** empty announcements | landed with no rubric consumer | a clause that reads `emptyLiveRegionEvents`, plus a whole observation channel |

## 2. The keystone

`build-v3.js` gave `axeObs` and `detBarrierObs` mint loops and gave `trapObs` none, so a confirmed trap could
only *fill* an obligation the oracle had enumerated — and it cannot, because the detector reports a **region**
xpath while the oracle enumerates per **element**. Added `trapMintedObligations`, mirroring the existing two.

The guard is structural rather than restated: `trapObs` is built from `!f.review` rows only, and a directional
one-way loop is emitted with `review: true` (ACT `a1b64e` requires escape in one direction only), so it cannot
mint. Four tests pin this, two of which fail without the loop.

**The mint loop alone recovered nothing on this corpus** — the detectors do not fire at rest on the modal
family, because a closed dialog has no visible focusables and therefore no candidate region. So a **bounded
reveal pass** was added: reload, click up to two ranked openers, re-run the trap detectors. It is gated on the
page actually having a hidden dialog-shaped region with ≥2 focusables — no hidden dialog, no clicks.

> **A bug I introduced and caught only end-to-end.** The reveal pass worked in isolation and returned nothing
> through the real lane. Cause: it enumerated openers against the page *as the instrument lane had left it* —
> and the status detector clicks every safe trigger, so the dialog was already open and the "is there a hidden
> region" precondition answered no. It now reloads before looking. Verified through `runInstrumentsForUrl`,
> not through the standalone probe that had misled me.

## 3. Tab-order evidence — the fix that gained most was shipping wrong data

`body.tabIndex=-1; body.focus()` was meant to anchor the ring at the document start. Measured directly, it
does the opposite in two ways:

1. It **moves the sequential-navigation starting point** into `<body>`'s DOM position, so Chromium resumes in
   DOM order and reaches positive `tabindex`es only after crossing the document boundary. On a page using
   positive tabindex to *repair* its order, the untouched walk gives `ti=1,2,3,4,5`; after `body.focus()` the
   same page records `3,4,5,<doc>,1,2`. The judge read index 0 as first and failed a conforming page.
2. Under `showModal()` everything outside the dialog is inert, so the call silently does nothing.

`blur()` was measured as an alternative and does **not** restore the starting point once focus has moved — it
only looked correct on a page where focus had never moved. There is no in-page primitive that fixes this.

**Resolution: don't touch focus; un-rotate the ring afterwards.** The `<doc>` sentinel is the ring boundary
(exactly one crossing per cycle), so the true order is recoverable by rotating the recorded sequence to start
just after it. Verified to reproduce the user-visible order on all three shapes. `startAnchored` is reported
either way, and the rubric is told not to argue from list position when it is false.

Two further defects in the same lane: stop labels were `innerText || textContent || value`, which is **empty
for every `aria-label`led control** — the commonest 2.4.3 shape; they now resolve the accessible name the way
the AX tree does. And the 90 s instruments cap replaced the whole bundle with `empty`, discarding a tab order
already in hand on **17.1% of a run**; a `partialSink` now salvages what was measured.

## 4. Two recommendations from the previous round were wrong

- **`render_with_overrides(grayscale)` as required 1.4.1 evidence — withdrawn.** Grayscale maps colour to
  luminance, so two hues differing in lightness survive it looking distinct and the re-render "confirms" a cue
  a colour-blind reader never receives. `micro-checks.js:129` had already **measured** this and pinned the
  1.4.1 micro-check to the colour crop; the routing contradicted the repo's own finding. `compute_contrast_ratio`
  is routed instead (G183's ≥3:1 separation is the part that *is* decidable).
- **The 2.4.4 name-vs-destination clause over-corrected.** It was silent on the agreement case, so a
  destination could act as a *source* of purpose. Added the asymmetry: destination evidence may **refute** a
  name, never **rescue** one — 2.4.4 asks what the user can determine from the link text, and they cannot see
  an `href` before following it.

## 5. Aperture measurements (taken before wiring, not after)

| new signal | held-out aperture | notes |
|---|---|---|
| `tableSemantics` suspects | **2/872 pages (0.2%)** outside 1.3.1; zero false `LAYOUT_STRUCTURE_SUSPECT` | first cut flipped two genuine data tables; the *credible header axis* exemption (an axis ≥2 header cells wide, not a single `colspan` masthead) fixed it |
| colour peer groups | **84% of 926 pages produce zero**; mean 0.23, p90 1 | matches the plan's predicted envelope |
| colour references in prose | **3.1% of 926 pages** (29), mean 1.10 | a bag-of-words first cut hit **18.1%**, almost all attributive adjectives; rewritten as three requirement-sourced *constructions* |
| F42 emulated controls | **99.0% of 926 pages produce zero**; mean 0.03, max 5 | every page it fires on is genuinely about pointer-only handlers |
| F34 whitespace columns | **98.9% zero**; max 1 | every hit is on a faked-columns page |
| F10 embedded-format traps | 13 candidate pages corpus-wide, 12 with a live boundary, **exactly 4 report a trap — the 4 GT-failed cases** | zero false positives |

## 6. Prompt hygiene — a defect found during the work

Several clauses written while root-causing quoted the eval pages being debugged, and one **pre-existing**
rubric line stated a case's ground-truth label outright ("confirmed against this project's own held-out corpus
ground truth: … is a Pass, not a Fail"). Rubrics are prompts, so this teaches to the test and silently inflates
every number the harness reports.

Six of my own examples and that pre-existing one were rewritten generically, and
`tests/llm/prompt-corpus-leak.test.js` now enforces three rules mechanically: no rubric may state a
ground-truth outcome or cite the eval corpus; none may name a corpus case family; and no distinctive quoted
example may appear verbatim in any corpus page. Normative quotation (WCAG SC text, Understanding, F/G
techniques, ACT rules, DHS Trusted Tester and its published worked examples) is explicitly allowed — citing
the requirement is the basis on which a rubric argues, and those documents are public and independent of the
eval set.

## 7. What the ACT gate refuted — a report recommendation that was wrong

The first gate run came back with **3.3.1 tp 4 → 1**. The cause was one of this campaign's own changes: the
residual report observed that an error rendered DYNAMICALLY reaches a credit path (at worst PARTIAL) while
the byte-identical error already in the DOM falls through to a hard BARRIER, and called that asymmetry a
defect. Softening it to an abstain turned three GT-failed ACT `36b590` cases into misses. Reading them:

| page | why it is a real failure |
|---|---|
| a generic *"Please fill the field correctly."* over a two-field form | names neither the field nor the problem |
| *"Invalid value for age."* | identifies the field, not the invalid value |
| the same message carrying `aria-hidden="true"` | no AT user ever receives it |

The third settles it on its own. **The asymmetry is not a defect** — a message sitting in the DOM,
unreferenced by the field and never surfaced by the submit, is not evidence the error was identified *to
this user*. Reverted; `36b590` returned to baseline exactly (tp 4, fn 1, tn 4). Two unvalidated synthetic
FPs do not outweigh three validated TPs, and the validated ACT subset is the gate that decides that.

A first attempt at the same fix had an additional bug worth recording: it gated on `fieldInvalid`, which is
a property of the INPUT, so once `aria-invalid` was set every unchanged text in the form — the field's own
`<label>`, the submit button — satisfied the condition. That would have cleared a page whose only error
signal was a red outline and a `title` tooltip.

## 8. The items this campaign initially skipped, then went back for

Sequencing by leverage is not a reason to leave work undone. Four of the five were tractable:

- **F42 emulated controls** — a new `control-semantics` family (1.3.1), collector fact, and rubric. An
  element with a script activation handler, no interactive role, no focusability, no interactive descendant,
  and not a page-sized delegation root. Fires on exactly the three missed cases and stays silent on the
  family's GT-pass. Held-out: **99.0% of 926 pages produce zero**, mean 0.03, max 5.
- **F34 whitespace columns** — a new detector reporting text whose whitespace runs END AT THE SAME character
  offsets across lines, only where `white-space: pre*` makes them render. Fires on both missed cases, silent
  on the GT-pass. Held-out: **98.9% zero**, max 1. Wired as evidence to the 1.3.1 page-level obligation that
  already exists, rather than inventing a family for it.
- **2.1.2 boundary-vs-escape** — `stillInside` reported `outside` for a `<body>` landing, and EVERY tab ring
  crosses the document boundary once per cycle, a native `<dialog>`'s included. So `probeDirectionalEscape`
  answered `trapped: false` for the entire native-modal family while still confirming JS traps that snap
  focus back without touching `<body>`. Replaced with a three-outcome position check and a bounded tolerance.
- **Two 1.3.1 rubric items** — wrong-list-TYPE promoted from a trailing sub-clause to an enumerated failure
  with its own guard; the requirement-cue clause widened from graphical-only to positional / stylistic /
  placeholder-only.

- **F10 embedded-format traps** — the item that had been written off as "needs per-frame CDP execution
  contexts". It does not. When focus is inside embedded content, the HOST document's `document.activeElement`
  IS the boundary element — the `<iframe>`, the `<object>`, the shadow host — so the whole family reduces to
  one observable: put focus into the boundary, press Tab, and see whether activeElement ever moves off it.
  Two details decided the outcome, and both were found by measurement rather than reasoning:
  1. **You must Tab IN, not `.focus()` in.** Focusing an `<object>` host puts focus on the host, so the next
     Tab leaves for the element after it and the probe concludes "escaped". Walking in with Tab lands focus
     on the first station inside the embedded document — where the user actually ends up, and where the trap
     is. This alone was the difference between missing and catching the `<object>`/SVG case.
  2. **Escape must be probed.** A shadow-root editor that swallows Tab (inserting a tab character is what an
     editor is for) but implements and documents Escape is an ACT `a1b64e` PASS. Without the Escape probe it
     read as trapped — measured directly against that GT-pass page.
  Budget is sized from the embedded document's own focusable count where it is same-origin; cross-origin
  content cannot be counted, so those emit as `review` (from outside, "trapped" and "slower than we waited"
  are the same observation). **Result: all 4 GT-failed cases detected, both GT-passes clean, and across the
  whole 926-page corpus exactly 4 pages report a trap — those same 4. Zero false positives.**
- **P5 cross-frame + ancestor delegation** — two silent blind spots, both closed. The objectId handed to
  `DOMDebugger.getEventListeners` came from a `Runtime.evaluate` in the TOP frame, so for an in-frame node it
  returned `[]` *indistinguishably from "no listeners"*; it now re-resolves via `DOM.resolveNode` on the
  backendNodeId, which CDP binds in the node's own context. And `depth` is DESCENDANT depth, so no value of
  it ever reaches an ancestor — a handler on a container that dispatches for its rows was invisible on every
  element it served. Now one-level ancestor listeners are recorded per element (`ancestorListenerTypes`,
  under the same query budget) and the page-level delegation roots once per page
  (`page.delegatedListenerTypes`). Measured on a real page: in-frame listeners now resolve where they
  previously read empty, and 20 elements on a delegation-heavy page gained ancestor listener types.

**F2 was built and then deleted.** Two shapes (a styling outlier within a peer set; a repeated inline
convention with no semantic markup), each tightened after measurement — the first cut fired 5–6 times per
page on ordinary typographic hierarchy. Both ended up sound and tight, and both recovered **zero** of their
two target cases, firing only on pages already caught. A detector that recovers nothing is prompt surface
and FP surface for no gain, so it is not shipped and **F2 remains genuinely unfixed**.

## 9. Still not fixed

- **F2 — presentation used to convey information** (2 cases). Built, measured, deleted; see above. The two
  shapes it needs are a styling OUTLIER within a peer set and a repeated inline CONVENTION, and neither
  reached the cases that matter. What the corpus cases actually require is a judgment about whether a
  visual distinction carries meaning, on content whose peers are scattered rather than siblings.
- **Deeper listener delegation.** Ancestor listeners are resolved ONE level up; a handler three containers
  away is still invisible. One level covers the common container-dispatches-for-its-rows pattern, and going
  deeper costs a CDP round-trip per level per element.
- **The 20 corpus defects** are untagged, and the `error-summary-incoherent` relabelling (7 cases) is a data
  decision left to the owner.
- **No synthetic re-run** has been performed, so there are no recall/FP numbers for any of this work. The
  aperture figures above are held-out counts, not outcome scores.

## 10. Gates

- **ACT 581-case deterministic gate: BYTE-IDENTICAL to the `postfix-2026-08-15` baseline** — every headline
  metric (tp 13, fn 101, fp 1, tn 263, agreement 0.7302) and every per-SC cell unchanged. Run TWICE: once
  after the main campaign (`v3-act-subset-round2-final/`) and again after the F10 + P5 work, which drives Tab
  on the ACT set's own iframe rules and so genuinely needed re-checking (`v3-act-subset-round2-f10/`).
- **Tests:** 964 tests, **963 pass**. The single failure is `ocr-sidecar.test.js`, a file-level hang from the
  PP-OCRv6 Python sidecar not exiting — the identical entry is present in the previous campaign's green log,
  and every test inside the file passes. Zero real failures; 34 of the tests are new in this campaign.
- Every widened aperture measured held-out **before** being wired.
- **What no gate here covers:** recall and FP on the synthetic corpus. Nothing in this document should be
  read as a claim that recall improved — only that the mechanisms the residual analysis identified now
  exist, fire on the cases they were built for, stay silent on their families' GT-passes, and cost nothing
  on the validated ACT set.
