# case-06 — TRUE NEGATIVE: green "Go" / red "Cancel" buttons with instructions naming the labels

## Scenario
An online-tuition "Confirm enrolment" step shows two action buttons: a green button labelled
**Go** (confirm and charge) and a red button labelled **Cancel** (discard and return). The
convention is green-advances / red-cancels, but colour is redundant — each button carries
distinguishing visible, programmatic text, and the instructions name the labelled buttons
("Press the button labelled **Go** … Press **Cancel** to discard"). This is the canonical
G14 sufficient pattern, so it PASSES and must not be flagged.

## Attribute tuple
- **content-domain:** higher-ed / online tuition (enrolment confirmation)
- **UI-component/pattern:** paired action buttons (form submit pair)
- **host-language construct:** `<button>Go</button>` (submit) + `<button>Cancel</button>`, colour + text
- **locale/i18n:** en-GB
- **failure-mechanism:** none — included as the passing boundary for case-01's failing green/red "Submit"/"Submit" pair

## Developer persona
The same kind of agency dev as case-01, but here following the design system correctly: the
"primary/danger" tokens were given real action labels ("Go"/"Cancel") and the help copy was
written to reference those labels, not the colours. The result is robust to colour blindness
and grayscale.

## Element / selector carrying the issue
None (boundary case). The relevant controls are `button.btn--go` (text "Go") and
`button.btn--cancel` (text "Cancel").

## Exact accessibility mechanism
A user who cannot perceive the green/red hues still reads "Go" and "Cancel" on the buttons
and in the instructions, so the action of each control is fully conveyed by text. A
screen-reader user hears "Go button" / "Cancel button" — distinct, correct accessible
names. In grayscale the actions remain unambiguous from the labels. Colour is decorative
reinforcement, not the sole carrier.

## Expected ACT-style outcome
**passed** — the action conveyed by colour is also conveyed in the text of each control and
in the instructions (G14 satisfied); colour is not the only visual means.

## Why automated tools miss it
A naive tool can't *confirm* a pass here either — it cannot reason that the colour
convention is backed by adequate text. But there is genuinely no defect; this case exists to
verify the evaluator distinguishes a real G14-compliant pattern from the failing case-01,
which is structurally near-identical (two coloured action buttons + a prose convention) but
labels both buttons "Submit."

## Citation
> **WCAG Technique G14 (Understanding 1.4.1 / G14.html — "A form with a green submit button"):**
> "An on-line loan application explains that green buttons advance in the process and red
> buttons cancel the process. A form contains a green button containing the text *Go*. The
> instructions say 'Press the button labeled *Go* to submit your results and proceed to the
> next step.'"

This page matches that sufficient example: the green/red action is reinforced by the visible
button text "Go" / "Cancel" and by instructions that reference those labels.
