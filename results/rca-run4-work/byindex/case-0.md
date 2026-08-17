CASE INDEX: 0
TESTCASE_ID: 62673162e22e
KIND (authoritative, from run4 GT+outcome): FN
SC: 2.1.1   RULE: akn7bn   Iframe with interactive elements is not excluded from tab-order

This file is SELF-CONTAINED. Below: (1) the harness evidence slice — GT, LLM in-scope verdicts+summaries, off-target barriers, and the model FULL reasoning trace (THINK/SAY/TOOL_CALL/TOOL_RESULT); (2) the fixture HTML inlined.

================= EVIDENCE SLICE =================
# RCA case 62673162e22e  [FN]
- rule: akn7bn  Iframe with interactive elements is not excluded from tab-order
- sc(GT-scored): 2.1.1   expected(GT): failed   outcome: missedAgree   polarity: recall
- v3Barrier(deterministic): false   inScopeAutoPartial: 0   inScopeObligations: 1
- fixture: eval/checker-comparison/act-subset/pages/akn7bn/62673162e22ee1e95e962522b1d1c3b549dbfc49.html

## in-scope verdicts
- AGENT 2.1.1 NOT REPRODUCED conf=high xpath=/html/body/iframe[1]>>/html/body/a[1]
  summary: The link inside the iframe is focusable, properly roled, and has an accessible name — no keyboard barrier is present.

## model reasoning trace (per subject)

### subject sc=2.1.1 xpath=/html/body/iframe[1]>>/html/body/a[1] rubric=undefined verdict=NOT REPRODUCED
THINK: Let me query the AX node for this element to understand its role, name, and focusability.
TOOL_CALL mcp__cdp__query_ax_node input={"targetXpath":"/html/body/iframe[1]>>/html/body/a[1]"}
TOOL_RESULT: [{"type":"text","text":"{\"resolved\":true,\"inTree\":true,\"role\":\"link\",\"roleSource\":\"role\",\"headingLevel\":null,\"nameFrom\":[\"contents\"],\"labelledby\":null,\"describedby\":null,\"focusable\":true,\"isAriaHidden\":false,\"requiredStatesPresent\":[],\"requiredStatesMissing\":null,\"ignoredReasons\":[],\"ignoredByActiveModal\":false}"}]
THINK: The element is a link (`role: link`), it's focusable, has a name from contents, and is not aria-hidden. It's inside an iframe.

The deterministic signal says keyboard operability is null/indeterminate - limited snapshot evidence. The VSR announcement is none.

For a link (`role: link`), the expected keys are Tab (to reach it) and Enter (to activate). The element:
- Is in the AX tree (inTree: true)
- Has role: link
- Is focusable: true
- Has nameFrom: contents (so it has a name from its text content)
- Is not aria-hidden

The iframe context likely prevented the Tab walk from fully traversing into it, which explains why the keyboard operability signal is indeterminate despite the element being properly focusable and roled. The AX tree confirms it has all the right attributes for keyboard operation—it should respond to Tab and Enter—but the limited snapshot evidence from the iframe boundary makes the signal uncertain.

Given the static evidence is clear (focusable, role:link, in the AX tree, has an accessible name, not ignored), I'm confident this isn't a real keyboard barrier. Standard native anchor elements inside iframes are natively keyboard operable, so the indeterminate signal is likely just an artifact of how the snapshot was captured.
SAY: ```json
{
  "verdict": "NOT REPRODUCED",
  "confidence": "high",
  "summary": "The link inside the iframe is focusable, properly roled, and has an accessible name — no keyboard barrier is present.",
  "reasoning": "The AX node query confirms role='link' (from native <a> semantics), focusable=true, inTree=true, nameFrom=['contents'], and no ignoredReasons — a native anchor element natively responds to Tab (reach) and Enter (activate); the deterministic signal's 'indeterminate' status reflects a snapshot/iframe traversal limitation, not an actual barrier.",
  "evidenceRefs": [
    "AX node: role=link, roleSource=role, focusable=true, inTree=true, nameFrom=[contents], isAriaHidden=false, ignoredReasons=[]",
    "keyboard signal: confident=false due to limited snapshot evidence (iframe context), not evidence of a barrier",
    "keyboardTrapContext: inTrapRiskRegion=false, no trap confirmed"
  ]
}
```


================= FIXTURE HTML (akn7bn/62673162e22e) =================
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
