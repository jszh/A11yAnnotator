CASE INDEX: 23
TESTCASE_ID: ede992d9573d
KIND: FP   SC: 4.1.2   RULE: 307n5z   Element with presentational children has no focusable content
run5 outcome: caught   v3Barrier(deterministic): false   inScopeAutoPartial: 0   inScopeObligations: 1

## LLM in-scope verdicts (run5, post-fix)
- RUBRIC 4.1.2 LIKELY_BARRIER [accessible-name-adequacy-v0] xpath=/html/body/button[1]
  The button's accessible name 'button/link' is a content-free placeholder naming the element's type/role category rather than identifying the control's purpose.

## model reasoning trace (run5)

### subject sc=4.1.2 xpath=/html/body/button[1] rubric=accessible-name-adequacy-v0 verdict=REPRODUCED
THINK: The accessible name is "button/link" and the element is a button. This looks like a content-free placeholder / leftover - the name "button/link" appears to be a template token or placeholder describing the element type rather than identifying the control's purpose.

Let me check the rendered pixels - the element-crop shows "button/link" as the visible text label on a button. The accessible name is "button/link" which is exactly what's visually rendered.

The rubric says failure includes:
- a con
TOOL mcp__cdp__query_ax_node {"targetXpath":"/html/body/button[1]"}
TOOL_RESULT: [{"type":"text","text":"{\"resolved\":true,\"inTree\":true,\"role\":\"button\",\"roleSource\":\"role\",\"headingLevel\":null,\"nameFrom\":[\"contents\"],\"labelledby\":null,\"describedby\":null,\"focusable\":true,\"isAriaHidden\":false,\"requiredStatesPresent\":[],\"requiredStatesMissing\":[],\"ignoredReasons\":[],\"ignoredByActiveModal\":false}"}]
THINK: The element is a `button` role (from semantic HTML), and the name comes from `contents` - meaning the visible text "button/link" is the accessible name. 

The accessible name is "button/link" - this is the text content of the button. It's clearly a placeholder/template name. It names the control's type/category ("button/link") rather than identifying what the control does.

The rubric says failure includes "a content-free placeholder / leftover — strictly: an un-substituted template token." The 
SAY: ```json
{
  "verdict": "REPRODUCED",
  "confidence": "high",
  "summary": "The button's accessible name 'button/link' is a content-free placeholder naming the element's type/role category rather than identifying the control's purpose.",
  "reasoning": "The AX node confirms role=button with name derived from text contents 'button/link'; this string is not a human-meaningful label describing what th

## FIXTURE HTML (307n5z/ede992d9573d)
```html
<!DOCTYPE html>
<html lang="en">
<head>
	<title>Passed Example 4</title>
</head>
<body>
	<button><a>button/link</a></button>
</body>
</html>
```
