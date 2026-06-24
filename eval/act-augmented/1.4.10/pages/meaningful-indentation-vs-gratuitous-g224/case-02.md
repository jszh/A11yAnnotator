# case-02 — Python backfill function whose block indentation is load-bearing (excepted overflow)

## Scenario
A data-engineering platform's developer docs ("Tidepool") embeds a real Python function,
`run_backfill`, inside a `<pre><code>` block. Python's block structure is conveyed entirely by
leading whitespace — indentation *is* syntax. The deepest nested lines exceed 320 CSS px, so at a
narrow viewport the block scrolls horizontally. Because flattening or soft-wrapping would destroy the
visible mapping of statements to their governing `if`/`for`/`else`, the overflow is a permitted,
excepted two-dimensional scroll of a single section of content.

## Attribute tuple
- **Content domain:** developer docs / data-engineering API reference
- **UI component / pattern:** syntax-highlighted code listing in a `<figure><pre><code>`
- **Host-language construct:** `<pre>` `white-space:pre` with a `tab-size` media query (G224 conforming-extra)
- **Locale / i18n:** en (code is language-neutral; Python keywords)
- **Failure mechanism:** NONE — this is the exception side; meaningful indentation legitimately overflows

## Developer persona
A platform docs engineer who knows the G224 technique. They deliberately keep the code preformatted
(it must not wrap — Python whitespace is significant) AND apply the conforming-extra: a media query
that reduces `tab-size` at narrow widths so a low-vision reader has less horizontal scrolling, while
the meaningful structure is preserved. They are doing the right thing; the page exists to make the
boundary against case-01 (prose) and case-05 (wrappable code) tight.

## Element / selector carrying the issue
`figure.code pre` — the Python listing. It overflows 320px, but the overflow is exempt.

## Exact accessibility mechanism
At 320 CSS px the `<pre>` exposes a horizontal scrollbar. For ordinary prose that would be a 1.4.10
failure. Here the indentation is Python's control-flow syntax: a screen-magnifier or low-vision user
relies on the indent level to see which block each statement belongs to, and the code would not even
*run* if the whitespace were altered. SC 1.4.10 explicitly does not apply where wrapping would lose
meaning, so the horizontal scroll of this one section is permitted. The author further reduces
`tab-size` at the narrow breakpoint to minimize that scroll. PASS (by exception + technique).

## Expected ACT-style outcome
**passed** (SC 1.4.10). The overflowing content is meaningful preformatted code (excepted), and the
author applies the G224 reduced-indentation conforming-extra.

## Why automated tools miss it
A scanner sees a `<pre>` with `white-space:pre` overflowing 320px — byte-for-byte the same SIGNAL as
case-01's failing prose block. It cannot read the content and conclude "this is Python, indentation is
load-bearing, the overflow is exempt" while the other "is prose, must wrap." The exempt/not-exempt
determination requires reading and understanding the content's semantics — pure human judgment.

## Citation
**Reference:** Understanding SC 1.4.10 Reflow (`wcag-understanding/reflow.html`)
> "The presentation of text where the layout has specific meaning, such as code indentation for Python or \"ascii art\" as just two examples, would lose meaning if the layout were not presented correctly. This success criterion does not apply where that meaning would be lost."

**Reference:** WCAG Technique G224 (`wcag-techniques/general/G224.html`)
> "A website providing code snippets needs to maintain line indentations, as the indentations are meaningful not only to the structure of the code, but in some languages - such as with Python, are requirements when defining blocks of code."
