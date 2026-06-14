# Coverage gaps & known limitations — feasibility triage

The 10 skills were scoped to the **9 finding categories**. This file triages
what's outside that scope: which uncovered criteria are cheap to add, which are
behavioral-but-doable, and which are structurally hard — plus the engine limits,
two of which are now **fixed**. (Method-level gaps inside the existing skills —
`:focus-visible` modality, reflow 2-D exemption, hidden-but-focusable detection,
composited contrast, CSS-generated names, live-region pre-existence — are fixed in
those skill files.)

## A. Uncovered WCAG criteria — by feasibility

### A0. axe rule enablement — what the skills/tests can actually run
Two-layer answer:
- **Agent tests** (`verify-finding.js --axe <rule>`) use **rule-based runOnly**,
  which runs *any* rule by name **regardless of its enabled state or tags**
  (verified: `target-size` and `aria-roledescription` run via `--axe` though both
  are disabled-by-default). So the skills/tests can already invoke every rule —
  **no enabling is needed for them.**
- **The annotator's auto-scan** is tag-based, so it only runs *enabled* rules
  whose tags match. It originally ran **WCAG 2.0 only**, silently skipping (a) the
  WCAG 2.1/2.2 rules and (b) ~30 enabled **best-practice** rules the skills depend
  on. It now runs `wcag2a/2aa/21a/21aa/22aa` **+ `best-practice`**, and explicitly
  enables the disabled-by-default rules `target-size` (2.5.8) and
  `aria-roledescription` (4.1.2). Verified: this surfaces `label-content-name-mismatch`,
  `target-size`, `landmark-unique`, etc. that were previously invisible.
- Disabled rules deliberately **left off**: `audio-caption` (1.2.1, media — no
  skill), `color-contrast-enhanced`/`identical-links-same-purpose`/`meta-refresh-no-exceptions`
  (AAA), and `duplicate-id`/`duplicate-id-active` (4.1.1 Parsing — **obsolete in
  WCAG 2.2**). Enable the AAA ones only if AAA coverage is wanted.

### A1. Deterministic — and **already axe rules**, so no new skill (use axe)
Per "don't duplicate axe": each of these is an existing axe rule.

| SC (level) | axe rule | Notes (verified) |
|---|---|---|
| **2.5.3 Label in Name (A)** | `label-content-name-mismatch` | **disabled by default — now enabled.** Visible text must be ⊆ accessible name. Found **3** on Microsoft (the "Learn more" → "Learn about…" links), 1 on Temu. Flips an earlier call: those links pass 2.4.4 but **fail 2.5.3**. |
| **2.5.8 Target Size (AA, 2.2)** | `target-size` | **disabled by default — now enabled.** ≥24×24 CSS px. Found **18** on Temu. |
| **2.4.1 Bypass Blocks (A)** | `bypass` | enabled by default; now in-scope via tags. |
| **3.1.1 Language of Page (A)** | `html-has-lang`, `html-lang-valid`, `valid-lang` | ⚠️ unreliable **in the annotator iframe** — `INJECT_JS` sets a default `lang` before axe runs, so `html-has-lang` falsely passes. Use `verify-finding.js` (no injection) for 3.1.1. |
| **1.3.5 Identify Input Purpose (AA)** | `autocomplete-valid` | covers token *validity* only. The "is `autocomplete` *present* on a personal-data field" half is **not auto-decidable** (intent) — leave to human. |

### A2. Behavioral but doable (have / nearly have the instruments)
- **2.2.2 Pause/Stop/Hide (A) + 1.4.2 Audio Control (A)** — autoplay video/audio/
  motion without a pause control. Static detection (`video[autoplay]`, missing
  `controls`, no pause button) + `--reduced-motion` emulation (now available).
  Soft spot: the ">5s + parallel content" rule and JS-timer carousels need
  timed DOM-mutation observation. **Already needed by the dataset** (Doomersion).
- **1.4.4 Resize Text (AA) / 1.4.12 Text Spacing (AA)** — drive `--zoom 2` or
  inject the WCAG text-spacing CSS, then reuse the reflow clipping/overlap check.
- **3.2.1 On Focus / 3.2.2 On Input (A)** — focus/change a control, detect an
  unexpected context change (navigation/popup) via the driver.

### A3. Structurally hard (semantic recognition or non-DOM facts)
- **2.5.7 Dragging Movements (AA, 2.2)** — "is this drag-operated" isn't a DOM
  fact. Catchable: `draggable`, HTML5 drag events, `role=slider` without keyboard.
  Generic canvas/map drag (Zillow draw) needs semantic recognition + confirming an
  alternative control → usually PARTIAL/human. **Needed by the dataset** (Zillow).
- **2.5.2 Pointer Cancellation (A), 2.1.4 Char Key Shortcuts (A)** — need
  event-handler behavioral analysis (down-vs-up activation; single-char keydown).
- **1.2.x media (captions/AD), 2.3.1 Three Flashes, cognitive/reading-level** —
  media or content analysis / human judgment.

## B. Engine limits — status

| Limit | Status |
|---|---|
| **`list-style:none` strips list role in Safari/VoiceOver** | ✅ **FIXED** — static heuristic (`ul/ol` with computed `list-style-type:none` and no `role=list`) in `grouping-and-reading-order`. We detect the *triggering condition*, no WebKit needed. Verified: Klaviyo 67/67, ESPN 111/113. |
| **Forced-colors / Windows High Contrast** | ✅ **FIXED** — `verify-finding.js --forced-colors` (raw CDP `Emulation.setEmulatedMedia`; puppeteer's API rejects the feature). Chrome applies the actual HC palette (Domino's button → white-on-black), so focus indicators/boundaries can be checked under HCM. `--reduced-motion` added alongside. |
| **SVG accessible-name variance across AT** | ⚠️ Partial — flag fragile patterns statically (no `role=img`, `<title>` not first child); can't verify real-AT output. |
| **guidepup ≈ but ≠ a real screen reader** | ⚠️ Partial — `@guidepup/guidepup` drives **real VoiceOver/NVDA**, but it's **not installed** and runs only on a real macOS/Windows session (not headless). Viable as an opt-in high-fidelity spot-check, not in the headless pipeline. |
| **Snapshot fidelity** (noscript SPAs, post-submit/lazy/runtime content) | ⚠️ Improvable by capturing multiple states per page; one frozen file can't hold all states. |
| **Cognitive / language criteria** | ⚠️ Mostly human; reading level (3.1.5) partly automatable (Flesch-Kincaid). |

## C. Recommendation
- **Done now:** all A1 criteria run via axe (annotator tags expanded; `target-size`
  + `label-content-name-mismatch` enabled); both top engine limits fixed.
- **Highest-value next:** a behavioral **2.2.2/1.4.2** check (Doomersion video) and a
  real **2.5.7** procedure (Zillow drag) — both already required by the dataset.
- **Watch:** 3.1.1 must be measured off the raw page (not the annotator iframe);
  the A1 axe rules are conformance signals, but 1.3.5 *presence* and 2.5.8 *spacing
  exceptions* still need a human eye.
