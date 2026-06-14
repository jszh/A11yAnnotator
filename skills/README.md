# Accessibility verification skills

A **skill** is a reusable verification procedure: an instrument (or set of
instruments) plus the exact steps to turn it into a verdict for a snapshot.
Skills are **not** 1:1 with the 9 finding categories — one skill can settle
several categories, and one category usually needs several skills. This file is
the index and the bidirectional mapping; each `*.md` here is one skill.

## Instruments these skills assume

| Instrument | Where | Gives |
|---|---|---|
| DOM/CSS inspection | `verify-finding.js --eval/--xpath/--sel/--grep` | tags, attributes, roles, computed styles |
| axe-core | `verify-finding.js --axe <rules>` | rule violations (high precision, low recall) |
| AX tree | `/ax-node` (CDP `Accessibility`) | computed **role + name + state** + ignored reasons |
| Virtual screen reader (read) | `/ax-node` speech, `/sr-order` | what the SR voices at a node; reading-order neighbors |
| **VSR drive** (Tab / SR cursor) | `/sr-order` walk, *(to wire)* `/sr-drive` | focus trajectory, full reading-order narrative |
| **VSR act() + transcript** | iframe **"SR Log" panel (built, index.html)**; headless `/sr-act` *(to wire)* | activate a control, capture announcements via `spokenPhraseLog`/`lastSpokenPhrase` (both **async** — await them) |
| Contrast math | `verify-finding.js --contrast "r,g,b\|r,g,b"` | exact WCAG ratio |
| Reflow harness | `verify-finding.js --viewport 320x900 --eval scrollWidth` | horizontal-overflow measurement |
| Vision | `--shot out.png` → Read the PNG | the sighted view: is it decorative/meaningful, color-only, text-in-image, focus visible |

Serving mode matters: `verify-finding.js` and `/ax-node` auto-detect the
`noscript` flag in `pages.json`. Behavioral skills (keyboard, focus, announce,
hover) need the page's JS to run — so they require a **scripted** serve and only
hold where the snapshot hydrates faithfully (see each skill's *Limits*).

## The 10 skills

| Skill | What it determines | Primary | Supports |
|---|---|---|---|
| [name-role-state](name-role-state.md) | computed name/role/state + adequacy | cat_1 | cat_4, cat_7, cat_9 |
| [page-structure](page-structure.md) | headings, title, landmarks, outline | cat_3 | cat_2 |
| [grouping-and-reading-order](grouping-and-reading-order.md) | list/group semantics; spoken order vs visual | cat_2 | — |
| [keyboard-operability](keyboard-operability.md) | reachable & operable by keyboard | cat_4 | cat_5 |
| [focus-management](focus-management.md) | traps, focus order, focus return | cat_5 | cat_2, cat_8 |
| [focus-visibility](focus-visibility.md) | is the focus indicator perceivable | cat_5 | — |
| [color-and-visual-text](color-and-visual-text.md) | contrast, color-only, text-in-raster | cat_6 | — |
| [dynamic-announcement](dynamic-announcement.md) | is a state/status change announced | cat_7 | cat_9, cat_2 |
| [reflow-and-pointer-affordances](reflow-and-pointer-affordances.md) | 320px reflow; hover/Escape dismiss | cat_8 | — |
| [forms-instructions-errors](forms-instructions-errors.md) | labels, instructions, error identification | cat_9 | — |

> **What these skills do NOT cover** is documented in
> [COVERAGE-GAPS.md](COVERAGE-GAPS.md) — uncovered WCAG criteria (some already
> needed by the dataset: 2.2.2/1.4.2 autoplay video, 2.5.7 drag), and AT-specific
> limits our Chrome+guidepup engine structurally can't catch (e.g. `list-style:none`
> stripping list semantics in VoiceOver). Read it before trusting a "clean" result.

## Category → skills (run all listed to settle a category)

| Category (WCAG) | Skills to run |
|---|---|
| **cat_1** Accessible names (1.1.1, 2.4.4, 4.1.2) | name-role-state |
| **cat_2** Grouping & sequence (1.3.1, 1.3.2, 2.4.3) | grouping-and-reading-order · focus-management *(modal focus)* · dynamic-announcement *(background not hidden)* |
| **cat_3** Headings & structure (2.4.2, 2.4.6, 2.4.10) | page-structure |
| **cat_4** Keyboard interaction (2.1.1, 4.1.2) | keyboard-operability · name-role-state *(role/name of the custom control)* |
| **cat_5** Focus traps & visibility (2.1.2, 2.4.3, 2.4.7) | focus-management · focus-visibility |
| **cat_6** Color & contrast (1.4.1, 1.4.3, 1.4.5, 1.4.11) | color-and-visual-text |
| **cat_7** State/status exposed (4.1.3) | dynamic-announcement · name-role-state *(state attribute present?)* |
| **cat_8** Reflow & dismissible/hoverable (1.4.10, 1.4.13) | reflow-and-pointer-affordances |
| **cat_9** Errors & instructions (3.3.1, 3.3.2, 3.3.3) | forms-instructions-errors · name-role-state *(field label)* · dynamic-announcement *(error announced)* |

**Conformance levels & versions** (each skill's frontmatter carries the per-SC
level). Most criteria here are A/AA, but watch the exceptions so nothing is
over-claimed as an AA failure:
- **2.4.10 Section Headings is AAA** (cat_3) — and a *missing `<h1>`* is an axe best-practice rule, **not** any WCAG SC.
- **2.4.13 Focus Appearance is AAA** (WCAG 2.2) — it's the size/contrast bar behind cat_5; **2.4.7 Focus Visible (AA)** only requires that *some* indicator exists.
- **2.4.11 Focus Not Obscured (Minimum)** is AA but **new in WCAG 2.2** (off-screen/obscured focus).
- WCAG-2.1 additions used here: **1.4.10, 1.4.11, 1.4.13, 4.1.3**. Everything else is WCAG 2.0.

## Verdict scale (every skill uses the same one)

- **REPRODUCED** — instrument output directly confirms the failure.
- **PARTIAL** — static precondition confirmed; the behavioral half couldn't be exercised on this snapshot. Always say *what* is missing.
- **NOT REPRODUCED** — evidence contradicts the finding (record it; ~5% of findings are simply wrong).
- **NOT FOUND** — the element/state isn't in the snapshot (post-interaction, lazy, runtime-injected). A capture-fidelity gap, not a finding error.

## Composition note

Skills are deliberately small so they compose. A single finding often runs two:
e.g. an "Add to Bag confirmation not announced" finding runs **name-role-state**
(does the success node even have a role/name?) then **dynamic-announcement**
(activate it, read the transcript). Record each skill's sub-verdict; the
finding's verdict is the weakest link that still has evidence.
