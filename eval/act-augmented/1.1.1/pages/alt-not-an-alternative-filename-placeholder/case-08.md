# case-08 — PASS paired repair of case-01

## Scenario and source pair

This is the counterfactual PASS partner for **case-01** in the same aspect. It preserves the
source page’s domain, layout, content, visual treatment, and interaction complexity. The paired
source scenario is:

> Local-news article hero photo depicting a transit-fare protest (crowd marching past a domed City Hall, banners reading 'FAIR FARES'/'NO HIKE') whose alt is the raw DSLR camera filename alt="DSC_0481.JPG".

## Exact repair

Replaced only the DSLR filename alt with a concise description of the unchanged protest photo. No unrelated target-SC condition was removed.
The HTML includes a machine-readable pairing comment naming case-01 and this repair.

## Primary selector

`article figure img[alt^="Transit-fare protesters"]`

## Accessibility mechanism

The image now exposes a text alternative describing the transit-fare protest, City Hall setting, and meaningful signs instead of the meaningless camera filename DSC_0481.JPG.

## Expected ACT-style outcome

**passed** — this is a deliberately close negative example at the target SC boundary. The original
failure context remains, but the information or interaction path required by the criterion is now
available.

## Why this is a useful hard negative

This hard-negative control is intentionally near-identical to failing case-01. Presence-only or static heuristics can easily treat the pair alike; the correct pass depends on verifying the precise repaired boundary: replaced only the DSLR filename alt with a concise description of the unchanged protest photo.

## Citation retained from the source case

**Reference:** eval/act-augmented/1.1.1/pages/alt-not-an-alternative-filename-placeholder/case-01.md

> filenames that are not valid text alternatives in their own right such as "Oct.jpg" or "Chart.jpg" or "sales\oct\top3.jpg"

