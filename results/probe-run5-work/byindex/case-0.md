CASE INDEX: 0
TESTCASE_ID: 62673162e22e
KIND: FN   SC: 2.1.1   RULE: akn7bn   Iframe with interactive elements is not excluded from tab-order
run5 outcome: missedAgree   v3Barrier(deterministic): false   inScopeAutoPartial: 0   inScopeObligations: 1

## LLM in-scope verdicts (run5, post-fix)
- AGENT 2.1.1 NOT REPRODUCED
  The anchor link inside the iframe is focusable, carries a native 'link' role with name derived from contents, and Enter-key activation is browser-native — no keyboard barrier is present.

## model reasoning trace (run5)

### subject sc=2.1.1 xpath=/html/body/iframe[1]>>/html/body/a[1] rubric=undefined verdict=NOT REPRODUCED
THINK: Let me query the AX node for this element to understand its computed role and accessibility properties.
TOOL mcp__cdp__query_ax_node {"targetXpath":"/html/body/iframe[1]>>/html/body/a[1]"}
TOOL_RESULT: [{"type":"text","text":"{\"resolved\":true,\"inTree\":true,\"role\":\"link\",\"roleSource\":\"role\",\"headingLevel\":null,\"nameFrom\":[\"contents\"],\"labelledby\":null,\"describedby\":null,\"focusable\":true,\"isAriaHidden\":false,\"requiredStatesPresent\":[],\"requiredStatesMissing\":null,\"ignoredReasons\":[],\"ignoredByActiveModal\":false}"}]
THINK: The element is:
- Role: "link" (from role source)
- Focusable: true
- Not aria-hidden
- Name from contents
- Not ignored

This is a standard `<a>` link inside an iframe. It's focusable, has a proper link role, and gets its name from its contents. The deterministic signals say keyboard operability is indeterminate (PARTIAL) due to snapshot limitations - no keyboard response was observed but it's only limited/snapshot evidence.

For a link, the expected key is Enter to activate. The element is foc
SAY: ```json
{
  "verdict": "NOT REPRODUCED",
  "confidence": "high",
  "summary": "The anchor link inside the iframe is focusable, carries a native 'link' role with name derived from contents, and Enter-key activation is browser-native — no keyboard barrier is present.",
  "reasoning": "The AX node confirms role='link' (native source), focusable=true, not aria-hidden, name resolved from contents; a na

## FIXTURE HTML (akn7bn/62673162e22e)
```html
<!DOCTYPE html>
<html lang="en">
<head>
	<title>Failed Example 1</title>
</head>
<body>
	<iframe tabindex="-1" srcdoc="<a href='/'>Home</a>"></iframe>
</body>
</html>
```
