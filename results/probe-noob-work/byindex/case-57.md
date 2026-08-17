CASE INDEX: 57
TESTCASE_ID: dc170fd01575
GT (expected): passed   SC: 1.4.3   RULE: afw4f7   Text has minimum contrast
run4 outcome: noObligation (the oracle enumerated NO in-scope obligation, so the LLM was never asked).
inScopeObligations: 1   inScopeAutoPartial: 0   v3Barrier(deterministic): true
post-fix (run5) outcome on this case: (not re-run)

QUESTION: should the harness have enumerated an in-scope obligation for SC 1.4.3 on this page? Judge the fixture against the ACT rule.

## FIXTURE HTML (afw4f7/dc170fd01575)
```html
<!DOCTYPE html>
<html lang="en">
<head>
	<title>Passed Example 3</title>
</head>
<body>
	<style>
		p {
			color: #ccc;
			height: 50px;
			padding-top: 15px;
			background: #000 no-repeat -20px -20px url('../_assets/WAI/content-assets/wcag-act-rules/test-assets/contrast/black-hole.jpeg');
			text-shadow: 0px 0px 2px black;
		}
	</style>
	<p>Black hole sun</p>
</body>
</html>
```
