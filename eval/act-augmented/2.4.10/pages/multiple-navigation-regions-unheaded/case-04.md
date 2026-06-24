# case-04 — Gov portal: three navs each with a distinct aria-label but NO heading (sharp boundary)

## Scenario
A government services portal ("Clearwater County Services", *Renew a vehicle registration*
page) has **three** distinct navigation regions, and — unlike a naive failing page — each
one is a `<nav>` with a **correct, distinct `aria-label`**:
1. `aria-label="Main"` — the primary services menu (Vehicles / Property & taxes / Permits /
   Courts / Health),
2. `aria-label="In this section"` — sibling pages within "Vehicles" (Renew a registration
   (current) / Transfer a title / Order specialty plates / …),
3. `aria-label="Footer"` — agency/legal links (Privacy / Accessibility / FOIA / …).

So **landmark navigation works perfectly**: a screen-reader user listing landmarks hears
"Main navigation", "In this section navigation", "Footer navigation." But **none of the three
regions has a heading** — the only heading is the content `<h1>` "Renew a vehicle
registration." This is the sharp boundary case: it specifically defeats the rebuttal "but
the navs are labelled, so they're fine." `aria-label` names a *landmark*; it is not a heading
and does not appear in the headings list, so heading-navigation users still cannot reach or
distinguish the three navigation sections by heading — which is exactly what H69's
nav-demarcation sub-limb and SC 2.4.10's section-heading requirement call for.

## Attribute tuple
- **content-domain:** government / civic services portal (USWDS-style)
- **UI-component / pattern:** three-tier gov navigation (primary services bar + "in this section" sidebar + footer agency links)
- **host-language construct:** three `<nav aria-label="…">` landmarks (Main / In this section / Footer); single content `<h1>`
- **locale / i18n:** en-US
- **failure-mechanism:** H69 nav-demarcation under an ARIA-anti-pattern twist — landmark *labels* are present and distinct, but they are NOT headings; the page conflates "labelled landmark" with "section heading," so heading navigation still fails

## Developer persona
A county web team adopted a federal design-system (USWDS-style) starter. The design system's
accessibility guidance told them to give every `<nav>` a unique `aria-label` so landmarks are
distinguishable — which they did diligently ("Main", "In this section", "Footer"). They (and
their automated scanner) treated the now-passing `landmark-unique` check as proof the
navigation was accessible, and concluded headings on navigation regions were unnecessary
"because the landmarks are already labelled." The intent of H69 — that *heading* markup
demarcate the navigation sections so heading-navigation users can find them — was missed.

## Element / selector carrying the issue
- `nav.primary[aria-label="Main"]` (region 1) — labelled landmark, **no heading**.
- `nav.section[aria-label="In this section"]` (region 2) — labelled landmark, **no heading**.
- `nav.footer[aria-label="Footer"]` (region 3) — labelled landmark, **no heading**.

The document's only heading is `main h1` "Renew a vehicle registration."

## Exact accessibility mechanism (what AT experiences, why it fails)
- A screen-reader user navigating by **landmark** succeeds: three uniquely-named navigation
  landmarks are announced and distinguishable. (This is why the page is so easy to wave
  through.)
- A screen-reader user navigating by **heading** — the headings list / `H` key, the primary
  way many users orient on a page — finds **one** heading: "Renew a vehicle registration."
  The three navigation regions do not appear in the headings list at all. The user cannot
  jump to "footer navigation" or "the services menu" by heading, and the headings list gives
  no indication the page contains multiple navigation sections.
- `aria-label` provides an accessible *name for a landmark*; it is not a heading and is not
  surfaced in heading navigation. So the labels satisfy "distinguishable landmarks" but not
  H69's requirement that heading markup demarcate the navigation sections.
- Per H69's Procedure, "each section on the page starts with a heading" must be true for SC
  2.4.10; for all three navigation sections it is false.

The defect is genuinely in the DOM: three labelled-but-heading-less `<nav>`s.

## Expected ACT-style outcome
**failed** (SC 2.4.10 — H69 nav-demarcation sub-limb: multiple distinct navigation sections;
landmark labels do NOT substitute for the demarcating *section headings* the technique
requires, so heading navigation cannot distinguish the sections).

## Why automated tools miss it
This page is the worst case for tooling: giving each `<nav>` a unique `aria-label` makes
axe-core's `landmark-unique` and `region`/`landmark` rules pass *more* cleanly, and the
single `<h1>`, absence of empty headings, and valid markup mean WAVE and Lighthouse also pass
(ACT 047fe0 passes on the `<h1>`). An automated tool literally cannot distinguish "the
navigation is properly demarcated by section headings" from "the navigation landmarks merely
have aria-labels" — it has no way to know that H69 wants *heading* markup specifically, or
that heading-navigation users are unserved by landmark labels. Judging that labelled
landmarks are not the section headings 2.4.10 requires, for these particular regions, is a
reading of the technique's intent that only a human can perform.

## Citation
> "to demarcate different navigational sections like top or main navigation, left or secondary navigation and footer navigation;"
— wcag-techniques/html/H69.html (Description — objective bullet list)

> "Check that the content is divided into separate sections. … Check that each section on the page starts with a heading."
— wcag-techniques/html/H69.html (Tests — Procedure)

> "People who navigate content by keyboard will be able to jump the focus from heading to heading, enabling them to find quickly content of interest."
— wcag-understanding/section-headings.html (Benefits of Section Headings)
