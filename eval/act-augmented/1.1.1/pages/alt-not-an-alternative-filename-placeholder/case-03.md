# case-03 — Staff directory where every distinct headshot has alt="photo"

## Scenario
A pediatric dental practice ("Meridian Pediatric Dental") "Our team" page lists four staff
members, each in a card with a headshot. The four headshots are visually distinct — different
hair, skin tone, glasses, facial hair, age — so a sighted user can tell the people apart at a
glance. Every headshot carries the identical generic placeholder `alt="photo"`. The alt is
non-empty (presence rules pass) but "photo" neither identifies who is pictured nor describes
anything about the image.

## Attribute tuple
- **Content domain:** healthcare / professional services "about us"
- **UI component / pattern:** staff-directory card grid (`<article>` member cards with circular avatar)
- **Host-language construct:** `<img alt="photo">` portrait beside a name/role heading
- **Locale / i18n:** en
- **Failure mechanism:** generic placeholder word ("photo") reused as the alt on every distinct portrait

## Developer persona
A small-clinic site was built on a drag-and-drop website builder. The team-section template
ships each avatar placeholder with `alt="photo"` baked in. The office manager swapped in real
headshots and typed each person's name and role into the visible text fields, but the alt
field is buried in an advanced panel and was never edited — so every portrait kept the
template default. The builder's built-in checker reports "all images have alt text."

## Element / selector carrying the issue
`.team .member img[alt="photo"]` — all four portraits. The person's identity exists only in the
adjacent `<h2>`/role text, which is not the image's accessible name.

## Exact accessibility mechanism
Each portrait's accessible name is `alt` = "photo". A screen-reader user moving through the
images, or navigating by graphic, hears "photo … photo … photo … photo" and cannot associate
any face with any person, nor learn anything the image conveys (these are informative
portraits, not decoration). "photo" cannot be substituted for the image without losing all
information. Even though each person's name is in adjacent text, the IMAGE'S text alternative
is a placeholder that serves no equivalent purpose — the failure is in the alt itself.

## Expected ACT-style outcome
**failed** (SC 1.1.1). ACT rule 23a2a8 PASSES on every portrait (alt non-empty). The page
fails under F30: "photo" is placeholder text, not a text alternative that serves the
equivalent purpose.

## Why automated tools miss it
"photo" is a non-empty alt, so axe/WAVE/Lighthouse "image-alt" passes on all four. A naive
keyword blocklist for "photo" is brittle and not mandated by the SC, and would also wrongly
flag legitimate uses. qt1vmo cannot help: "photo" names no identifiable asset, so there is no
identity mismatch to detect. Recognising that "photo" is a generic placeholder rather than a
description — and that these are informative portraits needing real names — is a human
meaning judgment about the string relative to the depicted faces.

## Citation
**Reference:** WCAG Technique F30 (`wcag-techniques/failures/F30.html`)
> "placeholder text such as " " or "spacer" or "image" or "picture" etc that are put into the 'text alternative' location on images or pictures."

**Reference:** Trusted Tester v5.1.3 — Test 7.A (`refs/trusted-tester/sc-1.1.1-non-text-content.md`)
> "The ANDI Output must provide an **equivalent description** of the image."
