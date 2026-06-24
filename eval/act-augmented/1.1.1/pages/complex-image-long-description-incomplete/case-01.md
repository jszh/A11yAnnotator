# case-01 — Olympic-style venue street map: long description names venues but drops every location

## Scenario
A spectator guide for a fictional Winter Games ("Frostvale 2030") shows a street map of the
five competition venues. The inline-SVG map encodes each venue's geographic position, the
street grid, the river, the rail line, and the relative distances from the central station.
The `figcaption` long description names each venue and the sport held there — but states no
addresses, no streets, no distances, and no spatial relationships. This is the verbatim F67
worked example transposed to a self-contained page.

## Attribute tuple
- **content-domain:** events / ticketing (sports mega-event spectator guide)
- **UI-component / pattern:** `<figure>` + inline `<svg role="img">` street map with `figcaption`
- **host-language construct:** SVG with `aria-labelledby` (title+desc) and a visible prose caption
- **locale / i18n:** en
- **failure-mechanism:** long description present and plausible but omits the locational data the map exists to convey (F67)

## Developer persona
A marketing-agency front-end dev built the spectator microsite. The designer handed over a
static map graphic; the dev "did the accessible thing" by adding an SVG title and writing a
caption that reads back the legend ("which sport is where"). It never occurred to them that the
*positions* — the entire reason a map is a map — also need to be in the text. They tested with
axe, saw green, and shipped.

## Element / selector carrying the issue
`figure > svg[role="img"]` (accessible name via `#mapTitle`/`#mapDesc`) paired with
`figure > figcaption`. The caption is the long description and it is incomplete.

## Exact accessibility mechanism
A screen-reader user reaches the figure, hears the name "Street map of the five Frostvale 2030
venues," then hears the caption: a list of venues and the sport at each. The map's pixels
additionally encode that Glacier Ice Arena is top-left near the rail line, Pine Ridge Bowl is
far east, Riverside Curling Hall is across the river to the south, etc. — plus the streets
(Birch St, Granite Ave, Summit Blvd) and the relative distances. None of this is in the text.
The user can recite the venue/sport pairing but cannot answer "how do I get there / how far is
it / which side of the river is it on?" — exactly the information the sighted user reads off the
map. The text alternative therefore does not present the same information (fails 1.1.1).

## Expected ACT-style outcome
**failed** — F67 (long description does not present the same information as the non-text content).
Presence rules and qt1vmo (gross identity) PASS; the completeness facet fails.

## Why automated tools miss it
axe-core / WAVE / Lighthouse verify that the SVG has a non-empty accessible name and that a
description is associated; all of that is true. They cannot rasterize and interpret the map to
enumerate the spatial information it conveys, and they cannot diff that information against the
prose. qt1vmo passes because the name correctly identifies the image. Detecting the gap requires
a human to view the map, list what it shows (positions, streets, distances), and confirm each is
absent from the caption — a same-purpose comparison no static checker performs.

## Citation
> **Reference:** WCAG Techniques — F67 (`wcag-techniques/failures/F67.html`)
>
> "An image showing the locations of venues for events at the Olympic Games displayed on a
> street map. The image also contains an icon for each type of sporting event held at each
> venue. The long description states, \"Map showing the location of each Olympic venue.
> Skating, hockey and curling are held at the Winter Park Ice Arena, ...\". While this
> description provides useful information, it does not convey the same information as the image
> because it provides no specific location information such as the address or the distance of
> each location from some fixed point."
