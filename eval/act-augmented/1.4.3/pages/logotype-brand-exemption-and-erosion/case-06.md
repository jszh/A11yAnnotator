# case-06 — Passing wordmark + adjacent low-contrast "Beta" status badge (smuggled label)

## Scenario
A healthcare patient portal ("Meridian Health") shows a brand lockup containing two strings:
the wordmark "Meridian Health" in dark teal (`#0c5c50`) on white — ~**7.9:1**, which passes
(and is the exempt logotype anyway) — and, glued beside it inside the same lockup, a "Beta"
pill in muted gold (`#b6a45f`) on white at ~**2.48:1**. Because the pill sits inside the
logo lockup it *looks* like part of the brand mark, but it is a product **status label**
(the portal is pre-release), not the logotype. The status label is informative text that
must meet 4.5:1, so the page **fails** — even though the wordmark itself is fine.

## Attribute tuple
- **content-domain:** healthcare / patient portal
- **UI-component/pattern:** brand lockup containing wordmark + an adjacent status badge
- **host-language construct:** `<span class="beta">` pill placed inside `.brand-lockup`
- **locale/i18n:** en-US
- **failure-mechanism:** a non-logo status label smuggled into the logo lockup and wrongly treated as exempt; the wordmark passes, the badge does not

## Developer persona
A platform engineer shipped the portal as a beta and dropped a "Beta" pill next to the logo
"so people know it's pre-release." They styled it in a soft brand-gold to look cohesive with
the lockup and, because it lived inside the logo component in code, mentally filed it under
"the logo" — assuming anything in the brand lockup inherits the logotype exemption. The
wordmark color was chosen dark enough to pass; only the badge is faint.

## Element / selector carrying the issue
`.brand-lockup .beta` — `color:#b6a45f` on `#ffffff` (~2.48:1). The sibling
`.brand-lockup .mark` (the actual logotype) is ~7.9:1 and is NOT the problem.

## Exact accessibility mechanism
A low-vision user needs to know the portal is in beta — that is meaningful status, relevant
to how much they trust the data and features. The "Beta" badge renders at ~2.48:1 and is
illegible to them. The logotype exemption does not cover it: the badge is not the logo or
logotype, and SC 1.4.3's Intent says brand guidelines "beyond logo and logotype are not
included in the exception." The wordmark "Meridian Health" is genuinely exempt and also
happens to pass; the defect is the adjacent, non-exempt status text. A correct evaluation
must (a) identify the wordmark as the exempt logotype, and (b) recognize the "Beta" pill as
a separate, informative status label that the exemption does not reach.

## Expected ACT-style outcome
**failed** — SC 1.4.3 (Contrast (Minimum), Level AA). The sub-4.5:1 "Beta" badge is a
status label, not the logotype; the exemption does not apply, so ~2.48:1 fails AA. (The
adjacent wordmark passes and is exempt — the failure is isolated to the badge.)

## Why automated tools miss it
A scanner computes ~2.48:1 for the badge and ~7.9:1 for the wordmark, but it cannot decide
which span is "the logo" and which is smuggled-in status text. Because the pill is inside
the `.brand-lockup` next to the wordmark, a human applying "it's in the logo, so it's
exempt" would wrongly suppress the flag — the trap this case sets. The right answer needs
parsing the lockup's composition and the badge's *meaning* (a pre-release status indicator),
neither of which axe/WAVE/Lighthouse model. This is the judgment-(c) variant — informative
text adjacent to a logo claimed under the brand carve-out — that ACT rule 09o5cg leaves out
of scope.

## Citation
> **Reference:** WCAG 2.2 Understanding SC 1.4.3 — Intent
> (`wcag-understanding/contrast-minimum.html`)
>
> **Quote (verbatim):** "Corporate identity or brand guidelines beyond logo and logotype
> are not included in the exception."
>
> **Reference:** Trusted Tester v5.1.3 — Test 13.C `1.4.3-contrast`
> (`refs/trusted-tester/sc-1.4.3-contrast-minimum.md`)
>
> **Quote (verbatim):** "Identify ALL text AND images of text. EXCLUDE text that is: In
> logotypes (logo or brand name)"
