# case-02 — Embedded location map titled `title="content"`

## Scenario
A dental practice's "Visit our practice" page embeds an interactive street map next to
the address and hours. The frame renders a map with a location pin, named roads
("Irving St"), a labelled landmark ("Sunset Rec Center"), an attribution strip, and
zoom +/− controls. Its `title` attribute is the page-builder placeholder `"content"`.

## Attribute tuple
- **content-domain:** local business / healthcare practice site
- **UI-component/pattern:** embedded interactive map (application widget)
- **host-language construct:** `<iframe srcdoc title="content">` inside a builder "Embed" block
- **locale/i18n:** en-US
- **failure-mechanism:** CMS/page-builder placeholder title never renamed

## Developer persona
An office manager built the site in a drag-and-drop page builder. To add the map she
dropped in an "Embed" block and pasted the map code. The block's title field defaulted to
`"content"` and she never noticed the field, let alone renamed it — the map looked right
in the preview, so the page went live.

## Element / selector carrying the issue
`.grid .card iframe[title="content"]` (the single map iframe). Accessible name computed
by Chrome: `"content"` (verified via CDP).

## Exact accessibility mechanism
The iframe is in the tab order and exposed with role `Iframe`, accessible name
`"content"`. A screen-reader user moving through frames hears "content", which is
indistinguishable from any other generic embed and gives no hint that the frame is an
interactive location map (with which they may want to interact, or skip). The name is
programmatically determined and non-empty but does not describe the frame's content, so
the embedded-frame "Name" limb of 4.1.2 fails under TT 12.D.

## Expected ACT-style outcome
**failed** (TT 12.D). cae760 *passes*; 4b1c6c *inapplicable* (single iframe).

## Why automated tools miss it
The accessible name `"content"` is non-empty, so cae760 passes and axe/WAVE/Lighthouse
report no error. With one iframe, 4b1c6c never fires. No scanner renders the embedded
document, perceives it as an interactive map (the map is built from CSS-positioned divs,
not even an `<img>` with alt to inspect), and decides "content" is an inadequate name.
Recognising the gap requires a human to open the frame and compare its content to the
name — the manual judgement TT 12.D specifies.

## Citation
> **Reference:** ACT Rule cae760 — *Iframe element has non-empty accessible name*
> (`act-rules/extracted/cae760.md`)
>
> **Quote (verbatim):** "This rule checks that each iframe element has a non-empty
> accessible name."
>
> **Quote (verbatim, Expectation):** "Each target element has an accessible name that is
> not empty ( "" )."
>
> *(The rule's expectation is satisfied here — the name is "content" — which is exactly
> why the rule passes while the frame still fails the descriptiveness condition of TT
> 12.D: "the accessible name and description accurately describe the content of each
> `<iframe>`.")*
