CASE INDEX: 21
TESTCASE_ID: bf023941401d
KIND (authoritative, from run4 GT+outcome): FN
SC: 1.4.5   RULE: 0va7u6   HTML images contain no text

This file is SELF-CONTAINED. Below: (1) the harness evidence slice — GT, LLM in-scope verdicts+summaries, off-target barriers, and the model FULL reasoning trace (THINK/SAY/TOOL_CALL/TOOL_RESULT); (2) the fixture HTML inlined.

================= EVIDENCE SLICE =================
# RCA case bf023941401d  [FN]
- rule: 0va7u6  HTML images contain no text
- sc(GT-scored): 1.4.5   expected(GT): failed   outcome: noObligation   polarity: recall
- v3Barrier(deterministic): false   inScopeAutoPartial: 0   inScopeObligations: 0
- fixture: eval/checker-comparison/act-subset/pages/0va7u6/bf023941401d04f61ce739ee10fcc15f87d298a7.html

## in-scope verdicts
- (NO in-scope verdicts produced)

## model reasoning trace (per subject)


================= FIXTURE HTML (0va7u6/bf023941401d) =================
```html
<!DOCTYPE html>
<html lang="en">
<head>
	<title>Failed Example 3</title>
</head>
<body>
	<div style="background-image: url(../_assets/WAI/content-assets/wcag-act-rules/test-assets/0va7u6/textimage.jpg); width: 500px; height: 200px;" />
</body>
</html>
```
