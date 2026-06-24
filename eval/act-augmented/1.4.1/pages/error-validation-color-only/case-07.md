# case-07 — TRUE-NEGATIVE (RTL): dark-red invalid border vs light-gray valid border, >3:1 lightness (PASSES via escape hatch)

## Scenario
An Arabic (RTL) mobile-banking **transfer** form in its post-submit error state. The invalid "amount" field gets a **dark-red** border (`#7c0c12`); the valid fields keep a **light-gray** border (`#c1c7cd`). There is still **no inline error text and no icon** — on its surface this is the same color-only pattern as case-01. The decisive difference is **lightness**: the two border colors differ in relative luminance by ~**6.4:1**, far above the 3:1 the WCAG note allows. In grayscale the invalid border reads as a conspicuously **darker, heavier line** than the pale valid borders, so a non-color visual distinction (lightness) survives when hue is removed. Per the Understanding note, that counts as an additional visual distinction — so this **passes** 1.4.1. It is included as the subtlest boundary case: it looks like a failure but is rescued by the lightness escape hatch.

## Attribute tuple
- **content-domain:** online banking / fintech (money transfer)
- **UI-component / pattern:** mobile RTL transfer form, post-submit validation
- **host-language construct:** `dir="rtl" lang="ar"`; valid `.ok { border:#c1c7cd }` vs invalid `.bad { border:#7c0c12 }`, distinguished by luminance ≥3:1
- **locale / i18n:** ar-SA, RTL, SAR currency (genuine long-tail: i18n + escape-hatch combined)
- **failure-mechanism:** none — the escape hatch in the Understanding note: colors that differ in lightness by ≥3:1 provide a non-hue visual distinction

## Developer persona
A bank's design team, after a prior audit dinged them for color-only error borders, chose a **very dark red** for the error state precisely so it would still read as "different and heavier" in grayscale / for color-blind users, and verified the luminance delta against the neutral border cleared 3:1. They consciously leaned on the lightness escape hatch (though they know adding text would also help 3.3.1). The RTL context is incidental: this is their production Arabic app.

## Element / selector carrying the issue (here: the cue that makes it PASS)
`#amount.bad` — dark-red border `#7c0c12`. Against the valid `.ok` border `#c1c7cd`, the luminance contrast is ~6.4:1, so the distinction is carried by lightness, not hue alone.

## Exact accessibility mechanism (what AT experiences / why it passes)
- **Sighted, full-color user:** sees a dark-red border on the amount field — clearly the field to fix.
- **Sighted color-blind / low-vision user / grayscale:** with hue removed, the invalid border is a markedly **darker** line than the light-gray valid borders (6.4:1 luminance gap). The user can still single out the field by its conspicuously darker/heavier outline. Because the difference is **lightness**, not "is this red or green?", the "must perceive a particular color" caveat does not apply — there is a luminance distinction, not a hue-identification dependency.
- **Screen-reader user:** hears no per-field error (no `aria-invalid`, no message) — a real 3.3.1/4.1.2 gap, but those are out of 1.4.1's scope, and 1.4.1 is satisfied because a *visible* non-color (lightness) distinction exists.

## Expected ACT-style outcome
**passed** (SC 1.4.1 — the invalid/valid borders differ in lightness with luminance contrast ≥3:1, satisfying the Understanding note's escape hatch; the distinction is not by hue alone).

## Why automated tools miss it (and why a naive human might mis-fail it)
Automated tools never reach the post-submit state and, even if they did, do not compute border-to-border luminance deltas to decide the escape hatch — they would simply find a labeled input with a CSS border and pass it (for the wrong reason). The interesting failure mode is a *human* over-flagging: a naive evaluator sees "red border, no text" and calls it F81 like case-01. The correct judgment requires recognizing the lightness difference clears 3:1 (do the grayscale test: the invalid border stays distinctly darker), which is exactly the human reasoning this case probes.

## Citation
> "If content is conveyed through the use of colors that differ not only in their hue, but that also have a significant difference in lightness, then this counts as an additional visual distinction, as long as the difference in relative luminance between the colors leads to a contrast ratio of 3:1 or greater."
— wcag-understanding/use-of-color.html (Intent, note)

> "It would also not fail if the color chosen had sufficient luminosity difference (lightness) from the other text that it would be easily be seen as different if viewed in black and white. A minimum contrast ratio of 3:1 is considered sufficient."
— wcag-techniques/failures/F81.html (Examples, note)

> "Displaying content in grayscale may help identify content that uses only color to convey information."
— refs/trusted-tester/sc-1.4.1-use-of-color.md (Identify Content) — in grayscale the dark-red border remains distinctly darker, so this passes.
