CASE INDEX: 20
TESTCASE_ID: bf47c65f2854
KIND (authoritative, from run4 GT+outcome): FN
SC: 1.4.3   RULE: afw4f7   Text has minimum contrast

This file is SELF-CONTAINED. Below: (1) the harness evidence slice — GT, LLM in-scope verdicts+summaries, off-target barriers, and the model FULL reasoning trace (THINK/SAY/TOOL_CALL/TOOL_RESULT); (2) the fixture HTML inlined.

================= EVIDENCE SLICE =================
# RCA case bf47c65f2854  [FN]
- rule: afw4f7  Text has minimum contrast
- sc(GT-scored): 1.4.3   expected(GT): failed   outcome: missedAgree   polarity: recall
- v3Barrier(deterministic): false   inScopeAutoPartial: 0   inScopeObligations: 1
- fixture: eval/checker-comparison/act-subset/pages/afw4f7/bf47c65f2854b6ac100a6f700d354b243b069231.html

## in-scope verdicts
- RUBRIC 1.4.3 LIKELY_OK conf=high [contrast-over-complex-backdrop-v0] xpath=/html/body/span[1]
  summary: The text 'Hello world' is clearly and consistently readable across its entire run against its backdrop.

## model reasoning trace (per subject)

### subject sc=1.4.3 xpath=/html/body/span[1] rubric=contrast-over-complex-backdrop-v0 verdict=NOT REPRODUCED
THINK: Looking at the crops provided, I can see "Hello world" text. The element crop shows dark text on a light/white background. The text appears clearly readable with good contrast between the dark text and the light background.

The surrounding region also shows "Hello world" with what appears to be a dark highlight/selection on "world" but the text is still readable.

The text appears to be dark colored on a light background, and it's clearly legible. There's no complex backdrop like a gradient, photo, or pattern that would make it difficult to read.

Wait, let me look more carefully. The crops show "Hello world" - in the first crop the text appears dark on a very light/white background. 

In the second crop, "world" seems to have a darker background behind it while "Hello" sits on the lighter background. Both portions remain readable though. Looking at the surrounding region image, "world" might have a dark background box, but the text is still legible. The backdrop appears mostly uniform or light with possibly a selection highlight, so this should be NOT REPRODUCED. But the deterministic runner flagged `computable: false` because the backdrop couldn't be reduced to two flat colors. Let me reconsider what I'm seeing in these crops.

The element-crop shows "Hello world" with dark text on a light gray or white background. In the surrounding region crop, "world" appears to have a dark background behind it, which suggests there might be some non-uniform backdrop. The text remains clearly legible in both crops though. Even with background variation, the text is readable throughout, so I'm confident this is NOT REPRODUCED.
SAY: Looking at both the element-crop and surrounding-region crops, I can clearly read "Hello world" in dark text against a light/white background. The text is sharp and legible across its entire run — there is no blending, disappearing, or ambiguous region where the glyphs merge into the backdrop. Even in the surrounding-region crop where "world" appears over a slightly darker box/highlight, the text remains fully distinguishable.

```json
{
  "verdict": "NOT REPRODUCED",
  "confidence": "high",
  "summary": "The text 'Hello world' is clearly and consistently readable across its entire run against its backdrop.",
  "reasoning": "Both the element-crop and surrounding-region crops show dark glyphs on a uniformly light background with strong luminance separation throughout; no passage of the text blends into or is obscured by the backdrop.",
  "evidenceRefs": ["element-crop", "surrounding-region"]
}
```


================= FIXTURE HTML (afw4f7/bf47c65f2854) =================
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
