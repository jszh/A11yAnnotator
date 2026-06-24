# case-04 — Course-catalog filter chips: real highlight via `mouseenter` JS class

## Scenario
A university course-catalog page with subject filter chips (`<button>`s). The CSS
*looks* correct — there is a `.chip:hover, .chip:focus` rule — but that rule only nudges
the border by one near-identical lavender step. The conspicuous filled-purple "active"
state is applied by JavaScript via a `.is-hot` class, and that JS is bound to `mouseenter`
/ `mouseleave`. Keyboard focus fires neither, so a Tab-focused chip gets the invisible
border nudge and nothing else.

## Attribute tuple
- **content-domain:** higher-education course catalog
- **UI-component / pattern:** filter chip group (toggle-style buttons)
- **host-language construct:** `<button class="chip">` in a `role="group"`; CSS `:focus` present-but-inert + JS `mouseenter`/`mouseleave` class toggle
- **locale / i18n:** en-GB ("catalogue"-style higher-ed context), en-US spelling in code
- **failure-mechanism:** **decoy `:focus` rule** (perceptually-null change) while the real, perceptible highlight is gated behind pointer-only JS events

## Developer persona
The chips' hover-preview behaviour was ported verbatim from the institution's old jQuery
site, which painted a bold purple state on `mouseenter` and cleared it on `mouseleave`.
When a global reset removed button outlines, a developer "fixed focus" by adding a
`.chip:hover, .chip:focus { border-color: … }` rule — but picked a border value one step
off the resting colour, so it reads as styled in code review while being invisible on
screen. Nobody re-bound the JS highlight to `focus`/`blur`.

## Element / selector carrying the issue
`.chip` buttons. `button:focus { outline: none }` removes the UA ring;
`.chip:hover, .chip:focus { border-color:#c4bdd6 }` is the decoy (resting border is
`#c9c2da` — a sub-perceptible 1-step shift); `.chip.is-hot { background:#3b1d6e; color:#fff }`
is the real indicator, toggled only by `mouseenter`/`mouseleave` in the script.

## Exact accessibility mechanism
The visible change a sighted user reads as "this chip" is the filled-purple `.is-hot`
state. `mouseenter`/`mouseleave` are pointer-only DOM events; pressing Tab dispatches
`focus`, never `mouseenter`, so `.is-hot` is never added for a keyboard user. They are
left with the `:focus` border shift from `#c9c2da` to `#c4bdd6`, which is below
perceptible threshold. Net result for a sighted keyboard user: effectively no focus
indicator. *(Verified in Chromium: keyboard `focusΔ` registered no perceptible change;
dispatching pointer events flipped the chip to `background:#3b1d6e; color:#fff`.)*

## Expected ACT-style outcome
**failed** (oj04fd). The perceptible state is unreachable by keyboard.

## Why automated tools miss it
Two layers of deception: (1) a CSS scan finds a `:focus` rule and assumes the focus state
is styled — it cannot judge that a 1-step border shift is imperceptible; (2) the real
indicator is produced by JavaScript bound to mouse events, which static analysis does not
model as an input modality. axe/WAVE/Lighthouse have no SC 2.4.7 oracle and no way to tie
"the conspicuous highlight" to "pointer-only listeners." A human must tab through and
compare what the keyboard produces against what the mouse produces.

## Citation
> **WCAG Technique C45** (`wcag-techniques/css/C45.html`), Description:
> "Styles defined with the regular `:focus` pseudo-class are applied whenever an element
> has focus, regardless of how it received focus. In contrast, user agents apply
> additional heuristics and logic to decide when to show `:focus-visible` styles… browsers
> always show these styles when a user is navigating using the keyboard, but will
> generally *not* show them as a result of a mouse/pointer interaction…"

> **WCAG Failure F55** (`wcag-techniques/failures/F55.html`), Description:
> "Content that normally receives focus when the content is accessed by keyboard may have
> this focus removed by scripting… the system focus indicator is an important part of
> accessibility for keyboard users."
