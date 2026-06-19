# Do merged checker *uncertainties* surface more potential obligations?

**Date:** 2026-06-18
**Question:** the decided-violation comparison ([CHECKER-COMPARISON.md](CHECKER-COMPARISON.md)) discards every
"review / potential / cantTell / incomplete / notice" flag. This asks the inverse: treat a checker's
**uncertain** flag as a candidate for *surfacing a potential obligation* into the review/LLM lane, and test
whether **merging (union) the uncertain flags across all five checkers surfaces more genuine potential
issues than any single checker** — at a tolerable review-noise cost.
**Method:** all 5 checkers × **432 W3C ACT-Rules test cases**, scored at the case level against the official
expected outcomes. Every number below was **independently re-derived from `raw.json` by a second from-scratch
script** and the load-bearing conclusion was **adversarially red-teamed**; both passed (one framing word was
corrected — see §Honest framing). Reproducible: [eval/checker-comparison/analyze-uncertainty.js](../../../eval/checker-comparison/analyze-uncertainty.js)
→ `evidence/sc-uncertainty.json`.

---

## Bottom line

**Merging uncertain flags does not meaningfully help surface potential obligations on this suite.** It
surfaces *more things*, but not more *real* things per unit of review effort.

1. **A naive all-tool union is a noise firehose dominated by one tool.** HTML_CodeSniffer review-tags a
   **median of 25 distinct SCs per case** on **97%** of pages — so its "same-SC match" is near-guaranteed for
   any SC you ask about. The all-tool union inherits this: it surfaces 52% of true failures **and** 46% of
   true non-issues.
2. **Even a *focused* union (drop HTML_CodeSniffer) barely discriminates.** It surfaces 14% of failures vs
   13% of non-issues. Honestly framed (precision, not the two raw marginals): the merged pile is
   **precision 0.35–0.48 against a 0.33 base rate — lift ≈ 1.1–1.4×.** Weakly enriched, not random, but far
   below what a low-friction review lane needs.
3. **The cleanest fact — beyond axe's own uncertainty, IBM and Alfa add ZERO unique recoveries.** On the 26
   failures axe's decided lane misses, the focused union recovers 7; the *unique* contribution is
   `{axe: 1, qualweb: 1, ibm: 0, alfa: 0}`. Independently reconfirmed. Merging IBM/Alfa uncertainty buys
   nothing the others don't already surface.
4. **Operationally, the merge is a budget sink.** Layered on top of axe-decided (already 0.82 recall on
   failures), the all-tool union recovers **11 more failures at the cost of 133 false review items — a 7.6%
   yield**. Dropping HTML_CodeSniffer roughly doubles the yield (to 16%) by cutting 96 false items for 4 real
   ones, but **84% of what it surfaces is still a non-issue**.
5. **A third of axe's blind spot is structurally invisible to checker uncertainty.** 15 of the 26 axe-missed
   failures get **no** uncertain flag from **any** checker — they are the behavioral/AAA/semantic SCs
   (1.4.6 ×12, 2.1.1, 1.1.1) a DOM scan can't reason about. Merging cannot reach them by construction.
6. **The one genuine merge win is a contrast safety-net, not new surfacing.** 1.4.3 is the only SC where
   multiple *focused* tools (axe + ibm + alfa + qualweb) agree on uncertainty for the 3 failures axe's
   decided lane drops — valuable as a backstop against the known 1.4.3 false-clear (audit B2), but that is
   "catch a known leak," not "surface a new obligation."

> **Critical scope caveat.** The SCs where checker uncertainty was argued *most* valuable — IBM's
> **1.4.1 / 1.3.3 / 2.4.6** triage priors — have **zero cases (failed or otherwise) in this 432-case suite**.
> This analysis literally **cannot** evaluate the merge's headline use-case. That value rests on the
> fixture/real-page evidence (BuzzFeed `text_sensory_misuse`, `style_color_misuse`), not on ACT.

**So the answer is: don't union uncertainty for recall. Route specific tool×SC uncertainty *channels* that
carry a reason** — which is the [`checker-uncertainty → LLM with reasons`] direction already adopted, not a
blanket merge.

> **Checked against [`categories.json`](../../../categories.json) and the shipped code** (see
> [§Mapping to categories.json](#mapping-to-categoriesjson--what-to-integrate-vs-what-is-already-shipped)).
> The routed design is **already implemented** (`axe-surface.js` C0, `checker-ibm.js` C1, build-v3's
> decided / uncertainty-obligation / triage lanes) — this analysis validates it. Net findings on the 22
> in-scope SCs: (1) the six axe-decided SCs are integrated with **0 axe FP** (1.3.1 correctly routes to axe
> 4/0, not IBM 4/11); (2) **1.4.3 contrast** is the single highest-value uncertainty route — weight it as a
> safety-net against the B2 false-clear; (3) **three uncertainty routes are latent** with the wired engines
> (1.4.5, 1.4.11, 2.4.6 get 0 axe/IBM findings) and should be documented as such; (4) **1.4.5 / 2.4.10** are
> real gaps but **QualWeb cannot fill them** — its rules are mis-tagged proxies (`T28` = font-unit/1.4.4 not
> images-of-text; `T9` = heading-order, already axe-covered, not section-headings), so route 1.4.5 to the
> vision lane and leave 2.4.10 to LLM. Do **not** add a merged-uncertainty lane.

---

## Data & method

- **Unit = one ACT test case** (n=432: 144 `failed`, 155 `passed`, 133 `inapplicable`). Each case targets one
  ACT rule with one SC mapping and an official expected outcome.
- **uncertain(T)** = tool T emits a non-`violation` finding whose `sc[]` intersects the case's SC.
  **decided(T)** = T emits a `violation` matching the case SC. (Only SC strings matching `\d.\d+.\d+`.)
- **Ground truth:** `failed` = a real issue that *should* surface; `passed`/`inapplicable` = should *not*
  (an uncertain flag here is review noise). All 432 cases carry a usable SC; none skipped.
- **Baselines for "already handled":** `B_axe` = axe-decided only (axe is our integrated static engine — the
  actionable baseline), and `B_any` = decided by *any* checker (conservative; isolates uncertainty's unique
  add). Note neither includes our behavioral runners, which aren't in the ACT suite — so the "not-decided"
  counts *overstate* the real harness blind spot for behavioral SCs.
- **SC-attribution verified per tool:** uncertain findings carry valid SCs (axe 76, ibm 1086, alfa 5065,
  qualweb 256, htmlcs 10805 SC-tagged). Alfa's 5065 are real but concentrated on **9** contrast-family cases
  (rules `sia-r66`/`sia-r69`) — its narrowness is genuine, not a tagging gap.

### Decided-lane context (why uncertainty is only a thin top-up)
The decided lanes are already strong — uncertainty is layered on top of this, not filling a void:
axe **0.82** recall / 0.01 noise · alfa **0.92** / 0.05 · qualweb **0.94** / 0.10 · ibm **0.74** / 0.10 ·
htmlcs **0.32** / 0.12.

---

## A0. Spray — why a naive merge is dominated by one tool

A blanket flagger tags many SCs per case, so a same-SC "match" is automatic and carries no discrimination.

| tool | review footprint | median distinct SCs / case | max |
|---|---|---|---|
| axe | 0.15 (65/432) | 1 | 2 |
| ibm | 0.97 (417/432) | **1** (targeted) | 7 |
| alfa | 0.02 (9/432) | 2 | 5 |
| qualweb | 0.43 (185/432) | 1 | 7 |
| **htmlcs** | **0.97 (418/432)** | **25** | **36** |

→ **HTML_CodeSniffer is the only blanket flagger** (footprint > 0.8 *and* median ≥ 5 SCs/case). IBM flags
nearly every case too, but each review names **one** targeted SC — high-volume yet discriminating, not spray.

## A1. Raw discrimination (all 432 cases)

| lane | surfaces failed | recall | surfaces non-issues | noise-rate |
|---|---|---|---|---|
| axe | 8/144 | 0.06 | 7/288 | 0.02 |
| ibm | 9/144 | 0.06 | 6/288 | 0.02 |
| alfa | 3/144 | 0.02 | 5/288 | 0.02 |
| qualweb | 9/144 | 0.06 | 29/288 | 0.10 |
| htmlcs | 66/144 | 0.46 | 120/288 | 0.42 |
| **UNION (all 5)** | **75/144** | **0.52** | **133/288** | **0.46** |
| **UNION (focused: −htmlcs)** | **20/144** | **0.14** | **37/288** | **0.13** |

## Honest framing — precision, lift, and operational yield

Recall and noise-rate are two marginals of a 2×2; quoting them side-by-side invites a bogus "0.52 − 0.46 ≈ 0
⇒ random" read. The right question for a surface-for-review lane is the **precision of the surfaced pile**
(how much of what you hand the reviewer is real) and its **lift over the 0.33 base rate**.

| merged lane | precision (all non-issues) | precision (excl. inapplicable) | lift |
|---|---|---|---|
| UNION (all 5) | 0.36 | 0.48 | 1.08–1.44× |
| UNION (focused) | 0.35 | 0.47 | 1.05–1.40× |

**Operational yield, layered on top of axe-decided** (the review items the merge *adds*):

| merged lane | real recoveries | total surfaced | yield | false review items |
|---|---|---|---|---|
| UNION (all 5) | 11 | 144 | **7.6%** | 133 |
| UNION (focused) | 7 | 44 | **15.9%** | 37 |

So the merge is **weakly enriched, not random** — but a lane where 84–92% of the added items are non-issues
is a budget sink, not a discovery engine. (Focusing helps the *ratio* by removing htmlcs's 96 false items,
but the absolute recoveries it keeps are tiny.)

## A2. Surfacing failures the decided lane misses

| | `B_axe` (axe-decided) | `B_any` (any checker decided) |
|---|---|---|
| failures the baseline misses | 26 | 9 |
| focused-union recovers | 7 (noise 37) | 4 (noise 19) |
| best single focused tool | axe (4) | qualweb (4) |
| **merge gain over best single** | **+3** | **+0** |
| unique recoveries (focused) | `{axe:1, qualweb:1, ibm:0, alfa:0}` | `{qualweb:1, else 0}` |
| axe-missed failures with **no** uncertain flag from any tool | 15 / 26 | — |

The `B_any` column is the strongest test: among the 9 failures **no checker decides**, focused merging adds
**nothing** over qualweb alone (the rest are surfaced only by htmlcs's spray).

## A3. Per-SC (baseline = axe-decided)

| SC | nFailed | axe-decided | not-decided | union recovers | contributors | note |
|---|---|---|---|---|---|---|
| 1.4.3 | 10 | 7 | 3 | **3/3** | axe+ibm+alfa+qualweb+htmlcs | **real win** — multi-focused-tool agreement; contrast safety-net vs the B2 false-clear |
| 2.4.2 | 8 | 5 | 3 | 3/3 | **htmlcs only** | disappears in focused view — htmlcs spray, not agreement |
| 1.1.1 | 21 | 18 | 3 | 1/3 | qualweb+htmlcs | qualweb recovers 1 |
| 4.1.2 | 38 | 37 | 1 | 1/1 | axe | axe's own uncertainty on its own SC |
| 1.4.12 | 14 | 13 | 1 | 1/1 | htmlcs only | focused = 0 |
| 1.4.6 | 13 | 0 | 13 | 1/13 | alfa+qualweb | **moot** — AAA enhanced contrast is out of scope; and 12/13 are *decided* by non-axe tools anyway |
| 2.4.7 | 1 | 0 | 1 | 1/1 | alfa+qualweb+htmlcs | **moot** — behavioral; our harness decides 2.4.7 by real-focus pixels |
| 2.1.1 | 3 | 2 | 1 | 0/1 | — | uncertainty misses it |

After removing the blanket flagger and the moot SCs (1.4.6 out-of-scope, 2.4.7 behaviorally decided), the
only durable focused-union recoveries are **1.4.3 ×3** (multi-tool agreement) and single touches on **1.1.1**
and **4.1.2** that qualweb/axe already provide individually.

---

## What this means for the design

**Do not union uncertainty for recall — route it.** The data refutes "merge everything to surface more"
three ways: the union is dominated by one non-discriminating tool; the focused union still barely beats the
base rate; and IBM/Alfa add zero unique recoveries. The shipped Harness 3.3 code **already implements exactly
this routed design** (see [§Mapping to categories.json](#mapping-to-categoriesjson--what-to-integrate-vs-what-is-already-shipped)),
so this analysis is the *evidence that validates it* — not a request to change it. Instead:

1. **Surface *specific* tool×SC uncertainty channels that carry a per-element reason**, not a blanket union.
   The value of an uncertain flag is the *reason* it attaches (IBM `POTENTIAL`'s element + suspicion), which
   feeds the LLM rubric as a targeted prior — exactly the [`checker-uncertainty → LLM with reasons`]
   direction. A union maximizes recall at the cost of a 8–16%-yield firehose; a routed channel preserves the
   reason and the precision.
2. **Use 1.4.3 uncertainty as a contrast safety-net**, tied to the known false-clear (audit B2): when
   multiple checkers cantTell on a contrast obligation our decided lane *cleared*, that is a high-value
   review trigger, not a new obligation.
3. **HTML_CodeSniffer stays out of any merged lane.** Its only unique signal (2.4.2, 1.4.12) is buried under
   25-SC-per-case spray; harvest those two *specific* rule outputs if wanted, never its union.
4. **The merge cannot reach the behavioral/semantic blind spot** (15/26 axe-misses have no checker
   uncertainty). Those stay with the harness's own probes and the LLM/human lane.

---

## Mapping to categories.json — what to integrate (vs. what is already shipped)

The harness declares its scope in [`categories.json`](../../../categories.json): **9 categories, 22 SCs**.
The question "what valuable signals should we integrate?" is best answered against that scope *and* against
what the shipped Harness 3.3 code (`axe-surface.js` C0, `checker-ibm.js` C1) already routes. Reproducible
per-SC evidence: [`analyze-categories-signals.js`](../../../eval/checker-comparison/analyze-categories-signals.js)
→ `evidence/categories-signal-map.json`.

### How the harness already routes a checker signal (three non-authoritative lanes)

All three are `authoritative:false, shadow:true` — a checker can never clear or barrier a CLAIM ([build-v3.js](../../../scripts/v3/lib/build-v3.js)):

1. **DECIDED** — an axe hard `violation` ([build-v3:298](../../../scripts/v3/lib/build-v3.js#L298)) fills the
   matching obligation as a **PROVISIONAL barrier** (barrier-dominates; a checker clear loses to it). Source:
   `axe-surface.js`'s wholesale set `{1.1.1, 1.3.1, 1.3.5, 1.4.4, 2.1.1, 2.4.2, 2.4.4}` + a per-rule allowlist
   (`button-name`, `link-name`, aria-validity, `link-in-text-block`→1.4.1) that surfaces the 4.1.2/1.4.1 limbs
   **without** opening the noisy bare-4.1.2 family.
2. **UNCERTAINTY-OBLIGATION** — an axe **`incomplete`** finding with a real element xpath
   ([build-v3:339](../../../scripts/v3/lib/build-v3.js#L339)) *enumerates* an obligation and routes it to the
   matching LLM rubric via `CHECKER_UNCERTAINTY_FAMILY = {4.1.2, 1.1.1, 1.4.5, 2.4.4, 2.4.6, 1.4.1, 1.4.11,
   1.4.3, 2.5.3}`. "A checker that couldn't decide means *look harder*, never a clear."
3. **TRIAGE candidates** — instrument + checker signals on `TRIAGE_SCS = {1.4.1, 1.3.3, 1.3.2, 2.4.3, 4.1.3}`
   ([build-v3:587](../../../scripts/v3/lib/build-v3.js#L587)) become review packets carrying an **`agreement`
   count** (number of corroborating signals) — never ledger rows. This is the per-SC, agreement-counting
   surfacing this whole analysis argues for, *not* a blanket union.

So the routed design this analysis recommends is the shipped design. The value below is **validating the
coverage against categories.json and flagging where a route is well-fed, latent, or a real gap.**

### Per-category coverage (22 in-scope SCs)

Only **8 of the 22** in-scope SCs even appear in the ACT pilot (1.1.1, 1.3.1, 1.4.3, 2.1.1, 2.4.2, 2.4.4,
2.4.7, 4.1.2); the other 14 cluster in the behavioral/semantic categories where static checkers have no
signal — which is itself the evidence that the division of labor is right. Wired-source columns count
findings from the **only two wired engines (axe + IBM)** across the 432 ACT cases.

| Cat | SCs | Harness primary lane | Shipped checker route | Wired source (axe/IBM) | Verdict |
|---|---|---|---|---|---|
| cat_1 Accessible Names | 1.1.1, 2.4.4, **2.4.6**, 4.1.2 | axe-decided + LLM | DECIDED (1.1.1, 2.4.4, 4.1.2); 2.4.6→uncertainty-family | 1.1.1 axe 22✓, 2.4.4 axe 11✓, 4.1.2 axe 48✓; **2.4.6 axe 0/ibm 0** | **Integrated & correct**, except **2.4.6 route is latent** (no wired source; IBM excluded as noise) |
| cat_2 Structure / Order | 1.3.1, **1.3.2**, **2.4.3** | axe-decided + order instrument | DECIDED (1.3.1, axe 4/0 — not IBM 4/11); 1.3.2/2.4.3→TRIAGE | order instrument (no checker decides order) | **Integrated & correct** — order triage is instrument-fed, not checker |
| cat_3 Headings/Page | 2.4.2, **2.4.10** | axe-decided (existence) + LLM | DECIDED (2.4.2 axe 5/0, existence only) | 2.4.2 axe 5✓; 2.4.10 none | 2.4.2 integrated; **2.4.10 (AAA) is an LLM gap** — QualWeb's `QW-WCAG-T9` is heading-*order* (already axe-covered), not section-headings; do not integrate |
| cat_4 Keyboard | 2.1.1, 4.1.2 | **behavioral** probes | DECIDED cross-signal (2.1.1, 4.1.2) | 2.1.1 axe 22✓, 4.1.2 axe 48✓ | Integrated as a cross-signal; behavioral lane stays authoritative (static is a prefix) |
| cat_5 Traps/Focus-vis | 2.1.2, 2.4.7 | **behavioral** (trap-escape, real-focus pixels) | none | none decide (2.4.7: *no tool decides*) | **Correctly checker-free** — harness owns these |
| cat_6 Color/Contrast | **1.4.1**, 1.4.3, **1.4.5**, **1.4.11** | pixel-sampler (1.4.3) + LLM (1.4.1) | 1.4.3→uncertainty-family; 1.4.1→DECIDED(link-in-text-block)+TRIAGE; 1.4.5/1.4.11→uncertainty-family | **1.4.3 axe 26+ibm 10 rev✓; 1.4.1 ibm 62 rev✓; 1.4.5 0/0; 1.4.11 0/0** | **1.4.3 & 1.4.1 well-fed (highest value); 1.4.11 LATENT; 1.4.5 → vision lane** (QualWeb `QW-WCAG-T28` is a font-unit/1.4.4 check mis-tagged to 1.4.5 — do not integrate) |
| cat_7 State/Status | 1.3.1, 4.1.3 | axe-decided (1.3.1) + status instrument | DECIDED (1.3.1); 4.1.3→TRIAGE | 1.3.1 axe 4✓; 4.1.3 status instrument | **Integrated & correct** — status triage is instrument-fed |
| cat_8 Reflow/Hover | 1.4.10, 1.4.13 | **behavioral** (320px reflow, hover-dwell) | none | none decide | **Correctly checker-free** |
| cat_9 Errors/Labels | 3.3.1, 3.3.2, 3.3.3 | **behavioral** (invalid-submit, field-label probe) | none | none decide | **Correctly checker-free** |

### What this says to integrate

1. **The decided + triage routing is already integrated and the evidence endorses it.** axe owns the six
   in-scope decided SCs (1.1.1, 1.3.1, 2.1.1, 2.4.2, 2.4.4, 4.1.2) with **0 axe false positives** on every
   one tested — and notably 1.3.1 is routed to axe (4/0), **not** IBM (4/**11** FP) or QualWeb (4/**13**),
   the cleanest "surface axe, not the noisy peer" case. IBM is correctly narrowed to the 1.4.1/1.3.3 triage
   priors. Nothing here needs adding.
2. **The single highest-value uncertainty signal is 1.4.3 contrast** (cat_6) — the one route fed by genuine
   multi-checker agreement (axe 26 + IBM 10 review on the 432 cases; on the 3 contrast failures axe's decided
   lane *drops*, all focused tools cantTell together). The refinement worth making: weight the **agreement
   count** and fire it as an explicit **safety-net against the audit-B2 contrast false-clear** — when the
   pixel-sampler *cleared* an element but ≥2 checkers cantTell on it, that is a high-value re-review trigger.
3. **Three `CHECKER_UNCERTAINTY_FAMILY` routes are LATENT with the wired engines** — **1.4.5** (images-of-text),
   **1.4.11** (non-text-contrast), and **2.4.6** (heading-descriptive) get **zero** findings from axe or IBM
   across all 432 cases. They would only ever fire if a QualWeb-class engine were wired (and 1.4.11/2.4.6 not
   even then — no checker reliably flags them). The map entries are aspirational; **document them as latent**
   so these in-scope SCs are not assumed to receive checker-derived review candidates today — they rest on the
   LLM/behavioral lane alone.
4. **1.4.5 and 2.4.10 are genuine in-scope coverage gaps — but do NOT integrate QualWeb to fill them
   (decision, evidence-based).** axe has no `wcag145`/`wcag2410` rule (confirmed absent), and QualWeb's only
   signals for these SCs are **mis-tagged proxies**, not real deciders:
   - **1.4.5** → `QW-WCAG-T28` checks `font-size` *units* (`px/pt/cm` ⇒ FAILED, `em/%` ⇒ PASSED) — it is
     technique **C28 (size text in `em`, a 1.4.4 *resize* technique)**, mis-mapped to 1.4.5. It never inspects
     images; wiring it as a "1.4.5 images-of-text" decider would false-positive on **every element with a
     px font-size**. (It fired 14 violations across the pilot, all on unrelated fixtures.)
   - **2.4.10** → `QW-WCAG-T9` checks **heading-level skips** (`h1`→`h3`) — heading *order*, which axe's
     `heading-order` already covers (surfaced as a 1.3.1 advisory). 2.4.10 (does each section *have* a
     heading) is a different, semantic question T9 doesn't test; it emits mostly WARNING/review (11 reviews,
     0 decided in scope).

   On top of the mis-tagging, QualWeb remains a real-page liability (0 findings on BuzzFeed) and a 5th-engine
   dependency. **These gaps belong to the LLM/vision lane, not a static checker:** 1.4.5 (text rendered as a
   raster image) is a vision/OCR detection task — its trigger should come from vision (an image whose content
   reads as text), and the latent `CHECKER_UNCERTAINTY_FAMILY['1.4.5']` entry (no axe/IBM source) should be
   **repointed to a vision trigger or dropped**, since no wired checker will ever feed it. 2.4.10 (AAA) is
   semantic/low-priority; its only mechanical facet (heading-order) is already axe-covered.
5. **Do not add a merged-uncertainty lane.** The shipped per-SC, element-keyed, agreement-counting routing is
   the correct shape; the firehose numbers above (8–16% yield, htmlcs spray) are the evidence for *why* a
   blanket union must not be built on top of it.

## What the pilot cannot answer (honest limits)

- **Per-element, not per-case.** The unit here is an ACT case (≈one element). On a real multi-element page an
  uncertain flag points at a specific node; per-flag yield could differ. "Doesn't help" is proven for the
  case unit, *unobserved* for the deployment unit.
- **The judgment SCs are absent.** 1.4.1 / 1.3.3 / 2.4.6 have zero cases here — the suite can't test the
  merge's strongest claimed use. A corpus with failing instances of those SCs is required to settle it.
- **Baselines exclude behavioral runners.** "Not decided" here means "not decided by a static checker";
  our behavioral runners decide several of these SCs, so the real harness blind spot is smaller than 26.

## Reproduce

```
cd eval/checker-comparison && node analyze-uncertainty.js   # → evidence/sc-uncertainty.json
```
Source data: [`upstream-evidence/act-pilot/raw.json`](../../../eval/checker-comparison/upstream-evidence/act-pilot/raw.json)
(per-testcase per-tool findings with `outcome` + `sc` + `level`). Every figure was independently reproduced
from a second from-scratch script and the conclusion adversarially red-teamed.
