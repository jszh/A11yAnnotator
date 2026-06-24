# case-07 — PASSED BOUNDARY: artifact-SHAPED title that still identifies the page (Contact)

## Scenario
A real Contact page for the Riverside branch of Cedar Hollow Veterinary Clinic: address,
clinic-hours table, a map placeholder, and a labelled contact form. Its `<title>`
deliberately wears the SAME surface texture as the failing cases — it embeds a
machine-style location slug and a release marker:
`Contact Cedar Hollow Veterinary Clinic — Riverside Branch · loc-04 (rev 2025-06)`.
The discriminator: this title ALSO contains genuinely identifying natural language, so it
PASSES 2.4.2. Same code-ish residue as cases 04–06, opposite verdict.

## Attribute tuple
- **content-domain:** local-business / healthcare (veterinary)
- **UI-component/pattern:** two-card layout (address + hours table) + labelled `<form>`
- **host-language construct:** static HTML5 with a build-stamped but descriptive title
- **locale/i18n:** en-US
- **failure-mechanism:** NONE (control) — artifact-shaped string that nonetheless
  identifies topic AND distinguishes the branch

## Developer persona
A web team appends a CMS location id (`loc-04`) and a content-release stamp
(`rev 2025-06`) to titles for internal cache-busting/analytics. Unlike the failing
cases, they kept the descriptive lead — the title still names the page's purpose and
which branch — so the artifact fragments are harmless decoration.

## Element / selector carrying the issue
`head > title` — present and descriptive; this is the control element, not a defect.

## Exact accessibility mechanism
AT users querying the title get "Contact Cedar Hollow Veterinary Clinic — Riverside
Branch …". They immediately learn the purpose (contacting the clinic) and which branch
(Riverside), distinguishing it from other location pages. The trailing "loc-04 (rev
2025-06)" is extra noise but does not erase the identifying content. The title therefore
DOES describe topic/purpose — it passes.

## Expected ACT-style outcome
**passed** — present, non-empty, and descriptive; the artifact-shaped suffix does not
make it non-identifying. This sharpens the aspect: the failure is NON-IDENTIFICATION,
not the mere presence of filename/code/version texture.

## Why automated tools miss it
Symmetry point: a checker passes this for the wrong reason (presence only) — it would
ALSO pass cases 04–06, which actually fail. Only a human evaluating MEANING can both pass
this page (identifying content present) and fail the others (identifying content absent).
The control proves the checker's pass signal is not evidence of conformance.

## Citation
> **WCAG Technique G88** (`wcag-techniques/general/G88.html`):
> "The title of each web page should: Identify the subject of the web page; Make sense
> when read out of context, for example by a screen reader or in a site map or list of
> search results; Be short"
