# OSS accessibility checkers vs axe-core and our behavioral harness

**Date:** 2026-06-16
**Question:** IBM Equal Access and the W3C ACT-Rules checkers are not wired into our harness. Do they — or any open-source web accessibility checker — **supplement** or **supersede** axe-core (already integrated) and our behavioral harness?
**Method:** five engines run over a shared corpus, findings normalized and scored against known ground truth, then a fan-out analysis with adversarial verification of every load-bearing claim. Reproducible bundle: [eval/checker-comparison/](../../../eval/checker-comparison/) (runner + pinned engines + raw/aggregated outputs).

---

## Bottom line

> **Updated (2026-06-17) with the scored ACT pilot** — all five engines run over **432 W3C ACT-Rules test cases** and scored against the official expected outcomes ([upstream-evidence/act-pilot/](../../../eval/checker-comparison/upstream-evidence/act-pilot/)). This is far stronger than the fixture estimates and **overturns several earlier conclusions** (corrected below; the per-SC accuracy + best-combination tables are the new authoritative core).

- **Nothing supersedes our behavioral harness.** No external engine decides any of the behavioral SCs — the ACT suite confirms it (e.g. 2.4.7: *no tool decides it*, all defer/miss). Static scans can't do trap-escape, real-focus visibility, hover-dwell, status-on-action, or hard composited contrast.
- **On decided static accuracy, the ranking reverses my first read.** By balanced accuracy on the ACT suite: **Alfa (0.95) ≈ axe (0.94) > QualWeb (0.92) > IBM (0.87) > HTML_CodeSniffer (0.70)**. **axe — already integrated — is the workhorse**, the single best tool for **10 of 18** decidable SCs, including **1.3.5 autocomplete (perfect, 10/0)** and **1.3.1 (perfect, 0 FP)**. **IBM is the *lowest*-recall real engine** (0.79; it defers heavily to "potential") and **decides no ACT SC that axe doesn't already decide.**
- **Two earlier "IBM supplements" are refuted.** **1.3.5** is covered by axe (and everyone) — not IBM-unique. **1.3.1** should come from **axe** (J=1.0, 0 FP), *not* IBM/QualWeb (11–13 FPs each). 
- **What genuinely supplements *our harness* survives, but smaller:** **2.5.3 Label-in-Name** and **2.5.5/2.5.8 target-size** (Alfa decides these cleanly; *not in the ACT suite*, so fixture/​catalog evidence stands), and the **triage prior** for the uncovered meaning SCs **1.4.1 / 1.3.3** (IBM's element-level `potential` flags — no tool *decides* these, so its triage is still additive).
- **"Best combination" per SC ≈ route to one tool, not union-everything.** Unioning tools accumulates false positives, so the balanced-best combination is a *single* tool for almost every SC (the all-tools union is usually *worse*). The one real ensemble win is **axe+IBM for 2.1.1**. See the [per-SC best-combination table](#per-sc-best-tool-combination).
- **Recommendation (revised):** lean on **axe** (already integrated) for the decided bulk; if adding *one* external engine for decided coverage, it's **Alfa** (best balanced accuracy; uniquely adds 1.4.6 + clean 2.5.3/2.5.5/2.5.8), **not IBM**. Keep **IBM only** for its narrow wins — the **1.4.1/1.3.3 triage prior** into the LLM lane, **2.5.3** (tied with Alfa), and **1.4.12** text-spacing. **QualWeb** leads contrast/4.1.2 but its real-page robustness (0 findings on BuzzFeed) bars it as a live dependency — harvest its catalog only. Skip **HTML_CodeSniffer**.

---

## Decision

| Engine | Decision | Role / scope |
|---|---|---|
| **Our behavioral harness** | **Authoritative core — unchanged** | Nothing supersedes it. The ACT suite confirms no static engine decides the behavioral SCs (2.4.7, 2.1.x, 1.4.13, 4.1.3, …). |
| **axe** (already integrated) | **Keep; surface more of it** | The decided workhorse (best for 10/18 ACT SCs). *First action:* confirm [eval-page.js](../../../scripts/eval-page.js) actually reconciles axe's existing wins — **1.3.5, 1.3.1, 1.4.4, 2.4.4, 3.1.x** — before adding any engine. Free coverage. |
| **Alfa** | **Add, if adding one engine** | Non-authoritative cross-signal scoped to **2.4.9, 1.4.6** (ACT-scored) and **2.5.3, 2.5.5, 2.5.8** (fixture-confirmed ○-tier). Best balanced accuracy (J 0.95), MIT, 0 errors, no remote fetch. |
| **IBM** | **Narrow use only** | (a) **Triage prior** into the LLM lane for the uncovered meaning SCs **1.4.1, 1.3.3** (element-level `potential` flags); (b) **1.4.12** text-spacing. *Not* for decided breadth — its 12 decided SCs ⊆ axe's 17, lowest recall (0.79), remote rulePack. |
| **QualWeb** | **Catalog only — don't run live** | Best ACT decider for contrast (1.4.3/1.4.6) & 4.1.2, but returned **0 findings on BuzzFeed**. Harvest its rule catalog as a coverage-gap map (1.4.4/1.4.5/1.4.8/2.4.10). |
| **HTML_CodeSniffer / pa11y** | **Skip** | Worst accuracy (0.70), 21% FP-rate, blanket per-element notices, crashes on real pages. |

**Governing principles:**
1. **Route per SC; never union-everything.** Unioning engines accumulates false positives faster than recall — the all-tools combination is usually *worse* than one well-chosen tool (only axe+IBM @2.1.1 beats singletons).
2. **All external adds are non-authoritative cross-signals** — same tier as the existing axe integration, never reconciled into a trusted CLEAR/BARRIER, never over the behavioral runners.
3. **Free win first:** surface axe's existing decided coverage before integrating anything new.

Net: **no new engine is strictly required.** The highest-value moves are (0) surface axe's existing wins, then (1) Alfa for a few clean ○-tier/AAA SCs, and (2) IBM's `potential` flags as a 1.4.1/1.3.3 triage prior into the LLM lane. The original "wire IBM for 1.3.5/1.3.1" recommendation is **withdrawn** (axe already owns both).

---

## Corpus, engines, method

Five engines (all permissive-licensed) over **15 known-ground-truth fixtures** (`assets/saved/fx-v3-*.html`, each element self-documenting its true verdict) **+ 2 real pages** (Amazon Sign-In, BuzzFeed):

| Engine | Version | Rules | License | Nature |
|---|---|---|---|---|
| axe-core (Deque) | 4.12.1 | 105 | MPL-2.0 | static — **already integrated** (baseline) |
| IBM Equal Access | 4.0.26 | 162 | Apache-2.0 | static (broadest rule set) |
| QualWeb (W3C ACT-Rules) | 0.8.11 | ACT + WCAG-T | ISC | static, ACT-Rules + techniques |
| Alfa (Siteimprove) | 0.117.0 | 89 | MIT | static, ACT-Rules reference impl |
| HTML_CodeSniffer (Squiz) | 2.5.1 | WCAG2AA | BSD-3 | static, technique-based |

`pa11y` is a wrapper over HTML_CodeSniffer + axe (no independent rules). The W3C **Nu HTML Checker** validates markup, not WCAG — out of scope.

### A measurement caveat (found and fixed)

The first normalizer mapped IBM outcomes by the result **category** (`value[0]`, always `VIOLATION`), so IBM's **`POTENTIAL`/`MANUAL` "needs human review" flags were mislabeled as decided violations** — inflating IBM's apparent lead on 2.4.7, 2.4.11, 1.4.1, 1.3.3, and 2.4.1. The runner now maps a violation as **only** `category===VIOLATION && level===FAIL`; everything else is `review` ([run.js `ibmOutcome`](../../../eval/checker-comparison/run.js)). The committed evidence was regenerated with the fix. **All conclusions use the corrected mapping** — i.e. IBM's "static heuristic" SCs are correctly counted as review, not fails. This is also exactly why IBM's *decided* recall is low on the ACT suite below: a third of its output is `potential` (1011 of 2767 findings across the ACT cases).

---

## ACT-suite accuracy — the scored picture

The strongest evidence is the **ACT pilot**: all five engines run over **432 W3C ACT-Rules test cases** (the canonical conformance suite — each case tests one ACT rule with an official **expected** outcome: passed / failed / inapplicable) and scored by treating a **decided violation** matching the case's SC as a "flag." A flag on a `failed` case is a true positive; a flag on a `passed`/`inapplicable` case is a false positive; `review`/`potential` does **not** count as a decided flag. For the SCs the ACT suite covers, **this supersedes the fixture estimates** elsewhere in this doc.

### Per-tool (overall, decided)

| Tool | Recall (on `failed`) | FP-rate (on non-`failed`) | Decision agreement | Decided SCs | Errors |
|---|---|---|---|---|---|
| **Alfa** | 0.94 | **0.05** | **0.95** | **18** | 0 |
| **axe** *(integrated)* | 0.84 | **0.01** | 0.94 | 17 | 9 |
| **QualWeb** | **0.96** | 0.10 | 0.92 | **18** | 0 |
| **IBM** | **0.79** | 0.10 | 0.87 | **12** | 0 |
| **HTML_CodeSniffer** | 0.53 | 0.21 | 0.70 | 12 | 14 |

Reordering vs the fixture-based read: **IBM is not the coverage leader** — lowest decided recall, high FP, and its 12 decided SCs are a **subset of axe's 17** (it decides nothing axe doesn't). **Alfa** is the most balanced (highest agreement, lowest FP after axe); **QualWeb** has the highest recall but a real FP cost; **axe** (already wired in) is the most precise and broad. HTML_CodeSniffer is clearly worst (and errored on 14 cases).

### Per-SC best tool-combination

For each in-suite SC: the **balanced-best** tool-combination (Youden's J = recall + specificity − 1, union semantics), the best **single** tool, and the **all-tools** union (max recall). Source: [`evidence/sc-combinations.json`](../../../eval/checker-comparison/evidence/sc-combinations.json) via [`analyze-combinations.js`](../../../eval/checker-comparison/analyze-combinations.js).

| SC | best combination | J / recall | best single | all-tools (max recall) |
|---|---|---|---|---|
| 1.1.1 | **axe** | 0.86 / 0.86 | axe | 0.50 / 0.86 |
| 1.3.1 | **axe** | **1.0 / 1.0** | axe | 0.0 / 1.0 (IBM+QW add 11–13 FP) |
| 1.3.5 | **axe** | **1.0 / 1.0** | axe (=IBM=Alfa=QW) | 0.94 / 1.0 |
| 1.4.3 | **QualWeb** | 0.81 / 0.90 | QualWeb | 0.58 / 0.90 |
| 1.4.4 | **axe** | 1.0 / 1.0 | axe (IBM misses all) | 1.0 / 1.0 |
| 1.4.6 | **QualWeb** | 0.88 / 0.92 | QualWeb | 0.83 / 0.92 |
| 1.4.12 | **IBM** | **1.0 / 1.0** | IBM | 0.97 / 1.0 |
| 2.1.1 | **axe + IBM** ✦ | **1.0 / 1.0** | alfa (0.79) | 0.43 / 1.0 |
| 2.2.4 | **Alfa** | 0.91 / 1.0 | Alfa | 0.91 / 1.0 |
| 2.4.2 | **axe** | 0.63 / 0.63 | axe | 0.43 / 0.63 |
| 2.4.4 | **axe** | 1.0 / 1.0 | axe | 1.0 / 1.0 |
| 2.4.7 | *no tool decides* | — | — | — (behavioral — ours decides) |
| 2.4.9 | **Alfa** | 1.0 / 1.0 | Alfa | 1.0 / 1.0 |
| 3.1.1 | **axe** | 1.0 / 1.0 | axe | 0.67 / 1.0 |
| 3.2.5 | **Alfa** | 0.91 / 1.0 | Alfa | 0.91 / 1.0 |
| 4.1.2 | **QualWeb** | 0.99 / 1.0 | QualWeb | 0.79 / 1.0 |

✦ = the **only** SC where a multi-tool combination beats every single tool (n=3, low confidence). Everywhere else the balanced-best "combination" is **one** tool, and the all-tools union is **equal or worse** — because union accumulates false positives faster than it adds recall.

**Two readings, by use-case:**
- **Auto-decide (precision matters):** route each SC to its single best tool — overwhelmingly **axe**, with **QualWeb** for contrast (1.4.3/1.4.6) and 4.1.2, **Alfa** for 2.4.9/2.2.4/3.2.5, **IBM** only for 1.4.12. Do **not** union — it degrades accuracy.
- **Candidate-surface into a non-authoritative review/LLM lane (recall matters, FP cheap):** the union's *max recall* column applies, and there a 2–3 tool union (e.g. axe+QualWeb) is defensible because a human/LLM filters the extra FPs downstream — the trade we already accept for instrument findings.

---

## Per-engine verdict

### IBM Equal Access — the only engine that meaningfully supplements; robust
- **Supplement (real, deterministic):**
  - **1.3.5** `input_autocomplete_valid` — a true **hard fail** (`fail_incorrect`) on Amazon Sign-In. axe fires nothing for autocomplete; our harness has no 1.3.5 runner. Clean additive gap-fill, proven on a real page.
  - **2.5.3 Label in Name** `label_name_visible` — decides an SC our harness covers only at ○-tier/LLM and that axe under-covers (30 of 39 BuzzFeed label hits).
- **Redundant / inferior where it looked unique** (all now correctly `review`, not violations): 2.4.7 is a static CSS heuristic that fired **zero** real-focus findings on `fx-v3-focus` — missing both labelled barriers our `focus-visual-retry` catches; 2.4.11 is a `potential_obscured` manual flag vs our typed `focus-obscured-barrier` BARRIER; 1.4.1/1.3.3 are coarse manual flags (1.3.3 even false-fired on the word "large" as a font descriptor on a fixture line labelled **CLEAR**); 4.1.2 overlaps axe on the same targets; **1.3.1 `aria_content_in_landmark` is noisy** (fires on all 6 inputs of `fx-v3-c6-fields`, 129× on BuzzFeed).
- **Robustness:** 0 errors on both real pages — the most robust external engine. **Caveat:** the ACE engine fetches its rule bundle from a **remote URL at runtime** (`ACEngineManager`), a network/offline-reproducibility dependency the vendored engines don't have.

### Alfa — one narrow AAA gap-fill, otherwise redundant
- **Supplement (low value):** **2.5.5** enhanced 44px target size (`sia-r111`) — the only engine that does it; our harness has only 24px/2.5.8 geometry (`a11y-eval.js` `TARGET_MIN=24`). But it's **AAA**, most hits are real-page volume, and **no fixture documents target-size ground truth**, so it is mechanically real but empirically unvalidated here. Its 2.5.8 (`sia-r113`) emits a definite BARRIER where our `evalTargetSize` returns needs-judgment on a crowded 20×20 — a genuine but narrow behavioral difference.
- Everything else (1.4.3, 4.1.2, 2.5.3, 1.1.1) is redundant with axe; Alfa does not decide 2.4.7 (review only). Immutable/Future-based TS architecture → non-trivial integration cost.

### QualWeb — redundant + a robustness liability
- No unique supplement survives verification; its 2.4.1/3.3.1/3.3.2 are review-level and covered better elsewhere. **Returned 0 findings on BuzzFeed** (silent under-report on a real page) — disqualifying for integration despite being the closest thing to an "official W3C" checker.

### HTML_CodeSniffer — superseded by axe; do not integrate
- Its only axe-gap violations are 4.1.1 duplicate-id (F77 — but **WCAG 2.2 retired 4.1.1**; IBM catches the same IDs anyway) and 2.4.1 iframe-title, which are **false positives on hidden/zero-size tracking iframes** axe correctly suppresses. It **punts rgba contrast to review** where axe decides it, is dominated by manual-check *notices*, and **crashed on Amazon Sign-In** (`Cannot read properties of undefined (reading 'replace')`). pa11y inherits the noise + crash.

---

## Per-SC integration matrix

| SC | Best external | vs axe | vs our behavioral harness |
|---|---|---|---|
| **1.3.5** autocomplete | **IBM** (hard fail) | **SUPPLEMENT** (axe null) | **SUPPLEMENT** — no runner ✅ **wire** |
| **2.5.3** label-in-name | **IBM** (`label_name_visible`) | SUPPLEMENT | **SUPPLEMENT** — ○-tier/LLM only ✅ **wire** |
| **2.5.5** target 44px (AAA) | Alfa (`sia-r111`) | SUPPLEMENT (axe null) | SUPPLEMENT but AAA + unvalidated — *optional* |
| 1.4.3 contrast | axe / IBM | redundant | **cannot supersede** — ours = pixel sampling (gradients/rgba/bg-image); statics punt or false-positive |
| 2.4.7 focus visible | — | n/a | **cannot supersede** — IBM static missed both fixture barriers; ours = real keyboard + pixel diff |
| 2.4.11 focus obscured | IBM (review) | supplement-ish | **cannot supersede** — ours = typed BARRIER from real focus |
| 3.3.2 field label | IBM (placeholder-only) | SUPPLEMENT (axe accepts placeholder as a name) | **REDUNDANT** — our `field-label-probe` already flags placeholder-only (`exp-runners.js` `fieldLabelBarrier`) |
| 2.4.1 bypass/skip | IBM / QualWeb | tagging artifact | SUPPLEMENT (harness omits 2.4.1) but largely manual / FP-prone |
| 4.1.1 dup-id | htmlcs / IBM | supplement (axe dropped it) | **dead criterion** (WCAG 2.2 retired) — skip |
| 4.1.2 name/role/value | axe (wired) | redundant | redundant — ours = AX-tree activation diff |
| 1.3.1 info & relationships | IBM (high-volume) | redundant + noisy | non-authoritative LLM lane — IBM usable only as a noisy cross-signal |
| 1.4.10 / 1.4.13 / 2.1.1 / 2.1.2 / 3.3.1 | — | n/a | **cannot supersede** — all behavioral (reflow @320px, hover-dwell, real Enter/Space, trap-escape, invalid-submit) |

---

## Supersede vs supplement — the evidence

**Supersede: none.** Verified on ground-truth fixtures:
- **Behavioral SCs are unreachable by static scans.** On the genuine no-escape trap, the click-only/synthetic-only buttons, the hover auto-hide, the status-on-activation, and the 320px 2D-overflow block, **all five engines emit zero decided findings** (HTML_CodeSniffer only leaves a blanket "manual review" notice). These are decided by interaction our harness performs and a DOM snapshot cannot.
- **Contrast — ours supersedes them.** On `fx-v3-c3-contrast`/`-adversarial`, our pixel-sampler returns **INCONCLUSIVE** on the gradient, the colour-cycling animation, and the adversarial mixed-colour child, where **axe and IBM each false-positive a definite violation** on the animation (ground truth = INCONCLUSIVE). Statics punt at scale on anything composited/imaged (across the contrast fixtures axe = 7 violation / 44 review, Alfa = 12 / 66; HTML_CodeSniffer and QualWeb can't read background-image text at all). They are competent on solid/rgba backgrounds — IBM even reports exact ratios (2.32, 2.44) — but that is **redundant** with our runner, not better.

**Supplement: real but small.** The durable additive gap-fills vs *our harness* are **two** (IBM 1.3.5 autocomplete, IBM 2.5.3 label-in-name) plus one marginal (Alfa 2.5.5 AAA). Several findings that *look* like supplements are not: the placeholder-only label is **redundant** with our 3.3.2 runner; IBM's 2.4.7/2.4.11/1.4.1/1.3.3 "extras" are manual-review flags (post-fix: `review`), not authoritative fails; 4.1.1 is a retired criterion.

---

## Manual flags as an LLM-triage prior (the third role)

The supersede/supplement framing scores only *decided* findings and writes off every "needs review" flag. But a manual flag is the product of a rule that **selected a specific element and stated a specific suspicion** before deferring. The right question for us is: **is that triage richer than what our harness computes before handing an obligation to the LLM lane?**

Our LLM hand-off ([precomputeSignals](../../../scripts/v3/lib/llm-adjudicator.js#L129-L157)) gives the model only generic per-skill measures (contrast ratio, target geometry, large-text) over the *whole* auto-PARTIAL element set — **no rule-specific, per-element suspicion**, and for 1.3.3 nothing at all (not in our skill set). Through that lens the four tools rank **IBM ≫ QualWeb(catalog) > Alfa > HTML_CodeSniffer(none):**

- **IBM — high-value triage.** Its `POTENTIAL` flags are targeted and *reasoned*: `text_sensory_misuse` names the exact sensory word ("below") on the exact element (**1.3.3**, which we don't analyze at all); `style_color_misuse` identifies color-only candidates (**1.4.1**, which we hand the LLM with zero color-use triage); `style_focus_visible` triggers on focus-suppressing CSS. This is precisely the candidate-narrowing prior our LLM lane lacks for the meaning SCs (1.4.1, 1.3.3, 2.4.6, 1.3.1). Caveat: noisy — it flagged a `<head><link>` for 1.4.1 — so it is a **prior, never ground truth**.
- **QualWeb — coverage breadth, conditionally.** It *decides* WCAG-Technique checks on extended SCs our harness has **zero** coverage of: **1.4.4** resize-text, **1.4.5** images-of-text, **1.4.8** visual-presentation (AAA), **2.4.10** section-headings (AAA), plus 2.4.5/2.4.9 review. But the techniques are coarse (a single px-font-size check, `QW-WCAG-T28`, is tagged to four SCs at once → false-positive-prone) and it returned **0 on BuzzFeed**. Value: harvest its **rule catalog as a coverage-gap map** (it enumerates SCs we ignore), not as a live engine.
- **Alfa — narrow.** Its `cantTell` is principled and rule-scoped (ACT applicability matched, expectation non-automatable), but the volume lands on contrast/focus SCs we already *decide* better (1.4.3 ×66, 1.4.6 ×132, 2.4.7 ×4); its only distinctive triage is 2.4.9 (AAA link-purpose ×16). Its real value stays the decided 2.5.5/2.5.8 target-size supplement.
- **HTML_CodeSniffer — none.** Its notices are **blanket**: on BuzzFeed the same reminder fired **420×** (every focusable, 3.2.1), **215×** (every link, 2.4.4), **104×** (every text node, 1.4.3). Recall-only, precision-zero — it "narrows" to everything, so it is noise as a prior, on top of the crash and the axe-redundant decided findings.

**So "do the others provide any value?"** — only marginally, and only IBM is worth wiring as a *live* triage feed. QualWeb earns a one-time catalog harvest (the gap map); Alfa and HTML_CodeSniffer do not justify integration in any role.

---

## Recommendation

**Route per SC; do not union-everything.** The combination data shows union degrades accuracy, so the integration is a per-SC routing table, not "run all engines."

**0. First, surface what axe already decides.** axe is integrated but its decided strengths may not be reconciled into our output: **1.3.5** (autocomplete, perfect), **1.3.1** (perfect, 0 FP), **1.4.4**, **2.4.4**, **3.1.x**. This is free coverage — verify [scripts/eval-page.js](../../../scripts/eval-page.js) actually surfaces these axe rules before adding any engine. (Refutes the earlier "wire IBM for 1.3.5" — axe owns it.)

**A. If adding one external engine for *decided* coverage, add Alfa — not IBM.** Alfa has the best balanced accuracy (0.95), zero real-page errors, MIT license, and uniquely decides **2.4.9**, **1.4.6**, and — outside the ACT suite but fixture-confirmed — **2.5.3 Label-in-Name** and **2.5.5/2.5.8 target-size** (our ○-tier). Wire as a non-authoritative cross-signal scoped to those SCs.

**B. Keep IBM only for its narrow, real wins:**
- **Triage prior into the LLM lane** — IBM's `POTENTIAL` flags for the *uncovered meaning* SCs **1.4.1** and **1.3.3** (no tool *decides* these; IBM's element-level flag names the suspect element + reason). Feed as non-authoritative evidence attached to the matching LLM subject; complements (never replaces) `precomputeSignals`. (Drop 1.3.1 from this list — axe decides it cleanly; IBM adds 11 FP.)
- **1.4.12** text-spacing — the one SC IBM wins outright (J=1.0).
- **2.5.3** — tied with Alfa; if Alfa is already in for A, IBM is redundant here.

**C. QualWeb — catalog only, not live.** It is actually the *best decider* for contrast (1.4.3/1.4.6) and 4.1.2 on the ACT suite, but it returned **0 findings on BuzzFeed** (silent real-page failure) — disqualifying as a runtime dependency. Harvest its rule catalog as a coverage-gap map (extended SCs we ignore: 1.4.4/1.4.5/1.4.8/2.4.10).

**Skip HTML_CodeSniffer** (worst accuracy 0.70, 21% FP-rate, blanket per-element notices, crashes on real pages). `pa11y` inherits its problems.

All adds are **non-authoritative cross-signals** (same tier as the existing axe integration) — never reconciled into a trusted CLEAR/BARRIER, and never over the behavioral runners.

---

## Caveats (honest)

- **Robustness:** on the ACT pilot, **Alfa, QualWeb, and IBM had 0 errors; axe errored on 9 cases; HTML_CodeSniffer on 14.** But QualWeb silently returned **0 findings on BuzzFeed** (a real-page failure that error counts miss), and HTML_CodeSniffer crashes on Amazon — both unreliable on real pages. **IBM** pulls its rule bundle from a **remote URL at runtime** — pin/vendor it or accept a network + offline-reproducibility break. Alfa (0 errors, no remote fetch, MIT) is the most operationally clean external engine.
- **False-positive risk:** IBM `POTENTIAL`/`MANUAL` items are needs-review, not fails (the runner now maps them to `review`); ingest only hard fails for the two recommended SCs. IBM 1.3.1/4.1.2 are high-volume/noisy and explicitly out of scope. HTML_CodeSniffer's 2.4.1 iframe-title and 1.3.3 "large" are demonstrated false positives.
- **License:** all permissive and compatible (IBM Apache-2.0, axe MPL-2.0 already in use, Alfa MIT, QualWeb ISC, HTML_CodeSniffer BSD-3). No blocker to integrating IBM.
- **Validation gap:** the Alfa 2.5.5 fixture hits are incidental static artifacts on unstyled buttons; no fixture documents target-size ground truth, so that supplement is mechanically real but empirically unvalidated.

## Reproduce

[eval/checker-comparison/](../../../eval/checker-comparison/) — `npm install && npm run run && npm run analyze` for the fixture corpus. The **scored ACT pilot** (5 tools × 432 W3C ACT test cases) is in [`upstream-evidence/act-pilot/`](../../../eval/checker-comparison/upstream-evidence/act-pilot/) (`summary.json` = per-tool/per-SC confusion matrices; `raw.json` = per-testcase per-tool findings). The **per-SC best-combination** table is regenerated by [`analyze-combinations.js`](../../../eval/checker-comparison/analyze-combinations.js) → `evidence/sc-combinations.json`.

Key harness reference points: [scripts/v3/lib/catalog.js](../../../scripts/v3/lib/catalog.js) (the 10 behavioral runners), [scripts/v3/lib/applicability-oracle.js](../../../scripts/v3/lib/applicability-oracle.js) (○-tier 2.5.3/2.5.5/2.5.8/2.4.2), [scripts/v3/lib/exp-runners.js](../../../scripts/v3/lib/exp-runners.js) (placeholder-only label barrier), [scripts/lib/a11y-eval.js](../../../scripts/lib/a11y-eval.js) (24px-only target geometry), [scripts/eval-page.js](../../../scripts/eval-page.js) (the axe cross-signal integration point where IBM would join).
