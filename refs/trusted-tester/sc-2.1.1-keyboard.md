# SC 2.1.1 Keyboard (Level A) — TT Tests 4.A, 4.B

**TT section:** 4. Keyboard Access and Focus · **Baseline:** 1. Keyboard Access
**WCAG SC 2.1.1:** All functionality of the content is operable through a keyboard interface without requiring
specific timings for individual keystrokes, except where the underlying function requires input that depends on
the path of the user's movement and not just the endpoints.

## Identify Content (applicability)
1. Use the mouse/pointer to determine **available functions** provided by interactive elements (drop-down menus,
   form fields, revealing/hiding content, tooltips, AND all interactive interface components).
2. Use the mouse to identify instances where interactive elements provide **information essential** to
   understanding or operating page content.
- **Note (path-dependent exception):** 2.1.1 does not apply to functions requiring input that depends on the
  *path* of movement, not just endpoints (e.g., free-hand drawing). Don't omit functions that meet Identify
  Content; a 508 exception may apply but is out of test scope.
- **DNA** for 4.A and 4.B if the page has **no user-activated functionality**.

---

## Test 4.A — `2.1.1-keyboard-access`
**Test Condition:** *All functionality can be accessed and executed using only the keyboard.*

### How to Test
1. Identify functionality and essential information provided by interactive elements.
   - a. Ways to identify functionality: mouse, touch screen, voice commands, documentation (e.g., shortcut keys).
   - b. ANDI "title attributes" feature (focusable elements) helps identify essential info in `title` attributes.
2. Use the keyboard to operate identified functionality and/or access the essential information: tab to the
   element and execute (e.g., press Enter with focus on the element).
   - a. For interactive elements with `title` attributes, place keyboard focus; if the tooltip does not appear
     within **two seconds**, keyboard focus will not reveal the title information.
   - b. If an element has **no keyboard access**, determine whether another keyboard-accessible method on the
     page provides the same functionality (e.g., one of two print methods is keyboard accessible).
   - c. If an element does not provide access to essential information via keyboard, determine whether the
     information is **available elsewhere** on the page (e.g., as text).

### Evaluate Results (PASS if BOTH true)
1. All functionality can be accessed and executed using the keyboard, AND
2. All essential information can be accessed via keyboard OR is available elsewhere on the page.

### Notes
- Changes to functionality that occur automatically or as a result of interaction should be included.
- Information is "essential" when necessary to execute an action or understand information and relationships.
- Title/tooltip information that is **not** essential does not require keyboard access.
- Not all browsers visually display the `title` as a tooltip on keyboard focus.

---

## Test 4.B — `2.1.1-no-keystroke-timing`
**Test Condition:** *Individual keystrokes do not require specific timings for activation of functionality.*

### How to Test
1. Continue from Test 4.A.
2. Determine whether there are instances where the **timing of keystrokes** is required to activate the element
   (e.g., the speed at which password keystrokes are typed is part of password authentication).
3. If timing-dependent functionality exists, determine if another keyboard-accessible method on the page does
   **not** require specific timing.

### Evaluate Results (PASS if)
1. A keyboard method is provided for functionality to be activated without requiring users to perform specific
   timings for activation.
