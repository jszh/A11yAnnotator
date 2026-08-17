CASE INDEX: 97
TESTCASE_ID: b92b5214d2b2
GT (expected): passed   SC: 2.1.2   RULE: 80af7b   Focusable element has no keyboard trap
run4 outcome: noObligation (the oracle enumerated NO in-scope obligation, so the LLM was never asked).
inScopeObligations: 2   inScopeAutoPartial: 0   v3Barrier(deterministic): false
post-fix (run5) outcome on this case: (not re-run)

QUESTION: should the harness have enumerated an in-scope obligation for SC 2.1.2 on this page? Judge the fixture against the ACT rule.

## FIXTURE HTML (80af7b/b92b5214d2b2)
```html
<!DOCTYPE html>
<html lang="en">
<head>
	<title>Passed Example 6</title>
</head>
<body>
	<script src="../_assets/WAI/content-assets/wcag-act-rules/test-assets/focusable-no-keyboard-trap/keyboard.js"></script>
	
	<div onkeydown="escapeTrapOnCtrlM(event)">
		<a id="link1" href="#">Link 1</a>
		<button id="btn1" onfocus="trapOn = true" onblur="moveFocusTo('helpLink')">
			Button 1
		</button>
		<a id="helpLink" href="#" onclick="showHelpText()">How to go the next element</a>
		<div id="helptext"></div>
		<button id="btn2" onblur="moveFocusTo('btn1')">
			Button 2
		</button>
	</div>
	<a id="link2" href="#">Link 2</a>
</body>
</html>
```
