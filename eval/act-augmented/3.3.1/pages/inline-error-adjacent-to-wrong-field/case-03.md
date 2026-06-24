# case-03 — Two legs labelled "Travel date": generic error painted under the valid leg

## Scenario
An airline (Aerolinks) round-trip itinerary confirmation. Two `<fieldset>` legs — **Outbound
flight** and **Return flight** — each contain a date input whose visible label is the
**identical** text "Travel date". The outbound date `2026-07-14` (next month) is valid; the
return date `2025-03-02` (last year) is in the past and is the real error. A single inline
error, the label-only string **"Travel date is invalid."**, is rendered in the message slot
under the **Outbound** input (which also carries the red `.flagged` border). The Return leg —
the one actually in error — has an empty message slot. No `aria-describedby` / `for`/`id`
error linkage exists.

## Attribute tuple + developer persona
- **content-domain:** travel / airline booking
- **UI-component/pattern:** repeated `<fieldset>`/`<legend>` legs with a per-leg date input
  whose label text is duplicated across legs
- **host-language construct:** two fieldsets, each a flex `.leg` with `label` + `input` +
  a reserved `.msg` slot; native HTML, no JS framework
- **locale/i18n:** en-US, ISO date strings
- **failure-mechanism:** the visible label collides across legs ("Travel date" twice), so the
  generic label-only error text cannot identify a single leg; and the message is rendered
  under the wrong (valid) leg, so presentation points at the wrong target too
- **persona:** A developer reused one `.leg` partial for both flights, keeping the same label
  "Travel date" in each. The validation map keys errors by leg id, but the render helper
  appends the message into the *first empty* `.msg` slot while walking the form top-to-bottom.
  With the return date invalid, the return-leg error lands in the outbound slot. Demoed with
  two future dates, the misplacement never surfaced.

## Element / selector carrying the issue
`fieldset:first-of-type .msg` — the `<div class="msg">Travel date is invalid.</div>` rendered
under `#leg-out` (the **valid** outbound input, also wrongly `.flagged`), while the leg
actually in error is `#leg-ret` (return, `2025-03-02`), whose `.msg` slot is empty.

## Exact accessibility mechanism (what AT experiences / why it fails)
- **Through text fails (ambiguity):** the error string is label-only — "Travel date is
  invalid." Because *both* legs are labelled "Travel date", the text cannot disambiguate which
  control is meant. Reading the message alone, a user cannot tell whether outbound or return
  is in error. (This mirrors ACT 36b590 Failed Example 5: the same label used in different
  fieldsets defeats identification through text.)
- **Through non-text / presentation fails (wrong target):** the only disambiguating cue —
  which slot the message sits under, plus the red border — points at the **Outbound** leg,
  whose date `2026-07-14` is valid. The leg actually in error (Return, past date) shows no
  message.
- No `aria-describedby`: a screen reader associates the message with neither input, so there
  is no programmatic channel to recover the target either.
- Net: no channel (text, non-text, or presentation) identifies the leg actually in error, and
  presentation actively points at the wrong (valid) leg.

## Expected ACT-style outcome
**failed** — Expectation 1 of 36b590 is a disjunction (text OR non-text OR presentation), and
here **every** branch fails: the label-only text is ambiguous between two identically-labelled
legs, and presentation/proximity identifies the valid outbound leg rather than the invalid
return leg. The item that is in error is therefore not identified.

## Why automated tools miss it
The message is non-empty, visible, in the accessibility tree, and "describes" a cause; there
is no `aria-describedby` to flag and both inputs have proper labels. A scanner cannot tell
that the two visible labels collide ("Travel date" twice), cannot read that the lone message
sits under the valid leg, and cannot know that `2025-03-02` (not `2026-07-14`) is the
out-of-range date. Catching it requires a human to read the legend context, compute which leg
the message visually adjoins, and judge which date is actually invalid — a semantic + spatial
judgment no static scanner performs.

## Citation
- **Reference:** ACT Rule 36b590, Expectation 1 — `act-rules/extracted/36b590.md`
  > "Each test target either has no form field error indicators , or at least one of the form field error indicators allows the identification of the related test target, through text , or through non-text content , or through presentation ."
- **Reference:** ACT Rule 36b590, Failed Example 5 (same label in different fieldsets defeats
  identification) — `act-rules/extracted/36b590.md`
  > "These multiple input elements share a form field error indicator . The message describes the cause of the error but does not allow to identify the elements that caused the error because the same label is used in different fieldset s."
