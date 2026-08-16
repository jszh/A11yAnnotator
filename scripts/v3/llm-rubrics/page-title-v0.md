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
  **`signals.pageTitle.frameTitles` (frameset pages only, present when non-empty):** `pageTitle.value` is always
  the OUTER document's `<title>` — genuinely authoritative for what the browser tab/AT reports, so it stays the
  title you judge. But a legacy `<frameset>` page's real, rendered content lives in a CHILD frame, which may carry
  its OWN, DIFFERENT `<title>` the outer shell never shows. When `frameTitles` is present, treat each entry as a
  strong hint of what the visibly-rendered frame is actually titled internally — cross-reference it against the
  viewport's real content and against `pageTitle.value`. If the viewport's visible content matches a `frameTitles`
  entry's subject rather than the outer `pageTitle.value`'s subject, that IS a topic contradiction (the outer
  title describes a different page than what's actually shown) — do not default to "the title matches" just
  because a plausible-sounding org/brand name is present in `pageTitle.value`.
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

**A TITLE THAT NAMES THE TEMPLATE BUT NOT THE INSTANCE IS NOT DESCRIPTIVE (F25 / TT 12.B).** The commonest
real failure is not a missing or nonsense title — it is a correct-looking title that describes a CLASS of
pages while the page in front of you is one specific member of it. The shape to look for: the title names
the KIND of page — a receipt, a statement, a person's record, a result list, a reservation — while the
page's actual subject is one particular instance of that kind. A user with many tabs open, or reading a
browser history list, cannot tell such pages apart, which is the capability 2.4.2 exists to provide.

So: after confirming the title names the page's topic, work the test in THREE ORDERED STEPS, and stop at the
first one that resolves it. No new instrument is needed — everything you need is in the viewport you have.

1. **Read what the page presents as ITS OWN identity.** That is its main heading — the `<h1>`, or the
   dominant title text at the top of the content if there is no `<h1>` — TOGETHER WITH any identifier the
   page displays as part of NAMING ITSELF: in or immediately beside that heading, in a subtitle/eyebrow line,
   or in a summary block whose job is to say which record this is (a reference/order/invoice/case number, a
   named person or place, a date or period, a version, a search query). Detail that merely appears SOMEWHERE
   IN THE BODY is CONTENT, not the page's identity: a value inside a table, a measurement, a figure caption,
   a byline, a footer stamp, one item among many in a list. Do NOT go hunting through the body for a
   discriminator the page itself does not use to name itself.
2. **Compare the `<title>` against that heading.** If the title carries the heading's identifying
   substance — the same subject, with none of the heading's identifying words dropped — then the title
   DESCRIBES this page and you are **FINISHED: NOT REPRODUCED.** Wrapping it in a site or section name, in
   either order, does not weaken it, and neither does terseness. A title that already says what the page's
   own heading says cannot be failed by this clause at all: asking for MORE identification than the page
   claims about itself is 2.4.6's stricter facet, not 2.4.2's.
3. **Only if the title DROPS identifying words the heading carries**, ask what those dropped words do. The
   barrier is the narrow case where what remains names only the CLASS of page while the heading names one
   particular MEMBER of that class — a specific record, document, transaction, product, subject, or numbered
   step — so the title would read identically for every other member of the class. **Name the exact words
   the heading has and the title lacks, and say what they identify.** If you cannot quote such words from the
   heading, there is no barrier here.

*Guard — do NOT invent this failure.* A page that genuinely has no single instance as its subject (a home
page, an "About us", a section/category view, a dashboard, a generic contact form) has no discriminator to
carry, and its class-level title is correct — a section page's subject IS the section, so naming the section
NAMES the page, even when that page sits in an obvious multi-page set and even when it displays plenty of
specific data. A title that carries the discriminator in a suffix or prefix alongside a site or section name
is fine — the requirement is that the information BE there, not where it sits.

**WCAG soundness caveats:**
- 2.4.2 needs a DESCRIPTIVE title, not a unique-across-the-site one (that overlaps 2.4.x but is not the test).
  The instance-discriminator test above is NOT a uniqueness test, and you must not let it drift into one: it
  asks whether the title describes THIS page, and a page whose subject is one specific record is not
  described by the bare name of its category. Its anchor is the page's OWN heading, precisely so it cannot
  become "would this string be unique across the site?" — a title matching the page's own heading is
  descriptive by definition, and "another page could in principle be titled the same" is NOT a finding.
- Do not require an exact string match: a title that PARAPHRASES the topic accurately is fine. Flag only a
  genuine mismatch or a non-descriptive stand-in, not a reasonable rewording.
- If the viewport does not reveal the page's topic (content below the fold / not captured), return PARTIAL
  rather than guessing whether the title matches.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}`. verdict ∈
{REPRODUCED (barrier — title absent / non-descriptive / mismatched), NOT REPRODUCED (no barrier — title
describes the page), PARTIAL (cannot decide from the title + viewport), N/A (abstain — NOT "out of scope",
that is the oracle's job)}.
