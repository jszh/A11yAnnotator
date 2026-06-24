# case-02 — Live price ticker wired `aria-live="assertive"`, refreshing every 2s beside a long article

## Scenario
A financial-news site runs a long-form market analysis with a sticky "Watchlist"
price board in the right rail. The board is a present, valid live region — but it is
wired `aria-live="assertive"`, and a `setInterval` re-prices three instruments (NDX,
SPX, BTC) every two seconds. For a screen-reader user reading the article, the price
tape assertively **interrupts** the article narration every two seconds, indefinitely,
clobbering whatever sentence was being read. A ticking price board is the canonical
low-value, high-frequency status: it should be `polite` (and, per SCR14, ideally
toggleable), never assertive.

## Attribute tuple
- **content-domain:** financial news / long-form editorial
- **UI-component / pattern:** sticky real-time price ticker (watchlist) beside reading content
- **host-language construct:** `<div aria-live="assertive" aria-atomic="true">` mutated by `setInterval`
- **locale / i18n:** en-US with `toLocaleString` number/currency formatting
- **failure-mechanism:** over-assertive — low-value, high-frequency real-time data in `assertive`

## Developer persona
A junior dev on the markets team wanted the price board to "always update for everyone,
including screen readers", so they reached for the strongest live politeness they knew —
`aria-live="assertive"` with `aria-atomic="true"` — reasoning that polite "might get
skipped". They never tested it against a screen reader reading the adjacent article and
did not know SCR14's stock-ticker precedent (polite + a toggle).

## Element / selector carrying the issue
`div#priceboard[aria-live="assertive"]`, whose price `<span>` children are rewritten by
the `setInterval` callback every 2000 ms. Because the region is `aria-atomic="true"`,
the entire board is re-announced on each tick.

## Exact accessibility mechanism
Assertive live regions instruct the screen reader to interrupt current speech and speak
the new content at once. With the board re-priced every two seconds, the AT cuts off
the article narration to recite "NDX 20,114; SPX 5,981; BTC $67,420" twice a minute,
forever. The user can never read a paragraph to its end. The content (a fluctuating
real-time price) is exactly the kind of non-essential, high-cadence update that the
Understanding text and SCR14 single out: it should be polite so it queues behind
ongoing speech, or off by default with an opt-in. The markup is syntactically valid —
the defect is the **wrong politeness for the message's value and cadence**.

## Expected ACT-style outcome
**failed** — a real, announced status message, but assertive politeness on a 2-second
price tape makes the page intolerably chatty and unusable with a screen reader, the
"too chatty" failure the spec warns against.

## Why automated tools miss it
`#priceboard` is a genuine non-empty live region present at page load with a valid
`aria-live="assertive"` value and `aria-atomic="true"`; it really announces. axe-core /
WAVE / Lighthouse verify only that a status message *can* be announced — and `assertive`
is a legal attribute value, so nothing fails. No static or single-snapshot tool observes
the 2-second mutation cadence or weighs that a fluctuating price is low-value content
that should not interrupt; that judgment depends on the meaning and frequency of the
update, which only a human (or a behavioral test that listens over time) can make.

## Citation
**Reference:** WCAG Techniques — SCR14 "Using scripts to make nonessential alerts
optional" (`wcag-techniques/client-side-script/SCR14.html`)

> "The objective of this technique is to toggle announcements to screen readers of
> changes in a stock-price alert component. By default, when the stock price changes,
> the change is announced by screen readers. This could be annoying to some users, so
> there are buttons to allow users to toggle the announcements on or off."

**Supporting reference:** WCAG 2.2 Understanding SC 4.1.3 — "Other uses of live regions
or alerts" (`wcag-understanding/status-messages.html`)

> "However, there is a risk of making an application too "chatty" for a screen reader
> user. User testing should be carried out to ensure the appropriate level of feedback
> is achieved."
