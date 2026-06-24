# case-02 — Pharmacy FAQ where the third group's `<h2>` is the leftover CMS placeholder "Untitled section"

## Scenario
An online pharmacy's "Help & Prescriptions FAQ" page groups questions into three accordion
sections. The first two `<h2>` group headings are real names — **Delivery & tracking** and
**Returns & refunds**. The third group is actually the repeat-prescription / controlled-drug
FAQ (reordering repeats, photo-ID on Schedule 2/3 deliveries), but its heading still reads
**"Untitled section"** — the CMS's default placeholder label that the editor created the block
with and never replaced. A sighted reader infers the topic from the questions beneath it; a
screen-reader user navigating the heading list hears "Untitled section, heading level 2" and
gets no mental handle for the section's real subject.

## Attribute tuple
- **content-domain**: healthcare — online pharmacy / prescriptions help centre
- **UI-component/pattern**: FAQ accordion (APG disclosure pattern) grouped into `<section aria-labelledby>` topic blocks
- **host-language construct**: `<h2 id="g-placeholder">Untitled section</h2>` — a real, non-empty text heading whose string is a CMS placeholder, not a section name
- **locale/i18n**: en-GB (£ pricing, GP surgery / GPhC references)
- **failure-mechanism**: placeholder-text heading — the heading is present, exposed, and has a
  fully valid non-empty accessible name, but that name ("Untitled section") names nothing; a
  semantic non-name distinct from the empty/whitespace/glyph variants

## Developer persona
The FAQ is maintained in a block-based CMS where each topic block is created from a template
that ships with the heading pre-filled as "Untitled section". The editor adding the
controlled-substance questions pasted the Q&A into the block, hit save, and moved on without
overwriting the placeholder title. In the CMS preview the block clearly sits under its
questions, so visually nothing looks wrong, and the publish-time checks (which look for
*empty* headings) pass — the placeholder string is non-empty — so it shipped.

## Element / selector carrying the issue
- FAIL: `h2#g-placeholder` (`.grp`) — accessible name `"Untitled section"`, role `heading`,
  level 2, visible, not ignored. It introduces the repeat-prescription / controlled-drug FAQ
  but names nothing about it. The two sibling group headings (`#g-delivery`, `#g-returns`)
  carry real names, so the failure is per-section, not page-wide.

## Exact accessibility mechanism
Verified in Chromium's accessibility tree: `#g-placeholder` computes to `role="heading"`,
`name="Untitled section"`, `level=2`, `ignored=false` — a present, exposed heading with a
genuinely non-empty, real-word accessible name. A screen-reader heading list reads:

> "Delivery & tracking, heading level 2 · Returns & refunds, heading level 2 · **Untitled
> section, heading level 2**."

A blind patient skimming by heading for "how do I reorder my repeat?" or "what ID do I need
for controlled drugs?" cannot tell that the third, named-but-meaningless section is the one
they want — "Untitled section" is a label that explicitly announces the absence of a name.
The element satisfies the *structural* presence requirement (a heading exists for the section)
yet defeats the *naming* purpose 2.4.10 exists for: the heading provides no mental "handle"
for the content it introduces. This is the present-and-exposed-but-nameless mode realised
through a non-empty placeholder string rather than empty/whitespace/glyph content.

## Expected ACT-style outcome
**failed** — a section heading is present and exposed but conveys no section name; its text is
a leftover placeholder ("Untitled section") that does not identify the section it introduces.

## Why automated tools miss it
This case is specifically constructed so the obvious automated rule provably cannot fire:
axe-core's `empty-heading` checks whether a heading's accessible name is empty, and here the
computed name is the non-empty, normal-text string `"Untitled section"` (no `&nbsp;`, no
whitespace-only node, no decorative glyph). axe, WAVE, and Lighthouse therefore see a fully
named, structurally valid `<h2>` and report nothing. No checker has a lexicon to recognise
that "Untitled section" is a CMS placeholder — a non-name — rather than a legitimate section
title, nor to judge that it fails to name the controlled-substance content beneath it.
Distinguishing a real section name from a real-text non-name is a human reading judgment.

## Citation
> **WCAG 2.2 Understanding — Intent of Section Headings**
> "When such sections exist, they need to have headings that introduce them. This clearly
> indicates the organization of the content, facilitates navigation within the content, and
> provides mental "handles" that aid in comprehension of the content."

> **WCAG 2.2 Understanding — Benefits of Section Headings**
> "People who are blind will know when they have moved from one section of a web page to
> another and will know the purpose of each section."

> **WCAG Techniques — G141: Organizing a page using headings**
> "The objective of this technique is to ensure that sections have headings that identify them."
