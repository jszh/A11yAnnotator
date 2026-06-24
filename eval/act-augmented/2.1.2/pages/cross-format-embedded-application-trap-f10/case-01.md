# case-01 — Onboarding coachmark in an `<iframe>` whose only button re-grabs focus (no exit advice)

## Scenario
A SaaS project-management app ("Meridian Project Hub") shows a first-run onboarding
coachmark embedded as a cross-document `<iframe src="case-01-frame.html">` (a same-origin
sibling file — no network, so it renders from `file://`). The embedded mini-app has one
control, a "Got it" button. Between a "Skip tour" link (before the iframe) and an "Open
dashboard" link (after it), the iframe is the only other focusable region. Inside the
embedded document the button swallows the **Tab** key (`keydown` → `preventDefault()` +
re-focus itself) and also re-grabs focus `onblur`. Once Tab moves focus into the iframe
and onto "Got it", focus can never cross the iframe boundary forward to "Open dashboard".
There is no Esc handler and no instruction anywhere about how to leave.

## Attribute tuple
- **content-domain:** SaaS project-management / workspace onboarding
- **UI-component/pattern:** product-tour coachmark (single-button embedded mini-app)
- **host-language construct:** `<iframe src>` cross-document boundary; inner `<button>` with `keydown` Tab-capture + `blur` re-grab
- **locale/i18n:** en-US
- **failure-mechanism:** F10 — focus enters embedded content and cannot be moved back out to the host document

## Developer persona
A front-end developer building the onboarding flow wanted the coachmark to be cached and
versioned independently of the app shell, so they shipped it as its own tiny document
loaded in an iframe. To "make sure the user actually clicks Got it before moving on," they
copied a focus-retention snippet from an internal gist that re-grabs focus on blur and
cancels Tab — a pattern intended for a modal, dropped into an embedded document. They
tested with a mouse (click Got it → coachmark dismisses) and never tabbed through it.

## Element / selector carrying the issue
`iframe[src="case-01-frame.html"]` → inside it, `#gotit` (the `<button>`). The trap lives
in the embedded document's script: a capture-phase `keydown` handler that calls
`preventDefault()` on Tab and re-focuses `#gotit`, plus a `blur` → `focus()` re-grab.

## Exact accessibility mechanism
A keyboard or switch user tabs from "Skip tour" into the iframe and onto "Got it". Every
subsequent Tab is cancelled inside the embedded document and focus is forced back to the
button; Shift+Tab is cancelled too. Because the trapping logic runs inside the embedded
format, the host document never receives the focus-advance, so focus cannot return to the
parent's "Open dashboard" link. No standard exit method works (Esc does nothing here) and
no alternate method is advised. A keyboard-only user is stranded in the coachmark and can
reach neither the dashboard link nor anything after it without a mouse or a page reload —
the archetypal F10 condition (focus can enter the embedded content but cannot exit it).
Verified by driving real Tab presses with CDP: across 26 Tab presses focus never leaves
the iframe, and Esc-then-Tab does not free it.

## Expected ACT-style outcome
**failed** — SC 2.1.2 No Keyboard Trap (F10). The only published ACT rule for this SC
(80af7b "Focusable element has no keyboard trap") is exercised by the corpus exclusively
on bare inline-scripted `<button>`s in a single document; it neither drives focus across
an iframe boundary nor models cross-document focus return, so this cross-format trap is
outside what the corpus tests.

## Why automated tools miss it
axe-core, WAVE and Lighthouse evaluate the host document's static DOM. They see a
well-formed `<iframe>` with a `title` and a valid `src` — no missing attribute, no empty
name, no role error. They do not press Tab, do not model the focus cycle, and do not
follow the embedded document to discover that its only button cancels Tab and re-grabs
focus. Detecting the trap requires actually tabbing into the iframe and observing that the
next Tab never reaches "Open dashboard" — a runtime, cross-document keyboard fact no
static snapshot can compute.

## Citation
> **Reference:** WCAG Techniques — F10 "Failure of Success Criterion 2.1.2 and Conformance
> Requirement 5 due to combining multiple content formats in a way that traps users inside
> one format type" (`wcag-techniques/failures/F10.html`)
>
> **Quote (verbatim):** "Applies when content creates a situation where the user can enter
> the content using the keyboard, but cannot exit the content using the keyboard."
>
> **Quote (verbatim):** "If the keyboard focus becomes "trapped," then this failure
> condition applies and content fails the success criterion and conformance requirement 5."
>
> **Reference:** WCAG Understanding — Understanding No Keyboard Trap
> (`wcag-understanding/no-keyboard-trap.html`)
>
> **Quote (verbatim):** "The intent of this success criterion is to ensure that content
> does not "trap" keyboard focus within subsections of content on a web page. This is a
> common problem when multiple formats are combined within a page and rendered using
> plug-ins or embedded applications, or when custom components and widgets are not
> implemented with keyboard users in mind."
