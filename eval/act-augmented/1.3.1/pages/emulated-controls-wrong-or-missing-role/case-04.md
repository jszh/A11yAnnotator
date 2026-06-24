# case-04 — `<img>` acting as the search submit button, alt describing the picture

## Scenario
The **Skylark Air** flight-search bar ends with a submit control that is an **image**: a
glossy round teal disc bearing a white magnifying glass and the word "Search" (an inline SVG
data URI stands in for the production PNG so the page renders from `file://`). It has a
pointer cursor and a hover scale, and clicking it runs the search. Visually and behaviourally
it is the search **button**. But it is `<img onclick="submitSearch()">` with no `role`, no
`tabindex`, and an `alt` that describes the **graphic** ("Round teal search icon with a white
magnifying glass") rather than the action.

## Attribute tuple
- **content-domain:** travel — flight search / booking
- **UI-component / pattern:** form submit control
- **host-language construct:** `<img onclick alt>` used as a button (no `role`, no `tabindex`, no `<button>`/`<input type=submit>`)
- **locale / i18n:** en-GB (Lisbon → Reykjavík)
- **failure-mechanism:** scripted element presented as a button whose exposed role is **img** (a graphic), compounded by alt that names the picture not the function (F42)

## Developer persona
A designer-turned-developer who exported the search button straight from the mockup as a
single graphic asset. To make it "do something," they bound `onclick` to the search routine
and wrote `alt` the way they label every image in the design system — describing what the
picture *looks like*. They never used `<button>` because "it's just an image with a click,"
and the missing-alt linter was happy because the `alt` is present and non-empty.

## Element / selector carrying the issue
- `img.searchbtn` — the single submit control. It is the search button by appearance and
  behaviour but exposes the `img` role and an `alt` that describes the graphic, not the
  submit action.

## Exact accessibility mechanism (what AT experiences)
A sighted user sees a "Search" disc at the end of the form and clicks it to submit. A
screen-reader user reaches the element and hears **"image, Round teal search icon with a white
magnifying glass"** — it is announced as a graphic, never as a button, and gives no hint it
submits the form. Because it has no `tabindex` (and `<img>` is not natively focusable), a
keyboard-only user cannot Tab to it or activate it, so the form has no operable submit at all.
The button relationship that the rendered disc, the baked-in "Search" wording, and the submit
behaviour convey is not programmatically determinable.

## Expected ACT-style outcome
**failed** — SC 1.3.1 Info and Relationships, F42 emulated-control path: an `<img>` presented
as a submit button via styling and scripted activation exposes the `img` role (and a picture-
describing alt), so the control relationship is not programmatically determinable.

## Why automated tools miss it
The `<img>` has a present, non-empty `alt`, so the 1.1.1 missing-alt rule passes; it has no
`role`, so the 1.3.1 role-validity rules (4e8ab6, 674b10) never apply. axe / WAVE / Lighthouse
see a valid image with a click handler — there is no static rule that says "this image is
really the submit button and is exposed as a graphic," and none that judges whether the alt
describes the *function* rather than the *picture*. Both judgments — that the disc with
"Search" *is the button*, and that its `img` role and graphic-describing alt contradict that —
require human visual and behavioural reasoning.

## Citation
**Reference:** WCAG Techniques — *F42: Failure of Success Criteria 1.3.1, 2.1.1, 2.1.3, or
4.1.2 when emulating links* (`wcag-techniques/failures/F42.html`).

> "Scripted event handling is added to an `img` element so that it functions as a link when
> clicked with a mouse. Assistive technology does not recognize this element as a link."

**Supporting reference:** WCAG 2.2 Understanding — *Info and Relationships* (Intent)
(`wcag-understanding/info-and-relationships.html`).

> "The intent of this success criterion is to ensure that information and relationships that
> are implied by visual or auditory formatting are preserved when the presentation format
> changes. For example, the presentation format changes when the content is read by a screen
> reader …"
