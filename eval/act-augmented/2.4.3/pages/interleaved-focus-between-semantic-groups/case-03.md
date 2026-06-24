# case-03 — Round-trip flight search: Outbound and Return legs alternate in tab order

## Scenario
"SkyHop" round-trip flight search. Two stacked, clearly headed panels: **Outbound flight**
(From, To, Depart date, Passengers) above **Return flight** (From, To, Return date, Cabin).
Each panel shows its four fields in a tidy 2×2 grid in the natural order. Every control has
a real label, correct name/role, and is keyboard-operable; there is **no `tabindex`**. But
the DOM emits the eight fields in **alternating legs**: outbound-From, return-From,
outbound-To, return-To, outbound-Depart, return-Return, outbound-Passengers, return-Cabin.
The CSS grid routes each field back into its visual panel, so a sighted user sees two clean
stacked cards while keyboard focus bounces between the outbound and return legs.

## Attribute tuple
- **content-domain:** travel / flight booking
- **UI-component / pattern:** round-trip search with two stacked leg panels (vertical grouping, not side-by-side)
- **host-language construct:** one CSS-grid form; field cells emitted in alternating-leg DOM
  order, repositioned into the correct stacked panel by named grid areas; no `tabindex`
- **locale / i18n:** en-US; uses native `<input type="date">` and `<select>` controls
- **failure-mechanism:** two semantic groups (trip legs) interleaved by raw source order;
  focus alternates between groups instead of completing one leg before the other

## Developer persona
A dev refactored an old single-leg search into round-trip by *duplicating each row*: for
every existing outbound row they pasted a matching return row directly beneath it in the
template ("From → From, To → To, date → date…"), so the two legs ended up interleaved in
the markup. They then used a grid to push all the outbound rows into the top card and all
the return rows into the bottom card for layout. It looked like two separate legs, so they
assumed it behaved like two separate legs — but the focus order still follows the pasted,
alternating source order.

## Element / selector carrying the issue
The interleaved field sequence inside `form[aria-label="Round-trip flight search"]`. The
clearest interloper is `#r-from` (Return → From), which in DOM/tab order receives focus
**immediately after** `#o-from` (Outbound → From) and **before** `#o-to` (Outbound → To).
Primary selector to inspect: `#r-from`.

## Exact accessibility mechanism (what AT experiences, why it fails)
- **Sighted mouse user:** fills the outbound card top-to-bottom, then the return card. Fine.
- **Keyboard / screen-reader user:** Tab 1 → Outbound *From*. Tab 2 → **Return *From*** —
  focus drops two panels down to the return card before the outbound card is even started.
  Tab 3 → Outbound *To* (back up). The user is forced to specify the return origin before
  finishing the outbound leg, then bounce back. For a round trip the legs are conceptually
  sequential (go, then come back); interleaving them mid-entry makes it easy to type the
  return city into an outbound field and corrupts the user's model of which leg they are
  editing.
- **Verified with Puppeteer** (real Tab key presses): focus alternates between the outbound
  panel (y ≈ 327–434) and the return panel (y ≈ 664–771) on successive fields —
  `o-from(y327) → r-from(y664) → o-to(y327) → r-to(y664) → o-date → r-date → …` — confirming
  the zig-zag between the two legs. (The native date pickers consume a few extra Tab presses
  internally, but the leg-to-leg alternation is unambiguous.)

## Expected ACT-style outcome
**failed** (SC 2.4.3 — focus order interleaves the outbound and return legs; the sequence
does not preserve the meaning of the two trip-leg groups).

## Why automated tools miss it
No `tabindex`; every input/select has a correct `<label for>` and is operable; both panels
have visible headings; contrast passes. axe/WAVE/Lighthouse therefore see a valid form.
They have no model that "Depart date and Passengers belong with the *outbound* From/To" and
that the return fields are a separate leg — so they cannot detect that the return fields are
woven into the outbound leg. Recognising the two trip legs as distinct groups, and that
focus crosses between them every other field, requires understanding the travel content.

## Citation
> "The intent of this success criterion is to ensure that when users navigate sequentially
> through content, they encounter information in an order that is consistent with the
> meaning of the content and can be operated from the keyboard."
— wcag-understanding/focus-order.html (Intent of Focus Order)

> "Determine if the focus order impacts the page meaning (e.g., form fields for a mailing
> address are presented in the expected sequence)."
— refs/trusted-tester/sc-2.4.3-focus-order.md (Test 4.F — How to Test, step 2)
