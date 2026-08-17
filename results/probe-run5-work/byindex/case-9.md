CASE INDEX: 9
TESTCASE_ID: 8fba3918b361
KIND: FN   SC: 2.1.2   RULE: 80af7b   Focusable element has no keyboard trap
run5 outcome: uncertain   v3Barrier(deterministic): false   inScopeAutoPartial: 2   inScopeObligations: 2

## LLM in-scope verdicts (run5, post-fix)
- AGENT 2.1.2 PARTIAL
  A keyboard trap on this button cannot be confirmed or ruled out: it sits in a flagged trap-risk region but the deterministic walk could not verify whether Tab/Shift+Tab/Esc successfully moves focus away.

## model reasoning trace (run5)

### subject sc=2.1.2 xpath=/html/body/button[1] rubric=undefined verdict=PARTIAL
THINK: Let me analyze the pre-computed signals for WCAG 2.1.2 (No Keyboard Trap) for the element at xpath /html/body/button[1].

Key signals:
1. `keyboardTrapContext.inTrapRiskRegion: true` - this control sits in a focus-trapping region
2. `keyboardTrapContext.deterministicTrapConfirmed: false` - the deterministic walk did NOT confirm a trap
3. `keyboard.operable: null, confident: false` - indeterminate
4. VSR: none

The claim family is "no-keyboard-trap" (2.1.2).
The deterministic runner couldn't defi
SAY: ```json
{
  "verdict": "PARTIAL",
  "confidence": "low",
  "summary": "A keyboard trap on this button cannot be confirmed or ruled out: it sits in a flagged trap-risk region but the deterministic walk could not verify whether Tab/Shift+Tab/Esc successfully moves focus away.",
  "reasoning": "keyboardTrapContext.inTrapRiskRegion=true places this native <button> in a modal/menu/grid or inline-focus-

## FIXTURE HTML (80af7b/8fba3918b361)
```html
<!DOCTYPE html>
<html lang="en">
<head>
	<title>Failed Example 4</title>
</head>
<body>
	<script src="../_assets/WAI/content-assets/wcag-act-rules/test-assets/focusable-no-keyboard-trap/keyboard.js"></script>
	
	<p>Go to the next element</p>
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
