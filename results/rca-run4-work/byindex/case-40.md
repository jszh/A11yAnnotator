CASE INDEX: 40
TESTCASE_ID: 4f112d270766
KIND (authoritative, from run4 GT+outcome): FP
SC: 2.4.10   RULE: 047fe0   Document has heading for non-repeated content

This file is SELF-CONTAINED. Below: (1) the harness evidence slice — GT, LLM in-scope verdicts+summaries, off-target barriers, and the model FULL reasoning trace (THINK/SAY/TOOL_CALL/TOOL_RESULT); (2) the fixture HTML inlined.

================= EVIDENCE SLICE =================
# RCA case 4f112d270766  [FP]
- rule: 047fe0  Document has heading for non-repeated content
- sc(GT-scored): 2.4.10   expected(GT): passed   outcome: caught   polarity: specificity
- v3Barrier(deterministic): false   inScopeAutoPartial: 0   inScopeObligations: 1
- fixture: eval/checker-comparison/act-subset/pages/047fe0/4f112d2707661d579bb0e364ef6241ea6217d3e8.html

## in-scope verdicts
- RUBRIC 2.4.10 LIKELY_BARRIER conf=high [section-headings-v0] xpath=/page-level::section-headings
  summary: The page presents a named chapter of substantive literary content but contains zero heading elements — the main content block has no heading to introduce it, violating 2.4.10.

## model reasoning trace (per subject)

### subject sc=2.4.10 xpath=/page-level::section-headings rubric=section-headings-v0 verdict=REPRODUCED
THINK: Let me analyze the evidence:

1. Page title: "The Three Kingdoms, Chapter 1"
2. Structure signals: `headings: []` — zero headings found
3. Viewport shows: prose text starting directly with "Unity succeeds division and division follows unity. One is bound to be replaced by the other after a long span of time."
4. No landmarks, no headings in the structure

The page appears to be a literary text (Chapter 1 of Three Kingdoms). The title suggests this is a chapter page. The content is substantive prose with no headings introducing sections.

However, I need to consider: is this a single-purpose page where no section headings are needed? The page title is "The Three Kingdoms, Chapter 1" — this is a chapter of a book. 

I'm seeing only a viewport snippet of what could be a much longer chapter with multiple narrative sections. I should capture the full page to understand the content's scope and whether distinct sections exist that would warrant headings.
TOOL_CALL mcp__cdp__capture_full_page input={}
TOOL_RESULT: [{"type":"text","text":"{\"screenshot\":\"<base64 18692 chars elided>\",\"fullPage\":true,\"pageSize\":{\"w\":1280,\"h\":900},\"viewport\":{\"w\":1280,\"h\":900},\"target\":null,\"note\":\"the WHOLE scrollable document (below the fold included). A target box is in PAGE coordinates (origin = document top); a NEGATIVE y or offDocument:true means the element is positioned OUTSIDE the document (e.g. top:-9999px → visually hidden) and is NOT in the captured pixels. Use to confirm an off-viewport element exists and judge WHERE it sits relative to surrounding content — never infer a barrier from posi
THINK: The full page screenshot shows the same content as the viewport - just a single line of text: "Unity succeeds division and division follows unity. One is bound to be replaced by the other after a long span of time."

The deterministic signals confirm: `headings: []` - zero headings.

The page title is "The Three Kingdoms, Chapter 1" and the content appears to be a chapter/section of a literary work. This is substantive prose content. There are no headings at all in the heading tree.

However, I need to consider whether this is a "short single-purpose page" that may legitimately need no section headings. This appears to be just a snippet or very minimal page with only one line of visible content. 

The page title suggests this should be a chapter from a famous historical novel, which would normally contain substantial narrative content, but the viewport and full page screenshot both show only that single sentence. This could indicate either an extremely short page or a rendering issue.

Looking at the rubric more carefully, the key question is whether there are distinct sections within the page that lack headings. If this is just a single continuous narrative chapter with no sub-sections, it might legitimately qualify as N/A rather than a missing heading issue.

But there's a structural problem here: the page is titled "The Three Kingdoms, Chapter 1" yet has no visible heading on the page itself—the content just starts directly with body text. Even for a minimal single-purpose page, a chapter should arguably have at least a page-level heading introducing it. The question becomes whether this minimal page with essentially one sentence of content genuinely needs no headings, or if the absence of any heading structure is a real accessibility gap. This is a content page that should have a heading introducing the chapter, and the absence of one is a clear accessibility violation. I'm marking this as REPRODUCED.
SAY: The full-page screenshot confirms the page is 900 px tall (same as viewport) and contains only the one line of prose text. The heading tree from the deterministic signals is empty (`headings: []`), and there are no landmarks. The page is titled "The Three Kingdoms, Chapter 1" — a named chapter of a historical novel — but the content begins immediately with body prose ("Unity succeeds division…") with no heading element introducing it at any level.

```json
{
  "verdict": "REPRODUCED",
  "confidence": "high",
  "summary": "The page presents a named chapter of substantive literary content but contains zero heading elements — the main content block has no heading to introduce it, violating 2.4.10.",
  "reasoning": "The deterministic signal reports `headings: []` (empty), the full-page capture confirms no heading is rendered anywhere on the page, and the prose content begins immediately without any h1–h6 or role=heading element marking the start of this chapter section.",
  "evidenceRefs": [
    "structure.headings = [] (empty — no heading elements present anywhere on the page)",
    "Viewport + capture_full_page: prose text starts directly with no visible heading ('Unity succeeds division and division follows unity…')",
    "Page title: 'The Three Kingdoms, Chapter 1' — a named, substantive content section with no programmatic heading to introduce it"
  ]
}
```


================= FIXTURE HTML (047fe0/4f112d270766) =================
```html
<!DOCTYPE html>
<html>
	<head>
		<title>The Three Kingdoms, Chapter 1</title>
	</head>
	<body>
		<p>
			Unity succeeds division and division follows unity. One is bound to be replaced by the other after a long span of
			time.
		</p>
	</body>
</html>
```
