# case-04 — Government portal: many accordions/links out of scope; ONE feedback textarea is the sole 3.3.2 failure (DISCRIMINATOR)

## Scenario
A city "Residential parking permits" page. It is dense with non-data-entry controls: four "jump to section" anchor links, five expand/collapse policy accordions (real `aria-expanded` show/hide), breadcrumb links, a "Language" menu-button opening a menu of language links, and a "Back to top" link. All of those are links/disclosure widgets, which 3.3.2 does not apply to. There is **exactly one** genuine data-entry control: a free-text feedback `<textarea>` ("Was this page helpful?"). It has `aria-label="Feedback"` — so it has a *programmatic* accessible name (axe/4.1.2 pass) — but it carries **no visible label and no visible instruction**; the only on-screen cue is a placeholder ("Type your comments...") that disappears on input. That single field **fails** 3.3.2. The correct evaluation is surgical: fail the textarea only; leave every link and accordion alone.

## Attribute tuple
- **content-domain:** government / civic services portal
- **UI-component / pattern:** accordion (×5) + in-page anchor TOC + breadcrumb + language menu-button + ONE feedback textarea
- **host-language construct:** `<button aria-expanded>` disclosures, `<a href="#...">` anchors, a `<textarea aria-label>` with placeholder-only visible cue
- **locale / i18n:** en-US with a language switcher to es/zh/vi
- **failure-mechanism:** the one in-scope field has a programmatic name (aria-label) but **no visible label/instruction** — placeholder-only, which vanishes on input

## Developer persona
A civic-CMS author followed the agency's accessibility checklist literally: "every input must have an accessible name," so they added `aria-label="Feedback"` to the textarea and moved on — the automated scan went green. They never added a visible label/instruction because the placeholder "looked like enough." Meanwhile the accordions and TOC links are template components they (correctly) never treated as form fields. The page therefore baits two opposite mistakes: over-flagging the accordions/links, and under-flagging the placeholder-only textarea that an attribute-checker passes.

## Element / selector carrying the issue
**Failing (in scope):** `.feedback textarea[aria-label="Feedback"]` — no visible `<label>`, no visible instruction; placeholder-only cue that disappears on input.
**Out of scope (must NOT be flagged):** `.acc button` (×5 accordions), `.toc a` (×4 jump links), `nav.crumbs a`, `#langBtn` + language menu links, `.backtop`.

## Exact accessibility mechanism (what AT experiences / why the one field fails)
- **Screen-reader user, textarea:** hears "Feedback, edit, blank" — the `aria-label` gives them a name. But a sighted user with a cognitive or learning disability sees only grey placeholder text that **disappears the moment they start typing**, leaving no persistent label or instruction. 3.3.2 requires the label/instruction be "presented to all users, not just those using assistive technologies"; a placeholder is not a reliable visible label. So the field lacks a conforming visible label/instruction → fail.
- **Screen-reader user, accordions:** each is "Who is eligible?, button, collapsed" toggling to "expanded." Disclosure widgets — out of scope; demanding an instruction for them would be a false positive.
- **Keyboard user:** Tab reaches the accordions (Enter/Space toggles), the TOC/breadcrumb/language links, and the textarea (typeable). Only the textarea is a data-entry control.
- Net: one in-scope field, visibly uninstructed; everything else out of scope. **Fail — on that field alone.**

## Expected ACT-style outcome
**failed** (SC 3.3.2 — the page's single data-entry control, the feedback textarea, has no visible label or instruction presented to all users; a placeholder that vanishes on input does not satisfy the SC. The accordions, jump links, breadcrumb, and language menu are not data-entry controls and are out of scope).

## Why automated tools miss it
The textarea **has** an accessible name (`aria-label="Feedback"`), so axe's "form elements must have labels" and 4.1.2 checks PASS — no automated tool flags it. Detecting the 3.3.2 failure requires two human/model judgments no checker makes: (1) that a placeholder-only cue is not a *visible* label/instruction presented to all users because it disappears on input (the Understanding doc separates 3.3.2's "presented to all users" requirement from 4.1.2's programmatic name); and (2) that the failure is confined to this one data-entry control while the surrounding accordions and links are out of scope and must not be flagged. An attribute linter sees a named field and stops; a scope-blind evaluator over-flags the widgets. Only contextual reasoning isolates the single correct failure.

## Citation
> "Further, this success criterion does not take into consideration whether or not alternative methods of providing an accessible name or description for form controls and inputs has been used — that aspect is covered separately by 4.1.2 Name, Role, Value. It is possible for controls and inputs to have an appropriate accessible name or description (e.g. using aria-label="...") and therefore pass Success Criterion 4.1.2, but to still fail this success criterion (if the labels or instructions aren't presented to all users, not just those using assistive technologies)."
— wcag-understanding/labels-or-instructions.html (Intent)

> "This success criterion does not apply to links or other controls (such as an expand/collapse widget, or similar interactive components) that are not associated with data entry."
— wcag-understanding/labels-or-instructions.html (Intent) — the accordions/links are out of scope.

> "Determine if each form element provides visual labels or instructions. ... The label or instruction must be visible when the form field has focus."
— refs/trusted-tester/sc-3.3.2-labels-or-instructions.md (How to Test / Notes) — a placeholder is not visible once the user types into the focused field.
