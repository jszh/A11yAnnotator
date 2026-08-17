CASE INDEX: 36
TESTCASE_ID: f5ea9fd3b681
KIND (authoritative, from run4 GT+outcome): FN
SC: 2.1.2   RULE: 80af7b   Focusable element has no keyboard trap

This file is SELF-CONTAINED. Below: (1) the harness evidence slice — GT, LLM in-scope verdicts+summaries, off-target barriers, and the model FULL reasoning trace (THINK/SAY/TOOL_CALL/TOOL_RESULT); (2) the fixture HTML inlined.

================= EVIDENCE SLICE =================
# RCA case f5ea9fd3b681  [FN]
- rule: 80af7b  Focusable element has no keyboard trap
- sc(GT-scored): 2.1.2   expected(GT): failed   outcome: noObligation   polarity: recall
- v3Barrier(deterministic): true   inScopeAutoPartial: 0   inScopeObligations: 1
- fixture: eval/checker-comparison/act-subset/pages/80af7b/f5ea9fd3b681971b2af4953fae9bb2d319a203c6.html

## in-scope verdicts
- (NO in-scope verdicts produced)

## model reasoning trace (per subject)


================= FIXTURE HTML (80af7b/f5ea9fd3b681) =================
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
