# case-03 — Shadow-DOM `<comment-composer>` (delegatesFocus) re-grabs focus on `focusout`

## Scenario
A hiking-community forum thread ("TrailTalk") offers a reply box implemented as a reusable
custom element, `<comment-composer>`, whose entire UI lives inside a Shadow DOM created
with `attachShadow({ mode:'open', delegatesFocus:true })`. The light-DOM markup the page
author wrote is literally just `<comment-composer></comment-composer>` — nothing
interactive is visible in the source. Inside the shadow root are a `<textarea>` and a "Post
reply" `<button>`. The component listens for `focusout` on its shadow root and, whenever
focus tries to leave the shadow tree, synchronously re-focuses the textarea. Tab and
Shift+Tab cycle between the textarea and the button forever and never cross the shadow
boundary to the parent document's "Back to all threads" link. No Esc handler, no
instruction anywhere about how to escape.

## Attribute tuple
- **content-domain:** community forum / discussion thread
- **UI-component/pattern:** comment/reply composer (textarea + submit) as a web component
- **host-language construct:** custom element with open Shadow DOM, `delegatesFocus:true`, `focusout` re-grab
- **locale/i18n:** en-US
- **failure-mechanism:** F10 — Shadow-DOM boundary that focus enters but cannot leave; invisible in light-DOM source

## Developer persona
A developer wrapped the site's comment box as a web component so it could be reused across
threads, profiles, and the changelog. Copying a "keep focus inside the widget" recipe from
a Stack Overflow answer about modal dialogs, they added a `focusout` re-focus on the shadow
root to "stop focus escaping while typing." `delegatesFocus:true` was set because a tutorial
said it improves focus handling. They tested by clicking into the box and typing; they
never tabbed past it.

## Element / selector carrying the issue
`comment-composer` (the host element). The trap is inside its shadow root: the `focusout`
listener that re-focuses `#ta` (the textarea) whenever the new focus target is outside the
shadow root. The host's light DOM exposes no clue.

## Exact accessibility mechanism
A keyboard user tabs into the composer and lands (via `delegatesFocus`) on the textarea,
then Tab to "Post reply". The next Tab should leave the shadow tree and reach "Back to all
threads"; instead the shadow root's `focusout` handler fires as focus departs and
synchronously pulls it back to the textarea. Focus therefore oscillates textarea ↔ button
indefinitely and never crosses the shadow boundary. Because the trap lives in the shadow
tree, the host document never completes the focus advance. There is no standard exit (Esc
does nothing) and no advised alternate, so a keyboard or switch user is stranded inside the
reply box. Verified with CDP Tab driving (piercing the open shadow root): 26 Tab presses
cycle only between `#ta` and `#post`; "Back to all threads" is never reached, and
Esc-then-Tab does not free it.

## Expected ACT-style outcome
**failed** — SC 2.1.2 No Keyboard Trap (F10, applied to a Shadow-DOM boundary). The
corpus's only ACT rule (80af7b) operates on single-document inline-button traps and does
not instantiate custom elements, pierce shadow roots, or drive Tab across a shadow
boundary, so this modern variant is entirely outside what it tests.

## Why automated tools miss it
The light-DOM source the scanner parses is a single unknown custom element with no
attributes — no role, name, or label to evaluate, nothing to flag. To even see the
textarea and button a tool must instantiate the component and pierce the open shadow root;
even then, the trap is the `focusout` re-grab, a runtime behavior. axe/WAVE/Lighthouse do
not run the focus cycle and do not press Tab, so they cannot observe that focus never
leaves the shadow tree. Detecting it requires a human (or interaction probe) entering the
widget and finding the cursor cannot escape.

## Citation
> **Reference:** WCAG Understanding — Understanding No Keyboard Trap
> (`wcag-understanding/no-keyboard-trap.html`)
>
> **Quote (verbatim):** "The intent of this success criterion is to ensure that content
> does not "trap" keyboard focus within subsections of content on a web page. This is a
> common problem when multiple formats are combined within a page and rendered using
> plug-ins or embedded applications, or when custom components and widgets are not
> implemented with keyboard users in mind."
>
> **Quote (verbatim):** "Keyboard focus is not considered trapped when the user can
> navigate away from a component using only a keyboard interface, and if it only requires
> unmodified arrow or Tab keys or other "standard exit methods"."
>
> **Reference:** WCAG Techniques — F10 (`wcag-techniques/failures/F10.html`)
>
> **Quote (verbatim):** "Some plug-ins create a common situation in which the keyboard
> focus can become "stuck" in a plug-in, leaving a keyboard-only user with no way to
> return to the other content."
