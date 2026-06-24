# case-07 — CONTROL: same red-bordered email field WITH an adjacent text message (should pass)

## Scenario
An auction house's "place a bid" form. The email field carries the **identical** red 2px border
and red tint used in the failing cases — but here the error is also **identified and described in
text**: a visible message "Email address is not valid." sits directly beneath the field, is
programmatically tied to it via `aria-describedby="email-err"`, and the field exposes its state
with `aria-invalid="true"`. The decorative triangle inside the message is correctly
`aria-hidden="true"`, so the meaning rides on the text, not the icon. This page exists to test
that the aspect's judgment discriminates "styling + text" (pass) from "styling alone" (fail).

## Attribute tuple
- **content-domain:** auctions / collectibles (online bidding)
- **UI-component/pattern:** form input with an associated inline error message
- **host-language construct:** `input[aria-invalid][aria-describedby]` + visible `<p id>` message
- **locale/i18n:** en-GB (GBP)
- **failure-mechanism:** none — colour/icon used *in addition to* a conforming text description
  (the discrimination boundary)

## Developer persona
A developer who read SC 3.3.1 properly. She kept the eye-catching red styling because colour is a
legitimate *additional* cue, but she also rendered a real error sentence, associated it with
`aria-describedby`, set `aria-invalid="true"`, and hid the now-redundant decorative icon from AT.
This is the correct pattern the failing cases each omit.

## Element / selector carrying the (resolved) issue
`input#email.flagged[aria-invalid="true"][aria-describedby="email-err"]` plus the visible message
`p#email-err` ("Email address is not valid."). The red styling is supplementary; the text is the
primary conveyance.

## Exact accessibility mechanism (what AT experiences, why it passes)
A screen-reader user focusing the field hears "Email address, edit, invalid entry, margaret dot
ellison at, Email address is not valid." — the `aria-describedby` association surfaces the
message and `aria-invalid` surfaces the state. The error is now identified (the email field) and
described (it is not valid) **in text**, exactly as SC 3.3.1 requires. The red border/tint and
the triangle become acceptable *additional* visual indicators (the icon is `aria-hidden`, so it
is not double-announced). A non-visual user gets the same information a sighted user does.

## Expected ACT-style outcome
**passed**

## Why automated tools miss it (i.e. why it still needs the human lane)
Ironically, automated tools cannot reliably distinguish this passing page from the failing ones,
because they never recognised the red styling as an error indicator in the first place. To axe/
WAVE/Lighthouse, case-01 and case-07 look structurally similar (both have valid labels, titles,
contrast); the *presence of a conforming text description* tied to the field is what separates
pass from fail, and confirming a message both exists and actually describes the error is a
semantic check. This control demonstrates that the discriminating signal — "is the error in text,
or is styling the sole cue?" — is exactly the human visual/semantic judgment the aspect targets.

## Citation
> **WCAG 2.2 Understanding 3.3.1 — Intent:** "It is perfectly acceptable to indicate the error in
> other ways such as through the use of an image, color, or other visual indicator, in addition to
> the text description."

(Verbatim from `wcag-understanding/error-identification.html`. This page uses colour + icon *in
addition to* the text description "Email address is not valid.", which is the conforming pattern.)

> **WCAG 2.2 Understanding 3.3.1 — Intent:** 'For instance, "Email is not valid" would pass 3.3.1'

(Verbatim from `wcag-understanding/error-identification.html`. The page's message "Email address
is not valid." is exactly the kind of text the Understanding document states passes SC 3.3.1.)
