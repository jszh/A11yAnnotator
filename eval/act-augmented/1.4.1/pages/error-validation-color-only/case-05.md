# case-05 — Gov benefits form: red border PLUS aria-invalid="true", no visible text (AT-decoupling trap)

## Scenario
A state SNAP-renewal wizard (Step 2 of 4) in its **post-submit error state**. The "Number of children" field failed (left blank). It is given a **red 2px border** AND `aria-invalid="true"` — but there is **no visible error message, no icon, no "(error)" marker** anywhere near it. A generic banner ("We found a problem with your submission.") appears but does not name the field. This is the deliberate **AT-decoupling** teaching case: programmatic exposure via `aria-invalid` does NOT satisfy 1.4.1, which requires a *visible* alternative to color for sighted users who cannot distinguish colors and are not using assistive technology. So despite the "correct-looking" ARIA, the page still fails 1.4.1 because the only **visible** per-field cue is the red hue.

## Attribute tuple
- **content-domain:** government / civic services benefits portal
- **UI-component / pattern:** multi-step (wizard) form, post-submit validation
- **host-language construct:** `<input aria-invalid="true">` with the red border driven by an `[aria-invalid="true"]` CSS selector; no associated error-message element (no `aria-errormessage`, no visible text)
- **locale / i18n:** en-US
- **failure-mechanism:** F81 + AT-decoupling — error field marked by color only *visibly*; `aria-invalid` is a programmatic (4.1.2/3.3.1) channel that does not provide the visible non-color cue 1.4.1 demands

## Developer persona
A government-contractor developer was told to "make the form accessible" and learned that errored inputs should have `aria-invalid="true"`. They added it conscientiously and styled the invalid state red via the attribute selector — believing the ARIA *was* the accessibility fix. They never added a visible message, assuming `aria-invalid` covered the requirement. axe even runs clean, reinforcing the misconception.

## Element / selector carrying the issue
`#children[aria-invalid="true"]` — the only visible distinction from valid fields is `border-color:#d11f1f` (red). `aria-invalid="true"` is programmatic-only and does not constitute a visible non-color cue.

## Exact accessibility mechanism (what AT experiences / why it fails)
- **Sighted, full-color user:** sees the red-bordered children field and fixes it.
- **Sighted color-blind / low-vision user, NOT using AT (mouse user):** sees three identical-looking number fields; the red border reads as just another border. `aria-invalid` is invisible to them — it is exposed only through AT they are not running. They get no visible signal which field failed. **This is the population 1.4.1 protects, and the page fails them.**
- **Screen-reader user:** *does* hear "invalid entry" on the children field (because `aria-invalid="true"` is exposed) — which is precisely why the page can look "handled." But 1.4.1 is explicitly *not* about AT users; per the Understanding note, conveying the info to AT "does not necessarily pass this criterion … This criterion requires a visible alternative to color." So the AT success does not rescue 1.4.1.

## Expected ACT-style outcome
**failed** (SC 1.4.1 — F81 with AT-decoupling: the error is visibly conveyed by color alone; `aria-invalid` is programmatic exposure that does not satisfy the visible-alternative requirement).

## Why automated tools miss it
This markup is the kind axe/WAVE/Lighthouse *reward*: a labeled input carrying `aria-invalid="true"` looks like a properly flagged error, so tools report no issue — the ARIA actively reassures them. None of them evaluate whether a **visible**, non-color error cue exists for a non-AT color-blind user, and none encode the principle that programmatic exposure does not satisfy 1.4.1. Recognizing the decoupling — that `aria-invalid` answers 4.1.2/3.3.1 but the visible-alternative gap remains — is a human judgment requiring the AT-decoupling note.

## Citation
> "Conversely, even if information that is conveyed by color differences is appropriately conveyed to assistive technologies, it does not necessarily pass this criterion, as sighted users who cannot distinguish between certain color may not necessarily be using any assistive technologies. This criterion requires a visible alternative to color."
— wcag-understanding/use-of-color.html (Intent, note)

> "This criterion does not directly address the needs of users with assistive technologies. It aims to ensure that sighted users who cannot distinguish between some colors can still understand content."
— wcag-understanding/use-of-color.html (Intent, note)

> "An error indicator cannot use color alone as an indicator."
— refs/trusted-tester/sc-1.4.1-use-of-color.md (Notes)
