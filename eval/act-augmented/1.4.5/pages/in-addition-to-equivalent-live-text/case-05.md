# case-05 — Civic notice whose entire content is an image of text; the only "equivalent" is a faithful ALT attribute and there is NO visible live text — alt is not text "presented to the user" so the met-condition does not apply => FAIL

## Scenario
A district council ("Oakvale") publishes a garden-waste schedule change. The whole substantive notice
— collection day moving from Tuesdays to Thursdays, the new £45 per-bin subscription, the 20 June
renewal deadline, the "bins not subscribed will not be emptied" warning, and the renewal URL/phone —
is a flattened graphic (raster-equivalent inline-SVG `data:` URI). The communications team gave the
image a long, **faithful** alt that reproduces every fact, and published the notice as the graphic
only. There is **no visible live-text version** of the notice anywhere on the page. So the image of
text is used *instead of* text, with a text alternative bolted on — not *in addition to* visible text.

## Attribute tuple
- **Content domain:** government / civic services portal
- **UI component / pattern:** informational notice page (breadcrumb, H1, a single notice graphic, a contact box)
- **Host-language construct:** `<img>` inline-SVG `data:` URI image of text with a complete `alt`; no live-text equivalent
- **Locale / i18n:** en-GB
- **Failure mechanism:** met-condition does NOT apply — the "equivalent" is the alt attribute, not visible live text presented in addition to the image

## Developer persona
A council communications officer who designs in a layout tool and exports finished notices as single
graphics "for consistent branding." Having been told images need alt text, they wrote a thorough alt
describing the whole notice and considered the page accessible. They conflate "has a good alt" (which
satisfies 1.1.1) with "has visible live text in addition" (which 1.4.5 requires), and never put the
notice on the page as real HTML.

## Element / selector carrying the issue
`.notice-graphic img` — the entire notice is in this one image of text, and its only text equivalent
is the `alt` attribute. No element on the page renders the notice as visible, restyleable live text.

## Exact accessibility mechanism
A screen-reader user does hear the full notice from the alt, so 1.1.1 is satisfied. But 1.4.5 protects
people who can SEE text yet need to change how it looks: a low-vision user who needs the deadline and
the warning at 200% in high contrast, or a user with a reading disability who needs a plain font. For
them, alt is invisible — it is exposed only to assistive technology and cannot be enlarged, recoloured,
or reflowed on screen. The "in addition to text" met-condition specifically requires text that is
"presented to the user," i.e. visible live text alongside the image. An alt attribute is not that, so
the condition does not apply and the image-of-text fails 1.4.5.

## Expected ACT-style outcome
**failed** (SC 1.4.5). The page passes 1.1.1 (complete alt) but fails 1.4.5 because the information is
an image of text used instead of text, with no visible live-text equivalent presented to the user. This
sharpens the aspect: a perfect alt does NOT invoke the "in addition to" met-condition.

## Why automated tools miss it
The image has a long, accurate alt, so `image-alt` passes and axe-core, WAVE, and Lighthouse treat it
as a model image — they may even rank the page highly. None of them OCRs the graphic to discover its
pixels ARE the notice (text that could trivially be HTML), and none has any concept of the 1.4.5
distinction between "alt present" and "visible live text present in addition to the image." Recognising
that the whole notice is a picture, and reasoning that a text alternative is not text "presented to the
user," is purely human visual + semantic judgment.

## Citation
**Reference:** Understanding SC 1.4.5 Images of Text (`wcag-understanding/images-of-text.html`)
> "Where images of text are used in addition to text to convey the same information, and where both are presented to the user, this success criterion is met."

**Reference:** Understanding SC 1.4.5 Images of Text — Intent (`wcag-understanding/images-of-text.html`)
> "If authors can use text to achieve the same visual effect, they should present the information as text rather than using an image."
