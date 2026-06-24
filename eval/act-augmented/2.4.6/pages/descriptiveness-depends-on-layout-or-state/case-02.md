# case-02 — RTL banking column: flex `order` puts "Service fees" heading over the contact block

## Scenario
An Arabic (RTL) retail-banking "My account" dashboard rendered as a single vertical flex
**column** of sibling items. In the DOM the items are, in order: the `<h2>` "رسوم الخدمة"
(Service fees), then the fee schedule, then the `<h2>` "تواصل مع فرعك" (Contact your
branch), then the branch-contact block. Each heading is DOM-adjacent to the content it
describes, so a flat-tree checker passes. But CSS `order` was applied to the flex items
to "tidy the visual rhythm": the fee table was pushed down (`order:4`) and the contact
block pulled up (`order:2`). The rendered visual column therefore reads: **Service-fees
heading → contact block → Contact-branch heading → fee table**. Each heading visually sits
over content it does not describe.

## Attribute tuple
- **content-domain**: online banking / fintech dashboard (account overview)
- **UI-component/pattern**: vertical flex column with `order` overrides on sibling items
- **host-language construct**: `display:flex; flex-direction:column` with per-item `order`
- **locale/i18n**: Arabic, `lang="ar" dir="rtl"`
- **failure-mechanism**: flat-tree vs. visual reading-order divergence via flexbox `order` (compounded by RTL)

## Developer persona
A localization contractor adapted an English LTR dashboard for the bank's Arabic site.
The original LTR design had used `order` to interleave cards for a particular desktop
rhythm. The contractor translated the strings and flipped `dir="rtl"` but left the
`order` declarations in place, assuming "it's just visual ordering." With RTL writing mode
the decoupling of DOM order from rendered order became even harder to eyeball, and QA —
who read the page by tabbing with a screen reader — heard each heading correctly glued to
its content and signed off.

## Element / selector carrying the issue
- FAIL: `#feesHead` ("رسوم الخدمة" / Service fees) — `order:1`, rendered directly above
  `#contactBody` (`order:2`), the branch address/phone/hours it does not describe.
- FAIL: `#contactHead` ("تواصل مع فرعك" / Contact your branch) — `order:3`, rendered
  directly above `#feesBody` (`order:4`), the fee table it does not describe.
- Verified by bounding-box top coordinates: feesHead(117) → contactBody(154) →
  contactHead(366) → feesBody(403).

## Exact accessibility mechanism
A sighted user reads the column top-to-bottom and attributes each heading to the block
rendered immediately beneath it. They see "Service fees" over a postal address and phone
number, and "Contact your branch" over a table of transaction charges — both headings
mis-orient the user, who cannot find the fee schedule by scanning to where the "Service
fees" heading appears. This harms low-vision and cognitively-disabled users who rely on
visible headings to predict and locate content (the SC's stated benefit). A screen-reader
user walking the flat tree hears each heading immediately followed by its matching content
and is unaffected — confirming this is a rendered visual-order failure, not a
programmatic-structure failure.

## Expected ACT-style outcome
**failed** (visible headings do not describe the content perceived under them once
flex `order` is rendered).

## Why automated tools miss it
A checker walks the DOM, where `#feesHead` is immediately followed by `#feesBody` and
`#contactHead` by `#contactBody` — clean descriptive pairs that pass. Automated tools do
not resolve `order` into a rendered reading sequence, and the RTL writing mode further
decouples DOM order from on-screen order. The Arabic text also defeats any lexical
shortcut that might guess topic-vs-content match from English keywords. Judging the
failure requires rendering the page, reading the visible column order, and comparing each
heading's meaning to the block beneath it — human semantic + visual reasoning. b49b2e
orders elements strictly "by the flat tree."

## Citation
> **ACT Rule b49b2e — Heading is descriptive (Expectation & Assumptions)**
> "Each target element describes the topic or purpose of the first perceivable content
> after the test target that is not decorative. The order of elements is determined by the
> flat tree." … "Due to positioning, it is possible to render a document in an order that
> greatly differs from the tree order, in which case the content which is visually
> associated with a heading might not be the content following it in tree order and this
> rule might fail while Success Criterion 2.4.6 Headings and Label is still satisfied."

> **WCAG 2.2 Understanding 2.4.6 — Benefits**
> "Descriptive headings are especially helpful for users who have disabilities that make
> reading slow and for people with limited short-term memory. These people benefit when
> section titles make it possible to predict what each section contains."
