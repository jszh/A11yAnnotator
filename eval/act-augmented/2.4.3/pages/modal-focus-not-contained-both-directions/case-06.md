# case-06 — Arabic (RTL) clinic "Confirm appointment" modal: hand-rolled but correctly contains focus in BOTH directions (PASS)

## Scenario
"عيادة النخيل" (Al-Nakheel Clinic) appointment page in Arabic (`lang="ar" dir="rtl"`). A
"تأكيد الموعد / Confirm appointment" modal shows a name `<input>`, a phone `<input>`, a
reason `<select>`, a "تأكيد الحجز / Confirm" button, and an "إلغاء / Cancel" button. The
developer hand-rolled the dialog (not the native `<dialog>` element) but implemented
containment correctly: on open, the background wrapper is made `inert` **and**
`aria-hidden="true"`, and a `keydown` handler wraps **both** directions — Tab on the last
control returns to the first, and Shift+Tab on the first control returns to the last. Initial
focus is placed inside the dialog; Esc and Cancel close it and restore focus. In RTL the
visual left/right is mirrored, but Tab/Shift+Tab semantics are unchanged, and the author
handled that correctly. Focus never escapes the modal in either direction. This is the PASS
boundary that contrasts directly with case-01 (same hand-rolled shape, but case-01 omitted
the Shift+Tab branch).

## Attribute tuple
- **content-domain:** healthcare / clinic appointment booking
- **UI-component/pattern:** APG "dialog (modal)" — hand-rolled `role=dialog aria-modal=true` overlay
- **host-language construct:** `inert` + `aria-hidden` on the background wrapper; `keydown` trap implementing BOTH forward and backward wraps
- **locale/i18n:** Arabic, `lang="ar"`, `dir="rtl"`, Eastern-Arabic numerals
- **failure-mechanism:** none — correct bidirectional containment; included as an RTL PASS counter-example

## Developer persona
A bilingual developer building the clinic's Arabic site could not use the native `<dialog>`
element because the legacy embedding environment did not support it, so they hand-rolled the
modal — but did it carefully, having previously seen a forward-only trap leak in code review
(the exact bug in case-01). They wrote both the `e.shiftKey` (backward) and the forward wrap,
inerted and aria-hidden the background, set initial focus in, and restored it on close. They
specifically tested Shift+Tab from the first field and Tab from the last button in RTL to make
sure direction handling was right.

## Element / selector carrying the issue
No issue. Relevant elements: `#modal` (the hand-rolled `role=dialog aria-modal=true` overlay),
the `keydown` trap on `#modal` (contains both the `e.shiftKey && activeElement === first →
last` backward wrap and the `!e.shiftKey && activeElement === last → first` forward wrap), and
`#page` (set `inert` + `aria-hidden="true"` while the modal is open).

## Exact accessibility mechanism
On open, focus is placed on `#name`. Forward Tab: name → phone → reason → Confirm → Cancel →
(wraps) → name. Backward Shift+Tab: name → (wraps) → Cancel → Confirm → reason → phone →
name. Both wraps are explicit in the handler, so focus stays inside the dialog in both
directions; the background is both inert (not focusable) and `aria-hidden` (not in the AT
tree), so even if a wrap were missed, the background would not be reachable — defence in
depth. RTL does not alter Tab semantics, and the author did not introduce a direction bug. A
screen-reader user hears only dialog content in both directions; a keyboard user can reach and
operate every control either way. Verdict: **PASSED**.

## Expected ACT-style outcome
**passed** — SC 2.4.3 Focus Order (Level A), modal-dialog-containment limb. Keyboard focus
navigating both forward and backward remains within the open modal, and outside content is
inert/hidden.

## Why automated tools miss it
Automated tools cannot confirm this PASS for the same reason they cannot catch the failing
cases: they do not drive the keyboard. A static scanner sees a valid `role=dialog`/`aria-modal`
overlay with labelled controls and (if it inspects state) an inerted, aria-hidden background —
it cannot prove that *both* Tab and Shift+Tab wrap inside, because proving containment requires
actually pressing both keys from the boundary controls. This page is included so the corpus
rewards a verdict reached by bidirectional keyboard testing, not by pattern-matching: a model
that sees "hand-rolled trap" or "RTL" and assumes a direction bug would wrongly fail it. The
correct PASS depends on a human/agent observing that the backward branch is present and that
focus is contained in both directions.

## Citation
> **Reference:** Trusted Tester v5.1.3 — Test 4.F Focus Order, "How to Test" step 3
> (`refs/trusted-tester/sc-2.4.3-focus-order.md`)
>
> **Quote (verbatim):** "For **modal dialog boxes**, keyboard focus navigating both forward
> and backward should remain within the modal dialog box until it is closed."
>
> **Quote (verbatim, Understanding SC 2.4.3 — "Examples of Focus Order"):**
> (`wcag-understanding/focus-order.html`)
> "A web page implements modal dialogs. When the trigger button is activated, a dialog opens
> and focus is set within the dialog. As long as the dialog is open, all web page content
> outside the dialog becomes inert and cannot receive focus".
