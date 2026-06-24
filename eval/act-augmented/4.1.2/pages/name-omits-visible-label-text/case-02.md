# case-02 — Search field labelled by a hidden query-key node, zero overlap with visible label

## Scenario
A pharmacy site ("RxBridge"). Above the search box sits a real `<label for="med-search">Search
medications</label>` that a sighted user reads. But the input also has
`aria-labelledby="rx-query-key"`, pointing at a visually-hidden `<span>` containing only the back-end
parameter name "rx-query". Because an explicit `aria-labelledby` wins over the associated `<label>`,
the computed name is "rx-query" — sharing **zero words** with the visible label.

## Attribute tuple
- **Content domain:** healthcare / pharmacy
- **UI component / pattern:** search field (`<input type="search">`) with a search button
- **Host-language construct:** native `<label for>` + `aria-labelledby` to a `.visually-hidden` node
- **Locale / i18n:** en-US
- **Failure mechanism:** `aria-labelledby` to a hidden node overrides the real `<label>`; divergence type = **ZERO-OVERLAP** (programmatic name is an internal query key)
- **ARIA anti-pattern (facets.json):** "aria-labelledby points to an empty or wrong/hidden element"

## Developer persona
A junior dev integrating an analytics SDK followed its docs literally: the SDK said "give the search
input an aria-labelledby pointing to the element holding your query-key so events tag correctly." The
dev created a hidden `<span>rx-query</span>` and wired `aria-labelledby` to it for telemetry —
silently overriding the perfectly good `<label>` that was already there.

## Element / selector carrying the issue
`#med-search` — `<input type="search" id="med-search" aria-labelledby="rx-query-key">` with a real
`<label for="med-search">Search medications</label>` visible above it and
`<span id="rx-query-key" class="visually-hidden">rx-query</span>`.

## Exact accessibility mechanism
In the name computation, `aria-labelledby` is consulted before the `<label>` association, so the
visible "Search medications" is discarded. Verified in Chromium: `role=searchbox`,
`accName="rx-query"`. A screen-reader user hears "rx-query, search" — a meaningless slug that
contradicts the on-screen label. A speech-input user who says "click Search medications" fails. Name
is non-empty (ACT rule e086e5 "Form field has non-empty accessible name" PASSES) but is not
determinable as the visible label.

## Expected ACT-style outcome
**failed** (F111 check #1 true, #2 true, #3 false).

## Why automated tools miss it
ACT rule e086e5 and axe/WAVE/Lighthouse confirm `accName !== ""` and stop. The `aria-labelledby` IDREF
resolves to a real, present element, so the "broken aria-labelledby reference" lint (which only fires
on dangling IDREFs) does NOT trigger. No checker reads the visible `<label>` text off the rendered
page and diffs it against "rx-query". The fact that the name is an internal parameter, not the words
on screen, is a semantic judgment requiring a human (or vision model) to read both strings.

## Citation
> "If check #1 is true, but checks #2 and/or #3 are false, the content fails the Success Criterion."
— WCAG Techniques, **F111** (`wcag-techniques/failures/F111.html`), Tests › Expected Results
> (check #3 = "The accessible name contains the text that appears as the visible label.")
