# SC 2.4.3 Focus Order (Level A) — TT Test 4.F

**TT section:** 4. Keyboard Access and Focus · **Baseline:** 2. Focus
**WCAG SC 2.4.3:** If a Web page can be navigated sequentially and the navigation sequences affect meaning or
operation, focusable components receive focus in an order that preserves meaning and operability.

## Test 4.F — `2.4.3-focus-order-meaning`
**Test Condition:** *The focus order preserves the meaning and operability of the web page.*
**DNA** if the page has no elements that can receive keyboard focus.

### How to Test
1. Use the **tab key** to move focus through the page.
2. Determine if the focus order impacts the page meaning (e.g., form fields for a mailing address are presented
   in the expected sequence).
   - a. Most noticeable when focus order does not follow the logical order of operation (normally top to bottom,
     left to right).
   - b. It may be necessary to use the keyboard to **activate trigger controls that reveal hidden content** with
     focusable elements (menus, dialogs, modal dialog boxes, expandable tree list) to check the focus order to,
     from, and within the revealed content.
   - c. It may be helpful to launch **ANDI: focusable elements** and select tab order.
   - d. **Backward focus order** does not have to mirror the forward focus order. However, it must preserve the
     meaning and operability of the page.
3. For **modal dialog boxes**, keyboard focus navigating both forward and backward should remain within the
   modal dialog box until it is closed.

### Evaluate Results (PASS if ALL true)
1. The focus order preserves the meaning of the page, AND
2. The focus order preserves the operability of the page.

### Notes
- Focus order does not necessarily need to be top to bottom, left to right.
- When focus order does not affect meaning or operability, this test **Does Not Apply** (e.g., a row of icons
  linking to social media may not need to be navigated in a particular order).
- ANDI tab-order markup may differ slightly from actual keyboard tab order in certain browsers — **always use
  the results from keyboard tab order**.
