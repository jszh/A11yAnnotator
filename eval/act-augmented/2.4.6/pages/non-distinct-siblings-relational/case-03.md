# case-03 — Online-banking overview: three accounts each headed "Account Summary"

## Scenario
An online-banking "Your accounts overview" page lists three accounts — Everyday Checking, High-Yield Savings, and a Platinum Rewards credit card — each in its own `<section>` opened by an `<h2>`. All three `<h2>` headings read **"Account Summary"**. The distinguishing nickname and masked number ("Everyday Checking · ····4821") sits in a non-heading `<div class="num">` below each heading. The three accounts have very different balances and purposes, but the heading list is three identical entries.

## Attribute tuple
- **content-domain:** online banking / fintech dashboard
- **UI-component / pattern:** account-summary cards as labelled `<section>`s (landmark-style content regions)
- **host-language construct:** three `<section aria-labelledby>` each with an `<h2>` + body `<div>`s
- **locale / i18n:** en-US
- **failure-mechanism:** relational/uniqueness failure of G130 — "Account Summary" accurately names each block in isolation, but the three sibling headings are identical and therefore do not distinguish Checking from Savings from Credit Card in a heading list or heading-to-heading jump

## Developer persona
A bank's design-system team built a reusable `AccountSummaryCard` web component. The component template hard-codes its section heading to the component's own name — `<h2>Account Summary</h2>` — and slots the account nickname into a smaller "meta" line, because the visual mock-up showed the nickname styled as secondary text under a consistent card title. The card was reviewed once in isolation (where "Account Summary" reads fine) and then stamped three times on the overview page; nobody reviewed the resulting page-level heading list.

## Element / selector carrying the issue
`main section.acct > h2` — the three `<h2>` elements (`#h-checking`, `#h-savings`, `#h-credit`), all containing the text "Account Summary". The differentiator is in the sibling `div.num`, which is not a heading. Each `<section>` is even `aria-labelledby` its own "Account Summary" h2, so the accessible name of all three regions is also "Account Summary".

## Exact accessibility mechanism (what AT experiences, why it fails)
- A sighted user reads each card's nickname and balance and instantly tells the three accounts apart; the credit-card balance is even shown in red.
- A screen-reader user who opens the headings list to jump to "my savings account" sees/hears three indistinguishable "Account Summary" entries. Jumping H2-to-H2 announces "heading level 2, Account Summary" three times. Worse, because each `<section>` is `aria-labelledby` its own h2, region navigation also announces three identically named "Account Summary" regions. The user must read the body text of each in turn to find the right account — defeating the orientation that headings exist to provide.
- Per G130, a heading must identify its section "in relation … to other sections of the same web page" and authors should "put the most important information at the beginning of each heading." The distinguishing word here (Checking / Savings / Credit) appears nowhere in the heading, so the relational requirement fails.

The defect is real in the DOM: three `<h2>` nodes all contain "Account Summary"; a screen reader will announce them identically.

## Expected ACT-style outcome
**failed** (SC 2.4.6 — heading limb / TT 10.A: headings do not adequately distinguish their sections relative to siblings; G130 relational requirement not met).

## Why automated tools miss it
The headings are present, non-empty, sequential (single h1 → three h2), and validly marked up, so axe-core (`empty-heading`, `heading-order`, `page-has-heading-one`), WAVE, and Lighthouse all PASS. "Account Summary" is a legitimate, accurate phrase for a block summarizing an account — there is no string a linter could flag as "bad". Detecting the failure means recognizing the page holds three *different* accounts, that the true differentiator was demoted out of the heading, and that the resulting heading list cannot orient a user — a whole-page semantic comparison no static checker performs.

## Citation
> "Authors may also want to consider putting the most important information at the beginning of each heading. This helps users \"skim\" the headings to locate the specific content they need, and is especially helpful when browsers or assistive technology allow navigation from heading to heading."
— wcag-techniques/general/G130.html (Description)

> "Descriptive headings are especially helpful for users who have disabilities that make reading slow and for people with limited short-term memory. These people benefit when section titles make it possible to predict what each section contains."
— wcag-understanding/headings-and-labels.html (Benefits of Headings and Labels)

> "1. For each visually identified heading, compare the heading text to the content beneath the heading." … "The heading describes the topic or purpose of its content."
— refs/trusted-tester/sc-2.4.6-headings-and-labels.md (Test 10.A — How to Test / Evaluate Results)
