CASE INDEX: 56
TESTCASE_ID: 9f5f37188301
KIND (authoritative, from run4 GT+outcome): FP
SC: 1.1.1   RULE: e88epe   Image not in the accessibility tree is decorative

This file is SELF-CONTAINED. Below: (1) the harness evidence slice — GT, LLM in-scope verdicts+summaries, off-target barriers, and the model FULL reasoning trace (THINK/SAY/TOOL_CALL/TOOL_RESULT); (2) the fixture HTML inlined.

================= EVIDENCE SLICE =================
# RCA case 9f5f37188301  [FP]
- rule: e88epe  Image not in the accessibility tree is decorative
- sc(GT-scored): 1.1.1   expected(GT): inapplicable   outcome: caught   polarity: specificity
- v3Barrier(deterministic): false   inScopeAutoPartial: 0   inScopeObligations: 1
- fixture: eval/checker-comparison/act-subset/pages/e88epe/9f5f3718830124266a4866dc42f539a5a03e37e5.html

## in-scope verdicts
- RUBRIC 1.1.1 LIKELY_BARRIER conf=high [alt-text-adequacy-v0] xpath=/html/body/a[1]/svg[1]
  summary: A yellow star SVG that is the sole content of a link has been removed from the accessibility tree via role='none' with no nearby text, denying AT users the link's only label.

## model reasoning trace (per subject)

### subject sc=1.1.1 xpath=/html/body/a[1]/svg[1] rubric=alt-text-adequacy-v0 verdict=REPRODUCED
THINK: Let me analyze this case:

1. The element is `/html/body/a[1]/svg[1]` - an SVG inside a link (`<a>` tag)
2. The accessible name is empty (`""`)
3. The element is removed from the accessibility tree via `role="none"` (`removedFromA11yTree: true`, `hiddenMechanism: "role-none"`)
4. It's rendered visible (a yellow star on white background)
5. No nearby text (`nearbyText: null`)

Key considerations:
- This SVG is inside a link (`a[1]`), making it a **functional image** (linked)
- The `role="none"` removes it from the accessibility tree entirely, and there's no text alternative
- Since this is the only content within the link, the link itself would have no accessible name
- But I need to focus on the SVG's 1.1.1 compliance specifically, not the link's broader accessibility issues

The star icon is functional—it's inside a link and conveys the link's purpose. With no nearby text and the SVG stripped from the accessibility tree, the icon's meaning is completely inaccessible to screen reader users. This is a clear barrier under 1.1.1 because the image conveys unique meaning that's essential to understanding the link's function. The visual evidence confirms it—a star icon sitting alone in a link with nothing else to label it, and that icon's been stripped from the accessibility tree entirely. That's the core issue: no accessible name means no way for screen reader users to understand what the link does.
SAY: ```json
{
  "verdict": "REPRODUCED",
  "confidence": "high",
  "summary": "A yellow star SVG that is the sole content of a link has been removed from the accessibility tree via role='none' with no nearby text, denying AT users the link's only label.",
  "reasoning": "The element-crop clearly shows a yellow star icon inside an <a> element (a functional/linked image); decorativeMarking.nearbyText is null, meaning there is no adjacent text to make the image redundant — the star IS the only content and label of the link; hiding it with role='none' and providing no text alternative denies the link's purpose to non-sighted users, satisfying the rubric's unique-meaning barrier test for functional images.",
  "evidenceRefs": [
    "decorativeMarking.removedFromA11yTree=true",
    "decorativeMarking.hiddenMechanism=role-none",
    "decorativeMarking.nearbyText=null",
    "accessibleName.value='' (empty)",
    "element-crop: rendered yellow star (functional icon inside <a>)",
    "xpath: /html/body/a[1]/svg[1] — SVG is child of an anchor element"
  ]
}
```


================= FIXTURE HTML (e88epe/9f5f37188301) =================
```html
<!DOCTYPE html>
<html lang="en">
<head>
	<title>Inapplicable Example 4</title>
</head>
<body>
	<a href="https://example.org" aria-label="SVG star">
		<svg height="200" xmlns="http://www.w3.org/2000/svg" role="none">
			<polygon points="100,10 40,180 190,60 10,60 160,180" fill="yellow" />
		</svg>
	</a>
</body>
</html>
```
