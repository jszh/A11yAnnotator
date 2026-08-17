CASE INDEX: 49
TESTCASE_ID: 5d06e0832a2a
GT (expected): inapplicable   SC: 2.1.1   RULE: 0ssw9k   Scrollable content can be reached with sequential focus navigation
run4 outcome: noObligation (the oracle enumerated NO in-scope obligation, so the LLM was never asked).
inScopeObligations: 0   inScopeAutoPartial: 0   v3Barrier(deterministic): false
post-fix (run5) outcome on this case: (not re-run)

QUESTION: should the harness have enumerated an in-scope obligation for SC 2.1.1 on this page? Judge the fixture against the ACT rule.

## FIXTURE HTML (0ssw9k/5d06e0832a2a)
```html
<!DOCTYPE html>
<html lang="en">
<head>
	<title>Inapplicable Example 4</title>
</head>
<body>
	<p>This is what a scrollbar looks like:</p>
	<section style="height: 20px; width: 500px; overflow-x:scroll;">
		<div style="width: 1000px; height: 1px;"></div>
	</section>
</body>
</html>
```
