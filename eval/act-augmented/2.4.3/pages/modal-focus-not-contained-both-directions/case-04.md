# case-04 — DMV "Confirm renewal" modal inerts the page wrapper, but a body-level cookie banner sits outside the inerted subtree and catches focus both ways (FAIL)

## Scenario
"Calverton DMV" vehicle-registration renewal. When the "Confirm renewal & payment" modal
opens, the developer takes the modern, recommended approach: set the page wrapper's
`inert` property to `true` and rely on `inert` to keep keyboard focus in the dialog (no
manual JS Tab trap). It looks textbook. But a cookie-consent banner (OneTrust-style) was
injected by the tag manager as a **direct child of `<body>`**, a sibling of the page
wrapper and the modal — **outside** the subtree that gets inerted. So the banner's "Accept
all cookies" and "Manage preferences" buttons stay fully focusable. With the page inert,
the document's only live focusables are the dialog's controls **plus** those two banner
buttons. Tab off the dialog's last control ("Pay $96.00") moves forward onto the cookie
buttons; Shift+Tab off the dialog's first control ("Card number") moves backward onto the
same buttons. Focus leaks out of the open modal in **both** directions.

## Attribute tuple
- **content-domain:** government / civic services portal (DMV)
- **UI-component/pattern:** APG "dialog (modal)" + a separate cookie-consent banner (OneTrust-style)
- **host-language construct:** `HTMLElement.inert = true` on a wrapper (no JS trap); cookie banner injected as a `<body>`-level sibling
- **locale/i18n:** en-US (US date "31 Aug 2026", USD)
- **failure-mechanism:** the inerted subtree does not include a late-injected body-level sibling, so its buttons remain in the tab order and catch focus escaping the dialog both forward and backward

## Developer persona
A senior front-end developer modernised the DMV's old `aria-hidden`-everything modal to use
the `inert` attribute, which they correctly understood removes a subtree from the tab order
and the accessibility tree — so they deliberately removed the old manual focus trap, trusting
`inert`. They inerted `#page`, which contained everything *they* authored. They did not know
that the analytics/consent platform injects its banner at the end of `<body>`, outside
`#page`, at runtime via the tag manager — a different team owns that. They tested in an
environment where the consent banner had already been dismissed (so it was not in the DOM),
saw `inert` working perfectly, and shipped. In production, first-time visitors get the
banner and the leak.

## Element / selector carrying the issue
The modal `#modal` is correct in isolation. The defect is the mismatch between the inerted
subtree (`#page`) and the actual set of background focusables: `#cookie` (the consent
`<aside>`) is a `<body>`-level sibling, so `page.inert = true` never neutralises
`#cookie-accept` / `#cookie-manage`. Those two buttons are the escape targets, reached by
forward Tab from `#pay` and by backward Shift+Tab from `#card`.

## Exact accessibility mechanism
The user opens the modal; focus is placed on `#card`. With `#page` inert, the browser's tab
sequence over live elements is: `#card` → `#cycle` → `#cancel` → `#pay` → **`#cookie-accept`
→ `#cookie-manage`** → (wrap to `#card`). So Tab from `#pay` lands on "Accept all cookies"
outside the dialog, and Shift+Tab from `#card` lands on "Manage preferences" / "Accept all
cookies" outside the dialog. A screen-reader user, told by `aria-modal="true"` that the rest
of the page is unavailable, suddenly hears "Accept all cookies, button" while the payment
dialog is open; a sighted keyboard user sees the focus ring jump to the consent banner over
the dim backdrop. Because the leaked-to control ("Accept all cookies") is fully operable, the
user can change a site-wide consent setting mid-payment — operability of the modal is
destroyed. TT 4.F step 3 requires both-direction containment; both directions leak here.
Verdict: **FAILED**.

## Expected ACT-style outcome
**failed** — SC 2.4.3 Focus Order (Level A), modal-dialog-containment limb (TT 4.F step 3).
A correctly-inerted wrapper still leaves a body-level sibling (the cookie banner) focusable,
so forward and backward focus both escape the open modal onto it.

## Why automated tools miss it
This is the hardest variant for a scanner: `inert` IS applied (so a tool that even checks for
inert sees the "good" pattern), `role="dialog"` + `aria-modal="true"` + `aria-labelledby` are
present, every field is labelled, and the cookie banner is valid, named, labelled markup that
a tool would treat as a normal landmark. Nothing is missing or malformed — axe-core, WAVE, and
Lighthouse all pass. The failure is a **scoping** error: the inerted subtree does not match the
set of background focusables because a sibling was injected outside it. Detecting it requires a
human to know the DOM topology (banner is a `<body>` sibling, not inside `#page`) and to Tab off
both edges of the dialog and observe focus reaching the banner. No static tool reasons about
which subtree was inerted versus where every focusable lives, nor drives the keyboard to confirm
the leak.

## Citation
> **Reference:** WCAG 2.2 Understanding SC 2.4.3 — "Examples of Focus Order" (modal example)
> (`wcag-understanding/focus-order.html`)
>
> **Quote (verbatim):** "As long as the dialog is open, all web page content outside the
> dialog becomes inert and cannot receive focus (though, depending on implementation, the
> focus cycle might still include user agent controls)."
>
> **Quote (verbatim, Trusted Tester Test 4.F step 3):**
> (`refs/trusted-tester/sc-2.4.3-focus-order.md`)
> "For **modal dialog boxes**, keyboard focus navigating both forward and backward should
> remain within the modal dialog box until it is closed."
