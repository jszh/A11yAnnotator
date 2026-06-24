# case-01 — "Subscribe to alerts" dialog rendered last in the DOM, no focus move

## Scenario
A municipal government portal (City of Brookhaven). A "Subscribe to alerts" button lives in an
announcement bar near the very top of the page. Activating it reveals a centered newsletter dialog
("Subscribe to city alerts" with an email field). The dialog markup is the **last block before
`</body>`** and the open handler only toggles a CSS `.open` class — it never moves focus into the
dialog.

## Attribute tuple
- **content-domain:** government / civic services portal
- **UI-component/pattern:** non-modal `role="dialog"` newsletter sign-up triggered from a top bar
- **host-language construct:** plain HTML5 + vanilla JS `classList.toggle`; dialog placed at end of `<body>`
- **locale/i18n:** en
- **failure-mechanism:** F85 open branch — revealed dialog not adjacent to trigger in sequential nav order; no focus management

## Developer persona
A government-contractor front-end developer building from a static template. They followed a "build
your own modal" blog post that appends the dialog node "at the end of the body so the overlay sits
above everything" (avoiding z-index/stacking-context headaches). The post's snippet only added
`el.classList.add('open')`; the developer copied it verbatim and never tested with the keyboard,
because with a mouse the email field is right there in the middle of the screen.

## Element / selector carrying the issue
`#openSubscribe` (the trigger in the top `.subscribe-bar`) paired with `#subscribeDialog` (the
`role="dialog"` block immediately before `</body>`). The defect is the **relationship**: the dialog
is not next in the navigation order after the trigger, and `openDialog()` performs no `.focus()`.

## Exact accessibility mechanism (what AT experiences, why it fails)
A keyboard / screen-reader user Tabs to "Subscribe to alerts" and presses Enter. The dialog appears
visually centered. But DOM-wise the dialog is after the footer, so it is the *last* thing in the tab
order, and the script left focus on the trigger button. Per F85 step 1: focus was **not** set to the
dialog or a focusable descendant, **and** moving focus forward once does **not** put focus in the
dialog — the next Tab goes to the first nav link / "Services" card link, the next thing in source
order. To reach the email field that is staring them in the face, the user must Tab through the entire
nav, all six service cards, the contact links, and the whole footer. Both points under F85 step 1 are
false, so the failure condition applies.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The dialog is well-formed: `role="dialog"`, `aria-labelledby`/`aria-describedby` resolve to real
text, the email input has an associated `<label for>`, and contrast is fine — axe-core, WAVE, and
Lighthouse all pass it. There is no missing attribute, no empty name, no aria-hidden-with-focusable
conflict. The failure is purely **positional and behavioral**: it only exists because the dialog's
DOM position is far from its trigger AND no script moves focus on open. Detecting it requires
activating the trigger and observing where the *next* Tab lands relative to where the dialog visually
appears — a multi-state keyboard interaction no static, single-snapshot scanner performs. (Static
tools see "a hidden div somewhere in the DOM," exactly as the aspect notes.)

## Citation
> **WCAG Technique F85 (Failure of Success Criterion 2.4.3 due to using dialogs or menus that are not adjacent to their trigger control in the sequential navigation order), Examples — "Adding a dialog to the page at the end of the sequential navigation order":**
> "A non-native HTML dialog is created, with it being marked up at the end of the DOM (Document Object Model). Script was created to reveal the dialog, but no script was added to move focus to it. The dialog is visually positioned above the content of the page and the user's focus isn't moved to the dialog. Since the dialog is found at the end of the DOM, it is at the end of the keyboard navigation order. Because a user's focus isn't managed, or a keyboard mechanism isn't provided to allow them to immediately move to the invoked dialog, the user will need to tab through the rest of the web page before they can interact with the dialog."

(Verbatim from `wcag-techniques/failures/F85.html`.)

> **WCAG Technique F85, Tests — Procedure, step 1:**
> "Activate the trigger control via the keyboard. — Check whether focus has been set to the menu, dialog, or a logical focusable descendent of the widget. — If not, check whether moving the focus forward once in the sequential navigation order puts focus in the menu or dialog."

(Verbatim from `wcag-techniques/failures/F85.html`. Both checks are false here, so the failure applies.)
