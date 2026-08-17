CASE INDEX: 62
TESTCASE_ID: 228c0a3d7855
KIND (authoritative, from run4 GT+outcome): FP
SC: 2.4.4   RULE: fd3a94   Links with identical accessible names and same context serve equivalent purpose

This file is SELF-CONTAINED. Below: (1) the harness evidence slice — GT, LLM in-scope verdicts+summaries, off-target barriers, and the model FULL reasoning trace (THINK/SAY/TOOL_CALL/TOOL_RESULT); (2) the fixture HTML inlined.

================= EVIDENCE SLICE =================
# RCA case 228c0a3d7855  [FP]
- rule: fd3a94  Links with identical accessible names and same context serve equivalent purpose
- sc(GT-scored): 2.4.4   expected(GT): passed   outcome: caught   polarity: specificity
- v3Barrier(deterministic): false   inScopeAutoPartial: 1   inScopeObligations: 2
- fixture: eval/checker-comparison/act-subset/pages/fd3a94/228c0a3d78557fb48a855d6733d50848a86f0d62.html

## in-scope verdicts
- RUBRIC 2.4.4 LIKELY_BARRIER conf=high [link-purpose-v0] xpath=/html/body/p[1]/a[1]
  summary: Two links sharing the identical accessible name 'ACT rules' resolve to different destinations (act-rules.github.io vs.

## model reasoning trace (per subject)

### subject sc=2.4.4 xpath=/html/body/p[1]/a[1] rubric=link-purpose-v0 verdict=REPRODUCED
THINK: The deterministic signals show that there are 2 links with the name "ACT rules" but with distinctRawHrefs of 2, meaning different raw hrefs. The signal explicitly says I should call resolve_destination to compare settled destinations rather than relying on raw hrefs. Let me do that.
SAY: The deterministic signal flags two same-named "ACT rules" links with **2 distinct raw hrefs** and explicitly instructs me to call `resolve_destination` to confirm whether the settled destinations differ. I'll do that now.
TOOL_CALL mcp__cdp__resolve_destination input={"linkXpaths":["/html/body/p[1]/a[1]","/html/body/p[1]/a[2]"]}
TOOL_RESULT: [{"type":"text","text":"{\"fingerprints\":[{\"linkXpath\":\"/html/body/p[1]/a[1]\",\"refused\":\"cross-origin\",\"destinationOrigin\":\"https://act-rules.github.io\"},{\"linkXpath\":\"/html/body/p[1]/a[2]\",\"refused\":\"cross-origin\",\"destinationOrigin\":\"https://www.w3.org\"}],\"equality\":{\"finalUrlEqual\":false,\"titleEqual\":false,\"h1Equal\":false,\"mainFirstParagraphEqual\":false},\"note\":\"each link resolved to a raw fingerprint (+ redirect timing) + a per-field byte-EQUALITY grid across the resolved set (fd3a94 is a SET test). Equality is string-equality only — the model judges \
THINK: The two "ACT rules" links resolve to different origins:
- `/html/body/p[1]/a[1]` → `https://act-rules.github.io`
- `/html/body/p[1]/a[2]` → `https://www.w3.org`

These are clearly different destinations. Both links share the identical accessible name "ACT rules" but go to different websites. This is the classic identical-names-different-destination failure mode for 2.4.4.
SAY: The tool confirms the two "ACT rules" links resolve to **different origins**: `https://act-rules.github.io` and `https://www.w3.org`. All per-field equality checks are `false`. I now have sufficient evidence to render a verdict.

```json
{
  "verdict": "REPRODUCED",
  "confidence": "high",
  "summary": "Two links sharing the identical accessible name 'ACT rules' resolve to different destinations (act-rules.github.io vs. www.w3.org), making their purpose indistinguishable — a 2.4.4 barrier.",
  "reasoning": "resolve_destination confirmed the two same-named sibling links point to entirely different origins (finalUrlEqual: false, titleEqual: false, all fields unequal), satisfying the identical-names-different-destination failure mode: a user relying on the accessible name alone cannot determine which 'ACT rules' link goes where.",
  "evidenceRefs": [
    "deterministic signal: sameNameLinks.count=1 peer, distinctRawHrefs=2",
    "resolve_destination: /html/body/p[1]/a[1] → https://act-rules.github.io (cross-origin, refused full fingerprint)",
    "resolve_destination: /html/body/p[1]/a[2] → https://www.w3.org (cross-origin, refused full fingerprint)",
    "equality grid: finalUrlEqual=false, titleEqual=false, h1Equal=false, mainFirstParagraphEqual=false",
    "ACT rule fd3a94 (identical accessible names, different destinations)"
  ]
}
```


================= FIXTURE HTML (fd3a94/228c0a3d7855) =================
```html
<!DOCTYPE html>
<html lang="en">
	<p>
		We are on social media:
		<a href="https://act-rules.github.io/">ACT rules</a>
		<a href="https://www.w3.org/community/act-r/">ACT rules</a>
	</p>
</html>
```
