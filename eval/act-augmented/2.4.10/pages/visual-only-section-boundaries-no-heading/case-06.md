# case-06 — Pricing page (boundary PASS): same banded/boxed idiom, but every section HAS a programmatic heading

## Scenario
A hosting pricing page (Northwind Hosting) that uses the **same visual idiom** as the failing
cases — three boxed plan sections (**Starter / Pro / Enterprise**) plus a "What's included"
comparison section, with decorative `<hr>` separators and a featured colored band on the Pro
card. The difference: here **every** visually-implied section carries a programmatic heading. The
plan-card titles are exposed via `role="heading" aria-level="2"`, and the comparison section uses a
native `<h2>`. The single `<h1>` names the page. This is the controlled contrast that sharpens the
aspect: identical "looks like headed sections" appearance, but the structure is real.

## Attribute tuple
- **Content domain:** developer / web-hosting marketing
- **UI component / pattern:** boxed plan cards + comparison table, decorative `<hr>`
- **Host-language construct:** `role="heading" aria-level="2"` on custom-styled titles + native
  `<h2>`; `<hr aria-hidden>` and tinted band as *complementary* decoration
- **Locale / i18n:** en
- **Failure mechanism:** NONE — included as the passed boundary variant
- **Spec limb exercised:** "Other page elements may complement headings … (e.g., horizontal rules
  and boxes)" used *correctly* (mirrors ACT 33fcbd where `<hr>` + a real heading passes)

## Developer persona
A developer who had been bitten by exactly the case-01 pattern. They wanted the custom card-title
typography but knew a styled `<div>` would be invisible to heading navigation, so they kept the
custom element and added `role="heading" aria-level="2"` to expose it programmatically; the
comparison section uses a plain `<h2>`. The `<hr>` and the Pro highlight band are purely decorative
complements, which the Understanding explicitly permits.

## Element / selector carrying the issue
No issue. The section headings are: `div#h-starter[role=heading][aria-level=2]` "Starter",
`div#h-pro[role=heading][aria-level=2]` "Pro", `div#h-ent[role=heading][aria-level=2]`
"Enterprise", and `h2#h-compare` "What's included", under `h1` "Compare hosting plans". Verified in
Chromium: **five** programmatic headings exposed (h1 + four level-2), one per visual section.

## Exact accessibility mechanism
A screen-reader user navigating by heading gets the page `<h1>` and then a level-2 heading for each
plan and for the comparison table — exactly mirroring the four sections a sighted user sees. The
decorative `<hr>` (`aria-hidden`) and the Pro highlight band add nothing programmatic, which is fine
*because* the headings already convey the structure. Every visually-implied section maps to a real
heading, so the AT experience matches the visual experience.

## Expected ACT-style outcome
**passed** — the page is organized into sections and each section has a programmatic heading;
visual decoration (rules/boxes/bands) merely complements the headings, as the SC allows.

## Why automated tools miss the distinction
Tools cannot AUTOMATICALLY certify a 2.4.10 *pass* either: they cannot enumerate the page's
visually-implied sections, so they cannot confirm that *every* one has a heading. A naive heuristic
that only pattern-matched on bands or bold lead text would wrongly fail this page; a heuristic that
only counted heading elements could be fooled the other way. A human must confirm the
section-to-heading mapping. Here the confirmation succeeds — which is precisely why this page is
included to delineate the boundary.

## Citation
> "Other page elements may complement headings to improve presentation (e.g., horizontal rules and
> boxes), but visual presentation is not sufficient to identify document sections."
— WCAG 2.2 Understanding, *Section Headings*, Intent (`wcag-understanding/section-headings.html`)
