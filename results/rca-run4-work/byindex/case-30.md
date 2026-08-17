CASE INDEX: 30
TESTCASE_ID: 556a7ba560d3
KIND (authoritative, from run4 GT+outcome): FP
SC: 4.1.2   RULE: 5c01ea   ARIA state or property is permitted

This file is SELF-CONTAINED. Below: (1) the harness evidence slice — GT, LLM in-scope verdicts+summaries, off-target barriers, and the model FULL reasoning trace (THINK/SAY/TOOL_CALL/TOOL_RESULT); (2) the fixture HTML inlined.

================= EVIDENCE SLICE =================
# RCA case 556a7ba560d3  [FP]
- rule: 5c01ea  ARIA state or property is permitted
- sc(GT-scored): 4.1.2   expected(GT): passed   outcome: caught   polarity: specificity
- v3Barrier(deterministic): false   inScopeAutoPartial: 0   inScopeObligations: 1
- fixture: eval/checker-comparison/act-subset/pages/5c01ea/556a7ba560d3d3ab0b78fabb46037ac4dc192fd9.html

## in-scope verdicts
- RUBRIC 4.1.2 LIKELY_BARRIER conf=high [accessible-name-adequacy-v0] xpath=/html/body/div[1]
  summary: The accessible name 'My combobox' is generic and uninformative — it merely echoes the widget type rather than describing the combobox's purpose, failing 4.1.2 name adequacy.

## model reasoning trace (per subject)

### subject sc=4.1.2 xpath=/html/body/div[1] rubric=accessible-name-adequacy-v0 verdict=REPRODUCED
THINK: Let me analyze this case. The element is `/html/body/div[1]` with an accessible name "My combobox" (present: true, resolved: true). The element appears to be a div with text "My combobox" visible in both the element-crop and surrounding-region.

The checkerHint mentions checking for prohibited ARIA attributes. Let me think about this - a `<div>` with an accessible name "My combobox" suggests there might be `aria-label="My combobox"` or similar on a div element. 

The rubric says: "When the routed concern is ARIA-attribute LEGALITY" - but I don't see a checkerHint in the pre-computed signals pointing to aria-prohibited-attr. 

Looking at the signals, I only see accessibleName present. The name "My combobox" is problematic because it's generic - it describes the widget type rather than the control's actual purpose. According to the rubric, names like "button", "link", or in this case "combobox" are inadequate when they just label the control type without conveying what it's for. I need to check the accessibility tree to verify the actual role and where that name is coming from.
TOOL_CALL mcp__cdp__query_ax_node input={"targetXpath":"/html/body/div[1]"}
TOOL_RESULT: [{"type":"text","text":"{\"resolved\":true,\"inTree\":true,\"role\":\"combobox\",\"roleSource\":\"role\",\"headingLevel\":null,\"nameFrom\":[\"attribute\"],\"labelledby\":null,\"describedby\":null,\"focusable\":false,\"isAriaHidden\":false,\"requiredStatesPresent\":[\"expanded\"],\"requiredStatesMissing\":[],\"ignoredReasons\":[],\"ignoredByActiveModal\":false}"}]
THINK: Now I have the facts:
- Role: "combobox" (from `role` attribute on the div)
- Name: "My combobox" (from attribute, so likely aria-label="My combobox")
- It's a div with role="combobox"
- Not focusable

The name "My combobox" essentially echoes the widget type ("combobox") with the possessive "My" prepended. This is a generic placeholder-style name — it tells a screen reader user only that there is "my combobox" but not what the combobox is FOR (e.g., "Select country", "Choose font size", etc.). This is analogous to naming a button "My button" or a link "My link" — the name describes the type of widget, not its purpose.
This fails the 4.1.2 name adequacy requirement because the label doesn't communicate the combobox's actual function, just its control type.
SAY: ```json
{
  "verdict": "REPRODUCED",
  "confidence": "high",
  "summary": "The accessible name 'My combobox' is generic and uninformative — it merely echoes the widget type rather than describing the combobox's purpose, failing 4.1.2 name adequacy.",
  "reasoning": "The AX node confirms role='combobox' (from a role attribute on a div) with the name sourced from an attribute (aria-label); the name 'My combobox' tells a non-sighted user only that a combobox exists but conveys nothing about what it selects or controls — it is structurally identical to forbidden generics like 'My button' or 'My link', and no contextual label in the rendered crops supplies the missing purpose.",
  "evidenceRefs": [
    "accessibleName.value = 'My combobox', present:true, resolved:true",
    "query_ax_node → role:'combobox', roleSource:'role', nameFrom:['attribute'], focusable:false",
    "element-crop and surrounding-region show only the text 'My combobox' with no additional context that would disambiguate the combobox's purpose"
  ]
}
```


================= FIXTURE HTML (5c01ea/556a7ba560d3) =================
```html
<!DOCTYPE html>
<html lang="en">
<head>
	<title>Passed Example 7</title>
</head>
<body>
	<div role="combobox" aria-expanded="false" aria-controls="id1" aria-label="My combobox">My combobox</div>
</body>
</html>
```
