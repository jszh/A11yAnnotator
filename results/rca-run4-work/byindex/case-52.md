CASE INDEX: 52
TESTCASE_ID: f8d3c1afa946
KIND (authoritative, from run4 GT+outcome): FP
SC: 4.1.2   RULE: 4b1c6c   Iframe elements with identical accessible names have equivalent purpose

This file is SELF-CONTAINED. Below: (1) the harness evidence slice — GT, LLM in-scope verdicts+summaries, off-target barriers, and the model FULL reasoning trace (THINK/SAY/TOOL_CALL/TOOL_RESULT); (2) the fixture HTML inlined.

================= EVIDENCE SLICE =================
# RCA case f8d3c1afa946  [FP]
- rule: 4b1c6c  Iframe elements with identical accessible names have equivalent purpose
- sc(GT-scored): 4.1.2   expected(GT): passed   outcome: caught   polarity: specificity
- v3Barrier(deterministic): false   inScopeAutoPartial: 0   inScopeObligations: 2
- fixture: eval/checker-comparison/act-subset/pages/4b1c6c/f8d3c1afa946cf4fc97ef799aad6d9d090de6e8f.html

## in-scope verdicts
- RUBRIC 4.1.2 LIKELY_BARRIER conf=high [accessible-name-adequacy-v0] xpath=/html/body/iframe[1]
  summary: The iframe's accessible name 'List of Contributors' does not match its rendered content, which shows a navigation page ('Root > Page One') with 'Home' and 'Contact' links — not a list of contributors.
- RUBRIC 4.1.2 LIKELY_BARRIER conf=high [accessible-name-adequacy-v0] xpath=/html/body/iframe[2]
  summary: The iframe's accessible name 'List of Contributors' does not match its rendered content, which shows a navigation menu ('Root > Page One' with Home and Contact links).

## model reasoning trace (per subject)

### subject sc=4.1.2 xpath=/html/body/iframe[1] rubric=accessible-name-adequacy-v0 verdict=REPRODUCED
THINK: Let me analyze the evidence provided:

1. **Element**: `/html/body/iframe[1]`
2. **Accessible name**: "List of Contributors" (present: true, resolved: true)
3. **Element crop**: Shows an iframe containing "Root > Page One" with a list of "Home" and "Contact" links
4. **Surrounding region**: Shows the iframe labeled "List of Contributors" above and below it

The question is: does the accessible name "List of Contributors" adequately describe what this iframe contains?

Looking at the rendered content of the iframe, it shows:
- "Root > Page One" as a heading
- A bulleted list with "Home" and "Contact" links
- The accessible name "List of Contributors" doesn't match the actual content—the iframe displays navigation links under "Root > Page One" rather than a list of contributors, suggesting a mismatch between the label and what's actually rendered inside. The iframe's label says "List of Contributors" but the actual content inside displays navigation elements like "Home" and "Contact" links. This disconnect between what the accessible name promises and what's actually rendered creates a real barrier for non-sighted users who would expect contributor information. This is definitely a **REPRODUCED** issue.
SAY: ```json
{
  "verdict": "REPRODUCED",
  "confidence": "high",
  "summary": "The iframe's accessible name 'List of Contributors' does not match its rendered content, which shows a navigation page ('Root > Page One') with 'Home' and 'Contact' links — not a list of contributors.",
  "reasoning": "The element-crop and surrounding-region both confirm the iframe contains navigation links (Home, Contact) under the heading 'Root > Page One', while the accessible name 'List of Contributors' describes entirely different content; a non-sighted user following the frame title would expect contributor information but would instead encounter unrelated navigation — exactly the barrier the rubric describes as 'a name that describes a DIFFERENT control than the one rendered'.",
  "evidenceRefs": [
    "accessibleName.value = 'List of Contributors' (present:true, resolved:true)",
    "element-crop: iframe renders 'Root > Page One' with bullet list — Home, Contact",
    "surrounding-region: 'List of Contributors' label visible above and below the iframe"
  ]
}
```

### subject sc=4.1.2 xpath=/html/body/iframe[2] rubric=accessible-name-adequacy-v0 verdict=REPRODUCED
THINK: The element is an iframe with accessible name "List of Contributors". The visual content shows navigation links (Home, Contact) under "Root > Page One". The name "List of Contributors" doesn't match what the iframe actually contains - it appears to show navigation links, not a list of contributors. This seems like an inadequate name.

Wait, let me reconsider. The accessible name is "List of Contributors" but the iframe content shows "Root > Page One" with Home and Contact links. This is a mismatch - the name describes something different from what's rendered.

This is a case where the name describes a DIFFERENT control/content than what is rendered. 

The mismatch creates an accessibility barrier—someone using a screen reader would expect to find contributor information but instead encounters navigation links, which could be confusing or misleading about what the iframe contains.
SAY: ```json
{
  "verdict": "REPRODUCED",
  "confidence": "high",
  "summary": "The iframe's accessible name 'List of Contributors' does not match its rendered content, which shows a navigation menu ('Root > Page One' with Home and Contact links).",
  "reasoning": "The deterministic signal confirms the name 'List of Contributors' is present and resolved, but the element-crop and surrounding-region clearly show the iframe contains a site-navigation structure (breadcrumb + Home/Contact links), not a list of contributors — a non-sighted user would be misled about the iframe's actual purpose.",
  "evidenceRefs": [
    "accessibleName.value = 'List of Contributors'",
    "element-crop: iframe content renders 'Root > Page One' breadcrumb + bullet list of Home, Contact navigation links",
    "surrounding-region: label 'List of Contributors' visible above iframe, yet content is clearly navigation"
  ]
}
```


================= FIXTURE HTML (4b1c6c/f8d3c1afa946) =================
```html
<!DOCTYPE html>
<html lang="en">
	<div id="desc-for-title">List of Contributors</div>
	<iframe aria-labelledby="desc-for-title" src="../_assets/WAI/content-assets/wcag-act-rules/test-assets/iframe-unique-name-4b1c6c/page-one.html"> </iframe>

	<div id="desc-for-title1">List of Contributors</div>
	<iframe aria-labelledby="desc-for-title1" src="../_assets/WAI/content-assets/wcag-act-rules/test-assets/iframe-unique-name-4b1c6c/page-one.html"> </iframe>
</html>
```
