CASE INDEX: 14
TESTCASE_ID: 929079705b17
KIND: FN   SC: 2.4.10   RULE: 047fe0   Document has heading for non-repeated content
run5 outcome: uncertain   v3Barrier(deterministic): false   inScopeAutoPartial: 1   inScopeObligations: 1

## LLM in-scope verdicts (run5, post-fix)
- RUBRIC 2.4.10 UNCERTAIN [section-headings-v0] xpath=/page-level::section-headings
  The page contains only one substantive content section (a single chapter passage), so the 2.4.10 multi-section precondition is not met and the criterion does not apply.

## model reasoning trace (run5)

### subject sc=2.4.10 xpath=/page-level::section-headings rubric=section-headings-v0 verdict=N/A
THINK: Let me analyze the evidence carefully.

From the deterministic signals:
- There is one h1 heading: "Three Heroes Swear Brotherhood at a Feast in the Peach Garden"
- **`ariaHidden: true`** — this heading is removed from the accessibility tree
- `offscreen: false` — it's visually present

From the viewport screenshot:
- The h1 is visually visible, introducing the chapter content
- Below it is a paragraph of content
- Above it is a small ordered list (Chapter 1, Chapter 2) acting as a TOC/nav

Key 
SAY: I need to check if there's more content below the fold before deciding on the precondition (single vs. multiple sections), and to confirm the h1's placement relative to content.
TOOL mcp__cdp__capture_full_page {"targetXpath":"/html/body/div[1]/h1[1]"}
TOOL_RESULT: [{"type":"text","text":"{\"screenshot\":\"<base64 37844 chars elided>\",\"fullPage\":true,\"pageSize\":{\"w\":1280,\"h\":900},\"viewport\":{\"w\":1280,\"h\":900},\"target\":{\"box\":{\"x\":8,\"y\":73,\"w\":1264,\"h\":37},\"tag\":\"h1\",\"role\":null,\"text\":\"Three Heroes Swear Brotherhood at a Feast in the Peach Garden\",\"inViewport\":true,\"offDocument\":false,\"verticalPositionPct\":8},\"note
THINK: The full page screenshot confirms:
1. The h1 ("Three Heroes Swear Brotherhood at a Feast in the Peach Garden") is at verticalPositionPct: 8, inViewport: true, offDocument: false — so it's visually present
2. The h1's target box shows it's at y=73, which means it's visible in the page

Key finding from signals: `ariaHidden: true` — the h1 is aria-hidden

Now let me assess the structure:
- At the top: an ordered list (TOC) with "Chapter 1" and "Chapter 2"
- Below that: the h1 heading (aria-hidden)
SAY: The full-page screenshot confirms the complete page structure: a short TOC list (Chapter 1 / Chapter 2), then the h1 heading (visually present, `verticalPositionPct: 8`, `offDocument: false`), then a single paragraph of chapter prose — and nothing more below the fold.

**Key facts settled:**
1. The h1 is visually rendered in-place, directly above the chapter text (`inViewport: true`, y=73).
2. How

## FIXTURE HTML (047fe0/929079705b17)
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
			<h1 aria-hidden="true">Three Heroes Swear Brotherhood at a Feast in the Peach Garden</h1>
			<p>
				Unity succeeds division and division follows unity. One is bound to be replaced by the other after a long span
				of time.
			</p>
		</div>
	</body>
</html>
```
