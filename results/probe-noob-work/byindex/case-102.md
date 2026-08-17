CASE INDEX: 102
TESTCASE_ID: 7dcc4ae00712
GT (expected): failed   SC: 2.1.2   RULE: 80af7b   Focusable element has no keyboard trap
run4 outcome: noObligation (the oracle enumerated NO in-scope obligation, so the LLM was never asked).
inScopeObligations: 2   inScopeAutoPartial: 0   v3Barrier(deterministic): false
post-fix (run5) outcome on this case: noObligation

QUESTION: should the harness have enumerated an in-scope obligation for SC 2.1.2 on this page? Judge the fixture against the ACT rule.

## FIXTURE HTML (80af7b/7dcc4ae00712)
```html
<!DOCTYPE html>
<html lang="en">
<head>
	<title>Failed Example 3</title>
</head>
<body>
	<script src="../_assets/WAI/content-assets/wcag-act-rules/test-assets/focusable-no-keyboard-trap/keyboard.js"></script>
	
	<a id="link1" href="#">Link 1</a>
	<button id="btn1" onfocus="trapOn = true" onblur="moveFocusToButton('btn2')" onkeydown="escapeTrapOnCtrlM(event)">
		Button 1
	</button>
	<button id="btn2" onfocus="trapOn = true" onblur="moveFocusToButton('btn1')" onkeydown="escapeTrapOnCtrlM(event)">
		Button 2
	</button>
	<a id="link2" href="#">Link 2</a>
</body>
</html>
```
