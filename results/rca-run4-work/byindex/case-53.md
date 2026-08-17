CASE INDEX: 53
TESTCASE_ID: 5aae37ddb5b9
KIND (authoritative, from run4 GT+outcome): FP
SC: 4.1.2   RULE: 4b1c6c   Iframe elements with identical accessible names have equivalent purpose

This file is SELF-CONTAINED. Below: (1) the harness evidence slice — GT, LLM in-scope verdicts+summaries, off-target barriers, and the model FULL reasoning trace (THINK/SAY/TOOL_CALL/TOOL_RESULT); (2) the fixture HTML inlined.

================= EVIDENCE SLICE =================
# RCA case 5aae37ddb5b9  [FP]
- rule: 4b1c6c  Iframe elements with identical accessible names have equivalent purpose
- sc(GT-scored): 4.1.2   expected(GT): inapplicable   outcome: caught   polarity: specificity
- v3Barrier(deterministic): false   inScopeAutoPartial: 0   inScopeObligations: 2
- fixture: eval/checker-comparison/act-subset/pages/4b1c6c/5aae37ddb5b9d51a41f090581101c1e6a4ee1763.html

## in-scope verdicts
- RUBRIC 4.1.2 LIKELY_BARRIER conf=high [accessible-name-adequacy-v0] xpath=/html/body/iframe[1]
  summary: The iframe's accessible name 'List of Contributors to Repository 1' does not match its rendered content, which shows a navigation panel ('Root > Page One' with Home and Contact links), making the name misleading and inadequate for non-sight
- RUBRIC 4.1.2 LIKELY_OK conf=high [accessible-name-adequacy-v0] xpath=/html/body/iframe[2]
  summary: The iframe has an adequate accessible name ('List of Contributors to Repository 2') that clearly describes its purpose.

## model reasoning trace (per subject)

### subject sc=4.1.2 xpath=/html/body/iframe[1] rubric=accessible-name-adequacy-v0 verdict=REPRODUCED
THINK: The element is an iframe with accessible name "List of Contributors to Repository 1". The visual content shows "Root > Page One" with Home and Contact links - this appears to be a navigation/page content iframe, not a contributors list.

The accessible name says "List of Contributors to Repository 1" but the rendered content shows navigation links (Home, Contact) under "Root > Page One". This is a mismatch - the name describes a different control than what's rendered.

This is a case where the name describes a DIFFERENT control than the one rendered. The rubric says: "a name that describes a DIFFERENT control than the one rendered (a 'Search' name on a visibly 'Menu' hamburger)" is a failure.
So this is a clear failure - the accessible name is inadequate and misleading for what the iframe actually displays.
SAY: ```json
{
  "verdict": "REPRODUCED",
  "confidence": "high",
  "summary": "The iframe's accessible name 'List of Contributors to Repository 1' does not match its rendered content, which shows a navigation panel ('Root > Page One' with Home and Contact links), making the name misleading and inadequate for non-sighted users.",
  "reasoning": "The element-crop clearly shows the iframe contains a breadcrumb/navigation structure ('Root > Page One' with Home and Contact list items), yet the programmatic accessible name describes a completely different purpose ('List of Contributors to Repository 1') — a classic wrong-name barrier where the name describes a different control than the one rendered.",
  "evidenceRefs": [
    "accessibleName.value: 'List of Contributors to Repository 1' (present:true, resolved:true)",
    "element-crop: iframe renders 'Root > Page One' with bullet-list links 'Home' and 'Contact'",
    "Rubric: 'a name that describes a DIFFERENT control than the one rendered' is an explicit failure pattern"
  ]
}
```

### subject sc=4.1.2 xpath=/html/body/iframe[2] rubric=accessible-name-adequacy-v0 verdict=NOT REPRODUCED
SAY: ```json
{
  "verdict": "NOT REPRODUCED",
  "confidence": "high",
  "summary": "The iframe has an adequate accessible name ('List of Contributors to Repository 2') that clearly describes its purpose.",
  "reasoning": "The accessible name is specific and descriptive, conveying what the iframe contains, which is sufficient for a non-sighted user to understand its purpose even though the visible content shows only 'Lorem Ipsum...' placeholder text.",
  "evidenceRefs": ["accessibleName.value: 'List of Contributors to Repository 2'", "accessibleName.present: true", "accessibleName.resolved: true"]
}
```


================= FIXTURE HTML (4b1c6c/5aae37ddb5b9) =================
```html
<!DOCTYPE html>
<html lang="en">
	<iframe aria-label="List of Contributors to Repository 1" src="../_assets/WAI/content-assets/wcag-act-rules/test-assets/iframe-unique-name-4b1c6c/page-one.html">
	</iframe>

	<iframe aria-label="List of Contributors to Repository 2" src="../_assets/WAI/content-assets/wcag-act-rules/test-assets/iframe-unique-name-4b1c6c/page-two.html">
	</iframe>
</html>
```
