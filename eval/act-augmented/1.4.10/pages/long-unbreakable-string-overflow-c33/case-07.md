# case-07 — FAIL (F102): full release digest + its Copy button are present at 1280px but DISAPPEAR at 320px, with no way to reach them

## Scenario
The Aurelia Registry release page shows the SHA-256 digest an operator must verify byte-for-byte
before deploying an artifact. It is the **width-dependent counterpart to case-06**: same compact
single-column receipt-style layout, same kind of long opaque value — but the loss here is caused
by **reflow**, not a content-design decision. At a desktop viewport (1280px) the page renders the
**full** 96-hex digest (`9f86d081…2e4`, the complete value, which wraps via `overflow-wrap:anywhere`)
**and** a working **"Copy full digest"** button — the value is genuinely present and reachable. A
`@media (max-width: 600px)` block — active in the 320px reflow viewport — then `display:none`s the
full digest, `display:none`s the Copy button, and swaps in a short hard-coded middle-ellipsis
abbreviation (`9f86d081…c0d2e4`). So content that **was** available at the wider viewport — the
complete digest plus the only mechanism to obtain it — is **gone after reflow to 320px**, with no
disclosure, dialog, or link offering it some other way. Probed at both widths: document = viewport
with **zero horizontal overflow** at 1280px AND at 320px (the full digest wraps, nothing overruns);
at 1280px `.digest.full` is shown (96 hex chars) and the Copy button is shown; at 320px both are
`display:none` and only the lossy abbreviation remains.

## Attribute tuple
- **Content domain:** package/artifact registry — software release integrity (supply-chain)
- **UI component / pattern:** release detail rows where a long identifier is shown in full + copyable on desktop
- **Host-language construct:** `@media (max-width:600px)` that sets `display:none` on the full value AND on its copy control, revealing a static `…`-abbreviated stand-in
- **Locale / i18n:** en
- **Failure mechanism:** F102 — content (and its retrieval mechanism) available at a wider viewport DISAPPEARS at the 320px reflow width, with no disclosure/dialog/link to reach the same content (distinct from cases 01-04's overflow-at-320px, and from case-07's rejected width-invariant truncation)

## Developer persona
A front-end engineer built the release page so the full digest is shown and copyable on desktop —
correct. To "tidy up the cramped mobile view," they added a media query that hides the long digest
and the copy button below 600px and drops in a short `head…tail` placeholder for looks. On their
laptop everything is there; they never checked what a low-vision user at 400% zoom (a 320px
viewport) actually gets, where the media query is active and the full value — and the only way to
copy it — have vanished with no replacement.

## Element / selector carrying the issue
`code.digest.full` (the complete digest) and the `.copywrap` Copy control inside the "SHA-256
digest" row. The `@media (max-width:600px)` rule sets `.full{display:none}` and
`.copywrap{display:none}` and `.short{display:inline}`, so at the reflow viewport only the lossy
`span.short` abbreviation is present and there is no control to recover the full value.

## Exact accessibility mechanism
Reflow's requirement is not only "don't overflow" — content available at a wider viewport must
remain **available** after reflow to 320px, repositioned into the single column or offered through
some interaction (disclosure, dialog, link). Here the page reflows with no horizontal scrollbar, so
an overflow check is satisfied; but the digest a user must verify, and the button to copy it, are
both `display:none` at 320px and replaced by a truncation that drops the middle of the value with
no recovery path. A low-vision operator at 400% zoom therefore cannot read or copy the full digest
they need to trust the artifact — the content has disappeared on reflow. (A screen-reader user at a
narrow/zoomed viewport reaches the same DOM and likewise gets only the abbreviation; the full
`<code>` is `display:none`, so it is removed from the accessibility tree too.) The fix is exactly
case-06's: keep the full value available after reflow — repositioned in the single column, or behind
a reveal/disclosure, dialog, or link.

## Expected ACT-style outcome
**failed** (SC 1.4.10). Content (the full digest) and the mechanism to obtain it are present at a
1280px viewport but are removed at the 320px reflow viewport, with no disclosure widget, dialog, or
link providing the same or equivalent content — the F102 failure condition — even though no element
overflows.

## Why automated tools miss it
Nothing overflows at 320px, so even a hypothetical overflow checker passes the page; the ACT rule
mapped to 1.4.10 (`b4f0c3`, "meta viewport allows zoom") also passes — its `<meta name="viewport">`
is fine. axe/WAVE/Lighthouse have no rule that renders the page at **both** 1280px and 320px and
compares which content is still present, which is precisely F102's test procedure. The full digest
and the Copy button exist in the desktop DOM, so static markup analysis sees them and assumes they
are available; only rendering at the 320px reflow viewport reveals that the media query has hidden
them with no equivalent. Recognizing that the abbreviation is a *lossy stand-in for content the user
needs* and that *the wider-viewport version is no longer reachable* requires the wide-vs-narrow
comparison and the semantic judgment that this value matters — human evaluation, and the precise
distinction from the PASS in case-06.

## Citation
**Reference:** WCAG Technique F102 — Description (`wcag-techniques/failures/F102.html`)
> "This document describes a failure that occurs when a change of the viewport width to 320px makes content disappear that was available at wider viewport widths. Some content available at wider widths may not be shown in the same way or at the same position at the viewport width of 320px, simply because there is less space (screen 'real estate') to display it. This content, however, should still be available after reflow to 320px viewport width, either by being repositioned in a single column view, or through some interaction offering the information in some other way, for example, in a disclosure area, a dialog, or via a link to another view."

**Reference:** WCAG 2.2 Understanding — Reflow, Examples → Alternative presentations to truncating content (`wcag-understanding/reflow.html`)
> "The content is presented as truncated, but a link is provided to a web page where the content is fully visible without truncation, or a mechanism is provided on the web page to reveal the truncated content."
