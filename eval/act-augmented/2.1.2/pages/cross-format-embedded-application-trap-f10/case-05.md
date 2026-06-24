# case-05 — `<object>` SVG transit map that loops Tab, with present-but-FALSE exit advice

## Scenario
A transit operator's service-update page ("Metrolink — Green Line") embeds an interactive
route diagram as a separate SVG document via `<object type="image/svg+xml"
data="case-05-map.svg">` (a same-origin sibling file; no network). The SVG's four station
`<a>` elements are focusable. The SVG's own script loops forward Tab from the last station
("University") back to the first ("Lakeside"), and Shift+Tab from the first to the last, so
Tab cycles among the stations forever and never crosses the `<object>` boundary forward to
the parent page's "Next: fares & passes" link. The cruel twist: the paragraph immediately
BEFORE the diagram reads "Tab through the diagram to hear each station, then press Tab once
more to continue to fares & passes." That advice matches the documented G21 escape pattern
— except it is **false**: there is no exiting Tab; the "extra Tab" just re-enters the loop.

## Attribute tuple
- **content-domain:** municipal transit / service updates
- **UI-component/pattern:** interactive SVG route map with focusable station links
- **host-language construct:** `<object type="image/svg+xml">` cross-format document; SVG `<script>` first/last Tab loop
- **locale/i18n:** en-GB
- **failure-mechanism:** F10 with present-but-false escape advice (the printed instruction does not match the actual behavior)

## Developer persona
A data-visualization contractor built the route map in SVG with focusable station links for
"keyboard accessibility" and exported it as a standalone asset embedded with `<object>`.
A well-meaning content editor, having read that you should tell users how to leave embedded
content, added the "Tab once more to continue" tip to the page — assuming the SVG behaved
like a normal tab sequence. Nobody tabbed all the way through to verify the tip was true.
The instruction is plausible, matches best-practice phrasing, and is wrong.

## Element / selector carrying the issue
`object[data="case-05-map.svg"]` → inside the SVG, `#st-lakeside` (first) and
`#st-university` (last). The SVG script cancels forward Tab on the last station and focuses
the first, and cancels Shift+Tab on the first and focuses the last. The misleading text is
the host page's `p.instructions` paragraph preceding the object.

## Exact accessibility mechanism
A keyboard user reads the tip, tabs into the `<object>`, and moves through the four
stations. Following the printed advice, after the last station they press Tab "once more" to
continue — but the SVG cancels it and returns focus to the first station. Every further Tab
re-cycles the four stations; focus never crosses the `<object>` boundary to "Next: fares &
passes". Because the loop runs inside the embedded SVG document, the host never receives the
boundary-crossing focus event. There is no working exit and no accurate advice: the
instruction that would normally rescue a trap (G21) is itself false, so the user is trapped
AND misled. Verified with CDP Tab driving: 26 Tab presses keep focus on the `<object>`;
"Next: fares & passes" is never reached, and Esc does not free it.

## Expected ACT-style outcome
**failed** — SC 2.1.2 No Keyboard Trap (F10, the canonical multi-format/plug-in case). The
presence of escape advice does not save it because the advice is inaccurate and the
described method does not work; per the SC the user must actually be *able* to untrap focus.
The corpus's only ACT rule (80af7b) tests single-document inline-button traps and does not
drive Tab into a cross-format SVG document, nor can it judge whether printed escape
instructions match real behavior.

## Why automated tools miss it
A static scan sees a valid `<object>` embedding an SVG whose station links carry accessible
names, plus a perfectly readable paragraph of keyboard instructions — every check passes.
Tools cannot drive Tab into the cross-format SVG document, cannot observe the forward loop,
and — most importantly — cannot judge that the printed escape advice CONTRADICTS the actual
focus behavior. That meaning-vs-behavior comparison (reading the instruction, performing the
steps, and noticing the promised exit never happens) is exactly the human reasoning the SC
demands and that axe/WAVE/Lighthouse cannot perform.

## Citation
> **Reference:** WCAG Techniques — F10 "Failure of Success Criterion 2.1.2 … due to
> combining multiple content formats in a way that traps users inside one format type"
> (`wcag-techniques/failures/F10.html`)
>
> **Quote (verbatim):** "When content includes multiple formats, one or more user agents or
> plug-ins are often needed in order to successfully present the content to users. For
> example, a page that includes HTML, SVG, SMIL and XForms may require a browser to load as
> many as three different plug-ins in order for a user to successfully interact with the
> content."
>
> **Reference:** WCAG Understanding — Understanding No Keyboard Trap
> (`wcag-understanding/no-keyboard-trap.html`)
>
> **Quote (verbatim):** "If untrapping focus requires a different method (rather than
> unmodified arrow keys, the Tab key, or other "standard exit methods"), content can still
> pass this criterion provided that the user is advised how they can untrap focus using
> their keyboard interface."
>
> **Reference:** Trusted Tester v5.1.3 — SC 2.1.2 (`refs/trusted-tester/sc-2.1.2-no-keyboard-trap.md`)
>
> **Quote (verbatim):** "Inspect any contextual/application help and documentation for
> notification of available alternate keyboard commands (non-standard controls, access keys,
> hotkeys) to escape/avoid the trap." … "Determine whether the alternate command(s) work."
