# case-03 — Carousel "next" arrow is `<img alt="Next photo" onmousedown>` (canonical F54)

## Scenario
A newspaper photo essay ("In pictures: the harbour at dawn", The Coastal Courier). The
lead slideshow has two arrow controls. The **previous** arrow is a real
`<button aria-label="Previous photo" onclick>` — natively focusable and operable with
Enter/Space. The **next** arrow is an `<img alt="Next photo" onmousedown="advance(1)">`
mirroring the exact example in WCAG failure F54. Below the slideshow a keyboard-operable
"View all 8 photos in a single list" link jumps to an `<ol>` containing every caption, so
the photo content is independently reachable.

## Attribute tuple
- **content-domain:** news / long-form editorial photo essay
- **UI-component/pattern:** image carousel / slideshow next-arrow
- **host-language construct:** `<img alt="Next photo" onmousedown="advance()">` (F54's exact pattern)
- **locale/i18n:** en-GB
- **failure-mechanism:** pointing-device-only `onmousedown` on a non-focusable `<img>`; localized to one of the two arrows

## Developer persona
A newsroom developer hand-built the slideshow under deadline. They wrote the previous
arrow as a `<button>` (the accessible habit) but, when adding the next arrow, dropped in a
crisp SVG chevron as an `<img>` and reached for `onmousedown` because it "felt snappier"
than `onclick` on press — copying the gesture from a touch demo. Because the mouse worked
and the alt text was filled in, it passed their quick check and shipped. The asymmetry
(button vs. img) is the kind of inconsistency that creeps in when two controls are written
minutes apart.

## Element / selector carrying the issue
`.stage .nav-next img[alt="Next photo"]` — the next-photo control. It is an `<img>` with
non-empty `alt`, an `onmousedown` handler, no `role="button"`, no `tabindex`, and no key
handler. Its wrapping `<span>` is `role="presentation"`.

## Exact accessibility mechanism
An `<img>` is not a natively focusable or interactive element; without `tabindex` it is not
in the tab order, and without `role="button"` it is exposed to AT only as an image named
"Next photo" — not as a control. Its only behaviour binding is `onmousedown`, a
pointing-device event with no keyboard equivalent (the keyboard does not fire `mousedown`).
So a keyboard-only user can reach and operate the **previous** button but can never advance
the slideshow forward via the next arrow: the "advance" function is invokable solely by a
pointer. The function is not path-dependent (it is a discrete "go to next slide" action),
so the F54 exception does not apply. Per TT Test 4.A this would *not* fail **if** an
equivalent keyboard method existed for the same function — but advancing the carousel has
no keyboard route (the "View all" link is a separate, list-based affordance, and one
direction of the slideshow itself remains keyboard-dead). The next-arrow control therefore
fails 2.1.1.

## Expected ACT-style outcome
**failed** — SC 2.1.1 Keyboard (F54), exact `<img onmousedown>` instance. Neither 2.1.1
ACT rule applies (no scroll container reachability question, no iframe). The matched
`<button>` previous-arrow and the keyboard-reachable "View all" list make the page
otherwise sound, isolating the failure to the next arrow.

## Why automated tools miss it
The `<img>` has non-empty `alt` text, so no missing-alt rule fires. It declares no role and
is not a native control, so scanners do not test it for keyboard operability — there is no
"control" in the static tree to evaluate, and `onmousedown` is not a signal any rule maps to
a keyboard requirement. The sibling **previous** control IS a proper button, so a structural
scan of the carousel looks consistent and clean. Catching this needs a human to click the
right arrow (discovering it advances the gallery), then Tab to it and find it is not
focusable and Enter/Space do nothing — exactly the "use the mouse to find functions, then
operate with the keyboard" manual procedure.

## Citation
> **Reference:** WCAG Techniques — F54, Example "An image that responds to a mouse click to
> go to another page" (`wcag-techniques/failures/F54.html`)
>
> **Quote (verbatim):** "This is a failure because the keyboard cannot be used to move to
> the next page."
>
> **Quote (verbatim):** `<p><img onmousedown="nextPage();" src="nextarrow.gif" alt="Go to next page"></p>`
>
> **Reference:** Trusted Tester v5.1.3 — Test 4.A `2.1.1-keyboard-access`
> (`refs/trusted-tester/sc-2.1.1-keyboard.md`)
>
> **Quote (verbatim):** "If an element has **no keyboard access**, determine whether
> another keyboard-accessible method on the page provides the same functionality (e.g.,
> one of two print methods is keyboard accessible)."
