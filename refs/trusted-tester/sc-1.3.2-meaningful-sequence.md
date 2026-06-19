# SC 1.3.2 Meaningful Sequence (Level A) — TT Test 15.A

**TT section:** 15. CSS Positioning · **Baseline:** 18. Stylesheet Non-dependence / CSS Content and Positioning
**WCAG SC 1.3.2:** When the sequence in which content is presented affects its meaning, a correct reading
sequence can be programmatically determined.

## Identify Content
Use **ANDI** to identify all content positioned with CSS and inline styles.
1. Launch ANDI → Advanced Settings → "**linearize page**" to remove CSS positioning from elements on the page.
2. If content is positioned with CSS, the information will display with blue highlighting around the elements and
   those elements will be placed in the page in the **same order in which they appear in the page code**.
- **DNA** for 15.A if there is no content positioned using CSS.

## Test 15.A — `1.3.2-content-order-meaning-css-position`
**Test Condition:** *The reading order of the content (in context) is correct and the meaning of the content (in
context) is preserved without CSS positioning.*

### How to Test
1. Review all highlighted, **linearized** content.
2. Determine whether the reading order of content is still understandable after linearization. If necessary,
   toggle the linearization button to view the original position of the content.
   - *If content becomes illegible due to overlapping, etc., this is NOT a failure of this test* — the test
     verifies whether the **programmatic reading order** is understandable.

### Evaluate Results (PASS if)
1. The sequence and meaning of the content (in context) is understandable without CSS positioning.

### Note
- ANDI: structures + "reading order" link can also reveal the reading order prior to linearizing, but it will
  not identify which content has been positioned with CSS.

> **Mechanism:** this is the DOM-order-vs-visual-order check. The "reading order" / linearized DOM sequence must
> still make sense when CSS positioning is stripped. Equivalent to comparing DOM source order to visual layout.
