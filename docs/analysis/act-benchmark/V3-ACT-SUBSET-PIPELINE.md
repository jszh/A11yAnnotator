# v3 ACT Subset Pipeline — local, SC-scoped, scanner-aware

Date: 2026-06-16

**Goal.** Stand up a reproducible, offline benchmark scoped to *this project's* WCAG SCs, and use it to
answer the harness question: **how do we fully utilize existing scanner tools (axe) to improve coverage
while minimizing errors?** Build the pipeline → run the current harness → write this up.

## The pipeline (three pieces)

### 1. Subset extractor — `eval/checker-comparison/build-sc-subset.js`

Pulls the W3C ACT testcases relevant to our **22 selected SCs** (from `categories.json`, the 9 project
categories) out of the full `testcases.json` (1190 cases). SC relevance is derived two ways:

- **direct** — a `wcag20:X.X.X` requirement flagged `forConformance` (the rule authoritatively tests it);
- **viaTechnique** — a `wcag-technique:T` requirement resolved to its SC(s) through `wcag.json`'s
  `successcriteria[].techniques.{sufficient,failure}` map, **but only when the rule declares no direct
  `forConformance` SC**. A technique sufficient for several SCs (e.g. G17/G18 serve both 1.4.3 *and* 1.4.6)
  must not pull a rule whose primary target is a stricter sibling into the wrong bucket — see the
  *attribution fix* below.

Output: `act-subset/subset.json` (each case carries its resolved `sc[]`, `scDirect[]`, `scViaTechnique[]`,
and a `localPath`) + `act-subset/manifest.json`.

### 2. Local mirror — same script, polite downloader

Mirrors every testcase HTML **and the assets that *create* the barrier** to `act-subset/pages/` so runs are
**offline and deterministic** (no per-run network). The downloader has a jittered base delay, exponential
backoff on 429/5xx/network, honors `Retry-After`, and is idempotent.

> **Asset-mirroring fix (the barrier must render offline).** The testcases reference their assets
> **root-relative** (`/WAI/content-assets/…/test-assets/…`) — contrast background images, images-of-text,
> focus-indicator CSS/JS. A first cut only mirrored assets under `/testcases/`, so these `*/test-assets/*`
> files were **missing**; under `file://` the root-relative refs resolved to the filesystem root, 404'd, and
> the page rendered **benign** — v3 then read clean pixels and *correctly cleared a case that should fail*.
> Fixed: every w3.org-hosted asset is mirrored into a shared `_assets/<pathname>` tree, refs (and CSS-internal
> `url()`) are rewritten to **portable relative paths**, the rewrite is idempotent, and the intentional
> `does-not-exist.png` 404 is preserved. This flipped real verdicts — see *Corpus-fix impact* below.

`node build-sc-subset.js` → **312 approved cases / 22 rules** + the asset tree, **0 errors**.

### 3. Adapted runner — `eval/checker-comparison/run-v3-act-suite.js`

New, additive flags (the original live-network mode is untouched):

- `--subset` — score `act-subset/subset.json` (pre-resolved SCs, output → `upstream-evidence/v3-act-subset/`);
- `--local` — load the mirrored `file://` page (offline);
- `--axe` — also run **axe-core** (`axe.min.js`) on each page, map each violation to SC via its
  `wcag<p><g><c>` tags, and score three **coverage lanes**: `v3` (deterministic), `axe` (scanner), and
  `union` (v3 ∪ axe). All three are scored over the *whole* subset (a lane that doesn't attempt an SC scores
  it as uncovered, not "out of scope") so v3's gaps and axe's fill-in are visible on one denominator.
- `--proposed` — also score the **draft (non-approved) ACT rules** (built via `build-sc-subset.js
  --include-proposed`; output → a separate `v3-act-subset-proposed/`). Default is approved-only. Draft rules
  add coverage on SCs the approved corpus can't reach — see *Proposed rules* below.
- `--resume` — skip testcases already in the output `raw.json` and run only the remainder (append); use to
  finish an interrupted run without redoing scored cases.
- `--case-timeout=<ms>` — per-case wall clock (default 90000). A page or `orchestrate` that hangs becomes a
  `rec.error` and the run continues, instead of stalling the whole suite (each case's v3 step launches its own
  Chrome, so a hang would otherwise leak browsers and freeze the run).

Run:

```bash
node eval/checker-comparison/build-sc-subset.js                 # build approved subset + mirror (once)
node eval/checker-comparison/run-v3-act-suite.js --subset --local --axe --limit=0 --max-auto=10 --element-cap=60
# draft rules too (extra coverage, separate output):
node eval/checker-comparison/build-sc-subset.js --include-proposed
node eval/checker-comparison/run-v3-act-suite.js --subset --local --axe --proposed --limit=0 --max-auto=10 --element-cap=60
```

## Subset shape

**312 cases** · 22 rules · expected = {passed 118, failed 97, inapplicable 97}. Only **9 of our 22 SCs**
have approved ACT testcases:

| SC in subset | 4.1.2 | 1.1.1 | 1.4.3 | 2.4.4 | 2.1.1 | 2.4.2 | 1.3.1 | 1.4.5 | 2.4.7 |
|---|---|---|---|---|---|---|---|---|---|
| cases | 142 | 74 | 32 | 28 | 19 | 18 | 17 | 15 | 7 |

> **First finding — the corpus blind spot.** 13 of our 22 SCs (1.3.2, 1.4.1, 1.4.10, 1.4.11, 1.4.13, 2.1.2,
> 2.4.3, 2.4.6, 2.4.10, 3.3.1, 3.3.2, 3.3.3, 4.1.3) have **no ACT testcases at all** — they are largely the
> *behavioral* SCs (reflow, hover, trap, status-on-action, error-on-submit) that a static testcase corpus
> can't express. The ACT subset can only benchmark the *static* slice of our scope.

> **Attribution fix (found while building the worklist).** A first pass attributed 346 cases, but 34 of them
> belonged to rule `09o5cg` *"Text has enhanced contrast"* — primary SC **1.4.6 (AAA, 7:1)**, *not* in our
> scope — pulled into the **1.4.3** bucket via the shared G17/G18 techniques. Its `failed` examples (e.g.
> `#666`-on-white ≈ 5.7:1) *pass* 1.4.3 but fail the 7:1 enhanced threshold, so v3 correctly clearing them
> for 1.4.3 was scoring as **7 spurious "v3 false-clears."** Fixed by the authoritative-primary rule (a rule
> with any direct `forConformance` SC uses those alone); the bucket is now 32 real 1.4.3 cases. This is why
> SC attribution must prefer the rule's primary conformance target over a multi-SC technique.

## Results — current harness (v3 deterministic) + axe lane

**Coverage lanes** (flag-based; recall on ACT-failed, FP on ACT-not-failed; n=312 approved, 0 run errors):

| Lane | Recall (97 failed) | FP (215 not-failed) |
|---|---|---|
| **v3 (current harness, deterministic only)** | **6%** (6/97) | **0%** (0/215) |
| **axe (scanner)** | **83%** (80/97) | 3% (7/215) |
| **union (v3 ∪ axe)** | **84%** (81/97) | 3% (7/215) |

Per-SC (recall / FP):

| SC | v3 | axe | union | reading |
|---|---|---|---|---|
| 1.1.1 | 0% / 0% | **86% / 0%** | 86% / 0% | axe owns it; v3 has no deterministic alt runner |
| 1.3.1 | 0% / 0% | **100% / 0%** | 100% / 0% | axe owns it |
| 1.4.3 | 50% / **0%** | **70% / 0%** | 70% / 0% | axe higher recall; v3 sound (the §B5 "FPs" were corpus artifacts — gone) |
| 1.4.5 | 0% / 0% | 0% / 0% | **0% / 0%** | **no decider** — neither covers images-of-text (vision needed) |
| 2.1.1 | 0% / 0% | **67% / 0%** | 67% / 0% | axe decides the scrollable-region assertion; v3 tests activation (different) |
| 2.4.2 | 0% / 0% | 63% / 20% | 63% / 20% | axe partial, over-flags titles |
| 2.4.4 | 0% / 0% | **100% / 6%** | 100% / 6% | axe owns it |
| **2.4.7** | **100% / 0%** | 0% / 0% | **100% / 0%** | **v3 UNIQUELY catches it** (real focus + pixel diff); axe can't — the one case v3 complements axe |
| 4.1.2 | 0% / 0% | **98% / 5%** | 98% / 5% | axe owns *static* name/role; v3's `ax-state-diff` is dynamic (caught 0/38) |

> The builder worklist of the cases the combined harness gets wrong (**16 BOTH-FAIL + 0 v3 false barriers**)
> is in [V3-ACT-WORKLIST.md](V3-ACT-WORKLIST.md) (`act-subset/worklist.json`).

### Corpus-fix impact (assets now render)

Mirroring the barrier-creating assets (above) **flipped real verdicts** vs the first benign-render run:

| | benign mirror | **assets render** |
|---|---|---|
| v3 | 5% / **2% FP** | 6% / **0% FP** |
| axe | 81% / 3% | 83% / 3% |
| union | 81% / **6% FP** | **84% / 3% FP** |

Two corrections it surfaced: **(1)** v3's 5 "1.4.3 false barriers" were **corpus artifacts** — a missing
background made the page render flat-low-contrast, which v3 flagged; with the real backdrop they vanish
(**0 FP**). **(2)** the **2.4.7** focus-visible case flips from a v3 *false-clear* to **v3 100% recall**
once `styles.css`/`script.js` load — and since axe scores 0% there, **v3 now uniquely complements axe**
(union 84% > axe 83%). The broken mirror had hidden v3's one genuine behavioral win on this corpus.

## What this means

1. **On the static slice, axe is the right primary decider — by a wide margin** (83% vs 6% recall, 3% FP).
   This is *why the harness already bundles axe*. The action is to actually **route these SCs to the axe
   import** (1.1.1, 1.3.1, 1.4.3-flat, 2.1.1, 2.4.2, 2.4.4, 4.1.2) instead of leaning on a deterministic
   v3 runner that doesn't attempt them.

2. **v3's measured 6% is *not* a quality indictment — it's a corpus mismatch.** Even on v3's *own* catalog
   SCs in this set (4.1.2, 2.1.1) it scores ~0, because v3 is **behavioral**: `ax-state-diff` needs a state
   change after activation, `keyboard-activation` needs a real key — none of which a *static* ACT testcase
   exercises. The exception **2.4.7** proves the point: once the focus CSS/JS renders, `focus-visual-retry`
   catches it (100%) where axe can't. v3's real value is the 13 behavioral SCs that **aren't in this corpus
   at all** (and which no static scanner can touch — see CHECKER-COMPARISON.md).

3. **Union: defer to axe on its SCs, let v3 add where only it can.** After the corpus fix, v3 has **0 FP**
   and adds **1 incremental catch** (2.4.7) → union **84% / 3%**, strictly ≥ axe alone. The earlier "naive
   union raises FP" hazard was largely a corpus artifact (the 5 v3 FPs vanished with real backdrops). The
   durable rule still holds: **don't OR v3's barriers into axe on the SCs axe already decides cleanly**
   (1.1.1, 1.3.1, 4.1.2, …) — there v3 adds no recall; let v3 own the behavioral SCs where it uniquely wins.

4. **Genuine no-decider gaps: 1.4.5 (images of text)** — neither v3-deterministic nor axe decides it; it
   belongs to the **vision/LLM lane**, not a deterministic runner.

## Proposed (draft) rules — extra coverage to polish the pipeline

`build-sc-subset.js --include-proposed` also pulls the **non-approved** ACT rules; `run-…--proposed` scores
them (separate `v3-act-subset-proposed/` output, 581 cases total = 312 approved + 269 draft, **0 errors**).
Draft rules **reach 4 SCs the approved corpus can't**, lifting our ACT coverage from **9 → 13 of the 22
selected SCs**.

### Coverage of selected SCs (approved + proposed)

| SC | rules | cases (appr/prop) | reach |
|---|---|---|---|
| 4.1.2 | 14 | 142 / 69 | approved + draft |
| 1.1.1 | 6 | 74 / 20 | approved + draft |
| 1.3.1 | 4 | 17 / 57 | approved + draft |
| 2.4.4 | 3 | 28 / 42 | approved + draft |
| 1.4.3 | 1 | 32 / 2 | approved + draft |
| 2.1.1 | 2 | 19 / 6 | approved + draft |
| 2.4.2 | 2 | 18 / 2 | approved + draft |
| 1.4.5 | 1 | 15 / 0 | approved |
| 2.4.7 | 1 | 7 / 2 | approved + draft |
| **2.4.6** | 2 | 0 / 30 | **draft only** |
| **2.1.2** | 1 | 0 / 16 | **draft only** |
| **2.4.10** | 1 | 0 / 14 | **draft only** |
| **3.3.1** | 1 | 0 / 9 | **draft only** |

Draft rules **uniquely add 2.4.6, 2.1.2, 2.4.10, 3.3.1**. Still **uncovered (9 SCs, no ACT testcase even in
draft):** `1.3.2, 1.4.1, 1.4.10, 1.4.11, 1.4.13, 2.4.3, 3.3.2, 3.3.3, 4.1.3` — all either **behavioral**
(interaction-only; 1.4.10 reflow, 1.4.13 hover, 2.4.3 focus order, 4.1.3 status) or **semantic** (1.3.2,
1.4.1, 1.4.11, 3.3.2, 3.3.3). That residual is precisely v3's behavioral runners' and the vision/LLM lane's
exclusive territory — ACT will likely never cover it.

### Lanes — approved-only vs +draft

_(post-fix, HEAD `c5b8b64` — the two v3 false barriers below are eliminated; v3 FP now 0)_

| set | cases | v3 recall / fp | axe recall / fp | union recall / fp |
|---|---|---|---|---|
| approved-only | 312 | 6% (6/97) / 0% (0/215) | 82% (80/97) / 3% (7/215) | 84% (81/97) / 3% (7/215) |
| **+ draft** | 581 | 6% (10/177) / **0% (0/404)** | 60% (106/177) / 3% (12/404) | 63% (111/177) / 3% (**12**/404) |

Adding the draft cases **drops aggregate axe/union recall (84% → 63%)** — not a regression but *signal*: the
draft-only SCs are ones **axe has no rule for**, so it scores 0 recall on all of them and dilutes the average.
That is exactly the point — the draft set exposes where neither static lane decides.

### What the draft set reveals (polish targets)

| draft-only SC | n / failed | v3 | axe | takeaway |
|---|---|---|---|---|
| **3.3.1** error-identification | 9 / 5 | **rec 4/5**, **0 FP** ✅ | 0/5 | **v3-behavioral WIN** — `form-error-probe` catches what axe is silent on. The former false barrier (`e2cc934a`) is **fixed** (`c5b8b64`); 1 miss remains (`d7863608`, abstained at auto-PARTIAL). |
| **2.1.2** no-keyboard-trap | 16 / 5 | rec 0/5 (**abstains 5/5**) | 0/5 | v3 *has* `keyboard-trap-escape` but **never engaged** these pages (auto-PARTIAL, zero observations on all 5). A `self-refocus trap instrument` landed (`c5b8b64`) but the deterministic ACT lane still shows 5/5 abstain — verify the instrument path. |
| 2.4.6 headings & labels descriptive | 30 / 10 | 0/10 | 0/10 | semantic → **vision/LLM lane**; no deterministic decider. |
| 2.4.10 section headings | 14 / 4 | 0/4 | 0/4 | semantic → **vision/LLM lane**. |

Caveat: draft rules and their `expected` outcomes are **unstable** (under review upstream) — treat proposed
scores as *pipeline-polishing signal*, not an authoritative benchmark. Full run: `v3-act-subset-proposed/`
(581 cases). Reproduce / extend with `--resume` (skips already-scored cases) and `--case-timeout` (a hung
page becomes a `rec.error` instead of stalling the suite — added after a leaked-Chrome stall on the first run).

## Recommended integration (SC-routed, not unioned)

| SC class | Decider | Why |
|---|---|---|
| 1.1.1, 1.3.1, 1.4.3-flat, 2.1.1, 2.4.2, 2.4.4, 4.1.2-static | **import axe** (authoritative-eligible) | 63–100% recall, 0–6% FP; v3-deterministic adds no recall |
| 1.4.3-composited/shadowed | **v3 pixel runner** (§B5 abstain fix shipped, `7c09005`/`ddfcacb`) | axe `review`s these; v3 is the only decider — now abstains on glyph/exempt cases, so v3 FP on the subset is **0** |
| 2.1.2, 4.1.3, 1.4.10, 1.4.13, 2.4.7-real-focus, 2.4.11, 3.3.x | **v3 behavioral runners** | not in the ACT corpus; no static scanner can decide them |
| 1.4.5, 1.4.1, alt-adequacy, link/heading/title *descriptiveness* | **vision/LLM lane** | semantic; no deterministic decider |

**Net.** The pipeline is reproducible and offline. The current deterministic harness covers ~5% of the
*static* ACT slice because that slice is axe's home turf, not v3's. The coverage win is to **wire the axe
import as the primary decider for the static SCs** (it is already in-repo), keep v3 for the behavioral SCs
the corpus can't even express. The **1.4.3 false barriers (§B5) are now fixed** (`7c09005`/`ddfcacb`/`c5b8b64`)
— v3 FP on the full 581-case subset is **0**, so v3's contrast runner no longer adds noise where axe decides
cleanly.

## Reproduce / artifacts

- `eval/checker-comparison/build-sc-subset.js` → `act-subset/{subset.json, manifest.json, pages/}`
- `eval/checker-comparison/run-v3-act-suite.js --subset --local --axe` →
  `upstream-evidence/v3-act-subset/{raw.json, summary.json}` (`summary.lanes` = the per-SC table above)
- Engines/versions and the broader 5-tool comparison: [CHECKER-COMPARISON.md](../checker-comparison/CHECKER-COMPARISON.md).
