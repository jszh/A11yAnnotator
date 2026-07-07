# ACT Rules corpus (manual / semi-automatic, in-scope SCs + ARIA)

W3C **ACT Rules** that require manual or semi-automatic inspection and that map to our in-scope
requirements, downloaded from the WAI site for the coverage analysis.

## Filter (exact reproduction of the WAI listing)
Source listing: <https://www.w3.org/WAI/standards-guidelines/act/rules/?requirements=a,aa,aria&status=approved,proposed&implement=manual,semi-auto&display=no-rules>

The WAI page filters client-side (`content-assets/wcag-act-rules/filter-scripts.js`). A rule is shown when:
- its requirement's `data-level ∈ {a, aa, aria}`, **and**
- `data-status ∈ {approved, proposed}` (deprecated excluded), **and**
- its `data-implement` token set **intersects** `{manual, semi-auto}` (note: inclusive — a rule that *also* has an `auto`/`lint` implementation still matches; only rules with *no* manual/semi-auto path, e.g. `auto`-only or `none`, are excluded).

We then **scoped to our project**: kept only rules whose requirement is one of the 22 SCs in
[`categories.json`](../categories.json) **or** a WAI-ARIA requirement.

Result: **40 unique rules** (across the 22 SCs + ARIA). **6** of them are *not* fully automatable
(no `auto` token): `qt1vmo`, `1a02b0`, `ee13b5`, `fd3a94`, `36b590`, `4b1c6c`.

## Provenance
- Fetched 2026-06-17 from `https://www.w3.org/WAI/standards-guidelines/act/rules/<id>/proposed/`.
- Polite fetch: descriptive User-Agent, 1.5 s inter-request delay, exponential backoff (3→6→12→24 s) on 429/5xx. 40/40 succeeded.
- License: rules are W3C deliverables (W3C Document/Software licenses).

## Layout
- `pages/<id>.html` — raw rule page as fetched.
- `extracted/<id>.md` — lean text extraction (Description / Applicability / Expectation / Background / Requirements Mapping / Examples; the shared Glossary is omitted — see raw HTML). This is what the analysis reads.
- `act-rules-manifest.json` — the 40 rules with id, name, status, implementation tokens, in-scope requirements, and source URL.

## Analysis
Coverage of these rules against the harness / axe / IBM / skills / LLM rubrics / instruments is in
[`../docs/analysis/ACT-RULES-COVERAGE-ANALYSIS.md`](../docs/analysis/ACT-RULES-COVERAGE-ANALYSIS.md),
complementing the technique-level analysis in
[`../docs/analysis/WCAG-TECHNIQUE-COVERAGE-ANALYSIS.md`](../docs/analysis/WCAG-TECHNIQUE-COVERAGE-ANALYSIS.md).

## Rest-of-ACT extension (`rest/`)
`rest/` mirrors the description pages for the **50 rules that are NOT in the 40 in-scope rules above** — i.e.
the rules referenced by the complement testcase corpus
[`../eval/checker-comparison/act-rest/`](../eval/checker-comparison/act-rest/) (the 609 ACT testcases outside
this project's selected SCs; `act-subset/` 581 + `act-rest/` 609 = 1190 total). These 50 cover the SCs this
project does **not** yet target (1.2.x audio/video, 1.3.3, 1.3.4, 1.3.5, 1.4.2, 1.4.4, 1.4.6, 1.4.12, 2.2.1/2/4,
2.4.1, 2.4.9, 2.5.3/4, 3.1.1/2, 3.2.5, …) plus a few pure-ARIA rules. This directory is **additive** — it does
not change the in-scope filter or `act-rules-manifest.json` above.

- `rest/pages/<id>.html` — raw rule page (with a leading `<!-- source-url: … -->` provenance comment).
- `rest/extracted/<id>.md` — lean extraction in the **same format** as `extracted/` (Description / Applicability /
  Expectation / Background / Requirements Mapping / Examples; Glossary omitted). `requirements:` lists the rule's
  mapped WCAG SCs (identical to `act-rest/subset.json` `sc[]`; `[]` for pure-ARIA rules).
- `rest/manifest.json` — the 50 rules with id, name, rule-level status (approved if any of its testcases is
  approved), `implement` tokens (only when present on the rule page — the standalone rule pages don't carry them,
  so this is usually `[]`), `wcagRequirements` (== subset `sc[]`), raw `requirementKeys`, and source URL.

Built by [`../eval/checker-comparison/build-rest-rules.js`](../eval/checker-comparison/build-rest-rules.js).
Fetched from `…/act/rules/<id>/proposed/` (fallback `…/<id>/`); **all 50 resolved via `/proposed/`**. Result:
**50 rules — 15 approved, 35 proposed.** Transport is **curl**, not Node `fetch`: the W3C content CDN blocks
node/undici's client/TLS fingerprint with a persistent HTTP 429 (a spoofed browser UA gets 403 bot-detection),
while curl with a descriptive User-Agent gets 200.
