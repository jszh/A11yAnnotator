CASE INDEX: 32
TESTCASE_ID: 2c4e13b6606b
GT (expected): passed   SC: 1.1.1   RULE: 8fc3b6   Object element rendering non-text content has non-empty accessible name
run4 outcome: noObligation (the oracle enumerated NO in-scope obligation, so the LLM was never asked).
inScopeObligations: 0   inScopeAutoPartial: 0   v3Barrier(deterministic): false
post-fix (run5) outcome on this case: (not re-run)

QUESTION: should the harness have enumerated an in-scope obligation for SC 1.1.1 on this page? Judge the fixture against the ACT rule.

## FIXTURE HTML (8fc3b6/2c4e13b6606b)
```html
<!DOCTYPE html>
<html lang="en">
<head>
	<title>Passed Example 1</title>
</head>
<body>
	<object aria-label="Moon speech" data="/WAI/content-assets/wcag-act-rules/test-assets/moon-audio/moon-speech.mp3"></object>
</body>
</html>
```
