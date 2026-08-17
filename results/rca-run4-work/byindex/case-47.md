CASE INDEX: 47
TESTCASE_ID: 08c5575023e8
KIND (authoritative, from run4 GT+outcome): FP
SC: 4.1.2   RULE: 4b1c6c   Iframe elements with identical accessible names have equivalent purpose

This file is SELF-CONTAINED. Below: (1) the harness evidence slice — GT, LLM in-scope verdicts+summaries, off-target barriers, and the model FULL reasoning trace (THINK/SAY/TOOL_CALL/TOOL_RESULT); (2) the fixture HTML inlined.

================= EVIDENCE SLICE =================
# RCA case 08c5575023e8  [FP]
- rule: 4b1c6c  Iframe elements with identical accessible names have equivalent purpose
- sc(GT-scored): 4.1.2   expected(GT): passed   outcome: caught   polarity: specificity
- v3Barrier(deterministic): false   inScopeAutoPartial: 0   inScopeObligations: 2
- fixture: eval/checker-comparison/act-subset/pages/4b1c6c/08c5575023e8bf16caabcf01a1c8d40fe6ecaf94.html

## in-scope verdicts
- RUBRIC 4.1.2 LIKELY_BARRIER conf=high [accessible-name-adequacy-v0] xpath=/html/body/iframe[1]
  summary: The iframe's accessible name 'List of Contributors' does not describe its actual rendered content, which is a navigation structure ('Root > Page One' breadcrumb with 'Home' and 'Contact' links).
- RUBRIC 4.1.2 LIKELY_BARRIER conf=high [accessible-name-adequacy-v0] xpath=/html/body/iframe[2]
  summary: The iframe's accessible name 'List of Contributors' does not match its rendered content, which shows a navigation structure ('Root > Page One' with 'Home' and 'Contact' links), misleading non-sighted users about the iframe's actual purpose.

## model reasoning trace (per subject)

### subject sc=4.1.2 xpath=/html/body/iframe[1] rubric=accessible-name-adequacy-v0 verdict=REPRODUCED
THINK: Let me analyze this case. The element is an iframe with xpath `/html/body/iframe[1]`. The accessible name is "List of Contributors" (present: true, resolved: true). The element-crop shows what appears to be a navigation/page structure with "Root > Page One" and links "Home" and "Contact".

The question is: does the accessible name "List of Contributors" adequately describe what this iframe contains/does?

Looking at the rendered content: the iframe shows "Root > Page One" as a breadcrumb and has links "Home" and "Contact" - this looks like a navigation iframe, not a "List of Contributors."

The name "List of Contributors" does not match what the iframe actually contains. 

There are actually two iframes on the page side by side, and this is the first one. The accessible name clearly describes something different from the navigation content that's actually rendered - this is a definite adequacy failure.
SAY: ```json
{
  "verdict": "REPRODUCED",
  "confidence": "high",
  "summary": "The iframe's accessible name 'List of Contributors' does not describe its actual rendered content, which is a navigation structure ('Root > Page One' breadcrumb with 'Home' and 'Contact' links).",
  "reasoning": "The element-crop clearly shows the iframe contains breadcrumb navigation ('Root > Page One') and nav links ('Home', 'Contact'), yet the programmatic name is 'List of Contributors' — a description that matches a completely different control, making the name misleading and inadequate for a non-sighted user trying to understand the iframe's purpose.",
  "evidenceRefs": [
    "accessibleName.value = 'List of Contributors' (present: true, resolved: true)",
    "element-crop: iframe renders 'Root > Page One' breadcrumb with 'Home' and 'Contact' list links",
    "surrounding-region: confirms iframe is a navigation/page-tree panel, not a contributor list"
  ]
}
```

### subject sc=4.1.2 xpath=/html/body/iframe[2] rubric=accessible-name-adequacy-v0 verdict=REPRODUCED
THINK: The element is an iframe with accessible name "List of Contributors". The visual crop shows content labeled "Root > Page One" with a list of "Home" and "Contact" links. The accessible name "List of Contributors" does not match what's visually rendered - the iframe appears to contain navigation links (Home, Contact), not a list of contributors.

This is a clear mismatch between the accessible name and the actual content/purpose of the iframe.
SAY: ```json
{
  "verdict": "REPRODUCED",
  "confidence": "high",
  "summary": "The iframe's accessible name 'List of Contributors' does not match its rendered content, which shows a navigation structure ('Root > Page One' with 'Home' and 'Contact' links), misleading non-sighted users about the iframe's actual purpose.",
  "reasoning": "The deterministic signal confirms the name 'List of Contributors' is present, but the element-crop clearly shows the iframe contains a navigation list ('Home', 'Contact') — not a contributors list — making the name actively wrong and therefore an inadequate description of the control's evident purpose.",
  "evidenceRefs": [
    "accessibleName.value='List of Contributors' (present:true, resolved:true)",
    "element-crop: iframe renders 'Root > Page One' breadcrumb + bullet list with 'Home' and 'Contact'",
    "surrounding-region: same navigation content confirmed"
  ]
}
```


================= FIXTURE HTML (4b1c6c/08c5575023e8) =================
```html
<!DOCTYPE html>
<html lang="en">
	<iframe title="List of Contributors" src="../_assets/WAI/content-assets/wcag-act-rules/test-assets/iframe-unique-name-4b1c6c/page-one.html"> </iframe>

	<iframe title="List of Contributors" src="../_assets/WAI/content-assets/wcag-act-rules/test-assets/iframe-unique-name-4b1c6c/page-one.html"> </iframe>
</html>
```
