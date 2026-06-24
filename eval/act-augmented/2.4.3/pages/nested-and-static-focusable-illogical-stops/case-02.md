# case-02 — `tabindex="0"` decorative divider injected between "Card number" and "Expiry"

## Scenario
A ticketing checkout (Northwind Tickets). The payment fieldset is a tightly-coupled numeric
sequence: Name on card → Card number → Expiry → CVC. A decorative "Payment details" text
divider — purely visual chrome — was made focusable (`tabindex="0"`) so a scroll-reveal
animation could fire on focus. It now sits **between** the Card-number field and the Expiry
field, so Tab order is: Card number → (meaningless "Payment details" accent stop) → Expiry.
The injected stop breaks the flow of entering a card right where the user is mid-transaction.

## Attribute tuple
- **content-domain:** events / ticketing checkout
- **UI-component/pattern:** payment-card entry fieldset (multi-field stepper-style sequence)
- **host-language construct:** focusable static text — `div.accent[tabindex=0]` with `::before/::after` decoration
- **locale/i18n:** en
- **failure-mechanism:** non-interactive focusable element injecting a meaningless mid-sequence stop that breaks entry flow

## Developer persona
A designer-developer using a "reveal on focus" micro-interaction library that requires its
targets to be focusable. They sprinkled `tabindex="0"` onto every animated decorative element
for the effect, not realizing one of those accents sat inside the payment fieldset and would
land in the keyboard tab order between two card fields.

## Element / selector carrying the issue
`div.accent[tabindex="0"]` (text "Payment details"), positioned in source between
`#cardnum` and the `#exp` field.

## Exact accessibility mechanism (what AT experiences, why it fails)
A keyboard user typing their card number presses Tab expecting the Expiry field. Instead focus
lands on a non-operable text node; a screen reader announces "Payment details" (group-less,
control-less static text) with no field to act on. The user must Tab again to reach Expiry. The
flow of a card-entry sequence — where users rapidly tab field-to-field — is interrupted by a dead
stop carrying no actionable content, in the worst possible place (mid card entry). This is precisely
a focus order that "impedes the operation of content" via a confusing stop, not a logical one. The
note explicitly permits focusable static text, but only where it does not impede operation; here it
does.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The divider is a valid `<div>` with a legal `tabindex="0"`; it is not a control, so there is no
missing label/role to flag. No automated rule fires on "focusable non-interactive element placed
mid-form." Recognising that the stop lands *between two related payment fields* and therefore breaks
the data-entry flow requires understanding the meaning and sequence of the form and tabbing through
it — contextual human judgment, not a static signature.

## Citation
> **WCAG 2.2 Understanding Focus Order, "For clarity" list:**
> "Static/non-interactive elements can receive focus, as long as they don't impede operation of the content, or result in confusing or illogical focus order."

(Verbatim from `wcag-understanding/focus-order.html`. The focusable "Payment details" accent impedes
operation by interrupting the card-entry sequence between Card number and Expiry.)

> **WCAG Technique G59 (Placing the interactive elements in an order that follows sequences and relationships within the content), Examples:**
> "A form contains two text input fields that are to be filled in sequentially. The first text input field is placed first in the content, the second input field is placed second."

(Verbatim from `wcag-techniques/general/G59.html`. A meaningless focusable stop inserted between two
fields that are filled sequentially violates this placement.)
