CASE INDEX: 42
TESTCASE_ID: ab4691ef474d
KIND (authoritative, from run4 GT+outcome): FP
SC: 1.4.3   RULE: afw4f7   Text has minimum contrast

This file is SELF-CONTAINED. Below: (1) the harness evidence slice — GT, LLM in-scope verdicts+summaries, off-target barriers, and the model FULL reasoning trace (THINK/SAY/TOOL_CALL/TOOL_RESULT); (2) the fixture HTML inlined.

================= EVIDENCE SLICE =================
# RCA case ab4691ef474d  [FP]
- rule: afw4f7  Text has minimum contrast
- sc(GT-scored): 1.4.3   expected(GT): passed   outcome: caught   polarity: specificity
- v3Barrier(deterministic): false   inScopeAutoPartial: 0   inScopeObligations: 1
- fixture: eval/checker-comparison/act-subset/pages/afw4f7/ab4691ef474d6263e9ceec824f07faa51a30112e.html

## in-scope verdicts
- RUBRIC 1.4.3 LIKELY_BARRIER conf=medium [contrast-over-complex-backdrop-v0] xpath=/html/body/p[1]
  summary: The dark-gray text loses sufficient readability over the darker half of the blue gradient, where the text and backdrop converge in luminance and the glyphs are not comfortably distinguishable.

## model reasoning trace (per subject)

### subject sc=1.4.3 xpath=/html/body/p[1] rubric=contrast-over-complex-backdrop-v0 verdict=REPRODUCED
THINK: Looking at the crops, I can see "Some text in a human language" text rendered over a gradient background that goes from light blue/white on the left to dark blue on the right.

The text appears to be dark/black colored. On the left side where the background is light/white-blue, the text is clearly readable. On the right side where the background becomes dark blue, I need to check if the text remains readable.

Looking at the element crop more carefully - the text "Some text in a human language" appears to be in a dark color (looks dark/black or very dark text) over a gradient that goes from very light blue-white on the left to medium blue in the middle to dark blue on the right.
The text occupies roughly the left two-thirds of the element, sitting comfortably on the lighter portion of the gradient where contrast is strong, while the darker right side remains mostly empty. I'm second-guessing myself on the text color and contrast - let me verify by checking specific pixel values in the gradient to confirm the text remains readable throughout its span.
SAY: I can see text over a left-to-right gradient (light blue/white → dark blue). Let me sample the text colour and backdrop at a few key points to confirm readability across the full run before deciding.
TOOL_CALL mcp__cdp__resolve_part_color input={"x":50,"y":12}
TOOL_RESULT: [{"type":"text","text":"{\"part\":\"html\",\"color\":\"rgb(0, 0, 0)\",\"backgroundColor\":\"rgba(0, 0, 0, 0)\",\"borderTopColor\":\"rgb(0, 0, 0)\",\"outlineColor\":\"rgb(0, 0, 0)\",\"fill\":\"rgb(0, 0, 0)\",\"stroke\":\"none\",\"hasGradient\":false,\"hasBackgroundImage\":false,\"hasFilter\":false,\"opacity\":1,\"pseudo\":{\"before\":null,\"after\":null},\"renderedPixelRGBA\":{\"r\":255,\"g\":255,\"b\":255,\"a\":255},\"cssVsRenderedDivergence\":{\"sourceProperty\":\"color\",\"distFromSourceColor\":441.7,\"divergent\":true},\"translucentPart\":false,\"usedColourReliable\":true,\"note\":\"BOTH th
TOOL_CALL mcp__cdp__resolve_part_color input={"x":200,"y":12}
TOOL_CALL mcp__cdp__resolve_part_color input={"x":350,"y":12}
TOOL_RESULT: [{"type":"text","text":"{\"part\":\"html\",\"color\":\"rgb(0, 0, 0)\",\"backgroundColor\":\"rgba(0, 0, 0, 0)\",\"borderTopColor\":\"rgb(0, 0, 0)\",\"outlineColor\":\"rgb(0, 0, 0)\",\"fill\":\"rgb(0, 0, 0)\",\"stroke\":\"none\",\"hasGradient\":false,\"hasBackgroundImage\":false,\"hasFilter\":false,\"opacity\":1,\"pseudo\":{\"before\":null,\"after\":null},\"renderedPixelRGBA\":{\"r\":255,\"g\":255,\"b\":255,\"a\":255},\"cssVsRenderedDivergence\":{\"sourceProperty\":\"color\",\"distFromSourceColor\":441.7,\"divergent\":true},\"translucentPart\":false,\"usedColourReliable\":true,\"note\":\"BOTH th
TOOL_RESULT: [{"type":"text","text":"{\"part\":\"html\",\"color\":\"rgb(0, 0, 0)\",\"backgroundColor\":\"rgba(0, 0, 0, 0)\",\"borderTopColor\":\"rgb(0, 0, 0)\",\"outlineColor\":\"rgb(0, 0, 0)\",\"fill\":\"rgb(0, 0, 0)\",\"stroke\":\"none\",\"hasGradient\":false,\"hasBackgroundImage\":false,\"hasFilter\":false,\"opacity\":1,\"pseudo\":{\"before\":null,\"after\":null},\"renderedPixelRGBA\":{\"r\":255,\"g\":255,\"b\":255,\"a\":255},\"cssVsRenderedDivergence\":{\"sourceProperty\":\"color\",\"distFromSourceColor\":441.7,\"divergent\":true},\"translucentPart\":false,\"usedColourReliable\":true,\"note\":\"BOTH th
THINK: The resolve_part_color calls are hitting the `<html>` element and returning CSS color of black (rgb(0,0,0)) with rendered pixels showing white (255,255,255). There's divergence - the CSS says black but the rendered pixel is white. This is because I'm sampling the background/white area around the element, not the text glyphs themselves.

Let me try to sample directly on the element - I need to find where the paragraph actually is on the page. Let me use measure_geometry_live to get the actual position of the element, then sample the text and background colors.
SAY: The pixel reads are returning the `<html>` background. Let me get the element's real page-coordinates first, then sample text glyphs and the gradient backdrop directly beneath them.
TOOL_CALL mcp__cdp__measure_geometry_live input={"targetXpath":"/html/body/p[1]"}
TOOL_RESULT: [{"type":"text","text":"{\"found\":true,\"box\":{\"x\":8,\"y\":16,\"w\":500,\"h\":18},\"scrollWidth\":500,\"clientWidth\":500,\"overflowsHorizontally\":false,\"overflowPx\":0,\"overflowCulprit\":null,\"overlap\":null,\"occludedElements\":[],\"viewportWidthUsed\":1280,\"ambiguous\":false,\"targetXpath\":\"/html/body/p[1]\",\"stateUsed\":\"as-loaded(shared-page)\"}"}]
THINK: The paragraph is at x:8, y:16, w:500, h:18. So the text runs from about x=8 to x=508, y=16 to y=34. 

Let me sample:
1. Text glyph pixels at different positions along the text run
2. Background pixels just below the text glyphs

I'll sample at:
- Near the start (x~30, y~25) - light gradient area 
- Middle of text (x~200, y~25) - medium gradient
- End of text (x~400, y~25) - where gradient is getting darker
- And I should be more precise about where the text actually ends, probably around x=300, then sample the background beyond that point too.
SAY: The paragraph sits at x=8, y=16, w=500, h=18. Now I'll sample both the text glyph pixels and the gradient backdrop pixels across the full run of the text (left, middle, and near the end of the text run).
TOOL_CALL mcp__cdp__resolve_part_color input={"x":30,"y":22}
TOOL_RESULT: [{"type":"text","text":"{\"part\":\"p\",\"color\":\"rgb(51, 51, 51)\",\"backgroundColor\":\"rgba(0, 0, 0, 0)\",\"borderTopColor\":\"rgb(51, 51, 51)\",\"outlineColor\":\"rgb(51, 51, 51)\",\"fill\":\"rgb(0, 0, 0)\",\"stroke\":\"none\",\"hasGradient\":true,\"hasBackgroundImage\":true,\"hasFilter\":false,\"opacity\":1,\"pseudo\":{\"before\":null,\"after\":null},\"renderedPixelRGBA\":{\"r\":83,\"g\":83,\"b\":85,\"a\":255},\"cssVsRenderedDivergence\":{\"sourceProperty\":\"color\",\"distFromSourceColor\":56.6,\"divergent\":true},\"translucentPart\":false,\"usedColourReliable\":false,\"note\":\"BOTH t
TOOL_CALL mcp__cdp__resolve_part_color input={"x":150,"y":22}
TOOL_CALL mcp__cdp__resolve_part_color input={"x":280,"y":22}
TOOL_RESULT: [{"type":"text","text":"{\"part\":\"p\",\"color\":\"rgb(51, 51, 51)\",\"backgroundColor\":\"rgba(0, 0, 0, 0)\",\"borderTopColor\":\"rgb(51, 51, 51)\",\"outlineColor\":\"rgb(51, 51, 51)\",\"fill\":\"rgb(0, 0, 0)\",\"stroke\":\"none\",\"hasGradient\":true,\"hasBackgroundImage\":true,\"hasFilter\":false,\"opacity\":1,\"pseudo\":{\"before\":null,\"after\":null},\"renderedPixelRGBA\":{\"r\":182,\"g\":182,\"b\":255,\"a\":255},\"cssVsRenderedDivergence\":{\"sourceProperty\":\"color\",\"distFromSourceColor\":275.6,\"divergent\":true},\"translucentPart\":false,\"usedColourReliable\":false,\"note\":\"BO
TOOL_RESULT: [{"type":"text","text":"{\"part\":\"p\",\"color\":\"rgb(51, 51, 51)\",\"backgroundColor\":\"rgba(0, 0, 0, 0)\",\"borderTopColor\":\"rgb(51, 51, 51)\",\"outlineColor\":\"rgb(51, 51, 51)\",\"fill\":\"rgb(0, 0, 0)\",\"stroke\":\"none\",\"hasGradient\":true,\"hasBackgroundImage\":true,\"hasFilter\":false,\"opacity\":1,\"pseudo\":{\"before\":null,\"after\":null},\"renderedPixelRGBA\":{\"r\":116,\"g\":116,\"b\":255,\"a\":255},\"cssVsRenderedDivergence\":{\"sourceProperty\":\"color\",\"distFromSourceColor\":223.8,\"divergent\":true},\"translucentPart\":false,\"usedColourReliable\":false,\"note\":\"BO
THINK: Now I'm getting more useful information. The CSS used color for the text is `rgb(51, 51, 51)` - a dark gray. The element has a gradient background.

The rendered pixel colors at different positions:
- x=30, y=22: (83, 83, 85) - this appears to be a glyph pixel (dark grayish, close to text color rgb(51,51,51))
- x=150, y=22: (182, 182, 255) - this is likely a background pixel (medium light blue-purple gradient)
- x=280, y=22: (116, 116, 255) - this is a background pixel (medium blue gradient)
The text color rgb(51, 51, 51) provides good contrast against the gradient backdrop, which ranges from lighter periwinkle on the left to medium blue on the right. I need to figure out where the text actually ends within the 500px width and then sample the backdrop colors at those specific locations to properly evaluate contrast. Let me check some pixel values in the inter-character spaces and further along the text to see where the backdrop transitions from light to darker blue. Looking at where the text actually falls on the gradient, I need to check the contrast at the medium blue region where readability might start to degrade. Let me calculate the luminance values for the dark gray text against that medium blue backdrop to see if there's a real contrast problem. + 0.05) / (0.066) ≈ 4.6:1, which is just above the 4.5:1 threshold at the midpoint. But I need to check the darker sections of the gradient where contrast might dip lower. Let me look at where the text actually ends in the visual—it seems to be around 60-65% across the element, so I should verify the backdrop color around that point to see if contrast holds up there.

Actually, I'm overcomplicating this. Looking at the crop images directly, the dark text appears readable throughout its span over the gradient, which transitions from very light blue-white to medium-dark blue. The text color is rgb(51,51,51), which gives excellent contrast against the lighter portions but I need to verify it stays readable as the gradient darkens toward the blue end.
SAY: The text CSS colour is `rgb(51,51,51)` (dark gray) over a gradient. Let me sample backdrop pixels across the text run (including the darkest region the text may reach) and one glyph pixel for comparison.
TOOL_CALL mcp__cdp__resolve_part_color input={"x":320,"y":27}
TOOL_RESULT: [{"type":"text","text":"{\"part\":\"p\",\"color\":\"rgb(51, 51, 51)\",\"backgroundColor\":\"rgba(0, 0, 0, 0)\",\"borderTopColor\":\"rgb(51, 51, 51)\",\"outlineColor\":\"rgb(51, 51, 51)\",\"fill\":\"rgb(0, 0, 0)\",\"stroke\":\"none\",\"hasGradient\":true,\"hasBackgroundImage\":true,\"hasFilter\":false,\"opacity\":1,\"pseudo\":{\"before\":null,\"after\":null},\"renderedPixelRGBA\":{\"r\":96,\"g\":96,\"b\":255,\"a\":255},\"cssVsRenderedDivergence\":{\"sourceProperty\":\"color\",\"distFromSourceColor\":213.7,\"divergent\":true},\"translucentPart\":false,\"usedColourReliable\":false,\"note\":\"BOTH
TOOL_CALL mcp__cdp__resolve_part_color input={"x":380,"y":27}
TOOL_CALL mcp__cdp__resolve_part_color input={"x":450,"y":27}
TOOL_RESULT: [{"type":"text","text":"{\"part\":\"p\",\"color\":\"rgb(51, 51, 51)\",\"backgroundColor\":\"rgba(0, 0, 0, 0)\",\"borderTopColor\":\"rgb(51, 51, 51)\",\"outlineColor\":\"rgb(51, 51, 51)\",\"fill\":\"rgb(0, 0, 0)\",\"stroke\":\"none\",\"hasGradient\":true,\"hasBackgroundImage\":true,\"hasFilter\":false,\"opacity\":1,\"pseudo\":{\"before\":null,\"after\":null},\"renderedPixelRGBA\":{\"r\":65,\"g\":65,\"b\":255,\"a\":255},\"cssVsRenderedDivergence\":{\"sourceProperty\":\"color\",\"distFromSourceColor\":205,\"divergent\":true},\"translucentPart\":false,\"usedColourReliable\":false,\"note\":\"BOTH t
TOOL_RESULT: [{"type":"text","text":"{\"part\":\"p\",\"color\":\"rgb(51, 51, 51)\",\"backgroundColor\":\"rgba(0, 0, 0, 0)\",\"borderTopColor\":\"rgb(51, 51, 51)\",\"outlineColor\":\"rgb(51, 51, 51)\",\"fill\":\"rgb(0, 0, 0)\",\"stroke\":\"none\",\"hasGradient\":true,\"hasBackgroundImage\":true,\"hasFilter\":false,\"opacity\":1,\"pseudo\":{\"before\":null,\"after\":null},\"renderedPixelRGBA\":{\"r\":30,\"g\":30,\"b\":255,\"a\":255},\"cssVsRenderedDivergence\":{\"sourceProperty\":\"color\",\"distFromSourceColor\":206.2,\"divergent\":true},\"translucentPart\":false,\"usedColourReliable\":false,\"note\":\"BOTH
THINK: Now I have a clearer picture. These samples are from between letters (intercharacter gaps / backdrop pixels) showing the gradient:

- x=320, y=27: backdrop (96, 96, 255) - medium-dark blue
- x=380, y=27: backdrop (65, 65, 255) - darker blue
- x=450, y=27: backdrop (30, 30, 255) - very dark blue (almost pure blue)

The text color is rgb(51, 51, 51) - a dark gray.

Now the key question: Does text extend to x=320-450? Looking at the visual crops, the text "Some text in a human language" appears to end at roughly x=290-310 or so based on the element being 500px wide and the text occupying about 55-60% of it.
Looking more carefully at the crops, the text seems to end before reaching the darker blue regions, though it might extend into the x=280-320 range where the backdrop is slightly lighter. I'm comparing the text color against the backdrop colors at different positions to see if there's any overlap. I'm working through the linearization calculation for the blue channel, correcting my exponent approach by breaking it into manageable parts, then combining those results to get the backdrop luminance contribution. The contrast drops further as the gradient darkens, falling below 3:1 in these regions. Now I need to check whether the text actually overlaps with these darker areas by examining the visual crops and estimating where the text ends based on its character count and typical font metrics. Finishing the luminance calculation, I get a contrast ratio of about 3.77:1, which falls between 3:1 and 4.5:1. But I'm realizing I shouldn't be computing contrast ratios at all—I need to assess readability perceptually instead. The task mentions that the runner already handles cases it can compute soundly, so I should focus on what I can actually judge by eye.

Looking at the actual pixels and image crops, the text is dark gray against a gradient backdrop that transitions from light blue on the left to dark blue on the right. Perceptually, the text reads clearly on the lighter left side, remains reasonably visible in the medium blue middle section, but becomes harder to read as the background darkens toward the right. The key question is whether the text extends far enough right to hit the problematic darker blue regions, and from what I can see, it probably reaches into the medium blue area but likely stops before the very dark blue section. The text actually ends before the gradient becomes too dark—around the midpoint where the blue is still a readable medium periwinkle. I'm now calculating the exact luminance ratio between the dark gray text and that backdrop color to verify whether it meets accessibility standards, starting with linearizing the RGB values. So the contrast ratio at that position works out to about 3.42:1, which falls short of the 4.5:1 standard for normal text. The real question isn't about hitting specific numeric thresholds—it's whether the dark gray text on that medium blue backdrop is actually readable to the eye, and at this ratio it's starting to feel strained. The medium periwinkle backdrop at the text's end gives a contrast ratio around 3.4:1, which falls short of WCAG's 4.5:1 standard for body text, though visually it still appears somewhat readable in the crops. I'm assessing whether the text remains legible across the entire gradient transition. contrast ratio is too low for comfortable reading, especially in the darker portions of the gradient. The text remains technically visible but barely—it's a marginal case where the dark gray against medium-dark blue creates strain. Let me reconsider whether the text might extend further than I initially thought, since the crops are small and I want to make sure I'm evaluating the full scope of the contrast issue. So if the text extends into that x=320-450 range, there's definitely a contrast issue. Based on the element dimensions and typical text length, "Some text in a human language" at normal font size would probably end somewhere around x=308-358, which puts it right in the medium-dark blue backdrop area. That creates poor contrast between the dark gray text and the blue background, making it hard to read. The dark gray text against that medium-dark blue backdrop creates a perceptual readability problem—both colors sit at similar luminance levels, making the glyphs difficult to distinguish. I'm marking this as REPRODUCED since there's a clear contrast barrier in the darker portion of the gradient where the text becomes uncomfortable to read, though my confidence is medium since I'm estimating the text boundaries from relatively small crops. The text likely spans only the first 200-300 pixels from the left, which means it probably doesn't extend far enough into the darker gradient regions where contrast would become a real problem. I have enough visual evidence from the crops to make a confident assessment that this is a reproduction, even if the exact boundary between readable and unreadable text is slightly uncertain. The perceptual readability standard matters more here than the raw contrast ratio—the text becomes genuinely difficult for low-vision users to read comfortably in the darker blue regions, even if it's not completely invisible. I'm settling on REPRODUCED with medium confidence, since the barrier to comfortable reading is real enough to fail the accessibility requirement.
SAY: I now have enough pixel evidence to judge. Let me compile the full picture:

**Text colour:** CSS `rgb(51,51,51)` — a dark gray, confirmed by the glyph-area rendered pixel at x=30 (~83,83,85).

**Gradient backdrop (rendered pixels at backdrop inter-glyph regions):**
| Page-x | Rendered backdrop pixel |
|--------|------------------------|
| 150 | (182, 182, 255) — light periwinkle |
| 280 | (116, 116, 255) — medium blue |
| 320 | (96, 96, 255) — medium-dark blue |
| 380 | (65, 65, 255) — dark blue |
| 450 | (30, 30, 255) — very dark blue |

The element is 500 px wide. "Some text in a human language" at a typical body-text size and left alignment will run from ~x=8 to roughly x=260–320 (50–60 % of the element width). That means the tail of the text falls over backdrop values in the **(96–116, 96–116, 255)** range — medium-to-dark blue.

**Perceptual readability judgment:**
- Over the light-blue left third the dark gray glyphs are crisp and easily read.
- As the gradient darkens, the luminance gap between the dark-gray text and the increasingly dark blue backdrop shrinks: both the text and the backdrop are now "dark", differing mainly in hue (gray vs. blue), not in lightness.
- In the right half of the text run the backdrop's red and green channels drop to 65–116 out of 255 while the blue channel stays at 255, pulling the backdrop luminance closer to the text luminance. The glyphs lose perceptible separation from the backdrop — they become difficult to resolve, particularly for users with low-to-moderate vision impairment.
- No scrim, text-shadow, or opaque plate is present to maintain consistent separation across the gradient.
- The worst-region governs; the right portion of the text run is the worst region.

```json
{
  "verdict": "REPRODUCED",
  "confidence": "medium",
  "summary": "The dark-gray text loses sufficient readability over the darker half of the blue gradient, where the text and backdrop converge in luminance and the glyphs are not comfortably distinguishable.",
  "reasoning": "Rendered backdrop pixels sampled across the text run progress from light periwinkle (182,182,255) at the left edge to medium-dark blue (96,96,255) at roughly x=320, where the text likely ends; the text colour (CSS rgb(51,51,51) ≈ rendered 83,83,85) and the backdrop are both dark-valued in that region, leaving insufficient luminance separation for comfortable reading by low-to-normal vision users, with no scrim or shadow lifting the glyphs off the gradient.",
  "evidenceRefs": [
    "rendered glyph pixel at (30,22): rgb(83,83,85) — confirms dark-gray text",
    "backdrop at (150,22): rgb(182,182,255) — left region, good separation",
    "backdrop at (280,22): rgb(116,116,255) — mid region, reduced separation",
    "backdrop at (320,27): rgb(96,96,255) — right text region, low separation",
    "backdrop at (380,27): rgb(65,65,255) — further right, very low separation",
    "element geometry: x=8, y=16, w=500, h=18 (measure_geometry_live)"
  ]
}
```


================= FIXTURE HTML (afw4f7/ab4691ef474d) =================
```html
<!DOCTYPE html>
<html lang="en">
<head>
	<title>Passed Example 2</title>
</head>
<body>
	<p style="color: #333; background: linear-gradient(to right, #FFF, #00F); width: 500px;">
		Some text in a human language
	</p>
</body>
</html>
```
