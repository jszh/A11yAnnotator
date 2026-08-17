CASE INDEX: 18
TESTCASE_ID: 16a907322625
GT (expected): inapplicable   SC: 4.1.2   RULE: e086e5   Form field has non-empty accessible name
run4 outcome: noObligation (the oracle enumerated NO in-scope obligation, so the LLM was never asked).
inScopeObligations: 0   inScopeAutoPartial: 0   v3Barrier(deterministic): false
post-fix (run5) outcome on this case: (not re-run)

QUESTION: should the harness have enumerated an in-scope obligation for SC 4.1.2 on this page? Judge the fixture against the ACT rule.

## FIXTURE HTML (e086e5/16a907322625)
```html
<!DOCTYPE html>
<html lang="en">
<head>
	<title>Inapplicable Example 3</title>
</head>
<body>
	<select role="none" disabled>
		<option value="volvo">Volvo</option>
		<option value="saab">Saab</option>
		<option value="opel">Opel</option>
	</select>
</body>
</html>
```
