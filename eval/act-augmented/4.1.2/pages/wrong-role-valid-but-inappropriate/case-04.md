# case-04 — Operable accordion header coded `role="heading"`

## Scenario
The FAQ page of **Meadowbrook Veterinary Clinic** (CMS-built) uses an accordion. Each
item has a clickable header bar showing the question, a rotating disclosure triangle
(▸ → ▾), and an answer panel that expands/collapses on activation. The header is fully
operable — focusable, click + key handler, `aria-expanded` that flips. Visually and
behaviourally it is an interactive disclosure control, but it is coded
`<div role="heading" aria-level="3" aria-expanded="false">` with no button semantics.

## Attribute tuple
- **content-domain:** local healthcare / veterinary clinic site (CMS)
- **UI-component / pattern:** accordion / disclosure with a rotating triangle
- **host-language construct:** `<div role="heading" aria-level="3" aria-expanded tabindex="0">`
- **locale / i18n:** en-US
- **failure-mechanism:** valid ARIA role token that is the WRONG role — `heading` (static section title) for an operable disclosure control (`button`)

## Developer persona
An agency themed a CMS template for the clinic. The template's accordion shipped headers
as real `<h3>` elements for SEO/outline reasons. To add expand/collapse the agency dev
bolted a click handler and `aria-expanded` onto the existing header and, when they
converted the markup to styled `<div>`s during a redesign, preserved the heading meaning
with `role="heading" aria-level="3"` — "so the page outline still shows the questions."
They never added `role="button"`, because the element was conceptually still "the
heading." It passes automated checks: heading is valid and `aria-level` is present.

## Element / selector carrying the issue
- `.head[role="heading"]` (three headers) — operable disclosure controls announced as
  static headings. They carry `aria-expanded` but no `role="button"`, so the operable
  affordance is not conveyed.

## Exact accessibility mechanism (what AT experiences)
A screen-reader user navigating by heading (the H shortcut) lands on **"Do you offer
weekend appointments?, heading level 3."** Headings are expected to be inert labels you
read to survey a page, not controls you operate. No "button" role is announced, so the
operable disclosure affordance is not reliably conveyed — `aria-expanded` on a bare
`heading` is poorly surfaced by AT compared with a button. A user reading headings has no
cue that activating one reveals content; a user hunting for controls finds a heading. The
APG disclosure pattern is a `button` (optionally wrapped inside a heading); coding the
operable control purely as a heading makes the role contradict the behaviour. The chosen
role is valid but does not convey the control's actual function.

## Expected ACT-style outcome
**failed** — SC 4.1.2 Role limb: a valid role token (`heading`) that misrepresents an
operable disclosure control whose correct role is `button`.

## Why automated tools miss it
axe-core / WAVE / Lighthouse confirm `role="heading"` is valid (674b10 passes) and the
required `aria-level` is present (4e8ab6 passes). A focusable heading is unusual but not
an automatic violation, and `aria-expanded` is a globally-allowed state. No tool renders
the rotating disclosure triangle, observes the click-to-expand behaviour, and decides the
operable control should be a button rather than a heading. Recognising "operable
disclosure mis-coded as a static heading" requires reasoning about affordance and
behaviour — human judgment.

## Citation
**Reference:** WCAG 2.2 Understanding — *Name, Role, Value* (Intent)
(`wcag-understanding/name-role-value.html`).

> "Other examples of user interface control states are whether or not a checkbox or radio
> button has been selected, or whether a collapsible tree view or accordion is expanded
> or collapsed."

**Supporting reference:** WCAG 2.2 Understanding — *Name, Role, Value* (Intent)
(`wcag-understanding/name-role-value.html`).

> "If custom controls are created, however, or interface elements are programmed (in
> code or script) to have a different role and/or function than usual, then additional
> measures need to be taken to ensure that the controls provide important and appropriate
> information to assistive technologies..."
