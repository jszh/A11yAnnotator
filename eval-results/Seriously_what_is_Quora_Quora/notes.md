# Evaluation notes — Seriously_what_is_Quora_Quora

## Collector / driver issues
- No problems[] in either collect.json or drive.json.
- el1 appearance shot is very dark/near-black; cannot read text visually. Focus diff was `computed-only` (element off-screen at collection time). Focus verdict left PARTIAL.
- Multiple focus shots (el2, el3, el4, el5, el6, el8, el10, el11, el12, el13, el21) appear nearly identical unfocused vs focused — dark crops with no visible ring change. The computed outline `rgba(72,148,253,0.35)` on a dark background produces very low perceptibility even when technically `solid`.

## XPath mismatches
- el6 in collect.json points to the outer div container; the drive.json localTabWalk for el6 targeted the inner `button, Hide` stop (not the David Moore link `a[1]`). The srWalk correctly reaches the inner `link, David Moore` anchor. Collect and drive diverged due to different XPath resolution. Both confirm the outer div has no role/name (4.1.2).

## Snapshot fidelity
- `scriptsDisabled=false`, `noscript=false` — JS ran normally.
- `activate.gone=true` for el6 — the element disappeared after click/Enter, suggesting navigation occurred. Focus return could not be tested.
- The promoted content card (el14) `keyboard.respondedToEnter=false` confirmed; the card is genuinely not keyboard operable despite having tabindex=0.

## axe flags not in sampled elements
- `aria-allowed-attr`: 12 nodes use `aria-haspopup="dialog"` on divs with no dialog role — these are not among the 21 sampled elements but represent a systemic pattern across answer headers.
- `label-content-name-mismatch`: 16 nodes (Upvote, comment count, share buttons) — only el4 and el12 in sample; pattern is page-wide.
- `target-size`: 3 small author-photo links below 24px — only el2 (13x16px) confirmed in sample; two others in answer items 1/2/3 not individually sampled.
- `button-name`: 1 unnamed button (not in the 21 sampled elements).
- `region`: 81 nodes outside landmarks — consistent with zero landmarks finding.

## Ambiguities
- el5 "Continue Reading" driver says `indicatorPresent=True` but `visibleDiffPct=0` and shots are identical. The computed inset boxShadow `rgba(230,231,232,0.2) 0px 0px 0px 1px inset` is the button's border styling, not a focus indicator. Override to REPRODUCED is correct.
- el7/el8/el11 focus: `indicatorPresent=True` with very low diff (0.01, 0, 0) and computed outline `solid 3px rgba(72,148,253,0.35)`. These are related-question links with proper anchor roles. The semi-transparent outline on a medium-dark background may be marginally visible. Accepted driver's verdict of NOT REPRODUCED for 2.4.7 (outline is solid, not none).
- Contrast for links at 4.99:1 (el7, el8, el11) passes 4.5:1 threshold by a thin margin — borderline, not a failure.
