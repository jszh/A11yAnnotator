# case-06 — `<iframe>` audio player whose Tab correctly exits after the last control (PASS)

## Scenario
A podcast episode page ("Field Notes — Episode 47") embeds an audio-controls panel as a
cross-document `<iframe src="case-06-frame.html">` (a same-origin sibling file; no network).
Inside the iframe are real, focusable controls: Play/Pause, Rewind 15s, Forward 15s, a seek
slider (`<input type="range">`), and a playback-speed `<select>`. The player adds legitimate
widget behavior (Play toggles its label; the range responds to arrow keys natively) but does
**not** intercept Tab anywhere. After the LAST control (the speed select), a forward Tab is
allowed to fall through and cross the iframe boundary to the parent document's "Show
transcript" link — focus is never trapped. This is the G21 sufficient technique, mechanism
#1, working correctly. This is a PASS.

## Attribute tuple
- **content-domain:** media / podcast publishing
- **UI-component/pattern:** embedded audio-player control panel (toolbar of buttons + slider + menu)
- **host-language construct:** `<iframe src>` boundary; native focusable controls, NO Tab interception
- **locale/i18n:** en-US
- **failure-mechanism:** none — forward Tab exits after the final control (G21 mechanism #1 satisfied)

## Developer persona
A podcast platform engineer built the player as an embeddable iframe so publishers can drop
it on any page. They were careful to leave Tab alone: controls are ordinary focusable
elements, the slider uses native arrow-key behavior, and nothing re-grabs focus, so Tab
naturally exits the iframe after the last control. Included as the boundary/PASS case: it is
structurally a near-twin of a trapping embed, so it forces the judge to actually confirm the
boundary is crossed rather than assume "iframe with several controls = trap".

## Element / selector carrying the issue
`iframe[src="case-06-frame.html"]` → inside it, controls `#play`, `#back`, `#fwd`, `#seek`,
`#speed` (last). The behavior to judge is that forward Tab on `#speed` is NOT intercepted,
so focus advances out of the iframe to the host's `[data-after="true"]` "Show transcript"
link.

## Exact accessibility mechanism
A keyboard user tabs into the iframe and moves Play → Rewind → Forward → seek slider →
speed. (On the slider, Left/Right arrows scrub natively; Tab still advances between
controls.) Pressing Tab on the speed `<select>` — the final control — advances focus out of
the iframe and onto "Show transcript" in the host document, from which Tab continues through
the rest of the page. Focus is never re-grabbed and Tab is never cancelled, so the user can
enter the embedded player and leave it with the same standard key. No documentation is
required because the standard Tab exit works. Verified with CDP Tab driving: focus enters
the iframe and reaches "Show transcript" (`data-after="true"`) on the 6th Tab press,
confirming the boundary is crossed.

## Expected ACT-style outcome
**passed** — SC 2.1.2 No Keyboard Trap. Keyboard focus can be moved away from the embedded
component using the standard Tab key, satisfying the criterion (and G21 sufficient mechanism
#1). This PASS is *unconfirmable by static tooling*: it looks identical in the DOM to a
trapping iframe, and whether forward Tab actually escapes after the last control is a
runtime, cross-document focus fact a scanner cannot establish.

## Why automated tools miss it
The host DOM shows an `<iframe>` with a title; the embedded DOM shows several named,
operable controls. A trapping player would look exactly the same to a static scanner — the
only difference is whether the final Tab crosses the boundary, which is observable solely by
pressing Tab through the controls and watching focus land on "Show transcript". axe/WAVE/
Lighthouse never press Tab and never model cross-document focus flow, so they can neither
detect a trap here (there is none) nor certify the no-trap PASS. Only a human (or an
interaction probe) can confirm it.

## Citation
> **Reference:** WCAG Techniques — G21 "Ensuring that users are not trapped in content"
> (`wcag-techniques/general/G21.html`)
>
> **Quote (verbatim):** "Ensuring that the keyboard function for advancing focus within
> content (commonly the tab key) exits the subset of the content after it reaches the final
> navigation location."
>
> **Reference:** WCAG Understanding — Understanding No Keyboard Trap
> (`wcag-understanding/no-keyboard-trap.html`)
>
> **Quote (verbatim):** "Keyboard focus is not considered trapped when the user can navigate
> away from a component using only a keyboard interface, and if it only requires unmodified
> arrow or Tab keys or other "standard exit methods"."
>
> **Reference:** Trusted Tester v5.1.3 — SC 2.1.2 (`refs/trusted-tester/sc-2.1.2-no-keyboard-trap.md`)
>
> **Quote (verbatim):** "Keyboard focus can be moved away from each section of the page
> containing elements (not trapped in a "loop" preventing access to other elements) using
> either standard navigation keys OR documented custom keystrokes."
