# case-05 — Safety-critical ordered list suppressed with `<ol role="presentation">` (F92, list variant)

## Scenario
A first-aid article gives step-by-step instructions for using an adrenaline auto-injector
(EpiPen). The six steps are a genuine *ordered* procedure: sequence is safety-critical
(remove the safety cap *before* injecting; give a *second* injector only after the first
has had 5 minutes). It is correctly authored as an `<ol>` — which would normally expose to
a screen reader as "list, 6 items" with each step announced by position ("1 of 6", "2 of
6", …). The author then put `role="presentation"` on the `<ol>` and re-created the visible
step numbers as a CSS `::before` counter (red circular chips).

## Attribute tuple
- **content-domain:** health / emergency first aid
- **UI-component/pattern:** numbered procedure (ordered list with custom number chips)
- **host-language construct:** `<ol role="presentation">` + CSS `counter()` `::before`
- **locale/i18n:** en
- **failure-mechanism:** F92 (list variant) — ordered-list semantics suppressed; order is now visual-only

## Developer persona
A content engineer wanted bespoke red number badges instead of the browser's default list
markers. They applied a CSS reset (`list-style:none`) and, to stop screen readers
"announcing it as a boring list", added `role="presentation"` — a misconception that the
role is a styling/cleanup tool. To restore the look of numbers they used a `counter()`
`::before`, not realising generated content is not announced as list position. It looked
identical, so it shipped.

## Element / selector carrying the issue
`ol.steps[role="presentation"]` — the role suppresses the list role and its
required-owned `<li>` semantics; the visible ordinals are CSS generated content
(`li::before { content: counter(step) }`), which AT does not expose. Verified in the
Chromium accessibility tree: the `<ol>` contributes **no** `list`/`listitem` nodes
(snapshot `{}` for list roles).

## Exact accessibility mechanism
`role="presentation"` removes the list role and the implicit `listitem` semantics of the
`<li>` children from the accessibility tree. A screen-reader user no longer hears "list, 6
items" nor any "X of 6" position; the steps become six consecutive paragraphs of text with
no count and no ordinal. The red number chips are CSS `::before` generated content, which
assistive technology does not announce — so the *order and total*, which sighted users get
from the numbered badges, are conveyed visually only. For a procedure where doing step 6
before step 2 is dangerous, the sequence relationship is no longer programmatically
determinable (TT 10.D fails — a visually apparent ordered list is not programmatically
identified as a list).

## Expected ACT-style outcome
**failed** (F92, list variant; Trusted Tester 10.D `1.3.1-list-type`). No `<th>`/table
rule applies (not a table); the failure is the suppression of a semantic list that
conveys essential order.

## Why automated tools miss it
ACT treats `role="presentation"` only as an inapplicability trigger: the list leaves the
accessibility tree, so list-structure checks don't apply — there is no rule that fires on
"a real ordered list was suppressed". axe/WAVE/Lighthouse raise nothing because
`role="presentation"` on a list is legitimate for purely decorative lists, and a CSS
`counter()` is valid. Detecting the failure requires recognising that *this* list conveys
essential, safety-critical sequence and a meaningful item count — a semantic judgment
about whether the content "should" retain list semantics, plus the visual observation that
the only remaining ordinal cue is decorative CSS.

## Citation
> **Reference:** WCAG Techniques — F92 "Failure of Success Criterion 1.3.1 due to the use
> of role presentation on content which conveys semantic information"
> (`wcag-techniques/failures/F92.html`)
>
> **Quote (verbatim):** "This failure occurs when a role of presentation is applied to an
> element whose purpose is to convey information or relationships in the content." … "The
> WAI-ARIA role of `presentation` … is intended to suppress semantic information of
> content from the accessibility API and prevent user agents from conveying that
> information to the user. Use of `role="presentation"` for content which should convey
> semantic information may prevent the user from understanding that content."

> **Reference:** Trusted Tester v5.1.3 — Test 10.D `1.3.1-list-type`
> (`refs/trusted-tester/sc-1.3.1-info-and-relationships.md`)
>
> **Quote (verbatim):** "**Ordered** (`ol`) — numbered sequentially / hierarchically (1,
> 2, 2.a, 2.a.i) where sequence or reference-by-number matters."
