# case-01 — Patient portal: aria-atomic="false" on a refill counter announces a bare "two"

## Scenario
A healthcare patient portal ("MyHealth Portal") shows a prescription card for Levothyroxine with a
refill-status line: `💊 You have 3 refills remaining`, wrapped in `<p role="status">`. Pressing
**Request a refill** decrements the count and updates ONLY the inner `<span id="refill-count">` text
node from `3` to `2`, `1`, `0`. The visible line always reads "You have 2 refills remaining" —
perfectly meaningful to a sighted patient. The trap: the developer set **`aria-atomic="false"`
explicitly** on the region (copied from a "stop the screen reader being too chatty" snippet),
overriding the role's default of `true`. With atomic off, the screen reader announces only the
changed text-node subtree — the lone number "two" — and never re-reads the static "You have" /
"refills remaining" framing that lives in the region's sibling nodes.

## Attribute tuple
- **content-domain**: healthcare / patient portal (prescription refills)
- **UI-component/pattern**: medication-card refill-count status indicator
- **host-language construct**: `<p role="status" aria-atomic="false">` with an inner `<span>` value node and static sibling label nodes
- **locale/i18n**: en
- **failure-mechanism**: explicit `aria-atomic="false"` override + partial inner-node mutation → only the changed number subtree is announced (truncated announcement)

## Developer persona
A mid-level front-end dev wired the refill card with one bound number node — "just update the count
that changed" — the most natural instinct. They added `role="status"` after reading that status
roles announce updates, then hit a complaint that the portal felt "noisy" and pasted in
`aria-atomic="false"` from a Stack Overflow answer aimed at suppressing whole-region re-reads,
without understanding that it inverts exactly the behavior this region needs. They never tested with
a screen reader, so they never heard the lone "two" pop out with no "refills remaining" context.

## Element / selector carrying the issue
- Region: `p#refill-region[role="status"]` — has an EXPLICIT `aria-atomic="false"` (the author
  overrode the role's default of `true`).
- Mutated node: `span#refill-count` — the only node JS rewrites on each request.
- Static framing: the sibling `<span>You have</span>` and `<span>refills remaining</span>` nodes
  never change, so with atomic off they are never re-announced.

## Exact accessibility mechanism
`role="status"` carries an implicit `aria-live="polite"` and a default `aria-atomic` value of
`true` — by the spec the whole container should be announced on any update. Here the author
**explicitly set `aria-atomic="false"`**, which inverts that default: the AT now announces only the
specific subtree that mutated, i.e. the bare `#refill-count` text node. So a refill request yields
the spoken word "two" with no "You have … refills remaining" — a blind patient hears "two" pop out
of nowhere and cannot tell two of *what*. The sighted patient is fine because the static label sits
permanently around the number. This is the textbook "Modification of status text" failure: only the
number was coded as an updated chunk, so the resulting experience is to "only hear 'two'." Note this
is NOT the ARIA22-passing pattern (that example keeps the default atomic=true so the whole "N items"
string is announced); the explicit `aria-atomic="false"` is what makes this page genuinely fail.

## Expected ACT-style outcome
**failed** — the status message is announced, but the announced fragment is not equivalent to the
visible status (it loses the "You have … refills remaining" context) because the region was
explicitly made non-atomic.

## Why automated tools miss it
axe-core, WAVE, and Lighthouse see a syntactically perfect `role="status"` live region, and
`aria-atomic="false"` is well-formed, valid ARIA — they raise nothing and would in fact applaud the
presence of the live region. They cannot weigh that this particular region *needed* its default
atomic behavior, cannot observe that only an inner node mutates at runtime, and have no rule for "the
spoken fragment ('two') is semantically incomplete versus the visible whole ('two refills
remaining')." Catching it requires a human (or AT) to fire the update and judge semantic equivalence
of the announced text against the visible string — exactly the human-meaning judgment no linter
performs.

## Citation
> **WCAG 2.2 Understanding 4.1.3 — Modification of status text**
> "If a status message persists on the page, modifications to this text are usually equivalent to a
> new status message. An example would be a shopping cart which updates text from reading "0 items"
> to "3 items". Typical methods of writing such changes in the page content result in the entire
> modified text string being considered a new change, and thus read by assistive technologies.
> However, where only the number in this string was coded as an updated chunk of content, the
> resulting experience for screen reader users could be to only hear "three", which may not be
> sufficient information to provide context for the user. In such situations, marking the entire "3
> items" string as the status text would normally be a better solution. See Sufficient Techniques for
> more discussion, including the use of `aria-atomic`. In this case it would also be a courtesy to add
> offscreen text such as "in shopping cart" to the message."

> **WCAG Techniques ARIA22 — Using role=status to present status messages**
> "The role of `status` also has a default `aria-atomic` value of `true`, so that updates to the
> container marked with a role of `status` will result in the AT presenting the entire contents of
> the container to the user, including any author-defined labels (or additional nested elements).
> Such additional context can be critical where the status message text alone will not provide an
> equivalent to the visual experience."
