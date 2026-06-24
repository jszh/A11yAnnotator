# case-02 — Tooltip library strips native `title` and re-renders an author bubble that mimics the UA tooltip: in scope, FAILS

## Scenario
A pharmacy refill-queue dashboard ("Northwind Pharmacy") shows a status help icon next to each prescription's Ready/On-hold pill. Each icon shipped from the server template with a `title` attribute. On page load, a Bootstrap/jQuery-UI-style tooltip plugin **reads the native `title`, blanks it** (`removeAttribute('title')` so the OS tooltip won't double up), and renders its **own** `<span class="nwtip">` bubble — dark gray, ~12px, small rounded corners, positioned just below — deliberately styled to look like the browser's native title tooltip. The bubble is `pointer-events:none` and is shown/hidden only on `mouseenter`/`mouseleave` of the 18px icon, with no Escape handler. Visually it is near-identical to case-01's native tooltip, but the owner is the author, so 1.4.13 applies — and it fails the hoverable + dismissible conditions.

## Attribute tuple
- **content-domain:** healthcare / pharmacy refill-management dashboard
- **UI-component / pattern:** info-icon status tooltip (APG tooltip pattern), framework plugin
- **host-language construct:** JS that strips native `title` → author `<span>` bubble with `pointer-events:none`
- **locale / i18n:** en-US
- **failure-mechanism:** author-controlled hover bubble that is not hoverable and not dismissible (F95 + missing Esc), misattributable as a native title tooltip

## Developer persona
A front-end developer themed an off-the-shelf admin template and wanted the help hints to match the brand instead of the OS gray tooltip. They dropped in the template's bundled tooltip plugin and set `title="…"` on each icon, trusting the plugin's documented behavior: "we move your title into our styled bubble." They never tested keyboard dismissal or whether a low-vision user could move the pointer onto the bubble — the plugin's defaults (`pointer-events:none`, leave-on-mouseleave, no Esc) shipped straight to production.

## Element / selector carrying the issue
`.info[data-tip]` (the help icons) and the author bubble `.info .nwtip` injected at runtime. The native `title` is removed by the init script, so at runtime the visible bubble is unambiguously the author's `.nwtip`.

## Exact accessibility mechanism (what AT experiences, why it fails)
- A sighted mouse user hovers the icon; the author gray bubble appears and looks native.
- Because the bubble is `pointer-events:none` and the only listeners are `mouseenter`/`mouseleave` on the 18px icon, moving the pointer toward the bubble to read it leaves the icon → `mouseleave` fires → the bubble disappears. **Not hoverable** (F95).
- There is no `keydown`/Escape handler and the bubble is not positioned to avoid obscuring other content, so it cannot be dismissed without moving the pointer. **Not dismissible.**
- Crucially, the appearance is author-controlled (custom `<span>`, author CSS, JS), **not** user-agent-controlled — so the UA carve-out does **not** apply and 1.4.13 **is** in scope. → FAILS.

Verified with Puppeteer: after the init script runs, `.info` has `title === null` (native stripped); the author `.nwtip` exists with `pointer-events: none` and becomes `visibility: visible` on hover.

## Expected ACT-style outcome
**failed** (SC 1.4.13 — author-controlled additional content on hover/focus that is not hoverable and not dismissible; UA-exclusion does not apply because the visible bubble is the author's `<span>`, not the browser's title rendering).

## Why automated tools miss it
At rest the icons are plain `<span>`s (the `title` has been stripped at runtime; even before stripping, a `title=` alone trips no rule). A scanner cannot determine that the gray bubble appearing on hover is an **author** `<span>` rather than the browser's native title tooltip — yet that single attribution flips the verdict from "out of scope (UA title, PASS like case-01)" to "in scope (author bubble)." And the conditions it then fails — hoverable, dismissible — are interaction-time properties that require actually hovering toward the bubble and pressing Escape, which static checkers never exercise.

## Citation
> "The intent of this condition is to ensure that additional content which may appear on hover of a target may also be hovered itself. Content which appears on hover can be difficult or impossible to perceive if a user is required to keep their mouse pointer over the trigger."
— wcag-understanding/content-on-hover-or-focus.html (Intent → Hoverable)

> "The objective of this failure is to describe a situation where users find it difficult or impossible to move the pointer over additional content that appears on hover. … as soon as the pointer is moved away from the trigger towards the pop-up content so it can be read, the pop-up automatically closes."
— wcag-techniques/failures/F95.html (Description / Examples)

> "Provide a mechanism to easily dismiss the additional content, such as by pressing Escape."
— wcag-understanding/content-on-hover-or-focus.html (Intent → Dismissible)
