# case-02 — API docs show a 64-char bearer token in inline `<code white-space:nowrap>`, overflowing 320px

## Scenario
The Meridian Payments developer docs page "Authenticating requests" is a responsive two-pane
layout (sidebar + content) that collapses to a single column on small screens. Fenced code
**blocks** are handled correctly — they sit in a `<pre>` with `overflow-x:auto`, so they scroll
in their own box (allowed). The trap is an **inline** secret in body prose: the sandbox bearer
token is shown as `<code class="tok">` with `white-space:nowrap`. The author wanted the 64-char
token to be selectable "as one piece" so customers don't copy a line-broken value. But `nowrap`
suppresses the only wrap escape, so at 320px that inline token is 503px wide and forces a
page-level horizontal scrollbar (probed: document 521px vs 320px; neutralizing only `code.tok`
returns the page to exactly 320px).

## Attribute tuple
- **Content domain:** developer docs / API reference (payments)
- **UI component / pattern:** prose paragraph containing an **inline** `<code>` secret (not a fenced block)
- **Host-language construct:** `<code style="white-space:nowrap">` inside a `<p>` in a responsive flex layout
- **Locale / i18n:** en
- **Failure mechanism:** `white-space:nowrap` forces a long token to refuse wrapping → inline-text horizontal overflow at 320px (distinct from case-01's *missing* overflow-wrap — here wrapping is actively *suppressed*)

## Developer persona
A developer-advocate wrote the docs in Markdown. They knew code blocks should scroll, so they
wrapped the cURL example in a `<pre>` with `overflow-x:auto` — correct. For the inline token they
copied a CSS snippet from a Stack Overflow answer titled "stop my API key from breaking across
lines," which set `white-space:nowrap`. It looked tidy on their laptop. They never tested the
single-column mobile/zoom view, so the suppressed-wrap token quietly overflows there.

## Element / selector carrying the issue
`code.tok` (the inline element containing
`mp_test_8Kd2Lf9Qe4Rt7Yu1Io5Pa3Sg6Hj0Kl2Zx8Cv4Bn7Mq1Wr5Et9Yu3Io6`) inside the
"Your test token" paragraph. The fenced `pre.block` above it is **not** the offender — it scrolls
in its own container.

## Exact accessibility mechanism
At 400% zoom / 320px viewport the whole article reflows into one column, but the paragraph
containing the inline token cannot wrap there: `white-space:nowrap` keeps the 64-char token on a
single line that overruns the viewport, dragging a page-level horizontal scrollbar with it. A
low-vision developer trying to read the authentication instructions must scroll left-right to
read that paragraph and may believe additional content lies off-screen. The token is short enough
to wrap harmlessly without `nowrap` (or with `overflow-wrap:anywhere` per C33), and breaking a
displayed secret across lines does not change its value when copied — so the suppression buys
nothing and breaks Reflow. This is a magnification/low-vision barrier, invisible to a
screen-reader user.

## Expected ACT-style outcome
**failed** (SC 1.4.10). The inline `<code>` is non-excepted text content that cannot be presented
within a 320 CSS px width without horizontal scrolling because `white-space:nowrap` forbids the
wrap that would otherwise occur.

## Why automated tools miss it
The viewport meta allows zoom, so ACT rule `b4f0c3` passes. The `<code>` is well-formed with
real text content — no linter rule fires. Automated checkers do not render the page at 320px and
do not reason that `white-space:nowrap` on an inline element containing a long no-space string
will overflow a fluid column. Distinguishing this from the **correctly** scrollable fenced block
right above it — same monospace, same kind of content, opposite disposition — requires rendering
plus the judgment that an inline secret has no two-dimensional exception while a self-scrolling
code block's overflow is its own contained concern. That is human visual + contextual analysis.

## Citation
**Reference:** WCAG 2.2 Understanding — Reflow, In brief (`wcag-understanding/reflow.html`)
> "Make lines of text reflow within the viewport."

**Reference:** WCAG Technique C33 — Description (`wcag-techniques/css/C33.html`)
> "The objective of this technique is to present URLs without introducing a horizontal scroll bar at a width equivalent to 320 CSS pixels or a vertical scroll bar at a height equivalent to 256 CSS pixels. This is done by using CSS techniques that adapt to the available viewport space."
