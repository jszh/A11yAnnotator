# case-04 — Choropleth delivery-zone map, four adjoining pastels (~1.05–1.2:1), no boundary lines → FAIL

## Scenario
A neighbourhood bakery ("Marisol's") shows a "Same-day delivery zones" map as inline SVG. The
map is split into four adjoining regions (Zones A–D), each filled with a slightly different
pastel. Adjoining fills differ by only ~1.05–1.1:1 and each is ~1.2:1 against the white card,
and there are **no boundary lines** between regions (`stroke="none"`). The zones carry text
names and the key lists each zone's cut-off time — but to answer the actual question ("which
zone do I live in?") a viewer must perceive where one region ends and the next begins. Those
region boundaries are the graphical objects required for understanding; below 3:1 with no
separating border, a low-vision user sees one undifferentiated peach blob. The map **fails**
1.4.11 (G209 map-boundary example).

## Attribute tuple
- **content-domain:** e-commerce / local delivery (restaurant & ordering)
- **UI-component/pattern:** inline-SVG choropleth map with region labels + a colour key
- **host-language construct:** four adjoining `<path fill="…" stroke="none">` regions; HTML key
  with colour chips + cut-off times
- **locale/i18n:** en-GB
- **failure-mechanism:** G209 violated — adjoining region colours below 3:1 with no 3:1 boundary
  line; the boundaries are required for understanding and labels/key do not establish them.

## Developer persona
The bakery owner built the page in a website builder and used a "soft" colour ramp from the
builder's palette generator to fill the zones because the brand is warm and pastel. The builder
draws choropleth regions edge-to-edge with no stroke by default. She added zone names and a key
of cut-off times, assuming that made the map readable — not realising the four peach tints are
~1.1:1 apart and there's no visible line where one zone meets the next.

## Element / selector carrying the issue
The four region `<path>` elements (`svg.map path[fill]`), adjoining at ~1.05–1.1:1 with
`stroke="none"`. The text names `svg.map text.rlabel` and the colour key `.key .k` are the decoy
"alternatives": they name zones and list cut-offs but do not establish the *boundaries* a user
needs to locate their own address.

## Exact accessibility mechanism (what AT experiences, why it fails)
A user with moderately low vision perceives the map as a single peach shape — the ~1.1:1 seams
between Zone A/B/C/D are invisible, so they cannot determine which zone contains their street,
which is the entire point of the map. The labels float inside indistinct areas and the key's
cut-off times are useless without first knowing one's zone. A screen-reader user gets only "Map
of central Eastbrook divided into four same-day delivery zones" with no spatial information at
all. Per G209's map example, adjoining region colours below 3:1 must carry a boundary line of at
least 3:1; here they do not → **fail**.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The map SVG is labelled and the regions carry text names, so axe-core, WAVE and Lighthouse pass
it. None compute adjoining-region fill contrast, and none can reason that the region
**boundaries** (not the names, not the key) are what a user must perceive to answer "which zone
am I in?" The key lists cut-off times by zone *name*, which a naive "the data is in text"
heuristic might count as an exemption — but it is not equivalent, because you still must read
the sub-3:1, border-less boundaries to find your zone. Recognising this as a G209 map-boundary
failure that the labels do not exempt is a meaning-level judgment automation cannot make.

## Citation
> **WCAG Techniques, G209 — Map with border boundaries example:**
> "The color contrast of areas within the map range between 1.3 and 1.8. A boundary line is
> added with a color contrast ratio of at least 3:1 with the area colors."

(Verbatim from `wcag-techniques/general/G209.html`. That example *adds* a 3:1 boundary line to
fix exactly this situation; this page omits the boundary line, leaving ~1.1:1 adjoining regions
— the failing condition the technique remedies.)

> **WCAG 2.2 Understanding, Non-text Contrast — Graphical Objects:**
> "Images made up of multiple lines, colors and shapes will be made of multiple graphical
> objects, some of which are required for understanding."

(Verbatim from `wcag-understanding/non-text-contrast.html`. The map's region boundaries are the
graphical objects required for understanding which zone is which; they must reach 3:1 and do not.)
