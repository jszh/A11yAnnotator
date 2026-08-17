CASE INDEX: 35
TESTCASE_ID: 929079705b17
KIND (authoritative, from run4 GT+outcome): FN
SC: 2.4.10   RULE: 047fe0   Document has heading for non-repeated content

This file is SELF-CONTAINED. Below: (1) the harness evidence slice — GT, LLM in-scope verdicts+summaries, off-target barriers, and the model FULL reasoning trace (THINK/SAY/TOOL_CALL/TOOL_RESULT); (2) the fixture HTML inlined.

================= EVIDENCE SLICE =================
# RCA case 929079705b17  [FN]
- rule: 047fe0  Document has heading for non-repeated content
- sc(GT-scored): 2.4.10   expected(GT): failed   outcome: missedAgree   polarity: recall
- v3Barrier(deterministic): false   inScopeAutoPartial: 0   inScopeObligations: 1
- fixture: eval/checker-comparison/act-subset/pages/047fe0/929079705b1789667853e023b818eb4101630700.html

## in-scope verdicts
- RUBRIC 2.4.10 LIKELY_OK conf=high [section-headings-v0] xpath=/page-level::section-headings
  summary: The main content section is visibly introduced by an h1 heading rendered in the viewport, satisfying 2.4.10's structural-organization requirement.

## model reasoning trace (per subject)

### subject sc=2.4.10 xpath=/page-level::section-headings rubric=section-headings-v0 verdict=NOT REPRODUCED
THINK: Looking at the evidence:

1. The viewport shows an h1 heading "Three Heroes Swear Brotherhood at a Feast in the Peach Garden" visibly introducing the main content.
2. The deterministic signal shows this h1 has `ariaHidden:true` and `offscreen:false`.
3. The heading is visually present (visible in viewport) but has `aria-hidden="true"`.

Wait - the rubric says 2.4.10 is about whether sections are *organized* by headings for sighted users. The h1 is visually present and introduces the content. 

The `aria-hidden` attribute creates issues for other success criteria, but for 2.4.10 specifically—which evaluates whether main content is visually introduced by a heading—the h1 is doing its job. It's right there in the viewport, marking the start of the main content section for sighted users, even if it's hidden from assistive technology.

Looking at the page structure: there's a navigation list at the top, then the h1 introducing the main content, followed by paragraph text. This appears to be a chapter page, and the heading clearly organizes the visual layout. The verdict is NOT REPRODUCED—the main content is introduced by a visible heading, so there's no failure under 2.4.10.
SAY: ```json
{
  "verdict": "NOT REPRODUCED",
  "confidence": "high",
  "summary": "The main content section is visibly introduced by an h1 heading rendered in the viewport, satisfying 2.4.10's structural-organization requirement.",
  "reasoning": "The deterministic signal confirms one h1 ('Three Heroes Swear Brotherhood at a Feast in the Peach Garden') with offscreen:false, and the viewport screenshot shows it rendering visually above the prose paragraph — the sole distinct content section is headed; aria-hidden:true on that element is a concern for other SCs (1.3.1/4.1.2) but does not affect 2.4.10's visual-organization assessment.",
  "evidenceRefs": [
    "structure.headings[0]: tag=h1, offscreen=false, text='Three Heroes Swear Brotherhood at a Feast in the Peach Garden'",
    "viewport screenshot: h1 visually precedes the paragraph 'Unity succeeds division…'",
    "No additional content sections visible without an introducing heading"
  ]
}
```


================= FIXTURE HTML (047fe0/929079705b17) =================
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
