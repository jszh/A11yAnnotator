# case-04 — Newsletter web-version: five color bands, every band title a bold inline `<span>` (email-table origin)

## Scenario
The "web version" of a club's monthly email (The Trailhead Dispatch), pasted straight from the
email tool into the website CMS. The page is a 640px presentation-table laid out as five full-width
**color bands** — intro (white), trail report (light green), gear pick (tan), member spotlight
(light blue), events (white). Each band is plainly a separate topical section to a sighted reader,
introduced by a small colored eyebrow label and a 22px bold band title. But each band title is a
bold inline-styled `<span class="band-title">`, not a heading or `role="heading"`. The masthead
wordmark is the page's single real `<h1>`.

## Attribute tuple
- **Content domain:** nonprofit / community club newsletter (web version of an email)
- **UI component / pattern:** `role="presentation"` layout table with alternating-background rows
- **Host-language construct:** bold inline-styled `<span>` inside `<td>` as a fake heading
- **Locale / i18n:** en
- **Failure mechanism:** visual-only section boundary (alternating band backgrounds + bold band
  titles) with no programmatic heading per band
- **Content-authoring source (facets.json):** "HTML email newsletter (layout tables, inline
  styles, spacer images)"

## Developer persona
A volunteer built the newsletter in an email-marketing tool. Email clients strip and reflow
`<h1>`–`<h6>`, so email designers conventionally fake headings with bold `<td>`/`<span>` text and
inline styles. The marketing lead then pasted the exported table HTML into the website's CMS as the
"Read in browser" page and wrapped just the masthead in an `<h1>` so the site's accessibility linter
("page needs a top-level heading") went green. The band titles stayed as bold spans.

## Element / selector carrying the issue
`span.band-title` (×5: "Summer ridges are finally open", "Granite Mountain via the south spur",
"A 1.9 oz wind shell that earns its place", "Priya finished the Issaquah Alps traverse",
"July outings & sign-ups"). Verified in Chromium: exactly **one** programmatic heading exists —
`h1` "The Trailhead Dispatch". No band title is a heading.

## Exact accessibility mechanism
A screen-reader user reads the newsletter as a flat run of table cells; heading navigation lands
only on the masthead. The five topics — each a distinct section to a sighted reader, signalled by
the changing band color — cannot be skimmed or skipped to. Background color is purely presentational
and conveys nothing to AT, so the section boundaries that the colored bands create visually do not
exist programmatically. This is the "visual presentation is not sufficient to identify document
sections" failure manifested through layout-table bands rather than `<div>` cards.

## Expected ACT-style outcome
**failed** — the page is organized into five newsletter sections and none has a heading. The
presentation table and inline color are valid HTML; the defect is the absence of section headings.

## Why automated tools miss it
A `role="presentation"` table is explicitly *not* flagged (it is the correct role for layout),
inline color contrast passes, and the page has one `<h1>`, so axe/WAVE/Lighthouse report no
violation and 047fe0 passes. No tool can deduce that each colored band is a content section that
needs a heading — it sees bold table cells, which are not an error. Perceiving "five headed-looking
bands, none of which is a heading" requires reading the content and seeing the alternating
backgrounds: human visual + semantic judgment.

## Citation
> "Other page elements may complement headings to improve presentation (e.g., horizontal rules
> and boxes), but visual presentation is not sufficient to identify document sections."
— WCAG 2.2 Understanding, *Section Headings*, Intent (`wcag-understanding/section-headings.html`)
