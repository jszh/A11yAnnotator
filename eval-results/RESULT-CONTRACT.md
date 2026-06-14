# Result contract — canonical condition → SC → level map

The single authority for how findings map to WCAG. The skills, `AGENT-PLAN.md`, and the
schema validator (`scripts/lib/result-schema.js`) all conform to this. Produced in W1 of
[`REMEDIATION-PLAN.md`](REMEDIATION-PLAN.md); encodes the audit's normative corrections
(C1, C2, C4, H5, H6).

## Verdict enum
`REPRODUCED` | `PARTIAL` | `NOT REPRODUCED` | `N/A`. PARTIAL **must** carry a one-line
reason. A REPRODUCED **must** carry non-empty `evidence`.

## Conformance buckets
Every reportable observation is one of:
- **normative** — a WCAG SC failure (counts toward conformance).
- **at-compat** — a real AT-specific risk that isn't a normative failure (e.g. WebKit
  list-role stripping). Record with `bucket: "at-compat"`; does **not** count as an SC failure.
- **best-practice** — advisory (missing `<h1>`/landmarks, heading-skips, duplicate heading
  text). Record with `bucket: "best-practice"`; never an SC failure.

## Allowed SCs per skill (the schema rejects an SC outside its list)
| Skill | Allowed SCs | Notes |
|---|---|---|
| name-role-state | 1.1.1, 4.1.2, 2.4.4, 2.5.3 | media-fallback name ⇒ PARTIAL, not a name failure (T12) |
| color-and-visual-text | 1.4.3, 1.4.11, 1.4.1, 1.4.5 | large = ≥24px or ≥18.66px-bold (H6) |
| keyboard-operability | 2.1.1, 2.1.2, 2.4.3 | functionality-scoped; roving-tab not-Tab-reachable ≠ failure (C3) |
| focus-management | 2.4.3, 2.4.11, 2.4.7 | dialog focus return here, NOT 4.1.3 |
| focus-visibility | 2.4.7, 2.4.13 | indicator must be focus-*dependent* & visible (H1) |
| dynamic-announcement | 4.1.3 | **status messages only** — state/dialog ⇒ 4.1.2 / focus (C1) |
| reflow-and-pointer-affordances | 1.4.10, 2.5.8, 1.4.13, 2.5.5 | 2.5.8 = circle-geometry + real exceptions (C4) |
| forms-instructions-errors | 3.3.1, 3.3.2, 3.3.3, 1.3.1 | native validation can MEET 3.3.1 (C2) |
| page-structure | 2.4.2, 2.4.6, 1.3.1 | missing landmark/h1, heading-skip ⇒ best-practice (H5) |
| grouping-and-reading-order | 1.3.1, 1.3.2, 2.4.3 | list-style:none ⇒ at-compat unless semantics necessary (H5) |

## Corrected mappings (the audit fixes)
- **C1 — 4.1.3.** `aria-expanded`/`aria-pressed`/`aria-selected`/`aria-checked` change → **4.1.2**.
  Dialog/menu open → **focus-management / 3.2.x**. 4.1.3 only for a *status message*
  (success/result/progress/error) that does not take focus.
- **C2 — 3.3.1.** A failure requires a **demonstrated** detected error with **no text
  identification by any means**. Native `validationMessage`/UA focus generally **meets** 3.3.1.
  Missing `aria-invalid`/alert/live-region alone is **not** a failure. Un-associated native
  message ⇒ 3.3.3 / robustness, not auto-3.3.1.
- **C4 — 2.5.8.** Pass iff (≥24×24) OR essential OR a *semantic* inline exception OR the 24px
  circle does not intersect any adjacent **target rectangle** or another undersized target's
  circle. `display:inline` alone is triage, not the exception.
- **H5 — 1.3.1.** Missing `main`/`nav`, missing `<h1>`, heading-level skip, duplicate heading
  *text* → **best-practice**. `list-style:none` → **at-compat** (WebKit) unless list semantics
  are necessary. Empty/un-named heading and visual-non-heading remain **normative** 1.3.1.
- **H6 — contrast.** Large-text threshold ≥24px (18pt) / ≥18.66px (14pt) bold.

## "Issue" definitions (stamp the basis into the JSON; no bare "N findings")
- `subVerdict` — one element × one skill verdict (REPRODUCED or PARTIAL).
- `elementWithIssue` — an element with ≥1 REPRODUCED/PARTIAL sub-verdict.
- `dedupedDefect` — `summary.issues[]`: defect dedup/merge by `(scope, skill, sc, bucket,
  rule, FULL-normalized-evidence)`; a REPRODUCED and a PARTIAL of the SAME defect MERGE with
  precedence **REPRODUCED > PARTIAL**, so the tally is independent of element order.
- `page` — a page with ≥1 elementWithIssue.
`summary.countBasis` records which denominator a published number uses.

## Hard invariants (schema rejects on violation — see W2 / R2.3-C / R2.3-D)
1. `verdict ∈ enum`; **EVERY** verdict — incl `N/A` and `NOT REPRODUCED` — carries a
   one-line `evidence`/reason (not just issues).
2. `sc` ∈ the skill's allowed list above; `level` matches the SC. A **normative** issue
   MUST carry an `sc`; a **best-practice/at-compat** observation may instead carry a
   non-SC `rule` id (no fake SC).
3. `element.anyIssue === (∃ sub-verdict REPRODUCED|PARTIAL)`.
4. `summary.bySkill[*]`, `summary.elementsWithIssue`, `summary.issues` are **derived**, equal
   to a recompute from `elements[]`. `summary.issues` is compared as an EXACT canonical array
   (length + per-index, incl `rule`), so duplicates and corrupted fields are rejected.
5. No definite **dynamic** verdict (keyboard/focus/announcement) on a `notFound` element;
   nor on a probe stamped `trust:"synthetic"` or `isolation:"shared"` — those must be PARTIAL.
6. `bucket ∈ {normative, at-compat, best-practice}`; only `normative` REPRODUCED counts toward
   an SC tally.
7. **Completeness:** all 3 page skills present and NOT `N/A` (inherently applicable); no
   unexpected top-level/element/skill/verdict keys.
8. **Provenance:** `provenance.collect.xpaths` (the collector inventory) is required; every
   element must be IN it (no fabricated element); a fully-evaluated inventory may not drop a
   collected element.
