# case-01 — "Searching the catalog…" spinner removed silently; result count never announced

## Scenario
An auto-parts "Parts finder" runs an AJAX catalog search. Pressing **Search** injects a "Searching the catalog…" message plus a spinner into a correct `role="status"` live region (announced on entry), then on completion **empties** that live region and renders the result rows plus an "8 matches found" count into a separate, non-live `<section class="results">`. Sighted users read the disappearing spinner as "done — here are your results"; AT users hear the busy message appear and then nothing — neither the end of the wait nor the count.

## Attribute tuple
- **content-domain:** e-commerce / auto-parts catalog
- **UI-component / pattern:** instant search + spinner (dynamic-state: skeleton/loading placeholder)
- **host-language construct:** `role="status" aria-live="polite"` region emptied via `textContent = ''`; results injected into a plain `<section aria-label>`
- **locale / i18n:** en-US
- **failure-mechanism:** busy text correctly announced on entry, then removed; the "now done" signal (spinner vanishing) and the result-count status are conveyed visually only

## Developer persona
A mid-level front-end dev followed an a11y blog post that said "put your loading message in `role="status"`," and did exactly that for the spinner. They treated the results list as ordinary content (which the SC says search *results* themselves are) and never realized that (a) clearing the region on completion announces nothing, and (b) the "8 matches found" count is itself a status message that belongs in the live region.

## Element / selector carrying the issue
`#liveStatus` (`div[role="status"]`) — correctly announced on entry, then cleared with no replacement; the completion signal and `8 matches found` count live in `#results`, which is not a live region.

## Exact accessibility mechanism (what AT experiences, why it fails)
- **Entry (correct):** screen reader announces "Searching the catalog…" because new text enters a polite live region.
- **Completion (the failure):** `status.textContent = ''` removes the busy text. Removing/clearing content from a polite region produces **no announcement** by design, so AT users hear silence at the exact moment the wait ends. The spinner disappearing — the visual "done" cue — is conveyed to sighted users only.
- The "8 matches found" count is injected into `#results`, which has no `aria-live`/`role=status`, so it is not announced either. Per the SC, a search-completion count such as "18 results returned" *is* a status message.
- Net: an AT user does not learn that the search finished, nor how many results arrived; they must blindly go hunting in the page to discover whether results exist.
- The one-line fix is to write a non-visible "8 matches found" into `#liveStatus` instead of emptying it.

## Expected ACT-style outcome
**failed** (SC 4.1.3 — the end of the waiting state and the result-count status are not programmatically conveyed; the removal of the busy text carries meaning that is not provided to AT).

## Why automated tools miss it
At every DOM snapshot the markup is valid: the live region exists with a correct `role`/`aria-live`, the search input is labeled, and the result rows are well-formed. axe/WAVE/Lighthouse never press Search, never observe that the live region is *emptied* on completion, and have no model of "the busy text disappeared, therefore the author owed a 'done'/result-count announcement." Inferring that the *absence* of the spinner is itself status — and that the count should have been announced — is a temporal, semantic judgment about the workflow's meaning, not a markup rule.

## Citation
> "In situations where status text is entirely removed, its absence may itself convey information about the status. The most obvious example of this is where a message is displayed that the system is "busy" or "waiting". For a sighted user, when this text disappears, it is normally an indication that the state is now available. However non-sighted users would be unaware of this change, unless the end of the waiting state results in a change of context for the user. Where updating the visible message (e.g., to "system available") is not feasible, the use of a non-visible status message, such as "system available", ensures equivalent status information is provided."
— wcag-understanding/status-messages.html ("Removal of status text")

> "However, brief text messages displayed about the completion or status of the search, such as "Searching...", "18 results returned" or "No results returned" would be status updates if they do not take focus or cause a page refresh."
— wcag-understanding/status-messages.html (Intent)
