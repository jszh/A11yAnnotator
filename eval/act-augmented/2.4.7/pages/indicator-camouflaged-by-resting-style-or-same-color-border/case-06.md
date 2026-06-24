# case-06 — Restaurant menu category tabs: same dotted resting look, but a genuinely distinguishing focus ring (PASSED boundary)

## Scenario
A restaurant dinner-menu page has a category tab strip (Mezze, From the Grill,
Vegetable, Sweets, Drinks). Like the failing pages, every tab has a permanent
`outline:1px dotted #6b4f2a` decorative box at rest — the exact temptation that
produces F78 mode 2 camouflage. But here the author supplied a clearly
distinguishing focus indicator: on `:focus-visible` the dotted box is replaced by a
`3px solid #d98300` (amber) ring with a 3px offset, plus a background and text-colour
shift. The focused tab's appearance is unlike any tab's resting appearance, so a
keyboard user can immediately tell which tab has focus. This is the **passing**
boundary that sharpens the distinguishability limb.

## Attribute tuple
- **content-domain:** restaurant menu & ordering
- **UI-component/pattern:** category tab strip (set of in-page links)
- **host-language construct:** `<nav><a>` with dotted resting outline + a distinct `:focus-visible` solid amber ring
- **locale/i18n:** en-US
- **failure-mechanism:** none — the resting style is the same temptation as F78 mode 2, but the focus state is genuinely distinguishing (passes)

## Developer persona
A restaurant's web designer liked the boxed-tab look and gave each category a
dotted outline at rest. Aware of F78 (their auditor had flagged a previous site for
a dotted resting outline matching the focus ring), they deliberately made the focus
state unmistakable: `:focus-visible` swaps the thin dotted box for a thick solid
amber ring with offset and a colour/background change — nothing any resting tab
shows. They keyboard-tested it and confirmed the focused tab clearly stands out.

## Element / selector carrying the issue
`.menu-tabs a` — resting `outline:1px dotted #6b4f2a; outline-offset:1px`. The
distinguishing focus state is `.menu-tabs a:focus-visible` →
`outline:3px solid #d98300; outline-offset:3px; background:#fff3df; color:#3a2d1e`.

## Exact accessibility mechanism
At rest all five tabs look like identical thin dotted boxes. On focus, the focused
tab is repainted with a thick (3px) solid amber ring offset 3px out, plus a cream
background and darker text — a combination no resting tab exhibits. A sighted
keyboard user can therefore tell at a glance which tab holds focus: the indicator is
present *and* distinguishing, satisfying 2.4.7's purpose ("help a person know which
element has the keyboard focus"). Roles, names and order are correct for AT. This is
deliberately the inverse of cases 01–05: same tempting resting style, opposite
outcome, because the focused appearance is perceptibly distinct from the resting
appearance of every sibling.

## Expected ACT-style outcome
**passed** (SC 2.4.7 Focus Visible). ACT oj04fd also passes (a non-zero focus diff
exists). The value of this fixture is as the human-judgment contrast: it proves the
distinguishability test cuts *both* ways — the same evaluator reasoning that fails
01–05 must pass this one.

## Why automated tools miss it
Automated tools also pass this page, but for the shallow reason that *any* focus
indicator is present. They cannot tell the difference between this page (focus state
genuinely distinct from the resting dotted look) and case-01 (focus state identical
to the resting dotted look) — both have a non-zero focus diff and neither uses
`outline:none`. Only a human comparing the focused appearance against the resting
appearance of the siblings can distinguish the pass from the fail, which is exactly
why this boundary case belongs in the set.

## Citation
> **Reference:** WCAG Understanding 2.4.7 Focus Visible — Intent
> (`wcag-understanding/focus-visible.html`)
>
> **Quote (verbatim):** "The purpose of this success criterion is to help a person
> know which element has the keyboard focus."
>
> **Reference:** Trusted Tester v5.1.3 — SC 2.4.7 Focus Visible, Test 4.D, Evaluate
> Results (`refs/trusted-tester/sc-2.4.7-focus-visible.md`)
>
> **Quote (verbatim):** "When each interface element receives focus, there is a
> visible indication of focus."
