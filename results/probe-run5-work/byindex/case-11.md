CASE INDEX: 11
TESTCASE_ID: 62fd24e73ea5
KIND: FN   SC: 2.1.2   RULE: 80af7b   Focusable element has no keyboard trap
run5 outcome: uncertain   v3Barrier(deterministic): false   inScopeAutoPartial: 1   inScopeObligations: 2

## LLM in-scope verdicts (run5, post-fix)
- AGENT 2.1.2 PARTIAL
  The button sits in a flagged trap-risk region and the deterministic probe could not confirm or deny that focus can escape via Tab / Shift+Tab / Esc, leaving 2.1.2 unresolved.

## model reasoning trace (run5)

### subject sc=2.1.2 xpath=/html/body/button[2] rubric=undefined verdict=PARTIAL
THINK: Let me analyze the signals provided for WCAG 2.1.2 (No Keyboard Trap) for the element at xpath `/html/body/button[2]`.

Key signals:
1. `keyboard.operable: null, confident: false` - indeterminate
2. `keyboardTrapContext.inTrapRiskRegion: true` - this control sits in a focus-trapping region
3. `keyboardTrapContext.deterministicTrapConfirmed: false` - no trap confirmed deterministically
4. `uncertainReason` says: "a 2.1.2 trap is PLAUSIBLE here, but the deterministic walk did NOT confirm one; flag
SAY: ```json
{
  "verdict": "PARTIAL",
  "confidence": "low",
  "summary": "The button sits in a flagged trap-risk region and the deterministic probe could not confirm or deny that focus can escape via Tab / Shift+Tab / Esc, leaving 2.1.2 unresolved.",
  "reasoning": "The pre-computed signal reports `inTrapRiskRegion: true` (modal/menu/listbox/grid context or inline focus handler present) but `determin

## FIXTURE HTML (80af7b/62fd24e73ea5)
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
