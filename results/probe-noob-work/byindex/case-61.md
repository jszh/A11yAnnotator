CASE INDEX: 61
TESTCASE_ID: 41afaa9b3328
GT (expected): failed   SC: 1.4.3   RULE: afw4f7   Text has minimum contrast
run4 outcome: noObligation (the oracle enumerated NO in-scope obligation, so the LLM was never asked).
inScopeObligations: 1   inScopeAutoPartial: 0   v3Barrier(deterministic): true
post-fix (run5) outcome on this case: caught

QUESTION: should the harness have enumerated an in-scope obligation for SC 1.4.3 on this page? Judge the fixture against the ACT rule.

## FIXTURE HTML (afw4f7/41afaa9b3328)
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
