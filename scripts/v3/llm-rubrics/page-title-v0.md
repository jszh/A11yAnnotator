---
id: page-title-v0
sc: 2.4.2
skill: page-structure
visionEvidence: [viewport]
---

# 2.4.2 — page titled (v0 atomic rubric, ○-tier)

**Division of labor (v3.2).** The collector extracted `document.title` and a viewport screenshot. Whether
a title EXISTS is mechanical; you JUDGE whether it DESCRIBES the page's topic or purpose.

**Judge:** does the page title describe what the page is about? An empty title IS a barrier. A generic
boilerplate title ("Untitled", "Home", the bare site name on a deep content page) that does not identify
THIS page's topic IS a barrier. A title that names the page's subject (and optionally the site) is NOT.

**Evidence handed to you:** the title string and the `viewport` (the page's visible topic/H1).

**WCAG soundness caveats:**
- 2.4.2 needs a DESCRIPTIVE title, not a unique-across-the-site one (that overlaps 2.4.x but is not the test).
- A short site-name-only title can be adequate for the site's front page; judge relative to the content shown.
- If the viewport doesn't reveal the page's topic, return PARTIAL.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}`.
