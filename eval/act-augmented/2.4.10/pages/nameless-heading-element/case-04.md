# case-04 — Analytics dashboard panel whose heading is a `role="heading"` div containing only "———" dingbats

## Scenario
A SaaS analytics dashboard ("Pulse — Acquisition Overview") shows three panels: **Top-line
KPIs**, **Channels by signups**, and a geographic breakdown. The first two panels are headed
by plain text `<h2>` elements. The third panel's title is a custom design-system divider:
`<div role="heading" aria-level="2">———</div>` — three em-dashes used as a decorative rule.
Visually it reads as a faint horizontal divider; programmatically it is a level-2 heading
whose name is the punctuation string "———", introducing the geographic table beneath it.

## Attribute tuple
- **content-domain**: SaaS analytics dashboard (product acquisition metrics)
- **UI-component/pattern**: card/panel dashboard layout with `<section aria-labelledby>` panels and a design-system "SectionDivider" component
- **host-language construct**: ARIA `role="heading"` + `aria-level="2"` on a `<div>` whose only content is em-dash dingbats (U+2014 ×3)
- **locale/i18n**: en (UTC dashboard)
- **failure-mechanism**: dingbat-only heading via ARIA role — a divider component was given a heading role, so its punctuation becomes the section name

## Developer persona
A front-end developer needed a visual break before the geographic table and reused the design
system's `<SectionDivider>` component without checking its internals. That component renders
`role="heading"` (so it inherits the panel-title typography), and its default content is an
em-dash rule. The dev passed no title prop, so the "heading" shipped with only "———" as its
name. Storybook showed the divider looking right; the heading semantics it dragged along went
unnoticed.

## Element / selector carrying the issue
- FAIL: `#p3` — `role="heading"`, `aria-level="2"`, accessible name `"———"` (em dash em dash
  em dash), visible, not ignored. It is the labelling element for the geographic-breakdown
  panel.

## Exact accessibility mechanism
Verified in Chromium's accessibility tree: `#p3` computes to `role="heading"`, `name="———"`,
`ignored=false`. A screen reader announces this from its heading list as "em dash em dash em
dash, heading level 2" (NVDA/JAWS read the punctuation; some voices say "dash dash dash"). A
keyboard-and-screen-reader user jumping panel to panel hears:

> "Top-line KPIs, heading level 2 · Channels by signups, heading level 2 · **em dash em dash
> em dash, heading level 2**."

The third heading names nothing — the user cannot tell it introduces the country breakdown.
The element satisfies the *structural* presence requirement (a heading exists for the section)
yet defeats the *naming* purpose: a run of punctuation is not a section name. This is the
present-and-exposed-but-nameless mode realised through an ARIA `role="heading"` rather than a
native `<h2>`.

## Expected ACT-style outcome
**failed** — a section heading is present and exposed but its name is decorative punctuation,
conveying no section name.

## Why automated tools miss it
The element has a valid `role="heading"` and a valid `aria-level`, is visible, and has a
non-empty text node ("———"), so axe-core's `empty-heading` does not fire (there *is* text),
and WAVE/Lighthouse see a structurally valid ARIA heading with content. No checker has a
lexicon to decide that a string of em-dashes is punctuation rather than a section title —
distinguishing "this text names the section" from "this text is a decorative glyph run"
requires human semantic judgment of the rendered string.

## Citation
> **WCAG 2.2 Understanding — Intent of Section Headings**
> "When such sections exist, they need to have headings that introduce them. This clearly
> indicates the organization of the content, facilitates navigation within the content, and
> provides mental 'handles' that aid in comprehension of the content."

> **WCAG 2.2 Understanding — Benefits of Section Headings**
> "People who navigate content by keyboard will be able to jump the focus from heading to
> heading, enabling them to find quickly content of interest."

> **WCAG Techniques — G141: Organizing a page using headings**
> "The objective of this technique is to ensure that sections have headings that identify
> them."
