CASE INDEX: 41
TESTCASE_ID: 8fba3918b361
KIND (authoritative, from run4 GT+outcome): FN
SC: 2.1.2   RULE: 80af7b   Focusable element has no keyboard trap

This file is SELF-CONTAINED. Below: (1) the harness evidence slice — GT, LLM in-scope verdicts+summaries, off-target barriers, and the model FULL reasoning trace (THINK/SAY/TOOL_CALL/TOOL_RESULT); (2) the fixture HTML inlined.

================= EVIDENCE SLICE =================
# RCA case 8fba3918b361  [FN]
- rule: 80af7b  Focusable element has no keyboard trap
- sc(GT-scored): 2.1.2   expected(GT): failed   outcome: uncertain   polarity: recall
- v3Barrier(deterministic): false   inScopeAutoPartial: 2   inScopeObligations: 2
- fixture: eval/checker-comparison/act-subset/pages/80af7b/8fba3918b361f251dab4c19bec8eddc5624218ee.html

## in-scope verdicts
- AGENT 2.1.2 PARTIAL conf=low xpath=/html/body/button[1]
  summary: The button sits in a flagged trap-risk region and a 2.1.2 keyboard trap cannot be ruled out, but the deterministic walk did not confirm that focus actually became trapped.

## model reasoning trace (per subject)

### subject sc=2.1.2 xpath=/html/body/button[1] rubric=undefined verdict=PARTIAL
THINK: Let me analyze the evidence for WCAG 2.1.2 (No Keyboard Trap) for the element at xpath `/html/body/button[1]`.

The claim family is `no-keyboard-trap`.

Key signals:
1. `keyboardTrapContext.inTrapRiskRegion: true` - this control sits in a focus-trapping region
2. `keyboardTrapContext.deterministicTrapConfirmed: false` - the deterministic walk did NOT confirm a trap
3. `keyboard.operable: null, confident: false` - no keyboard response observed, indeterminate
4. VSR announcement: none

For 2.1.2 (No Keyboard Trap), I need to determine if focus can be moved away from this element using Tab/Shift+Tab/Esc.
The deterministic signals show the button is in a region that could trap focus, but the probe didn't actually detect a trap occurring. Since this is a native button element that should be keyboard accessible, and the deterministic walk couldn't confirm a trap despite the risk region flag, I'm working with incomplete evidence—the snapshot doesn't definitively show whether keyboard focus can escape.

Given the WCAG 2.1.2 standard requires confirming that focus actually cannot be moved away, and the deterministic probe was inconclusive, I should flag this as PARTIAL rather than a confirmed barrier. The trap risk is plausible but unconfirmed due to the limitations of the snapshot analysis.
SAY: ```json
{
  "verdict": "PARTIAL",
  "confidence": "low",
  "summary": "The button sits in a flagged trap-risk region and a 2.1.2 keyboard trap cannot be ruled out, but the deterministic walk did not confirm that focus actually became trapped.",
  "reasoning": "keyboardTrapContext reports inTrapRiskRegion:true (modal/menu/listbox/grid or inline focus handler present), yet deterministicTrapConfirmed:false and keyboard.operable:null/confident:false — the snapshot probe lacked live-JS fidelity to exercise Tab/Shift+Tab/Esc escape paths, so whether focus can move away remains indeterminate and a live-state-and-capture or screen-reader probe is required to resolve it.",
  "evidenceRefs": [
    "keyboardTrapContext.inTrapRiskRegion: true",
    "keyboardTrapContext.deterministicTrapConfirmed: false",
    "keyboardTrapContext.uncertainReason: 'trap plausible but deterministic walk did not confirm'",
    "keyboard.operable: null, keyboard.confident: false",
    "VSR announcement: none"
  ]
}
```


================= FIXTURE HTML (80af7b/8fba3918b361) =================
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
