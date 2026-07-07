# Harness Gap Analysis + Per-SC Implementation Plans — 8 New Success Criteria

**Date:** 2026-07-07
**Scope:** Concrete, implementer-ready plans to extend the v3 harness to 8 WCAG SCs beyond the paper's frozen 22-SC scope: **1.4.4, 1.3.5, 1.4.12, 1.3.3, 2.2.2, 2.4.1, 2.5.3, 2.2.1.**
**Inputs:** [`ACT-REST-CHECKER-COVERAGE.md`](./ACT-REST-CHECKER-COVERAGE.md) (5-checker baseline on the 609-case act-rest corpus), [`ACT-RULES-COVERAGE-ANALYSIS.md`](./ACT-RULES-COVERAGE-ANALYSIS.md) (in-scope-40 architecture vocabulary), the act-rest fixtures, and a direct read of `scripts/v3/`.
**Status:** PLANNING ONLY. No implementation, no commits, no git mutation.

---

## 0. How to read this doc

Each per-SC plan has the six sections the task requires: (1) what the ACT rule requires + what the fixtures exercise; (2) what the harness already has (file:line); (3) the gap (authoritative / non-authoritative / LLM-routing); (4) proposed design with exact decision procedure + expected tp/fn/fp + overfit risk; (5) effort + dependencies + validation protocol; (6) sequencing. §1 is the shared architecture every plan reuses; §2 is the scope-expansion decision; §11 is the round grouping; §12 is the cross-plan overfit + standing-decision ledger.

---

## 1. Shared architecture — how a new SC lands in v3

Verified by reading the code. Every plan below is an instance of this pipeline; cites are to the exact wiring points.

### 1.1 The three lanes (authority tiers)

Only **deterministic CLAIM dispositions** gate conformance. Everything else is non-authoritative and scored-vs-gold, never gating:

- **Authoritative:** a **catalog experiment** (`catalog.js`) whose **runner** (`exp-runners.js`, registered in the `RUNNERS` map at `exp-runners.js:1617`) emits typed outcomes → `resolveClaim` → a `CLAIM` disposition, promoted to authoritative only if `authority.js` promotes its `(experimentId, direction)` and the attestation matches the build (`build-v3.js:210-248`).
- **Non-authoritative shadow / PROVISIONAL fill:** axe findings (`axe-surface.js`), IBM findings (`checker-ibm.js`, inert/opt-in), deterministic/instrument/geometry barriers, and LLM-rubric verdicts. These only **fill an auto-PARTIAL obligation** (the `PROVISIONAL` tier) and can never override a deterministic `CLAIM/PARTIAL` — precedence `CLAIM ▸ PROVISIONAL ▸ PARTIAL`, barrier-dominates-clear (`obligations.js:26-107`).

### 1.2 The obligation ledger — what makes an SC *visible*

An SC is invisible to reconciliation until the **applicability oracle** enumerates an obligation for it. Obligations are atomic in `(xpath, sc, claimFamily)` and are derived **independently** from raw collector facts by `applicability-oracle.js` — `FAMILIES` (the registry, `applicability-oracle.js:23-84`) + `familiesFor(el)` (the per-element predicate, `applicability-oracle.js:196-306`) + `deriveObligations` (`:311-340`, incl. page-level pseudo-elements). Every enumerated obligation gets **exactly one disposition**; an un-filled one is an honest **auto-PARTIAL**, never a silent pass (`obligations.js:99-106`).

**Consequence for these 8 SCs:** each needs a claim-family registered in `FAMILIES` + a `familiesFor` branch, or its obligations are never enumerated and its runner/rubric has nothing to dispose. Two of the eight already have families (see §1.5).

### 1.3 The deterministic-runner contract

A catalog experiment (`catalog.js:12-220`) declares `{ sc, claimFamily, applicability.requires[], supports.{NO_BARRIER_OBSERVED,BARRIER_OBSERVED}.requires[], typedOutcomes[] }`. `validateCatalog` (`catalog.js:225-247`) enforces that `claimFamily` exists in the oracle and its SC matches. The runner (`exp-runners.js`) does `page.evaluate(measureX)` → builds a typed `outcome` object → `mk(request, id, sc, outcome, applicabilityEvidence, {...})`. `supportsDirection` (`catalog.js:251-258`) checks every `requires` flag is **strictly true**. The `reflow-runner.js` pattern (`measureReflow320` / `disposeReflow` / `runReflow`) is the cleanest template for a `page.evaluate`-based measure→dispose→run runner.

### 1.4 Non-authoritative surfacing hooks (already built, reusable)

- **axe surfacing** (`axe-surface.js:21`): `AXE_SURFACED_SCS = {1.1.1, 1.3.1, 1.3.5, 1.4.4, 2.1.1, 2.4.2, 2.4.4}` + prefix `3.1.` — **note this has grown past what [[harness-3-1-llm-evidence-lane]] records; 1.3.5 and 1.4.4 are ALREADY surfaced wholesale.** A surfaced finding is a shadow signal only; it becomes a PROVISIONAL barrier only if its SC is in `AXE_SC_FAMILY` (`build-v3.js:315` — currently `{4.1.2, 1.1.1, 2.4.4, 1.4.1}`) or `AXE_PAGE_LEVEL` (`build-v3.js:320` — `2.4.2` only). So axe surfacing 1.4.4/1.3.5 today **lands nowhere** (no family, not in the promotion map).
- **IBM** (`checker-ibm.js:21-22`): `IBM_HARD_SCS = {1.4.12, 2.5.3}` (decided FAIL → hard signal), `IBM_PRIOR_SCS = {1.4.1, 1.3.3}` (triage priors, always review). **Three of our eight SCs are already in IBM's scope.** Inert by default (needs the package + `V3_CHECKER`).
- **Checker-uncertainty → LLM** (`build-v3.js:418-421`): `CHECKER_UNCERTAINTY_FAMILY` already maps `2.5.3 → label-in-name` — an IBM/axe incomplete on 2.5.3 mints an obligation the LLM fills.

### 1.5 What already exists for these 8 SCs (measured against the code)

| SC | Family in oracle? | Rubric? | Checker signal? | Collector signal? |
|---|---|---|---|---|
| 2.5.3 | **YES** `label-in-name` (`applicability-oracle.js:47,262`) | **YES** `label-in-name-v0.md` | IBM hard (`checker-ibm.js:21`) | axName + visible text collected |
| 2.2.2 | **YES** `motion-control` (`applicability-oracle.js:66,237,245`) | **YES** `motion-control-v0.md` | — | `autoUpdatingText`/`autoMotion` collected; **no pause-control detection** |
| 1.3.3 | no | no | IBM prior (`checker-ibm.js:22`) | raw text only |
| 1.4.12 | no | no | IBM hard (`checker-ibm.js:21`) | **no** letter/word-spacing/line-height computed styles |
| 1.4.4 | no | no | axe surfaced but lands nowhere | **no** meta-viewport; reflow clip machinery reusable |
| 2.2.1 | no | no | axe r=1 but SC not surfaced | **no** meta-refresh |
| 1.3.5 | no | no | axe surfaced but lands nowhere | **no** autocomplete attr |
| 2.4.1 | no | no | axe bypass = review-only (do NOT surface) | headings + landmarks collected; **no** skip-links/repeated-blocks |

So the work splits three ways: **2.5.3 / 2.2.2** already have family+rubric and only need a deterministic runner (2.5.3) or an activation probe (2.2.2); **1.4.12 / 1.4.4-viewport / 2.2.1 / 1.3.5** need new collection + a small static-DOM runner + a new family; **2.4.1 / 1.4.4-clip / 1.3.3** need new instruments or an LLM lane.

---

## 2. Scope-expansion decision (standing decision #6) — the frozen 581 gate

**Verified:** `build-sc-subset.js:39-41` derives `SELECTED` **directly from `categories.json`** (`for each cat: add every wcag_sc.id`), and the 581-case `act-subset/` (the held-out regression gate) is `(direct ∪ viaTechnique) ∩ SELECTED`. **None of the 8 target SCs is in `categories.json`** (grep confirmed 0 occurrences each; the scope is exactly 22 SCs: 1.1.1, 1.3.1, 1.3.2, 1.4.1, 1.4.3, 1.4.5, 1.4.10, 1.4.11, 1.4.13, 2.1.1, 2.1.2, 2.4.2, 2.4.3, 2.4.4, 2.4.6, 2.4.7, 2.4.10, 3.3.1, 3.3.2, 3.3.3, 4.1.2, 4.1.3).

**Therefore: adding any of the 8 SCs to `categories.json` would silently grow `SELECTED`, and the next `build-sc-subset.js` run would pull those rules' fixtures into `act-subset/` — mutating the 581-case held-out gate.** Do NOT do this as step 1.

**Recommended expansion mechanism (keeps the 581 gate frozen):**

1. Add a sibling scope file `eval/checker-comparison/expansion-scope.json` listing the 8 SCs (an explicit expansion set, NOT merged into `categories.json`).
2. Add a `--scope=expansion` flag (or a `build-expansion-subset.js` twin) that reads `expansion-scope.json` and writes a separate `act-rest-subset/` from the **already-mirrored** `act-rest/pages/` fixtures. The validation corpus is thus the act-rest rules `{73f2c2, 24afc2, 9e45ec, 78fd32, b4f0c3, 59br37, bc659a, 2ee8b8, cf77f2, ye5d6e, 3e12e1, efbfc7, 9bd38c}` (~218 fixtures), fully disjoint from the 581.
3. Scoring stays SC-scoped to `SELECTED` for the 581 gate and to the expansion set for the new corpus. **The two never mix.**

**On registering the new families in the oracle:** adding families for out-of-scope SCs is already an established, safe pattern — `label-in-name` (2.5.3) and `motion-control` (2.2.2) families **already fire on the 581 corpus** and are simply not scored (their SCs aren't in `SELECTED`). New families only ADD obligations (never remove), so the fail-closed enumeration check (`applicability-oracle.js:353-359`) stays green. **One caveat to validate:** `familiesFor` changes `applicableScsFor(el)`, which the drift check (`applicability-oracle.js:360-365`) compares against any `el.applicableScs` annotation present on synthetic v3 test fixtures — so every new family needs the corresponding synthetic-fixture `applicableScs` updated or the drift check will error. Real collector artifacts carry no `applicableScs`, so the corpus is unaffected.

**The eventual `categories.json` merge is an explicit user decision** with these consequences, to be surfaced (not taken) at that time: (a) the 581 gate grows to ~800 cases and the paper's headline F1 is re-measured on the larger set; (b) `build-sc-subset.js:66-72`'s authoritative-primary rule means adding 1.4.4 pulls both b4f0c3 (1.4.4 primary) and 59br37; adding 1.4.10-sharing rules is already handled; (c) the coverage-registry SELECTED-scoped assertions expand. Until then, everything below targets the expansion corpus.

---

## 3. SC 1.3.5 — Autocomplete has valid value (73f2c2) · deterministic · **S**

**(1) Requirement + fixtures.** Applies to any `input`/`select`/`textarea` with an `autocomplete` attribute value that is neither empty nor ASCII-whitespace-only, **minus** exceptions: toggle-only fields (`off`/`on`), disabled elements, fixed-value input types (`button|checkbox|file|image|radio|reset|submit`), and elements not visible / not in the AX tree without focus nav. Expectation: the value is a space-separated list of one or more tokens following the WHATWG **autofill detail tokens** grammar (optional `section-*`, then optional `shipping|billing`, then optional contact modifier `home|work|mobile|fax|pager`, then a **field-name token from the fixed autofill list**, optional `webauthn`). Fixtures: `0411dce3….html` PASS (`autocomplete="section-primary billing address-line1"` — well-ordered), `2ed049a7….html` FAIL (`autocomplete="badname"` — token not in the autofill field list). 30 fixtures.

**(2) Already have.** axe surfaces 1.3.5 wholesale (`axe-surface.js:21`) and `axe-core`'s `autocomplete-valid` decides it cleanly (measured r=1, fp=0). **But** it lands nowhere: no 1.3.5 family, and 1.3.5 ∉ `AXE_SC_FAMILY` (`build-v3.js:315`). The `autocomplete` attribute is **not collected** (agent-verified: absent in both `act-page-collect.js` and `eval-page.js`).

**(3) Gap.** (a) authoritative: no family, no runner, no collection. (b) non-authoritative: axe already surfaces (free corroboration once a family exists). (c) LLM: not needed — the grammar is fully deterministic.

**(4) Design.** New family `autocomplete-valid` (`{sc:'1.3.5', skills:['name-role-state']}`) gated in `familiesFor` on `isFormField/type` + a new collector field `autocompleteRaw` (non-empty, non-toggle, non-fixed-type). New static-DOM runner `autocomplete-valid` (`exp-runners.js` + `RUNNERS` map + `catalog.js`): tokenize the raw value lowercased on ASCII whitespace, validate against the **full WHATWG autofill field-name table transcribed from the HTML spec** (not the fixture tokens), enforcing token **order** (section → shipping/billing → contact-modifier → field-name → webauthn) and the address/contact grouping constraints. Decision: `NO_BARRIER_OBSERVED` (thresholdMet) if the token list is a valid ordered sequence; `BARRIER_OBSERVED` if any token is unknown or mis-ordered; INAPPLICABLE (no obligation minted) for the exception set. Collect `autocompleteRaw`, `autocompleteControlType`, `autocompleteToggleOnly`.
Expected on act-rest 73f2c2 (30 cases): matches axe → ~all failed caught, clean on passed/inapplicable, fp≈0. **Overfit risk: LOW** — keyed to the spec grammar. The one trap is transcribing a **partial** field-name table (passing only fixture tokens); mitigate by copying the full autofill list from the HTML spec and validating that the runner rejects a plausible-but-invalid token not in any fixture.

**(5) Effort S.** Deps: new collector field. Validation: dev on ~20 of 73f2c2's 30 fixtures, hold out ~10; cross-check every verdict against axe's `autocomplete-valid` (the offline oracle). No 581 impact.

**(6) Sequencing:** Round 1.

---

## 4. SC 1.4.12 — Text-spacing wide enough (24afc2 letter, 9e45ec word, 78fd32 line-height) · deterministic · **M**

**(1) Requirement + fixtures.** Each rule applies to an HTML element with ≥1 visible text-node child where the respective property (`letter-spacing`/`word-spacing`/`line-height`) is **declared in the `style` attribute with a computed `!important`**. Expectation: the value is **≥ 0.12 / 0.16 / 1.5 ×** the computed `font-size` (line-height uses the **used** value). Fixtures: `43f8fe88….html` PASS (`letter-spacing:3px !important`, font 25px → 0.12 exactly), `45e5a588….html` PASS (`word-spacing:0.2em !important` ≥ 0.16), `639b3bdb….html` PASS (cascade: second `line-height:2em !important` wins; needs a soft-wrap break to be applicable). Inapplicable when the property is not in the `style` attr, not `!important`, or there is no visible text (empty div).

**(2) Already have.** IBM decides 1.4.12 (`checker-ibm.js:21`, `IBM_HARD_SCS`) and is measured **clean (r=1, fp=0)** on all three rules; **axe over-fires** (`avoid-inline-spacing` flags mere presence, fp=0.13/0.20, and misses absolute-px line-height). **No** 1.4.12 family; **no** computed letter/word-spacing/line-height/font-size collection, and **no** `!important` inline detection (agent-verified; `eval-page.js:594` collects only `fontSize`/`fontWeight`).

**(3) Gap.** (a) authoritative: no family, no runner, no collection. (b) non-authoritative: IBM already covers it cleanly (corroboration, non-authoritative). (c) LLM: not needed.

**(4) Design.** New family `text-spacing-adequate` (`{sc:'1.4.12', skills:['color-and-visual-text']}`) gated in `familiesFor` on a new collector flag `spacingImportant` (true when the element's inline `style` declares any of the three props at `!important` — read via `el.style.getPropertyPriority(prop) === 'important'`) **and** `factHasText(el)`. New collector fields per element: `letterSpacingPx`, `wordSpacingPx`, `lineHeightUsedPx`, `fontSizePx`, and per-property `*Important` booleans. One runner `text-spacing-adequate` with three arms (only the declared-`!important` properties are evaluated): ratio = value/font-size; `NO_BARRIER_OBSERVED` if **every** declared property meets its threshold; `BARRIER_OBSERVED` if any declared property is below. **Critical:** line-height must handle the **absolute-px** form (used px / font-size px) — this is the exact case axe misses and IBM/QualWeb catch (`78fd32/67159173`: 20px/20px = 1.0 < 1.5 → fail). INAPPLICABLE when no property is `!important` in the style attr or no visible text.
Expected on act-rest (62 cases across the three rules): matches IBM/QualWeb → r=1, fp=0, incl. the px-line-height case axe misses. **Overfit risk: LOW** — thresholds are the requirement. Trap: reproducing axe's blind spots (mere-presence over-fire; missing px line-height). Mitigate by evaluating the **actual value against the threshold** (never presence) and testing the px-line-height fixture explicitly.

**(5) Effort M** (3 arms + new computed-style collection; runner logic small). Deps: new collector fields. Validation: dev on ~2/3 of the 62 fixtures, hold out the rest incl. `78fd32/67159173` (px line-height) and the empty-div inapplicables; cross-check against IBM `text_spacing_valid` + QualWeb R67/R68/R69. No 581 impact.

**(6) Sequencing:** Round 1.

---

## 5. SC 2.2.1 — Meta element has no refresh delay (bc659a) · deterministic · **S**

**(1) Requirement + fixtures.** Applies to the **first** `meta http-equiv="refresh"` with a **valid** `content`. Expectation: the parsed time is **`0` or `> 72000`** seconds. Fixtures: `49d79a4e….html` PASS (`content="0; URL='…'"` — instant redirect), `5d4d5b21….html` FAIL (`content="72000; …"` — exactly 72000, and the rule needs **strictly greater**). Inapplicable when the content is not a valid refresh (non-numeric leading token).

**(2) Already have.** axe `meta-refresh` measured r=1, fp=0 — but **2.2.1 ∉ `AXE_SURFACED_SCS`** so it is not even surfaced. Meta tags are **not collected** at all. No 2.2.1 family. IBM only reviews meta-refresh (never commits — `POTENTIAL_VIOLATION`), so IBM is not a usable authority here.

**(3) Gap.** (a) authoritative: no family, no runner, no collection. (b) non-authoritative: could add `2.2.1` to `AXE_SURFACED_SCS` for corroboration. (c) LLM: not needed.

**(4) Design.** Page-level obligation (like `page-title`): a new pseudo-element `PAGE_METAREFRESH_XPATH = '/page-level::meta-refresh'` + family `no-meta-refresh-delay` (`{sc:'2.2.1', skills:['timing-and-motion']}`), enumerated in `deriveObligations` when the collector reports a meta-refresh slot. New collector field `structure.metaRefresh = { raw, delaySeconds|null, valid }` read from the **first** `meta[http-equiv=refresh i]`. Runner/dispose (can be a page-level runner alongside the reflow page-runner, or a small static disposition in `build-v3.js` like the `DET_BARRIER` pattern): parse `content` as `^\s*(\d+)` for the delay; `BARRIER_OBSERVED` if `0 < delay ≤ 72000`; `NO_BARRIER_OBSERVED` if `delay === 0` or `delay > 72000`; INAPPLICABLE if no valid meta-refresh. **Collection caveat:** a `0`-second (or short) refresh to an external URL navigates the page away before/at load; the collector must read the meta from the **initial DOM before any navigation** (block navigation during collection, or parse from the fetched HTML) — the same freeze the offline suite relies on (`ACT-REST-CHECKER-COVERAGE.md §8`). Verify the collector actually captures the meta on a 0-second fixture.
Expected on act-rest bc659a (15 cases): r=1, fp=0. **Overfit risk: VERY LOW** — the numeric boundary is the requirement. Only real risk is the navigation-freeze not firing (→ silent under-collection); test it directly.

**(5) Effort S.** Deps: meta-tag collection + navigation-freeze verification. Validation: dev on ~10 of 15, hold out incl. the exactly-72000 boundary fixture; cross-check axe `meta-refresh` + QualWeb R4. Note: this shares meta-tag collection with 1.4.4-b4f0c3 (§6) — build the meta collector once. No 581 impact.

**(6) Sequencing:** Round 1 (paired with §6 meta collection).

---

## 6. SC 1.4.4 — SPLIT: b4f0c3 (meta viewport) + 59br37 (text clipped at 200% zoom)

### 6a. b4f0c3 — Meta viewport allows zoom · deterministic · **S**

**(1) Requirement + fixtures.** Applies to a `meta name="viewport"` whose `content` has a `maximum-scale` or `user-scalable` key. Passes iff **(user-scalable undefined OR `yes` OR a number outside (-1,1))** AND **(maximum-scale undefined OR `≥ 2` OR `device-width`/`device-height` OR negative)**. Fixtures: `312146d8….html` PASS (`user-scalable=yes`), `a1240b31….html` FAIL (`maximum-scale=1.5`). The measured trap: `user-scalable=invalid` / `maximum-scale=invalid` **fail** (an unrecognized value is not a passing value) — axe leniently passes these (r=0.71); QualWeb/alfa r=1; IBM **mis-passes all 7** (emits nothing).

**(2) Already have.** axe surfaces 1.4.4 wholesale (`axe-surface.js:21`) but it lands nowhere (1.4.4 ∉ `AXE_SC_FAMILY`), and axe **under-covers** (misses invalid tokens). Meta viewport **not collected**. No 1.4.4 family.

**(3) Gap.** (a) authoritative: no family, no runner, no collection. (b) non-authoritative: axe surfacing exists but is unreliable here (don't promote it). (c) LLM: not needed.

**(4) Design.** Page-level family `viewport-allows-zoom` (`{sc:'1.4.4', skills:['color-and-visual-text']}`) + pseudo-element `PAGE_VIEWPORT_XPATH = '/page-level::viewport'`, enumerated when a `meta[name=viewport i]` with a maximum-scale/user-scalable key is present. New collector field `structure.metaViewport = { raw, userScalable, maximumScale }` (parsed key/values). Static-DOM disposition parsing the two keys per the exact ACT expectation, with the **explicit rule that any unrecognized/unparseable token is NOT a passing value → BARRIER** (the axe blind spot). `NO_BARRIER_OBSERVED` if permits zoom; `BARRIER_OBSERVED` if restricts.
Expected on act-rest b4f0c3 (16 cases): r=1, fp=0, **including both invalid-token failures axe misses**. **Overfit risk: LOW** — token rules are the requirement. Trap: copying axe's leniency on malformed tokens; the design's default-to-fail on unrecognized values is the anti-overfit guard, so validate on the two invalid-token fixtures explicitly.

**(5) Effort S.** Deps: shares meta-tag collection with §5. Validation: dev ~10 of 16, hold out the invalid-token pair; oracle = QualWeb R14 + alfa SIA-R47.

**(6) Sequencing:** Round 1 (paired meta collection with §5).

### 6b. 59br37 — Text not clipped at 200% zoom · instrument-needing · **M**

**(1) Requirement + fixtures.** Applies to a text node visible at a **640×512 viewport** (defined as equivalent to 1280×1024 at 200% zoom) that has a flat-tree ancestor with `overflow-x`/`overflow-y` of `hidden`/`clip`. Expectation-1: not **horizontally** clipped (exception: ancestor `white-space:nowrap` AND `text-overflow ≠ clip`). Expectation-2: not **vertically** clipped (exception: `line-height ≥` ancestor content-box height). Fixtures: `bf6c2877….html` PASS (`white-space:nowrap; overflow:hidden` — nowrap exception), `c5cd793a….html` FAIL (`overflow:hidden; height:1.5em` on wrapping text — vertical clip). 14 fixtures. Every tool review-only (non-discriminating).

**(2) Already have.** `reflow-runner.js` already does **per-text-node clip detection against ancestor `overflow:hidden|clip`** with geometry (`reflow-runner.js:200-206`, the `clipped` computation in `captureInventory`), and drives `page.setViewport()` at fixed sizes (`:244,250`). The setViewport machinery + clip logic are **directly reusable at 640×512**. No 200%-zoom emulation today; no 1.4.4 clip family.

**(3) Gap.** (a) authoritative: a runner that re-lays-out at 640×512 and applies the two clip exceptions. (b) non-authoritative: none of the tools discriminate. (c) LLM: only the residual (ambiguous clip) if any.

**(4) Design.** New element-level family `text-not-clipped-zoom` (`{sc:'1.4.4', skills:['color-and-visual-text']}`) — a **second** 1.4.4 family alongside `viewport-allows-zoom` (§6a); the oracle supports multiple families per SC. New instrument `zoom-clip-probe` (`exp-runners.js` runner + catalog experiment): `page.setViewport({width:640,height:512})`, settle (reuse `settle.js` `awaitSettle`), then per visible text node walk flat-tree ancestors for `overflow-x/y ∈ {hidden,clip}` and test box geometry (reuse the `captureInventory` clip test), applying the two ACT exceptions (horizontal: skip if ancestor `white-space:nowrap` && `text-overflow≠clip`; vertical: skip if `line-height ≥` ancestor content-box height). `BARRIER_OBSERVED` on a clipped text node without an applicable exception; `NO_BARRIER_OBSERVED` when applicable (text present under an overflow-clip ancestor) but not clipped; INAPPLICABLE when no overflow-clip ancestor.
Expected on act-rest 59br37 (14 cases): ~r=1 given the fixtures are clean geometry; fp risk on borderline sub-pixel clips. **Overfit risk: MEDIUM** — the exceptions are keyed to the requirement, but the geometry tolerance (`captureInventory` uses an 8px slop) is tuning that can be fixture-shaped. Mitigate: implement the exact ACT exceptions, keep the slop minimal + justified, hold out ≥4 fixtures, and adversarially test a near-threshold clip.

**(5) Effort M** (reuses clip + setViewport machinery). Deps: none new. Validation: dev on ~9 of 14, hold out ~5 incl. the nowrap-exception and vertical-clip cases; oracle = QualWeb R40 (review-only, so hand-adjudicate).

**(6) Sequencing:** Round 2 (first — highest reuse).

---

## 7. SC 2.5.3 — Visible label is part of accessible name (2ee8b8) · deterministic · **S/M**

**(1) Requirement + fixtures.** Applies to an element with a **semantic widget role that supports name-from-content** (button, checkbox, gridcell, link, menuitem, menuitemcheckbox, menuitemradio, option, radio, searchbox, switch, tab, treeitem), that has **visible text content** AND an **`aria-label`/`aria-labelledby`**. Expectation: the visible text is **contained in** the accessible name (ignoring leading/trailing whitespace + case). Fixture: `326f6768….html` PASS (`<a aria-label="ACT rules">ACT rules</a>` — visible ⊆ name). 15 fixtures. Measured: IBM + QualWeb r=1, fp=0; alfa ~0.8; axe disabled → r=0.

**(2) Already have.** Family `label-in-name` **already registered** (`applicability-oracle.js:47,262` — gated `WIDGET_ROLE` + non-empty `axName`). Rubric `label-in-name-v0.md` exists (judges containment from a crop, non-authoritative). IBM decides 2.5.3 (`checker-ibm.js:21`). `CHECKER_UNCERTAINTY_FAMILY` maps `2.5.3 → label-in-name` (`build-v3.js:420`). Collector captures both `axName` (`act-page-collect.js:961`) and visible `text` (`:460`). **The only missing piece is the authoritative deterministic decider** — today it is LLM PROVISIONAL + IBM shadow only.

**(3) Gap.** (a) authoritative: no runner; the containment test is fully deterministic. (b)/(c): already covered non-authoritatively (rubric + IBM).

**(4) Design.** New runner `label-in-name-match` bound to the existing `label-in-name` family (`catalog.js` + `exp-runners.js`). Applicability must be **tightened to the ACT rule** vs the current family gate: role in the 2ee8b8 name-from-content widget set, has visible text, AND has an **explicit `aria-label`/`aria-labelledby`** (not name-from-content alone) — so collect `hasExplicitAriaName` (whether `axName` derives from aria-label/labelledby vs contents). Decision: normalize both strings (trim, collapse internal whitespace, lowercase) and test whether the normalized **visible label is a contiguous substring of** the normalized accessible name → `NO_BARRIER_OBSERVED`; else `BARRIER_OBSERVED`. INAPPLICABLE when no explicit aria-name or no visible text.
Expected on act-rest 2ee8b8 (15 cases): matches IBM/QualWeb → r=1, fp=0. **Overfit risk: LOW** — substring containment after normalization is the requirement. Traps: (a) the name-from-content role gate (copy the ACT role list, not `WIDGET_ROLE` which differs); (b) whitespace/punctuation normalization edge cases — follow the ACT's "ignoring leading/trailing whitespace and case" precisely (do NOT strip internal punctuation, which would over-clear).

**(5) Effort S/M** (family + rubric + IBM already exist; runner is small; the gate needs aligning to the ACT applicability + a `hasExplicitAriaName` collector flag). Validation: dev ~10 of 15, hold out ~5; oracle = IBM `label_name_visible` + QualWeb R30. Note: keep the runner authoritative and IBM/rubric as corroboration — a deliberate redundancy the authority policy (standing decision #1) requires even though IBM already measures r=1.

**(6) Sequencing:** Round 1.

---

## 8. SC 2.2.2 — Auto-updating text can be paused (efbfc7) · instrument-needing · **M**

**(1) Requirement + fixtures.** Applies to an element whose `innerText` changes **multiple times within 10 minutes with no user interaction**, that is "not alone" and has no changing child. Expectation: ≥1 instrument to **pause+resume / stop / hide / control frequency**. Fixtures: `18adb94c….html` PASS (`setInterval(change,1000)` on `#target` + an `<input type=button onclick=toggleUpdates() value="Pause changes">`), `8f0a0534….html` FAIL (same ticker, **no** control). 11 fixtures.

**(2) Already have.** `autoUpdatingText` is detected by a MutationObserver over a **6500ms window** (`act-page-collect.js:69-91,1008-1048`) — a 1000ms ticker mutates ~6× → detected. Family `motion-control` (2.2.2) **already registered** (`applicability-oracle.js:245`) + rubric `motion-control-v0.md`. **But: no pause/stop control detection** (agent-verified) — the rubric judges "is there a pause control" from a screenshot (non-authoritative, error-prone).

**(3) Gap.** (a) authoritative: prove a control **actually pauses the ticker** (dynamic). (b) non-authoritative: rubric exists. (c) LLM: residual only.

**(4) Design.** New instrument `auto-update-pausable` bound to the existing `motion-control` family, using the `interact_and_observe` / `observeStateAfterActivation` primitives (`cdp-tools.js`, verified present). Procedure: on a fresh clone, confirm the ticker mutates over a window; enumerate candidate controls (all visible interactive elements near the ticker + page-level), **drive each** (click), and re-observe the ticker's mutation stream. `NO_BARRIER_OBSERVED` if any control **stops** the mutations (pause/stop/hide) or a frequency control is present; `BARRIER_OBSERVED` if the ticker keeps mutating after every candidate; **ABSTAIN → auto-PARTIAL** (honoring "absence ≠ pass") if the update itself couldn't be confirmed within the window (slow ticker beyond the observation budget → the rubric judges from vision). **Do NOT gate candidates on a "pause"/"stop" text-label heuristic** — try all controls; the label heuristic is the overfit/language trap.
Expected on act-rest efbfc7 (11 cases): the 1000ms tickers are well within the window → r high; the fail case (no control) → BARRIER. **Overfit risk: MEDIUM** — driving-and-observing is mechanism-keyed; the risk is (a) the candidate-control set being fixture-shaped and (b) the observation window missing slower tickers (abstain, don't clear). Mitigate: enumerate controls structurally, abstain on unconfirmed updates, hold out fixtures.

**(5) Effort M.** Deps: `interact_and_observe` (present); a mutation-stream re-observation helper. Validation: dev ~7 of 11, hold out ~4; hand-adjudicate (no tool decides efbfc7). Consider the unvalidated `eval/act-augmented/` 2.2.2 pages as a **directional** probe only ([[act-augmented-labels-unvalidated]]), never a gate.

**(6) Sequencing:** Round 2.

---

## 9. SC 2.4.1 — Bypass blocks (cf77f2 + ye5d6e + 3e12e1) · instrument-needing · **L**

**(1) Requirement + fixtures.** cf77f2 (any HTML page): passes iff **≥1 of** {a repeated block is collapsible; a heading marks the non-repeated content; a landmark contains the non-repeated content; an instrument moves focus to the non-repeated content}. ye5d6e: an instrument moves focus just before non-repeated content. 3e12e1: each repeated block has a control that both hides it visually AND removes it from the AX tree. Fixtures: `235a899f….html` PASS (`<a href="#main">Skip to main content</a>`), `55a6cc3e….html` FAIL (aside + `<div id=main>`, no skip-link/heading/landmark/collapse), `01ade756….html` PASS (a toggle button that sets `display:none` on the repeated block), `14be25f3….html` FAIL (nav+aside, no toggle). cf77f2 14 / ye5d6e 12 / 3e12e1 8 fixtures. **Every tool review-only and non-discriminating — axe `bypass` and QualWeb R73/R74/R75 fire on passed and failed alike; "surface axe bypass" is explicitly NOT a plan.**

**(2) Already have.** Headings (`act-page-collect.js:895-909`) and landmarks (`:913-914`, incl. `main`/`[role=main]`) are collected — these directly serve the **landmark** and **heading** limbs. **Not** collected: skip-links (in-page anchors to main), focus-moving instruments, repeated-block/collapsible detection. No 2.4.1 family.

**(3) Gap.** (a) authoritative: the landmark + heading limbs are decidable from existing structure; the skip-link + collapsible limbs need detection + (for a clean verdict) an activation probe. (b) non-authoritative: axe/QualWeb are useless here (don't surface). (c) LLM: the "is this content actually non-repeated / does this heading mark it" residual.

**(4) Design.** Page-level family `bypass-blocks` (`{sc:'2.4.1', skills:['page-structure']}`) + pseudo-element `PAGE_BYPASS_XPATH`. A page-level runner deciding cf77f2 (the disjunction) as the primary 2.4.1 authority:
- **Landmark limb:** a `main` landmark (or `[role=main]`) exists containing content outside nav/header — from collected landmarks. (H69/ARIA landmarks are a sanctioned bypass technique.)
- **Heading limb:** a heading at the start of the non-repeated content region — from collected headings + document order.
- **Skip-link limb (ye5d6e):** an in-page `<a href="#id">` early in the document whose target is at/before the main content; **verify with `interact_and_observe`** — focus the link, activate, confirm focus lands in the non-repeated region (avoids crediting a broken/anchor-only skip-link).
- **Collapsible limb (3e12e1):** a control near a repeated block that, when driven, sets the block to `display:none` (hidden **and** removed from AX tree) — via `interact_and_observe` + AX-tree re-read.
- `NO_BARRIER_OBSERVED` if any limb passes; `BARRIER_OBSERVED` only if **none** does; **ABSTAIN → auto-PARTIAL → LLM** when the "non-repeated content" boundary is ambiguous (feed the LLM the reason: which limbs were checked + why the boundary is uncertain, per [[checker-uncertainty-to-llm]]).
The CLEAR direction is safe (a real landmark/verified skip-link IS a bypass). The BARRIER direction is where a deterministic FP is dangerous (an unrecognized bypass mechanism) — so make BARRIER conservative and prefer abstain-to-LLM over a hard barrier when limbs are inconclusive.
Expected on act-rest (34 cases across 3 rules): landmark/skip-link fixtures decided cleanly; some ABSTAIN. **Overfit risk: HIGH** — see §12.

**(5) Effort L.** Deps: skip-link + repeated-block detection collection; `interact_and_observe` (present). Validation: dev on cf77f2, hold out ye5d6e + 3e12e1 as the generalization check (they exercise the individual limbs); hand-adjudicate. Use `eval/act-augmented/` 2.4.1 pages as a directional probe only.

**(6) Sequencing:** Round 2 (last — hardest instrument work).

---

## 10. SC 1.3.3 — Alternative for visual reference (9bd38c) · judgment-heavy · **L** (LLM lane, non-authoritative)

**(1) Requirement + fixtures.** Applies to any visible / in-AX-tree text node. Passes if it contains **no visual-reference words**, or doesn't identify content via them, or ≥1 of: a non-visual textual instruction identifies the same content; the visual word carries a non-sensory meaning ("right after" = "immediately"); each visual word appears in the target's **visible text** or **accessible name**; or the text gives no instruction. Fixtures: `6edd8b8e….html` PASS (`Click the button labelled "howdy", on the right` — "howdy" is in the button's visible text; "right" reads non-sensory), `e25c4256….html` FAIL (`Find the menu on the right, to navigate` — "right" is sensory, no non-visual alternative). 21 fixtures. **Uncovered by every tool — irreducibly semantic.**

**(2) Already have.** Raw text collected per element (`act-page-collect.js:460`). IBM 1.3.3 is a **triage prior** (`checker-ibm.js:22`, `IBM_PRIOR_SCS` — always review, feeds the LLM queue). **No** 1.3.3 family, **no** rubric, **no** sensory-word detection.

**(3) Gap.** (a) authoritative: none feasible — the "does this word carry a sensory meaning here + is there a non-visual alternative" judgment is semantic. (b) non-authoritative: IBM prior exists. (c) LLM: the whole verdict.

**(4) Design.** New family `sensory-characteristics` (`{sc:'1.3.3', skills:['grouping-and-reading-order']}`) gated on a **deterministic sensory-word pre-filter**: scan the element's text against a **lexicon built from WCAG's own sensory-characteristics vocabulary** (shape/position/color/size — "round", "square", "on the right/left", "above/below", "the red …", …). The lexicon **only gates applicability** (over-inclusive is safe). New non-authoritative rubric `sensory-characteristics-v0.md` that judges the five sufficient conditions, fed the flagged words + surrounding text + the candidate identified content (WHY it's uncertain: "text uses 'on the right' to identify the nav; confirm a non-visual alternative exists"). Lands as an LLM PROVISIONAL fill on the auto-PARTIAL obligation, corroborated by the IBM 1.3.3 prior. **No deterministic CLAIM** (PROVISIONAL ceiling = PARTIAL).
Expected on act-rest 9bd38c (21 cases): recall/precision are LLM-calibration-bound, not deterministic. **Overfit risk: HIGH** — see §12.

**(5) Effort L.** Deps: sensory lexicon detector + new rubric + LLM lane wiring (`llm-rubrics/`, `coverage-registry.js`). Validation: dev on ~14 of 21, hold out ~7; hand-adjudicate; measure the rubric like any LLM lane (scored vs gold, never gates). Do **not** auto-trigger the on-hold corpus run.

**(6) Sequencing:** Round 3 (last — only non-authoritative reachable outcome, most calibration).

---

## 11. Sequencing — three rounds

Grouped by lane + reuse, refining the team-lead's proposed ordering (I add 1.3.5 to Round 1 and note 2.5.3/2.2.2 are near-wired):

**Round 1 — static-DOM deterministic (S–M, lowest overfit, authoritative CLAIMs):** 2.2.1 meta-refresh, 1.4.4-b4f0c3 meta-viewport (paired: **build the meta-tag collector once** for both), 1.3.5 autocomplete, 1.4.12 text-spacing, 2.5.3 label-in-name. All decide on collected DOM facts against spec-fixed rules; each converts directly to an authoritative disposition; 2.5.3 is nearly free (family+rubric+IBM already wired — just the containment runner). *Justification:* highest ROI, lowest overfit, no dynamic instruments.

**Round 2 — dynamic instruments (M–L, reuse existing machinery):** 1.4.4-59br37 zoom-clip (**first** — reuses `reflow-runner.js` clip + setViewport), 2.2.2 auto-update-pausable (drives the already-detected ticker via `interact_and_observe`), 2.4.1 bypass (**last** — landmark/heading from collected structure + skip-link/collapse via `interact_and_observe`; the "non-repeated content" boundary is the hardest part). *Justification:* each needs a browser-driving instrument but reuses built machinery; ordered by reuse-decreasing / difficulty-increasing.

**Round 3 — judgment-heavy LLM lane (L, non-authoritative):** 1.3.3 sensory-characteristics. *Justification:* the only SC whose verdict is irreducibly semantic; can reach only a non-authoritative PROVISIONAL fill; needs the most calibration and a held-out measurement, so it goes last.

Per-round: implement in an isolated worktree, validate on the rule's dev-split, keep a held-out split frozen, run the 581 gate to confirm zero regression (out-of-scope families must not shift in-scope metrics), and **adversarially review each fix** — implementers fit fixes to their own tests, so a second pass on a held-out split is mandatory ([[overfit-audit-round3-shipped]], [[held-out-generalization-check]]).

---

## 12. Cross-plan overfit risks + standing-decision ledger

### Top 3 overfit risks across all 8 plans

1. **2.4.1 "non-repeated content" boundary (§9).** The single-page fixtures make "repeated vs non-repeated" collapse to "nav/header vs a `<main>`/`#main`", so a detector keyed to `<a href="#main">` + a `<main>` element passes every fixture while failing real pages with other bypass markup. The requirement is the four **sufficient techniques** (H69 landmark, G1/G123/G124 skip-link + focus move, headings), not the fixture DOM. Mitigate: implement the techniques faithfully, make BARRIER conservative (abstain-to-LLM when limbs are inconclusive), hold out ye5d6e/3e12e1 as the generalization check.

2. **1.3.3 sensory-word lexicon (§10).** Building the lexicon from the fixtures' words ("round", "right") rather than WCAG's full sensory vocabulary silently passes the corpus while missing real references. Mitigate: source the lexicon from the **requirement**, use it only to **gate applicability** (over-inclusive is safe — the LLM abstains on non-sensory uses), and calibrate the rubric on a held-out split.

3. **Parser-completeness in the "easy" static runners (§3/§4/§6a) — reproducing the checkers' measured blind spots.** The canonical trap: axe **passes** `user-scalable=invalid` (b4f0c3) and **misses** absolute-px line-height (78fd32); a runner tuned to the fixtures inherits exactly these gaps. Every static parser must transcribe the **full spec grammar/threshold** and make "unrecognized value → fail" explicit, with the specific blind-spot fixtures (invalid viewport token, px line-height, a non-fixture invalid autocomplete token) in the held-out split. More broadly: the same agent will validate on the fixtures it fit to — so each round needs a frozen held-out split + independent adversarial review.

### Standing-decision conflicts / notes hit during the survey

- **No relitigation needed, but two memory records are stale vs the code:** `AXE_SURFACED_SCS` has grown to include 1.1.1/2.1.1/2.4.2 and **already surfaces 1.4.4 and 1.3.5** ([[harness-3-1-llm-evidence-lane]] lists only {1.3.1,1.3.5,1.4.4,2.4.4}+3.1). Surfacing ≠ obligation: without a family + a `AXE_SC_FAMILY` entry, those surfaced findings land nowhere. No action beyond noting it.
- **IBM role ([[harness-3-3-checker-decision]]) is confirmed, not contradicted:** the new measurements show IBM clean on 1.4.12 + 2.5.3 (r=1, fp=0) and only reviewing meta-refresh — exactly its stated scope. IBM's measured b4f0c3 mis-pass is 1.4.4 (outside IBM's scope), consistent. Plans keep IBM as **corroboration** for 1.4.12/2.5.3 and the 1.3.3 triage prior; they still build deterministic runners because **standing decision #1 makes deterministic the only authoritative lane** — a deliberate redundancy (someone will ask "IBM already measures r=1, why a runner?"; the answer is authority policy, stated in §4/§7).
- **QualWeb (strongest tool, r=0.971/fp=0) is NOT proposed as a runtime dependency.** Every QualWeb win relevant here (2.2.1, 1.4.4-b4f0c3, 1.4.12, 2.5.3) is a spec-fixed rule cheaply reproduced by a small deterministic runner, so adding `@qualweb/core` (+ `act-rules`/`wcag-techniques` packages, a CDN-fetching runtime) to the harness is not justified against the dependency cost. **Consume QualWeb offline as a validation oracle** for the new runners (as the coverage baseline already did), not in the runtime.
- **1.4.6 stays OUT** ([[scope-no-1-4-6-enhanced-contrast]]) — no plan touches 09o5cg despite QualWeb measuring it r=1.
- **PROVISIONAL/corpus-run policy honored:** the 2.2.2 and 1.3.3 LLM lanes follow the shadow/non-authoritative pattern; no plan proposes auto-triggering the on-hold corpus run ([[harness-3-2-provisional-disposition]]).
- **Deferred items:** if any limb of 2.4.1 (e.g. full repeated-block cross-page detection) or a slow-ticker 2.2.2 window extension is descoped during implementation, file it in `docs/DEFERRED-TODO.md` with design notes on approval ([[deferred-todo-convention]]).

### New wiring checklist (per SC, for the implementer)

For each authoritative SC: (1) family in `applicability-oracle.js` `FAMILIES` + `familiesFor` branch (+ page-level pseudo-element + `deriveObligations` for page-level SCs); (2) collector field(s) in `act-page-collect.js` (and `eval-page.js` for parity); (3) catalog experiment in `catalog.js`; (4) runner fn + `RUNNERS` registration in `exp-runners.js`; (5) authority promotion in `authority.js`; (6) coverage assertion in `coverage-registry.js`; (7) optional axe/IBM corroboration (`axe-surface.js` / `checker-ibm.js`); (8) update synthetic-fixture `applicableScs` so the oracle drift check (`applicability-oracle.js:360-365`) stays green. For LLM-only SCs (1.3.3): family + pre-filter + rubric in `llm-rubrics/` + `coverage-registry.js`; no catalog runner.
