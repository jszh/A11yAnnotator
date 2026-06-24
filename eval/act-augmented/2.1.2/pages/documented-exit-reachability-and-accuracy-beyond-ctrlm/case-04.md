# case-04 — Two trapping regions; region A's advice describes region B's escape keystroke (FAIL)

## Scenario
A patient-portal "Care Plan Builder" shows two side-by-side medication-reconciliation panels: *Morning*
(region A) and *Evening* (region B). Each panel loops focus internally so a user reconciles its doses
before moving on, and each has a real, working custom exit — **region A escapes on Ctrl+J**, **region B on
Ctrl+K**. Both panels display visually identical help text: "To move focus out, press Ctrl+K." That advice
is correct for region B but **wrong for region A**: a user trapped in the Morning panel who follows the
Morning panel's own instruction (Ctrl+K) stays trapped, because A actually releases on Ctrl+J. The advice in
A is present, on-screen, reachable, and even names a real shortcut that works *elsewhere on the page* — it
just documents the wrong region's escape.

## Attribute tuple
- **Content domain:** healthcare / patient portal (medication reconciliation)
- **UI component / pattern:** two parallel focus-trapping editor panels (multi-region layout)
- **Host-language construct:** two independent `focus`/`blur` loops; per-region `keydown` (`Ctrl+J` vs `Ctrl+K`)
- **Locale / i18n:** en-US, clinical dosage content
- **Failure mechanism:** advice inaccurate by RELATION — region A documents region B's keystroke (cross-region mismatch)

## Developer persona
The team built the Evening panel first (escape Ctrl+K), wrote its help sentence, then **duplicated the whole
panel** to create the Morning panel — copying the markup *and* the "press Ctrl+K" help text verbatim. When
they later remapped Morning's escape to Ctrl+J (to avoid a collision with a global Ctrl+K command palette),
they updated the handler but forgot the copied help sentence still said Ctrl+K. Each panel works in
isolation, so per-panel testing of the *handler* passed; nobody re-read Morning's prose against Morning's
key.

## Element / selector carrying the issue
`#regionA .help` (text "press Ctrl+K") versus region A's actual escape handler, wired to **Ctrl+J**. The
isolated defect is the advice/escape pairing for region A; region B's advice (Ctrl+K) correctly matches its
handler.

## Exact accessibility mechanism
Each region sets `trapOn` on focus and re-focuses its first field on blur, looping focus. Region A's keydown
releases on `Ctrl+J`; region B's on `Ctrl+K`. AT/keyboard experience inside the Morning panel: the user
reads "press Ctrl+K," presses it, and remains trapped (verified: after Ctrl+K, focus is still on "Morning
med 1"); pressing the *undocumented-for-A* Ctrl+J escapes to the Save button (verified). The advice in A is
thus inaccurate for A even though the same string is correct for B. G21 requires documenting the feature
that exits **this** subset, not a neighbouring one.

## Expected ACT-style outcome
**failed** (SC 2.1.2 — region A is trapped and the keystroke documented within region A does not move focus
out of region A; the working keystroke for A is never disclosed in A).

## Why automated tools miss it
Both panels are well-formed: inputs have `aria-label`s, the help text is real visible content (using
`<kbd>`), and *both* documented shortcuts (Ctrl+J, Ctrl+K) are genuinely wired and working somewhere on the
page — so there is no missing instruction and no dead key for a scanner to find. The defect is purely
relational: A documents B's keystroke. No static tool models "which trap does this sentence belong to," so
detecting a per-region advice/escape mismatch requires reading each panel's prose, discovering each region's
real escape by keyboard, and cross-matching the two.

## Citation
**Reference:** WCAG Trusted Tester v5.1.3 — SC 2.1.2 No Keyboard Trap, Evaluate Results (`refs/trusted-tester/sc-2.1.2-no-keyboard-trap.md`)
> "Keyboard focus can be moved away from each section of the page containing elements (not trapped in a \"loop\" preventing access to other elements) using either standard navigation keys OR documented custom keystrokes."

**Reference:** WCAG Technique G21 — Ensuring that users are not trapped in content (`wcag-techniques/general/G21.html`)
> "Providing a keyboard function to move the focus out of the subset of the content. Be sure to document the feature in an accessible manner within the subset."
