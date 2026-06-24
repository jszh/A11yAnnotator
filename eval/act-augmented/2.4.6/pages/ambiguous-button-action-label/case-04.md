# case-04 — Primary "Click here" button on a tax-form download page conveys no function

## Scenario
An official Cedar County Department of Revenue page for "Form RT-1: Annual Resident
Tax Return." The page describes the fillable PDF and shows a file row
("RT-1_2025_fillable.pdf · 412 KB"). The single primary call-to-action button reads
**"Click here"** — a pure interaction instruction that says nothing about what the
control does. The function (download the RT-1 tax-return PDF) appears only in the
surrounding prose and the file row, never in the button's own label.

## Attribute tuple
- **content-domain:** government / civic services portal (county tax)
- **UI-component / pattern:** single primary call-to-action button (download trigger)
- **host-language construct:** native `<button type="button">` with text "Click here"
- **locale / i18n:** en-US
- **failure-mechanism:** generic interaction-instruction label with zero function cue ("Click here") — present and grammatical but conveys no action and no object

## Developer persona
A county web team migrated the old tax-forms page into a new template. The legacy
page had an underlined "click here" link, and the content author pasted the same
phrasing into the new template's button widget because "that's what it always said
and people are used to it." The author treated the button as decoration around the
link and assumed the heading and paragraph above it explained everything, so the
button label was never revisited.

## Element / selector carrying the issue
`.cta-wrap > button.cta` — the page's primary action button with accessible name
**"Click here"**, which downloads Form RT-1.

## Exact accessibility mechanism (what AT experiences, why it fails)
- **Sighted user:** reads the heading "Form RT-1," the description, and the file row,
  then sees one obvious blue button — the surrounding context supplies the function
  visually, even though the button itself does not.
- **Screen-reader user (buttons list / rotor):** hears "Click here, button" with no
  indication that activating it downloads a 412 KB tax-return PDF. "Click here" is an
  instruction about *how* to interact, not *what* the control does; out of the
  reading flow it is meaningless. The prose that supplies the function is not part of
  the accessible name.
- **Function judgment:** TT 5.B requires the visible button label to make its
  function clear. "Click here" is the canonical example of a label that names no
  function and no object; it fails for any AT user navigating controls directly.

## Expected ACT-style outcome
**failed** (SC 2.4.6, TT 5.B button-function prong / G131). The label is present and
well-formed but communicates no function.

## Why automated tools miss it
- The button has a non-empty accessible name and valid role, so `button-name`, WAVE,
  and Lighthouse pass; "Click here" is grammatical text, so there is no empty-label
  rule to trip.
- Some tools heuristically warn on the literal string "click here" *for links*, but
  this is a `<button>`, and even when warned the tool cannot judge whether the
  surrounding heading/file-row makes the function clear — only that the string is
  generic.
- Deciding that "Click here" fails to convey the *download-the-RT-1-PDF* function
  (versus an adequate "Download Form RT-1 (PDF)") is a semantic reading of label vs.
  purpose that no static check performs.

## Citation
> "Each visual button label is sufficiently clear and descriptive, so users know its function."
— refs/trusted-tester/sc-2.4.6-headings-and-labels.md (Test 5.B — Evaluate Results, point 2)

> "This success criterion does not require the use of labels; however, it does require that if labels are present, they must be accurate and sufficiently clear or descriptive."
— wcag-understanding/headings-and-labels.html (Intent of Headings and Labels)
