---
name: grouping-and-reading-order
description: Verify that visually-grouped sets carry list/group semantics, and that the screen-reader reading order matches the visual order. Combines static DOM checks with a virtual-SR cursor walk.
covers: cat_2 (primary)
wcag: 1.3.1 Info and Relationships (A); 1.3.2 Meaningful Sequence (A); 2.4.3 Focus Order (A)
instruments: DOM, AX tree, virtual SR cursor walk (/sr-order), vision
behavioral: partial (reading-order walk needs scripts only if content is JS-rendered)
---

# grouping-and-reading-order

## When to run
Findings about card grids / filter chips / nav clusters that read as a set
visually but are flat `<div>`s; or DOM-order ≠ visual-order; or a modal whose
background still reads.

## Procedure — grouping (1.3.1)
1. **Locate the visual group** (vision: cards/chips that form a set).
2. `--eval "const c=document.querySelector('<container>'); return {tag:c.tagName, role:c.getAttribute('role'), kids:[...c.children].map(x=>x.tagName+'/'+(x.getAttribute('role')||'-')), groupingEls:c.querySelectorAll('ul,ol,[role=list],[role=group],fieldset').length}"`.
   `groupingEls:0` with flat `div` children = **REPRODUCED** (no programmatic set).
   Note: absence of grouping is *not* an axe rule — a clean axe run means nothing here.
3. Confirm via `/ax-node` on the container: `role:none`/`generic`, `inTree:false`
   → the grouping is invisible to AT; SR announces members as ungrouped items.
3b. **`list-style:none` strips the list role in Safari + VoiceOver** (the inverse
   problem: a *correctly* marked-up `<ul>`/`<ol>` that loses its semantics for
   VoiceOver users). Our Chrome AX still reports a list, so detect the *triggering
   condition* statically instead of relying on the AT:
   `--eval "return [...document.querySelectorAll('ul,ol')].filter(l=>getComputedStyle(l).listStyleType==='none'&&!l.getAttribute('role')&&l.querySelector('li')).length"`.
   Count > 0 → those lists *may* drop their role in Safari/VoiceOver. **H5: this is a
   WebKit-specific AT-COMPAT RISK, not a confirmed 1.3.1 conformance failure on a
   Chrome-evaluated page.** Record it as `best-practice / AT-compat` with the WebKit
   caveat — escalate to a 1.3.1 finding ONLY if list semantics are *necessary* for the
   content (a genuine enumeration) AND you've reasoned about actual exposure, not merely
   counted the CSS trigger. Verified trigger present: Klaviyo 67/67, ESPN 111/113.

## Procedure — reading / focus order (1.3.2, 2.4.3)
4. **Visual order**: `--eval` return each member's `getBoundingClientRect().x/y`.
5. **DOM/spoken order**: walk the SR cursor — `/sr-order` gives prev/next spoken
   neighbors; chain it (or a full `vsr.next()` walk) to get the spoken sequence.
6. **Diff**: spoken/DOM order vs visual order. Mismatch (Reacher: "Log In" at DOM
   index 19 but visually rightmost; nav after main content) = **REPRODUCED**.
7. **Modal background (1.3.2)**: if a modal is open (or openable — see
   `focus-management`/`dynamic-announcement`), check background gets `aria-hidden`/
   `inert`. If the modal isn't in the static DOM, mark **PARTIAL**.

## Classify
- **REPRODUCED** — flat non-grouped set, or spoken order diverges from visual order.
- **PARTIAL** — grouping confirmed but the modal/overlay reading needs a live open.
- **NOT REPRODUCED** — proper list/group semantics, order matches.

## Limits
A full reading-order walk on a huge page is time-bounded; anchor near the region
of interest. CSR-rendered grids need a scripted serve to populate.
