# case-06 — Bank identity-verification modal: conformant outer dialog, but the embedded KYC widget (iframe) traps the keyboard (FAIL)

## Scenario
"Cobalt Bank" account-opening flow. "Verify your identity" opens a `role="dialog"
aria-modal="true"` modal that is **conformant containment in isolation**: initial focus
lands on a real focusable "Close" button, a wired `Escape` handler on the document closes
the dialog, the Close / Cancel / Continue controls sit inside the Tab cycle, and focus is
restored to the opener on close. If you only move among the *outer* modal's own controls it
behaves exactly like the permitted modal-dialog carve-out.

The trap is the **embedded third-party format** in the modal body: a "SecureScan" KYC /
identity widget delivered as a same-page `<iframe srcdoc>` — a *second document* with its
own keyboard handling. Once the user **Tabs into the iframe**, the widget's own Tab-wrap
(last→first, first→last) plus a `focusin` re-grab keep focus circulating among its fields
forever, so Tab and Shift+Tab can never carry focus back out to the parent modal. And the
modal's `Escape`-to-close listener is bound on the **parent document**, which never receives
the keydown while focus is inside the cross-document iframe — so Esc cannot rescue a user who
has entered the widget. The widget advertises no escape of its own. The keyboard user can
*enter* the verification step but cannot *exit* it.

## Attribute tuple
- **content-domain:** banking / account opening / KYC identity verification
- **UI-component/pattern:** APG "dialog (modal)" wrapping an embedded third-party widget (`<iframe srcdoc>`)
- **host-language construct:** `role="dialog" aria-modal="true"` outer modal (parent-document Esc/Tab handlers) + a same-page `<iframe>` second document with its own Tab-wrap + `focusin` re-grab
- **locale/i18n:** en-US
- **failure-mechanism:** combining content formats so the keyboard can enter the embedded format but not leave it — the iframe traps Tab/Shift+Tab internally, and the modal's Esc listener (on the parent) never fires while focus is inside the cross-document frame; no documented exit (WCAG F10)

## Developer persona
A banking-platform team built the outer modal correctly from the WAI-ARIA Authoring
Practices (initial focus, contained Tab cycle, `Escape` close, focus restore) and tested it
thoroughly — every control reachable, Esc works. Compliance then required a vendor KYC
widget, which the vendor ships as an embed; the team dropped it into the modal body as an
iframe and gave it a `title`, satisfying their checklist. They never keyboard-tested *across*
the document boundary: from a keyboard, once you Tab into the vendor frame there is no way
back, and the bank's own Esc handler — living one document up — is deaf to keys pressed
inside the frame. The bug is the seam *between* two well-built pieces of different formats.

## Element / selector carrying the issue
The embedded `<iframe id="kyc">` ("SecureScan"). Inside it, the widget's `keydown` Tab-wrap
and `focusin` re-grab confine focus to its own `input`/`button` controls. The parent's
`document` `keydown` handler (the `Escape` branch that calls `closeModal()`) cannot observe
keystrokes dispatched in the iframe's document, so the modal's standard exit is unreachable
from the trapped section. There is no alternate/documented keystroke advised for the widget.

## Exact accessibility mechanism
A keyboard user opens the modal (focus on "Close"), reads the prompt, and presses **Tab** to
begin verifying — one Tab moves focus from "Close" into the embedded SecureScan frame
(document-number field). They fill it and continue Tabbing: date-of-birth → Rescan → Confirm
identity → (wraps back to) document number — the iframe's own wrap logic never releases focus
to the parent. **Shift+Tab** wraps the same way in reverse and also never exits. They press
**Esc** to back out — but Esc is dispatched in the iframe's document, the bank's `Escape`
listener lives in the parent document and is never invoked, so the modal stays open and focus
stays put. There is no on-screen instruction for any alternate exit. A screen-reader or
switch user is now stranded inside the embedded format with no keyboard route back to the
modal's Close/Cancel or to the page; only a mouse (clicking Cancel/Close, or completing the
scan) escapes. Modal containment is permissible only when the user can untrap and leave with
the keyboard — here the *outer* modal could be left, but the *embedded section within it*
cannot. Verdict: **FAILED**.

## Expected ACT-style outcome
**failed** — SC 2.1.2 No Keyboard Trap (Level A), legitimate-containment-vs-trap limb. The
outer dialog is conformant containment, but the embedded KYC iframe is a keyboard trap: the
user can enter the embedded format but cannot move focus out of it with standard keys
(Tab/Shift+Tab wrap inside the frame) and no documented alternate exit is provided; the
modal's Esc, bound on the parent document, cannot fire from inside the frame. This is WCAG
Failure F10 (combining formats so the user is trapped inside one format).

## Why automated tools miss it
The outer dialog is textbook-valid — real `role="dialog" aria-modal="true"`, an accessible
name, a focusable "Close" button, a wired `Escape` handler, focus restore — and the iframe
carries a `title`, so every static check (axe/WAVE/Lighthouse) passes. A shallow keyboard
test of the *outer* modal alone also passes: Esc closes it and Close is reachable. The
failure exists only when keyboard focus **crosses the document boundary** into the embedded
widget and then cannot get back — a stateful, cross-frame interaction (Tab into iframe →
Tab/Shift+Tab wrap forever → Esc swallowed by frame boundary) that requires multi-step
keyboard reasoning *across two documents*, which static scanners and single-frame keyboard
heuristics do not model. There is no missing attribute; the trap is an emergent property of
combining two well-formed formats.

## Citation
> **Reference:** WCAG Techniques — Failure F10: "Failure of Success Criterion 2.1.2 and
> Conformance Requirement 5 due to combining multiple content formats in a way that traps
> users inside one format type" (`wcag-techniques/failures/F10.html`)
>
> **Quote (verbatim, "When to Use"):** "Applies when content creates a situation where the
> user can enter the content using the keyboard, but cannot exit the content using the
> keyboard."
>
> **Quote (verbatim, "Description"):** "When content includes multiple formats, one or more
> user agents or plug-ins are often needed in order to successfully present the content to
> users. For example, a page that includes HTML, SVG, SMIL and XForms may require a browser
> to load as many as three different plug-ins in order for a user to successfully interact
> with the content. Some plug-ins create a common situation in which the keyboard focus can
> become "stuck" in a plug-in, leaving a keyboard-only user with no way to return to the
> other content."
>
> **Reference:** WCAG 2.2 Understanding SC 2.1.2 No Keyboard Trap — "Intent" (carve-out)
> (`wcag-understanding/no-keyboard-trap.html`)
>
> **Quote (verbatim):** "There may be times when it's appropriate for a web page to restrict
> focus to a subsection of the content – for example, when the user is inside a modal dialog
> or popover. This does not fail the requirements of this criterion, as long as the user
> knows how to "untrap" the focus and leave that component."
