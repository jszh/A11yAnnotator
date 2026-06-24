# case-05 — RTL Arabic municipal portal: four color-banded service sections, titles as styled `<p>`

## Scenario
An Arabic (RTL) municipal e-services portal (بلدية الواحة) whose service catalogue is laid out as
four alternating color bands, each a distinct service group:
الهوية والسجل المدني (Identity & civil registry), المرور والمركبات (Traffic & vehicles),
العقارات والبناء (Property & building), المياه والكهرباء (Water & electricity). Each band is
plainly a separate section to a sighted user — a tinted rounded panel with a 21px/800 bold Arabic
title and a grid of service links. But every band title is `<p class="band-title">`, not a heading
or `role="heading"`. The portal banner carries the single real `<h1>`. `lang="ar"` and `dir="rtl"`
are CORRECT, isolating the failure to section-headings alone.

## Attribute tuple
- **Content domain:** government / civic services portal
- **UI component / pattern:** color-banded service groups with a link grid
- **Host-language construct:** styled `<p>` as a heading; `<section aria-label>` region per band
- **Locale / i18n:** Arabic, RTL (`lang="ar" dir="rtl"`) — both correct
- **Failure mechanism:** visual-only section boundary (band background tint + bold title) with no
  programmatic heading per service group
- **i18n context (facets.json):** RTL language — used here to show the judgment is
  language-independent, NOT to introduce a dir/lang defect

## Developer persona
A government contractor themed an existing portal template for a new municipality. The template's
service-group block rendered the group name as a bold `<p>` (the original designer wanted custom
typography). Each block was wrapped in `<section aria-label>` to pass a "landmark" checklist item.
The localization team translated all strings and set `lang="ar" dir="rtl"` correctly — but nobody
re-evaluated whether the group titles were programmatic headings, since the page "passed" the
automated audit.

## Element / selector carrying the issue
`p.band-title` (×4: الهوية والسجل المدني, المرور والمركبات, العقارات والبناء, المياه والكهرباء).
Verified in Chromium: exactly **one** programmatic heading exists — `h1`
"الخدمات الإلكترونية لبلدية الواحة". None of the four service-group titles is a heading.

## Exact accessibility mechanism
A blind Arabic-speaking user navigating by heading hears only the portal banner and cannot move
from one service group to the next; the four sections that the colored bands make obvious to a
sighted user do not exist in the heading model. The `<section aria-label>` wrappers create named
regions, but regions are a different affordance from headings, and 2.4.10 specifically requires a
*heading* per section. Because the band backgrounds and bold type are presentational only, the
visual section structure is not conveyed programmatically — in any script.

## Expected ACT-style outcome
**failed** — the portal is organized into four service sections and none has a heading. The
correct RTL/lang setup confirms the defect is purely the missing section headings.

## Why automated tools miss it
`lang`/`dir` are correct, links are labelled, contrast passes, and the page has one `<h1>`, so
axe/WAVE/Lighthouse report no violation and 047fe0 passes. No tool can read the Arabic band titles,
perceive the four colored service sections, and decide each needs a heading — that requires reading
the content's meaning and seeing the visual grouping. Doing this in a non-Latin script underscores
that the perception-and-judgment step, not any string pattern, is what catches the failure.

## Citation
> "The intent of this success criterion is to provide headings for sections of a web page, when the
> page is organized into sections. … When such sections exist, they need to have headings that
> introduce them."
— WCAG 2.2 Understanding, *Section Headings*, Intent (`wcag-understanding/section-headings.html`)
