# case-04 — Custom element whose connectedCallback builds an already-filled live region (real-time stock-price alerts)

## Scenario
Tideflow Markets is a real-time watchlist. When a price-alert threshold is crossed, the app mounts a custom element
`<price-alert symbol="NVDA" direction="up" price="$1,205.00">`. Inside its `connectedCallback`, the element
`createElement('div')`, sets `role="status"` and `aria-live="assertive"`, sets `textContent` to the alert message,
and appends that child to itself — all while the custom element is entering the DOM. After it mounts you can inspect
a perfectly valid `<div role="status" aria-live="assertive">Alert: NVDA rose above your target…</div>`. A static
scan passes. But the live region was *assembled with its content inside `connectedCallback` as the element
connected*; it was never present-and-empty beforehand, so the urgent price alert is not announced to screen-reader
traders.

## Attribute tuple
- **content-domain:** online trading / fintech real-time market data
- **UI-component/pattern:** Web Component (custom element) price-alert, mounted on a runtime event
- **host-language construct:** `class extends HTMLElement` whose `connectedCallback` builds `role="status"`/`aria-live` + `textContent` then `appendChild` (region created already-filled at connection time)
- **locale/i18n:** en
- **failure-mechanism:** F103 timing limb — the live region comes into existence already holding its message (born-with-content), via custom-element lifecycle

## Developer persona
A fintech engineering team built a reusable `<price-alert>` Web Component and, following idiomatic custom-element
practice, put **all** rendering in `connectedCallback` so the element is self-contained — including creating the
`role="status"` node and writing its text. They believed "it has role=status and aria-live, so screen readers
announce it," not realizing that mounting a custom element whose `connectedCallback` synchronously builds a *filled*
live region yields a region born with its content: there is no empty, registered region for AT to detect a mutation
in. Visual demos showed the alert sliding in, so it shipped.

## Element / selector carrying the issue
`#alert-mount price-alert > div.alert-line[role="status"]` — built in `connectedCallback`. Temporal marker
`data-region-born-with-content="true"`. The `#alert-mount` wrapper is a plain labelled `<div>` (not itself a live
region), so it cannot act as the persistent registered region either.

## Exact accessibility mechanism (what AT experiences, why it fails)
Live-region announcements require the AT to be monitoring a region and observe a content mutation. A custom
element's `connectedCallback` runs at the moment the element is inserted; building the `role="status"` child with
its `textContent` already set and appending it means the entire region — attribute and text — materializes as one
connected subtree. There is no "empty registered region → text added" transition. Even `aria-live="assertive"`,
which is supposed to interrupt, typically produces **silence** here in NVDA/JAWS/VoiceOver because the region was
never registered while empty. A trader using a screen reader gets no spoken alert that NVDA crossed their target —
a status message (existence of an important event) that SC 4.1.3 requires be programmatically conveyed. The fix:
keep one persistent empty `aria-live` region in the page and have the component write into *that*.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
After the element mounts, the DOM holds a syntactically valid `role="status" aria-live="assertive"` region with
text — every automated rule passes. The failure lives entirely in the custom-element lifecycle: a tool would have
to model that `connectedCallback` set the role and text *before* the node was observable as empty, which no static
checker does. The element also auto-removes after 8 seconds, so a delayed scan may not even see it. Recognizing the
born-with-content timing requires reading the `connectedCallback` source or running AT — beyond axe/WAVE/Lighthouse.

## Citation
> **WCAG Technique F103, `wcag-techniques/failures/F103.html` (Description):**
> "The absence of all of these techniques predicts a failure for the status message be announced to the user.
> Additionally, if the role or property is not set *before* the dynamic content is added, this also predicts a
> failure."

> **WCAG Technique ARIA22, `wcag-techniques/aria/ARIA22.html` (Tests, Procedure step 1):**
> "Check that the container destined to hold the status message has a `role` attribute with a value of `status`
> *before* the status message occurs."
