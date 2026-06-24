# case-03 — Recipe "cook mode": real "Start timer" `<button>` nested inside a focusable static step badge (timer focused twice per step)

## Scenario
A recipe site's "cook mode" view (Hearthline — slow-braised short ribs). Each numbered step
is a card. The step's coloured "badge" (number + step name + a "Start timer" button +
sub-caption) was made into a single focusable static element (`span.badge.focusable[tabindex="0"]`)
so a "mark this step done" coachmark could pop on focus. But the step's **real** "Start timer"
`<button>` is nested INSIDE that same focusable badge. So tabbing through one timed step lands
focus first on the badge span — whose accessible text is its entire content, which already reads
out **"…Start 30 min timer…"** — and then immediately on the `<button>` itself
("Start 30 min timer"). The one timer control is reached twice in a row, once via the wrapper
whose text announces the timer action and once via the button. This repeats for every timed step
(3 in this recipe).

## Attribute tuple
- **content-domain:** food / recipes ("cook mode" step-by-step view)
- **UI-component/pattern:** step card with a per-step "Start timer" action inside a number badge
- **host-language construct:** nested focusables — interactive `<button>` nested inside a focusable static `span[tabindex=0]`
- **locale/i18n:** en
- **failure-mechanism:** confusing double focus stop — a focusable static wrapper whose own text announces the action of the focusable control nested inside it

## Developer persona
A front-end dev built the "cook mode" UI and wanted the whole step badge to be a focus target so
a "tap to mark this step done" coachmark could show on `:focus`; they slapped `tabindex="0"` on
the badge `<span>`. They had previously placed the per-step "Start timer" `<button>` inside that
badge for layout reasons. Mouse-testing looked perfect (one tidy badge block); nobody tabbed the
recipe to notice the badge AND the button it contains are now two stops, with the first stop's
text already speaking the timer action.

## Element / selector carrying the issue
`span.badge.focusable[tabindex="0"]` (each step badge) directly wrapping the step's
`button[type="button"]` ("Start … timer") — both focusable, repeated on each timed step.

## Exact accessibility mechanism (what AT experiences, why it fails)
A keyboard / screen-reader user tabs into a step and focus lands on the badge `<span>`. Because
the span has no role and contains text plus the nested button, its computed accessible text is the
whole badge — Chromium reports the focused span's name as **"2 Sear Start 30 min timer"**. The
user hears the step and the timer action, with apparently nothing to do here (the span is not a
control). They press Tab and land on the **button**, announced **"Start 30 min timer"** — the same
action they just heard. The timer control is effectively reached twice consecutively: once as a
dead wrapper stop that already names it, then as the real button. The user cannot tell whether
they have two ways to start the timer, whether the first stop "did" something, or whether the
button is a duplicate — and the pattern repeats on every timed step, so the recipe reads as if it
has twice as many timer controls as it does. This is precisely the "control appearing to receive
focus multiple times due to the use of nested focusable elements" the Understanding note flags: a
confusing, operation-impeding order, not a harmlessly tedious one.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
Everything is valid: a `<button>` nested in a `<span tabindex="0">` is legal HTML; the span has no
role and is not `aria-hidden`; the button has a non-empty, correctly-spelled accessible name.
axe-core, WAVE, and Lighthouse have no rule for "a focusable static wrapper whose own text already
announces the action of a focusable control nested inside it." Detecting the doubled stop requires
tabbing the page, hearing the badge read out the timer action and then the button repeat it, and
making the semantic judgment that this duplicate/confusing stop impedes operation rather than being
harmlessly tedious — human reasoning the static scanners do not perform. (Verified with the raw
Chromium AX tree + keyboard tab walk: the focused badge span's name is "2 Sear Start 30 min timer"
and the next stop is the `<button>` "Start 30 min timer" — two consecutive stops naming the one
control, three times down the page.)

## Citation
> **WCAG 2.2 Understanding Focus Order, Intent (note):**
> "However, it is a failure of Focus Order if items receive focus in an order that impedes the meaning or operation of content, or creates confusing or illogical focus orders — for example,
>          a control appearing to receive focus multiple times due to the use of nested focusable elements."

(Verbatim from `wcag-understanding/focus-order.html`, the `#intent` note, lines 79–80. This page
reproduces the named failure: an interactive control — the "Start timer" button — appears to receive
focus twice because it is nested inside a focusable static badge whose own text already announces the
timer action.)

> **WCAG 2.2 Understanding Focus Order, "For clarity" list:**
> "Static/non-interactive elements can receive focus, as long as they don't
>             impede operation of the content, or result in confusing or illogical focus order."

(Verbatim from `wcag-understanding/focus-order.html`, lines 100–101. Here the focusable static
badge DOES result in a confusing focus order — it duplicates the nested timer control's stop — so
the permission does not apply and the page fails.)
