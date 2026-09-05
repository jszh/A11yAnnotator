# case-10 — paired PASS repair of case-02

## Scenario and source pair

The complete Cadence HR reset form, seven-character password, visible warning icon, and policy checklist are preserved from the failed source.

**Paired failed source:** `case-02.html`

**Balance batch:** `gena11y-fp-50-v2`

**Hard-negative type:** `error-identification`

## Exact counterfactual repair

Changed the warning image’s alternative text from the false “required” message to the actual length error. Replaced `aria-errormessage` with the broadly exposed `aria-describedby` relationship so the input’s computed accessibility-tree description robustly contains the icon alternative without relying on less-consistent `aria-errormessage` support.

## Primary selector

`#newpw`

## Accessibility mechanism

The password field is invalid and its computed description resolves through `aria-describedby` to “Password must be at least 10 characters; yours has 7.” The referenced image retains that exact accessible name, so both the field-description relationship and icon alternative identify the real error.

## Expected ACT-style outcome

**passed** — SC 3.3.1

## Why this is a hard negative

The icon still renders as the same warning triangle and the DOM carries no separate visible error sentence. Correct judgment requires inspecting the password input’s computed accessibility-tree description rather than treating the visual glyph or image element in isolation.

## Citation

> **wcag-understanding/error-identification.html:**
> “This SC requires that users be provided with information about the nature of the error, including the identity of the item in error.”
