# case-05 — Stock watchlist announces "+2.3%" with no ticker symbol (RTL Arabic; row symbol is the locator)

## Scenario
An Arabic, right-to-left stock-trading platform ("نَواة") watchlist table. Four equities (أرامكو,
الراجحي, سابك, stc) each occupy a row: symbol + company, price, and a Change cell. The Change cell of
each row is its own `role="status"` / `aria-atomic="true"` live region. Pressing "تحديث الأسعار"
(Refresh prices) writes the new percentage change (e.g. "+2.3%", "−1.2%") into each row's region. The
region announces its whole contents — but the contents are only the percentage. Which equity moved is
conveyed only by which row (i.e., which ticker symbol in the first column) the change sits beside.

## Attribute tuple
- **content-domain:** online banking / fintech trading dashboard
- **UI-component/pattern:** real-time market watchlist table with per-row live region (real-time updates not announced with context)
- **host-language construct:** per-`<tr>` `<td role="status" aria-live="polite" aria-atomic="true">` set to a bare percentage
- **locale/i18n:** Arabic, `dir="rtl"`, `lang="ar"` (RTL i18n facet — sighted reading order is right-to-left, AT announcement order is unaffected)
- **failure-mechanism:** announced status carries only the volatile percentage; the ticker symbol that the visual row supplies is never placed in the atomic region

## Developer persona
A fintech front-end developer localizing a watchlist for an Arabic market. They correctly set
`dir="rtl"` and `lang="ar"`, used `tabular-nums`, and made each Change cell a live region so price
moves announce in real time — genuinely thoughtful work. They wrote only the percentage into the region
because, visually, the percentage is right next to its symbol in the same row and the association is
obvious. They did not realize that an AT user hears the percentage with no symbol; in a watchlist of
many rows updating together, the announcements ("plus 2.3 percent," "minus 1.2 percent") are unattached
to any equity. They equated visual row-adjacency with announced context.

## Element / selector carrying the issue
The per-row Change cells `#c1`–`#c4` (`td.chg[role="status"][aria-live="polite"][aria-atomic="true"]`).
On refresh each is set to e.g. `"+2.3%"` with no symbol. The ticker symbol lives in the row's first
cell (`.sym`), outside the live region.

## Exact accessibility mechanism (what AT experiences, why it fails)
On "تحديث الأسعار," all four polite live regions update. A screen reader (e.g. NVDA/JAWS with Arabic
TTS, or VoiceOver) announces each region's atomic contents: "زائد 2.3 بالمئة" / "+2.3 percent," etc.
It does **not** announce the row's symbol cell, because a live region speaks only its own changed
atomic contents, not adjacent unchanged cells in the row. A sighted RTL reader sees "+2.3%" immediately
to the left of "أرامكو" and binds them. A screen-reader user hears a stream of percentages with no
tickers and cannot tell which holding moved — exactly when that information is most time-critical. The
fix is to include the symbol inside each atomic region (e.g. "أرامكو +2.3%"). Note RTL does not change
this: announcement order follows the DOM/accessibility tree, and the symbol is simply absent from the
announced region regardless of visual direction.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
Every Change cell is a present, valid, non-empty live region announced in full — not an F103
missing-role case, not a partial-atomic clipping case. `dir`/`lang` are correct, so i18n linting passes
too. No automated rule asserts that a numeric status must carry the identity of the entity it describes
when that identity is established by table-row position. axe/WAVE/Lighthouse cannot infer that "+2.3%"
is meaningless without "أرامكو," because doing so requires understanding the table's row semantics and
that the symbol cell supplies context the announced cell omits — human judgment, not markup parsing.

## Citation
> **WCAG 2.2 Understanding 4.1.3, `wcag-understanding/status-messages.html` — "Modification of status text":**
> "where only the number in this string was coded as an updated chunk of content, the resulting
> experience for screen reader users could be to only hear "three", which may not be sufficient
> information to provide context for the user."

> **WCAG 2.2 Understanding 4.1.3, `wcag-understanding/status-messages.html` — "Non-displayed text specific to AT users":**
> "the proximity of new content to other pieces of information on the screen may provide a visual
> context that is lacking in the text alone. ... authors may wish to designate additional content for
> inclusion in the status message, including non-displayed text which can be provided to the assistive
> technologies, for added context."

> **EN 301 549 Annex C, `docs/analysis/en301549/EN301549-ANNEX-C-RELEVANT-CLAUSES.md` — C.9.4.1.3 Status messages:**
> "Check that the web page does not fail WCAG 2.2 Success Criterion 4.1.3 Status Messages according to
> WCAG Conformance Requirements stated in clause 9.6."
