# case-02 — Order confirmation titled "Thank you!"

- **SC:** 2.4.2 Page Titled (Level A)
- **Aspect:** title-meaningless-out-of-context (Limb 2 — descriptiveness)
- **Expected ACT outcome:** **failed**
- **Page:** `case-02.html`

## Scenario
An order-confirmation ("receipt") page for Lantern Books, order LB-2026-77310. The
body identifies the merchant, order number, shipping recipient, arrival window, and
line items. The `<title>` is the interjection **"Thank you!"** — no order number, no
merchant, no subject.

## Element / selector carrying the issue
`head > title` (text `Thank you!`). The visible `h1` ("Thank you for your order!")
and the `.check` confirmation glyph supply the co-present context.

## Exact accessibility mechanism (what AT experiences)
The page is announced and shown in the tab as **"Thank you!"**. Every confirmation,
newsletter signup, donation receipt, RSVP, and contact-form success page on the web
can carry that exact title, so it distinguishes nothing. A user with cognitive or
short-term-memory disabilities who keeps the tab open to find the receipt later, or
who scans browser history for "my book order", has no anchor: the title names neither
the order nor the store. The confirmation is perfectly clear **while the body is in
view**; the failure manifests only when the title is consumed out of context, in a
tab strip / history list / window switcher.

## Why automated tools miss it
- **2779a5 (non-empty title):** passes — title present and non-empty.
- **c4a8a4 (descriptive), automated parts:** the phrase "Thank you" appears verbatim
  in the H1 and lead, so any title/body lexical-agreement signal is satisfied. axe,
  WAVE, and Lighthouse cannot tell that "Thank you!" identifies no page when detached
  from this receipt — distinguishing a generic pleasantry from an identifier is a
  semantic human judgement, not a string or DOM property.

## Citation
> **Reference:** WCAG Understanding 2.4.2 — *Benefits of Page Titled*
> (`wcag-understanding/page-titled.html`)
>
> "People with cognitive disabilities, limited short-term memory and reading" […]
> "also benefit from the ability to identify content by its title."

> **Reference:** WCAG Technique G88 — *Providing descriptive titles for web pages*
> (`wcag-techniques/general/G88.html`)
>
> "A descriptive title allows a user to easily identify what web page they are using
> and to tell when the web page has changed. The title can be used to identify the
> web page without requiring users to read or interpret page content."

> **Reference:** Trusted Tester v5.1.3 — *Test 12.B `2.4.2-page-title-purpose`*
> (`refs/trusted-tester/sc-2.4.2-page-titled.md`)
>
> "Determine whether the Page Title is a **meaningful representation or indication**
> of page content."
