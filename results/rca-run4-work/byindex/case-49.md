CASE INDEX: 49
TESTCASE_ID: 96600720258c
KIND (authoritative, from run4 GT+outcome): FP
SC: 4.1.2   RULE: 4b1c6c   Iframe elements with identical accessible names have equivalent purpose

This file is SELF-CONTAINED. Below: (1) the harness evidence slice — GT, LLM in-scope verdicts+summaries, off-target barriers, and the model FULL reasoning trace (THINK/SAY/TOOL_CALL/TOOL_RESULT); (2) the fixture HTML inlined.

================= EVIDENCE SLICE =================
# RCA case 96600720258c  [FP]
- rule: 4b1c6c  Iframe elements with identical accessible names have equivalent purpose
- sc(GT-scored): 4.1.2   expected(GT): passed   outcome: caught   polarity: specificity
- v3Barrier(deterministic): false   inScopeAutoPartial: 0   inScopeObligations: 1
- fixture: eval/checker-comparison/act-subset/pages/4b1c6c/96600720258c71d467d82fda5d6d0037b7780ec3.html

## in-scope verdicts
- RUBRIC 4.1.2 LIKELY_BARRIER conf=high [accessible-name-adequacy-v0] xpath=/html/body/iframe[1]
  summary: The iframe's accessible name 'List of Contributors' does not match its rendered content, which shows a navigation structure ('Root > Page One' with 'Home' and 'Contact' links), not a list of contributors.

## model reasoning trace (per subject)

### subject sc=4.1.2 xpath=/html/body/iframe[1] rubric=accessible-name-adequacy-v0 verdict=REPRODUCED
THINK: Let me analyze the evidence provided:

1. **Element**: `/html/body/iframe[1]`
2. **Accessible name**: "List of Contributors" (present: true, resolved: true)
3. **Visual content**: The iframe shows "Root > Page One" with a list containing "Home" and "Contact" links

The iframe's accessible name is "List of Contributors" but the rendered content shows what appears to be a navigation/site structure with "Home" and "Contact" links - not a list of contributors at all. This is a clear mismatch between the name and the evident purpose of the iframe.
The accessible name doesn't match what's actually rendered inside the iframe, making it a reproduced case where the label describes something entirely different from the navigation content that's displayed.
SAY: ```json
{
  "verdict": "REPRODUCED",
  "confidence": "high",
  "summary": "The iframe's accessible name 'List of Contributors' does not match its rendered content, which shows a navigation structure ('Root > Page One' with 'Home' and 'Contact' links), not a list of contributors.",
  "reasoning": "The element-crop clearly shows the iframe contains site-navigation breadcrumbs and links ('Home', 'Contact'), while the programmatic name 'List of Contributors' describes entirely different content — a wrong/mismatched name is a 4.1.2 adequacy barrier because a non-sighted user would be misled about the iframe's actual purpose.",
  "evidenceRefs": [
    "accessibleName.value = 'List of Contributors' (present: true, resolved: true)",
    "element-crop: iframe renders 'Root > Page One' breadcrumb + bullet list of 'Home' and 'Contact' navigation links",
    "surrounding-region: confirms same navigation/structural content — no contributor listing visible"
  ]
}
```


================= FIXTURE HTML (4b1c6c/96600720258c) =================
```html
<!DOCTYPE html>
<html lang="en">
<head>
	<title>Passed Example 9</title>
</head>
<body>
	<iframe id="always" title="List of Contributors" src="../_assets/WAI/content-assets/wcag-act-rules/test-assets/iframe-unique-name-4b1c6c/page-one.html"> </iframe>
	
	<div id="host">
		<iframe id="light" title="List of Contributors" src="../_assets/WAI/content-assets/wcag-act-rules/test-assets/iframe-unique-name-4b1c6c/page-two.html"> </iframe>
	</div>
	
	<script>
		const host = document.getElementById('host')
		const shadowRoot = host.attachShadow({ mode: 'open' })
		shadowRoot.innerHTML =
			'<iframe id="shadow" title="List of Contributors" src="../_assets/WAI/content-assets/wcag-act-rules/test-assets/iframe-unique-name-4b1c6c/page-one.html"> </iframe>'
	</script>
</body>
</html>
```
