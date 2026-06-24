# case-04 — Arabic RTL library catalogue: search announces a bare "٢٤"

## Scenario
An Arabic-language library catalogue (RTL) shows a result count: "النتائج: **٠** نتيجة"
("Results: 0 result"), wrapped in `<p role="status">`. On each search, JavaScript rewrites
ONLY the inner `<b id="n">` numeral node (in Eastern Arabic numerals: ٠ → ٢٤). The leading
label "النتائج:" and the trailing unit "نتيجة" never re-render. In a non-atomic environment
the screen reader announces just the changed numeral — a bare "٢٤" / "twenty-four" — having
dropped both the leading "results:" and the trailing "result(s)" framing.

## Attribute tuple
- **content-domain**: digital library / catalogue search (Arabic literary works)
- **UI-component/pattern**: search result-count status line
- **host-language construct**: `<p role="status">` with an inner `<b>` numeral node, `dir="rtl"`
- **locale/i18n**: ar (RTL, Eastern Arabic numerals ٠–٩)
- **failure-mechanism**: numeral-only mutation of a non-atomic region in RTL → orphaned numeral

## Developer persona
A localization engineer ported an English library UI to Arabic. They flipped `dir="rtl"`,
translated the strings, and added a numeral-to-Eastern-Arabic converter. The original
English code already bound only the count node (`nEl.textContent = ...`), and they faithfully
preserved that behaviour while translating. They tested visually in RTL — the sentence
reads correctly right-to-left — but never ran a Arabic screen reader, so they never heard
the bare "٢٤" detached from "النتائج … نتيجة."

## Element / selector carrying the issue
- Region: `p#result-count[role="status"]` — `aria-atomic` is absent.
- Mutated node: `b#n` — the only node JS rewrites per search.

## Exact accessibility mechanism
`role="status"` is polite and *spec-atomic by default*, but ARIA22 warns this is "not
treated as atomic by default in some environments," so an explicit `aria-atomic="true"` is
needed for reliable whole-region re-reading. Without it, in a non-atomic environment the AT
speaks only the mutated numeral. In RTL this is doubly disorienting: the meaning depends on
BOTH the leading label ("results:") and the trailing unit ("result(s)"), and the listener
loses both, hearing "٢٤" floating with no anchor. The sighted user reads the full RTL
sentence; the blind user gets a number that could be a page, a price, a year, or a count.
The remediation is to mark the whole sentence atomic (or rewrite the entire string) so AT
re-reads "النتائج: ٢٤ نتيجة."

## Expected ACT-style outcome
**failed** — the count is announced, but the announced numeral is not equivalent to the
visible status (it loses the surrounding "results … result(s)" framing).

## Why automated tools miss it
Static scanners see a valid `role="status"` region, a labelled `type="search"` field,
correct contrast, valid `lang="ar"`/`dir="rtl"`, and real catalogue items — all pass. They
do not fire the search, do not track which node mutates, and have no model of `aria-atomic`
across AT. There is no rule for "the announced numeral lacks its label and unit," and the
RTL/Eastern-numeral framing is invisible to a structural check. Catching it requires
firing the search and judging that "٢٤" alone does not convey "24 results" — a semantic
equivalence judgment a human must make.

## Citation
> **WCAG 2.2 Understanding 4.1.3 — Modification of status text**
> "However, where only the number in this string was coded as an updated chunk of content,
> the resulting experience for screen reader users could be to only hear "three", which may
> not be sufficient information to provide context for the user. In such situations, marking
> the entire "3 items" string as the status text would normally be a better solution. See
> Sufficient Techniques for more discussion, including the use of `aria-atomic`."

> **WCAG Techniques ARIA22 — Using role=status to present status messages**
> "Note that since `role="status"` is currently not treated as atomic by default in some
> environments, it is advisable to add an explicit `aria-atomic="true"` if the entire
> contents of the container should be announced."
