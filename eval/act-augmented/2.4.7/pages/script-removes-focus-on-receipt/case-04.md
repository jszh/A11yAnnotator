# case-04 — Custom role=button "Apply now" widget bounces focus to document.body on focusin (F55 focus-relocation variant)

## Scenario
A job-board posting for a Senior Data Engineer. The primary action is a custom button:
`<div role="button" tabindex="0" aria-label="Apply now…">Apply now</div>` with a valid
`:focus` outline. A page-level delegated `focusin` listener intercepts focus on this widget
and calls `document.body.focus()` (the `<body>` carries `tabindex="-1"` with its outline
suppressed), so every time a keyboard user tabs onto "Apply now" their focus is silently
bounced onto the page body. The control can be reached but never *held*, so no focus
indicator ever shows on it and it is mouse-only.

## Attribute tuple
- **content-domain**: job board / ATS application
- **UI-component/pattern**: custom button (`div[role=button][tabindex=0]`)
- **host-language construct**: delegated `addEventListener('focusin', …)` that calls `document.body.focus()`
- **locale/i18n**: en
- **failure-mechanism**: F55 — script *moves focus elsewhere* on receipt (programmatic focus relocation, the non-`blur()` F55 variant)

## Developer persona
A mid-level React-leaning developer was building a modal "apply" flow and wrote a global
`focusin` handler intended to "park" leftover focus on the body whenever a stray element
inside the closing modal grabbed it. The selector they wrote (`[data-action="apply"]`)
accidentally also matches the apply *trigger* button on the job page, not just the modal
internals, so the body-parking logic now fires for the trigger itself. Because mouse
clicks still navigate correctly (a separate `click` handler), the bug never surfaced in
their pointer-based testing, and the widget has a perfect role/name/`:focus` style, so it
sailed through code review.

## Element / selector carrying the issue
- FAIL: `.apply-btn[role="button"][data-action="apply"]` — focus is relocated to `body[tabindex="-1"]` by the delegated `focusin` listener.

## Exact accessibility mechanism
A keyboard user tabs through the job description and presses Tab to reach "Apply now". The
widget receives focus and a `focusin` event bubbles to the document-level listener, which
matches `[data-action="apply"]` and calls `document.body.focus()`. Focus jumps to the body,
whose `:focus { outline: none }` suppresses any indicator, so the user sees nothing — the
apply button's `:focus` ring never paints because the element holds focus for less than a
frame. The next Tab moves from the body's position, effectively skipping the button again.
The result: the primary action of the page is keyboard-unreachable in practice (focus
cannot settle on it), and a sighted keyboard user has no idea where focus went. This is the
F55 "script moves focus when focus is received" failure, distinct from `this.blur()` only in
*where* focus is sent.

## Expected ACT-style outcome
**failed** — when focus is placed on the apply widget it does not remain there until the
user moves it; focus is programmatically relocated, so the control never shows a focus
indicator (F55).

## Why automated tools miss it
The widget is textbook-clean in the static DOM: `role="button"`, `tabindex="0"`, a correct
`aria-label`, and a valid `:focus` outline — axe-core, WAVE, and Lighthouse confirm a named,
focusable button and flag nothing, and none implement a 2.4.7 indicator check. The failure
lives in runtime event flow: a `focusin` listener that fires *after* focus lands and moves it
to `<body>`. A scanner does not execute the keyboard sequence, does not model `focusin`
bubbling, and a single focused snapshot would (wrongly) appear to show the body focused, not
the button. Only a human or dynamic test that tabs to the control and observes focus failing
to settle (the F55 procedure) can catch it.

## Citation
> **WCAG Techniques — F55: Failure of Success Criteria 2.1.1, 2.4.7, 2.4.13, and 3.2.1 due to using script to remove focus when focus is received**
> "Content that normally receives focus when the content is accessed by keyboard may have
> this focus removed by scripting... this practice removes focus from the content entirely,
> which means that the content can only be operated by a pointing device such as a mouse."
>
> Tests / Procedure: "Check that when focus is placed on each element, focus remains there
> until user moves it." Expected Results: "If #2 is false then this failure condition applies
> and content fails the Success Criterion."

> **WCAG 2.2 Understanding 2.4.7 — Intent of Focus Visible**
> "The focus indicator must not be time limited, when the keyboard focus is shown it must
> remain."
