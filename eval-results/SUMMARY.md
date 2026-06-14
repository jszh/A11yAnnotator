# Parallel skills evaluation — final summary

**Scope:** 56 saved pages · 1,154 sampled elements · all 10 skills run per element ·
792 actionable findings (REPRODUCED + PARTIAL). One Sonnet agent per page, each in
its own browser, results in `eval-results/<slug>/`.

## What each page folder contains
- `collect.json` — static bundle (cached axe run, structure, per-element AX
  role/name, contrast inputs, routing flags).
- `drive.json` — dynamic bundle: global Tab-walk (order/traps/off-screen), and per
  element a **local Tab walk** + **local SR walk** (5 back / 15 forward), focus
  indicator by visual diff, activation (click + Enter/Space, context/nav change,
  live-region + VSR announcement, modal focus-return), hover (1.4.13), plus a
  page-level form error-on-submit probe.
- `shots/elN.png` (+ `elN_focus.png`) — per-element appearance + keyboard-focused
  screenshots (read by the agent for visual confirmation).
- `results.json` — every element with an explicit verdict for **all 10 skills**,
  plus `summary.bySkill` and `summary.issues` (the filtered actionable list).
- `notes.md` — problems surfaced on that page.

## Per-skill verdict totals (element-level, across 1,154 elements)
| Skill | REPRO | PARTIAL | NOT REPRO | N/A |
|---|---|---|---|---|
| name-role-state | 192 | 9 | 841 | 112 |
| color-and-visual-text | 66 | 41 | 968 | 79 |
| keyboard-operability | 82 | 38 | 671 | 363 |
| focus-management | 74 | 28 | 686 | 366 |
| focus-visibility | 211 | 284 | 282 | 377 |
| dynamic-announcement | 31 | 207 | 300 | 616 |
| reflow-and-pointer-affordances | 351 | 29 | 633 | 141 |
| forms-instructions-errors | 26 | 7 | 33 | 1088 |
| page-structure | 31 | 1 | 25 | 1097 |
| grouping-and-reading-order | 83 | 4 | 211 | 856 |

## Most frequent WCAG failures (by issue count)
2.4.7 Focus Visible (161) · 1.3.1 Info & Relationships (115) · 4.1.2 Name/Role/Value
(76) · 2.1.1 Keyboard (60) · 1.4.3 Contrast (53) · 2.5.8 Target Size (42) · 2.4.4
Link Purpose (41) · 4.1.3 Status Messages (41) · 1.1.1 Non-text (22) · 1.4.10 Reflow
(22) · 2.4.11 Focus Not Obscured (19) · 2.5.3 Label in Name (17) · 3.3.2 Labels (16)
· 2.4.3 Focus Order (15) · 3.3.1 Error Identification (15) · 2.4.2 Page Titled (7) ·
2.1.2 No Keyboard Trap (7).

## Cross-cutting findings the dynamic driver surfaced (not reachable statically)
- **7 keyboard traps** (2.1.2): ad/Maps iframes and web components (Zillow Maps,
  Reddit `shreddit-player`, Rotten Tomatoes ad iframe, Newegg search, Reebok mega-nav…).
- **Focus visibility is the #1 issue** — confirmed by REAL keyboard Tab + visual
  diff, with the mandated eye-check on positives (agents overrode several
  false-positive diffs). Many sites globally suppress `:focus` outlines.
- **Status/announcement gaps (4.1.3)** — captured on the scriptable pages: e.g. H&M
  Add-to-bag and Gymshark wishlist changes fire no SR announcement; Gymshark/Macy's
  modals fail Escape-dismiss and focus-return.
- **Form error identification (3.3.1/3.3.3)** — Amazon Sign-In, VitalChek, Snowflake
  and others rely on native-only validation (no aria-invalid / live error).
- **2.4.11 off-screen focus** — hidden-but-focusable stops (Quizlet hamburger at
  x=-264, carousel slides) tabbed to invisibly.

## Known limitations (honestly flagged, not silently dropped)
- **10 of 13 noscript pages** blank their DOM on hydration (verified 0/21 survival),
  so their click-triggered announcements can't fire → those sub-verdicts are PARTIAL.
  The other **3 (Quizlet, Gymshark, H&M) were driven scripted** and got real
  announcement verdicts.
- **Appearance/focus shots** are blank/off-target for deep off-screen elements and
  pages with full-page dark overlays (cookie banners); those focus-visibility
  verdicts fall back to computed outline + the global Tab-walk reading (PARTIAL where
  unconfirmable). Off-screen elements are honestly flagged `appearanceOffScreen`.
- **Behavioral PARTIALs** remain for: focus-return on modals never opened in the
  snapshot, 1.4.13 hoverable/persistent where no tooltip exists, and arrow-key
  widgets without a composite role.
- Snapshot fidelity: lazy/auth/video resources don't load offline (black video
  frames, missing webp), affecting a handful of name/contrast judgments.

## Harness (scripts/)
- `eval-page.js` — one-shot static collector (own browser; cached axe).
- `drive-page.js` — dynamic driver (own browser; nav-suppressed; reload recovery
  net; adaptive scripted serving for the 3 noscript survivors).
- `verify-finding.js` — targeted follow-ups (pixel-contrast, reflow, forced-colors).
