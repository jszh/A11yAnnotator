# case-11 — paired PASS repair of case-05

## Scenario and source pair

The complete Aperture S2 comparison, CSS visual columns, two headings, and six repeated resource links are preserved from the failed source.

**Paired failed source:** `case-05.html`

**Balance batch:** `gena11y-fp-50-v2`

**Hard-negative type:** `heading-context-or-explicit-name`

## Exact counterfactual repair

Added visible-label-first accessible names to each existing resource link, appending the correct S2 variant. The intentionally misleading DOM-versus-grid ordering is unchanged.

## Primary selector

`.links-block a`

## Accessibility mechanism

Each link independently identifies both resource and product, for example “Datasheet (PDF) — S2 Standard” and “Datasheet (PDF) — S2 Pro.”

## Expected ACT-style outcome

**passed** — SC 2.4.4

## Why this is a hard negative

The CSS layout and repeated visible text retain the source’s strongest visual failure cues. Correct evaluation requires the computed names rather than assuming that the visually grouped headings are the only carrier.

## Citation

> **wcag-understanding/link-purpose-in-context.html:**
> “Alternatively, authors may choose to use an ARIA technique to associate additional text on the page with the link.”
