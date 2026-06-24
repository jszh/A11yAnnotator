# case-06 — TRUE NEGATIVE: same sales bar chart, but the alt RESOLVES the fact ("Fred and Bob fell below quota; Mary and Andrew met it") and the chart adds non-colour cues

## Scenario
This is the contrast/boundary case for the aspect — the same chart FAMILY as case-01 (four reps'
annual sales against a $3.0M quota, below-quota bars in red), but here the text alternative resolves
the colour-encoded fact instead of merely restating the rule. The chart is an **inline SVG** (so it
is structurally near-identical to a passing F13 example). Its `aria-label` says, in words, WHICH reps
fell below quota: "Fred sold 2.6 million and fell below quota; Bob sold 2.2 million and fell below
quota… Fred and Bob are the two representatives who fell below the quota; Mary and Andrew met it."
The visible caption resolves the same fact in bold text, a data table repeats it, and each below-quota
bar carries a NON-colour cue (a "▼ below quota" tag and a hatch pattern). The red fill is therefore
redundant — every user, including colour-blind and screen-reader users, recovers the conclusion.

## Attribute tuple
- **Content domain:** SaaS sales-analytics dashboard (same as case-01, deliberately, to isolate the semantic difference)
- **UI component / pattern:** inline-SVG bar chart with non-colour status tags + hatch fill + a data table
- **Host-language construct:** inline `<svg role="img">` with a resolving `aria-label`, plus `<figcaption>` and a `<table>`
- **Locale / i18n:** en
- **Failure mechanism:** none — this satisfies G14 (information from colour also in text) and provides a visible non-colour alternative; it is the inverse of F13

## Developer persona
After an accessibility review flagged the original board-pack chart (case-01), the BI developer
remediated it: they rewrote the alt to name the below-quota reps, added a visible bold sentence and a
data table that state who is below quota, and added a "▼ below quota" tag plus a hatch pattern to the
flagged bars so the flag does not depend on perceiving red. They verified the conclusion is readable
in greyscale.

## Element / selector carrying the issue
None carries a failure. The key element is `svg.bars[role="img"]`, whose `aria-label` resolves the
colour-encoded fact; the `figcaption` and the `table.sr` provide the same fact as visible text; the
`▼ below quota` / `✓ met` tags and `pattern#hatch` provide non-colour visual cues.

## Exact accessibility mechanism
A screen-reader user hears the accessible name, which states outright that Fred and Bob fell below
quota and Mary and Andrew met it — the colour-encoded fact is fully in text. A sighted colour-blind
user sees the "▼ below quota" tags, the hatch pattern, and the resolving caption/table, so they reach
the same conclusion without perceiving red. The colour is a redundant enhancement, exactly as WCAG
recommends ("This should not in any way discourage the use of color … if it is complemented by other
visual indication"). No user must rely on colour to identify the below-quota reps.

## Expected ACT-style outcome
**passed** (SC 1.4.1; also satisfies the 1.1.1 equivalence requirement). This page is included to
sharpen the aspect: to an automated scanner it looks almost identical to case-01 (an inline graphic
with `role="img"` and a long accessible name) and BOTH pass every automated check. The only thing that
separates pass from fail is the SEMANTIC content of the alternative — case-01 states the rule, case-06
resolves the fact — which proves the distinction is about meaning, not markup.

## Why automated tools miss it (i.e. why automation cannot tell this PASS from case-01's FAIL)
axe/WAVE/Lighthouse see, on both pages, a named `role="img"` graphic with a long accessible name and
no malformed markup, so both pass identically. Automation cannot read either alt against the rendered
chart to determine whether the colour-encoded fact (who is below quota) is resolved in text. Only a
human who reads the chart and the prose can see that case-06 names Fred and Bob (pass) while case-01
only restates "red = below quota" (fail). That this PASS and case-01's FAIL are statically
indistinguishable is the entire point of the aspect.

## Citation
**Reference:** WCAG Technique G14 (`wcag-techniques/general/G14.html`)
> "The objective of this technique is to ensure that when color differences are used to convey information, such as required form fields, the information conveyed by the color differences are also conveyed explicitly in text."

**Reference:** WCAG Technique F13 (`wcag-techniques/failures/F13.html`)
> "The alternative should indicate which people did not meet the sales quota rather than relying on color."

**Reference:** Understanding SC 1.4.1 (`wcag-understanding/use-of-color.html`)
> "This should not in any way discourage the use of color on a page, or even color coding if it is complemented by other visual indication."
