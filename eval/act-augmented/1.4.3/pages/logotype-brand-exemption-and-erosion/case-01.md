# case-01 — Bare company wordmark in a B2B header (legitimate logotype exemption)

## Scenario
A heavy-industry fastener supplier's marketing site renders its company wordmark
"acmecorp.com" as live HTML text in the brand "fog teal" (`#6ec3b6`) on a white header.
The computed contrast is about **2.07:1**, far below 4.5:1. But the wordmark is a bare
`<span>` — it is not a link, not a button, and a separate "Home" item in the nav carries
the home destination. Because it is genuinely the company logotype and is not acting as a
UI component, SC 1.4.3's logotype exception applies and the page **passes**.

## Attribute tuple
- **content-domain:** B2B industrial / manufacturing marketing site
- **UI-component/pattern:** site header masthead with a static brand wordmark
- **host-language construct:** `<span class="wordmark">` (non-interactive text node)
- **locale/i18n:** en-GB
- **failure-mechanism:** NONE present — low-contrast text that is a true exempt logotype (the boundary/control case)

## Developer persona
An in-house front-end developer implemented the 2019 brand refresh exactly as the identity
guidelines specify: the wordmark must use the "fog teal" Pantone equivalent on white. The
developer deliberately kept the wordmark as plain text (not a link) and added a separate
"Home" nav link, knowing the brand color is pale. They are correct that logotypes are
exempt; the trap is that a contrast scanner cannot tell this is a logotype.

## Element / selector carrying the issue
`header .topbar .wordmark` — `color:#6ec3b6` on `background:#ffffff` (~2.07:1). It is a
non-interactive `<span>`, distinct from the linked nav items.

## Exact accessibility mechanism
A low-vision user sees a faint teal wordmark, but per SC 1.4.3 the visual presentation of
text "in logotypes (logo or brand name)" carries no contrast requirement. Nothing
informational is lost: the company identity is conveyed by the mark, the home link and all
navigation are full-contrast black text, and the body copy clears 4.5:1. An assistive-tech
user gets `aria-label="Acmecorp"` and the readable nav. Because the faint text is the
brand mark and is NOT functioning as a control, the exemption holds and there is no
1.4.3 defect. This is the control variant that defines where the exemption legitimately
applies, so that the erosion cases (02, 05) are meaningful by contrast.

## Expected ACT-style outcome
**passed** — SC 1.4.3 (Contrast (Minimum), Level AA). The only sub-4.5:1 text is a
logotype/brand name, which the success criterion exempts, and the logotype is not acting
as a user-interface component.

## Why automated tools miss it
This is the inverse failure mode: axe-core, WAVE and Lighthouse compute ~2.07:1 from the
CSSOM and report a **false-positive** 1.4.3 violation, because a pixel/CSSOM contrast
checker has no concept of "logotype." They cannot recognize that the string "acmecorp.com"
in the brand serif at the top-left of the header is the company wordmark, nor that it is a
bare `<span>` rather than a control. Reaching the correct verdict (pass) requires the human
judgment "is this low-contrast text a brand name?" — exactly the determination ACT rule
09o5cg lists as an assumption / out of scope.

## Citation
> **Reference:** WCAG 2.2 Understanding SC 1.4.3 Contrast (Minimum)
> (`wcag-understanding/contrast-minimum.html`)
>
> **Quote (verbatim):** "Text used as part of a logo or logotype is exempted from contrast
> requirements, under the assumption that logos/logotypes must comply with stricter color
> choices mandated by corporate identity or brand guidelines."
>
> **Reference:** Trusted Tester v5.1.3 — Test 13.C `1.4.3-contrast`
> (`refs/trusted-tester/sc-1.4.3-contrast-minimum.md`)
>
> **Quote (verbatim):** "Identify ALL text AND images of text. EXCLUDE text that is: In
> logotypes (logo or brand name)"
