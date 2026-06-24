# case-01 — Pricing page whose every heading is a styled `<p class="section-title">`

## Scenario
A SaaS/agency pricing page ("Northwind Studio — Plans & Pricing"). The page title, the three
section labels ("Choose a plan", "What's included in every plan", "Frequently asked"), and the
two tier names ("Solo", "Team") are all visually unmistakable headings — large, bold, with a
ruled underline separating them from the prose beneath. But the entire document contains **no
`<h1>`–`<h6>` and no `role="heading"`**. Every heading-looking line is a `<p>` carrying a
`.page-title` / `.section-title` / `.tier-name` class. A screen-reader user pressing H or pulling
up the rotor gets "No headings" and must read the whole page linearly to discover its structure.

## Attribute tuple
- **Content domain:** SaaS / agency marketing — pricing page
- **UI component / pattern:** pricing tiers + FAQ disclosure list (website-builder section block)
- **Host-language construct:** `<p>` with presentational CSS class (`font-size`/`font-weight`/`border-bottom`)
- **Locale / i18n:** en
- **Failure mechanism:** F2 — visual heading conveyed by CSS only; zero heading semantics on the page

## Developer persona
A visual designer built the page in a drag-and-drop website builder (Squarespace/Webflow style).
They dropped "Text" blocks and bumped the font size + weight with the inline style controls to get
the look they wanted, never reaching for the builder's "Heading 1/2/3" element type. The builder
happily emits `<p>` for a styled text block, so the rendered page looks perfectly structured while
the DOM has no heading at all.

## Element / selector carrying the issue
`p.page-title`, `p.section-title` (×3), and `p.tier-name` (×2). Each is a `<p>` that functions as
a heading. The strongest single selector is `p.section-title`, the three mid-level section titles.

## Exact accessibility mechanism
The accessibility tree exposes these lines as ordinary static text (role `paragraph` / generic),
not as headings. A screen reader builds **no document outline**: "Find next heading" (H in NVDA/JAWS,
VO-Cmd-H in VoiceOver) reports nothing, the headings list/rotor is empty, and the user loses the
fast structural navigation that sighted users get for free from the visual weight. The relationship
"this large bold line is the title of the block that follows" exists only in CSS and is never
programmatically determinable — the canonical F2 failure and the inverse of TT 10.B's requirement
that "each visual heading is programmatically determinable."

## Expected ACT-style outcome
**failed** (SC 1.3.1, F2; Trusted Tester 10.B). Visual headings are present and apparent, yet none
is programmatically a heading.

## Why automated tools miss it
There is no missing/empty attribute and no malformed markup. axe-core's `page-has-heading-one` does
not hard-fail a page that simply has zero headings; `heading-order` only evaluates heading elements
that already exist (there are none here); WAVE raises "No heading structure" as an **alert**, not an
error, and cannot assert that a particular `<p>` ought to have been a heading; Lighthouse's heading
audit likewise only checks ordering of existing headings. Concluding that "Choose a plan" and
"Frequently asked" are section headings requires reading the rendered visual prominence and judging
that each titles the block beneath it — a visual + semantic determination outside the reach of static
DOM analysis.

## Citation
**Reference:** WCAG Technique F2 — *Failure ... due to using changes in text presentation to convey information without using the appropriate markup or text* (`wcag-techniques/failures/F2.html`)
> "The author intended to make a heading but didn't want the look of the default HTML heading. So they used CSS to style the P element to look like a heading and they called it a heading. But they failed to use the proper HTML heading element. Therefore, the Assistive Technology could not distinguish it as a heading."

**Reference:** Trusted Tester v5.1.3 — Test 10.B `1.3.1-heading-determinable` (`refs/trusted-tester/sc-1.3.1-info-and-relationships.md`)
> "Each programmatically determinable heading is a visual heading and each visual heading is programmatically determinable."
