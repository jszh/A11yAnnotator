# case-03 — Case-management upload: aria-atomic="false" announces a bare "85"

## Scenario
A legal case-management tool uploads a document. A status line reads
"Uploading: **0**% complete", wrapped in `<p role="status" aria-atomic="false">`. As the
upload ticks, JavaScript rewrites ONLY the inner `<span id="pct">` percentage node
(0 → 47 → 85 → 100). Because the author explicitly set `aria-atomic="false"`, the screen
reader announces only the changed subtree — the bare number "85" on each tick — never
"85 percent complete." A sighted user sees the full sentence and the moving bar; a blind
user hears a stream of orphaned numbers.

## Attribute tuple
- **content-domain**: enterprise SaaS / legal case management (document upload)
- **UI-component/pattern**: file-upload progress status line beside a progress bar
- **host-language construct**: `<p role="status" aria-atomic="false">` with a `<span>` value
- **locale/i18n**: en
- **failure-mechanism**: explicit `aria-atomic="false"` + inner-node-only mutation → bare numeral

## Developer persona
A back-end-heavy dev added the upload widget under deadline. They half-remembered "use
aria-atomic for status messages" and pasted a snippet, but flipped it to
`aria-atomic="false"` on purpose — during testing the region kept re-announcing the whole
"Uploading: 12% complete… 18% complete…" line and they found it "too chatty," so they set
`false` to quiet it. That silenced the label *and* the unit, leaving the AT to speak only
the percentage digits. It looked calmer in their manual smoke test (they watched the bar,
they did not listen).

## Element / selector carrying the issue
- Region: `p#upload-status[role="status"][aria-atomic="false"]` — atomic explicitly disabled.
- Mutated node: `span#pct` — the only node JS rewrites per tick.

## Exact accessibility mechanism
`aria-atomic="false"` instructs AT to present only the changed node (and its contents) when
the live region mutates, not the whole region. Since JS touches only `#pct`, the AT
announces "85" with neither "Uploading" nor "percent complete." The number alone is
ambiguous — 85 of what unit? percent? files? seconds? — so the progress information is lost
to a non-visual user, defeating the very purpose of the live region. The correct fix is
`aria-atomic="true"` (re-announce "Uploading: 85% complete") or, to curb chattiness,
throttle updates and keep the full string atomic. Setting `false` to reduce verbosity is
the wrong lever and produces a meaningless announcement.

## Expected ACT-style outcome
**failed** — progress is announced, but the announced fragment ("85") is not equivalent to
the visible status ("Uploading: 85% complete").

## Why automated tools miss it
`aria-atomic="false"` is a perfectly legal attribute value; no linter flags it, and the
region is a valid `role="status"`, so axe/WAVE/Lighthouse pass and even credit the live
region. They do not run the upload, do not see that only the inner span mutates, and have no
heuristic that a bare percentage is unintelligible. Telling this FAIL apart from an
acceptable design requires firing the upload and judging that "85" spoken alone does not
convey "85 percent complete" — a human semantic judgment about meaning, not markup.

## Citation
> **WCAG 2.2 Understanding 4.1.3 — Modification of status text**
> "Typical methods of writing such changes in the page content result in the entire modified
> text string being considered a new change, and thus read by assistive technologies.
> However, where only the number in this string was coded as an updated chunk of content,
> the resulting experience for screen reader users could be to only hear "three", which may
> not be sufficient information to provide context for the user."

> **WCAG Techniques ARIA22 — Using role=status to present status messages**
> "The role of `status` also has a default `aria-atomic` value of `true`, so that updates to
> the container marked with a role of `status` will result in the AT presenting the entire
> contents of the container to the user, including any author-defined labels (or additional
> nested elements). Such additional context can be critical where the status message text
> alone will not provide an equivalent to the visual experience."
