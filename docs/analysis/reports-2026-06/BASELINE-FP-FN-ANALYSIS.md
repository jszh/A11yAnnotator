# FP/FN cause analysis — GenA11y & AccessGuru baselines (W3C ACT corpus)

A thorough breakdown of *why* the two external LLM-accessibility baselines produce false positives (FP:
flagged a barrier on a GT-pass/inapplicable case) and false negatives (FN: missed a barrier on a GT-fail
case), with cause themes, counts, referenced test cases, and worked examples. Companion to **Table 1f
(GenA11y)** and **Table 1g (AccessGuru)** in `PAPER-TABLES-CONTRIBUTIONS.md`.

## Method & data

- **Runs.** GenA11y (`results/gena11y-act-{gemini,gpt5mini}`, commit `a50a70ba`) and AccessGuru
  (`results/accessguru-act-{gemini,gpt5mini}`, commit `4079318b`), each on the official ACT corpus with
  **Gemini 3.5-flash** and **GPT-5.4-mini**. Evidence per case: the tool's parsed verdict, per-violation
  reasons / semantic violation-types, and the model reasoning trace (`results.json` + `llm-trace.jsonl`).
- **Scoring.** Per-SC, raw ACT labels. AccessGuru uses the **element-scoped** verdict (axe restricted to
  WCAG rules; the 31 best-practice-only rules dropped — see Table 1g), so its axe FPs here are the *residual
  after* the scaffold correction, and the semantic detector is the dominant remaining FP source.
- **Ground-truth scoping (important).** An ACT case carries a label for **one** target SC, so we assess FP/FN
  **only on that labeled SC**, where ground truth exists. A tool's flags on *other* SCs — AccessGuru's
  per-page axe/semantic output spans many SCs — are **not scored** (no corresponding GT). Where an off-target
  emission rate is cited (e.g. §3.G), it is described as *raw model behavior*, never counted as an error; the
  cause conclusion always rests on the GT-assessable target-SC subset.
- **Counts** are reported for **both** models; themes are cross-model-stable unless noted. Extraction of the
  buckets is deterministic (`scratchpad/fpfn_evidence.json`).

### Headline counts

| Tool / model | FP | FN | dominant FP cause | dominant FN cause |
|---|---|---|---|---|
| GenA11y · Gemini 3.5-flash | 81 | 55 | applicability-blindness (36) | extraction gap → auto-clear (36) |
| GenA11y · GPT-5.4-mini | 116 | 50 | over-strict-vs-ACT-rule (55) | extraction gap → auto-clear (30) |
| AccessGuru · Gemini 3.5-flash | 69 | 51 | semantic over-flag (69, ~all) | coverable-but-missed (35) + coverage gap (16) |
| AccessGuru · GPT-5.4-mini | 73 | 51 | semantic over-flag (72) | coverable-but-missed (35) + coverage gap (16) |

Two failure modes are **shared** by both tools (fixture-naïve over-reading; applicability-blindness); the
**FN roots diverge** (GenA11y misses by *extraction*, AccessGuru by *coverage* + *semantic distraction*).

---

## 1. GenA11y — false positives (81 Gemini / 116 GPT-5.4-mini)

Mutually-exclusive cause buckets (priority order: D→C→A→B):

| Cause | Gemini | GPT-5.4-mini |
|---|---|---|
| **A. Applicability-blindness** (flags an element the ACT rule excludes) | 36 | 49 |
| **B. Over-strict vs the ACT rule** (stricter/broader criterion than the rule tests) | 31 | 55 |
| **C. Perceptual/computational misjudgment** (contrast, image-of-text) | 9 | 11 |
| **D. Missing referenced context** (snippet extraction can't see the referent) | 5 | 1 |

### A. Applicability-blindness — 36 / 49

GenA11y flags an element that *looks* broken but the ACT rule **excludes** — it is hidden (`aria-hidden`,
`visibility:hidden`), not in the accessibility tree, decorative, or otherwise outside the rule's applicability.
The extractor surfaces the element; the judge has no notion of "out of scope," so it reports a violation.

- **`0edc121ac3`** (4.1.2, *inapplicable*): a `<button role="menuitem">` whose only content is `<img alt="">`.
  GenA11y: *"button…lacks an accessible name."* True as HTML, but the ACT rule is **inapplicable** to it
  (the control is not in the tested applicability set), so a flag is an FP.
- **`bd0d0d0cda`** (2.4.4, *inapplicable*): a link with `aria-hidden="true"`. GenA11y flags "empty accessible
  name" — but an aria-hidden link is removed from the tree and the rule does not apply.
- **`7d696551ef`, `25b2c00b86`** (1.1.1, *inapplicable*): `<img>` with no `alt` / `<object>` with no name —
  flagged, but inapplicable (not rendered / not in tree).

This bucket is the *single largest* GenA11y FP source and is **purely a scope error**: the judgment "this
element lacks a name" is correct; treating it as a barrier is not.

### B. Over-strict vs the ACT rule — 31 / 55

GenA11y applies a **stricter or broader criterion than the specific ACT rule tests**. Sub-patterns (Gemini
by SC: 1.3.1 ×11, 4.1.2 ×8, 2.4.4 ×6, 2.4.2 ×4):

- **Descriptiveness beyond the rule (2.4.2, 2.4.4, 2.4.6).** `7f9f315b50`/`efa1e0438b`/`0ad882dffa` (2.4.2,
  *passed*): titles "This page has a title" / "Title of the page." flagged as *"generic placeholder…not
  descriptive."* ACT's Page-Titled rule only requires a **non-empty** title; descriptiveness is not its
  failure condition, so these pass. GenA11y imposes an AAA-style quality bar.
- **ARIA required-context (1.3.1).** `1acc47f25d` (`role="list"` without `role="listitem"` children),
  `3ae3bc1c99`/`9ed4f5f7c0` (orphan `role="listitem"` / `<li>`): GenA11y enforces ARIA parent/child rules
  the specific ACT 1.3.1 rule does not fail on these fixtures.
- **Attribute-validity strictness (4.1.2).** `2dcf10cb43` (`href="#"` flagged as "invalid destination"),
  `d934cb530f` (`role="none"` on a button flagged as hiding the role): both are *passed* under the ACT rule.

### C. Perceptual / computational misjudgment — 9 / 11

The judge gets the **visual fact wrong** — restricted to the SCs requiring measurement:

- **1.4.3 contrast:** `2845a8409b` claims "#000 on #666 = 3.7:1 (below 4.5:1)" on a *passed* case (wrong
  threshold/background — e.g. large text needs 3:1, or the effective background differs); `66a3ba7bc0`,
  `ab4691ef47` (gradient/image backdrop) similarly misjudged. The single-shot judge estimates contrast from
  markup/screenshot rather than a runner.
- **1.4.5 images-of-text:** `671c8b76af`, `28b2597a08`, `00a1b04016` flag images of text as violations,
  missing the ACT exception (essential / customizable / logotype) that makes them *passed*.

### D. Missing referenced context (snippet extraction) — 5 / 1

GenA11y feeds the judge **element snippets**, not the full DOM, so an `aria-labelledby`/`headers` referent
outside the snippet reads as "missing." `f8d3c1afa9` (4.1.2): iframes name via `aria-labelledby` whose
targets "are not present in the provided HTML snippet" → flagged, though present in the real page.
(The *same* mechanism causes FNs when the judge instead clears for lack of context — see §2.F.)

---

## 2. GenA11y — false negatives (55 Gemini / 50 GPT-5.4-mini)

| Cause | Gemini | GPT-5.4-mini |
|---|---|---|
| **E. Extraction gap → auto-clear** (the failing element was never surfaced) | 36 | 30 |
| **F. Lenient judgment** (the model accepted a real violation) | 19 | 20 |

### E. Extraction gap → auto-clear — 36 / 30

GenA11y's **per-SC extractor returned nothing**, so the judge received an empty element list and cleared
("No HTML elements provided", "No links found", "No headings…"). This is a *code* blind spot, not a
reasoning error. By SC (Gemini): **4.1.2 ×24**, 2.4.6 ×5, 2.4.4 ×4.

- **`004258203c`** (4.1.2, *failed* — "Form field has non-empty accessible name"). Fixture:
  `<div>last name</div><input />` — a bare unlabeled `<input>`, a textbook 4.1.2 failure. GenA11y's name/role
  extractor collects buttons/menuitems/iframes/links but **not form inputs** (the runner calls
  `detect_name_role_value(data, [])` with an empty form list), so the failing `<input>` is never surfaced →
  "No HTML elements provided" → cleared. Every one of the 24 4.1.2 misses is this class.
- **`9b967559ff` et al.** (2.4.6): the headings/labels extractor returns empty on the fixture → cleared.

### F. Lenient judgment — 19 / 20

The element *was* surfaced, but the judge accepted a real violation — the **mirror image** of the over-strict
FPs (§1.B), showing the quality bar is miscalibrated in *both* directions, not merely biased.

- **`2f7d82593e`** (1.1.1, *failed* — "Image accessible name is descriptive"). Fixture: an `<svg role="img"
  aria-label="W3C">` whose paths render the **HTML5 logo**. The name "W3C" is present but does **not describe**
  the image → 1.1.1 fails. GenA11y: *"valid and meaningful accessible name via aria-label='W3C'"* — it accepted
  name *presence* as descriptiveness without comparing the name to the depicted content.
- **`98f0638a03`** (2.4.4): link "Workshop" judged "descriptive" though ACT fails it in context.

---

## 3. AccessGuru — false positives (69 Gemini / 73 GPT-5.4-mini; element-scoped)

After element-scoping, the axe backbone contributes **~0–1** residual FP; essentially **all** AccessGuru FPs
are the **LLM semantic detector**. FP-causing semantic type (maps to the flagged target SC):

| Semantic type → SC | Gemini | GPT-5.4-mini |
|---|---|---|
| `link-text-mismatch` → 2.4.4 | 16 | 15 |
| `button-label-mismatch` → 4.1.2 | 13 | 13 |
| `incorrect-semantic-tag` → 1.3.1 | 11 | 13 |
| `page-title-not-descriptive` → 2.4.2 | 9 | 5 |
| `image-alt-not-descriptive` → 1.1.1 | 6 | 5 |
| `ambiguous-heading` → 2.4.6 | 2 | 3 |

### G. Fixture-naïve descriptiveness epidemic (`page-title-not-descriptive`)

The signature AccessGuru behavior. As **raw emission** (not scored — see the GT-scoping note),
`page-title-not-descriptive` appeared on **494/581 pages (Gemini)** and **499/581 (GPT-5.4-mini)** — ~85% of
the corpus. That statistic is **not** an FP rate: it maps only to 2.4.2, so it is **GT-assessable only on the
2.4.2-target pass/NA cases**, where it is a confirmed FP (**9 Gemini / 5 GPT-5.4-mini**); on the other ~485
pages there is no title ground truth and we do not score it. But because those unscored pages carry titles
**identical in kind** to the scored ones ("Passed Example N", "Title of the page.") and the ACT 2.4.2 cases
*label such titles passed*, the emission rate is strong **evidence** — corroborated on the assessable subset —
that the LLM defaults to judging minimal ACT scaffolding titles as violations, unaware they are test scaffolding.

- Assessable FP examples on 2.4.2 *passed* cases: **`0ad882dffa`, `7f9f315b50`, `efa1e0438b`, `6b3d2e2147`** —
  all flag the placeholder title. (The *same* over-strict-descriptiveness error GenA11y makes at §1.B.)

### H. Semantic "mismatch / incorrect / not-meaningful" over-claims

The LLM over-applies the taxonomy's judgment types to **passing or inapplicable** content — including hidden
and decorative elements (so this bucket also carries AccessGuru's share of **applicability-blindness**):

- **`ca563b842b`** (2.4.4, *inapplicable*): `<a>placeholder</a>` flagged `link-text-mismatch` — but the case
  is inapplicable.
- **`8b1cde6d65`** (2.4.4, *inapplicable*): a `visibility:hidden` link flagged `link-text-mismatch` (hidden →
  out of scope).
- **`e15b9aca4a` / `25e5364c0a`** (1.1.1, *inapplicable*): the **aria-hidden W3C wordmarks** flagged
  `image-alt-not-descriptive`. (Notably these are the two cross-rule-indeterminate images Table 1d relabels
  `failed` — so AccessGuru's "FP" here is arguably a *correct* catch against a mislabelled negative, the same
  edge the harness hits.)
- **`44afe364fc` / `2ffe7d6cfa`** (1.3.1, *passed*): `incorrect-semantic-tag` asserted on structurally-fine
  pages.

---

## 4. AccessGuru — false negatives (51 / 51)

| Cause | count (both models) |
|---|---|
| **I. Coverage gap** (SC outside axe rules *and* the 12-type semantic taxonomy) | 16 |
| **J. Coverable-but-missed** (axe silent + semantic detector failed the judgment) | 35 |

### I. Coverage gap — 16

Neither axe's WCAG rules nor AccessGuru's semantic taxonomy maps to these SCs, so the tool **cannot** catch
them by construction: **1.4.5** images-of-text ×5, **2.1.2** no-keyboard-trap ×5, **3.3.1** error-identification
×5, **2.4.7** focus-visible ×1. These are the interaction/perception SCs the harness reaches with tools +
behavior-driving detectors.

### J. Coverable-but-missed — 35

The barrier needs a specific semantic judgment axe (syntactic) cannot make and the semantic LLM **failed** to
make — often while it was busy flagging the incidental title. By SC: **4.1.2 ×13**, **2.4.6 ×7**, 2.4.10 ×3–4,
1.1.1 ×3, 1.4.3 ×3, 1.3.1 ×2, 2.4.4 ×2.

- **`9812d828fe`** (4.1.2, *failed* — "Element with aria-hidden has no content in sequential focus
  navigation"). Fixture: a `<div aria-hidden="true">` wrapping a focusable off-screen `<a href="#">` focus
  sentinel — a genuine 4.1.2 failure. AccessGuru's WCAG axe **did not fire** (`axe_wcag=[]`) and the semantic
  LLM output only `page-title-not-descriptive` (the "Failed Example 6" title) — **missing the real barrier
  while over-flagging the scaffold**. (GenA11y, by contrast, *over*-flags this exact aria-hidden-focus pattern
  — see `d343bc6a28` in §1.B — so the two tools fail this construct in opposite directions.)
- **2.4.6 misses (`9b967559ff`, `1e52060759`, `fa5104f9bd`…):** axe flags only `document-title` (→2.4.2) and
  the LLM flags `form-label-mismatch` (→3.3.2) — **no 2.4.6-mapped output at all**; the heading/label
  descriptiveness judgment (`ambiguous-heading`) is never produced. (These are the *same* testcases GenA11y
  misses via empty extraction — both tools blind on the same 2.4.6 fixtures, for different reasons.)

---

## 5. Cross-cutting synthesis

1. **Fixture-naïve over-reading (shared, dominant FP driver).** Neither tool models that ACT fixtures are
   *minimal test scaffolding*. They judge placeholder titles, bare structures, and stub content as real
   violations. AccessGuru's `page-title-not-descriptive` (emitted on ~85% of pages; a confirmed FP on the
   GT-assessable 2.4.2 subset) is the extreme; GenA11y's 2.4.2/2.4.4 descriptiveness FPs are the same error
   retail. **The harness avoids this by facet-routing + per-obligation applicability** — it never asks the
   model a page-level "is anything wrong?" question.

2. **Applicability-blindness (shared).** Both flag elements the ACT rule *excludes* — hidden, `aria-hidden`,
   not-in-tree, decorative (GenA11y §1.A = 36/49; AccessGuru §3.H carries the same on hidden links/images).
   Neither has a notion of scope/subtraction; the harness's applicability gate + obligation ledger is exactly
   this missing layer.

3. **Miscalibration is symmetric, not one-directional (GenA11y).** The identical descriptiveness judgment
   over-flags a placeholder title (FP, §1.B) *and* under-flags a genuinely non-descriptive name — the "W3C"
   HTML5-logo SVG (FN, §2.F). The quality bar is *uncalibrated*, so no single threshold tweak fixes it — the
   Table-1c finding (judge-design levers move FP and recall together) at the baseline level.

4. **FN roots diverge by architecture.** GenA11y misses via **extraction** (its per-SC collectors never
   surface the failing element — e.g. bare `<input>` for 4.1.2, 36/30 auto-clears): a *code* gap the LLM
   never gets to reason about. AccessGuru misses via **coverage** (16 SCs outside axe+taxonomy) and **semantic
   distraction** (the LLM emits the incidental title instead of the real barrier). The harness's design
   addresses both: exhaustive obligation enumeration (vs hand-written per-SC collectors) and tools/detectors
   for the interaction SCs.

5. **Model effect.** For **GenA11y** the model matters for FP volume — GPT-5.4-mini over-flags more than
   Gemini (116 vs 81), concentrated in 4.1.2 (55 vs 18 FPs) — but the *theme mix* is identical. For
   **AccessGuru** the two models are near-identical (69 vs 73 FP, 51/51 FN) because the deterministic axe
   backbone and the same taxonomy dominate; the semantic LLM's over-claims are a stable, family-invariant
   behavior. In both cases the *cause structure* is model-independent — consistent with Table 1f/1g's finding
   that the architecture, not the model, sets the operating point.

## 6. Implication for the harness

Every baseline failure mode here maps to a specific harness mechanism that removes it: **applicability gating**
(→ kills applicability-blindness, #2), **facet-routing + per-obligation scoping** (→ kills fixture-naïve
over-reading, #1, and the cross-SC title noise), **exhaustive obligation enumeration** (→ kills GenA11y's
extraction FNs, #4), **deterministic runners for measured facets** (→ kills GenA11y's contrast/image-of-text
perceptual FPs, §1.C), and **tools + behavior-driving detectors** (→ closes AccessGuru's coverage gap, §4.I,
e.g. the aria-hidden-focus, keyboard-trap, focus-visible constructs). The baselines fail precisely where the
harness routes the work away from an unaided single-shot judgment.

---

*Reproduce: buckets from `results/{gena11y,accessguru}-act-{gemini,gpt5mini}/results.json` (+ `llm-trace.jsonl`);
element-scoping via `eval/accessguru/data/axe_best_practice_only.json`. Referenced testcaseIds are truncated to
10 chars; full ids under `eval/checker-comparison/act-subset/pages/<ruleId>/<testcaseId>.html`.*
