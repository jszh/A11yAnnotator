# case-08 — PASS paired repair of case-01

## Scenario and source pair

This is the counterfactual PASS partner for **case-01** in the same aspect. It preserves the
source page’s domain, layout, content, visual treatment, and interaction complexity. The paired
source scenario is:

> Winter-Games spectator guide with an inline-SVG street map of five venues. The figcaption names each venue and its sport but states no addresses, streets, distances, or spatial relationships — the verbatim F67 Olympic-venue-map failure transposed to a self-contained page.

## Exact repair

Completed the existing figcaption with the map’s street, river, station, direction, and relative-location information. No unrelated target-SC condition was removed.
The HTML includes a machine-readable pairing comment naming case-01 and this repair.

## Primary selector

`figure > svg[role="img"][aria-labelledby="mapTitle mapDesc"]`

## Accessibility mechanism

The caption still lists sports and venues and now also states each venue’s direction from Frostvale Station, relationship to Birch Street/Summit Boulevard/Vale River, and the rail line’s route. The long description now conveys the spatial message of the map.

## Expected ACT-style outcome

**passed** — this is a deliberately close negative example at the target SC boundary. The original
failure context remains, but the information or interaction path required by the criterion is now
available.

## Why this is a useful hard negative

This hard-negative control is intentionally near-identical to failing case-01. Presence-only or static heuristics can easily treat the pair alike; the correct pass depends on verifying the precise repaired boundary: completed the existing figcaption with the map’s street, river, station, direction, and relative-location information.

## Citation retained from the source case

**Reference:** WCAG Techniques — F67 (wcag-techniques/failures/F67.html)

> While this description provides useful information, it does not convey the same information as the image because it provides no specific location information such as the address or the distance of each location from some fixed point.

