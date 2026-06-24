# case-06 — RTL Arabic forum: "رد" (Reply) form appended at the very end of the thread DOM

## Scenario
An Arabic (RTL) developer forum thread (منتدى المطوّرين). Each comment has a "رد" (Reply) button.
Activating Reply on the **first** comment reveals a reply form. But the form's markup is appended at
the **very end of the thread DOM — after every other post and the footer** — by a framework that
renders one shared reply form per thread. The toggle only flips `.open`/`aria-expanded`; no focus
move. This is the **long-tail i18n** variant: it confirms RTL does not change source/tab order, so
the focus defect is identical to LTR.

## Attribute tuple
- **content-domain:** community forum / developer Q&A
- **UI-component/pattern:** inline "Reply" disclosure form attached to a specific comment
- **host-language construct:** `<html dir="rtl" lang="ar">`; framework appends a single reply `<form>` at the end of the thread, toggled by `classList`
- **locale/i18n:** Arabic, RTL
- **failure-mechanism:** F85 open branch — revealed reply form not adjacent to its trigger in the (DOM-determined) navigation order; no focus move

## Developer persona
A developer porting a forum component into an RTL Arabic locale. The upstream framework's `<Reply>`
component appends a singleton form node at the end of the thread and just `.show()`s it under the
targeted comment via CSS. The porter focused entirely on the RTL concerns — `dir="rtl"`, mirrored
borders, Arabic strings — and assumed the framework "handles accessibility." They never realized
that Tab order follows DOM order (not visual/reading direction), so the end-of-thread form is the
last tab stop regardless of RTL.

## Element / selector carrying the issue
`#replyBtn1` (the "رد" button on the first comment) and `#replyForm1` (the reply `<form>` appended
after `<footer>`). The defect is the DOM distance between the per-comment Reply trigger and the shared
end-of-thread form, with no focus move on open.

## Exact accessibility mechanism (what AT experiences, why it fails)
A keyboard or screen-reader user navigating the first comment activates "رد". The reply form appears
directly beneath that comment, clearly the intended next interaction. But focus stays on the "رد"
button (no `.focus()` on the textarea), and the form is the last node in the DOM. Per F85 step 1:
focus is not set into the form, **and** moving forward once does not enter it — the next Tab goes to
"إعجاب" (Like) on the same post, then through every other comment's actions and the footer, before
finally reaching the textarea. Importantly, RTL does not rescue this: `dir="rtl"` mirrors the visual
layout but the sequential focus order still follows source order, so the end-of-DOM form is dead last.
Both step-1 checks are false; the failure applies.

## Expected ACT-style outcome
**failed**

## Why automated tools miss it
The page is well-formed and even careful: correct `lang="ar"`/`dir="rtl"`, the form has an `aria-label`
naming whose comment it replies to, the textarea has an associated `<label for>`, and `aria-expanded`
updates. axe/WAVE/Lighthouse pass. A tool might even be reassured by the RTL correctness. The failure
is the open-then-Tab behavior plus the trigger-to-form DOM distance — runtime and structural, not a
static attribute defect. Static tools also commonly conflate `dir="rtl"` with reversed tab order;
here a human must know that Tab follows DOM order and then actually open the form and observe focus
land elsewhere. None of that is in a single-snapshot DOM scan.

## Citation
> **WCAG Technique F85, Tests — Procedure, step 1:**
> "Activate the trigger control via the keyboard. — Check whether focus has been set to the menu, dialog, or a logical focusable descendent of the widget. — If not, check whether moving the focus forward once in the sequential navigation order puts focus in the menu or dialog."

(Verbatim from `wcag-techniques/failures/F85.html`. On activating "رد", focus is not set into the
form and the next Tab does not enter it — both checks false.)

> **WCAG 2.2 Understanding Focus Order, Intent:**
> "The way that sequential navigation order is determined in web content is defined by the technology of the content. For example, simple HTML defines sequential navigation via the notion of tabbing order. … If no scripting or `tabindex` attributes are used, the navigation order is the order that components appear in the content stream."

(Verbatim from `wcag-understanding/focus-order.html`. The content-stream order — not the RTL visual
order — governs tabbing, so the end-of-thread reply form is last in the navigation sequence.)
