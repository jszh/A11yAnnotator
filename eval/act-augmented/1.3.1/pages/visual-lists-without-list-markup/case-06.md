# case-06 — Trail-conditions page: correct `<ol>` + `<dl>`, plus an inline run that is NOT a list (PASS boundary)

## Scenario
A parks-department "Trail Conditions" page contains three pieces of content that exercise the *boundary* of TT 10.D:
1. An intro paragraph that mentions three trailheads as a comma-separated inline run inside a sentence ("the three trailheads (North Gate, Cedar Loop, and the Overlook spur)…"). Per the TT note, an items-in-a-sentence run is **not** a visually apparent list and correctly needs no list markup.
2. A genuinely ordered "Before you hike" procedure (sequence matters) — correctly coded as `<ol>`.
3. A genuinely term/description "What the trail markers mean" glossary — correctly coded as `<dl>`/`<dt>`/`<dd>`.

This is the deliberate PASS variant: it sharpens the aspect by pairing two correctly-typed lists with a comma-run that must NOT be flagged as a "list without markup."

## Attribute tuple
- **content-domain:** government / civic parks-and-recreation
- **UI-component / pattern:** mixed — ordered procedure (`ol`) + description list (`dl`) + inline comma run
- **host-language construct:** correct `<ol>`/`<li>`, correct `<dl>`/`<dt>`/`<dd>`, and a `<p>` sentence with comma-separated items
- **locale / i18n:** en-US
- **failure-mechanism:** none — included as a true-negative boundary to test over-flagging (comma run is correctly not a list; both visual lists are correctly typed)

## Developer persona
A civic web team that follows an accessibility checklist built this page by hand. They used `<ol>` for the step sequence, `<dl>` for the marker definitions, and deliberately kept the three trailheads as inline prose because they are a phrase in a sentence, not a visually stacked list. This is the "done correctly" reference.

## Element / selector carrying the issue
None. Relevant selectors for inspection: `p.inline` (the comma run that must NOT be flagged), `ol.steps` (correct ordered list), `dl.markers` (correct description list).

## Exact accessibility mechanism (what AT experiences, why it passes)
- The comma-separated trailheads are read as part of a normal sentence; there is no visual list to mismatch, so no list markup is owed (TT note: a list of items separated by commas in a sentence need not be a bulleted/numbered list).
- "Before you hike" is announced as "list, 4 items" with ordered/positional semantics, matching the visible numbered procedure.
- "What the trail markers mean" exposes a description-list group: each `dt` term is paired with its `dd` description, matching the visible term/definition layout.
- Every visually apparent list is programmatically a list of the correct type, with consistent structure → pass.

Verified with Puppeteer: the DOM has 1 `<ol>` (4 `<li>`) and 1 `<dl>` (4 `<dt>` + 4 `<dd>`); the accessibility tree exposes a `list` with four `listitem`s (with ListMarkers) and a `DescriptionList`, and the comma-run paragraph carries no list role — matching the screenshot.

## Expected ACT-style outcome
**passed** (SC 1.3.1 — all visually apparent lists are programmatically identified by correct type; the inline comma run correctly needs no list markup; TT 10.D).

## Why automated tools miss it
This is the inverse trap: an over-eager heuristic might flag the comma-separated trailheads as a "list that should be marked up," producing a false positive — exactly the kind of judgment automated tools get wrong because they cannot tell an in-sentence enumeration from a visually stacked list. A correct verdict requires the human judgment that this run is prose, not a list, and that the two real lists are already the right type — neither of which any axe/WAVE/Lighthouse rule decides.

## Citation
> "Not all lists require markup — a list of items in a sentence separated by commas need not be a bulleted/numbered list."
— refs/trusted-tester/sc-1.3.1-info-and-relationships.md (Test 10.D — Note)

> "When such relationships are perceivable to one set of users, those relationships can be made to be perceivable to all."
— wcag-understanding/info-and-relationships.html (Intent of Info and Relationships)
