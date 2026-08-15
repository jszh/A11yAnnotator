# Root-cause analysis — every FP and FN on the synthetic corpus

**Run:** `results/aug-annot-tools-on/` · Claude Sonnet 4.6 · tools ON · 405 pages from
`eval/act-augmented/` · commit `4ae7a60e` · 0 errors · 2026-08-15
**Scope:** all 158 false negatives + all 14 false positives = **172 cases**, individually root-caused.
**Method:** 8 parallel agents, one per failure cluster; every case read, most probed live;
every code claim cited to file:line and independently re-verified by the coordinator.

---

## 1. Headline

| | recall | FP rate |
|---|---|---|
| this synthetic corpus | **50.9%** (164/322) | **16.9%** (14/83) |
| official ACT subset (same harness) | 97.0% | — |

The gap is real and it is **not** a model-capability gap. Classified by what would have to
change to fix each case:

| class | cases | share |
|---|---:|---:|
| **PLUMBING** — evidence computed but not delivered, gates too narrow, collector blind | **97** | **56.4%** |
| **RUBRIC** — the question is never asked, or asked too leniently | **56** | 32.6% |
| **CORPUS** — the label or the page is wrong, harness was right | 13 | 7.6% |
| **TOOLING** — a genuinely missing or unrouted instrument | **6** | **3.5%** |

> **The answer to the question that prompted this analysis: missing tool support accounts for
> 3.5% of failures — 6 of 172, of which only 2 are truly "no tool exists".** The harness
> already owns nearly every instrument it needs. It loses on delivering their output to the
> judge (plumbing) and on never asking the right question (rubric).

**159 of 172 cases are genuine harness failures; 13 (7.6%) are corpus defects.** Confidence:
131 high / 38 medium / 3 low. (Counted by root cause. Note `realViolation` has inverted polarity
between the FN and FP buckets — on a GT-**pass** page, `realViolation:false` means the label was
right and the FP is genuine, so that field must not be summed across buckets.)

### Root-cause detail

| root cause | n | class |
|---|---:|---|
| `applicability-gate` | 42 | plumbing |
| `rubric-coverage` | 41 | rubric |
| `evidence-gap` | 27 | plumbing |
| `collector-blind` | 20 | plumbing |
| `rubric-judgment` | 15 | rubric |
| `corpus-label-wrong` | 11 | corpus |
| `aggregation` | 4 | plumbing |
| `tool-not-invoked` | 4 | tooling |
| `wrong-element` | 4 | plumbing |
| `missing-tool` | **2** | tooling |
| `corpus-page-broken` | 2 | corpus |

---

## 2. Two structural facts that frame everything else

**(a) Recall here is entirely LLM-driven.** All 164 catches carry `llmFlag`; only 30 also have
a deterministic barrier, and **none** is deterministic-only. Six of ten SCs — 1.1.1, 1.3.1,
2.4.2, 2.4.3, 2.4.4, 4.1.3 — have *zero* deterministic catches. This corpus was built to hold
defects automated checkers miss, and it succeeds: axe/IBM/QualWeb contribute ~nothing, so
50.9% measures the judge lane alone. (Agent C ran axe-core 4.10.3 over all 21 of its 1.3.1
pages to confirm: axe has no `layout-table` rule in 4.x, so the six F46 cases are invisible to it.)

**(b) 17.7% of GT-fail cases were never asked.** 57/322 produced zero in-scope obligations —
no rubric verdict, no agent verdict. No rubric change can reach them. Excluding them,
**conditional recall is 61.9%** (164/265). The deficit splits roughly evenly between
"never asked" and "asked and got it wrong."

### `TRIAGE_SCS` membership predicts recall collapse

`build-v3.js:861` routes 1.4.1, 1.3.3, 1.3.2, 2.4.3 and 4.1.3 into a **non-ledger review
queue** the scorer never reads — deliberately:

> These are review packets, NOT PROVISIONAL ledger rows — the project has no sound
> enumeration story for these families yet, so they never clear/barrier.

| lane | recall |
|---|---|
| `TRIAGE_SCS` members present in this corpus (1.4.1, 2.4.3, 4.1.3) | **24/93 = 25.8%** |
| all other SCs | **140/229 = 61.1%** |

All three TRIAGE SCs sit in the bottom four. The only non-triage SC down there is 2.1.2
(27.6%), independently explained by the `focusRisk` and `visible()` gates below. This is not
a bug — it is a documented architectural decision whose cost is now measurable.

---

## 3. Cross-cutting defects (affect every SC)

### 3.1 A registry/oracle drift aborts the entire build — **found independently by two agents**

`coverage-registry.js:37` requires `text-contrast` for **any** text-bearing element:
```js
{ id: 'has-text', when: (el) => factHasText(el), families: ['text-contrast'] }
```
`applicability-oracle.js:223` withholds it for inactive text (the 1.4.3 exemption):
```js
if (factHasText(el) && el.inactiveText !== true) fams.push('text-contrast');
```
They disagree, so any page containing **a disabled control with text** raises a fail-closed
Rule-16 coverage error, and `build-v3.js:86` returns `{ok:false, results:null}` — **zero
obligations for every SC on that page**. `score-lib.js` then records this crash as
`noObligation`, so a build failure is permanently disguised as a coverage gap.

- Measured run-wide: **8 of 405 pages abort**; all 8 scored `noObligation`; 6 are `expected:failed`.
- Enrichment: disabled controls appear in 7/82 `noObligation` rows vs 2/323 elsewhere (~10×).
- Reproduced end-to-end on `removal-of-status-case-06` (`built.ok=false`, empty ledger, while
  the standalone oracle mints the correct obligation).

**Fix:** one missing `&& el.inactiveText !== true` in the registry predicate. Highest
priority in this document — per-case conclusions on affected pages are unreliable until it lands.

### 3.2 The scorer conflates three different events

`score-lib.js:46`:
```js
else if (nVerdicts === 0) outcome = rec.inScopeAutoPartial > 0 ? 'noVerdict' : 'noObligation';
```
`noObligation` therefore means *any* of: obligation never created · obligation created but
resolved to a deterministic PARTIAL and never sent to the LLM · **the build crashed**.
This is what camouflaged both §3.1 and the 1.4.13 aggregation bug (§4.3). 55 of the 57
`noObligation` rows genuinely had zero obligations, so the headline number survives — but the
label cannot be used diagnostically as-is.

### 3.3 Dead code: three finished instruments wired to nothing

| instrument | status | cost |
|---|---|---|
| `runInteractionChecklist` + `use-of-color-adequacy` (`micro-checks.js:132`) | defined, exported, **zero callers** | a per-cue 1.4.1 check whose own header records two bake-off wins with "zero false-barriers" |
| `runRevealChecklist` / `reveal-then-check-focus-order` (`reveal-checklist.js:9`, `reveal-state-runner.js:73`) | defined, exported, **zero importers** | implements the exact F85 verdict; 3 cases would become deterministic barriers |
| `REQUIRED_TOOL_ROUTING` (`required-tool-routing.js`) | declarative only; **no consumer** | declares `render_with_overrides(grayscale)` REQUIRED for 1.4.1; only 2.4.4's `resolve_destination` was ever hard-wired (`orchestrator.js:357`) |

---

## 4. Per-SC findings, ranked by recoverable cases

### 4.1 — 2.4.3 focus order (20.0% recall, worst in run): **four independent breaks, zero evidence delivered**

Found by two agents separately. The rubric opens by telling the judge the tab sequence
"is handed to you"; a live `precomputeSignals()` call returns `{rawElementHtml:null, enclosingHtml:null}`.

1. `run-instruments.js:61-62` — `collectTabOrder()` records `{index, xpath, tag, rect, label}`
   per stop, then only `tabOrderFindings(tab).findings` is kept. **`tab.order` is discarded on
   the next line.** `tabOrder` has zero occurrences in `llm-adjudicator.js`, `obligations.js`,
   `build-v3.js`, `judgments.js`.
2. `kbd-graph.js:45` implements `opts.backward` (Shift+Tab); `run-instruments.js:61` never passes it.
3. `llm-adjudicator.js:149` — `focus-management` is absent from `PAGE_STRUCTURE_SKILLS`, so
   the page-level subject gets no structure thread (unlike 2.4.2/1.3.1).
4. `vision-capture.js:126` — `STATE_TRANSITIONS` has no `2.4.3` key, so the declared
   before/after state pair is never captured.

The rubric's abstain clause (`focus-order-meaning-v0.md:49-50`) then fires correctly: the judge
was promised an artifact, given none, and abstained 17/17. **Do not loosen the rubric — supply
the evidence.** `probe-case.js` settles these in seconds. Recovery: ~11 of 24 from passing
`tab.order` through; +6 more need `interact_and_observe` routed to 2.4.3 (it currently lists
neither 2.4.3 nor `focus-management`).

### 4.2 — 1.4.1 use of colour (27.6% recall **and** 33.3% FP — worst both ways)

Both directions, one cause: **the lane keys on the wrong feature.** It asks "is a non-colour
affordance visible in this crop" when the SC asks "is colour the *means*".

- **Under-firing:** `applicability-oracle.js:313` attaches `use-of-color` only to
  `role==='link' || isFormField || FORMFIELD_ROLE` — and `FORMFIELD_ROLE` excludes button/switch,
  `isFormField` is input/select/textarea only. Charts, colour-coded controls, legend-keyed
  cells and status rows are structurally invisible. 15 FNs.
- **Over-firing:** all 5 FPs sit *inside* that narrow lane. `use-of-color-v0.md` has no
  applicability precondition, so a link styled **identically** to its prose (1:1 contrast)
  fails the ≥3:1 lightness escape hardest — verdicts literally read "identical color… 1:1
  contrast ratio → LIKELY_BARRIER". The rubric's own escape hatch (`:59`, "when the handed axe
  `link-in-text-block` signal reports PASS, DEFER to it") is **unreachable**: 
  `act-page-collect.js:1100` runs axe with `resultTypes:['violations','incomplete']`, so passes
  are never collected. Agent H ran axe directly — it passes every link on all three pages.
  **~2-line fix, recovers 3 of 14 FPs.**

### 4.3 — 4.1.3 status messages (29.4% recall): obligation keyed on the wrong element

`applicability-oracle.js:241`:
```js
if (el.liveRegion === true) fams.push('status-message');
```
The obligation attaches only to something that **already is** a live region — so the canonical
4.1.3 failure (a success panel swapped in as a plain `<div>`) is structurally unreachable.
Where an unrelated live region happens to exist, it absorbs the obligation and the case scores
`missedAgree` instead of `noObligation` — the same root cause producing two different labels.

Compounding, on 5 further cases a *valid* purpose-built region exists at rest but is empty or
hidden, so `act-page-collect.js:452-453`'s visibility filter drops it before line 627 records
the `liveRegion` fact. The collector's own comment there ("Kept even when empty") describes an
intent the code never reaches. **The real determinant is resting CSS geometry.**

`status-detector.js` exists and works — run live, it flagged the defective element six times on
`is-it-a-status-case-05`. It is neutered by (a) `:53` falling back to `el.type`, which is
`'submit'` for every typeless `<button>`, and (b) `build-v3.js:855-869` routing 4.1.3 into
`TRIAGE_SCS` (§2).

**Instrument defects found by re-running the harness's own tools:**
- `cdp-tools.js:697` — `announcements.filter(a => /^(polite|assertive)\b/i.test(a))` matches the
  literal string `"polite: "` produced when a region is emptied, so `noLiveRegionAnnouncement`
  reads false and the judge sees a non-empty queue while a user hears nothing. 4 cases.
- The VSR is **`aria-atomic`-blind**: for `role=status` with no `aria-atomic` where only an
  inner `<b>` changes, Guidepup voices the whole region; real AT announce the bare numeral.
  The judge quoted that string as clearing evidence. This is the one true `missing-tool`.

### 4.4 — 1.3.1 info & relationships (50.0% recall): a 4-facet rubric on the broadest SC

21/21 judged genuine violations — **zero corpus defects**. The judge rarely reasoned wrongly;
the rubric never asked.

- **9 cases — an FP-suppression clause costing recall.** `info-relationships-v0.md:115-122` and
  `:213-215` say the mismatch direction is "VISUAL → PROGRAMMATIC only" and *"if the only
  mismatch you can name runs programmatic→visual, return NOT REPRODUCED."* Written to stop
  sr-only-heading false positives, it forecloses **WCAG F46** (th/caption/summary on a *layout*
  table) — which is by construction a programmatic→visual claim — plus H42 headings-on-bylines,
  blockquote-on-first-party-prose, and dl-on-non-term-pairs.
- The deterministic table gate independently resolves every F46 case to do-not-flag: `VALID`
  where a `scope=`/`headers=` resolves (`llm-adjudicator.js:592-594`), or `NOT_DATA` via
  `collect-tables.js:96`'s `rows.length > 1` requirement.
- **F91/F92 circularity:** `isData = looksLikeDataTable && roleOverride !== 'presentation'`
  (`llm-adjudicator.js:589`) — the two canonical suppression defects are *exactly* the conditions
  that make the table `NOT_DATA`, and the rubric then hard-gates the judge into silence.
- No control-semantics facet (F42: `<span onclick>` pagination, clickable `<tr>`, `<img onclick>`
  submit, role-less div tabs) — 4 cases. No faux-*table* detector (F34/F32) — 2. No
  styling-outlier signal for F2 — 3.
- Three one-line collector fixes are independent and near-certain: emit dt/dd **tags** in
  `collect-lists.js:69` (the `dl` inversion is currently unrepresentable in the evidence),
  collect the `summary` attribute in `collect-tables.js`, add an ARIA-role structural inventory.

### 4.5 — 2.1.2 keyboard trap (27.6% recall): resting-DOM collection

- `act-page-collect.js:577-579` — `focusRisk` fires on inline `onblur`/`onfocus`/`onfocusout`
  **or** a modal-ish ancestor (`el.closest('[role=dialog],…')`). Across all 20 2.1.2 pages there
  are **zero** inline focus handlers; every trap uses `addEventListener`. `input-gate-case-02` is
  the proof — an `addEventListener('blur')` self-refocus trap, exactly what the predicate was
  written for. Fix: add a listener-derived disjunct using `listenerTypes`, which the collector
  already captures for the 2.1.1 keyboard-orphan detector. 10 cases.
- Closed modals/menus/grids fail `visible()` (`:452-453`) and `dynamic-subjects.js` cannot rescue
  them, because it only expands subjects an *experiment* found — and no experiment runs without an
  obligation. 5 cases.
- Sub-documents: in-frame records hard-code `inModal:false, focusRisk:false` (`:873`);
  `walkShadow` collects only iframes inside shadow roots; `<object>`/`<embed>` are never
  descended. 5 cases.

### 4.6 — 3.3.1 error identification (59.4% recall, **66.7% FP** — worst FP rate)

The 4 FPs are **deterministic**, not LLM — the LLM was correct or abstained on every one.
`form-error-probe` ignores an error already on screen, synthesizes a *new* error, submits, sees
nothing appear, and reports `errorNotIdentified`. The one path that could credit a pre-existing
error (`exp-runners.js:709`) requires the `aria-describedby` target to also pass `errorStyled()`,
whose `ERR_CLASS` alternation (`error|invalid|warn|danger|fail|required|alert|toast|…`) matches
none of the names real pages use — `err`, `msg`, `field-msg`. Proved with single-token A/B
copies: `class="msg"` → `"msg error"` removes the barrier entirely. A second independent defect
fabricates an error condition on optional `type=tel` fields by writing `''` (a valid value) and
then demanding an error message.

On the FN side, 6 of 10 misses are a **semantic-consistency gap**: `error-identification-v0.md`
judges the presence and specificity of error text but never its *truth*. All six cleared at high
confidence with the contradicting value visible in the crop. Prompt-side fix.

Also: on two `novalidate` forms with no constrained field, the judge cleared obligations quoting
**invented** native validation strings ("Veuillez remplir ce champ."). Headless Chrome confirms
`form.checkValidity()===true` and `validationMessage===""` everywhere; the French localisation is
a second tell, since Chrome localises to the *browser* locale, not the page's `lang`.

### 4.7 — 2.4.4 link purpose (79.3% recall) and 2.4.2 page titled (80.8%)

Best-performing SCs; residual misses are narrow.

- 2.4.4 **never compares a link's name to its destination.** All three `link-purpose-v0` failure
  modes test whether the name is *vague*, so a specific name is an automatic clear — a link
  reading "Read our Privacy Policy" pointing at `#terms` passes. The judge is not
  evidence-starved (2.4.4 is outside `HTML_RUNNER_OWNED_SC`, so it holds the literal markup); it
  is never asked. `resolve_destination` cannot close this: it fingerprints the destination
  *document*, so `#privacy` and `#terms` return byte-identical results. True detection on this
  shape is **0/5** — the one scored "caught" cleared the defective skip link and flagged two
  unrelated controls.
- **The hypothesis that the round-3 `enclosingContext` FP fix traded away recall is refuted:**
  it is implicated in none of the six 2.4.4 misses; all six cleared on the accessible name alone.
- 2.4.2 misses are judge **inconsistency**, not coverage — the same rubric caught identical shapes
  in the same run. The discriminator is pure string overlap: when a topicless title is also the
  h1's leading token ("Exhibit B"), the judge reads "matches the visible content" as "identifies
  the topic".

### 4.8 — 1.4.13 hover/focus content (68.0% recall): success causes the miss

`applicability-observer.js:33` defines a hover trigger as `title || aria-describedby`, while
`exp-runners.js:1401` reads:
```js
hasTrigger: hasTitle || hasDesc || true
```
The trailing `|| true` makes the expression unconditionally true — the first two operands are
dead. So observer and runner can only agree when the attribute happens to be present, which the
round-3 collector generalization deliberately made unnecessary. A **fully proven** barrier
(`anyPropertyFails:true, hoverable:false, dismissible:false`) therefore fails Rule-15 binding,
becomes a deterministic PARTIAL, and `build-v3.js:600` skips the LLM fill. Cases where the runner
*fails* stay auto-PARTIAL and get judged — which is how the other 17 were caught.

Separately, `exp-runners.js:1511` dwells `await H.settle(page, 1600)` before the persistence
re-check, so `persistent` is systematically optimistic for **any** auto-dismiss timer longer than
1.6 s. Measured on case-02: bubble visible at 0.1/1.6/3.0 s, gone by 5.2 s with focus still held.

### 4.9 — 1.1.1 non-text content (69.0% recall)

The harness **can** flag "wrongly marked decorative" — `applicability-oracle.js:292-298`
deliberately routes unnamed removed-from-tree images to `decorative-image-verification-v0`, and
it fired on the correct element. The lane fails on **evidence contamination**: `nearbyText` is
`textOf(el.parentElement)` (`act-page-collect.js:607-613`), which for an inline SVG **includes
the SVG's own suppressed `<text>`**. The redundancy test the whole rubric turns on
self-satisfies. Compounding it, `llm-adjudicator.js:350` ships `svgLiveText` with the steer
*"its text is REAL and machine-readable"* and no `removedFromA11yTree` guard.

The one genuine gate flaw is narrow: `decorativeSuspect()` requires `minDim >= 24`
(`applicability-oracle.js:151`), and the "Verified seller" badge is **22×22 — it misses by two
pixels**. Status badges are exactly the class whose presence-vs-absence *is* the datum.

Also: `long-description-completeness` is never handed the long description (the rubric promises
it at `.md:32-35`; no `aria-describedby`/figcaption resolution exists in `buildSignals`), and
`<area>` is invisible to the collector (0×0 client rect fails `visible()`).

---

## 5. Corpus defects — 13 of 172 (7.6%)

The labels held up far better than expected. Notable confirmed defects:

- **1.4.13 case-05 / case-06** (found by probing, not reading): an 11px dead gap (`top:135%`)
  makes the tooltip unreachable mid-travel — Hoverable genuinely fails; and `close(); term.focus();`
  re-triggers its own `focus`→`open` listener, so Escape leaves it open *and* moves focus. **Both
  pages' scenario text claims the opposite** — metadata-vs-shipped drift.
- **`multi-element-region-loop-case-05`** — reverse-only loop; forward Tab demonstrably exits at
  stop 13, satisfying 2.1.2. It is a 2.4.3 defect. (Ajit voted "no issue".)
- **Metadata drift is the dominant corpus defect**, as in the earlier hygiene pass:
  `esc-standard-exit-case-03`'s `ruleName` describes an OTP banking modal; the page is a clinical
  lab grid. `form-label-case-01`'s describes `<span>` labels and `title='Field 1'`, none present.
  The defect class often survives, but the description is unusable for routing.
- **SC drift:** `ascii-case-03` is genuinely broken but F32 maps canonically to 1.3.2, not 1.3.1.

**A prior I gave the FP agent was wrong.** I suggested the 10 `clear`-stratum FPs implied
mislabeling. 8 of those 10 are genuine harness errors, and both high-confidence corpus defects
sit in `unflagged`. The better explanation: `clear` is enriched for deliberately-built
boundary/control pages (11 of 14 self-describe as such) — which is what a human flags on sight
*and* what a barrier-biased judge flags. Same cause, not the same error.

---

## 6. Fix inventory, ranked by cases recovered per unit of work

| # | fix | site | recovers |
|---|---|---|---|
| 1 | add `&& el.inactiveText !== true` to the registry predicate | `coverage-registry.js:37` | 8 pages un-abort (6 GT-fail) + unblocks all per-case conclusions |
| 2 | pass `tab.order` through to the judge | `run-instruments.js:62` | ~11 of 24 on 2.4.3 |
| 3 | attach `status-message` on the *changed* element, not only `liveRegion===true` | `applicability-oracle.js:241` | ~7 (4.1.3) |
| 4 | widen `use-of-color` beyond links/form fields | `applicability-oracle.js:313` | ~15 FN (and re-frame 5 FP) |
| 5 | add listener-derived disjunct to `focusRisk` | `act-page-collect.js:577` | ~10 (2.1.2) |
| 6 | drop the `\|\| true` in the 1.4.13 trigger fact | `exp-runners.js:1401` | 2, and unblocks fix #7 |
| 7 | keep empty/hidden live regions through the visibility filter | `act-page-collect.js:452` | ~5 (4.1.3) |
| 8 | narrow the "never fail the INVERTED direction" clause to exclude F46 | `info-relationships-v0.md:115,213` | ~9 (1.3.1) |
| 9 | collect axe **passes** so the DEFER clause resolves | `act-page-collect.js:1100` | 3 FP (1.4.1) |
| 10 | credit an already-rendered error; widen `ERR_CLASS` | `exp-runners.js:709,613` | 4 FP (3.3.1) |
| 11 | drop the empty-announcement string | `cdp-tools.js:697` | 4 (4.1.3) |
| 12 | wire `runRevealChecklist` (F85) | `reveal-checklist.js` | 3 (2.4.3) |
| 13 | add a truth/consistency clause to error identification | `error-identification-v0.md` | 6 (3.3.1) |
| 14 | ask 2.4.4 to compare name against destination | `link-purpose-v0.md` | 4 |
| 15 | call `collectTabOrder` with `{backward:true}` | `run-instruments.js:61` | 1, cheap |
| — | revisit `TRIAGE_SCS` for 1.4.1/2.4.3/4.1.3 | `build-v3.js:861` | architectural; gates §2 |

---

## 7. Method, and what this analysis cannot tell you

- 8 agents, one per cluster; 172/172 cases covered; every code claim re-verified by the
  coordinator against the cited file:line before entering this document. Where an agent's
  characterization was imprecise it is corrected here (e.g. `focusRisk` also has a modal-ancestor
  disjunct; `ERR_CLASS` is an alternation, not the literal word "error").
- Agents were explicitly told the corpus labels are unvalidated and that "the label is wrong" is
  a first-class root cause. Three of the leading hypotheses I supplied were **refuted** by the
  agents that tested them (tool-not-invoked on 3.3.1/4.1.3; `enclosingContext` on 2.4.4; the FP
  stratum prior) — recorded above rather than quietly dropped.
- **`agentVerdicts` is empty on all 405 records.** `run-annotated-suite.js` never recorded which
  lane decided a case or how many tools it called. So the run-level fact that ~74% of
  tool-capable runs made zero tool calls (`agentBuilt: 397`, `multiTurnResults: 104`, 371 calls)
  **cannot be joined to per-case outcomes**. Add per-subject tool traces before the next run;
  one `tool-not-invoked` classification is inferred from verdict text rather than observed.
- **`probe-case.js` has an ordering bug**: the tab walk (lines 96-108) runs *before* `--click`
  (line 147), so `--click opener --tab` reports the **closed**-state tab order and every
  modal/menu trap looks clean. Anyone re-verifying the 2.1.2 cases needs an open-then-tab probe
  that follows `activeElement` across iframe and shadow boundaries.
- Findings on the 8 build-aborting pages are provisional until fix #1 lands.

---

## 8. Fixes shipped (2026-08-15)

Eleven defects fixed, each verified live against the failing shape **and** guarded against
over-correction. Regression suite: `scripts/v3/tests/coverage/rootcause-2026-08-15.test.js`.

### Corpus
The 13 corpus defects are tagged `needs-validation` in
`eval/act-augmented/_annotator/irr/case-reliability-tags.json` (now 34 total: 21 human-adjudicated +
13 harness-adjudicated), which `run-annotated-suite.js` already excludes from its default
`--include unflagged,clear,fixed`. **No `expected` label was flipped** — deciding a disputed label is a
human call; the tag only stops the case being scored as settled. Applied by
`_tools/apply-rootcause-corpus-tags.js`; the full 172-case root-cause export is persisted at
`_annotator/irr/rootcause-2026-08-15.json`.

### Plumbing
| # | fix | file |
|---|---|---|
| P1 | registry now honours the 1.4.3 inactive-text exemption — no more whole-build abort | `coverage-registry.js:37` |
| P2 | `tab.order` (forward **and** Shift+Tab) threaded to the 2.4.3 judge as `signals.focusOrder`, each stop carrying its rect | `run-instruments.js`, `llm-adjudicator.js`, `orchestrator.js` |
| P3a | empty/hidden live regions survive the collector's visibility filter; `liveRegionHiddenAtRest` recorded | `act-page-collect.js` |
| P3b | status-detector reads the type ATTRIBUTE, so a bare `<button>` is a valid trigger again | `status-detector.js:53` |
| P4 | 1.4.1 aperture widened to graphic surfaces (svg/canvas/role=img container), **not** plain `<img>` | `applicability-oracle.js:313` |
| P5 | `focusRisk` derived from real event listeners via `DOMDebugger.getEventListeners`, focusable elements only | `act-page-collect.js` |
| P6 | Rule-15 observer widened to CSS `:hover`/`:focus` and ARIA triggers, matching the runner | `applicability-observer.js:33` |
| P7 | an empty `"polite: "` no longer counts as an announcement; surfaced as `emptyLiveRegionEvents` | `cdp-tools.js:697` |
| P8 | axe **passes** collected (allowlisted) so the `link-in-text-block` DEFER clause is reachable | `act-page-collect.js:1100`, `orchestrator.js` |
| P9a | a pre-rendered error on an `aria-invalid` field is credited without a CSS-class heuristic | `exp-runners.js:709` |
| P9b | an optional field with no synthesizable invalid value abstains instead of fabricating an error | `exp-runners.js:662` |

### Rubric
- **R1 (1.3.1)** — the blanket "never fail the inverted direction" clause is replaced by the correct test:
  a hidden-but-ACCURATE structure is conforming; a structure the content does not have (**F46** `th`/
  `caption`/`summary` on a layout table, a heading on a byline, `<dl>` on non-term pairs) is a failure.
- **R2 (3.3.1)** — new INCORRECT-MESSAGE failure mode: the message must be TRUE of the error that
  occurred, not merely present and specific. Abstain path preserved.
- **R3 (2.4.4)** — new failure mode: a name that contradicts its destination. Explicitly guards shortened,
  redirect and opaque-slug URLs so it does not over-fire.
- **R4 (1.4.1)** — applicability precondition (colour must be the MEANS) plus a ban on asserting
  contrast ratios the judge was never handed. Directly targets the "identical colour ⇒ 1:1 ⇒ barrier"
  inversion behind 3 FPs.

### Tooling
- `probe-case.js` now walks the tab ring **after** `--click` as well as at rest (`tabOrderAfterClick`),
  with a trap heuristic. The old ordering reported the CLOSED page for `--click opener --tab`, so every
  modal trap looked clean — anyone re-verifying a 2.1.2 case with it would have been misled.
- `run-annotated-suite.js` records per-case tool use (`rec.toolUse`), so tool calls can finally be joined
  to outcomes. `toolCalls: 0` on a tools-ON case is now a finding, not missing data.

### Deliberately NOT fixed (filed in `docs/DEFERRED-TODO.md` with design notes)
- **Wiring the dead F85 `runRevealChecklist`** (~3 cases): needs new pipeline surface (catalog entry,
  experiment request, obligation binding). A feature, not a fix; landing it beside eleven other changes
  would have confounded the regression signal.
- **`TRIAGE_SCS` for 1.4.1 / 2.4.3 / 4.1.3**: a documented architectural decision whose cost is now
  quantified (25.8% vs 61.1% recall). Changing it creates obligations on all 581 ACT pages and could move
  the headline Table 1 numbers, so it needs its own pre/post experiment.

---

## 9. Outcome (2026-08-15, run `aug-annot-postfix-2026-08-15`, repo `c9b94a47`)

Measured on the **identical 392-case set** (the pre-fix run re-scored over the same cases, so the
exclusion of the 13 corpus defects is not credited to the fixes):

| | before | after | Δ |
|---|---|---|---|
| recall | 52.4% (164/313) | **64.2%** (201/313) | **+11.8pp** |
| FP rate | 12.7% (10/79) | 12.7% (10/79) | 0.0pp |
| F1 | 0.674 | **0.767** | +0.094 |

The outcome shift matches the diagnosis rather than being a generic lift: `noObligation` 54→36
(the gate/collector/build-abort fixes), `uncertain` 21→8 (the tab-order evidence), `missedAgree`
73→67 (the rubric fixes). **`TRIAGE_SCS` recall 26.7% → 45.6%** without touching that decision.

**Every SC improved or held flat.** Largest: 2.4.3 +26.7pp, 1.4.1 +25.0pp, 2.1.2 +21.4pp,
3.3.1 +17.2pp.

**What the flat FP rate conceals — and the one real trade.** 11 FPs were eliminated and 7 new ones
appeared. Four of the new ones are 2.4.3 and they are caused by the fix that helped most: handed a
tab sequence, the judge stops abstaining and commits, sometimes to "the tab order does not match the
visual left-to-right arrangement" — which this very rubric says is not a failure. Net 2.4.3 is
+8 TP / +4 FP, but `focus-order-meaning-v0` now needs a tightening pass on the
"different-but-sensible order is NOT a failure" clause. **Follow-up, not a completed item.**

Two further new FPs are 1.4.13 siblings of cases this analysis verified as corpus defects; they may
be mislabeled too, but that has not been checked.

**No adverse effect on ACT:** the deterministic 581-case gate is byte-identical to `postR3`
(tp 13, fn 101, fp 1, tn 263, agreement 0.7302). Test suite 886/886.
