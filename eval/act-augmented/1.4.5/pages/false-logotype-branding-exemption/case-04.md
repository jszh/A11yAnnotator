# case-04 — Departmental crest (exempt logo) beside a "deadline notice" image in the same branding strip (not exempt)

## Scenario
A government heavy-vehicle permits portal. The masthead branding strip holds two images of
text side by side. On the left, a circular departmental **crest** — the agency name curved
around a graphic emblem — is a genuine logo/seal whose visual presentation is essential to
the official identity, so 1.4.5 exempts it. On the right, parked in the same strip and set in
the same departmental colours, is a sub-banner image whose pixels read "Apply for your permit
before 31 March 2026." That is a time-sensitive informational **deadline notice**, not a logo
or brand name. Styling it to sit inside the official lockup does not make it branding; it is
ordinary text that must be live and resizable. The crest passes, the deadline image fails.

## Attribute tuple
- **Content domain:** government / civic services portal (permits)
- **UI component / pattern:** masthead "branding strip" (crest + sub-banner notice)
- **Host-language construct:** two `<img>` with inline-SVG `data:` URIs; the FAIL one's `alt` reproduces its visible text
- **Locale / i18n:** en (state-government English)
- **Failure mechanism:** an informational deadline notice rendered as an image and placed in the branding zone to ride the logotype/branding exemption; alt equals visible text so a captioned-image heuristic is fooled

## Developer persona
A government communications officer received the season's "apply before 31 March" deadline as
a designed badge from the print team (it matched the printed posters). They dropped the badge
image into the site header next to the crest because "that's where official banners go," and
dutifully set the alt to the exact wording so screen readers would read it. Having satisfied
the alt requirement they assumed they were done, not realising the deadline is informational
text that must be live so citizens can enlarge or recolour it.

## Element / selector carrying the issue
`header.masthead img.deadline[alt="Apply for your permit before 31 March 2026"]` — the FAIL
element. The sibling `img.crest[alt="Department of Transport"]` is the PASS (exempt logo).

## Exact accessibility mechanism
The deadline image's `alt` reproduces the visible text, so the words DO reach a screen reader
(1.1.1 is satisfied) — this isolates the failure to 1.4.5. The harm is visual: a low-vision
citizen who must read the cut-off date at large size in a high-contrast palette cannot, because
the date is pixels in a fixed-size SVG that pixelates on zoom and is not recoloured by OS
forced-colors mode. The branding/logotype exemption applies only to marks whose specific
presentation is essential to a brand identity; a deadline notice's information ("apply before
31 March 2026") is fully expressible as styled live text, so text must be used. The crest, by
contrast, legitimately invokes the exemption.

## Expected ACT-style outcome
**failed** (SC 1.4.5), driven by the deadline image. The crest image considered alone is
**passed/inapplicable** under the logotype/branding exemption.

## Why automated tools miss it
Both images have correct non-empty `alt`, so axe/WAVE/Lighthouse `image-alt` passes and there
is no missing-text-alternative finding. Because the deadline's alt even matches its visible
text, a heuristic that treats "image with descriptive alt" as compliant is actively misled. No
automated tool OCRs the two images to discover one is a seal (exempt) and the other a deadline
sentence (not exempt). Distinguishing crest from notice is human semantic/contextual judgment.

## Citation
**Reference:** WCAG 2.2 Understanding — Images of Text, Intent (`wcag-understanding/images-of-text.html`)
> "This includes instances where a particular presentation of text is essential to the information being conveyed, such as type samples, logotypes, branding, etc."

**Reference:** WCAG 2.2 Understanding — Images of Text, "A logo containing text" example
(`wcag-understanding/images-of-text.html`)
> "The visual presentation of the text is essential to the identity of the logo and is included as a gif image which does not allow the text characteristics to be changed."

**Reference:** Trusted Tester v5.1.3 SC 1.4.5, How to Test step 1
(`refs/trusted-tester/sc-1.4.5-images-of-text.md`)
> "Determine if text can be used instead of the image of text to present the same effect and information."
