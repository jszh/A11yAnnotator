CASE INDEX: 50
TESTCASE_ID: 3482a8bfa501
KIND (authoritative, from run4 GT+outcome): FP
SC: 4.1.2   RULE: 4b1c6c   Iframe elements with identical accessible names have equivalent purpose

This file is SELF-CONTAINED. Below: (1) the harness evidence slice — GT, LLM in-scope verdicts+summaries, off-target barriers, and the model FULL reasoning trace (THINK/SAY/TOOL_CALL/TOOL_RESULT); (2) the fixture HTML inlined.

================= EVIDENCE SLICE =================
# RCA case 3482a8bfa501  [FP]
- rule: 4b1c6c  Iframe elements with identical accessible names have equivalent purpose
- sc(GT-scored): 4.1.2   expected(GT): inapplicable   outcome: caught   polarity: specificity
- v3Barrier(deterministic): false   inScopeAutoPartial: 0   inScopeObligations: 1
- fixture: eval/checker-comparison/act-subset/pages/4b1c6c/3482a8bfa5017d02f2fc3d8a01560837b23ee9dd.html

## in-scope verdicts
- RUBRIC 4.1.2 LIKELY_BARRIER conf=high [accessible-name-adequacy-v0] xpath=/html/body/iframe[1]
  summary: The iframe's accessible name 'List of Contributors' does not describe its actual content — the iframe visibly renders a breadcrumb/navigation panel ('Root > Page One') with navigation links ('Home', 'Contact'), not a list of contributors.

## model reasoning trace (per subject)

### subject sc=4.1.2 xpath=/html/body/iframe[1] rubric=accessible-name-adequacy-v0 verdict=REPRODUCED
THINK: Let me analyze this case. The element is an iframe with accessible name "List of Contributors" (present: true, resolved: true). The visual content shows "Root > Page One" with bullet points "Home" and "Contact" - this appears to be a navigation/breadcrumb structure.

The accessible name "List of Contributors" does NOT match what the iframe visually contains. The iframe shows navigation links (Home, Contact) with breadcrumb-style navigation, but it's named "List of Contributors" which describes something completely different.

This is a classic case where the name exists but is WRONG/misleading - it describes a different content than what's rendered. 

The name suggests a list of contributors, but the iframe actually contains navigation links, which violates the requirement that accessible names must accurately describe the element's purpose. This is a 4.1.2 barrier.
SAY: ```json
{
  "verdict": "REPRODUCED",
  "confidence": "high",
  "summary": "The iframe's accessible name 'List of Contributors' does not describe its actual content — the iframe visibly renders a breadcrumb/navigation panel ('Root > Page One') with navigation links ('Home', 'Contact'), not a list of contributors.",
  "reasoning": "The rendered pixels show a site-navigation structure with a breadcrumb trail and two links, while the programmatic name 'List of Contributors' implies a completely different purpose (a roster of people), meaning a non-sighted user would receive a fundamentally incorrect description of the iframe's content and function.",
  "evidenceRefs": [
    "accessibleName.value = 'List of Contributors' (present: true, resolved: true)",
    "element-crop: iframe renders 'Root > Page One' breadcrumb + bullet links 'Home' and 'Contact'",
    "Name-to-purpose mismatch: 'List of Contributors' vs. visible site-navigation content"
  ]
}
```


================= FIXTURE HTML (4b1c6c/3482a8bfa501) =================
```html
<!DOCTYPE html>
<html lang="en">
	<iframe title="List of Contributors" src="../_assets/WAI/content-assets/wcag-act-rules/test-assets/iframe-unique-name-4b1c6c/page-one.html"> </iframe>
</html>
```
