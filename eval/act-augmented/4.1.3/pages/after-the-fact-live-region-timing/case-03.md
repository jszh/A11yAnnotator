# case-03 — Results wrapper turned into a live region by setAttribute in the same tick it is filled (university library catalog)

## Scenario
The Ashbourne University library catalog runs a same-page search. A `<div id="results">` ships in the markup as a
**plain div with no `aria-live` and no role**. On submit, `render()` calls
`box.setAttribute('aria-live','polite')` and then writes the `"7 results found for "phenomenology""` count line plus
the hit list into the same element — in one synchronous operation. Afterward the DOM reads
`<div id="results" aria-live="polite">…7 results found…</div>`, a valid live region containing a status message
(the result count is explicitly a status message per the Understanding doc). A static scan passes. But the
`aria-live` attribute and the content were applied together; the container was never an empty, registered live
region, so the "7 results found" announcement never fires for screen-reader users.

## Attribute tuple
- **content-domain:** higher-ed library / LMS discovery catalog
- **UI-component/pattern:** same-page search with result-count status line ("N results found")
- **host-language construct:** `setAttribute('aria-live','polite')` applied at the same tick as `innerHTML`/content write (attribute upgraded onto a non-empty-soon element)
- **locale/i18n:** en
- **failure-mechanism:** F103 timing limb — `aria-live` property set *with* the content, not *before* it on an empty container

## Developer persona
A library-systems integrator refactoring a legacy catalog wanted to "make the results accessible," so they added
`aria-live="polite"` to the results container. But they added it *inside the same `render()` function that paints
the results*, reasoning "the attribute is on the element when the results appear, so it's a live region now." They
never learned that `aria-live` must be present on the **empty** container at registration time. Sighted testing
looked flawless and the change shipped.

## Element / selector carrying the issue
`#results[aria-live="polite"]` and specifically its `.count` status line ("7 results found…"). The element is a
plain `<div>` at load; `setAttribute('aria-live','polite')` and the content write happen together in the submit
handler. Temporal marker: `data-region-born-with-content="true"`.

## Exact accessibility mechanism (what AT experiences, why it fails)
For a polite live-region announcement, the browser/AT must have registered the element as a live region *and then*
observe a mutation of its contents. When `aria-live` is added in the same operation that injects the text, the
element transitions directly from "not a live region, empty" to "live region, full" with no intermediate "live
region, empty" state that the AT registered and is monitoring. The "7 results found" status — which SC 4.1.3 says
must be announced ("Five results returned" is the canonical example) — is therefore not spoken. The result hits
themselves are not status messages, but the count line is, and it is silent. The fix is to ship
`<div id="results" aria-live="polite">` empty in the markup at load and write only the content later.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The post-search DOM contains a valid `aria-live="polite"` region with a non-empty result-count message; axe/WAVE/
Lighthouse pass it. No static tool records the *order* in which `aria-live` and the text were applied to the
element — it sees only that both are present in the final snapshot. Distinguishing "attribute predated the
content" (announces) from "attribute and content applied together" (silent) requires inspecting the `render()`
sequence or observing AT behavior. This is the precise temporal limb F103 calls out and that single-snapshot
analysis cannot represent.

## Citation
> **WCAG 2.2 Understanding 4.1.3 Status Messages, `wcag-understanding/status-messages.html` (Status message examples):**
> "After a user presses a Search button, the page content is updated to include the results of the search… The
> change to content also includes the message "5 results returned" near the top of this new content. This text is
> given an appropriate role for a status message. A screen reader announces, "Five results returned"."

> **WCAG Technique F103, `wcag-techniques/failures/F103.html` (Description):**
> "Additionally, if the role or property is not set *before* the dynamic content is added, this also predicts a
> failure."
