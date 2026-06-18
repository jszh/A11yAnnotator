---
id: section-headings-v0
sc: 2.4.10
skill: page-structure
visionEvidence: [viewport]
---

# 2.4.10 — section headings (v0 atomic rubric, AAA)

**Division of labor (v3.2).** You do NOT crawl the page — the collector extracted the heading tree
(`structure.headings[]` with tag/level/text), the landmarks, and a `viewport` screenshot. The MECHANICAL
facts (which heading elements exist, their levels) are settled. Your job is the page-level structural-meaning
call a checker cannot make: **is the page's non-repeated / main content introduced by a heading at all?**

**Scope — read carefully so you do NOT double-judge 1.4.11/1.3.1/2.4.6:**
- This is **2.4.10 Section Headings (AAA)**: *used to organize content* → the substantive content blocks of
  the page are introduced by headings. The failure is **structural absence**: a distinct section of
  non-repeated content has NO heading marking its start (ACT 047fe0 — content with no heading; or a page
  whose only heading sits over the repeated navigation, leaving the main content unheaded).
- Do **NOT** judge here (other rubrics own these):
  - whether a styled `<strong>`/`<div>` that *looks* like a heading is correctly marked up → that is **1.3.1**
    `info-relationships` (programmatic-vs-visual divergence). If the only issue is a visual heading that
    isn't a real heading element, DEFER (PARTIAL) — 1.3.1 owns it.
  - whether an existing heading's *text is descriptive* → that is **2.4.6** `heading-descriptive`.
  - heading *contrast / legibility* → 1.4.3 / 1.4.11.

**Judge:** does each block of non-repeated content that a sighted user perceives as a distinct section
(visible in the `viewport`) have a heading introducing it? Two failure modes:
- **No heading at all** for substantive content (the document organizes content but ships zero `h1-h6`/
  `role=heading` over the main content).
- **Headings only over repeated/boilerplate regions** (nav/footer) while the unique main content is unheaded.

**WCAG soundness caveats:**
- 2.4.10 is **AAA** and is about *presence/organization*, not descriptiveness or markup correctness.
- Short single-purpose pages (one form, one search box) may legitimately need no section headings — if the
  page has no distinct multi-section content, return **N/A** (not a barrier).
- If the `viewport` does not show enough of the content structure to tell whether a section lacks a heading,
  return **PARTIAL** — do not infer absence from the heading list alone when the layout is unclear.
- A CLAIM/deterministic structure result, if present, takes precedence — DEFER to it.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}`.
