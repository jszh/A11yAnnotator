# case-03 — County heat-warning map image; alt + aria-describedby state "red = Severe Heat Warning" but never name Verde and Calloway

## Scenario
A county emergency-management site shows a choropleth MAP of active heat advisories as a flattened
`<img>` (inline-SVG `data:` URI). Five labelled county polygons are drawn; the two counties under a
Severe Heat Warning (Verde, Calloway) are filled red, the other three (Lindholm, Pierce, Ashby) are
grey. The county NAMES are baked into the image as text, but the WARNING STATE is colour only. The
image is wired to a long description via `aria-describedby`. Both the alt and the long description are
fluent and state the rule — "Counties shaded red are under a Severe Heat Warning; counties shaded grey
are not" — plus the threshold (heat index ≥ 105°F) and the end time. Neither ever NAMES Verde or
Calloway as the warned counties; that fact is recoverable only by seeing which two polygons are red.

## Attribute tuple
- **Content domain:** government / civic public-safety alerts
- **UI component / pattern:** choropleth map image with a programmatic long description (`aria-describedby`)
- **Host-language construct:** `<img alt aria-describedby>` (inline-SVG `data:` URI) + `<p>` long description
- **Locale / i18n:** en (US county/heat-index context)
- **Failure mechanism:** F13 — alt AND a high-quality long description state the colour rule and the threshold but omit the resolved fact (which counties are warned)

## Developer persona
A junior developer integrated a vendor "advisory map" widget that renders the state as polygon
fills. Knowing accessibility matters for a `.gov` site, they conscientiously added a long alt and a
linked `aria-describedby` long description — and even passed an internal audit, because the markup
looks exemplary. But they described the LEGEND ("red = warning") rather than the OUTCOME (Verde and
Calloway are under warning), so the most polished-looking page on the site still hides the one fact a
resident needs in an emergency.

## Element / selector carrying the issue
`img[aria-describedby="heatLongDesc"]` and its description `#heatLongDesc`. The warned-county
membership (Verde, Calloway) is encoded only as the red fill of two polygons inside the image.

## Exact accessibility mechanism
AT computes the image name from the long alt and appends the `aria-describedby` text. A screen-reader
user hears: the five county names, "red = Severe Heat Warning / grey = no advisory", the 105°F
threshold, and the end time — a thorough briefing that never identifies the two counties in danger.
A resident with red-green colour-vision deficiency looking at the screen also struggles, because red
and the neutral grey can be hard to separate, and there is no second cue (no hatch, no "⚠" marker, no
bold outline) on the warned polygons. So the actionable, colour-borne fact — "if you live in Verde or
Calloway, take precautions" — reaches neither AT users nor colour-blind sighted users.

## Expected ACT-style outcome
**failed** (SC 1.4.1, via F13; also implicates 1.1.1). Every automated text-alternative rule passes
(non-empty alt AND an associated long description), and the page would *look* like best practice. It
fails 1.4.1 because the information conveyed by the red/grey colour difference (which counties are
warned) is not also available in text or via any non-colour visible cue. Richer-looking metadata that
still omits the resolved fact makes this HARDER, not easier, for a human reviewer to catch.

## Why automated tools miss it
The `<img>` has a long non-empty alt and a valid `aria-describedby` target — axe/WAVE/Lighthouse pass
every alt, name, and description check and may even score the page highly. No scanner reads the map
pixels to determine which two polygons are red, reads the names printed on them, and verifies those
names are absent from the alt and the long description. Cross-reading map colour against prose to
notice the missing county names is exactly the manual F13 judgment automation cannot make.

## Citation
**Reference:** WCAG Technique F13 (`wcag-techniques/failures/F13.html`)
> "Check that the information conveyed by color differences is not included in the text alternative for the image."

**Reference:** EN 301 549 Annex C, clause C.9.1.4.1 (`docs/analysis/en301549/EN301549-ANNEX-C-RELEVANT-CLAUSES.md`)
> "Procedure 1. Check that the web page does not fail WCAG 2.2 Success Criterion 1.4.1 Use of Color according to WCAG Conformance Requirements stated in clause 9.6. Result Pass: Check 1 is true Fail: Check 1 is false"

**Reference:** Understanding SC 1.4.1 (`wcag-understanding/use-of-color.html`)
> "However, if content relies on the user's ability to accurately perceive or differentiate a particular color an additional visual indicator will be required regardless of the contrast ratio between those colors."
