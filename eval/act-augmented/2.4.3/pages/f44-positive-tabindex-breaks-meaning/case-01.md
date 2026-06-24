# case-01 — Course outline ordered list tabs through the modules backwards

## Scenario
A self-paced course landing page presents its "Course outline" as an ordered list:
**Start here**, then **Module 1 · Arrays & linked lists**, **Module 2 · Stacks & queues**,
**Module 3 · Trees & heaps**, **Module 4 · Hash tables & graphs**. The lede explicitly tells
the learner the modules build on each other and must be done in order. The five links carry
explicit positive `tabindex` values `1, 5, 4, 3, 2`, so pressing Tab visits **Start here →
Module 4 → Module 3 → Module 2 → Module 1**. The numeric tab order reverses the modules
against the visible, content-meaningful sequence. This is the canonical F44 reversed-list
pattern transplanted into a real LMS course page.

## Attribute tuple
- **content-domain:** higher-ed LMS / self-paced course page
- **UI-component / pattern:** ordered-list table of contents (navigation)
- **host-language construct:** `tabindex="1|5|4|3|2"` on `<a>` inside `<ol>`
- **locale / i18n:** en-US
- **failure-mechanism:** positive tabindex imposes a numeric order that reverses the content sequence (F44 reversed-list)

## Developer persona
A junior front-end dev was told "make the 'Start here' link the very first thing keyboard
users reach." They added `tabindex="1"` to it, then — copying a Stack Overflow answer that
said "give each link a tabindex so the order is explicit" — pasted `tabindex` onto the rest.
They typed the values bottom-up while looking at the rendered list (last visible item got the
low number 2), never noticing the resulting traversal runs the modules in reverse. The visual
layout still looks perfect, so it shipped.

## Element / selector carrying the issue
- `nav.toc ol.modules a` — five links with `tabindex` `1, 5, 4, 3, 2` (in DOM/visual order
  Start, M1, M2, M3, M4).
- Resulting focus traversal: `start.html` (1) → `module-4.html` (2) → `module-3.html` (3) →
  `module-2.html` (4) → `module-1.html` (5).

## Exact accessibility mechanism (what AT experiences)
A sighted keyboard user sees the modules listed 1→4 top-to-bottom and expects Tab to walk
them in that study order. Instead, after "Start here" the focus ring jumps to the bottom
(Module 4, the capstone that "assumes all prior modules") and climbs upward to Module 1.
A screen-reader user driving by Tab hears the modules announced in reverse, contradicting
both the visible numbering and the page's own instruction to do them in order; they cannot
form a correct mental model of the sequence. Operation is impeded because following focus —
the natural way to "go to the next module" — leads to the wrong, later module. This fails
2.4.3: the focus order does not preserve the meaning of the content.

## Expected ACT-style outcome
**failed** — F44 failure of SC 2.4.3 (positive tabindex creating a tab order that does not
follow content sequence/relationships).

## Why automated tools miss it
axe-core's `tabindex` rule is a *best-practice* check for the mere PRESENCE of a positive
tabindex; it returns a needs-review/best-practice note, not a 2.4.3 failure, and it fires
identically on a correctly-ordered positive tabindex (see case-03/04 passers) and on this
reversed one. No automated tool reads the visible module labels, infers the intended study
sequence, and compares it to the actual `1→5→4→3→2` traversal. Deciding that the order is
*reversed relative to meaning* — rather than merely "present" — is a reading-comprehension
and visual-sequence judgment only a human or reasoning model can make.

## Citation
**Reference:** WCAG Technique F44 — *Failure of Success Criterion 2.4.3 due to using tabindex
to create a tab order that does not preserve meaning and operability*
(`wcag-techniques/failures/F44.html`).

> "Focusable elements like links and form elements have a tabindex attribute. The elements
> receive focus in ascending order of the value of the tabindex attribute. When the values of
> the tabindex attribute are assigned in a different order than the relationships and sequences
> in the content, the tab order no longer follows the relationships and sequences in the
> content."

**Supporting reference:** WCAG Understanding Focus Order (`wcag-understanding/focus-order.html`).

> "Focusable components need to receive focus in an order that preserves meaning and
> operability."
