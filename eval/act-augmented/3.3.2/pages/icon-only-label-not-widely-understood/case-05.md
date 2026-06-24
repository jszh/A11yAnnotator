# case-05 — Reservation field cued only by a clock-face glyph that actually expects party size

## Scenario
"Trattoria Lume" has a *Reserve a table* form. It has clean text-labeled "Date" and "Time" rows
(Time being a `<select>`). A third row has NO text label — its only visible cue is a clock-face glyph
in a 40px tile. A clock universally reads as "time," and a Time field already exists above it, so a
sighted user naturally reads this as another time input. But the field actually expects the NUMBER OF
GUESTS in the party. The glyph's conventional meaning directly contradicts the field's real purpose.

## Attribute tuple
- **content-domain:** restaurant reservations / booking
- **UI-component/pattern:** booking form mixing text-labeled rows with one icon-only glyph row
- **host-language construct:** `<span aria-hidden="true"><svg>…clock…</svg></span>` beside `<input aria-label="Number of guests">`; a real `<select id="rtime">` "Time" sits directly above
- **locale/i18n:** en-US
- **failure-mechanism:** misleading icon-only label — a clock glyph (meaning "time") used for a "party size" field, with an actual Time control nearby compounding the confusion

## Developer persona
A restaurant owner used a drag-and-drop site builder and dropped an emoji-flavoured "clock" icon next
to the guests field because the booking demo content had a clock there and "it looked friendly."
The builder auto-generated an `aria-label="Number of guests"` from the field's internal name, so the
accessibility scan stayed green — but visually the field now reads as a duplicate time picker.

## Element / selector carrying the issue
- `input[aria-label="Number of guests"]` inside `.glyphline` — its only visible cue is the preceding
  `span.clock > svg` clock face (`aria-hidden="true"`), positioned just under the real "Time" select.

## Exact accessibility mechanism
The input is exposed with accessible name "Number of guests" (from `aria-label`; the clock SVG is
`aria-hidden`), so a screen-reader user is told correctly and 4.1.2 passes. A sighted user sees only
a clock glyph, with no text, immediately below a labeled "Time" select — the visible cue conventionally
means "time" and actively misleads them about the field's purpose (party size). The visible label is
therefore both not widely understood for this purpose and affirmatively misleading, failing the
3.3.2 image-label limb even though the programmatic name is correct.

## Expected ACT-style outcome
**failed** (SC 3.3.2 Labels or Instructions — visible-cue-adequacy limb). Programmatic name is correct
(4.1.2 passes), yet the only visible cue is a clock glyph that misrepresents the field as a time input.

## Why automated tools miss it
axe-core / Lighthouse confirm the input has an accessible name and the clock SVG is `aria-hidden`, so
no label violation is flagged. No scanner rasterises the glyph to recognise a clock face, knows that a
clock conventionally signals "time," or notices that a real "Time" select sits directly above —
contextual facts that make the glyph misleading. Detecting that the visible cue misleads a sighted
user is an irreducibly human visual + contextual judgment.

## Citation
> **Reference:** WCAG 2.2 Understanding — Labels or Instructions (`wcag-understanding/labels-or-instructions.html`)
>
> **Quote (verbatim):** "The goal is to make certain that enough information is provided for the user to accomplish the task without undue confusion or navigation."
>
> **Reference:** WCAG 2.2 Understanding — Labels or Instructions (`wcag-understanding/labels-or-instructions.html`)
>
> **Quote (verbatim):** "Using images as labels meets the requirements of the criterion, but care should be taken to ensure that the images are widely understood by the intended target audience. Authors may consider providing additional hints, such as text-based tooltips or supplementary text, to support clarity when using image-based labels."
