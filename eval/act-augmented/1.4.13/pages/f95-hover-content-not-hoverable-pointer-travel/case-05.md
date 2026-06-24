# case-05 — Glossary definition pop-up that overlaps/adjoins its term (looks like the passing arrangement) but is `pointer-events:none`, so it can never be hovered (FAIL)

## Scenario
A pharmacy prescription page has a glossary term `<dfn>` ("contraindication") inside safety text.
Hovering or focusing the term reveals a definition pop-up that is rendered *directly adjacent to and
slightly overlapping* the term (`top:-2px; translateY(-100%)` — zero gap; it sits right on the term's
top edge). On a screenshot this looks exactly like the passing arrangement the Understanding describes
("the additional content overlaps or is positioned adjacent to the target"). But the pop-up has
`pointer-events:none`, and reveal is keyed only to the term's `:hover`/`:focus`. So the moment the user
moves the pointer up onto the pop-up to read it, the cursor is no longer over the term (the pop-up
accepts no pointer input), the term's `:hover` goes false, and the pop-up disappears. Despite perfect
visual adjacency, there is no continuous pointer path that keeps the content visible.

## Attribute tuple
- **Content domain:** healthcare / pharmacy patient portal
- **UI component / pattern:** inline glossary term with definition pop-up (`<dfn>` + tooltip)
- **Host-language construct:** CSS `:hover`/`:focus-within` reveal of a child `.def`; the pop-up overlaps the term (`top:-2px`, no gap) but carries `pointer-events:none`
- **Locale / i18n:** en-US, clinical terminology
- **Failure mechanism:** F95 "adjacency present but un-hoverable" — geometry satisfies the look of adjacency, yet `pointer-events:none` means the popup can never receive hover, so moving onto it drops the trigger's `:hover` and the content vanishes

## Developer persona
A health-content developer built accessible-looking glossary tooltips and deliberately placed the
definition *overlapping* the term (having read that 1.4.13 wants content "adjacent or overlapping"). To
stop the tooltip from "catching" stray clicks and to keep text selection clean, they added
`pointer-events:none` — a common copy-paste line from tooltip CSS recipes. They believed overlap alone
satisfied "hoverable." They never realized that `pointer-events:none` makes the overlap cosmetic: the
pop-up looks reachable but is transparent to the cursor, so it can never actually be hovered.

## Element / selector carrying the issue
`dfn.term#t-contra` (trigger) and its child `.def#def-contra` (`role=tooltip`). The defect is
`.def { pointer-events:none }` combined with reveal keyed to the term's `:hover` only.

## Exact accessibility mechanism
A low-vision user magnifies the page; the 280px definition pop-up overflows the magnified viewport. To
read "...lisinopril is contraindicated in pregnancy," the user moves the pointer up onto the pop-up to
pan. Because `.def` has `pointer-events:none`, the pointer "passes through" it — the cursor is treated as
being over whatever is behind it (the body), not over the term. The term's `:hover` evaluates false,
`dfn.term:hover .def` stops matching, and the pop-up reverts to `visibility:hidden`. The user cannot rest
the pointer on the content at all. Visual adjacency is satisfied but the Hoverable *behavior* is not:
"additional content which may appear on hover of a target may also be hovered itself" — here it provably
cannot.

## Expected ACT-style outcome
**failed** (SC 1.4.13, Hoverable; Failure technique F95).

## Why automated tools miss it
There is no automated 1.4.13 rule, and this case specifically defeats the smarter heuristics. A
geometry-based check ("does the popup overlap/adjoin the trigger?") *passes* it — the overlap is real. A
markup review passes it: `<dfn>`, `role="tooltip"`, `aria-describedby`, `tabindex="0"`, focus parity, and
~15:1 text contrast. The single line that breaks it, `pointer-events:none`, is an extremely common and
usually-harmless tooltip style; a linter has no rule that says "pointer-events:none on a hover-revealed
popup whose reveal is keyed to the trigger's :hover makes the popup un-hoverable." Catching it requires
reasoning about pointer-event propagation: that the cursor entering the popup region is not counted as
hovering the trigger, so `:hover` collapses. That is a behavioral inference about CSS hit-testing, not a
layout measurement or attribute presence check.

## Citation
**Reference:** WCAG 2.2 Understanding 1.4.13 — Hoverable (`wcag-understanding/content-on-hover-or-focus.html`)
> "The intent of this condition is to ensure that additional content which may appear on hover of a target may also be hovered itself.  Content which appears on hover can be difficult or impossible to perceive if a user is required to keep their mouse pointer over the trigger."

**Reference:** WCAG 2.2 Understanding 1.4.13 — Hoverable (`wcag-understanding/content-on-hover-or-focus.html`)
> "This condition generally implies that the additional content overlaps or is positioned adjacent to the target."

**Reference:** WCAG Technique F95 — Description (`wcag-techniques/failures/F95.html`)
> "In order to perceive it, it is therefore critical for these users to be able to move the pointer away from the trigger and over the additional content, and thereby change the position of the magnified section, without this content disappearing."
