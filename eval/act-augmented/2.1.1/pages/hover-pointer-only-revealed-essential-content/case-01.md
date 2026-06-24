# case-01 — County government CSS `:hover`-only mega-menu, no `:focus-within` (FAIL)

## Scenario
"Westbrook County" official government site. The primary navigation has three top-level
links (Residents, Services, Courts) whose second-level service links — "Pay water & sewer
bill", "Apply for a marriage license", "Pay a traffic ticket", "Register to vote" — live in
`ul.submenu` panels that open on `li:hover` via CSS only. There is a `:hover` rule but **no**
`:focus-within` rule and no JS focus handler. A keyboard user can Tab to and activate the
top-level links, but the specific service links never become visible and are never tab stops,
so the page's primary government functions are unreachable by keyboard. These services are not
duplicated anywhere else on the page.

## Attribute tuple
- **content-domain:** government / civic services
- **UI-component/pattern:** APG-style disclosure mega-menu (nested `<ul>` dropdown nav)
- **host-language construct:** `nav > ul > li:hover > ul.submenu { display:block }` pure CSS
- **locale/i18n:** en-US
- **failure-mechanism:** submenu shown only on `:hover`; no `:focus-within`, no keydown — second-level tab stops removed by `display:none`

## Developer persona
An outside web agency themed a Bootstrap-style government template. The designer built the
mega-menu as a CSS `:hover` dropdown because "it looks instant and we don't need JS." They
never added the matching `:focus-within` selector (a common omission — most Stack Overflow
hover-menu snippets show only `:hover`), and QA only ever clicked through with a mouse. The
top-level links validate and tab fine, so the agency's automated scan came back clean.

## Element / selector carrying the issue
`nav.primary ul.submenu` (e.g. the submenu under the "Services" `<li>`) — `display:none`
except under `nav.primary > ul > li:hover ul.submenu`. The affected controls are the
second-level `<a href>` service links inside it.

## Exact accessibility mechanism
A keyboard-only user Tabs: Home → Residents → Services → Courts → About, each a real anchor
that receives focus. But because `ul.submenu` is `display:none` unless the ancestor `<li>` is
hovered, its child anchors are not rendered and not in the tab order — the Tab sequence skips
straight from one top-level link to the next. There is no `:focus-within` rule to reveal the
panel when focus enters the `<li>`, and no script listening for focus/keydown. Consequently
"Pay a traffic ticket", "Apply for a marriage license", etc. cannot be reached or activated by
keyboard. Activating a top-level link only loads a generic landing page; the specific service
deep-links shown on hover are the only path advertised on this page and are not available
elsewhere. SC 2.1.1 test condition — "all functionality can be accessed and executed using
only the keyboard" — is not met. Verdict: **FAILED**.

## Expected ACT-style outcome
**failed** — SC 2.1.1 Keyboard (Level A), operable-functionality limb. Pointer-only (`:hover`)
reveal of interactive controls with no keyboard/focus path and no equivalent elsewhere.

## Why automated tools miss it
The DOM is impeccable to a static checker: semantic `<nav aria-label>`, well-formed nested
`<ul>`/`<li>`, every submenu entry a real `<a href>` with descriptive visible text, no
empty/missing attributes, no contrast issue. axe-core, WAVE and Lighthouse parse the markup
statically and report no error — they do not compute that `display:none` (set by a `:hover`
descendant selector) removes those anchors from the tab order, nor do they exercise Tab to
discover the submenu never opens on focus. And they cannot judge that the lost links are
ESSENTIAL government functions rather than decorative chrome, nor that the same functions are
absent elsewhere on the page. Both judgments — keyboard-operability under interaction, and
essential-vs-redundant — require a human.

## Citation
> **Reference:** WCAG 2.2 Understanding SC 2.1.1 Keyboard — "In brief"
> (`wcag-understanding/keyboard.html`)
>
> **Quote (verbatim):** "Goal: Everything can be done with a keyboard except freehand
> movements. What to do: Ensure pointer actions have a keyboard equivalent."
>
> **Reference:** Trusted Tester v5.1.3 — SC 2.1.1, Test 4.A *Evaluate Results*
> (`refs/trusted-tester/sc-2.1.1-keyboard.md`)
>
> **Quote (verbatim):** "PASS if BOTH true: 1. All functionality can be accessed and executed
> using the keyboard, AND 2. All essential information can be accessed via keyboard OR is
> available elsewhere on the page."
