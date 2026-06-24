# case-05 — Wrappable shell/SQL commands forced non-wrapping with no wrap mechanism (FAIL)

## Scenario
A SaaS onboarding "Quick start" page shows a long `curl ... | sh` install command and a one-line SQL
`INSERT` the user is meant to copy-paste. Unlike Python, shell and SQL are languages where line
wrapping is NOT essential — a soft-wrap anywhere in a long URL or a long statement loses no meaning.
The lines are simply long and exceed 320 CSS px. The blocks use `white-space: pre` with no wrapping and
no "wrap lines" control (there is only a Copy button), so at a narrow viewport the user must scroll
each command horizontally to read it.

## Attribute tuple
- **Content domain:** SaaS analytics product onboarding / setup wizard
- **UI component / pattern:** code card with a Copy button (and conspicuously NO wrap toggle)
- **Host-language construct:** `<pre>` `white-space:pre` containing shell + SQL (wrappable languages)
- **Locale / i18n:** en
- **Failure mechanism:** wrappable code with no wrap mechanism — the G224 "non-wrapping not essential" limb

## Developer persona
A product engineer dropped in a third-party code-block component that ships with `white-space:pre` and
a Copy button by default. They reasoned "it's code, code is exempt from reflow" — applying the naive
heuristic that anything in `<pre>` is excepted. They never distinguished Python (wrapping loses
meaning) from shell/SQL (wrapping loses nothing), and never added a wrap toggle.

## Element / selector carrying the issue
The two `.codecard pre` blocks (the `curl` install command and the SQL `INSERT`). Both are wrappable
code with no wrap mechanism.

## Exact accessibility mechanism
At 320 CSS px each command runs far past the viewport and the `<pre>` exposes a horizontal scrollbar.
For these languages, nothing is lost by wrapping: a low-vision user could read the whole command in a
single column if it wrapped. Because the code is wrappable and no wrapping mechanism (`pre-wrap` or a
"wrap lines" toggle) is provided, the user is forced into horizontal scrolling to read each line —
exactly what 1.4.10 prohibits. The "preformatted text conveys meaning" exception does NOT apply because
the line breaks are not meaningful to shell/SQL. FAIL. (case-06 fixes this by adding a working toggle.)

## Expected ACT-style outcome
**failed** (SC 1.4.10). Per G224, code whose non-wrapping is not essential must wrap or offer a wrap
mechanism; here it does neither.

## Why automated tools miss it
The signal is identical to case-02's PASS: a `<pre>` with `white-space:pre` overflowing 320px. A tool
cannot read the bytes and decide "this is shell/SQL — wrapping loses no meaning, so it must wrap" while
"that is Python — wrapping loses meaning, so it is exempt." Worse, the common heuristic "it's in `<pre>`
so the code is exempt" is itself wrong per G224. Only a human who reads the code and knows the
language's wrapping semantics can make the call.

## Citation
**Reference:** WCAG Technique G224 (`wcag-techniques/general/G224.html`)
> "Or, for code where non-wrapping lines are not essential, the code wraps or a mechanism is provided to allow line wrapping."

**Reference:** Understanding SC 1.4.10 Reflow (`wcag-understanding/reflow.html`)
> "This success criterion does not apply where that meaning would be lost. However, this is not the case for most other instances of text where text wrapping can be applied without loss of meaning."
