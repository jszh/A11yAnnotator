# case-01 — News hero photo with alt="DSC_0481.JPG" (raw camera filename)

## Scenario
A local-news article ("The Riverside Ledger") about a transit-fare protest leads with a hero
photograph that depicts a specific, story-critical scene: a daytime crowd marching past a
domed City Hall building, holding raised rectangular banners reading "FAIR FARES" / "NO HIKE".
The image is the visual evidence for the story. Its `alt` attribute is the raw DSLR filename,
`alt="DSC_0481.JPG"`. The attribute is non-empty, so every ACT presence rule passes, yet the
string conveys none of the depicted protest, crowd, banners, or building.

## Attribute tuple
- **Content domain:** local journalism / breaking news
- **UI component / pattern:** article lead `<figure>` + `<figcaption>` hero image
- **Host-language construct:** `<img alt>` on a `<figure>` (figcaption is descriptive but is NOT the image's accessible name)
- **Locale / i18n:** en
- **Failure mechanism:** raw camera/DSLR export filename echoed into the alt slot

## Developer persona
A newsroom CMS auto-populates the `alt` field from the uploaded file's name when the photo
desk does not type a caption-alt. The staff reporter dragged `DSC_0481.JPG` straight off the
camera card into the article tool on deadline; the visible figcaption got written for print,
but the separate alt field kept the camera default. The build linter stayed green because alt
was present and non-empty.

## Element / selector carrying the issue
`article figure img[alt="DSC_0481.JPG"]` — the lead hero image. The descriptive text exists
only in the sibling `<figcaption>`, which is NOT programmatically the image's accessible name.

## Exact accessibility mechanism
The image's accessible name is computed from `alt`, so AccName = "DSC_0481.JPG". A screen
reader announces "D S C underscore 0 4 8 1 dot J P G, image" (or spells the token), giving a
blind user a filename instead of the scene. A sighted user sees a protest; the AT user gets a
string that is not a substitute for the non-text content — it cannot be put in place of the
image without losing all the information the photo carries. The figcaption is read separately
as page text and is not guaranteed to be associated as the image's description by all AT, and
even when read it does not repair the fact that the image's own text alternative is a filename.

## Expected ACT-style outcome
**failed** (SC 1.1.1). ACT rule 23a2a8 "Image has non-empty accessible name" PASSES (alt is
non-empty). The page fails 1.1.1 under F30 because the text alternative is a filename, not an
alternative that serves the equivalent purpose.

## Why automated tools miss it
axe-core, WAVE, and Lighthouse only verify that `alt` is present and non-empty; "DSC_0481.JPG"
satisfies that, so they report a pass. The descriptive-name ACT rule qt1vmo can only flag a
name that names a DIFFERENT identifiable asset (an identity mismatch); a camera filename on a
sunset/protest photo names nothing identifiable, so qt1vmo has nothing to compare against and
cannot judge it wrong. Recognizing "DSC_0481.JPG" as a non-descriptive camera filename
requires reading the string as a human and comparing it to what the pixels show — semantic
judgment no scanner performs.

## Citation
**Reference:** WCAG Technique F30 (`wcag-techniques/failures/F30.html`)
> "filenames that are not valid text alternatives in their own right such as "Oct.jpg" or "Chart.jpg" or "sales\oct\top3.jpg""

**Reference:** WCAG Technique F30 (`wcag-techniques/failures/F30.html`)
> "If the text in the "text alternative" cannot be used in place of the non-text content without losing information or function then it fails because it is not, in fact, an alternative to the non-text content."
