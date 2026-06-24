# case-01 — "Verified seller" badge hidden from AT (alt=""/role=presentation)

## Scenario
A MarketNest marketplace listing for a $128 handwoven throw. Next to the store name
"Lumen & Loom Home Goods" sits a green circular checkmark — the marketplace's
"Verified seller" badge, awarded only to sellers who passed government-ID and
business-registration verification. The badge is rendered as an inline `<svg>` inside a
`role="presentation"` wrapper, with `aria-hidden="true"` on the SVG, so it is correctly
removed from the accessibility tree per the markup. The page footer explains the *convention*
("the green check badge means the seller completed verification"), but nothing in the DOM
states that **this** seller has it: the only per-listing carrier of "this seller is
verified" is the visible check, which AT cannot reach. Unverified sellers render the same
row without the check, so the badge's presence is load-bearing.

## Attribute tuple
- **content-domain:** online marketplace / e-commerce trust signalling
- **UI-component/pattern:** seller card with trust badge
- **host-language construct:** inline `<svg aria-hidden="true">` inside a `<span role="presentation">`
- **locale/i18n:** en (US)
- **failure-mechanism:** informative trust badge suppressed from AT via decorative declaration (F38/F39 inverted — author fiat wrongly invokes the decoration exception)

## Developer persona
A front-end engineer building the seller-card component pulled the verification check
straight from the design system's icon set. Icon-set components ship with
`aria-hidden="true"` by default (so decorative icons don't pollute the SR experience), and
the engineer dropped it in without overriding that default — never reasoning that, unlike a
decorative flourish, THIS icon's mere presence is the data. They assumed "the footer
explains the badge, so we're covered," missing that the per-seller signal still vanishes.

## Element / selector carrying the issue
`.seller-row .badge[role="presentation"] > svg[aria-hidden="true"]`

## Exact accessibility mechanism (what AT experiences, why it fails)
A screen-reader user navigating the seller row hears: "Lumen & Loom Home Goods · 4.9 stars
(2,317 sales)." The green check — and therefore the fact that this seller is *verified* —
is entirely absent from what AT exposes, because the wrapper is `role="presentation"` and
the SVG is `aria-hidden="true"`. A sighted user instantly sees "verified seller, safe to
buy"; the AT user gets no such assurance and cannot distinguish this seller from an
unverified one. The image conveys information (verification status) and is the **only**
means of conveying it per-listing, so under SC 1.1.1 it must carry a text alternative
(e.g. `aria-label="Verified seller"`). Declaring it decorative is a contextual F38/F39
failure: the "decorative" exception does not apply to content that conveys information.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The markup is internally consistent and valid. ACT rule **46ca7f** ("Element marked as
decorative is not exposed") PASSES — the element is correctly absent from the tree. ACT rule
**e88epe** ("Image not in the accessibility tree is decorative") treats a properly
hidden image as decorative by construction. ACT rule **23a2a8** ("Image has non-empty
accessible name") never applies, because this image deliberately has no name. axe-core,
WAVE, and Lighthouse all treat `aria-hidden`/`role=presentation` graphics as intentionally
decorative and never ask whether the badge *should* have been informative. Deciding that
this particular checkmark is the sole carrier of a verification fact requires SEEING the
green check, recognising it as a trust signal, and reasoning that hiding it strips needed
information — a pure intent/meaning judgment no static check performs.

## Citation
> **WCAG 2.2 Understanding Non-text Content, "Sometimes there is non-text content that really is not meant to be seen or understood by the user":**
> "Transparent images used to move text over on a page; an invisible image that is used to track usage statistics; and a swirl in the corner that conveys no information but just fills up a blank space to create an aesthetic effect are all examples of this... This type of non-text content, therefore, is marked or implemented in a way that assistive technologies (AT) will ignore it and not present anything to the user."

(Verbatim from `wcag-understanding/non-text-content.html`. The decoration exception is
defined as content that "conveys no information"; a Verified-seller badge conveys
verification status and so falls OUTSIDE this exception — hiding it from AT is the failure.)

> **Trusted Tester v5.1.3, Test 7.B — Decorative image, How to Test:**
> "Determine if the image is the **only means of conveying important information** on the page."

(Verbatim from `refs/trusted-tester/sc-1.1.1-non-text-content.md`. Test 7.B PASSES only if
"The image is **NOT** the only means of conveying important information." Here the badge IS
the only per-listing means of conveying verification status, so it fails 7.B condition 1.)
