# ACT-Augmented Corpus — Final Summary

Generated for all 22 in-scope WCAG SCs. Each SC has a list of aspects the synthetic W3C ACT tests do NOT cover, and >=5 **valid human-judgment** test pages per aspect (issues that require human semantic/contextual/visual judgment — not axe/WAVE/Lighthouse-detectable), each adversarially CDP-verified and grounded with a verbatim citation.

**Totals: 22 SCs · 150 uncovered aspects · 904 valid pages (926 HTML files on disk).**

| SC | Title | Level | Aspects | Valid pages |
|----|-------|-------|---------|-------------|
| 1.1.1 | Non-text Content | A | 7 | 49 |
| 1.3.1 | Info and Relationships | A | 9 | 54 |
| 1.3.2 | Meaningful Sequence | A | 7 | 42 |
| 1.4.1 | Use of Color | A | 7 | 43 |
| 1.4.10 | Reflow | AA | 7 | 47 |
| 1.4.11 | Non-text Contrast | AA | 7 | 42 |
| 1.4.13 | Content on Hover or Focus | AA | 6 | 34 |
| 1.4.3 | Contrast (Minimum) | AA | 8 | 46 |
| 1.4.5 | Images of Text | AA | 6 | 36 |
| 2.1.1 | Keyboard | A | 6 | 36 |
| 2.1.2 | No Keyboard Trap | A | 7 | 40 |
| 2.4.10 | Section Headings | AAA | 7 | 42 |
| 2.4.2 | Page Titled | A | 5 | 31 |
| 2.4.3 | Focus Order | A | 8 | 47 |
| 2.4.4 | Link Purpose (In Context) | A | 6 | 35 |
| 2.4.6 | Headings and Labels | AA | 7 | 41 |
| 2.4.7 | Focus Visible | AA | 6 | 36 |
| 3.3.1 | Error Identification | A | 6 | 40 |
| 3.3.2 | Labels or Instructions | A | 6 | 34 |
| 3.3.3 | Error Suggestion | AA | 7 | 40 |
| 4.1.2 | Name, Role, Value | A | 8 | 47 |
| 4.1.3 | Status Messages | AA | 7 | 42 |
| **Total** | | | **150** | **904** |

## Method
Per SC: study ACT rules+cases (intent map) → 5 independent reasoning lenses → synthesized uncovered-aspect list → construct >=5 pages/aspect (Verbalized-Sampling + persona/attribute conditioning + Evol-Instruct hardness + Self-Instruct dedup) → adversarial CDP verify (Chromium AX tree, no axe) → Self-Refine repair → deterministic scoring. See `_tools/PIPELINE-CHANGELOG.md`, `docs/analysis/ACT-AUGMENTATION-METHODS.md`. Per-SC outputs: `<sc>/{pages,README.md,summary.json,result.json}`. Seed palette: `_seeds/` (142 grounded patterns + facets).
