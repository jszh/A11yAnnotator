CASE INDEX: 10
TESTCASE_ID: ff4b76894bd9
GT (expected): passed   SC: 4.1.2   RULE: 97a4e1   Button has non-empty accessible name
run4 outcome: noObligation (the oracle enumerated NO in-scope obligation, so the LLM was never asked).
inScopeObligations: 0   inScopeAutoPartial: 0   v3Barrier(deterministic): false
post-fix (run5) outcome on this case: (not re-run)

QUESTION: should the harness have enumerated an in-scope obligation for SC 4.1.2 on this page? Judge the fixture against the ACT rule.

## FIXTURE HTML (97a4e1/ff4b76894bd9)
```html
<!DOCTYPE html>
<html lang="en">
<head>
	<title>Passed Example 4</title>
</head>
<body>
	<span role="button" aria-label="My button"></span>
</body>
</html>
```
