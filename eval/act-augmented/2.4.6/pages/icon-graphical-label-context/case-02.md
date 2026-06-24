# case-02 — Webmail compose: floppy-disk glyph button accessibly named "Send message"

## Scenario
A webmail compose window ("Parcel Mail → New message") has a footer action bar. The primary
blue button carries `aria-label="Send message"` and `type="submit"`, and clicking it sends the
email. Its only visible label, however, is an inline **floppy-disk** SVG — the near-universal
"Save"/"Save draft" glyph. A mouse user scanning the bar by icon reads the floppy disk as "save a
draft" and may click it expecting to save, only to dispatch the message. The glyph (floppy = save)
contradicts the control's actual function (send).

## Attribute tuple
- **content-domain:** email client / webmail compose
- **UI-component/pattern:** form submit button in a compose action bar (icon-only primary action)
- **host-language construct:** `<button type="submit" aria-label="Send message"><svg aria-hidden="true">…floppy…</svg></button>`
- **locale/i18n:** en-US
- **failure-mechanism:** glyph and function disagree — the commonly-understood "save" icon labels a "send" action

## Developer persona
A junior developer building the compose UI grabbed the first "primary action" icon from an icon
font sheet that listed it under `icon-disk`, thinking it just meant "the main blue button." They
wired it to submit/send and set `aria-label="Send message"` to satisfy the lint rule. The design
review focused on color and spacing; nobody flagged that the floppy disk reads as "save," because
the automated a11y gate was green.

## Element / selector carrying the issue
- `button.send[aria-label="Send message"]` — `type="submit"`; renders a floppy-disk SVG; submitting the form sends the email.

## Exact accessibility mechanism
The button is exposed with role `button` and accessible name "Send message" (from `aria-label`;
the floppy-disk SVG is `aria-hidden="true"`). A screen-reader user is told "Send message," which is
correct — but a sighted user (including low-vision users who navigate by recognising icon shapes,
and screen-magnifier users who see the glyph before any tooltip) is shown a floppy disk, the
commonly-understood cue for *save*, not *send*. The graphical label is therefore not a
commonly-understood cue for the control's real function. 2.4.6's label limb (which TT 5.B states
applies to graphical labels) fails; name presence (4.1.2) passes.

## Expected ACT-style outcome
**failed** (SC 2.4.6 Headings and Labels — label limb, TT 5.B). A name exists, so name-presence
checks pass; the *graphical* label is not descriptive of the function for users who read the icon.

## Why automated tools miss it
axe-core (`button-name`), WAVE, and Lighthouse confirm only that the submit button has a non-empty
accessible name — "Send message" satisfies that. None render the inline SVG to recognise it as a
floppy disk, and none possess a model of "floppy disk conventionally means save, not send." The
defect is a visual-semantic mismatch between a commonly-understood glyph and the action it labels,
detectable only by a human who sees the icon and knows the convention.

## Citation
> **Reference:** WCAG 2.2 Understanding — Headings and Labels (`wcag-understanding/headings-and-labels.html`)
>
> **Quote (verbatim):** "Labels of form controls are usually text-based. In some cases, images can serve as descriptive labels without additional text. In these cases, authors should ensure that the image and its use as a label (in context) are widely understood."
>
> **Reference:** Trusted Tester v5.1.3 — SC 2.4.6, Test 5.B (`refs/trusted-tester/sc-2.4.6-headings-and-labels.md`)
>
> **Quote (verbatim):** "The label or instruction can be graphical or textual."
