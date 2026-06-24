# case-01 — Booking checkbox concatenated-named for the WRONG workshop (valid IDREFs, wrong cell)

## Scenario
A conference booking grid ("PaleoCon 2026"). Each session cell has an **Attend** checkbox whose
accessible name is built — ARIA9-style — by concatenating header IDREFs (track + time-slot + session
title + the word "Attend") so a screen-reader/voice user can book without seeing the grid. One
checkbox sits visibly in the **Track 1 / 9–12 AM / "The Paleozoic era"** cell, but its
`aria-labelledby` references the IDREFs of a *different* cell. Its computed name is a perfectly
grammatical, real, on-page string — **"Track 2 2 to 5 PM The Cretaceous period Attend"** — that
mislabels which workshop the control actually books.

## Attribute tuple
- **Content domain:** events / conference scheduling
- **UI component / pattern:** data-table booking grid; checkbox named by concatenated table headers (APG/ARIA9 pattern)
- **Host-language construct:** native `<input type="checkbox">` with `aria-labelledby="<th> <th> <h2> <span>"`
- **Locale / i18n:** en-US
- **Failure mechanism:** correct accName *recipe*, **wrong IDREF targets** — the name is descriptive and well-formed but describes a DIFFERENT control; divergence type = **MISLABELS-FUNCTION** (name accurate-sounding but wrong referent)
- **ARIA anti-pattern (facets.json):** "aria-labelledby points to an empty or wrong/hidden element" (here: *wrong*, not empty)

## Developer persona
A dev wired the booking loop and copy-pasted the `aria-labelledby` IDREF list between cells, then
fixed up most of the IDs but missed the top-left checkbox: it kept the bottom-right cell's
`r-t2 h-pm ttl-cretaceous` references (only the trailing "Attend" span id was localized). Every IDREF
still resolves to a real element, so nothing looked broken in review; no IDE/linter complained.

## Element / selector carrying the issue
`input[name="bk-paleo"]` — physically in the Track 1 / 9–12 AM / "The Paleozoic era" cell, but
`aria-labelledby="r-t2 h-pm ttl-cretaceous att-paleo"` (should be `r-t1 h-am ttl-paleo att-paleo`).

## Exact accessibility mechanism
`aria-labelledby` concatenates the *referenced* nodes' text in order. Verified in Chromium:
`role=checkbox`, `accName="Track 2 2 to 5 PM The Cretaceous period Attend"`. The name is non-empty,
the role is correct, and it even *contains the control's own visible word "Attend"* — but it names the
wrong track, wrong time, and wrong session. A screen-reader/voice user who books "Track 2, The
Cretaceous period" actually toggles the Track 1 Paleozoic seat (and the name is now identical to the
real Cretaceous checkbox, so booking-by-name double-books one session and never books the other). The
name is programmatically determined but is not programmatically determinable *as a name for this
control's function*.

## Expected ACT-style outcome
**failed** — the Name limb of 4.1.2: name present + role correct, but the concatenated name is not
descriptive of *this* control's purpose/function (ARIA9 check #2 false). The other three checkboxes,
whose IDREFs match their own cells, pass.

## Why automated tools miss it
This defeats the obvious automated catch, axe-core `label-content-name-mismatch` (ACT rule **2ee8b8**),
the rule the reviewer correctly flagged. Verified with puppeteer + axe-core: with that experimental
rule explicitly enabled, it reports the checkbox **inapplicable** and raises **no violation** (the
control's visible token "Attend" *is* contained in the accessible name, so the visible-label⊆name
string check is satisfied). A default `axe.run` reports **0 violations** for the controls. Every
IDREF is valid and resolves to a present element, so no dangling-reference lint fires; the name is a
fluent real string, so no empty/slug heuristic fires. Detecting the defect requires reading which
cell the checkbox is *rendered in*, computing its concatenated name, and judging that the name
describes a **different** session — a visual + semantic correspondence check no automated 4.1.2
checker performs. (Note this is NOT 2.5.3 label-in-name: there is no visible label string the name
"omits"; the name is wrong about the control's *function*, which is squarely the 4.1.2 Name limb.)

## Citation
> "Check that the concatenated content of elements referenced by `aria-labelledby` is descriptive for
> the purpose or function of the element labeled"
— WCAG Techniques, **ARIA9** (`wcag-techniques/aria/ARIA9.html`), Tests › Procedure, step 2
> (step 1 — that the referenced ids are unique and resolve — passes here; step 2 fails: the
> concatenated name describes a different workshop than the one this checkbox books.)
