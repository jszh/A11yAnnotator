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

**INSTANCE-UNIQUENESS IS NOT A BARRIER CONDITION — the only instance-shaped failure here is
heading-anchored (F25 / TT 12.B).** 2.4.2 requires the title to describe the page's topic or purpose; it
does NOT require the title to distinguish this page from the other pages of its set. "This title would read
the same for every record/result/statement of this kind" is at most an advisory observation — never, on its
own, a barrier: naming the KIND of page IS describing its topic, and demanding the instance detail on top of
that is a richness ask, not this criterion. The one narrow case that DOES fail is a title that drops
identifying words the page ITSELF claims as its identity — its own primary heading — and that case is
decided ONLY through the three anchored steps below, never from detail found elsewhere in the body.

So: after confirming the title names the page's topic, work the test in THREE ORDERED STEPS, and stop at the
first one that resolves it. **You do not have to find the anchor or do the comparison yourself — when
`signals.pageTitle.headingCorrespondence` is present, steps 1 and 2 are ALREADY ANSWERED for you, off the DOM
rather than off the crop. Use those values; do not re-derive them by eye and do not overrule them from the
screenshot.**

1. **The page's OWN identity is its primary heading**, and when the correspondence signal is present that
   heading is `headingCorrespondence.headingText` — the shallowest heading that is actually visible to a user.
   That heading, and nothing else, is the anchor. Everything else on the page is CONTENT, not the page's
   identity: a subtitle or eyebrow line, a breadcrumb, a byline, a value inside a table or summary block, a
   figure caption, a footer stamp, one item among many in a list. **A title is NOT failed for omitting detail
   that sits outside the page's own heading** — that is where this clause turns into a richness test, which is
   2.4.6, not 2.4.2. If the signal is ABSENT (no usable heading), fall back to reading the dominant title text
   at the top of the content from the viewport, and hold to the same rule about what is and is not identity.
2. **Compare the `<title>` against that heading — the signal has already done it.**
   `headingCorrespondence.titleCarriesHeadingWords === true` means every content word of the heading is
   present in the title, so the title says what the page's own heading says and you are **FINISHED: NOT
   REPRODUCED** under this clause. Wrapping it in a site or section name, in either order, does not weaken it;
   neither does terseness; neither does extra text in the title. Asking for MORE identification than the page
   claims about itself is 2.4.6's stricter facet, not 2.4.2's. **A partial or prefix overlap is NOT a match** —
   only an empty `headingWordsMissingFromTitle` ends the test here.
3. **Only if the title DROPS identifying words the heading carries** — i.e.
   `headingWordsMissingFromTitle` is non-empty — ask what those dropped words do. The barrier is the narrow
   case where what remains names only the CLASS of page while the heading names one particular MEMBER of that
   class — a specific record, document, transaction, product, subject, or numbered step — so the title would
   read identically for every other member of the class. **Quote the dropped words and say what they
   identify.** Dropped words that identify NOTHING in particular (a filler word, a generic verb, a repeat of
   the site name) are not a barrier — the missing words have to be the ones that say WHICH member this is.

*Guard — do NOT invent this failure.* A page that genuinely has no single instance as its subject (a home
page, an "About us", a section/category view, a dashboard, a generic contact form) has no discriminator to
carry, and its class-level title is correct — a section page's subject IS the section, so naming the section
NAMES the page, even when that page sits in an obvious multi-page set and even when it displays plenty of
specific data. A title that carries the discriminator in a suffix or prefix alongside a site or section name
is fine — the requirement is that the information BE there, not where it sits.

**A VOLUNTEERED instance token that CONTRADICTS the page — `signals.pageTitle.titleInstanceConflict`
(present only when the collector detected it).** This clause is about a token the title CONTAINS — it can
NEVER fire on an ABSENT token, and it adds no richness requirement on top of the steps above.

The token is a **YEAR, and only a year** — the collector reads nothing else (no dates, numbers, editions or
version markers). Read the fact for exactly what it measured, and no further:

- `titleYears` are the year(s) the title volunteers; `conflictYear` is the year the page carries instead.
- NONE of `titleYears` appears on any surface the collector admitted, and `conflictYear` is the majority
  year among them — carried either by a PRIMARY identity surface (the `h1`, an `aria-level=1` heading, or a
  hero-sized named graphic — `surfaces[].primary: true`) or by at least two admitted surfaces.
- `surfaces[]` is the whole evidence base: headings, named graphics, `<dl>` fact lists and the footer, with
  ©/copyright and "established/founded/since" constructions stripped out, and with body PROSE excluded
  entirely. Sub-headings and fact lists were admitted only where they share wording with the title or
  repeat a year already anchored elsewhere on the page.

So the fact establishes a MAJORITY of the page's identity surfaces against the title — NOT unanimity, and
not that any particular surface is right. Read `surfaces[]` before you use it: if the years there are about
something other than which instance this page is (an archive index that legitimately lists several years, a
year in a product name, a page whose subject really is the older year), the contradiction is not real and
you must say so. When it IS real, this is the topic-CONTRADICTION case above in instance form: the title
actively misdirects, claiming this page is one instance while the page's own identity surfaces say it is
another ⇒ barrier. Quote both years and name the surface that contradicts the title. Absent this signal,
draw no such inference yourself — a title that merely OMITS an instance token is governed by the
heading-anchored steps above and by nothing else.

**WCAG soundness caveats:**
- 2.4.2 needs a DESCRIPTIVE title, not a unique-across-the-site one (that overlaps 2.4.x but is not the test).
  The instance-discriminator test above is NOT a uniqueness test, and you must not let it drift into one: it
  asks whether the title describes THIS page, and a page whose subject is one specific record is not
  described by the bare name of its category. Its anchor is the page's OWN heading, precisely so it cannot
  become "would this string be unique across the site?" — a title matching the page's own heading is
  descriptive by definition, and "another page could in principle be titled the same" is NOT a finding.
- `headingCorrespondence` is a STRING comparison, not a judgment, and it settles only the clause above.
  `titleCarriesHeadingWords: true` does NOT clear a title that is a literal placeholder, nor one that
  contradicts the page's topic — those two tests are earlier in this rubric and are still yours to make from
  the viewport. And a title may legitimately PARAPHRASE its heading: when words are listed as missing but the
  title says the same thing in different words, that is a reasonable rewording, not a dropped discriminator.
- Do not require an exact string match: a title that PARAPHRASES the topic accurately is fine. Flag only a
  genuine mismatch or a non-descriptive stand-in, not a reasonable rewording.
- If the viewport does not reveal the page's topic (content below the fold / not captured), return PARTIAL
  rather than guessing whether the title matches.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}`. verdict ∈
{REPRODUCED (barrier — title absent / non-descriptive / mismatched), NOT REPRODUCED (no barrier — title
describes the page), PARTIAL (cannot decide from the title + viewport), N/A (abstain — NOT "out of scope",
that is the oracle's job)}.
