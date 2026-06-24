# case-05 — LMS "Submit assignment" native modal: focus is fully contained both ways, but the backward order is intentionally NON-mirrored (PASS)

## Scenario
"Brightpath LMS" assignment-submission flow. The "Submit Lab Report 3" modal is opened with
the native `dialog.showModal()` API, so the user agent itself makes the rest of the page
inert and confines focus to the dialog in both directions. Inside the dialog, the formatting
toolbar (Bold / Italic / List) is a **roving-tabindex** group: it is a single Tab stop, and
arrow keys move between its buttons. Consequently the **forward** order and the **backward**
order through the dialog are not mirror images — Shift+Tab treats the toolbar as one stop and
jumps from the comment field straight back to it, whereas the toolbar's internal navigation
is by arrow key, not Tab. Crucially, focus never leaves the dialog in either direction and
every control remains reachable and operable. This is the PASS counter-example: a non-mirrored
backward order is explicitly allowed.

## Attribute tuple
- **content-domain:** higher-ed LMS / course page
- **UI-component/pattern:** APG "dialog (modal)" containing an APG "toolbar" (roving tabindex)
- **host-language construct:** native `<dialog>` + `showModal()` (UA-managed inert/containment) + roving-tabindex toolbar
- **locale/i18n:** en-US
- **failure-mechanism:** none — this is a conformant page whose forward/backward sequences differ by design (TT 4.F step 2d)

## Developer persona
An experienced accessibility-minded developer on the LMS team used the platform's native
`<dialog>` element with `showModal()` precisely because it gives correct modal containment
for free, and built the comment toolbar to APG spec as a roving-tabindex composite (one Tab
stop, arrow-key navigation) so it does not bloat the Tab sequence. They knew, and relied on,
the rule that backward focus order need not mirror forward order — the roving toolbar makes
the two sequences differ, and they verified by keyboard that focus stays inside and every
button is still reachable via arrows.

## Element / selector carrying the issue
No issue. The relevant elements are `#dlg` (native modal via `showModal()`) and `#toolbar`
(role=toolbar roving-tabindex group). The asymmetry between forward and backward Tab order is
created by the roving toolbar being a single tab stop, but focus remains contained and all
controls operable, so the page conforms.

## Exact accessibility mechanism
The UA confines focus to the dialog: with `showModal()`, content outside `<dialog>` is inert,
so neither Tab nor Shift+Tab can leave the dialog. Forward Tab: toolbar (current button) →
comment textarea → file input → Cancel → Submit → (UA wraps) → toolbar. Backward Shift+Tab:
Submit → Cancel → file input → comment → toolbar — and within the toolbar the user uses
ArrowLeft/ArrowRight, not Tab, to reach Italic/List. So the *path* differs slightly between
directions (the toolbar is one stop, not three, when tabbing), but every control is reachable
and operable, and focus never escapes the modal. A screen-reader user hears only dialog
content in both directions; a keyboard user can complete the submission either way. Per TT
4.F step 2d, backward order need not mirror forward order so long as meaning and operability
are preserved — they are. Verdict: **PASSED**.

## Expected ACT-style outcome
**passed** — SC 2.4.3 Focus Order (Level A). Focus is contained within the modal in both
directions and every control remains operable; the intentionally non-mirrored backward order
is permitted.

## Why automated tools miss it
This case exists to catch **false positives**, not false negatives. A naive checker or an
over-eager heuristic might compute the forward Tab sequence and the backward Shift+Tab
sequence, notice they are not exact reverses of each other (because of the roving toolbar),
and incorrectly flag a "focus order" problem. A correct verdict requires the human (or model)
to apply TT 4.F step 2d — backward need not mirror forward — and to confirm two things by
actually driving the keyboard: focus never leaves the dialog, and every control is still
reachable and operable. Automated tools cannot drive `showModal()` containment or arrow-key
roving navigation, and cannot apply the "need not mirror" judgment, so they would either
ignore it or mis-flag the asymmetry. The page is included so the corpus rewards judgment, not
a brittle "forward must equal backward" rule.

## Citation
> **Reference:** Trusted Tester v5.1.3 — Test 4.F Focus Order, "How to Test" step 2.d
> (`refs/trusted-tester/sc-2.4.3-focus-order.md`)
>
> **Quote (verbatim):** "**Backward focus order** does not have to mirror the forward focus
> order. However, it must preserve the meaning and operability of the page."
>
> **Quote (verbatim, Understanding SC 2.4.3 — "Intent"):**
> (`wcag-understanding/focus-order.html`)
> "If there is more than one order that preserves meaning and operability, only one of them
> needs to be provided."
