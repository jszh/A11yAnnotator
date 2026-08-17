CASE INDEX: 34
TESTCASE_ID: 0ec0e93e7f8f
KIND (authoritative, from run4 GT+outcome): FN
SC: 2.1.2   RULE: 80af7b   Focusable element has no keyboard trap

This file is SELF-CONTAINED. Below: (1) the harness evidence slice — GT, LLM in-scope verdicts+summaries, off-target barriers, and the model FULL reasoning trace (THINK/SAY/TOOL_CALL/TOOL_RESULT); (2) the fixture HTML inlined.

================= EVIDENCE SLICE =================
# RCA case 0ec0e93e7f8f  [FN]
- rule: 80af7b  Focusable element has no keyboard trap
- sc(GT-scored): 2.1.2   expected(GT): failed   outcome: noVerdict   polarity: recall
- v3Barrier(deterministic): true   inScopeAutoPartial: 1   inScopeObligations: 2
- fixture: eval/checker-comparison/act-subset/pages/80af7b/0ec0e93e7f8ffca39e1eb58a4a8503f1bd4cb145.html

## in-scope verdicts
- (NO in-scope verdicts produced)

## model reasoning trace (per subject)


================= FIXTURE HTML (80af7b/0ec0e93e7f8f) =================
```html
<!DOCTYPE html>
<html lang="en">
<head>
	<title>Failed Example 2</title>
</head>
<body>
	<button onblur="setTimeout(() => this.focus(), 10)">Button 1</button>
	<button>Button 2</button>
	<button onblur="setTimeout(() => this.focus(), 10)">Button 3</button>
</body>
</html>
```
