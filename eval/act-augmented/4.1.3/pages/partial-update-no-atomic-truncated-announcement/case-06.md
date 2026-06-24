# case-06 — Ambient radio player: aria-atomic="true" rescues "Now playing: Track 4…" (PASS boundary)

## Scenario
An ambient web-radio player shows "Now playing: **Track 1** — Slow Harbor by Elin Brook",
wrapped in `<p role="status" aria-atomic="true">`. Pressing **Skip to next track** rewrites
ONLY the inner value nodes (`#track`, `#title`, `#artist`) — the static "Now playing:" label
is never touched, exactly the partial-update mechanism of the failing cases. But because
`aria-atomic="true"` is set, when any descendant mutates the AT re-announces the ENTIRE
region: "Now playing: Track 4, Tidal Glass by Marin Vale." The announced whole is equivalent
to the visible whole, so the page passes.

## Attribute tuple
- **content-domain**: media / streaming (ambient web-radio player)
- **UI-component/pattern**: "Now playing" track status indicator
- **host-language construct**: `<p role="status" aria-atomic="true">` with inner value nodes
- **locale/i18n**: en
- **failure-mechanism**: NONE — same partial mutation, but `aria-atomic="true"` re-announces the whole region

## Developer persona
A senior dev who has been bitten by the "lone three" bug before built this player. They
update only the changed nodes for efficiency (the natural pattern), but they have learned
the lesson from ARIA22: a `role="status"` region whose inner nodes mutate must be explicit
`aria-atomic="true"` so the whole sentence — including the "Now playing:" framing — is
re-read. They verified with a screen reader that skipping a track announces the full title
and artist, not a bare "Track 4."

## Element / selector carrying the issue
- Region: `p#now-playing[role="status"][aria-atomic="true"]` — atomic explicitly enabled.
- Mutated nodes: `b#track`, `span#title`, `span#artist` — inner values rewritten on skip.

## Exact accessibility mechanism
`aria-atomic="true"` instructs AT to present the entire live region whenever any part of it
changes, "including any author-defined labels (or additional nested elements)" (ARIA22). So
mutating only the inner nodes still triggers a full re-announcement of "Now playing: Track 4,
Tidal Glass by Marin Vale." The blind user hears the same information the sighted user sees —
the framing "Now playing" and the artist context are preserved. This is the correct
remediation for the partial-update trap: keep the efficient inner-node updates, but make the
region atomic so meaning is never truncated.

## Expected ACT-style outcome
**passed** — the status is announced AND the announced text is equivalent to the visible
status (full "Now playing: …" sentence), because the region is atomic.

## Why automated tools miss it
This is the crux of the aspect: axe/WAVE/Lighthouse treat case-06 IDENTICALLY to the failing
cases — all are valid `role="status"` live regions with good contrast and real content. The
tools see a present, well-formed live region and pass every page the same way. They cannot
evaluate that here the announced whole ("Now playing: Track 4, Tidal Glass by Marin Vale")
IS semantically equivalent to the visible whole, whereas in case-01/03/05 the announced
fragment is NOT. Separating this pass from those fails is exactly the human semantic-equivalence
judgment the SC limb demands — and exactly what no automated rule performs.

## Citation
> **WCAG Techniques ARIA22 — Using role=status to present status messages**
> "The role of `status` also has a default `aria-atomic` value of `true`, so that updates to
> the container marked with a role of `status` will result in the AT presenting the entire
> contents of the container to the user, including any author-defined labels (or additional
> nested elements). Such additional context can be critical where the status message text
> alone will not provide an equivalent to the visual experience."

> **WCAG 2.2 Understanding 4.1.3 — Modification of status text**
> "In such situations, marking the entire "3 items" string as the status text would normally
> be a better solution. See Sufficient Techniques for more discussion, including the use of
> `aria-atomic`."
