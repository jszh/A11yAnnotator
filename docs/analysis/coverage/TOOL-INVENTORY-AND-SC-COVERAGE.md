# Tool inventory and success criterion coverage

This file lists, for every rubric the agent can run, which success criterion and which ACT rules it relates to, which automatic checks prepare its evidence, and which live inspection actions the agent may call while it decides.

A rubric is a short set of instructions for judging one narrow question about one success criterion. The system first runs fast automatic checks across the whole page. When those checks cannot settle a question on their own, the matching rubric is handed to the agent, which may then call live inspection actions to gather more evidence before deciding.

Two kinds of tool appear below:

* **Scan.** Automatic checks that run first and prepare the evidence. This includes the page wide collectors, the two borrowed checkers, and the targeted probes that fire on a suspected problem. All of these are grouped as scan.
* **Agentic.** Live inspection actions the agent itself chooses to call while it is reasoning, once a rubric is in front of it.

The system authored **35 rubrics** covering **28 success criteria**. Of these, **22 rubrics across 20 success criteria** relate to a criterion that has at least one ACT rule in the study set of 50 rules; the remaining rubrics cover criteria that have no ACT rule in the set and are therefore judged by the agent alone.

---

## Table 1. Success criterion and ACT rule mapped to rubric, with the tools each rubric uses

Each row is one rubric. The scan column shows the automatic checks that prepare evidence for that criterion; the agentic column shows the live actions the agent may call.

| Success criterion | ACT rules in the set | Rubric | Scan checks that prepare evidence | Agentic actions available |
|---|---|---|---|---|
| 1.1.1 | 23a2a8, 59796f, 7d6734, 8fc3b6, e88epe, qt1vmo | alt text adequacy | Axe automatic checker, Look alike character finder, Picture of text probe | Accessibility node inspector, High magnification crop, Image text reader, Image region colour comparer |
| 1.1.1 | same as above | long description completeness | Axe automatic checker, Long description presence probe | Accessibility node inspector, High magnification crop, Image text reader, Image region colour comparer |
| 1.1.1 | same as above | decorative image verification | Axe automatic checker, Picture of text probe | Accessibility node inspector, High magnification crop, Image text reader, Image region colour comparer |
| 1.1.1 | same as above | captcha alternative | Axe automatic checker | High magnification crop, Image text reader, Image region colour comparer |
| 1.2.2 | none in the set | media alternatives | none in the harness | none |
| 1.3.1 | a25f45, bc4a75, d0f69e, ff89c9 | information and relationships | Axe automatic checker, List markup collector, Table markup collector | Accessibility node inspector, Whole page screenshot |
| 1.3.1 | same as above | field programmatic association | Axe automatic checker, List markup collector, Table markup collector | Accessibility node inspector, Whole page screenshot |
| 1.3.2 | none in the set | sequence meaning | Screen reader transcript recorder, Reading order comparison, Reading order map builder, Visual order comparison | Whole page screenshot |
| 1.3.3 | 9bd38c | sensory characteristics | IBM automatic checker | Whole page screenshot |
| 1.4.1 | none in the set | use of colour | Axe automatic checker, IBM automatic checker | Interaction sequence driver, State screenshot capture, Vision condition renderer, Two colour contrast calculator, Rendered pixel colour reader |
| 1.4.3 | afw4f7 | contrast over complex backdrop | Solid background contrast probe | Interaction sequence driver, State screenshot capture, Two colour contrast calculator, Text over image contrast measurer, Rendered pixel colour reader |
| 1.4.5 | 0va7u6 | images of text | none in the harness | Interaction sequence driver, High magnification crop, Image text reader |
| 1.4.10 | none in the set | reflow without sideways scrolling | Sideways scrolling probe | Layout and size measurer |
| 1.4.11 | none in the set | non text contrast | Non text contrast probe | Interaction sequence driver, State screenshot capture, Two colour contrast calculator, Rendered pixel colour reader |
| 1.4.13 | none in the set | hover content | Hover content behaviour probe | Interaction sequence driver, State screenshot capture, Layout and size measurer |
| 2.1.2 | 80af7b | keyboard trap | Keyboard travel recorder, Keyboard trap escape probe, Arrow key trap probe | Single activation observer, Interaction sequence driver |
| 2.2.2 | efbfc7 | motion control | Moving content pause probe | none |
| 2.4.2 | 2779a5, c4a8a4 | page title | Axe automatic checker | Whole page screenshot |
| 2.4.3 | none in the set | focus order meaning | Keyboard travel recorder, Screen reader transcript recorder, Reading order map builder, Visual order comparison, Forced tab order probe | State screenshot capture, Whole page screenshot |
| 2.4.4 | 5effbb, c487ae, fd3a94 | link purpose | Axe automatic checker | Accessibility node inspector, Link destination follower |
| 2.4.4 | same as above | link name equivalence | Axe automatic checker | Accessibility node inspector, Link destination follower |
| 2.4.6 | b49b2e, cc0f0a | heading descriptive | none in the harness | Accessibility node inspector, Whole page screenshot |
| 2.4.7 | oj04fd | focus visible and clear | Focus indicator probe | State screenshot capture |
| 2.4.10 | 047fe0 | section headings | none in the harness | Whole page screenshot |
| 2.4.11 | none in the set | focus not obscured | Covered focus probe | State screenshot capture, Layout and size measurer |
| 2.5.3 | 2ee8b8 | label inside name | IBM automatic checker, Visible label inside name probe | Accessibility node inspector |
| 2.5.5 | none in the set | target size enhanced | none in the harness | Layout and size measurer |
| 2.5.8 | none in the set | target size minimum | none in the harness | Layout and size measurer |
| 3.3.1 | 36b590 | error identification | Form error visibility probe | Single activation observer, Screen reader announcement capture, Interaction sequence driver |
| 3.3.2 | none in the set | field label | Form field label probe | Interaction sequence driver |
| 3.3.3 | none in the set | error suggestion | none in the harness | Interaction sequence driver |
| 4.1.2 | 2t702h, 307n5z, 4b1c6c, 4e8ab6, 59796f, 5c01ea, 674b10, 6cfa84, 97a4e1, c487ae, cae760, e086e5, kb1m8s, m6b1q3 | accessible name adequacy | Axe automatic checker, Name and state probe, Grouped field probe | Accessibility node inspector, Embedded frame content comparer |
| 4.1.2 | same as above | duplicate name equivalence | Axe automatic checker, Name and state probe, Grouped field probe | Accessibility node inspector, Embedded frame content comparer |
| 4.1.2 | same as above | automatic update notification | Axe automatic checker, Name and state probe, Grouped field probe | Accessibility node inspector, Single activation observer, Screen reader announcement capture, Embedded frame content comparer |
| 4.1.3 | none in the set | status message | Live status region finder | Accessibility node inspector, Single activation observer, Screen reader announcement capture |

Notes:

* A cell reading "none in the harness" means no automatic check prepares evidence for that criterion, so the rubric is decided by the agent from the page and its own inspection actions.
* A cell reading "none" in the agentic column means the rubric decides from the page and the prepared evidence only, without calling a live action.
* The ACT rule identifiers are the short official codes. Two rules appear under more than one criterion because they carry more than one conformance mapping: the image button rule 59796f under 1.1.1 and 4.1.2, and the link name rule c487ae under 2.4.4 and 4.1.2.

---

## Table 2. Every tool used by the rubrics, with what it does

| Tool | Kind | What it does |
|---|---|---|
| Axe automatic checker | scan | A widely used automatic accessibility checker whose findings on names, structure, roles, and titles are read as supporting evidence. |
| IBM automatic checker | scan | A second automatic accessibility checker used as a supporting signal on text spacing, visible labels, and a small number of other criteria. |
| Look alike character finder | scan | Finds characters that look like ordinary letters but are actually different symbols. |
| List markup collector | scan | Gathers how list content is marked up on the page. |
| Table markup collector | scan | Gathers how table rows, columns, and header cells are wired together. |
| Screen reader transcript recorder | scan | Records the full reading a screen reader would produce for the page. |
| Reading order comparison | scan | Compares the order a screen reader reads the page against the order it appears visually and flags mismatches. |
| Reading order map builder | scan | Builds a map of the sequence in which the page content is read. |
| Visual order comparison | scan | Compares the on screen visual order of content against the order stored in the page. |
| Keyboard travel recorder | scan | Moves through the page with the keyboard to record the tab order, any places where focus gets stuck, and whether focus stays where expected. |
| Live status region finder | scan | Finds regions that are meant to announce updates such as live status messages. |
| Solid background contrast probe | scan | Measures the contrast of text when it sits over a single solid background colour. |
| Text over image contrast measurer | agentic | Measures the worst contrast underneath every letter when text sits over a picture or a colour blend. |
| Non text contrast probe | scan | Measures the contrast of meaningful parts that are not text, such as borders and icons. |
| Picture of text probe | scan | Checks whether a small image is in fact rendering words rather than a picture. |
| Long description presence probe | scan | Checks whether a complex image offers a longer description somewhere. |
| Form field label probe | scan | Checks whether a form field has a usable label or instruction. |
| Form error visibility probe | scan | Submits a form with bad input and checks whether an error is actually shown to the reader. |
| Name and state probe | scan | Checks an element's spoken name and its required on or off states. |
| Grouped field probe | scan | Checks whether fields that belong together, such as a split phone number, are grouped as one. |
| Hover content behaviour probe | scan | Checks whether content that appears on hover can be reached, can be dismissed, and stays in place. |
| Sideways scrolling probe | scan | Checks whether the page forces sideways scrolling when the window is narrowed. |
| Covered focus probe | scan | Checks whether the element that has focus gets hidden behind something else. |
| Forced tab order probe | scan | Finds forced tab order values that disturb the natural reading order. |
| Focus indicator probe | scan | Checks whether a visible focus marker appears when the keyboard moves to an element. |
| Keyboard trap escape probe | scan | Tries documented ways to move focus out of a place where it appears to be stuck. |
| Arrow key trap probe | scan | Drives the arrow keys inside a composite control to see whether focus can leave it. |
| Visible label inside name probe | scan | Checks whether the words a reader sees on a control are contained in the name a screen reader speaks. |
| Moving content pause probe | scan | Checks whether content that moves or updates on its own can be paused, stopped, or hidden. |
| Accessibility node inspector | agentic | Reads a chosen element's computed screen reader role, where its name comes from, its required states, and, for a table cell, the header text tied to it. |
| Single activation observer | agentic | Activates one control and reports what text newly appears, whether it lands in a region that announces updates, and whether focus moves. |
| Screen reader announcement capture | agentic | After a control is activated, captures the exact words a screen reader would speak. |
| Interaction sequence driver | agentic | Performs a short sequence of real actions such as typing, clicking, hovering, dragging, or pressing keys on a fresh copy of the page and reports what changed. |
| State screenshot capture | agentic | Forces an element into a state such as focus, hover, checked, or open and returns before and after pictures together with the style change. |
| Layout and size measurer | agentic | Reports an element's size and position, any sideways overflow and its cause, what overlaps it, and the gap between two elements. |
| High magnification crop | agentic | Renders a small element again at higher magnification so faint text or a tiny mark becomes readable. |
| Image text reader | agentic | Reads text that is baked into an image so it can be compared against the written description. |
| Image region colour comparer | agentic | Checks whether two named parts of an image are noticeably different in colour. |
| Vision condition renderer | agentic | Renders the page again in greyscale, in colour blindness conditions, or in forced colour modes to see whether a colour cue survives. |
| Two colour contrast calculator | agentic | Computes the exact contrast between two solid colours, such as text against its background. |
| Rendered pixel colour reader | agentic | Reads the true rendered colour of a small part or of the exact background beneath letters. |
| Link destination follower | agentic | Follows a link to where it actually lands after any redirect and compares the real destinations of links that share a name. |
| Embedded frame content comparer | agentic | Opens two embedded frames that share a name and compares what each one actually contains. |
| Whole page screenshot | agentic | Captures the whole page beyond the visible area to confirm where an element such as a heading sits. |

---

## Traceability

The agentic actions and their criterion mappings come from `scripts/v3/lib/cdp-tool-catalog.js`. The targeted probes come from the experiment catalog in `scripts/v3/lib/catalog.js`. The page wide collectors and the two borrowed checkers come from the scan stage of `scripts/eval-page.js` and the checker adapters. The rubrics themselves live in `scripts/v3/llm-rubrics/`.
