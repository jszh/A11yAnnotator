# case-04 — Menu spice level as script-injected chili-pepper background glyphs

## Scenario
A Punjabi street-food restaurant menu. Each dish's **spice level** (1, 2 or 3 chillis) is
shown only by chili-pepper glyphs that JavaScript paints as a repeating `background-image`
onto an empty `<span class="heat">` at page load. The intensity lives in a `data-heat="1|2|3"`
attribute that the script converts to a *picture* (one tile repeated N times). The visible
menu text gives dish name, description and price — never the words mild/medium/hot and never
any chili character. This is the F3 example-3 carrier (background set dynamically by client
script), applied to safety-relevant food information.

## Attribute tuple
- **content-domain:** food service / restaurant menu
- **UI-component / pattern:** menu list with a spice-rating indicator
- **host-language construct:** `el.style.backgroundImage = url(svg)` set in a client `<script>` from `data-heat`
- **locale / i18n:** en-GB, South-Asian cuisine context
- **failure-mechanism:** F3 (script-injected carrier) — spice level conveyed exclusively by a dynamically-set background image

## Developer persona
A junior dev added a "nice touch" before launch: a small script that reads each dish's
`data-heat` number and renders that many chili icons. It demoed well to the owner, who could
see the chillis immediately. The numeric attribute felt "semantic enough", so nobody added a
visible "Hot"/"Medium" label or an `aria-label`. The icon was hand-coded inline to avoid an
external asset.

## Element / selector carrying the issue
- `span.heat[data-heat]` — empty spans whose script-set `background-image` (repeated chili
  tile, width = N×16px) is the only carrier of the spice level.
- Dish text (e.g. "Chicken Phaal", "Our signature inferno") never states the heat level.

## Exact accessibility mechanism (what AT experiences)
A screen-reader user hears "Chicken Phaal, Our signature inferno — order with respect, £12.50"
and "Daal Makhani, Black lentils simmered overnight…, £8.25" with no way to tell that the
first is the hottest dish on the menu (3 chillis) and the second is mild (1 chili). The chili
count is a `background-image` on an empty span and never enters the accessibility tree; the
`data-heat` number is not exposed as content. A diner with a chili sensitivity gets no warning.
Disabling JS, hiding backgrounds, or forced-colors mode removes the indicator entirely.

## Expected ACT-style outcome
**failed** — F3 (script-injected carrier): spice level is conveyed exclusively by a
dynamically-set CSS background image and is not programmatically determinable. ACT 1.1.1 rules
are **Inapplicable** (the carrier is a `<span>` background, not a nameable image element).

## Why automated tools miss it
The glyphs are script-set background images on empty spans — no `image-alt` target, no
accessibility node. A scanner that reads the static DOM sees only empty spans (and, if it runs
JS, an inline `style` with a `url()` it cannot interpret). It cannot OCR the chili tiles, cannot
infer that the *count* encodes spice intensity, and cannot judge that this safety-relevant fact
is missing from the text. Whether a chili icon is informative or decorative is a human call.

## Citation
**Reference:** WCAG Technique F3 — *Failure of Success Criterion 1.1.1 due to conveying
information exclusively using CSS background images* (`wcag-techniques/failures/F3.html`).

> "In the following code, the background image declaration is created in a client script:"

> "Therefore, it is a failure to use this property to add images to convey this required
> information."

**Supporting reference:** WCAG 2.2 Understanding 1.1.1 — Benefits
(`wcag-understanding/non-text-content.html`).

> "This success criterion helps people who have difficulty perceiving visual content.
> Assistive technology can read text aloud, present it visually, or convert it to braille."
