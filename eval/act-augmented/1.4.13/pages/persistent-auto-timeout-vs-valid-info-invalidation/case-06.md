# case-06 — RTL seat-hold countdown popup ends because the hold genuinely expired (info-invalidation PASS)

## Scenario
An Arabic, right-to-left airline seat-selection page (طيران الواحة) shows a held seat
(C٢). On hover/focus it reveals a `role="tooltip"` with the **live remaining hold time**
("الوقت المتبقّي: ٠٠:٤٥") and a prompt to pay before the hold expires. A countdown ticks
the genuinely-remaining time; the popup stays visible while the hold is valid and the seat
is hovered/focused. When the countdown reaches zero the hold **actually expires** — the
seat is released, the "held for you" message is now false, and the popup is removed because
its information became invalid. This must be judged a **PASS**.

## Attribute tuple
- **content-domain**: travel / flight & hotel booking (airline seat selection)
- **UI-component/pattern**: seat-map cell with a live hold-countdown tooltip
- **host-language construct**: `dir="rtl"` `lang="ar"`, Arabic-Indic digits, `setInterval` countdown ending in seat release
- **locale/i18n**: Arabic (RTL), Arabic-Indic numerals
- **failure-mechanism**: NONE — legitimate information-invalidation (long-tail boundary)

## Developer persona
A localization-focused dev built a seat-hold timer for an MENA-market airline. The hold
is inherently temporary; they made the popup show the live countdown and tied its
disappearance to the real expiry event (seat released), not to an arbitrary cosmetic
timer.

## Element / selector carrying the issue
- Boundary/exception element: `#holdPop[role="tooltip"]` on `button#heldSeat` — removed
  only when the countdown (`#holdLeft`) reaches zero and the hold expires (seat loses the
  `held` state, `aria-describedby` removed, pay button disabled).

## Exact accessibility mechanism
The popup appears on hover/focus, is hoverable, Esc-dismissible, and persists for the
entire time the hold is valid — so it does NOT auto-close for a disallowed reason. Its end
is tied to the hold genuinely expiring: at that moment "محجوز مؤقتًا لك / held for you"
is false, so the conveyed information has become invalid. The Persistent condition allows
content to end exactly then. RTL/lang are correct so AT (e.g. an Arabic screen reader)
announces the countdown and the popup in the right language/direction; nothing still-valid
is removed while the user needs it.

## Expected ACT-style outcome
**passed** — content ends because its information (a temporary hold) became invalid (the
explicit Persistent exception), not because of a disallowed auto-timeout.

## Why automated tools miss it
Structurally this is a `setInterval` that ends by hiding a popup — the SAME shape as the
case-01/case-02 FAIL pattern, and the SAME shape a naive timer-presence heuristic would
flag. Static checkers see only valid `role="tooltip"` markup with correct RTL/`lang` and
an Esc handler and report nothing. Deciding PASS vs FAIL requires reading what the content
MEANS and whether it is still true: the hold expired, so the message is now false and its
removal is the permitted info-invalidation. That semantic/temporal judgment is precisely
what axe/WAVE/Lighthouse and timer-counting heuristics cannot perform.

## Citation
> **WCAG 2.2 Understanding 1.4.13 — Persistent:** "The information conveyed by the
> additional content becomes invalid, such as a 'busy' message that is no longer valid."
> (wcag-understanding/content-on-hover-or-focus.html)

> **WCAG 2.2 Understanding 1.4.13 — In brief (Goal):** "More users can perceive and
> dismiss non-persistent content." (wcag-understanding/content-on-hover-or-focus.html)
