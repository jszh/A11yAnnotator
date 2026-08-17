CASE INDEX: 48
TESTCASE_ID: 40e3400d782b
KIND (authoritative, from run4 GT+outcome): FP
SC: 4.1.2   RULE: 4b1c6c   Iframe elements with identical accessible names have equivalent purpose

This file is SELF-CONTAINED. Below: (1) the harness evidence slice — GT, LLM in-scope verdicts+summaries, off-target barriers, and the model FULL reasoning trace (THINK/SAY/TOOL_CALL/TOOL_RESULT); (2) the fixture HTML inlined.

================= EVIDENCE SLICE =================
# RCA case 40e3400d782b  [FP]
- rule: 4b1c6c  Iframe elements with identical accessible names have equivalent purpose
- sc(GT-scored): 4.1.2   expected(GT): passed   outcome: caught   polarity: specificity
- v3Barrier(deterministic): false   inScopeAutoPartial: 0   inScopeObligations: 2
- fixture: eval/checker-comparison/act-subset/pages/4b1c6c/40e3400d782be79d036ea5119ff231acb7884f21.html

## in-scope verdicts
- RUBRIC 4.1.2 LIKELY_BARRIER conf=high [accessible-name-adequacy-v0] xpath=/html/body/iframe[1]
  summary: The iframe's accessible name 'List of Contributors' does not match its rendered content, which shows a site navigation structure ('Root > Page One' with 'Home' and 'Contact' links).
- RUBRIC 4.1.2 LIKELY_BARRIER conf=high [accessible-name-adequacy-v0] xpath=/html/body/iframe[2]
  summary: The iframe's accessible name 'List of Contributors' does not match its visible content, which shows a navigation structure with 'Home' and 'Contact' links — not a list of contributors.

## model reasoning trace (per subject)

### subject sc=4.1.2 xpath=/html/body/iframe[1] rubric=accessible-name-adequacy-v0 verdict=REPRODUCED
THINK: Let me analyze the evidence provided:

1. **Element**: `/html/body/iframe[1]`
2. **Accessible name**: "List of Contributors" (present: true, resolved: true)
3. **Visual content**: The iframe shows "Root > Page One" with a list containing "Home" and "Contact" links

The accessible name is "List of Contributors" but the rendered content of the iframe shows navigation links ("Home" and "Contact") under a breadcrumb "Root > Page One". This appears to be a navigation/sitemap iframe, not a "List of Contributors."

The name "List of Contributors" does NOT match the evident purpose of the iframe as rendered - it shows navigation links, not contributors. 

This is a mismatch where the accessible name describes something entirely different from what's actually rendered, which matches the failure criteria in the rubric. The verdict is REPRODUCED.
SAY: ```json
{
  "verdict": "REPRODUCED",
  "confidence": "high",
  "summary": "The iframe's accessible name 'List of Contributors' does not match its rendered content, which shows a site navigation structure ('Root > Page One' with 'Home' and 'Contact' links).",
  "reasoning": "The element-crop clearly shows a navigation/breadcrumb panel with links ('Home', 'Contact') under 'Root > Page One', but the programmatic name 'List of Contributors' describes an entirely different purpose — a non-sighted user would be misled about what this iframe contains, matching the rubric's explicit failure pattern of 'a name that describes a DIFFERENT control than the one rendered'.",
  "evidenceRefs": [
    "accessibleName.value = 'List of Contributors' (present:true, resolved:true)",
    "element-crop: rendered content shows 'Root > Page One' breadcrumb with bullet list of 'Home' and 'Contact' navigation links",
    "surrounding-region: confirms same navigation iframe content alongside a second similar iframe"
  ]
}
```

### subject sc=4.1.2 xpath=/html/body/iframe[2] rubric=accessible-name-adequacy-v0 verdict=REPRODUCED
THINK: The element is an iframe with accessible name "List of Contributors". The crop shows content "Root > Page One" with links "Home" and "Contact". The name "List of Contributors" doesn't match what the iframe actually contains - it shows navigation links (Home, Contact), not a list of contributors. This is a name adequacy failure.
SAY: ```json
{
  "verdict": "REPRODUCED",
  "confidence": "high",
  "summary": "The iframe's accessible name 'List of Contributors' does not match its visible content, which shows a navigation structure with 'Home' and 'Contact' links — not a list of contributors.",
  "reasoning": "The element-crop clearly renders 'Root > Page One' with bullet links 'Home' and 'Contact', yet the programmatic name is 'List of Contributors', which describes a completely different purpose than what the iframe evidently contains, constituting a misleading/wrong name under 4.1.2.",
  "evidenceRefs": [
    "accessibleName.value='List of Contributors'",
    "element-crop: visible content 'Root > Page One • Home • Contact'",
    "Mismatch between name and rendered purpose"
  ]
}
```


================= FIXTURE HTML (4b1c6c/40e3400d782b) =================
```html
<!DOCTYPE html>
<html lang="en">
	<iframe title="List of Contributors" src="../_assets/WAI/content-assets/wcag-act-rules/test-assets/iframe-unique-name-4b1c6c/page-one.html"> </iframe>

	<iframe aria-label="List of Contributors" src="../_assets/WAI/content-assets/wcag-act-rules/test-assets/iframe-unique-name-4b1c6c/page-one.html"> </iframe>
</html>
```
