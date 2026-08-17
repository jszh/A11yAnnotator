CASE INDEX: 38
TESTCASE_ID: 62fd24e73ea5
KIND (authoritative, from run4 GT+outcome): FN
SC: 2.1.2   RULE: 80af7b   Focusable element has no keyboard trap

This file is SELF-CONTAINED. Below: (1) the harness evidence slice — GT, LLM in-scope verdicts+summaries, off-target barriers, and the model FULL reasoning trace (THINK/SAY/TOOL_CALL/TOOL_RESULT); (2) the fixture HTML inlined.

================= EVIDENCE SLICE =================
# RCA case 62fd24e73ea5  [FN]
- rule: 80af7b  Focusable element has no keyboard trap
- sc(GT-scored): 2.1.2   expected(GT): failed   outcome: noVerdict   polarity: recall
- v3Barrier(deterministic): false   inScopeAutoPartial: 1   inScopeObligations: 2
- fixture: eval/checker-comparison/act-subset/pages/80af7b/62fd24e73ea55f55ad45de392128a816a6f03526.html

## in-scope verdicts
- (NO in-scope verdicts produced)

## model reasoning trace (per subject)


================= FIXTURE HTML (80af7b/62fd24e73ea5) =================
```html
<!DOCTYPE html>
<html lang="en">
<head>
	<title>Failed Example 5</title>
</head>
<body>
	<script src="../_assets/WAI/content-assets/wcag-act-rules/test-assets/focusable-no-keyboard-trap/keyboard.js"></script>
	
	<a id="link1" href="#">Link 1</a>
	<button id="btn1" onfocus="trapOn = true" onblur="moveFocusToButton('btn2')">
		Button 1
	</button>
	<p>Press Ctrl+M to Exit</p>
	<button id="btn2" onfocus="trapOn = true" onblur="moveFocusToButton('btn1')">
		Button 2
	</button>
	<a id="link2" href="#">Link 2</a>
</body>
</html>
```
