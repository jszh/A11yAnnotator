# case-01 — Sliding toggle switch coded `role="checkbox"`

## Scenario
The Notifications settings panel of **Northwind Postmaster** (a transactional-email
SaaS) lists three preferences, each with a sliding pill toggle: a rounded track with a
circular thumb that slides left (grey/off) to right (green/on). The control takes effect
instantly. Visually and behaviourally it is unmistakably an on/off **switch**, but it is
coded `<div role="checkbox" aria-checked="true">`.

## Attribute tuple
- **content-domain:** B2B SaaS account settings (email deliverability)
- **UI-component / pattern:** sliding pill toggle (thumb-on-track switch)
- **host-language construct:** `<div role="checkbox" aria-checked tabindex="0" aria-labelledby>`
- **locale / i18n:** en-US
- **failure-mechanism:** valid ARIA role token that is the WRONG role — `checkbox` for a control whose rendered/behavioural identity is `switch`

## Developer persona
A front-end engineer mid-migration from a hand-rolled component set to a design system.
The team's old "Toggle" component was built on `role="checkbox"` (the pattern the lead
copied from a 2019 Stack Overflow answer that predates broad `role="switch"` support).
When they restyled it into a sliding pill to match the new look, they updated the CSS but
not the role — the visual became a switch while the semantics stayed a checkbox. The
linter stayed green because `checkbox` is a valid role and `aria-checked` was already
wired up.

## Element / selector carrying the issue
- `.toggle[role="checkbox"]` (three instances) — each a sliding switch announced as a
  checkbox. The required state `aria-checked` is present and synced, so the only defect
  is the role choice.

## Exact accessibility mechanism (what AT experiences)
A screen-reader user reaches the first control and hears **"Product update emails,
checkbox, checked."** A checkbox announcement signals a form selection — something you
tick and then submit. The rendered control is a sliding switch whose change takes effect
immediately; its correct announcement is **"Product update emails, switch, on."** ARIA
defines `switch` precisely for this: a two-state control whose values are on/off rather
than checked/unchecked. By choosing the valid-but-inappropriate role `checkbox`, the
author makes AT describe a different affordance than the one the sighted user operates,
so the role does not correctly convey the component's actual function.

## Expected ACT-style outcome
**failed** — SC 4.1.2 Role limb: the programmatically-determined role is a valid token
but does not match the component's actual role/function (a switch announced as a
checkbox).

## Why automated tools miss it
axe-core / WAVE / Lighthouse confirm the role is a valid token (674b10 passes), that the
checkbox's required `aria-checked` state is present (4e8ab6 passes), that the element has
an accessible name, and that it is focusable and keyboard-operable. Every machine-checkable
fact is correct. No automated tool renders the pill, recognises the thumb-on-track switch
affordance, and decides that `switch` rather than `checkbox` is the role matching what the
user sees and does. Comparing the rendered/behavioural identity to the declared role is
human visual judgment.

## Citation
**Reference:** WCAG 2.2 Understanding — *Name, Role, Value* (Intent)
(`wcag-understanding/name-role-value.html`).

> "If custom controls are created, however, or interface elements are programmed (in
> code or script) to have a different role and/or function than usual, then additional
> measures need to be taken to ensure that the controls provide important and appropriate
> information to assistive technologies and allow themselves to be controlled by
> assistive technologies."

**Supporting reference:** WCAG 2.2 Understanding — *Name, Role, Value* (Intent)
(`wcag-understanding/name-role-value.html`).

> "What roles and states are appropriate to convey to assistive technology will depend
> on what the control represents."
