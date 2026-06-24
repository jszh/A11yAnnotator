# case-03 — A genuine software screenshot in developer docs (BOUNDARY: correctly INAPPLICABLE for 1.4.5)

## Scenario
A developer-docs "Exporting a report" page embeds a screenshot of the app's Export dialog (inline-SVG
`data:` URI). The image shows real UI chrome: a window title bar with traffic-light buttons, a menu
bar with the File menu open and "Export…" highlighted, a sidebar report tree, and a modal dialog with
a Format dropdown (PDF), an "Include metadata" checkbox, and Cancel/Export buttons. The geometry,
layout and chrome carry the meaning — the screenshot exists to show WHERE the command lives and WHAT
the dialog looks like. The words inside ("File", "Export", "Format", "PDF", "Cancel") are labels on
UI controls. This is precisely the "screenshots ... which visually convey important information
through more than just text" example the 1.4.5 note excludes. The surrounding instructions are live
HTML text, so the page is not relying on the image to deliver readable copy.

## Attribute tuple
- **Content domain:** developer docs / API & product documentation
- **UI component / pattern:** documentation `<figure>` with an app screenshot, inside a docs layout
- **Host-language construct:** `<img alt>` with inline-SVG `data:` URI depicting window/menu/dialog chrome
- **Locale / i18n:** en
- **Failure mechanism:** NONE — this is the sharpening boundary; the non-text visual content IS significant, so the exclusion correctly applies and the verdict flips to inapplicable

## Developer persona
A technical writer captured the Export dialog with the OS screenshot tool while documenting the
export flow, wrote a thorough `alt` describing the dialog, and embedded it beside the step list.
This is the correct pattern: the screenshot conveys spatial/UI information that prose alone could not,
and the steps themselves are real text.

## Element / selector carrying the issue
`figure img[alt^="Screenshot of the Cartograph"]` — present as the boundary anchor. The point of the
page is that a mechanical "there is text inside this image" flag would WRONGLY fail it.

## Exact accessibility mechanism
For 1.4.5 this image is not an image of text: its purpose is to show UI chrome and layout, and the
embedded words are control labels, not prose presented as pixels. So 1.4.5 is INAPPLICABLE to the
image (it is an excluded screenshot). 1.1.1 is separately satisfied by the descriptive `alt` (not
under test here). A tester applying 1.4.5 must recognize that converting this to "live text" would
destroy the very information it conveys (the visual arrangement of the dialog), which is the
condition the exclusion exists for.

## Expected ACT-style outcome
**inapplicable** (SC 1.4.5) — the screenshot is excluded by the definition note; it is not an image
of text. (Included to make the failing pages' judgments meaningful by contrast.)

## Why automated tools miss it
Same blind spot as the failing pages, in reverse: no scanner can tell that THIS image's words are
control labels on meaningful UI chrome (excluded -> inapplicable) while a near-identical alt-bearing
image elsewhere (case-01 fake chart, case-04 fake flowchart) is text-in-disguise (in scope ->
failed). Getting the INAPPLICABLE right is as much a human classification as catching the FAILs.

## Citation
**Reference:** Understanding SC 1.4.5 Images of Text (`wcag-understanding/images-of-text.html`)
> "This does not include text that is part of a picture that contains significant other visual content. Examples of such pictures include graphs, screenshots, and diagrams which visually convey important information through more than just text."

**Reference:** Trusted Tester v5.1.3 SC 1.4.5 (`refs/trusted-tester/sc-1.4.5-images-of-text.md`)
> "DNA for 7.E if there are no images of text on the page."

**Reference:** Trusted Tester v5.1.3 SC 1.4.5 — detection note (`refs/trusted-tester/sc-1.4.5-images-of-text.md`)
> "Detection step is OCR-like: the tester must first recognize that an image contains text (vs being a photo/diagram), then judge whether that text is essential (logotype) or could have been live text."
