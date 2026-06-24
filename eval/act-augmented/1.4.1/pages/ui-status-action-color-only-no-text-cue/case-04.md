# case-04 — Color-coded conference schedule, track by background hue only, no T-code

## Scenario
A conference programme groups sessions into three tracks. Each session card's track is
shown **only** by its background hue: blue = Track 1 (Core), amber = Track 2 (Applied),
green = Track 3 (Community). A legend names the colours, but the individual session cards
carry **no in-text track code** (no "T1"/"T2"/"T3" after the title, no icon). This is the
canonical W3C G14 schedule example **with the redundant text code removed**.

## Attribute tuple
- **content-domain:** events / ticketing (developer conference programme)
- **UI-component/pattern:** schedule card grid (time-slot rows × two-room columns)
- **host-language construct:** `<article>` cards whose only track signal is a CSS background class (`.t-core` / `.t-applied` / `.t-comm`)
- **locale/i18n:** en-US
- **failure-mechanism:** a *category distinction* (which track) encoded by background hue alone, with a colour-keyed legend but no per-item text code (G14 failing variant)

## Developer persona
A designer building the conference microsite styled the three tracks with brand colours and
a tidy colour legend at the top. Track codes felt redundant next to "obvious" colours, so
the session cards show only title, speaker, and room. The result is visually elegant and,
to a colour-sighted reviewer, perfectly clear — which is exactly why the gap shipped.

## Element / selector carrying the issue
`article.t-core`, `article.t-applied`, `article.t-comm` — the track is conveyed solely by
`background` colour. No card contains "T1/T2/T3" text or a track-bearing icon.

## Exact accessibility mechanism
A user with colour deficiency, in grayscale, or on a monochrome display cannot tell which
track any session belongs to; in a shared time slot the two concurrent sessions become
indistinguishable by track, so the user cannot follow "their" track through the day. The
verified grayscale render shows every card as the same mid-gray with no track text — the
category is entirely lost. The colour-keyed legend does not help, since it too requires
perceiving the hues.

## Expected ACT-style outcome
**failed** — background hue is the only visual means of distinguishing the track category;
no non-colour text code accompanies each session (the redundant cue G14 requires is absent).

## Why automated tools miss it
Each card is a valid `<article>` with a real heading, speaker, and room; all background
colours pass 1.4.3 against their text. axe-core / WAVE / Lighthouse have no concept that
"blue background means Track 1," nor that the track is information needing a non-colour
equivalent. Recognising that hue is the sole carrier of the category, and that no T-code
backs it, is human semantic + visual judgment.

## Citation
> **WCAG Technique G14 (Understanding 1.4.1 / G14.html — "A color-coded schedule"):** "The
> schedule for sessions at a technology conference is organized into three tracks. Sessions
> for Track 1 are displayed over a blue background. Sessions in Track 2 are displayed over a
> yellow background. Sessions in Track 3 are displayed on a green background. **After the
> name of each session is a code identifying the track in text: T1 for Track 1, T2 for
> Track 2, and T3 for Track 3.**"

This page reproduces the colour scheme of that sufficient example **but omits the final
sentence's text code**, so the track is conveyed by colour alone — the precise failure G14
prevents. (case-07 is the passing counterpart, with the T-codes restored.)
