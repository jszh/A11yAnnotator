CASE INDEX: 25
TESTCASE_ID: c4a2fe12d5a4
KIND (authoritative, from run4 GT+outcome): FN
SC: 4.1.2   RULE: kb1m8s   ARIA global properties not used where prohibited

This file is SELF-CONTAINED. Below: (1) the harness evidence slice — GT, LLM in-scope verdicts+summaries, off-target barriers, and the model FULL reasoning trace (THINK/SAY/TOOL_CALL/TOOL_RESULT); (2) the fixture HTML inlined.

================= EVIDENCE SLICE =================
# RCA case c4a2fe12d5a4  [FN]
- rule: kb1m8s  ARIA global properties not used where prohibited
- sc(GT-scored): 4.1.2   expected(GT): failed   outcome: noObligation   polarity: recall
- v3Barrier(deterministic): false   inScopeAutoPartial: 0   inScopeObligations: 0
- fixture: eval/checker-comparison/act-subset/pages/kb1m8s/c4a2fe12d5a48f7ace66475d3791e051ddefa807.html

## in-scope verdicts
- (NO in-scope verdicts produced)

## model reasoning trace (per subject)


================= FIXTURE HTML (kb1m8s/c4a2fe12d5a4) =================
```html
<!DOCTYPE html>
<html lang="en">
<head>
	<title>Failed Example 5</title>
</head>
<body>
	<h1 role="none" aria-brailleroledescription="Banana text">I like bananas</h1>
</body>
</html>
```
