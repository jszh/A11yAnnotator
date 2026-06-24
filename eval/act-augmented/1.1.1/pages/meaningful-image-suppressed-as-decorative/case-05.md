# case-05 — Transit service-change diagram with alt="" (the advisory is lost)

## Scenario
A Metro Transit Authority "Weekend Service Advisory" page. The actual advisory — the B line
suspended between Bedford Ave and Church Ave, the Q line rerouted via the N line (express,
skipping DeKalb Ave and Atlantic Ave), and free shuttle buses replacing B trains — is
conveyed only by a service-change line diagram delivered as `<img src="data:image/svg+xml,…"
alt="">`. The surrounding prose says merely "Service changes are in effect this weekend.
Please plan extra travel time and check signage at your station." — it names no line and no
station. A sighted rider reads exactly which trains are affected and how; an AT user learns
only that "something changed."

## Attribute tuple
- **content-domain:** public transit / government service advisory
- **UI-component/pattern:** service-change route diagram (line bullets, suspended/rerouted segments, shuttle note)
- **host-language construct:** `<img alt="">` with a `data:image/svg+xml` source (classic F38/F39 empty-alt form)
- **locale/i18n:** en (US)
- **failure-mechanism:** the substantive advisory rendered as a diagram and given a null alt, while the prose is vague boilerplate that names nothing

## Developer persona
A CMS author at the transit authority's comms team generated the weekend diagram in their
internal "service-change maker" tool, which exports a PNG/SVG. They pasted it into the
advisory article and, having read an accessibility cheat-sheet that said "decorative images
should have empty alt," set `alt=""` — mistaking a content diagram for chrome. They wrote the
"Service changes are in effect" sentence as a generic lead-in, assuming the diagram carried
the specifics for everyone, and never realised the specifics vanish for AT users.

## Element / selector carrying the issue
`.diagram img[alt=""]` (the data-URI SVG diagram containing the line/station advisory)

## Exact accessibility mechanism (what AT experiences, why it fails)
An `<img>` with `alt=""` is intentionally removed from the accessibility tree — screen
readers skip it silently. A screen-reader user reaches "Weekend Service Advisory," "Effective
this weekend only," then "Service changes are in effect this weekend. Please plan extra
travel time…" — and never learns which lines, which stations, or that shuttle buses exist.
The diagram conveys information (the specific advisory) and is the **only** means of conveying
it (the prose names nothing), so SC 1.1.1 requires a meaningful text alternative. The
empty-alt declaration wrongly invokes the decoration exception for substantive content —
F38/F39 applied contextually.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
`alt=""` is the textbook null alternative for decorative images (H67), and ACT rule
**23a2a8** ("Image has non-empty accessible name") explicitly does not apply to empty-alt
images; **e88epe** and **46ca7f** treat the empty name as a correct decorative declaration.
axe/WAVE/Lighthouse pass empty-alt images by design and never question whether the image
should have been informative. No tool OCRs the data-URI SVG to recover the route advisory or
notices that the prose names no lines. Detecting this requires reading the diagram and the
prose and concluding the specifics exist only in the hidden image — human visual + contextual
judgment.

## Citation
> **WCAG Technique F38 (Failure of Success Criterion 1.1.1 due to not marking up decorative images…), Description:**
> "A text alternative for an image should convey the meaning of the image. When an image is used for decoration, spacing or other purpose that is not part of the meaningful content in the page then the image has no meaning and should be ignored by assistive technologies."

(Verbatim from `wcag-techniques/failures/F39.html`'s shared description text in F38/F39. The
service-change diagram IS part of the meaningful content — it carries the advisory — so it is
not eligible to be "ignored by assistive technologies"; giving it a null alt is the failure.)

> **WCAG 2.2 Understanding Non-text Content, Benefits:**
> "This success criterion helps people who have difficulty perceiving visual content. Assistive technology can read text aloud, present it visually, or convert it to braille."

(Verbatim from `wcag-understanding/non-text-content.html`. With `alt=""` there is no text for
AT to read aloud, present, or braille — the visual-only advisory is unavailable to the very
users this SC protects.)
