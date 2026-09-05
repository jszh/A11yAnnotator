# case-09 — paired PASS repair of case-05

## Scenario and source pair

The complete Banco Aurora verification flow, six filled code inputs, green check SVG, and pre-existing live-region container are preserved from the failed source.

**Paired failed source:** `case-05.html`

**Balance batch:** `gena11y-fp-50-v2`

**Hard-negative type:** `residual-cue-tunnel-vision`

## Exact counterfactual repair

Changed the injected SVG’s generic `aria-label="check"` to a Spanish success message. Because successful verification is routine, non-urgent feedback, changed the pre-existing container from assertive delivery to `role="status"` with `aria-live="polite"`. The visible icon, color, and submit behavior are unchanged.

## Primary selector

`#otpResult[role="status"][aria-live="polite"]`

## Accessibility mechanism

Submitting `#otpForm` inserts a graphic named “Código verificado. Inicio de sesión completado.” into the already-present polite status region. The non-textual routine-success result is therefore programmatically determinable and announced without an unnecessary assertive interruption.

## Expected ACT-style outcome

**passed** — SC 4.1.3

## Why this is a hard negative

The screen still shows only a green check and retains the failed source’s submit interaction. An evaluator that fixates on the residual icon can miss both the repaired accessible name and the appropriate polite status semantics; the result must be observed after submission.

## Citation

> **wcag-understanding/status-messages.html:**
> “Where an icon or sound indicates a status message, this information will be surfaced by the screen reader through a combination of two things: 1) existing WCAG requirements governing text alternatives (under Success Criterion 1.1.1 Non-Text Content), and 2) the requirement of this current success criterion to supply an appropriate role.”
