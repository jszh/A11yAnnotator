# case-04 — "Basic plan — $0/mo: Get started free" CTA whose href jumps to the paid #enterprise-checkout

## Scenario
A SaaS pricing page with three tier cards (Basic free, Pro, Enterprise) and three on-page
sign-up sections (`#basic-signup`, `#pro-signup`, `#enterprise-checkout`). The Basic card's
call-to-action reads **"Basic plan — $0/mo: Get started free"** — a precise, purpose-rich
name. Its `href` is **`#enterprise-checkout`**, the section that begins the paid Enterprise
purchase flow ("$1,200/mo, billed annually, signed order form"). The genuine free Basic
sign-up is `#basic-signup`. Choosing the free Basic CTA delivers the user into the paid
Enterprise checkout — a real, present, contradicting destination.

## Attribute tuple
- **content-domain:** SaaS analytics dashboard (pricing)
- **UI-component / pattern:** pricing-table tier card with a primary CTA jump link
- **host-language construct:** `<a class="cta free" href="#enterprise-checkout">` on the free tier
- **locale / i18n:** en-US, USD
- **failure-mechanism:** descriptive name vs. actual destination mismatch — free-plan CTA points to the paid checkout section

## Developer persona
A growth engineer built the three cards by duplicating the Enterprise card (whose CTA
correctly targets `#enterprise-checkout`) to make the Basic and Pro cards. They updated the
visible label, price, and feature list on the Basic card but missed swapping its `href` to
`#basic-signup`. Because the CTA still scrolls to a real sign-up section and looks
on-brand, the slip was never caught — and a free-tier user being routed to enterprise
checkout reads as a "growth funnel", not a bug, to anyone skimming.

## Element / selector carrying the issue
`.grid .card:first-child a.cta.free` — accessible name "Basic plan — $0/mo: Get started
free", `href="#enterprise-checkout"`. The contradicting target is
`#enterprise-checkout` ("Enterprise checkout — $1,200/mo, billed annually"). The honest
target is `#basic-signup`.

## Exact accessibility mechanism (what AT experiences, why it fails)
- **Screen-reader user choosing a plan from the links list:** "Basic plan — $0/mo: Get
  started free" is exactly the link they want for a no-cost account. Activating it lands
  them in the **Enterprise checkout** — minimum 25 seats, annual contract, sales contact.
  The link's name described starting a free plan; the destination is a high-commitment paid
  purchase flow. The user cannot trust the name to predict the destination.
- **Cognitive / low-literacy user:** the jarring jump from "free" to "$1,200/mo, annual
  contract" is precisely the confusion 2.4.4 is meant to prevent; they may begin entering
  company/seat data thinking it is the free signup.
- The href genuinely targets `#enterprise-checkout`, which is genuinely the paid flow, so
  any agent that follows the link experiences the contradiction.

## Expected ACT-style outcome
**failed** (SC 2.4.4). The link's accessible name describes a free-Basic purpose, but its
actual on-page destination is the paid Enterprise checkout — the name does not describe the
link's real purpose.

## Why automated tools miss it
- The name is non-empty, highly specific, and unique — it passes c487ae and every
  generic/duplicate-text heuristic with flying colours.
- `#enterprise-checkout` resolves to a real section, so anchor-validity checks pass.
- All three sign-up sections exist and are well-formed; there is no structural fault.
- The contradiction is only visible if you **follow the link, read that the destination is
  the paid Enterprise checkout, and compare it to the link's "free Basic" promise** — a
  semantic judgement about price/plan meaning that no automated tool performs.

## Citation
> "The intent of this success criterion is to help users understand the purpose of each link so they can decide whether they want to follow the link."
— wcag-understanding/link-purpose-in-context.html (Intent of Link Purpose (In Context))

> "The combination of the programmatically determined link context and the ANDI Output provide adequate description of the link's purpose."
— refs/trusted-tester/sc-2.4.4-link-purpose.md (Evaluate Results — PASS if)
