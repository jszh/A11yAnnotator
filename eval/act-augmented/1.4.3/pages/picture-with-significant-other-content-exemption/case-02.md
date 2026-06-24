# case-02 — Travel article: street photo that incidentally includes a low-contrast street sign (EXEMPT, passes)

## Scenario
A Meridian Travel article, "Walking Lisbon's Baixa." The lead image is a street scene — sky,
sun, a row of tiled buildings, the roadway, a tree, pedestrians, and a triumphal arch in the
distance: a picture with **significant other visual content**. Within the scene hangs a small
green street sign reading "RUA AUGUSTA," whose lettering against the weathered panel measures
only ~1.5:1. That is **incidental text in a photograph** — exactly the carve-out Understanding
1.4.3 names. The sign is not the purpose of the image, so its contrast is **exempt** and the
page **passes** 1.4.3. The body prose is live, high-contrast text.

## Attribute tuple
- **Content domain:** travel / long-form editorial
- **UI component / pattern:** article lead photo with figcaption
- **Host-language construct:** `<figure>`/`<img>` with a scene-describing `alt` (inline-SVG `data:` URI standing in for a photograph)
- **Locale / i18n:** en article about a Portuguese (pt) location; the incidental sign reads "RUA AUGUSTA"
- **Failure mechanism:** NONE — this is the EXEMPT boundary variant; the trap is a reviewer who wrongly measures incidental text

## Developer persona
A staff travel editor dropped a stock golden-hour photograph into the CMS and wrote a
scene-level alt. They did nothing wrong: the low-contrast sign is just part of a real street
photographed as-is. The page exists to test whether a reviewer correctly recognises an
incidental-text photograph as exempt rather than reflexively eyedropping every text-shaped
region.

## Element / selector carrying the issue
`figure img[alt^="A pedestrianised Lisbon street"]` — the incidental sign text (`fill="#6a7a60"`
on the `#7a8a6f` panel, ~1.5:1) lives inside the SVG scene. It is the element a careless
reviewer might measure; the correct judgment is that it is exempt and must NOT be tested.

## Exact accessibility mechanism
A low-vision user cannot read the tiny street sign in the photo — but that is acceptable,
because the sign is incidental scenery, not content the author rendered as an image of text to
convey it. The image's purpose is the street scene; the sign's words are not load-bearing. The
SC explicitly excludes such incidental text from the contrast requirement. Nothing on the page
that conveys meaning to a sighted user as text is hidden from a low-vision user at insufficient
contrast: the prose is live and high-contrast, and the photo's information is carried by the
scene-level `alt`. So the SC is met.

## Expected ACT-style outcome
**passed** (SC 1.4.3). The live body text passes contrast normally. The image contains only
incidental text within a picture that has significant other visual content, which is exempt —
so there is no in-scope image-of-text to test, and the page meets 1.4.3. (A reviewer who fails
this page has misapplied the exemption.)

## Why automated tools miss it
Automated checkers cannot read text inside the photograph at all, so they never even see the
"RUA AUGUSTA" sign — they neither (correctly) exempt it nor (wrongly) flag it; they simply have
no data. The judgment that makes this page a *pass* — recognising that the image is a
photograph with significant other visual content and that the sign is incidental, therefore
NOT to be measured — is a holistic visual/purpose judgment no scanner performs. It is precisely
the kind of decision the SC reserves for a human.

## Citation
**Reference:** WCAG 2.2 Understanding SC 1.4.3 (`wcag-understanding/contrast-minimum.html`)
> "This requirement applies to situations in which images of text were intended to be understood as text. Incidental text, such as in photographs that happen to include a street sign, are not included."

**Reference:** Trusted Tester v5.1.3 SC 1.4.3 (`refs/trusted-tester/sc-1.4.3-contrast-minimum.md`)
> "Contained within a picture that contains significant other visual content"
> (listed under text to **EXCLUDE** when identifying content to test)
