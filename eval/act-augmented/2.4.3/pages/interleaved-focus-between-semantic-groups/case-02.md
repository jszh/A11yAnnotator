# case-02 — Contact form: "How did you hear about us?" checkboxes spliced into Name/Email/Message

## Scenario
"Riverbend Animal Rescue" contact page. Visually there is a contact-message column on the
left — **Your name**, **Email address**, **Message** — and, on the right, a tidy stack of
checkboxes under the heading **"How did you hear about us?"** (Instagram, From a friend,
Web search, Event or flyer). Two clearly different questions, two clearly different visual
groups. But in the DOM the marketing checkboxes are **spliced between** the contact fields,
so with no `tabindex` the source-order tab sequence is:
Name → *Instagram* → Email → *From a friend* → Message → *Web search* → *Event or flyer* →
Send. This is the Understanding document's own failing example ("focus moves from the name
field to a checkbox, then to the street address, then to another checkbox"), recast as a
contact form.

## Attribute tuple
- **content-domain:** nonprofit / animal-rescue contact form
- **UI-component / pattern:** text-input message group + a checkbox group ("how did you hear")
- **host-language construct:** one CSS-grid form; checkbox `<div>`s emitted between the
  text-field `<div>`s in source order, repositioned into a right-hand column via grid-area; no `tabindex`
- **locale / i18n:** en-US
- **failure-mechanism:** a second semantic group (marketing checkboxes) interleaved INTO the
  middle of the first group (contact message) — the canonical Understanding failure

## Developer persona
A volunteer maintaining the site in a block-based CMS wanted the "How did you hear about
us?" checkboxes to appear in the empty space beside the message box, so it didn't push the
Submit button down. Working in the visual editor, they dropped each checkbox block into the
canvas *as they thought of each option*, interleaving them with the contact blocks in the
underlying block list. The editor positioned everything correctly on screen via the grid,
so it looked balanced and the volunteer shipped it — never tabbing through to notice that
focus now bounces between the message and the marketing question.

## Element / selector carrying the issue
The `<form>`'s flat child order. The offending interlopers are `#h-ig`, `#h-friend`,
`#h-search`, `#h-event` (the marketing checkboxes), which in DOM/tab order fall **between**
`#c-name`, `#c-email`, and `#c-msg`. Primary selector to inspect: `#h-ig` — the Instagram
checkbox that receives focus immediately after the Name field, before Email.

## Exact accessibility mechanism (what AT experiences, why it fails)
- **Sighted mouse user:** clicks Name, Email, Message down the left column, then ticks
  whichever checkboxes apply on the right. No problem perceived.
- **Keyboard / screen-reader user:** Tab 1 → Name. Tab 2 → **Instagram checkbox** (focus
  leaps to the far-right column, mid-thought). Tab 3 → Email. Tab 4 → **From a friend
  checkbox**. Tab 5 → Message. The user is composing a message about adopting a dog and is
  repeatedly interrupted to answer an unrelated marketing question one checkbox at a time,
  then thrown back to the next message field. The two questions are woven together so the
  user cannot complete either group as a unit — meaning and flow are broken.
- **Verified with Puppeteer** (real Tab key presses): the focused element's visual
  x-coordinate alternates `84 (left column) → 587 (right column) → 84 → 587 → 84 → 587 …`,
  confirming focus zig-zags between the contact group and the checkbox group.

## Expected ACT-style outcome
**failed** (SC 2.4.3 — focus order interleaves two distinct sections; the sequence does not
preserve the meaning/grouping of the contact message vs. the marketing question).

## Why automated tools miss it
No `tabindex` exists to flag; every text field and checkbox has a correct `<label for>` and
is operable; the group heading is a real visible element; contrast is fine. axe/WAVE/
Lighthouse therefore pass the page. They cannot tell that "Email" and "Message" belong with
"Name" while the checkboxes are a *separate* question — that is content meaning. Detecting
that the checkbox group has been interleaved into the contact group, rather than placed
after it, requires a human reading the two questions and knowing they should be answered as
two coherent blocks, not woven together.

## Citation
> "A company's website includes a form that collects marketing data and allows users to
> subscribe to several newsletters published by the company. … Another section of the form
> includes several checkboxes so that users can indicate newsletters they want to receive.
> However, the tab order for the form skips between fields in different sections of the
> form, so that focus moves from the name field to a checkbox, then to the street address,
> then to another checkbox."
— wcag-understanding/focus-order.html (Examples of Focus Order — the failing example)

> "Focusable components need to receive focus in an order that preserves meaning and
> operability."
— wcag-understanding/focus-order.html (Intent of Focus Order — "For clarity" list)
