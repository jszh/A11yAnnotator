# case-01 — Pure native `title=` toolbar (UA-controlled tooltip): INAPPLICABLE / PASS by exclusion

## Scenario
An invoicing SaaS ("Ledgerline") shows a document toolbar above an invoice draft. Every toolbar button (Save, Export, Send, Duplicate) carries a plain HTML `title` attribute (e.g. `title="Save your work"`). On hover, the browser renders its own small gray tooltip bubble after the usual delay. There is **no** JavaScript on the page at all, no inline `on*` handlers, and no extra DOM under the buttons — the hover bubble is produced **entirely by the user agent**. Because the additional content's appearance is completely controlled by the user agent, SC 1.4.13 does not apply. This is the boundary anchor: the visually-similar author-built variants (case-02 … case-05) fail, but this native one is out of scope and passes by exclusion.

## Attribute tuple
- **content-domain:** invoicing / fintech SaaS dashboard
- **UI-component / pattern:** document action toolbar (`role="toolbar"`) with icon+text buttons
- **host-language construct:** native `title` attribute on `<button>` (no script)
- **locale / i18n:** en-US
- **failure-mechanism:** none present — UA-controlled tooltip carve-out → out of scope / PASS

## Developer persona
A backend-leaning full-stack developer at a small invoicing startup added quick hover hints the simplest way they knew: `title="…"` on each toolbar button. They never wrote a tooltip component or pulled in a library; they assumed (correctly) that the browser would draw the hint. They are unaware that native title tooltips are inaccessible in other ways — but for **1.4.13 specifically**, the UA carve-out means this exact construct is not governed by the criterion.

## Element / selector carrying the (non-)issue
`.toolbar button[title]` — e.g. `.tbtn.primary` with `title="Save your work"`. The hover bubble is the browser's rendering of these attributes; there is no author popup element anywhere.

## Exact accessibility mechanism (what AT experiences, why it is out of scope)
- A sighted mouse user hovers a button and the browser shows a native gray tooltip with the title text.
- That native tooltip is itself famously not hoverable, not dismissible-without-moving-the-pointer, and not persistent — exactly the behaviors 1.4.13 was written about. **But** 1.4.13 explicitly excludes content whose appearance is "completely controlled by the user agent," naming the browser rendering of the `title` attribute as the prominent example.
- F95's test condition #2 is "The appearance of the additional content is controlled by the user agent, not the author." Here it **is** controlled by the user agent, so the failure does not apply.
- Correct disposition: **INAPPLICABLE → PASS by exclusion** for 1.4.13. (The page may have other issues under 4.1.2 / 1.1.1 for relying on `title`, but those are different criteria and out of scope for this aspect.)

Verified with Puppeteer: the page contains **0** `<script>` tags and **0** inline `on*` handlers; the Save button's `title` is `"Save your work"`; there is no author bubble element in the DOM. The hover bubble is the UA's.

## Expected ACT-style outcome
**passed** (SC 1.4.13 — additional content is completely user-agent-controlled (native `title` tooltip); the criterion does not apply, so the page does not fail it).

## Why automated tools miss it
A scanner sees `title=` attributes and, on hover, a tooltip bubble appears — superficially "content on hover." A naive rule (or reviewer) could flag this for 1.4.13 because native title tooltips are not hoverable/dismissible/persistent. The judgment a tool cannot make is the **attribution**: that this bubble is rendered by the user agent (no author script/DOM), which triggers the explicit UA-exclusion and makes the criterion inapplicable. Distinguishing "UA-rendered title tooltip (out of scope)" from "author bubble dressed to look native (in scope)" requires reasoning about who controls the appearance — exactly what separates this PASS from case-02's FAIL.

## Citation
> "This criterion does not attempt to solve such issues when the appearance of the additional content is completely controlled by the user agent. A prominent example is the common behavior of browsers to display the `title` attribute in HTML as a small tooltip."
— wcag-understanding/content-on-hover-or-focus.html (Intent → Additional Notes)

> "2. The appearance of the additional content is controlled by the user agent, not the author."
— wcag-techniques/failures/F95.html (Tests → Procedure, condition #2)

> "Not applicable: If any requirement precondition is false or the web page does not contain content relevant to WCAG 2.2 Success Criterion 1.4.13 Content on Hover or Focus. (Do not need to meet or test)"
— docs/analysis/en301549/EN301549-ANNEX-C-RELEVANT-CLAUSES.md (C.9.1.4.13 — Result)
