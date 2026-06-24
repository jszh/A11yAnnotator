# case-04 — "Processing payment…" removed; order confirmation rendered outside any live region

## Scenario
A candle-shop checkout shows "Processing payment…" plus an indeterminate progress bar inside a `role="status" aria-live="polite"` region (announced on entry). On success the busy region is **emptied** and a brand-new confirmation **panel** ("Thank you — your order is confirmed", order #LUM-50418) is revealed — but that panel is an ordinary `<div>` with no `role=status`/`aria-live`. AT users hear "Processing payment…" then silence: neither the end of the wait nor the result reaches them, raising the high-stakes ambiguity of whether the card was charged.

## Attribute tuple
- **content-domain:** e-commerce checkout / payment
- **UI-component / pattern:** pay button + progress bar → confirmation panel (dynamic-state: async action with both end-of-wait and result conveyance)
- **host-language construct:** `role="status"` busy region emptied via `textContent = ''`; result rendered into a separate non-live `<div class="confirmation">`
- **locale / i18n:** en-US (currency USD)
- **failure-mechanism:** *both* edges fail — the busy region is cleared (silent end-of-wait) and the confirmation is outside any live region (silent result)

## Developer persona
An agency themed a Shopify-style storefront. The original theme placed the "Processing…" text in a `role="status"` (they kept it), but the confirmation step was designed as a full visual "success panel" that swaps in where the pay form was. The dev wired the swap with `display` toggles and cleared the processing text so the spinner wouldn't linger. Because the confirmation looks like a prominent page section, nobody thought of it as a "status message," so no live region was added.

## Element / selector carrying the issue
`#proc` (`div[role="status"]`) is emptied on success (silent end-of-wait); `#confirm` (`div.confirmation`, no `aria-live`/`role`) carries the order-confirmation result with no programmatic status semantics.

## Exact accessibility mechanism (what AT experiences, why it fails)
- **Entry (correct):** "Processing payment…" enters the polite region → announced.
- **Completion (double failure):**
  1. `proc.textContent = ''` empties the busy region — clearing a polite region announces nothing, so the end of the wait is silent.
  2. The confirmation panel is shown via `display`, but it is a plain `<div>`; revealing non-live content triggers no announcement. "Your order is confirmed" / "Order #LUM-50418" is therefore never spoken.
- For payment, this is the most consequential variant: the AT user cannot tell if the charge succeeded. They may re-press "Pay" (risking a duplicate charge) or abandon, unsure. The confirmation is unambiguously a status message ("success or results of an action") yet carries no `role=status`, and the busy text's disappearance is the only "done" cue — silent to AT.
- Fix: announce the result by reusing `#proc` (or marking `#confirm` as `role="status"`) so "Order confirmed, #LUM-50418" is spoken.

## Expected ACT-style outcome
**failed** (SC 4.1.3 — the waiting state's end is conveyed only by removal of the busy text, and the success result is rendered outside any live region, so neither is announced).

## Why automated tools miss it
Across snapshots the markup is valid: a live region exists, the form is labeled, and the confirmation panel is well-formed HTML with good contrast. axe/WAVE/Lighthouse do not click Pay, do not see the busy region emptied, and treat a `<div>` of confirmation text as ordinary content — they cannot infer it is a *status message* that needed announcing, nor that the vanished progress bar was the only "done" signal. Recognizing that both the removal *and* the out-of-region result leave the AT user unable to know whether payment succeeded is a contextual, temporal judgment about a money-moving workflow.

## Citation
> "In situations where status text is entirely removed, its absence may itself convey information about the status. The most obvious example of this is where a message is displayed that the system is "busy" or "waiting". For a sighted user, when this text disappears, it is normally an indication that the state is now available. However non-sighted users would be unaware of this change, unless the end of the waiting state results in a change of context for the user."
— wcag-understanding/status-messages.html ("Removal of status text")

> "the new content provides information to the user on the outcome of an action, the state of an application, the progress of a process, or the existence of errors. … The absence of all of these techniques predicts a failure for the status message be announced to the user."
— wcag-techniques/failures/F103.html (Description)
