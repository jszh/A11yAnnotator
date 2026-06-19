# Trusted Tester v5.1.3 — Extracted Requirements (scoped to our 22 SCs)

**Source:** DHS *Trusted Tester Section 508 Conformance Test Process for Web*, **Version 5.1.3 (April 2024)**
(`refs/Trusted Tester Test Process v5.1.3.pdf`). This folder is **not tracked** and will not be published.

**Purpose:** A lean, per-SC extraction of the Trusted Tester (TT) **Test Conditions**, **Applicability / DNA**,
**How to Test** steps, **Evaluate Results**, and **Notes** — limited to the success criteria in our annotation
scope (`categories.json`). Used to compare TT's manual test process against our harness rubrics, LLM tools, and
instruments and to surface gaps. See the companion analysis: `docs/analysis/TRUSTED-TESTER-GAP-ANALYSIS.md`.

---

## Scope caveat — TT covers WCAG 2.0 A/AA only

TT v5.1.3 implements the **Revised Section 508** standard, which adopts **WCAG 2.0 Level A and AA** (harmonized
with *Baseline Tests for Web Accessibility v3.0/3.1*). It therefore has **no test steps for WCAG 2.1 SCs** and
**no AAA SCs**. Of our 22 SCs:

| Covered by TT (17) | NOT covered by TT (5) | Why not |
|---|---|---|
| 1.1.1, 1.3.1, 1.3.2, 1.4.1, 1.4.3, 1.4.5, 2.1.1, 2.1.2, 2.4.2, 2.4.3, 2.4.4, 2.4.6, 2.4.7, 3.3.1, 3.3.2, 3.3.3, 4.1.2 | **1.4.10** Reflow | WCAG 2.1 AA — post-dates 508/WCAG 2.0 |
| | **1.4.11** Non-text Contrast | WCAG 2.1 AA |
| | **1.4.13** Content on Hover or Focus | WCAG 2.1 AA |
| | **4.1.3** Status Messages | WCAG 2.1 AA |
| | **2.4.10** Section Headings | WCAG 2.0 **AAA** (out of 508 A/AA scope) |

> For the 5 not-covered SCs there is **no TT baseline** to extract from. Our harness already builds these as
> barrier-only LLM lanes / instruments (reflow-overflow-probe, non-text-contrast rubric, hover-content-tri,
> status-message detector). They are flagged in the gap analysis as "no manual-process anchor exists in TT."

---

## TT Test → our SC crosswalk (Appendix A, filtered to our scope)

| TT Test ID | TT test name | SC(s) in our scope | Our category | Extracted file |
|---|---|---|---|---|
| 4.A | 2.1.1-keyboard-access | 2.1.1 | cat_4 | `sc-2.1.1-keyboard.md` |
| 4.B | 2.1.1-no-keystroke-timing | 2.1.1 | cat_4 | `sc-2.1.1-keyboard.md` |
| 4.C | 2.1.2-no-keyboard-trap | 2.1.2 | cat_5 | `sc-2.1.2-no-keyboard-trap.md` |
| 4.D | 2.4.7-focus-visible | 2.4.7 | cat_5 | `sc-2.4.7-focus-visible.md` |
| 4.F | 2.4.3-focus-order-meaning | 2.4.3 | cat_2 | `sc-2.4.3-focus-order.md` |
| 5.A | 3.3.2-label-provided | 3.3.2 | cat_9 | `sc-3.3.2-labels-or-instructions.md` |
| 5.B | 2.4.6-label-descriptive | 2.4.6 | cat_1 | `sc-2.4.6-headings-and-labels.md` |
| 5.C | 1.3.1-programmatic-label | 1.3.1, 4.1.2 | cat_2/cat_1 | `sc-1.3.1-info-and-relationships.md` |
| 5.F | 3.3.1-error-identification | 3.3.1 | cat_9 | `sc-3.3.1-error-identification.md` |
| 5.G | 3.3.3-error-suggestion | 3.3.3 | cat_9 | `sc-3.3.3-error-suggestion.md` |
| 6.A | 2.4.4-link-purpose | 2.4.4, 4.1.2 | cat_1 | `sc-2.4.4-link-purpose.md` |
| 7.A | 1.1.1-meaningful-image-name | 1.1.1, 4.1.2 | cat_1 | `sc-1.1.1-non-text-content.md` |
| 7.B | 1.1.1-decorative-image | 1.1.1 | cat_1 | `sc-1.1.1-non-text-content.md` |
| 7.C | 1.1.1-decorative-background-image | 1.1.1 | cat_1 | `sc-1.1.1-non-text-content.md` |
| 7.D | 1.1.1-captcha-alternative | 1.1.1 | cat_1 | `sc-1.1.1-non-text-content.md` |
| 7.E | 1.4.5-image-of-text | 1.4.5 | cat_6 | `sc-1.4.5-images-of-text.md` |
| 10.A | 2.4.6-heading-purpose | 2.4.6 | cat_3 | `sc-2.4.6-headings-and-labels.md` |
| 10.B | 1.3.1-heading-determinable | 1.3.1 | cat_2 | `sc-1.3.1-info-and-relationships.md` |
| 10.C | 1.3.1-heading-level | 1.3.1 | cat_2 | `sc-1.3.1-info-and-relationships.md` |
| 10.D | 1.3.1-list-type | 1.3.1 | cat_2 | `sc-1.3.1-info-and-relationships.md` |
| 12.A | 2.4.2-page-title-defined | 2.4.2 | cat_3 | `sc-2.4.2-page-titled.md` |
| 12.B | 2.4.2-page-title-purpose | 2.4.2 | cat_3 | `sc-2.4.2-page-titled.md` |
| 12.C | 4.1.2-frame-title | 4.1.2 | cat_1/cat_4 | `sc-4.1.2-name-role-value.md` |
| 12.D | 4.1.2-iframe-name | 4.1.2 | cat_1/cat_4 | `sc-4.1.2-name-role-value.md` |
| 13.A | 1.4.1-color-meaning | 1.4.1 | cat_6 | `sc-1.4.1-use-of-color.md` |
| 13.C | 1.4.3-contrast | 1.4.3 | cat_6 | `sc-1.4.3-contrast-minimum.md` |
| 14.A | 1.3.1-table-identification | 1.3.1 | cat_2 | `sc-1.3.1-info-and-relationships.md` |
| 14.B | 1.3.1-cell-header-association | 1.3.1 | cat_2 | `sc-1.3.1-info-and-relationships.md` |
| 14.C | 1.3.1-layout-table-structure | 1.3.1 | cat_2 | `sc-1.3.1-info-and-relationships.md` |
| 15.A | 1.3.2-content-order-meaning-CSS-position | 1.3.2 | cat_2 | `sc-1.3.2-meaningful-sequence.md` |
| 2.D | 4.1.2-change-notify-auto | 4.1.2 | cat_1/cat_4 | `sc-4.1.2-name-role-value.md` |

> **Out-of-scope TT tests not extracted:** 1.A–1.D (CAV/non-interference), 2.A–2.C (audio/auto-update),
> 3.A (flashing), 4.E (3.2.1 on-focus), 5.D (3.2.2 on-input), 5.H (3.3.4 error-prevention), 8.A (2.2.1),
> 9.A–9.C (2.4.1/3.2.3/3.2.4), 11.A–11.B (3.1.x language), 16–17 (media), 18.A (1.4.4 resize), 19.A (2.4.5),
> 20.A (4.1.1 parsing — "Not Tested"). Several of these (4.E on-focus, 5.D on-input) are relevant *adjacent*
> context-change behaviors and are noted in the gap analysis even though their SCs are outside our 22.

---

## Tooling note — TT's instrument is ANDI (manual), ours is CDP + VSR + OCR (automated)

TT is a **human-in-the-loop** process. Its primary instrument is **ANDI** (Accessible Name & Description
Inspector — an SSA bookmarklet) for AX-name/role/structure inspection, plus **Colour Contrast Analyzer (CCA)**
for contrast and **manual keyboard operation** for interaction. Almost every TT "How to Test" step is
"Launch ANDI: <module>, review the output, **and a human decides** pass/fail." Our harness replaces ANDI's
*inspection* with CDP AX-tree queries + collector facts, replaces CCA with pixel/CSSOM contrast, replaces the
human keyboard operator with deterministic runners/instruments, and replaces the human *judgment* with
SC-scoped LLM rubrics. The gap analysis maps each TT human-judgment step to where (if anywhere) our harness
makes the equivalent determination.
