CASE INDEX: 96
TESTCASE_ID: f5ea9fd3b681
GT (expected): failed   SC: 2.1.2   RULE: 80af7b   Focusable element has no keyboard trap
run4 outcome: noObligation (the oracle enumerated NO in-scope obligation, so the LLM was never asked).
inScopeObligations: 1   inScopeAutoPartial: 0   v3Barrier(deterministic): true
post-fix (run5) outcome on this case: caught

QUESTION: should the harness have enumerated an in-scope obligation for SC 2.1.2 on this page? Judge the fixture against the ACT rule.

## FIXTURE HTML (80af7b/f5ea9fd3b681)
```html
<!DOCTYPE html>
<html lang="en">
<head>
	<title>Failed Example 1</title>
</head>
<body>
	<a href="#">Link 1</a>
	<button onblur="setTimeout(() => this.focus(), 10)">
		Button1
	</button>
	<a href="#">Link 2</a>
</body>
</html>
```
