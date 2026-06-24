# case-06 — Scanned boil-water advisory posted as an image; alt="Public notice" loses the safety instructions and dates

## Scenario
A municipal water-utility CMS page posts a "Boil Water Advisory". A records clerk scanned the
signed paper notice and uploaded the resulting image rather than retyping it. The image
(`<img>`, inline-SVG `data:` URI styled like a scanned form) contains the safety-critical,
time-sensitive content: "BOIL WATER ADVISORY / Affected: Maple Ward, zones 3 and 4 / Boil all
tap water for 1 full minute before drinking, cooking, or brushing teeth / In effect until:
Thursday, June 25, 8:00 AM / Questions: (555) 204-7781". The `alt` is `alt="Public notice"` —
non-empty and a fair label of the document *type* — but it drops the affected area, the boil
duration, the lift date/time, and the hotline. A blind resident in Maple Ward learns only
that "a public notice" exists, not that they must boil their water.

## Attribute tuple
- **Content domain:** government / public safety (municipal water utility)
- **UI component / pattern:** posted advisory / scanned official document
- **Host-language construct:** `<img>` with `alt`, `src` = inline-SVG `data:` URI rendered to look like a scanned notice
- **Locale / i18n:** en
- **Failure mechanism:** an entire block of safety text scanned to an image; alt names the document type instead of transcribing the instructions, dates, and contact number

## Developer persona
A records clerk in a small public-works department was asked to "get the advisory online
fast." They scanned the engineer's signed paper notice, uploaded the image to the CMS, and
filled the required alt field with the category label they always use for postings — "Public
notice." Retyping the body never occurred to them; the deadline and boil instructions stayed
trapped in the scan.

## Element / selector carrying the issue
`img.scan[alt="Public notice"]` — the affected zones, the "boil for 1 full minute"
instruction, the "until Thursday, June 25, 8:00 AM" lift time, and the phone number exist
only as SVG `<text>` glyphs inside the image.

## Exact accessibility mechanism
The image's accessible name is "Public notice". The accessibility tree exposes one image node
with that name; "June 25" and "204-7781" are absent from the DOM text and a11y tree
(verified: both present in a11y tree = false). So AT conveys the existence of a notice but not
its life-safety content. Because this is an image of meaningful text, the alternative must
contain the same text; a document-type label cannot substitute for the instructions and dates.

## Expected ACT-style outcome
**failed** (SC 1.1.1). Presence rule passes (alt non-empty); qt1vmo can pass (the name truly
labels the image as a public notice). The page fails because the alternative omits the
affected area, boil duration, lift date/time, and contact number the image displays.

## Why automated tools miss it
`image-alt` passes on the non-empty alt. No scanner OCRs the scanned notice to recover "boil
for 1 full minute" or "until Thursday, June 25", and none checks the alt against that text.
Tools cannot tell this image is a wall of safety instructions rather than, say, a photo.
Recognising that the words must be transcribed — and that the omission has real-world safety
stakes — is a human visual/contextual judgment.

## Citation
**Reference:** Trusted Tester v5.1.3 SC 1.1.1, Test 7.A step 1.d (`refs/trusted-tester/sc-1.1.1-non-text-content.md`)
> "If the image is of **meaningful text**, ANDI Output must contain the **same text**."

**Reference:** WCAG Failure F30 (`wcag-techniques/failures/F30.html`)
> "If the text in the "text alternative" cannot be used in place of the non-text content without losing information or function then it fails because it is not, in fact, an alternative to the non-text content."

**Reference:** WCAG Technique G94 (`wcag-techniques/general/G94.html`)
> "The text alternative should be able to substitute for the non-text content. If the non-text content were removed from the page and substituted with the text, the page would still provide the same function and information."
