# case-01 — API-reference "On this page" rail where every link permanently wears the same 1px dotted outline that the focus ring re-declares (FAIL)

## Scenario
The Glyphwright SDK REST API reference has a sticky right-hand "On this page" rail with nine
section links. To give the rail a "boxed index" look, the author put a permanent `1px dotted #1b1b1b`
outline on every `.toc a`, and then re-declared the `:focus` style as the identical `1px dotted #1b1b1b`
outline at the same `outline-offset`. The page is loaded with the *Pagination* link focused
(`autofocus`). The focus indicator IS drawn by the browser, but because it is pixel-identical to the
decorative outline that all eight other links already carry, nothing visibly distinguishes the focused
link. A sighted keyboard user arrowing/Tabbing down the index cannot tell which entry has focus, nor
that focus moved.

## Attribute tuple
- **Content domain:** developer docs / API reference
- **UI component / pattern:** sticky "On this page" table-of-contents link rail (`<aside>` + `<ul>` of in-page anchors)
- **Host-language construct:** CSS `outline: 1px dotted` declared on both the resting selector and the `:focus` selector with identical width/style/color/offset; `autofocus` to render the focused state
- **Locale / i18n:** en-US, monospace technical content
- **Failure mechanism:** F78 (a) — author outline visually identical to the focus indicator, so the focused element is indistinguishable from its siblings

## Developer persona
A junior developer disliked the browser's default focus ring on the docs index ("it looks broken"),
searched "remove ugly dotted focus outline", and pasted a Stack Overflow snippet that instead of
removing it, made the dotted outline *permanent and uniform* on every link so "they all look
consistent." To keep keyboard support they then copied the same `outline` declaration into a `:focus`
rule, believing they had preserved a focus indicator. They never tabbed through to notice that resting
and focused links are identical, because with a mouse the distinction never mattered.

## Element / selector carrying the issue
`.toc a` (resting) versus `.toc a:focus`. Both declare `outline:1px dotted #1b1b1b; outline-offset:2px;`.
The focused element at load is `#m-pagination` (the *Pagination* link).

## Exact accessibility mechanism
A keyboard user moves focus into the rail. The user agent DOES paint a focus indicator — the page is
not `outline:none`. But the focus indicator is `1px dotted #1b1b1b` at offset 2px, which is exactly the
outline already present on all nine links at rest. The focused state and the resting state are visually
identical, so the user perceives no change: they cannot locate focus or confirm it advanced. For a
sighted keyboard or screen-magnifier user the "visual information required to identify... state"
(focus) carries zero discriminating signal even though it technically renders. Note the resting outline
itself has fine contrast (~17:1), so this is not a low-contrast failure — it is an indistinguishability
failure: the focus indicator does not *differentiate* the focused control from the others.

## Expected ACT-style outcome
**failed** (SC 1.4.11, also implicates 2.4.7 / F78). A focus indicator is present but is not perceivably
distinct from the persistent decorative outline, so the focused control cannot be identified.

## Why automated tools miss it
axe-core, WAVE, and Lighthouse ship no reliable focus-visibility check, and they cannot reason about
*indistinguishability*. A CSS-scraper heuristic ("is there a non-`none` `:focus` outline?") returns true
here: `a:focus` declares a finite-width, visibly-colored, high-contrast dotted outline. A contrast
calculator on either state passes (1px #1b1b1b on #fff is ~17:1). The defect only appears when you
render the resting appearance of a link and the focused appearance of the same link and judge that a
human cannot tell them apart. No static analyzer performs that two-state visual diff, and dotted
outlines are an ordinary, legitimate decoration — flagging them all would be noise.

## Citation
**Reference:** WCAG Technique F78 — Examples (`wcag-techniques/failures/F78.html`)
> "The following CSS example will create an outline around links that looks the same as the focus indicator. This makes it impossible for users to determine which one in fact has the focus, even though the user agent does draw the focus indicator."

**Reference:** WCAG 2.2 Understanding 1.4.11 — User Interface Components (`wcag-understanding/non-text-contrast.html`)
> "Also, any visual information necessary to indicate state, such as whether a component is selected or focused must also ensure that the information used to identify the control in that state has a minimum 3:1 contrast ratio."
