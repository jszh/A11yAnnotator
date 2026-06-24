# case-07 — PASS control: genuinely decorative flourish correctly marked decorative

## Scenario
A "Slow Bloom Coffee" editorial article, "The Two-Number Pour-Over." Next to the H1 sits a
small hand-drawn corner flourish (a swirl) that is purely aesthetic. It is correctly hidden
from AT with `role="presentation"` + `aria-hidden="true"`. Every fact in the article — the
1:16 ratio, the 22 g : 350 g amounts, the three-minute timing — is fully stated in the prose.
The page also contains an **informative** brew-ratio diagram, which (unlike the failures in
cases 01–06) is correctly exposed with a real `aria-label` AND duplicated in the surrounding
text. This is the boundary control: a truly decorative image marked decorative the right way,
included so judges calibrate against false positives and must distinguish real decoration
from mis-marked information.

## Attribute tuple
- **content-domain:** editorial / food & drink longread
- **UI-component/pattern:** article header flourish (decorative) + informative ratio diagram (exposed)
- **host-language construct:** decorative `<svg role="presentation" aria-hidden="true">`; informative `<svg role="img" aria-label="…">`
- **locale/i18n:** en
- **failure-mechanism:** none — correct application of the decoration exception (control case)

## Developer persona
A careful front-end developer who understands the WCAG decoration exception. They added the
flourish purely for visual rhythm and hid it from AT so it would not clutter the screen-reader
experience; they gave the actual brew-ratio diagram a descriptive `aria-label` and also wrote
the numbers into the body text. They tested with a screen reader and confirmed no information
is lost when the flourish is skipped.

## Element / selector carrying the issue
`.head-row svg.flourish[role="presentation"][aria-hidden="true"]` (the decorative swirl — the
control element). For contrast, the informative `figure svg[role="img"]` is correctly named.

## Exact accessibility mechanism (what AT experiences, why it passes)
With `role="presentation"` + `aria-hidden="true"`, the flourish is removed from the
accessibility tree and screen readers skip it silently. Because the flourish conveys no
information and has no function, nothing is lost — this is precisely the treatment WCAG
prescribes for pure decoration, where adding alt text would only distract. The informative
ratio diagram, by contrast, is exposed via `aria-label` and its content is duplicated in the
prose and caption, so its information remains available non-visually. No image on the page is
both informative and hidden, so SC 1.1.1 is satisfied.

## Expected ACT-style outcome
**passed**

## Why automated tools miss it
Automated tools would also (correctly) pass this page — but for the shallow reason that the
decorative element has an empty name and the informative element has a non-empty name, which
is all they check. The point of including it is human calibration: a judge must verify that
the hidden image genuinely conveys no information (true decoration) rather than reflexively
flagging every `role="presentation"` image as a suppressed-meaning failure. Distinguishing
this correct PASS from cases 01–06 requires the same visual/contextual judgment — applied to
confirm a pass, not a fail.

## Citation
> **WCAG 2.2 Understanding Non-text Content, "Sometimes there is non-text content that really is not meant to be seen or understood by the user":**
> "...a swirl in the corner that conveys no information but just fills up a blank space to create an aesthetic effect... Putting alternative text on such items just distracts people using screen readers from the content on the page... This type of non-text content, therefore, is marked or implemented in a way that assistive technologies (AT) will ignore it and not present anything to the user."

(Verbatim from `wcag-understanding/non-text-content.html`. The corner swirl is the canonical
example of legitimate decoration; hiding it from AT is the correct treatment, so this page
PASSES — the exact inverse of the failure cases.)

> **Trusted Tester v5.1.3, Test 7.A Notes — definition of pure decoration:**
> "WCAG 'pure decoration' = 'serving only an aesthetic purpose, providing no information, and having no functionality.' Examples: a corner swirl, generic bullet points, abstract section dividers..."

(Verbatim from `refs/trusted-tester/sc-1.1.1-non-text-content.md`. The flourish meets this
definition exactly — aesthetic only, no information, no functionality — so marking it
decorative is correct and the page passes.)
