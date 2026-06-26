# C8 — Small deterministic signals: status

`scripts/v3/lib/small-signals.js`. Vs 149 independent adversarial cases (6 aspects; held-out untouched):
**123/149 (82.6%); DANGEROUS = 1 false-clear, 2 false-barrier.**
- positive-tabindex-f44 (2.4.3): 24/24 — tabindex>0 fails ONLY with ≥2 focusables (an order to disrupt).
- multipart-field-grouping (4.1.2): 26/27 — split field needs a group label or named parts; wrapping-label counted;
  group-name-but-unnamed-parts → abstain (adequacy is a judgment).
- iframe-name-vs-content (4.1.2): clean — missing title/aria-label/aria-labelledby OR generic title → fail; present → abstain (describes-content semantic).
- pointer-only-handler (2.1.1): clean — inline pointer handler + not focusable + no key handler → fail; native/has-key-path → pass; addEventListener-only → abstain.
- glyph-substitution (1.1.1): PUA in own text + no alt + not aria-hidden + no container text → fail; ::before/::after meaning → abstain (semantic); homoglyph → abstain. (1 FC/1 FB residual edge.)
- long-description-presence (1.1.1): complex image + no long-desc source → fail; source present → abstain (completeness is the rubric's). (1 FB residual.)
DONE — sound; the residual 3 are edge cases the rubrics backstop.
