# case-05 — Toolbar of three "Go" buttons run search, clear the form, and open settings

## Scenario
A municipal transit trip planner ("Riverside Metro Transit"). A `role="toolbar"`
holds two stop fields (From / To) and a cluster of three text buttons, **all labeled
"Go"**. The first "Go" runs the trip search; the second "Go" **clears** the From/To
fields back to empty; the third "Go" **opens the rider settings/preferences** panel.
Each "Go" is plausibly readable next to a search field in isolation, but the single
word never says which of the three distinct functions it triggers — and two of them
("clear", "open settings") are not "go and search" at all.

## Attribute tuple
- **content-domain:** municipal transit schedule / trip planner
- **UI-component / pattern:** ARIA `toolbar` with a cluster of action buttons
- **host-language construct:** three native `<button type="button">`, each text content "Go", inside `<div role="toolbar" aria-label="…">`
- **locale / i18n:** en-US
- **failure-mechanism:** generic action verb ("Go") repeated on three controls with three different functions; one usage (search) is arguably apt, but the same label is reused for clear and settings, where it both fails to convey and actively mismatches the function

## Developer persona
A long-serving municipal developer built the planner in the early 2010s when "Go"
buttons next to search boxes were the house style across the county's sites. When
later tickets asked to "add a reset and a preferences shortcut to the planner bar,"
he copy-pasted the existing styled "Go" button twice to keep the toolbar visually
uniform, wiring new handlers but leaving the familiar "Go" text. Each button "made
sense" to him because he knew which was which by position.

## Element / selector carrying the issue
`.toolbar .grp > button` — three sibling `<button>` elements, all with the accessible
name **"Go"**, mapping to run-search, clear-form, and open-settings respectively.

## Exact accessibility mechanism (what AT experiences, why it fails)
- **Sighted user:** distinguishes the three by position and (slightly) by colour
  shade; even so, "Go" gives no hint that the middle one wipes the form or the last
  opens settings — they would likely learn by clicking.
- **Screen-reader user (toolbar arrow-key navigation / buttons list):** hears "Go,
  Go, Go" with nothing to separate them. "Go" implies *execute the search*, so a
  user reasonably activates one expecting departures and instead erases their
  entered stops or is taken to a settings panel. The accessible name conveys neither
  the differing functions nor any warning of the destructive/navigational ones.
- **Function judgment:** TT 5.B requires each visible button label to make its
  function clear. One generic verb cannot describe three different functions, and for
  two of them ("clear", "settings") the verb is outright misleading.

## Expected ACT-style outcome
**failed** (SC 2.4.6, TT 5.B button-function prong / G131). The labels are present
but do not make the controls' purposes clear; two also mismatch their function.

## Why automated tools miss it
- Each button has a non-empty accessible name and a valid role inside a labelled
  toolbar, so `button-name`, WAVE, and Lighthouse pass. Repeated identical names are
  not a flagged violation.
- A tool cannot know that one "Go" searches, one clears, and one opens settings — the
  functions live in the click handlers and the page's behaviour, not in any
  attribute. Without that, it cannot judge that the shared label fails.
- Recognising that a single verb cannot distinguish three functions — and that "Go"
  actively misdescribes the clear and settings actions — is a semantic, behavioural
  reading no static check performs.

## Citation
> "Each visual button label is sufficiently clear and descriptive, so users know its function."
— refs/trusted-tester/sc-2.4.6-headings-and-labels.md (Test 5.B — Evaluate Results, point 2)

> "Check that each label makes the component's purpose clear."
— wcag-techniques/general/G131.html (Tests — Procedure, step 2)
