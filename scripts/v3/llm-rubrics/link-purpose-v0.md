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

**What "context" means for 2.4.4 (read carefully — this is where false-clears happen).** Per WCAG, the only
context that counts is **programmatically-determined / ENCLOSING** context: the link's own accessible name PLUS
text in the same enclosing sentence/paragraph, the same list item, the same table cell (or its row/column
header), or content programmatically associated via `aria-describedby`/`aria-labelledby`. A heading, label, or
styled paragraph that merely sits **visually near or above** the link but is **NOT an ancestor of the link** is
NOT programmatic context and does NOT resolve the purpose. The classic false-clear: a list of links whose names
are only file formats, sitting under a styled paragraph that names the subject — but that subject paragraph is
a *preceding sibling*, not an ancestor of each link, so the purpose is NOT determinable in context ⇒ **barrier**.
Do not credit a non-enclosing heading/paragraph as if it disambiguated the link.

**OPERATIONAL TEST (apply literally).** The enclosing context is the text INSIDE THE SAME paragraph / list-item /
table-cell element that CONTAINS the link. If the link sits alone in its own block (e.g. `<p><a>…</a></p>`, or a
table cell holding only the link) and the descriptive text is in a SEPARATE, preceding paragraph / sibling cell,
that text is **NOT** enclosing — the link's only context is its own name. A sibling data cell (`<td>`) is not
the link's cell and is not a header cell, so it does not count either. Do not treat a preceding-sibling sentence
as if it were the link's enclosing sentence just because it is the nearest prose in reading order.

**`signals.enclosingContext` is the DETERMINISTIC enclosing-block text — TRUST it; do not re-derive the enclosing
context from the crop.** The collector already walked THIS link's ANCESTOR chain (its enclosing `<li>`/`<td>`/`<p>`/
heading and every enclosing block up the nesting) and extracted the text of the block(s) that CONTAIN it, with all
link text stripped — that is precisely the programmatically-enclosing context defined above. Read
`enclosingContext.blockText`:
- **`blockText` NON-EMPTY ⇒ that string IS the link's enclosing context.** If it names the subject/destination
  (e.g. name `"EPUB"` with `blockText:"Ulysses"`, or name `"Download"` with `blockText:"the annual report"`), the
  purpose is RESOLVED by context ⇒ **NOT REPRODUCED**. Do NOT claim "no subject text in the list item", "no
  enclosing context", or "the link sits alone" when `blockText` is non-empty — that contradicts the signal.
  This INCLUDES the text of an ANCESTOR list-item / cell the link is NESTED inside: for
  `<li>Ulysses<ul><li><a>EPUB</a></li></ul></li>`, "Ulysses" IS the EPUB link's enclosing context because the link
  is nested WITHIN that `<li>` (a nested sub-list does not sever the enclosure). The collector already walked the
  FULL ancestor chain, so a non-empty `blockText` is programmatically-enclosing context BY CONSTRUCTION — do NOT
  reject it as "ancestor / sibling text, not the same list item." (The only thing excluded is a PRECEDING-SIBLING
  block the link is NOT nested inside — and the collector never puts that in `blockText`, so if you see it in
  `blockText`, the link IS enclosed by it.)
- **`enclosingContext.linkAloneInBlock:true` (empty `blockText`) ⇒ the link IS alone in its block** — its only
  context is its own name, so the format-only / action-only failure below applies if the name does not name the
  destination.
- **`blockText:null` / absent ⇒ the link is not inside any enclosing block** — again its only context is its name.
When the `surrounding-region` crop and `blockText` seem to disagree (the crop may not have framed a nested ancestor's
text), the deterministic `blockText` is AUTHORITATIVE for what ENCLOSES the link.

Three failure modes:
- **Format-only / action-only name:** a name that states only a FORMAT (a file-format token) or a bare
  ACTION ("Download", "Read more", "More", "Details") whose ENCLOSING context does not name the destination
  subject ⇒ barrier. (If the enclosing sentence/list-item itself names the subject — e.g. "Download the annual
  report" — that is fine.)
- **Generic-in-context:** a vague name ("More", "Read more") whose enclosing sentence/list item still does not
  say where it goes — the context restates the topic but never resolves the link's DESTINATION ⇒ barrier.
- **Identical names, DIFFERENT purpose:** two or more links with the SAME accessible name in the same
  context that go to DIFFERENT destinations / serve DIFFERENT purposes — e.g. two same-named links pointing to
  unrelated pages. If the `surrounding-region` (or the handed sibling-link list) shows a same-named link
  pointing elsewhere, the shared name fails to distinguish them ⇒ barrier. (Same name to the SAME destination
  is fine — not a failure.)

**Evidence handed to you:** the accessible name, the surrounding text (`element-crop`,
`surrounding-region`), whether the name is generic, and — when present — sibling links sharing this name
with their destinations (needed to judge the identical-names mode).

**WCAG soundness caveats:**
- Context counts: a generic name disambiguated by its programmatic context (same list item, heading) is
  NOT a 2.4.4 failure — only flag when neither name nor context resolves the purpose.
- **A SELF-REFERENTIAL phrase whose referent the enclosing context fixes is determinable — do NOT demand the
  name restate the subject.** "See the description of this product", "Read this page", "this article" — when the
  enclosing sentence / list-item / the page's evident single subject establishes WHICH product/page/article it
  refers to, the purpose IS determinable (the reader follows the reference) ⇒ **NOT REPRODUCED**. Do not flag such
  a link merely because the name alone does not NAME the subject; 2.4.4 is satisfied by name-PLUS-context, and a
  resolvable "this X" reference is context-resolved. Flag it only when the context does NOT fix the referent
  (several products in scope, no enclosing subject).
- Repeated identical names going to DIFFERENT destinations is the classic failure; identical names to the
  SAME destination is fine. If you cannot see the sibling links' destinations to confirm they differ,
  return PARTIAL rather than assuming a mismatch.
- When you cannot see the destination and context is ambiguous, return PARTIAL.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}` — verdicts as in the SC
set (REPRODUCED barrier / NOT REPRODUCED no barrier / PARTIAL / N/A abstain).
