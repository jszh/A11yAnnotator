CASE INDEX: 39
TESTCASE_ID: 7505d097f7d5
KIND (authoritative, from run4 GT+outcome): FN
SC: 2.4.10   RULE: 047fe0   Document has heading for non-repeated content

This file is SELF-CONTAINED. Below: (1) the harness evidence slice — GT, LLM in-scope verdicts+summaries, off-target barriers, and the model FULL reasoning trace (THINK/SAY/TOOL_CALL/TOOL_RESULT); (2) the fixture HTML inlined.

================= EVIDENCE SLICE =================
# RCA case 7505d097f7d5  [FN]
- rule: 047fe0  Document has heading for non-repeated content
- sc(GT-scored): 2.4.10   expected(GT): failed   outcome: uncertain   polarity: recall
- v3Barrier(deterministic): false   inScopeAutoPartial: 1   inScopeObligations: 1
- fixture: eval/checker-comparison/act-subset/pages/047fe0/7505d097f7d59d71dc7eb8f7ab82c5682def54d4.html

## in-scope verdicts
- RUBRIC 2.4.10 UNCERTAIN conf=high [section-headings-v0] xpath=/page-level::section-headings
  summary: The page's main content section has a visually heading-styled element, but it is marked up as <strong> (role=strong) rather than a real heading — this programmatic gap is owned by 1.3.1, not 2.4.10.

## model reasoning trace (per subject)

### subject sc=2.4.10 xpath=/page-level::section-headings rubric=section-headings-v0 verdict=PARTIAL
THINK: Let me analyze the evidence:

1. The deterministic signal shows `"headings": []` - no headings detected in the structure.
2. However, the viewport screenshot clearly shows a visually bold/large heading "Three Heroes Swear Brotherhood at a Feast in the Peach Garden" followed by content text.

The heading appears visually styled as an h2 (bold, large text), but the structure collector found no headings. This is interesting - the heading is visible in the viewport but not detected as a heading element.

Wait, the rubric says:
- If the only issue is a visual heading that isn't a real heading element, DEFER (PARTIAL) — 1.3.1 owns it.
- But I should verify this by checking the accessibility tree to see if it's actually marked as a heading semantically or if it's just styled to look like one. The `headings: []` result is pretty telling—if there were a real heading element there, it would show up in the structure. So this is likely just styled text that looks like a heading visually, which means it falls under 1.3.1, not 1.4.3. Let me query the AX node to confirm what element it actually is.
TOOL_CALL mcp__cdp__query_ax_node input={"x":340,"y":81}
TOOL_CALL mcp__cdp__capture_full_page input={}
TOOL_RESULT: [{"type":"text","text":"{\"resolved\":true,\"inTree\":true,\"role\":\"strong\",\"roleSource\":\"role\",\"headingLevel\":null,\"nameFrom\":[],\"labelledby\":\"unresolved-on-coordinate-path\",\"describedby\":\"unresolved-on-coordinate-path\",\"focusable\":false,\"isAriaHidden\":false,\"requiredStatesPresent\":[],\"requiredStatesMissing\":null,\"ignoredReasons\":[],\"ignoredByActiveModal\":false}"}]
TOOL_RESULT: [{"type":"text","text":"{\"screenshot\":\"<base64 33648 chars elided>\",\"fullPage\":true,\"pageSize\":{\"w\":1280,\"h\":900},\"viewport\":{\"w\":1280,\"h\":900},\"target\":null,\"note\":\"the WHOLE scrollable document (below the fold included). A target box is in PAGE coordinates (origin = document top); a NEGATIVE y or offDocument:true means the element is positioned OUTSIDE the document (e.g. top:-9999px → visually hidden) and is NOT in the captured pixels. Use to confirm an off-viewport element exists and judge WHERE it sits relative to surrounding content — never infer a barrier from posi
THINK: The AX node query shows that the element at the position of "Three Heroes Swear Brotherhood at a Feast in the Peach Garden" has a role of `"strong"` — not a heading. The `structure.headings[]` is empty, and the visual element that looks like a heading is actually a `<strong>` element, not an `h1`-`h6` or `role=heading`.

The full page screenshot confirms that the page shows:
1. A nav with an ordered list (Chapter 1, Chapter 2)
2. Visually bold text "Three Heroes Swear Brotherhood at a Feast in the Peach Garden"
3. Body text below

Since the only heading-like element is a `<strong>` tag rather than a proper heading element, this is a programmatic markup issue that 1.3.1 owns. The rubric indicates I should return PARTIAL and defer to 1.3.1 for this visual heading that lacks semantic structure.
SAY: The AX node query confirms the visually prominent bold text "Three Heroes Swear Brotherhood at a Feast in the Peach Garden" has **role=`strong`**, not a heading role. The `structure.headings[]` is empty. The full-page screenshot shows the same structure — nav list followed by the `<strong>` text and body copy. No `h1–h6` or `role=heading` element exists over the main content.

```json
{
  "verdict": "PARTIAL",
  "confidence": "high",
  "summary": "The page's main content section has a visually heading-styled element, but it is marked up as <strong> (role=strong) rather than a real heading — this programmatic gap is owned by 1.3.1, not 2.4.10.",
  "reasoning": "structure.headings[] is empty and live AX inspection confirms the bold title 'Three Heroes Swear Brotherhood at a Feast in the Peach Garden' resolves to role=strong (not a heading); the rubric explicitly defers this scenario — a visual heading that is not a real heading element — to 1.3.1 info-relationships.",
  "evidenceRefs": [
    "structure.headings=[] (no heading elements detected)",
    "AX node at (~340,81): role=strong, headingLevel=null",
    "Full-page screenshot: single visible content block with bold <strong> text, no h1–h6 present"
  ]
}
```


================= FIXTURE HTML (047fe0/7505d097f7d5) =================
```html
<!DOCTYPE html>
<html>
	<head>
		<title>The Three Kingdoms, Chapter 1</title>
	</head>
	<body>
		<nav id="chapters-navigation">
			<ol>
				<li><a>Chapter 1</a></li>
				<li><a href="../_assets/WAI/content-assets/wcag-act-rules/test-assets/bypass-blocks-cf77f2/chapter2.html">Chapter 2</a></li>
			</ol>
		</nav>

		<div id="main">
			<strong style="font-size: 18pt">Three Heroes Swear Brotherhood at a Feast in the Peach Garden</strong>
			<p>
				Unity succeeds division and division follows unity. One is bound to be replaced by the other after a long span
				of time.
			</p>
		</div>
	</body>
</html>
```
