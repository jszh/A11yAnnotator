# case-07 — PASS control: the same protest photo with a genuinely descriptive alt

## Scenario
A photo-essay outlet ("Civic Lens") runs a "Photo of the day": the same kind of informative
protest photo as case-01 — a daytime crowd marching past a domed City Hall building, holding
raised banners reading "Fair fares" / "No hike". Here the alt is a real text alternative that
serves the equivalent purpose:
`alt="Crowd marching past the domed City Hall building, holding banners reading 'Fair fares' and 'No hike'"`.
A screen-reader user gets the same essential information a sighted user gets. This control
isolates the aspect: the depicted pixels are equally specific to the failing cases; only the
STRING differs.

## Attribute tuple
- **Content domain:** photojournalism / photo essay
- **UI component / pattern:** single "photo of the day" hero `<figure>` with caption + credit
- **Host-language construct:** `<img alt>` with a full scene description
- **Locale / i18n:** en
- **Failure mechanism:** none — this is the corrected/PASS boundary variant

## Developer persona
A photo editor at a small visual-journalism outlet whose house style mandates a written
description for every published image "so the moment reaches every reader, whether they see it
or hear it read aloud." The editor wrote the alt by hand from the scene, not from the filename,
and treats the alt as separate from the visible caption.

## Element / selector carrying the issue
`figure.hero img` — carries a descriptive accessible name. There is no defect; this element is
the positive comparison point for the filename/placeholder failures in case-01 to case-06.

## Exact accessibility mechanism
The image's accessible name is the descriptive `alt`. A screen-reader user hears "Crowd
marching past the domed City Hall building, holding banners reading Fair fares and No hike,
image," which can substitute for the photo: the who/what/meaning of the scene is conveyed
non-visually (G94: removing the image and leaving the alt loses no essential information). The
visible figcaption adds context (date, credit) but the image's own alt already serves the
equivalent purpose.

## Expected ACT-style outcome
**passed** (SC 1.1.1). Presence rules pass (alt non-empty) AND the equivalence/descriptiveness
facet passes because the alt actually conveys the depicted scene. This is a genuine pass, not a
false pass from mere non-emptiness.

## Why automated tools miss it
Automated tools "pass" this image — but only because the alt is non-empty, which is the same
shallow signal that also wrongly passes the case-01..06 filename/placeholder failures. The
tools cannot tell that THIS alt is a real alternative while "DSC_0481.JPG" is not; both are
non-empty strings to a scanner. Only the human-judgment layer can confirm this one actually
describes the scene — and that judgment agreeing here (pass) while disagreeing on the filename
cases (fail) is exactly what the descriptive-name facet adds beyond presence checks.

## Citation
**Reference:** WCAG Technique G94 (`wcag-techniques/general/G94.html`)
> "The text alternative should be able to substitute for the non-text content. If the non-text content were removed from the page and substituted with the text, the page would still provide the same function and information. The text alternative would be brief but as informative as possible."

**Reference:** WCAG 2.2 Understanding Non-text Content (`wcag-understanding/non-text-content.html`)
> "A photograph of two world leaders shaking hands accompanies a news story about an international summit meeting. The text alternative says, "President X of Country X shakes hands with Prime Minister Y of country Y.""
