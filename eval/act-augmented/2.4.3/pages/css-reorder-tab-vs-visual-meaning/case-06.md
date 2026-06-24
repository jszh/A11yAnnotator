# case-06 — Bakery footer: flex `order` scrambles a social-links row, but order doesn't affect meaning (PASS / DNA)

## Scenario
The footer of "Birchwood Bakehouse" has a row of five social-media links — Instagram,
Facebook, TikTok, Pinterest, YouTube. The DOM order is **Facebook, Instagram, TikTok,
Pinterest, YouTube**, but CSS flexbox `order` paints them left-to-right as **Instagram,
Facebook, YouTube, TikTok, Pinterest**. With **no positive tabindex and no script**, the
keyboard Tab order follows the DOM, so it does **not** match the visual left-to-right
order. However, these links form an **unordered set**: there is no sequence, dependency,
or relationship among "follow us on X" links. The order in which they receive focus has no
effect on the meaning or operability of the page. Per the Trusted Tester note, a row of
social-media icon links "may not need to be navigated in a particular order," so the test
**Does Not Apply** (equivalently, it passes — there is no failure). This is the deliberate
**inapplicable / boundary** case that guards against over-flagging any reorder.

## Attribute tuple
- **content-domain:** restaurant / local bakery marketing site
- **UI-component / pattern:** footer row of social-media links (orderless link set)
- **host-language construct:** CSS flexbox `order:1..5` rearranging `<li>` children vs DOM order; no `tabindex`, no JS
- **locale / i18n:** en-GB (British spelling "favourite")
- **failure-mechanism:** NONE / inapplicable — focus order ≠ visual order, but the links carry no sequence or relationship, so meaning/operation are unaffected

## Developer persona
A small-business owner using a lightweight site template tweaked the footer's social row.
They added the links in whatever order they signed up for the platforms (Facebook first,
historically), then later used a couple of `order:` CSS rules a friend suggested to put
Instagram first visually "because that's where we post most." They never touched the
source order. Because social links have no inherent sequence, the resulting tab/visual
mismatch is harmless.

## Element / selector carrying the issue
The five `.social li` items. DOM order (`.s-fb, .s-ig, .s-tt, .s-pin, .s-yt`) differs from
the visually-rendered order produced by `order:2/1/4/5/3`. The mismatch is real but
inconsequential because the set is unordered.

## Exact accessibility mechanism (what AT experiences, why it PASSES / DNA)
- **Sighted keyboard / switch user:** Tab visits the social links in DOM order (Facebook,
  Instagram, TikTok, Pinterest, YouTube), which differs from the left-to-right visual
  order. But there is no task, sequence, or relationship that the order could break — each
  link independently opens a social profile. The user can reach and activate any link;
  meaning and operability are fully preserved regardless of order.
- The Trusted Tester procedure explicitly carves this out: "When focus order does not
  affect meaning or operability, this test Does Not Apply (e.g., a row of icons linking to
  social media may not need to be navigated in a particular order)."
- Contrast with the FAIL cases (01, 02, 05): there the reordered focusable elements DO
  carry a sequence/relationship (submit-after-fields, paired applicants, numbered steps).
  Here they do not.

## Expected ACT-style outcome
**inapplicable** (SC 2.4.3). The focus order does not affect the meaning or operability of
the page (an unordered set of social links), so the focus-order test does not apply. (A
reviewer who prefers a binary disposition would mark **passed** — there is no failure
either way; the key is that it must NOT be flagged.)

## Why automated tools miss it / over-flagging trap
- A naive "visual order ≠ DOM order" detector would flag this footer, because the mismatch
  genuinely exists. No automated tool ships such a rule precisely because the disposition
  hinges on whether the focusable elements form a *meaningful sequence* — a human judgment.
  axe/WAVE/Lighthouse see five valid, named links and report nothing, which is correct. The
  case is included so a judge recognizes an orderless link set and declines to flag it.

## Citation
> "When focus order does not affect meaning or operability, this test Does Not Apply (e.g., a row of icons linking to social media may not need to be navigated in a particular order)."
— refs/trusted-tester/sc-2.4.3-focus-order.md (Notes)

> "If there is more than one order that preserves meaning and operability, only one of them needs to be provided."
— wcag-understanding/focus-order.html (Intent of Focus Order — "For clarity")
