---
id: page-title-v0
sc: 2.4.2
skill: page-structure
visionEvidence: [viewport]
---

# 2.4.2 — page titled (v0 atomic rubric, ○-tier)

**Division of labor (v3.2).** The collector extracted `document.title` (the EFFECTIVE title — the text of
the FIRST `<title>` element, which is what the browser uses) and a viewport screenshot. Whether a title
EXISTS is mechanical; you JUDGE whether it DESCRIBES this page's topic or purpose.

**`signals.pageTitle.value` is the DETERMINISTIC title — it is AUTHORITATIVE for presence.** If
`pageTitle.present` is true, the page HAS a non-empty `<title>` whose exact text is `pageTitle.value`. Do NOT
contradict this from the screenshot: a sparse, near-empty, or slow-to-paint VIEWPORT does NOT mean the title is
missing — the title lives in the document head, not the visible page. NEVER report "the page is blank" or "the
title is missing/empty" when `pageTitle.present` is true; read the title from `pageTitle.value`, and judge ONLY
whether that string is a literal placeholder or contradicts the page's topic.

**Judge — does the title DESCRIBE THIS page's topic or purpose? (context-relative, NOT a richness test).** 2.4.2
requires a non-empty title that conveys what THIS page is about or does. This is NOT a richness test: a terse title
that IDENTIFIES the page passes, and "could be more specific" is 2.4.6's stricter facet, out of scope here. Flag a
barrier ONLY in these cases:
- **Empty / default placeholder:** an empty/whitespace title, or a literal SYSTEM/EDITOR DEFAULT that stands
  in for "no title was set" — exactly "Untitled", "Untitled Document", "New Tab", "Document", or an
  un-substituted template token (`{{title}}`, `%TITLE%`). Treat ONLY these literal defaults as placeholders. A
  non-empty title that names *something about this page* — even a plain or boilerplate-sounding phrase — is NOT a
  placeholder. Do NOT call a real, non-empty, page-identifying phrase a "placeholder" merely because it is terse.
- **Topic CONTRADICTION:** a non-empty title that names a DIFFERENT, unrelated subject than the page's visible
  content — the title actively MISDIRECTS (names one topic while the page is plainly about another) → barrier.
- **Identifies NOTHING about THIS page (context-relative):** a title that names ONLY the SITE/ORGANISATION (or is
  otherwise a site-wide constant) and says nothing about this specific page, WHEN the viewport shows the page is a
  DISTINCT, specific page — an article with its own subject/`<h1>`, a product, a form/checkout, a search-results
  list. Such a title would read identically on every page and conveys neither this page's topic nor its purpose ⇒
  barrier. (This is NOT "too generic to be ideal" — it is a title that does not identify the page AT ALL.)

**A bare site/org name is CONTEXT-RELATIVE, not an automatic pass.** It PASSES when the page's content IS that
org/site — a home/landing page whose topic legitimately IS the organisation (there the org name DOES describe the
page). It FAILS on a page plainly about a distinct subject the org name does not identify (the case above). Do not
blanket-clear an org name; read the viewport for what the page actually IS first.

**NOT a barrier (clear these — NOT REPRODUCED):** a non-empty title that names THIS page's topic or purpose, even if
terse or plain — including a home page titled with the org name, a section page titled with the section name, or a
paraphrase of the visible subject. Reserve "could be MORE descriptive" for 2.4.6; do NOT escalate a title that DOES
identify the page on richness grounds. When the viewport does not reveal what the page is, return PARTIAL.

**Evidence handed to you:** the effective title string and the `viewport` — read the page's REAL topic
from the viewport (the `<h1>`, main heading, or dominant visible content) and compare.

**WCAG soundness caveats:**
- 2.4.2 needs a DESCRIPTIVE title, not a unique-across-the-site one (that overlaps 2.4.x but is not the test).
- Do not require an exact string match: a title that PARAPHRASES the topic accurately is fine. Flag only a
  genuine mismatch or a non-descriptive stand-in, not a reasonable rewording.
- If the viewport does not reveal the page's topic (content below the fold / not captured), return PARTIAL
  rather than guessing whether the title matches.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}`. verdict ∈
{REPRODUCED (barrier — title absent / non-descriptive / mismatched), NOT REPRODUCED (no barrier — title
describes the page), PARTIAL (cannot decide from the title + viewport), N/A (abstain — NOT "out of scope",
that is the oracle's job)}.
