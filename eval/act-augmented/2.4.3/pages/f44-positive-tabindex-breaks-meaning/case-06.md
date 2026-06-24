# case-06 — BOUNDARY: scrambled positive tabindex on an order-irrelevant social-share row (Does Not Apply)

## Scenario
An engineering blog post ends with a **"Share this post"** row of five icon buttons: X, Facebook,
LinkedIn, Email, Copy link. These five actions are mutually **independent** — there is no sequence,
no dependency, the reader picks exactly one. The buttons carry **scrambled** positive `tabindex`
values `3, 1, 4, 2, 5`, so Tab visits them Facebook → Email → X → LinkedIn → Copy link, a different
order from the left-to-right visual order. Despite positive tabindex being present AND in a
scrambled order, this does **not** fail 2.4.3, because the order of these independent share actions
does not affect meaning or operability — it is the canonical "row of social-media icons" example the
Understanding doc cites as Not Applicable. This boundary case prevents a judge from failing on
"positive tabindex present" or even on "tab order differs from source order".

## Attribute tuple
- **content-domain:** developer docs / engineering blog (long-form editorial)
- **UI-component / pattern:** social-share icon toolbar (`role="group"`) in a post footer
- **host-language construct:** scrambled positive `tabindex` 3,1,4,2,5 on five independent buttons
- **locale / i18n:** en-US
- **failure-mechanism:** NONE — order does not affect meaning/operability, so the SC does not apply (boundary negative)

## Developer persona
A developer built the share widget as a small component and, while experimenting with making the
"Facebook" button reachable first for an A/B test, sprinkled positive tabindex on the buttons and
never cleaned it up. The numbers ended up scrambled (3,1,4,2,5) but since each button is a standalone
action, nobody noticed or cared in use — and crucially, nothing about the page's meaning depends on
which share button focus reaches first.

## Element / selector carrying the issue
- `.share button` — five `<button>` with `tabindex` `3,1,4,2,5` and proper `aria-label`s, inside a
  `role="group"` labelled "Share this post".
- The rest of the page (article links, related-post links) has **no** tabindex and tabs in normal
  DOM/visual order, so the meaningful content flow is untouched. The scrambled order is confined to
  the order-irrelevant share row.

## Exact accessibility mechanism (what AT experiences)
A keyboard user tabbing into the share group reaches the buttons in a scrambled order (Facebook
first, then Email, then X, …). But because each button is a complete, independent action — share via
this one channel — there is no task sequence to violate: the user finds the channel they want and
activates it, exactly as they would in any order. No data is entered out of sequence, no field is
stranded, no relationship between controls is broken. A screen-reader user hears five clearly
labelled share actions; the order among equals carries no meaning. The navigation sequence does not
affect meaning or operability, so SC 2.4.3 is not implicated — this is the Understanding/Trusted
Tester "does not apply" condition.

## Expected ACT-style outcome
**inapplicable** — the focus order does not affect meaning or operability (independent share
actions), so SC 2.4.3 Does Not Apply; not an F44 failure despite scrambled positive tabindex.

## Why automated tools miss it
This is a hard NEGATIVE that is statically indistinguishable from a failing page: positive tabindex
is present and its numeric order differs from source/visual order — the same signals as case-01.
axe-core emits the identical best-practice positive-tabindex note here. A tool, or a judge keyed on
"positive tabindex" or even on "tab order ≠ source order", would FALSE-POSITIVE. The only thing that
makes this pass is the **semantic** fact that the five share actions are independent, so their order
carries no meaning — a judgment about whether the sequence affects meaning/operability that no
static scanner can make.

## Citation
**Reference:** WCAG Understanding Focus Order — Examples / Not-applicable case
(`wcag-understanding/focus-order.html`).

> "When the order of a particular presentation differs from the programmatically determined reading
> order, users of one of these presentations may find it difficult to understand or operate the web
> page."

**Supporting reference:** Trusted Tester v5.1.3 — SC 2.4.3 Focus Order, Notes
(`refs/trusted-tester/sc-2.4.3-focus-order.md`).

> "When focus order does not affect meaning or operability, this test Does Not Apply (e.g., a row of
> icons linking to social media may not need to be navigated in a particular order)."
