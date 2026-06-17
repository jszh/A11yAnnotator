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

**Judge:** does the page title describe what THIS page is about, as shown in the viewport (its `<h1>` /
main heading / visible content)? Compare the title against the page's actual topic. Barriers:
- **Empty / boilerplate:** an empty title, or a generic stand-in ("Untitled", "Home", "Document") that
  identifies nothing, IS a barrier.
- **Topic mismatch:** a title that names a DIFFERENT subject than the page's content — e.g. a title
  "Apple harvesting season" over a page about clementines, or an effective first-of-several title that is
  a placeholder ("First title is incorrect") while the real content is something else — IS a barrier. The
  title must match the page you are looking at, not merely be a well-formed phrase.
- **Generic site/org name on a purposeful page:** when the page has a SPECIFIC purpose (a search-results
  page, an article, a product) but the title is only the bare site or organisation name (e.g. a
  "Search results for …" page titled just "University of Arkham"), it does NOT identify this page's topic
  → barrier. (A bare site name CAN be adequate for the site's actual front/landing page — judge relative
  to the content shown.)
A title that names the page's subject (optionally plus the site) and matches the visible topic is NOT a
barrier.

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
