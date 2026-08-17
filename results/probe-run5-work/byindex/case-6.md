CASE INDEX: 6
TESTCASE_ID: 8ad324fd8d3f
KIND: FP   SC: 1.1.1   RULE: 7d6734   SVG element with explicit role has non-empty accessible name
run5 outcome: caught   v3Barrier(deterministic): false   inScopeAutoPartial: 0   inScopeObligations: 1

## LLM in-scope verdicts (run5, post-fix)
- RUBRIC 1.1.1 LIKELY_BARRIER [alt-text-adequacy-v0] xpath=/html/body/svg[1]
  The SVG depicts an informative yellow circle (the subject of the surrounding question 'How many circles are there?') but has an empty accessible name, denying its content to non-sighted users.

## model reasoning trace (run5)

### subject sc=1.1.1 xpath=/html/body/svg[1] rubric=alt-text-adequacy-v0 verdict=REPRODUCED
THINK: Let me analyze this case:

- Element: `/html/body/svg[1]`
- The element is an SVG showing a yellow circle with a green border
- Accessible name: empty (not present)
- Surrounding region shows text "How many circles are there?" with the circle below it

The SVG depicts a yellow circle with a green border. The surrounding context shows the question "How many circles are there?" - this means the circle is informative content that answers/supports the question. It's not decorative.

The accessible n
SAY: ```json
{
  "verdict": "REPRODUCED",
  "confidence": "high",
  "summary": "The SVG depicts an informative yellow circle (the subject of the surrounding question 'How many circles are there?') but has an empty accessible name, denying its content to non-sighted users.",
  "reasoning": "The element-crop shows a clearly rendered yellow circle with a green border; the surrounding-region text 'How many

## FIXTURE HTML (7d6734/8ad324fd8d3f)
```html
<!DOCTYPE html>
<html lang="en">
<head>
	<title>Passed Example 2</title>
</head>
<body>
	<p>How many circles are there?</p>
	<svg xmlns="https://www.w3.org/2000/svg">
		<circle
			role="graphics-symbol"
			cx="50"
			cy="50"
			r="40"
			stroke="green"
			stroke-width="4"
			fill="yellow"
			aria-label="1 circle"
		></circle>
	</svg>
</body>
</html>
```
