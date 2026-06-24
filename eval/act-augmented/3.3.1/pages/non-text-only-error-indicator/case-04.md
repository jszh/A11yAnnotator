# case-04 — Password rejected: red CSS key glyph + red outline + aria-invalid, but NO text reason

## Scenario
A bank's reset-password screen, redisplayed after a failed submit because the chosen password
matched a previously used one (which the bank forbids). The server marked the "New password"
field invalid in two ways: visually, with a red outline and a red **key** glyph drawn via CSS
`::before` (an SVG mask, so the colour is honoured); and programmatically, by setting
`aria-invalid="true"`. Crucially it emitted **no** error text — no message, no
`aria-errormessage`, no `aria-describedby` target, no hint — so nothing in words states that
the password was rejected or why.

## Attribute tuple
- **content-domain:** finance / online banking (password reset)
- **UI-component/pattern:** password field with a leading CSS `::before` icon
- **host-language construct:** `input[type=password][aria-invalid="true"]` + `.pw::before`
  SVG-mask glyph
- **locale/i18n:** en-GB
- **failure-mechanism:** error signalled by a red CSS-generated glyph + red outline; a bare
  `aria-invalid` flags *that* it is invalid but no text describes the error

## Developer persona
A front-end developer added inline validation styling: a red outline and a swapped-to-red key
icon for the invalid state, plus `aria-invalid="true"` because an audit checklist said "set
aria-invalid on errored fields." He treated that checklist item as the whole job and never wired
up the matching `aria-errormessage` or rendered a message string, assuming `aria-invalid` "told
the screen reader everything."

## Element / selector carrying the issue
`div.pw.flagged > input#pw1[aria-invalid="true"]`. The red outline + the red `::before` key
glyph are the only human-readable cue; `aria-invalid="true"` is present but unaccompanied by any
descriptive text.

## Exact accessibility mechanism (what AT experiences, why it fails)
`aria-invalid="true"` causes some AT to append "invalid entry" when the field is focused, but it
carries no *description*: there is no message saying the password may not match a previous one,
and no `aria-errormessage`/`aria-describedby` to read. Many AT/browser pairs announce nothing
extra at all for a static `aria-invalid` set on page load. The red `::before` key is CSS
generated content and never enters the accessibility tree. So a non-visual user learns, at most,
that "something is invalid" with zero indication of *what* — failing SC 3.3.1's requirement that
the error be *described* in text. A sighted user sees the red key + red outline and understands
the password was rejected.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
This is the deceptive variant. Because `aria-invalid="true"` is present, a checker sees a
programmatically-exposed error state and considers error handling "present" — it will not
complain that error handling is *missing*. But `aria-invalid` only conveys *that* the field is
invalid, not *what* the error is; SC 3.3.1 requires the error be **identified and described in
text**. No automated rule verifies that a textual description of the reason exists (and is tied
to the field) — that is a semantic check of meaning. The red key glyph (`::before`) is invisible
to accessibility-tree scans. ACT 36b590 finds no error-describing text to evaluate. Confirming
"the field is flagged invalid but the reason is conveyed only by a red key, never in text" needs
a human to read the rendered page.

## Citation
> **WCAG 2.2 Understanding 3.3.1 — Intent:** "This SC requires that users be provided with
> information about the nature of the error, including the identity of the item in error."

(Verbatim from `wcag-understanding/error-identification.html`. `aria-invalid="true"` identifies
the item but provides no information about the *nature* of the error; the nature is conveyed only
by a red glyph, never in text.)

> **WCAG 2.2 Understanding 3.3.1 — Intent:** "The identification and description of an error can
> be combined with programmatic information that user agents or assistive technologies can use to
> identify an error… This type of programmatic information is not required for this success
> criterion."

(Verbatim from `wcag-understanding/error-identification.html`. Programmatic info such as
`aria-invalid` is explicitly *not sufficient on its own*; it supplements but does not replace the
required text description, which this page lacks.)
