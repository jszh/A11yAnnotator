# case-02 — Cart quantity over stock: error *identified* in text, but the fix (available stock) is colour-only

## Scenario
A coffee roaster's shopping cart, re-rendered after the shopper pressed "Update cart" with a
quantity of **8** on an item that has only **5** left. A `role="alert"` banner appears that
**identifies** the problem in text ("There is a problem with the quantity for one of your items.
Please review the highlighted field") and the offending input even carries `aria-invalid="true"`.
But the **suggested correction is knowable and specific — reduce the quantity to 5 or fewer — and
it appears nowhere in text.** The single red-bordered, pink-filled input is the only thing tying
the generic banner to the right row, and it never states the stock ceiling.

This case deliberately sharpens the 3.3.3-vs-3.3.1 boundary: identification is fully present
(3.3.1 passes); only the **suggestion** limb fails.

## Attribute tuple
- **content-domain:** e-commerce product & checkout
- **UI-component/pattern:** cart data table with per-row quantity `spinbutton` inputs + a top alert banner
- **host-language construct:** `<input type="number" aria-invalid="true">` + `role="alert"` banner
- **locale/i18n:** en-GB (£)
- **failure-mechanism:** error is identified in text but the *correction value* (remaining stock) is conveyed only by a red input border; G84 "in text" suggestion limb

## Developer persona
A Shopify-to-headless migration contractor wired the cart's "update" endpoint to return a generic
validation banner and to set `aria-invalid` on any row that fails a server check. He was proud of
adding `role="alert"` and `aria-invalid` (his last audit dinged him for missing them). But the
stock-quantity validator returns only a boolean "ok/over" per line item, never the remaining
count, so the front end has no number to print — it just turns the input red. He assumed "the
banner plus the red box covers it," not realising the actionable number (how many are left) is
exactly what's missing.

## Element / selector carrying the issue
`td.qty.over > input#q1` (value `8`, `aria-invalid="true"`) — the red 2px border + pink fill is
the sole carrier of "too many; lower it," and the available-stock value (5) exists nowhere in the
DOM. The `div.alert[role=alert]` identifies the error but supplies no correction.

## Exact accessibility mechanism (what AT experiences, why it fails)
On re-render the `role="alert"` fires and a screen reader announces "We couldn't update your cart.
There is a problem with the quantity for one of your items. Please review the highlighted field
and try again." The user now knows an error exists and that it concerns a quantity — **3.3.1 is
satisfied.** Tabbing to the first quantity field, the SR announces "Quantity, Ethiopia Guji,
spin button, 8, invalid entry" (because `aria-invalid="true"`). But nothing — not the alert, not
the field's accessible name, not any associated message — states the **suggested correction**:
how many units are actually available. The red border and pink fill encode "this is the bad one
and the number is too big," yet that is visual-only and never names the ceiling. A blind user
learns *that* the quantity is wrong but has no idea what number would be accepted, so they must
guess-and-resubmit. The knowable suggestion ("only 5 remain — reduce to 5 or fewer") is provided
solely through colour, which G84 says is insufficient.

## Expected ACT-style outcome
**failed** — error identification is present, but the knowable correction (remaining stock) is
conveyed by colour alone with no text suggestion.

## Why automated tools miss it
- The page is a model citizen for the checks tools *do* run: a real `role="alert"` with text,
  `aria-invalid="true"` on the bad input, programmatic labels on every field. Error-identification
  and ARIA heuristics all pass — there is no empty attribute or missing message to flag.
- No automated tool knows the remaining stock is 5, so none can assert that the available number
  is the missing suggestion. Tools cannot distinguish "a correction suggestion is absent" from
  "an error message is present" — both look like text-plus-aria-invalid in a snapshot.
- A 1.4.1 colour heuristic might note the red input, but cannot determine that the specifically
  missing element is the *correction text* (3.3.3) rather than identification (3.3.1). Catching
  this requires reading the banner, recognising it states no fix value, and knowing the fix value
  is knowable — human semantic judgment.

## Citation
> **WCAG Technique G84 (Providing a text description when the user provides information that is
> not in the list of allowed values), Description:** "When users enter input that is validated,
> and errors are detected, the nature of the error needs to be described to the user in manner
> they can access. ... When input must be one of a set of allowed values, the text description
> should indicate this fact. It should include the list of values if possible, or suggest the
> allowed value that is most similar to the entered value."
>
> Source file: `wcag-techniques/general/G84.html`
