# case-01 — Label/field misalignment: every input is correctly labelled, but CSS grid paints each label above the WRONG box

## Scenario
A winery's "Reserve a tasting" form lays four text inputs in a 2x2 grid: row 1 captioned `Number of guests` | `Preferred date`, row 2 captioned `Mobile number` | `Party name`. Every `<label>` uses a real `for=` pointing at a real input `id`, and every accessible name is descriptive — there is no missing label, no `title`-only name, no placeholder-as-label. The defect is purely visual/programmatic: labels and inputs are separate grid items, and `grid-column`/`grid-row` repaint the INPUT cells swapped within each row. So the box rendered directly under "Number of guests" is the input whose programmatic label is "Preferred date" (it even shows the `MM / DD / YYYY` placeholder), and the box under "Preferred date" is the guests input; likewise "Mobile number" and "Party name" are visually swapped. The visible label→field relationship and the programmatic label→field relationship directly contradict each other.

## Attribute tuple
- **content-domain:** hospitality / winery reservation
- **UI-component / pattern:** 2x2 labelled text-input grid
- **host-language construct:** correct `<label for>` / `<input id>` pairs whose VISUAL placement is overridden by CSS-grid `grid-column`/`grid-row` so labels and their associated inputs land in different cells
- **locale / i18n:** en-US, LTR
- **failure-mechanism:** label/field relationship shown by layout (the caption directly above a box) is the OPPOSITE of the programmatic relationship; the accessible name present on each box is a valid label but not the one a sighted user reads over it

## Developer persona
A developer rebuilt a stacked single-column form into a compact two-column grid late in a sprint. They kept the original DOM (label, input, label, input…) with all `for/id` pairs intact, then used CSS grid placement to arrange the four boxes. They eyeballed it once at desktop width, mis-set two `grid-column` values so the inputs swapped within each row, and shipped. axe and WAVE stayed green — every input still has a real label — so nothing flagged that the printed caption now sits over the wrong box.

## Element / selector carrying the issue
`label[for="guests"]` ("Number of guests") is painted directly above `input#visit-date`; `label[for="visit-date"]` ("Preferred date") above `input#guests`; `label[for="mobile"]` above `input#party-name`; `label[for="party-name"]` above `input#mobile`. (Verified by bounding-box geometry: each label's column sits above an input with a different `id` than its `for`.)

## Exact accessibility mechanism (what AT experiences, why it fails)
- Every input has a valid, descriptive accessible name from a real `<label for>` — axe `label`, `label-title-only`, `form-field-multiple-labels` and F111-style name checks ALL pass.
- A SIGHTED user reads top-down/left-right: under the caption "Number of guests" they see a box prompting `MM / DD / YYYY` and (mis)read the layout, or, trusting the caption, type a guest count into a box that is programmatically the date field — and a date into the box captioned "Number of guests".
- A SCREEN-READER / KEYBOARD user follows the `for`/`id` graph and DOM order: they hear "Number of guests, edit text" on the box the sighted user sees under "Preferred date". The two populations get OPPOSITE label→field pairings for the same controls.
- The information conveyed by visual formatting (which caption governs which box) is therefore NOT preserved programmatically — it is actively contradicted. TT 5.C requires the programmatic associations to describe each field as presented; here the present name describes a DIFFERENT field than the one it visually labels.

## Expected ACT-style outcome
**failed** (SC 1.3.1 — the label/field relationship implied by the visual layout is not the relationship that is programmatically determinable; the caption above each box names a different field than the box's programmatic label).

## Why automated tools miss it
Confirmed empirically: axe-core 4.10.3 reports zero label-related violations and zero "incomplete" on this page (only generic `region`/`landmark-one-main` notices, unrelated to label/field relationships). Every input has a real `<label for>` with a descriptive name, so `label`, `label-title-only`, and F111-style accessible-name rules are satisfied; WAVE and Lighthouse likewise see fully-labelled fields. No automated rule compares a label's `for`-target against the input it is VISUALLY adjacent to — that requires rendering the page, reading which caption sits over which box (the date placeholder under "Number of guests" is the visual tell), and noticing the for/id graph wires them the other way. Recognizing that the visible and programmatic relationships contradict is contextual/visual human judgment outside any static checker. (This deliberately escalates past the prior title-only version, which axe's `label-title-only` rule would have caught.)

## Boundary note (ref line 25a)
TT 5.C line 25a allows an *intentionally vague* purpose (e.g., a "Door 1/2/3" surprise) to pass with a vague combination. That exception does NOT apply here: the fields have concrete, named purposes (guest count, date, mobile, party name) and the captions are specific — the failure is that the specific caption is wired to the wrong box, not that the purpose is intentionally ambiguous. So the exception is excluded and the failed verdict stands.

## Citation
> "The combination of the accessible name, accessible description, and other programmatic associations (e.g., table column and/or row associations) describes each input field and includes all relevant instructions and cues (textual and graphical)."
— refs/trusted-tester/sc-1.3.1-info-and-relationships.md (Test 5.C, Test Condition)

> "When labels for form fields are positioned where the user expects them visually, it is easier to understand complex forms and to locate specific fields. Labels for most fields are positioned immediately before the field, that is, for left-to-right languages, either to the left of the field or above it"
— wcag-techniques/general/G162.html (G162, Description)
