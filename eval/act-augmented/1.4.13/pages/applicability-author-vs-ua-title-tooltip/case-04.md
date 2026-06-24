# case-04 — Two visually identical `<abbr>` expansions: one native `title=` (PASS by exclusion), one scripted author bubble (in scope, FAILS)

## Scenario
A newspaper economics article ("The Tidewater Review") uses dotted-underline abbreviations. **FOMC** and **bps** are plain `<abbr title="…">`: on hover the browser renders the title expansion natively (UA-controlled → out of scope, PASS). **GDP** looks identical (same dotted underline) but is an `<abbr class="gloss">` wrapping a `<span class="bub">` author tooltip that JS reveals on hover/focus as a styled footnote bubble. The author bubble is `pointer-events:none` and has no Escape handler. Two abbreviations, same visual treatment, **different owners**: only the GDP one is governed by 1.4.13, and it fails. This page forces a **per-element attribution** judgment.

## Attribute tuple
- **content-domain:** news / long-form editorial (economics)
- **UI-component / pattern:** abbreviation glossary tooltip (mixed: native `<abbr title>` vs scripted author tooltip)
- **host-language construct:** native `<abbr title>` alongside `<abbr>` + nested `<span>` bubble driven by JS
- **locale / i18n:** en-US
- **failure-mechanism:** author tooltip not hoverable / not dismissible (F95 + no Esc), sitting next to a native one that is out of scope — attribution must be done element-by-element

## Developer persona
A CMS author marked up most abbreviations with the standard `<abbr title>` glossary helper. For the "explainer series," an editor asked for a richer, branded footnote-style popup on the key term, so a developer built a small `.gloss` tooltip component and applied it to **GDP** only. The two now look the same on the page, and nobody noticed that the upgraded component dropped the hoverable/dismissible behaviors the native `title` never needed to provide (because the native one is out of scope).

## Element / selector carrying the issue
`.gloss` (the GDP abbreviation) and its author bubble `.gloss .bub#gdp-bub`. The native `<abbr title>` elements (FOMC, bps) are **not** the issue — they are the out-of-scope control.

## Exact accessibility mechanism (what AT experiences, why the split verdict)
- **FOMC / bps** (`<abbr title>`): hover shows the browser's native tooltip. UA-controlled appearance → 1.4.13 does **not** apply → **PASS by exclusion**.
- **GDP** (`.gloss` + `.bub`): hover/focus reveals an author `<span>` bubble. It is `pointer-events:none` and only toggles on the abbreviation's `mouseenter`/`mouseleave` (and focus/blur), with no Escape handler. Moving the pointer toward the bubble leaves the trigger → bubble closes (**not hoverable**, F95); no keyboard dismiss (**not dismissible**). Author-controlled appearance → 1.4.13 **applies** → **FAILS**.
- The reviewer must attribute each bubble to its owner: the same dotted-underline visual hides two different applicability outcomes.

Verified with Puppeteer: the FOMC `<abbr>` has `title="Federal Open Market Committee"`; the GDP `.gloss` has **no** `title` attribute but contains an author `.bub` that becomes `visibility: visible` on hover.

## Expected ACT-style outcome
**failed** (SC 1.4.13 — the GDP author tooltip is author-controlled hover/focus content that is not hoverable and not dismissible; the adjacent native `<abbr title>` tooltips are out of scope and pass by exclusion, so the page as a whole fails on the GDP element).

## Why automated tools miss it
A scanner sees two `<abbr>` elements that look the same and no rule fires for either. It cannot reason that FOMC's hover bubble is the browser's `title` rendering (out of scope, PASS) while GDP's is an author `<span>` driven by JS (in scope, failing hoverable/dismissible). The per-element attribution of **who renders each bubble**, plus the interaction-time test of whether the author bubble can be hovered into or dismissed, are precisely the human judgments static tools cannot perform.

## Citation
> "This criterion does not attempt to solve such issues when the appearance of the additional content is completely controlled by the user agent. A prominent example is the common behavior of browsers to display the `title` attribute in HTML as a small tooltip."
— wcag-understanding/content-on-hover-or-focus.html (Intent → Additional Notes)

> "Examples of such interactions can include custom tooltips, sub-menus and other non-modal popups which display on hover and focus."
— wcag-understanding/content-on-hover-or-focus.html (Intent)

> "The appearance of the additional content is controlled by the user agent, not the author."
— wcag-techniques/failures/F95.html (Tests → Procedure, condition #2)
