CASE INDEX: 37
TESTCASE_ID: 1b172036f8e2
GT (expected): passed   SC: 1.1.1   RULE: 8fc3b6   Object element rendering non-text content has non-empty accessible name
run4 outcome: noObligation (the oracle enumerated NO in-scope obligation, so the LLM was never asked).
inScopeObligations: 0   inScopeAutoPartial: 0   v3Barrier(deterministic): false
post-fix (run5) outcome on this case: (not re-run)

QUESTION: should the harness have enumerated an in-scope obligation for SC 1.1.1 on this page? Judge the fixture against the ACT rule.

## FIXTURE HTML (8fc3b6/1b172036f8e2)
```html
<!DOCTYPE html>
<html lang="en">
<head>
	<title>Passed Example 3</title>
</head>
<body>
	<span id="label">W3C logo</span> <object aria-labelledby="label" data="/WAI/content-assets/wcag-act-rules/test-assets/shared/w3c-logo.png"></object>
</body>
</html>
```
