# case-02 — Hand-rolled toast helper that sets role/aria-live on a detached node before appending (SaaS analytics dashboard)

## Scenario
Northwind Analytics is a dark-themed data-pipeline dashboard. Each "Run now" button calls an in-house `showToast()`
helper that `document.createElement('div')`, sets `role="status"` and `aria-live="polite"`, builds two child text
nodes ("Pipeline started" / the run detail), and **then** appends the finished element to a `#toast-stack`
container. The toast you can inspect afterward is a valid `<div role="status" aria-live="polite">` with a real
status message — so a static checker sees a correct live region. The bug is temporal: the region carries both its
live-region attributes and its full text *before it is ever connected to the document*, so there was never an
empty, AT-registered region for the message to mutate into. The toast appears visually and auto-dismisses after
6 seconds; a screen-reader user hears nothing about whether their pipeline run started.

## Attribute tuple
- **content-domain:** SaaS analytics / data-engineering dashboard
- **UI-component/pattern:** transient toast / snackbar notification (hand-rolled helper)
- **host-language construct:** `createElement` → `setAttribute('role','status')`/`'aria-live'` → `textContent` → `appendChild` (one tick, attributes-before-connection)
- **locale/i18n:** en
- **failure-mechanism:** F103 timing limb — live region born with its content rather than pre-existing and empty

## Developer persona
A senior front-end engineer wrote the toast helper to avoid pulling in a dependency. They *knew* about live
regions, so they deliberately added `role="status"` and `aria-live="polite"` — and felt confident the toast was
"accessible because it has aria-live." The subtlety they missed: a live region must already be present and
registered in the document as an (empty) container; assigning the attributes to a detached element and connecting
it together with its text does not produce the empty-region-then-mutation transition that AT listens for. Visual
testing showed the toast, so it shipped.

## Element / selector carrying the issue
`#toast-stack > div.toast[role="status"]` — created per click by `showToast()`. Marked
`data-region-born-with-content="true"`. The persistent `#toast-stack` wrapper is a plain `<div>` with no live-region
semantics, so it cannot serve as the registered region either.

## Exact accessibility mechanism (what AT experiences, why it fails)
Assistive technologies announce live-region updates by diffing the contents of a region they are *already
monitoring*. Browsers/AT register a node as a live region when it exists in the accessibility tree; a polite
announcement fires when that already-registered region's descendants change. Here the element is fully assembled
off-DOM (`role`, `aria-live`, both text children all set) and then `appendChild`-ed as one connected subtree. There
is no transition from "empty registered region" to "region now contains text"; the region's *entire existence* and
its content coincide. NVDA/JAWS/VoiceOver routinely stay **silent** for such born-with-content regions. The correct
pattern (and the PASS control in case-06) keeps one persistent empty `aria-live` region in the markup at load and
writes only `textContent` into it.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The toast, once present, is a fully valid `role="status" aria-live="polite"` element with text — axe/WAVE/Lighthouse
flag nothing. Worse, the toast may have auto-dismissed before a scan even runs. A static tool has no concept of the
*sequence* `setAttribute` → `textContent` → `appendChild`; it cannot distinguish attributes applied to a node before
connection (silent) from text written into an already-connected empty region (announced). The distinction is the
exact thing F103's timing limb describes, and it is invisible to single-snapshot DOM analysis.

## Citation
> **WCAG Technique ARIA19, `wcag-techniques/aria/ARIA19.html` (Examples):**
> "In the example there is an empty error message container element with `aria-atomic=true` and an aria-live property
> or alert role present in the DOM on page load. The error container must be present in the DOM on page load for the
> error message to be spoken by most screen readers."

> **WCAG Technique F103, `wcag-techniques/failures/F103.html` (Description):**
> "Additionally, if the role or property is not set *before* the dynamic content is added, this also predicts a
> failure."
