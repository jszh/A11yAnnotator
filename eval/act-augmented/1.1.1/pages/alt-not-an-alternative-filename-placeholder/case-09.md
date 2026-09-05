# case-09 — PASS paired repair of case-02

## Scenario and source pair

This is the counterfactual PASS partner for **case-02** in the same aspect. It preserves the
source page’s domain, layout, content, visual treatment, and interaction complexity. The paired
source scenario is:

> E-commerce product-card grid where each thumbnail depicts a visually distinct item (yellow rain jacket, green hiking boot, blue bottle, orange daypack) but every image's alt is its CMS storage slug, e.g. alt="prod-9921-thumb-2".

## Exact repair

Replaced each CMS storage slug with an accurate description of its unchanged product thumbnail. No unrelated target-SC condition was removed.
The HTML includes a machine-readable pairing comment naming case-02 and this repair.

## Primary selector

`ul.grid li.card a.thumb img`

## Accessibility mechanism

Each product image retains its pixels, link, and surrounding card but now has an alt that identifies the item and visible colour/size rather than a prod-#### storage token.

## Expected ACT-style outcome

**passed** — this is a deliberately close negative example at the target SC boundary. The original
failure context remains, but the information or interaction path required by the criterion is now
available.

## Why this is a useful hard negative

This hard-negative control is intentionally near-identical to failing case-02. Presence-only or static heuristics can easily treat the pair alike; the correct pass depends on verifying the precise repaired boundary: replaced each CMS storage slug with an accurate description of its unchanged product thumbnail.

## Citation retained from the source case

**Reference:** eval/act-augmented/1.1.1/pages/alt-not-an-alternative-filename-placeholder/case-02.md

> programming references that do not convey the information or function of the non-text content such as "picture 1", "picture 2" or "0001", "0002" or "Intro#1", "Intro#2".

