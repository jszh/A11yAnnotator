CASE INDEX: 22
TESTCASE_ID: 1345bf067f66
KIND (authoritative, from run4 GT+outcome): FN
SC: 4.1.2   RULE: kb1m8s   ARIA global properties not used where prohibited

This file is SELF-CONTAINED. Below: (1) the harness evidence slice — GT, LLM in-scope verdicts+summaries, off-target barriers, and the model FULL reasoning trace (THINK/SAY/TOOL_CALL/TOOL_RESULT); (2) the fixture HTML inlined.

================= EVIDENCE SLICE =================
# RCA case 1345bf067f66  [FN]
- rule: kb1m8s  ARIA global properties not used where prohibited
- sc(GT-scored): 4.1.2   expected(GT): failed   outcome: noObligation   polarity: recall
- v3Barrier(deterministic): false   inScopeAutoPartial: 0   inScopeObligations: 0
- fixture: eval/checker-comparison/act-subset/pages/kb1m8s/1345bf067f66f2ee893f75e43d72121a0119d6b1.html

## in-scope verdicts
- (NO in-scope verdicts produced)

## model reasoning trace (per subject)


================= FIXTURE HTML (kb1m8s/1345bf067f66) =================
```html
<!DOCTYPE html>
<html lang="en">
<head>
	<title>Failed Example 3</title>
</head>
<body>
	<p aria-braillelabel="I love Bananas">I ❤️ Bananas</p>
</body>
</html>
```
