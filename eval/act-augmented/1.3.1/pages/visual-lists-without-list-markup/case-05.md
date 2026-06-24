# case-05 — Incident runbook: real `<ol>` ordered steps suppressed by `role="presentation"`

## Scenario
A Sev-2 incident runbook ("Recover from a stuck reflow worker") presents a four-step recovery procedure, visibly numbered 1–4, with two explicit cues that order is mandatory ("Run these steps **in order**…" and a warning that resuming intake before the dead-letter replay duplicates jobs). The markup is a genuine `<ol class="runbook">` with four `<li>` children — so the numbered ordinals are real list markers. But the author added `role="presentation"` to the `<ol>` and `role="none"` to every `<li>`, which strips the list/listitem semantics from the accessibility tree. The visible numbers remain; the *ordered-list relationship and type* are gone.

## Attribute tuple
- **content-domain:** developer / SRE incident-response runbook (internal tooling)
- **UI-component / pattern:** numbered ordered procedure / step-by-step recovery checklist
- **host-language construct:** a real `<ol>`/`<li>` whose semantics are suppressed by `role="presentation"` (on the `<ol>`) and `role="none"` (on each `<li>`)
- **locale / i18n:** en-US
- **failure-mechanism:** ARIA anti-pattern — `role="presentation"`/`role="none"` applied to semantic list elements removes the list/listitem roles, so a visually ordered list is not programmatically identified as a list of its type (F92 + TT 10.D, type = ordered)

## Developer persona
A backend engineer wrote the runbook page and used a proper `<ol>` for the steps. While styling it they hit the default list spacing and half-remembered an ARIA tip as "add `role=presentation` so it isn't announced as a list." They applied `role="presentation"` to the `<ol>` and `role="none"` to the `<li>`s to "let CSS own the look." It rendered identically, so nobody noticed the list semantics — and the ordered relationship — had been deleted from the accessibility tree.

## Element / selector carrying the issue
`ol.runbook[role="presentation"]` and its four `li[role="none"]` children.

## Exact accessibility mechanism (what AT experiences, why it fails)
- A sighted user sees badges numbered 1–4, reads "in order," and understands a mandatory four-step sequence.
- A screen reader does **not** announce "list, 4 items," offers no list-navigation commands, and reports no positional/ordinal semantics ("1 of 4", "2 of 4") — because `role="presentation"`/`role="none"` suppress the `list` and `listitem` roles from the accessibility API. The page collapses to a run of generic blocks and paragraphs.
- The visible ordinals are **not** what is lost: the `<ol>` markers 1–4 still surface in the accessibility tree as text content, so the digits are still spoken. What is destroyed is the *ordered-list relationship and type* — the programmatic signal that these are sequenced items 1–4 of a single ordered list whose order matters.
- Per TT 10.D, a visually apparent ordered list must be programmatically identified as a list of the ordered type; suppressing the list/listitem roles leaves no programmatic list of any type → fail. This is exactly the F92 pattern (presentation role on content that conveys relationships).

Verified with Puppeteer: the DOM has 1 `<ol>` + 4 `<li>` (with `role="presentation"` ×1, `role="none"` ×4); the rendered accessibility tree contains **no** `list` and **no** `listitem` roles, while the ordinal names "1"–"4" are still present as text nodes and the screenshot shows a numbered 1–4 ordered procedure.

## Expected ACT-style outcome
**failed** (SC 1.3.1 — a visually apparent ordered list has its list/listitem semantics suppressed by `role="presentation"`/`role="none"`, so it is not programmatically identified as a list of its type; F92, TT 10.D, type = ordered).

## Why automated tools miss it
`role="presentation"` and `role="none"` are valid ARIA values and pass HTML/ARIA validity checks; axe/WAVE/Lighthouse have no rule asserting "this numbered, order-critical procedure should retain its `<ol>` semantics." Because the `<ol>` markup is itself correct and the ordinals are present, a tool sees a well-formed page. Concluding that the rendered numbered steps constitute an ordered list whose programmatic list relationship has been deliberately suppressed — and that this loses meaning the visuals convey — requires human visual and semantic judgment that static rules cannot perform.

## Citation
> "This failure occurs when a role of presentation is applied to an element whose purpose is to convey information or relationships in the content."
— wcag-techniques/failures/F92.html (Description)

> "The WAI-ARIA role of `presentation` … is intended to suppress semantic information of content from the accessibility API and prevent user agents from conveying that information to the user."
— wcag-techniques/failures/F92.html (Description)

> "1. All content with the visual appearance of a list is defined programmatically as a list, by type:
>    a. Unordered list (with/without bullets) → `ul`; b. Ordered list → `ol`; c. Terms+descriptions → `dl`."
— refs/trusted-tester/sc-1.3.1-info-and-relationships.md (Test 10.D — Evaluate Results)

> "The intent of this success criterion is to ensure that information and relationships that are implied by visual or auditory formatting are preserved when the presentation format changes."
— wcag-understanding/info-and-relationships.html (Intent of Info and Relationships)
