# case-05 — A fake "CAPTCHA": clean, undistorted styled text masquerading as a security image (the CAPTCHA exclusion does not apply)

## Scenario
A municipal permits portal gates an application behind a "Verify it's you" security step that looks
like a CAPTCHA: a labelled code image, a refresh button, a text field, and an "audio version" link.
Trusted Tester explicitly EXCLUDES CAPTCHA from images of text — but only because a real CAPTCHA
distorts its glyphs and overlays noise/lines so that the distortion (the "significant other visual
content") IS the security function and cannot be reproduced as live text. THIS image does no such
thing: the word "SUNFLOWER" is rendered in a clean serif display font on a flat tinted panel — no
warping, no per-glyph rotation, no overlapping strokes, no noise field, no occluding lines. It is
ordinary styled text saved as a picture; there is no security reason it must be an image. So the
CAPTCHA exclusion does not apply, and it is an image of text used rather than text.

## Attribute tuple
- **Content domain:** government / civic services (online building permits)
- **UI component / pattern:** login/verification "CAPTCHA" widget (image + refresh + input)
- **Host-language construct:** `<img alt="verification code">` with inline-SVG `data:` URI of clean text
- **Locale / i18n:** en
- **Failure mechanism:** misapplied-exclusion — the widget cites the CAPTCHA exemption, but the image carries none of the distortion/noise that defines a CAPTCHA, so it is just an image of text

## Developer persona
An agency dev wired up a homegrown "are you human?" check on a budget: rather than integrate a real,
accessibility-supported CAPTCHA, they generated a static image of a random dictionary word in a nice
font (no distortion library) and assumed "it's a CAPTCHA, so accessibility rules don't apply to the
image." Both halves are wrong — it's not a real CAPTCHA, and even the exempt kind needs an accessible
alternative; here the SC-1.4.5 point is that clean styled text is plainly an image of text.

## Element / selector carrying the issue
`.captcha img[alt="verification code"]` — the "code" is clean, undistorted styled text rendered as
an image with no noise or warping.

## Exact accessibility mechanism
A real CAPTCHA's distortion legitimately cannot be replaced by live text — that is why it is excluded.
This image's word could be presented as text (or replaced by a genuine accessible challenge) with no
loss, so the exclusion fails and 1.4.5 applies: the text is presented AS an image RATHER THAN as text,
with no way for a low-vision user to enlarge/recolour it without pixelation. (It also has the classic
CAPTCHA AT barrier, but the SC-1.4.5 issue here is the misapplied exclusion: clean text ≠ CAPTCHA.)

## Expected ACT-style outcome
**failed** (SC 1.4.5). The image carries no distortion/noise, so it is not an excluded CAPTCHA; it is
an image of text. (A genuinely distorted CAPTCHA image would be inapplicable for 1.4.5.)

## Why automated tools miss it
The `<img>` has `alt="verification code"`, so `image-alt` passes. No scanner measures glyph distortion
or noise density to decide "real CAPTCHA (excluded) vs. clean decorative text masquerading as one
(image of text, fail)." Distinguishing genuine security distortion from cosmetic styling — and thus
whether the CAPTCHA exclusion applies — is a human visual judgment.

## Citation
**Reference:** Trusted Tester v5.1.3 SC 1.4.5 (`refs/trusted-tester/sc-1.4.5-images-of-text.md`)
> "EXCLUDE text that is part of a picture that contains significant other visual content such as CAPTCHA, graphs, screenshots, and diagrams, which visually convey important information more than just text."

**Reference:** Understanding SC 1.4.5 Images of Text (`wcag-understanding/images-of-text.html`)
> "If for any reason, the author cannot format the text to get the same effect, the effect won't be reliably presented on the commonly available user agents ... then an image of text can be used."

**Reference:** Understanding SC 1.4.5 Images of Text (`wcag-understanding/images-of-text.html`)
> "If authors can use text to achieve the same visual effect, they should present the information as text rather than using an image."
