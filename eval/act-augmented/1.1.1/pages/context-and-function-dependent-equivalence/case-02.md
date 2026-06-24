# case-02 — Magnifying-glass image submit button named for the icon, not the action

## Scenario
The header of a public-library catalogue (Maplewood Public Library) has a search form whose
submit control is an icon button containing a magnifying-glass image. The image's `alt` is
`"magnifying glass"` — a literally accurate description of the depicted icon. Because the
alt is non-empty, the submit control has a valid accessible name, so automated name checks
pass. But this is a **control**, and SC 1.1.1's control limb requires the name to describe
the control's **purpose** ("Search"), not what the picture looks like. A second submit
button (an arrow icon, `alt="Go"`) is correctly purpose-named for contrast.

## Attribute tuple
- **Content domain:** civic / public library catalogue
- **UI component / pattern:** search form submit button rendered as an icon (image-as-control)
- **Host-language construct:** `<button type="submit">` whose only content is an `<img>` (inline SVG)
- **Locale / i18n:** en
- **Failure mechanism:** alt names the depicted icon ("magnifying glass") rather than the control's action ("Search")

## Developer persona
A back-end developer assembled the search form from the design system's icon catalogue. The
icon asset was literally filed as "magnifying-glass.svg", and they copied that filename into
the `alt` to "be descriptive" — a reflex that satisfies the team's lint rule (no empty alt
on submit images) while turning the submit button's name into a description of its glyph
instead of its job.

## Element / selector carrying the issue
`form.search button[value="quick"] > img[alt="magnifying glass"]` — the button's accessible
name is computed from its child image's alt, so the search submit announces as "magnifying
glass" rather than "Search".

## Exact accessibility mechanism
For a button whose sole content is an image, the button's accessible name comes from that
image's `alt`. So AccName(submit) = "magnifying glass". A screen-reader user tabbing the
search form reaches a button announced as "magnifying glass, button" with no indication that
activating it runs the search. Voice-control users saying "click search" find no matching
control. The icon's pixels are a correct magnifying glass, so the alt is *right about the
depiction and wrong about the function* — exactly the G94 search-button example inverted.
The adjacent `alt="Go"` button shows a purpose-named control.

## Expected ACT-style outcome
**failed** (SC 1.1.1, control-purpose limb). The non-text content is a control, so its name
must describe its purpose; "magnifying glass" describes the image, not the action, so the
text alternative does not serve the equivalent purpose. Presence-only checks ("image input /
button has a name") pass.

## Why automated tools miss it
A button with a non-empty accessible name (or an `<input type="image">` with non-empty alt)
satisfies axe-core/WAVE/Lighthouse name checks; "magnifying glass" is a perfectly valid
non-empty string. No tool understands that this particular control submits a search and that
its name should therefore be "Search," not a description of the glyph it displays.
Recognising the mismatch requires reasoning about the control's function in context — a human
semantic judgment.

## Citation
**Reference:** WCAG Technique G94 (`wcag-techniques/general/G94.html`)
> "A search button uses an image of a magnifying glass.  The text alternative is \"search\" and not \"magnifying glass\"."

**Reference:** WCAG 2.2 Understanding Non-text Content (`wcag-understanding/non-text-content.html`)
> "For non-text content that is a control or accepts user input, such as images used as submit buttons, image maps or complex animations, a name is provided to describe the purpose of the non-text content so that the person at least knows what the non-text content is and why it is there."
