# case-04 — Date-of-birth flagged by an empty-alt warning-triangle icon; no format-correction text

## Scenario
A healthcare patient-registration wizard (step 2 of 4), re-rendered after the patient entered
their birth date as **`7 Mar 1981`** when the system requires **MM/DD/YYYY**. The server flagged
the field by (a) revealing a red warning-triangle SVG beside the label and (b) giving the input a
red border + pink fill. The icon's `aria-label` is empty and it is `aria-hidden="true"`, so it is
decorative to AT — the visual triangle is the entire error cue and it carries **no** format
guidance. The correction is fully knowable ("enter MM/DD/YYYY, e.g. 03/07/1981") but appears
nowhere in text. Tellingly, the *other* rows (phone, MRN) keep their format `.hint`, so only the
errored row has lost its guidance.

## Attribute tuple
- **content-domain:** healthcare / patient portal registration
- **UI-component/pattern:** multi-step wizard form with inline SVG status icon beside a field label
- **host-language construct:** inline `<svg role="img" aria-label="" aria-hidden="true">` warning triangle + red field styling
- **locale/i18n:** en-US (MM/DD/YYYY)
- **failure-mechanism:** detected format error with a knowable correction, signalled only by an icon swap + colour whose text alternative is intentionally empty; G84 "in text" suggestion limb

## Developer persona
A health-IT contractor themed a vendor form kit. An earlier audit had dinged him for an error
icon that announced as "warning warning warning" on every invalid field, cluttering the screen
reader. His fix was to set the icon's `aria-label=""` and `aria-hidden="true"` — silencing it
entirely — which he considered "decorative, the message covers it." But the validation layer he
inherited renders the inline message into a tooltip on hover only (stripped from this server
render), so on the post-submit page the icon and red border are all that remain. He didn't notice
the errored row, unlike its neighbours, now shows no format hint at all.

## Element / selector carrying the issue
`.row.invalid` wrapping `input#dob` (value `7 Mar 1981`), with `svg.warn[aria-hidden="true"]`
[empty `aria-label`]. The icon + red border are the sole error indicators; no text states the
required format. By contrast `#phone` and `#mrn` each have a visible `.hint`.

## Exact accessibility mechanism (what AT experiences, why it fails)
A screen-reader user tabbing to the date field hears "Date of birth, edit, 7 Mar 1981" — with no
warning, because the triangle is `aria-hidden="true"` with an empty `aria-label` and the input is
plain `type="text"` with a well-formed value, so `validity.valid` is `true`, the accessibility
tree reports `invalid:false`, and there is no `aria-invalid`. The field is announced identically
to a valid one. Even a sighted user gets only the red triangle and red box — a generic "something
is wrong here" — with **no statement of the required MM/DD/YYYY format**, even though every other
field on the form carries a format hint. The suggested correction is knowable and the page already
demonstrates the pattern (the hints) it withheld from the errored field, yet that correction is
conveyed through an icon and colour, which G84 explicitly says is insufficient.

## Expected ACT-style outcome
**failed** — a format error was detected with a knowable correction, but it is signalled only by
an (AT-silent) icon and colour, with no text suggestion of the correct format.

## Why automated tools miss it
- The warning icon is *correctly* hidden from AT (`aria-hidden="true"`, empty `aria-label`,
  `focusable="false"`) — valid decorative markup. There is no missing-`alt`/empty-name defect; a
  scanner is happy the icon is hidden. (Flagging it would be a false positive.)
- The input is `type="text"` with a well-formed value, so `validity.valid === true`, the
  accessibility tree shows `invalid:false`, and there is no `aria-invalid` to detect.
- No tool can know the required format is MM/DD/YYYY or that the icon/colour is the only error
  carrier. Recognising that the *format-correction text* is the missing element requires reading
  the page, noticing the sibling rows have hints while the errored one does not, and judging the
  meaning — human semantic/visual reasoning.

## Citation
> **WCAG Technique G84 (Providing a text description when the user provides information that is
> not in the list of allowed values), Description:** "The 'in text' portion of the success
> criterion underscores that it is not sufficient simply to indicate that a field has an error by
> putting an asterisk on its label or turning the label red. A text description of the problem
> should be provided."
>
> Source file: `wcag-techniques/general/G84.html`
