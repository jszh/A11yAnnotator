# case-06 — PASS trap: harmless mobile `order` reshuffle of independent KPI cards + decorative banner

## Scenario
A SaaS analytics dashboard ("Lattice Analytics — Overview"). The overview row holds a decorative
marketing **banner** ("New: schedule and email your reports…") and three **independent KPI cards**
(Visitors, Revenue, Conversion rate). None of these depends on the others for meaning: each card
is a complete, self-contained statistic, and the banner is decorative/promotional. Desktop source
and visual order is Banner, Visitors, Revenue, Conversion.

This page uses the **same mechanism** as the failing cases in this set — a `max-width:640px` media
query that reassigns CSS flex `order` — but here the reorder is **harmless**: on mobile the
decorative banner is pushed to the bottom and the three cards are reshuffled (Revenue, Visitors,
Conversion). Because the sequence is **not order-dependent**, the meaning is identical at both
viewports. This is the deliberate **PASS / over-flagging trap**: an evaluator who flags any
breakpoint `order` reorder would wrongly fail this page.

## Attribute tuple
- **content-domain:** SaaS analytics dashboard
- **UI-component/pattern:** KPI summary cards row + decorative promo banner (flex layout)
- **host-language construct:** flexbox `order` reassigned inside `@media (max-width:640px)`
- **locale/i18n:** en (US)
- **failure-mechanism:** NONE — responsive `order` reflow of a sequence whose order is *not*
  meaningful (independent cards + decorative banner); included to penalize blind flagging

## Developer persona
A front-end engineer who, on phones, wanted the headline numbers above the marketing banner and
let the design system's responsive card grid reshuffle cards by importance. They correctly judged
that the cards are independent and reorderable, and that the banner is decorative, so they used
`order` freely — a legitimate, common, accessible use of responsive reordering.

## Element / selector carrying the issue (here: the deliberately-harmless reorder)
`.overview` flex children — `@media (max-width:640px) { .promo { order:9 } .card-revenue { order:1 }
… }`. The reorder is real and present, but the reordered items carry no order-dependent meaning.

## Exact accessibility mechanism (what AT experiences / why it PASSES)
At ≤640px the rendered order is Revenue, Visitors, Conversion, Banner; the DOM order is Banner,
Visitors, Revenue, Conversion. (a) A **sighted mobile user** reads three self-contained statistics
in some order, then a decorative banner — every card still parses on its own; no statistic's
meaning depends on appearing before or after another, and the banner conveys no information whose
position matters. (b) A **screen-reader user** reads the DOM order — banner, then the three cards —
which also makes complete sense. Crucially, **there is at least one programmatically determinable
sequence that makes sense**, and changing the relative order of these items does not change any
meaning. This matches the Understanding doc's principle that order is not always meaningful (the
"magazine article with callout sidebars" case). No instruction is split, no step sequence inverted,
no cross-reference broken, no directional convention violated. Therefore 1.3.2 is satisfied at both
viewports.

## Expected ACT-style outcome
**passed**

## Why automated tools miss it (and why a human is still required)
Automated tools would not flag this (correctly), but they also could not *certify* it as a pass for
the right reason: they cannot tell that these particular items are order-independent. The value of
this page is for the human/LLM evaluator — the same surface signal (a `max-width` media query
applying `order`) that produced a failure in cases 01–05 is present here, so an evaluator must NOT
pattern-match on "breakpoint reorder = fail." The correct verdict requires reading the content,
recognizing the cards are independent statistics and the banner is decorative, and concluding the
reorder does not affect meaning. This guards the aspect against over-flagging.

## Citation
> **WCAG Understanding 1.3.2, Intent:**
> "The order of content in a sequence is not always meaningful. For example, the relative order of
> the main section of a web page and a navigation section does not affect their meaning. … As
> another example, a magazine article contains several callout sidebars. The order of the article
> and the sidebars does not affect their meaning."

(Verbatim from `wcag-understanding/meaningful-sequence.html`. The independent KPI cards and the
decorative banner are analogous to article + callout sidebars: their relative order does not affect
meaning, so the responsive reorder is permitted and the page passes.)

> **WCAG Understanding 1.3.2, Intent (clarity list):**
> "Providing a particular linear order is only required where it affects meaning."

(Verbatim from `wcag-understanding/meaningful-sequence.html`. Because no order here affects meaning,
no particular linear order is required, and the breakpoint reorder is not a failure.)
