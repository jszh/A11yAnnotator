# Deterministic-Checker Coverage of the "Rest of ACT" Corpus (50 rules / 609 testcases)

**Date:** 2026-07-07
**Companion:** [`ACT-RULES-COVERAGE-ANALYSIS.md`](./ACT-RULES-COVERAGE-ANALYSIS.md) audits **A11yAnnotator v3's** coverage of the 40 in-scope ACT rules. **This** report audits what the five off-the-shelf **deterministic checkers** (axe-core, IBM Equal Access, HTML_CodeSniffer, Siteimprove alfa, QualWeb) cover on the **complement** corpus — the 50 ACT rules / 609 testcases that fall **outside** the project's current scope — so the next phase can decide, per rule, whether a checker already decides it or the harness must.

---

## 1. Provenance

### Corpus

- **What:** `eval/checker-comparison/act-rest/subset.json` — the **complement of `act-subset/`**: every W3C ACT-Rules testcase (`expected ∈ {passed, failed, inapplicable}`) **not** in the project-scoped subset. `581 (act-subset) + 609 (act-rest) = 1190` total. Source: the W3C ACT-Rules `testcases.json`, mirrored offline.
- **Size:** **609 testcases across 50 ACT rules.** `246` approved + `363` proposed (this corpus is majority-proposed — the runner applies **no approved-only filter**). By expected outcome: **229 passed / 205 failed / 175 inapplicable.** `112` rows have **no mapped WCAG SC** (pure-ARIA / composite / not-yet-mapped proposed rules) and so are excluded from the SC-level view but scored in the rule-level view.
- **Transport:** pages served from the **local curl-transport mirror** under `act-rest/pages/<ruleId>/<testcaseId>.html`. axe / IBM / htmlcs / alfa run inside a Puppeteer page over `file://` (offline, deterministic). **QualWeb loads over `http://127.0.0.1`** from a tiny static server rooted at `act-rest/` — QualWeb silently renders `file://` pages blank (0 assertions), a verified caveat baked into `run-rest-suite.js`. `pageMissing = 0` (all 609 pages present and rendered).

### Run

- **Command:** `node run-rest-suite.js --resume`
- **Generated:** `2026-07-07T08:15:34Z` (`summary.json`); ACT-id maps rebuilt `2026-07-07T07:31Z`.
- **Tool versions:** `axe-core 4.12.1`, `accessibility-checker` (IBM Equal Access) `4.0.26`, `html_codesniffer` `2.5.1`, `@siteimprove/alfa-rules 0.117.0` (+ `alfa-act 0.117.0`, `alfa-puppeteer 0.84.0`), `@qualweb/core 0.8.11` (`act-rules 0.8.0`, `wcag-techniques 0.4.7`). Node `v24.1.0`, system Google Chrome.

### Scoring buckets

Each `(testcase, tool)` pair lands in exactly one bucket. A tool "commits a hard verdict" only by emitting a **violation**; `review` outcomes (axe `incomplete`, IBM `POTENTIAL_VIOLATION`, htmlcs type-2/3, alfa `cantTell`, QualWeb `warning`) are advisory.

| bucket | meaning |
|---|---|
| **tp** | expected `failed`, tool emitted a **violation** (correct hard catch) |
| **fn** | expected `failed`, tool emitted **nothing** (silent miss) |
| **reviewOnlyMiss** | expected `failed`, tool emitted only a **review** (flagged for a human but did not commit) |
| **fp** | expected `passed`/`inapplicable`, tool emitted a **violation** (false alarm) |
| **tnWithReview** | expected `passed`/`inapplicable`, tool emitted only a **review** (correct abstain, with a nudge) |
| **tn** | expected `passed`/`inapplicable`, tool emitted **nothing** (clean correct pass) |
| **notImplemented** | (rule-level only) the tool's ACT-id map does not include this rule |
| **error** | the tool threw on the fixture |

`recallOnFailed = tp / (tp + fn)` — **hard** recall; review-only misses are **not** counted as recall. `fpRateOnNonFailed = fp / (fp + tn)`.

### Two scoring views — and why the rule-level view is authoritative for FP adjudication

The runner scores every finding **twice**:

- **SC-level** (497 rows with a mapped SC): a finding is relevant if its WCAG SC set **overlaps** the row's SC set. This is the pilot's WCAG-overlap view.
- **ACT-rule-level** (all 609 rows): a finding is relevant only if its `actIds[]` **exactly includes the row's ACT rule id** (from `act-rule-maps.json`).

The **SC-level view conflates sibling rules that share an SC**; the rule-level view isolates each ACT rule. Concrete example, **bc659a vs bisz58** (both "meta element has no refresh delay", both tagged 2.2.4 / 3.2.5, differing only in the exception: bc659a passes a `0`-second or `>72000`-second refresh; **bisz58 has no exception** and fails a `0`-second refresh):

> On a bc659a-**passed** fixture (a `0`-second refresh), QualWeb's `QW-ACT-R71` — which maps to **bisz58 only** — correctly fires a violation (it *is* a bisz58 failure). At the **SC level**, because bc659a and bisz58 share 2.2.4, that bisz58 finding lands in the bc659a row's 2.2.4 bucket and is scored as a **bc659a false positive**. At the **rule level**, `QW-ACT-R71`'s actId is `bisz58`, not `bc659a`, so it does **not** touch bc659a → **no FP.** (Same row also draws SC-level cross-fire FPs from alfa `sia-r96` and an htmlcs 2.2.4 message.)

This is why QualWeb's **SC-level fp = 24** collapses to **rule-level fp = 0**: most of the SC-level "FPs" are sibling-rule cross-fire, not real false alarms. **Use the rule-level view for FP adjudication; use the SC-level view only to catch sibling cross-fire and to score alfa/htmlcs (below).**

### The alfa / htmlcs mapping artifact — do NOT read rule-level `notImplemented` as "not implemented"

**alfa and htmlcs expose no ACT rule id programmatically** (alfa's metadata carries only WCAG criteria + techniques; htmlcs has no ACT concept). The map file sets `alfa: null, htmlcs: null`, so at the **rule level both show `notImplemented` for all 609 rows** — a **pure mapping artifact**, not evidence of non-coverage. Both are scored honestly only in the **SC-level** view, where **alfa is the second-strongest tool** (SC recall 0.490). Hand-verified below: alfa's `SIA-R14` (label-in-name → 2ee8b8) and `SIA-R47` (meta-viewport → b4f0c3) fire correctly on the relevant fixtures — in the b4f0c3 case alfa **beats axe**. Where this report names alfa as a rule's implementer it is **name-matched from SC-level findings, no programmatic ACT id**.

### The axe "disabled-by-default" artifact — `implements=true` ≠ the rule ran

`summary-by-rule.json`'s `perTool.axe.implements=true` is derived from axe's **ACT-id map**, not from whether the rule is **enabled** in the run. The runner runs axe with its **default rule set** (`resultTypes:['violations','incomplete']`, no `runOnly`, no experimental/AAA opt-in). **Eight axe rules that carry an ACT id are `enabled:false` by default** and therefore never fire, producing structural `recall=0` while still reporting `implements=true`:

| axe rule (disabled) | reason | ACT rule(s) affected |
|---|---|---|
| `label-content-name-mismatch` | experimental | **2ee8b8** (axe r=0) |
| `css-orientation-lock` | experimental | **b33eff** (axe r=0) |
| `identical-links-same-purpose` | wcag2aaa | **b20e66** (axe r=0) |
| `meta-refresh-no-exceptions` | wcag2aaa | **bisz58** (axe r=0.33 — the enabled `meta-refresh` covers the rest) |
| `color-contrast-enhanced` | wcag2aaa | **09o5cg** (axe r=0.1 — only the enabled 4.5:1 `color-contrast` arm fires) |
| `audio-caption` | disabled | **2eb176, afb423** (axe r=0) |

Where axe's *only* mapping to a rule is a disabled rule, axe is a **non-implementer in practice** for this run, and the doc treats it as such (other tools carry those rules).

---

## 2. Per-tool overall accuracy (both views)

**SC-level** (497 SC-mapped rows; alfa/htmlcs scored here):

| tool | recall (hard) | tp / failed | fp rate | fp / non-failed | reviewOnlyMiss | decisionAgreement |
|---|---|---|---|---|---|---|
| **qualweb** | **0.780** | 92 / 118 | 0.084 | 24 / 285 | 40 | 0.876 |
| **alfa** | **0.490** | 74 / 151 | 0.042 | 14 / 331 | 7 | 0.811 |
| ibm | 0.357 | 50 / 140 | 0.045 | 14 / 314 | 18 | 0.771 |
| axe | 0.350 | 49 / 140 | 0.041 | 13 / 321 | 18 | 0.774 |
| htmlcs | 0.200 | 11 / 55 | 0.109 | 10 / 92 | 101 | 0.633 |

**ACT-rule-level** (609 rows; only axe/ibm/qualweb map; alfa/htmlcs = artifact `notImplemented`):

| tool | implements | recall (hard) | tp / failed | fp rate | fp / non-failed | reviewOnlyMiss | notImplemented |
|---|---|---|---|---|---|---|---|
| **qualweb** | **68 rules** | **0.971** | 102 / 105 | **0.000** | 0 / 238 | 71 | 112 |
| ibm | 32 rules | 0.897 | 61 / 68 | 0.040 | 6 / 149 | 5 | 386 |
| axe | 52 rules | 0.634 | 71 / 112 | 0.030 | 7 / 236 | 15 | 228 |
| htmlcs | 0 (artifact) | — | — | — | — | — | 609 |
| alfa | 0 (artifact) | — | — | — | — | — | 609 |

**Headline: QualWeb is the strongest reference implementation of the five** — rule-level **recall 0.971 with zero hard false positives** across the 68 ACT rules it maps, committing a verdict on 105 failed cases and nailing 102. Its **only three hard misses** are one each in the three 1.4.2 autoplay rules (80f0bf, aaa1bf, 4c31df). Its 71 rule-level review-only-misses and 83 tnWithReview are **deliberate `cantTell`** on the inherently-judgmental rules (media transcripts, bypass-blocks, overflow-clipping) — not silent failures. IBM is the precision runner-up (0.897 / fp 0.040) but implements only 32 rules and **only ever reviews** the meta-refresh rules. axe covers the most rules (52) but at the lowest hard recall (0.634), dragged down by the eight disabled rules above.

---

## 3. Executive summary

### Coverage-tier distribution (all 50 rules)

| Tier | Definition | Count | Rules |
|---|---:|---:|---|
| **STRONG** | hard recall ≥ 0.9, fp ≈ 0, by ≥ 1 tool | **16** (+1 out-of-scope) | 5f99a7, 6a7281, 46ca7f, ffd0e9, b33eff, 73f2c2, 24afc2, 9e45ec, 78fd32, b4f0c3, bc659a, bisz58, 2ee8b8, bf051a, b5c3f8, de46e4 — *plus* **09o5cg** (out of project scope, §7) |
| **PARTIAL** | some hard verdicts but recall < 0.9 or notable fp | **3** | 80f0bf, aaa1bf, 4c31df (all 1.4.2 autoplay) |
| **REVIEW-ONLY** | tools emit only `cantTell`/`review` — no hard verdict committed | **20** | b40fd1, afb423, 2eb176, ab4d13, fd26cf, e7aa44, c3232f, d7ba54, ee13b5, eac66b, f51b46, c5a4ea, 1ea59c, 1ec09b, 1a02b0 (media ×15); 59br37 (1.4.4 clip); 3e12e1, cf77f2, ye5d6e (2.4.1 bypass ×3); b20e66 (2.4.9 identical links) |
| **UNCOVERED** | no tool maps or fires at all | **10** | ebe86a, a1b64e, 9bd38c, ffbc54, efbfc7, aizyf1, c249d5, 7677a9, ucwvc8, off6ek |

### Per-target-SC verdict (feeds the next-phase harness gap analysis)

| SC | ACT rule(s) | verdict | one-liner |
|---|---|---|---|
| **1.3.5** | 73f2c2 | **COVERED by checkers** | axe / IBM / QualWeb all r=1 on autocomplete tokens. Harness can defer. |
| **1.4.12** | 24afc2, 9e45ec, 78fd32 | **COVERED by checkers** | IBM + QualWeb clean (r=1, fp=0) on all three; **axe over-fires** on wide-enough locks and misses px line-height. Defer to IBM/QualWeb. |
| **2.2.1** | bc659a | **COVERED by checkers** | axe + QualWeb r=1; **IBM only reviews** (never commits). Defer to axe/QualWeb. |
| **2.5.3** | 2ee8b8 | **COVERED by checkers** | IBM + QualWeb r=1; **alfa ~0.8** (name-matched); **axe's rule is disabled** → r=0. Defer to IBM/QualWeb. |
| **1.4.4** | b4f0c3, 59br37 | **SPLIT** | b4f0c3 (meta-viewport zoom) COVERED by QualWeb + alfa (r=1); **59br37 (overflow-clip on 200% zoom) needs the harness** — review-only from every tool. |
| **2.4.1** | cf77f2, ye5d6e, 3e12e1 | **NEEDS HARNESS** | All three review-only; axe `bypass` + QualWeb warnings fire on passed and failed alike — no discrimination. |
| **2.2.2** | efbfc7 | **NEEDS HARNESS** | Uncovered — requires observing text that auto-updates over time; no checker attempts it. |
| **1.3.3** | 9bd38c | **NEEDS HARNESS** | Uncovered — requires matching visual-reference words ("the red button", "below") to non-visual alternatives; semantic, no checker attempts it. |

---

## 4. Coverage tier per rule (all 50)

Best tool = highest hard recall among tools that commit verdicts; fp is that tool's rule-level fp rate. "(alfa …)" entries are SC-level, name-matched.

### STRONG (16 in-scope)

| Rule | SC | Name | Best tool(s) & numbers | Notes |
|---|---|---|---|---|
| **5f99a7** | 1.3.1/4.1.2 | ARIA attr defined in WAI-ARIA | axe / ibm / qualweb **r=1 fp=0** | Unanimous, clean. |
| **6a7281** | 1.3.1/4.1.2 | ARIA state/property valid value | axe **r=1 fp=0**, qualweb r=1 fp=0 | ibm r=1 but fp=0.07 (mapping artifact — see §9). |
| **46ca7f** | 1.1.1 | Decorative element not exposed | axe / qualweb **r=1 fp=0** | ibm r=1 (1 review-only miss). |
| **ffd0e9** | ARIA §5.2.8 | Heading has non-empty name | axe / qualweb **r=1 fp=0** | No WCAG SC; axe `empty-heading` + QW-ACT-R35. |
| **b33eff** | 1.3.4 | Orientation not CSS-locked | ibm / qualweb **r=1 fp=0** | **axe r=0** — `css-orientation-lock` disabled. |
| **73f2c2** | 1.3.5 | `autocomplete` valid value | axe / qualweb **r=1 fp=0** | ibm r=1 fp=0.05; htmlcs throws on 4 fixtures (§9). |
| **24afc2** | 1.4.12 | Letter-spacing wide enough | ibm / qualweb **r=1 fp=0** | **axe fp=0.13** — over-fires (§6). |
| **9e45ec** | 1.4.12 | Word-spacing wide enough | ibm / qualweb **r=1 fp=0** | **axe fp=0.20** — over-fires (§6). |
| **78fd32** | 1.4.12 | Line-height wide enough | ibm / qualweb **r=1 fp=0** | **axe r=0.83** — misses px line-height (§6). |
| **b4f0c3** | 1.4.4 | Meta viewport allows zoom | qualweb **r=1 fp=0**, **alfa r=1** | **axe r=0.71** (invalid tokens), **ibm r=0** (mis-passes all 7) (§6). |
| **bc659a** | 2.2.1/2.2.4/3.2.5 | Meta no refresh delay | axe / qualweb **r=1 fp=0** | **ibm review-only** (POTENTIAL, rom=4) (§6). |
| **bisz58** | 2.2.4/3.2.5 | Meta no refresh delay (no exception) | qualweb **r=1 fp=0** | **axe r=0.33** — `meta-refresh-no-exceptions` disabled. |
| **2ee8b8** | 2.5.3 | Visible label in accessible name | ibm / qualweb **r=1 fp=0**, alfa ~0.8 | **axe r=0** — `label-content-name-mismatch` disabled (§6). |
| **bf051a** | 3.1.1 | `lang` has valid language tag | axe / qualweb **r=1 fp=0** | ibm r=1 fp=0.33 (1 fp). |
| **b5c3f8** | 3.1.1 | HTML page has `lang` attribute | qualweb **r=1 fp=0** | **axe/ibm fp=0.67** on inapplicable non-HTML-root fixtures (§6). |
| **de46e4** | 3.1.2 | Element `lang` valid tag | axe / qualweb **r=1 fp=0** | ibm fp=0.10 (1 fp). |

### PARTIAL (3)

| Rule | SC | Name | Best tool | Gap |
|---|---|---|---|---|
| **4c31df** | 1.4.2 | Autoplay has control mechanism | qualweb **r=0.8 fp=0** (4/5) | 1 hard miss; axe/ibm don't map. |
| **80f0bf** | 1.4.2 | Avoids autoplaying audio | qualweb **r=0.5 fp=0** (1/2) | axe review-only (rom=2). |
| **aaa1bf** | 1.4.2 | Autoplay audio ≤ 3s | qualweb **r=0.5 fp=0** (1/2) | Only qualweb maps; 1 hard miss. |

### REVIEW-ONLY (20)

No tool commits a hard verdict; QualWeb (and where mapped, axe) emit only `cantTell`/`review`, generally on passed and failed alike.

- **Media / time-based (15):** b40fd1 (landmark-with-non-repeated), afb423, 2eb176 (audio alt/transcript), ab4d13, fd26cf (video alt), e7aa44, c3232f, d7ba54, ee13b5 (1.2.1 video/audio alternatives), eac66b, f51b46 (1.2.2/1.2.4 auditory), c5a4ea, 1ea59c, 1ec09b (1.2.3/1.2.5/1.2.7 visual), 1a02b0 (1.2.8 transcript). See §5.
- **59br37** (1.4.4, text clipped by overflow at 200% zoom): QualWeb `QW-ACT-R40` reviews on failed (5), passed (4) **and** an inapplicable — non-discriminating cantTell.
- **2.4.1 bypass trio (3):** 3e12e1, cf77f2, ye5d6e. See §6.
- **b20e66** (2.4.9, identical links same purpose): QualWeb `QW-ACT-R9` review-only (rom=6); axe's `identical-links-same-purpose` disabled.

### UNCOVERED (10)

No tool maps or fires — these are the rule-level-unmapped rules (`anyToolImplements=false`).

| Rule | SC | Name | Why nothing fires |
|---|---|---|---|
| **9bd38c** | 1.3.3 | Alternative for visual reference | Match "the round button"/"on the right" to a non-visual alternative — semantic. |
| **efbfc7** | 2.2.2 | Auto-updating text can be paused | Requires observing `innerText` changing over a 10-min window + finding a control. |
| **ebe86a** | — | No kbd trap (non-standard nav) | Requires interactive keyboard driving. |
| **a1b64e** | — | No kbd trap (standard nav) | Requires interactive keyboard driving. |
| **ffbc54** | 2.1.4 | Char-key shortcut not printable-only | Requires enumerating single-char shortcuts + a disable/remap mechanism. |
| **aizyf1** | 2.4.9 | Link is descriptive | Semantic link-purpose judgment. |
| **c249d5** | 2.5.4 | Motion actuation can be disabled | Requires device-motion event handling + a disable control. |
| **7677a9** | 2.5.4 | Motion action also in UI | Requires matching a motion action to an equivalent UI control. |
| **ucwvc8** | 3.1.1 | Page lang subtag matches content | Requires natural-language detection of the page text. |
| **off6ek** | 3.1.2 | Element lang subtag matches content | Requires per-element natural-language detection. |

---

## 5. The media (1.2.x) cluster and the language rules

### Media cluster — QualWeb reports `cantTell`, not verdicts

Fifteen media / time-based rules cover audio/video transcripts, captions, audio descriptions, and text alternatives. **QualWeb is the only tool that maps most of them, and on every one it reports only `warning` (review) — never a hard verdict.** Measured pattern (all show `tp=0, fn=0`, non-zero `reviewOnlyMiss` + `tnWithReview`): e.g. afb423 rom=4/tnwr=3, 2eb176 rom=6/tnwr=5, ee13b5 rom=3/tnwr=3, 1a02b0 rom=4/tnwr=4. This is correct behaviour — deciding whether a transcript *actually conveys the same content* as the audio/video needs media playback + content-equivalence judgment, which QualWeb defers. axe maps only the caption rules here (`audio-caption` → 2eb176/afb423, `video-caption` → eac66b) and either has them **disabled** (2eb176/afb423 → all FN) or reviews (eac66b rom=2).

**The one media sub-cluster that is decidable is 1.4.2 autoplay** (80f0bf, aaa1bf, 4c31df): these hinge on the structural `autoplay`/`controls`/`muted` attributes and a ≤3s duration, so QualWeb commits real verdicts (recall 0.5–0.8, fp 0) — the three PARTIAL rules.

### Language rules — validity is mechanical, content-matching is not

| Rule | SC | Tier | Why |
|---|---|---|---|
| bf051a | 3.1.1 | **STRONG** | Validity of the BCP-47 tag on `<html lang>` is a static lookup → axe/ibm/qualweb r=1. |
| b5c3f8 | 3.1.1 | **STRONG** | Presence of `<html lang>` — QualWeb clean; axe/ibm over-fire on inapplicable non-HTML roots (§6). |
| de46e4 | 3.1.2 | **STRONG** | Validity of `lang` on any element — axe/qualweb r=1. |
| **ucwvc8** | 3.1.1 | **UNCOVERED** | Whether the declared subtag **matches the actual language of the page text** needs language detection. No tool attempts it. |
| **off6ek** | 3.1.2 | **UNCOVERED** | Same, per element. No tool attempts it. |

The split is clean: **is the tag well-formed** (covered) vs **does the tag describe the content** (uncovered).

---

## 6. Deep dive — the 8 target SCs (per-case adjudication)

Every anomaly below was checked against the actual fixture HTML and `raw.json` findings, not taken from the bucket counts on faith.

### 1.3.5 — 73f2c2 (`autocomplete` has valid value) — **STRONG**

**Rule:** applies to `input`/`select`/`textarea` with a non-empty `autocomplete` (minus toggle/disabled/fixed-type/hidden/static exceptions); expects the value to be a correctly-ordered autofill token list. **Measured:** axe / IBM / QualWeb all **r=1, fp≈0** (ibm fp=0.05, one over-fire). No missing failed cases. **htmlcs throws** (`Cannot read properties of undefined (reading 'replace')`) on 4 of the 73f2c2 fixtures — a tool crash bucketed as `error`, not a miss (§9). **Verdict: covered by checkers; harness can defer.**

### 1.4.12 — 24afc2 / 9e45ec / 78fd32 (important text-spacing wide enough) — **STRONG (IBM + QualWeb)**

**Rules:** apply to an element with visible text whose `letter-spacing` / `word-spacing` / `line-height` is declared in a `style` attribute with a **computed `!important`**; expect the locked value to be **≥ 0.12 / 0.16 / 1.5 ×** font-size (so a user override to the WCAG text-spacing metric is not blocked). **IBM `text_spacing_valid` and QualWeb R67/R68/R69 are clean on all three (r=1, fp=0).**

- **axe FP on 24afc2 (fp=0.13) and 9e45ec (fp=0.20)** — adjudicated. axe's single `avoid-inline-spacing` rule flags the **mere presence** of an `!important` spacing lock, ignoring the "wide enough" threshold, and maps to **all three** actIds. Opened fixtures:
  - `24afc2/d6d5bf7c…` (expected **passed**): `<p style="letter-spacing: 0.2em !important">` — 0.2em ≥ 0.12em, so the ACT rule passes; axe fires `avoid-inline-spacing` anyway → **FP.**
  - `24afc2/9af5662e…` (expected **inapplicable**): `<div style="letter-spacing: 0.1em !important"></div>` — an **empty** div (no text node), inapplicable per the rule; axe fires on the style attribute → **FP.**
  - `9e45ec/15905a23…`, `9e45ec/8d2baed1…` (passed): `word-spacing: 2px !important` (wide enough) → axe FP. `9e45ec/fdd3c30f…` (inapplicable): empty div → axe FP.
  - IBM/QualWeb do **not** over-fire because their per-property rules evaluate the actual value.
- **axe misses 1 of 6 failed 78fd32 cases** — `78fd32/67159173…`: `<p style="line-height: 20px !important">` with `font-size:20px` (used ratio 1.0 < 1.5 → fail). axe's `avoid-inline-spacing` handles unitless/relative line-height but **skips the absolute-length (`20px`) form**; IBM and QualWeb both catch it (r=1). axe catches the other 5.

**Verdict: covered by IBM/QualWeb; do not use axe as the 1.4.12 authority (over-fires on passed/inapplicable, misses px line-height).**

### 2.2.1 — bc659a (meta element has no refresh delay) — **STRONG (axe + QualWeb)**

**Rule:** the first `meta http-equiv="refresh"` with a valid `content`; expects the time to be `0` **or** `> 72000`s (a `0`-second refresh is an exempt instant redirect). **Measured:** axe `meta-refresh` r=1, QualWeb `QW-ACT-R4` r=1, both fp=0.

- **IBM rom=4** — adjudicated. IBM's `meta_refresh_delay` returns **`POTENTIAL_VIOLATION`** (a manual-review flag) on all four failed cases, never a `FAIL`. So IBM **never commits** on meta-refresh — it always defers to review. Not a runner artifact; it is IBM's rule design. (The runner's meta-refresh navigation-freeze works: axe/htmlcs read the meta before the aborted redirect. htmlcs throws on 1 bc659a fixture — §9.)

**Verdict: covered by axe/QualWeb; IBM contributes review only.**

### 2.5.3 — 2ee8b8 (visible label is part of accessible name) — **STRONG (IBM + QualWeb; alfa name-matched)**

**Rule:** widget-role element with visible text **and** an `aria-label`/`aria-labelledby`; expects the visible text to be contained in the accessible name. **Measured:** IBM `label_name_visible` r=1, QualWeb `QW-ACT-R30` r=1, both fp=0.

- **axe recall = 0** — adjudicated to the disabled-rule artifact. axe's `label-content-name-mismatch` (actId 2ee8b8) is **`enabled:false` (experimental)** in axe-core 4.12.1, so it never runs. On e.g. `2ee8b8/4ee91039…` (`<a href aria-label="WCAG">ACT rules</a>` — visible "ACT rules" ∉ name "WCAG" → fail) axe emits only page-scaffolding noise (`landmark-one-main`, `region`, `bypass`), **nothing** mapping to 2ee8b8.
- **alfa spot-check (SC-level):** alfa's `sia-r14` fires **violation** on **4 of 5** failed cases (misses `e9bbdbec13…`) and on 2 passed cases (stricter superset matching). alfa clearly **implements label-in-name** — its rule-level `notImplemented` is the mapping artifact, not a capability gap. **Name-matched, no programmatic ACT id.**

**Verdict: covered by IBM/QualWeb; axe would cover it if the experimental rule were enabled.**

### 1.4.4 — b4f0c3 (meta viewport allows zoom) + 59br37 (text not clipped at 200% zoom) — **SPLIT**

**b4f0c3 — STRONG (QualWeb + alfa).** Rule applies to a `meta name=viewport` `content` with a `maximum-scale` or `user-scalable` key; passes only if `user-scalable ∈ {yes, device-width, device-height}` or a number outside (-1,1), and `maximum-scale ≥ 2` (or undefined). **QualWeb `QW-ACT-R14` r=1, fp=0.**

- **axe recall = 0.71 (misses 2 of 7 failed)** — adjudicated. axe's `meta-viewport` fires on recognized restricting values (`user-scalable=no`, `maximum-scale=1.5`, …) but **ignores unparseable tokens**: `b4f0c3/c94a59f8…` (`user-scalable=invalid`) and `b4f0c3/9f288c28…` (`maximum-scale=invalid`) → axe emits no `meta-viewport` finding. Per the ACT expectation an unrecognized value is **not** one of the passing values, so the case **fails**; axe is leniently treating malformed viewports as unrestricted.
- **IBM recall = 0 (misses all 7)** — adjudicated to a **real IBM weakness, not an artifact.** IBM's `meta_viewport_zoomable` emits **nothing** on any b4f0c3 failed fixture (the IBM output is all scaffolding rules) — including the unambiguous `user-scalable=no` case (`accc6adf…`). Since the runner keeps only non-PASS IBM results, IBM is actively **mis-passing** all seven. QualWeb r=1 corroborates these are genuine failures.
- **alfa spot-check (SC-level):** alfa's `sia-r47` fires **violation on all 7 failed cases — including both invalid-token cases axe missed.** alfa therefore matches QualWeb and **out-covers axe** on b4f0c3. **Name-matched, no programmatic ACT id.**

**59br37 — REVIEW-ONLY → NEEDS HARNESS.** Rule checks that text nodes are not clipped by an ancestor's `overflow:hidden/clip` when a 1280×1024 viewport is zoomed to 200% (emulated at 640×512). QualWeb `QW-ACT-R40` reports **`warning` (cantTell) on failed (5), passed (4) and one inapplicable** — non-discriminating review. No tool commits. This requires **re-layout at an emulated zoom viewport + per-text-node clip geometry** — squarely harness territory.

### 2.4.1 — cf77f2 / ye5d6e / 3e12e1 (bypass blocks) — **REVIEW-ONLY → NEEDS HARNESS**

**Rules:** cf77f2 (page has *some* bypass mechanism — a disjunction over the other three), ye5d6e (an instrument moves focus to non-repeated content), 3e12e1 (repeated blocks are collapsible). **Adjudicated — what the tools actually emit:**

- axe's `bypass` rule fires only as **`review` (incomplete)**, and **on passed and failed alike**: 3e12e1 bypass/review on 3 failed **and** 4 passed; cf77f2 review on failed **and** passed; ye5d6e review on failed **and** passed (plus silent FNs).
- QualWeb `QW-ACT-R73` / `R75` / `R74` fire only **`warning`**, likewise on passed and failed indiscriminately (e.g. cf77f2: R75 warning on 1 failed + 12 passed).

Neither tool **discriminates** pass from fail — both defer the whole bypass-blocks family to human review. Deciding these needs the harness to detect skip-links / landmarks / heading structure / focus-moving instruments and resolve the "non-repeated content" boundary. **NEEDS HARNESS.**

### 2.2.2 — efbfc7 (auto-updating text can be paused) — **UNCOVERED → NEEDS HARNESS**

**Rule:** an element whose `innerText` changes multiple times within 10 minutes without user interaction, that is "not alone" and has no changing child; expects a pause/stop/hide/frequency-control instrument. **No tool maps or fires.** Detection requires **observing the DOM mutate over time** and then locating a control — the harness must own this. **NEEDS HARNESS.**

### 1.3.3 — 9bd38c (alternative for visual reference) — **UNCOVERED → NEEDS HARNESS**

**Rule:** a visible/AX-tree text node that identifies content via **visual-reference words** ("round", "on the right", "below") must also identify it non-visually (a textual instruction, non-sensory meaning, or the words appearing in the target's visible/accessible text). **No tool maps or fires.** This is a semantic content-relationship judgment (which words are sensory, and whether a non-visual alternative exists) — no checker attempts it. **NEEDS HARNESS.**

---

## 7. 09o5cg (1.4.6 enhanced contrast) — measured, but out of project scope

Included for completeness; **do not build.** Per the standing scope decision ([`scope-no-1-4-6-enhanced-contrast`]), 1.4.6 enhanced contrast (7:1 normal / 4.5:1 large) is out of scope.

| tool | recall | tp/failed | fp | notes |
|---|---|---|---|---|
| **qualweb** | **1.0** | 12/12 | 0 | `QW-ACT-R76` — clean; would be STRONG if in scope. |
| axe | 0.10 | 1/10 | 0 | only the enabled 4.5:1 `color-contrast` arm fires; `color-contrast-enhanced` (7:1) is **disabled (wcag2aaa)**, so enhanced-only failures are invisible; 3 review-only. |
| ibm / htmlcs / alfa | — | — | — | do not map. |

**No build recommendation.**

---

## 8. Runner scoring bugs found

**None.** Every bucket sampled reconciles with the fixture HTML and `raw.json` findings. The two verified transport caveats documented in `run-rest-suite.js` held: QualWeb-over-HTTP rendered all pages, and the meta-refresh navigation-freeze let the `file://` tools read the meta before the aborted redirect (axe/QualWeb r=1 on bc659a/bisz58 confirm). `pageMissing=0`. The apparent anomalies (axe r=0 on 2ee8b8/b33eff, IBM rom on bc659a, IBM r=0 on b4f0c3, the 2.4.1 review-only pattern) are all **genuine tool behaviour** (disabled rules, review-only rule design, a real IBM mis-pass), not mis-scoring.

## 9. Suggested corrections to `summary-by-rule.json` interpretation

1. **`perTool.axe.implements=true` reflects the ACT-id map, not whether the rule ran.** Eight axe rules with ACT ids are `enabled:false` by default (§1), giving structural `recall=0` on 2ee8b8, b33eff, b20e66, afb423, 2eb176 and partial on bisz58/09o5cg. Read axe `implements=true` **with** an enabled-check before concluding "axe covers but misses."
2. **`alfa` and `htmlcs` rule-level buckets are all `notImplemented` by mapping artifact** — they expose no ACT id. Use the **SC-level** view for both; alfa is the #2 tool (SC recall 0.490) and demonstrably implements SIA-R14 (2ee8b8) and SIA-R47 (b4f0c3, out-covering axe). Do not read their rule-level zeros as non-coverage.
3. **The IBM→ACT map over-attributes `aria_id_unique` to 6a7281.** IBM's single 6a7281 FP (`e4b47e09…`, expected passed) is an `aria_id_unique` (duplicate-id) violation mapped onto 6a7281 — an aria-value FP that isn't about aria values. IBM's real 6a7281 precision is cleaner than the fp=0.07 suggests.
4. **htmlcs `error` (6 cases) is a tool crash, not a miss.** htmlcs throws `Cannot read properties of undefined/null` on 4 autocomplete (73f2c2) and 2 meta-refresh (bc659a/bisz58) fixtures. Correctly bucketed `error`; just don't read it as a coverage signal.
5. **b5c3f8 axe/ibm fp=0.67 is scope-edge, not a false alarm on real pages.** Both fire `html-has-lang`/`html_lang_exists` on the rule's **inapplicable** fixtures — an SVG-root document (`b584aa8a…`) and a non-`<html>`-root document (`58847c38…`) — where the ACT rule scopes itself out but the checkers unconditionally look for `<html lang>`. QualWeb scopes correctly (fp=0).
