# case-04 — WYSIWYG editor releasing focus on Alt+F10 / Option+F10 WITH advice (PASS, platform-standard judgment)

## Scenario
A higher-ed LMS assignment submission page (Cresthaven University, "Essay 2 — Close reading") with a
rich-text editing area (`contenteditable` `role="textbox"`). Inside the area, **Tab is repurposed to
insert indentation** (so Tab does not move focus out — exactly the WYSIWYG situation in the WCAG
Understanding). When the area receives focus, an instruction appears: "To move focus out to the
toolbar, press **Alt+F10** (Option+F10 on macOS)." Pressing that combo moves focus to the toolbar.

## Attribute tuple
- **Content domain:** higher-ed LMS / course assignment editor
- **UI component / pattern:** WYSIWYG rich-text editor (toolbar + `contenteditable` textbox)
- **Host-language construct:** `div[contenteditable][role=textbox]` with Tab-indent override and Alt+F10 exit
- **Locale / i18n:** en (with explicit macOS Option+F10 equivalent)
- **Failure mechanism:** NONE — boundary PASS testing the "is Alt+F10 a standard exit method?" judgment; because it is a non-arrow/Tab method, advice is owed and is provided (mirrors the Understanding's WYSIWYG example)

## Developer persona
The LMS team implemented the editor following the WCAG Understanding's own WYSIWYG example
verbatim: Tab indents, and an instruction appears on focus telling users to press Alt+F10 /
Option+F10 to reach the toolbar. They wired the handler to actually move focus on that combo and
tested it on Windows and macOS. An auditor must now decide whether Alt+F10 counts as a "standard
exit method" (if so, advice would be merely helpful; if not, advice is required — and is present
either way), and confirm the combo really fires.

## Element / selector carrying the issue
`#area` (`div[contenteditable][role=textbox]`) and its advice `#edInstr`. The `keydown` listener on
`#area` intercepts Tab (insert indentation) and `Alt+F10` (move focus to `#tb` first button).

## Exact accessibility mechanism
A keyboard/AT user tabs into the editing area; Tab now inserts indentation instead of leaving, so
the area would be a trap if no other exit existed. The page provides the exit and advises it: the
instruction `#edInstr` is shown on focus and is programmatically associated via
`aria-describedby="edInstr"`, so screen-reader users hear "...press Alt+F10 (Option+F10 on macOS)
to move focus out." Pressing Alt+F10 moves focus to the toolbar. Because the exit method is not an
unmodified arrow/Tab key, advice is owed — and it is present, discoverable, and correct. This passes.
The human judgment is twofold: whether Alt+F10 qualifies as "standard" for the platform (spec leaves
this to auditors), and whether the advised combo actually releases focus (must be pressed to verify).

## Expected ACT-style outcome
**passed** (SC 2.1.2). Focus can be moved away from the editing area; the exit method (Alt+F10 /
Option+F10) is not an unmodified arrow/Tab key, so advice is required, and adequate advice is
provided and programmatically associated.

## Why automated tools miss it
The editing area is `contenteditable` with `role=textbox` and an `aria-describedby` association —
all valid, so a linter sees no error. But a tool cannot judge whether the *meaning* of the
instruction adequately advises the escape, cannot decide whether Alt+F10 is "standard" for the
platform, and cannot press Alt+F10 to confirm focus leaves. Equally, a tool that flagged
"Tab does not exit this region" would wrongly fail the page — it cannot read the advice that makes it
conformant.

## Citation
**Reference:** WCAG 2.2 Understanding — No Keyboard Trap, WYSIWYG example (`wcag-understanding/no-keyboard-trap.html`)
> "Once the main editing area of a rich text editor receives focus, Tab / Shift+Tab are used to set the indentation of the current line being edited. When the editing area receives focus, an instruction appears, letting users know that they can use Alt+F10 / Option+F10 to move focus back out of the area and to the editor toolbar."

**Reference:** WCAG 2.2 Understanding — No Keyboard Trap, "standard exit method" interpretation (`wcag-understanding/no-keyboard-trap.html`)
> "This specification does not define what constitutes a \"standard exit method\" – this is dependent on the user's hardware, user agent, and operating system, and as such will require some interpretation from authors and auditors. Generally, in most environments with a physical keyboard, pressing the Esc key is a commonly used \"standard exit method\", but other platform-specific methods may be available."
