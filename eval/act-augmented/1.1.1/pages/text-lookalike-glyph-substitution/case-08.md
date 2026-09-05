# case-08 — PASS paired repair of case-01

## Scenario and source pair

This is the counterfactual PASS partner for **case-01** in the same aspect. It preserves the
source page’s domain, layout, content, visual treatment, and interaction complexity. The paired
source scenario is:

> Recipe site marketing hero <h1> 'Anyone can cook tonight.' where the word 'cook' is the verbatim F71 example string (U+03F2 Greek lunate sigma, U+043E Cyrillic o, U+03BF Greek o, U+006B Latin k); only the final k is Latin, no text alternative.

## Exact repair

Replaced only the mixed Greek/Cyrillic look-alike code points with the intended Latin text “cook”. No unrelated target-SC condition was removed.
The HTML includes a machine-readable pairing comment naming case-01 and this repair.

## Primary selector

`section.hero > h1 > span.verb`

## Accessibility mechanism

The hero still reads and looks “Anyone can cook tonight,” but the verb is now genuine Latin text. English TTS receives the intended word directly rather than mixed-script confusables.

## Expected ACT-style outcome

**passed** — this is a deliberately close negative example at the target SC boundary. The original
failure context remains, but the information or interaction path required by the criterion is now
available.

## Why this is a useful hard negative

This hard-negative control is intentionally near-identical to failing case-01. Presence-only or static heuristics can easily treat the pair alike; the correct pass depends on verifying the precise repaired boundary: replaced only the mixed Greek/Cyrillic look-alike code points with the intended Latin text “cook”.

## Citation retained from the source case

**Reference:** WCAG Technique F71 (wcag-techniques/failures/F71.html)

> The following word looks, in browsers with appropriate font support, like the English word "cook", yet is composed of the string U+03f2 U+043E U+03BF U+006B, only one of which is a letter from the Western alphabet. This word will not be processed meaningfully, and a text alternative is not provided.

