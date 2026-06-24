# case-02 — Correct card-number fix is on screen but `aria-hidden`, so AT users are never given the suggestion

## Scenario
A public-library account-renewal form (Cedar County Public Library). The patron typed their card
number as `2134-5000-1234` (hyphenated and short), which the system rejects. The erroring field is
correctly **identified** as in error to everyone: `input#barcode` has `aria-invalid="true"` and an
`aria-describedby` status that reads "This card number was not accepted." — and that status text is
ordinary, AT-exposed text. So **error identification (3.3.1) is satisfied**: a screen-reader user
landing on the field hears that it errored.

The **correction suggestion**, though, is *present on screen but withheld from assistive
technology*. Directly under the field a styled box shows the correct, adequate, knowable fix —
"Library card numbers are 14 digits printed on the back of your card, with no spaces (for example,
21345000123456). Re-enter the full 14-digit number." — but its container `div#barcode-fix` carries
`aria-hidden="true"`, so it is removed from the accessibility tree. The field's `aria-describedby`
points only at the bare status node, never at the fix. A decoy "Need help with your card number?"
toggle *is* exposed to AT, but it only reveals generic boilerplate ("Check your card and try
again.") that never states the 14-digit format. So for a screen-reader user the suggestion is, in
effect, **not provided at all** — they are told only that the number was "not accepted."

This is the *unreachable* limb of the aspect, made defensible: the suggestion is not merely far
away in a region AT can still read (which would pass); it is genuinely excised from the
accessibility tree, so the SC's own requirement — that "the suggestions are provided to the user" —
fails for AT users.

## Attribute tuple + developer persona
- **content-domain:** civic / public services — library account renewal
- **UI-component/pattern:** single inline error message + a styled "fix" callout + a disclosure-style "Need help?" toggle
- **host-language construct:** `input#barcode[aria-invalid="true"][aria-describedby="barcode-status"]` (status is bare identification); the suggestion lives in `div#barcode-fix[aria-hidden="true"]`, not referenced by describedby; a decoy `button[aria-expanded]` reveals boilerplate only
- **locale/i18n:** en-US; domain format (14-digit library barcode)
- **failure-mechanism:** present-but-not-provided — the correct suggestion is rendered and visible to sighted users but `aria-hidden`, so it is in NO AT-reachable path; AT users receive only the bare "not accepted" error
- **persona:** A dev wrapped the inline fix box in a generic visual-only "decoration" partial whose
  template defensively sets `aria-hidden="true"` (the partial was first built for purely
  ornamental hint chips, where hiding duplicate text from AT was correct). When it was reused to
  hold the real correction text, the `aria-hidden` rode along unnoticed. Because the box is fully
  visible and high-contrast on screen, QA — testing by eye — saw a clear, well-placed suggestion
  and signed off. The `aria-describedby` was wired to the short status string only, so nothing
  routes the suggestion to AT either. Sighted users are fully served; screen-reader users get the
  error but never the fix.

## Element / selector carrying the issue
- The suggestion: `div#barcode-fix[aria-hidden="true"]` — the full, correct 14-digit fix, visible
  on screen but absent from the accessibility tree and not referenced by any `aria-describedby`.
- The erroring field: `input#barcode[aria-invalid="true"]`, `aria-describedby="barcode-status"`
  pointing **only** at the bare identification text ("This card number was not accepted.").
- The decoy: `button.helpbtn` (exposed to AT) reveals `#barcode-tip`, generic boilerplate that
  never conveys the 14-digit format.

## Exact accessibility mechanism (what AT experiences / why it fails)
Raw Chromium AX tree (via the inspector) confirms the split:
- `textbox "Library card number" [invalid=true]` is present, and `StaticText "This card number was
  not accepted."` is present — so the **error is identified** to AT (3.3.1 holds).
- The suggestion node is **absent**: the example `21345000123456` does not appear anywhere in the
  AX tree, and the "Re-enter the full 14-digit number" fix text under the field is not exposed.
- A **screen-reader** user therefore hears: "Library card number, edit, invalid data, 2134-5000-
  1234 … This card number was not accepted," then a "Need help with your card number?" button that,
  when activated, says only "Check your card and try again." At no point are they told the number is
  14 digits, has no spaces/hyphens, or shown the example. The known correction exists but is not
  provided to them.
- A **sighted** user, by contrast, reads the blue callout immediately and knows exactly how to fix
  the entry. The two user classes receive materially different information; the suggestion is
  provided to one and withheld from the other.

## Expected ACT-style outcome
**failed** — A correct, knowable suggestion for the input error is rendered on the page, but it is
placed inside an `aria-hidden="true"` container and is not referenced by the field's
`aria-describedby`, so it is not present in the accessibility tree and is not provided to assistive-
technology users. Because the suggestion is not "provided to the user" for that class of users
(while sighted users get it), the page fails SC 3.3.3. (Error *identification* is separately
satisfied, so this isolates the 3.3.3 question, not 3.3.1.)

## Why automated tools miss it
`aria-hidden="true"` on a presentational-looking `<div>` is valid and ubiquitous; axe, WAVE, and
Lighthouse never flag it, and they have no concept that *this particular* hidden text is the only
correction suggestion on the page. Every structural check passes: the field has a real `<label>`
and programmatic name, it carries `aria-invalid`, and it has an AT-exposed error message via
`aria-describedby`. Deciding that the *suggestion* — as distinct from the bare error — is the thing
withheld from AT requires reading the page semantically: identifying which on-screen text is the
correction, confirming it is the only such text, and recognizing that `aria-hidden` plus a
describedby that omits it leaves AT users with no path to it. That is a human semantic/contextual
judgment over what each user class actually receives, not a pattern a scanner matches.

## Citation
- **Reference:** WCAG 2.2 Understanding Error Suggestion, Intent —
  `wcag-understanding/error-suggestion.html`
  > "The intent of this success criterion is to ensure that users receive appropriate suggestions
  > for correction of an input error if it is possible."
- **Reference:** WCAG 2.2 Understanding Error Suggestion, Benefits —
  `wcag-understanding/error-suggestion.html`
  > "Users who are blind or have impaired vision understand more easily the nature of the
  > input error and how to correct it."
- **Reference:** WCAG 2.2 Technique G177 — Providing suggested correction text —
  `wcag-techniques/general/G177.html`
  > "The objective of this technique is to suggest correct text where the information supplied by
  > the user is not accepted and possible correct text is known."
