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

**Judge — 4.1.2 owns NAME *identity*, NOT descriptive *quality*.** 4.1.2 requires that a name be PRESENT and
that it IDENTIFY this control (the right name, on the right element). Whether a present, correct name could be
*more descriptive / more specific* is **2.4.6's** call, not yours — do NOT flag a name for being terse, plain,
or "generic" if it nonetheless identifies the control. Failure is limited to a name that is PRESENT but
**broken**, in one of these ways ONLY:
- a **content-free placeholder / leftover** — strictly: an un-substituted template token (`{{name}}`,
  `%LABEL%`), literal markup left in, or a name that is EXACTLY a single reserved keyword with no content (the
  bare string "undefined", "null", "aria-label", "label", "role"). This is a NARROW set. A real, human-readable
  name PASSES even if it is plain, generic, or merely restates the control's type — INCLUDING a multi-word phrase
  that *mentions* the control type (a phrase that names the control is still a name, not a placeholder). 4.1.2
  asks only that the name IDENTIFY the control, not that it be specific or well-chosen (that is 2.4.6). Do NOT
  flag a present, real name as "placeholder/filler" because it sounds generic or could be more descriptive;
- a name that **describes a DIFFERENT control than the one rendered** (a "Search" name on a visibly "Menu"
  hamburger; a "Previous" name on the Next arrow) — a true mismatch with the pixels;
- an **icon-only control whose name names only the ICON** ("icon", "image", "svg", a file name) instead of the
  action it performs.

**NOT a barrier (clear these — return NOT REPRODUCED):** any name that conveys / identifies the control's
purpose, *even if terse or unspecific* — "Close", "Submit search", "Open main menu", "New file", "Menu" on a
menu, "Search" on a search field. A name that simply restates the control's evident function is adequate for
4.1.2. Reserve "could be more descriptive" for 2.4.6 and DEFER it here.

**Evidence handed to you:** the PRESENT accessible name, the `element-crop` (the control's rendered pixels —
its icon/glyph/label) and the `surrounding-region` (its context — the panel it controls, the row it sits
in), and the role/state. Judge the name AGAINST what the control evidently does in the pixels.

**Interpreting the deterministic evidence (and why it is uncertain):** read the handed `accessibleName`
signal FIRST. `accessibleName.present:true` ⇒ a name exists and your job is purely "is this name adequate".
`accessibleName.present:false` ⇒ the deterministic detector found the accessible name is EMPTY. An empty name
is a barrier **only for a role that REQUIRES a name** — an interactive widget that derives its meaning from a
name: button, link, menuitem/menuitemcheckbox/menuitemradio, checkbox, radio, switch, tab, option,
textbox/combobox/searchbox, slider, spinbutton, and the like. For those, return REPRODUCED (do not treat a
missing name as adequate). An empty name is **NOT a barrier** — return **NOT REPRODUCED** — for:
- a **CONTAINER / STRUCTURAL role whose name is OPTIONAL per ARIA**: menu, menubar, toolbar, group, list,
  listitem, navigation, region/section (when only one such region exists, with no same-role sibling to
  disambiguate), document, article, separator, presentation/none. Naming a lone `role=menu` is RECOMMENDED, not
  REQUIRED — an unnamed single menu/group/list is correct, NOT a 4.1.2 failure.
- an element **removed from the accessibility tree** (`aria-hidden=true`, an inert/`tabindex=-1` non-focusable
  container) — a missing name there is expected.
Do NOT let a "the spec recommends naming this" instinct override the rule: if the role does not REQUIRE a name
and no same-role sibling forces disambiguation, an empty name is NOT REPRODUCED. If `accessibleName.resolved:false` the name could not be resolved mechanically —
judge presence and adequacy from the pixels. CRITICAL invariant: ABSENCE OF A DETERMINISTIC FINDING IS NOT A
PASS. A "name present" signal is a PRESENCE result, not an adequacy result — never read "a name exists / no
axe finding" as "the name is adequate"; compare the name to the control's rendered purpose, and if the crop
cannot show what the control does, abstain (PARTIAL).

**When the routed concern is ARIA-attribute LEGALITY, not name adequacy.** This obligation can reach you
because an external checker flagged a **prohibited ARIA attribute** (the `external-checker cross-signal` /
`checkerHint` names a rule like `aria-prohibited-attr` — e.g. `aria-label`/`aria-*` on a `<div>`/`<p>`/`<span>`
or any element whose role does **not** support that property). That is a 4.1.2 **value/validity** failure, NOT
a name-adequacy question: judging whether the name "reads fine" is the WRONG test and will false-clear a real
barrier (this happened — a legible name on an element carrying a prohibited `aria-*` was cleared). When the
checkerHint points at ARIA legality:
- Judge whether the ARIA property is **prohibited on this element** — an `aria-*` on a generic element with no
  (or a conflicting) role, or a property its role disallows. A prohibited/invalid ARIA property is a barrier
  (AT may expose a wrong/ignored name-role-value) → **REPRODUCED**, regardless of whether the name text reads well.
- Do **NOT** clear just because the accessible name is adequate; name adequacy does not cure an illegal attribute.
- If you cannot determine the element's computed role or whether the attribute is honored, call `query_ax_node`
  (role / role source / required states / IDREF resolution) — and if still unresolved, return **PARTIAL**, never a clear.

**WCAG soundness caveats (do NOT manufacture a failure these don't support):**
- If `accessibleName.present:false` (empty name) AND the role REQUIRES a name (interactive widget, per the list
  above), REPRODUCED is correct — the absent name IS the 4.1.2 barrier. If the role is a container/structural
  role whose name is optional, or the element is removed from the a11y tree, an empty name is NOT REPRODUCED.
  When a name EXISTS, judge only its identity (present/correct/right-control), not its descriptive richness.
- A terse but purpose-conveying name is adequate — do not demand verbosity; "Close" on an X is fine.
- An `<iframe>`/`<frame>` accessible name (its `title`) is a PURPOSE SUMMARY, not a mirror of the frame's live
  DOM — do NOT flag a frame for a name-vs-content "mismatch" (a frame may legitimately be titled by its purpose
  while rendering navigation or app chrome). For a frame, only an EMPTY/placeholder name is a 4.1.2 concern here;
  whether two same-named frames serve an equivalent purpose is a separate relational check, not this rubric's.
- Judging adequacy REQUIRES seeing the control: if the `element-crop` is blank/unrendered (an SVG not
  rasterized, a canvas pre-draw, a 404'd asset) you cannot compare name-to-purpose — return PARTIAL.
- Do not judge whether the VISIBLE label text matches the programmatic name (2.5.3 owns label-in-name), nor
  alt-text equivalence for images (1.1.1), nor role/state correctness — only the name's adequacy here.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}` — summary = ONE sentence
stating the verdict; reasoning = ONE sentence giving the basis. verdict ∈ {REPRODUCED (barrier — the
present name does not adequately describe the control's purpose), NOT REPRODUCED (no barrier — the name
conveys the purpose), PARTIAL (cannot decide from the handed crops), N/A (abstain — NOT "out of scope",
that is the oracle's job)}.
