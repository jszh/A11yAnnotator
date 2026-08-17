CASE INDEX: 5
TESTCASE_ID: bf47c65f2854
KIND: FN   SC: 1.4.3   RULE: afw4f7   Text has minimum contrast
run5 outcome: missedAgree   v3Barrier(deterministic): false   inScopeAutoPartial: 0   inScopeObligations: 1

## LLM in-scope verdicts (run5, post-fix)
- RUBRIC 1.4.3 LIKELY_OK [contrast-over-complex-backdrop-v0] xpath=/html/body/span[1]
  The text 'Hello world' is clearly readable in dark glyphs against a uniformly light/white background across its entire run.

## model reasoning trace (run5)

### subject sc=1.4.3 xpath=/html/body/span[1] rubric=contrast-over-complex-backdrop-v0 verdict=NOT REPRODUCED
THINK: Looking at the crops provided, I can see "Hello world" text on what appears to be a light/white background. The text appears to be dark colored on a light background. Let me analyze the readability.

From the element-crop and surrounding-region images, the text "Hello world" appears clearly readable - dark text on a light/white background. There doesn't appear to be any complex backdrop that would make the text difficult to read.

The deterministic signal says the backdrop couldn't be reduced to
SAY: ```json
{
  "verdict": "NOT REPRODUCED",
  "confidence": "high",
  "summary": "The text 'Hello world' is clearly readable in dark glyphs against a uniformly light/white background across its entire run.",
  "reasoning": "Both the element-crop and surrounding-region show dark text rendered against a consistently light, near-white backdrop with no gradients, images, or patterned overlays that would 

## FIXTURE HTML (afw4f7/bf47c65f2854)
```html
<!DOCTYPE html>
<html lang="en">
<head>
	<title>Failed Example 7</title>
</head>
<body>
	<style>
		#backgroundSplit {
			color: rgba(90, 90, 90, 0.8);
			background-position: top 0 left 0;
			background-image: linear-gradient(90deg, transparent, transparent 3.3em, black 3.3em, black 6em);
			padding: 0 1em;
		}
	</style>
	<span id="backgroundSplit">
		Hello world
	</span>
</body>
</html>
```
