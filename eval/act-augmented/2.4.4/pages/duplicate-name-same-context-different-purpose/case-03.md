# case-03 — Two "Email us" links in one sentence: mailto:sales@ vs mailto:support@

## Scenario
A developer-tools SaaS contact page. One sentence offers two `Email us` links in the
same `<p>`: the first opens a mail to **sales@latchkey.dev** (pricing, seats, trial),
the second to **support@latchkey.dev** (production incidents, on-call engineers). The
links have the identical accessible name "Email us" and identical (same-DOM-node)
context, but the two inboxes serve **genuinely different purposes** routed to different
teams. Picking the wrong link sends an outage to the sales queue.

## Attribute tuple
- **content-domain:** B2B developer SaaS / contact page
- **UI-component / pattern:** two inline `mailto:` links with subject pre-fill
- **host-language construct:** `<a href="mailto:sales@…?subject=…">` and `<a href="mailto:support@…?subject=…">` in one `<p>`
- **locale / i18n:** en-US
- **failure-mechanism:** identical accessible name + identical context, but the `mailto:` targets resolve to non-equivalent destinations (different recipient address = different team/purpose); the disambiguating clauses sit after each link and are not associated with it

## Developer persona
A founder wrote the contact card in a hurry before a launch. He liked the symmetry of
"Email us … or Email us …" and reused the same friendly label for both addresses,
figuring "the words around it make it obvious." He tested it by clicking each link in
his mail client (where the To: field is visible) and it looked fine — he never
considered the screen-reader links-list view, where the two are word-for-word identical.

## Element / selector carrying the issue
`.card p > a[href^="mailto:sales@"]` and `.card p > a[href^="mailto:support@"]` — two
`<a>` in one paragraph, accessible name "Email us", resolving to two different mailto
recipients.

## Exact accessibility mechanism (what AT experiences, why it fails)
- **Sighted reader:** reads "Email us to talk pricing…" and "Email us if something is
  broken in production…" linearly, so the trailing clauses disambiguate.
- **Screen-reader user using a links list / rotor:** hears "Email us, link / Email us,
  link". Both share the same `<p>` context, so context cannot distinguish them — and the
  status-bar URL (the `mailto:` address) is, per fd3a94's assumption, **not** counted as
  disambiguating context.
- **Purpose judgment:** `sales@` and `support@` are different mailboxes serving
  different functions (pre-sales vs incident response). They are **not equivalent
  resources**; sending to the wrong one has real consequences. Sighted users *can* tell
  them apart from the surrounding sentence, so AT users are specifically disadvantaged —
  the "ambiguous to users in general" exception does not apply.

## Expected ACT-style outcome
**failed** (SC 2.4.4). Two links with identical accessible name and identical
programmatically determined context resolve to non-equivalent destinations, and the
page conveys (to sighted readers) that they differ, so the purpose is not determinable
from link text + programmatic context for AT users.

## Why automated tools miss it
- Both links have non-empty identical names and valid `mailto:` hrefs — `link-name`
  and "discernible text" rules pass.
- The links share the same DOM-node context, so a context comparison sees them as
  identical and infers nothing wrong.
- A tool would have to know that `sales@` and `support@` are *different purposes* (not,
  say, two aliases for one inbox) and that the page's surrounding prose makes the
  distinction available to sighted users only. That is a semantic, organisational
  judgment — the kind fd3a94 marks not fully automatable.

## Citation
> "This rule assumes that reading the URL, such as from the status bar when the link is focused, is not considered part of the context, and therefore, it does not disambiguate links."
— act-rules/extracted/fd3a94.md (Assumptions)

> "The intent of this success criterion is to help users understand the purpose of each link so they can decide whether they want to follow the link. Whenever possible, provide link text that identifies the purpose of the link without needing additional context."
— wcag-understanding/link-purpose-in-context.html (Intent of Link Purpose (In Context))
