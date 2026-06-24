# case-06 — BOUNDARY PASS: recipe whose appended "Tips & Variations" section is headed by a valid `role="heading" aria-level="2"` (not a native `<h2>`)

## Scenario
A recipe is organised into three topical sections: **Ingredients**, **Instructions**, and an
appended **Tips & Variations** section (a genuinely distinct topic — swaps and make-ahead
notes). Ingredients and Instructions use native `<h2>`. The Tips & Variations section is
introduced by `<div role="heading" aria-level="2">` — **a programmatic heading**, just not a
native `<h>` element. Every section, including the last, has a heading that an AT exposes, so
the per-section obligation of 2.4.10 is **met**. This is the deliberate boundary/PASS variant
that sharpens the failing cases: it isolates "does each section have a heading the AT
exposes?" from the naive proxy "does each section start with an `<h>` tag?".

## Attribute tuple
- **content-domain**: recipe / food blog (the H69 "cooking techniques" family, inverted)
- **UI-component/pattern**: ingredients list + numbered steps + appended tips section
- **host-language construct**: native `<h2>` for two sections; `<div role="heading"
  aria-level="2">` for the third — a valid ARIA heading
- **locale/i18n**: en (metric + °C)
- **failure-mechanism**: NONE — this page is correct; the variant exists to test that an
  ARIA heading counts as a section heading (anti-pattern *avoided*: the developer did NOT
  leave the tips block as a bare styled `<p>`)

## Developer persona
The blog's theme renders the "Tips & Variations" block from a reusable component that, for
historical CSS reasons, outputs a styled `<div>` rather than an `<h2>`. The developer, aware
that a bare styled `<div>` would be invisible to screen readers, added `role="heading"
aria-level="2"` so the component is exposed as a real level-2 heading. The visible style is
shared with the native `<h2>`s, so sighted and AT users perceive the same three-section
outline.

## Element / selector carrying the issue (here: the element that makes it PASS)
- PASS: `div[role="heading"][aria-level="2"]#h-tips` (text "Tips & Variations"). It carries
  the heading role with a valid level, so the accessibility tree exposes it as a level-2
  heading that forms a section boundary, exactly like the two native `<h2>`s. All three
  sections are headed.

## Exact accessibility mechanism
A screen-reader user pulling up the heading list hears the full outline:

> "Ingredients, h2 · Instructions, h2 · Tips & Variations, h2."

All three sections appear, each at level 2, in document order — so a blind cook can jump
directly to "Tips & Variations" to find the make-ahead note. The ARIA heading is computed
into the accessibility tree identically to a native `<h2>` (role *heading*, level *2*), so AT
heading navigation (h-key / rotor) lands on it and announces a section boundary. The
visible-vs-programmatic outline match: there is no section that is visually a heading but
programmatically absent. This is the inverse of the failing cases, where the visual title
existed but no role/level did.

## Expected ACT-style outcome
**passed** — the page is organised into sections and *every* section has a heading that
introduces it (two native `<h2>`, one valid ARIA heading). 2.4.10's per-section obligation is
satisfied. (It also passes ACT 047fe0.)

## Why automated tools (and naive `<h>`-counters) get this wrong-direction
A simplistic check that *only counts native `<h1>…<h6>` elements* would see **two** headings
for **three** visually distinct sections and could mis-report the Tips section as un-headed —
a false positive. Conversely, axe-core does NOT flag this (a `role="heading"` with a valid
`aria-level` is an accepted heading; `empty-heading`/`heading-order` are satisfied), which is
correct here. The point of including this PASS page: deciding the page is conformant requires
a human (or a tree-aware tool) to (a) read the prose and confirm three distinct sections
exist, and (b) verify the ARIA heading is genuinely exposed with a valid level — *then*
conclude PASS. The same semantic segmentation that exposes the failures in case-01…case-05
must, applied here, return "passed." Tools cannot perform step (a) at all, which is why this
boundary is human-judgment territory in either direction.

## Citation
> **WCAG 2.2 Understanding 2.4.10 — Intent of Section Headings**
> "When such sections exist, they need to have headings that introduce them. … Other page
> elements may complement headings to improve presentation (e.g., horizontal rules and
> boxes), but visual presentation is not sufficient to identify document sections."

> **WCAG Techniques — G141: Organizing a page using headings (Description)**
> "The objective of this technique is to ensure that sections have headings that identify
> them. … In HTML, this could be done using the HTML heading elements (h1, h2, h3, h4, h5,
> and h6). … Other technologies use other techniques for identifying headers."

> **WCAG Techniques — H69: Providing heading elements at the beginning of each section of content (Tests)**
> "Check that the content is divided into separate sections. Check that each section on the
> page starts with a heading."
