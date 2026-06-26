# H-meta: the 14 run10 FPs decomposed — the raw FP count overstates harness error

Each FP verified against its fixture. Three classes:

## Class A — genuine reasoning/semantic errors (6)
| case | SC | error | status |
|---|---|---|---|
| cc0f0a | 2.4.6 | duplicate label not credited by visible section heading | **FIXED (component A)** |
| b49b2e | 2.4.6 | single-letter index heading flagged | **FIXED (component A)** |
| 5effbb/a1e9ff29 | 2.4.4 | format link not credited by `<th>` row-subject | component B (reverted: overfit) |
| fd3a94 ×3 | 2.4.4 | same-name links to DIFFERENT-but-EQUIVALENT destinations (about/contact vs careers/contact; act-rules vs w3.org/act) flagged as barriers — the rule (`...serve-equivalent-purpose`) PASSES them | hard semantic; resolve_destination would WORSEN (confirms different href) |

→ 2 fixed; 4 residual are hard semantic + overfitting-risky. resolve_destination does NOT help fd3a94 (the issue is equivalent-PURPOSE judgment, not destination resolution).

## Class B — applicability/exemption gaps (5) — COHERENT, addressable
The LLM judges the barrier without first checking the SC even applies / an exemption holds:
| case | SC | missing applicability check |
|---|---|---|
| 23a2a8/cd3b3a40, 7d6734/1f222380, 7d6734/ec2a7a47 | 1.1.1 | SVG is GT=**inapplicable** (decorative / not info-bearing) — flagged "no accessible name" |
| 2845a840 | 1.4.3 | content is `----====++++` non-language symbols — WCAG "text" = human language, so 1.4.3 N/A |
| 0va7u6/671c8b76 | 1.4.5 | `<input type=image>` "A" size-controls — image-of-text in a functional control (essential exemption) |

→ This is the SINGLE LARGEST addressable class, and it's one failure MODE: **no applicability-first gate.** Each
exemption carries its own FN risk (a real informative SVG / legit symbol label / decorative image-of-text), so a
generic prompt may be too blunt — needs testing.

## Class C — GT/tool nuance + threshold-classification (3)
| case | SC | nature |
|---|---|---|
| 319a4651 | 1.4.3 | text-shadow halo (flat 4.43) — **FIXED (shadow calc)** |
| dc170fd0 | 1.4.3 | text over a background-image — hard perceptual, no flat ratio |
| eb4bfbbe | 1.4.3 | `<button aria-label=Close>X</button>` #666/#000=3.66 — 'X' close-icon: large-text/icon (1.4.11) classification, not normal-text 1.4.3 |

## Takeaway
- **Already fixed this session: 3** (cc0f0a, b49b2e, 319a4651).
- **Residual 11**, of which **5 are applicability gaps (Class B)** — the most promising, most coherent lever (H6/H9).
- **4 are hard semantic (Class A residual)** — overfitting-risky, defer to held-out corpus.
- **fd3a94 ×3 are equivalent-purpose semantics**, NOT a resolve_destination corpus-mismatch (earlier mislabel corrected).
- The **true real-world harness-error rate is below the raw 14/392**: several FPs are defensible GT-nuance (shadow now
  fixed; non-language/decorative are genuine WCAG exemptions the harness simply doesn't yet encode).
