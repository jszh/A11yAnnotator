# case-02 — Gig-poster image of text whose accompanying live text gives only the act + tour name, omitting the date, doors, support acts, age policy and price ("in addition to" but NOT "the same information")

## Scenario
A live-music venue ("The Foundry") lists a gig. The poster — supplied as a finished raster-equivalent
graphic (inline-SVG `data:` URI) — states everything a fan needs: headline act NIGHTJAR, the tour name,
**Friday 7 Nov 2026**, **doors 7:30 PM**, two support acts (**Kestrel Hours**, **Low Tide Club**),
**18+ only**, and **tickets £24.50**. Beside it, separate live HTML body copy gives only the act + tour
name in the `<h1>`, a marketing blurb, three generic "tags" chips (Art-folk / Live / The Foundry), and
a "Get tickets" button. So there IS text "in addition to" the image — but it omits the date, doors time,
both support acts, the age policy, and the price, all of which live only in the poster pixels.

## Attribute tuple
- **Content domain:** events / live-music ticketing
- **UI component / pattern:** gig listing — poster image + body copy with "tag" chips and a CTA
- **Host-language construct:** `<img>` inline-SVG `data:` URI (image of text) beside an `<h1>` + `<p>` + chip list
- **Locale / i18n:** en-GB
- **Failure mechanism:** partial equivalence — live text is a teaser, not a reproduction of the poster's information

## Developer persona
A promoter-feed importer plus a marketing copywriter, working separately. The artwork arrives as a
finished poster image from the band's design team; the marketing team writes punchy body copy to
"sell the vibe" and tags the show for filtering. Nobody is responsible for transcribing the factual
details off the poster, because everyone assumes "the poster already says it." The result is a page
where the image and the text coexist but do not carry the same information.

## Element / selector carrying the issue
`main .poster img` (image of text holding the date/doors/support/age/price) paired with
`section.gig` (live text that reproduces only the act + tour). The defect is the missing facts in the
live text — the in-addition-to condition is invoked but equivalence fails.

## Exact accessibility mechanism
A blind screen-reader user reaches the listing and hears: "Nightjar — The Lantern Rooms Tour … Live at
The Foundry, Stockwell … [blurb] … Art-folk, Live, The Foundry … Get tickets." They never learn the
date, the doors time, the support acts, the 18+ restriction, or the £24.50 price, because those exist
only as pixels in the poster (whose alt is just "Nightjar gig poster"). A low-vision user who cannot
decode the stylised, low-contrast poster lettering is in the same position. Because the live text does
not convey the same information as the image, the "in addition to" met-condition does not rescue these
facts, and 1.4.5 fails for them.

## Expected ACT-style outcome
**failed** (SC 1.4.5; the omitted facts also implicate 1.1.1). The page superficially resembles the
met-condition (image + adjacent text) but breaks the "same information" requirement.

## Why automated tools miss it
axe-core, WAVE, and Lighthouse never OCR the poster, so they cannot know it contains the date, doors,
support acts, age policy, and price. They cannot scan the live text to confirm those strings are
absent, and they cannot compare image meaning to text meaning. The image has a plausible non-empty alt
("Nightjar gig poster") so `image-alt` passes, and the live HTML is well formed, so every rule stays
green. Detecting that the accompanying text is a teaser rather than an equivalent is a read-both-and-
compare human judgment.

## Citation
**Reference:** Understanding SC 1.4.5 Images of Text (`wcag-understanding/images-of-text.html`)
> "Where images of text are used in addition to text to convey the same information, and where both are presented to the user, this success criterion is met."

**Reference:** WCAG Technique F30 (`wcag-techniques/failures/F30.html`)
> "If the text in the \"text alternative\" cannot be used in place of the non-text content without losing information or function then it fails because it is not, in fact, an alternative to the non-text content."
