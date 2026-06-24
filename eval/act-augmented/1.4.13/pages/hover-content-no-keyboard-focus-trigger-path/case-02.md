# case-02 — API docs glossary `<abbr>`: pure-CSS `:hover`-only tooltip, no focus path possible (FAIL)

## Scenario
"Pulsar Platform" developer API reference, "Rate limiting" page. The burst-behavior
paragraph abbreviates the throttling strategy as **TBA**, expanded only inside a CSS
`:hover` bubble that contains the load-bearing detail: bursts may exceed the nominal rate
by **2× for ~5 seconds**. That formula appears nowhere else. The expansion is implemented
with the selector `abbr.term:hover .bubble` — pure CSS, no JavaScript — so keyboard focus
cannot reveal it. The author further set `tabindex="-1"`, removing the `<abbr>` from the
Tab order entirely.

## Attribute tuple
- **content-domain:** developer docs / API reference
- **UI-component/pattern:** glossary term / abbreviation tooltip (APG "tooltip")
- **host-language construct:** `<abbr tabindex="-1">` + CSS-only `:hover` rule (no JS)
- **locale/i18n:** en-US (technical English)
- **failure-mechanism:** reveal bound to CSS `:hover` only; `:hover` has no keyboard analogue and `tabindex="-1"` removes the element from the tab order — no focus reveal path can exist

## Developer persona
A docs engineer maintaining a static-site theme wanted "term tooltips without pulling in a JS
tooltip library." They copied a popular CSS-only `abbr:hover` recipe from a styling blog,
added `tabindex="-1"` after a code-review comment said "abbr shouldn't be a tab stop," and
moved on. The CSS-only approach felt safe because it had no scripts — but it is precisely the
approach that cannot ever respond to keyboard focus.

## Element / selector carrying the issue
`abbr.term` (the "TBA" abbreviation) — revealed content is `abbr.term .bubble`; reveal rule
is the CSS selector `abbr.term:hover .bubble`.

## Exact accessibility mechanism
`:hover` is a pointer pseudo-class; there is no `:focus`/`:focus-within` rule in the
stylesheet and no script, so the only way to set the bubble visible is a mouse pointer over
the `<abbr>`. A keyboard user pressing Tab moves between the nav links and never stops on the
`<abbr>` (it has `tabindex="-1"`, explicitly out of the tab order). Even programmatic focus
would not trigger `:hover`. A screen-magnifier user driving by keyboard, and a switch user,
get the same result: the burst formula is unreachable. The text is unique and material
(it changes how a developer designs retry/back-off logic), so its loss is a genuine
perceive-on-focus failure under the Additional Note. Verdict: **FAILED**.

## Expected ACT-style outcome
**failed** — SC 1.4.13 Content on Hover or Focus (Level AA), focus-modality limb. The pop-up
is triggerable only by pointer hover (CSS `:hover`) with no keyboard-focus equivalent.

## Why automated tools miss it
A static scanner sees well-formed markup: a semantic `<abbr>`, a `role="tooltip"` on a
non-empty `<span>`, valid headings/table, a descriptive `<title>`, and sufficient contrast —
so axe-core, WAVE, and Lighthouse pass it. They do not evaluate whether a CSS `:hover` rule
has a matching `:focus` rule, nor whether the element is in the tab order, nor — critically —
whether the hidden text is meaningful versus decorative. Recognizing that "the only place the
burst formula is documented is a CSS-hover bubble that keyboard users can never trigger"
requires reading the content for meaning and operating the page by keyboard, both beyond
automated reach.

## Citation
> **Reference:** WCAG 2.2 Understanding SC 1.4.13 Content on Hover or Focus — "Additional Notes"
> (`wcag-understanding/content-on-hover-or-focus.html`)
>
> **Quote (verbatim):** "Content which can be triggered via pointer hover should also be able
> to be triggered by keyboard focus. Refer to Success Criterion 2.1.1 Keyboard."
>
> **Quote (verbatim, Intent):** "Examples of such interactions can include custom tooltips,
> sub-menus and other non-modal popups which display on hover and focus."
