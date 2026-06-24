# case-03 — Autosave "Saved" conveyed only by a CSS ::after checkmark glyph inside aria-live="polite"

## Scenario
A CivicEdit CMS page editor for a municipal site ("Editing: Hours & Locations"). A small autosave
indicator in the top bar is a real `aria-live="polite"` region, present at load with the text "Draft".
On **Save**, it briefly shows "Saving" then the saved state. In the saved state the developer *clears*
the DOM text and conveys success purely through a CSS rule: `.savestate.saved::after { content: "\2713" }`,
which paints a green U+2713 check mark via generated content.

## Attribute tuple
- **content-domain:** government / civic CMS page editor
- **UI-component/pattern:** rich-text editor with autosave state indicator (dynamic-state: optimistic/autosave)
- **host-language construct:** CSS `::after { content }` generated glyph driven by a class change, inside `aria-live="polite"`
- **locale/i18n:** en
- **failure-mechanism:** status carried by CSS-generated content (not DOM text); live region present but its programmatic text becomes empty on success

## Developer persona
A back-end-leaning full-stack dev themeing an open-source CMS. They wired the autosave live region
correctly and even used `aria-atomic="true"`. For the visual polish they followed a popular CSS pattern
("use `::after` content for status icons so you don't ship extra `<img>`s"), setting the check via
`content: "\2713"`. They cleared the DOM text on save so the check sits alone. Because the page *looked*
right and the live region was "there," they assumed AT was covered — unaware that pseudo-element content
generally does not reach the accessibility tree as live-region text.

## Element / selector carrying the issue
`#saveState[aria-live="polite"].savestate.saved` whose only "Saved" signal is the rule
`.savestate.saved::after { content: " \2713" }`. The element's DOM `textContent` is set to `""` on save.

## Exact accessibility mechanism (what AT experiences, why it fails)
When Save completes, the live region's class flips to `.saved` and its `textContent` is emptied. The
visual check mark is produced entirely by CSS `::after` generated content. In the dominant browser/screen-reader
combinations, CSS-generated content is not exposed as the live region's announced text (and a class-attribute
mutation with empty text content gives a polite region nothing to speak). So the screen reader user, who
saw "Draft" then "Saving," never hears "Saved" — they are left unsure whether their edits to the City
Hall hours persisted. A sighted editor sees the green check immediately. The fix is text: set
`textContent = "Saved"` (optionally plus a labeled icon), which makes the present live region announce
the state — deliberately not done here.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
There is no `<img>` and therefore no missing/empty `alt` for a linter to catch — the glyph is a
pseudo-element. The live region is valid and present at load (F103 / live-region seeds PASS), and
class-driven `::after` content is an entirely well-formed, common CSS pattern that triggers no rule in
axe/WAVE/Lighthouse. Detecting this failure requires knowing that CSS generated content is not reliably
surfaced as live-region text *and* recognizing that the green check is the save status the user needed —
both human/visual judgments outside any static or rule-based scan.

## Citation
> **WCAG 2.2 Understanding 4.1.3 (Non-textual status content), `wcag-understanding/status-messages.html`:**
> "Changes in content are not restricted to text changes. Where an icon or sound indicates a status
> message, this information will be surfaced by the screen reader through a combination of two things:
> 1) existing WCAG requirements governing text alternatives (under Success Criterion 1.1.1 Non-Text
> Content), and 2) the requirement of this current success criterion to supply an appropriate role."

> **WCAG 2.2 Understanding 4.1.3 (In brief), `wcag-understanding/status-messages.html`:**
> "Goal: Make users aware of important changes in content. What to do: Let assistive technology notify
> users about status changes that don't take focus."

(The save-success change is an important status the user must be made aware of; conveyed only via a CSS
glyph with no AT-visible text, the present live region notifies no one.)
