# case-03 — Newsletter promo dims the page but never inerts it: Tab silently walks onto the article's "Search the archive" field under the scrim (FAIL)

## Scenario
"The Tideline Review" long-form journalism site. After the reader scrolls into an article,
a newsletter-signup promo (Privy/Mailchimp-style) appears over a dark scrim as a centered
card with an email `<input>` and a "Subscribe" button. It looks modal, and the developer
moved initial focus into the email field so it *feels* like a dialog. But there is **no
focus trap and the background was never made inert / aria-hidden**. Tabbing forward from
the email field walks past Subscribe and onto the page's "Search the archive" `<input>` and
"Search" button in the header — controls that are visually hidden beneath the dim scrim.
The user types into, or activates, controls they cannot see have focus. Because there is no
containment at all, **both** forward Tab and backward Shift+Tab leave the "modal."

## Attribute tuple
- **content-domain:** news / long-form editorial
- **UI-component/pattern:** marketing newsletter pop-up (Privy/Mailchimp-style) — a styled `<section aria-label>` over a scrim, NOT role=dialog
- **host-language construct:** `position:fixed` scrim with `z-index`; initial-focus-only management, no `inert`, no `aria-hidden`, no trap
- **locale/i18n:** en-US
- **failure-mechanism:** visual-only modality — the scrim dims the page but does not make it inert, so Tab silently reaches background controls hidden under the scrim in both directions

## Developer persona
A growth-marketing team embedded a third-party newsletter pop-up snippet and lightly
restyled it to match the masthead. The vendor snippet set initial focus to the email field
(its only nod to keyboard users) but shipped no dialog role and no inert/trap logic, because
its authors assumed the scrim's `z-index` was "enough to block the page." The marketing dev
dropped it in via the CMS, verified by mouse that the page dimmed and the form submitted,
and never tabbed past the email field. The article's own archive-search form was added by a
different team and is correct in isolation.

## Element / selector carrying the issue
`#promo` / `#scrim` — the pseudo-modal. The defect is the **complete absence** of
containment: no trap handler, and `<header>`/`<main>` are never set to `inert` or
`aria-hidden` while the scrim is open. The leak targets are `#q` (the "Search the archive"
field) and `#q-go` (its button) in the header, which remain focusable beneath the scrim.

## Exact accessibility mechanism
A keyboard or screen-reader user gets initial focus on `#news-email` (so a cursory test
"passes"). Forward Tab then moves email → Subscribe → **`#q` (Search the archive)** →
`#q-go` → article links, etc. — i.e. straight into the page that is supposedly behind the
modal. The scrim only paints a translucent overlay; it does not remove the background from
the tab sequence or the accessibility tree. A screen-reader user hears "Search the archive,
search edit text" while the subscribe promo is still on screen, with no way to know that
control is visually obscured; a sighted keyboard user watches the focus ring vanish under
the dark scrim. Shift+Tab is equally unguarded, so backward navigation leaks too. Because
nothing contains focus, the promo fails the modal-containment expectation in **both**
directions and destroys operability (the user can submit a search, scrolling the page, while
the "modal" is open). Verdict: **FAILED**.

## Expected ACT-style outcome
**failed** — SC 2.4.3 Focus Order (Level A), modal-dialog-containment limb (TT 4.F step 3).
A visually-modal overlay does not contain keyboard focus in either direction; Tab and
Shift+Tab reach background controls hidden under the scrim.

## Why automated tools miss it
There is deliberately **no** `role="dialog"`/`aria-modal` here — the promo is a styled
`<section aria-label="Newsletter signup">` (a generic landmark, exactly as many marketing
widgets ship), not a dialog — so a containment rule has nothing to key on; a scanner just
sees two ordinary, well-labelled forms in valid landmarks on one page (axe's `region` rule is
satisfied). Nothing is missing or malformed.
axe-core, WAVE, and Lighthouse cannot infer that the promo `<section>` is *meant* to be modal,
cannot tell that a `z-index` scrim does not make the background inert, and never press Tab to
observe focus sliding under the scrim onto the search field. Recognising the failure requires
human judgment that the scrim communicates modality visually, plus driving Tab to see that
focus escapes — neither of which a static tool does.

## Citation
> **Reference:** WCAG 2.2 Understanding SC 2.4.3 — "Examples of Focus Order" (modal example)
> (`wcag-understanding/focus-order.html`)
>
> **Quote (verbatim):** "A web page implements modal dialogs. When the trigger button is
> activated, a dialog opens and focus is set within the dialog. As long as the dialog is
> open, all web page content outside the dialog becomes inert and cannot receive focus
> (though, depending on implementation, the focus cycle might still include user agent
> controls)."
>
> **Quote (verbatim, Trusted Tester Test 4.F step 3):**
> (`refs/trusted-tester/sc-2.4.3-focus-order.md`)
> "For **modal dialog boxes**, keyboard focus navigating both forward and backward should
> remain within the modal dialog box until it is closed."
