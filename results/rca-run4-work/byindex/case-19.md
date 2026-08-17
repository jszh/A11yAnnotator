CASE INDEX: 19
TESTCASE_ID: 41afaa9b3328
KIND (authoritative, from run4 GT+outcome): FN
SC: 1.4.3   RULE: afw4f7   Text has minimum contrast

This file is SELF-CONTAINED. Below: (1) the harness evidence slice — GT, LLM in-scope verdicts+summaries, off-target barriers, and the model FULL reasoning trace (THINK/SAY/TOOL_CALL/TOOL_RESULT); (2) the fixture HTML inlined.

================= EVIDENCE SLICE =================
# RCA case 41afaa9b3328  [FN]
- rule: afw4f7  Text has minimum contrast
- sc(GT-scored): 1.4.3   expected(GT): failed   outcome: noObligation   polarity: recall
- v3Barrier(deterministic): true   inScopeAutoPartial: 0   inScopeObligations: 1
- fixture: eval/checker-comparison/act-subset/pages/afw4f7/41afaa9b33287aba9c608c3466e2b164f57a02ed.html

## in-scope verdicts
- (NO in-scope verdicts produced)

## model reasoning trace (per subject)


================= FIXTURE HTML (afw4f7/41afaa9b3328) =================
```html
<!DOCTYPE html>
<html lang="en">
<head>
	<title>Failed Example 3</title>
</head>
<body>
	<p
		style="color: #555; height:50px; padding-top:20px; background: black no-repeat -20px -20px url('../_assets/WAI/content-assets/wcag-act-rules/test-assets/contrast/black-hole.jpeg');"
	>
		Black hole sun
	</p>
</body>
</html>
```
