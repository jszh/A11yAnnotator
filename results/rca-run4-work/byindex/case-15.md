CASE INDEX: 15
TESTCASE_ID: cc172d9a654d
KIND (authoritative, from run4 GT+outcome): FP
SC: 1.1.1   RULE: 7d6734   SVG element with explicit role has non-empty accessible name

This file is SELF-CONTAINED. Below: (1) the harness evidence slice — GT, LLM in-scope verdicts+summaries, off-target barriers, and the model FULL reasoning trace (THINK/SAY/TOOL_CALL/TOOL_RESULT); (2) the fixture HTML inlined.

================= EVIDENCE SLICE =================
# RCA case cc172d9a654d  [FP]
- rule: 7d6734  SVG element with explicit role has non-empty accessible name
- sc(GT-scored): 1.1.1   expected(GT): passed   outcome: caught   polarity: specificity
- v3Barrier(deterministic): false   inScopeAutoPartial: 0   inScopeObligations: 1
- fixture: eval/checker-comparison/act-subset/pages/7d6734/cc172d9a654d94e00505456845920c099fbabfa7.html

## in-scope verdicts
- RUBRIC 1.1.1 LIKELY_BARRIER conf=medium [alt-text-adequacy-v0] xpath=/html/body/svg[1]
  summary: The SVG circle carries informational content in a counting exercise but is removed from the accessibility tree via role='none' with no accessible name, denying screen-reader users the ability to perceive it.

## model reasoning trace (per subject)

### subject sc=1.1.1 xpath=/html/body/svg[1] rubric=alt-text-adequacy-v0 verdict=REPRODUCED
THINK: Let me analyze this element. The element is an SVG with xpath /html/body/svg[1]. 

From the evidence:
- The accessible name is empty (present: false)
- The element-crop shows a yellow circle on white background
- The surrounding region shows "How many circles are" text with the yellow circle

The surrounding text appears to say "How many circles are [something]" - this looks like it could be a quiz/question where the yellow circle is part of the question content. The circle is being counted/referenced in the question.

Let me think about this:
1. The SVG has an empty accessible name
2. The SVG renders as a yellow circle
3. The surrounding text references counting circles, so this yellow circle is informative content that's essential to understanding the question

Without an accessible name, a screen reader user wouldn't be able to perceive this circle as part of the counting exercise. I need to check the computed role to see if this SVG requires a name for accessibility purposes.
TOOL_CALL mcp__cdp__query_ax_node input={"targetXpath":"/html/body/svg[1]"}
TOOL_CALL mcp__cdp__capture_full_page input={"targetXpath":"/html/body/svg[1]"}
TOOL_RESULT: [{"type":"text","text":"{\"resolved\":false,\"reason\":\"node not found at the given xpath/coordinate\"}"}]
TOOL_RESULT: [{"type":"text","text":"{\"error\":\"target not found\"}"}]
THINK: The node wasn't found. Let me try a different approach - let me capture the full page and then look for the SVG element.
TOOL_CALL mcp__cdp__capture_full_page input={}
TOOL_RESULT: [{"type":"text","text":"{\"screenshot\":\"<base64 13052 chars elided>\",\"fullPage\":true,\"pageSize\":{\"w\":1280,\"h\":900},\"viewport\":{\"w\":1280,\"h\":900},\"target\":null,\"note\":\"the WHOLE scrollable document (below the fold included). A target box is in PAGE coordinates (origin = document top); a NEGATIVE y or offDocument:true means the element is positioned OUTSIDE the document (e.g. top:-9999px → visually hidden) and is NOT in the captured pixels. Use to confirm an off-viewport element exists and judge WHERE it sits relative to surrounding content — never infer a barrier from posi
THINK: The full page screenshot shows the page. Looking at the surrounding text and visual context, I can see "How many circles are" text with the yellow circles. The element is an SVG with an empty accessible name.

From the visual evidence:
- The SVG renders as a yellow circle
- The surrounding context says "How many circles are..." suggesting this is a counting exercise
- The accessible name is empty (no alt text, no aria-label)

Now, let me think about what role this SVG has. The ax_node query failed to find the node. Let me try querying by coordinates. Looking at the full page image, the yellow circle appears to be in the upper-left area.
The real question is what semantic role this SVG actually has. Without an explicit role attribute, it might default to img or have no semantic role at all, depending on whether there's a title element or aria-label. Since the accessible name is empty and the surrounding context is clearly asking "How many circles are [X]?", these circles are the informational content being counted rather than decorative elements. I need to verify whether the SVG actually requires an accessible name based on its role, and I'm trying to locate the element by examining the page coordinates to get more context about what I'm dealing with.
TOOL_CALL mcp__cdp__query_ax_node input={"x":120,"y":130}
TOOL_RESULT: [{"type":"text","text":"{\"resolved\":true,\"inTree\":false,\"role\":\"none\",\"roleSource\":\"role\",\"headingLevel\":null,\"nameFrom\":[],\"labelledby\":\"unresolved-on-coordinate-path\",\"describedby\":\"unresolved-on-coordinate-path\",\"focusable\":false,\"isAriaHidden\":false,\"requiredStatesPresent\":[],\"requiredStatesMissing\":null,\"ignoredReasons\":[\"uninteresting\"],\"ignoredByActiveModal\":false}"}]
THINK: The AX query at the coordinates of the yellow circle shows:
- role: "none"
- roleSource: "role"
- inTree: false (not in the accessibility tree)
- ignoredReasons: ["uninteresting"]
- isAriaHidden: false

So the SVG has `role="none"` which removes it from the accessibility tree. This means:
1. The SVG is not in the accessibility tree
2. It has role="none" explicitly set

Now I need to apply the rubric for "Decoratively MARKED but meaningful":
The SVG renders as a yellow circle that's part of the actual content being counted. The surrounding text asks "How many circles are" but the circles themselves are what needs to be perceived to answer the question. The key issue is whether the circles convey information that's not redundant with text elsewhere—if there's no text stating the count, then removing the visual circles from the accessibility tree prevents screen reader users from accessing the core content. The key distinction is whether the circles are redundant with surrounding text or convey unique meaning. Since the exercise asks "how many circles are" and the image itself shows the circles to count, this is unique informational content that shouldn't be hidden from the accessibility tree. The `role="none"` removal combined with the circles being the actual subject matter makes this a barrier.
SAY: Based on my investigation, I now have sufficient evidence to render a verdict.

**Key findings:**
1. **Accessible name:** Empty (confirmed by deterministic signal)
2. **Computed role:** `role="none"` — the SVG is explicitly removed from the accessibility tree (`inTree: false`, `ignoredReasons: ["uninteresting"]`, `isAriaHidden: false`)
3. **Rendered content:** A yellow circle (from the element-crop)
4. **Surrounding context:** "How many circles are…" — indicating a counting/educational exercise where the circles ARE the informational content being counted
5. The surrounding text does **not** provide a redundant textual equivalent for the circles — the question references them without describing them

Applying the rubric's "Decoratively MARKED but meaningful" test: the yellow circle SVG conveys **unique** information (it is one of the objects to be counted in the exercise) that is **absent** from the surrounding text. Removing it from the accessibility tree denies screen-reader users the ability to perceive and count the circle.

```json
{
  "verdict": "REPRODUCED",
  "confidence": "medium",
  "summary": "The SVG circle carries informational content in a counting exercise but is removed from the accessibility tree via role='none' with no accessible name, denying screen-reader users the ability to perceive it.",
  "reasoning": "The computed AX role is 'none' (inTree: false), the accessible name is empty, the element-crop shows a yellow circle, and the surrounding text 'How many circles are…' confirms the circle is the informational subject of a counting task — unique content not replicated in adjacent text — making its removal from the AT a barrier per the redundancy test.",
  "evidenceRefs": [
    "accessibleName.present=false (deterministic signal)",
    "query_ax_node → role='none', inTree=false, ignoredReasons=['uninteresting']",
    "element-crop: yellow circle rendered visibly",
    "surrounding-region text: 'How many circles are…' (counting exercise context)"
  ]
}
```


================= FIXTURE HTML (7d6734/cc172d9a654d) =================
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
