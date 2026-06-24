# case-07 — Cloud status dashboard: region health by green/amber/red dot hue only (pure-hue reliance fails)

## Scenario
A cloud platform status console shows a "Region health" matrix where each region/service's state (operational / degraded / major outage) is conveyed ONLY by the hue of an identically-shaped status dot: green, amber, or red. The dots have ample non-text contrast against the dark surface, so this is not a 1.4.11 problem, and the hues are at similar lightness, so no escape hatch applies — meaning depends entirely on perceiving WHICH hue each dot is, so it FAILS. The sibling "Active incidents" list pairs each dot with a TEXT badge and is the passing contrast.

## Attribute tuple
- **content-domain:** developer / SaaS platform status dashboard
- **UI-component / pattern:** status matrix (table of coloured status dots) + incident list
- **host-language construct:** `<span class="dot op|deg|down">` (CSS `background-color` only) in a `<table>`
- **locale / i18n:** en (UTC timestamps, AWS-style region codes)
- **failure-mechanism:** three-state status conveyed by hue alone; dots same shape/size; meaning depends on the specific hue (limb b, three-hue data-viz)

## Developer persona
A platform team built a status page with a colour-coded health matrix ("green = up, amber = degraded, red = down"), the same vocabulary every status page uses. They added a colour legend and figured that was enough. The dots all have strong contrast against the dark background, so contrast tooling stayed green — but the matrix's state is unreadable to a colour-blind operator, who sees a grid of identical dark dots.

## Element / selector carrying the issue
`.dot.op` (`#3fbf63`), `.dot.deg` (`#e0a02e`), `.dot.down` (`#e0503e`) inside the `Region health` table. The dots are the same shape/size with no text, label, or pattern.

## Exact accessibility mechanism (what AT experiences / why it fails)
- Each region/service health value is encoded ONLY in the hue of its status dot. To read the matrix the user must perceive which colour each dot is.
- A user with deuteranopia/protanopia, or viewing in greyscale, sees a grid of identically-shaped dots whose green/amber/red render at similar darkness (green/amber inter-element ~1.04:1) and cannot tell operational from degraded from down.
- The dots have perfectly adequate non-text contrast against the dark surface (4.8-8.3:1), so this is NOT a SC 1.4.11 problem; and the hues are at similar lightness, so no lightness escape hatch applies. Per the Understanding note, when content relies on perceiving a particular colour an additional visual indicator is required regardless of the contrast ratio.
- The legend only re-encodes the colours and does not help. There is no text, shape, or pattern differentiating the matrix states.
- The "Active incidents" list IS the passing sibling: it pairs each dot with a TEXT badge ("MAJOR OUTAGE"/"DEGRADED"), so its meaning no longer depends on colour. Same visual vocabulary, but only the matrix fails — this sharpens the discrimination.

Verified by rendering (the matrix dots are identical circles distinguished only by hue; in greyscale they would be near-indistinguishable) and contrast computation: each dot vs surface 4.8-8.3:1; green/amber inter-element 1.04:1.

## Expected ACT-style outcome
**failed** (SC 1.4.1 — region health conveyed by dot hue alone; meaning depends on perceiving the specific colour, with no non-colour indicator in the matrix).

## Why automated tools miss it
The dots are well-formed elements with sufficient non-text contrast, so axe/WAVE/Lighthouse find no contrast or markup error. No automated rule can tell that a coloured dot ENCODES a status available through no other channel, nor that the legend doesn't rescue it for colour-blind users, nor that the adjacent incidents list (which DOES add text) doesn't cover the matrix. Recognising that hue is the sole carrier of "operational vs degraded vs down" — and that this fails regardless of the dots' contrast — is a semantic/visual judgement.

## Citation
> "However, if content relies on the user's ability to accurately perceive or differentiate a particular color an additional visual indicator will be required regardless of the contrast ratio between those colors."
— wcag-understanding/use-of-color.html (Intent note — pure-colour reliance)

> "When color is used to convey information, indicate an action, prompt a response, or distinguish a visual element, another visual, onscreen method is used to convey the information which does not use color."
— refs/trusted-tester/sc-1.4.1-use-of-color.md (Evaluate Results — PASS if)
