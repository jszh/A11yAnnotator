# case-02 — Two adjacent settings inputs cued by near-identical cog glyphs

## Scenario
The "Pulsegrid Analytics" workspace *Settings* page has a "Data pipeline" fieldset with two stacked
inputs. Each input's only visible cue is a small cog/gear glyph in a 34px tile to its left. The two
cogs are visually almost indistinguishable (the second is the same 8-tooth cog rotated ~22°). The
first field expects a refresh interval in seconds; the second expects a retention window in days.
Because both cues read as "a gear" — the generic *settings* metaphor — neither field's purpose is
visually distinguishable from the other.

## Attribute tuple
- **content-domain:** SaaS analytics dashboard
- **UI-component/pattern:** `fieldset`/`legend` group of icon-prefixed inputs (dark-theme admin form)
- **host-language construct:** two `<input aria-label="…">` each preceded by an `aria-hidden` cog `<svg>`; SVGs differ only by a 22° rotation
- **locale/i18n:** en-US
- **failure-mechanism:** two icon-only labels that are mutually indistinguishable, so the visible cues fail to differentiate the fields

## Developer persona
A platform engineer themed an internal admin template that ships "every input gets a leading icon."
The icon picker only had a generic gear, so they reused it for both pipeline fields and nudged the
second one's rotation "so they're not literally identical." They satisfied the lint rule with
`aria-label`s and moved on, not realising that at 19px the two cogs look the same and give a sighted
user no way to tell which field is seconds vs days.

## Element / selector carrying the issue
- `input[aria-label="Refresh interval in seconds"]` and `input[aria-label="Retention window in days"]`,
  each cued solely by an adjacent `span.cog > svg` (both `aria-hidden="true"`).

## Exact accessibility mechanism
Each input is exposed with role `textbox` and a distinct accessible name from its `aria-label`
("Refresh interval in seconds" / "Retention window in days"), so a screen-reader user can tell them
apart and 4.1.2 passes. A sighted user, however, sees two near-identical cog glyphs and a single
group legend ("Data pipeline") that names neither field. No visible text distinguishes the two
inputs, so the visible labels are not adequate to tell a sighted user what each field expects — a
3.3.2 visible-cue-adequacy failure driven by image labels (gears) that are not understood for the
specific purposes and are not even distinguishable from each other.

## Expected ACT-style outcome
**failed** (SC 3.3.2 Labels or Instructions — visible-cue-adequacy limb). The fields have programmatic
names (4.1.2 passes) and are grouped by a legend, but the only per-field visible cue is an
indistinguishable gear glyph.

## Why automated tools miss it
axe-core's `label` rule is satisfied because each input has an `aria-label`, and both glyphs are
`aria-hidden="true"`. No automated tool renders the two cog SVGs to discover they are visually
indistinguishable, and none can reason that a sighted user therefore cannot tell the "refresh
interval" field from the "retention window" field. Judging glyph distinguishability and whether a
gear communicates a specific field purpose is a human visual + semantic task.

## Citation
> **Reference:** WCAG 2.2 Understanding — Labels or Instructions (`wcag-understanding/labels-or-instructions.html`)
>
> **Quote (verbatim):** "The intent of this success criterion is to have content authors present instructions or labels that identify the controls in a form so that users know what input data is expected."
>
> **Reference:** Trusted Tester v5.1.3 — SC 3.3.2, Test 5.A Notes (`refs/trusted-tester/sc-3.3.2-labels-or-instructions.md`)
>
> **Quote (verbatim):** "The label or instruction can be **graphical or textual**."
