# case-01 — Lone "Read more" in its own paragraph; headline is not link context

## Scenario
A local-newspaper front page runs a lead story. Below two body paragraphs sits a single
call-to-action: a paragraph whose entire content is the link **"Read more"**. The only
text that would tell a reader where the link goes is the headline `<h2>` far above it —
which is in a *different* block. Nothing in the link's own paragraph (its
programmatically determined context) names the destination.

## Attribute tuple
- **content-domain**: news / long-form editorial (local newspaper front page)
- **UI-component/pattern**: lead-article "Read more" teaser link
- **host-language construct**: `<a>` that is the sole content of a `<p>`
- **locale/i18n**: en
- **failure-mechanism**: generic boilerplate name with no purpose words in the link's own block (the descriptive headline lives outside the programmatic context — the F63 "adjacent block" failure)

## Developer persona
A part-time CMS author at the paper pastes each story into a WYSIWYG template. The
template auto-inserts a "Read more" button on its own line beneath the body copy; the
author never edits the button text because "it already says Read more, that's what it's
for." They assume the headline above makes it obvious — which it does *visually on this
page*, but not when a screen-reader user pulls up the links list.

## Element / selector carrying the issue
- FAIL: `p.more-row > a[href="/news/ferry-terminal-approved-full"]` — accessible name "Read more".

## Exact accessibility mechanism
A screen-reader user invoking the Links List (or tabbing link-to-link) hears only
"Read more, link." The accessible name is non-empty, so the link is *named* — but the
name does not convey purpose. To recover the purpose the user would have to leave the
link, hunt upward to the `<h2>`, and infer the association. The headline is **not**
programmatically determined link context: it is not in the same sentence, paragraph,
list item, or table cell as the link, and there is no `aria-labelledby`/`aria-describedby`
tying them together. This is exactly the F63 "Read More... in an adjacent paragraph"
condition: the context needed to understand the link is in content that is not the link's
programmatic context.

## Expected ACT-style outcome
**failed** — the link's purpose cannot be determined from the link text together with its
programmatically determined link context.

## Why automated tools miss it
The `<a>` has a non-empty, computable accessible name ("Read more"), so axe-core, WAVE,
Lighthouse, and ACT rule c487ae (pure name-presence gate) all PASS. There is only one such
link on the page, so identical-link-text heuristics never fire. A tool could keyword-match
the literal string "read more," but it cannot decide whether the *surrounding programmatic
context* rescues it — here it does not, because the only descriptive text (the headline) is
in a separate block the link does not reference. Determining that requires a human to read
the link relative to its containing paragraph and judge purpose-sufficiency.

## Citation
> **WCAG Techniques — F63: Failure of Success Criterion 2.4.4 due to providing link context only in content that is not related to the link**
> "A news service lists the first few sentences of an article in a paragraph. The next
> paragraph contains the link 'Read More...'. Because the link is not in the same paragraph
> as the lead sentence, the user cannot easily discover what the link will let the user read
> more about."

> **WCAG 2.2 Understanding 2.4.4 — Intent**
> "Whenever possible, provide link text that identifies the purpose of the link without
> needing additional context. Assistive technology has the ability to provide users with a
> list of links that are on the web page. Link text that is as meaningful as possible will
> aid users who want to choose from this list of links."
