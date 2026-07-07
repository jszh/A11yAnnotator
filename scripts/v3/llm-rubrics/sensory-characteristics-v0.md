---
id: sensory-characteristics-v0
sc: 1.3.3
skill: grouping-and-reading-order
visionEvidence: [viewport]
---

# 1.3.3 — sensory characteristics (v0 atomic rubric)

**Division of labor (v3.2).** You do NOT investigate the page structurally — a REQUIREMENT-SOURCED lexicon
already flagged that this text node contains one or more **visual-reference words** (a term describing
SHAPE, SIZE, visual LOCATION/POSITION, ORIENTATION, or SOUND — e.g. "round", "large", "on the right",
"below", "tilted", "a beep"). The lexicon only decides APPLICABILITY (that a word is present); it CANNOT tell
whether the word actually IDENTIFIES web content, nor whether a non-visual alternative exists. That semantic
judgment is yours. Where a deterministic CLAIM already disposed this obligation, DEFER (there is none for
1.3.3). Colour words are OUT of scope here — colour-alone is SC 1.4.1's job, not 1.3.3's.

**Judge (follow in order — the rule PASSES as soon as any one holds; it FAILS only if none does):**

1. **Does the text give an INSTRUCTION that identifies specific web content by the visual-reference word?**
   The rule is about *understanding/operating content* — "click the button on the right", "use the menu on
   the left", "find the large image". If the visual word is NOT used to identify/locate a specific piece of
   content the user must find or operate — it is descriptive prose that merely characterizes an object rather
   than directing the user to it (a general statement about how something looks, a proper noun, a place name)
   — then there is NO barrier → **NOT REPRODUCED**. Be strict: general description ≠ an instruction
   identifying content.
2. If it IS such an instruction, the rule still PASSES when ANY of these alternatives is present (WCAG G96):
   - **non-sensory meaning:** the flagged word is being used with a NON-sensory meaning in this sentence —
     "right after this" ("right" = "immediately"), "below" = "further down in the reading order". If a
     reader who cannot perceive the visual characteristic would STILL understand the reference, it passes.
   - **non-visual reference:** the SAME content is ALSO identified, somewhere on the page, WITHOUT relying on
     the visual word — by any of:
       (a) a co-located textual cue — a label/name the instruction ITSELF also mentions (the instruction names
           the control's visible label in addition to its position/shape);
       (b) a landmark ROLE/TYPE the instruction references — an instruction that names a region by its type
           (e.g. the site navigation) is resolved when the page has EXACTLY ONE landmark of that role: a lone
           `navigation`/`main`/`search`/`complementary` landmark disambiguates the reference even if that
           landmark has NO accessible name (a bare `<nav>` has role=navigation and an EMPTY name — the ROLE
           alone suffices when it is the only landmark of its type);
       (c) a heading or accessible NAME the instruction references — a heading/accessible name whose text
           matches the content the instruction points to.
     The alternative must UNAMBIGUOUSLY point to ONE piece of content — if it could match several (e.g. a
     region-type reference on a page carrying TWO OR MORE landmarks of that role, none named), it does NOT
     identify the content → the alternative fails.
   - **visible / accessible words:** each visual word in the instruction ALSO appears in the visible text
     content OR the accessible name of the identified content (the shape/size/position word the instruction
     uses is echoed by the target control's own label, or by a heading that names that content).
3. If the text identifies content through a visual-reference word and NONE of the above alternatives is
   present, the instruction relies on a sensory characteristic alone → **REPRODUCED** (barrier).

**Evidence handed to you:** the `viewport` screenshot of the rendered page (READ the instruction and locate
the content it refers to, its headings/landmarks/labels), the page-structure signals (`__pageStructure`:
headings, landmarks, their names), and — when an external checker (IBM) flagged 1.3.3 here — its cross-signal.
The identified content MAY be on a different page or in an iframe you cannot see; judge the alternative from
what the instruction itself provides (a name/heading it references) — do not assume an alternative you cannot
confirm exists.

**Interpreting the deterministic evidence (absence ≠ pass):** this obligation reached you PRECISELY because
the deterministic lane cannot judge meaning — the lexicon confirmed a visual word is present but abstained on
whether it identifies content and whether an alternative exists. A missing signal is NOT a pass. Never infer
"no finding ⇒ an alternative must exist"; look for the alternative, and if none is present where the
instruction depends on the visual characteristic, that is the barrier.

**WCAG soundness caveats (do NOT manufacture a failure these don't support):**
- The requirement is not the ABSENCE of visual references — a visual word PLUS a non-visual way to identify
  the same content is fine. Do not flag redundant references.
- The alternative need NOT be in the accessibility tree to pass THIS rule (a purely-visual textual
  alternative satisfies 1.3.3; whether it is programmatically associated is 1.3.1's separate question).
- A word from the lexicon that is a proper noun, a place name, part of a fixed phrase, or plain description
  (not an instruction identifying content) is NOT a 1.3.3 concern → NOT REPRODUCED.
- If the page's language is not English, a lexicon word may be a false match (a homograph with no sensory
  meaning in that language) — judge in the page's language; if it carries no sensory meaning there → NOT REPRODUCED.
- If you cannot read the instruction or locate the identified content from the evidence (e.g. off-screen /
  cross-page content you cannot confirm), return PARTIAL rather than guessing.

**Output:** STRICT JSON `{verdict, confidence, summary, reasoning, evidenceRefs}` — summary = ONE sentence
stating the verdict; reasoning = ONE sentence giving the basis (name the flagged word + which condition
resolved it). verdict ∈ {REPRODUCED (barrier — a visual-reference instruction with no non-visual
alternative), NOT REPRODUCED (no barrier — not an identifying instruction, or an alternative is present),
PARTIAL (cannot decide from the handed evidence), N/A (abstain — NOT "out of scope", that is the oracle's job)}.
