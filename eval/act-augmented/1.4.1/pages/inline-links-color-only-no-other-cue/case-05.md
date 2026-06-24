# case-05 — LMS reading list: colored-bold links vs colored-bold non-link emphasis (decoy)

## Scenario
A university LMS course page (HIST 214, Week 6). The theme styles BOTH inline links (`<a>`)
AND lecturer emphasis (`<strong>`) with the *same* maroon `#9d1b3d`, the *same* bold weight,
and no underline. So "maroon + bold" is not a link-specific cue — roughly half the
maroon-bold phrases are reading-list links and half are non-link emphasis ("single most
important shift", "necessary but not sufficient"). A user perceiving color/bold still cannot
tell which maroon-bold word is clickable; only the `href` reveals it. A color-blind/grayscale
user loses the maroon entirely and sees only undifferentiated bold prose.

## Attribute tuple
- **content-domain:** higher-ed LMS / course page
- **UI-component/pattern:** course module with prose + a separate breadcrumb; inline `<a>` links interleaved with `<strong>` emphasis (the decoy)
- **host-language construct:** semantic `<strong>` reused decoratively alongside `<a>`, both restyled to one accent
- **locale/i18n:** en-GB ("industrialisation")
- **failure-mechanism:** F73 + decoy — link-ness is conveyed by a color (and a bold cue that is *shared* with non-links, so non-distinguishing); link vs surrounding/emphasis is ambiguous

## Developer persona
A course designer set a single "brand maroon, bold, no underline" rule for all emphasized
text in the LMS theme and applied the same class look to links so the page would "feel
cohesive." They never considered that making links and emphasis visually identical erases the
link cue — they navigate by mouse-hover habit and hrefs they already know.

## Element / selector carrying the issue
`.course a` and `.course strong` — both resolve to `color:#9d1b3d; font-weight:700;
text-decoration:none`, making links and non-link emphasis visually indistinguishable.

## Exact accessibility mechanism
The bold weight is real but *shared* with non-links, so it cannot signal "this is a link."
That leaves color as the only link-distinguishing cue, and color cannot disambiguate links
from the identically-colored emphasis either. Measured accent-vs-body lightness is **2.01:1**
(under 3:1), so even the maroon-vs-black difference is hue-dominant. A color-blind or
grayscale user sees uniform bold text and cannot find the links; a sighted user must hover or
read source to learn which bold-maroon phrase is actionable. This is the canonical
"distinguishing a visual element" failure — the link is not visually evident as a link.

## Expected ACT-style outcome
**failed** — F73: links within text are not visually identifiable by any means other than a
color that is itself ambiguous (also used for non-link emphasis), with no underline/weight
distinction unique to links and lightness under 3:1.

## Why automated tools miss it
The `<a>` and `<strong>` elements are valid and 1.4.3-passing (7.90:1 on white). A scanner
sees "links are bold and colored" and would, if anything, judge that *sufficient* — it cannot
know the identical styling is also used for non-links, nor reason that a shared cue fails to
distinguish links. Determining which colored-bold spans are links vs decorative emphasis, and
that the shared cue is non-distinguishing, requires reading meaning and markup — a contextual
human judgment.

## Citation
> **WCAG Technique F73** (`wcag-techniques/failures/F73.html`):
> "While some links may be visually evident from page design and context, such as
> navigational links, links within text are often visually understood only from their own
> display attributes. Removing the underline and leaving only the color difference for such
> links would be a failure because there would be no other visual indication (besides color)
> that it is a link."
