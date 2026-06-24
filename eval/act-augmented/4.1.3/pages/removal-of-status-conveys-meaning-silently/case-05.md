# case-05 — "Checking insurance coverage…" removed; copay result rendered as plain copy

## Scenario
A pharmacy refill page checks insurance coverage. Pressing **Check my coverage** injects "Checking insurance coverage…" plus a spinner into a `role="status" aria-live="polite"` region (announced on entry). On completion the busy region is **emptied** and a plain `#priceOut` block ("Your copay: $12.00 · Covered by BlueShield Select PPO · 88% paid") is revealed with no `role=status`/`aria-live`. The copay outcome is itself a status message ("result of an action"), yet it is conveyed visually only, and the end of the wait is silent.

## Attribute tuple
- **content-domain:** healthcare / pharmacy refill + insurance pricing
- **UI-component / pattern:** coverage lookup with spinner → price readout (dynamic-state: async result that is itself a status)
- **host-language construct:** `role="status"` region emptied via `textContent = ''`; result in a plain `<div class="price-out">`; bilingual `lang="es"` spans in header/footer (i18n facet)
- **locale / i18n:** en-US primary with es-US bilingual chrome
- **failure-mechanism:** busy text removed (silent end-of-wait) AND the result — a genuine outcome status — placed outside any live region

## Developer persona
A healthcare-startup engineer built the coverage widget to mirror a Figma flow with three visual states: idle button, spinner, and a bold dollar amount. They wrapped the spinner in `role="status"` after an audit flagged "loading not announced," but considered the copay figure to be "just the result, like a price label" — not realizing that the outcome of a coverage check (covered / what you'll pay) is precisely the kind of action-result the SC treats as a status message.

## Element / selector carrying the issue
`#cov` (`div[role="status"]`) is emptied on success (silent end-of-wait); `#priceOut` (`div.price-out`, no `role`/`aria-live`) carries the copay + coverage outcome with no status semantics.

## Exact accessibility mechanism (what AT experiences, why it fails)
- **Entry (correct):** "Checking insurance coverage…" enters the polite region → announced.
- **Completion (the failure):** `cov.textContent = ''` empties the busy region (no announcement on removal), and `#priceOut` is revealed via `display`. Showing a non-live `<div>` triggers no announcement, so "Your copay: $12.00 / Covered by BlueShield Select PPO" is never spoken.
- The result is unambiguously a status message — it reports the success/outcome of the coverage action, analogous to the SC's "5 results returned" and "form successfully submitted" examples — but carries no `role=status`. Combined with the silent removal of the busy text, an AT user learns neither that the check completed, whether the drug is covered, nor the cost — a decision-blocking gap on a health-and-money page.
- Fix: announce the outcome by writing "Covered — your copay is $12.00" into `#cov` (or mark `#priceOut` `role="status"`) rather than clearing the region.

## Expected ACT-style outcome
**failed** (SC 4.1.3 — the end of the waiting state is signalled only by removing the busy text, and the coverage-result status is rendered outside any live region; neither is announced).

## Why automated tools miss it
The page is valid at every snapshot: a real live region, a labeled button, correctly used `lang="es"` spans, and a well-formed price block with good contrast. axe/WAVE/Lighthouse never click "Check," never see the live region emptied, and read the copay figure as ordinary body copy — they cannot judge that a coverage outcome is a *status message* owed an announcement, nor that the vanished spinner was the only "done" cue. Determining that the absence of the busy text plus the silent result leaves an AT user unable to make a coverage/cost decision is a contextual, temporal inference no static rule encodes.

## Citation
> "In situations where status text is entirely removed, its absence may itself convey information about the status. The most obvious example of this is where a message is displayed that the system is "busy" or "waiting". For a sighted user, when this text disappears, it is normally an indication that the state is now available. However non-sighted users would be unaware of this change …"
— wcag-understanding/status-messages.html ("Removal of status text")

> "After a user presses a Search button, the page content is updated to include the results of the search … The change to content also includes the message "5 results returned" … This text is given an appropriate role for a status message. A screen reader announces, "Five results returned"."
— wcag-understanding/status-messages.html (Status message examples — the action-result status this page renders silently)
