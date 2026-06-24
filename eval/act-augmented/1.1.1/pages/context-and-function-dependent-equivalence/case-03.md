# case-03 — Image-map floor plan whose area alts describe room shapes, not destinations

## Scenario
A hospital outpatient-wing wayfinding page (St. Aldwyn's) shows an interactive floor plan as
an `<img usemap>` with one clickable `<area>` per room. Activating an area navigates to that
room's directions/check-in page. The defect: each `<area>`'s `alt` describes the **appearance**
of its region on the plan — "Large blue rectangle in the top-left corner", "Small green square
beside the corridor", "Grey block on the right", "Yellow block, lower right" — rather than the
**destination** it opens ("Radiology, Room 101"). Every area has a non-empty alt and the parent
image has a descriptive alt, so name checks pass. One area (the Pathology Lab) is correctly
labelled with its destination for contrast.

## Attribute tuple
- **Content domain:** healthcare / wayfinding
- **UI component / pattern:** client-side image map (`<map>` / `<area>`) as a navigation widget
- **Host-language construct:** `<img usemap>` + `<map>` with multiple `<area href alt>`
- **Locale / i18n:** en
- **Failure mechanism:** area alt describes the depicted shape/colour instead of the link destination it serves

## Developer persona
A CMS author building the wayfinding page used a visual image-map editor that lets you draw
hotspots over an uploaded plan. The editor auto-suggests an alt from what it "sees" in the
region (it had a colour/shape heuristic), and the author accepted the suggestions to clear the
"every area needs alt text" warning. The suggestions are accurate descriptions of the picture,
so the page looked done — but each hotspot now announces its colour instead of its room.

## Element / selector carrying the issue
`map[name="wingmap"] > area[alt^="Large blue"]`, `area[alt^="Small green"]`,
`area[alt="Grey block on the right"]`, `area[alt="Yellow block, lower right"]` — four
navigation hotspots whose accessible names describe pixels, not destinations. The `<area
href>` values (`/wing/room-101-radiology`, etc.) reveal the true purpose the alt should carry.

## Exact accessibility mechanism
Each `<area>`'s `alt` is its accessible name and serves as the link text for that hotspot. A
screen-reader user navigating the image map hears "Large blue rectangle in the top-left corner,
link" and has no idea it leads to Radiology; a keyboard user tabbing the areas gets the same
shape descriptions in order. The plan's coloured blocks genuinely look as described, so the alt
is *correct about the depiction* and *wrong for the selectable region's purpose* — precisely
what H24 prohibits. The Lab area shows the fix: its alt names the room and its function.

## Expected ACT-style outcome
**failed** (SC 1.1.1, image-map area limb / H24). The text alternative for each selectable
region does not serve the same purpose as that region (navigating to a specific room). The
parent `<img>` alt is fine; the failure is in the `<area>` alternatives. Presence-only checks
("every area has alt") pass.

## Why automated tools miss it
The only `<area>` rule a linter enforces is that an alt is present and non-empty; "Large blue
rectangle in the top-left corner" satisfies it. axe-core/WAVE/Lighthouse do not resolve each
area's `href` to a room page, nor do they judge that a shape/colour description is the wrong
alternative for a navigation target. Knowing the blue rectangle *is* Radiology and that the alt
should say so requires understanding the map's interactive purpose — human judgment.

## Citation
**Reference:** WCAG Technique H24 (`wcag-techniques/html/H24.html`)
> "Check that the text alternative specified by the alt attribute serves the same purpose as the part of image map image referenced by the area element of the image map."

**Reference:** WCAG 2.2 Understanding Non-text Content (`wcag-understanding/non-text-content.html`)
> "An image of a building floor plan is interactive, allowing the user to select a particular room and navigate to a page containing information about that room. The short text alternative describes the image and its interactive purpose: \"Building floor plan. Select a room for more information.\""
