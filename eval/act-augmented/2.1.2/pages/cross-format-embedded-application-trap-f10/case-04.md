# case-04 — Shadow-DOM `<markdown-editor>` captures Tab for indentation BUT advises a working Esc exit (PASS)

## Scenario
An internal knowledge-base editor ("Helm Docs") hosts a Markdown editing surface as a
custom element, `<markdown-editor>`, whose UI lives in an open Shadow DOM. Inside the
editing textarea, **Tab is deliberately captured** to insert indentation (the documented
WYSIWYG behavior from the WCAG Understanding "rich text editor" example), so plain Tab does
not move focus out. By itself that would be a trap — but the component (a) shows a
persistent, visible instruction inside the shadow root: "Editing mode: Tab indents the
current line. Press Esc to leave the editor and continue to the page controls", and (b)
wires a **working** Esc handler that blurs the textarea and moves focus across the shadow
boundary to the "Publish" button in the host document. A keyboard user is advised of, and
actually has, a standard exit method (Esc). This is a PASS.

## Attribute tuple
- **content-domain:** internal SaaS / documentation authoring
- **UI-component/pattern:** rich-text / Markdown editor (Tab-as-indent) as a web component
- **host-language construct:** custom element with open Shadow DOM; `keydown` Tab→indent, Esc→cross-boundary focus move
- **locale/i18n:** en-US
- **failure-mechanism:** none — intentional Tab capture rescued by an advised, working non-Tab exit (the SC's documented-exit allowance)

## Developer persona
A platform engineer who had read WCAG SC 2.1.2 carefully built the editor to mirror the
Understanding document's "WYSIWYG rich text editor" example exactly: Tab indents, and an
on-screen tip plus a real Esc handler let the user step out. They verified by keyboard
that Tab indents and Esc lands focus on Publish. This is the correct way to capture Tab —
included as the boundary/PASS case so the aspect tests judges on both sides of the line.

## Element / selector carrying the issue
`markdown-editor` (host). Inside the shadow root: `#ta` (textarea, captures Tab and Esc)
and the visible `#tip` instruction. The exit target is the host's `[data-after="true"]`
"Publish" `<button>`. The behavior to judge is the Esc handler that crosses the boundary.

## Exact accessibility mechanism
A keyboard user tabs from the Title field into the editor and lands on the textarea.
Pressing Tab inserts two spaces (indentation) and keeps focus in the textarea — focus does
NOT advance, which in isolation is a trap. However, the user can read the in-editor tip
"Press Esc to leave the editor", and pressing Esc blurs the textarea and moves focus across
the shadow boundary to "Publish" in the host document, from where ordinary Tab continues to
"Save draft" and the rest of the page. Because the user is advised of a non-Tab exit method
and that method actually works, focus can be moved away from the component — the SC is met.
Verified with CDP: Tab inside the editor keeps focus on the textarea (indent captured);
pressing Esc lands focus on the host "Publish" button (`data-after="true"`), confirming the
boundary is crossed by the documented method.

## Expected ACT-style outcome
**passed** — SC 2.1.2 No Keyboard Trap. Focus can be moved away from the component using a
standard exit method (Esc) of which the user is advised, satisfying the criterion's explicit
allowance for non-Tab exits when documented. Note this PASS is *unconfirmable by static
tooling*: a scanner cannot distinguish this intentional, escapable Tab capture from an
accidental trap, cannot verify the Esc handler actually frees focus across the shadow
boundary, and cannot read and judge the accuracy of the in-shadow instruction.

## Why automated tools miss it
Structurally this page is indistinguishable from a trapping Shadow-DOM widget: an unknown
custom element whose Tab does not advance focus. Whether that is a fatal trap or a
legitimate, escapable editor depends on three things no scanner can evaluate — that Tab is
intentionally captured for indentation, that a visible instruction inside the shadow root
advises Esc, and that the Esc handler genuinely moves focus out across the boundary. All
three require entering the widget, reading the tip, pressing Esc, and confirming focus lands
on "Publish". axe/WAVE/Lighthouse never press keys and cannot make this meaning-and-behavior
judgment, so they can neither flag a false trap nor certify the real PASS.

## Citation
> **Reference:** WCAG Understanding — Understanding No Keyboard Trap
> (`wcag-understanding/no-keyboard-trap.html`)
>
> **Quote (verbatim):** "If untrapping focus requires a different method (rather than
> unmodified arrow keys, the Tab key, or other "standard exit methods"), content can still
> pass this criterion provided that the user is advised how they can untrap focus using
> their keyboard interface."
>
> **Quote (verbatim):** "Once the main editing area of a rich text editor receives focus,
> Tab / Shift+Tab are used to set the indentation of the current line being edited. When
> the editing area receives focus, an instruction appears, letting users know that they can
> use Alt+F10 / Option+F10 to move focus back out of the area and to the editor toolbar."
>
> **Reference:** Trusted Tester v5.1.3 — SC 2.1.2 (`refs/trusted-tester/sc-2.1.2-no-keyboard-trap.md`)
>
> **Quote (verbatim):** "Keyboard focus can be moved away from an element using either: a.
> Standard navigation keys, OR b. Custom keystrokes that are documented and available to
> users in the application."
