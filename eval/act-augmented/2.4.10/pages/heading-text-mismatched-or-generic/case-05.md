# case-05 — Real-estate listing where each section heading is bound to the wrong data field

## Scenario
A property-listing template renders a single listing as four content sections. Each section
opens with a non-empty `<h2>`, but a **data-binding bug** has wired the section headings to the
wrong listing fields, so every heading carries a real string from a *different* field than the
section it introduces:

- The **property description** prose is headed **"MLS #CP-2261148"** (the listing-reference field).
- The **spec sheet** (beds/baths/lot/year) is headed **"2,940 sq ft"** (the floor-area field).
- The **listing-agent bio** is headed **"$849,000"** (the price field).
- The **neighborhood** section is headed **"6 days on market"** (the days-on-market field).

The correctly-labelled facts (price, MLS, sq ft) appear in the sidebar summary card, which makes
the crossed section headings even easier for a sighted skimmer to overlook.

## Attribute tuple
- **content-domain**: real-estate listings (single-property detail page)
- **UI-component/pattern**: templated detail page with a main content column of `<section>`s plus a sticky sidebar summary/CTA card
- **host-language construct**: `<section aria-labelledby>` headings; `<dl>` spec list; sidebar `<aside>`
- **locale/i18n**: en-US
- **failure-mechanism**: data-binding bug — section `<h2>`s bound to the wrong template fields, so each heading is a real string naming the wrong section (a *novel*, beyond-seed mechanism vs. placeholder / copy / generic / swap)

## Developer persona
A developer themed a listings CMS and, in the section template, mapped the `<h2>` of each block
to a field token. A copy/refactor shifted the tokens by one (the description block's heading got
`{{mls}}`, the specs block got `{{sqft}}`, the agent block got `{{price}}`, the neighborhood
block got `{{dom}}`). Because every token still resolves to a real, non-empty value, QA — which
glanced at the rendered page and saw plausible bold text atop each section — never noticed the
headings name the wrong thing. The bug reproduces on every listing the template renders.

## Element / selector carrying the issue
- FAIL: `h2#s-desc` (text "MLS #CP-2261148") over the property-description prose.
- FAIL: `h2#s-specs` (text "2,940 sq ft") over the beds/baths/lot/year spec list.
- FAIL: `h2#s-agent` (text "$849,000") over the listing-agent bio.
- FAIL: `h2#s-hood` (text "6 days on market") over the neighborhood section.

## Exact accessibility mechanism
A blind buyer skimming the heading list to find, say, the agent's contact number hears:

> "MLS #CP-2261148 · 2,940 sq ft · $849,000 · 6 days on market"

— a list of bare data values, not section names. Nothing in that outline says "Property
description", "Specifications", "Listing agent" or "Neighborhood", so the user cannot navigate to
the agent bio by heading; the heading "$849,000" gives no hint that a phone number and agent
biography sit beneath it. Each heading is non-empty and is a real datum, but it introduces the
wrong section, so the programmatic section name (`aria-labelledby`) is actively misleading. The
failure is systematic (every section) and reproduces across all listings.

## Expected ACT-style outcome
**failed** — every section has a heading element, but each heading's text is bound to the wrong
field and does not name or introduce the section it sits above.

## Why automated tools miss it
All four `<h2>` are non-empty and correctly ordered, and the `aria-labelledby` references
resolve, so axe-core, WAVE and Lighthouse pass every heading rule. The heading strings are real
values ("$849,000", "2,940 sq ft"), so nothing reads as empty, placeholder, or malformed. No
tool models which field a section's heading *should* carry, so none can detect that the price is
sitting where the agent's name belongs. Recognising the crossed binding requires reading each
body and judging that the heading describes a different thing — semantic human judgment.

## Citation
> **WCAG 2.2 Understanding — Intent of Section Headings**
> "When such sections exist, they need to have headings that introduce them. This clearly
> indicates the organization of the content, facilitates navigation within the content, and
> provides mental \"handles\" that aid in comprehension of the content."

> **WCAG 2.2 Understanding — Benefits of Section Headings**
> "People who are blind will know when they have moved from one section of a web page to
> another and will know the purpose of each section."

> **WCAG Techniques — G141: Organizing a page using headings**
> "The objective of this technique is to ensure that sections have headings that identify
> them."
