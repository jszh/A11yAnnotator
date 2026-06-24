# case-01 — Faux-disabled "Submit registration" button that still submits

## Scenario
A Riverside Food Bank volunteer sign-up form. The primary action, "Submit registration", is
greyed (`#9a9a9a` text on `#ededed` ≈ 2.4:1) and carries `class="disabled"` to look inert.
But it has **no** `disabled` attribute, **no** `aria-disabled`, and a live `onclick` that
really submits the form. Beside it sits a genuinely disabled twin, "Save draft (coming soon)",
with the native `disabled` attribute and the **same** grey palette. The two buttons are pixel-
identical; only one is exempt from contrast.

## Attribute tuple
- **Content domain:** Nonprofit / civic — food-bank volunteer registration
- **UI component / pattern:** form action buttons (primary + secondary), one styled-disabled, one truly-disabled
- **Host-language construct:** native `<button type="button">` with inline `onclick`; class-based styling vs. the `disabled` attribute
- **Locale / i18n:** en
- **Failure mechanism:** appearance/behavior mismatch — operable control dressed to look disabled, so the inactive-UI exemption is wrongly assumed and the sub-4.5:1 label text is never fixed

## Developer persona
An agency dev copied a jQuery-era pattern where buttons are "disabled" by toggling a CSS class
(`.disabled`) rather than the real attribute, so the handler can still run validation and show
inline errors. They kept the greyed look as the default state because "it looks cleaner before
the user fills the form," but never wired up the actual disabling — the class is purely cosmetic
and the button has always worked.

## Element / selector carrying the issue
`#submitBtn.btn.disabled` — the "Submit registration" button. Its text node is the failing
content. The exempt twin is `#draftBtn[disabled]`.

## Exact accessibility mechanism
A low-vision user sees a faint grey label and may read it as "disabled, ignore it," yet the
control is the only way to submit. For 1.4.3, the question is whether the component is
"available for user interaction." It is: `#submitBtn` has no `disabled`/`aria-disabled`, is
focusable, and its `onclick` fires (Enter/Space/click all submit). Therefore it is an active UI
component and its label MUST reach 4.5:1. At ≈2.4:1 it fails. The twin `#draftBtn` is natively
`disabled` (removed from the tab order, inert), so it IS exempt and is correctly out of scope —
demonstrating that the verdict depends on behavior, not appearance.

## Expected ACT-style outcome
**failed** (SC 1.4.3). The operable "Submit registration" text is in scope and below 4.5:1.

## Why automated tools miss it
Contrast scanners commonly EXEMPT anything that looks disabled: axe-core skips text in elements
that are `disabled` or in the disabled subtree, and several tools apply a "greyed button =
inactive = ignore" heuristic. Here there is no programmatic disabled state at all, so a tool
that keys off `disabled`/`aria-disabled` will either (a) flag both grey buttons identically, or
(b) skip both as "probably disabled by color." Neither is correct: the exemption hinges on a
behavioral fact — does the control fire? — that a static checker cannot observe. Only by driving
the control (click/Enter) and seeing it submit can a judge place it in scope.

## Citation
**Reference:** WCAG 2.2 Understanding Contrast (Minimum) (`wcag-understanding/contrast-minimum.html`)
> "User Interface Components that are not available for user interaction (e.g., a disabled control in HTML) are not required to meet contrast requirements. An inactive user interface component is visible but not currently operable."

**Reference:** Trusted Tester v5.1.3 — SC 1.4.3 (`refs/trusted-tester/sc-1.4.3-contrast-minimum.md`)
> "EXCLUDE text that is: ... For inactive (disabled) user interface components"
