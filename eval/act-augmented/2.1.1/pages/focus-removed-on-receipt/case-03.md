# case-03 — Page-wide `focusin` handler yanks focus back to the masthead logo on every press

## Scenario
A newspaper article page ("The Meridian Dispatch"). A "sticky brand" growth experiment added a document-level `focusin` listener that re-focuses the masthead logo (`#brandLogo`) on every focus change, "so the brand is always the anchor of attention." The exclusion guard meant to skip the logo itself compares the wrong property and never excludes anything. RESULT: every Tab to a section-nav link, an article-tool button (Share/Save/Comment/Print), the newsletter email field, or an in-article link instantly snaps focus back to the logo. The whole page is effectively frozen at the masthead for keyboard users.

## Attribute tuple
- **content-domain:** news / online newspaper article
- **UI-component / pattern:** sticky masthead + section nav + in-article tool buttons + inline newsletter field
- **host-language construct:** `document.addEventListener('focusin', …)` (page-wide capture of all focus events) that calls `logo.focus()`
- **locale / i18n:** en-US
- **failure-mechanism:** F55 variant — global focus-event handler relocates focus to a fixed element (the logo) whenever ANY downstream control receives focus

## Developer persona
A junior developer on a growth team was asked to make the logo "always reachable so readers can jump home." Instead of a skip link, they wrote a global `focusin` listener that re-focuses the logo, with a guard `if (e.tabIndex === logo) return;`. `e` is a `FocusEvent` (no `tabIndex` property; they meant `e.target`), so the guard is always falsy and never fires — every focus event re-grabs the masthead.

## Element / selector carrying the issue
The defect is page-wide: `document` `focusin` listener → `document.getElementById('brandLogo').focus()`. It strips focus from **every** other focusable control (section nav `a`, `.tools button`, `#nl` email input, in-article `a`). Inspection selector: `a.logo + nav a` (a representative victim — the first section-nav link).

## Exact accessibility mechanism (what AT experiences, why it fails)
- Every interactive element on the page (nav links, four article-tool buttons, the newsletter email input, the in-article link) is a real, named, focusable control. Static structure is pristine.
- A keyboard user Tabs from the logo to "Politics" (first nav link). The browser focuses it; the document `focusin` listener immediately fires and calls `logo.focus()`. Focus snaps back to "The Meridian Dispatch". Every subsequent Tab repeats the bounce.
- The user is trapped at the masthead: no downstream control can hold focus long enough to be operated. The article tools, the newsletter signup, and section navigation are all unreachable by keyboard even though each is individually well-formed.
- A screen-reader user moving by Tab is dragged back to the logo on each move; the rest of the page's functionality is inoperable.

Verified with Puppeteer: focusing the first section-nav link ends with `document.activeElement.id === 'brandLogo'` (`rests=false`, `landedOn=brandLogo`).

## Expected ACT-style outcome
**failed** (SC 2.1.1 — all downstream interactive controls are reachable in the tab order but focus is removed on receipt and relocated to the logo, so none can be operated by keyboard).

## Why automated tools miss it
The DOM is exemplary: semantic header/nav, real `<a>` and `<button>` elements, a labelled email input — axe/WAVE/Lighthouse find no errors. The failure lives entirely in a runtime event handler attached to `document`; a static scanner does not execute Tab sequences and does not model that a global `focusin` listener will re-focus the logo after every focus change. There is no markup signature for "page-wide focus theft." Only by tabbing through and watching the focus ring repeatedly snap back to the masthead can a human discover it. This is the "overlay/sticky-header re-focuses on every focusin" real-world variant called out in the aspect description.

## Citation
> "Content that normally receives focus when the content is accessed by keyboard may have this focus removed by scripting. ... the system focus indicator is an important part of accessibility for keyboard users."
— wcag-techniques/failures/F55.html (Description)

> "Use the keyboard to verify that you can get to all interactive elements using the keyboard. Check that when focus is placed on each element, focus remains there until user moves it."
— wcag-techniques/failures/F55.html (Tests — Procedure; here focus does NOT remain — it is moved to the logo by the script, not the user)

> "Goal — Everything can be done with a keyboard except freehand movements."
— wcag-understanding/keyboard.html (In brief; the article tools, search, and nav cannot be done with a keyboard because focus is yanked away)
