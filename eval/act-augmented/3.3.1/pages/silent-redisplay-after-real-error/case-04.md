# case-04 — Donation bounced (amount $0.00 below minimum, required frequency unselected) under a warm "Thank you for your generosity" banner

## Scenario
A Brightwater Rivers Trust donation page. The supporter pressed "Give now" with the **amount = $0.00**
(the page states the minimum gift is $5) and **no frequency radio selected** (a required group). The
payment processor rejected the gift and the form returned with the bad amount retained and the radio
group still empty — under a warm banner: **"Thank you for your generosity — Every gift helps us keep
our rivers clean."** The banner reads as if the donation succeeded; no error text appears, and the
required radio group shows no selection and no flag. Variant B of the aspect, with a second omitted
required field (the radio group) deepening the failure.

## Attribute tuple
- **content-domain:** nonprofit / donation flow
- **UI-component/pattern:** `<fieldset><legend>` required radio group + currency input, under a neutral/success banner
- **host-language construct:** native radio group with no `checked` radio + text amount input with retained `value="0.00"`
- **locale/i18n:** en (USD)
- **failure-mechanism:** mismatched warm/success message over a rejected submission with an out-of-range amount and an unselected required group

## Developer persona
A campaign marketer assembled the donation page in a fundraising CMS (think Classy/Donorbox-style
templates). The CMS shows a "post-donation thank-you message" block that the marketer filled with
warm copy, assuming it only renders after a successful charge. But the template prints the thank-you
block on the donation page whenever the page re-loads, including the processor's "declined / amount
too low" bounce. The marketer never wrote any error copy because they didn't know the form could
fail — and never tested giving $0 with a screen reader.

## Element / selector carrying the issue
`div.thanks` (the false "Thank you for your generosity" message) combined with
`input#amount[value="0.00"]` (below the stated $5 minimum) and `fieldset > [name="freq"]` (a required
radio group with **nothing checked**). The radio group's empty state is a legal DOM state; the
banner is valid text. The failure is the missing error description on a bounced submission.

## Exact accessibility mechanism (what AT experiences, why it fails)
Two input errors were automatically detected — the amount is below the minimum and the required
frequency is omitted. 3.3.1 requires both be described to the user in text. Instead the only status
message is "Thank you for your generosity," which a screen-reader user hears as confirmation their
gift went through. Tabbing the form, AT encounters a radio group ("How often?, required") with no
selection but **no announcement that leaving it empty was an error**, and an amount field reading
"0.00" with no indication that is out of range. The errors exist (the server enforced them) but are
described in zero error text — and are actively contradicted by the thank-you banner.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The amount field has a real `<label for>` and a valid value; the frequency choices are a textbook
`<fieldset><legend>` radio group with labelled radios, so axe sees a correctly grouped, correctly
named control. "No radio checked" is a legal state, not a lint error. The thank-you banner is valid
visible text. There is no error markup to flag. A scanner cannot know the gift was declined, that
$0.00 is below the stated minimum, or that the empty required group is an error in this context —
that requires reading the page-state meaning, human judgment.

## Citation
> **WCAG 2.2 Understanding 3.3.1 (Intent), `wcag-understanding/error-identification.html`:**
> "An 'input error' includes: information that is required by the web page but omitted by the user,
> or information that is provided by the user but that falls outside the required data format or
> allowed values."

> **WCAG Technique G83 (Description), `wcag-techniques/general/G83.html`:**
> "The best practice is to include a message or alert, as some users may not be aware that an error
> has occurred and could assume that the form is not functioning correctly."

(Both an omitted required field — the frequency group — and an out-of-allowed-range value — the $0.00
amount — are present; neither is described in text, and the warm banner makes the user assume the
gift succeeded.)
