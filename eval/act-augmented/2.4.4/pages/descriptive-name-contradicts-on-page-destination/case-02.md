# case-02 — "Skip to main content" skip link whose href is #site-footer instead of #main

## Scenario
A county parking-permit application page opens with the canonical skip link
**"Skip to main content"** — the single best-known, most-recommended skip-link wording.
The page has a real `<main id="main">` containing the application form and a real
`<footer id="site-footer">` containing contact info. The skip link's `href` is
**`#site-footer`**, so instead of jumping the keyboard user past the navigation and into
the form (the actual main content at `#main`), it sends them to the very bottom of the
page, below the entire form. Both anchors exist and resolve; the link "works" — it just
delivers the opposite of what its name promises.

## Attribute tuple
- **content-domain:** government / civic services portal
- **UI-component / pattern:** skip-navigation link (bypass block)
- **host-language construct:** `<a class="skip" href="#site-footer">` targeting the wrong landmark id
- **locale / i18n:** en-US
- **failure-mechanism:** descriptive name vs. actual destination mismatch — "main content" name points to the footer

## Developer persona
A government contractor themed a starter template that shipped with two anchor targets,
`#main` and `#site-footer`. When wiring the skip link they autocompleted the `href` in the
editor and accepted the first suggestion (`#site-footer`) instead of `#main`. Because the
visible skip-link text is hard-coded in the template ("Skip to main content"), nobody
noticed the href no longer matched the words. The link still moves focus somewhere, so it
passed a quick keyboard smoke test where the tester just confirmed "Tab once, focus moves".

## Element / selector carrying the issue
`a.skip` — accessible name "Skip to main content", `href="#site-footer"`. The honest target
is `main#main` (the permit form). The contradicting target is `footer#site-footer`.

## Exact accessibility mechanism (what AT experiences, why it fails)
- **Keyboard / screen-reader user:** the skip link exists precisely so they can bypass the
  repeated nav and reach the page's main content quickly. They activate "Skip to main
  content" and focus jumps to `#site-footer` — the contact-hours footer at the bottom — so
  they have skipped the entire application form. To reach the form they must now navigate
  backwards, defeating the link's whole purpose. The name said "main content"; the
  destination is the footer.
- **Switch-access user:** every action costs keystrokes; being sent to the footer and
  having to traverse back up is exactly the burden 2.4.4 aims to prevent.
- The defect is real in the DOM — `href` is `#site-footer` and that element is the footer —
  so any agent that follows the link experiences the contradiction directly.

## Expected ACT-style outcome
**failed** (SC 2.4.4). The link's accessible name ("Skip to main content") does not
describe the link's actual purpose/destination, which is the page footer, not the main
content.

## Why automated tools miss it
- "Skip to main content" is the *recommended* skip-link text; every name-quality heuristic
  treats it as ideal, and tools often reward the mere presence of a skip link.
- `#site-footer` resolves to a real element, so broken-fragment checks pass.
- `<main>` and `<footer>` are both present and correctly used, so landmark checks pass.
- Deciding the link is wrong requires knowing that "main content" should target the
  `<main>` form, not the `<footer>` — i.e. resolving the fragment, identifying what that
  destination *is*, and judging it contradicts the link's promise. That is human semantic
  reasoning, not a static rule.

## Citation
> "Meaningful link text also helps those who wish to tab from link to link. Meaningful links help users choose which links to follow without requiring complicated strategies to understand the page."
— wcag-understanding/link-purpose-in-context.html (Intent of Link Purpose (In Context))

> "Having the link and the title agree, or be very similar, is good practice and provides continuity between the link 'clicked on' and the web page that the user lands on."
— wcag-understanding/link-purpose-in-context.html (Intent of Link Purpose (In Context))
