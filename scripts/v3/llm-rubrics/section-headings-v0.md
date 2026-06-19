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
  non-repeated content has NO heading marking its start (content with no heading; or a page
  whose only heading sits over the repeated navigation, leaving the main content unheaded).
- Do **NOT** judge here (other rubrics own these):
  - whether a styled `<strong>`/`<div>` that *looks* like a heading is correctly marked up → that is **1.3.1**
    `info-relationships` (programmatic-vs-visual divergence). **BUT** for 2.4.10 the question is whether the
    content section has an a11y-tree-exposed heading AT ALL: if the ONLY thing introducing a section is a
    visual-only `<strong>`/styled `<div>` (no real `h1-h6`/`role=heading`), or the heading element is
    **removed from the a11y tree** (`aria-hidden=true`), then *for AT users the section is UNHEADED* →
    **REPRODUCED** (the 1.3.1 markup defect and the 2.4.10 absence co-exist; do not hide the 2.4.10 failure
    behind 1.3.1). Only **DEFER (PARTIAL)** to 1.3.1 when a REAL a11y-tree heading DOES introduce the section
    and the only open question is a subtler markup nuance.
  - whether an existing heading's *text is descriptive* → that is **2.4.6** `heading-descriptive`.
  - heading *contrast / legibility* → 1.4.3 / 1.4.11.

**Judge:** does each block of non-repeated content that a sighted user perceives as a distinct section
(visible in the `viewport`) have a heading introducing it? Two failure modes:
- **No heading at all** for substantive content (the document organizes content but ships zero `h1-h6`/
  `role=heading` over the main content).
- **Headings only over repeated/boilerplate regions** (nav/footer) while the unique main content is unheaded.
- **A heading is in the tree but not perceivable IN PLACE** — an entry in `structure.headings[]` is a
  PROGRAMMATIC fact only; it does NOT prove the heading visibly introduces the content. A heading that is
  **visually hidden** (off-screen `top:-9999px`/clip) or that **sits over the nav/TOC** leaves the visible
  content section unheaded for a sighted user. **Do NOT clear 2.4.10 on the strength of a descriptive heading
  STRING in the signal** (that was a real false-clear: a descriptive `h1` text was trusted while the `h1` was
  positioned off-screen). Confirm from the `viewport` that a heading visibly marks the section's start; if the
  heading is off-viewport, call `capture_full_page` and check `offDocument`/`verticalPositionPct`/`inViewport`
  — an off-document or nav-only heading does not organize the visible content (descriptiveness is irrelevant here).

**WCAG soundness caveats:**
- 2.4.10 is **AAA** and is about *presence/organization*, not descriptiveness or markup correctness.
- **PRECONDITION — multiple sections (apply this FIRST).** 2.4.10 applies only when the content is divided into
  MULTIPLE distinct sections/topics. A SINGLE continuous block of content — one article body, one chapter, one
  prose passage, one form, one search box — is ONE section and legitimately needs no section heading: return
  **N/A** (NOT a barrier), *even if it has no heading at all*. Only return REPRODUCED when there are 2+ distinct
  content sections a sighted user would perceive and at least one is not introduced by an (a11y-tree) heading. Do
  not fault a one-topic page for lacking a heading.
- If the `viewport` does not show enough of the content structure to tell whether a section lacks a heading,
  return **PARTIAL** — do not infer absence from the heading list alone when the layout is unclear.
- A CLAIM/deterministic structure result, if present, takes precedence — DEFER to it.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}`.
