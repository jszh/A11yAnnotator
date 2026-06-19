# SC 2.1.2 No Keyboard Trap (Level A) — TT Test 4.C

**TT section:** 4. Keyboard Access and Focus · **Baseline:** 1. Keyboard Access · also Non-Interference (Con.5)
**WCAG SC 2.1.2:** If keyboard focus can be moved to a component using a keyboard interface, then focus can be
moved away from that component using only a keyboard interface, and, if it requires more than unmodified arrow
or tab keys or other standard exit methods, the user is advised of the method for moving focus away.

## Test 4.C — `2.1.2-no-keyboard-trap`
**Test Condition:** *There is no keyboard trap.*
**DNA** if the page has no components that can receive keyboard focus.

### How to Test
1. Use **standard navigation keys** (e.g., TAB, SHIFT+TAB, arrow keys, CTRL+TAB, etc.) to navigate through all
   keyboard focusable elements on the page.
2. Determine whether there are any instances where keyboard navigation becomes **trapped**:
   - a. Keyboard users are unable to move away from an element (e.g., using TAB or an arrow key).
   - b. Keyboard access is restricted to a small section of the page with no way to navigate out of the "loop"
     to the rest of the page.
     - *Note:* Keyboard focus **should remain within a modal dialog box** until it is closed (per Test 4.F
       Step 3); however, check for keyboard traps **within** the dialog.
     - *Note:* If a section of a page requires input or interaction before allowing focus to progress to the
       rest of the page, this is **not** a failure.
3. If a keyboard trap is found:
   - a. Inspect any contextual/application help and documentation for notification of **available alternate
     keyboard commands** (non-standard controls, access keys, hotkeys) to escape/avoid the trap.
   - b. Determine whether the alternate command(s) work.

### Evaluate Results (PASS if ALL true)
1. Keyboard focus can be moved away from an element using either:
   - a. Standard navigation keys, OR
   - b. Custom keystrokes that are **documented and available** to users in the application.
   AND
2. Keyboard focus can be moved away from each section of the page containing elements (not trapped in a "loop"
   preventing access to other elements) using either standard navigation keys OR documented custom keystrokes.

### Note
- In case of a keyboard trap, continue to test interactive elements after the trap by using the mouse to bypass
  the trap, or by refreshing the page and using the keyboard to navigate **backwards** through the page.
