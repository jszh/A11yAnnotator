# case-05 — TRUE-NEGATIVE: red required labels PLUS "(required)" in every label + at-top legend (G205) → PASSES

## Scenario
A course-registration form for "Brightwater College." Required fields are red, **and** every
required `<label>` contains the explicit text cue **"(required)"** (e.g. "Student ID (required)",
"Course code (required)"). An at-top legend states "Required fields are shown in red and marked
with (required)." Colour is therefore *not* the sole means of identifying a required field: the
"(required)" word identifies it for anyone who cannot perceive red, who views the page in
greyscale, or who uses a screen reader (the word is part of each control's accessible name).
`aria-required="true"` is also set, exposing the requirement programmatically. This is the
correct G205 pattern and **passes 1.4.1**.

## Attribute tuple
- **content-domain:** higher-education registrar / course registration
- **UI-component/pattern:** enrolment form with an at-top legend and per-field text cues
- **host-language construct:** `.f.req label` red AND containing literal "(required)" text;
  `aria-required="true"` on the required controls
- **locale/i18n:** en-US
- **failure-mechanism:** NONE — included as a boundary case to confirm the evaluator does not
  reflexively fail any red required cue (G205 satisfied)

## Developer persona
The registrar's web team follows an internal accessibility checklist derived from WCAG technique
G205. Their form component appends "(required)" to the visible label text for any field flagged
required and sets `aria-required`. A designer styled required labels red for quick scanning, but
the team kept the text cue, so the red is purely an *additional* (redundant) signal, not the
only one.

## Element / selector carrying the issue
No issue. The relevant elements are `.f.req label` (Student ID, Course code, Section, Advisor
approval code), each of which renders the visible word "(required)" alongside the red colour.
These should be judged PASS, not flagged.

## Exact accessibility mechanism (what AT experiences, why it passes)
A screen-reader user hears "Student ID (required), required, edit text" — both because the word
"(required)" is in the accessible name and because `aria-required="true"` adds the "required"
state. A sighted colour-blind user reads "(required)" next to each mandatory field and knows it
is required without perceiving the red. In greyscale, the red labels lose their hue but the
"(required)" text remains fully legible, so the required-vs-optional distinction survives.
Because a visible, non-colour textual cue identifies every required field, the use-of-colour is
redundant and the page meets 1.4.1.

## Expected ACT-style outcome
**passed**

## Why automated tools miss it
This case is about a *false positive an over-eager tool or rule would produce*. A naive
heuristic that flags "required labels rendered in red" would wrongly fail this page. Automated
tools generally don't even attempt the use-of-colour judgment, so they neither pass nor fail it
on 1.4.1 grounds — but a human (or an LLM) reasoning about the SC must recognise that the
"(required)" text is a genuine non-colour alternative and therefore *not* flag it. The value of
the case is to verify the evaluator applies the G205 escape correctly rather than failing any
red cue on sight.

## Citation
> **WCAG Techniques, G205 — "Including a text cue for colored form control labels" (Example):**
> "The instructions for an online form say, \"Required fields are shown in red and marked with
> (required).\" The cue \"(required)\" is included within the label element."

(Verbatim from `wcag-techniques/general/G205.html`. This page implements G205 exactly — the same
legend wording and "(required)" inside every required `<label>` — which is sufficient for
1.4.1, so the page passes.)

> **WCAG 2.2 Understanding, Use of Color — Examples (a form that uses color and text):**
> "A form contains both required and optional fields. Instructions at the top of the form
> explain that required fields are labeled with red text and also with an icon. Users who cannot
> perceive the difference between the optional field labels and the red labels for the required
> fields will still be able to see the icon next to the red labels."

(Verbatim from `wcag-understanding/use-of-color.html`. This page provides a non-colour text cue
— the word "(required)" — in place of the icon, so users who cannot perceive red can still
identify required fields; the pattern the Understanding doc endorses as conformant.)
