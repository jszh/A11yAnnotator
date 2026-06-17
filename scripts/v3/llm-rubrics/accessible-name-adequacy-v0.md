---
id: accessible-name-adequacy-v0
sc: 4.1.2
skill: name-role-state
visionEvidence: [element-crop, surrounding-region]
---

# 4.1.2 — accessible name adequacy (v0 atomic rubric)

**Division of labor (v3.2).** You do NOT investigate the page and you do NOT decide whether a name EXISTS.
Name-PRESENCE is already owned: the deterministic ax-name-presence detector decided whether the control has
an accessible name, and the surfaced axe name family (e.g. button-name / link-name / input-image-alt)
already fails the NO-NAME cases. Those never reach you. You are handed only obligations where a name is
PRESENT but a checker cannot tell whether it is ADEQUATE — whether the name actually describes the
control's purpose (ARIA14/ARIA16). Where a deterministic CLAIM already disposed this obligation, DEFER.
This rubric owns ONLY adequacy of a name that exists; it is NOT alt-text (1.1.1) and NOT label-in-name
matching (2.5.3 owns visible-vs-programmatic agreement).

**Judge:** does the PRESENT accessible name let a non-sighted user understand what this control DOES /
where it goes — does the name match the control's evident purpose in the rendered UI? Failure looks like a
name that exists but is uninformative or wrong: a generic name ("button", "link", "click", "untitled") on a
control whose purpose is specific; an icon-only control whose name names the icon ("icon", "image") rather
than the action; a name that describes a DIFFERENT control than the one rendered (a "Search" name on a
visibly "Menu" hamburger); a name that is a leftover/placeholder. NOT a barrier: a name that conveys the
control's purpose, even if terse ("Close", "Submit search", "Open main menu").

**Evidence handed to you:** the PRESENT accessible name, the `element-crop` (the control's rendered pixels —
its icon/glyph/label) and the `surrounding-region` (its context — the panel it controls, the row it sits
in), and the role/state. Judge the name AGAINST what the control evidently does in the pixels.

**Interpreting the deterministic evidence (and why it is uncertain):** read the handed `accessibleName`
signal FIRST. `accessibleName.present:true` ⇒ a name exists and your job is purely "is this name adequate".
`accessibleName.present:false` ⇒ the deterministic detector found the accessible name is EMPTY — and because
that detector is a NON-AUTHORITATIVE shadow signal (it does not itself dispose the obligation), the empty-name
case routes to YOU; in that case the name is ABSENT, which is the barrier — return REPRODUCED (do not treat a
missing name as adequate). If `accessibleName.resolved:false` the name could not be resolved mechanically —
judge presence and adequacy from the pixels. CRITICAL invariant: ABSENCE OF A DETERMINISTIC FINDING IS NOT A
PASS. A "name present" signal is a PRESENCE result, not an adequacy result — never read "a name exists / no
axe finding" as "the name is adequate"; compare the name to the control's rendered purpose, and if the crop
cannot show what the control does, abstain (PARTIAL).

**WCAG soundness caveats (do NOT manufacture a failure these don't support):**
- If `accessibleName.present:false` (empty name), REPRODUCED is correct — the absent name IS the 4.1.2
  barrier. Otherwise judge adequacy of the name that EXISTS; a terse purpose-conveying name is adequate.
- A terse but purpose-conveying name is adequate — do not demand verbosity; "Close" on an X is fine.
- Judging adequacy REQUIRES seeing the control: if the `element-crop` is blank/unrendered (an SVG not
  rasterized, a canvas pre-draw, a 404'd asset) you cannot compare name-to-purpose — return PARTIAL.
- Do not judge whether the VISIBLE label text matches the programmatic name (2.5.3 owns label-in-name), nor
  alt-text equivalence for images (1.1.1), nor role/state correctness — only the name's adequacy here.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}` — summary = ONE sentence
stating the verdict; reasoning = ONE sentence giving the basis. verdict ∈ {REPRODUCED (barrier — the
present name does not adequately describe the control's purpose), NOT REPRODUCED (no barrier — the name
conveys the purpose), PARTIAL (cannot decide from the handed crops), N/A (abstain — NOT "out of scope",
that is the oracle's job)}.
