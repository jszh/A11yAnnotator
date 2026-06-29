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

**Judge — this rubric owns title PRESENCE + non-contradiction, NOT descriptive quality.** The SC facet under
test requires a NON-EMPTY title; whether a present title is richly descriptive is a stricter, separate facet
you must NOT adjudicate here. Flag a barrier ONLY in these two cases:
- **Empty / default placeholder:** an empty/whitespace title, or a literal SYSTEM/EDITOR DEFAULT that stands
  in for "no title was set" — exactly "Untitled", "Untitled Document", "New Tab", "Document", or an
  un-substituted template token (`{{title}}`, `%TITLE%`). Treat ONLY these literal defaults as placeholders. A
  non-empty title that names *something* — even a plain, generic, or boilerplate-sounding phrase that reads like
  sample copy — is NOT a placeholder and PASSES. The non-empty-title facet under test does not judge whether the
  wording is a *good* title, so do NOT call a real, non-empty phrase a "placeholder" merely because it is
  generic or unspecific.
- **Topic CONTRADICTION:** a non-empty title that names a DIFFERENT, unrelated subject than the page's visible
  content — the title actively MISDIRECTS (names one topic while the page is plainly about another) → barrier.
**NOT a barrier (clear these — NOT REPRODUCED):** any non-empty title that names *something* and does not
contradict the content — INCLUDING a generic-but-real phrase, a bare site/org name, or a terse non-specific
title. "Could the title be MORE descriptive / more specific" is a separate, stricter facet that is out of
scope here: do NOT escalate a present, non-contradicting title to a barrier on descriptiveness grounds.

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
