# case-02 — Auto-injector emergency steps: order-critical procedure coded as `<ul>`

## Scenario
A medication instruction card for an "AllerStop" epinephrine auto-injector lists six administration steps, visually numbered 1–6, with a banner warning that the steps must be followed *in order* because a wrong order can deliver the dose into the user's thumb. The steps are coded as an **unordered** list: `<ul class="steps">` with six `<li>` items. The numerals (`1.`–`6.`) exist only as typed `<b>` text inside each `<li>`. Because sequence is essential, the correct type is `<ol>`, not `<ul>`.

## Attribute tuple
- **content-domain:** healthcare / pharmaceutical safety instructions
- **UI-component / pattern:** ordered procedure / step-by-step instructions where order is safety-critical
- **host-language construct:** `<ul>` with `list-style:none` and hand-typed numerals inside each `<li>`
- **locale / i18n:** en-US
- **failure-mechanism:** correct that it IS a list, but WRONG TYPE — an ordered sequence exposed as unordered (TT 10.D type mismatch)

## Developer persona
A clinical-affairs writer built the card in the corporate CMS using the only "checklist" block the theme offered, which outputs a styled `<ul>`. To make it look numbered for print they typed "1." through "6." at the start of each item. They never realized that an unordered list tells assistive technology the order does not matter — the exact opposite of the safety message.

## Element / selector carrying the issue
`ul.steps` (and its six `li` children).

## Exact accessibility mechanism (what AT experiences, why it fails)
- A sighted user reads "1, 2, 3, 4, 5, 6" and a banner that says order is critical, and understands this is a mandatory sequence.
- A screen reader announces "list, 6 items" and reads each item as "bullet" (unordered). It does **not** announce ordinal positions ("1 of 6", "2 of 6") the way it does for `<ol>`; the only ordinals present are the typed `1.`–`6.` glyphs, which are just inline text and carry no positional semantics.
- An AT user who reorders, skims, or jumps between items has no programmatic signal that the sequence is fixed — the list's *type* misrepresents the relationship. For order-critical medical steps this is a meaningful safety failure.
- Per TT 10.D, an ordered list (sequence matters) must be `ol`; coding it as `ul` is the wrong type → fail.

Verified with Puppeteer: the DOM has 1 `<ul>` and 6 `<li>` (0 `<ol>`); the accessibility tree exposes `list` + six `listitem` roles with **no** ordered/positional semantics, while the screenshot shows a numbered 1–6 sequence.

## Expected ACT-style outcome
**failed** (SC 1.3.1 — a visually ordered, sequence-critical list is programmatically unordered; wrong list type per TT 10.D).

## Why automated tools miss it
A `<ul>` with `<li>` children is structurally valid and passes the only list-adjacent ACT rules (which concern listbox/option owned roles, not present here) and every axe/WAVE/Lighthouse list check. No automated tool reads the warning banner, judges that the content is a sequence where order matters, and concludes the type should be `<ol>` rather than `<ul>`. Distinguishing "ordered vs unordered" from content meaning is human semantic judgment.

## Citation
> "**Ordered** (`ol`) — numbered sequentially / hierarchically (1, 2, 2.a, 2.a.i) where sequence or reference-by-number matters."
— refs/trusted-tester/sc-1.3.1-info-and-relationships.md (Test 10.D — How to Test)

> "**Unordered** (`ul`) — not numbered; sequence/reference not important."
— refs/trusted-tester/sc-1.3.1-info-and-relationships.md (Test 10.D — How to Test)

> "The intent of this success criterion is to ensure that information and relationships that are implied by visual or auditory formatting are preserved when the presentation format changes."
— wcag-understanding/info-and-relationships.html (Intent of Info and Relationships)
