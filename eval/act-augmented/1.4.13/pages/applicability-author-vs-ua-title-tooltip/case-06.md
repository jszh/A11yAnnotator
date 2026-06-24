# case-06 — Modal dialog opens on focus and takes keyboard focus: NOT-APPLICABLE to 1.4.13 (modal carve-out)

## Scenario
An online-banking wire-transfer form ("Meridian Bank") opens a **modal** security step-up dialog when the high-risk *Amount* field receives focus. The dialog is `role="dialog" aria-modal="true"`, dims the page with a backdrop, moves keyboard focus to its confirm button, traps Tab inside itself, and is dismissed via Escape or Cancel. Superficially this is "additional content appearing on focus" — the trigger pattern 1.4.13 targets — but 1.4.13 explicitly **excludes modal dialogs** (they must take keyboard focus and thus should not be treated as transient hover/focus content). The correct disposition is **NOT-APPLICABLE** to 1.4.13; the relevant criterion is 3.2.1 On Focus. This is the N/A carve-out anchor for the aspect.

## Attribute tuple
- **content-domain:** online banking / fintech (wire transfer)
- **UI-component / pattern:** modal dialog (APG dialog/modal pattern) opened on field focus
- **host-language construct:** `role="dialog" aria-modal="true"` + focus trap + Escape, opened on `focus` of an input
- **locale / i18n:** en-US
- **failure-mechanism:** none for 1.4.13 — modal carve-out → NOT-APPLICABLE (the focus-triggered content is a modal, not a non-modal tooltip/popup)

## Developer persona
A fintech developer implemented a security "step-up" confirmation that fires when the user starts to enter a sensitive amount. They correctly built it as a proper modal — `aria-modal="true"`, focus moved into the dialog, focus trapped, Escape and Cancel to close — following the APG dialog pattern. The subtlety is purely **classification**: because the dialog opens *on focus*, an over-eager reviewer (or heuristic) might try to apply 1.4.13 and test hoverable/dismissible/persistent, when the modal exclusion means 1.4.13 simply does not apply.

## Element / selector carrying the (non-)issue
`#backdrop > .dialog[role="dialog"][aria-modal="true"]`, opened by the `focus` handler on `#amount`. The dialog is the focus-triggered content; the judgment is that it is a **modal**, so 1.4.13 is inapplicable.

## Exact accessibility mechanism (what AT experiences, why it is N/A)
- Focusing the Amount field opens the dialog; focus is **moved into** the dialog (to "Yes, continue"), the page behind is `aria-modal`-hidden/dimmed, and Tab is trapped within the dialog.
- This is exactly the behavior the 1.4.13 modal exclusion describes: modal dialogs "must take keyboard focus and thus should not appear on hover or focus" in the transient sense the criterion governs. The Understanding text routes such content to **3.2.1 On Focus** instead.
- The content is dismissible (Escape/Cancel) and persistent and takes focus — i.e. it behaves as a modal, not a non-modal tooltip/popup. → 1.4.13 **NOT-APPLICABLE**.
- (Note: a reviewer should still flag that opening a modal automatically *on focus* may itself raise 3.2.1 On Focus concerns — but that is a different criterion and outside this aspect's scope.)

Verified with Puppeteer: the dialog has `aria-modal="true"`; focusing `#amount` sets the backdrop `data-open="true"` and moves `document.activeElement` to `dlg-confirm` (focus enters the dialog) — confirming modal behavior.

## Expected ACT-style outcome
**inapplicable** (SC 1.4.13 — the focus-triggered additional content is a modal dialog, which is out of scope per the modal carve-out; evaluate under SC 3.2.1 On Focus instead).

## Why automated tools miss it
The DOM shows additional content appearing on focus — the literal trigger 1.4.13 watches for — so a naive rule could apply 1.4.13 and begin testing hoverable/dismissible/persistent. Deciding that this particular focus-triggered content is a **modal** (it takes keyboard focus, traps it, dims the page, and must be acknowledged) rather than a non-modal tooltip/popup is a judgment about behavior and intent. Both a modal and a non-modal popup look like "content appears on focus" in the markup; only a human reasoning about the interaction can make the N/A call and re-route the content to 3.2.1.

## Citation
> "Modal dialogs are out of scope for this criterion because they must take keyboard focus and thus should not appear on hover or focus. Refer to Success Criterion 3.2.1 On Focus."
— wcag-understanding/content-on-hover-or-focus.html (Intent → Additional Notes)

> "Examples of such interactions can include custom tooltips, sub-menus and other non-modal popups which display on hover and focus."
— wcag-understanding/content-on-hover-or-focus.html (Intent)

> "Not applicable: If any requirement precondition is false or the web page does not contain content relevant to WCAG 2.2 Success Criterion 1.4.13 Content on Hover or Focus. (Do not need to meet or test)"
— docs/analysis/en301549/EN301549-ANNEX-C-RELEVANT-CLAUSES.md (C.9.1.4.13 — Result)
