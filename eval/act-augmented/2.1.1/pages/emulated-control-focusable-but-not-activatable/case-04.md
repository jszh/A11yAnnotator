# case-04 — Gallery "enter exhibit" image: onkeypress calls preventDefault() and returns early (swallows activation)

## Scenario
A museum's virtual-exhibitions page ("The Halverson Museum of Modern Craft") uses clickable
cover images to enter each virtual room. Each `<img class="cover" tabindex="0" role="button">`
has `onclick="enterRoom(...)"` **and** `onkeypress="handleKey(event, ...)"`. The image is
focusable and *appears* keyboard-wired (it has a key handler). But `handleKey` calls
`event.preventDefault()` and then `return false` **before** any activation logic — so for
**every** key, including Enter and Space, it stops the default behaviour and exits without ever
calling `enterRoom()`. The handler is present but swallows activation.

## Attribute tuple + developer persona
- **content-domain:** arts / museum / cultural heritage
- **UI-component/pattern:** gallery grid of clickable artwork "enter room" tiles
- **host-language construct:** `<img tabindex="0" role="button" onclick=... onkeypress=...>`
- **locale/i18n:** en
- **failure-mechanism:** preventDefault + early-return swallow — key handler present but kills Enter/Space
- **persona:** A designer building the site in a visual tool wired a click interaction to the
  artwork image, then a teammate added an `onkeypress` "for accessibility" after reading that
  Space can scroll the page. They added `event.preventDefault()` to stop the scroll and a
  defensive `return false`, intending to add the `if (Enter/Space) enterRoom()` line "next" —
  but never did. The handler shipped with the guard but no activation, so it reads as keyboard-ready.

## Element / selector carrying the issue
`img.cover` (each of the three exhibit cover images, e.g. "Vessels of Memory").

## Exact accessibility mechanism (what AT experiences and why it fails)
- A keyboard/SR user tabs to a cover image (focusable via `tabindex="0"`), announced as
  **"Enter the exhibit: Vessels of Memory, button"** (via `role="button"` + `alt`). Expectation:
  Enter/Space opens the room.
- Pressing **Enter** fires `keypress` → `handleKey` runs → `event.preventDefault(); return false;`
  → execution stops; `enterRoom()` is never reached. Pressing **Space** behaves the same.
- The dialog (`#curtain`) never opens from the keyboard. There is **no fallback link or button**
  to enter a room. Mouse click works (`onclick` is untouched), so the failure is keyboard-specific.

This is the precise pattern F42 warns about in its "img with keyboard support" example, taken
one step further: here the key handler exists but is mis-implemented so activation never occurs.

Verified behaviourally (headless Chromium): Enter does not open the room; Space does not open the
room; mouse click does open the room.

## Expected ACT-style outcome
**failed** (SC 2.1.1, also 2.1.3).

## Why automated tools miss it
The element has `tabindex="0"`, a `role="button"`, an accessible name (`alt`), an `onclick`,
**and** an `onkeypress`. Every static signal a scanner inspects says "focusable, named, keyboard
handler present" — so heuristics like "interactive element must have a keyboard handler" are
satisfied. The defect is entirely in the *runtime behaviour of the handler body*: it
`preventDefault()`s and returns before activating. No static analyzer evaluates handler control
flow to discover that the activation branch is unreachable; only focusing the image and pressing
Enter/Space and watching that the room never opens reveals it.

## Citation
> **WCAG Failure Technique F42 — Example "Scripting an `img` element, with keyboard support"** (`wcag-techniques/failures/F42.html`)
>
> "Scripted event handling is added to an `img` element so that it functions as a link. In this example, the link functionality can be invoked with the mouse or via the Enter key if the user agent includes the element in the tab chain."

> **WCAG Failure Technique F42 — Tests / Procedure** (`wcag-techniques/failures/F42.html`)
>
> "Check if the emulated link can be activated using the keyboard."

Here the key handler is present but mis-coded so the emulated control cannot be activated using
the keyboard — F42 check #2 is false → 2.1.1 fails.
