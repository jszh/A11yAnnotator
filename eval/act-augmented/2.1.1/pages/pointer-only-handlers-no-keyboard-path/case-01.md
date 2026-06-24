# case-01 — Five-star rating made of `<span>★</span>` with onclick only

## Scenario
A restaurant "Write a review" form (Saffron & Sage). The overall-rating control is a
row of five star glyphs `<span class="star">★</span>`, each with an inline
`onclick="setRating(n)"`. Hovering fills the stars gold and the cursor is a pointer, so
to a sighted mouse user it is obviously a normal star-rating widget. The rest of the
form — display-name text input, review textarea, and the native "Publish review" submit
button — is fully keyboard operable. The selected rating is written to a hidden input
that the form submits.

## Attribute tuple
- **content-domain:** restaurant review / community ratings
- **UI-component/pattern:** rating stars (APG rating widget)
- **host-language construct:** `<span>` glyphs with inline `onclick`, no `tabindex`/`role`/`onkeydown`
- **locale/i18n:** en-GB
- **failure-mechanism:** pointing-device-only event handler is the sole way to invoke the function (F54)

## Developer persona
A solo restaurant-site owner who codes part-time grabbed a "pure CSS + 10 lines of JS"
star-rating snippet from a blog tutorial. The tutorial used spans + `onclick` because it
only ever demoed the mouse interaction. The owner dropped it into the otherwise
hand-built (and keyboard-fine) review form, tested it by clicking, saw the stars light
up, and shipped it.

## Element / selector carrying the issue
`#starRow .star` — the five `<span class="star" onclick="setRating(n)">` elements. They
have no `tabindex`, no `role`, and no key handler.

## Exact accessibility mechanism
The stars are exposed to assistive technology only as static text (a string of "★"
characters); they are not interactive nodes and are not in the tab order. A
keyboard-only or switch user can Tab to the name field, the textarea and the submit
button, but can never reach or operate the stars, so they cannot set a rating at all —
the function (choosing 1–5 stars) is invokable exclusively through a pointer click. There
is no alternative keyboard path to the rating anywhere on the page (the hidden input is
not user-editable and has no associated control). This is the exact F54 condition:
pointing-device-specific event handlers are the only mechanism to invoke a function, and
the function is not path-dependent, so it fails 2.1.1 (and 2.1.3).

## Expected ACT-style outcome
**failed** — SC 2.1.1 Keyboard (F54). The two published ACT rules for 2.1.1 (0ssw9k
scrollable-region reachability, akn7bn iframe tab order) are *inapplicable* here; neither
inspects element event handlers, so the failure is invisible to them and surfaces only
under the Trusted Tester 4.A "use the mouse to determine available functions, then
operate them with the keyboard" procedure.

## Why automated tools miss it
axe-core, WAVE and Lighthouse evaluate the static DOM. These spans contain a non-empty
text glyph, so there is no empty-name, missing-alt, or missing-label violation. Nothing
in the markup declares the spans interactive (no `role`, no `href`, no form control, and
the handler is a plain `onclick` on a generic element), so the scanners do not treat them
as controls to test for keyboard operability — there is no rule that fires. Recognising
that the five stars ARE a functional rating control (by seeing the hover fill and
clicking one) and then confirming no keyboard route exists is a visual/semantic judgment
the tools cannot perform.

## Citation
> **Reference:** WCAG Techniques — F54 "Failure of Success Criterion 2.1.1 due to using
> only pointing-device-specific event handlers (including gesture) for a function"
> (`wcag-techniques/failures/F54.html`)
>
> **Quote (verbatim):** "When pointing device-specific event handlers are the only
> mechanism available to invoke a function of the content, users with no vision (who
> cannot use devices such as mice that require eye-hand coordination) as well as users
> who must use alternate keyboards or input devices that act as keyboard emulators will
> be unable to access the function of the content."
>
> **Quote (verbatim):** "If check #1 is true and check #2 is false, then this failure
> condition applies and content fails Success Criteria 2.1.1 Keyboard and 2.1.3 Keyboard
> (No Exceptions)."
