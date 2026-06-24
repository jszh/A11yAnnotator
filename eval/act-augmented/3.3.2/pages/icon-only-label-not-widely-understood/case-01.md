# case-01 — Profile form where a lone "#" glyph is the only visible cue for a username field

## Scenario
The "Messio" social product has an *Edit your profile* panel. A global search box at the top is
cued by the near-universal magnifying-glass loupe (a deliberate PASSING contrast). Below it, a
single data-entry field's ONLY visible cue is a lone "#" (octothorpe / hashtag) glyph rendered in a
44px affordance to the left of the input. The field silently expects the user's @-handle (username),
but a sighted user reading a "#" cannot tell whether to type a number, a topic/hashtag, or a name.
There is no text label, no placeholder, and no tooltip on the field.

## Attribute tuple
- **content-domain:** social / SaaS profile editor
- **UI-component/pattern:** input with a leading icon "affordance" cell (APG-style text field) + a role=search box
- **host-language construct:** `<span aria-hidden="true"><svg>…#…</svg></span>` adjacent to `<input aria-label="Username handle">`
- **locale/i18n:** en-US
- **failure-mechanism:** icon-only label whose rendered glyph ("#") is ambiguous for the field's real purpose (handle)

## Developer persona
A front-end engineer building a minimalist profile UI loved the "iconified field" aesthetic from a
Dribbble shot and dropped a hashtag glyph next to the handle input because "@-handles look like
tags." The accessibility ticket only said "give inputs a name," so they added
`aria-label="Username handle"`, watched the CI a11y check go green, and shipped — never noticing that
sighted users have no visible word telling them the box wants a handle.

## Element / selector carrying the issue
- `input#handle[aria-label="Username handle"]` — its sole visible cue is the preceding
  `span.glyph-cue` SVG that renders as a bare "#".
- (Contrast, passing: `form.searchbar input[type=search]` cued by the magnifying-glass loupe.)

## Exact accessibility mechanism
A screen-reader user lands on the input and hears "Username handle, edit text" (computed from
`aria-label`; the glyph SVG is `aria-hidden="true"`), so 4.1.2 Name, Role, Value is satisfied. A
sighted user, however, sees only a "#" glyph — no text label or instruction is presented to them.
"#" is not widely understood as "type your username here"; it could equally mean *number*, *channel*,
or *hashtag*. The visible cue therefore fails to communicate the field's purpose to everyone, which
is exactly the 3.3.2 limb the Understanding flags for image labels that are not widely understood.
The magnifying-glass search field passes because the loupe is the Understanding-sanctioned universal
icon.

## Expected ACT-style outcome
**failed** (SC 3.3.2 Labels or Instructions — visible-cue-adequacy limb). A name-presence rule
(4.1.2) passes; the page still fails 3.3.2 because the only visible label is a glyph that is not
widely understood for this field.

## Why automated tools miss it
axe-core (`label` / `aria-input-field-name`), WAVE, and Lighthouse only verify that the input has a
non-empty accessible name; `aria-label="Username handle"` satisfies that, so all report no violation.
No scanner rasterises the inline SVG to recognise it renders as "#", and none can reason that a
sighted user reading "#" cannot infer "enter your username." Whether the rendered glyph is "widely
understood by the intended target audience" is an irreducibly human, audience-relative visual and
semantic judgment.

## Citation
> **Reference:** WCAG 2.2 Understanding — Labels or Instructions (`wcag-understanding/labels-or-instructions.html`)
>
> **Quote (verbatim):** "Note that the majority of form control labels are text-based. Using images as labels meets the requirements of the criterion, but care should be taken to ensure that the images are widely understood by the intended target audience. Authors may consider providing additional hints, such as text-based tooltips or supplementary text, to support clarity when using image-based labels."
>
> **Reference:** WCAG 2.2 Understanding — Labels or Instructions (`wcag-understanding/labels-or-instructions.html`)
>
> **Quote (verbatim):** "It is possible for controls and inputs to have an appropriate accessible name or description (e.g. using `aria-label=\"...\"`) and therefore pass Success Criterion 4.1.2, but to still fail this success criterion (if the labels or instructions aren't presented to all users, not just those using assistive technologies)."
