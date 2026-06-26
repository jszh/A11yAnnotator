# Systematic error decomposition (stable across 3 identical runs)

Of the 21 stable-WRONG cases (caught identically in all 3 baseline runs): **14 FN + 7 FP**.
Recall (missed barriers) is the LARGER systematic problem.

## Systematic FN (GT-fail missed in ALL 3 runs) — 14
| SC | n | cases |
|---|---|---|
| 2.1.2 keyboard-trap | 3 | 8fba3918, 62fd24e7, 7dcc4ae0 |
| 4.1.2 name-role-value | 3 | c1cc2a71, ac65ce86, 4d33680e |
| 1.1.1 non-text | 3 | e5b8fa7a, 5d0c52f3, 9ff50232 |
| 1.4.5 images-of-text | 2 | e1d4ed75, bf023941 |
| 2.4.4 link-purpose | 2 | dddcd76a, 7ebe961d |
| 2.4.2 page-title | 1 | 4c72b3b9 |

→ These are barriers the harness CONSISTENTLY MISSES — a recall/evidence-provisioning problem, NOT addressed
by any FP-focused lever. Overlaps DEFERRED-TODO item B (screenshot+LLM discovery/triage lane) and the
evidence-starvation theme of the routing analysis. The adversarial critic (H7) would WORSEN this (it removes
barriers).

## Systematic FP (GT-pass flagged in ALL 3 runs) — 7
| SC | n | cases | class |
|---|---|---|---|
| 1.1.1 | 2 | 1f222380, ec2a7a47 | SVG-decorative (applicability) |
| 1.4.3 | 2 | dc170fd0 (bg-image), 2845a840 (non-language) | perceptual + applicability |
| 2.4.4 | 2 | a1e9ff29 (table-context), 228c0a3d (equivalent-purpose) | reasoning |
| 1.4.5 | 1 | 671c8b76 | image-of-text essential (applicability) |

→ The 7 stable FPs match the H-meta classes: ~4 applicability + ~2 reasoning + 1 perceptual. These are the
TRUE reproducible harness-precision errors (vs the raw 14 in any single run — half of which are noise).
