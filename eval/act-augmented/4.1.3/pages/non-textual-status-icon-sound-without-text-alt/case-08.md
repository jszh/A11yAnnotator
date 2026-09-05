# case-08 — paired PASS repair of case-02

## Scenario and source pair

The complete LearnHub assignment uploader, animated spinner, green check, file metadata, and pre-existing atomic status region are preserved from the failed source.

**Paired failed source:** `case-02.html`

**Balance batch:** `gena11y-fp-50-v2`

**Hard-negative type:** `redundant-graphic-or-visual-cue`

## Exact counterfactual repair

Changed the dynamically inserted images’ empty alternatives to meaningful upload-state messages. The busy guard now uses `aria-disabled="true"` instead of disabling the focused submit button, preventing repeat activation without removing focus or the button from the accessibility tree. Visual graphics and timing remain unchanged.

## Primary selector

`#uStatus[role="status"]`

## Accessibility mechanism

Clicking `#submitBtn` leaves focus safely on that button. The existing live region announces “Uploading lab-report-4-mwong.pdf” immediately and then “Upload complete for lab-report-4-mwong.pdf” after 1.8 seconds when the same spinner and check images are inserted.

## Expected ACT-style outcome

**passed** — SC 4.1.3

## Why this is a hard negative

The rendered status graphics remain visually identical to the failed source. Correct evaluation requires clicking Submit, observing both timed mutations in the pre-existing live region, using each image alternative, and confirming focus is not stranded by the busy-state guard.

## Citation

> **wcag-understanding/status-messages.html:**
> “Where an icon or sound indicates a status message, this information will be surfaced by the screen reader through a combination of two things: 1) existing WCAG requirements governing text alternatives (under Success Criterion 1.1.1 Non-Text Content), and 2) the requirement of this current success criterion to supply an appropriate role.”
