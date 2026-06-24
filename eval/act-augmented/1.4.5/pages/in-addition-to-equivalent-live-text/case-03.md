# case-03 — Testimonial quote-card image with a word-for-word equivalent live `<blockquote>` that is `visually-hidden` (sr-only / clipped offscreen) — present to AT but NOT "presented to the user" => FAIL

## Scenario
An interior-architecture studio ("Studio Lumen") shows a client testimonial as a designed quote card —
a raster-equivalent graphic (inline-SVG `data:` URI) in a script-style italic face: *"They turned a
cramped, dark flat into a light-filled home we never want to leave. Every pound was worth it." — Priya
Menon, Camberwell.* In the DOM, "in addition to" the image, sits a live `<blockquote>` containing the
**identical** wording and attribution. So equivalence is perfect — but the `<blockquote>` carries the
studio's reusable `visually-hidden` helper class (the classic 1px-clip `clip-path:inset(50%)` sr-only
pattern), so it is removed from the visible page. Only the image is presented on screen.

## Attribute tuple
- **Content domain:** professional services / interior architecture marketing
- **UI component / pattern:** testimonial card inside a `<figure>` with `<blockquote>` + `<figcaption>`
- **Host-language construct:** `<img>` inline-SVG `data:` URI image of text + a clipped sr-only `<blockquote>`
- **Locale / i18n:** en-GB
- **Failure mechanism:** visibility break — equivalent live text exists but is `visually-hidden`, so it is not "presented to the user"

## Developer persona
A studio marketer using a drag-and-drop page builder. They were told "add the quote as text too, so
it's accessible," so they pasted the quote into a text block — then, to avoid the quote appearing
twice on the page, they applied the builder's reusable "Visually hidden" helper to the text block.
They believe hiding-but-keeping-for-screen-readers is the accessible move; they do not realise that
1.4.5 protects low-vision users who need to *restyle the visible text*, who now have nothing on
screen to restyle.

## Element / selector carrying the issue
`figure.testimonial blockquote.visually-hidden` — the equivalent live text exists and is exposed to
assistive technology, but the `visually-hidden` CSS clips it offscreen so it is not visibly rendered.
The image of text (`figure.testimonial img`) is the only thing presented.

## Exact accessibility mechanism
A screen-reader user actually fares fine here — they hear the full quote from the clipped
`<blockquote>`. But 1.4.5 exists for people who can SEE text yet need to change how it looks: a
low-vision user who needs the quote at 200% in a high-contrast colour, or a dyslexic user who needs a
different font. For them the only thing on screen is the immutable image; the equivalent text is
clipped to a 1px offscreen box and cannot be enlarged, recoloured, or reflowed. The Understanding note
requires that BOTH the image AND the text be "presented to the user." Hidden text is exposed to AT but
not visibly presented, so the met-condition does not apply and 1.4.5 fails.

## Expected ACT-style outcome
**failed** (SC 1.4.5). The page has equivalent text "in addition to" the image, but because that text
is not visibly presented, the met-condition is not satisfied for the users the SC protects.

## Why automated tools miss it
`visually-hidden`/sr-only text is an intentional, ubiquitous pattern, and axe-core, WAVE, and
Lighthouse treat clipped-but-present text as perfectly fine — it is in the accessibility tree, it has
no contrast problem (it isn't painted), and `image-alt` passes because the card image has a non-empty
alt. No tool reasons that, *specifically for 1.4.5*, the equivalent text must be VISIBLY presented (so
a low-vision user can restyle it), not merely reachable by a screen reader. Distinguishing "exposed to
AT" from "presented to the user" for this SC is human judgment about who 1.4.5 protects.

## Citation
**Reference:** Understanding SC 1.4.5 Images of Text (`wcag-understanding/images-of-text.html`)
> "Where images of text are used in addition to text to convey the same information, and where both are presented to the user, this success criterion is met. This allows authors to convey content using any styling they desire, while also presenting the information in text, which can then be manipulated by users to make it more distinguishable."

**Reference:** Understanding SC 1.4.5 Images of Text — Benefits (`wcag-understanding/images-of-text.html`)
> "People with low vision (who may have trouble reading the text with the authored font family, size and/or color)."
