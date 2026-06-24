# case-03 — Toolbar: three identically-dimmed chips, only one operable

## Scenario
A wiki rich-text editor (Trellis). The toolbar uses text+icon "chips" so each control has a
**visible text label**, which 1.4.3 governs. Three chips render in one shared dim style
(`#8d8d8d` on `#f2f2f2` ≈ 3.0:1; the label is normal 13px bold text, so the 4.5:1 threshold
applies and 3.0:1 fails): **Strikethrough**, **Subscript**, and **Insert table**. The
first two carry `aria-disabled="true"` and their click handler is guarded — they are genuinely
inert. **Insert table** looks identical but has **no** `aria-disabled` and a live handler that
really inserts a 2×2 table. Identical pixels; three controls; the exemption applies to two and
NOT to the third.

## Attribute tuple
- **Content domain:** Knowledge base / wiki — note composer
- **UI component / pattern:** APG `role="toolbar"` of labeled icon chips with a mixed disabled/enabled group
- **Host-language construct:** native `<button>` with `aria-disabled` (some) and a JS guard keyed on `aria-disabled`
- **Locale / i18n:** en
- **Failure mechanism:** identical disabled-styling spread across controls of differing operability, so one operable chip's sub-4.5:1 label is wrongly treated as exempt by association

## Developer persona
A dev disabled Strikethrough and Subscript for "plain-text notes" by adding `aria-disabled` and
a `.muted` class, then guarded the handler with `if (aria-disabled) return;`. Later, "Insert
table" was added by copy-pasting an existing muted chip's markup for the resting style, but the
dev forgot it should be active — they removed the `aria-disabled` (so it would fire) yet left the
`.muted` color. Result: an operable control wearing the disabled palette.

## Element / selector carrying the issue
`#tableBtn.chip.muted` ("Insert table") — operable, in scope, ≈3.0:1 label. The exempt twins are
`.chip.muted[aria-disabled="true"]` (Strikethrough, Subscript).

## Exact accessibility mechanism
AT announces "Strikethrough, dimmed" and "Subscript, dimmed" (correctly inert — exempt) but
"Insert table, button" with **no** disabled state. A low-vision user sees three equally faint
labels and reasonably treats all three as off; in fact one is the live table tool. For 1.4.3,
the two `aria-disabled` chips are not available for interaction (handler returns early) and are
exempt; "Insert table" IS available (handler runs, table appears) so its label must reach 4.5:1.
At ≈3.0:1 (below the 4.5:1 normal-text threshold) it fails. The verdict for the trio cannot be
made from color — it requires activating
each chip to see which one does something.

## Expected ACT-style outcome
**failed** (SC 1.4.3). One operable toolbar chip carries sub-4.5:1 label text; the two truly-inert
chips beside it are correctly exempt.

## Why automated tools miss it
All three chips share the same computed colors and the same `.muted` class. A scanner that
respects `aria-disabled` will skip Strikethrough and Subscript and frequently skips "Insert
table" too — either by clustering identical-style siblings, or by treating an `aria-disabled`
neighborhood in a toolbar as a disabled group. No tool determines that exactly one of three
visually identical chips fires; that requires driving each control. The role and name are valid
on all three, so nothing else trips a linter.

## Citation
**Reference:** WCAG 2.2 Understanding Contrast (Minimum) (`wcag-understanding/contrast-minimum.html`)
> "User Interface Components that are not available for user interaction (e.g., a disabled control in HTML) are not required to meet contrast requirements."

**Reference:** Trusted Tester v5.1.3 — SC 1.4.3 (`refs/trusted-tester/sc-1.4.3-contrast-minimum.md`)
> "EXCLUDE text that is: ... For inactive (disabled) user interface components"
