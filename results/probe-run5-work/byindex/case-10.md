CASE INDEX: 10
TESTCASE_ID: cc172d9a654d
KIND: FP   SC: 1.1.1   RULE: 7d6734   SVG element with explicit role has non-empty accessible name
run5 outcome: caught   v3Barrier(deterministic): false   inScopeAutoPartial: 0   inScopeObligations: 1

## LLM in-scope verdicts (run5, post-fix)
- RUBRIC 1.1.1 LIKELY_BARRIER [alt-text-adequacy-v0] xpath=/html/body/svg[1]
  The SVG renders a meaningful yellow circle that is part of a visual counting exercise but has no accessible name and is not in the accessibility tree, so screen-reader users are denied access to this informative content.

## model reasoning trace (run5)

### subject sc=1.1.1 xpath=/html/body/svg[1] rubric=alt-text-adequacy-v0 verdict=REPRODUCED
THINK: Let me analyze this SVG element for WCAG 1.1.1 compliance.

The element is `/html/body/svg[1]` - an SVG element.

From the signals:
- Accessible name: empty, not present
- VSR announcement: none

From the crops:
- The element-crop shows a yellow circle on white background
- The surrounding-region shows the yellow circle with partial text "How many circles are" visible at the top

This SVG renders a yellow circle and appears to be part of a quiz/question context ("How many circles are..."). The S
TOOL mcp__cdp__query_ax_node {"targetXpath":"/html/body/svg[1]"}
TOOL_RESULT: [{"type":"text","text":"{\"resolved\":false,\"reason\":\"node not found at the given xpath/coordinate\"}"}]
TOOL mcp__cdp__capture_full_page {"targetXpath":"/html/body/svg[1]"}
TOOL_RESULT: [{"type":"text","text":"{\"error\":\"target not found\"}"}]
TOOL mcp__cdp__capture_full_page {}
TOOL_RESULT: [{"type":"text","text":"{\"screenshot\":\"<base64 13052 chars elided>\",\"fullPage\":true,\"pageSize\":{\"w\":1280,\"h\":900},\"viewport\":{\"w\":1280,\"h\":900},\"target\":null,\"note\":\"the WHOLE scrollable document (below the fold included). A target box is in PAGE coordinates (origin = document top); a NEGATIVE y or offDocument:true means the element is positioned OUTSIDE the document (e.g. t
THINK: The full page screenshot shows the page. Let me look at the surrounding context - I can see "How many circles are" at the top of the surrounding region crop. The SVG appears to be a yellow circle. Let me check the AX node again with coordinates from the page screenshot.

The page shows what appears to be a counting exercise with yellow circles. The SVG at `/html/body/svg[1]` renders a yellow circle with no accessible name.

Let me try to query the AX node using coordinates. From the full page sc
TOOL mcp__cdp__query_ax_node {"x":160,"y":450}
TOOL_RESULT: [{"type":"text","text":"{\"resolved\":true,\"inTree\":false,\"role\":\"none\",\"roleSource\":\"role\",\"headingLevel\":null,\"nameFrom\":[],\"labelledby\":\"unresolved-on-coordinate-path\",\"describedby\":\"unresolved-on-coordinate-path\",\"focusable\":false,\"isAriaHidden\":false,\"requiredStatesPresent\":[],\"requiredStatesMissing\":null,\"ignoredReasons\":[\"uninteresting\"],\"ignoredByActiveMo
THINK: The SVG element is `inTree: false` with `role: "none"` and `ignoredReasons: ["uninteresting"]`. This means the SVG is not in the accessibility tree - it's being ignored by the accessibility tree because it has no semantic role or meaningful content from the AT's perspective.

Now I need to decide: is the SVG decorative or informative?

From the surrounding context ("How many circles are..."), this appears to be part of a counting exercise. The yellow circle SVG is informative content - it's one 
SAY: ```json
{
  "verdict": "REPRODUCED",
  "confidence": "medium",
  "summary": "The SVG renders a meaningful yellow circle that is part of a visual counting exercise but has no accessible name and is not in the accessibility tree, so screen-reader users are denied access to this informative content.",
  "reasoning": "The element-crop shows a bright yellow circle; the surrounding region reveals the te

## FIXTURE HTML (7d6734/cc172d9a654d)
```html
<!DOCTYPE html>
<html lang="en">
<head>
	<title>Passed Example 1</title>
</head>
<body>
	<p>How many circles are there?</p>
	<svg xmlns="http://www.w3.org/2000/svg" role="img" width="100" height="100">
		<title>1 circle</title>
		<circle cx="50" cy="50" r="40" fill="yellow"></circle>
	</svg>
</body>
</html>
```
