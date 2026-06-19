# SC 2.4.7 Focus Visible (Level AA) — TT Test 4.D

**TT section:** 4. Keyboard Access and Focus · **Baseline:** 2. Focus
**WCAG SC 2.4.7:** Any keyboard operable user interface has a mode of operation where the keyboard focus
indicator is visible.

## Identify Content (applicability)
Use the keyboard to navigate to keyboard-accessible interface components (drop-down menus, form fields,
revealing/hiding content, tooltips, AND all interactive interface components).
**DNA** if the page has no elements that can receive keyboard focus.

## Test 4.D — `2.4.7-focus-visible`
**Test Condition:** *A visible indication of focus is provided when focus is on the interface component.*

### How to Test
1. Continue from Test 4.C.
2. Determine whether there is a visible indication of focus on the element that has keyboard focus.
   - a. When keyboard focus is on a **frame**, some browsers display a visible focus and some may not. Where a
     visible focus is not available on a frame, do **NOT** consider this a failure of the web content.

### Evaluate Results (PASS if)
1. When each interface element receives focus, there is a visible indication of focus.

### Note (frame focus disambiguation)
- To confirm keyboard focus is on a frame when there is no visible focus: use TAB and SHIFT+TAB to deduce that
  focus is on the frame. When on the frame, a tab forward moves focus to the first focusable element within the
  frame; SHIFT+TAB once moves back to the frame, and another SHIFT+TAB moves to a focusable element before the
  frame. **Only the frame** is permitted to not have a visible focus — confirm it is the frame (not another
  element) that lacks the visible focus.
