# Seat-overage tooltip — full interaction boundary

## Scenario and source pair

The complete Meridian Analytics billing page and suspicious hover/focus tooltip are preserved.

**Paired failed source:** `case-01.html`

**Coverage lane:** accessibility-tree/interaction

## Exact counterfactual repair

Removed the pointer dead zone, positioned the tooltip adjacent to its trigger, kept it open across wrapper/tooltip hover and focus, added delayed boundary closure, and added Escape dismissal without moving focus. Replaced the source fixture's self-referential failure explanation in the footer with neutral product-support copy so the page does not leak its expected answer.

## Primary selector

`#ov-trigger, #ov-tip`

## Accessibility mechanism

The tooltip is exposed through the trigger’s description when shown and satisfies all three SC conditions: dismissible, hoverable, and persistent. It remains open during pointer travel and has no automatic timeout.

## Expected ACT-style outcome

**passed** — SC 1.4.13

## Why this is a hard negative

The page preserves the failed source’s realistic context and suspicious surface pattern. Correct evaluation requires resolving contextual meaning, accessibility-tree role/reference behavior, or the complete interaction boundary.

## Citation

> **wcag-techniques/failures/F95.html:**
> “A pop-up opens on pointer hover. Due to the chosen screen magnification, the content is only partially visible. However, as soon as the pointer is moved away from the trigger towards the pop-up content so it can be read, the pop-up automatically closes.”
