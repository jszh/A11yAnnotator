# case-02 — API-reference glossary: same-hue gray-on-gray cross-reference links at ~2:1

## Scenario
A REST-API developer-docs glossary page (`<dl>` of terms like "Idempotency key",
"Settlement batch"). Inside each `<dd>` definition, cross-reference links point to other
glossary entries and guides. Body copy is mid-gray `#6b6b6b` on white; the in-definition
cross-refs (`.xref`) are a *darker shade of the same gray hue* `#3d3d3d`, with no underline
and no weight/family difference. The breadcrumb nav links (blue, hover-underlined) are fine
and act as a distractor — the failing links are only the in-prose `.xref` ones.

## Attribute tuple
- **content-domain:** developer docs / API reference (fintech payments API)
- **UI-component/pattern:** `<dl>`/`<dt>`/`<dd>` definition-list glossary with inline cross-reference links + a separate breadcrumb nav
- **host-language construct:** static HTML5 with a class-scoped link style (`dd .xref`)
- **locale/i18n:** en-US, monospace code spans
- **failure-mechanism:** F73 — same-hue link vs body, lightness under 3:1; escape hatch missed because the difference is darkness within the same hue and only ~2:1

## Developer persona
A backend engineer maintaining the docs site disliked "noisy" blue links cluttering dense
reference prose, so they overrode the doc-theme link style to "just a touch darker than the
text, no underline" for a calmer read. They tested readability of the *text*, never the
distinguishability of the *links*, and assumed darker = sufficient cue.

## Element / selector carrying the issue
`dd .xref` (the cross-reference links inside each definition). The `.breadcrumbs a` links
are NOT the issue (they are blue + hover-underlined).

## Exact accessibility mechanism
Measured: `.xref` `#3d3d3d` vs body `#6b6b6b` is **2.04:1** lightness contrast and the two
are the *same* hue (neutral gray) — so the only difference is a darkness step that does not
reach 3:1. F73's note explicitly allows a same-hue lightness difference *only* at 3:1 or
greater; 2.04:1 does not qualify. A grayscale or low-vision reader scanning the definitions
cannot tell which words are clickable cross-references; even full-color users may miss them
because the cue is a faint darkness change, not a hue change. Both colors pass 1.4.3 vs
white (5.33:1 and 10.86:1).

## Expected ACT-style outcome
**failed** — F73 applies; the link/body lightness difference (~2:1, same hue) is below the
3:1 threshold that would otherwise count as a non-color distinction.

## Why automated tools miss it
There is no fg-vs-bg contrast violation (both grays clear 4.5:1 on white), so axe/Lighthouse
contrast rules stay silent. No scanner compares a link's color to the *adjacent text* color,
and none knows that a 2:1 same-hue darkness step is too weak. Distinguishing real link spans
from prose and judging whether the darkness step is "enough" is a perceptual/contextual call
no automated checker makes.

## Citation
> **WCAG Technique F73** (`wcag-techniques/failures/F73.html`):
> "Red and pink are the same color (hue) but they have different lightness (which is not
> color). So red and pink would pass the requirement for 'not distinguished by color (hue)
> alone' since they differ by lightness (which is not color) - as long as the difference in
> lightness (contrast) is 3:1 or greater."
