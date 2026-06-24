# case-05 — Gov 311 search field moves focus to a hidden status span on focus (F55 focus-to-hidden-element)

## Scenario
A municipal "311" services page with a search box (`<input type="search" id="q">`). To
"announce results early" to screen-reader users, a developer wired `onfocus` on the search
field to call `.focus()` on a visually-hidden, focusable `role="status"` span. As a result,
the moment a keyboard user tabs into the visible search box, focus is yanked off-screen onto
the hidden status element: the search field's `:focus` ring never paints, and the user's
focus disappears into an invisible region from which the next Tab continues — the visible
control is effectively pointer-only.

## Attribute tuple
- **content-domain**: government / civic services portal (311 services search)
- **UI-component/pattern**: site search field (`role="search"` form)
- **host-language construct**: inline `onfocus` calling `.focus()` on another, visually-hidden element
- **locale/i18n**: en (with an "Español" affordance in the banner)
- **failure-mechanism**: F55 — script moves focus to a *hidden* element the instant focus is received

## Developer persona
A government-contractor developer was told in an accessibility ticket to "announce the
search status to screen readers." They misread the guidance and decided that *focusing* the
hidden `role="status"` span on field focus would make NVDA read it. They set
`onfocus="document.getElementById('srch-status').focus()"` on the search input and shipped
it, never tabbing the form themselves. The hidden span is correctly off-screen with the
standard `.visually-hidden` clip pattern and `tabindex="-1"`, and the search input keeps a
valid `:focus` outline, so the markup looks careful and review-clean.

## Element / selector carrying the issue
- FAIL: `input[type="search"]#q` — `onfocus` relocates focus to `#srch-status` (a `.visually-hidden` `[tabindex="-1"]` span).

## Exact accessibility mechanism
A keyboard user tabs into the search card and lands on the search `<input>`. The field
receives focus and fires `focus`; the inline `onfocus` calls `document.getElementById(
'srch-status').focus()`, moving focus to the off-screen status span in the same tick. The
input's `:focus` rule (yellow outline) never paints because the input is unfocused before
the next frame. The keyboard user perceives the focus ring vanish entirely — focus is now on
a 1×1px clipped element with no visible indicator — and they cannot tell they are "in" the
search at all. Typing does nothing because the search box no longer holds focus, so the
field is operable only with a mouse click (which does not run the keyboard tab flow the same
way). This is the F55 failure where script relocates focus the instant it is received.

## Expected ACT-style outcome
**failed** — focus does not remain on the search field when received; it is moved to a
hidden element, so the field never shows a visible focus indicator (F55).

## Why automated tools miss it
Statically, the form is exemplary: a programmatic `<label for="q">`, a real
`input[type=search]`, a `role="search"` form, and a valid `:focus` outline — label/name,
form, and ARIA scanners all pass, and no automated 2.4.7 rule exists. The `role="status"`
span is a legitimate live-region pattern, so tools see nothing suspect. The failure is the
runtime `onfocus` redirect, a temporal/behavioral effect: focus is granted then moved off
within a tick, so any single snapshot shows the search box unfocused (and the hidden span,
being clipped, shows no ring either). Only by tabbing into the field and observing that the
indicator never settles — and that focus has silently left the screen — can the failure be
found, which requires human/dynamic testing.

## Citation
> **WCAG Techniques — F55: Failure of Success Criteria 2.1.1, 2.4.7, 2.4.13, and 3.2.1 due to using script to remove focus when focus is received**
> "Content that normally receives focus when the content is accessed by keyboard may have
> this focus removed by scripting... this practice removes focus from the content entirely,
> which means that the content can only be operated by a pointing device such as a mouse."

> **Trusted Tester 5.1.3 — SC 2.4.7 (Test 4.D)**
> "Test Condition: A visible indication of focus is provided when focus is on the interface
> component." ... "Evaluate Results (PASS if): When each interface element receives focus,
> there is a visible indication of focus."

> **WCAG 2.2 Understanding 2.4.7 — Intent of Focus Visible**
> "The focus indicator must not be time limited, when the keyboard focus is shown it must
> remain."
