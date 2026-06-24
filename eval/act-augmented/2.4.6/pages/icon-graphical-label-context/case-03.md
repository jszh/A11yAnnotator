# case-03 — Real-estate search field: funnel/filter glyph accessibly named "Search"

## Scenario
A real-estate site ("Maple Ridge Realty") has a prominent search field inside a
`role="search"` landmark. The trailing submit button correctly submits the typed query and
carries `aria-label="Search"`. But its rendered glyph is a **funnel** — the universal *filter*
icon — sitting exactly where a loupe (which would be "commonly understood as Search") belongs. A
sighted user scanning by icon reads the funnel as "open filters (price, beds, property type)," not
"run my text search." The accessible name is right; the chosen glyph signals a different function.

## Attribute tuple
- **content-domain:** real-estate listings / property search
- **UI-component/pattern:** search landmark (`role="search"`) with a trailing icon submit button
- **host-language construct:** `<form role="search"><input aria-label="…"><button type="submit" aria-label="Search"><svg aria-hidden="true">…funnel…</svg></button></form>`
- **locale/i18n:** en-CA (Canadian spelling: "neighbourhood")
- **failure-mechanism:** glyph (funnel = filter) disagrees with the control's real function (submit search) even though position and accessible name both say "search"

## Developer persona
A contract front-end developer themed a listings template. The icon library exposed both
`fa-search` and `fa-filter`; the developer pasted the filter glyph by mistake (the two thumbnails
look similar at small sizes in the picker) into the search submit button, then set
`aria-label="Search"` to match the field's intent. Because the button still submitted the search
and had a name, every automated check passed, so the wrong glyph survived to production.

## Element / selector carrying the issue
- `form[role="search"] button.go[aria-label="Search"]` — `type="submit"`; renders a funnel SVG; submitting runs the search.

## Exact accessibility mechanism
The button is exposed with role `button`, accessible name "Search" (the funnel SVG is
`aria-hidden="true"`), inside a correctly-identified `search` landmark. Programmatically everything
reads as a valid search submit. Visually, however, the only label a sighted user gets is a funnel —
the commonly-understood cue for *filtering*, not *searching*. The graphical label is therefore not
a commonly-understood cue for this control's actual function, so 2.4.6's label limb fails for the
graphical label even though name/role/landmark are all correct.

## Expected ACT-style outcome
**failed** (SC 2.4.6 Headings and Labels — label limb, TT 5.B). Name presence (4.1.2), the search
landmark, and `button-name` all pass; only the descriptiveness of the *graphical* label fails.

## Why automated tools miss it
This is engineered to defeat heuristics: the button has a non-empty accessible name ("Search"), a
valid `role="search"` landmark wraps it, and it really submits the query — so axe-core, WAVE, and
Lighthouse have every readable signal pointing to "correct search button" and pass it. The sole
defect is the rendered funnel glyph, which no tool rasterises or classifies, and no tool encodes
"funnel = filter, loupe = search." Recognising that the glyph contradicts the function is a visual
+ conventional human judgment.

## Citation
> **Reference:** WCAG 2.2 Understanding — Headings and Labels (`wcag-understanding/headings-and-labels.html`)
>
> **Quote (verbatim):** "Note that the same image can be interpreted differently in different contexts. However, it can still be considered descriptive if its use is commonly understood in each context. For example, when accompanying a text field, a loupe or magnifying glass icon with text alternative of "Search" is commonly interpreted as indicating the field is for entering and submitting a search query."
>
> **Reference:** Trusted Tester v5.1.3 — SC 2.4.6, Test 5.B (`refs/trusted-tester/sc-2.4.6-headings-and-labels.md`)
>
> **Quote (verbatim):** "Each visual button label is sufficiently clear and descriptive, so users know its function."
