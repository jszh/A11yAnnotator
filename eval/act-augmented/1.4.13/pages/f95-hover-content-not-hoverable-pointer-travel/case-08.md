# case-08 — PASS paired repair of case-02

## Scenario and source pair

This is the counterfactual PASS partner for **case-02** in the same aspect. It preserves the
source page’s domain, layout, content, visual treatment, and interaction complexity. The paired
source scenario is:

> Community forum thread: a GitHub/Twitter-style profile "hover card" appears when hovering a username. It is rendered into a detached portal layer (#hovercard-layer, sibling of the content) positioned 12px below the username. Show is delayed 180ms (hover-intent); hide is immediate on the username's mouseleave; the card has no mouseenter of its own. Moving the pointer down to the card crosses the 12px transparent gap, fires mouseleave, and the card vanishes instantly.

## Exact repair

Added a symmetric delayed hide and hover handlers on the unchanged portaled card so the pointer can cross the 12px gap and remain over its controls. No unrelated target-SC condition was removed.
The HTML includes a machine-readable pairing comment naming case-02 and this repair.

## Primary selector

`#author-link`

## Accessibility mechanism

The portal, 12px offset, and 180ms hover-intent show remain. Trigger leave now grants 500ms, card mouseenter cancels hide, card mouseleave schedules it, and Escape dismisses, so users can reach and operate the card.

## Expected ACT-style outcome

**passed** — this is a deliberately close negative example at the target SC boundary. The original
failure context remains, but the information or interaction path required by the criterion is now
available.

## Why this is a useful hard negative

This hard-negative control is intentionally near-identical to failing case-02. Presence-only or static heuristics can easily treat the pair alike; the correct pass depends on verifying the precise repaired boundary: added a symmetric delayed hide and hover handlers on the unchanged portaled card so the pointer can cross the 12px gap and remain over its controls.

## Citation retained from the source case

**Reference:** wcag-understanding/content-on-hover-or-focus.html

> When the added content is large, magnified views may mean that the user needs to scroll or pan to completely view it, which is impossible unless the user is able to move their pointer off the trigger without the additional content disappearing.

