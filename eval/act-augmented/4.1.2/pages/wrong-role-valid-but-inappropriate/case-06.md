# case-06 — Roles that MATCH behaviour (boundary / passed counterexample)

## Scenario
The settings screen of **Bibliothek** (a German-locale reading app) contains three custom
controls whose roles correctly match what each control is and does — the passing mirror of
the failing pages:

1. A toast with a small **"✕" close glyph** that *looks* like a tiny graphic (the very
   appearance that tempts authors toward `role="img"`), coded as a native
   `<button aria-label="Benachrichtigung schließen">` — role matches its dismiss action
   (correct counterpart to case-05).
2. A sliding **night-mode switch** coded `role="switch"` with `aria-checked` — role matches
   the thumb-on-track switch appearance (correct counterpart to case-01).
3. An **operable disclosure** coded `role="button"` with `aria-expanded` — role matches the
   expand/collapse behaviour (correct counterpart to case-04).

## Attribute tuple
- **content-domain:** consumer reading app — settings
- **UI-component / pattern:** icon-only close button + real switch + real disclosure button
- **host-language construct:** native `<button>` / `<button role="switch">` / `<button aria-expanded>`
- **locale / i18n:** de-DE (German UI strings and accessible names)
- **failure-mechanism:** NONE — every role is both a valid token and the correct role for the rendered/behavioural identity

## Developer persona
A developer who reviewed an internal "wrong-role" audit and deliberately corrected the
three mistakes their team kept shipping: they replaced an `role="img"` close with a real
button, an `role="checkbox"` toggle with `role="switch"`, and a `role="heading"` accordion
header with `role="button"`. The page is included as the boundary case: the same shallow
facts checkers verify (valid roles, present required states, accessible names) are all true
here too — but here they coincide with the human-correct role.

## Element / selector carrying the (resolved) issue
- `.toast .close` — `<button>`, role matches the dismiss action.
- `.switch[role="switch"]` — role matches the sliding-pill switch.
- `.disclosure[aria-expanded]` (a `<button>`) — role matches the expand/collapse control.
All three roles are valid AND appropriate; there is no valid-but-inappropriate role.

## Exact accessibility mechanism (what AT experiences)
The close glyph announces **"Benachrichtigung schließen, Schaltfläche/button"** — the icon
that looks like a picture is correctly exposed as the operable button it is, with a
localized accessible name. The night-mode control announces **"Nachtmodus, Switch, aus/off"**
— matching the sliding pill the user sees. The disclosure announces **"Mehr Optionen,
button, collapsed"** and updates to "expanded" on activation. In every case the announced
role equals the rendered/behavioural identity, so AT users get the correct affordance and
SC 4.1.2's Role limb is satisfied.

## Expected ACT-style outcome
**passed** — SC 4.1.2 Role limb: each programmatically-determined role is a valid token
that correctly conveys the component's actual role/function. No mismatch exists.

## Why automated tools miss it (i.e., why their pass is shallow)
axe-core / WAVE / Lighthouse "pass" this page for the same shallow reasons they "pass" the
*failing* pages: valid roles, present required states (`aria-checked`, `aria-expanded`), and
accessible names. They cannot tell this page apart from case-01/04/05 on those facts alone —
all four have valid tokens and required states. The reason this page *genuinely* passes is
the deeper judgment that role matches behaviour/appearance, which tools cannot perform; they
merely happen to agree here because the human-correct answer coincides with "valid token +
required state present." This boundary case demonstrates that the deciding factor is human
visual/behavioural judgment, not the machine-checkable facts.

## Citation
**Reference:** WCAG 2.2 Understanding — *Name, Role, Value* (Intent)
(`wcag-understanding/name-role-value.html`).

> "When standard controls from accessible technologies are used, this process is
> straightforward. If the user interface elements are used according to specification the
> conditions of this provision will be met."

**Supporting reference:** WCAG 2.2 Understanding — *Name, Role, Value* (Intent)
(`wcag-understanding/name-role-value.html`).

> "What roles and states are appropriate to convey to assistive technology will depend on
> what the control represents."
