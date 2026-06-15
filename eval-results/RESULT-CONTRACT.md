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

## Hard invariants (schema rejects on violation — see W2 / R2.3 / R2.4 / R2.5 / R2.6 / R2.7 / R2.8)
1. `verdict ∈ enum`; **EVERY** verdict — incl `N/A` and `NOT REPRODUCED` — carries a
   one-line `evidence`/reason (not just issues).
2. `sc` ∈ the skill's allowed list above; `level` matches the SC. A **normative** issue
   MUST carry an `sc`; a **best-practice/at-compat** observation may instead carry a
   non-SC `rule` id (no fake SC). A malformed `sc` (parses to no valid SC) or a `level`
   with no `sc` is rejected on ANY verdict (R2.5-F).
3. `element.anyIssue === (∃ sub-verdict REPRODUCED|PARTIAL)`.
4. `summary.bySkill[*]`, `summary.elementsWithIssue`, `summary.issues`, `summary.countBasis`
   are **derived**, equal to a recompute from `elements[]`. `summary.issues` is compared as an
   EXACT canonical array (length + per-index, incl `rule`); `countBasis` values are compared
   too; a non-object issue fails closed (no throw). No unexpected keys at any nesting level
   (issue/countBasis/bySkill cell).
5. No definite **dynamic** verdict (keyboard/focus/announcement) on a `notFound` element;
   nor on a probe stamped `trust:"synthetic"`/`isolation:"shared"`.
6. **SUPPORT-based behavioral binding (R2.4-B/R2.5-A/R2.8-A):** a DEFINITE behavioral verdict
   (keyboard-operability / focus-management / focus-visibility / dynamic-announcement /
   forms-instructions-errors) must be POSITIVELY DEMONSTRATED by an observed `drive.json`
   outcome — not merely the absence of a contradiction (silence is not failure evidence).
   Per cited SC: 2.4.7↔`focusIndicator.present`; 2.1.1↔an exercised key response (or native
   presumption, which supports only `NOT REPRODUCED`); 4.1.3↔an OBSERVED status message that
   was/wasn't announced (`liveRegionChanged` excludes display:none/`aria-live="off"`);
   2.4.3↔an observed focus-return outcome; **2.1.2↔the page `tabWalk`** (`trapDetected:true`
   for REPRODUCED; a positively-escapable walk — not indeterminate — for `NOT REPRODUCED`);
   3.3.1↔the FIELD'S OWN probed form (an unmapped field → PARTIAL). The DRIVER inventory is
   integrity-checked (no duplicate/extra driver xpaths) so evidence is not order-dependent.
7. `bucket ∈ {normative, at-compat, best-practice}`; only `normative` REPRODUCED counts toward
   an SC tally.
8. **Completeness:** all 3 page skills present and NOT `N/A`; no unexpected top-level/
   element/skill/verdict keys.
9. **Provenance + identity + freshness (R2.4-A/R2.5-C/R2.6-C/R2.7-C/R2.8-D):**
   `provenance.collect.xpaths` is derived from the MANDATORY `collect.json` (not the agent);
   `records.file === collect.file === drive.file`; collect and drive must share a `runId` AND
   `drive.drivenAt` (driver start) ≥ `collect.collectedAt` (collector COMPLETION) — both
   REQUIRED finite (a stale/reused drive is rejected). Raw collector xpaths must be unique
   (whitespace-normalized). Completeness is **default-closed**: every collected element is
   evaluated OR in `skipped:[{xpath,reason}]` with a SUBSTANTIVE reason; skips are capped at a
   **strict floor(25%)** of the inventory (no min-2 — a <4-element page permits none; record an
   unlocatable element as `notFound`).
10. **Axe ground truth (R2.5-B/R2.7-B/R2.8-C):** the collector stamps `axeRan`; the floor
    FAILS CLOSED — `axeRan === true` is required (missing ⇒ not-run), and a skip is rejected
    when axe didn't run OR found any WCAG-SC-tagged violation. RECONCILIATION: every WCAG SC
    the collector's axe flagged must be reported as a finding OR explicitly adjudicated in
    `axeAdjudications:[{sc,reason}]`. The `regression-sweep` re-runs the identity/freshness/axe
    gate and requires all three parseable artifacts per page (an incomplete page fails).
