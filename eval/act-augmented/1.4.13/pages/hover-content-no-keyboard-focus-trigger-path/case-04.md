# case-04 — Airline fare picker: focus popup opens but DROPS the load-bearing penalty the hover popup shows (FAIL)

## Scenario
"SkyArc Airways" booking flow, "Choose your fare" step (SEA → JFK). Each of three fare cards
(Basic / Main / Flex) has a small focusable "i" button next to the fare name. The trap is the
**Basic** fare. On **mouse hover**, its popup shows the full rules — including the only place on
the page that the ticket is **non-refundable and non-changeable** ("the ticket is forfeited if
unused"). On **keyboard focus**, the *same* button's popup opens too — but renders a different,
abbreviated payload: "Basic — our lowest one-way price for this route." The non-refundable
penalty is silently dropped. The trigger is a real `<button>`, it is a tab stop with a focus
ring, and it *does* reveal content on focus — so the page looks fine to a quick check — yet the
material disclosure is reachable by pointer hover only.

## Attribute tuple
- **content-domain:** travel / airline booking (fare selection)
- **UI-component/pattern:** fare-card "i" info tooltip on a focusable `<button>` (APG "tooltip")
- **host-language construct:** real focusable `<button class="info">` with BOTH a `mouseenter` handler and a `focus` handler — but the two handlers inject *different* `innerHTML`
- **locale/i18n:** en-US
- **failure-mechanism:** the focus path is present and opens the popup, but the focus handler renders an abbreviated payload that omits the load-bearing penalty shown only by the hover handler — meaningful hover-revealed content has no equivalent keyboard-focus reveal

## Developer persona
A booking-funnel engineer wired the fare tooltips to show the full legal rules on `mouseenter`.
To "support keyboard" after an audit note, they later added a `focus` handler — but pointed it at
a short marketing blurb variant ("our lowest one-way price") instead of the same full-rules
string, so the focus popup feels tidy and on-brand. Because focus now *does* open a popup, the
team assumed parity was achieved and the audit item was closed; nobody compared the two payloads,
so the keyboard path quietly withholds the non-refundable penalty.

## Element / selector carrying the issue
`#info-basic` (the Basic fare's `<button class="info">`) — focusable tab stop; its `mouseenter`
handler renders the full rules into `#pop-basic` while its `focus` handler renders an abbreviated
string into the same `#pop-basic` that omits "non-refundable and non-changeable."

## Exact accessibility mechanism
A keyboard user Tabs to `#info-basic`; the focus ring paints and the `focus` handler opens
`#pop-basic`, so a popup *does* appear — but it reads only "Basic — our lowest one-way price for
this route." The mouse-hover popup for the same button reads "Basic (lowest price).
Non-refundable and non-changeable. Changes/cancellation are not permitted; the ticket is
forfeited if unused…". The penalty — the single fact that changes a buyer's decision — is
present on pointer hover and absent on keyboard focus. A screen-magnifier user driving by
keyboard, and a switch user, get the truncated version too. Because 1.4.13 protects perception
of the *additional* content, and the keyboard-focus path reveals a strictly poorer version that
drops material information, hover-triggerable content is not equivalently focus-triggerable.
Verdict: **FAILED**.

## Expected ACT-style outcome
**failed** — SC 1.4.13 Content on Hover or Focus (Level AA), focus-modality limb. Additional
content (the non-refundable/non-changeable rule) is revealed on pointer hover but is not made
available on keyboard focus, which instead reveals an abbreviated popup missing that information.

## Why automated tools miss it
Static analysis sees a textbook-correct control: a real `<button>` with `aria-label` and
`aria-describedby` resolving to a non-empty `role="tooltip"`, good contrast, and a descriptive
`<title>` — so axe-core, WAVE, and Lighthouse report no error. Worse, even a *naive dynamic*
heuristic ("does the popup open on keyboard focus?") passes the page, because it does open. The
defect is purely semantic: the focus-state payload and the hover-state payload differ, and only
the human can read both, recognize that the focus version drops the non-refundable penalty, and
judge that the dropped text is material rather than decorative. No tool compares two
interaction-state payloads for meaning-equivalence.

## Citation
> **Reference:** WCAG 2.2 Understanding SC 1.4.13 Content on Hover or Focus — "Additional Notes"
> (`wcag-understanding/content-on-hover-or-focus.html`)
>
> **Quote (verbatim):** "Content which can be triggered via pointer hover should also be able
> to be triggered by keyboard focus.  Refer to Success Criterion 2.1.1 Keyboard."
>
> **Quote (verbatim, Intent):** "The intent of this success criterion is to ensure that authors
> who cause additional content to appear and disappear in this manner must design the interaction
> in such a way that users can: perceive the additional content AND dismiss it without disrupting
> their page experience."
