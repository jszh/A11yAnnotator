# Root-Cause #1 — Rubric Iteration Log

_Closed-loop validation of the Root-Cause-#1 rubric family ("name/title/link/label/heading rubrics conflate
PRESENCE/LEGALITY with subjective DESCRIPTIVENESS"). Up to 3 rounds: rewrite → run the LLM lane on the RC#1
case subset → analyze → revise. Each round documented below._

## Scope & method

- **Case set:** the 32 run4 cases whose fix lane is the rubric family (the RC#1 cluster). Baseline (run4):
  **21 false positives + 11 false negatives (recall 0/11 on these)**. Outcome dist: caught 21, missedAgree 10,
  uncertain 1.
- **Eval command:** `run-fn-llm.js --reaches-llm --tools --pages=16 --cases=<rc1-cases.txt> --out=rc1-round<N>`
  (sonnet-4-6, vision+tools on — identical config to run4 so deltas isolate the rubric change).
- **Anti-leakage rule (load-bearing):** the rubrics must contain **NO examples drawn from the ACT set** — a
  rubric that names the exact fixture it is validated on is teaching-to-the-test and inflates the result. All
  ACT-id tags and literal ACT fixture content were stripped from every rubric and replaced with general,
  structural descriptions before round 1 (verified: zero ACT-id refs / fixture strings remain).
- **Clean-signal rule:** during the loop ONLY the rubrics change — oracle/collector/runner/tool code is frozen
  so each round's delta is attributable to the rubric edits alone. (Some RC#1 link cases depend on the
  cross-origin resolver fix, which is out-of-loop; those are expected to stay PARTIAL/uncertain here and are
  resolved later in the code-fix phase, not by a rubric.)

## Rubrics under test (the RC#1 family)

| rubric | SC | core change (round 1) |
|---|---|---|
| `accessible-name-adequacy-v0` | 4.1.2 | Owns name *identity*, not descriptive *quality*: flag only placeholder/leftover, wrong-control mismatch, or icon-names-the-icon. Gate the `present:false → REPRODUCED` rule so it fires ONLY for name-REQUIRING roles; container/structural roles (menu, group, list, navigation, region…) and a11y-tree-removed elements with an empty name are NOT REPRODUCED. |
| `page-title-v0` | 2.4.2 | Owns presence + non-contradiction only: flag empty/editor-default placeholder or a topic CONTRADICTION; do NOT escalate a present, non-contradicting title on descriptiveness grounds. |
| `link-purpose-v0` | 2.4.4 | "Context" = programmatically-ENCLOSING only (own name + enclosing sentence/list-item/cell or aria-associated). A non-ancestor heading/paragraph does NOT resolve purpose. Format-only/action-only names without enclosing subject ⇒ barrier. |
| `section-headings-v0` | 2.4.10 | Narrow the DEFER-to-1.3.1 carve-out: if a content section has NO a11y-tree heading (visual-only `<strong>`/styled div, or an aria-hidden heading), it is unheaded for AT ⇒ REPRODUCED; DEFER only when a real heading exists. |
| `error-identification-v0` | 3.3.1 | Add the ambiguous-field failure: an error naming only a label SHARED by 2+ fields, without saying which instance, does not identify the field ⇒ REPRODUCED. |
| `heading-descriptive-v0` | 2.4.6 | Add the label failure mode: a form-field label that names an unrelated object/generic concept, or is assembled out of order, instead of describing the field's expected input ⇒ REPRODUCED. |

---

## Progression (32 cases)

| state | FP | FN | total wrong | newly fixed | regressions |
|---|---|---|---|---|---|
| run4 baseline | 21 | 11 | 32 | — | — |
| **round 1** | 12 | 5 | **17** | 15 | 0 |
| **round 2** | 6 | 5 | **11** | 7 | 1 |
| **round 3** | 5 | 4 | **9** | 2 | 0 |

Of the 11 wrong after round 2, **7 are out-of-loop** (need oracle/resolver/precompute code, not a rubric):
1.1.1 svg/canvas enumeration ×2, iframe-pair equivalence ×2, cross-origin link resolution ×3.

## Round 1 — first-pass rubrics

Edits: the 6 first-pass rewrites in the table above. Result: **FP 21→12, FN 11→5** (15 fixed, 0 regressions).
Diagnosis of the 17 still-wrong:
- `page-title` flagged a real non-empty title as a "template placeholder" (×3).
- `accessible-name` flagged a real present name as "placeholder/filler that isn't descriptive" (×2) — i.e. it
  was still judging *descriptiveness*, which is 2.4.6's job.
- `section-headings` **over-corrected**: my round-1 "no a11y heading ⇒ REPRODUCED" now fired on a single
  continuous prose passage (one section) that legitimately needs no heading (FP).
- `heading-descriptive` did not catch labels duplicated across field groups (FN).
- The rest (svg/canvas, iframe-pair, contrast, cross-origin links) are code-fix territory, not rubric.

## Round 2 — placeholder discipline + multi-section + duplicate-label

Revisions: (a) `page-title` placeholder = literal editor defaults only; (b) `accessible-name` — a present real
name PASSES, only content-free tokens fail (4.1.2 never judges descriptiveness); (c) `section-headings` —
multi-section PRECONDITION (a single continuous block is N/A); (d) `heading-descriptive` — duplicate-label mode.
Result: **FP 12→6, FN 5→5** (7 fixed, **1 regression**: the duplicate-label clause pushed one previously-caught
generic-label case to UNCERTAIN). Diagnosis of the 4 rubric-fixable still-wrong → round 3:
- `accessible-name` still matched a real multi-word name to the "names the attribute/role" placeholder clause.
- `heading-descriptive` went UNCERTAIN on a plainly-non-descriptive label because it wanted to "know what the
  field expects" first.
- `link-purpose` still credited a *preceding-sibling* paragraph as "enclosing sentence" context.
- one table-cell link produced **noVerdict** — a routing/precompute gap (action-only name in a `<td>`), deferred
  to the code-fix phase, not a rubric edit.

## Round 3 — tightened placeholders / decisive labels / operational enclosing-context

Revisions: (a) `accessible-name` placeholder = EXACT reserved tokens only (a multi-word phrase mentioning the
type is a real name); (b) `heading-descriptive` — an unrelated-concept label fails ON ITS FACE (REPRODUCED, not
PARTIAL); (c) `link-purpose` — OPERATIONAL enclosing test (same containing block; a preceding-sibling paragraph
or sibling data cell does NOT count). Eval: `--out=rc1-round3`.

**Result: FP 6→5, FN 5→4 (2 fixed, 0 regressions).** `accessible-name` now passes a real multi-word name; the
unrelated-concept label now fails decisively. The `link-purpose` operational-enclosing edit did **not** move the
remaining link FN: the trace shows the EVIDENCE itself hands the rubric the preceding-sibling paragraph as "the
surrounding region shows … The W3C held a Workshop", so the model uses non-enclosing text *the rubric told it to
ignore* because the precompute presents it as context. No rubric wording can override mis-scoped evidence →
this is a **precompute/collector** fix, not a rubric edit.

## Outcome — the loop converged at its ceiling

Across 3 rounds the RC#1 rubrics went from **21 FP + 11 FN** (run4) to **5 FP + 4 FN** — recovering **16 FP and
7 FN (23 of 32)** with **zero net regressions** (one transient round-2 regression, fixed in round 3). The real
value: the loop **empirically proved** the rubric/code boundary instead of asserting it. All 9 remaining are
NON-rubric and become the code-fix phase's validation targets:
- **oracle** — 1.1.1 svg/canvas enumeration (×2); iframe-pair set-level equivalence (×2).
- **resolver** — cross-origin / `file://` link destinations (×3).
- **link-purpose precompute** — surrounding-region evidence conflates enclosing vs preceding-sibling context
  (the link FN); an action-only name in a `<td>` is not routed to the rubric (the noVerdict).

The rubrics carry **zero ACT-set examples** (verified) — every illustration is a general structural description,
so these gains are generalization, not memorization of the validation fixtures.

## Hand-off to the code-fix phase

The cases the rubric loop **cannot** fix (by design — they are not rubric problems) become the validation
targets for the non-rubric fixes: oracle (svg/canvas 1.1.1 enumeration; iframe-pair set-level equivalence),
resolver (cross-origin/`file://` link destinations), and the link-purpose precompute (route action-only names
in table cells).
