# case-04 — A "flowchart" with no boxes, arrows, or branches: an ordered list rendered as an image of text

## Scenario
An HR/onboarding portal publishes the "Reimbursement approval process" as a diagram. It is one image
(inline-SVG `data:` URI), TITLED "Approval flow" and captioned "Approval flowchart." A tester might
reflexively grant the 1.4.5 "diagrams" exclusion on the strength of the label. But the picture has NO
boxes, NO arrows, NO connectors, NO decision diamonds, NO branching — nothing that conveys
relationships through geometry. It is five numbered sentences stacked vertically on alternating
tinted bands. The only structure is top-to-bottom order, which a plain ordered list already provides.
There is no graphical encoding of the process, so it is not a diagram "which visually conveys
important information through more than just text" — it is an image of an ordered list of steps.

## Attribute tuple
- **Content domain:** enterprise HR / finance onboarding portal
- **UI component / pattern:** a `<figure>` "process diagram" in a help-center article
- **Host-language construct:** `<img alt>` with inline-SVG `data:` URI (numbered text bands)
- **Locale / i18n:** en
- **Failure mechanism:** mislabeled-diagram trap — the caption claims "flowchart" but the image has zero diagram structure, so the exclusion does not apply and it is an image of text

## Developer persona
A junior intranet developer was handed a five-step process in an email and told to "make it a
flowchart for the help center." Short on time, they typed the five steps into a slide, added step
numbers and a tinted background to each, exported it as a PNG, and titled it "Approval flow." They
never drew connectors or boxes — so despite the name, the artifact encodes nothing a numbered HTML
list wouldn't. They added a faithful `alt` and assumed "it's a diagram" exempted it from 1.4.5.

## Element / selector carrying the issue
`figure img[alt^="Approval flow."]` — the five steps live only as pixels; there is no live `<ol>`.

## Exact accessibility mechanism
The image's accessible name is the `alt` transcript, satisfying 1.1.1/`image-alt`. 1.4.5 fails: the
steps are presented AS an image RATHER THAN as text. A low-vision user cannot enlarge the steps
without pixelation, cannot recolour them, and cannot reflow them on a narrow screen (a wide image
overflows). A screen-reader user hears one block instead of a navigable ordered list. Because the
picture contains no boxes/arrows/branches, none of its visual content is "significant" — it is an
ordered list in disguise, squarely in scope of 1.4.5. (A REAL flowchart with decision branches WOULD
be excluded; that is the contrast the case sets up.)

## Expected ACT-style outcome
**failed** (SC 1.4.5; also implicates 1.4.10). The steps should be a live HTML ordered list.

## Why automated tools miss it
`image-alt` passes (the alt is a good transcript). No scanner inspects the picture to confirm there
are no boxes or arrows — and therefore no diagram structure — then concludes the "flowchart" is
really an image of an ordered list. Deciding whether the visual content is "significant" (a true
diagram) or absent (text dressed up as a diagram) is a human visual/semantic judgment.

## Citation
**Reference:** Understanding SC 1.4.5 Images of Text (`wcag-understanding/images-of-text.html`)
> "This does not include text that is part of a picture that contains significant other visual content. Examples of such pictures include graphs, screenshots, and diagrams which visually convey important information through more than just text."

**Reference:** Trusted Tester v5.1.3 SC 1.4.5 (`refs/trusted-tester/sc-1.4.5-images-of-text.md`)
> "EXCLUDE text that is part of a picture that contains significant other visual content such as CAPTCHA, graphs, screenshots, and diagrams, which visually convey important information more than just text."

**Reference:** WCAG Technique C22 (`wcag-techniques/css/C22.html`)
> "It is better to use real text for the text portion of these elements, and a combination of semantic markup and style sheets to create the appropriate visual presentation."
