CASE INDEX: 2
TESTCASE_ID: 033e04cced59
GT (expected): inapplicable   SC: 2.1.1   RULE: akn7bn   Iframe with interactive elements is not excluded from tab-order
run4 outcome: noObligation (the oracle enumerated NO in-scope obligation, so the LLM was never asked).
inScopeObligations: 0   inScopeAutoPartial: 0   v3Barrier(deterministic): false
post-fix (run5) outcome on this case: (not re-run)

QUESTION: should the harness have enumerated an in-scope obligation for SC 2.1.1 on this page? Judge the fixture against the ACT rule.

## FIXTURE HTML (akn7bn/033e04cced59)
```html
<!DOCTYPE html>
<html lang="en">
<head>
	<title>Inapplicable Example 2</title>
</head>
<body>
	<iframe tabindex="-1" hidden srcdoc="<a href='/'>Home</a>"></iframe>
</body>
</html>
```
