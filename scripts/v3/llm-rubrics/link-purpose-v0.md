---
id: link-purpose-v0
sc: 2.4.4
skill: name-role-state
visionEvidence: [element-crop, surrounding-region]
---

# 2.4.4 — link purpose in context (v0 atomic rubric)

**Division of labor (v3.2).** You do NOT investigate. The collector extracted the link's accessible
name and its surrounding sentence/heading/list context and screenshotted it. JUDGE whether the link's
purpose is determinable from its name (alone or with its programmatically-associated context). DEFER
where a deterministic CLAIM exists.

**Judge:** can a user tell WHERE the link goes / WHAT it does from its accessible name plus its context?
A bare "click here" / "read more" / "learn more" / "more" / "details" with no disambiguating context IS a
barrier; a link whose name (or name+context) names its destination is NOT. This applies to a `<div
role=link>` / `<span role=link>` exactly as to an `<a>` — judge the accessible name + context, not the tag.

Two failure modes:
- **Generic-in-context:** a vague name ("More", "Read more") whose surrounding sentence/heading/list still
  does not say where it goes — e.g. "More" followed only by "This product consists of several web pages"
  (ACT 5effbb). The context restates the topic but never resolves the link's DESTINATION ⇒ barrier.
- **Identical names, DIFFERENT purpose:** two or more links with the SAME accessible name in the same
  context that go to DIFFERENT destinations / serve DIFFERENT purposes (ACT fd3a94) — e.g. two "contact
  us" links, one to a chat page and one to a phone page; two "ACT rules" links to different sites. If the
  `surrounding-region` shows a sibling link with the same name pointing elsewhere, the shared name fails to
  distinguish them ⇒ barrier. (Same name to the SAME destination is fine — that is not a failure.)

**Evidence handed to you:** the accessible name, the surrounding text (`element-crop`,
`surrounding-region`), whether the name is generic, and — when present — sibling links sharing this name
with their destinations (needed to judge the identical-names mode).

**WCAG soundness caveats:**
- Context counts: a generic name disambiguated by its programmatic context (same list item, heading) is
  NOT a 2.4.4 failure — only flag when neither name nor context resolves the purpose.
- Repeated identical names going to DIFFERENT destinations is the classic failure; identical names to the
  SAME destination is fine. If you cannot see the sibling links' destinations to confirm they differ,
  return PARTIAL rather than assuming a mismatch.
- When you cannot see the destination and context is ambiguous, return PARTIAL.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}` — verdicts as in the SC
set (REPRODUCED barrier / NOT REPRODUCED no barrier / PARTIAL / N/A abstain).
