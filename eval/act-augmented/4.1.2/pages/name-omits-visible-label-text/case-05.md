# case-05 — Submit button whose accessible name is an internal id-like slug, not the visible value

## Scenario
An insurance quote wizard (renters insurance, step 3 of 3). The final action is a native
`<input type="submit" value="Get my quote">`, so the button face reads **Get my quote**. A form-builder
integration also emitted `aria-label="quote-submit-btn-v2"` (the component's internal identifier).
`aria-label` overrides the `value`, so the computed name is the developer slug — an id-like string
with no overlap with the visible label.

## Attribute tuple
- **Content domain:** insurance quote wizard / fintech
- **UI component / pattern:** multi-step wizard final submit (`<input type="submit">`)
- **Host-language construct:** native submit with a `value` label + `aria-label` override
- **Locale / i18n:** en-US
- **Failure mechanism:** `aria-label` overrides `value`; divergence type = **ID-LIKE STRING** (internal slug exposed)
- **ARIA anti-pattern (facets.json):** "aria-label overrides/contradicts the visible text label"

## Developer persona
A no-code/low-code form builder auto-generates an `aria-label` from each control's internal component
key ("quote-submit-btn-v2") for its own event-binding, and the team never overrode it. The visible
`value` is the marketing copy; the accessible name is plumbing that leaked into the a11y tree.

## Element / selector carrying the issue
`input.submit` — `<input type="submit" value="Get my quote" aria-label="quote-submit-btn-v2">`

## Exact accessibility mechanism
For a submit input, the `value` normally becomes the accessible name; here `aria-label` takes
precedence and replaces it. Verified in Chromium: `role=button`, `accName="quote-submit-btn-v2"`. A
screen-reader user hears a hyphenated developer slug, "quote-submit-btn-v2, button" — no relation to
the on-screen "Get my quote". A speech-input user saying "click Get my quote" cannot activate it.
Name is non-empty (ACT rule 97a4e1 "Button has non-empty accessible name" PASSES; the element also
satisfies the image/form-field name rules' shape), role correct, but not determinable as the visible
label.

## Expected ACT-style outcome
**failed** (F111 check #1 true, #2 true, #3 false).

## Why automated tools miss it
97a4e1 / axe / WAVE / Lighthouse confirm a non-empty name and pass. "quote-submit-btn-v2" is a valid
string with no empty/dangling attribute to lint. Recognizing that the programmatic name is an
internal identifier rather than the rendered "Get my quote" requires reading the button face and
judging the string mismatch — a semantic comparison the 4.1.2 rule set never performs (string overlap
lives only in 2.5.3).

## Citation
> "When standard controls from accessible technologies are used, this process is straightforward. If
> the user interface elements are used according to specification the conditions of this provision
> will be met."
— WCAG Understanding, **Name, Role, Value** (`wcag-understanding/name-role-value.html`), Intent
> (here the override of `value` by an internal-slug `aria-label` defeats the "used according to
> specification" assumption: the name is present but is not the visible label.)
