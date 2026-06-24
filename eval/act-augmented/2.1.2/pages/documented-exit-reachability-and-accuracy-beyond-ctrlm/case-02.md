# case-02 — Escape advice delivered only as a `title=` tooltip on a non-focusable badge (hover-only) (FAIL)

## Scenario
A webmail "Compose" window has a rich-text editor (`contenteditable`) that captures Tab to insert
indentation — a real WYSIWYG behaviour that means Tab cannot leave the editor. The editor provides a
working custom exit: **Alt+0** returns focus to the formatting toolbar. The only documentation of that
keystroke is the `title` attribute on a small round "?" badge in the toolbar:
`title="Tab indents inside the message. To move focus out of the editor, press Alt+0."` The badge is a
non-focusable, non-interactive `<span>`. The tip appears only on **pointer hover**; a keyboard user inside
the editor can neither focus nor hover the badge, and the `title` on a non-interactive span is not reliably
announced as the editor's instruction. The exit exists, but its sole documentation is unavailable to the
trapped keyboard user.

## Attribute tuple
- **Content domain:** SaaS / webmail client (compose window)
- **UI component / pattern:** WYSIWYG rich-text editor (contenteditable textbox) + toolbar info badge
- **Host-language construct:** `contenteditable` with Tab captured; `title` attribute as the only advice carrier
- **Locale / i18n:** en-US
- **Failure mechanism:** advice present but keyboard-unavailable — `title` tooltip on a non-focusable span (hover-only)

## Developer persona
A front-end developer copied a "shortcuts" affordance from a design system where help bubbles appear on
hover, and used `title` as the quickest way to attach the tip text. They tested with a mouse, saw the
tooltip appear, and considered the keyboard exit "documented." They never considered that a keyboard user
in the editor cannot trigger a hover tooltip and that `title` on a `<span>` is not exposed as the editor's
operating instruction.

## Element / selector carrying the issue
`span.kbd-hint[title]` inside `.editor-tools` — the "?" badge whose `title` is the only place the Alt+0
exit is documented. It has no `tabindex`, no `role`, and no key handler, so it is not in the tab order and
its `title` is not encountered by keyboard.

## Exact accessibility mechanism
`#editor` sets `trapOn` on focus and captures `keydown` for Tab (inserting a space instead of moving
focus), so the keyboard cannot tab out. The working exit is Alt+0, handled on the editor. The advice lives
solely in `span.kbd-hint`'s `title`. AT experience: a screen-reader/keyboard user in the editor hears the
textbox name ("Message body") but never the exit instruction, because (a) the badge is not focusable, so
Tab never lands on it; (b) `title` requires hover, which keyboard users cannot perform; and (c) `title` on
a non-interactive `<span>` is not consistently surfaced by assistive technology. The user is trapped with
no reachable instruction — failing the "advised ... using their keyboard interface" condition.

## Expected ACT-style outcome
**failed** (SC 2.1.2 — custom exit exists but is documented only via a hover-only `title` on a
non-focusable element, so the advice is not available to the trapped keyboard user).

## Why automated tools miss it
The badge *has* a `title`, so a static scan sees associated text and raises nothing; the editor has
`role=textbox` and an `aria-label`; all toolbar buttons have accessible names. Nothing is empty or
malformed. A checker cannot determine that the escape instruction is delivered only through a hover-revealed
`title` on a non-focusable span, that keyboard users cannot reach it, and that the trap leaves them with no
announced way out. That judgment requires knowing how `title` is exposed and actually trying to reach the
advice from inside the trap.

## Citation
**Reference:** WCAG Technique G21 — Ensuring that users are not trapped in content (`wcag-techniques/general/G21.html`)
> "The help information available from the content that is not accessibility supported documents how to move focus back to the accessibility-supported content via the keyboard, and the help information can be accessed via the keyboard."

**Reference:** WCAG 2.2 Understanding — No Keyboard Trap (`wcag-understanding/no-keyboard-trap.html`)
> "When the editing area receives focus, an instruction appears, letting users know that they can use <kbd>Alt+F10</kbd> / <kbd>Option+F10</kbd> to move focus back out of the area and to the editor toolbar."
