# case-01 — Banking "Review transfer" submit button blurs itself on focus (F55 onfocus="this.blur()")

## Scenario
An online-banking "Move money between accounts" form. The primary action is an
`<input type="submit" value="Review transfer">`. A junior developer disliked the
default focus ring "flashing" on the dark navy button after a click, found a Stack
Overflow answer recommending `onfocus="this.blur()"`, and pasted it onto the submit
input. As a side effect, when a keyboard user Tabs from the Memo field to the submit
button, focus lands and is *immediately* removed — the button never shows a focus
indicator and cannot be activated by keyboard at all.

## Attribute tuple
- **content-domain**: online banking / fintech dashboard
- **UI-component/pattern**: form submit button (`<input type="submit">`)
- **host-language construct**: inline `onfocus` event-handler attribute on a native control
- **locale/i18n**: en
- **failure-mechanism**: F55 — `onfocus="this.blur()"` removes focus the instant it is received (canonical F55 Example 1)

## Developer persona
A junior front-end dev on the bank's web team thought the focus outline looked like a
glitch when it appeared after clicking the button. They searched "remove focus outline
after click button" and pasted the top Stack Overflow snippet (`onfocus="this.blur()"`)
straight onto the submit input, never testing with the keyboard. They left the CSS
`:focus` outline in place, so the page *looks* accessible in code review.

## Element / selector carrying the issue
- FAIL: `input.btn-primary[type="submit"]` (value "Review transfer") — `onfocus="this.blur()"`.

## Exact accessibility mechanism
A sighted keyboard user tabs through From → To → Amount → Memo, then presses Tab again
to reach "Review transfer". The browser places focus on the submit input, which fires the
`focus` event; the inline `onfocus="this.blur()"` immediately calls `.blur()`, so focus is
yanked off the button in the same tick. The CSS `.btn-primary:focus { outline: 3px solid }`
rule is valid but never paints, because the element is no longer focused by the time the
frame renders. The keyboard user sees the focus ring "skip past" the button entirely and
cannot tell the button is reachable; in practice the control becomes pointer-only, because
each attempt to land on it is undone. This violates the temporal limb of 2.4.7 — the focus
indicator must remain when shown — and is the literal F55 failure pattern.

## Expected ACT-style outcome
**failed** — when focus is placed on the submit button, focus does not remain there until
the user moves it (F55), so no visible focus indication is ever provided for that element.

## Why automated tools miss it
There is no automated rule for 2.4.7; axe-core, WAVE and Lighthouse do not test whether a
focus indicator actually appears. A CSS-aware scanner would even see a *valid* `:focus`
outline declared and conclude the button is fine. The defect is the inline
`onfocus="this.blur()"` handler, whose effect is temporal: focus is set and then removed
within the same event loop, so a single rendered/snapshotted state shows the button
unfocused — indistinguishable from "not yet tabbed to." Only by driving Tab to the button
and observing over time that the indicator never persists (the F55 test step "focus
remains there until user moves it") can the failure be detected — a human/dynamic check.

## Citation
> **WCAG Techniques — F55: Failure of Success Criteria 2.1.1, 2.4.7, 2.4.13, and 3.2.1 due to using script to remove focus when focus is received**
> "Content that normally receives focus when the content is accessed by keyboard may have
> this focus removed by scripting. This is sometimes done when designer considers the system
> focus indicator to be unsightly. However, the system focus indicator is an important part
> of accessibility for keyboard users. In addition, this practice removes focus from the
> content entirely, which means that the content can only be operated by a pointing device
> such as a mouse."
>
> Example: `<input type="submit" onFocus="this.blur();">`
>
> Tests / Procedure: "Check that when focus is placed on each element, focus remains there
> until user moves it." Expected Results: "If #2 is false then this failure condition
> applies and content fails the Success Criterion."

> **WCAG 2.2 Understanding 2.4.7 — Intent of Focus Visible**
> "The focus indicator must not be time limited, when the keyboard focus is shown it must
> remain."
