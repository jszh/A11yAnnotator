CASE INDEX: 8
TESTCASE_ID: 7dcc4ae00712
KIND: FN   SC: 2.1.2   RULE: 80af7b   Focusable element has no keyboard trap
run5 outcome: noObligation   v3Barrier(deterministic): false   inScopeAutoPartial: 0   inScopeObligations: 2

## LLM in-scope verdicts (run5, post-fix)
- (NO in-scope verdicts — outcome noObligation)

## model reasoning trace (run5)

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
