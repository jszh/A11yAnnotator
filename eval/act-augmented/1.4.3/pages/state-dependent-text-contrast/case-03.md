# case-03 — Custom listbox: keyboard-focused (active descendant) option label drops to ~1.98:1

## Scenario
A cloud-console billing form with a custom country picker built as an APG listbox (`role="listbox"` + `role="option"`, driven by `aria-activedescendant`). Resting options are dark (`#1d2733` on white, ~15:1) and pass. But the option that currently has keyboard focus — the active descendant — is given a pale highlight: text `#9fb0c9` on a `#eef3fb` background, about **1.98:1**. As the user arrows down, the *focused* option's label becomes the hard-to-read one. The low-contrast text exists only while that option is the keyboard-focused/active descendant — the exact "object has keyboard focus" case the SC names.

## Attribute tuple
- **content-domain:** B2B SaaS / cloud billing console
- **UI-component / pattern:** ARIA Authoring Practices listbox (combobox popup) with `aria-activedescendant` roving focus
- **host-language construct:** `.opt--active` class toggled on the focused option (mirrors `:focus` for a composite widget that keeps DOM focus on the button)
- **locale / i18n:** en-US with European country list
- **failure-mechanism:** keyboard-focus highlight text below 4.5:1, applied only to the active option

## Developer persona
A product engineer copied the APG combobox example and restyled the active-option highlight to match the design system's "subtle hover" token — a pale blue fill with a muted blue label. In the comp the highlight looked elegant, and on their high-DPI monitor the muted text was "readable enough." They tested keyboard navigation for *function* (arrows move, Enter selects) but never measured the contrast of the label while it was highlighted, assuming the resting option color (which they had checked) was what mattered.

## Element / selector carrying the issue
`.opt--active` — the active-descendant option: `color:#9fb0c9` on `background:#eef3fb` (~1.98:1). Resting `.opt` (`#1d2733` on `#fff`) passes.

## Exact accessibility mechanism (what AT experiences / why it fails)
- **Keyboard / low-vision sighted user:** when they arrow to an option, that option's label fades to ~1.98:1 against its pale highlight. The very option they are about to choose is the one they can least read — and there is no other state in which that option is highlighted.
- The highlight is bound to keyboard focus (active descendant), so the failure is reachable only by driving the widget with the keyboard or pointer; a static render shows the resting (passing) colors.
- This is the "object has keyboard focus" text the 1.4.3 Understanding pulls into scope.

## Expected ACT-style outcome
**failed** (SC 1.4.3 — keyboard-focused option label at 1.98:1 < 4.5:1; keyboard-focus text is in scope).

## Why automated tools miss it
Two compounding reasons. First, contrast engines read each option's resting computed style (`#1d2733` on `#fff`), which passes; they do not move keyboard focus through the list and re-measure the option that becomes the active descendant. Second, in production the listbox is hidden until the control is activated, so a static initial-render scan never even sees the options. axe/WAVE/Lighthouse cannot drive arrow-key navigation, so the highlighted-option contrast is never sampled. A human must open the list, arrow through it, and read each highlighted label.

## Citation
> "This success criterion applies to text in the page, including placeholder text and text that is shown when a pointer is hovering over an object or when an object has keyboard focus. If any of these are used in a page, the text needs to provide sufficient contrast."
— wcag-understanding/contrast-minimum.html (Intent)

> "The visual presentation of text and images of text has a contrast ratio of at least 4.5:1, except: large text 3:1 …"
— refs/trusted-tester/sc-1.4.3-contrast-minimum.md (header)
