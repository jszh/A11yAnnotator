---
id: link-name-equivalence-v0
sc: 2.4.4
skill: name-role-state
visionEvidence: [element-crop, surrounding-region]
---

# 2.4.4 — identical-name links serve equivalent purpose (v0 relational rubric)

**Division of labor (v3.2).** `link-purpose-v0` owns the SINGLE-link question — is THIS link's purpose determinable
from its own name plus its programmatically-enclosing context? You own the ONE relational question a single-element
view structurally cannot answer: **when two or more links share the SAME accessible name, do they resolve to an
EQUIVALENT destination / purpose?** (ACT fd3a94.) You only ever receive a link that HAS a same-named peer — the
harness skips this rubric for a uniquely-named link.

**Why this is its own rubric.** A link name can be perfectly descriptive on its own ("Contact Us", "Read more about
pricing") yet still FAIL 2.4.4 when a SECOND link with the IDENTICAL name goes somewhere DIFFERENT — the user cannot
tell the two apart from the name. The single-link rubric judges each link in isolation and is structurally blind to
this divergence (it cleared fd3a94: two `aria-label="Contact Us"` links to `?page=1` vs `?page=2`, each name fine,
the SET misleading). That relational call lands HERE. Conversely, do NOT demand uniqueness for its own sake: identical
names that resolve to the SAME or an EQUIVALENT place are correct (2.4.4 requires distinguishable PURPOSE, not names).

**Evidence handed to you (`signals.sameNameLinks`):**
- `count` / `peers` — the OTHER same-named links (`{xpath, name, href}`).
- `distinctRawHrefs` — the number of DISTINCT RAW hrefs across this link AND its peers (self included). These are the
  RAW attribute values, NOT settled destinations: identical raw hrefs can still DIVERGE (redirect / meta-refresh / SPA
  route) and different raw hrefs can be EQUIVALENT (a redirect to one target, a mirror, a locale variant). So
  `distinctRawHrefs` is a SMELL, never a verdict.
- the `element-crop` (this link) + `surrounding-region` (its on-page context).

**PREFER the PRE-RESOLVED grid when present — `signals.sameNameLinks.settledDestinations`.** The harness usually
resolves the same-named set FOR you (isolated read-only GETs) and hands you a byte-EQUALITY grid: `resolvedCount` +
`equality` ({finalUrlEqual, titleEqual, h1Equal, mainFirstParagraphEqual, visibleTextEqual}, each `true`/`false`/
`null`). When this is present it is AUTHORITATIVE over the raw hrefs — you do NOT need to call the tool:
- fields MATCH (true) on title/h1/mainFirstParagraph/visibleText (or finalUrl) ⇒ the destinations are equivalent ⇒
  **NOT REPRODUCED** — even if the raw paths differ (`about/contact` vs `careers/contact` both titled "Contact").
- fields DIVERGE (false) ⇒ the settled content differs; flag **REPRODUCED** only if that reflects a different
  PURPOSE (different wording for the SAME function — "Get in touch" vs "Contact us" — is still equivalent), and the
  enclosing context does not disambiguate.
- `resolvedCount < 2` (equality `null`) ⇒ could not compare ⇒ **PARTIAL**, never a confident barrier on raw hrefs.

**If the grid is ABSENT, investigate with the tool — resolve the SETTLED destinations, do NOT decide on raw hrefs:**
- When `distinctRawHrefs` ≥ 2 (or you otherwise cannot confirm equivalence), call
  `resolve_destination(linkXpaths=[<this link + its same-named peers>])` — pass the WHOLE same-named SET in ONE call.
  It follows each SAME-ORIGIN link in an isolated read-only GET and returns a per-field byte-EQUALITY grid of the
  SETTLED destinations (finalUrl / httpStatus / title / h1 / mainFirstParagraph + redirect facts). Read the grid:
  fields that MATCH across the set ⇒ equivalent destinations; fields that DIVERGE (different title/h1/main content,
  different finalUrl that is not a redirect to the same target) ⇒ genuinely different purpose. Cross-origin / non-http
  links are refused — judge those from the crops + context or return PARTIAL.

**Decide:**
- Same-named links whose SETTLED destinations are EQUIVALENT — identical hrefs, a redirect/mirror/locale variant to
  the same content, or a shared CATEGORY purpose the name denotes — ⇒ **NOT REPRODUCED** (no barrier).
- Same-named links whose settled destinations are genuinely DIFFERENT (different pages/records/purposes) and whose
  programmatic context does NOT disambiguate them ⇒ **REPRODUCED** (a 2.4.4 barrier: the shared name misdirects).
- The same name in DIFFERENT enclosing contexts that themselves disambiguate the purpose (e.g. each link's own
  sentence/list-item/cell names its distinct subject) is NOT a barrier — the context resolves it. Judge the
  programmatic (enclosing) context, NOT mere visual proximity.
- `resolve_destination` could not run (cross-origin, fetch failed, srcdoc/JS link) OR you cannot confirm equivalence
  from the evidence ⇒ **PARTIAL**. NEVER a confident clear on raw-href equality alone, and never a confident barrier
  on differing raw hrefs alone — absence of proof of equivalence is not proof of a barrier, and vice versa.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}`. verdict ∈
{REPRODUCED (a 2.4.4 barrier — same-named links serve DIFFERENT purposes), NOT REPRODUCED (equivalent / disambiguated
by context), PARTIAL (cannot confirm equivalence from the handed evidence), N/A (abstain — NOT "out of scope")}.
