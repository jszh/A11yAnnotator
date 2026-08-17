CASE INDEX: 12
TESTCASE_ID: cd3b3a404645
KIND (authoritative, from run4 GT+outcome): FP
SC: 1.1.1   RULE: 23a2a8   Image has non-empty accessible name

This file is SELF-CONTAINED. Below: (1) the harness evidence slice — GT, LLM in-scope verdicts+summaries, off-target barriers, and the model FULL reasoning trace (THINK/SAY/TOOL_CALL/TOOL_RESULT); (2) the fixture HTML inlined.

================= EVIDENCE SLICE =================
# RCA case cd3b3a404645  [FP]
- rule: 23a2a8  Image has non-empty accessible name
- sc(GT-scored): 1.1.1   expected(GT): inapplicable   outcome: caught   polarity: specificity
- v3Barrier(deterministic): false   inScopeAutoPartial: 0   inScopeObligations: 1
- fixture: eval/checker-comparison/act-subset/pages/23a2a8/cd3b3a4046451da9b9cc3e166c09d27583a2c30b.html

## in-scope verdicts
- RUBRIC 1.1.1 LIKELY_BARRIER conf=medium [alt-text-adequacy-v0] xpath=/html/body/svg[1]
  summary: An SVG exposed in the accessibility tree as role='image' with no accessible name presents a barrier: a screen reader user receives an unlabeled image with no text equivalent for its visual content (a yellow circle with a green border).

## model reasoning trace (per subject)

### subject sc=1.1.1 xpath=/html/body/svg[1] rubric=alt-text-adequacy-v0 verdict=REPRODUCED
THINK: Let me analyze this case. The element is an SVG (`/html/body/svg[1]`) with an empty accessible name. The element-crop shows a yellow circle with a green border.

I need to determine:
1. What is the computed role of this SVG?
2. Is this image informative or decorative?
3. Does the empty name constitute a barrier?

The SVG renders a yellow circle with a green border. The accessible name is empty. Let me check the computed role and context to determine if this is informative or decorative.

Let me query the AX node to understand the role better.
TOOL_CALL mcp__cdp__query_ax_node input={"targetXpath":"/html/body/svg[1]"}
TOOL_RESULT: [{"type":"text","text":"{\"resolved\":false,\"reason\":\"node not found at the given xpath/coordinate\"}"}]
TOOL_CALL mcp__cdp__capture_full_page input={"targetXpath":"/html/body/svg[1]"}
TOOL_RESULT: [{"type":"text","text":"{\"error\":\"target not found\"}"}]
THINK: The element is not found. Let me try querying the AX node at a pixel coordinate from the crop. The crop shows a yellow circle with a green border. Let me try to find the SVG by checking the page.
TOOL_CALL mcp__cdp__query_ax_node input={"x":100,"y":100}
TOOL_RESULT: [{"type":"text","text":"{\"resolved\":true,\"inTree\":true,\"role\":\"image\",\"roleSource\":\"role\",\"headingLevel\":null,\"nameFrom\":[],\"labelledby\":\"unresolved-on-coordinate-path\",\"describedby\":\"unresolved-on-coordinate-path\",\"focusable\":false,\"isAriaHidden\":false,\"requiredStatesPresent\":[],\"requiredStatesMissing\":null,\"ignoredReasons\":[],\"ignoredByActiveModal\":false}"}]
THINK: The SVG has a computed role of "image" (likely it has `role="img"` or the browser auto-assigned the role). The accessible name is empty (nameFrom is empty array), and it's not aria-hidden. This means it's exposed in the accessibility tree as an image with no accessible name.

Now, the question is: is this SVG informative or decorative? The crop shows a yellow circle with a green border. This appears to be a simple geometric shape. Without surrounding context, I need to determine if it conveys information.

Since:
1. The SVG has role="image" (exposed in the accessibility tree as an image)
2. The accessible name is empty (no alt equivalent)
3. It's not aria-hidden or role="presentation"
4. The crop shows a yellow circle with a green border

An image with role="image" and no accessible name is a barrier if the image is informative. A screen reader would encounter this as an unlabeled image, which violates WCAG 1.1.1 if the content is actually conveying information rather than being purely decorative.

The yellow circle could represent a traffic light, status indicator, or other meaningful element, but without surrounding context visible in the crop, it's hard to determine its purpose. Since the element is exposed in the accessibility tree rather than hidden, the page author seems to intend it as accessible content—yet the lack of a name creates ambiguity about whether this is truly decorative or informative. or if there's any surrounding context that clarifies its purpose. Looking at the region around it, I don't see any explanatory text—just the circle itself. Since it's exposed in the accessibility tree as an image with no name, a screen reader would only announce "image" with no description, which is problematic whether it's meant to be informative or decorative. The rubric treats this as a redundancy issue if it's purely aesthetic, but without being able to determine that from the crop alone, I'm marking it as a barrier. The purpose is what matters here, and without context, a colored circle is genuinely ambiguous—it could be a status indicator, decorative element, or icon. Since it's exposed as role="image" with no accessible name and nothing in the surrounding content suggests it's purely decorative, I'm leaning toward REPRODUCED. An assistive technology user would encounter an unlabeled image with no way to understand what it represents, and the content could plausibly be meaningful. Medium confidence feels appropriate given the inherent ambiguity.
SAY: The AX query confirms the SVG is in the accessibility tree with computed `role="image"`, is not aria-hidden, and has no accessible name (`nameFrom: []`). A screen reader would announce it as an unlabeled image. The crop shows a yellow filled circle with a green stroke border — a shape that is plausibly a status indicator, icon, or meaningful glyph, and no surrounding text is visible in the provided surrounding-region crop that would render it redundant/decorative. The author did not use `aria-hidden`, `role="presentation"`, or `role="none"` to mark it decorative, yet supplied no text alternative.

```json
{
  "verdict": "REPRODUCED",
  "confidence": "medium",
  "summary": "An SVG exposed in the accessibility tree as role='image' with no accessible name presents a barrier: a screen reader user receives an unlabeled image with no text equivalent for its visual content (a yellow circle with a green border).",
  "reasoning": "The AX node confirms role='image', aria-hidden=false, and nameFrom=[] (no accessible name from any source); the SVG is not marked decorative (no aria-hidden/role=presentation/role=none), yet carries a non-trivial visual element — a coloured circle that could serve as a status indicator or icon — with no surrounding text visible in the crop that would make it redundant, satisfying the 'missing alt on an informative image' failure mode.",
  "evidenceRefs": [
    "AX node query: role=image, nameFrom=[], isAriaHidden=false",
    "Accessible name signal: value='', present=false",
    "Element-crop: yellow circle with green stroke border (non-trivial, potentially informative visual)",
    "No aria-hidden / role=presentation / role=none applied"
  ]
}
```


================= FIXTURE HTML (23a2a8/cd3b3a404645) =================
```html
<!DOCTYPE html>
<html lang="en">
<head>
	<title>Inapplicable Example 1</title>
</head>
<body>
	<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100">
		<circle cx="50" cy="50" r="40" stroke="green" stroke-width="4" fill="yellow" />
	</svg>
</body>
</html>
```
