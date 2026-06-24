# case-05 — Interactive star-rating whose stars are `role="img"`

## Scenario
The review form for **Tavola** (a restaurant) has a "Your rating" field rendered as five
stars. Hovering previews a rating, clicking a star sets it (it and all stars to its left
fill gold), and the chosen value populates a hidden input the form submits. Visually and
behaviourally these are an interactive single-select rating control, but each star is
coded `<span role="img" aria-label="N stars" tabindex="0">★</span>`.

## Attribute tuple
- **content-domain:** restaurant / hospitality review form
- **UI-component / pattern:** interactive star-rating widget (set 1–5)
- **host-language construct:** `<span role="img" aria-label tabindex="0">` with click/key/hover handlers and a hidden submitted input
- **locale / i18n:** en-US
- **failure-mechanism:** valid ARIA role token that is the WRONG role — `img` (static graphic) for an operable rating control (`radiogroup`/`radio` or `slider`)

## Developer persona
A developer dropped in an old jQuery star-rating plugin and then "made it accessible" by
giving each star an `aria-label` ("3 stars") and `role="img"` — reasoning that a star is a
picture, and an image with a good alt text is the textbook accessible-image pattern. They
genuinely improved the names, and axe stopped complaining, so the ticket was closed. They
never reconsidered the role: the "images" are in fact the operable rating control.

## Element / selector carrying the issue
- `.star[role="img"]` (five stars) — operable rating options announced as static images.
  Each has a correct accessible name but a role that denies the control is interactive.

## Exact accessibility mechanism (what AT experiences)
A screen-reader user hears **"1 star, image", "2 stars, image", …** — a strip of five
graphics that read as decorative/informative pictures, with no indication that any can be
activated or that together they capture a rating the form submits. The `img` role declares
a non-interactive graphic, so AT exposes no operable affordance, no selected state, and no
"3 of 5" position; voice-control and switch users get nothing actionable. On screen the
widget is fully interactive (hover preview, click-to-set, keyboard activation). The correct
semantics — a `radiogroup` of `radio` options (or a `slider`) — would announce "Your
rating, 3 stars, radio button, 3 of 5." The chosen role is valid but flatly contradicts
the control's interactive function.

## Expected ACT-style outcome
**failed** — SC 4.1.2 Role limb: a valid role token (`img`) that misrepresents an
operable rating control whose correct role is `radio`/`radiogroup` (or `slider`).

## Why automated tools miss it
axe-core / WAVE / Lighthouse confirm `role="img"` is valid (674b10 passes) and each star
has an accessible name — indeed an `img` *with* a name is the canonical lint-passing
pattern for an informative image, so checkers actively approve it. Putting `tabindex` on an
img is unusual but not an automatic violation. No tool observes that these "images" carry
click/key/hover handlers that set a submitted value, and concludes the role should be
radio or slider. Recognising "interactive rating mis-coded as static images" requires
seeing the behaviour and the rendered affordance — human judgment.

## Citation
**Reference:** WCAG 2.2 Understanding — *Name, Role, Value* (Intent)
(`wcag-understanding/name-role-value.html`).

> "The intent of this success criterion is to ensure that Assistive Technologies (AT) can
> gather appropriate information about, activate (or set) and keep up to date on the status
> of user interface controls in the content."

**Supporting reference:** WCAG Technique F15 — *Failure of Success Criterion 4.1.2 due to
implementing custom controls that do not use an accessibility API for the technology, or
do so incompletely* (`wcag-techniques/failures/F15.html`).

> "If this is not done, then assistive technologies will not be able to understand what
> the control is or how to operate it or may not even know of its existence."
