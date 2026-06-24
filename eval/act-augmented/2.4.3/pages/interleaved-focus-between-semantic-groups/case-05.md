# case-05 — RTL Arabic event registration: Attendee 1 and Attendee 2 fields interleaved

## Scenario
An Arabic-language (`lang="ar" dir="rtl"`) registration for "مؤتمر الابتكار التقني ٢٠٢٦"
(Tech Innovation Conference 2026) collects details for **two attendees** at once:
**الحاضر الأول** (Attendee 1) and **الحاضر الثاني** (Attendee 2). Each is a visually grouped,
headed card with four fields — الاسم الكامل (full name), البريد الإلكتروني (email),
المسمى الوظيفي (job title), التفضيل الغذائي (dietary preference). Because the page is RTL,
Attendee 1's card sits on the **right** (first in reading direction) and Attendee 2's on the
**left**. Every field has a real `<label for>`, correct programmatic name/role, and is
keyboard-operable; there is **no `tabindex`**. But the DOM interleaves the two attendees
field-by-field, so the tab order is attendee1-name, attendee2-name, attendee1-email,
attendee2-email, attendee1-job, attendee2-job, attendee1-diet, attendee2-diet — focus
alternates between the two attendee cards on every Tab.

## Attribute tuple
- **content-domain:** events / conference ticketing & registration
- **UI-component / pattern:** multi-attendee registration, two grouped attendee cards
- **host-language construct:** `dir="rtl"` document; one CSS-grid form with `grid-template-areas`;
  fields emitted in interleaved DOM order, routed to the correct attendee card by named areas; no `tabindex`
- **locale / i18n:** Arabic (ar), RTL — adds a "which order even counts as logical" layer
- **failure-mechanism:** two semantic groups (two attendees) interleaved by raw DOM order in
  an RTL context where the expected logical order is right-to-left

## Developer persona
A developer localised an existing English two-attendee form into Arabic by flipping the
document to `dir="rtl"` and translating the labels. The original English markup had already
been authored *row by row* (name row = attendee-1 name then attendee-2 name, email row =
attendee-1 email then attendee-2 email…) and laid out with a grid. After RTL-flipping, the
cards correctly swapped sides (Attendee 1 to the right), so it looked properly localised —
and the dev, testing only by clicking with a mouse, never noticed that the inherited
interleaved source order still drives a zig-zagging keyboard focus.

## Element / selector carrying the issue
The interleaved field sequence inside `form[aria-label="تسجيل حاضرين"]`. The clearest
interloper is `#a2-name` (Attendee 2 → full name), which in DOM/tab order receives focus
**immediately after** `#a1-name` (Attendee 1 → full name) and **before** `#a1-mail`
(Attendee 1 → email). Primary selector to inspect: `#a2-name`.

## Exact accessibility mechanism (what AT experiences, why it fails)
- **Sighted mouse user:** fills the right card (Attendee 1) top-to-bottom, then the left
  card (Attendee 2). Fine.
- **Keyboard / screen-reader user (Arabic):** Tab 1 → Attendee 1 *name* (right card). Tab 2
  → Attendee 2 *name* (focus jumps to the left card). Tab 3 → Attendee 1 *email* (back to the
  right card). The registrant enters the first person's name, is thrown to the *second*
  person's name, then back to the first person's email — the "I'm registering attendee 1"
  model collapses immediately, and it is easy to put attendee 2's email under attendee 1.
- **RTL nuance:** a naive evaluator/tool that assumed left-to-right tab order would even
  misjudge which sequence is "logical" here; the correct logical order is right card complete
  (Attendee 1) then left card (Attendee 2). The page does neither — it alternates — so it
  fails regardless of direction.
- **Verified with Puppeteer** (real Tab key presses): the focused element's x-coordinate
  alternates `535 (right/Attendee-1 card) → 94 (left/Attendee-2 card) → 535 → 94 → …` across
  all eight fields, confirming focus zig-zags between the two attendee groups.

## Expected ACT-style outcome
**failed** (SC 2.4.3 — focus order interleaves the two attendee groups; the sequence does not
preserve the meaning of "one attendee, then the next").

## Why automated tools miss it
`lang`/`dir` are correct, every input/select has a correct `<label for>`, both cards have
visible headings, there is no `tabindex`, and contrast passes — so axe/WAVE/Lighthouse
report a clean, well-localised form. They have no model that email/job/diet belong with the
*same attendee's* name; nor do they reason about RTL logical order. Detecting that Attendee
2's fields are woven into Attendee 1's group — and that this breaks the per-attendee meaning
— requires reading the Arabic content, grouping each attendee, and judging the focus order
against that grouping.

## Citation
> "For example, a screen reader user interacts with the programmatically determined reading
> order, while a sighted keyboard user interacts with the visual presentation of the web
> page. Care should be taken so that the focus order makes sense to both of these sets of
> users and does not appear to either of them to jump around randomly."
— wcag-understanding/focus-order.html (Intent of Focus Order)

> "When the source order does not match the visual order, the tab order through the content
> must reflect the logical relationships in the content that are displayed visually."
— wcag-techniques/general/G59.html (Description)
