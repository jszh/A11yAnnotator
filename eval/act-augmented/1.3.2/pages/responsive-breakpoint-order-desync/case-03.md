# case-03 — Legal clauses reversed on mobile via `flex-direction: column-reverse`

## Scenario
A software Master License Agreement, "Section 7 — Limitation of Liability." The three
sub-clauses are a legally **order-dependent** sequence: **7.1** sets a liability cap, **7.2**
carves out exceptions to 7.1, and **7.3** opens **"Notwithstanding the foregoing, …"** — a phrase
whose entire meaning is "despite 7.1 and 7.2 above." The lead even instructs "read in the order
presented; each builds on the one before it." Source order is 7.1 → 7.2 → 7.3 (correct); desktop
renders them top-to-bottom in that order (correct).

At `max-width:640px` a developer set the sub-clause container to `flex-direction: column-reverse`
to "put the most-read clause on top and tighten spacing." This **reverses the visual order to 7.3,
7.2, 7.1.** A phone reader now sees **"7.3 Notwithstanding the foregoing…"** first — an exception
to clauses that have not yet appeared — followed by 7.2 (which references "the cap in 7.1," also
not yet seen) and finally 7.1. The clause numbers are real visible text, so they appear
descending and out of sequence, and the backward cross-references are rendered meaningless. The
legal meaning collapses at exactly one viewport.

## Attribute tuple
- **content-domain:** legal / terms & policy (software license)
- **UI-component/pattern:** numbered legal clause list (ordered sub-clauses with cross-references)
- **host-language construct:** `flex-direction: column-reverse` inside `@media (max-width:640px)`
- **locale/i18n:** en (US, legal register)
- **failure-mechanism:** responsive flow reversal of a meaning-bearing ordered sequence at one
  breakpoint (C27 confusion; F1-style meaning change conditional on viewport)

## Developer persona
A contractor implementing a legal-docs microsite from a Figma comp. On mobile the clause cards
were wrapping awkwardly, and they recalled that `column-reverse` was a quick way to flip stacking;
they applied it to "lead with the short punchy clause (7.3) and save space." They are not a lawyer
and did not register that "Notwithstanding the foregoing" is a backward reference, nor that 7.2
points at 7.1. They reviewed the desktop layout (correct order) and a quick phone glance that
"looked tidy," and shipped.

## Element / selector carrying the issue
`.clauses` container — `@media (max-width:640px) .clauses { flex-direction: column-reverse }`.
Source order of `section.clause` (7.1, 7.2, 7.3) is correct; the reversal is purely visual and
only below 640px.

## Exact accessibility mechanism (what AT experiences / why it fails)
Cross-state, viewport-conditional desync. (a) A **sighted mobile / screen-magnifier user** reads
the rendered order 7.3 → 7.2 → 7.1 and encounters "Notwithstanding the foregoing" and "the cap
in Section 7.1" before the clauses those phrases refer to exist on screen — the sequence's
meaning (a cap, then its exceptions, then an overriding carve-out) is inverted and incoherent.
The visible numbering descending (7.3, 7.2, 7.1) compounds the confusion. (b) A **screen-reader
user** reads the DOM in source order 7.1 → 7.2 → 7.3 — the correct, coherent sequence — so the
blind and sighted experiences of the same phone diverge, the exact harm C27 describes for people
working together. The order here is unambiguously meaningful (cross-referential legal clauses),
and at ≤640px the visual order no longer matches the meaningful source order. Linearizing/removing
CSS (Trusted Tester method) gives 7.1→7.2→7.3, but the rendered mobile order is 7.3→7.2→7.1 —
they do not match, so the test fails.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The DOM/source order is the correct legal order, the clause numbers are real text (no CSS-counter
renumbering to hint at a swap), and `flex-direction: column-reverse` is valid CSS. axe, WAVE, and
Lighthouse evaluate one viewport and never render the ≤640px reversed state. Even rendered, no
automated rule can read "Notwithstanding the foregoing" and infer it is a backward reference that
breaks when the foregoing clauses appear after it — that demands legal-semantic comprehension plus
a comparison of the two rendered states. The desktop DOM and the mobile DOM are byte-identical;
the defect exists only in the rendered geometry at one width. No single-viewport DOM-vs-visual
tool can detect it.

## Citation
> **WCAG Understanding 1.3.2, Intent:**
> "A sequence is meaningful if the order of content in the sequence cannot be changed without
> affecting its meaning."

(Verbatim from `wcag-understanding/meaningful-sequence.html`. The cross-referencing clauses are
such a sequence; `column-reverse` changes the order and thereby the legal meaning at ≤640px.)

> **Trusted Tester v5.1.3, Test 15.A — Evaluate Results (PASS if):**
> "The sequence and meaning of the content (in context) is understandable without CSS
> positioning."

(Verbatim from `refs/trusted-tester/sc-1.3.2-meaningful-sequence.md`. The mobile render relies on
CSS flow-reversal to determine clause order; stripping it changes the sequence — and at the
breakpoint the rendered sequence is not understandable in context, so this fails Test 15.A.)
