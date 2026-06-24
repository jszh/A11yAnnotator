# case-06 — BOUNDARY (PASS): video + transcript frames with descriptive, distinct names

## Scenario
An e-learning lesson page ("Lesson 4: Generics") embeds two iframes: a **video player**
and the lesson **transcript**. Each is given a `title` that fully describes its content —
`"Video player: Generics — writing reusable, type-safe functions (Lesson 4)"` and
`"Transcript: Generics — writing reusable, type-safe functions (Lesson 4)"`. Both frames
are in the tab order. A human applying TT 12.D finds each name sufficiently describes its
frame, so the page passes. This boundary case sharpens the aspect by showing what an
adequate iframe name looks like, contrasted with cases 01–05.

## Attribute tuple
- **content-domain:** e-learning / online course platform
- **UI-component/pattern:** video-player iframe + transcript iframe
- **host-language construct:** two `<iframe srcdoc>` with descriptive, distinct `title`s
- **locale/i18n:** en
- **failure-mechanism:** none — correct, content-descriptive names (PASS boundary)

## Developer persona
A platform engineer on an accessibility-conscious team named each embed for the lesson it
carries and distinguished the media type ("Video player: …" vs "Transcript: …"), following
the team's checklist item "every iframe title must say what the frame contains." This is
the do-it-right counterexample.

## Element / selector carrying the issue (here: the compliant elements)
`.player iframe` (title "Video player: Generics …") and `.transcript iframe`
(title "Transcript: Generics …"). Accessible names computed by Chrome match the titles
verbatim (verified via CDP).

## Exact accessibility mechanism
Both iframes are in the tab order, role `Iframe`, with accessible names that name both the
media type and the specific lesson. A screen-reader user navigating frames hears
"Video player: Generics … (Lesson 4)" and "Transcript: Generics … (Lesson 4)" and can tell
exactly what each frame is and how they relate. The combination of accessible name and
content describes the content for each frame, satisfying the "Name" limb of 4.1.2 for
embedded frames under TT 12.D.

## Expected ACT-style outcome
**passed** (TT 12.D — each iframe's name describes its content). cae760 *passes* (names
non-empty); 4b1c6c *inapplicable* (names differ). No defect under the aspect-under-test.

## Why automated tools miss it (and why that does not matter here)
Automated tools also cannot confirm a *pass* of descriptiveness — they only see two
non-empty, distinct names (cae760 pass, 4b1c6c inapplicable) and cannot verify the names
actually match the frames' content. The pass here is established by the same human TT 12.D
judgement that flags the failures in cases 01–05; this case demonstrates the judgement
returning "passes" when names are genuinely descriptive, anchoring the aspect's boundary.

## Citation
> **Reference:** Trusted Tester v5.1.3 — Test 12.D `4.1.2-iframe-name`
> (`refs/trusted-tester/sc-4.1.2-name-role-value.md`)
>
> **Quote (verbatim):** "Evaluate Results (PASS if) … The ANDI Output for each `<iframe>`
> in the tab order sufficiently describes its content."
>
> **Quote (verbatim):** "Test Condition: *The combination of accessible name and
> description for each `<iframe>` describes its content.*"
