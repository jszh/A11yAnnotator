# case-04 — Footer tagline claimed as "brand identity" (beyond-the-logo boundary)

## Scenario
A conservation charity's footer carries the slogan "Beyond the brand.™" in the protected
brand muted-gold italic (`#bfa86f`) on the cream footer (`#f6f3ee`), computed contrast
~**2.10:1**. The brand agency calls this slogan the organisation's "brand essence
statement" and treats it as brand identity, so it (wrongly) inherits the logotype contrast
exemption. WCAG explicitly closes this: corporate identity / brand guidelines *beyond* the
logo and logotype are not exempt. The organisation's actual logotype is "Verdant Trust" in
the header (full contrast). The tagline must meet 4.5:1, so the page **fails**.

## Attribute tuple
- **content-domain:** nonprofit / charity / donation flow
- **UI-component/pattern:** site footer with a brand slogan / "brand essence statement"
- **host-language construct:** `<p class="tagline">` containing the slogan text + ™
- **locale/i18n:** en-GB
- **failure-mechanism:** brand guidelines beyond the logo (a tagline) smuggled under the logotype exemption

## Developer persona
An agency-built site: the brand book devotes a page to the slogan, mandating the muted-gold
italic treatment "in all placements." The implementing developer treated the brand book as
authoritative — "if the brand book protects its color, it must be part of the exempt brand"
— and never separated "the logo" from "everything else in the brand guidelines." This is
the exact boundary WCAG's "beyond logo and logotype" sentence exists to police.

## Element / selector carrying the issue
`footer .tagline` — `color:#bfa86f` on `background:#f6f3ee` (~2.10:1). It is a slogan, not
the logotype (the logotype is `header .logo`, full contrast).

## Exact accessibility mechanism
A low-vision donor reading the footer encounters the slogan at ~2.10:1 and cannot read it.
The logotype exemption does not reach it: SC 1.4.3's Intent states "Corporate identity or
brand guidelines beyond logo and logotype are not included in the exception." A tagline /
brand essence statement is brand guidance *beyond* the logo, so it is ordinary informative
text and must clear 4.5:1. Because it is presented at ~2.10:1, it fails. The judgment is
about scope: what counts as "the logo/logotype" versus the rest of the brand system. The
real logotype (header) is full contrast and would pass even without the exemption; the
slogan is the thing that fails.

## Expected ACT-style outcome
**failed** — SC 1.4.3 (Contrast (Minimum), Level AA). The sub-4.5:1 text is a brand
tagline — corporate identity *beyond* the logo/logotype — which the success criterion
explicitly does not exempt; ~2.10:1 fails AA.

## Why automated tools miss it
A scanner computes ~2.10:1 and can flag the slogan as text, but it cannot resolve the only
question that matters: does the logotype exemption extend to a tagline? Tools have no model
of "logo vs. broader brand guidelines," and a human applying "brand-protected color =
exempt" would wrongly suppress the flag. Reaching "failed" requires knowing the carve-out
stops at the logo itself — the "beyond logo and logotype" boundary that ACT rule 09o5cg
treats as an out-of-scope assumption. The defect is a scope/identity judgment, not a
measurable-ratio gap.

## Citation
> **Reference:** WCAG 2.2 Understanding SC 1.4.3 — Intent
> (`wcag-understanding/contrast-minimum.html`)
>
> **Quote (verbatim):** "Corporate identity or brand guidelines beyond logo and logotype
> are not included in the exception."
>
> **Reference:** WCAG 2.2 Understanding SC 1.4.3 — logotype note
> (`wcag-understanding/contrast-minimum.html`)
>
> **Quote (verbatim):** "Text used as part of a logo or logotype is exempted from contrast
> requirements, under the assumption that logos/logotypes must comply with stricter color
> choices mandated by corporate identity or brand guidelines."
