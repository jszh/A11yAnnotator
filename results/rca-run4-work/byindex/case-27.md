CASE INDEX: 27
TESTCASE_ID: 358fa0b821c3
KIND (authoritative, from run4 GT+outcome): FN
SC: 4.1.2   RULE: kb1m8s   ARIA global properties not used where prohibited

This file is SELF-CONTAINED. Below: (1) the harness evidence slice — GT, LLM in-scope verdicts+summaries, off-target barriers, and the model FULL reasoning trace (THINK/SAY/TOOL_CALL/TOOL_RESULT); (2) the fixture HTML inlined.

================= EVIDENCE SLICE =================
# RCA case 358fa0b821c3  [FN]
- rule: kb1m8s  ARIA global properties not used where prohibited
- sc(GT-scored): 4.1.2   expected(GT): failed   outcome: noVerdict   polarity: recall
- v3Barrier(deterministic): false   inScopeAutoPartial: 1   inScopeObligations: 1
- fixture: eval/checker-comparison/act-subset/pages/kb1m8s/358fa0b821c3118de63adfbe37bd0e85a3bd6f8c.html

## in-scope verdicts
- (NO in-scope verdicts produced)

## model reasoning trace (per subject)


================= FIXTURE HTML (kb1m8s/358fa0b821c3) =================
```html
<!DOCTYPE html>
<html lang="en">
<head>
	<title>Failed Example 2</title>
</head>
<body>
	<h1 id="bananas">I like bananas</h1>
	<p aria-labelledby="Bananas">🧑 ❤️ 🍌🍌</p>
</body>
</html>
```
