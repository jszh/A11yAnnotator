CASE INDEX: 54
TESTCASE_ID: bca9ffacff48
KIND (authoritative, from run4 GT+outcome): FP
SC: 4.1.2   RULE: 4b1c6c   Iframe elements with identical accessible names have equivalent purpose

This file is SELF-CONTAINED. Below: (1) the harness evidence slice — GT, LLM in-scope verdicts+summaries, off-target barriers, and the model FULL reasoning trace (THINK/SAY/TOOL_CALL/TOOL_RESULT); (2) the fixture HTML inlined.

================= EVIDENCE SLICE =================
# RCA case bca9ffacff48  [FP]
- rule: 4b1c6c  Iframe elements with identical accessible names have equivalent purpose
- sc(GT-scored): 4.1.2   expected(GT): inapplicable   outcome: caught   polarity: specificity
- v3Barrier(deterministic): false   inScopeAutoPartial: 0   inScopeObligations: 2
- fixture: eval/checker-comparison/act-subset/pages/4b1c6c/bca9ffacff48445c9e4439b0611b4470c370e6ee.html

## in-scope verdicts
- RUBRIC 4.1.2 LIKELY_BARRIER conf=high [accessible-name-adequacy-v0] xpath=/html/body/iframe[1]
  summary: The iframe's accessible name 'List of Contributors to Repository 1' does not match its rendered content, which shows a navigation panel titled 'Root > Page One' with 'Home' and 'Contact' links — a clear mismatch that will mislead screen rea
- RUBRIC 4.1.2 LIKELY_OK conf=high [accessible-name-adequacy-v0] xpath=/html/body/iframe[2]
  summary: The iframe has an adequate accessible name ('List of Contributors to Repository 2') that clearly describes its purpose.

## model reasoning trace (per subject)

### subject sc=4.1.2 xpath=/html/body/iframe[1] rubric=accessible-name-adequacy-v0 verdict=REPRODUCED
THINK: The element is an iframe with accessible name "List of Contributors to Repository 1". The visual crop shows what appears to be a navigation/page content area with "Root > Page One" heading and links "Home" and "Contact". 

The accessible name "List of Contributors to Repository 1" doesn't match what's rendered in the iframe - the iframe shows navigation content ("Root > Page One", "Home", "Contact") rather than a list of contributors to a repository.

Wait, let me reconsider. The iframe could be showing a different page than what the name suggests, or the name could be describing what's inside the iframe at a different scroll position. But from the visual evidence, the rendered content shows "Root > Page One" with "Home" and "Contact" links - this doesn't look like a "List of Contributors to Repository 1."
There's a clear mismatch between the accessible name describing a contributors list and the actual visible content showing navigation links. For a non-sighted user relying on the accessible name, they'd expect to find contributor information but would instead encounter navigation elements, which creates an accessibility barrier. The accessible name is fundamentally misleading for screen reader users, so this is definitely a reproducible barrier.
SAY: ```json
{
  "verdict": "REPRODUCED",
  "confidence": "high",
  "summary": "The iframe's accessible name 'List of Contributors to Repository 1' does not match its rendered content, which shows a navigation panel titled 'Root > Page One' with 'Home' and 'Contact' links — a clear mismatch that will mislead screen reader users.",
  "reasoning": "The deterministic signal confirms the name is present ('List of Contributors to Repository 1'), but the element-crop shows the iframe renders a page-navigation structure (breadcrumb + Home/Contact links), not a contributor list; the name describes an entirely different control purpose, which is the 4.1.2 adequacy barrier.",
  "evidenceRefs": [
    "accessibleName.value = 'List of Contributors to Repository 1' (present:true, resolved:true)",
    "element-crop: iframe renders 'Root > Page One' breadcrumb with bullet links 'Home' and 'Contact'",
    "Name describes contributor list; rendered content is a navigation frame — purpose mismatch"
  ]
}
```

### subject sc=4.1.2 xpath=/html/body/iframe[2] rubric=accessible-name-adequacy-v0 verdict=NOT REPRODUCED
SAY: ```json
{
  "verdict": "NOT REPRODUCED",
  "confidence": "high",
  "summary": "The iframe has an adequate accessible name ('List of Contributors to Repository 2') that clearly describes its purpose.",
  "reasoning": "The accessible name is specific and descriptive, identifying both the content type ('Contributors') and the subject ('Repository 2'), which gives non-sighted users a clear understanding of the iframe's purpose.",
  "evidenceRefs": ["accessibleName.value='List of Contributors to Repository 2'", "accessibleName.present=true", "accessibleName.resolved=true"]
}
```


================= FIXTURE HTML (4b1c6c/bca9ffacff48) =================
```html
<!DOCTYPE html>
<html lang="en">
	<iframe title="List of Contributors to Repository 1" src="../_assets/WAI/content-assets/wcag-act-rules/test-assets/iframe-unique-name-4b1c6c/page-one.html">
	</iframe>

	<iframe title="List of Contributors to Repository 2" src="../_assets/WAI/content-assets/wcag-act-rules/test-assets/iframe-unique-name-4b1c6c/page-two.html">
	</iframe>
</html>
```
