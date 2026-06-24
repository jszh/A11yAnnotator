# case-01 — Online-banking transfer-limit "i" tooltip with NO keyboard dismiss

## Scenario
A "Move money" screen in an online-banking app shows a round "i" info button next to
"Your remaining daily limit." On hover OR keyboard focus a dark tooltip appears directly
below the button and **overlaps the help paragraph and the "Continue" button** beneath it.
The tooltip can be triggered by keyboard (good — meets 2.1.1), but there is **no Escape
key, no other documented shortcut, and activating the button does not toggle it off**. The
only way to clear the obscuring tooltip is to physically Tab focus (or move the pointer)
away from the trigger — exactly the move SC 1.4.13 Dismissible exists to spare.

## Attribute tuple
- **content-domain**: online banking / fintech dashboard
- **UI-component/pattern**: icon-button info tooltip (APG tooltip pattern)
- **host-language construct**: `<button>` + adjacent-sibling CSS `:focus + .tip` / `:hover + .tip`
- **locale/i18n**: en-US
- **failure-mechanism**: no dismiss mechanism at all (Dismissible Method 2 absent)

## Developer persona
A front-end developer on the payments team shipped the tooltip the "pure CSS" way —
`.info-btn:focus + .tip { display:block }` — because it avoided JavaScript and "passed the
keyboard test" (the tip shows on focus). They never wired an Escape handler because the
ticket only said "tooltip must be keyboard-reachable," and QA's automated scan came back
clean. The `click` handler was added later to "keep focus tidy" and ironically just
re-asserts the tooltip.

## Element / selector carrying the issue
- FAIL: `button#limitInfo` / its tooltip `#limitTip` — the tip obscures `.helptext` and
  the Continue button, and nothing dismisses it from the keyboard while focus stays on the
  button.

## Exact accessibility mechanism
A low-vision user at 300% magnification focuses the "i" button to read the limit policy.
The tooltip pops up and covers the "$7,500.00 remaining" sentence and the Continue button.
To read what's underneath or to proceed, the SC says they should be able to press Escape
and clear the tip **while keeping focus on the trigger**. Here, pressing Escape does
nothing (no listener); pressing Enter/Space (activating the trigger) does nothing useful;
so their only recourse is to move focus off the button — which both loses their place and,
for a magnifier user panning by focus, defeats the entire low-vision workaround the
Dismissible condition was written for. A screen-reader user is unaffected because the tip
is announced via `aria-describedby` and is not obscuring *audio*; this is a purely visual /
keyboard-operation failure.

## Expected ACT-style outcome
**failed** — additional content appears on focus, obscures other content (so Method 1 is
not satisfied), and there is no mechanism to dismiss it without moving focus (Method 2
absent).

## Why automated tools miss it
axe-core, WAVE and Lighthouse have no rule that exercises focus/hover interaction states,
presses Escape, and checks whether obscuring content clears. They see a `<button>` with a
valid accessible name, a `role="tooltip"` with `aria-describedby` wiring, and well-formed
CSS — every static check is green. Detecting the failure requires a human to focus the
trigger, observe that the tooltip covers real content, press Escape, and judge that nothing
happened *while focus was retained on the trigger*. A static scanner cannot even tell the
tooltip overlaps other content, let alone that no dismissal path exists.

## Citation
> **WCAG 2.2 Understanding 1.4.13 — Dismissible**
> "Alternatively, low vision users who can only navigate via the keyboard do not want the
> small area of their magnified viewport cluttered with hover text. They need a keyboard
> method of dismissing something that is obscuring the current focal area."

> **WCAG Technique SCR39 — Tests, Procedure (content that appears on focus)**
> "The content can be closed without moving the focus way from the trigger. Either by
> pressing Esc, by  pressing another other documented keyboard shortcut, or by activating
> the trigger."
