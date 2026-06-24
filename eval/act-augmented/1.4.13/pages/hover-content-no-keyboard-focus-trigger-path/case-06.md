# case-06 — PASS counter-fixture: legal-policy glossary tooltip on focusable trigger, hover AND focus parity (PASS)

## Scenario
"Northwind Mutual" privacy policy, data-retention section. The term **"legal hold"** is a
glossary trigger whose definition popup carries unique, material information (your data can be
retained beyond normal windows and despite a deletion request). It is built correctly: the
trigger is a real focusable `<button>`; the popup is revealed on **both** `focusin` and
`mouseenter` (keyboard/pointer parity); it is dismissible with Escape without moving focus; and
it is hoverable/persistent (group-level hover keeps it open so a magnifier user can move onto
it). This is the conforming counter-fixture — same meaningful content as the FAIL pages,
reachable by keyboard.

## Attribute tuple
- **content-domain:** legal / insurance privacy policy
- **UI-component/pattern:** glossary-term tooltip (APG "tooltip")
- **host-language construct:** focusable inline `<button class="term">` + JS bound to `focus` AND `mouseenter`, with Escape-dismiss and hoverable popup
- **locale/i18n:** en-US (legal English)
- **failure-mechanism:** NONE — conforming PASS demonstrating focus parity for hover-revealed meaningful content

## Developer persona
A compliance-aware engineer at an insurer implemented glossary tooltips after a prior audit
cited a hover-only tooltip. They followed WCAG technique SCR39 deliberately: bound the reveal
to both `focus` and `mouseenter`, made the trigger a `<button>`, added Escape-to-dismiss, and
made the popup hoverable. This page is the positive control that proves the aspect is about the
*absence* of a focus path, not the mere presence of a hover tooltip.

## Element / selector carrying the issue (here: the conforming element)
`#lh-term` (the `<button class="term">legal hold</button>`) — focusable, with the reveal wired
to `focus` and `mouseenter`; revealed content is `#lh-def`.

## Exact accessibility mechanism
A keyboard user Tabs to "legal hold"; the `focus` handler opens `#lh-def`, the definition is
rendered, and a screen reader announces it via `aria-describedby` plus the `aria-expanded`
state. Pressing Escape closes it and returns focus to the term without moving focus elsewhere
(Dismissible). A mouse user gets the same popup on `mouseenter`, and because the listener is at
group level the popup can be entered with the pointer without closing (Hoverable/Persistent) —
important for a magnifier user. Both modalities perceive the same meaningful content. The
Additional Note ("content triggerable via hover should also be triggerable by keyboard focus")
is satisfied. Verdict: **PASS**.

## Expected ACT-style outcome
**passed** — SC 1.4.13 Content on Hover or Focus (Level AA). Hover-revealed meaningful content
has an equivalent keyboard-focus trigger path, and the popup is dismissible, hoverable, and
persistent.

## Why automated tools miss it
Automated tools would also pass this page — but for the wrong reason: they never exercise focus
or hover, so they cannot confirm that the keyboard path actually works; they simply observe
well-formed markup. A human reviewer passes it for the *right* reason: Tab-testing shows the
definition appears on focus, Escape dismisses it, and the pointer can move onto the popup. The
contrast with the FAIL pages — identical-looking tooltips that omit the focus binding — is the
human judgment automated checks cannot perform: distinguishing a genuine keyboard-focus reveal
path from its absence.

## Citation
> **Reference:** WCAG 2.2 Understanding SC 1.4.13 Content on Hover or Focus — "Additional Notes"
> (`wcag-understanding/content-on-hover-or-focus.html`)
>
> **Quote (verbatim):** "Content which can be triggered via pointer hover should also be able
> to be triggered by keyboard focus. Refer to Success Criterion 2.1.1 Keyboard."
>
> **Quote (verbatim, SCR39 Procedure — focus, `wcag-techniques/client-side-script/SCR39.html`):**
> "For additional content that appears on focus check that: The additional content stays visible
> and does not automatically close after a time. The content can be closed without moving the
> focus way from the trigger. Either by pressing Esc, by pressing another other documented
> keyboard shortcut, or by activating the trigger."
