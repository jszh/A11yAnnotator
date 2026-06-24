# case-04 — CI build page: a deep filesystem path in a non-scrolling `<pre>` overflows 320px

## Scenario
The Helix CI "Build #2841 failed" page is a dark-theme dashboard of cards (commit info, failing
artifact, job log). Everything is built to reflow: the key/value commit grid wraps, the SHA uses
`overflow-wrap:anywhere`, and the real job-log viewer (`pre.log`) is a proper scroll container
with `overflow-x:auto`. The trap is a *second*, hand-added callout: the failing artifact path is
shown in `pre.path`, a `<pre>` that inherits `white-space:pre` and has **no** `overflow-x` and
**no** `pre-wrap`. The single deep path (no spaces) is far wider than 320px, so this one `<pre>`
line forces a page-level horizontal scrollbar at 320px (probed: document 1337px vs 320px;
neutralizing only `pre.path` returns the page to exactly 320px — it is the sole offender, while
the correctly-scrollable `pre.log` contributes nothing).

## Attribute tuple
- **Content domain:** developer tooling / CI-CD pipeline dashboard
- **UI component / pattern:** "failing artifact" callout rendered as preformatted text
- **Host-language construct:** `<pre>` with default `white-space:pre`, no overflow handling, no `pre-wrap`
- **Locale / i18n:** en
- **Failure mechanism:** `<pre>` preformatting refuses to wrap a long no-space path, AND (unlike the page's other `<pre>`) lacks an `overflow-x:auto` scroll container → page-level horizontal overflow

## Developer persona
A platform engineer built the dashboard and correctly made the log viewer scroll in its own box.
Weeks later, to make the error more scannable, they pasted a small "Failing artifact" callout
showing just the path, reusing a bare `<pre>` for the monospace look — but forgot to give this
one a scroll container or `white-space:pre-wrap`. On their wide monitor it looked fine. At 320px
this lone `<pre>` overflows the whole page, even though the *bigger* log block beside it behaves.

## Element / selector carrying the issue
`pre.path` containing
`/srv/builds/orchard-svc/2026/06/18/2841/artifacts/release/linux-x86_64/bundle/node_modules/.cache/webpack/production-default-very-long-content-hash-segment/0.pack.gz`.
Contrast with `pre.log` (the job log), which is correctly `overflow-x:auto` and does **not** cause
page overflow.

## Exact accessibility mechanism
For a low-vision engineer at 400% zoom, the dashboard cards stack into one column and the job-log
viewer scrolls within its own box — but the artifact-path `<pre>` blows out the page width,
producing a page-level horizontal scrollbar. They must scroll the whole page left-right to read
the path, and the spurious page scrollbar implies other off-screen content. The path is plain
text with no two-dimensional-layout meaning (its slashes ARE break opportunities the browser
would use if `white-space:pre` weren't forcing a single line), so it should either wrap
(`white-space:pre-wrap`) or live in its own scroll container like the log does. Screen-reader
users hear the path fine; this is a magnification/reflow barrier. Note this is a different
mechanism from cases 01-03: here the culprit is `<pre>` preformatting plus a *missing* scroll
container, not a long inline string or `nowrap` on inline `<code>`.

## Expected ACT-style outcome
**failed** (SC 1.4.10). The artifact path is non-excepted text content displayed in a `<pre>` that
neither wraps nor scrolls in its own container, so it cannot be presented at 320 CSS px without
page-level horizontal scrolling.

## Why automated tools miss it
ACT `b4f0c3` passes (zoom allowed). Both `<pre>` elements are valid markup; no linter
distinguishes the scrollable one from the non-scrollable one. Automated tools do not render at
320px to discover that `pre.path` overflows while the visually-similar `pre.log` is fine, and they
cannot judge that a slash-delimited path is non-essential preformatting that may wrap (vs. ASCII
art or Python indentation where layout is meaningful and the Reflow exception could apply).
Telling "this `<pre>` must wrap/scroll" from "that `<pre>`'s layout is meaningful" is exactly the
context-and-rendering judgment WCAG leaves to a human.

## Citation
**Reference:** WCAG 2.2 Understanding — Reflow, Examples → Preformatted text conveys meaning (`wcag-understanding/reflow.html`)
> "The presentation of text where the layout has specific meaning, such as code indentation for Python or \"ascii art\" as just two examples, would lose meaning if the layout were not presented correctly. This success criterion does not apply where that meaning would be lost. However, this is not the case for most other instances of text where text wrapping can be applied without loss of meaning."

**Reference:** WCAG Technique C33 — Description (`wcag-techniques/css/C33.html`)
> "By default most browsers will wrap long URLs at the following characters: \"/\" Forward Slash ... Sometimes these are not enough to ensure that long URLs will not overflow the viewport."
