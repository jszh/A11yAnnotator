# case-04 — Café specials-board photo (image of text) with a live text list that is LAST week's stale specials — both presented, but not "the same information" => FAIL

## Scenario
A café ("The Copper Kettle") photographs its handwritten chalkboard of **today's** specials each
morning and uploads it as an image of text (here a raster-equivalent inline-SVG `data:` URI). Today
(Thursday 11 June 2026) the board reads: *Spiced Parsnip Soup £6.50 / Wild Mushroom Risotto £12.50 /
Sticky Toffee Pudding £6.00.* Beneath the photo, a live `<ul>` ("Specials (text version)") is meant to
mirror it as real, restyleable text for screen-reader customers — but it was not updated this week and
still lists **last** week's specials and prices: *Carrot & Coriander Soup £6.00 / Beef Lasagne £11.95 /
Lemon Cheesecake £5.50.* Both an image and live text are presented, but they convey different menus.

## Attribute tuple
- **Content domain:** restaurant menu / hospitality daily content
- **UI component / pattern:** daily-specials board photo + a live priced list (`<ul>` with name/price rows)
- **Host-language construct:** `<img>` inline-SVG `data:` URI (image of text) + adjacent live `<ul>`
- **Locale / i18n:** en-GB (£, DD Month YYYY)
- **Failure mechanism:** stale equivalence — the live text was not refreshed, so it disagrees with the current image

## Developer persona
Front-of-house staff at a small café following a manual routine: photograph the board, upload the
photo, and hand-edit a separate "text version" field. The photo upload is part of muscle memory; the
text field is a separate step that gets skipped on busy mornings. Nobody is intentionally lying — the
text was equivalent last week and silently went stale, which is exactly why this is hard to catch.

## Element / selector carrying the issue
`section.live-specials ul` — the live text list is well-formed and visible, but its contents are last
week's specials, not the ones in the current board photo (`.board img`). The image and the text
disagree.

## Exact accessibility mechanism
A sighted customer reads today's specials off the photo and orders the risotto. A blind screen-reader
user, or a low-vision user relying on the restyleable text version, hears "Carrot & Coriander Soup,
Beef Lasagne, Lemon Cheesecake" — none of which the kitchen is cooking today — and the wrong prices.
The "in addition to" met-condition requires the accompanying text to convey *the same information* as
the image; stale text conveys *different* information, so the condition is not satisfied and the
disability-affected user is actively misled (worse than no text at all).

## Expected ACT-style outcome
**failed** (SC 1.4.5). Both image and live text are visibly presented, but they are not equivalent, so
the met-condition does not apply.

## Why automated tools miss it
Nothing is malformed: the board photo has a sensible alt, the `<ul>` is valid and high-contrast, and
`image-alt` passes. axe-core, WAVE, and Lighthouse do not OCR the chalkboard to learn it says "Spiced
Parsnip / Wild Mushroom Risotto / Sticky Toffee," do not parse the live list to learn it says something
else, and have no notion of which version is current. Detecting that the two disagree — and that the
text is the stale one — requires a human to read both and apply freshness/equivalence judgment.

## Citation
**Reference:** Understanding SC 1.4.5 Images of Text (`wcag-understanding/images-of-text.html`)
> "Where images of text are used in addition to text to convey the same information, and where both are presented to the user, this success criterion is met."

**Reference:** Trusted Tester v5.1.3 — SC 1.4.5 (`refs/trusted-tester/sc-1.4.5-images-of-text.md`)
> "Determine if text can be used instead of the image of text to present the **same effect and information**."
