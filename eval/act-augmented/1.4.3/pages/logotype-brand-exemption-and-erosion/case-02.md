# case-02 — Wordmark IS the home link in a SaaS app shell (eroded exemption)

## Scenario
A project-management SaaS ("Linaro") renders its wordmark "Linaro" as live HTML text in
brand "mist" (`#6ec3b6`) on white, computed contrast ~**2.07:1**. The wordmark is wrapped
in `<a href="/">` and is the **only** home affordance in the app shell — there is no
separate "Home" item and no logo image. Because the logotype is functioning as an
interactive UI component (the home link), the brand exemption is eroded: a sufficient-
contrast variant is expected. The page **fails**.

## Attribute tuple
- **content-domain:** SaaS analytics / project-management dashboard
- **UI-component/pattern:** application top bar where the wordmark doubles as the home link
- **host-language construct:** `<a class="brand-home" href="/">` wrapping brand text
- **locale/i18n:** en-US
- **failure-mechanism:** logotype acting as a user-interface component, so the brand carve-out no longer applies and ~2.07:1 text fails

## Developer persona
A product engineer followed the now-ubiquitous app-shell pattern: "the logo in the corner
is the home button." They reused the marketing site's pale brand wordmark color verbatim
and made the whole thing a link, not realizing that the moment the logotype becomes the
home control, the 1.4.3 exemption stops covering it. They assumed "logos are always
exempt," which is the precise misconception this case targets.

## Element / selector carrying the issue
`header .appbar a.brand-home` — an `<a href="/">` whose text is the wordmark at
`color:#6ec3b6` on `#ffffff` (~2.07:1). It is the sole home control in the shell.

## Exact accessibility mechanism
A low-vision keyboard user tabs to the primary home control and the link text is at
~2.07:1 — well under 4.5:1 — so the operable control that returns them to the dashboard is
hard to read. Unlike case-01's bare wordmark, here the faint text is not merely decorative
brand identity; it is the label of a live link a user must perceive and target. The 1.4.3
Understanding warns the logo exemption "can be problematic when logos or logotypes act as
user interface components (such as a link or other interactive control)" and that authors
should provide a sufficient-contrast variant or an equivalent control. Neither exists here,
so a real user is left with an under-contrast interactive element.

## Expected ACT-style outcome
**failed** — SC 1.4.3 (Contrast (Minimum), Level AA). The low-contrast text is a logotype
that is acting as a user-interface component (the home link), so the brand exemption does
not rescue it and the ~2.07:1 ratio fails AA.

## Why automated tools miss it
A contrast scanner does compute ~2.07:1 — but it cannot supply the reasoning that makes the
flag *correct*: that "Linaro" is the brand wordmark AND that it is operating as the only
home control. A human reviewer who knows "logotypes are exempt" might wrongly dismiss the
scanner's flag; the right call requires recognizing the erosion condition. axe/WAVE/
Lighthouse model neither "is this an exempt logotype?" nor "is the logotype here a live UI
component whose exemption is eroded?" — both are the human judgments ACT rule 09o5cg
declares out of scope. The defect is the *interaction of identity and function*, not a
bare ratio.

## Citation
> **Reference:** WCAG 2.2 Understanding SC 1.4.3 Contrast (Minimum)
> (`wcag-understanding/contrast-minimum.html`)
>
> **Quote (verbatim):** "However, this can be problematic when logos or logotypes act as
> user interface components (such as a link or other interactive control). In these cases,
> as a best practice, authors should consider choosing a variant of the logo or logotype
> that has sufficient text contrast, if allowed by the corporate identity or brand
> guidelines. Alternatively, authors should consider providing an equivalent user
> interface component which serves the same purpose and meets contrast requirements."
>
> **Reference:** WCAG 2.2 Understanding SC 1.4.3 — Intent
> (`wcag-understanding/contrast-minimum.html`)
>
> **Quote (verbatim):** "Stylized text, such as in corporate logos, should be treated in
> terms of its function on the page"
