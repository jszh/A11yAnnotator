# case-04 — Transit network map (raster img): description names the lines but omits which stations interchange

## Scenario
A city metro site shows its four-line network map as a raster `<img>` (an SVG embedded via a
`data:` URI, so it is a true bitmap-style image with an `alt`, not inline vector markup). The map
marks four *interchange* stations with distinctive double-ring markers — Central (Red+Green),
Kingsway (Red+Blue), Riverbank (Green+Yellow), Eastfield (Blue+Yellow) — which are the key to
journey planning. The `aria-describedby` "Network description" panel names each line and its two
termini but never states a single interchange.

## Attribute tuple
- **content-domain:** municipal transit / public-transport schedule
- **UI-component / pattern:** raster `<img>` (data-URI) with adjacent prose long description
- **host-language construct:** `<img alt>` + `aria-describedby` → a `<div>` description panel
- **locale / i18n:** en
- **failure-mechanism:** long description gives lines + endpoints but omits the interchange relationships the map encodes (F67)

## Developer persona
A CMS author uploaded the official PNG-style map and pasted the transit authority's boilerplate
"network overview" blurb into a description box, then linked it with `aria-describedby`. The blurb
was written for marketing ("we run four lines connecting the city"), not for wayfinding, so it
omits interchanges. The author saw a green a11y badge and moved on.

## Element / selector carrying the issue
`img#metroMap[alt]` paired with `#metroDesc` (the `aria-describedby` target). The alt correctly
identifies the image; the long description omits the interchange data.

## Exact accessibility mechanism
A screen-reader user hears "Riverport Metro network map," then the four lines and their
endpoints. The sighted user additionally reads the double-ring markers and knows you change from
Red to Green at Central, from Red to Blue at Kingsway, etc. — which is what makes the map a
*planning* tool. The non-sighted user can name the lines but cannot plan any multi-line journey
(the common case), because the single most load-bearing fact — where lines connect — is missing
from the text. Same-purpose equivalence fails.

## Expected ACT-style outcome
**failed** — F67 (long description does not present the same information; the interchanges are
omitted). The `alt` is meaningful and qt1vmo passes (it correctly identifies the map).

## Why automated tools miss it
The `<img>` has a non-empty, correctly-identifying `alt` and an associated long description;
axe/WAVE/Lighthouse report no error and qt1vmo passes. No tool can rasterize the data-URI map,
recognise the double-ring markers as interchanges, infer which line pairs meet at each, and check
the description for those facts. Distinguishing "names the lines" from "lets you change lines" is
human transit-map reasoning over the picture.

## Citation
> **Reference:** WCAG Techniques — G73 (`wcag-techniques/general/G73.html`)
>
> "check that the long description conveys the same information as the non-text content"
>
> (G73's third test step is exactly the check this page fails: the long description conveys the
> lines but not the interchanges, so it does not convey the same information as the map.)
