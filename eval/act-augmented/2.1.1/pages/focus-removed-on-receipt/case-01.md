# case-01 — Login submit button strips its own focus on receipt (`onfocus="this.blur()"`)

## Scenario
A credit-union online-banking sign-in form ("Harborline Credit Union"). The username and password fields are clean and fully operable. The primary `<input type="submit" value="Sign in">` carries `onfocus="this.blur()"` — the canonical F55 one-liner. A keyboard user can Tab to the button, but the instant it receives focus the script blurs it, so focus is thrown to `<body>`. The user can never hold focus on "Sign in" to press Space/Enter on it.

## Attribute tuple
- **content-domain:** online banking / credit-union sign-in
- **UI-component / pattern:** native form `<input type="submit">`
- **host-language construct:** inline `onfocus` HTML event-handler attribute calling `this.blur()`
- **locale / i18n:** en-US
- **failure-mechanism:** F55 verbatim — script removes focus from the element when focus is received (synchronous self-blur)

## Developer persona
A front-end contractor doing keyboard QA disliked the big teal focus ring "flashing" on the submit button and thought it "looked broken." They pasted a Stack Overflow snippet, `onfocus="this.blur()"`, onto the button to suppress the ring — not realizing it strips the element's focus entirely and makes it keyboard-inoperable.

## Element / selector carrying the issue
`input.signin` (the `<input type="submit" value="Sign in" onfocus="this.blur()">`).

## Exact accessibility mechanism (what AT experiences, why it fails)
- The button is a real, named, focusable native control (`type="submit"`, value "Sign in"). Its accessible name and role are correct.
- A keyboard user tabs from the password field to the submit button. The browser assigns focus, the `focus` event fires, and the handler immediately calls `this.blur()`. Focus lands on `<body>`.
- A screen-reader user navigating control-by-control to "Sign in, button" arrives at an element that does not keep focus; the SR's virtual cursor / focus is bounced off it.
- Net: the page's primary call-to-action cannot be operated by keyboard because focus cannot **rest** on it. (Pressing Enter inside the password field is a separate, incidental submit path; the visible primary control is itself unoperable, which is what F55 fails.)

Verified with Puppeteer (`.focus-probe.js`): `el.focus()` on `input.signin` leaves `document.activeElement === document.body` (focus stolen, `rests=false`, `landedOn=body`).

## Expected ACT-style outcome
**failed** (SC 2.1.1 — the submit control is reachable in the tab order but focus is removed when received, so it cannot be operated by keyboard; textbook F55).

## Why automated tools miss it
axe-core, WAVE, and Lighthouse evaluate a static DOM snapshot. In that snapshot the submit button is a valid, named, focusable native control with no missing/empty attributes — nothing to flag. The defect is purely behavioural: it manifests only when the `focus` event actually fires at runtime and the handler blurs the element. No static rule dispatches focus to each control and then checks whether `document.activeElement` is still that control after the event loop turns. Detecting it requires tabbing through the page and observing that the focus ring touches "Sign in" and then vanishes — a temporal/behavioural trace, not markup analysis. (An `onfocus` attribute is not itself an error; many legitimate uses exist, so its mere presence cannot be flagged.)

## Citation
> "Content that normally receives focus when the content is accessed by keyboard may have this focus removed by scripting. ... this practice removes focus from the content entirely, which means that the content can only be operated by a pointing device such as a mouse."
— wcag-techniques/failures/F55.html (Description)

> "&lt;input type="submit" onFocus="this.blur();"&gt;"
— wcag-techniques/failures/F55.html (Examples — the exact failing pattern this page reproduces)

> "Check that when focus is placed on each element, focus remains there until user moves it. ... If #2 is false then this failure condition applies and content fails the Success Criterion."
— wcag-techniques/failures/F55.html (Tests / Expected Results)
